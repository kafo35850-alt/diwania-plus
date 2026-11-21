/* Store posters: one picture per game that shows what is inside it (320×180, fills the card art). */
(function () {
  'use strict';
  var FONT = 'font-family="IBM Plex Sans Arabic,Tahoma,Arial,sans-serif"';
  function svg(id, c1, c2, body) {
    return '<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img">' +
      '<defs><radialGradient id="bg_' + id + '" cx="72%" cy="8%" r="115%"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></radialGradient>' +
      '<linearGradient id="au_' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF0B8"/><stop offset=".5" stop-color="#F5B942"/><stop offset="1" stop-color="#B4690E"/></linearGradient></defs>' +
      '<rect width="320" height="180" fill="url(#bg_' + id + ')"/>' + body + '</svg>';
  }
  function T(x, y, size, text, fill, weight, extra) {
    return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" font-weight="' + (weight || 700) + '" fill="' + (fill || '#fff') + '" text-anchor="middle" ' + FONT + (extra || '') + '>' + text + '</text>';
  }
  function R(x, y, w, h, r, fill, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '" fill="' + fill + '"' + (extra || '') + '/>'; }
  function C(x, y, r, fill, extra) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '"' + (extra || '') + '/>'; }
  var GOLD = function (id) { return 'url(#au_' + id + ')'; };
  var P = {};

  // ديوانية الثمانية — ٨ فئات بنقاط ٢٠٠ / ٤٠٠ / ٦٠٠
  P.eight = (function () {
    var cats = [['⚽', 'رياضة', '#1d4ed8'], ['🎬', 'أفلام', '#7c3aed'], ['🌍', 'دول', '#0f766e'], ['🕌', 'إسلاميات', '#15803d'],
      ['🧪', 'علوم', '#b45309'], ['🎮', 'قيمنق', '#be123c'], ['📺', 'مسلسلات', '#4338ca'], ['🔤', 'حروف', '#a16207']];
    var b = '';
    cats.forEach(function (c, i) {
      var x = 16 + (i % 4) * 74, y = 14 + Math.floor(i / 4) * 62;
      b += R(x, y, 66, 54, 12, c[2], ' stroke="rgba(255,255,255,.25)"') + T(x + 33, y + 28, 20, c[0]) + T(x + 33, y + 46, 11, c[1], '#fff', 600);
    });
    ['٢٠٠', '٤٠٠', '٦٠٠'].forEach(function (p, i) { b += R(70 + i * 64, 144, 52, 24, 12, i === 2 ? GOLD('eight') : 'rgba(255,255,255,.14)') + T(96 + i * 64, 161, 13, p, i === 2 ? '#2b1c00' : '#fff'); });
    return svg('eight', '#1e3a8a', '#070d22', b);
  })();

  // حروف الديوانية — حرف وخانات
  P.harf = svg('harf', '#1d3b6b', '#081226',
    R(18, 30, 92, 120, 22, GOLD('harf')) + T(64, 112, 82, 'م', '#2b1c00', 800) +
    (function () {
      var rows = [['إنسان', 'محمد', true], ['حيوان', 'ماعز', true], ['نبات', 'موز', true], ['جماد', 'مفتاح', true], ['بلاد', '…', false]], b = '';
      rows.forEach(function (r, i) {
        var y = 24 + i * 28;
        b += R(124, y, 178, 22, 8, 'rgba(255,255,255,.08)') + T(278, y + 16, 11, r[0], '#9fb3d9', 600) + T(196, y + 16, 13, r[1], r[2] ? '#fff' : '#9fb3d9') +
          (r[2] ? T(140, y + 16, 13, '✓', '#2DD4BF') : '');
      });
      return b;
    })());

  // تقدير الديوانية — كم طوله؟ والأقرب يفوز
  P.qaddirha = svg('qaddirha', '#0f4c5c', '#061820',
    '<path d="M60 160 L66 40 L70 22 L74 40 L80 160 Z" fill="' + GOLD('qaddirha') + '"/>' + R(48, 158, 44, 6, 3, '#F5B942') +
    T(70, 16, 13, '؟ متر', '#FFE08A') +
    '<line x1="120" y1="118" x2="300" y2="118" stroke="#cfe3ff" stroke-width="3" stroke-linecap="round"/>' +
    [130, 160, 190, 220, 250, 280].map(function (x) { return '<line x1="' + x + '" y1="112" x2="' + x + '" y2="124" stroke="#cfe3ff" stroke-width="2"/>'; }).join('') +
    T(222, 106, 22, '🎯') + C(150, 92, 13, '#38bdf8') + T(150, 97, 12, 'أ') + C(196, 82, 13, '#a78bfa') + T(196, 87, 12, 'ن') + C(264, 92, 13, '#f472b6') + T(264, 97, 12, 'س') +
    T(210, 150, 15, 'الأقرب ياخذها!', '#FFE08A') + T(210, 46, 26, '٨٢٨ ؟', '#fff', 800));

  // دخيل الديوانية — الكل يعرف الكلمة إلا واحد
  P.dakhil = (function () {
    var b = R(100, 14, 120, 34, 17, 'rgba(255,255,255,.12)') + T(160, 37, 15, '🔒 الكلمة: مطار', '#fff');
    for (var i = 0; i < 6; i++) {
      var x = 38 + i * 49, spy = i === 3, col = spy ? '#e11d48' : '#2DD4BF';
      b += C(x, 92, 15, col) + '<path d="M' + (x - 22) + ' 148 Q' + x + ' 108 ' + (x + 22) + ' 148 Z" fill="' + col + '"/>' +
        R(x - 16, 152, 32, 18, 9, spy ? '#e11d48' : 'rgba(255,255,255,.12)') + T(x, 165, 11, spy ? '؟؟' : 'مطار', '#fff');
    }
    return svg('dakhil', '#0f4c5c', '#071923', b + T(185, 80, 22, '❓'));
  })();

  // مافيا الديوانية — ليل وأدوار سرية
  P.mafia = svg('mafia', '#3a1228', '#070512',
    C(262, 40, 22, '#FFE08A') + C(272, 34, 20, '#3a1228') +
    '<path d="M0 150 L20 150 L20 120 L40 120 L40 140 L60 140 L60 105 L84 105 L84 150 L320 150 L320 180 L0 180 Z" fill="#12091f"/>' +
    '<g transform="translate(160 96)"><ellipse cx="0" cy="-8" rx="46" ry="9" fill="#1a1030"/><path d="M-26 -8 C-22 -38 22 -38 26 -8 Z" fill="#1a1030" stroke="#F5B942" stroke-width="2"/><rect x="-26" y="-14" width="52" height="7" fill="#e11d48"/>' +
    '<path d="M-30 30 C-30 8 30 8 30 30 L36 44 L-36 44 Z" fill="#e11d48"/><polygon points="-8,10 0,26 8,10" fill="#fff"/></g>' +
    '<g transform="rotate(-10 60 88)">' + R(36, 60, 48, 66, 8, '#fff') + T(60, 98, 22, '🕵️') + T(60, 118, 10, 'محقق', '#111', 700) + '</g>' +
    '<g transform="rotate(9 262 112)">' + R(238, 84, 48, 66, 8, '#e11d48') + T(262, 122, 22, '🎩') + T(262, 142, 10, 'مافيا', '#fff', 700) + '</g>');

  // قفطة الديوانية — خبر ناقص وكذبات
  P.qaftah = svg('qaftah', '#3b1d5e', '#0f0822',
    R(24, 18, 272, 52, 12, '#f8f1e3') + T(160, 40, 12, 'خبر حقيقي: رجل علقت يده داخل', '#3b1d5e', 700) + R(110, 48, 100, 4, 2, '#3b1d5e') + T(160, 64, 10, '_____ ؟', '#7c3aed', 700) +
    [['كذبة 😏', 36, '#a78bfa'], ['الحقيقة ✓', 124, '#2DD4BF'], ['كذبة 😏', 212, '#f472b6']].map(function (o) {
      return R(o[1], 98, 76, 40, 20, o[2]) + T(o[1] + 38, 123, 13, o[0], '#120a24');
    }).join('') + T(160, 164, 16, 'قفطة!', '#FFE08A', 800));

  // مستشار الديوانية — قرارات نزيهة وفاسدة وتصويت
  P.chancellor = svg('chancellor', '#5a1424', '#12050a',
    [0, 1, 2, 3, 4].map(function (i) { return R(24 + i * 30, 26, 24, 34, 5, i < 3 ? '#38bdf8' : 'rgba(56,189,248,.18)'); }).join('') +
    [0, 1, 2, 3, 4, 5].map(function (i) { return R(24 + i * 30, 76, 24, 34, 5, i < 2 ? '#e11d48' : 'rgba(225,29,72,.18)'); }).join('') +
    T(90, 136, 12, 'نزيهة ٣/٥ · فاسدة ٢/٦', '#cbd5f5', 600) +
    R(220, 60, 76, 70, 10, GOLD('chancellor')) + R(240, 52, 36, 12, 4, '#12050a') + T(258, 104, 26, '🗳️') +
    R(214, 140, 40, 22, 11, '#15803d') + T(234, 155, 11, 'نعم') + R(262, 140, 40, 22, 11, '#b91c1c') + T(282, 155, 11, 'لا'));

  // شفرة الديوانية — شبكة كلمات وتلميح
  P.shifra = (function () {
    var words = ['جمل', 'برج', 'قهوة', 'نخلة', 'سيف', 'بحر', 'صقر', 'دلة', 'قمر', 'مطر', 'ثلج', 'كرة', 'خيمة', 'تمر', 'باب'], b = '';
    var kinds = ['g', 't', 'n', 'g', 'x', 't', 'g', 'n', 't', 'g', 'n', 't', 'g', 'n', 't'];
    var col = { g: GOLD('shifra'), t: '#14b8a6', n: '#d6c9a8', x: '#111827' };
    words.forEach(function (w, i) {
      var x = 18 + (i % 5) * 58, y = 12 + Math.floor(i / 5) * 44;
      b += R(x, y, 52, 36, 7, col[kinds[i]], kinds[i] === 'x' ? ' stroke="#e11d48" stroke-width="2"' : '') + T(x + 26, y + 23, 12, kinds[i] === 'x' ? '☠️' : w, kinds[i] === 't' ? '#fff' : '#1b1305');
    });
    return svg('shifra', '#1e293b', '#070b14', b + R(86, 148, 148, 26, 13, 'rgba(255,255,255,.12)') + T(160, 166, 13, 'تلميح: «صحراء» ٣', '#FFE08A'));
  })();

  // زر الديوانية الغامض — أزرار مخفية
  P.mystery_button = (function () {
    var b = '';
    for (var i = 0; i < 18; i++) {
      var x = 30 + (i % 6) * 52, y = 34 + Math.floor(i / 6) * 50;
      var face = i === 4 ? '💎' : i === 9 ? '💣' : i === 14 ? '×٢' : '؟';
      b += C(x, y, 19, face === '؟' ? '#e11d48' : face === '💣' ? '#111827' : GOLD('mystery_button'), ' stroke="rgba(255,255,255,.25)" stroke-width="2"') +
        T(x, y + 6, face === '؟' ? 17 : 15, face, face === '×٢' ? '#2b1c00' : '#fff');
    }
    return svg('mystery_button', '#0e4838', '#041510', b);
  })();

  // خزنة الديوانية الذهبية — باب خزنة بأربعة أقفال
  P.golden_vault = svg('golden_vault', '#5c3b09', '#140c03',
    R(70, 14, 180, 152, 20, '#2a1c08', ' stroke="#F5B942" stroke-width="3"') + C(160, 90, 54, 'none', ' stroke="' + GOLD('golden_vault') + '" stroke-width="8"') +
    C(160, 90, 16, GOLD('golden_vault')) + '<path d="M160 50 V130 M120 90 H200" stroke="#F5B942" stroke-width="5" stroke-linecap="round"/>' +
    [['١', 'open'], ['٢', 'open'], ['٣', ''], ['٤', '']].map(function (l, i) {
      var y = 34 + i * 34; return C(40, y, 13, l[1] ? '#2DD4BF' : '#3a2a10', ' stroke="#F5B942" stroke-width="2"') + T(40, y + 5, 12, l[1] ? '🔓' : '🔒');
    }).join('') + T(280, 96, 30, '💰'));

  // مزاد الديوانية — مطرقة وصناديق مقفلة
  P.diwaniya_auction = svg('diwaniya_auction', '#5c2410', '#140804',
    [0, 1, 2].map(function (i) {
      var x = 30 + i * 70; return R(x, 92, 58, 48, 8, i === 1 ? GOLD('diwaniya_auction') : '#7c2d12', ' stroke="#F5B942" stroke-width="2"') + R(x, 104, 58, 6, 0, 'rgba(0,0,0,.25)') +
        T(x + 29, 132, 18, '؟', i === 1 ? '#2b1c00' : '#FFE08A') + R(x + 6, 64, 46, 20, 10, 'rgba(255,255,255,.12)') + T(x + 29, 78, 11, ['٢٠٠', '٥٠٠؟', '٩٠٠'][i]);
    }).join('') +
    '<g transform="rotate(-30 262 70)">' + R(232, 52, 60, 26, 6, GOLD('diwaniya_auction')) + R(258, 78, 8, 64, 4, '#d6a35a') + '</g>' + R(236, 150, 64, 10, 5, '#7c2d12'));

  // عجلة حظ الديوانية
  P.fortune_wheel = (function () {
    var cols = ['#F5B942', '#e11d48', '#2DD4BF', '#7c3aed', '#38bdf8', '#f97316', '#22c55e', '#f472b6'], b = '', cx = 160, cy = 96, r = 74;
    for (var i = 0; i < 8; i++) {
      var a1 = (i / 8) * Math.PI * 2, a2 = ((i + 1) / 8) * Math.PI * 2;
      b += '<path d="M' + cx + ' ' + cy + ' L' + (cx + r * Math.cos(a1)).toFixed(1) + ' ' + (cy + r * Math.sin(a1)).toFixed(1) + ' A' + r + ' ' + r + ' 0 0 1 ' + (cx + r * Math.cos(a2)).toFixed(1) + ' ' + (cy + r * Math.sin(a2)).toFixed(1) + ' Z" fill="' + cols[i] + '"/>';
      var am = (a1 + a2) / 2; b += T((cx + 50 * Math.cos(am)).toFixed(1), (cy + 50 * Math.sin(am) + 5).toFixed(1), 12, ['+٥٠٠', '💣', '×٢', '+٢٠٠', '🧲', '+٣٠٠', '⚡', '+١٠٠'][i], '#111');
    }
    return svg('fortune_wheel', '#441663', '#10051a', C(cx, cy, r + 6, '#2a0e3d', ' stroke="#F5B942" stroke-width="4"') + b + C(cx, cy, 13, GOLD('fortune_wheel')) +
      '<polygon points="' + cx + ',14 ' + (cx - 11) + ',0 ' + (cx + 11) + ',0" fill="#fff" transform="translate(0 4)"/>');
  })();

  // محكمة الديوانية — قضية وأدلة وحكم
  P.friends_court = svg('friends_court', '#123e66', '#050f1d',
    '<line x1="160" y1="28" x2="160" y2="140" stroke="#F5B942" stroke-width="6" stroke-linecap="round"/><line x1="92" y1="46" x2="228" y2="46" stroke="#F5B942" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M92 46 L72 96 H112 Z" fill="rgba(56,189,248,.25)" stroke="#38bdf8" stroke-width="3"/><path d="M228 46 L208 90 H248 Z" fill="rgba(225,29,72,.25)" stroke="#e11d48" stroke-width="3"/>' +
    T(92, 120, 13, 'بريء', '#38bdf8') + T(228, 114, 13, 'مذنب', '#fb7185') + R(126, 140, 68, 12, 6, '#F5B942') +
    R(14, 14, 58, 40, 8, '#f8f1e3') + T(43, 32, 10, '📁 دليل ١', '#123e66') + T(43, 46, 9, '«الكيكة!»', '#123e66', 600) +
    R(250, 124, 58, 40, 8, '#f8f1e3') + T(279, 142, 10, '📁 دليل ٢', '#123e66') + T(279, 156, 9, '«مضلل؟»', '#123e66', 600));

  // صامد الديوانية — يطلع واحد كل مرحلة
  P.last_one_standing = (function () {
    var b = '';
    for (var i = 0; i < 6; i++) {
      var x = 36 + i * 50, out = i !== 3;
      b += C(x, 70, 13, out ? 'rgba(255,255,255,.18)' : GOLD('last_one_standing')) + '<path d="M' + (x - 18) + ' 112 Q' + x + ' 80 ' + (x + 18) + ' 112 Z" fill="' + (out ? 'rgba(255,255,255,.18)' : '#F5B942') + '"/>' +
        (out ? '<path d="M' + (x - 14) + ' 60 L' + (x + 14) + ' 104 M' + (x + 14) + ' 60 L' + (x - 14) + ' 104" stroke="#fb7185" stroke-width="4" stroke-linecap="round"/>' : T(x, 46, 20, '👑'));
    }
    return svg('last_one_standing', '#5e1127', '#14040a', b + R(116, 120, 88, 40, 6, GOLD('last_one_standing')) + T(160, 147, 16, 'الأخير!', '#2b1c00', 800) + T(160, 24, 12, 'المرحلة ٧ من ٧', '#fecdd3', 600));
  })();

  // الديوانية الصامتة — بدون صوت ولا ضحك
  P.silent_library = svg('silent_library', '#0f4c4c', '#041414',
    [0, 1, 2, 3, 4, 5, 6].map(function (i) { return R(18 + i * 22, 40 + (i % 3) * 6, 18, 104 - (i % 3) * 6, 3, ['#14b8a6', '#F5B942', '#0ea5e9', '#a78bfa', '#2DD4BF', '#f97316', '#38bdf8'][i]); }).join('') +
    R(14, 146, 160, 8, 4, '#d6a35a') + T(240, 112, 64, '🤫') + R(200, 132, 82, 26, 13, 'rgba(225,29,72,.85)') + T(241, 150, 12, '🔇 لا تضحك!'));

  // ربع الديوانية — مين أكثر واحد…؟
  P.who_knows_friend = (function () {
    var b = R(40, 12, 240, 30, 15, 'rgba(255,255,255,.12)') + T(160, 32, 13, 'مين أكثر واحد يتأخر؟ ⏰', '#fff');
    var pos = [[60, 120], [120, 140], [200, 140], [260, 120]];
    pos.forEach(function (p, i) { b += C(p[0], p[1], 15, ['#38bdf8', '#a78bfa', '#34d399', '#f472b6'][i]) + '<path d="M' + p[0] + ' ' + (p[1] - 18) + ' L160 92" stroke="rgba(255,255,255,.35)" stroke-width="2" stroke-dasharray="4 4"/>'; });
    return svg('who_knows_friend', '#5c380e', '#150c03', b + C(160, 80, 22, GOLD('who_knows_friend')) + T(160, 88, 20, '😅') + T(160, 56, 16, '👑'));
  })();

  // رسّام الديوانية — لوحة رسم ومين يخمّن
  P.draw_guess = svg('draw_guess', '#114b46', '#041616',
    R(26, 18, 170, 132, 10, '#f8fafc') + '<path d="M70 120 Q72 70 110 66 Q148 70 150 120 Z M150 92 Q176 86 172 64" fill="none" stroke="#111827" stroke-width="4" stroke-linecap="round"/><path d="M96 66 Q110 46 124 66" fill="none" stroke="#111827" stroke-width="4"/>' +
    '<path d="M190 150 L212 128" stroke="#F5B942" stroke-width="8" stroke-linecap="round"/>' +
    R(214, 32, 92, 28, 14, '#2DD4BF') + T(260, 51, 12, 'إبريق؟', '#062a26') + R(214, 70, 92, 28, 14, '#F5B942') + T(260, 89, 12, 'دلة! ✓', '#2b1c00') +
    [['#e11d48', 40], ['#F5B942', 60], ['#38bdf8', 80], ['#22c55e', 100]].map(function (c) { return C(c[1], 164, 7, c[0]); }).join(''));

  // ملعب الديوانية — كورة وقيمنق
  P.stadium_esports = svg('stadium_esports', '#14532d', '#04140b',
    R(16, 18, 288, 144, 10, 'none', ' stroke="rgba(255,255,255,.55)" stroke-width="2.5"') + '<line x1="160" y1="18" x2="160" y2="162" stroke="rgba(255,255,255,.55)" stroke-width="2.5"/>' +
    C(160, 90, 30, 'none', ' stroke="rgba(255,255,255,.55)" stroke-width="2.5"') + R(16, 60, 34, 60, 0, 'none', ' stroke="rgba(255,255,255,.55)" stroke-width="2.5"') + R(270, 60, 34, 60, 0, 'none', ' stroke="rgba(255,255,255,.55)" stroke-width="2.5"') +
    T(104, 104, 34, '⚽') + T(220, 106, 34, '🎮') + R(112, 136, 96, 22, 11, GOLD('stadium_esports')) + T(160, 151, 11, 'مين اللاعب؟', '#2b1c00'));

  // سوق الديوانية — كم سعرها؟
  P.how_much_price = svg('how_much_price', '#0f4c35', '#03140d',
    '<g transform="rotate(-8 110 90)"><path d="M40 50 H150 L182 90 L150 130 H40 Z" fill="' + GOLD('how_much_price') + '"/>' + C(160, 90, 7, '#03140d') + T(96, 100, 30, '؟؟ ر.س', '#2b1c00', 800) + '</g>' +
    T(236, 66, 30, '☕') + T(282, 92, 30, '📱') + T(232, 132, 30, '🍚') + T(280, 150, 22, '🎧'));

  // كرسي الديوانية — ٦٠ ثانية بدون نعم ولا لا
  P.pressure_seat = svg('pressure_seat', '#63171b', '#140405',
    R(60, 54, 70, 56, 10, '#7f1d1d', ' stroke="#F5B942" stroke-width="3"') + R(54, 104, 82, 16, 6, '#991b1b') + R(62, 120, 8, 40, 3, '#F5B942') + R(120, 120, 8, 40, 3, '#F5B942') +
    C(232, 70, 40, 'none', ' stroke="' + GOLD('pressure_seat') + '" stroke-width="7"') + T(232, 82, 30, '٦٠', '#fff', 800) +
    R(186, 128, 52, 26, 13, 'rgba(255,255,255,.12)') + T(212, 146, 12, 'نعم ✗', '#fca5a5') + R(244, 128, 52, 26, 13, 'rgba(255,255,255,.12)') + T(270, 146, 12, 'لا ✗', '#fca5a5') + T(94, 40, 20, '🔥'));

  // عدّاد الديوانية — زايد على عدد الإجابات في ٣٠ ثانية
  P.mazad30 = svg('mazad30', '#3b2a6e', '#0c0820',
    C(96, 98, 56, '#1b1440', ' stroke="' + GOLD('mazad30') + '" stroke-width="7"') + R(88, 30, 16, 14, 4, '#F5B942') + T(96, 112, 40, '٣٠', '#fff', 800) + T(96, 134, 12, 'ثانية', '#c4b5fd', 600) +
    [['٥', 40], ['٨', 82], ['١٢!', 124]].map(function (b, i) { return R(196, b[1], 104, 32, 16, i === 2 ? GOLD('mazad30') : 'rgba(255,255,255,.12)') + T(248, b[1] + 21, 14, 'أزايد: ' + b[0], i === 2 ? '#2b1c00' : '#fff'); }).join(''));

  // مندس الديوانية — كل واحد يرسم خط
  P.fake_artist = svg('fake_artist', '#155e75', '#041319',
    R(30, 16, 172, 140, 10, '#f8fafc') +
    '<path d="M60 120 Q90 40 130 70" stroke="#e11d48" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M130 70 Q160 96 170 130" stroke="#2563eb" stroke-width="5" fill="none" stroke-linecap="round"/>' +
    '<path d="M70 132 L170 132" stroke="#16a34a" stroke-width="5" stroke-linecap="round"/><path d="M90 44 Q120 20 150 40" stroke="#a855f7" stroke-width="5" fill="none" stroke-dasharray="6 6" stroke-linecap="round"/>' +
    T(258, 80, 44, '🕵️') + R(218, 110, 82, 28, 14, '#a855f7') + T(259, 129, 12, 'مين المندس؟'));

  // كذّابين الديوانية — أوراق مقلوبة
  P.liars_table = svg('liars_table', '#3f1d0b', '#0e0603',
    '<ellipse cx="160" cy="150" rx="150" ry="34" fill="#14532d"/>' +
    [-24, -8, 8, 24].map(function (a, i) { return '<g transform="rotate(' + a + ' 120 150)">' + R(98, 52, 46, 68, 7, '#1e3a8a', ' stroke="#F5B942" stroke-width="2"') + T(121, 92, 18, '؟', '#FFE08A') + '</g>'; }).join('') +
    '<g transform="rotate(10 248 74)">' + R(204, 52, 92, 38, 8, '#e11d48', ' stroke="#fff" stroke-width="2"') + T(250, 77, 18, 'كذّاب!', '#fff', 800) + '</g>' + T(250, 128, 13, '👑 ⚔️ 🛡️ 💎', '#fff'));

  // خزائن الديوانية — ٥٠ خزنة
  P.vault50 = (function () {
    var b = '';
    for (var i = 0; i < 50; i++) {
      var x = 14 + (i % 10) * 30, y = 14 + Math.floor(i / 10) * 32, open = [3, 17, 26, 38].indexOf(i) !== -1, alarm = [11, 44].indexOf(i) !== -1;
      b += R(x, y, 26, 28, 5, open ? GOLD('vault50') : alarm ? '#e11d48' : '#1f2937', ' stroke="rgba(255,255,255,.18)"') + (open ? T(x + 13, y + 19, 11, '💰') : alarm ? T(x + 13, y + 19, 11, '🚨') : C(x + 13, y + 14, 5, 'none', ' stroke="#9ca3af" stroke-width="1.5"'));
    }
    return svg('vault50', '#3f3a0e', '#0d0b02', b);
  })();

  // رادار الديوانية — تلميحات تقرب
  P.radar_guess = svg('radar_guess', '#0b3d2e', '#020d09',
    [70, 52, 34, 16].map(function (r) { return C(110, 92, r, 'none', ' stroke="rgba(52,211,153,.5)" stroke-width="2"'); }).join('') +
    '<path d="M110 92 L110 22 A70 70 0 0 1 172 60 Z" fill="rgba(52,211,153,.25)"/>' +
    [[150, 50, '١'], [80, 60, '٢'], [140, 120, '٣'], [96, 112, '٤']].map(function (d) { return C(d[0], d[1], 9, '#34d399') + T(d[0], d[1] + 4, 10, d[2], '#022c1f'); }).join('') +
    R(200, 40, 104, 26, 13, 'rgba(255,255,255,.12)') + T(252, 58, 11, 'تلميح ١: صعب', '#a7f3d0') + R(200, 74, 104, 26, 13, 'rgba(255,255,255,.12)') + T(252, 92, 11, 'تلميح ٤: أسهل', '#a7f3d0') +
    R(200, 112, 104, 30, 15, GOLD('radar_guess')) + T(252, 132, 13, 'خمّنتها! +٦', '#2b1c00'));

  // تحقيق الديوانية — قصتين لازم تتطابق
  P.alibi_court = svg('alibi_court', '#1e1b4b', '#06051a',
    '<path d="M160 0 L160 26" stroke="#9ca3af" stroke-width="3"/><path d="M130 26 H190 L210 56 H110 Z" fill="#F5B942"/><path d="M110 56 L60 170 H260 L210 56 Z" fill="rgba(255,224,138,.12)"/>' +
    R(40, 76, 70, 92, 12, '#0f172a', ' stroke="#38bdf8" stroke-width="2"') + T(75, 104, 10, '«كنا في', '#cbd5f5', 600) + T(75, 120, 10, 'المطبخ»', '#cbd5f5', 600) + T(75, 150, 18, '📱') +
    R(210, 76, 70, 92, 12, '#0f172a', ' stroke="#f472b6" stroke-width="2"') + T(245, 104, 10, '«كنا في', '#fbcfe8', 600) + T(245, 120, 10, 'الحوش»', '#fbcfe8', 600) + T(245, 150, 18, '📱') +
    T(160, 126, 30, '❗'));

  // Drawn game pictures (loaded into the database as /media/med_seed_game_<slug>); the drawing above stays as a fallback.
  ['eight','qaftah','chancellor','harf','qaddirha','dakhil','mafia','shifra','mystery_button','golden_vault','diwaniya_auction','fortune_wheel',
   'friends_court','last_one_standing','silent_library','who_knows_friend','draw_guess','stadium_esports','how_much_price','pressure_seat',
   'mazad30','fake_artist','liars_table','vault50','radar_guess','alibi_court'].forEach(function (k) {
    var old = P[k] || '';
    // Only the picture (on the same navy as its own background); the old drawing peeked out at odd sizes while it loaded.
    P[k] = '<div style="position:relative;width:100%;height:100%;background:#151d4a">' +
      '<img src="/media/med_seed_game_' + k + '?v=3" alt="" decoding="async" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block"></div>';
  });
  window.DW_POSTERS = P;
})();
