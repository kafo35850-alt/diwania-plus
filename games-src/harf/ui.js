/* حرف ونص — شاشات الجوال + شاشة التلفزيون (فوق kit/phone.js و kit/board.js) */
(function (root) {
  'use strict';
  const MG = root.MG, esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
  const ICON = '<img src="/media/med_seed_game_harf?v=3" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:22px;display:block">';
  const STATUS = { ok: ['g', 'صح ✅'], empty: ['', 'فاضية'], pending: ['', 'ينتظر المضيف'], rejected: ['r', 'غلط ❌'] };
  // العد التنازلي: كم ثانية باقية قبل ما يطلع الحرف
  const cdLeft = (v, K) => { const ms = K && K.remaining ? K.remaining(v) : Math.max(0, (v.deadline || 0) - Date.now()); return Math.max(1, Math.min(3, Math.ceil((ms - 1000) / 1000))); };
  const CSS = '.hf-cd{font-size:120px;font-weight:900;color:var(--gold);text-align:center;line-height:1;animation:hfPop .9s ease-out infinite}' +
    '@keyframes hfPop{0%{transform:scale(1.5);opacity:0}25%{transform:scale(1);opacity:1}100%{transform:scale(.9);opacity:.85}}' +
    '.hf-intro{position:fixed;inset:0;z-index:50;display:grid;place-items:center;pointer-events:none;background:rgba(6,9,24,.75);animation:hfBg 1.9s forwards}' +
    '.hf-intro b{font-size:190px;font-weight:900;color:var(--gold);text-shadow:0 0 40px rgba(245,185,66,.6);animation:hfUp 1.9s cubic-bezier(.6,0,.3,1) forwards}' +
    '@keyframes hfUp{0%{transform:scale(.3);opacity:0}25%{transform:scale(1.15);opacity:1}55%{transform:scale(1)}100%{transform:translateY(-38vh) scale(.35);opacity:0}}' +
    '@keyframes hfBg{0%,60%{opacity:1}100%{opacity:0}}' +
    '.hf-cell{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:12px;border:2px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04)}' +
    '.hf-cell.ok{border-color:#10b981;background:rgba(16,185,129,.18)}.hf-cell.rejected{border-color:#ef4444;background:rgba(239,68,68,.18)}.hf-cell.rejected b{text-decoration:line-through;color:#fca5a5}' +
    '.hf-cell .jb{border:0;border-radius:10px;padding:6px 10px;font-weight:900;cursor:pointer;background:rgba(255,255,255,.1);color:#fff}' +
    '.hf-cell .jb.y.on{background:#10b981}.hf-cell .jb.n.on{background:#ef4444}';
  if (typeof document !== 'undefined' && !document.getElementById('hfCss')) { const st = document.createElement('style'); st.id = 'hfCss'; st.textContent = CSS; (document.head || document.documentElement).appendChild(st); }
  const nm = (v, id) => { const p = v.players.find((x) => x.id === id); return p ? esc(p.name) : '؟'; };
  let KREF = null, BREF = null, saveT = 0; const BOARD_FLY = { round: 0 };
  // يحدّث رقم العد التنازلي كل ربع ثانية (الجوال والتلفزيون)
  if (typeof document !== 'undefined') setInterval(() => {
    document.querySelectorAll('[data-hfcd]').forEach((el) => {
      const onBoard = !!el.closest('.mdb'), R = onBoard ? BREF : KREF;
      const v = R && (onBoard ? R.state.view : R.ST.view); if (!v || v.phase !== 'countdown') return;
      const n = AR(cdLeft(v, R)); if (el.textContent !== n) el.textContent = n;
    });
  }, 250);

  const inputId = (v, i) => 'hf' + v.round + '_' + i;
  function collect(v) {
    return v.fields.map((_, i) => { const el = document.getElementById(inputId(v, i)); return el ? el.value : ''; });
  }
  // حفظ تلقائي أثناء الكتابة عشان ما يضيع شي لو خلص الوقت
  if (typeof document !== 'undefined') {
    document.addEventListener('input', (e) => {
      if (!e.target || !e.target.hasAttribute || !e.target.hasAttribute('data-hf') || !KREF) return;
      clearTimeout(saveT);
      saveT = setTimeout(() => { const v = KREF.ST.view; if (v && v.phase === 'write' && !v.me.done) KREF.act('save', { answers: collect(v) }); }, 600);
    });
  }

  const cfg = {
    id: 'harf', name: 'حروف الديوانية', nameHtml: '<b>حروف</b> الديوانية', tagline: 'حرف واحد… وكل الخانات لازم تبدأ فيه', icon: ICON, wsPath: '/harf/ws', min: 2, max: 40,
    engine: MG.harf, help: MG.harfHelp,
    err: { need_marks: 'احكم على كل الإجابات أول (صح أو غلط)' },
    phaseName: { countdown: 'استعدوا', write: 'الكتابة', review: 'حكم المضيف', result: 'النتيجة', ended: 'النهاية' },
    stepKey: (v) => (v.stopBy || '') + ':' + v.phase,
    lobbyInfo: () => '<div class="card hint">كل جولة يطلع حرف، وتكتب كلمة تبدأ فيه لكل خانة. أول من يخلّص يوقّف الكل!</div>',
    lobbyHost: (v, K) => '<div class="card col"><div class="big">إعدادات اللعبة</div>' +
      K.settingChips(v, 'rounds', [[3, '٣ جولات'], [5, '٥ جولات'], [8, '٨ جولات']], 'عدد الجولات') +
      K.settingChips(v, 'sec', [[60, 'دقيقة'], [90, 'دقيقة ونص'], [120, 'دقيقتين']], 'وقت الكتابة') +
      K.settingChips(v, 'set', v.setOrder.map((k) => [k, v.setNames[k]]), 'الخانات') + '</div>',
    click(a, el, K) {
      const v = K.ST.view;
      if (a === 'hfdone') { K.act('done', { answers: collect(v) }); return true; }
      if (a === 'hfmark') { K.act('mark', { target: el.getAttribute('data-id'), i: Number(el.getAttribute('data-i')), v: el.getAttribute('data-v') }); return true; }
      if (a === 'next') { K.act('next'); return true; }
      return false;
    },
    screen(v, K) {
      KREF = K;
      const me = v.me, ph = v.phase; let out = K.topbar(v);
      const letterCard = '<div class="ann g"><div class="mut">الحرف</div><div style="font-size:72px;font-weight:900;line-height:1.1;color:var(--gold)">' + esc(v.letter) + '</div></div>';
      if (ph === 'countdown') {
        out += '<div class="ann"><div class="big">استعدوا… الحرف بيطلع بعد</div><div class="hf-cd" data-hfcd>' + AR(cdLeft(v, K)) + '</div></div>';
        out += '<div class="card col">' + v.fields.map((f) => '<div class="row"><span class="mut">' + esc(f) + '</span></div>').join('') + '</div>';
      } else if (ph === 'write') {
        // الحرف يطلع كبير بنص الشاشة أول مرة، ثم يطير لمكانه فوق
        if (!K.ST.local.hfIntro) { K.ST.local.hfIntro = 1; out += '<div class="hf-intro"><b>' + esc(v.letter) + '</b></div>'; }
        out += K.timerHtml(v);
        out += letterCard;
        if (v.stopBy) out += '<div class="card ctr" style="border-color:var(--red)"><b>' + nm(v, v.stopBy) + '</b> خلّص! باقي ثواني بس ⏱️</div>';
        if (me.done) {
          out += '<div class="card ctr">أرسلت إجاباتك ✓<div class="mut small" style="margin-top:6px">خلّص ' + AR(v.doneCount) + ' من ' + AR(v.liveCount) + '</div></div>';
          out += '<div class="card col">' + v.fields.map((f, i) => '<div class="row"><span class="mut">' + esc(f) + '</span><span class="sp"></span><b>' + esc(me.answers[i] || '—') + '</b></div>').join('') + '</div>';
        } else {
          out += '<div class="card col">' + v.fields.map((f, i) => '<label class="col" style="gap:4px"><span class="mut small">' + esc(f) + '</span><input id="' + inputId(v, i) + '" data-hf="1" class="inp" maxlength="30" autocomplete="off" placeholder="' + esc(v.letter) + '…" value="' + esc(me.answers[i] || '') + '"></label>').join('') + '</div>';
          out += '<div class="stick"><button class="btn gold" data-a="hfdone">خلّصت! ✋</button></div>';
        }
        out += me.host ? K.hostSkip(v, 'إنهاء الكتابة الحين (المضيف)') : '';
      } else if (ph === 'review') {
        if (me.host) {
          out += '<div class="ann"><div class="big">احكم على الإجابات 👨‍⚖️</div><div class="mut" style="margin-top:6px">اضغط ✅ للصح و❌ للغلط. ما تقدر تكمل لين تحكم على كل الإجابات.' + (v.pending ? ' باقي <b style="color:#fff">' + AR(v.pending) + '</b>.' : ' خلصت! ✓') + '</div></div>';
          out += v.fields.map((f, i) => '<div class="card col"><div class="row"><b>' + esc(f) + '</b><span class="sp"></span><span class="chip">' + esc(v.letter) + '</span></div>' +
            v.table.map((row) => {
              const a = row.answers[i] || '', st = row.status[i];
              if (!a) return '<div class="hf-cell"><span class="mut small">' + nm(v, row.id) + '</span><span class="sp"></span><span class="mut">— فاضية</span></div>';
              return '<div class="hf-cell ' + st + '"><span class="mut small">' + nm(v, row.id) + '</span><span class="sp"></span><b>' + esc(a) + '</b>' + (row.off[i] ? '<span class="tag r" title="ما تبدأ بالحرف">⚠️ الحرف</span>' : '') +
                '<button class="jb y ' + (st === 'ok' ? 'on' : '') + '" data-a="hfmark" data-v="ok" data-id="' + row.id + '" data-i="' + i + '">✅</button>' +
                '<button class="jb n ' + (st === 'rejected' ? 'on' : '') + '" data-a="hfmark" data-v="no" data-id="' + row.id + '" data-i="' + i + '">❌</button></div>';
            }).join('') + '</div>').join('');
          out += '<div class="stick"><button class="btn gold" data-a="skip" ' + (v.pending ? 'disabled' : '') + '>' + (v.pending ? 'احكم على الباقي (' + AR(v.pending) + ')' : 'احسب النقاط ✓') + '</button></div>';
        } else {
          out += '<div class="ann"><div class="big">المضيف يحكم على الإجابات 👨‍⚖️</div><div class="mut" style="margin-top:6px">الأخضر صح والأحمر غلط. باقي ' + AR(v.pending || 0) + ' إجابة.</div></div>';
          out += '<div class="card col"><div class="big">إجاباتك</div>' + v.fields.map((f, i) => { const row = v.table.find((r) => r.id === me.id) || { answers: [], status: [] }; const st = row.status[i] || 'empty'; return '<div class="hf-cell ' + st + '"><span class="mut">' + esc(f) + '</span><span class="sp"></span><b>' + esc(row.answers[i] || '—') + '</b><span class="tag ' + STATUS[st][0] + '">' + STATUS[st][1] + '</span></div>'; }).join('') + '</div>';
        }
      } else if (ph === 'result') {
        const r = v.result, mine = r.cells[me.id] || [];
        out += letterCard;
        out += '<div class="card col"><div class="big">إجاباتك</div>' + v.fields.map((f, i) => '<div class="row"><span class="mut">' + esc(f) + '</span><span class="sp"></span><b>' + esc((me.answers[i]) || '—') + '</b><span class="tag ' + (mine[i] && mine[i].pts ? 'g' : '') + '">+' + AR(mine[i] ? mine[i].pts : 0) + '</span></div>').join('') + '</div>';
        out += '<div class="card col"><div class="big">نقاط الجولة</div>' + v.players.slice().sort((a, b) => (r.delta[b.id] || 0) - (r.delta[a.id] || 0)).map((p) => '<div class="pl ' + (p.id === me.id ? 'me' : '') + '">' + K.av(p, 30) + '<b>' + esc(p.name) + '</b><span class="sp"></span><span class="tag ' + (r.delta[p.id] ? 'g' : '') + '">+' + AR(r.delta[p.id] || 0) + '</span></div>').join('') + '</div>';
        out += me.host ? '<div class="stick"><button class="btn gold" data-a="next">' + (v.round >= v.rounds ? 'النتيجة النهائية' : 'الجولة الجاية') + '</button></div>' : '<div class="card ctr mut">ننتظر المضيف…</div>';
      } else if (ph === 'ended') out = K.endScreen(v);
      return out;
    }
  };

  // ---------------------------------------------------------------- التلفزيون
  cfg.board = {
    title: '<b>حروف</b> الديوانية', timedPhases: ['write'], stepKey: (v) => (v.stopBy || '') + ':' + v.phase,
    css: '.mdb .cd{font-size:22em;font-weight:900;line-height:1;color:#ffd978;animation:hfPop .9s ease-out infinite}@keyframes hfPop{0%{transform:scale(1.5);opacity:0}25%{transform:scale(1);opacity:1}100%{transform:scale(.9);opacity:.85}}.mdb .letter.fly{animation:hfLand 1.6s cubic-bezier(.6,0,.3,1)}@keyframes hfLand{0%{transform:scale(.3);opacity:0}30%{transform:scale(1.5);opacity:1}60%{transform:scale(1.5)}100%{transform:scale(1)}}.mdb table.hf td.pd{color:#cbd5e1}.mdb .letter{font-size:16em;font-weight:900;line-height:1;color:#ffd978;text-shadow:0 .05em .3em rgba(0,0,0,.4)}.mdb .flds{display:flex;gap:.8em;flex-wrap:wrap;justify-content:center}.mdb .flds span{font-size:2.3em;font-weight:800;padding:.2em .9em;border-radius:99em;background:rgba(255,255,255,.1)}.mdb table.hf{border-collapse:collapse;font-size:1.9em;margin:0 auto}.mdb table.hf td,.mdb table.hf th{padding:.25em .7em;border-bottom:1px solid rgba(255,255,255,.12);text-align:center}.mdb table.hf .x{color:#ff8a8e;text-decoration:line-through}.mdb table.hf .ok{color:#7ef0c0}',
    tone: (v) => (v.phase === 'write' && v.stopBy ? 'red' : v.phase === 'ended' ? 'gold' : ''),
    render(v, B) {
      const ph = v.phase, N = (id) => esc(B.N(v, id)); let core = '', opt = {};
      const table = (withPts) => '<table class="hf"><tr><th></th>' + v.fields.map((f) => '<th>' + esc(f) + '</th>').join('') + (withPts ? '<th>النقاط</th>' : '') + '</tr>' +
        v.table.map((row) => '<tr><th>' + N(row.id) + '</th>' + row.answers.map((a, i) => '<td class="' + (row.status[i] === 'ok' ? 'ok' : row.status[i] === 'pending' ? 'pd' : a ? 'x' : '') + '">' + esc(a || '—') + '</td>').join('') + (withPts ? '<td>+' + B.AR(v.result.delta[row.id] || 0) + '</td>' : '') + '</tr>').join('') + '</table>';
      if (ph === 'countdown') {
        BREF = B;
        return '<div class="core"><div class="sub">الجولة ' + B.AR(v.round) + ' — استعدوا… الحرف بيطلع بعد</div><div class="cd" data-hfcd>' + B.AR(cdLeft(v, B)) + '</div><div class="flds">' + v.fields.map((f) => '<span>' + esc(f) + '</span>').join('') + '</div></div>';
      }
      if (ph === 'write') {
        const fly = BOARD_FLY.round !== v.round; BOARD_FLY.round = v.round;
        core = '<div class="sub">الحرف</div><div class="letter' + (fly ? ' fly' : '') + '">' + esc(v.letter) + '</div><div class="flds">' + v.fields.map((f) => '<span>' + esc(f) + '</span>').join('') + '</div>' +
          (v.stopBy ? '<div class="big red">' + N(v.stopBy) + ' خلّص! باقي ثواني</div>' : '<div class="sub">اكتبوا بجوالاتكم — خلّص ' + B.AR(v.doneCount) + ' من ' + B.AR(v.liveCount) + '</div>');
        opt = { tag: (p) => (p.done ? '<span class="tg ok">خلّص</span>' : '') };
      } else if (ph === 'review') {
        core = '<div class="mid">حرف <span class="gold">' + esc(v.letter) + '</span> — المضيف يحكم: الأخضر صح والأحمر غلط' + (v.pending ? ' (باقي ' + B.AR(v.pending) + ')' : '') + '</div>' + table(false);
      } else if (ph === 'result') {
        core = '<div class="mid">نتيجة حرف <span class="gold">' + esc(v.letter) + '</span></div>' + table(true);
        opt = { tag: (p) => '<span class="tg pts">+' + B.AR(v.result.delta[p.id] || 0) + '</span>' };
      } else if (ph === 'ended') {
        const top = v.players.slice().sort((a, b) => b.score - a.score)[0];
        return '<div class="core full"><div class="sub">الفايز</div><div class="big gold">' + esc(top.name) + '</div>' + B.ranking(v) + '</div>';
      }
      return '<div class="core">' + core + '</div>' + (ph === 'write' || ph === 'result' ? B.seats(v, opt) : '');
    },
    cues(prev, v, B, fresh) {
      if (!fresh) { if (v.phase === 'write' && prev && v.doneCount > prev.doneCount) B.sfx('blip'); return; }
      if (v.phase === 'countdown') { B.sfx('tick'); B.later(300, () => B.say('استعدوا')); }
      else if (v.phase === 'write' && !v.stopBy) { B.sfx('gong'); B.later(500, () => B.say('الجولة ' + B.AR(v.round) + '. الحرف: ' + v.letter + '. ابدؤوا الكتابة!')); }
      else if (v.phase === 'write' && v.stopBy) { B.sfx('gavel'); B.later(300, () => B.say(B.N(v, v.stopBy) + ' خلّص! باقي عشر ثواني.')); }
      else if (v.phase === 'review') { B.sfx('bell'); B.later(400, () => B.say('انتهى الوقت. المضيف يحكم على الإجابات.')); }
      else if (v.phase === 'result') { B.sfx('fanfare'); }
      else if (v.phase === 'ended') { B.sfx('fanfare'); const top = v.players.slice().sort((a, b) => b.score - a.score)[0]; B.later(800, () => B.say('انتهت اللعبة. الفايز: ' + top.name + '.')); }
    }
  };
  root.DIWANIYA_CFG = cfg;
})(typeof self !== 'undefined' ? self : this);
