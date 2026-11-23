import { mediaLimits } from './media.js';
import { getSettings, publicSettings } from './settings.js';
// Admin-editable catalog documents. Anything the owner has not edited yet
// falls back to the defaults bundled in seed.json.
import SEED from './seed.json';
import CAT_POSTERS from './cat_posters.json'; // built-in category id → drawn poster picture
import { HttpError, nowIso } from './util.js';
import { gatewayConfigured } from './payments.js';

export const DOC_KEYS = ['games', 'packages', 'categories', 'game_content', 'suggestions', 'catQuestionsOverrides'];

const EIGHT_QUESTIONS_PREFIX = 'eight_questions:';

export async function getDoc(env, key) {
  if (key === 'catQuestionsOverrides') return getEightQuestions(env);
  const row = await env.DB.prepare('SELECT json FROM docs WHERE key = ?').bind(key).first();
  if (row) {
    const stored = JSON.parse(row.json);
    // Games shipped in a later release appear even if the owner already edited the game list.
    if (key === 'games' && Array.isArray(stored)) {
      const slugs = new Set(stored.map((g) => g.slug));
      for (const g of SEED.games) if (!slugs.has(g.slug)) stored.push(structuredClone(g));
    }
    // Ready-made categories shipped later appear even if the owner already edited the category list…
    if (key === 'categories' && Array.isArray(stored)) {
      const slugs = new Set(stored.map((c) => c.slug));
      const fresh = SEED.categories.filter((c) => !slugs.has(c.slug)).map((c) => structuredClone(c));
      if (fresh.length) stored.unshift(...fresh);
    }
    if (key === 'categories' && Array.isArray(stored)) {
      for (const c of stored) {
        const fresh = SEED.catQuestionsOverrides && SEED.catQuestionsOverrides[c.slug];
        if (fresh && (c.item_count || 0) < fresh.length) c.item_count = fresh.length;
        const shipped = SEED.categories.find((s) => s.slug === c.slug);
        if (shipped && shipped.poster && String(c.poster || '').startsWith('/cat-posters/') && c.poster !== shipped.poster) c.poster = shipped.poster;
      }
    }
    return stored;
  }
  return structuredClone(SEED[key]);
}

async function getEightQuestions(env) {
  const [legacy, saved] = await env.DB.batch([
    env.DB.prepare("SELECT json FROM docs WHERE key = 'catQuestionsOverrides'"),
    env.DB.prepare("SELECT key, json FROM docs WHERE key GLOB 'eight_questions:*'")
  ]);
  const stored = Object.assign(Object.create(null), JSON.parse(legacy.results[0]?.json || '{}'));
  // New writes are scoped to one category. An empty saved list also masks a legacy list.
  for (const row of saved.results) {
    stored[row.key.slice(EIGHT_QUESTIONS_PREFIX.length)] = JSON.parse(row.json);
  }
  for (const [slug, list] of Object.entries(SEED.catQuestionsOverrides || {})) {
    if (!(slug in stored) || isUntouchedOlderSeed(slug, stored[slug], list)) {
      stored[slug] = structuredClone(list);
      continue;
    }
    if (!Array.isArray(stored[slug])) continue;
    const shipped = new Map(list.map((q) => [q.q + '\u0000' + q.a, q]));
    for (const q of stored[slug]) {
      const original = q && shipped.get(q.q + '\u0000' + q.a);
      if (!original) continue;
      if (!q.qm && original.qm) q.qm = structuredClone(original.qm);
      if (!q.am && original.am) q.am = structuredClone(original.am);
    }
  }
  return stored;
}

export function isShippedCategory(slug) {
  return !!(SEED.catQuestionsOverrides && SEED.catQuestionsOverrides[slug]);
}

// True when a saved category still holds only shipped questions, unedited, and fewer than ship now.
function isUntouchedOlderSeed(slug, saved, fresh) {
  if (!Array.isArray(saved) || !saved.length || saved.length >= fresh.length) return false;
  const texts = new Set(fresh.map((q) => q.q + '\u0000' + q.a));
  const uidRe = new RegExp('^' + slug + '_\\d+_\\d+$');
  return saved.every((q) => q && uidRe.test(q.uid || '') && !q.qm && !q.am && texts.has(q.q + '\u0000' + q.a));
}

function prepareDocWrite(env, key, json) {
  return env.DB.prepare(
    'INSERT INTO docs (key, json, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at'
  ).bind(key, json, nowIso());
}

export async function putDoc(env, key, value) {
  await prepareDocWrite(env, key, JSON.stringify(value)).run();
}

export async function saveEightQuestions(env, slug, questions, catalogChanges = {}) {
  const json = JSON.stringify(questions);
  // Leave room for the row key and timestamp within D1's 2 MB record limit.
  if (new TextEncoder().encode(json).length > 1_900_000) {
    throw new HttpError(413, 'أسئلة الفئة كبيرة جدًا. قلّل عدد الأسئلة أو اختصر النصوص الطويلة ثم حاول مرة ثانية.');
  }
  await env.DB.batch([
    prepareDocWrite(env, EIGHT_QUESTIONS_PREFIX + slug, json),
    ...Object.entries(catalogChanges).map(([key, value]) => prepareDocWrite(env, key, JSON.stringify(value)))
  ]);
}

export async function getGamesWithStats(env) {
  const [games, stats] = await Promise.all([
    getDoc(env, 'games'),
    env.DB.prepare('SELECT game_slug, plays FROM game_stats').all()
  ]);
  const plays = {};
  for (const r of stats.results || []) plays[r.game_slug] = r.plays;
  return games.map((g) => ({ ...g, total_sessions_played: plays[g.slug] || 0 }));
}

// Public catalog: no questions or answers (those only reach players inside a launched game).
export async function getCatalog(env) {
  const [games, packages, categories] = await Promise.all([
    getGamesWithStats(env),
    getDoc(env, 'packages'),
    getDoc(env, 'categories'),
  ]);
  const settings = publicSettings(await getSettings(env));
  return { games, packages, categories: categories.filter((c) => !c.deleted), catPosters: CAT_POSTERS, settings, gatewayConnected: gatewayConfigured(env), media: mediaLimits(env) };
}
