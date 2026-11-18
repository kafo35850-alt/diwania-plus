/* قدّرها — بوتات النسخة التجريبية */
(function (g) {
  'use strict';
  var E = g.MG.qaddirha, D = g.MG.qaddirhaData;
  g.DiwaniyaLoop.install({ E: E, bots: 4, think: function (b, v, H) {
    var me = v.me; if (!me) return; var ph = v.phase;
    if (ph === 'guess' && me.guess === null) b.once('g' + v.round, 4000, 20000, function () {
      var q = D.Q.find(function (x) { return x.q === v.question.q; }); var a = q ? q.a : 100;
      var val = a * (0.55 + H.rnd() * 0.9); this.act({ a: 'guess', value: Math.abs(a) < 50 ? Math.round(val * 10) / 10 : Math.round(val) });
    });
    else if (ph === 'reveal' && me.host) b.once('n' + v.round, 4000, 7000, function () { this.act({ a: 'next' }); });
  } });
})(typeof window !== 'undefined' ? window : globalThis);
