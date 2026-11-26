/* ديوانية بلس — خمّن الشخصية: محرك اللعبة (منطق صرف، يشتغل في Node والمتصفح وCloudflare).
 * لاعبين اثنين قدامهم نفس لوحة الشخصيات. كل واحد يختار شخصية سرية.
 * بالدور: تسأل سؤال جوابه «نعم» أو «لا»، خصمك يجاوب، وأنت تنزّل البطاقات اللي ما تنطبق.
 * إذا عرفت شخصيته اضغط «أخمّن» واختارها: صح = تفوز بالجولة، غلط = تنزل البطاقة وينتقل الدور.
 * المراحل: lobby → pick → play (ask → answer → flip) → result → … → ended */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root.DiwaniyaLobby, root.MG.fooq_rasakData);
  else { root.MG = root.MG || {}; root.MG.fooq_rasak = factory(root.DiwaniyaLobby, root.MG.fooq_rasakData); }
})(typeof self !== 'undefined' ? self : this, function (L, D) {
  'use strict';
  const MIN = 2, MAX = 2;
  const ALLOWED = { set: D.ORDER, size: [20, 30], rounds: [1, 3, 5] };
  const ok = L.ok, fail = L.fail, byId = L.byId;

  function createGame(code) {
    const g = L.base(code, { min: MIN, max: MAX, settings: { set: 'animals', size: 30, rounds: 3 } });
    Object.assign(g, { board: [], secret: {}, down: {}, turn: null, step: null, q: null, history: [], winner: null, starter: 0, wins: {}, lastGuess: null });
    return g;
  }
  const join = (g, name) => L.join(g, name);
  const other = (g, id) => (g.players.find((p) => p.id !== id) || {}).id || null;

  function newRound(g, now, rng) {
    g.round++;
    const pool = L.shuffle(D.pool(g.settings.set), rng);
    g.board = pool.slice(0, Math.min(g.settings.size, pool.length));
    g.secret = {}; g.down = {}; g.history = []; g.q = null; g.winner = null; g.lastGuess = null; g.step = null; g.turn = null;
    g.players.forEach((p) => { g.down[p.id] = g.board.map(() => false); });
    L.setPhase(g, 'pick', now, 0); L.ev(g, { k: 'pick' });
  }
  function start(g, hostId, now, rng) {
    if (g.hostId !== hostId) return fail('not_host'); if (g.phase !== 'lobby') return fail('already_started');
    if (L.need(g) > 0) return fail('need_players');
    g.round = 0; g.starter = Math.floor(rng() * 2); g.players.forEach((p) => { p.score = 0; });
    newRound(g, now, rng); return ok();
  }
  function pick(g, id, i, now) {
    if (g.phase !== 'pick') return fail('bad_phase'); i = Number(i);
    if (!byId(g, id) || !(i >= 0 && i < g.board.length)) return fail('bad_target');
    g.secret[id] = i;
    if (g.players.every((p) => g.secret[p.id] !== undefined)) {
      g.turn = g.players[(g.starter + g.round - 1) % g.players.length].id; g.step = 'ask';
      L.setPhase(g, 'play', now, 0); L.ev(g, { k: 'play', id: g.turn });
    }
    return ok();
  }
  function ask(g, id, text) {
    if (g.phase !== 'play' || g.step !== 'ask') return fail('bad_phase'); if (id !== g.turn) return fail('not_your_turn');
    g.q = { by: id, text: L.cleanText(text, 80), ans: null }; g.step = 'answer'; L.ev(g, { k: 'ask', id });
    return ok();
  }
  function answer(g, id, v) {
    if (g.phase !== 'play' || g.step !== 'answer') return fail('bad_phase'); if (id === g.turn) return fail('not_your_turn');
    if (v !== 'yes' && v !== 'no') return fail('bad_vote');
    g.q.ans = v; g.history.push({ by: g.q.by, text: g.q.text, ans: v }); if (g.history.length > 40) g.history.shift();
    g.step = 'flip'; L.ev(g, { k: 'answer', ans: v }); return ok();
  }
  function flip(g, id, i) {
    if (g.phase !== 'play') return fail('bad_phase'); i = Number(i);
    if (!g.down[id] || !(i >= 0 && i < g.board.length)) return fail('bad_target');
    g.down[id][i] = !g.down[id][i]; return ok();
  }
  function passTurn(g) { g.turn = other(g, g.turn); g.step = 'ask'; g.q = null; }
  function endTurn(g, id) {
    if (g.phase !== 'play' || g.step !== 'flip') return fail('bad_phase'); if (id !== g.turn) return fail('not_your_turn');
    passTurn(g); L.ev(g, { k: 'turn', id: g.turn }); return ok();
  }
  function guess(g, id, i, now) {
    if (g.phase !== 'play' || g.step === 'answer') return fail('bad_phase'); if (id !== g.turn) return fail('not_your_turn');
    i = Number(i); if (!(i >= 0 && i < g.board.length)) return fail('bad_target');
    const opp = other(g, id);
    if (g.secret[opp] === i) {
      g.winner = id; const p = byId(g, id); if (p) p.score += 1;
      g.lastGuess = { by: id, i, ok: true };
      L.setPhase(g, 'result', now, 0); L.ev(g, { k: 'win', id });
    } else {
      g.down[id][i] = true; g.lastGuess = { by: id, i, ok: false };
      g.history.push({ by: id, guess: i, ans: 'wrong' });
      passTurn(g); L.ev(g, { k: 'wrong', id });
    }
    return ok();
  }
  function next(g, id, now, rng) {
    if (g.hostId !== id) return fail('not_host'); if (g.phase !== 'result') return fail('bad_phase');
    const need = Math.floor(g.settings.rounds / 2) + 1;
    if (g.round >= g.settings.rounds || g.players.some((p) => p.score >= need)) { L.setPhase(g, 'ended', now, 0); return ok(); }
    newRound(g, now, rng); return ok();
  }
  function skip(g, id) {
    if (g.hostId !== id) return fail('not_host');
    if (g.phase === 'play') { passTurn(g); L.ev(g, { k: 'turn', id: g.turn }); return ok(); }
    return fail('bad_phase');
  }
  const tick = () => false;
  function act(g, id, m, now, rng) {
    switch (m.a) {
      case 'pick': return pick(g, id, m.i, now);
      case 'ask': return ask(g, id, m.text);
      case 'answer': return answer(g, id, m.v);
      case 'flip': return flip(g, id, m.i);
      case 'endturn': return endTurn(g, id);
      case 'guess': return guess(g, id, m.i, now);
      case 'skip': return skip(g, id);
      case 'next': return next(g, id, now, rng);
      case 'again': { if (g.hostId !== id) return fail('not_host'); if (g.phase !== 'ended') return fail('bad_phase'); g.round = 0; g.players.forEach((p) => { p.score = 0; }); newRound(g, now, rng); return ok(); }
      case 'lobby': return L.toLobby(g, id);
      case 'settings': return L.setSettings(g, id, m.patch || {}, ALLOWED);
      default: return fail('bad_action');
    }
  }

  function viewFor(g, pid, now) {
    const v = L.baseView(g, now), inGame = g.phase !== 'lobby';
    v.setNames = D.NAMES; v.setOrder = D.ORDER; v.rounds = g.settings.rounds;
    if (inGame) {
      const open = g.phase === 'result' || g.phase === 'ended';
      v.board = g.board.map((c) => ({ n: c.n, m: c.m || '', e: c.e || '' }));
      v.turn = g.turn; v.step = g.step; v.q = g.q; v.history = g.history.slice(-8); v.winner = g.winner; v.lastGuess = g.lastGuess;
      v.left = {}; g.players.forEach((p) => { v.left[p.id] = (g.down[p.id] || []).filter((x) => !x).length; });
      v.picked = {}; g.players.forEach((p) => { v.picked[p.id] = g.secret[p.id] !== undefined; });
      if (open) { v.secrets = {}; g.players.forEach((p) => { v.secrets[p.id] = g.secret[p.id]; }); }
    }
    const p = pid && byId(g, pid);
    if (p) {
      v.me = { id: p.id, name: p.name, host: g.hostId === p.id, opp: other(g, p.id) };
      if (inGame) { v.me.secret = g.secret[p.id] === undefined ? null : g.secret[p.id]; v.me.down = (g.down[p.id] || []).slice(); }
    }
    return v;
  }
  return Object.assign({ MIN, MAX, ALLOWED, createGame, join, start, tick, act, viewFor }, { leave: L.leave, kick: L.kick, setConnected: L.setConnected, need: L.need, byId: L.byId });
});
