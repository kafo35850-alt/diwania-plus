// Draws the posters of the Eight categories in content/eight_categories.json into public/cat-posters/<name>.svg.
//   node scripts/build-cat-posters.mjs
// Pure vector art (no text, no emoji) so it looks the same on every phone and TV.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'cat-posters');
mkdirSync(out, { recursive: true });

const W = 320, H = 200;
function frame(id, [c1, c2], glow, art, pattern = 'dots') {
  const pat = pattern === 'grid'
    ? `<pattern id="p${id}" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#fff" stroke-opacity=".06"/></pattern>`
    : pattern === 'waves'
      ? `<pattern id="p${id}" width="40" height="16" patternUnits="userSpaceOnUse"><path d="M0 8q10-8 20 0t20 0" fill="none" stroke="#fff" stroke-opacity=".07" stroke-width="2"/></pattern>`
      : `<pattern id="p${id}" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="#fff" fill-opacity=".08"/></pattern>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
<radialGradient id="r${id}" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="${glow}" stop-opacity=".55"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>
<filter id="s${id}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity=".35"/></filter>
${pat}
</defs>
<rect width="${W}" height="${H}" fill="url(#g${id})"/>
<rect width="${W}" height="${H}" fill="url(#p${id})"/>
<circle cx="160" cy="108" r="96" fill="url(#r${id})"/>
<g filter="url(#s${id})">${art}</g>
<rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="14" fill="none" stroke="#fff" stroke-opacity=".12"/>
</svg>`;
}

const GOLD = '#F5B942', GOLD2 = '#FFE08A', INK = '#0A0F24', WHITE = '#F8FAFC';

