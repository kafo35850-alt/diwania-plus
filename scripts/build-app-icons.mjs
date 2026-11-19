// Draws the app icons (home screen / install) into public/icons/: 192 and 512 px, a maskable 512 (full-bleed
// background with the mark inside the safe zone) and the 180 px Apple touch icon.
//   node scripts/build-app-icons.mjs   (uses the Playwright browser that ships with this environment)
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const mark = (size, safe) => `<!doctype html><html><body style="margin:0;background:transparent">
<div style="width:${size}px;height:${size}px;display:grid;place-items:center;
  background:radial-gradient(120% 120% at 30% 20%,#1b2a6b 0%,#0A0F24 60%);border-radius:${safe ? 0 : size * 0.22}px;overflow:hidden;position:relative">
  <div style="position:absolute;inset:${size * 0.04}px;border-radius:${safe ? 0 : size * 0.19}px;border:${Math.max(2, size * 0.012)}px solid rgba(245,185,66,.55)"></div>
  <div style="width:${size * (safe ? 0.58 : 0.7)}px;height:${size * (safe ? 0.58 : 0.7)}px;border-radius:${size * 0.17}px;
    background:linear-gradient(145deg,#FFE08A,#F5B942 55%,#D97706);display:grid;place-items:center;
    box-shadow:0 ${size * 0.03}px ${size * 0.08}px rgba(0,0,0,.45), inset 0 ${size * 0.012}px 0 rgba(255,255,255,.6)">
    <svg viewBox="0 0 100 100" style="width:78%;height:78%"><g fill="none" stroke="#2b1c00" stroke-linecap="round" stroke-linejoin="round">
      <path d="M60 26 Q70 40 73 52 Q77 70 60 71 L42 71" stroke-width="11"/>
      <path d="M27 40 V66 M14 53 H40" stroke-width="9"/>
    </g></svg>
  </div>
  <div style="position:absolute;top:${size * 0.12}px;left:${size * 0.15}px;width:${size * 0.05}px;height:${size * 0.05}px;border-radius:50%;background:#2DD4BF;box-shadow:0 0 ${size * 0.05}px #2DD4BF"></div>
</div></body></html>`;

const b = await chromium.launch();
const p = await b.newPage();
for (const [name, size, safe] of [['icon-192.png', 192, false], ['icon-512.png', 512, false], ['icon-maskable-512.png', 512, true], ['../apple-touch-icon.png', 180, true]]) {
  await p.setViewportSize({ width: size, height: size });
  await p.setContent(mark(size, safe));
  await p.waitForTimeout(150);
  await p.screenshot({ path: join(root, 'public', 'icons', name), omitBackground: !safe, clip: { x: 0, y: 0, width: size, height: size } });
  console.log('icon', name);
}
await b.close();
