// Diwaniya+ Worker: API + protected game delivery. Everything else is served
// from ./public by Workers Static Assets.
import { json, fail, HttpError, readJson, clientIp, cleanText, sanitizeUrl, nowIso, randomId, underRateLimit } from './util.js';
import { sendOtp, verifyOtp, logout, currentSession, requireSession, publicUser, clearSessionCookie } from './auth.js';
import { walletSnapshot, launchGame, servePlay } from './wallet.js';
import { createCheckout, handleReturn, handleWebhook, reconcileUserPending, paymentStatusForUser } from './payments.js';
import { getCatalog, getDoc, putDoc } from './catalog.js';
import { adminData, adminAction, eightCategoryQuestions, submitCategorySuggestion } from './admin.js';
import { uploadMedia, serveMedia } from './media.js';
import { handleRooms } from './rooms/routes.js';
import { STATIC } from './static.generated.js';
export { GameHubDO, RelayRoomDO, BuzzerRoomDO } from './rooms/objects.js';

const EMPTY_WALLET = { balance: 0, totalPurchased: 0, totalConsumed: 0, freeTrialsUsed: {}, transactions: [], payments: [] };

function sameOrigin(request, env) {
  if (env && env.DEV_MODE === 'true') return true; // local preview only (proxies change the address)
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

async function me(env, request) {
  const session = await currentSession(env, request);
  if (!session) return [{ ok: true, user: null, wallet: EMPTY_WALLET }, {}];
  await reconcileUserPending(env, session.user.id);
  const body = { ok: true, user: publicUser(session.user, session.csrfToken), wallet: await walletSnapshot(env, session.user.id) };
  return [body, session.renewCookie ? { 'set-cookie': session.renewCookie } : {}];
}

async function submitSuggestion(env, request, body) {
  if (!(await underRateLimit(env, 'sug_ip:' + clientIp(request), 10, 60 * 60 * 1000))) {
    throw new HttpError(429, 'وصلت للحد المسموح من الاقتراحات. حاول لاحقاً.');
  }
  const title = cleanText(body.title, 120);
  const url = sanitizeUrl(body.url);
  if (!title && !url) throw new HttpError(400, 'يرجى كتابة اسم اللعبة المقترحة أو وضع رابط صحيح لها أولاً!');
  const suggestions = await getDoc(env, 'suggestions');
  suggestions.unshift({
    id: randomId('sug'),
    title: title || 'تحدي مقترح عبر رابط',
    url,
    notes: cleanText(body.notes, 600) || 'تم إرسال المقترح لمراجعته من فريق العمل.',
    user_name: cleanText(body.userName, 60) || 'زائر الديوانية',
    status: 'وصل لفريق العمل',
    created_at: nowIso().slice(0, 10)
  });
  await putDoc(env, 'suggestions', suggestions.slice(0, 300));
  // Other visitors' ideas (and the names they typed) are for the admins only.
  return { ok: true };
}

async function handleApi(env, request, url) {
  const path = url.pathname;
  const method = request.method;

  // Server-to-server call from Moyasar (no browser origin); it only triggers a re-check with Moyasar.
  if (method === 'POST' && path === '/api/payments/webhook') return handleWebhook(env, request);

  if (method !== 'GET' && !sameOrigin(request, env)) throw new HttpError(403, 'طلب من مصدر غير مسموح.');

  if (method === 'GET' && path === '/api/catalog') return json({ ok: true, ...(await getCatalog(env)) });
  if (method === 'GET' && path === '/api/me') { const [body, headers] = await me(env, request); return json(body, 200, { ...headers, 'cache-control': 'no-store' }); }

  if (method === 'POST' && path === '/api/auth/otp/send') {
    return json(await sendOtp(env, request, await readJson(request)));
  }
  if (method === 'POST' && path === '/api/auth/otp/verify') {
    const { user, csrfToken, cookie } = await verifyOtp(env, request, await readJson(request));
    return json(
      { ok: true, status: 200, user: publicUser(user, csrfToken), wallet: await walletSnapshot(env, user.id) },
      200,
      { 'set-cookie': cookie }
    );
  }
  if (method === 'POST' && path === '/api/auth/logout') {
    await logout(env, request);
    return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie(request) });
  }

  const launch = path.match(/^\/api\/games\/([a-z0-9_]{2,40})\/launch$/);
  if (method === 'POST' && launch) {
    const session = await requireSession(env, request);
    return json(await launchGame(env, session, launch[1], await readJson(request)));
  }

  if (method === 'POST' && path === '/api/payments/orders') {
    const session = await requireSession(env, request);
    return json(await createCheckout(env, request, session, await readJson(request)), 201);
  }
  const payOrder = path.match(/^\/api\/payments\/orders\/(pay_[A-Za-z0-9_-]{4,80})$/);
  if (method === 'GET' && payOrder) {
    const session = await requireSession(env, request, { csrf: false });
    return json(await paymentStatusForUser(env, session, payOrder[1]));
  }

  if (method === 'POST' && path === '/api/media') {
    const session = await requireSession(env, request);
    return json(await uploadMedia(env, request, session), 201);
  }
  if (method === 'POST' && path === '/api/suggestions/category') {
    const session = await requireSession(env, request);
    return json(await submitCategorySuggestion(env, session, await readJson(request)));
  }

  if (method === 'POST' && path === '/api/suggestions') {
    return json(await submitSuggestion(env, request, await readJson(request)));
  }

  if (method === 'GET' && path === '/api/admin/data') {
    await requireSession(env, request, { csrf: false, owner: true });
    return json(await adminData(env));
  }
  const eightCat = path.match(/^\/api\/admin\/eight-category\/([A-Za-z0-9_-]{1,80})$/);
  if (method === 'GET' && eightCat) {
    await requireSession(env, request, { csrf: false, owner: true });
    return json({ ok: true, items: eightCategoryQuestions(eightCat[1]) });
  }
  if (method === 'POST' && path === '/api/admin/action') {
    const session = await requireSession(env, request, { owner: true });
    const body = await readJson(request);
    return json(await adminAction(env, session, String(body.action || ''), body.payload));
  }

  throw new HttpError(404, 'المسار غير موجود.');
}

