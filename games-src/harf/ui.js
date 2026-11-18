/* حرف ونص — شاشات الجوال + شاشة التلفزيون (فوق kit/phone.js و kit/board.js) */
(function (root) {
  'use strict';
  const MG = root.MG, esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
  const ICON = '<svg viewBox="0 0 100 100"><defs><linearGradient id="hfg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE08A"/><stop offset="1" stop-color="#F5B942"/></linearGradient></defs><rect x="6" y="6" width="88" height="88" rx="22" fill="#111936" stroke="url(#hfg)" stroke-width="4"/><text x="50" y="66" text-anchor="middle" font-size="52" font-weight="900" fill="url(#hfg)" font-family="Tahoma,Arial">ح</text><rect x="22" y="76" width="56" height="6" rx="3" fill="#2DD4BF"/></svg>';
  const STATUS = { ok: ['g', 'مقبولة'], empty: ['', 'فاضية'], letter: ['r', 'ما تبدأ بالحرف'], rejected: ['r', 'مرفوضة'] };
  const nm = (v, id) => { const p = v.players.find((x) => x.id === id); return p ? esc(p.name) : '؟'; };
  let KREF = null, saveT = 0;

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
    err: {},
    phaseName: { write: 'الكتابة', review: 'المراجعة', result: 'النتيجة', ended: 'النهاية' },
    stepKey: (v) => (v.stopBy || '') + ':' + v.phase,
    lobbyInfo: () => '<div class="card hint">كل جولة يطلع حرف، وتكتب كلمة تبدأ فيه لكل خانة. أول من يخلّص يوقّف الكل!</div>',
    lobbyHost: (v, K) => '<div class="card col"><div class="big">إعدادات اللعبة</div>' +
      K.settingChips(v, 'rounds', [[3, '٣ جولات'], [5, '٥ جولات'], [8, '٨ جولات']], 'عدد الجولات') +
      K.settingChips(v, 'sec', [[60, 'دقيقة'], [90, 'دقيقة ونص'], [120, 'دقيقتين']], 'وقت الكتابة') +
      K.settingChips(v, 'set', v.setOrder.map((k) => [k, v.setNames[k]]), 'الخانات') + '</div>',
    click(a, el, K) {
      const v = K.ST.view;
      if (a === 'hfdone') { K.act('done', { answers: collect(v) }); return true; }
      if (a === 'hfrej') { K.act('reject', { target: el.getAttribute('data-id'), i: Number(el.getAttribute('data-i')) }); return true; }
      if (a === 'next') { K.act('next'); return true; }
      return false;
    },
    screen(v, K) {
      KREF = K;
      const me = v.me, ph = v.phase; let out = K.topbar(v);
      const letterCard = '<div class="ann g"><div class="mut">الحرف</div><div style="font-size:72px;font-weight:900;line-height:1.1;color:var(--gold)">' + esc(v.letter) + '</div></div>';
      if (ph === 'write') {
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
        out += K.timerHtml(v);
        out += '<div class="ann"><div class="big">راجعوا الإجابات</div><div class="mut" style="margin-top:6px">اضغط على أي إجابة غلط عشان ترفضها. لو رفضها أكثر من نص اللاعبين ما تنحسب.</div></div>';
        const mine = new Set(me.myRejects || []);
        out += v.fields.map((f, i) => '<div class="card col"><div class="row"><b>' + esc(f) + '</b><span class="sp"></span><span class="chip">' + esc(v.letter) + '</span></div>' +
          v.table.map((row) => {
            const a = row.answers[i] || '', st = row.status[i], own = row.id === me.id, k = row.id + ':' + i;
            const tag = st === 'ok' ? '' : '<span class="tag ' + STATUS[st][0] + '">' + STATUS[st][1] + '</span>';
            const body = '<span class="mut small">' + nm(v, row.id) + '</span><span class="sp"></span><b>' + esc(a || '—') + '</b>' + tag + (row.rejects[i] ? '<span class="tag r">✗ ' + AR(row.rejects[i]) + '</span>' : '');
            if (own || !a || st === 'letter') return '<div class="row">' + body + '</div>';
            return '<button class="pick ' + (mine.has(k) ? 'sel' : '') + '" style="width:100%;flex-direction:row;justify-content:flex-start;gap:8px" data-a="hfrej" data-id="' + row.id + '" data-i="' + i + '">' + body + '</button>';
          }).join('') + '</div>').join('');
        out += me.host ? K.hostSkip(v, 'احسب النقاط الحين (المضيف)') : '';
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
    title: '<b>حروف</b> الديوانية', timedPhases: ['write', 'review'], stepKey: (v) => (v.stopBy || '') + ':' + v.phase,
    css: '.mdb .letter{font-size:16em;font-weight:900;line-height:1;color:#ffd978;text-shadow:0 .05em .3em rgba(0,0,0,.4)}.mdb .flds{display:flex;gap:.8em;flex-wrap:wrap;justify-content:center}.mdb .flds span{font-size:2.3em;font-weight:800;padding:.2em .9em;border-radius:99em;background:rgba(255,255,255,.1)}.mdb table.hf{border-collapse:collapse;font-size:1.9em;margin:0 auto}.mdb table.hf td,.mdb table.hf th{padding:.25em .7em;border-bottom:1px solid rgba(255,255,255,.12);text-align:center}.mdb table.hf .x{color:#ff8a8e;text-decoration:line-through}.mdb table.hf .ok{color:#7ef0c0}',
    tone: (v) => (v.phase === 'write' && v.stopBy ? 'red' : v.phase === 'ended' ? 'gold' : ''),
    render(v, B) {
      const ph = v.phase, N = (id) => esc(B.N(v, id)); let core = '', opt = {};
      const table = (withPts) => '<table class="hf"><tr><th></th>' + v.fields.map((f) => '<th>' + esc(f) + '</th>').join('') + (withPts ? '<th>النقاط</th>' : '') + '</tr>' +
        v.table.map((row) => '<tr><th>' + N(row.id) + '</th>' + row.answers.map((a, i) => '<td class="' + (row.status[i] === 'ok' ? 'ok' : a ? 'x' : '') + '">' + esc(a || '—') + '</td>').join('') + (withPts ? '<td>+' + B.AR(v.result.delta[row.id] || 0) + '</td>' : '') + '</tr>').join('') + '</table>';
      if (ph === 'write') {
        core = '<div class="sub">الحرف</div><div class="letter">' + esc(v.letter) + '</div><div class="flds">' + v.fields.map((f) => '<span>' + esc(f) + '</span>').join('') + '</div>' +
          (v.stopBy ? '<div class="big red">' + N(v.stopBy) + ' خلّص! باقي ثواني</div>' : '<div class="sub">اكتبوا بجوالاتكم — خلّص ' + B.AR(v.doneCount) + ' من ' + B.AR(v.liveCount) + '</div>');
        opt = { tag: (p) => (p.done ? '<span class="tg ok">خلّص</span>' : '') };
      } else if (ph === 'review') {
        core = '<div class="mid">حرف <span class="gold">' + esc(v.letter) + '</span> — راجعوا الإجابات بجوالاتكم</div>' + table(false);
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
      if (v.phase === 'write' && !v.stopBy) { B.sfx('gong'); B.later(500, () => B.say('الجولة ' + B.AR(v.round) + '. الحرف: ' + v.letter + '. ابدؤوا الكتابة!')); }
      else if (v.phase === 'write' && v.stopBy) { B.sfx('gavel'); B.later(300, () => B.say(B.N(v, v.stopBy) + ' خلّص! باقي عشر ثواني.')); }
      else if (v.phase === 'review') { B.sfx('bell'); B.later(400, () => B.say('انتهى الوقت. راجعوا الإجابات وارفضوا الغلط.')); }
      else if (v.phase === 'result') { B.sfx('fanfare'); }
      else if (v.phase === 'ended') { B.sfx('fanfare'); const top = v.players.slice().sort((a, b) => b.score - a.score)[0]; B.later(800, () => B.say('انتهت اللعبة. الفايز: ' + top.name + '.')); }
    }
  };
  root.DIWANIYA_CFG = cfg;
})(typeof self !== 'undefined' ? self : this);
