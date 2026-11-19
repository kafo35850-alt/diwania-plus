/* Diwaniya+ narrator voice: plays the owner's own recordings instead of the synthetic voice.
   A line like «قرّرت القرية… {} يطلع من اللعبة.» is recorded in parts (before and after the name);
   the name itself is spoken by the device voice in between. Lines that are not fully recorded are left
   to the game's usual voice. Recordings come from window.__DW_CONTENT.voice (set by the server). */
(function () {
  'use strict';
  var lines = [];
  try { lines = ((window.__DW_CONTENT || {}).voice || []).filter(function (l) { return l && l.text && Array.isArray(l.parts); }); } catch (e) { lines = []; }
  function norm(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  var spoken = /[؀-ۿA-Za-z0-9٠-٩]/;
  var compiled = lines.map(function (l) {
    var segs = norm(l.text).split('{}');
    return { re: new RegExp('^' + segs.map(esc).join('(.+?)') + '$'), segs: segs, parts: l.parts };
  });

  var seq = 0, current = null;
  function stop() {
    seq++;
    if (current) { try { current.pause(); } catch (e) {} current = null; }
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
  }
  function arabicVoice() {
    try {
      var vs = window.speechSynthesis.getVoices() || [];
      return vs.find(function (v) { return /^ar[-_]SA/i.test(v.lang); }) || vs.find(function (v) { return /^ar/i.test(v.lang); }) || null;
    } catch (e) { return null; }
  }
  function sayText(text, done) {
    try {
      if (!window.speechSynthesis) return done();
      var u = new SpeechSynthesisUtterance(text);
      var v = arabicVoice(); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'ar-SA';
      u.rate = 0.95; u.onend = u.onerror = function () { done(); };
      window.speechSynthesis.speak(u);
      setTimeout(done, 400 + text.length * 260); // never get stuck if the device forgets to report the end
    } catch (e) { done(); }
  }
  function playUrl(url, done, fail) {
    var a = new Audio(url);
    current = a;
    var finished = false, end = function () { if (!finished) { finished = true; done(); } };
    a.onended = end; a.onerror = function () { if (!finished) { finished = true; fail(); } };
    var p = a.play(); if (p && p.catch) p.catch(function () { if (!finished) { finished = true; fail(); } });
  }

  // Returns true when this line is covered by recordings (and starts playing it); false to let the game speak it.
  function play(text) {
    var t = norm(text);
    for (var i = 0; i < compiled.length; i++) {
      var c = compiled[i], m = c.re.exec(t);
      if (!m) continue;
      var steps = [], pi = 0, ok = true;
      c.segs.forEach(function (seg, k) {
        if (spoken.test(seg)) { var url = c.parts[pi++]; if (!url) ok = false; steps.push({ url: url }); }
        if (k < c.segs.length - 1) steps.push({ say: m[k + 1] });
      });
      if (!ok) return false;
      stop();
      var my = seq, n = 0;
      var next = function () {
        if (my !== seq || n >= steps.length) return;
        var s = steps[n++];
        if (s.url) playUrl(s.url, next, function () { stop(); });
        else if (s.say && spoken.test(s.say)) sayText(s.say, next);
        else next();
      };
      next();
      return true;
    }
    return false;
  }
  window.__dwVoice = { play: play, stop: stop, count: compiled.length };
})();