// Public site files (bundled from public/ by scripts/build-static.mjs).
const STATIC_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'SAMEORIGIN',
  'permissions-policy': 'camera=(), geolocation=(), microphone=()'
};
function serveStatic(request, url) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return fail(405, 'Method not allowed');
  let path = url.pathname;
  if (path === '/' || path === '') path = '/index.html';
  let file = STATIC[path] || STATIC[path + '.html'] || STATIC[path.replace(/\/$/, '') + '/index.html'];
  if (!file) {
    // Unknown paths fall back to the store page (e.g. /?room=… links), real files 404.
    if (/\.[a-z0-9]{2,5}$/i.test(path)) return new Response('Not found', { status: 404, headers: STATIC_HEADERS });
    file = STATIC['/index.html'];
  }
  const [body, type] = file;
  const isHtml = type.startsWith('text/html');
  return new Response(request.method === 'HEAD' ? null : body, {
    headers: { ...STATIC_HEADERS, 'content-type': type, 'cache-control': isHtml ? 'no-cache' : 'public, max-age=3600' }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // One address for the whole site (sessions are per host): www and workers.dev go to the main domain.
    // Payment webhooks are left alone in case Moyasar was set up with an older address.
    const canonical = env.CANONICAL_HOST;
    if (canonical && url.hostname !== canonical && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1' &&
        url.pathname !== '/api/payments/webhook' && (request.method === 'GET' || request.method === 'HEAD')) {
      return Response.redirect('https://' + canonical + url.pathname + url.search, 301);
    }
    try {
      if (url.pathname.startsWith('/rooms/') || url.pathname.startsWith('/api/rooms')) {
        if (request.method !== 'GET' && !sameOrigin(request, env)) throw new HttpError(403, 'طلب من مصدر غير مسموح.');
        const roomRes = await handleRooms(env, request, url);
        if (roomRes) return roomRes;
      }
      if (url.pathname.startsWith('/api/')) return await handleApi(env, request, url);

      if (url.pathname === '/payments/return' && request.method === 'GET') return await handleReturn(env, request);

      const media = url.pathname.match(/^\/media\/(med_[A-Za-z0-9_-]{6,60})$/);
      if (media && (request.method === 'GET' || request.method === 'HEAD')) return await serveMedia(env, request, media[1]);

      const play = url.pathname.match(/^\/play\/([a-z0-9_]{2,40})\/?$/);
      if (play && request.method === 'GET') {
        return await servePlay(env, request, await currentSession(env, request), play[1]);
      }

      return serveStatic(request, url);
    } catch (err) {
      if (err instanceof HttpError) return fail(err.status, err.message, err.extra);
      console.error('Unhandled error:', err && err.stack ? err.stack : err);
      return fail(500, 'حدث خطأ غير متوقع في الخادم.');
    }
  }
};
