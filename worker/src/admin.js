// Admin-panel operations (owners and admins). Every route here is reached through requireSession(..., { owner: true }).
// Managing admins is reserved for owners.
import { HttpError, nowIso, randomId, cleanText, toInt } from './util.js';
import { getDoc, putDoc } from './catalog.js';
import { GAMES } from './games.js';
import { verifyOrder } from './payments.js';

const SLUG_RE = /^[a-z0-9_]{2,40}$/;

async function log(env, admin, action, targetType, targetId, reason) {
  await env.DB.prepare(
    'INSERT INTO admin_logs (id, action, target_type, target_id, reason, admin_email, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(randomId('alog'), action, targetType, String(targetId || ''), reason, admin.email, nowIso()).run();
}

export async function adminData(env) {
  const [users, logs, payments] = await env.DB.batch([
    env.DB.prepare(
      `SELECT u.id, u.email, u.display_name, u.status, u.role AS admin_role, substr(u.created_at, 1, 10) AS created_at,
              COALESCE(w.balance, 0) AS balance, COALESCE(w.total_purchased, 0) AS total_purchased, COALESCE(w.total_consumed, 0) AS total_consumed
       FROM users u LEFT JOIN wallets w ON w.user_id = u.id ORDER BY u.created_at DESC LIMIT 1000`
    ),
    env.DB.prepare('SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 200'),
    env.DB.prepare('SELECT * FROM payments ORDER BY created_at DESC LIMIT 500')
  ]);
  const [gameContent, overrides] = await Promise.all([getDoc(env, 'game_content'), getDoc(env, 'catQuestionsOverrides')]);
  return {
    ok: true,
    users: users.results || [],
    admin_logs: logs.results || [],
    payments: payments.results || [],
    game_content: gameContent,
    catQuestionsOverrides: overrides
  };
}

// Built-in questions of one Eight category, read from the game file (owner editor only).
export function eightCategoryQuestions(catSlug) {
  const html = GAMES.eight || '';
  const marker = 'id="m8_cat_' + catSlug + '"';
  const pos = html.indexOf(marker);
  if (pos === -1) return [];
  const gt = html.indexOf('>', pos);
  const lt = html.indexOf('</script>', gt);
  if (gt === -1 || lt === -1) return [];
  let arr;
  try { arr = JSON.parse(html.slice(gt + 1, lt).trim()); } catch (e) { return []; }
  return arr.map((q, idx) => ({
    id: q.uid || (catSlug + '_q' + (idx + 1) + '_' + (q.points || 200)),
    game_id: 'game_eight',
    cat: catSlug,
    content_type: 'trivia_question',
    difficulty_points: Number(q.points || (idx < 6 ? 200 : idx < 12 ? 400 : 600)),
    prompt_text: q.q || q.question || '',
    answer_text: q.a || q.answer || '',
    extra_info: q.hint || q.info || '',
    options: q.options || [],
    sort_order: idx + 1,
    is_active: 1
  }));
}

export async function adminAction(env, session, action, payload) {
  const admin = session.user;
  payload = payload && typeof payload === 'object' ? payload : {};

  switch (action) {
    case 'adjust_credit': {
      const delta = toInt(payload.delta, 0);
      const reason = cleanText(payload.reason, 200);
      if (!payload.userId || !delta || !reason) throw new HttpError(400, 'يرجى تحديد المستخدم ومقدار التعديل وسبب العملية الإلزامي.');
      if (Math.abs(delta) > 100000) throw new HttpError(400, 'مقدار التعديل كبير جداً.');
      const target = await env.DB.prepare('SELECT id, email, display_name FROM users WHERE id = ?').bind(payload.userId).first();
      if (!target) throw new HttpError(404, 'المستخدم غير موجود.');
      const updated = await env.DB.prepare(
        `UPDATE wallets SET balance = balance + ?1, total_purchased = total_purchased + CASE WHEN ?1 > 0 THEN ?1 ELSE 0 END
         WHERE user_id = ?2 AND balance + ?1 >= 0 RETURNING balance`
      ).bind(delta, target.id).first();
      if (!updated) throw new HttpError(400, 'لا يمكن خصم رصيد أكبر من رصيد المستخدم الحالي.');
      await env.DB.prepare(
        'INSERT INTO wallet_transactions (id, user_id, type, amount, balance_before, balance_after, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(randomId('wtx'), target.id, delta > 0 ? 'admin_add' : 'admin_deduct', delta, updated.balance - delta, updated.balance,
        'تعديل إداري موثق: ' + reason, nowIso()).run();
      await log(env, admin, delta > 0 ? 'admin_add_credits' : 'admin_deduct_credits', 'wallet', target.email,
        reason + ' (' + (delta > 0 ? '+' : '') + delta + ' قيم)');
      return { ok: true, message: 'تم تحديث رصيد ' + target.display_name + ' وتسجيل العملية في السجل.' };
    }

    case 'reset_trials': {
      const uid = payload.userId || admin.id;
      await env.DB.prepare('DELETE FROM game_trials WHERE user_id = ?').bind(uid).run();
      await log(env, admin, 'admin_reset_free_trials', 'user_trials', uid, 'إعادة تفعيل التجارب المجانية بقرار إداري');
      return { ok: true, message: 'تمت إعادة تفعيل التجارب المجانية للمستخدم المختار.' };
    }

    case 'set_admin': {
      if (admin.role !== 'owner') throw new HttpError(403, 'إضافة الأدمن وإزالته للمالك فقط.');
      const email = String(payload.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) throw new HttpError(400, 'اكتب إيميل صحيح.');
      const makeAdmin = payload.makeAdmin !== false;
      let target = await env.DB.prepare('SELECT id, email, display_name, role FROM users WHERE email = ?').bind(email).first();
      if (target && target.role === 'owner') throw new HttpError(400, 'هذا الحساب مالك أصلاً.');
      if (!target) {
        if (!makeAdmin) throw new HttpError(404, 'ما فيه حساب بهالإيميل.');
        // The account is created now; the person logs in later with the same email and lands as admin.
        target = { id: randomId('usr'), email, display_name: email.split('@')[0], role: 'admin' };
        await env.DB.batch([
          env.DB.prepare("INSERT INTO users (id, email, display_name, status, role, created_at) VALUES (?, ?, ?, 'active', 'admin', ?)").bind(target.id, email, target.display_name, nowIso()),
          env.DB.prepare('INSERT INTO wallets (user_id) VALUES (?)').bind(target.id)
        ]);
      } else {
        await env.DB.batch([
          env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(makeAdmin ? 'admin' : null, target.id),
          // Removing an admin ends their open sessions so access stops immediately.
          ...(makeAdmin ? [] : [env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(target.id)])
        ]);
      }
      await log(env, admin, makeAdmin ? 'grant_admin' : 'revoke_admin', 'user', email, makeAdmin ? 'إضافة أدمن' : 'إزالة أدمن');
      return { ok: true, message: makeAdmin ? 'صار ' + email + ' أدمن. يدخل بنفس الإيميل ويلقى لوحة الإدارة.' : 'تمت إزالة صلاحية الأدمن من ' + email };
    }

    case 'toggle_user': {
      const target = await env.DB.prepare('SELECT id, email, display_name, status, role FROM users WHERE id = ?').bind(payload.userId).first();
      if (!target || target.role === 'owner') throw new HttpError(400, 'لا يمكن إيقاف حساب المالك.');
      if (target.role === 'admin' && admin.role !== 'owner') throw new HttpError(403, 'إيقاف حساب أدمن للمالك فقط.');
      const status = target.status === 'active' ? 'suspended' : 'active';
      await env.DB.batch([
        env.DB.prepare('UPDATE users SET status = ? WHERE id = ?').bind(status, target.id),
        env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(target.id)
      ]);
      await log(env, admin, 'toggle_user_status', 'user', target.email, 'تغيير حالة الحساب إلى ' + status);
      return { ok: true, message: 'تم تحديث حالة حساب ' + target.display_name };
    }

    case 'save_pkg': {
      const name = cleanText(payload.name, 80);
      const credits = toInt(payload.credits, 0);
      const priceHalalas = Math.round(Number(payload.priceSar) * 100);
      const priceSar = Number.isFinite(priceHalalas) ? priceHalalas / 100 : -1;
      if (!name || credits <= 0 || credits > 100000 || priceSar < 0 || priceSar > 100000) throw new HttpError(400, 'بيانات الباقة غير مكتملة.');
      const packages = await getDoc(env, 'packages');
      packages.push({
        id: randomId('pkg'),
        name,
        description: cleanText(payload.description, 300) || ('باقة تحتوي على ' + credits + ' أقيام.'),
        credits,
        price_halalas: priceHalalas,
        currency: 'SAR',
        badge: cleanText(payload.badge, 40),
        is_active: 1,
        sort_order: packages.length + 1
      });
      await putDoc(env, 'packages', packages);
      await log(env, admin, 'save_package', 'package', name, credits + ' أقيام بسعر ' + priceSar + ' ر.س');
      return { ok: true, message: 'تمت إضافة الباقة وحفظها.' };
    }

    case 'toggle_pkg': {
      const packages = await getDoc(env, 'packages');
      const pkg = packages.find((p) => p.id === payload.pkgId);
      if (!pkg) throw new HttpError(404, 'الباقة غير موجودة.');
      pkg.is_active = pkg.is_active ? 0 : 1;
      await putDoc(env, 'packages', packages);
      return { ok: true, message: 'تم تحديث حالة الباقة.' };
    }

    case 'save_game': {
      const title = cleanText(payload.title, 80);
      const slug = String(payload.slug || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
      if (!title || !SLUG_RE.test(slug)) throw new HttpError(400, 'أدخل اسم اللعبة والمعرف النصي (Slug) بحروف إنجليزية صغيرة وأرقام.');
      const cost = Math.max(0, toInt(payload.costCredits, 1));
      const minP = Math.max(1, toInt(payload.minPlayers, 2));
      const maxP = Math.max(minP, toInt(payload.maxPlayers, 20));
      const games = await getDoc(env, 'games');
      const sort = toInt(payload.sortOrder, games.length + 1);
      const rules = cleanText(payload.rules, 200);
      const desc = cleanText(payload.description, 600);
      const existing = games.find((g) => g.slug === slug);
      if (existing) {
        Object.assign(existing, {
          title, description: desc || existing.description, cost_credits: cost,
          min_players: minP, max_players: maxP, sort_order: sort
        });
      } else {
        const engine = String(payload.engineType || 'mystery_button').replace(/[^a-z0-9_]/g, '');
        games.push({
          id: 'game_' + slug, slug, title,
          subtitle: 'من ' + minP + ' إلى ' + maxP + ' لاعباً · ' + (rules || 'تحدي جماعي تفاعلي'),
          description: desc || 'لعبة جماعية تفاعلية مضافة من نظام إدارة الألعاب.',
          engine_type: engine, cost_credits: cost, min_players: minP, max_players: maxP,
          is_enabled: 1, sort_order: sort, active_version: 1, launch_path: '/play/' + slug
        });
      }
      await putDoc(env, 'games', games);
      await log(env, admin, 'save_game', 'game', slug, title);
      return { ok: true, message: 'تم حفظ اللعبة.' };
    }

    case 'toggle_game': {
      const games = await getDoc(env, 'games');
      const game = games.find((g) => g.id === payload.gameId);
      if (!game) throw new HttpError(404, 'اللعبة غير موجودة.');
      game.is_enabled = game.is_enabled ? 0 : 1;
      await putDoc(env, 'games', games);
      await log(env, admin, 'toggle_game', 'game', game.slug, game.is_enabled ? 'إظهار' : 'إخفاء');
      return { ok: true, message: 'تم تحديث حالة ظهور اللعبة في المتجر.' };
    }

    case 'update_game_cost': {
      const games = await getDoc(env, 'games');
      const game = games.find((g) => g.id === payload.gameId);
      if (!game) throw new HttpError(404, 'اللعبة غير موجودة.');
      game.cost_credits = Math.min(1000, Math.max(0, toInt(payload.costCredits, 0)));
      await putDoc(env, 'games', games);
      await log(env, admin, 'update_game_cost', 'game', game.slug, String(game.cost_credits));
      return { ok: true, message: 'تم تحديث تكلفة «' + game.title + '» إلى ' + game.cost_credits + ' قيم.' };
    }

    case 'verify_payment': {
      const r = await verifyOrder(env, String(payload.orderId || ''));
      if (!r.ok) throw new HttpError(r.status || 400, r.error);
      await log(env, admin, 'verify_payment', 'payment', r.order.id, 'الحالة: ' + r.order.status);
      return { ok: true, message: 'حالة الطلب ' + r.order.id + ' في البوابة: ' + r.order.status + (r.changed ? ' (تم التحديث)' : '') };
    }

    case 'add_content':
    case 'edit_content':
    case 'del_content':
    case 'import_content':
      return contentAction(env, admin, action, payload);

    case 'add_cat': {
      const name = cleanText(payload.name, 80);
      if (!name) throw new HttpError(400, 'أدخل اسم الفئة أولاً.');
      const categories = await getDoc(env, 'categories');
      const slug = 'custom_' + Date.now();
      categories.unshift({
        id: 'cat_' + slug, slug, name,
        macro_group: 'الثقافة والمعرفة',
        sub_group: cleanText(payload.group, 40) || 'عام',
        description: cleanText(payload.description, 300) || 'فئة مضافة من لوحة الإدارة',
        icon: cleanText(payload.icon, 8) || '🎯',
        posterTheme: 'country_saudi', sort_order: 1, is_visible: 1, item_count: 18
      });
      await putDoc(env, 'categories', categories);
      return { ok: true, message: 'تمت إضافة الفئة.' };
    }

    case 'toggle_cat': {
      const categories = await getDoc(env, 'categories');
      const cat = categories.find((c) => c.id === payload.catId);
      if (!cat) throw new HttpError(404, 'الفئة غير موجودة.');
      cat.is_visible = cat.is_visible ? 0 : 1;
      await putDoc(env, 'categories', categories);
      return { ok: true, message: 'تم تحديث حالة ظهور الفئة.' };
    }

    default:
      throw new HttpError(400, 'إجراء إداري غير معروف.');
  }
}

function eightItem(it, idx, catSlug) {
  return {
    uid: cleanText(it.uid || it.id || (catSlug + '_imp_' + idx), 80),
    points: toInt(it.points || it.difficulty_points, 200),
    q: cleanText(it.q || it.prompt_text, 1000),
    a: cleanText(it.a || it.answer_text, 500),
    hint: cleanText(it.hint || it.extra_info, 1000)
  };
}

async function contentAction(env, admin, action, payload) {
  const gameId = String(payload.gameId || 'game_qaftah');
  const MAX_ITEMS = 2000;

  if (gameId === 'game_eight') {
    const catSlug = String(payload.catSlug || '').replace(/[^A-Za-z0-9_-]/g, '');
    if (!catSlug) throw new HttpError(400, 'اختر الفئة أولاً.');
    const overrides = await getDoc(env, 'catQuestionsOverrides');
    // The first edit of a category starts from the built-in questions the editor sent along.
    let list = Array.isArray(overrides[catSlug])
      ? overrides[catSlug]
      : (Array.isArray(payload.baseItems) ? payload.baseItems.slice(0, MAX_ITEMS).map((it, i) => eightItem(it, i, catSlug)) : []);

    if (action === 'add_content') {
      list.unshift(eightItem({
        uid: catSlug + '_custom_' + Date.now(), points: payload.points,
        q: payload.promptText, a: payload.answerText, hint: payload.extraInfo
      }, 0, catSlug));
    } else if (action === 'edit_content') {
      list.forEach((q) => {
        if (q.uid === payload.itemId) {
          q.q = cleanText(payload.promptText || q.q, 1000);
          q.a = cleanText(payload.answerText || q.a, 500);
          q.hint = cleanText(payload.extraInfo != null ? payload.extraInfo : q.hint, 1000);
          if (payload.points) q.points = toInt(payload.points, q.points);
        }
      });
    } else if (action === 'del_content') {
      list = list.filter((q) => q.uid !== payload.itemId);
    } else if (action === 'import_content' && Array.isArray(payload.items)) {
      list = payload.items.slice(0, MAX_ITEMS).map((it, i) => eightItem(it, i, catSlug));
    }
    overrides[catSlug] = list.slice(0, MAX_ITEMS);
    await putDoc(env, 'catQuestionsOverrides', overrides);

    const categories = await getDoc(env, 'categories');
    const cat = categories.find((c) => c.slug === catSlug);
    if (cat) {
      cat.item_count = overrides[catSlug].length;
      await putDoc(env, 'categories', categories);
    }
    await log(env, admin, action, 'eight_category', catSlug, overrides[catSlug].length + ' سؤال');
    return { ok: true, message: 'تم حفظ أسئلة الفئة (' + overrides[catSlug].length + ' سؤالاً) وستظهر في تحدي الثمانية لكل اللاعبين.' };
  }

  let content = await getDoc(env, 'game_content');
  if (action === 'add_content') {
    content.unshift({
      id: randomId('custom'), game_id: gameId,
      cat: cleanText(payload.catName, 60) || 'عام',
      content_type: 'custom_prompt',
      difficulty_points: toInt(payload.points, 400),
      prompt_text: cleanText(payload.promptText, 1000),
      answer_text: cleanText(payload.answerText, 500),
      extra_info: cleanText(payload.extraInfo, 1000),
      options: [], sort_order: 1, is_active: 1
    });
  } else if (action === 'edit_content') {
    content.forEach((it) => {
      if (it.id === payload.itemId) {
        it.prompt_text = cleanText(payload.promptText || it.prompt_text, 1000);
        it.answer_text = cleanText(payload.answerText || it.answer_text, 500);
        it.extra_info = cleanText(payload.extraInfo != null ? payload.extraInfo : it.extra_info, 1000);
        if (payload.points) it.difficulty_points = toInt(payload.points, it.difficulty_points);
      }
    });
  } else if (action === 'del_content') {
    content = content.filter((x) => x.id !== payload.itemId);
  } else if (action === 'import_content' && Array.isArray(payload.items)) {
    payload.items.slice(0, MAX_ITEMS).forEach((it, idx) => {
      content.unshift({
        id: cleanText(it.id, 80) || randomId('imp'),
        game_id: cleanText(it.game_id, 60) || gameId,
        cat: cleanText(it.cat, 60) || 'مخصص',
        content_type: cleanText(it.content_type, 40) || 'custom_prompt',
        difficulty_points: toInt(it.difficulty_points, 400),
        prompt_text: cleanText(it.prompt_text || it.q, 1000),
        answer_text: cleanText(it.answer_text || it.truth || it.a, 500),
        extra_info: cleanText(it.extra_info || it.info, 1000),
        options: Array.isArray(it.options) ? it.options.slice(0, 8).map((o) => cleanText(o, 200)) : [],
        sort_order: idx + 1, is_active: 1
      });
    });
  }
  content = content.slice(0, 20000);
  await putDoc(env, 'game_content', content);
  await log(env, admin, action, 'game_content', gameId, '');
  return { ok: true, message: 'تم حفظ محتوى اللعبة بنجاح!' };
}
