import { getSettings } from './settings.js';
import { voiceForGame, voiceTokensForGame } from './voice.js';
// Wallet, game launches (credit / free-trial deduction) and protected game delivery.
import { HttpError, nowMs, nowIso, randomToken, randomId, sha256Hex } from './util.js';
import { getDoc, EIGHT_POSTERS, EIGHT_STADIUM_CATEGORIES, EIGHT_CATEGORY_MERGES } from './catalog.js';
import { GAMES } from './games.js';
import PICS from './pictures.json'; // uid → [question picture, answer picture] for the built-in Eight questions
import { ROOM_GAMES, verifyPlayToken, gameRoomExists, relayHostConnected, prepareRoomGame, prepareEight } from './rooms/routes.js';

const PLAY_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const IDEM_RE = /^[A-Za-z0-9_.:-]{8,120}$/;
const MAX_PENDING_TRIES = 3;

// Called when a launched free trial really starts: from then on the trial counts as used.
export async function confirmTrialStart(env, session, body) {
  const slug = String((body && body.slug) || '').slice(0, 60);
  const uid = session.user.id;
  const [r] = await env.DB.batch([
    env.DB.prepare("UPDATE game_trials SET state = 'used' WHERE user_id = ? AND game_slug = ? AND state = 'pending'").bind(uid, slug),
    env.DB.prepare('UPDATE launches SET started = 1 WHERE user_id = ? AND game_slug = ? AND created_at > ?').bind(uid, slug, nowMs() - PLAY_TOKEN_TTL_MS)
  ]);
  return { ok: true, confirmed: r.meta.changes === 1 };
}

