/* ديوانية بلس — حرف ونص: محرك اللعبة (منطق صرف، يشتغل في Node والمتصفح وCloudflare).
 * حرف عشوائي، وكل لاعب يكتب كلمة تبدأ فيه لكل خانة (إنسان، حيوان، نبات…).
 * أول من يخلّص يوقف الكل بعد ١٠ ثواني. بعدها الكل يراجع ويرفض الإجابات الغلط بالتصويت.
 * النقاط: إجابة صحيحة ما كتبها غيرك = ١٠، صحيحة ومكررة = ٥.
 * المراحل: lobby → write → review → result → … → ended */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root.DiwaniyaLobby, root.MG.harfData);
  else { root.MG = root.MG || {}; root.MG.harf = factory(root.DiwaniyaLobby, root.MG.harfData); }
})(typeof self !== 'undefined' ? self : this, function (L, D) {
  'use strict';
  const MIN = 2, MAX = 40, STOP_MS = 10000, REVIEW_MS = 45000;
  const ALLOWED = { rounds: [3, 5, 8], sec: [60, 90, 120], set: D.ORDER };
  const PTS = { unique: 10, shared: 5 };
  const ok = L.ok, fail = L.fail, byId = L.byId;
  const live = (g) => g.players.filter((p) => p.connected);
  const fields = (g) => D.SETS[g.settings.set].fields;

  // توحيد الكلمة: بدون «ال» التعريف وبدون همزات على الألف وبدون تشكيل
  function norm(s) {
    let w = String(s || '').trim().replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, ' ');
    if (w.indexOf('ال') === 0 && w.length > 3) w = w.slice(2);
    return w;
  }
  const startsWith = (word, letter) => { const w = norm(word); return !!w && w[0] === norm(letter)[0]; };

  function createGame(code) {
    const g = L.base(code, { min: MIN, max: MAX, settings: { rounds: 5, sec: 90, set: 'classic' } });
    Object.assign(g, { letter: null, usedLetters: [], answers: {}, done: {}, stopBy: null, rejects: {}, result: null });
    return g;
  }
  const join = (g, name) => L.join(g, name);

  function start(g, hostId, now, rng) {
    if (g.hostId !== hostId) return fail('not_host'); if (g.phase !== 'lobby') return fail('already_started');
    if (L.need(g) > 0) return fail('need_players');
    g.round = 0; g.usedLetters = []; g.players.forEach((p) => { p.score = 0; });
    newRound(g, now, rng); return ok();
  }
  function newRound(g, now, rng) {
    g.round++;
    const fresh = D.LETTERS.filter((l) => g.usedLetters.indexOf(l) < 0), pool = fresh.length ? fresh : D.LETTERS;
    g.letter = pool[Math.floor(rng() * pool.length)]; g.usedLetters.push(g.letter);
    g.answers = {}; g.done = {}; g.stopBy = null; g.rejects = {}; g.result = null;
    L.setPhase(g, 'write', now, g.settings.sec * 1000);
    L.ev(g, { k: 'round', letter: g.letter });
  }
  function cleanAnswers(g, arr) {
    const n = fields(g).length, out = [];
    for (let i = 0; i < n; i++) out.push(L.cleanText(Array.isArray(arr) ? arr[i] : '', 30));
    return out;
  }
  function save(g, id, arr) {
    if (g.phase !== 'write') return fail('bad_phase');
    g.answers[id] = cleanAnswers(g, arr); return ok();
  }
  function finishWriting(g, id, arr, now) {
    const r = save(g, id, arr); if (!r.ok) return r;
    g.done[id] = true;
    if (!g.stopBy && g.answers[id].every((x) => x)) {
      g.stopBy = id;
      if (!g.deadline || g.deadline - now > STOP_MS) { g.deadline = now + STOP_MS; }
      L.ev(g, { k: 'stop', by: id });
    }
    if (live(g).every((p) => g.done[p.id])) toReview(g, now);
    return ok();
  }
  function toReview(g, now) {
    L.setPhase(g, 'review', now, REVIEW_MS);
    L.ev(g, { k: 'review' });
  }
  const cellKey = (pid, i) => pid + ':' + i;
  function reject(g, id, target, i) {
    if (g.phase !== 'review') return fail('bad_phase');
    i = Number(i);
    if (!byId(g, target) || target === id || !(i >= 0 && i < fields(g).length)) return fail('bad_target');
    const k = cellKey(target, i); g.rejects[k] = g.rejects[k] || {};
    if (g.rejects[k][id]) delete g.rejects[k][id]; else g.rejects[k][id] = true;
    return ok();
  }
  // حالة كل خانة: empty | letter (ما تبدأ بالحرف) | rejected | ok
  function cellStatus(g, pid, i) {
    const a = (g.answers[pid] || [])[i] || '';
    if (!a) return 'empty';
    if (!startsWith(a, g.letter)) return 'letter';
    const votes = Object.keys(g.rejects[cellKey(pid, i)] || {}).filter((v) => byId(g, v) && byId(g, v).connected).length;
    const judges = Math.max(1, live(g).filter((p) => p.id !== pid).length);
    if (votes * 2 > judges) return 'rejected';
    return 'ok';
  }
  function score(g, now) {
    const n = fields(g).length, delta = {}, cells = {};
    g.players.forEach((p) => { delta[p.id] = 0; cells[p.id] = []; });
    for (let i = 0; i < n; i++) {
      const good = g.players.filter((p) => cellStatus(g, p.id, i) === 'ok');
      const count = {}; good.forEach((p) => { const w = norm(g.answers[p.id][i]); count[w] = (count[w] || 0) + 1; });
      g.players.forEach((p) => {
        const st = cellStatus(g, p.id, i);
        let pts = 0;
        if (st === 'ok') pts = count[norm(g.answers[p.id][i])] > 1 ? PTS.shared : PTS.unique;
        cells[p.id].push({ st, pts }); delta[p.id] += pts;
      });
    }
    g.players.forEach((p) => { p.score += delta[p.id]; });
    g.result = { delta, cells };
    L.setPhase(g, 'result', now, 0); L.ev(g, { k: 'result' });
  }
  function next(g, id, now, rng) {
    if (g.hostId !== id) return fail('not_host'); if (g.phase !== 'result') return fail('bad_phase');
    if (g.round >= g.settings.rounds) { L.setPhase(g, 'ended', now, 0); return ok(); }
    newRound(g, now, rng); return ok();
  }
  function skip(g, id, now, rng) {
    if (g.hostId !== id) return fail('not_host');
    if (g.phase === 'write') { toReview(g, now); return ok(); }
    if (g.phase === 'review') { score(g, now); return ok(); }
    if (g.phase === 'result') return next(g, id, now, rng);
    return fail('bad_phase');
  }
  function tick(g, now, rng) {
    if (!g.deadline || now < g.deadline) return false;
    if (g.phase === 'write') { toReview(g, now); return true; }
    if (g.phase === 'review') { score(g, now); return true; }
    return false;
  }
  function act(g, id, m, now, rng) {
    switch (m.a) {
      case 'save': return save(g, id, m.answers);
      case 'done': return finishWriting(g, id, m.answers, now);
      case 'reject': return reject(g, id, m.target, m.i);
      case 'skip': return skip(g, id, now, rng);
      case 'next': return next(g, id, now, rng);
      case 'again': { if (g.hostId !== id) return fail('not_host'); if (g.phase !== 'ended') return fail('bad_phase'); g.round = 0; g.usedLetters = []; g.players.forEach((p) => { p.score = 0; }); newRound(g, now, rng); return ok(); }
      case 'lobby': return L.toLobby(g, id);
      case 'settings': return L.setSettings(g, id, m.patch || {}, ALLOWED);
      default: return fail('bad_action');
    }
  }

  function viewFor(g, pid, now) {
    const v = L.baseView(g, now), inGame = g.phase !== 'lobby';
    v.rounds = g.settings.rounds; v.setNames = D.NAMES; v.setOrder = D.ORDER;
    v.players.forEach((p) => { p.done = !!g.done[p.id]; });
    if (inGame) {
      v.letter = g.letter; v.fields = fields(g); v.stopBy = g.stopBy;
      v.doneCount = live(g).filter((p) => g.done[p.id]).length; v.liveCount = live(g).length;
      // الإجابات تنكشف للكل بعد ما ينتهي وقت الكتابة فقط
      if (g.phase === 'review' || g.phase === 'result' || g.phase === 'ended') {
        v.table = g.players.map((p) => ({
          id: p.id,
          answers: (g.answers[p.id] || []).slice(),
          status: fields(g).map((_, i) => cellStatus(g, p.id, i)),
          rejects: fields(g).map((_, i) => Object.keys(g.rejects[cellKey(p.id, i)] || {}).length)
        }));
      }
      if (g.phase === 'result' || g.phase === 'ended') v.result = g.result;
    }
    const p = pid && byId(g, pid);
    if (p) {
      v.me = { id: p.id, name: p.name, host: g.hostId === p.id, done: !!g.done[p.id] };
      if (inGame) {
        v.me.answers = (g.answers[p.id] || []).slice();
        if (g.phase === 'review') v.me.myRejects = Object.keys(g.rejects).filter((k) => g.rejects[k][p.id]);
      }
    }
    return v;
  }
  return Object.assign({ MIN, MAX, ALLOWED, PTS, createGame, join, start, tick, act, viewFor, norm, startsWith }, { leave: L.leave, kick: L.kick, setConnected: L.setConnected, need: L.need, byId: L.byId });
});