const POSTERS = {
  // graduation cap with tassel, flying confetti
  uni_general: frame('a', ['#111b4a', '#3b2a8c'], '#7c6cff', `
    <path d="M160 52 L240 86 L160 120 L80 86 Z" fill="${INK}" stroke="${GOLD}" stroke-width="3"/>
    <path d="M118 102 v26 q42 22 84 0 v-26 l-42 18 z" fill="#1d2557" stroke="${GOLD}" stroke-width="3"/>
    <path d="M160 86 L222 96 v36" fill="none" stroke="${GOLD}" stroke-width="3"/>
    <rect x="216" y="130" width="12" height="18" rx="3" fill="${GOLD}"/>
    <circle cx="160" cy="86" r="5" fill="${GOLD2}"/>
    <rect x="60" y="40" width="8" height="8" rx="2" fill="${GOLD2}" transform="rotate(20 64 44)"/>
    <rect x="252" y="48" width="7" height="7" rx="2" fill="#5eead4" transform="rotate(-15 255 51)"/>
    <rect x="70" y="140" width="6" height="6" rx="2" fill="#f472b6"/>
    <rect x="250" y="150" width="8" height="8" rx="2" fill="${GOLD2}" transform="rotate(35 254 154)"/>`),
  // classical columned hall
  uni_ksu: frame('b', ['#0b3b2e', '#0f766e'], '#34d399', `
    <path d="M90 78 L160 46 L230 78 Z" fill="${GOLD}"/>
    <rect x="86" y="78" width="148" height="10" rx="2" fill="${GOLD2}"/>
    ${[100, 126, 152, 178, 204].map((x) => `<rect x="${x}" y="92" width="14" height="56" rx="3" fill="${WHITE}"/><rect x="${x - 2}" y="90" width="18" height="5" rx="1" fill="#d1fae5"/>`).join('')}
    <rect x="80" y="148" width="160" height="10" rx="2" fill="${GOLD2}"/>
    <rect x="72" y="158" width="176" height="10" rx="2" fill="${GOLD}"/>
    <circle cx="160" cy="66" r="6" fill="${INK}"/>`, 'grid'),
  // water tower on a hill + oil derrick
  uni_kfupm: frame('c', ['#0c1d3d', '#0e7490'], '#22d3ee', `
    <path d="M30 172 Q160 120 290 172 Z" fill="#0b2a4a"/>
    <rect x="150" y="70" width="20" height="78" fill="#cbd5e1"/>
    <path d="M150 148 L132 172 H188 L170 148 Z" fill="#94a3b8"/>
    <path d="M128 46 Q160 22 192 46 L184 72 H136 Z" fill="${WHITE}" stroke="${GOLD}" stroke-width="3"/>
    <rect x="132" y="64" width="56" height="8" rx="3" fill="${GOLD}"/>
    <path d="M228 168 L246 92 L264 168 M234 140 H258 M238 120 H254 M242 104 H250" fill="none" stroke="${GOLD2}" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="246" cy="88" r="5" fill="${GOLD}"/>
    <path d="M60 150 q8-14 16 0 q8 14 16 0" fill="none" stroke="#5eead4" stroke-width="3" opacity=".7"/>`),
  // automated metro train
  uni_pnu: frame('d', ['#3b0a45', '#a21caf'], '#f0abfc', `
    <rect x="40" y="164" width="240" height="6" rx="3" fill="#f5d0fe" opacity=".5"/>
    <path d="M70 78 h156 q30 0 42 30 l8 30 q2 18 -16 18 H70 q-12 0 -12 -12 V90 q0-12 12-12 z" fill="${WHITE}"/>
    <path d="M226 78 q30 0 42 30 l6 22 h-48 z" fill="#c084fc"/>
    ${[78, 116, 154, 192].map((x) => `<rect x="${x}" y="92" width="30" height="28" rx="6" fill="#581c87"/>`).join('')}
    <rect x="58" y="128" width="210" height="8" fill="${GOLD}"/>
    <circle cx="100" cy="160" r="9" fill="${INK}"/><circle cx="220" cy="160" r="9" fill="${INK}"/>
    <circle cx="262" cy="144" r="4" fill="${GOLD2}"/>`, 'grid'),
  // sea waves with a sail
  uni_kau: frame('e', ['#082f49', '#0369a1'], '#38bdf8', `
    <path d="M110 60 v86 h-34 z" fill="${WHITE}"/>
    <path d="M116 46 v100 h64 z" fill="${GOLD2}"/>
    <rect x="113" y="42" width="4" height="108" fill="${INK}"/>
    <path d="M66 148 h132 l-14 18 h-104 z" fill="#7c2d12"/>
    <circle cx="238" cy="62" r="20" fill="${GOLD}"/>
    <path d="M30 168 q16-12 32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 V200 H30 z" fill="#0ea5e9" opacity=".75"/>
    <path d="M14 180 q16-12 32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 V200 H14 z" fill="#0284c7"/>`, 'waves'),
  // folded map with pins
  uni_others: frame('f', ['#450a0a', '#c2410c'], '#fb923c', `
    <path d="M70 60 l60-14 l60 14 l60-14 v104 l-60 14 l-60-14 l-60 14 z" fill="#fef3c7"/>
    <path d="M130 46 v104 M190 60 v104" stroke="#fcd34d" stroke-width="3"/>
    <path d="M86 120 q30-40 64-10 t60 -24 t40 4" fill="none" stroke="#c2410c" stroke-width="3" stroke-dasharray="6 6"/>
    ${[[100, 92, '#dc2626'], [158, 112, '#0f766e'], [214, 80, '#7c3aed']].map(([x, y, c]) => `<path d="M${x} ${y} c-12-14-12-30 0-30 s12 16 0 30z" fill="${c}"/><circle cx="${x}" cy="${y - 20}" r="4" fill="${WHITE}"/>`).join('')}`),
  // dorm bed under a moon, with a laptop glow
  uni_life: frame('g', ['#1e1b4b', '#6d28d9'], '#a78bfa', `
    <circle cx="246" cy="54" r="22" fill="${GOLD2}"/><circle cx="256" cy="48" r="20" fill="#3b2a8c"/>
    <rect x="62" y="116" width="196" height="24" rx="6" fill="${WHITE}"/>
    <rect x="62" y="104" width="54" height="22" rx="10" fill="#c4b5fd"/>
    <rect x="110" y="110" width="148" height="18" rx="8" fill="#f472b6"/>
    <rect x="56" y="88" width="10" height="76" rx="4" fill="${GOLD}"/><rect x="254" y="112" width="10" height="52" rx="4" fill="${GOLD}"/>
    <rect x="56" y="140" width="208" height="12" rx="4" fill="#92400e"/>
    <path d="M86 58 l3 7 l7 1 l-5 5 l1 7 l-6-3 l-6 3 l1-7 l-5-5 l7-1 z" fill="${GOLD2}"/>
    <path d="M150 40 l2 5 l5 1 l-4 3 l1 5 l-4-2 l-4 2 l1-5 l-4-3 l5-1 z" fill="${WHITE}" opacity=".7"/>`),
  // stethoscope around a heart
  major_med: frame('h', ['#064e3b', '#0d9488'], '#5eead4', `
    <path d="M160 160 C100 120 96 72 128 64 C146 60 156 72 160 82 C164 72 174 60 192 64 C224 72 220 120 160 160 Z" fill="#f43f5e"/>
    <path d="M136 104 h14 l6-12 l8 24 l6-12 h14" fill="none" stroke="${WHITE}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M96 40 v30 q0 34 34 34 M224 40 v30 q0 34 -34 34" fill="none" stroke="#e2e8f0" stroke-width="6" stroke-linecap="round"/>
    <circle cx="96" cy="38" r="6" fill="${GOLD}"/><circle cx="224" cy="38" r="6" fill="${GOLD}"/>
    <path d="M240 76 v40 q0 28 -24 28" fill="none" stroke="#e2e8f0" stroke-width="6" stroke-linecap="round"/>
    <circle cx="240" cy="72" r="12" fill="${GOLD}" stroke="${WHITE}" stroke-width="4"/>`, 'grid'),
  // laptop with code brackets and a gear
  major_eng: frame('i', ['#0f172a', '#1d4ed8'], '#60a5fa', `
    <rect x="86" y="54" width="148" height="94" rx="10" fill="#1e293b" stroke="#93c5fd" stroke-width="3"/>
    <rect x="96" y="64" width="128" height="74" rx="4" fill="#020617"/>
    <path d="M130 86 l-14 15 l14 15 M190 86 l14 15 l-14 15 M168 80 l-16 42" fill="none" stroke="#5eead4" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M66 148 h188 l-12 16 h-164 z" fill="#cbd5e1"/>
    <g transform="translate(250 56)"><circle r="16" fill="${GOLD}"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="-4" y="-22" width="8" height="10" rx="2" fill="${GOLD}" transform="rotate(${a})"/>`).join('')}<circle r="6" fill="${INK}"/></g>`, 'grid'),
  // rising bar chart with arrow and scales of justice
  major_biz: frame('j', ['#052e16', '#166534'], '#4ade80', `
    <rect x="76" y="166" width="168" height="5" rx="2" fill="#bbf7d0" opacity=".6"/>
    ${[[88, 126, '#86efac'], [122, 104, '#4ade80'], [156, 84, GOLD2], [190, 60, GOLD]].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="24" height="${166 - y}" rx="4" fill="${c}"/>`).join('')}
    <path d="M84 116 L128 92 L160 102 L224 46" fill="none" stroke="${WHITE}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M206 44 h20 v20" fill="none" stroke="${WHITE}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <g transform="translate(256 116)"><rect x="-2" y="-30" width="4" height="44" fill="${WHITE}"/><rect x="-22" y="-30" width="44" height="4" fill="${WHITE}"/><path d="M-22 -26 l-8 18 h16 z M22 -26 l-8 18 h16 z" fill="${GOLD2}"/><rect x="-12" y="14" width="24" height="4" fill="${WHITE}"/></g>`),
  // exam sheet with bubbles and a pencil
  qiyas: frame('k', ['#4c0519', '#e11d48'], '#fda4af', `
    <rect x="104" y="40" width="112" height="132" rx="8" fill="${WHITE}" transform="rotate(-4 160 106)"/>
    <g transform="rotate(-4 160 106)">
      <rect x="118" y="54" width="70" height="7" rx="3" fill="#94a3b8"/>
      ${[0, 1, 2, 3, 4].map((r) => [0, 1, 2, 3].map((c) => `<circle cx="${128 + c * 20}" cy="${80 + r * 18}" r="6" fill="${(r * 3 + c) % 4 === 1 ? INK : 'none'}" stroke="#64748b" stroke-width="2"/>`).join('')).join('')}
    </g>
    <g transform="translate(222 64) rotate(35)"><rect x="-7" y="0" width="14" height="86" rx="2" fill="${GOLD}"/><rect x="-7" y="0" width="14" height="12" rx="2" fill="#f472b6"/><path d="M-7 86 l7 16 l7 -16 z" fill="#fde68a"/><path d="M-2 97 l2 5 l2-5 z" fill="${INK}"/></g>
    <circle cx="80" cy="64" r="16" fill="none" stroke="${GOLD2}" stroke-width="4"/><path d="M80 54 v10 l7 5" fill="none" stroke="${GOLD2}" stroke-width="4" stroke-linecap="round"/>`),
  // airplane over a globe
  abroad: frame('l', ['#0c4a6e', '#4338ca'], '#93c5fd', `
    <circle cx="160" cy="118" r="52" fill="#0ea5e9"/>
    <path d="M120 96 q14-10 24 2 q10 12 -4 22 q-14 6 -12 20 q-12-4 -14-20 q-2-14 6-24 z M174 84 q16 -4 24 10 q6 14 -8 18 q-10 2 -12 14 q-10 -6 -10 -20 q0 -16 6 -22 z M168 146 q10-6 18 0 q-2 10 -12 12 z" fill="#4ade80"/>
    <ellipse cx="160" cy="118" rx="52" ry="18" fill="none" stroke="#e0f2fe" stroke-opacity=".5" stroke-width="2"/>
    <g transform="translate(224 50) rotate(-25)"><path d="M-40 0 q0-6 8-6 h64 q12 0 12 6 q0 6 -12 6 h-64 q-8 0 -8-6 z" fill="${WHITE}"/><path d="M-6 -4 l-18 -26 h10 l26 26 z M-6 4 l-18 26 h10 l26 -26 z" fill="${GOLD}"/><path d="M-38 -2 l-8 -14 h8 l10 12 z" fill="${GOLD}"/></g>
    <path d="M80 60 q40 -30 100 -14" fill="none" stroke="${WHITE}" stroke-width="3" stroke-dasharray="4 7" opacity=".7"/>`),
  // briefcase with ID badge
  new_job: frame('m', ['#431407', '#b45309'], '#fcd34d', `
    <rect x="132" y="56" width="56" height="26" rx="8" fill="none" stroke="#fde68a" stroke-width="7"/>
    <rect x="86" y="76" width="148" height="90" rx="14" fill="#7c2d12"/>
    <rect x="86" y="76" width="148" height="40" rx="14" fill="#9a3412"/>
    <rect x="148" y="104" width="24" height="18" rx="4" fill="${GOLD}"/>
    <g transform="translate(246 108) rotate(10)"><rect x="-24" y="-34" width="48" height="66" rx="8" fill="${WHITE}"/><rect x="-8" y="-40" width="16" height="10" rx="3" fill="#94a3b8"/><circle cx="0" cy="-12" r="10" fill="#fdba74"/><path d="M-14 12 q14-16 28 0 z" fill="#2563eb"/><rect x="-16" y="18" width="32" height="5" rx="2" fill="#cbd5e1"/></g>`, 'grid'),
  // V60 dripper over a cup with steam, and a tomato timer
  coffee_finals: frame('n', ['#1c0f0a', '#78350f'], '#fbbf24', `
    <path d="M122 56 h76 l-24 46 h-28 z" fill="${WHITE}"/>
    <path d="M128 62 h64 l-6 10 h-52 z" fill="#92400e"/>
    <rect x="112" y="100" width="96" height="8" rx="4" fill="${WHITE}"/>
    <path d="M116 112 h88 v34 q0 22 -22 22 h-44 q-22 0 -22 -22 z" fill="#f59e0b"/>
    <path d="M204 120 q22 0 22 16 t-22 16" fill="none" stroke="#f59e0b" stroke-width="8"/>
    <path d="M140 46 q-8-10 0-20 M160 42 q-8-10 0-20 M180 46 q-8-10 0-20" fill="none" stroke="${WHITE}" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>
    <g transform="translate(70 140)"><circle r="20" fill="#ef4444"/><path d="M-8 -20 q8 -10 16 0 q-8 4 -16 0z" fill="#22c55e"/><path d="M0 -8 v8 l6 4" fill="none" stroke="${WHITE}" stroke-width="3" stroke-linecap="round"/></g>`)
};

for (const [name, svg] of Object.entries(POSTERS)) {
  writeFileSync(join(out, name + '.svg'), svg.replace(/\n\s*/g, '\n') + '\n');
}
console.log('posters:', Object.keys(POSTERS).length);
