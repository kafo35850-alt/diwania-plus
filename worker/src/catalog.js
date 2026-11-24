import { mediaLimits } from './media.js';
import { getSettings, publicSettings } from './settings.js';
// Admin-editable catalog documents. Anything the owner has not edited yet
// falls back to the defaults bundled in seed.json.
import SEED from './seed.json';
import CAT_POSTERS from './cat_posters.json';
import EIGHT_EXPANSION from './eight_expansion.json';
import EIGHT_QUESTION_REVIEW from './eight_question_review.json';
import EIGHT_POSTER_CATEGORIES from './eight_poster_categories.json';
import { HttpError, nowIso } from './util.js';
import { gatewayConfigured } from './payments.js';
import { eightRawQuestions } from './games.js';

export const DOC_KEYS = ['games', 'packages', 'categories', 'game_content', 'suggestions', 'catQuestionsOverrides'];

const EIGHT_QUESTIONS_PREFIX = 'eight_questions:';
const expandedDefaults = new Map();
export const EIGHT_CATEGORY_MERGES = { custom_1795179696757: 'quran_kareem' };
const mergedTargets = new Set(Object.values(EIGHT_CATEGORY_MERGES));
const posterCategories = new Map(EIGHT_POSTER_CATEGORIES.map(({ questions, ...category }) => [category.slug, category]));
export const EIGHT_STADIUM_CATEGORIES = new Set(['world_stadiums_photo', 'arab_stadiums_photo']);
export const EIGHT_POSTERS = {
  ...CAT_POSTERS,
  ...Object.fromEntries([...posterCategories].map(([slug, category]) => [slug, category.poster])),
  ...Object.fromEntries(Object.entries(EIGHT_EXPANSION)
    .filter(([, bundle]) => bundle.poster)
    .map(([slug, bundle]) => [slug, bundle.poster]))
};

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
      const known = new Set(stored.map((category) => category.slug));
      stored.push(...[...posterCategories.values()].filter((category) => !known.has(category.slug)).map((category) => structuredClone(category)));
    }
    if (key === 'categories' && Array.isArray(stored)) {
      for (const c of stored) {
        const fresh = SEED.catQuestionsOverrides && SEED.catQuestionsOverrides[c.slug];
        if (fresh && (c.item_count || 0) < fresh.length) c.item_count = fresh.length;
        const shipped = SEED.categories.find((s) => s.slug === c.slug);
        const posterCategory = posterCategories.get(c.slug);
        if (posterCategory) {
          if (!c.poster) c.poster = posterCategory.poster;
          if (!c.item_count) c.item_count = posterCategory.item_count;
          if (posterCategory.isCharades) c.isCharades = true;
          if (posterCategory.isLetterHoneycomb) c.isLetterHoneycomb = true;
        }
        if (shipped && shipped.poster && String(c.poster || '').startsWith('/cat-posters/') && c.poster !== shipped.poster) c.poster = shipped.poster;
        if (shipped && c.slug === 'rebus_football') {
          const { name, description, icon, poster, item_count } = shipped;
          Object.assign(c, { name, description, icon, poster, item_count });
        } else if (shipped && EIGHT_STADIUM_CATEGORIES.has(c.slug)) {
          c.item_count = Math.max(c.item_count || 0, shipped.item_count);
        }
      }
    }
    return stored;
  }
  if (key === 'categories') {
    const slugs = new Set(SEED.categories.map((category) => category.slug));
    return structuredClone([...SEED.categories, ...[...posterCategories.values()].filter((category) => !slugs.has(category.slug))]);
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
  const savedAfterExpansion = new Set();
  const savedAfterMerge = new Set();
  for (const row of saved.results) {
    const slug = row.key.slice(EIGHT_QUESTIONS_PREFIX.length);
    const value = JSON.parse(row.json);
    if (Array.isArray(value?.questions)) {
      stored[slug] = value.questions;
      if (value.includesDriveExpansion === true) savedAfterExpansion.add(slug);
      if (value.includesCategoryMerge === true) savedAfterMerge.add(slug);
    } else {
      stored[slug] = value;
    }
  }
  const databaseSlugs = new Set(Object.keys(stored));
  for (const { slug, questions } of EIGHT_POSTER_CATEGORIES) {
    if (!(slug in stored) && questions.length) stored[slug] = structuredClone(questions);
  }
  for (const [slug, list] of Object.entries(SEED.catQuestionsOverrides || {})) {
    if (!(slug in stored) || (!savedAfterExpansion.has(slug) && isUntouchedOlderSeed(slug, stored[slug], list))) {
      stored[slug] = structuredClone(list);
      continue;
    }
    if (savedAfterExpansion.has(slug) || !Array.isArray(stored[slug])) continue;
    const shipped = new Map(list.map((q) => [q.q + '\u0000' + q.a, q]));
    for (const q of stored[slug]) {
      const original = q && shipped.get(q.q + '\u0000' + q.a);
      if (!original) continue;
      if (!q.qm && original.qm) q.qm = structuredClone(original.qm);
      if (!q.am && original.am) q.am = structuredClone(original.am);
    }
  }
  if (Array.isArray(stored.charades_general)) {
    // Replace old built-in scenes in saved copies of the general category.
    // Keep administrator-authored questions and answers.
    const general = eightRawQuestions('charades_general').slice(12);
    const moved = eightRawQuestions('charades_imaginary').slice(4);
    const replacements = new Map(general.map((q, i) => [q.uid, { question: q, oldAnswer: moved[i].a }]));
    stored.charades_general = stored.charades_general.map((q) => {
      const replacement = replacements.get(q?.uid);
      return replacement && q.a === replacement.oldAnswer ? replacement.question : q;
    });
  }
  for (const [slug, bundle] of Object.entries(EIGHT_EXPANSION)) {
    if (savedAfterExpansion.has(slug)) continue;
    if (!databaseSlugs.has(slug) && expandedDefaults.has(slug)) {
      stored[slug] = structuredClone(expandedDefaults.get(slug));
      continue;
    }
    const hasSavedList = Array.isArray(stored[slug]);
    const questions = hasSavedList ? stored[slug] : eightRawQuestions(slug);
    if (!questions.length && (hasSavedList || !EIGHT_STADIUM_CATEGORIES.has(slug))) continue;
    const expanded = includeEightExpansion(slug, questions, bundle);
    if (!databaseSlugs.has(slug)) expandedDefaults.set(slug, structuredClone(expanded));
    stored[slug] = expanded;
  }
  for (const [source, target] of Object.entries(EIGHT_CATEGORY_MERGES)) {
    if (savedAfterMerge.has(target) || !stored[source]?.length) continue;
    stored[target] = mergeEightQuestionLists(stored[target] || eightRawQuestions(target), stored[source]);
  }
  const stadiumRoutes = EIGHT_EXPANSION.rebus_football.stadiumRoutes;
  if (Array.isArray(stored.rebus_football)) {
    const savedCups = [];
    for (const q of stored.rebus_football) {
      if (!Object.hasOwn(stadiumRoutes, q?.uid)) {
        savedCups.push(q);
        continue;
      }
      const target = stadiumRoutes[q.uid];
      const destination = stored[target] ||= [];
      const shipped = EIGHT_EXPANSION[target].questions.find(card => card.uid === q.uid);
      const moved = shipped && q.q === 'ما اسم هذا الملعب الشهير؟' ? { ...q, q: shipped.q, a: shipped.a } : q;
      const index = destination.findIndex(card => card?.uid === q.uid);
      if (index < 0) destination.push(moved);
      else if (!databaseSlugs.has(target)) destination[index] = moved;
    }
    const shippedCups = eightRawQuestions('rebus_football');
    const ids = new Set(savedCups.map(q => q?.uid));
    stored.rebus_football = savedCups.concat(shippedCups.filter(q => !ids.has(q.uid)));
  }
  // Stadium cards moved in this release also belong in previously saved destination lists.
  for (const slug of EIGHT_STADIUM_CATEGORIES) {
    if (!savedAfterExpansion.has(slug) || !Array.isArray(stored[slug])) continue;
    const moved = EIGHT_EXPANSION[slug].questions.filter(q => stadiumRoutes[q.uid] === slug);
    stored[slug] = includeEightExpansion(slug, stored[slug], { questions: moved });
  }
  if (databaseSlugs.has('custom_photo_closeup') && Array.isArray(stored.custom_photo_closeup)) {
    const closeups = new Map(SEED.catQuestionsOverrides.custom_photo_closeup.map(q => [q.uid, q]));
    stored.custom_photo_closeup = stored.custom_photo_closeup.map(q => {
      const fresh = closeups.get(q?.uid);
      return fresh && q.am?.u === fresh.am?.u
        ? { ...q, qm: fresh.qm, photoFocus: fresh.photoFocus }
        : q;
    });
  }
  for (const [slug, review] of Object.entries(EIGHT_QUESTION_REVIEW)) {
    const questions = Object.hasOwn(stored, slug) ? stored[slug] : eightRawQuestions(slug);
    if (!Array.isArray(questions) || !questions.length) continue;
    stored[slug] = questions.map((card) => {
      const revision = card && Object.hasOwn(review, card.uid) && review[card.uid];
      if (!revision || card.q !== revision.before.q || card.a !== revision.before.a) return card;
      const corrected = { ...card };
      for (const [field, value] of Object.entries(revision.after)) {
        if (JSON.stringify(card[field] ?? null) !== JSON.stringify(revision.before[field])) continue;
        if (value === null) delete corrected[field];
        else corrected[field] = structuredClone(value);
      }
      return corrected;
    });
  }
  return stored;
}

