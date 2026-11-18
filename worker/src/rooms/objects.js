// Real-time multiplayer rooms (Cloudflare Durable Objects).
//
//  GameHubDO    one instance per room game (dakhil, mafia, qaftah, chancellor). Runs the game's own
//               hub + engine (extracted from the game file), so the rules are identical to the page.
//  RelayRoomDO  one instance per Eight-Challenge buzzer room: relays each message to the other phones.
//  BuzzerRoomDO one instance per store room (QR + buzzer + answers for any game). Server-authoritative.
//
// Connections use the standard WebSocket API (not hibernation) so in-memory game state and timers
// stay alive while anyone is connected.
import { ROOM_ENGINES } from './engines.generated.js';
import { getDoc } from '../catalog.js';
import { randomToken } from '../util.js';

const MAX_MESSAGE_CHARS = 8000;

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
}

// Accepts a WebSocket and wraps it in the { send, close } connection object the hubs expect.
function openSocket(onMessage, onGone) {
  const pair = new WebSocketPair();
  const client = pair[0];
  const server = pair[1];
  server.accept();
  const conn = {
    closed: false, pid: null, code: null, board: false,
    send(obj) {
      if (conn.closed) return;
      try { server.send(JSON.stringify(obj)); } catch (e) { /* socket already gone */ }
    },
    close(code) {
      if (conn.closed) return;
      conn.closed = true;
      try { server.close(code || 1000, 'closed'); } catch (e) { /* ignore */ }
      gone();
    }
  };
  let budget = 40;                // simple flood guard: ~20 messages/second sustained
  let refill = Date.now();
  let goneCalled = false;
  function gone() { if (goneCalled) return; goneCalled = true; conn.closed = true; onGone(conn); }
  server.addEventListener('message', (ev) => {
    const now = Date.now();
    budget = Math.min(40, budget + ((now - refill) / 1000) * 20);
    refill = now;
    if (budget < 1) return;
    budget -= 1;
    if (typeof ev.data !== 'string' || ev.data.length > MAX_MESSAGE_CHARS) return;
    let msg;
    try { msg = JSON.parse(ev.data); } catch (e) { return; }
    if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return;
    try { onMessage(conn, msg, ev.data); } catch (e) { console.error('room message error', e && e.stack ? e.stack : e); }
  });
  server.addEventListener('close', gone);
  server.addEventListener('error', gone);
  return { conn, response: new Response(null, { status: 101, webSocket: client }) };
}

// ---------------------------------------------------------------------------
export class GameHubDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.hub = null;
    this.E = null;
    this.slug = null;
    this.timer = null;
    this.live = 0;
    this.contentLoadedAt = 0;
  }

  ensure(slug) {
    if (this.hub) return;
    const { Hub, E } = ROOM_ENGINES[slug]();
    this.slug = slug;
    this.E = E;
    this.hub = Hub.createHub({
      E,
      rng: Math.random,
      allowDev: false,
      maxRooms: 400,
      randInt: (a, b) => a + Math.floor(Math.random() * (b - a)),
      token: () => randomToken(18)
    });
  }

  tickLoop() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      try { this.hub.tick(); } catch (e) { console.error('hub tick', e); }
      if (this.live === 0 && this.hub.rooms.size === 0) { clearInterval(this.timer); this.timer = null; }
    }, 500);
  }

  // Owner-edited Qaftah questions join the built-in bank (same merge the page does).
  async refreshContent() {
    if (this.slug !== 'qaftah' || Date.now() - this.contentLoadedAt < 5 * 60 * 1000) return;
    this.contentLoadedAt = Date.now();
    try {
      const items = (await getDoc(this.env, 'game_content')).filter((x) => x.game_id === 'game_qaftah' && x.is_active !== 0);
      const Q = this.E.QUESTIONS;
      if (!Array.isArray(Q)) return;
      for (const it of items) {
        let q = it.prompt_text || it.q;
        const truth = it.answer_text || it.truth;
        if (!q || !truth) continue;
        if (q.indexOf('_____') === -1) q += ' _____';
        const decoys = Array.isArray(it.options) && it.options.length ? it.options : ['خيار مموه ١', 'خيار مموه ٢', 'خيار مموه ٣', 'خيار مموه ٤'];
        const existing = Q.find((x) => x.id === it.id);
        if (existing) Object.assign(existing, { q, truth, info: it.extra_info || '', decoys });
        else Q.unshift({ id: String(it.id), cat: it.cat || 'سوالف ومواقف', q, truth, info: it.extra_info || '', decoys });
      }
    } catch (e) {
      console.error('qaftah content refresh failed', e);
    }
  }

  async fetch(request) {
    const url = new URL(request.url);
    const slug = url.searchParams.get('game');
    if (!ROOM_ENGINES[slug]) return jsonResponse({ ok: false }, 400);
    this.ensure(slug);

    if (url.pathname === '/exists') {
      return jsonResponse({ ok: true, exists: this.hub.rooms.has(String(url.searchParams.get('code') || '')) });
    }
    if (request.headers.get('upgrade') !== 'websocket') return jsonResponse({ ok: false }, 426);

    const canHost = request.headers.get('x-dw-host') === '1';
    let created = 0;
    const { response } = openSocket((conn, m) => {
      if (m.t === 'create') {
        if (!canHost || created >= 3) {
          return conn.send({ t: 'err', err: 'إنشاء الغرفة للمضيف فقط — شغّل اللعبة من المتجر، أو ادخل برمز الغرفة' });
        }
        created++;
        m.dev = false;
        return this.refreshContent().then(() => { if (!conn.closed) this.hub.message(conn, m); this.tickLoop(); });
      }
      this.hub.message(conn, m);
      this.tickLoop();
    }, (conn) => {
      this.live = Math.max(0, this.live - 1);
      this.hub.closed(conn);
    });
    this.live++;
    this.tickLoop();
    return response;
  }
}

