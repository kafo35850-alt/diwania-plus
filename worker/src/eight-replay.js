// Replay a past Eight board for free: same 8 categories, same questions.
import { requireSession } from './auth.js';
import { HttpError, json, nowIso, nowMs, randomId, randomToken, readJson, sha256Hex, cleanText, underRateLimit } from './util.js';

const ID_RE = /^[A-Za-z0-9_-]{1,120}$/;
const KEEP = 30, PER_LAUNCH = 5;
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

export async function playTokenRow(env, token) {
  if (!token || token.length > 200) return null;
  return env.DB.prepare('SELECT user_id, game_slug, expires_at, launch_key, paid_credits, replay_board FROM play_tokens WHERE token_hash = ?')
    .bind(await sha256Hex(token)).first();
}

// The board of a replay token, for the game page.
export async function replayBoardFor(env, userId, tokenRow) {
  if (!tokenRow || !tokenRow.replay_board) return null;
  const row = await env.DB.prepare('SELECT board_json FROM eight_boards WHERE id = ? AND user_id = ?').bind(tokenRow.replay_board, userId).first();
  return row ? { id: tokenRow.replay_board, ...JSON.parse(row.board_json) } : null;
}

// The game saves the board when a match starts (real launches only, not replays).
export async function saveEightBoard(env, request, url) {
  const session = await requireSession(env, request, { csrf: false });
  if (request.headers.get('origin') !== url.origin) throw new HttpError(403, 'مصدر الطلب غير مسموح.');
  const body = await readJson(request);
  const tok = await playTokenRow(env, typeof body.token === 'string' ? body.token : '');
  if (!tok || tok.user_id !== session.user.id || tok.game_slug !== 'eight' || tok.expires_at < nowMs()) throw new HttpError(403, 'جلسة اللعب غير صالحة.');
  if (tok.replay_board || !tok.launch_key) return json({ ok: true, skipped: true });
  if (!(await underRateLimit(env, 'eight_board:' + session.user.id, 30, 60 * 60 * 1000))) throw new HttpError(429, 'محاولات كثيرة.');
  const cats = Array.isArray(body.cats) ? body.cats.slice(0, 8) : [];
  const clean = cats.map((c) => ({
    id: String(c && c.id || ''), name: cleanText(c && c.name, 80), icon: cleanText(c && c.icon, 8),
    owner: ['team1', 'team2', 'shared'].includes(c && c.owner) ? c.owner : 'shared',
    uids: (Array.isArray(c && c.uids) ? c.uids : []).slice(0, 8).map(String).filter((u) => ID_RE.test(u))
  })).filter((c) => ID_RE.test(c.id) && c.uids.length);
  if (clean.length !== 8) throw new HttpError(400, 'اللوحة غير مكتملة.');
  const launch = await sha256Hex(tok.user_id + ':' + tok.launch_key);
  const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM eight_boards WHERE launch_hash = ?').bind(launch).first();
  if (n && n.n >= PER_LAUNCH) return json({ ok: true, skipped: true });
  const id = randomId('eb');
  await env.DB.batch([
    env.DB.prepare('INSERT INTO eight_boards (id, user_id, launch_hash, board_json, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(id, session.user.id, launch, JSON.stringify({ cats: clean }), nowIso()),
    env.DB.prepare('DELETE FROM eight_boards WHERE user_id = ? AND id NOT IN (SELECT id FROM eight_boards WHERE user_id = ? ORDER BY created_at DESC LIMIT ?)')
      .bind(session.user.id, session.user.id, KEEP)
  ]);
  return json({ ok: true, id });
}

export async function listEightBoards(env, request) {
  const session = await requireSession(env, request, { csrf: false });
  const rows = await env.DB.prepare('SELECT id, board_json, replays, created_at FROM eight_boards WHERE user_id = ? ORDER BY created_at DESC LIMIT ?')
    .bind(session.user.id, KEEP).all();
  return json({ ok: true, boards: rows.results.map((r) => {
    const b = JSON.parse(r.board_json);
    return { id: r.id, created_at: r.created_at, replays: r.replays, cats: b.cats.map((c) => ({ name: c.name, icon: c.icon })) };
  }) });
}

// Free: no credits, no trial, and no «العب واكسب» earnings (paid_credits stays 0).
export async function replayEightBoard(env, request) {
  const session = await requireSession(env, request);
  const body = await readJson(request);
  const id = String(body.boardId || '');
  const row = await env.DB.prepare('SELECT id FROM eight_boards WHERE id = ? AND user_id = ?').bind(id, session.user.id).first();
  if (!row) throw new HttpError(404, 'القيم غير موجود.');
  if (!(await underRateLimit(env, 'eight_replay:' + session.user.id, 30, 60 * 60 * 1000))) throw new HttpError(429, 'محاولات كثيرة، جرّب بعد شوي.');
  const token = randomToken(32);
  await env.DB.batch([
    env.DB.prepare('INSERT INTO play_tokens (token_hash, user_id, game_slug, expires_at, launch_key, paid_credits, replay_board) VALUES (?, ?, ?, ?, ?, 0, ?)')
      .bind(await sha256Hex(token), session.user.id, 'eight', nowMs() + TOKEN_TTL_MS, 'replay:' + id, id),
    env.DB.prepare('UPDATE eight_boards SET replays = replays + 1 WHERE id = ?').bind(id)
  ]);
  return json({ ok: true, playUrl: '/play/eight?t=' + encodeURIComponent(token), gameSlug: 'eight', gameTitle: 'ديوانية الثمانية', isReplay: true });
}
