// Adds a start-up explanation to the one-screen games (the ones with the «التحكم / الشاشة / الاثنين» bar):
// the game's rules (taken from the store guide in public/index.html) + what each screen button does.
// After «يلا نبدأ» the game opens on «التحكم» (the host's own screen). Safe to run again.
//   node scripts/inject-game-intro.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const store = readFileSync(join(root, 'public/index.html'), 'utf8');
const a = store.indexOf('  var GAME_GUIDES = {');
let b = store.indexOf('GAME_GUIDES.alibi_court = {', a);
b = store.indexOf('\n  };', b) + 5;
const ctx = { LUXURY_LOGOS: {}, window: {}, DW_POSTERS: {} }; vm.createContext(ctx);
vm.runInContext(store.slice(a, b).replace('var GAME_GUIDES', 'GAME_GUIDES') + '\n;this.G = GAME_GUIDES;', ctx);
const GUIDES = ctx.G;

const DEFAULT_VIEW = "viewMode: (window.innerWidth >= 960 || (window.innerWidth >= 640 && window.innerWidth > window.innerHeight)) ? 'both' : 'board',";
const INTRO = `/*dw-intro*/
  // Explanation first, then the host's own screen («التحكم»).
  (function () {
    var H = window.DW_HELP || { title: CFG.title, tabs: [] };
    var screens = { label: 'الشاشات', lead: 'تحت الصفحة فيه ٣ أزرار، تطلع عندك أنت بس (اللي فاتح اللعبة):', steps: [
      { h: '🎮 التحكم', t: 'شاشتك أنت: فيها أزرار اللعب والأسرار (مثل الكلمة السرية أو خريطة الألوان). لا تعرضها للاعبين.' },
      { h: '📺 الشاشة', t: 'اعرضها على التلفزيون أو الشاشة الكبيرة عشان يشوفها الكل. ما فيها أي سر.' },
      { h: '🖥️ الاثنين', t: 'التحكم والشاشة جنب بعض، للآيباد أو اللابتوب إذا كنت المشرف وما فيه تلفزيون.' },
      { h: 'نصيحة', t: 'وصّل جوالك أو الآيباد بالتلفزيون واختر «الشاشة»، وإذا تبي تضغط أزرار ارجع لـ«التحكم».' }
    ] };
    var pages = (H.tabs || []).concat([screens]), at = 0;
    var css = document.createElement('style');
    css.textContent = '.dwi-bg{position:fixed;inset:0;z-index:9999;background:rgba(5,8,22,.86);display:grid;place-items:center;padding:16px;backdrop-filter:blur(4px)}' +
      '.dwi{width:min(620px,100%);max-height:92vh;overflow:auto;background:linear-gradient(165deg,#161d3d,#0b1026);border:1px solid rgba(245,185,66,.5);border-radius:22px;padding:20px;color:#fff;display:grid;gap:12px;box-shadow:0 20px 60px rgba(0,0,0,.6)}' +
      '.dwi h2{margin:0;font-size:22px;color:#ffd978}.dwi .sub{color:#aab2d1;font-size:13.5px;line-height:1.7;margin:0}' +
      '.dwi .tabs{display:flex;gap:6px;flex-wrap:wrap}.dwi .tabs button{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);color:#dfe5ff;border-radius:999px;padding:6px 12px;font:700 13px inherit;cursor:pointer}' +
      '.dwi .tabs button.on{background:#f5b942;color:#0a0f24;border-color:#f5b942}.dwi .lead{font-weight:800;font-size:16px;line-height:1.7}' +
      '.dwi ol{margin:0;padding:0;list-style:none;display:grid;gap:8px}.dwi li{line-height:1.7;font-size:14.5px}.dwi li b{color:#ffd978}' +
      '.dwi .nav{display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap}.dwi .nav button{border:0;border-radius:14px;padding:11px 18px;font:900 15px inherit;cursor:pointer}' +
      '.dwi .go{background:linear-gradient(135deg,#ffe08a,#f5b942);color:#0a0f24;flex:1}.dwi .sec{background:rgba(255,255,255,.08);color:#fff}' +
      '.dwi-fab{position:fixed;left:12px;bottom:72px;z-index:50;width:44px;height:44px;border-radius:50%;border:1px solid rgba(245,185,66,.6);background:#141b3a;color:#ffd978;font:900 20px inherit;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.4)}';
    document.head.appendChild(css);
    var bg = document.createElement('div'); bg.className = 'dwi-bg'; bg.id = 'dwIntro';
    function esc2(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function draw() {
      var P = pages[at] || screens;
      bg.innerHTML = '<div class="dwi" role="dialog" aria-label="شرح اللعبة"><h2>' + esc2(H.title || CFG.title) + '</h2>' + (H.subtitle ? '<p class="sub">' + esc2(H.subtitle) + '</p>' : '') +
        '<div class="tabs">' + pages.map(function (p, i) { return '<button data-dwi="' + i + '" class="' + (i === at ? 'on' : '') + '">' + esc2(p.label) + '</button>'; }).join('') + '</div>' +
        (P.lead ? '<div class="lead">' + esc2(P.lead) + '</div>' : '') +
        '<ol>' + (P.steps || []).map(function (s) { return '<li><b>' + esc2(s.h) + ':</b> ' + esc2(s.t) + '</li>'; }).join('') + '</ol>' +
        '<div class="nav">' + (at < pages.length - 1 ? '<button class="sec" data-dwi="' + (at + 1) + '">التالي ←</button>' : '') + '<button class="go" data-dwi="go">فهمت، يلا نبدأ ✅</button></div></div>';
    }
    bg.addEventListener('click', function (e) {
      var t = e.target.closest('[data-dwi]'); if (!t) return;
      var k = t.getAttribute('data-dwi');
      if (k === 'go') { bg.remove(); ST.viewMode = 'phone'; renderAll(); return; }
      at = Number(k); draw();
    });
    function open() { at = 0; draw(); if (!bg.parentNode) document.body.appendChild(bg); }
    var fab = document.createElement('button'); fab.className = 'dwi-fab'; fab.textContent = '؟'; fab.title = 'شرح اللعبة'; fab.addEventListener('click', open);
    document.body.appendChild(fab);
    window.__dwIntro = { open: open, close: function () { if (bg.parentNode) { bg.remove(); ST.viewMode = 'phone'; renderAll(); } } };
    open();
  })();
/*dw-intro-end*/
`;

