/* Diwaniya+ volume: one sound control for every game (effects and narrator), kept per device.
   Loaded first in each game page. Games make their effects with WebAudio, so every AudioContext's
   destination is replaced by a gain we control; spoken lines (speechSynthesis) and the owner's
   narrator recordings follow the narrator level. A small 🔊 button opens the panel. */
(function () {
  'use strict';
  if (window.__dwVol) return;
  var KEY = 'dw_volume_v1';
  var S = { fx: 1, voice: 1, muted: false };
  try { var saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved) { S.fx = +saved.fx; S.voice = +saved.voice; S.muted = !!saved.muted; } } catch (e) {}
  if (!(S.fx >= 0 && S.fx <= 1)) S.fx = 1;
  if (!(S.voice >= 0 && S.voice <= 1)) S.voice = 1;
  var fxLevel = function () { return S.muted ? 0 : S.fx; };
  var voiceLevel = function () { return S.muted ? 0 : S.voice; };

  // 1) Effects: every (real-time) AudioContext plays through one gain per context.
  var masters = [];
  var Base = window.BaseAudioContext || window.AudioContext || window.webkitAudioContext;
  var Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  try {
    var desc = Base && Object.getOwnPropertyDescriptor(Base.prototype, 'destination');
    if (desc && desc.get && desc.configurable) {
      var map = new WeakMap();
      Object.defineProperty(Base.prototype, 'destination', {
        configurable: true, enumerable: desc.enumerable,
        get: function () {
          var real = desc.get.call(this);
          if (Offline && this instanceof Offline) return real; // sounds rendered ahead are scaled when they play
          var g = map.get(this);
          if (!g) {
            try { g = this.createGain(); g.gain.value = fxLevel(); g.connect(real); map.set(this, g); masters.push(g); }
            catch (e) { return real; }
          }
          return g;
        }
      });
    }
  } catch (e) {}

  // 2) Spoken lines from the device voice.
  try {
    var syn = window.speechSynthesis;
    if (syn && syn.speak) {
      var speak = syn.speak.bind(syn);
      syn.speak = function (u) {
        try { if (u) u.volume = Math.max(0, Math.min(1, (u.volume == null ? 1 : u.volume) * voiceLevel())); } catch (e) {}
        if (voiceLevel() === 0) return; // muted: say nothing (some devices ignore a zero volume)
        return speak(u);
      };
    }
  } catch (e) {}

  // 3) Audio/video elements: the owner's recordings follow the narrator, everything else the effects.
  var media = [];
  function levelFor(el) { return el.__dwVoice ? voiceLevel() : fxLevel(); }
  function applyEl(el) {
    try { var v = levelFor(el); el.volume = v; el.muted = v === 0 ? true : (el.__dwMutedByUs ? false : el.muted); el.__dwMutedByUs = v === 0; } catch (e) {}
  }
  try {
    var play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (media.indexOf(this) < 0) { media.push(this); if (media.length > 60) media.shift(); }
      applyEl(this);
      return play.apply(this, arguments);
    };
  } catch (e) {}

  function apply() {
    masters.forEach(function (g) { try { g.gain.setTargetAtTime(fxLevel(), g.context.currentTime, 0.02); } catch (e) { try { g.gain.value = fxLevel(); } catch (e2) {} } });
    media.forEach(applyEl);
    if (voiceLevel() === 0) { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} }
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
    paint();
  }
  window.__dwVol = { get: function () { return { fx: S.fx, voice: S.voice, muted: S.muted }; }, set: function (o) { Object.assign(S, o || {}); apply(); } };

  // 4) The panel.
  var btn, panel;
  function icon() { return S.muted || (S.fx === 0 && S.voice === 0) ? '🔇' : (S.fx < 0.4 && S.voice < 0.4 ? '🔉' : '🔊'); }
  function paint() {
    if (!btn) return;
    btn.textContent = icon();
    panel.querySelector('[data-k=fx]').value = Math.round(S.fx * 100);
    panel.querySelector('[data-k=voice]').value = Math.round(S.voice * 100);
    panel.querySelector('[data-v=fx]').textContent = Math.round(S.fx * 100) + '٪';
    panel.querySelector('[data-v=voice]').textContent = Math.round(S.voice * 100) + '٪';
    var m = panel.querySelector('.dwv-mute'); m.textContent = S.muted ? '🔊 رجّع الصوت' : '🔇 كتم الكل'; m.classList.toggle('on', S.muted);
  }
  function mount() {
    if (btn || !document.body) return;
    var css = document.createElement('style');
    css.textContent =
      '.dwv-btn{position:fixed;left:10px;bottom:10px;z-index:2147483000;width:40px;height:40px;border-radius:50%;border:1px solid rgba(245,185,66,.55);background:rgba(10,15,36,.82);color:#fff;font-size:18px;line-height:1;display:grid;place-items:center;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.45);-webkit-tap-highlight-color:transparent;padding:0}' +
      '.dwv-btn:hover{background:rgba(20,28,64,.95)}' +
      '.dwv-pan{position:fixed;left:10px;bottom:58px;z-index:2147483001;width:min(260px,calc(100vw - 20px));box-sizing:border-box;padding:14px;border-radius:16px;background:rgba(10,15,36,.97);border:1px solid rgba(245,185,66,.45);color:#F8FAFC;font:600 14px/1.4 -apple-system,"Tajawal","Cairo",sans-serif;direction:rtl;box-shadow:0 14px 40px rgba(0,0,0,.6);display:none}' +
      '.dwv-pan.open{display:block}.dwv-pan h4{margin:0 0 10px;font-size:15px;color:#F5B942}' +
      '.dwv-row{margin:8px 0 12px}.dwv-row div{display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px}.dwv-row b{color:#cbd5f5;font-weight:700}' +
      '.dwv-row input{width:100%;accent-color:#F5B942;height:26px;margin:0}' +
      '.dwv-mute{width:100%;padding:9px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font:800 14px -apple-system,"Tajawal",sans-serif;cursor:pointer}' +
      '.dwv-mute.on{background:rgba(244,63,94,.25);border-color:rgba(244,63,94,.6)}' +
      '.dwv-pan.top{top:10px;bottom:auto}html.dwv-framed .dwv-btn{display:none}' +
      '.dw-FloatingAudioBar{display:none!important}' +
      '@media print{.dwv-btn,.dwv-pan{display:none}}';
    document.head.appendChild(css);
    btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'dwv-btn'; btn.setAttribute('aria-label', 'الصوت');
    panel = document.createElement('div');
    panel.className = 'dwv-pan';
    panel.innerHTML = '<h4>🔊 الصوت</h4>' +
      '<label class="dwv-row"><div><span>🎵 المؤثرات والموسيقى</span><b data-v="fx"></b></div><input type="range" min="0" max="100" step="5" data-k="fx"></label>' +
      '<label class="dwv-row"><div><span>🎙️ صوت الراوي</span><b data-v="voice"></b></div><input type="range" min="0" max="100" step="5" data-k="voice"></label>' +
      '<button type="button" class="dwv-mute"></button>';
    document.body.appendChild(panel); document.body.appendChild(btn);
    btn.addEventListener('click', function (e) { e.stopPropagation(); panel.classList.toggle('open'); });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
    panel.addEventListener('input', function (e) {
      var k = e.target && e.target.getAttribute('data-k'); if (!k) return;
      S[k] = Math.max(0, Math.min(1, e.target.value / 100)); if (S[k] > 0) S.muted = false; apply();
    });
    panel.querySelector('.dwv-mute').addEventListener('click', function () { S.muted = !S.muted; apply(); });
    document.addEventListener('click', function () { panel.classList.remove('open'); });
    // Inside the store's game window the store's own 🔊 button opens this panel, so the floating one is hidden.
    var framed = false; try { framed = window.top !== window; } catch (e) { framed = true; }
    if (framed) { document.documentElement.classList.add('dwv-framed'); panel.classList.add('top'); }
    window.addEventListener('message', function (ev) {
      if (ev.origin !== location.origin || !ev.data || ev.data.type !== 'DW_VOLUME_OPEN') return;
      panel.classList.toggle('open');
    });
    paint();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
