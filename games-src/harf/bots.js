/* حرف ونص — بوتات النسخة التجريبية */
(function (g) {
  'use strict';
  var E = g.MG.harf, D = g.MG.harfData;
  g.DiwaniyaLoop.install({ E: E, bots: 3, think: function (b, v, H) {
    var me = v.me; if (!me) return; var ph = v.phase;
    if (ph === 'write' && !me.done) b.once('w' + v.round, 12000, 40000, function () {
      var bank = D.SAMPLES[v.letter] || [];
      var ans = v.fields.map(function (_, i) { return bank.length && H.rnd() < 0.8 ? bank[(i + Math.floor(H.rnd() * bank.length)) % bank.length] : ''; });
      this.act({ a: 'done', answers: ans });
    });
    else if (ph === 'result' && me.host) b.once('n' + v.round, 4000, 7000, function () { this.act({ a: 'next' }); });
  } });
})(typeof window !== 'undefined' ? window : globalThis);
