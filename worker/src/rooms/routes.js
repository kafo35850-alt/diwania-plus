// Routing for real-time rooms, plus the page tweaks that switch the room games from
// their offline bot demo to the real server.
import { HttpError, json, randomToken, sha256Hex, nowMs } from '../util.js';
import { currentSession, requireSession } from '../auth.js';

// Games that ship their own room hub (see scripts/build-room-engines.mjs).
export const ROOM_GAMES = {
  dakhil: { flag: 'DIWANIYA_DEMO', urlVar: 'DIWANIYA_WS_URL', urlIsFunction: true, demoScripts: ['kit/loopback.js', 'games/dakhil/bots.js'] },
  mafia: { flag: 'MAFIA_DEMO', urlVar: 'MAFIA_WS_URL', demoScripts: ['loopback.js'] },
  qaftah: { flag: 'QF_DEMO', urlVar: 'QF_WS_URL', demoScripts: ['qf/loopback.js'] },
  chancellor: { flag: 'SH_DEMO', urlVar: 'SH_WS_URL', demoScripts: ['sh/loopback.js'] },
  harf: { flag: 'DIWANIYA_DEMO', urlVar: 'DIWANIYA_WS_URL', urlIsFunction: true, demoScripts: ['kit/loopback.js', 'games/harf/bots.js'] },
  qaddirha: { flag: 'DIWANIYA_DEMO', urlVar: 'DIWANIYA_WS_URL', urlIsFunction: true, demoScripts: ['kit/loopback.js', 'games/qaddirha/bots.js'] }
};

const GAME_CODE_RE = /^\d{4}$/;
const RELAY_CODE_RE = /^[A-Z0-9-]{3,24}$/;
const BUZZ_CODE_RE = /^[A-Z2-9]{6}$/;
const BUZZ_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export async function verifyPlayToken(env, userId, slug, token) {
  if (!token || token.length > 200) return false;
  const row = await env.DB.prepare('SELECT user_id, game_slug, expires_at FROM play_tokens WHERE token_hash = ?')
    .bind(await sha256Hex(token)).first();
  return !!row && row.user_id === userId && row.game_slug === slug && row.expires_at >= nowMs();
}

function stubFor(ns, name) {
  return ns.get(ns.idFromName(name));
}

export async function gameRoomExists(env, slug, code) {
  if (!ROOM_GAMES[slug] || !GAME_CODE_RE.test(code)) return false;
  const res = await stubFor(env.GAME_HUB, slug).fetch('https://room/exists?game=' + slug + '&code=' + code);
  return !!(await res.json()).exists;
}

export async function relayHostConnected(env, code) {
  code = String(code || '').toUpperCase();
  if (!RELAY_CODE_RE.test(code)) return false;
  const res = await stubFor(env.RELAY_ROOM, code).fetch('https://room/status');
  return !!(await res.json()).hostConnected;
}

// Forwards a browser WebSocket upgrade to a room object with trusted headers only.
function forwardSocket(request, stub, doUrl, trusted) {
  const headers = new Headers(request.headers);
  headers.delete('x-dw-host');
  headers.delete('x-dw-user');
  for (const [k, v] of Object.entries(trusted)) headers.set(k, v);
  return stub.fetch(new Request(doUrl, { method: 'GET', headers }));
}

function checkSocketRequest(request, url) {
  if (request.headers.get('upgrade') !== 'websocket') throw new HttpError(426, 'WebSocket فقط.');
  const origin = request.headers.get('origin');
  if (!origin || origin !== url.origin) throw new HttpError(403, 'مصدر غير مسموح.');
}

function newBuzzCode() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => BUZZ_ALPHABET[b % BUZZ_ALPHABET.length]).join('');
}

