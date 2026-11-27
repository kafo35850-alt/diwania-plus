/* خمّن الشخصية — شاشات الجوال + شاشة التلفزيون */
(function (root) {
  'use strict';
  const MG = root.MG, esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
  const ICON = '<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="160" height="160" rx="30" fill="#1e3a8a"/>' +
    [0, 1, 2].map((r) => [0, 1, 2].map((c) => '<rect x="' + (22 + c * 40) + '" y="' + (22 + r * 40) + '" width="34" height="34" rx="7" fill="' + ((r + c) % 3 === 1 ? '#475569' : '#f8fafc') + '"/>').join('')).join('') +
    '<rect x="62" y="62" width="34" height="34" rx="7" fill="#F5B942"/><text x="79" y="88" text-anchor="middle" font-size="26" font-weight="900" fill="#1e3a8a" font-family="Tahoma,Arial">؟</text></svg>';
  const nm = (v, id) => { const p = v.players.find((x) => x.id === id); return p ? esc(p.name) : '؟'; };
  const face = (c, big) => c.m ? '<img src="/media/med_seed_' + esc(c.m) + '" alt="" loading="lazy">' : '<span class="em" style="font-size:' + (big ? 120 : 30) + 'px">' + esc(c.e) + '</span>';
  const CSS = '<style>.gw-b{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}.gw-c{position:relative;background:#fff;border-radius:10px;overflow:hidden;border:2px solid transparent;padding:0;display:flex;flex-direction:column;align-items:stretch;color:#0f172a;transition:transform .15s,opacity .15s}.gw-c .ph{aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#f1f5f9}.gw-c img{width:100%;height:100%;object-fit:cover;object-position:top}.gw-c .em{line-height:1}.gw-c .t{font-size:9.5px;font-weight:800;padding:2px 2px 3px;line-height:1.2;min-height:2.4em;display:flex;align-items:center;justify-content:center;text-align:center}.gw-c.dn{opacity:.28;transform:scale(.92);filter:grayscale(1)}.gw-c.dn::after{content:"✕";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:900;color:#dc2626}.gw-c.sel{border-color:#F5B942;box-shadow:0 0 0 3px rgba(245,185,66,.5)}.gw-c.gm{border-color:#f472b6}.gw-me{display:flex;gap:10px;align-items:center}.gw-me .ph{width:64px;height:64px;border-radius:12px;overflow:hidden;background:#fff;display:flex;align-items:center;justify-content:center;flex:none}.gw-me .ph img{width:100%;height:100%;object-fit:cover;object-position:top}.gw-big{width:min(56vw,220px);aspect-ratio:1/1;margin:0 auto;border-radius:18px;overflow:hidden;background:#fff;display:flex;align-items:center;justify-content:center;border:4px solid #F5B942}.gw-big img{width:100%;height:100%;object-fit:cover;object-position:top}.gw-ans{font-size:44px;font-weight:900}.gw-h{display:flex;flex-direction:column;gap:4px;font-size:13px}.gw-h div{display:flex;gap:8px}.gw-h b.y{color:#34d399}.gw-h b.n{color:#f87171}.gw-opp{background:radial-gradient(circle at 50% 0%,#1e2a5a,#0b1230);border:1px solid rgba(245,185,66,.35);border-radius:16px;padding:10px 12px 12px;margin:10px 0}.gw-opp-h{display:flex;justify-content:space-between;font-weight:800;font-size:13px;color:#fde68a;margin-bottom:8px}.gw-opp-h span{color:#cbd5e1}.gw-ob{direction:ltr;max-width:250px;margin:0 auto;display:grid;grid-template-columns:repeat(5,1fr);gap:5px;perspective:400px;padding:6px 8px 10px;border-radius:12px;background:linear-gradient(180deg,#a16207,#f5b942 45%,#92400e);box-shadow:inset 0 2px 6px rgba(255,255,255,.35),0 6px 14px rgba(0,0,0,.45)}.gw-ob i{display:block;aspect-ratio:3/4;border-radius:6px;background:linear-gradient(160deg,#fff3b0,#f5b942 40%,#b45309);box-shadow:inset 0 0 0 2px rgba(255,255,255,.35),0 3px 5px rgba(0,0,0,.35);transform-origin:bottom center;transition:transform .35s,opacity .35s}.gw-ob i.dn{transform:rotateX(72deg);opacity:.55;filter:brightness(.7)}</style>';
  const IDEAS = ['إنسان؟', 'ذكر؟', 'يلبس نظارة؟', 'عربي؟', 'لاعب كورة؟', 'مغني؟', 'عنده أجنحة؟', 'يعيش بالبحر؟', 'لونه أخضر؟', 'يتاكل؟', 'أكبر من الكرسي؟', 'يشتغل بالكهرباء؟'];

  function board(v, mode) {
    return '<div class="gw-b">' + v.board.map((c, i) => {
      const dn = v.me.down[i];
      const cls = (dn ? ' dn' : '') + (mode === 'pick' && v.me.secret === i ? ' sel' : '') + (mode === 'guess' ? ' gm' : '');
      return '<button class="gw-c' + cls + '" data-a="cell" data-i="' + i + '"><div class="ph">' + face(c) + '</div><div class="t">' + esc(c.n) + '</div></button>';
    }).join('') + '</div>';
  }
  // لوحة الخصم من ورا: بطاقات ذهبية، والمنزّلة تطيح على وجهها
  function oppBoard(v) {
    const d = v.oppDown || [];
    return '<div class="gw-opp"><div class="gw-opp-h">لوحة ' + nm(v, v.me.opp) + ' (من ورا) 👀<span>باقي ' + AR(v.left[v.me.opp]) + '</span></div><div class="gw-ob">' +
      d.map((x) => '<i class="' + (x ? 'dn' : '') + '"></i>').join('') + '</div></div>';
  }
  function mine(v) {
    if (v.me.secret === null || v.me.secret === undefined) return '';
    const c = v.board[v.me.secret];
    return '<div class="card gw-me"><div class="ph">' + face(c) + '</div><div><div class="mut small">شخصيتك السرية 🤫</div><div class="big">' + esc(c.n) + '</div></div><span class="sp"></span><span class="pill">باقي عندك ' + AR(v.left[v.me.id]) + '</span></div>';
  }
  function hist(v) {
    if (!v.history.length) return '';
    return '<div class="card col"><div class="mut small">الأسئلة اللي فاتت</div><div class="gw-h">' + v.history.slice().reverse().map((h) => '<div><span>' + nm(v, h.by) + ':</span>' + (h.ans === 'wrong' ? '<span>خمّن «' + esc(v.board[h.guess].n) + '» ❌</span>' : '<span>' + (h.text ? esc(h.text) : '(سؤال بالصوت)') + '</span><span class="sp"></span><b class="' + (h.ans === 'yes' ? 'y' : 'n') + '">' + (h.ans === 'yes' ? 'نعم' : 'لا') + '</b>') + '</div>').join('') + '</div></div>';
  }

  const cfg = {
    id: 'fooq_rasak', name: 'ديوانية خمّن الشخصية', nameHtml: 'ديوانية <b>خمّن الشخصية</b>', tagline: 'كل واحد يختار شخصية سرية… واسأل لين تعرف شخصية خصمك!', icon: ICON, wsPath: '/fooq_rasak/ws', min: 2, max: 2,
    engine: MG.fooq_rasak, help: MG.fooq_rasakHelp,
    err: { not_your_turn: 'مو دورك', room_full: 'الغرفة لشخصين بس' },
    phaseName: { pick: 'اختيار الشخصية', play: 'اللعب', result: 'نهاية الجولة', ended: 'النهاية' },
    stepKey: (v) => v.phase + ':' + v.round + ':' + (v.turn || '') + ':' + (v.step || ''),
    myTurn: (v) => (v.phase === 'play' && v.me && ((v.turn === v.me.id && v.step === 'ask') || (v.turn !== v.me.id && v.step === 'answer'))),
    lobbyInfo: () => '<div class="card hint">لعبة لشخصين: الاثنين قدامهم نفس لوحة الشخصيات. كل واحد يختار شخصية بالسر، وبالدور تسألون أسئلة جوابها «نعم» أو «لا» وتنزّلون البطاقات الغلط. أول من يعرف شخصية خصمه يفوز!</div>',
    lobbyHost: (v, K) => '<div class="card col"><div class="big">إعدادات اللعبة</div>' +
      K.settingChips(v, 'set', v.setOrder.map((k) => [k, v.setNames[k]]), 'نوع الشخصيات') +
      K.settingChips(v, 'size', [[20, '٢٠ بطاقة'], [30, '٣٠ بطاقة']], 'حجم اللوحة') +
      K.settingChips(v, 'rounds', [[1, 'جولة وحدة'], [3, 'أفضل من ٣'], [5, 'أفضل من ٥']], 'عدد الجولات') + '</div>',
    evText: (v, e) => e.k === 'win' ? '🏆 ' + nm(v, e.id) + ' عرف الشخصية' : e.k === 'wrong' ? '❌ ' + nm(v, e.id) + ' خمّن غلط' : '',
    click(a, el, K) {
      const v = K.ST.view;
      if (a === 'cell') {
        const i = Number(el.getAttribute('data-i'));
        if (v.phase === 'pick') { K.act('pick', { i }); return true; }
        if (v.phase === 'play') {
          if (K.ST.local.guess) { if (v.me.down[i]) { K.toast('هالبطاقة نازلة'); return true; } K.ST.local.guess = false; K.act('guess', { i }); return true; }
          K.act('flip', { i }); return true;
        }
        return true;
      }
      if (a === 'idea') { const inp = document.getElementById('gwq' + v.round); if (inp) inp.value = el.getAttribute('data-t'); return true; }
      if (a === 'ask') { const inp = document.getElementById('gwq' + v.round); K.act('ask', { text: inp ? inp.value.trim() : '' }); return true; }
      if (a === 'askvoice') { K.act('ask', { text: '' }); return true; }
      if (a === 'ans') { K.act('answer', { v: el.getAttribute('data-v') }); return true; }
      if (a === 'endturn') { K.act('endturn'); return true; }
      if (a === 'guessmode') { K.ST.local.guess = !K.ST.local.guess; K.render(); return true; }
      if (a === 'next') { K.act('next'); return true; }
      return false;
    },
    screen(v, K) {
      const me = v.me, ph = v.phase, opp = me.opp; let out = CSS + K.topbar(v);
      if (ph === 'pick') {
        if (me.secret === null) out += '<div class="ann g"><div class="big">اختار شخصيتك السرية 🤫</div><div class="mut small" style="margin-top:4px">لا تخلّي خصمك يشوف جوالك!</div></div>';
        else out += mine(v) + '<div class="card ctr mut">' + (v.picked[opp] ? '' : 'ننتظر ' + nm(v, opp) + ' يختار…') + ' تقدر تغيّر اختيارك.</div>';
        out += board(v, 'pick');
      } else if (ph === 'play') {
        const myTurn = v.turn === me.id, gm = !!K.ST.local.guess;
        out += mine(v);
        if (myTurn && v.step === 'ask') {
          out += '<div class="ann g"><div class="big">دورك! اسأل سؤال جوابه نعم أو لا</div></div>' +
            '<div class="card col"><input id="gwq' + v.round + '" class="inp" maxlength="80" autocomplete="off" placeholder="اكتب سؤالك… مثال: شخصيتك تلبس نظارة؟">' +
            '<div class="row wrap" style="gap:6px">' + IDEAS.map((t) => '<button class="chip" data-a="idea" data-t="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div>' +
            '<div class="row" style="gap:8px"><button class="btn gold sp" data-a="ask">أرسل السؤال</button><button class="btn sec sp" data-a="askvoice">سألته بصوتي</button></div></div>' +
            '<button class="btn ' + (gm ? 'gold' : 'sec') + '" data-a="guessmode">' + (gm ? 'إلغاء التخمين' : '🎯 أعرفها! أبي أخمّن') + '</button>';
        } else if (myTurn && v.step === 'answer') out += '<div class="ann"><div class="big">ننتظر جواب ' + nm(v, opp) + '…</div>' + (v.q.text ? '<div class="mut" style="margin-top:6px">«' + esc(v.q.text) + '»</div>' : '') + '</div>';
        else if (myTurn && v.step === 'flip') {
          out += '<div class="ann g"><div class="mut">' + (v.q.text ? '«' + esc(v.q.text) + '»' : 'جواب سؤالك') + '</div><div class="gw-ans" style="color:' + (v.q.ans === 'yes' ? '#34d399' : '#f87171') + '">' + (v.q.ans === 'yes' ? 'نعم ✅' : 'لا ❌') + '</div><div class="mut small">نزّل البطاقات اللي ما تنطبق (اضغط عليها)</div></div>' +
            '<div class="row" style="gap:8px"><button class="btn gold sp" data-a="endturn">خلّصت دوري</button><button class="btn ' + (gm ? 'gold' : 'sec') + ' sp" data-a="guessmode">' + (gm ? 'إلغاء التخمين' : '🎯 أخمّن') + '</button></div>';
        } else if (!myTurn && v.step === 'answer') {
          const c = v.board[me.secret];
          out += '<div class="ann g"><div class="mut">' + nm(v, opp) + ' يسألك:</div><div class="big" style="margin:6px 0">' + (v.q.text ? '«' + esc(v.q.text) + '»' : 'اسمع سؤاله 👂') + '</div><div class="mut small">عن شخصيتك: <b style="color:#fff">' + esc(c.n) + '</b></div></div>' +
            '<div class="gw-big">' + face(c, true) + '</div>' +
            '<div class="row" style="gap:10px;margin-top:10px"><button class="btn gold sp" data-a="ans" data-v="yes">نعم ✅</button><button class="btn sec sp" data-a="ans" data-v="no">لا ❌</button></div>';
        } else out += '<div class="ann"><div class="big">دور ' + nm(v, opp) + '</div><div class="mut small">' + (v.step === 'flip' ? 'جاوبت: ' + (v.q.ans === 'yes' ? 'نعم' : 'لا') + ' — ينزّل بطاقاته الحين' : 'يفكّر بسؤاله…') + '</div><div class="mut small" style="margin-top:4px">باقي عنده ' + AR(v.left[opp]) + ' بطاقة</div></div>';
        if (v.lastGuess && !v.lastGuess.ok && v.lastGuess.by === opp && v.turn === me.id && v.step === 'ask') out = out.replace('<div class="ann g"><div class="big">دورك!', '<div class="card ctr">❌ ' + nm(v, opp) + ' خمّن «' + esc(v.board[v.lastGuess.i].n) + '» وطلع غلط!</div><div class="ann g"><div class="big">دورك!');
        if (gm) out += '<div class="card ctr" style="border-color:#f472b6">🎯 اضغط على الشخصية اللي تتوقعها. لو غلطت ينتقل الدور!</div>';
        out += oppBoard(v) + board(v, gm ? 'guess' : 'play') + hist(v);
        out += me.host ? K.hostSkip(v, 'انقل الدور (المضيف)') : '';
      } else if (ph === 'result') {
        const won = v.winner === me.id, s = v.secrets;
        out += '<div class="ann g"><div class="huge">' + (won ? '🏆 فزت بالجولة!' : '😅 ' + nm(v, v.winner) + ' عرفها!') + '</div></div>' +
          '<div class="row" style="gap:10px">' + v.players.map((p) => '<div class="card col sp ctr"><div class="mut small">شخصية ' + esc(p.name) + '</div><div class="gw-big" style="width:100%">' + face(v.board[s[p.id]], true) + '</div><b>' + esc(v.board[s[p.id]].n) + '</b></div>').join('') + '</div>' +
          K.scores(v, 'الجولات') + (me.host ? '<div class="stick"><button class="btn gold" data-a="next">التالي</button></div>' : '<div class="card ctr mut">ننتظر المضيف…</div>');
      } else if (ph === 'ended') out = CSS + K.endScreen(v);
      return out;
    }
  };

  cfg.board = {
    title: 'ديوانية <b>خمّن الشخصية</b>', timedPhases: [], stepKey: (v) => v.phase + ':' + v.round + ':' + (v.turn || '') + ':' + (v.step || ''),
    css: '.mdb .who{font-size:5em;font-weight:900;color:#ffd978;line-height:1.1}.mdb .vs{display:flex;gap:4em;font-size:2.4em;justify-content:center}.mdb .vs div{text-align:center}.mdb .vs b{display:block;font-size:2em;color:#ffd978}.mdb .ans{font-size:6em;font-weight:900}.mdb .gwtv{width:9em;height:9em;border-radius:1em;overflow:hidden;background:#fff;display:flex;align-items:center;justify-content:center;font-size:1.6em;margin:0 auto}.mdb .gwtv img{width:100%;height:100%;object-fit:cover;object-position:top}.mdb .gwb{direction:ltr;display:grid;grid-template-columns:repeat(5,1.3em);gap:.25em;padding:.4em;margin:.3em auto;border-radius:.4em;background:linear-gradient(180deg,#a16207,#f5b942 45%,#92400e);perspective:10em;width:max-content}.mdb .gwb i{display:block;height:1.7em;border-radius:.2em;background:linear-gradient(160deg,#fff3b0,#f5b942 40%,#b45309);transform-origin:bottom;transition:transform .35s}.mdb .gwb i.dn{transform:rotateX(72deg);opacity:.5}',
    tone: (v) => (v.phase === 'result' || v.phase === 'ended' ? 'gold' : ''),
    render(v, B) {
      const ph = v.phase, N = (id) => esc(B.N(v, id));
      const back = (id) => '<div class="gwb">' + ((v.downs && v.downs[id]) || []).map((x) => '<i class="' + (x ? 'dn' : '') + '"></i>').join('') + '</div>';
      const vs = () => '<div class="vs">' + v.players.map((p) => '<div>' + esc(p.name) + back(p.id) + '<b>' + B.AR(v.left ? v.left[p.id] : 0) + '</b><span class="sub">بطاقة باقية</span></div>').join('') + '</div>';
      if (ph === 'pick') return '<div class="core"><div class="who">اختاروا شخصياتكم 🤫</div><div class="sub">' + v.players.map((p) => esc(p.name) + (v.picked[p.id] ? ' ✅' : ' …')).join(' · ') + '</div></div>';
      if (ph === 'play') {
        let mid = '<div class="sub">دور</div><div class="who">' + N(v.turn) + '</div>';
        if (v.step === 'answer') mid += '<div class="sub">' + (v.q.text ? '«' + esc(v.q.text) + '»' : 'يسأل…') + '</div>';
        if (v.step === 'flip') mid += '<div class="sub">' + (v.q.text ? '«' + esc(v.q.text) + '»' : '') + '</div><div class="ans" style="color:' + (v.q.ans === 'yes' ? '#34d399' : '#f87171') + '">' + (v.q.ans === 'yes' ? 'نعم' : 'لا') + '</div>';
        return '<div class="core">' + mid + vs() + '</div>';
      }
      if (ph === 'result') {
        const s = v.secrets;
        return '<div class="core full"><div class="sub">فاز بالجولة</div><div class="who">' + N(v.winner) + '</div><div class="vs">' + v.players.map((p) => { const c = v.board[s[p.id]]; return '<div>' + esc(p.name) + '<div class="gwtv">' + (c.m ? '<img src="/media/med_seed_' + esc(c.m) + '" alt="">' : '<span style="font-size:5em">' + esc(c.e) + '</span>') + '</div><b style="font-size:1em">' + esc(c.n) + '</b></div>'; }).join('') + '</div></div>';
      }
      if (ph === 'ended') { const top = v.players.slice().sort((a, b) => b.score - a.score)[0]; return '<div class="core full"><div class="sub">الفايز</div><div class="big gold">' + esc(top.name) + '</div>' + B.ranking(v) + '</div>'; }
      return '<div class="core"></div>';
    },
    cues(prev, v, B, fresh) {
      if (!fresh) return;
      if (v.phase === 'pick') { B.sfx('gong'); B.later(400, () => B.say('اختاروا شخصياتكم بالسر')); }
      else if (v.phase === 'play' && v.step === 'ask') { B.sfx('blip'); B.later(300, () => B.say('دور ' + B.N(v, v.turn))); }
      else if (v.phase === 'play' && v.step === 'flip') B.later(200, () => B.say(v.q.ans === 'yes' ? 'نعم' : 'لا'));
      else if (v.phase === 'result') { B.sfx('fanfare'); B.later(600, () => B.say(B.N(v, v.winner) + ' عرف الشخصية!')); }
      else if (v.phase === 'ended') { B.sfx('fanfare'); const top = v.players.slice().sort((a, b) => b.score - a.score)[0]; B.later(800, () => B.say('الفايز: ' + top.name)); }
    }
  };
  root.DIWANIYA_CFG = cfg;
})(typeof self !== 'undefined' ? self : this);