// A paid game closed before it really started: give the credits back (once, within 20 minutes of the launch)
// and stop that launch's play link from working.
const REFUND_WINDOW_MS = 20 * 60 * 1000;
export async function cancelLaunch(env, session, body) {
  const uid = session.user.id;
  const idemKey = String((body && body.idempotencyKey) || '');
  if (!IDEM_RE.test(idemKey)) throw new HttpError(400, 'طلب غير صالح.');
  const row = await env.DB.prepare('SELECT game_slug, result_json, created_at, started, refunded FROM launches WHERE user_id = ? AND idem_key = ?').bind(uid, idemKey).first();
  if (!row || !row.result_json) return { ok: true, refunded: 0 };
  const res = JSON.parse(row.result_json);
  const cost = Number(res.costDeducted) || 0;
  if (!cost || row.started || row.refunded || nowMs() - row.created_at > REFUND_WINDOW_MS) return { ok: true, refunded: 0 };
  const claim = await env.DB.prepare('UPDATE launches SET refunded = 1 WHERE user_id = ? AND idem_key = ? AND refunded = 0 AND started = 0').bind(uid, idemKey).run();
  if (!claim.meta.changes) return { ok: true, refunded: 0 };
  const w = await env.DB.prepare('UPDATE wallets SET balance = balance + ?, total_consumed = MAX(0, total_consumed - ?) WHERE user_id = ? RETURNING balance').bind(cost, cost, uid).first();
  const after = w ? w.balance : cost;
  await env.DB.batch([
    env.DB.prepare('INSERT INTO wallet_transactions (id, user_id, type, amount, balance_before, balance_after, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(randomId('wtx'), uid, 'refund', cost, after - cost, after, '↩️ رجعت الأقيام (ما بدأت اللعب): ' + (res.gameTitle || row.game_slug), nowIso()),
    env.DB.prepare('DELETE FROM play_tokens WHERE user_id = ? AND game_slug = ?').bind(uid, row.game_slug)
  ]);
  return { ok: true, refunded: cost, wallet: await walletSnapshot(env, uid) };
}

export async function walletSnapshot(env, userId) {
  const [w, txs, trials, pays] = await env.DB.batch([
    env.DB.prepare('SELECT balance, total_purchased, total_consumed FROM wallets WHERE user_id = ?').bind(userId),
    env.DB.prepare('SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').bind(userId),
    env.DB.prepare("SELECT game_slug, created_at FROM game_trials WHERE user_id = ? AND state = 'used'").bind(userId),
    env.DB.prepare('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').bind(userId)
  ]);
  const wallet = (w.results && w.results[0]) || { balance: 0, total_purchased: 0, total_consumed: 0 };
  const freeTrialsUsed = {};
  for (const t of trials.results || []) freeTrialsUsed[t.game_slug] = t.created_at;
  return {
    balance: wallet.balance,
    totalPurchased: wallet.total_purchased,
    totalConsumed: wallet.total_consumed,
    freeTrialsUsed,
    transactions: txs.results || [],
    payments: pays.results || []
  };
}

async function issuePlayToken(env, userId, slug) {
  const token = randomToken(32);
  await env.DB.prepare('INSERT INTO play_tokens (token_hash, user_id, game_slug, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256Hex(token), userId, slug, nowMs() + PLAY_TOKEN_TTL_MS).run();
  return '/play/' + encodeURIComponent(slug) + '?t=' + encodeURIComponent(token);
}

export async function launchGame(env, session, slug, body) {
  const uid = session.user.id;
  const idemKey = String(body.idempotencyKey || '');
  if (!IDEM_RE.test(idemKey)) throw new HttpError(400, 'مفتاح منع التكرار (Idempotency-Key) مفقود أو غير صالح.');

  const games = await getDoc(env, 'games');
  const game = games.find((g) => g.slug === slug && g.is_enabled);
  if (!game || !resolveGameHtml(game)) throw new HttpError(404, 'اللعبة المطلوبة غير متاحة حالياً.');

  // Claim the idempotency key first so a double click can never charge twice.
  const claim = await env.DB.prepare(
    'INSERT INTO launches (user_id, idem_key, game_slug, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, idem_key) DO NOTHING'
  ).bind(uid, idemKey, slug, nowMs()).run();
  if (!claim.meta.changes) {
    const prev = await env.DB.prepare('SELECT game_slug, result_json FROM launches WHERE user_id = ? AND idem_key = ?').bind(uid, idemKey).first();
    if (!prev || !prev.result_json || prev.game_slug !== slug) throw new HttpError(409, 'الطلب قيد المعالجة، انتظر لحظة.');
    return {
      ...JSON.parse(prev.result_json),
      deduplicated: true,
      playUrl: await issuePlayToken(env, uid, slug),
      wallet: await walletSnapshot(env, uid)
    };
  }

  const iso = nowIso();
  const cost = Math.max(0, Number(game.cost_credits) || 0);
  // Games priced at 0 are always free and keep the account's one-time trial untouched.
  const alwaysFree = cost === 0;
  const trialsOn = !!(await getSettings(env)).free_trials;
  // The trial is only reserved here ("pending"); it is used up when the game really starts (see confirmTrialStart).
  // A pending trial can be reopened a few times, so closing the game early never wastes it.
  const trial = alwaysFree || !trialsOn ? null : await env.DB.prepare(
    "INSERT INTO game_trials (user_id, game_slug, created_at, state, tries) VALUES (?, ?, ?, 'pending', 1) " +
    "ON CONFLICT(user_id, game_slug) DO UPDATE SET tries = tries + 1, created_at = excluded.created_at WHERE game_trials.state = 'pending' AND game_trials.tries < ? RETURNING tries"
  ).bind(uid, slug, iso, MAX_PENDING_TRIES).first();
  const isFreeTrial = !!trial;
  // Reopened too many times without starting: the trial now counts as used.
  if (!isFreeTrial && !alwaysFree && trialsOn) {
    await env.DB.prepare("UPDATE game_trials SET state = 'used' WHERE user_id = ? AND game_slug = ? AND state = 'pending'").bind(uid, slug).run();
  }

  let balanceBefore;
  let balanceAfter;
  if (isFreeTrial || cost === 0) {
    const w = await env.DB.prepare('SELECT balance FROM wallets WHERE user_id = ?').bind(uid).first();
    balanceBefore = balanceAfter = w ? w.balance : 0;
  } else {
    // Atomic conditional debit: only succeeds if the balance covers the cost.
    const debit = await env.DB.prepare(
      'UPDATE wallets SET balance = balance - ?, total_consumed = total_consumed + ? WHERE user_id = ? AND balance >= ? RETURNING balance'
    ).bind(cost, cost, uid, cost).first();
    if (!debit) {
      await env.DB.prepare('DELETE FROM launches WHERE user_id = ? AND idem_key = ?').bind(uid, idemKey).run();
      const w = await env.DB.prepare('SELECT balance FROM wallets WHERE user_id = ?').bind(uid).first();
      const bal = w ? w.balance : 0;
      throw new HttpError(402, 'استخدمت التجربة المجانية لهذه اللعبة، ورصيدك الحالي (' + bal + ' أقيام) غير كافٍ. اشحن رصيدك من باقات الأقيام.', { code: 'INSUFFICIENT_CREDITS' });
    }
    balanceAfter = debit.balance;
    balanceBefore = balanceAfter + cost;
  }

  const charged = isFreeTrial ? 0 : cost;
  const result = { ok: true, status: 200, isFreeTrial, isFree: alwaysFree, costDeducted: charged, gameSlug: slug, gameTitle: game.title, idempotencyKey: idemKey };
  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO wallet_transactions (id, user_id, type, amount, balance_before, balance_after, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      randomId('wtx'), uid, alwaysFree ? 'free_play' : (isFreeTrial ? 'free_trial' : 'consume'), -charged, balanceBefore, balanceAfter,
      (alwaysFree ? '🆓 لعبة مجانية: ' : (isFreeTrial ? '🎁 تشغيل مجاني (التجربة الوحيدة): ' : 'تشغيل لعبة: ')) + game.title, iso
    ),
    env.DB.prepare('INSERT INTO game_stats (game_slug, plays) VALUES (?, 1) ON CONFLICT(game_slug) DO UPDATE SET plays = plays + 1').bind(slug),
    env.DB.prepare('UPDATE launches SET result_json = ? WHERE user_id = ? AND idem_key = ?').bind(JSON.stringify(result), uid, idemKey)
  ]);

  return { ...result, playUrl: await issuePlayToken(env, uid, slug), wallet: await walletSnapshot(env, uid) };
}