// ---------------------------------------------------------------------------
export class RelayRoomDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.conns = new Set();
  }

  hostConnected() {
    for (const c of this.conns) if (c.isHost && !c.closed) return true;
    return false;
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/status') return jsonResponse({ ok: true, hostConnected: this.hostConnected(), size: this.conns.size });
    if (request.headers.get('upgrade') !== 'websocket') return jsonResponse({ ok: false }, 426);
    if (this.conns.size >= 80) return jsonResponse({ ok: false, error: 'room_full' }, 429);

    const isHost = request.headers.get('x-dw-host') === '1';
    // Every message goes to the other phones of the same room (the Eight buzzer protocol
    // carries its own room code, client id and message id, and drops duplicates).
    const { conn, response } = openSocket((from, m) => {
      for (const c of this.conns) if (c !== from) c.send(m);
    }, (c) => { this.conns.delete(c); });
    conn.isHost = isHost;
    this.conns.add(conn);
    return response;
  }
}

// ---------------------------------------------------------------------------
const MAX_PLAYERS = 60;

function cleanStr(v, max) { return String(v == null ? '' : v).trim().slice(0, max); }

export class BuzzerRoomDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.room = null;     // persisted
    this.conns = new Set();
    this.loaded = false;
  }

  async load() {
    if (this.loaded) return;
    this.room = (await this.state.storage.get('room')) || null;
    this.loaded = true;
  }

  save() {
    // Persist so the room survives the object being evicted between rounds.
    this.room.updatedAt = Date.now();
    return this.state.storage.put('room', this.room);
  }

  publicState() {
    const r = this.room;
    const online = new Set([...this.conns].filter((c) => !c.closed && c.pid).map((c) => c.pid));
    return {
      code: r.code,
      gameSlug: r.gameSlug,
      currentPrompt: r.currentPrompt,
      buzzerLockedBy: r.buzzerOrder[0] || null,
      buzzerOrder: r.buzzerOrder,
      players: r.players.map((p) => ({
        id: p.id, name: p.name, team: p.team, score: p.score,
        lastAnswer: p.lastAnswer, lastVote: p.lastVote, connected: online.has(p.id), isBot: false
      }))
    };
  }

  broadcast() {
    const msg = { t: 'state', room: this.publicState() };
    for (const c of this.conns) c.send(msg);
  }

  async fetch(request) {
    await this.load();
    const url = new URL(request.url);

    if (url.pathname === '/init' && request.method === 'POST') {
      const body = await request.json();
      if (this.room && this.room.owner !== body.owner) return jsonResponse({ ok: false, error: 'taken' }, 409);
      if (!this.room) {
        this.room = {
          code: body.code, owner: body.owner, gameSlug: cleanStr(body.gameSlug, 40) || 'eight',
          currentPrompt: 'اضغط الجرس أو أرسل إجابتك من جوالك فور ظهور السؤال على الشاشة!',
          players: [], tokens: {}, buzzerOrder: [], createdAt: Date.now()
        };
      } else if (body.gameSlug) {
        this.room.gameSlug = cleanStr(body.gameSlug, 40);
      }
      await this.save();
      return jsonResponse({ ok: true, code: this.room.code });
    }
    if (url.pathname === '/status') return jsonResponse({ ok: true, exists: !!this.room });

    if (request.headers.get('upgrade') !== 'websocket') return jsonResponse({ ok: false }, 426);
    if (!this.room) return jsonResponse({ ok: false, error: 'no_room' }, 404);
    if (this.conns.size >= MAX_PLAYERS + 10) return jsonResponse({ ok: false, error: 'room_full' }, 429);

    const isHost = !!request.headers.get('x-dw-user') && request.headers.get('x-dw-user') === this.room.owner;
    const { conn, response } = openSocket((c, m) => this.onMessage(c, m), (c) => {
      this.conns.delete(c);
      this.broadcast();
    });
    conn.isHost = isHost;
    this.conns.add(conn);
    conn.send({ t: 'hello', host: isHost });
    conn.send({ t: 'state', room: this.publicState() });
    return response;
  }

  async onMessage(conn, m) {
    const r = this.room;
    const err = (e) => conn.send({ t: 'err', err: e });
    const me = () => r.players.find((p) => p.id === conn.pid);
    switch (m.t) {
      case 'resume': {
        const pid = r.tokens[String(m.token || '')];
        if (!pid || !r.players.some((p) => p.id === pid)) return err('bad_token');
        conn.pid = pid;
        conn.send({ t: 'me', id: pid, token: m.token });
        return this.broadcast();
      }
      case 'join': {
        if (conn.pid) return err('already_joined');
        const name = cleanStr(m.name, 30);
        if (!name) return err('اكتب اسمك أولاً');
        if (r.players.length >= MAX_PLAYERS) return err('الغرفة ممتلئة');
        const id = 'p_' + randomToken(6);
        const token = randomToken(18);
        r.players.push({ id, name, team: cleanStr(m.team, 30) || 'الفريق الأول 🔵', score: 0, lastAnswer: '', lastVote: '' });
        r.tokens[token] = id;
        conn.pid = id;
        await this.save();
        conn.send({ t: 'me', id, token });
        return this.broadcast();
      }
      case 'buzz': {
        const p = me();
        if (!p) return err('ادخل الغرفة أولاً');
        if (r.buzzerOrder.some((b) => b.playerId === p.id)) return;
        r.buzzerOrder.push({ playerId: p.id, name: p.name, team: p.team, rank: r.buzzerOrder.length + 1, timestampMs: Date.now() });
        await this.save();
        return this.broadcast();
      }
      case 'answer':
      case 'vote': {
        const p = me();
        if (!p) return err('ادخل الغرفة أولاً');
        if (m.t === 'answer') p.lastAnswer = cleanStr(m.text, 200);
        else p.lastVote = cleanStr(m.text, 100);
        await this.save();
        return this.broadcast();
      }
      case 'leave': {
        const p = me();
        if (!p) return;
        r.players = r.players.filter((x) => x.id !== p.id);
        for (const k of Object.keys(r.tokens)) if (r.tokens[k] === p.id) delete r.tokens[k];
        conn.pid = null;
        await this.save();
        conn.send({ t: 'left' });
        return this.broadcast();
      }
      // ---- host only
      case 'reset':
      case 'prompt':
      case 'kick':
      case 'score':
      case 'game': {
        if (!conn.isHost) return err('هذا الإجراء للمضيف فقط');
        if (m.t === 'reset') r.buzzerOrder = [];
        if (m.t === 'prompt') r.currentPrompt = cleanStr(m.text, 300);
        if (m.t === 'game') r.gameSlug = cleanStr(m.slug, 40) || r.gameSlug;
        if (m.t === 'score') {
          const p = r.players.find((x) => x.id === m.id);
          if (p) p.score = Math.max(-99999, Math.min(99999, p.score + (parseInt(m.delta, 10) || 0)));
        }
        if (m.t === 'kick') {
          r.players = r.players.filter((x) => x.id !== m.id);
          r.buzzerOrder = r.buzzerOrder.filter((b) => b.playerId !== m.id);
          for (const k of Object.keys(r.tokens)) if (r.tokens[k] === m.id) delete r.tokens[k];
          for (const c of this.conns) if (c.pid === m.id) { c.pid = null; c.send({ t: 'kicked' }); }
        }
        await this.save();
        return this.broadcast();
      }
      case 'ping':
        return conn.send({ t: 'pong' });
      default:
        return err('bad_message');
    }
  }
}
