/* رسّام الديوانية — بوتات النسخة التجريبية */
(function (g) {
  'use strict';
  var E = g.MG.draw_guess;
  g.DiwaniyaLoop.install({ E: E, bots: 3, think: function (b, v, H) {
    var me = v.me; if (!me) return; var ph = v.phase;
    if (ph === 'word' && !me.ready) b.once('r' + v.round, 1500, 4000, function () { this.act({ a: 'ready' }); });
    else if (ph === 'draw' && v.turn === me.id) b.once('d' + v.round + '_' + v.turnIdx, 1500, 3500, function () {
      var x = 200 + H.rnd() * 600, y = 200 + H.rnd() * 600, pts = [];
      for (var i = 0; i < 24; i++) { x += (H.rnd() - 0.5) * 70; y += (H.rnd() - 0.5) * 70; pts.push([Math.round(x), Math.round(y)]); }
      this.act({ a: 'stroke', pts: pts });
    });
    else if (ph === 'vote' && !me.vote) b.once('v' + v.round, 2000, 6000, function () {
      var others = v.players.filter(function (p) { return p.id !== me.id; });
      this.act({ a: 'vote', target: others[Math.floor(H.rnd() * others.length)].id });
    });
    else if (ph === 'guess' && me.outsider) b.once('g' + v.round, 2000, 5000, function () { this.act({ a: 'guess', w: v.options[Math.floor(H.rnd() * v.options.length)] }); });
    else if (ph === 'result' && me.host) b.once('n' + v.round, 5000, 8000, function () { this.act({ a: 'next' }); });
  } });
})(typeof window !== 'undefined' ? window : globalThis);
