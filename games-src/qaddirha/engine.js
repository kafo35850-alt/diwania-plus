/* ديوانية بلس — قدّرها: محرك اللعبة (منطق صرف، يشتغل في Node والمتصفح وCloudflare).
 * سؤال جوابه رقم، وكل لاعب يكتب تقديره بجواله. الأقرب يفوز.
 * النقاط: الأقرب ٣، الثاني ٢، الثالث ١ (المتعادلين ياخذون نفس النقاط)، والإصابة شبه الدقيقة (±١٪) +٢.
 * المراحل: lobby → guess → reveal → … → ended */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root.DiwaniyaLobby, root.MG.qaddirhaData);
  else { root.MG = root.MG || {}; root.MG.qaddirha = factory(root.DiwaniyaLobby, root.MG.qaddirhaData); }
})(typeof self !== 'undefined' ? self : this, function (L, D) {
  'use strict';
  const MIN = 2, MAX = 60;
  const ALLOWED = { rounds: [5, 8, 12], sec: [30, 45, 60] };
  const RANK_PTS = [3, 2, 1], EXACT_BONUS = 2;
  const ok = L.ok, fail = L.fail, byId = L.byId;
  const live = (g) => g.players.filter((p) => p.connected);

  function createGame(code) {
    const g = L.base(code, { min: MIN, max: MAX, settings: { rounds: 8, sec: 45 } });
    Object.assign(g, { q: null, used: [], guesses: {}, result: null });
    return g;
  }
  const join = (g, name) => L.join(g, name);

  function start(g, hostId, now, rng) {
    if (g.hostId !== hostId) return fail('not_host'); if (g.phase !== 'lobby') return fail('already_started');
    if (L.need(g) > 0) return fail('need_players');
    g.round = 0; g.players.forEach((p) => { p.score = 0; });
    newRound(g, now, rng); return ok();
  }
  function newRound(g, now, rng) {
    g.round++;
    const idx = D.Q.map((_, i) => i).filter((i) => g.used.indexOf(i) < 0);
    if (!idx.length) g.used = [];
    const pool = idx.length ? idx : D.Q.map((_, i) => i);
    const pick = pool[Math.floor(rng() * pool.length)];
    g.used.push(pick); g.q = D.Q[pick]; g.guesses = {}; g.result = null;
    L.setPhase(g, 'guess', now, g.settings.sec * 1000);
    L.ev(g, { k: 'round' });
  }
  function guess(g, id, value, now) {
    if (g.phase !== 'guess') return fail('bad_phase');
    const n = Number(String(value).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[,٬\s]/g, '').replace('٫', '.'));
    if (!isFinite(n) || Math.abs(n) > 1e12) return fail('bad_number');
    g.guesses[id] = n;
    if (live(g).every((p) => g.guesses[p.id] !== undefined)) reveal(g, now);
    return ok();
  }
  function reveal(g, now) {
    const a = g.q.a, rows = Object.keys(g.guesses).filter((id) => byId(g, id)).map((id) => ({ id, value: g.guesses[id], dist: Math.abs(g.guesses[id] - a) }));
    rows.sort((x, y) => x.dist - y.dist);
    const delta = {}; g.players.forEach((p) => { delta[p.id] = 0; });
    let rank = 0, prevDist = null;
    rows.forEach((r, i) => {
      if (prevDist === null || r.dist !== prevDist) rank = i;
      prevDist = r.dist; r.rank = rank + 1;
      let pts = RANK_PTS[rank] || 0;
      r.exact = a === 0 ? r.dist === 0 : r.dist / Math.abs(a) <= 0.01;
      if (r.exact) pts += EXACT_BONUS;
      r.pts = pts; delta[r.id] = pts;
    });
    g.players.forEach((p) => { p.score += delta[p.id]; });
    g.result = { answer: a, rows, delta };
    L.setPhase(g, 'reveal', now, 0); L.ev(g, { k: 'reveal' });
  }
  function next(g, id, now, rng) {
    if (g.hostId !== id) return fail('not_host'); if (g.phase !== 'reveal') return fail('bad_phase');
    if (g.round >= g.settings.rounds) { L.setPhase(g, 'ended', now, 0); return ok(); }
    newRound(g, now, rng); return ok();
  }
  function skip(g, id, now, rng) {
    if (g.hostId !== id) return fail('not_host');
    if (g.phase === 'guess') { reveal(g, now); return ok(); }
    if (g.phase === 'reveal') return next(g, id, now, rng);
    return fail('bad_phase');
  }
  function tick(g, now) {
    if (g.phase === 'guess' && g.deadline && now >= g.deadline) { reveal(g, now); return true; }
    return false;
  }
  function act(g, id, m, now, rng) {
    switch (m.a) {
      case 'guess': return guess(g, id, m.value, now);
      case 'skip': return skip(g, id, now, rng);
      case 'next': return next(g, id, now, rng);
      case 'again': { if (g.hostId !== id) return fail('not_host'); if (g.phase !== 'ended') return fail('bad_phase'); g.round = 0; g.players.forEach((p) => { p.score = 0; }); newRound(g, now, rng); return ok(); }
      case 'lobby': return L.toLobby(g, id);
      case 'settings': return L.setSettings(g, id, m.patch || {}, ALLOWED);
      default: return fail('bad_action');
    }
  }
  function viewFor(g, pid, now) {
    const v = L.baseView(g, now), inGame = g.phase !== 'lobby';
    v.rounds = g.settings.rounds;
    v.players.forEach((p) => { p.answered = g.guesses[p.id] !== undefined; });
    if (inGame && g.q) {
      v.question = { c: g.q.c, q: g.q.q, u: g.q.u, y: !!g.q.y };
      v.answeredCount = live(g).filter((p) => g.guesses[p.id] !== undefined).length; v.liveCount = live(g).length;
      if (g.phase === 'reveal' || g.phase === 'ended') { v.result = g.result; v.question.i = g.q.i; }
    }
    const p = pid && byId(g, pid);
    if (p) {
      v.me = { id: p.id, name: p.name, host: g.hostId === p.id };
      if (inGame) v.me.guess = g.guesses[p.id] === undefined ? null : g.guesses[p.id];
    }
    return v;
  }
  return Object.assign({ MIN, MAX, ALLOWED, createGame, join, start, tick, act, viewFor }, { leave: L.leave, kick: L.kick, setConnected: L.setConnected, need: L.need, byId: L.byId });
});