const files = readdirSync(join(root, 'games')).filter((f) => f.endsWith('.html'));
let n = 0;
for (const f of files) {
  const p = join(root, 'games', f);
  let html = readFileSync(p, 'utf8');
  if (!html.includes('data-act="set-view" data-v="both"') || !html.includes('window.GAME_CONFIG')) continue;
  const slug = f.replace('.html', '');
  html = html.replace(DEFAULT_VIEW, "viewMode: 'phone',");
  const g0 = GUIDES[slug];
  const help = g0 ? { title: g0.title, subtitle: g0.subtitle, tabs: g0.tabs.map((t) => ({ label: t.label, lead: t.lead, steps: t.steps })) } : null;
  const data = '<script id="dwHelpData">window.DW_HELP = ' + JSON.stringify(help).replace(/</g, '\\u003c') + ';</script>\n';
  html = html.replace(/<script id="dwHelpData">[\s\S]*?<\/script>\n/, '');
  html = html.replace('<div id="gameRoot"></div>', data + '<div id="gameRoot"></div>');
  html = html.replace(/\/\*dw-intro\*\/[\s\S]*?\/\*dw-intro-end\*\/\n/, '');
  if (!html.includes('  initGameEngine();\n})();')) throw new Error(f + ': bootstrap marker missing');
  html = html.replace('  initGameEngine();\n})();', '  initGameEngine();\n' + INTRO + '})();');
  writeFileSync(p, html);
  n++;
  if (!help) console.log('no store guide for', slug);
}
console.log('games with intro:', n);
