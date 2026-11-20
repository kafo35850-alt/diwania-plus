/* ديوانية بلس — رسّام الديوانية (وضع برا السالفة): محرك اللعبة (منطق صرف، يشتغل في Node والمتصفح وCloudflare).
 * الكل يعرف الكلمة إلا واحد «برا السالفة». كل لاعب بدوره يرسم خط واحد بس بجواله، ويكمّل على رسمة اللي قبله.
 * بعد اللفّات يصوّت الكل على اللي برا السالفة. إذا انكشف، يحاول يخمّن الكلمة.
 * النقاط: برا السالفة ما انكشف = ٣ له. انكشف وخمّن الكلمة صح = ٣ له. انكشف وخمّن غلط = ٢ لكل واحد ثاني.
 * المراحل: lobby → word → draw → vote → guess → result → … → ended */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root.DiwaniyaLobby, root.MG.draw_guessData);
  else { root.MG = root.MG || {}; root.MG.draw_guess = factory(root.DiwaniyaLobby, root.MG.draw_guessData); }
})(typeof self !== 'undefined' ? self : this, function (L, D) {
  'use strict';
  const MIN = 3, MAX = 12, WORD_MS = 20000, VOTE_MS = 60000, GUESS_MS = 30000, MAX_PTS = 400;
  const ALLOWED = { rounds: [3, 5, 8], laps: [1, 2, 3], turn: [20, 30, 45] };
  const ok = L.ok, fail = L.fail, byId = L.byId;
  const live = (g) => g.players.filter((p) => p.connected);

  function createGame(code) {
    const g = L.base(code, { min: MIN, max: MAX, settings: { rounds: 5, laps: 2, turn: 30 } });
    Object.assign(g, { cat: null, word: null, outsider: null, order: [], turnIdx: 0, strokes: [], ready: {}, votes: {}, accused: null, guess: null, options: [], result: null, usedWords: [] });
    return g;
  }
  const join = (g, name) => L.join(g, name);

  function start(g, hostId, now, rng) {
    if (g.hostId !== hostId) return fail('not_host'); if (g.phase !== 'lobby') return fail('already_started');
    if (L.need(g) > 0) return fail('need_players');
    g.round = 0; g.usedWords = []; g.players.forEach((p) => { p.score = 0; });
    newRound(g, now, rng); return ok();
  }
  function newRound(g, now, rng) {
    g.round++;
    const cat = D.CATS[Math.floor(rng() * D.CATS.length)];
    const fresh = cat.w.filter((w) => g.usedWords.indexOf(w) < 0), pool = fresh.length ? fresh : cat.w;
    g.cat = cat.c; g.word = pool[Math.floor(rng() * pool.length)]; g.usedWords.push(g.word);
    const ps = live(g);
    g.outsider = ps[Math.floor(rng() * ps.length)].id;
    g.order = L.shuffle(ps.map((p) => p.id), rng);
    // برا السالفة ما يبدأ أول عشان ما ينكشف من أول خط
    if (g.order[0] === g.outsider && g.order.length > 1) { g.order.push(g.order.shift()); }
    g.turnIdx = 0; g.strokes = []; g.ready = {}; g.votes = {}; g.accused = null; g.guess = null; g.result = null;
    g.options = L.shuffle([g.word].concat(L.shuffle(cat.w.filter((w) => w !== g.word), rng).slice(0, 5)), rng);
    L.setPhase(g, 'word', now, WORD_MS);
    L.ev(g, { k: 'round' });
  }
  const totalTurns = (g) => g.order.length * g.settings.laps;
  const drawer = (g) => g.order[g.turnIdx % g.order.length];
  function toDraw(g, now) { L.setPhase(g, 'draw', now, g.settings.turn * 1000); L.ev(g, { k: 'draw' }); }
  function ready(g, id, now) {
    if (g.phase !== 'word') return fail('bad_phase');
    g.ready[id] = true;
    if (live(g).every((p) => g.ready[p.id])) toDraw(g, now);
    return ok();
  }
  function cleanStroke(pts) {
    if (!Array.isArray(pts)) return null;
    const out = [];
    for (const pt of pts.slice(0, MAX_PTS)) {
      if (!Array.isArray(pt) || pt.length < 2) continue;
      const x = Math.round(Number(pt[0])), y = Math.round(Number(pt[1]));
      if (!isFinite(x) || !isFinite(y)) continue;
      out.push([Math.max(0, Math.min(1000, x)), Math.max(0, Math.min(1000, y))]);
    }
    return out.length ? out : null;
  }
  function nextTurn(g, now) {
    g.turnIdx++;
    // نتخطى اللي طلعوا من الغرفة
    while (g.turnIdx < totalTurns(g) && !(byId(g, drawer(g)) || {}).connected) g.turnIdx++;
    if (g.turnIdx >= totalTurns(g)) { L.setPhase(g, 'vote', now, VOTE_MS); L.ev(g, { k: 'vote' }); return; }
    L.setPhase(g, 'draw', now, g.settings.turn * 1000);
  }
  function stroke(g, id, pts, now) {
    if (g.phase !== 'draw') return fail('bad_phase');
    if (drawer(g) !== id) return fail('not_your_turn');
    const s = cleanStroke(pts); if (!s) return fail('empty_stroke');
    const p = byId(g, id);
    g.strokes.push({ by: id, c: p ? p.color : '#fff', pts: s });
    nextTurn(g, now); return ok();
  }
  function vote(g, id, target, now) {
    if (g.phase !== 'vote') return fail('bad_phase');
    if (!byId(g, target) || target === id) return fail('bad_target');
    g.votes[id] = target;
    if (live(g).every((p) => g.votes[p.id])) closeVote(g, now);
    return ok();
  }
  function closeVote(g, now) {
    const count = {};
    Object.keys(g.votes).forEach((v) => { const t = g.votes[v]; count[t] = (count[t] || 0) + 1; });
    const top = Object.keys(count).sort((a, b) => count[b] - count[a]);
    // التعادل على المركز الأول = ما انكشف أحد
    g.accused = top.length && (top.length === 1 || count[top[0]] > count[top[1]]) ? top[0] : null;
    if (g.accused === g.outsider) { L.setPhase(g, 'guess', now, GUESS_MS); L.ev(g, { k: 'caught' }); }
    else finish(g, now, false);
  }
  function guessWord(g, id, w, now) {
    if (g.phase !== 'guess') return fail('bad_phase');
    if (id !== g.outsider) return fail('not_outsider');
    if (g.options.indexOf(w) < 0) return fail('bad_target');
    g.guess = w; finish(g, now, true); return ok();
  }
  function finish(g, now, caught) {
    const delta = {}; g.players.forEach((p) => { delta[p.id] = 0; });
    let how;
    if (!caught) { delta[g.outsider] = 3; how = 'escaped'; }
    else if (g.guess === g.word) { delta[g.outsider] = 3; how = 'guessed'; }
    else { g.players.forEach((p) => { if (p.id !== g.outsider) delta[p.id] = 2; }); how = 'caught'; }
    g.players.forEach((p) => { p.score += delta[p.id]; });
    const tally = {}; Object.keys(g.votes).forEach((v) => { tally[g.votes[v]] = (tally[g.votes[v]] || 0) + 1; });
    g.result = { how, delta, outsider: g.outsider, word: g.word, accused: g.accused, guess: g.guess, tally };
    L.setPhase(g, 'result', now, 0); L.ev(g, { k: 'result', how });
  }
  function next(g, id, now, rng) {
    if (g.hostId !== id) return fail('not_host'); if (g.phase !== 'result') return fail('bad_phase');
    if (g.round >= g.settings.rounds) { L.setPhase(g, 'ended', now, 0); return ok(); }
    newRound(g, now, rng); return ok();
  }
  function skip(g, id, now, rng) {
    if (g.hostId !== id) return fail('not_host');
    if (g.phase === 'word') { toDraw(g, now); return ok(); }
    if (g.phase === 'draw') { nextTurn(g, now); return ok(); }
    if (g.phase === 'vote') { closeVote(g, now); return ok(); }
    if (g.phase === 'guess') { finish(g, now, true); return ok(); }
    if (g.phase === 'result') return next(g, id, now, rng);
    return fail('bad_phase');
  }
  function tick(g, now) {
    if (!g.deadline || now < g.deadline) return false;
    if (g.phase === 'word') { toDraw(g, now); return true; }
    if (g.phase === 'draw') { nextTurn(g, now); return true; }
    if (g.phase === 'vote') { closeVote(g, now); return true; }
    if (g.phase === 'guess') { finish(g, now, true); return true; }
    return false;
  }
  function act(g, id, m, now, rng) {
    switch (m.a) {
      case 'ready': return ready(g, id, now);
      case 'stroke': return stroke(g, id, m.pts, now);
      case 'vote': return vote(g, id, m.target, now);
      case 'guess': return guessWord(g, id, m.w, now);
      case 'skip': return skip(g, id, now, rng);
      case 'next': return next(g, id, now, rng);
      case 'again': { if (g.hostId !== id) return fail('not_host'); if (g.phase !== 'ended') return fail('bad_phase'); g.round = 0; g.usedWords = []; g.players.forEach((p) => { p.score = 0; }); newRound(g, now, rng); return ok(); }
      case 'lobby': return L.toLobby(g, id);
      case 'settings': return L.setSettings(g, id, m.patch || {}, ALLOWED);
      default: return fail('bad_action');
    }
  }
  function viewFor(g, pid, now) {
    const v = L.baseView(g, now), inGame = g.phase !== 'lobby';
    v.rounds = g.settings.rounds;
    if (inGame && g.cat) {
      v.cat = g.cat; v.strokes = g.strokes; v.order = g.order;
      v.turn = g.phase === 'draw' ? drawer(g) : null; v.turnIdx = g.turnIdx; v.turns = totalTurns(g);
      v.readyCount = live(g).filter((p) => g.ready[p.id]).length; v.liveCount = live(g).length;
      v.votedCount = live(g).filter((p) => g.votes[p.id]).length;
      v.players.forEach((p) => { p.ready = !!g.ready[p.id]; p.voted = !!g.votes[p.id]; });
      if (g.phase === 'guess') { v.accused = g.accused; v.options = g.options; }
      if (g.phase === 'result' || g.phase === 'ended') { v.result = g.result; v.options = g.options; }
    }
    const p = pid && byId(g, pid);
    if (p) {
      v.me = { id: p.id, name: p.name, host: g.hostId === p.id };
      if (inGame && g.cat) {
        v.me.outsider = g.outsider === p.id;
        v.me.word = v.me.outsider ? null : g.word;
        v.me.ready = !!g.ready[p.id]; v.me.vote = g.votes[p.id] || null;
      }
    }
    return v;
  }
  return Object.assign({ MIN, MAX, ALLOWED, createGame, join, start, tick, act, viewFor }, { leave: L.leave, kick: L.kick, setConnected: L.setConnected, need: L.need, byId: L.byId });
});
