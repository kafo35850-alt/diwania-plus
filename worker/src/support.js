import { HttpError, cleanText, clientIp, getCookie, json, nowIso, randomToken, readJson, sha256Hex, underRateLimit } from './util.js';
import { requireSession } from './auth.js';

const PREFIX = 'support:';
const COOKIE = 'dw_support_thread';
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const THREAD_ID = /^[a-f0-9]{64}$/;

async function findThread(env, key) {
  const row = await env.DB.prepare('SELECT json FROM docs WHERE key = ?').bind(key).first();
  return row ? JSON.parse(row.json) : null;
}

async function appendMessage(env, key, message) {
  const result = await env.DB.prepare(
    "UPDATE docs SET json = json_insert(json, '$.messages[#]', json(?)), updated_at = ? WHERE key = ? AND json_array_length(json, '$.messages') < 100"
  ).bind(JSON.stringify(message), message.at, key).run();
  if (!result.meta.changes) throw new HttpError(409, 'تعذر إضافة الرسالة. ربما امتلأت المحادثة.');
}

export async function handleSupport(env, request, url) {
  const method = request.method;
  if (url.pathname === '/api/admin/support' && method === 'GET') {
    await requireSession(env, request, { csrf: false, owner: true });
    const { results } = await env.DB.prepare(
      "SELECT key, json, updated_at FROM docs WHERE key >= 'support:' AND key < 'support;' ORDER BY updated_at DESC LIMIT 100"
    ).all();
    return json({ ok: true, threads: results.map((row) => ({
      ...JSON.parse(row.json), id: row.key.slice(PREFIX.length), updatedAt: row.updated_at
    })) });
  }

  if (url.pathname === '/api/admin/support' && method === 'POST') {
    await requireSession(env, request, { owner: true });
    const body = await readJson(request);
    const id = cleanText(body.id, 100);
    const text = cleanText(body.message, 2000);
    if (!THREAD_ID.test(id) || !text) throw new HttpError(400, 'اختر المحادثة واكتب الرد.');
    const key = PREFIX + id;
    await appendMessage(env, key, { from: 'owner', text, at: nowIso() });
    return json({ ok: true, thread: await findThread(env, key) });
  }

  if (url.pathname !== '/api/support' || !['GET', 'POST'].includes(method)) return null;
  const existing = getCookie(request, COOKIE) || '';
  const token = TOKEN.test(existing) ? existing : '';
  const key = token ? PREFIX + await sha256Hex(token) : '';
  if (method === 'GET') return json({ ok: true, thread: key ? await findThread(env, key) : null });

  if (request.headers.get('origin') !== url.origin) throw new HttpError(403, 'مصدر الطلب غير مسموح.');
  const body = await readJson(request);
  const text = cleanText(body.message, 2000);
  const name = cleanText(body.name, 60);
  if (!text || (!token && !name)) throw new HttpError(400, 'اكتب اسمك ورسالتك.');
  if (!(await underRateLimit(env, 'support:' + clientIp(request), 15, 10 * 60 * 1000))) {
    throw new HttpError(429, 'أرسلت رسائل كثيرة. جرّب بعد شوي.');
  }

  const message = { from: 'visitor', text, at: nowIso() };
  if (key && await findThread(env, key)) {
    await appendMessage(env, key, message);
    return json({ ok: true, thread: await findThread(env, key) });
  }
  if (!name) throw new HttpError(400, 'اكتب اسمك لبدء محادثة جديدة.');
  const newToken = randomToken();
  const newKey = PREFIX + await sha256Hex(newToken);
  const thread = { name, messages: [message] };
  await env.DB.prepare('INSERT INTO docs (key, json, updated_at) VALUES (?, ?, ?)').bind(
    newKey, JSON.stringify(thread), message.at
  ).run();
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  return json({ ok: true, thread }, 201, {
    'set-cookie': COOKIE + '=' + newToken + '; Max-Age=2592000; Path=/; HttpOnly; SameSite=Strict' + secure
  });
}
