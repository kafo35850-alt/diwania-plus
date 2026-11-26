/* ديوانية بلس — فوق راسك: محرك اللعبة (منطق صرف، يشتغل في Node والمتصفح وCloudflare).
 * كل لاعب عنده بطاقة سرية (شخصية أو شي) يشوفها الكل إلا هو، مثل البطاقة اللي فوق الراس.
 * بالدور: صاحب الدور يسأل الباقين سؤال جوابه «نعم» أو «لا» بصوت عالي.
 * إذا حس إنه عرفها يضغط «عرفتها!» ويقول الجواب بصوت، والباقين يحكمون صح ولا غلط.
 * النقاط: أول من يعرف ياخذ ٥، الثاني ٤، الثالث ٣، وبعدهم ٢ ثم ١.
 * المراحل: lobby → turn → judge → turn … → ended */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root.DiwaniyaLobby, root.MG.fooq_rasakData);
  else { root.MG = root.MG || {}; root.MG.fooq_rasak = factory(root.DiwaniyaLobby, root.MG.fooq_rasakData); }
})(typeof self !== 'undefined' ? self : this, function (L, D) {
  'use strict';
  const MIN = 2, MAX = 12, JUDGE_MS = 25000;
  const ALLOWED = { set: D.ORDER, sec: [30, 45, 60, 90], laps: [3, 5, 8] };
  const RANK_PTS = [5, 4, 3, 2, 1];
  const ok = L.ok, fail = L.fail, byId = L.byId;
  const live = (g) => g.players.filter((p) => p.connected);

  function createGame(code) {
    const g = L.base(code, { min: MIN, max: MAX, settings: { set: 'mix', sec: 45, laps: 5 } });
    Object.assign(g, { cards: {}, solved: {}, solvedCount: 0, order: [], cur: null, lap: 0, turns: {}, claim: null, votes: {}, last: null });
    return g;
  }
  const join = (g, name) => L.join(g, name);

  function deal(g, rng) {
    const cards = L.shuffle(D.pool(g.settings.set), rng);
    const extra = L.shuffle(D.pool('mix'), rng).filter((c) => !cards.some((x) => x.n === c.n));
    const all = cards.concat(extra);
    g.cards = {}; g.players.forEach((p, i) => { g.cards[p.id] = all[i % all.length]; });
  }
  function begin(g, now, rng) {
    g.players.forEach((p) => { p.score = 0; });
    deal(g, rng);
    g.solved = {}; g.solvedCount = 0; g.turns = {}; g.claim = null; g.votes = {}; g.last = null;
    g.order = L.shuffle(g.players.map((p) => p.id), rng);
    g.lap = 1; g.round = 0; g.cur = null;
    nextTurn(g, now, true);
  }
  function start(g, hostId, now, rng) {
    if (g.hostId !== hostId) return fail('not_host'); if (g.phase !== 'lobby') return fail('already_started');
    if (L.need(g) > 0) return fail('need_players');
    begin(g, now, rng); return ok();
  }
  const waiting = (g) => g.order.filter((id) => !g.solved[id] && (byId(g, id) || {}).connected);
  function finish(g, now) {
    g.cur = null; g.claim = null; L.setPhase(g, 'ended', now, 0); L.ev(g, { k: 'end' });
  }
  // ينتقل الدور للي بعده (اللي ما عرف بطاقته ولا هو متصل)
  function nextTurn(g, now, first) {
    const left = waiting(g);
    if (!left.length) return finish(g, now);
    let i = first ? -1 : g.order.indexOf(g.cur);
    for (let k = 0; k < g.order.length; k++) {
      i = (i + 1) % g.order.length;
      if (i === 0 && !first) g.lap++;
      const id = g.order[i];
      if (!g.solved[id] && (byId(g, id) || {}).connected) break;
    }
    if (g.lap > g.settings.laps) return finish(g, now);
    g.cur = g.order[i]; g.turns[g.cur] = (g.turns[g.cur] || 0) + 1; g.round++;
    g.claim = null; g.votes = {};
    L.setPhase(g, 'turn', now, g.settings.sec * 1000);
    L.ev(g, { k: 'turn', id: g.cur });
  }
  function claim(g, id, now) {
    if (g.phase !== 'turn') return fail('bad_phase'); if (id !== g.cur) return fail('not_your_turn');
    if (!judges(g).length) return fail('no_judges');
    g.claim = { by: id }; g.votes = {};
    L.setPhase(g, 'judge', now, JUDGE_MS); L.ev(g, { k: 'claim', id });
    return ok();
  }
  const judges = (g) => live(g).filter((p) => p.id !== g.cur);
  function vote(g, id, v, now) {
    if (g.phase !== 'judge') return fail('bad_phase'); if (id === g.cur) return fail('not_judge');
    if (!byId(g, id)) return fail('no_player'); if (v !== 'ok' && v !== 'no') return fail('bad_vote');
    g.votes[id] = v; settle(g, now, false); return ok();
  }
  // الأغلبية تحكم. إذا تعادلوا أو ما صوّت أحد = غلط.
  function settle(g, now, force) {
    const js = judges(g), n = js.length;
    const yes = js.filter((p) => g.votes[p.id] === 'ok').length, no = js.filter((p) => g.votes[p.id] === 'no').length;
    let verdict = null;
    if (yes * 2 > n) verdict = 'ok'; else if (no * 2 > n) verdict = 'no';
    else if (force || yes + no >= n) verdict = yes > no ? 'ok' : 'no';
    if (!verdict) return false;
    const id = g.cur;
    if (verdict === 'ok') {
      g.solvedCount++; g.solved[id] = g.solvedCount;
      const pts = RANK_PTS[g.solvedCount - 1] || 1; const p = byId(g, id); if (p) p.score += pts;
      g.last = { id, ok: true, pts, card: g.cards[id] };
    } else g.last = { id, ok: false, pts: 0 };
    L.ev(g, { k: 'verdict', id, ok: verdict === 'ok' });
    nextTurn(g, now, false); return true;
  }
  function pass(g, id, now) {
    if (g.phase !== 'turn') return fail('bad_phase'); if (id !== g.cur && id !== g.hostId) return fail('not_your_turn');
    g.last = { id: g.cur, ok: null, pts: 0 }; nextTurn(g, now, false); return ok();
  }
  function skip(g, id, now) {
    if (g.hostId !== id) return fail('not_host');
    if (g.phase === 'turn') return pass(g, id, now);
    if (g.phase === 'judge') { settle(g, now, true); return ok(); }
    return fail('bad_phase');
  }
  function tick(g, now) {
    if (!g.deadline || now < g.deadline) return false;
    if (g.phase === 'turn') { g.last = { id: g.cur, ok: null, pts: 0 }; nextTurn(g, now, false); return true; }
    if (g.phase === 'judge') { settle(g, now, true); return true; }
    return false;
  }
  function act(g, id, m, now, rng) {
    switch (m.a) {
      case 'claim': return claim(g, id, now);
      case 'vote': return vote(g, id, m.v, now);
      case 'pass': return pass(g, id, now);
      case 'skip': return skip(g, id, now);
      case 'end': { if (g.hostId !== id) return fail('not_host'); if (g.phase !== 'turn' && g.phase !== 'judge') return fail('bad_phase'); finish(g, now); return ok(); }
      case 'again': { if (g.hostId !== id) return fail('not_host'); if (g.phase !== 'ended') return fail('bad_phase'); begin(g, now, rng); return ok(); }
      case 'lobby': return L.toLobby(g, id);
      case 'settings': return L.setSettings(g, id, m.patch || {}, ALLOWED);
      default: return fail('bad_action');
    }
  }

  function viewFor(g, pid, now) {
    const v = L.baseView(g, now), inGame = g.phase !== 'lobby';
    v.setNames = D.NAMES; v.setOrder = D.ORDER;
    if (inGame) {
      const ended = g.phase === 'ended';
      v.cur = g.cur; v.lap = g.lap; v.laps = g.settings.laps; v.last = g.last;
      v.claim = g.claim;
      // بطاقتك ما تشوفها إلا إذا عرفتها أو خلصت اللعبة. التلفزيون ما يعرض إلا البطاقات المعروفة.
      v.cards = g.players.map((p) => {
        const show = ended || g.solved[p.id] || (pid && p.id !== pid && byId(g, pid));
        const c = g.cards[p.id];
        return { id: p.id, solved: g.solved[p.id] || 0, turns: g.turns[p.id] || 0, card: show && c ? { n: c.n, m: c.m || '', e: c.e || '' } : null };
      });
      if (g.last && g.last.card) v.last = Object.assign({}, g.last);
      if (g.phase === 'judge') {
        const js = judges(g);
        v.votes = { yes: js.filter((p) => g.votes[p.id] === 'ok').length, no: js.filter((p) => g.votes[p.id] === 'no').length, total: js.length };
      }
    }
    v.players.forEach((p) => { p.solved = g.solved[p.id] || 0; });
    const p = pid && byId(g, pid);
    if (p) {
      v.me = { id: p.id, name: p.name, host: g.hostId === p.id, solved: g.solved[p.id] || 0 };
      if (g.phase === 'judge') v.me.vote = g.votes[p.id] || null;
    }
    return v;
  }
  return Object.assign({ MIN, MAX, ALLOWED, RANK_PTS, createGame, join, start, tick, act, viewFor }, { leave: L.leave, kick: L.kick, setConnected: L.setConnected, need: L.need, byId: L.byId });
});
