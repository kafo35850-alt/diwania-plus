import { requireSession } from './auth.js';
import { verifyPlayToken } from './rooms/routes.js';
import { cleanText, HttpError, json, nowIso, readJson, underRateLimit } from './util.js';

const idPattern = /^[A-Za-z0-9_-]{1,120}$/;
const attemptPattern = /^[a-f0-9-]{36}$/;

export async function recordEightQuestion(env, request, url) {
  const session = await requireSession(env, request, { csrf: false });
  if (request.headers.get('origin') !== url.origin) throw new HttpError(403, 'مصدر الطلب غير مسموح.');
  const body = await readJson(request);
  const revision = body.revision;
  const points = body.points;
  if (!attemptPattern.test(body.attempt || '') || !idPattern.test(body.category || '') ||
      !idPattern.test(body.question || '') || ![200, 400, 600].includes(points) ||
      !Number.isSafeInteger(revision) || revision < 0 || revision > 100 ||
      !['open', 'correct', 'missed'].includes(body.result)) throw new HttpError(400, 'بيانات السؤال غير صالحة.');
  if (typeof body.token !== 'string' || body.token.length > 128 ||
      !(await verifyPlayToken(env, session.user.id, 'eight', body.token))) throw new HttpError(403, 'جلسة اللعب غير صالحة.');

  if (!(await underRateLimit(env, 'eight_stat:' + session.user.id, 240, 10 * 60 * 1000))) {
    throw new HttpError(429, 'تم تجاوز حد تسجيل النتائج مؤقتًا.');
  }

  const key = 'eight_stat:' + session.user.id + ':' + body.attempt;
  const payload = JSON.stringify({
    category: body.category, question: body.question, points,
    prompt: cleanText(body.prompt, 300), result: body.result, revision
  });
  await env.DB.prepare(
    `INSERT INTO docs (key, json, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at
     WHERE json_extract(excluded.json, '$.revision') > json_extract(docs.json, '$.revision')
       AND json_extract(excluded.json, '$.question') = json_extract(docs.json, '$.question')
       AND json_extract(excluded.json, '$.category') = json_extract(docs.json, '$.category')
       AND json_extract(excluded.json, '$.points') = json_extract(docs.json, '$.points')`
  ).bind(key, payload, nowIso()).run();
  return json({ ok: true });
}

export async function eightQuestionStats(env, request, url) {
  await requireSession(env, request, { csrf: false, owner: true });
  const category = url.searchParams.get('category') || '';
  if (category && !idPattern.test(category)) throw new HttpError(400, 'الفئة غير صالحة.');
  const { results } = await env.DB.prepare(
    `SELECT json_extract(json, '$.question') AS question,
            json_extract(json, '$.category') AS category,
            json_extract(json, '$.points') AS points,
            MAX(json_extract(json, '$.prompt')) AS prompt,
            COUNT(*) AS shown,
            SUM(json_extract(json, '$.result') <> 'open') AS resolved,
            SUM(json_extract(json, '$.result') = 'correct') AS correct
     FROM docs WHERE key >= 'eight_stat:' AND key < 'eight_stat;'
       AND (? = '' OR json_extract(json, '$.category') = ?)
     GROUP BY category, question, points
     ORDER BY resolved DESC, shown DESC, category, question LIMIT 500`
  ).bind(category, category).all();
  return json({ ok: true, questions: results });
}