function questionWords(text) {
  return String(text || '').normalize('NFKD').toLowerCase()
    .replace(/[\p{M}ـ]/gu, '').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[٠-٩۰-۹]/g, (n) => String(n.charCodeAt(0) & 15))
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function mergeEightQuestionLists(target, source) {
  const key = (q) => [questionWords(q.q), questionWords(q.a)].join('\u0000');
  const infoFields = ['qm', 'am', 'img', 'video', 'photo', 'hint', 'info'];
  const merged = target.slice();
  const indices = new Map(target.map((q, index) => [key(q), index]));
  for (const q of source) {
    const index = indices.get(key(q));
    if (index === undefined) {
      indices.set(key(q), merged.length);
      merged.push(q);
      continue;
    }
    const original = merged[index];
    // A second version with different media is useful as a separate question.
    if (infoFields.slice(0, 5).some((field) => original[field] && q[field] &&
      JSON.stringify(original[field]) !== JSON.stringify(q[field]))) {
      merged.push(q);
      continue;
    }
    merged[index] = { ...original };
    for (const field of infoFields) {
      if (!original[field] && q[field]) merged[index][field] = q[field];
    }
  }
  return merged;
}

function includeEightExpansion(slug, questions, { media = [], questions: additions = [] }) {
  const sources = media.map((source) => ({ ...source, key: questionWords(source.answer) }));
  const withMedia = questions.map((q) => {
    const key = questionWords(q?.a);
    if (!key) return q;
    const exact = sources.filter((source) => source.key === key);
    const matches = exact.length ? exact : sources.filter((source) =>
      source.key.length >= 5 && key.length >= 5 &&
      ((' ' + key + ' ').includes(' ' + source.key + ' ') ||
        (' ' + source.key + ' ').includes(' ' + key + ' ')));
    if (matches.length !== 1) return q;
    const source = matches[0];
    const next = { ...q };
    if (!q.qm && !q.img && !q.video && source.qm) next.qm = { t: 'image', u: source.qm };
    if (!q.am && source.am) next.am = { t: 'image', u: source.am };
    return next;
  });
  const questionKey = slug.startsWith('charades_') ? (q) => questionWords(q?.a) : (q) => questionWords(q?.q);
  const indices = new Map(withMedia.map((q, index) => [questionKey(q), index]));
  const indicesById = new Map(withMedia.map((q, index) => [q?.uid, index]));
  for (const { useCategoryPoster, ...q } of additions) {
    const key = questionKey(q);
    const index = indicesById.get(q.uid) ?? indices.get(key);
    if (index !== undefined) {
      const existing = withMedia[index];
      // A previously saved copy still gets the supplied images if the slot is empty
      // and the question and answer still identify the same card.
      if (questionKey(existing) !== key || questionWords(existing.a) !== questionWords(q.a)) continue;
      withMedia[index] = {
        ...existing,
        ...(!existing.qm && !existing.img && !existing.video && q.qm ? { qm: q.qm } : {}),
        ...(!existing.am && q.am ? { am: q.am } : {})
      };
      continue;
    }
    if (useCategoryPoster && !q.qm && EIGHT_POSTERS[slug]) q.qm = { t: 'image', u: EIGHT_POSTERS[slug] };
    indices.set(key, withMedia.length);
    indicesById.set(q.uid, withMedia.length);
    withMedia.push(q);
  }
  return withMedia;
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
  const includesDriveExpansion = Boolean(EIGHT_EXPANSION[slug]);
  const includesCategoryMerge = mergedTargets.has(slug);
  const value = includesDriveExpansion || includesCategoryMerge
    ? { questions, includesDriveExpansion, includesCategoryMerge }
    : questions;
  const json = JSON.stringify(value);
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
  return { games, packages, categories: categories.filter((c) => !c.deleted && !Object.hasOwn(EIGHT_CATEGORY_MERGES, c.slug)), catPosters: EIGHT_POSTERS, settings, gatewayConnected: gatewayConfigured(env), media: mediaLimits(env) };
}
