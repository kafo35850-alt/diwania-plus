// Admin-editable catalog documents. Anything the owner has not edited yet
// falls back to the defaults bundled in seed.json.
import SEED from './seed.json';
import { nowIso } from './util.js';
import { gatewayConfigured } from './payments.js';

export const DOC_KEYS = ['games', 'packages', 'categories', 'game_content', 'suggestions', 'catQuestionsOverrides'];

export async function getDoc(env, key) {
  const row = await env.DB.prepare('SELECT json FROM docs WHERE key = ?').bind(key).first();
  if (row) return JSON.parse(row.json);
  return structuredClone(SEED[key]);
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
  const [games, packages, categories, suggestions] = await Promise.all([
    getGamesWithStats(env),
    getDoc(env, 'packages'),
    getDoc(env, 'categories'),
    getDoc(env, 'suggestions')
  ]);
  return { games, packages, categories, suggestions, gatewayConnected: gatewayConfigured(env) };
}
