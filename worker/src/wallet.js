// Wallet, game launches (credit / free-trial deduction) and protected game delivery.
import { HttpError, nowMs, nowIso, randomToken, randomId, sha256Hex } from './util.js';
import { getDoc } from './catalog.js';
import { GAMES } from './games.js';

const PLAY_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const IDEM_RE = /^[A-Za-z0-9_.:-]{8,120}$/;

export async function walletSnapshot(env, userId) {
  const [w, txs, trials, pays] = await env.DB.batch([
    env.DB.prepare('SELECT balance, total_purchased, total_consumed FROM wallets WHERE user_id = ?').bind(userId),
    env.DB.prepare('SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').bind(userId),
    env.DB.prepare('SELECT game_slug, created_at FROM game_trials WHERE user_id = ?').bind(userId),
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
  const trial = await env.DB.prepare('INSERT INTO game_trials (user_id, game_slug, created_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING')
    .bind(uid, slug, iso).run();
  const isFreeTrial = trial.meta.changes === 1;

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
  const result = { ok: true, status: 200, isFreeTrial, costDeducted: charged, gameSlug: slug, gameTitle: game.title, idempotencyKey: idemKey };
  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO wallet_transactions (id, user_id, type, amount, balance_before, balance_after, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      randomId('wtx'), uid, isFreeTrial ? 'free_trial' : 'consume', -charged, balanceBefore, balanceAfter,
      (isFreeTrial ? '🎁 تشغيل مجاني (التجربة الوحيدة): ' : 'تشغيل لعبة: ') + game.title, iso
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

// GET /play/<slug>?t=<token> — only the user who launched (and paid for) the game gets its code.
export async function servePlay(env, request, session, slug) {
  if (!session) return htmlPage(401, 'سجّل دخولك من المتجر لتشغيل اللعبة.');
  const token = new URL(request.url).searchParams.get('t') || '';
  if (!token || token.length > 200) return htmlPage(403, 'افتح اللعبة من المتجر.');
  const row = await env.DB.prepare('SELECT user_id, game_slug, expires_at FROM play_tokens WHERE token_hash = ?')
    .bind(await sha256Hex(token)).first();
  if (!row || row.user_id !== session.user.id || row.game_slug !== slug || row.expires_at < nowMs()) {
    return htmlPage(403, 'انتهت صلاحية جلسة اللعب. افتح اللعبة من المتجر مرة ثانية.');
  }

  const games = await getDoc(env, 'games');
  const game = games.find((g) => g.slug === slug);
  const resolved = game && resolveGameHtml(game);
  if (!resolved) return htmlPage(404, 'اللعبة غير متاحة حالياً.');

  let html = resolved.html;
  if (resolved.retitle) html = html.replace(/ديوانية بلس — [^<]+/g, 'ديوانية بلس — ' + game.title.replace(/[<>&]/g, ''));

  // Owner-edited content the games read at start-up.
  const [overrides, gameContent] = await Promise.all([getDoc(env, 'catQuestionsOverrides'), getDoc(env, 'game_content')]);
  const content = {
    catQuestionsOverrides: overrides,
    qaftah: gameContent.filter((x) => x.game_id === 'game_qaftah' && x.is_active !== 0)
  };
  html = html.replace(/<head([^>]*)>/i, (m) => m + '\n<script>window.__DW_CONTENT = ' + scriptJson(content) + ';</script>');

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
