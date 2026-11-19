/* Diwaniya+ app install: install banner, device-aware illustrated guide, the install reward code,
   and the service worker registration. Loaded by index.html; talks to the page through window.DwApp. */
(function () {
  'use strict';
  var ua = navigator.userAgent || '';
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isIPad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isIOSOtherBrowser = isIOS && /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua);
  var isInAppBrowser = /Instagram|FBAN|FBAV|Snapchat|TikTok|Line\/|WhatsApp/i.test(ua);
  var isAndroid = /Android/i.test(ua);
  var deferredPrompt = null;
  var DISMISS_KEY = 'dw_install_dismissed_at';
  var SHOWN_KEY = 'dw_app_reward_shown';

  function standalone() {
    try { if (window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: minimal-ui)').matches) return true; } catch (e) {}
    return window.navigator.standalone === true;
  }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ar(n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (window.DwApp && window.DwApp.onChange) window.DwApp.onChange();
  });
  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    closeGuide();
    toast('🎉 تم تثبيت ديوانية بلس! افتحه من أيقونته عشان تاخذ كود الخصم.');
  });

  function toast(msg) { if (window.DwApp && window.DwApp.toast) window.DwApp.toast(msg); }

  // ---------- illustrations (plain SVG, no photos) ----------
  var GOLD = '#F5B942', INK = '#0A0F24', TEAL = '#2DD4BF';
  function phone(inner, wide) {
    var w = wide ? 220 : 150, h = wide ? 160 : 260;
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="ai-svg" aria-hidden="true"><rect x="3" y="3" width="' + (w - 6) + '" height="' + (h - 6) + '" rx="' + (wide ? 14 : 22) + '" fill="#111936" stroke="#334155" stroke-width="3"/>' + inner + '</svg>';
  }
  var shareIcon = function (x, y, s) { s = s || 1; return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><rect x="-9" y="-4" width="18" height="16" rx="3" fill="none" stroke="#60a5fa" stroke-width="2.4"/><path d="M0 -14 V4 M-6 -8 L0 -14 L6 -8" fill="none" stroke="#60a5fa" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g>'; };
  var ring = function (x, y, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="none" stroke="' + GOLD + '" stroke-width="3"><animate attributeName="r" values="' + r + ';' + (r + 5) + ';' + r + '" dur="1.4s" repeatCount="indefinite"/></circle>'; };
  var lines = function (x, y, n, w) { var o = ''; for (var i = 0; i < n; i++) o += '<rect x="' + x + '" y="' + (y + i * 14) + '" width="' + (w - i * 9) + '" height="6" rx="3" fill="#334155"/>'; return o; };

  var IOS_STEPS = [
    { t: 'اضغط زر المشاركة', d: isIPad ? 'فوق جنب شريط العنوان في سفاري.' : 'تحت في شريط سفاري (المربع اللي طالع منه سهم ⬆️).',
      svg: isIPad
        ? phone('<rect x="14" y="14" width="192" height="22" rx="8" fill="#1e293b"/><rect x="48" y="19" width="110" height="12" rx="6" fill="#334155"/>' + shareIcon(184, 27, .8) + ring(184, 25, 14) + lines(22, 56, 4, 150), true)
        : phone(lines(20, 40, 6, 110) + '<rect x="12" y="214" width="126" height="34" rx="10" fill="#1e293b"/>' + shareIcon(75, 234, .9) + ring(75, 230, 16)) },
    { t: 'اختر «إضافة إلى الشاشة الرئيسية»', d: 'انزل شوي في القائمة لين تلقاها، وعندها أيقونة مربع فيه ➕.',
      svg: phone('<rect x="12" y="60" width="126" height="170" rx="12" fill="#1e293b"/>' +
        [0, 1, 2, 3].map(function (i) { var y = 72 + i * 38, on = i === 2; return '<rect x="20" y="' + y + '" width="110" height="30" rx="8" fill="' + (on ? '#3b2f10' : '#273349') + '" stroke="' + (on ? GOLD : 'none') + '" stroke-width="2"/>' + (on ? '<rect x="104" y="' + (y + 7) + '" width="16" height="16" rx="4" fill="none" stroke="#fff" stroke-width="2"/><path d="M112 ' + (y + 11) + ' v8 M108 ' + (y + 15) + ' h8" stroke="#fff" stroke-width="2"/><text x="62" y="' + (y + 19) + '" text-anchor="middle" direction="rtl" font-size="7.5" fill="#fff" font-family="Tahoma">إضافة للشاشة الرئيسية</text>' : '<rect x="40" y="' + (y + 12) + '" width="60" height="6" rx="3" fill="#475569"/>'); }).join('')) },
    { t: 'اضغط «إضافة»… وخلاص!', d: 'بتطلع أيقونة ديوانية بلس على شاشتك. افتح التطبيق منها.',
      svg: phone('<rect x="18" y="22" width="114" height="26" rx="6" fill="#1e293b"/><text x="44" y="39" text-anchor="middle" direction="rtl" font-size="10" fill="' + GOLD + '" font-family="Tahoma" font-weight="700">إضافة</text>' + ring(44, 35, 16) +
        '<rect x="45" y="80" width="60" height="60" rx="14" fill="' + GOLD + '"/><path d="M80 94 Q86 104 88 112 Q90 124 79 125 L67 125 M59 103 V120 M51 111.5 H67" fill="none" stroke="#2b1c00" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><text x="75" y="160" text-anchor="middle" font-size="11" fill="#fff" font-family="Tahoma">ديوانية+</text>' +
        [[22, 190], [62, 190], [102, 190]].map(function (p) { return '<rect x="' + p[0] + '" y="' + p[1] + '" width="28" height="28" rx="8" fill="#273349"/>'; }).join('')) }
  ];
  var ANDROID_STEPS = [
    { t: 'افتح قائمة كروم ⋮', d: 'فوق على اليمين في المتصفح (ثلاث نقاط).',
      svg: phone('<rect x="12" y="14" width="126" height="24" rx="8" fill="#1e293b"/><rect x="20" y="20" width="84" height="12" rx="6" fill="#334155"/>' + [0, 1, 2].map(function (i) { return '<circle cx="124" cy="' + (20 + i * 6) + '" r="2.2" fill="#fff"/>'; }).join('') + ring(124, 26, 12) + lines(20, 56, 6, 110)) },
    { t: 'اختر «تثبيت التطبيق»', d: 'أو «إضافة إلى الشاشة الرئيسية» حسب جهازك.',
      svg: phone('<rect x="40" y="16" width="100" height="170" rx="10" fill="#1e293b"/>' + [0, 1, 2, 3].map(function (i) { var y = 28 + i * 36, on = i === 2; return '<rect x="48" y="' + y + '" width="84" height="26" rx="6" fill="' + (on ? '#3b2f10' : '#273349') + '" stroke="' + (on ? GOLD : 'none') + '" stroke-width="2"/>' + (on ? '<text x="90" y="' + (y + 17) + '" text-anchor="middle" direction="rtl" font-size="9" fill="#fff" font-family="Tahoma">تثبيت التطبيق</text>' : ''); }).join('')) },
    { t: 'اضغط «تثبيت»', d: 'وبتطلع الأيقونة مع تطبيقاتك.',
      svg: phone('<rect x="16" y="80" width="118" height="80" rx="12" fill="#1e293b"/><text x="75" y="106" text-anchor="middle" direction="rtl" font-size="10" fill="#fff" font-family="Tahoma">تثبيت التطبيق؟</text><rect x="30" y="124" width="40" height="22" rx="6" fill="#273349"/><rect x="80" y="124" width="44" height="22" rx="6" fill="' + TEAL + '"/><text x="102" y="139" text-anchor="middle" font-size="9" fill="#042f2e" font-family="Tahoma" font-weight="700">تثبيت</text>' + ring(102, 135, 18)) }
  ];

  function stepsHtml(steps) {
    return '<ol class="ai-steps">' + steps.map(function (s, i) {
      return '<li><div class="ai-art">' + s.svg + '</div><div class="ai-txt"><span class="ai-n">' + ar(i + 1) + '</span><b>' + esc(s.t) + '</b><p>' + esc(s.d) + '</p></div></li>';
    }).join('') + '</ol>';
  }

  function guideBody(reward) {
    var head = '<p class="ai-lead">ثبّته مرة وحدة، وافتحه بعدها من أيقونته على شاشتك: بدون شريط المتصفح، وبملء الشاشة' + (reward ? '، و<b>تاخذ كود خصم ' + ar(reward) + ' ريال</b> على أي باقة 🎁' : '') + '.</p>';
    if (standalone()) return head + '<div class="ai-done">✅ أنت فاتح ديوانية بلس من التطبيق المثبّت.</div>';
    if (isInAppBrowser) return head + '<div class="ai-warn">⚠️ أنت فاتح الموقع من داخل تطبيق ثاني (مثل الواتساب أو الإنستقرام). اضغط «فتح في المتصفح» (Safari أو Chrome) وبعدين ثبّته من هناك.</div>';
    if (isIOS) {
      return head + (isIOSOtherBrowser ? '<div class="ai-warn">💡 الأفضل تفتح الموقع من <b>Safari</b> عشان تقدر تثبّته.</div>' : '') + stepsHtml(IOS_STEPS);
    }
    if (deferredPrompt) {
      return head + '<button class="dw-btn dw-btn-gold ai-install" data-ai="install">📲 ثبّت التطبيق الآن</button><p class="ai-or">أو من قائمة المتصفح:</p>' + stepsHtml(ANDROID_STEPS);
    }
    if (isAndroid) return head + stepsHtml(ANDROID_STEPS);
    return head + '<div class="ai-desk"><b>على الكمبيوتر:</b> في Chrome أو Edge، اضغط أيقونة التثبيت 🖥️⬇️ في آخر شريط العنوان، أو من القائمة ⋮ ← «تثبيت ديوانية بلس».<br><b>على الجوال والآيباد:</b> افتح diwaniyaplus.com من الجوال وتطلع لك الخطوات.</div>';
  }

  function host(id) {
    var h = document.getElementById(id);
    if (!h) { h = document.createElement('div'); h.id = id; h.className = 'dw-modal-backdrop'; document.body.appendChild(h); }
    return h;
  }
  function openGuide() {
    var h = host('dwInstallGuide');
    var reward = (window.DwApp && window.DwApp.rewardSar && window.DwApp.rewardSar()) || 2;
    h.innerHTML = '<div class="dw-modal ai-modal" role="dialog" aria-modal="true"><div class="ai-head"><div><h3>📲 ثبّت ديوانية بلس على ' + (isIPad ? 'الآيباد' : isIOS ? 'الآيفون' : isAndroid ? 'جوالك' : 'جهازك') + '</h3></div><button class="dw-btn dw-btn-sec dw-btn-sm" data-ai="close" aria-label="إغلاق">✕</button></div><div class="ai-body">' + guideBody(reward) + '</div></div>';
    h.classList.add('open');
  }
  function closeGuide() { var h = document.getElementById('dwInstallGuide'); if (h) { h.classList.remove('open'); h.innerHTML = ''; } }

  function showReward(info) {
    var h = host('dwAppReward');
    var amount = ar((info.amount_halalas || 200) / 100);
    h.innerHTML = '<div class="dw-modal ai-modal ai-reward" role="dialog" aria-modal="true"><div class="ai-confetti" aria-hidden="true">🎉</div>' +
      '<h3>هلا فيك في تطبيق ديوانية بلس!</h3><p>شكراً إنك ثبّتنا 💛 هذا كود خصم <b>' + amount + ' ريال</b> على أي باقة أقيام، لمرة وحدة:</p>' +
      '<div class="ai-code"><span dir="ltr">' + esc(info.code) + '</span><button class="dw-btn dw-btn-gold dw-btn-sm" data-ai="copy" data-code="' + esc(info.code) + '">📋 نسخ الكود</button></div>' +
      '<p class="ai-small">اكتبه في صفحة «الباقات» قبل الدفع، والخصم ينحسب تلقائياً.</p>' +
      '<div class="ai-row"><button class="dw-btn dw-btn-sec" data-ai="close-reward">لاحقاً</button><button class="dw-btn dw-btn-gold" data-ai="use-code" data-code="' + esc(info.code) + '">💎 روح للباقات</button></div></div>';
    h.classList.add('open');
  }
  function showLoginForReward() {
    var h = host('dwAppReward');
    h.innerHTML = '<div class="dw-modal ai-modal ai-reward" role="dialog" aria-modal="true"><div class="ai-confetti" aria-hidden="true">🎁</div>' +
      '<h3>ثبّت التطبيق؟ عندك هدية!</h3><p>سجّل دخولك بإيميلك عشان نعطيك <b>كود خصم</b> على أي باقة.</p>' +
      '<div class="ai-row"><button class="dw-btn dw-btn-sec" data-ai="close-reward">لاحقاً</button><button class="dw-btn dw-btn-gold" data-ai="login">تسجيل الدخول</button></div></div>';
    h.classList.add('open');
  }

  // Called by the page on load and after login: the reward is only given when the site runs as the installed app.
  function checkReward() {
    if (!standalone() || !window.DwApp) return;
    var user = window.DwApp.user && window.DwApp.user();
    if (!user) {
      if (!store('dw_app_login_nudged')) { store('dw_app_login_nudged', '1'); showLoginForReward(); }
      return;
    }
    window.DwApp.claimInstall(isIOS ? (isIPad ? 'ipad' : 'iphone') : isAndroid ? 'android' : 'desktop').then(function (info) {
      if (!info || !info.ok || !info.active || info.used) return;
      window.DwApp.setPromo(info);
      if (store(SHOWN_KEY) === user.id) return;
      store(SHOWN_KEY, user.id);
      showReward(info);
    });
  }

  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-ai]') : null;
    if (!t) {
      if (e.target && (e.target.id === 'dwInstallGuide' || e.target.id === 'dwAppReward')) { e.target.classList.remove('open'); }
      return;
    }
    var a = t.getAttribute('data-ai');
    if (a === 'open') openGuide();
    else if (a === 'close') closeGuide();
    else if (a === 'dismiss') { store(DISMISS_KEY, String(Date.now())); if (window.DwApp && window.DwApp.onChange) window.DwApp.onChange(); }
    else if (a === 'install' && deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () { deferredPrompt = null; closeGuide(); if (window.DwApp && window.DwApp.onChange) window.DwApp.onChange(); });
    } else if (a === 'copy') {
      var code = t.getAttribute('data-code');
      var done = function () { t.textContent = '✅ تم النسخ'; toast('📋 تم نسخ الكود ' + code); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, done); else done();
    } else if (a === 'close-reward') { var r = document.getElementById('dwAppReward'); if (r) r.classList.remove('open'); }
    else if (a === 'use-code') { var r2 = document.getElementById('dwAppReward'); if (r2) r2.classList.remove('open'); if (window.DwApp && window.DwApp.goPackages) window.DwApp.goPackages(t.getAttribute('data-code')); }
    else if (a === 'login') { var r3 = document.getElementById('dwAppReward'); if (r3) r3.classList.remove('open'); if (window.DwApp && window.DwApp.openLogin) window.DwApp.openLogin(); }
  });

  window.DwInstall = {
    standalone: standalone,
    // The banner shows on the home page unless the app is already in use, or it was closed in the last 3 days.
    bannerVisible: function () {
      if (standalone()) return false;
      var at = Number(store(DISMISS_KEY) || 0);
      return !at || Date.now() - at > 3 * 24 * 3600 * 1000;
    },
    canPrompt: function () { return !!deferredPrompt; },
    openGuide: openGuide,
    checkReward: checkReward,
    platform: function () { return isIOS ? 'ios' : isAndroid ? 'android' : 'other'; }
  };

  if (standalone()) document.documentElement.classList.add('dw-standalone');
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  }
})();
