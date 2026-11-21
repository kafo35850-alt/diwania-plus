/* قدّرها — شاشات الجوال + شاشة التلفزيون */
(function (root) {
  'use strict';
  const MG = root.MG, esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
  const NUM = (n) => AR(Number(n).toLocaleString('en-US', { maximumFractionDigits: 3 })).replace(/,/g, '٬').replace(/\./g, '٫');
  const ICON = '<img src="/media/med_seed_game_qaddirha?v=3" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:22px;display:block">';
  // السنوات تنعرض بدون فاصل آلاف
  const VAL = (v, n) => (v.question && v.question.y ? AR(String(n)) : NUM(n));
  const nm = (v, id) => { const p = v.players.find((x) => x.id === id); return p ? esc(p.name) : '؟'; };
  const inId = (v) => 'qd' + v.round;

  const cfg = {
    id: 'qaddirha', name: 'تقدير الديوانية', nameHtml: '<b>تقدير</b> الديوانية', tagline: 'كلكم تخمنون الرقم… والأقرب ياخذها', icon: ICON, wsPath: '/qaddirha/ws', min: 2, max: 60,
    engine: MG.qaddirha, help: MG.qaddirhaHelp,
    err: { bad_number: 'اكتب رقم صحيح' },
    phaseName: { guess: 'التقدير', reveal: 'الكشف', ended: 'النهاية' },
    stepKey: (v) => v.phase + ':' + v.round,
    lobbyInfo: () => '<div class="card hint">كل جولة سؤال جوابه رقم. اكتب تقديرك بجوالك، والأقرب للجواب الصحيح ياخذ النقاط.</div>',
    lobbyHost: (v, K) => '<div class="card col"><div class="big">إعدادات اللعبة</div>' +
      K.settingChips(v, 'rounds', [[5, '٥ أسئلة'], [8, '٨ أسئلة'], [12, '١٢ سؤال']], 'عدد الأسئلة') +
      K.settingChips(v, 'sec', [[30, '٣٠ ثانية'], [45, '٤٥ ثانية'], [60, 'دقيقة']], 'وقت التقدير') + '</div>',
    click(a, el, K) {
      const v = K.ST.view;
      if (a === 'qdsend') { const inp = document.getElementById(inId(v)); const val = inp ? inp.value.trim() : ''; if (!val) { K.toast('اكتب رقم أول'); return true; } K.act('guess', { value: val }); return true; }
      if (a === 'next') { K.act('next'); return true; }
      return false;
    },
    screen(v, K) {
      const me = v.me, ph = v.phase; let out = K.topbar(v);
      const qCard = '<div class="ann"><div class="mut">' + esc(v.question.c) + '</div><div class="big" style="margin-top:6px;line-height:1.6">' + esc(v.question.q) + '</div>' + (v.question.u ? '<div class="mut small" style="margin-top:4px">الجواب بالـ ' + esc(v.question.u) + '</div>' : '') + '</div>';
      if (ph === 'guess') {
        out += K.timerHtml(v) + qCard;
        out += '<div class="card col"><input id="' + inId(v) + '" class="inp" inputmode="decimal" autocomplete="off" placeholder="تقديرك…" style="text-align:center;font-size:28px;font-weight:900">' +
          '<button class="btn gold" data-a="qdsend">' + (me.guess === null ? 'أرسل تقديري' : 'غيّر تقديري') + '</button>' +
          (me.guess !== null ? '<div class="ctr mut">تقديرك الحالي: <b style="color:#fff">' + VAL(v, me.guess) + '</b></div>' : '') + '</div>';
        out += '<div class="card ctr mut small">جاوب ' + AR(v.answeredCount) + ' من ' + AR(v.liveCount) + '</div>';
        out += me.host ? K.hostSkip(v, 'اكشف الجواب الحين (المضيف)') : '';
      } else if (ph === 'reveal') {
        const r = v.result, mine = r.rows.find((x) => x.id === me.id);
        out += qCard;
        out += '<div class="ann g"><div class="mut">الجواب الصحيح</div><div class="huge" style="color:var(--gold)">' + VAL(v, r.answer) + ' ' + esc(v.question.u || '') + '</div>' + (v.question.i ? '<div class="mut small" style="margin-top:6px">' + esc(v.question.i) + '</div>' : '') + '</div>';
        out += '<div class="card col">' + r.rows.map((x) => '<div class="pl ' + (x.id === me.id ? 'me' : '') + '"><b>' + AR(x.rank) + '.</b> ' + nm(v, x.id) + '<span class="sp"></span><span class="mut">' + VAL(v, x.value) + '</span>' + (x.exact ? '<span class="tag g">🎯</span>' : '') + '<span class="tag ' + (x.pts ? 'g' : '') + '">+' + AR(x.pts) + '</span></div>').join('') + (r.rows.length ? '' : '<div class="mut ctr">ما أحد جاوب!</div>') + '</div>';
        if (!mine) out += '<div class="card ctr mut">ما أرسلت تقدير هالجولة.</div>';
        out += me.host ? '<div class="stick"><button class="btn gold" data-a="next">' + (v.round >= v.rounds ? 'النتيجة النهائية' : 'السؤال الجاي') + '</button></div>' : '<div class="card ctr mut">ننتظر المضيف…</div>';
      } else if (ph === 'ended') out = K.endScreen(v);
      return out;
    }
  };

  cfg.board = {
    title: '<b>تقدير</b> الديوانية', timedPhases: ['guess'], stepKey: (v) => v.phase + ':' + v.round,
    css: '.mdb .qq{font-size:4.2em;font-weight:900;line-height:1.35;max-width:34em;text-align:center}.mdb .ans{font-size:9em;font-weight:900;color:#ffd978;line-height:1}.mdb .rows{display:flex;flex-direction:column;gap:.4em;font-size:2.2em;min-width:30em}.mdb .rows div{display:flex;gap:1em;background:rgba(255,255,255,.07);padding:.25em .8em;border-radius:.6em}.mdb .rows div.top{background:rgba(242,193,78,.25)}.mdb .rows span.v{margin-inline-start:auto;color:#cfd6ff}',
    tone: (v) => (v.phase === 'reveal' ? 'blue' : v.phase === 'ended' ? 'gold' : ''),
    render(v, B) {
      const ph = v.phase, N = (id) => esc(B.N(v, id)); let core = '', opt = {};
      if (ph === 'guess') {
        core = '<div class="sub">' + esc(v.question.c) + ' — السؤال ' + B.AR(v.round) + ' من ' + B.AR(v.rounds) + '</div><div class="qq">' + esc(v.question.q) + '</div>' + (v.question.u ? '<div class="sub">بالـ ' + esc(v.question.u) + '</div>' : '') + '<div class="sub">جاوب ' + B.AR(v.answeredCount) + ' من ' + B.AR(v.liveCount) + '</div>';
        opt = { tag: (p) => (p.answered ? '<span class="tg ok">جاوب</span>' : '') };
      } else if (ph === 'reveal') {
        const r = v.result;
        core = '<div class="sub">' + esc(v.question.q) + '</div><div class="ans">' + VAL(v, r.answer) + '</div><div class="sub">' + esc(v.question.u || '') + (v.question.i ? ' — ' + esc(v.question.i) : '') + '</div>' +
          '<div class="rows">' + r.rows.slice(0, 8).map((x) => '<div class="' + (x.rank === 1 ? 'top' : '') + '"><b>' + B.AR(x.rank) + '</b> ' + N(x.id) + (x.exact ? ' 🎯' : '') + '<span class="v">' + VAL(v, x.value) + ' · +' + B.AR(x.pts) + '</span></div>').join('') + '</div>';
      } else if (ph === 'ended') {
        const top = v.players.slice().sort((a, b) => b.score - a.score)[0];
        return '<div class="core full"><div class="sub">الفايز</div><div class="big gold">' + esc(top.name) + '</div>' + B.ranking(v) + '</div>';
      }
      return '<div class="core">' + core + '</div>' + (ph === 'guess' ? B.seats(v, opt) : '');
    },
    cues(prev, v, B, fresh) {
      if (!fresh) { if (v.phase === 'guess' && prev && v.answeredCount > prev.answeredCount) B.sfx('blip'); return; }
      if (v.phase === 'guess') { B.sfx('gong'); B.later(500, () => B.say(v.question.q)); }
      else if (v.phase === 'reveal') { B.sfx('fanfare'); const r = v.result; B.later(600, () => B.say('الجواب: ' + r.answer + ' ' + (v.question.u || '') + (r.rows[0] ? '. الأقرب: ' + B.N(v, r.rows[0].id) : ''))); }
      else if (v.phase === 'ended') { B.sfx('fanfare'); const top = v.players.slice().sort((a, b) => b.score - a.score)[0]; B.later(800, () => B.say('انتهت اللعبة. الفايز: ' + top.name + '.')); }
    }
  };
  root.DIWANIYA_CFG = cfg;
})(typeof self !== 'undefined' ? self : this);
