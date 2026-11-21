/* رسّام الديوانية (برا السالفة) — شاشات الجوال + شاشة التلفزيون */
(function (root) {
  'use strict';
  const MG = root.MG, esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
  const ICON = '<img src="/media/med_seed_game_draw_guess?v=3" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:22px;display:block">';
  const nm = (v, id) => { const p = v.players.find((x) => x.id === id); return p ? esc(p.name) : '؟'; };
  const col = (v, id) => { const p = v.players.find((x) => x.id === id); return p ? p.color : '#fff'; };
  const CSS = '.dg-wrap{position:relative;background:#fbf7ee;border-radius:18px;border:3px solid #f5b942;box-shadow:0 10px 30px rgba(0,0,0,.4);overflow:hidden;touch-action:none}' +
    '.dg-wrap canvas{display:block;width:100%;height:auto;aspect-ratio:1/1;touch-action:none}' +
    '.dg-turn{position:absolute;top:8px;right:8px;padding:4px 10px;border-radius:999px;background:rgba(10,15,36,.82);color:#fff;font-weight:800;font-size:13px}' +
    '.dg-secret{cursor:pointer;user-select:none;-webkit-user-select:none;text-align:center;padding:22px 14px;border-radius:18px;border:2px dashed rgba(245,185,66,.6);background:rgba(245,185,66,.08)}' +
    '.dg-secret.open{border-style:solid;background:linear-gradient(135deg,rgba(245,185,66,.25),rgba(124,58,237,.18))}' +
    '.dg-secret .w{font-size:40px;font-weight:900;color:var(--gold);margin-top:6px}.dg-secret.out .w{color:#fda4af;font-size:30px}' +
    '.dg-dot{display:inline-block;width:12px;height:12px;border-radius:50%;margin-inline-end:6px;vertical-align:middle}';
  if (typeof document !== 'undefined' && !document.getElementById('dgCss')) { const st = document.createElement('style'); st.id = 'dgCss'; st.textContent = CSS; (document.head || document.documentElement).appendChild(st); }

  // يرسم كل الخطوط (إحداثيات ٠–١٠٠٠) على اللوحة
  function paint(canvas, strokes, extra) {
    if (!canvas) return;
    const size = canvas.width, ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fbf7ee'; ctx.fillRect(0, 0, size, size);
    const all = (strokes || []).concat(extra ? [extra] : []);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    all.forEach((s) => {
      if (!s.pts || !s.pts.length) return;
      ctx.strokeStyle = s.c; ctx.lineWidth = Math.max(3, size / 110);
      ctx.beginPath(); ctx.moveTo(s.pts[0][0] * size / 1000, s.pts[0][1] * size / 1000);
      if (s.pts.length === 1) ctx.lineTo(s.pts[0][0] * size / 1000 + 0.1, s.pts[0][1] * size / 1000);
      for (let i = 1; i < s.pts.length; i++) ctx.lineTo(s.pts[i][0] * size / 1000, s.pts[i][1] * size / 1000);
      ctx.stroke();
    });
  }

  const cfg = {
    id: 'draw_guess', name: 'رسّام الديوانية', nameHtml: '<b>رسّام</b> الديوانية', tagline: 'كلكم ترسمون نفس الكلمة… إلا واحد برا السالفة!', icon: ICON, wsPath: '/draw_guess/ws', min: 3, max: 12,
    engine: MG.draw_guess, help: MG.draw_guessHelp,
    err: { not_your_turn: 'مو دورك الحين', empty_stroke: 'ارسم خط أول', not_outsider: 'هذا الخيار لبرا السالفة بس' },
    phaseName: { word: 'الكلمة', draw: 'الرسم', vote: 'التصويت', guess: 'الفرصة الأخيرة', result: 'النتيجة', ended: 'النهاية' },
    stepKey: (v) => v.phase + ':' + v.round + ':' + (v.turnIdx || 0),
    lobbyInfo: () => '<div class="card hint">الكل يعرف الكلمة إلا واحد «برا السالفة». كل واحد يرسم خط واحد بدوره من جواله، وبعدين تصوّتون مين برا السالفة!</div>' +
      '<div class="card col"><div class="mut small">تبي الوضع القديم؟ واحد يرسم والباقي يخمنون، على جهاز واحد.</div><button class="btn sec" data-a="dgclassic">🎨 الوضع الكلاسيكي</button></div>',
    lobbyHost: (v, K) => '<div class="card col"><div class="big">إعدادات اللعبة</div>' +
      K.settingChips(v, 'rounds', [[3, '٣ جولات'], [5, '٥ جولات'], [8, '٨ جولات']], 'عدد الجولات') +
      K.settingChips(v, 'laps', [[1, 'لفّة وحدة'], [2, 'لفّتين'], [3, '٣ لفّات']], 'كم مرة يرسم كل واحد') +
      K.settingChips(v, 'turn', [[20, '٢٠ ثانية'], [30, '٣٠ ثانية'], [45, '٤٥ ثانية']], 'وقت كل خط') + '</div>',
    click(a, el, K) {
      const v = K.ST.view, L = K.ST.local;
      if (a === 'dgclassic') { const u = new URL(root.location.href); u.searchParams.set('mode', 'classic'); u.hash = ''; root.location.href = u.toString(); return true; }
      if (a === 'dgshow') { L.show = !L.show; K.render(); return true; }
      if (a === 'dgready') { K.act('ready'); return true; }
      if (a === 'dgundo') { L.cur = null; K.render(); return true; }
      if (a === 'dgsend') { if (!L.cur || !L.cur.pts.length) { K.toast('ارسم خط أول'); return true; } K.act('stroke', { pts: L.cur.pts }); L.cur = null; return true; }
      if (a === 'dgvote') { K.act('vote', { target: el.getAttribute('data-id') }); return true; }
      if (a === 'dgguess') { K.act('guess', { w: el.getAttribute('data-w') }); return true; }
      if (a === 'next') { K.act('next'); return true; }
      return false;
    },
    screen(v, K) {
      const me = v.me, ph = v.phase, L = K.ST.local; let out = K.topbar(v);
      const cat = '<div class="row" style="justify-content:center"><span class="chip">الفئة: ' + esc(v.cat) + '</span></div>';
      const board = (label) => '<div class="dg-wrap"><canvas id="dgCanvas" width="900" height="900"></canvas>' + (label ? '<div class="dg-turn">' + label + '</div>' : '') + '</div>';
      const secret = '<div class="dg-secret ' + (L.show ? 'open ' : '') + (me.outsider ? 'out' : '') + '" data-a="dgshow">' +
        (L.show ? (me.outsider ? '<div class="mut">🤫 لا تبيّن!</div><div class="w">أنت برا السالفة</div><div class="mut small" style="margin-top:6px">ما تعرف الكلمة. الفئة: ' + esc(v.cat) + '. حاول تقلّدهم.</div>' : '<div class="mut">كلمتك السرية</div><div class="w">' + esc(me.word) + '</div>') + '<div class="mut small" style="margin-top:8px">اضغط عشان تخفيها</div>'
          : '<div class="big">👆 اضغط عشان تشوف كلمتك</div><div class="mut small" style="margin-top:6px">خبّ الجوال عن اللي جنبك</div>') + '</div>';
      if (ph === 'word') {
        out += K.timerHtml(v) + cat + secret;
        out += me.ready ? '<div class="card ctr">جاهز ✓ — ننتظر الباقين (' + AR(v.readyCount) + ' من ' + AR(v.liveCount) + ')</div>' : '<div class="stick"><button class="btn gold" data-a="dgready">شفت كلمتي، جاهز ✅</button></div>';
        out += me.host ? K.hostSkip(v, 'ابدأ الرسم الحين (المضيف)') : '';
      } else if (ph === 'draw') {
        const mine = v.turn === me.id;
        out += K.timerHtml(v) + cat;
        out += '<div class="card ctr ' + (mine ? '' : 'mut') + '" style="' + (mine ? 'border-color:var(--gold)' : '') + '">' + (mine ? '<b style="color:var(--gold);font-size:20px">✏️ دورك! ارسم خط واحد بس</b>' : 'دور <span class="dg-dot" style="background:' + col(v, v.turn) + '"></span><b>' + nm(v, v.turn) + '</b> يرسم…') + '<div class="mut small" style="margin-top:4px">الخط ' + AR(v.turnIdx + 1) + ' من ' + AR(v.turns) + '</div></div>';
        out += board(mine ? 'ارسم بإصبعك' : '');
        if (mine) out += '<div class="stick col" style="gap:8px"><button class="btn gold" data-a="dgsend">أرسل خطي ✓</button><button class="btn sec sm" data-a="dgundo">↩️ امسح وأعد الخط</button></div>';
        out += '<details class="card"><summary class="mut small">كلمتي</summary>' + secret + '</details>';
        out += me.host ? K.hostSkip(v, 'تخطّى هالدور (المضيف)') : '';
      } else if (ph === 'vote') {
        out += K.timerHtml(v) + '<div class="ann"><div class="big">مين برا السالفة؟ 🕵️</div><div class="mut" style="margin-top:6px">صوّت على اللي تشك فيه. صوّت ' + AR(v.votedCount) + ' من ' + AR(v.liveCount) + '</div></div>';
        out += board('');
        out += '<div class="card col">' + v.players.filter((p) => p.id !== me.id).map((p) => '<button class="pick ' + (me.vote === p.id ? 'sel' : '') + '" style="width:100%;flex-direction:row;justify-content:flex-start;gap:8px" data-a="dgvote" data-id="' + p.id + '"><span class="dg-dot" style="background:' + p.color + '"></span><b>' + esc(p.name) + '</b>' + (me.vote === p.id ? '<span class="sp"></span><span class="tag g">صوتك</span>' : '') + '</button>').join('') + '</div>';
        out += me.host ? K.hostSkip(v, 'أنهِ التصويت الحين (المضيف)') : '';
      } else if (ph === 'guess') {
        out += K.timerHtml(v);
        if (me.outsider) {
          out += '<div class="ann r"><div class="big">انكشفت! 😅</div><div class="mut" style="margin-top:6px">بس عندك فرصة: خمّن الكلمة وتفوز بالجولة.</div></div>';
          out += '<div class="card col">' + v.options.map((w) => '<button class="btn sec" data-a="dgguess" data-w="' + esc(w) + '">' + esc(w) + '</button>').join('') + '</div>';
        } else out += '<div class="ann g"><div class="big">صدتوه! 🎯</div><div class="mut" style="margin-top:6px"><b>' + nm(v, v.accused) + '</b> برا السالفة… ننتظره يخمّن الكلمة.</div></div>' + board('');
      } else if (ph === 'result') {
        const r = v.result;
        const msg = r.how === 'escaped' ? '😎 ما انكشف! ' + nm(v, r.outsider) + ' كان برا السالفة' : r.how === 'guessed' ? '🧠 انكشف بس خمّن الكلمة صح! ' + nm(v, r.outsider) + ' ياخذ النقاط' : '🎯 صدتوه! ' + nm(v, r.outsider) + ' كان برا السالفة';
        out += '<div class="ann ' + (r.how === 'caught' ? 'g' : 'r') + '"><div class="big">' + msg + '</div><div class="mut" style="margin-top:6px">الكلمة: <b style="color:var(--gold)">' + esc(r.word) + '</b>' + (r.guess ? ' · خمّن: ' + esc(r.guess) : '') + '</div></div>';
        out += board('');
        out += '<div class="card col"><div class="big">نقاط الجولة</div>' + v.players.slice().sort((a, b) => (r.delta[b.id] || 0) - (r.delta[a.id] || 0)).map((p) => '<div class="pl ' + (p.id === me.id ? 'me' : '') + '">' + K.av(p, 30) + '<b>' + esc(p.name) + '</b>' + (p.id === r.outsider ? '<span class="tag r">برا السالفة</span>' : '') + '<span class="sp"></span><span class="mut small">' + AR(r.tally[p.id] || 0) + ' صوت</span><span class="tag ' + (r.delta[p.id] ? 'g' : '') + '">+' + AR(r.delta[p.id] || 0) + '</span></div>').join('') + '</div>';
        out += me.host ? '<div class="stick"><button class="btn gold" data-a="next">' + (v.round >= v.rounds ? 'النتيجة النهائية' : 'الجولة الجاية') + '</button></div>' : '<div class="card ctr mut">ننتظر المضيف…</div>';
      } else if (ph === 'ended') out = K.endScreen(v);
      return out;
    },
    // بعد كل رسم للشاشة: نرسم الخطوط، ونفعّل الرسم إذا كان الدور لي
    after(v, K) {
      const c = document.getElementById('dgCanvas'); if (!c) return;
      const L = K.ST.local;
      paint(c, v.strokes, L.cur);
      if (v.phase !== 'draw' || v.turn !== (v.me && v.me.id)) return;
      const myColor = col(v, v.me.id);
      const at = (e) => { const r = c.getBoundingClientRect(); return [Math.round((e.clientX - r.left) / r.width * 1000), Math.round((e.clientY - r.top) / r.height * 1000)]; };
      let drawing = false;
      c.onpointerdown = (e) => { e.preventDefault(); drawing = true; try { c.setPointerCapture(e.pointerId); } catch (x) { } L.cur = { c: myColor, pts: [at(e)] }; paint(c, v.strokes, L.cur); };
      c.onpointermove = (e) => { if (!drawing || !L.cur) return; const p = at(e), last = L.cur.pts[L.cur.pts.length - 1]; if (Math.abs(p[0] - last[0]) + Math.abs(p[1] - last[1]) < 6 || L.cur.pts.length >= 400) return; L.cur.pts.push(p); paint(c, v.strokes, L.cur); };
      c.onpointerup = c.onpointercancel = () => { drawing = false; };
    }
  };

  // ---------------------------------------------------------------- التلفزيون
  cfg.board = {
    title: '<b>رسّام</b> الديوانية', timedPhases: ['word', 'draw', 'vote', 'guess'], stepKey: (v) => v.phase + ':' + v.round + ':' + (v.turnIdx || 0),
    css: '.mdb .dgb{display:flex;gap:3em;align-items:center;justify-content:center}.mdb .dgb canvas{width:58em;height:58em;border-radius:1.4em;border:.35em solid #f5b942;background:#fbf7ee;box-shadow:0 1em 3em rgba(0,0,0,.45)}.mdb .dgs{display:flex;flex-direction:column;gap:1em;font-size:2.4em;max-width:16em}.mdb .dgs .now{font-size:1.5em;font-weight:900}.mdb .dgs i{display:inline-block;width:.8em;height:.8em;border-radius:50%;margin-inline-end:.35em;vertical-align:middle}.mdb .dgs .cat{color:#ffd978;font-weight:800}',
    tone: (v) => (v.phase === 'vote' ? 'vote' : v.phase === 'result' && v.result && v.result.how !== 'caught' ? 'red' : v.phase === 'ended' ? 'gold' : ''),
    render(v, B) {
      const ph = v.phase, N = (id) => esc(B.N(v, id)); const dot = (id) => { const p = v.players.find((x) => x.id === id); return '<i style="background:' + (p ? p.color : '#fff') + '"></i>'; };
      if (ph === 'ended') { const top = v.players.slice().sort((a, b) => b.score - a.score)[0]; return '<div class="core full"><div class="sub">الفايز</div><div class="big gold">' + esc(top.name) + '</div>' + B.ranking(v) + '</div>'; }
      let side = '<div class="cat">الفئة: ' + esc(v.cat) + '</div>';
      if (ph === 'word') side += '<div class="now">شوفوا كلماتكم بالجوالات 🤫</div><div>جاهز ' + B.AR(v.readyCount) + ' من ' + B.AR(v.liveCount) + '</div><div class="sub">واحد منكم برا السالفة!</div>';
      else if (ph === 'draw') side += '<div class="now">' + dot(v.turn) + N(v.turn) + ' يرسم ✏️</div><div>الخط ' + B.AR(v.turnIdx + 1) + ' من ' + B.AR(v.turns) + '</div><div class="sub">كل واحد خط واحد بس</div>';
      else if (ph === 'vote') side += '<div class="now">مين برا السالفة؟ 🕵️</div><div>صوّت ' + B.AR(v.votedCount) + ' من ' + B.AR(v.liveCount) + '</div>';
      else if (ph === 'guess') side += '<div class="now">صدتوا ' + N(v.accused) + '! 🎯</div><div>عنده فرصة أخيرة يخمّن الكلمة…</div>';
      else if (ph === 'result') { const r = v.result; side += '<div class="now">' + (r.how === 'caught' ? '🎯 صدتوه!' : r.how === 'guessed' ? '🧠 خمّنها صح!' : '😎 ما انكشف!') + '</div><div>برا السالفة: ' + dot(r.outsider) + N(r.outsider) + '</div><div>الكلمة: <b class="gold">' + esc(r.word) + '</b></div>'; }
      return '<div class="core"><div class="dgb"><canvas id="dgBoardCanvas" width="1000" height="1000"></canvas><div class="dgs">' + side + '</div></div></div>' + (ph === 'word' || ph === 'vote' ? B.seats(v, { tag: (p) => (ph === 'word' ? (p.ready ? '<span class="tg ok">جاهز</span>' : '') : (p.voted ? '<span class="tg ok">صوّت</span>' : '')) }) : '');
    },
    after(stage, v) { if (v && v.strokes) paint(stage.querySelector('#dgBoardCanvas'), v.strokes); },
    cues(prev, v, B, fresh) {
      if (!fresh) return;
      if (v.phase === 'word') { B.sfx('gong'); B.later(500, () => B.say('الجولة ' + B.AR(v.round) + '. الفئة: ' + v.cat + '. شوفوا كلماتكم، وواحد منكم برا السالفة!')); }
      else if (v.phase === 'draw') { B.sfx('blip'); if (v.turnIdx === 0) B.later(300, () => B.say('يلا نبدأ الرسم. أول واحد: ' + B.N(v, v.turn))); }
      else if (v.phase === 'vote') { B.sfx('bell'); B.later(400, () => B.say('خلص الرسم. صوّتوا: مين برا السالفة؟')); }
      else if (v.phase === 'guess') { B.sfx('gavel'); B.later(400, () => B.say('صدتوه! ' + B.N(v, v.accused) + ' برا السالفة. عنده فرصة أخيرة.')); }
      else if (v.phase === 'result') { B.sfx('fanfare'); B.later(500, () => B.say('الكلمة كانت: ' + v.result.word)); }
      else if (v.phase === 'ended') { B.sfx('fanfare'); }
    }
  };
  root.DIWANIYA_CFG = cfg;
})(typeof self !== 'undefined' ? self : this);