// Games added from the admin panel reuse the engine file of an existing game.
function resolveGameHtml(game) {
  if (GAMES[game.slug]) return { html: GAMES[game.slug], retitle: false };
  if (GAMES[game.engine_type]) return { html: GAMES[game.engine_type], retitle: true };
  return null;
}

function scriptJson(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .split(String.fromCharCode(0x2028)).join('\\u2028')
    .split(String.fromCharCode(0x2029)).join('\\u2029');
}

function htmlPage(status, message) {
  return new Response(
    '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<body style="background:#0A0F24;color:#fff;font-family:Tahoma,Arial,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px">' +
    '<div><h2>' + message + '</h2><p><a style="color:#F5B942" href="/">العودة للمتجر</a></p></div></body></html>',
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } }
  );
}

// GET /play/<slug>?t=<token> — the host who launched (and paid for) the game.
// GET /play/<slug>?room=CODE | ?board=CODE | ?buzzer=CODE — guests joining a live room from their phone
// (only while that room exists, so a room link never unlocks a game on its own).
export async function servePlay(env, request, session, slug) {
  const url = new URL(request.url);
  const token = url.searchParams.get('t') || '';
  let guest = false;
  if (token) {
    if (!session) return htmlPage(401, 'سجّل دخولك من المتجر لتشغيل اللعبة.');
    if (!(await verifyPlayToken(env, session.user.id, slug, token))) {
      return htmlPage(403, 'انتهت صلاحية جلسة اللعب. افتح اللعبة من المتجر مرة ثانية.');
    }
  } else {
    const code = url.searchParams.get('room') || url.searchParams.get('board') || '';
    const buzz = url.searchParams.get('buzzer') || '';
    if (ROOM_GAMES[slug] && code && await gameRoomExists(env, slug, code)) guest = true;
    else if (slug === 'eight' && buzz && await relayHostConnected(env, buzz)) guest = true;
    else if (code || buzz) return htmlPage(404, 'الغرفة غير موجودة أو انتهت. اطلب من المضيف رابط جديد.');
    else return htmlPage(403, 'افتح اللعبة من المتجر.');
  }

  const games = await getDoc(env, 'games');
  const game = games.find((g) => g.slug === slug);
  const resolved = game && resolveGameHtml(game);
  if (!resolved) return htmlPage(404, 'اللعبة غير متاحة حالياً.');

  // «رسّام الديوانية»: the room mode is the main one; ?mode=classic opens the old one-screen mode (players who paid only).
  const classic = slug === 'draw_guess' && !guest && url.searchParams.get('mode') === 'classic' && !!GAMES.draw_classic;
  let html = classic ? GAMES.draw_classic : resolved.html;
  if (resolved.retitle) html = html.replace(/ديوانية بلس — [^<]+/g, 'ديوانية بلس — ' + game.title.replace(/[<>&]/g, ''));

  // Owner-edited content the games read at start-up (guests of the Eight buzzer never get questions).
  const [overrides, gameContent, categories] = await Promise.all([
    slug === 'eight' && !guest ? getDoc(env, 'catQuestionsOverrides') : {},
    getDoc(env, 'game_content'),
    getDoc(env, 'categories')
  ]);
  const content = {
    catQuestionsOverrides: overrides,
    // Categories added from the admin panel (or approved suggestions), and built-ins the owner hid.
    customCats: slug !== 'eight' ? [] : categories.filter((c) => (String(c.slug).startsWith('custom_') || EIGHT_STADIUM_CATEGORIES.has(c.slug)) && c.is_visible && !Object.hasOwn(EIGHT_CATEGORY_MERGES, c.slug) && Array.isArray(overrides[c.slug]) && overrides[c.slug].length >= 6).map((c) => ({
      id: c.slug, name: c.name, icon: c.icon || '🎯', group: c.sub_group || 'فئات الديوانية', tag: c.sub_group || 'فئات الديوانية',
      desc: c.description || '', questionCount: overrides[c.slug].length, qCount: overrides[c.slug].length,
      ...(c.poster ? { customPosterDataUrl: c.poster } : {}),
      ...(c.isCharades ? { isCharades: true } : {}),
      ...(c.isLetterHoneycomb ? { isLetterHoneycomb: true, letterLang: 'ar' } : {}),
      ...(EIGHT_STADIUM_CATEGORIES.has(c.slug) ? { isRebus: true, isVisual: true } : {})
    })),
    hiddenCats: slug !== 'eight' ? [] : categories.filter((c) => !c.is_visible).map((c) => c.slug),
    pics: slug === 'eight' && !guest ? PICS : {},
    catPosters: slug === 'eight' ? EIGHT_POSTERS : {},
    categoryMerges: slug === 'eight' ? EIGHT_CATEGORY_MERGES : {},
    qaftah: gameContent.filter((x) => x.game_id === 'game_qaftah' && x.is_active !== 0)
  };
  if (ROOM_GAMES[slug] && !classic) html = prepareRoomGame(html, slug, url, { token, demo: !guest && url.searchParams.get('demo') === '1' });
  if (slug === 'eight') html = prepareEight(html, url, { token, guest });
  // Phone-room games are laid out for phones: scale them up when the host shows them on a big screen.
  if (ROOM_GAMES[slug] && !classic) {
    html = html.replace('</head>', '<style>/*dw-tv*/@media (min-width:1280px) and (min-height:700px){body{zoom:1.25}}@media (min-width:1700px) and (min-height:900px){body{zoom:1.55}}@media (min-width:2400px) and (min-height:1300px){body{zoom:2.1}}</style></head>');
  }
  const narrator = resolved.retitle ? game.engine_type : slug;
  content.voice = await voiceForGame(env, narrator);
  if (content.voice.length) content.voiceTokens = voiceTokensForGame(narrator);
  html = html.replace(/<head([^>]*)>/i, (m) => m + '\n<script src="/volume.js"></script><script>window.__DW_CONTENT = ' + scriptJson(content) + ';</script><script src="/voice-player.js?v=2"></script>');
  html = html.replace('</head>', '<style>@media (max-width:700px){.dw-FloatingAudioBar{display:none!important}}html.dw-in-frame .dw-FloatingAudioBar{display:none!important}</style><script>try{if(window.top!==window)document.documentElement.classList.add(\'dw-in-frame\')}catch(e){}</script></head>');

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store, private',
      'x-frame-options': 'SAMEORIGIN',
      'content-security-policy': "frame-ancestors 'self'",
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff'
    }
  });
}
