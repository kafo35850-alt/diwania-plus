/* فوق راسك — بوتات النسخة التجريبية */
(function (g) {
  'use strict';
  var E = g.MG.fooq_rasak;
  g.DiwaniyaLoop.install({ E: E, bots: 4, think: function (b, v, H) {
    var me = v.me; if (!me) return; var ph = v.phase;
    if (ph === 'turn' && v.cur === me.id) b.once('t' + v.round, 5000, 12000, function () { this.act({ a: H.rnd() < 0.55 ? 'claim' : 'pass' }); });
    else if (ph === 'judge' && v.cur !== me.id && !me.vote) b.once('j' + v.round, 1500, 5000, function () { this.act({ a: 'vote', v: H.rnd() < 0.6 ? 'ok' : 'no' }); });
  } });
})(typeof window !== 'undefined' ? window : globalThis);
