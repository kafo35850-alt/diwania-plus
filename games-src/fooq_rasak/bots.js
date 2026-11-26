/* خمّن الشخصية — بوت النسخة التجريبية */
(function (g) {
  'use strict';
  var E = g.MG.fooq_rasak;
  var Q = ['شخصيتك إنسان؟', 'لونها أسود؟', 'تعيش بالبحر؟', 'أكبر من الكرسي؟', 'مشهورة؟'];
  g.DiwaniyaLoop.install({ E: E, bots: 1, think: function (b, v, H) {
    var me = v.me; if (!me) return; var ph = v.phase;
    var up = function () { var a = []; me.down.forEach(function (d, i) { if (!d) a.push(i); }); return a; };
    if (ph === 'pick' && me.secret === null) b.once('p' + v.round, 1500, 4000, function () { this.act({ a: 'pick', i: Math.floor(H.rnd() * v.board.length) }); });
    else if (ph === 'play' && v.turn === me.id && v.step === 'ask') b.once('a' + v.history.length, 2500, 5000, function () {
      var u = up(); if (u.length <= 3 && H.rnd() < 0.6) this.act({ a: 'guess', i: u[Math.floor(H.rnd() * u.length)] });
      else this.act({ a: 'ask', text: Q[Math.floor(H.rnd() * Q.length)] });
    });
    else if (ph === 'play' && v.turn !== me.id && v.step === 'answer') b.once('r' + v.history.length, 1500, 3500, function () { this.act({ a: 'answer', v: H.rnd() < 0.5 ? 'yes' : 'no' }); });
    else if (ph === 'play' && v.turn === me.id && v.step === 'flip') b.once('f' + v.history.length, 2000, 4000, function () {
      var u = up(), k = Math.ceil(u.length / 3), self = this;
      for (var j = 0; j < k && u.length > 1; j++) { var x = u.splice(Math.floor(H.rnd() * u.length), 1)[0]; if (x !== me.secret) self.act({ a: 'flip', i: x }); }
      self.act({ a: 'endturn' });
    });
    else if (ph === 'result' && me.host) b.once('n' + v.round, 4000, 6000, function () { this.act({ a: 'next' }); });
  } });
})(typeof window !== 'undefined' ? window : globalThis);
