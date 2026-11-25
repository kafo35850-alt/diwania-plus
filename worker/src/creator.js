// «العب واكسب»: people write a category (18+ questions); once the owner accepts it, they earn a set amount
// every time a real game session opens one of its questions — the creator's own games count too.
import { HttpError, nowIso, randomId, sha256Hex, cleanText } from './util.js';
import { getDoc } from './catalog.js';
import { getSettings } from './settings.js';

let creatorsCache = { at: 0, map: new Map() };
async function creatorOf(env, slug) {
  if (Date.now() - creatorsCache.at > 60000) {
    const cats = await getDoc(env, 'categories');
    creatorsCache = { at: Date.now(), map: new Map(cats.filter((c) => c.creator_user_id && !c.deleted).map((c) => [c.slug, c.creator_user_id])) };
  }
  return creatorsCache.map.get(slug) || null;
}

// Called when a question opens in a real (token) Eight session.
export async function rewardCreator(env, category, token, playerId) {
  const creator = await creatorOf(env, category);
  if (!creator) return;
  const s = await getSettings(env);
  const amount = Math.max(0, Number(s.creator_reward_halalas) || 0);
  if (!amount) return;
  await env.DB.prepare('INSERT OR IGNORE INTO creator_plays (category, token_hash, creator_id, player_id, amount_halalas, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(category, await sha256Hex(token), creator, playerId, amount, nowIso()).run();
}

async function balanceOf(env, userId) {
  const [earned, out] = await env.DB.batch([
    env.DB.prepare('SELECT COALESCE(SUM(amount_halalas), 0) AS s, COUNT(*) AS n FROM creator_plays WHERE creator_id = ?').bind(userId),
    env.DB.prepare("SELECT COALESCE(SUM(amount_halalas), 0) AS s FROM creator_payouts WHERE user_id = ? AND status <> 'rejected'").bind(userId)
  ]);
  const e = earned.results[0] || { s: 0, n: 0 };
  return { earned: e.s, plays: e.n, withdrawn: (out.results[0] || { s: 0 }).s, balance: e.s - (out.results[0] || { s: 0 }).s };
}

export async function creatorDashboard(env, session) {
  const uid = session.user.id;
  const [sugs, cats, settings, money] = await Promise.all([getDoc(env, 'cat_suggestions'), getDoc(env, 'categories'), getSettings(env), balanceOf(env, uid)]);
  const perCat = await env.DB.prepare('SELECT category, COUNT(*) AS plays, SUM(amount_halalas) AS earned FROM creator_plays WHERE creator_id = ? GROUP BY category').bind(uid).all();
  const stats = new Map(perCat.results.map((r) => [r.category, r]));
  const mine = (sugs || []).filter((x) => x.user_id === uid).map((x) => {
    const cat = x.category_slug && cats.find((c) => c.slug === x.category_slug);
    const st = x.category_slug && stats.get(x.category_slug);
    return { id: x.id, name: x.name, icon: x.icon, status: x.status, questions: (x.questions || []).length, created_at: x.created_at,
      note: x.review_note || '', live: !!(cat && cat.is_visible && !cat.deleted), plays: st ? st.plays : 0, earned: st ? st.earned : 0 };
  });
  const payouts = await env.DB.prepare('SELECT id, amount_halalas, status, note, created_at FROM creator_payouts WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').bind(uid).all();
  return { ok: true, reward_halalas: Number(settings.creator_reward_halalas) || 0, min_payout_halalas: Number(settings.creator_min_payout_halalas) || 0,
    ...money, categories: mine, payouts: payouts.results };
}

export async function requestPayout(env, session, body) {
  const settings = await getSettings(env);
  const money = await balanceOf(env, session.user.id);
  const min = Number(settings.creator_min_payout_halalas) || 0;
  if (money.balance <= 0 || money.balance < min) throw new HttpError(400, 'رصيد أرباحك أقل من الحد الأدنى للسحب (' + (min / 100) + ' ر.س).');
  const iban = String(body.iban || '').replace(/\s+/g, '').toUpperCase();
  if (!/^SA\d{22}$/.test(iban)) throw new HttpError(400, 'اكتب رقم الآيبان السعودي كامل: يبدأ بـ SA وبعده ٢٢ رقم.');
  const holder = cleanText(body.holder, 80);
  if (holder.length < 3) throw new HttpError(400, 'اكتب اسم صاحب الحساب مثل ما هو في البنك.');
  const open = await env.DB.prepare("SELECT 1 FROM creator_payouts WHERE user_id = ? AND status = 'pending' LIMIT 1").bind(session.user.id).first();
  if (open) throw new HttpError(409, 'عندك طلب سحب ينتظر التحويل. بنحوّله لك قريب.');
  const iso = nowIso();
  await env.DB.prepare('INSERT INTO creator_payouts (id, user_id, user_email, amount_halalas, iban, holder, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(randomId('cpo'), session.user.id, session.user.email, money.balance, iban, holder, 'pending', iso, iso).run();
  return { ok: true, message: 'وصل طلب السحب ✅ بنحوّل ' + (money.balance / 100).toFixed(2) + ' ر.س لحسابك خلال أيام العمل.' };
}

// Owner view: every creator with their totals, and the withdrawal requests.
export async function creatorAdminData(env) {
  const [byCreator, payouts] = await env.DB.batch([
    env.DB.prepare('SELECT creator_id, COUNT(*) AS plays, SUM(amount_halalas) AS earned FROM creator_plays GROUP BY creator_id ORDER BY earned DESC LIMIT 200'),
    env.DB.prepare('SELECT * FROM creator_payouts ORDER BY (status = \'pending\') DESC, created_at DESC LIMIT 200')
  ]);
  return { creators: byCreator.results, payouts: payouts.results };
}

export async function markPayout(env, payload) {
  const status = payload.status === 'paid' ? 'paid' : payload.status === 'rejected' ? 'rejected' : '';
  if (!status) throw new HttpError(400, 'حالة غير صحيحة.');
  const r = await env.DB.prepare("UPDATE creator_payouts SET status = ?, note = ?, updated_at = ? WHERE id = ? AND status = 'pending'")
    .bind(status, cleanText(payload.note, 200), nowIso(), String(payload.payoutId || '')).run();
  if (!r.meta || !r.meta.changes) throw new HttpError(404, 'الطلب غير موجود أو تمت معالجته.');
  return { ok: true, message: status === 'paid' ? 'تم تسجيل التحويل ✅' : 'تم رفض الطلب.' };
}
