// Diwaniya+ Worker: API + protected game delivery. Everything else is served
// from ./public by Workers Static Assets.
import { json, fail, HttpError, readJson, clientIp, cleanText, sanitizeUrl, nowIso, randomId, underRateLimit } from './util.js';
import { sendOtp, verifyOtp, logout, currentSession, requireSession, publicUser, clearSessionCookie } from './auth.js';
import { walletSnapshot, launchGame, createPaymentOrder, servePlay } from './wallet.js';
import { getCatalog, getDoc, putDoc } from './catalog.js';
import { adminData, adminAction, eightCategoryQuestions } from './admin.js';

const EMPTY_WALLET = { balance: 0, totalPurchased: 0, totalConsumed: 0, freeTrialsUsed: {}, transactions: [], payments: [] };

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

async function me(env, request) {
  const session = await currentSession(env, request);
  if (!session) return { ok: true, user: null, wallet: EMPTY_WALLET };
  return { ok: true, user: publicUser(session.user, session.csrfToken), wallet: await walletSnapshot(env, session.user.id) };
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
  return { ok: true, suggestions: suggestions.slice(0, 300) };
}

async function handleApi(env, request, url) {
  const path = url.pathname;
  const method = request.method;

  if (method !== 'GET' && !sameOrigin(request)) throw new HttpError(403, 'طلب من مصدر غير مسموح.');

  if (method === 'GET' && path === '/api/catalog') return json({ ok: true, ...(await getCatalog(env)) });
  if (method === 'GET' && path === '/api/me') return json(await me(env, request));

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
    return json(await createPaymentOrder(env, session, await readJson(request)), 201);
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith('/api/')) return await handleApi(env, request, url);

      const play = url.pathname.match(/^\/play\/([a-z0-9_]{2,40})\/?$/);
      if (play && request.method === 'GET') {
        return await servePlay(env, request, await currentSession(env, request), play[1]);
      }

      return env.ASSETS.fetch(request);
    } catch (err) {
      if (err instanceof HttpError) return fail(err.status, err.message, err.extra);
      console.error('Unhandled error:', err && err.stack ? err.stack : err);
      return fail(500, 'حدث خطأ غير متوقع في الخادم.');
    }
  }
};
