/* فوق راسك — شاشات الجوال + شاشة التلفزيون */
(function (root) {
  'use strict';
  const MG = root.MG, esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
  const ICON = '<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="160" height="160" rx="30" fill="#7f1d1d"/><rect x="22" y="96" width="116" height="16" rx="8" fill="#2563eb"/><rect x="52" y="24" width="56" height="74" rx="10" fill="#ef4444" stroke="#fff" stroke-width="4"/><text x="80" y="76" text-anchor="middle" font-size="44" font-weight="900" fill="#fff" font-family="Tahoma,Arial">؟</text><circle cx="80" cy="138" r="10" fill="#F5B942"/></svg>';
  const nm = (v, id) => { const p = v.players.find((x) => x.id === id); return p ? esc(p.name) : '؟'; };
  const pic = (c, size) => {
    if (!c) return '<div class="fr-q" style="font-size:' + Math.round(size * 0.55) + 'px">❓</div>';
    if (c.m) return '<img src="/media/med_seed_' + esc(c.m) + '" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;object-position:top">';
    return '<div class="fr-e" style="font-size:' + Math.round(size * 0.6) + 'px">' + esc(c.e) + '</div>';
  };
  const CSS = '<style>.fr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:10px}.fr-c{background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.12);border-radius:16px;padding:6px;display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center}.fr-c.cur{border-color:#F5B942;box-shadow:0 0 0 3px rgba(245,185,66,.3)}.fr-c.ok{border-color:#34d399}.fr-c .ph{width:100%;aspect-ratio:3/4;border-radius:11px;overflow:hidden;background:#fff;display:flex;align-items:center;justify-content:center}.fr-c .ph.hid{background:linear-gradient(135deg,#ef4444,#991b1b)}.fr-c .cn{font-weight:900;font-size:13px;line-height:1.3}.fr-c .pn{font-size:12px;opacity:.75}.fr-q{color:#fff;font-weight:900}.fr-e{line-height:1}.fr-big{width:min(62vw,240px);margin:0 auto;aspect-ratio:3/4;border-radius:18px;overflow:hidden;background:#fff;display:flex;align-items:center;justify-content:center;border:4px solid #F5B942}</style>';
  function cardGrid(v, opt) {
    opt = opt || {};
    return '<div class="fr-grid">' + v.cards.map((c) => {
      const mine = v.me && c.id === v.me.id;
      const label = c.card ? esc(c.card.n) : (mine ? 'فوق راسك!' : '؟');
      return '<div class="fr-c ' + (c.id === v.cur ? 'cur' : '') + (c.solved ? ' ok' : '') + '"><div class="ph ' + (c.card ? '' : 'hid') + '">' + pic(c.card, 100) + '</div><div class="cn">' + label + '</div><div class="pn">' + nm(v, c.id) + (mine ? ' (أنت)' : '') + (c.solved ? ' ✅' : '') + '</div></div>';
    }).join('') + '</div>';
  }
  function lastLine(v) {
    const l = v.last; if (!l) return '';
    if (l.ok) return '<div class="ann g"><div class="big">🎉 ' + nm(v, l.id) + ' عرف إنه «' + esc(l.card ? l.card.n : '') + '» (+' + AR(l.pts) + ')</div></div>';
    if (l.ok === false) return '<div class="card ctr">❌ ' + nm(v, l.id) + ' خمّن غلط</div>';
    return '';
  }

  const cfg = {
    id: 'fooq_rasak', name: 'فوق راسك', nameHtml: '<b>فوق</b> راسك', tagline: 'الكل يشوف بطاقتك إلا أنت… اسأل وخمّن مين أنت!', icon: ICON, wsPath: '/fooq_rasak/ws', min: 2, max: 12,
    engine: MG.fooq_rasak, help: MG.fooq_rasakHelp,
    err: { not_your_turn: 'مو دورك', not_judge: 'ما تقدر تحكم على نفسك', no_judges: 'ما فيه أحد يحكم' },
    phaseName: { turn: 'الأسئلة', judge: 'الحكم', ended: 'النهاية' },
    stepKey: (v) => v.phase + ':' + v.round,
    myTurn: (v) => v.phase === 'turn' && v.me && v.cur === v.me.id,
    lobbyInfo: () => '<div class="card hint">كل واحد تطلع له بطاقة سرية (شخصية أو شي) يشوفها الكل بجوالاتهم إلا هو. بدوره يسأل أسئلة جوابها «نعم» أو «لا» لين يعرف مين هو!</div>',
    lobbyHost: (v, K) => '<div class="card col"><div class="big">إعدادات اللعبة</div>' +
      K.settingChips(v, 'set', v.setOrder.map((k) => [k, v.setNames[k]]), 'نوع البطاقات') +
      K.settingChips(v, 'sec', [[30, '٣٠ ثانية'], [45, '٤٥ ثانية'], [60, 'دقيقة'], [90, 'دقيقة ونص']], 'وقت كل دور') +
      K.settingChips(v, 'laps', [[3, '٣ لفّات'], [5, '٥ لفّات'], [8, '٨ لفّات']], 'كم دور لكل لاعب (أقصى حد)') + '</div>',
    evText: (v, e) => e.k === 'verdict' ? (e.ok ? '✅ ' : '❌ ') + nm(v, e.id) + (e.ok ? ' عرف بطاقته' : ' خمّن غلط') : e.k === 'turn' ? 'دور ' + nm(v, e.id) : '',
    click(a, el, K) {
      if (a === 'claim') { K.act('claim'); return true; }
      if (a === 'pass') { K.act('pass'); return true; }
      if (a === 'vote') { K.act('vote', { v: el.getAttribute('data-v') }); return true; }
      if (a === 'endgame') { K.act('end'); return true; }
      return false;
    },
    screen(v, K) {
      const me = v.me, ph = v.phase; let out = CSS + K.topbar(v, '<span class="pill">اللفّة ' + AR(Math.min(v.lap, v.laps)) + ' من ' + AR(v.laps) + '</span>');
      if (ph === 'turn') {
        const mine = v.cur === me.id;
        out += lastLine(v) + K.timerHtml(v);
        if (mine) out += '<div class="ann g"><div class="huge">دورك! 🎯</div><div class="mut" style="margin-top:6px;line-height:1.8">اسأل الباقين سؤال جوابه «نعم» أو «لا» بصوت عالي.<br>مثال: «أنا إنسان؟» «أنا لاعب كورة؟» «أنا أتاكل؟»</div></div>' +
          '<div class="stick col" style="gap:8px"><button class="btn gold" data-a="claim">عرفتها! بقول الجواب</button><button class="btn sec" data-a="pass">خلّص دوري</button></div>';
        else if (me.solved) out += '<div class="card ctr">✅ عرفت بطاقتك! الحين ساعد الباقين بالجواب على أسئلتهم.</div><div class="ann"><div class="big">دور ' + nm(v, v.cur) + '</div><div class="mut small">جاوبوه بـ«نعم» أو «لا» بس</div></div>';
        else out += '<div class="ann"><div class="big">دور ' + nm(v, v.cur) + ' يسأل</div><div class="mut small" style="margin-top:4px">جاوبوه بصوت: «نعم» أو «لا» بس! وانتبهوا لا تكشفون البطاقة 🤫</div></div>';
        out += cardGrid(v);
        if (me.host && !mine) out += '<div class="row" style="gap:8px">' + K.hostSkip(v, 'تخطّي الدور (المضيف)') + '<button class="btn sec sm" data-a="endgame">إنهاء اللعبة</button></div>';
      } else if (ph === 'judge') {
        const c = v.cards.find((x) => x.id === v.cur), mine = v.cur === me.id;
        out += K.timerHtml(v);
        if (mine) out += '<div class="ann g"><div class="huge">قل جوابك! 🎤</div><div class="mut" style="margin-top:6px">قل بصوت عالي مين تتوقع نفسك… والباقين يحكمون.</div></div><div class="card ctr mut">حكم ' + AR(v.votes.yes + v.votes.no) + ' من ' + AR(v.votes.total) + '</div>';
        else {
          out += '<div class="ann"><div class="big">' + nm(v, v.cur) + ' يقول إنه عرفها!</div><div class="mut small">اسمعوا جوابه… صح ولا غلط؟</div></div>';
          if (c && c.card) out += '<div class="fr-big">' + pic(c.card, 220) + '</div><div class="ctr big" style="margin:8px 0">' + esc(c.card.n) + '</div>';
          out += '<div class="row" style="gap:10px"><button class="btn ' + (me.vote === 'ok' ? 'gold' : 'sec') + ' sp" data-a="vote" data-v="ok">✅ صح</button><button class="btn ' + (me.vote === 'no' ? 'gold' : 'sec') + ' sp" data-a="vote" data-v="no">❌ غلط</button></div>' +
            '<div class="card ctr mut small">صح ' + AR(v.votes.yes) + ' · غلط ' + AR(v.votes.no) + ' · من ' + AR(v.votes.total) + '</div>';
        }
        out += me.host ? K.hostSkip(v, 'احسم الحكم الحين (المضيف)') : '';
      } else if (ph === 'ended') out = CSS + K.endScreen(v, '<div class="card col"><div class="big">البطاقات</div>' + cardGrid(v) + '</div>');
      return out;
    }
  };

  cfg.board = {
    title: '<b>فوق</b> راسك', timedPhases: ['turn', 'judge'], stepKey: (v) => v.phase + ':' + v.round,
    css: '.mdb .who{font-size:6em;font-weight:900;color:#ffd978;line-height:1.1}.mdb .fr-tv{display:flex;flex-wrap:wrap;gap:1em;justify-content:center;max-width:60em}.mdb .fr-tv div{width:8em;text-align:center;font-size:1.4em}.mdb .fr-tv .ph{width:8em;height:10.6em;border-radius:.8em;overflow:hidden;background:#fff;display:flex;align-items:center;justify-content:center;font-size:1em}.mdb .fr-tv img{width:100%;height:100%;object-fit:cover;object-position:top}',
    tone: (v) => (v.phase === 'judge' ? 'blue' : v.phase === 'ended' ? 'gold' : ''),
    render(v, B) {
      const ph = v.phase, N = (id) => esc(B.N(v, id));
      const tv = (list) => '<div class="fr-tv">' + list.map((c) => '<div><div class="ph">' + (c.card.m ? '<img src="/media/med_seed_' + esc(c.card.m) + '" alt="">' : '<span style="font-size:5em">' + esc(c.card.e) + '</span>') + '</div><b>' + esc(c.card.n) + '</b><br>' + N(c.id) + '</div>').join('') + '</div>';
      if (ph === 'turn') {
        const l = v.last;
        const core = (l && l.ok ? '<div class="sub">🎉 ' + N(l.id) + ' عرف إنه «' + esc(l.card.n) + '»</div>' : '') + '<div class="sub">دور</div><div class="who">' + N(v.cur) + '</div><div class="sub">يسأل سؤال جوابه نعم أو لا</div>';
        return '<div class="core">' + core + '</div>' + B.seats(v, { tag: (p) => (p.solved ? '<span class="tg ok">عرف ✅</span>' : '') });
      }
      if (ph === 'judge') return '<div class="core"><div class="who">' + N(v.cur) + '</div><div class="sub">يقول إنه عرفها! صح ولا غلط؟</div><div class="sub">صح ' + B.AR(v.votes.yes) + ' · غلط ' + B.AR(v.votes.no) + '</div></div>';
      if (ph === 'ended') {
        const top = v.players.slice().sort((a, b) => b.score - a.score)[0];
        return '<div class="core full"><div class="sub">الفايز</div><div class="big gold">' + esc(top.name) + '</div>' + tv(v.cards.filter((c) => c.card)) + B.ranking(v) + '</div>';
      }
      return '<div class="core"></div>';
    },
    cues(prev, v, B, fresh) {
      if (!fresh) return;
      if (v.phase === 'turn') { if (v.last && v.last.ok) B.sfx('fanfare'); else B.sfx('gong'); B.later(500, () => B.say('دور ' + B.N(v, v.cur))); }
      else if (v.phase === 'judge') { B.sfx('blip'); B.later(300, () => B.say(B.N(v, v.cur) + ' يقول إنه عرفها!')); }
      else if (v.phase === 'ended') { B.sfx('fanfare'); const top = v.players.slice().sort((a, b) => b.score - a.score)[0]; B.later(800, () => B.say('انتهت اللعبة. الفايز: ' + top.name + '.')); }
    }
  };
  root.DIWANIYA_CFG = cfg;
})(typeof self !== 'undefined' ? self : this);
