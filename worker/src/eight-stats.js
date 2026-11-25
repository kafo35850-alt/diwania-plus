import { requireSession } from './auth.js';
import { verifyPlayToken } from './rooms/routes.js';
import { cleanText, HttpError, json, nowIso, readJson, underRateLimit } from './util.js';
import { getDoc } from './catalog.js';
import { eightRawQuestions } from './games.js';
import { rewardCreator } from './creator.js';

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
  if (body.result === 'open') {
    try { await rewardCreator(env, body.category, body.token, session.user.id); } catch (e) { console.error('creator reward', e); }
  }
  return json({ ok: true });
}

export async function eightQuestionStats(env, request, url) {
  await requireSession(env, request, { csrf: false, owner: true });
  const category = url.searchParams.get('category') || '';
  if (category && !idPattern.test(category)) throw new HttpError(400, 'الفئة غير صالحة.');
  // One row per question (results under an older point value still say how hard the question is).
  const { results } = await env.DB.prepare(
    `SELECT json_extract(json, '$.question') AS question,
            json_extract(json, '$.category') AS category,
            MAX(json_extract(json, '$.points')) AS points,
            MAX(json_extract(json, '$.prompt')) AS prompt,
            COUNT(*) AS shown,
            SUM(json_extract(json, '$.result') <> 'open') AS resolved,
            SUM(json_extract(json, '$.result') = 'correct') AS correct
     FROM docs WHERE key >= 'eight_stat:' AND key < 'eight_stat;'
       AND (? = '' OR json_extract(json, '$.category') = ?)
     GROUP BY category, question
     ORDER BY resolved DESC, shown DESC, category, question LIMIT 800`
  ).bind(category, category).all();
  // The question's points now (after any move from this page), and how many questions each level has.
  const overrides = await getDoc(env, 'catQuestionsOverrides');
  const lists = new Map();
  const listFor = (slug) => {
    if (!lists.has(slug)) lists.set(slug, Array.isArray(overrides[slug]) ? overrides[slug] : eightRawQuestions(slug) || []);
    return lists.get(slug);
  };
  for (const row of results) {
    const list = listFor(row.category);
    const q = list.find((x) => x && x.uid === row.question);
    row.current = q ? Number(q.points) || row.points : null;
    row.levels = { 200: 0, 400: 0, 600: 0 };
    for (const x of list) if (x && row.levels[x.points] != null) row.levels[x.points]++;
  }
  return json({ ok: true, questions: results });
}
