import { mediaLimits } from './media.js';
// Admin-editable catalog documents. Anything the owner has not edited yet
// falls back to the defaults bundled in seed.json.
import SEED from './seed.json';
import { nowIso } from './util.js';
import { gatewayConfigured } from './payments.js';

export const DOC_KEYS = ['games', 'packages', 'categories', 'game_content', 'suggestions', 'catQuestionsOverrides'];

export async function getDoc(env, key) {
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
    // …and so do their questions. A ready-made category nobody edited also gets the newer shipped questions.
    if (key === 'catQuestionsOverrides' && stored && typeof stored === 'object') {
      for (const [slug, list] of Object.entries(SEED.catQuestionsOverrides || {})) {
        if (!(slug in stored) || isUntouchedOlderSeed(slug, stored[slug], list)) stored[slug] = structuredClone(list);
      }
    }
    if (key === 'categories' && Array.isArray(stored)) {
      for (const c of stored) {
        const fresh = SEED.catQuestionsOverrides && SEED.catQuestionsOverrides[c.slug];
        if (fresh && (c.item_count || 0) < fresh.length) c.item_count = fresh.length;
      }
    }
    return stored;
  }
  return structuredClone(SEED[key]);
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

export async function putDoc(env, key, value) {
  await env.DB.prepare(
    'INSERT INTO docs (key, json, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at'
  ).bind(key, JSON.stringify(value), nowIso()).run();
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
  return { games, packages, categories: categories.filter((c) => !c.deleted), gatewayConnected: gatewayConfigured(env), media: mediaLimits(env) };
}