// Returns a Response if the path is a room route, otherwise null.
export async function handleRooms(env, request, url) {
  const path = url.pathname;

  // Store room (QR + buzzer for any game): created by a signed-in host.
  if (path === '/api/rooms' && request.method === 'POST') {
    const session = await requireSession(env, request);
    let body = {};
    try { body = await request.json(); } catch (e) { /* empty */ }
    const gameSlug = String(body.gameSlug || '').replace(/[^a-z0-9_]/g, '').slice(0, 40);
    for (let i = 0; i < 6; i++) {
      const code = newBuzzCode();
      const res = await stubFor(env.BUZZER_ROOM, code).fetch('https://room/init', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code, owner: session.user.id, gameSlug })
      });
      if (res.ok) return json({ ok: true, code });
    }
    throw new HttpError(503, 'تعذر إنشاء الغرفة، حاول مرة ثانية.');
  }

  let m = path.match(/^\/rooms\/buzz\/([A-Z2-9]{6})\/ws$/);
  if (m) {
    checkSocketRequest(request, url);
    const session = await currentSession(env, request);
    return forwardSocket(request, stubFor(env.BUZZER_ROOM, m[1]), 'https://room/ws', { 'x-dw-user': session ? session.user.id : '' });
  }

  m = path.match(/^\/rooms\/game\/([a-z0-9_]{2,40})\/ws$/);
  if (m) {
    const slug = m[1];
    if (!ROOM_GAMES[slug]) throw new HttpError(404, 'اللعبة ما تدعم الغرف.');
    checkSocketRequest(request, url);
    const session = await currentSession(env, request);
    const token = url.searchParams.get('t') || '';
    const host = !!(session && token && await verifyPlayToken(env, session.user.id, slug, token));
    return forwardSocket(request, stubFor(env.GAME_HUB, slug), 'https://room/ws?game=' + slug, { 'x-dw-host': host ? '1' : '0' });
  }

  if (path === '/rooms/relay/ws') {
    const code = String(url.searchParams.get('room') || '').toUpperCase();
    if (!RELAY_CODE_RE.test(code)) throw new HttpError(400, 'رمز غرفة غير صالح.');
    checkSocketRequest(request, url);
    const session = await currentSession(env, request);
    const token = url.searchParams.get('t') || '';
    const host = !!(session && token && await verifyPlayToken(env, session.user.id, 'eight', token));
    return forwardSocket(request, stubFor(env.RELAY_ROOM, code), 'https://room/ws', { 'x-dw-host': host ? '1' : '0' });
  }

  if (path === '/api/rooms/status') {
    const code = String(url.searchParams.get('code') || '').toUpperCase();
    if (!BUZZ_CODE_RE.test(code)) return json({ ok: true, exists: false });
    const res = await stubFor(env.BUZZER_ROOM, code).fetch('https://room/status');
    return json(await res.json());
  }

  return null;
}

// ---------------------------------------------------------------------------
// Page tweaks

function wsOrigin(url) {
  return url.origin.replace(/^http/, 'ws');
}

function removeScriptBlock(html, name) {
  const marker = '<script>/* ' + name + ' */';
  const start = html.indexOf(marker);
  if (start === -1) return html;
  const end = html.indexOf('</script>', start);
  return html.slice(0, start) + html.slice(end + '</script>'.length);
}

// Room games: point them at the real server and drop the offline bots (unless the host asked for ?demo=1).
export function prepareRoomGame(html, slug, url, { token, demo }) {
  const cfg = ROOM_GAMES[slug];
  if (!cfg || demo) return html;
  const ws = wsOrigin(url) + '/rooms/game/' + slug + '/ws' + (token ? '?t=' + encodeURIComponent(token) : '');
  const value = cfg.urlIsFunction ? 'function () { return ' + JSON.stringify(ws) + '; }' : JSON.stringify(ws);
  html = html.replace('<script>window.' + cfg.flag + '=true;</script>',
    '<script>window.' + cfg.flag + '=false;window.' + cfg.urlVar + '=' + value + ';</script>');
  for (const name of cfg.demoScripts) html = removeScriptBlock(html, name);
  return html;
}

// Eight Challenge: phones join the buzzer through the relay; guests get the page without the question bank.
export function prepareEight(html, url, { token, guest }) {
  const ws = wsOrigin(url) + '/rooms/relay/ws' + (token ? '?t=' + encodeURIComponent(token) : '');
  html = html.replace(/<head([^>]*)>/i, (m0) => m0 + '\n<script>window.DIWANIYA_WS_URL = ' + JSON.stringify(ws) + ';</script>');
  // Share links carry the room in the query too, so the server can let guests in.
  html = html.replace(
    'return `${root}#buzzer=${encodeURIComponent(state.buzzerRoom.roomCode)}`;',
    'return `${root}?buzzer=${encodeURIComponent(state.buzzerRoom.roomCode)}#buzzer=${encodeURIComponent(state.buzzerRoom.roomCode)}`;'
  );
  if (guest) html = html.replace(/<script type="application\/json" id="m8_cat_[^"]*">[\s\S]*?<\/script>/g, '');
  return html;
}

export { randomToken };
