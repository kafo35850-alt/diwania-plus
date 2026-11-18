/* Category poster drawing engine shared with the Eight Challenge (SVG art only). */
window.M8P = (function () {
const M8P = (function () {
const INK = '#1f2a3a';
const NS = 'stroke="none"';
const SK = { a: '#f3c7a2', b: '#dba57d', c: '#bf8559', d: '#8f5d3c' };
const W = '#ffffff';
const BG = {
blue:   ['#cfe3f6', '#e3effb'],
mint:   ['#c9ecdb', '#e0f6ea'],
peach:  ['#ffd9c2', '#ffe8da'],
lilac:  ['#dcd2f4', '#ebe5fa'],
yellow: ['#fbe9ae', '#fdf2cf'],
pink:   ['#fad0dd', '#fde4eb'],
teal:   ['#c3ebec', '#daf4f4'],
sand:   ['#f0dcba', '#f7ecd5'],
navy:   ['#2b4170', '#3c5690'],
green:  ['#cfe8b9', '#e2f2d2'],
grey:   ['#d6dce4', '#e8ecf1'],
red:    ['#f6c6c0', '#fadcd8']
};
const f = (n) => +(+n).toFixed(1);
const P = (d, fill, x) => `<path d="${d}" fill="${fill}" ${x || ''}/>`;
const C = (cx, cy, r, fill, x) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${x || ''}/>`;
const E = (cx, cy, rx, ry, fill, x) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${x || ''}/>`;
const R = (x, y, w, h, fill, rx, ex) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx || 0}" fill="${fill}" ${ex || ''}/>`;
const L = (x1, y1, x2, y2, x) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${x || ''}/>`;
const POLY = (pts, fill, x) => `<polygon points="${pts}" fill="${fill}" ${x || ''}/>`;
const HL = (d) => P(d, W, `fill-opacity=".42" ${NS}`);          // highlight shape
const SH = (d) => P(d, '#000', `fill-opacity=".13" ${NS}`);     // shade shape
const star = (cx, cy, r, fill, x) => {
let p = [];
for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rr = i % 2 ? r * 0.45 : r; p.push(f(cx + rr * Math.cos(a)) + ',' + f(cy + rr * Math.sin(a))); }
return POLY(p.join(' '), fill, x);
};
const ngon = (cx, cy, r, n, fill, rot, x) => {
let p = [];
for (let i = 0; i < n; i++) { const a = (rot || -90) * Math.PI / 180 + i * 2 * Math.PI / n; p.push(f(cx + r * Math.cos(a)) + ',' + f(cy + r * Math.sin(a))); }
return POLY(p.join(' '), fill, x);
};
const sparkle = (cx, cy, r, fill) => P(`M${cx},${cy - r} Q${cx},${cy} ${cx + r},${cy} Q${cx},${cy} ${cx},${cy + r} Q${cx},${cy} ${cx - r},${cy} Q${cx},${cy} ${cx},${cy - r}Z`, fill, NS);
const M = {};      // motifs: (o) => svg string, local coords centred on 0,0 (~100 units)
const T = {};      // person headwear / clothes tables
function person(o) {
o = o || {};
const sk = SK[o.skin || 'b'] || o.skin;
const tc = o.tc || '#4f9be8', tc2 = o.tc2 || '#ffffff', hc = o.hc || '#2b2b33', hc2 = o.hc2 || '#ffffff';
const len = o.len || 62;
let back = '', front = '', body = '';
const head = o.head || 'hair';
if (o.cape) back += P('M-30,-4 Q-52,40 -48,96 Q0,110 48,96 Q52,40 30,-4 L0,12Z', o.cape);
if (head === 'ghutra' || head === 'shemagh') {
const base = head === 'ghutra' ? '#fbfbf7' : '#e4483d';
back += P('M-22,-30 Q-24,-60 0,-60 Q24,-60 22,-30 L34,10 Q0,24 -34,10 Z', base);
if (head === 'shemagh') back += P('M-22,-30 Q-24,-60 0,-60 Q24,-60 22,-30 L34,10 Q0,24 -34,10 Z', 'url(#chk)', NS);
}
if (head === 'hijab') back += P('M-23,-28 Q-25,-60 0,-60 Q25,-60 23,-28 Q30,0 36,16 Q0,30 -36,16 Q-30,0 -23,-28Z', hc);
if (head === 'long') back += P('M-19,-32 Q-22,-58 0,-58 Q22,-58 19,-32 Q24,-8 20,12 L-20,12 Q-24,-8 -19,-32Z', hc);
if (head === 'hood') back += P('M-24,-26 Q-26,-62 0,-62 Q26,-62 24,-26 L32,6 L-32,6Z', tc);
const tw = 36;
let torso = P(`M-${tw},${len} Q-${tw},10 -20,4 L-9,-1 H9 L20,4 Q${tw},10 ${tw},${len}Z`, tc);
let det = '';
switch (o.top || 'tee') {
case 'thobe': torso = P(`M-${tw},${len} Q-${tw},10 -20,4 L-9,-1 H9 L20,4 Q${tw},10 ${tw},${len}Z`, '#fbfbf7'); det = L(0, 2, 0, 30, `stroke-width="1.6"`) + C(0, 30, 1.6, INK, NS) + P('M-9,-1 L0,9 L9,-1', 'none', `stroke-width="1.8"`); break;
case 'suit': torso = P(`M-${tw},${len} Q-${tw},10 -20,4 L-9,-1 H9 L20,4 Q${tw},10 ${tw},${len}Z`, tc) + P('M-9,-1 L0,28 L9,-1Z', W); det = P('M-3,2 H3 L5,24 L0,32 L-5,24Z', o.tie || '#d94a3d') + L(-9, -1, -1, 26, 'stroke-width="1.6"') + L(9, -1, 1, 26, 'stroke-width="1.6"') + L(-20, 4, -14, 30, 'stroke-width="1.4" opacity=".5"') + L(20, 4, 14, 30, 'stroke-width="1.4" opacity=".5"'); break;
case 'jersey': torso += P(`M-9,-1 L0,8 L9,-1`, tc2, 'stroke-width="3"'); det = P(`M-${tw},${len} Q-${tw},10 -30,6 L-30,${len}Z`, tc2, `fill-opacity=".0" ${NS}`) + L(-26, 10, -26, len, `stroke="${tc2}" stroke-width="3"`) + L(26, 10, 26, len, `stroke="${tc2}" stroke-width="3"`); break;
case 'jump': det = L(0, 2, 0, len, `stroke-width="1.8"`) + P('M-9,-1 L-4,8 L0,3 L4,8 L9,-1', tc2, 'stroke-width="1.8"'); break;
case 'lab': torso = P(`M-${tw},${len} Q-${tw},10 -20,4 L-9,-1 H9 L20,4 Q${tw},10 ${tw},${len}Z`, '#fdfdfb') + P('M-9,-1 L0,22 L9,-1Z', tc); det = L(0, 22, 0, len, `stroke-width="1.6"`) + P('M-9,-1 L-14,16 L0,22Z', '#fdfdfb') + P('M9,-1 L14,16 L0,22Z', '#fdfdfb') + R(10, 34, 14, 12, '#fdfdfb', 2, 'stroke-width="1.6"'); break;
case 'gal': torso = P(`M-${tw},${len} Q-${tw},10 -20,4 L-9,-1 H9 L20,4 Q${tw},10 ${tw},${len}Z`, tc) + L(-14, 6, -14, len, `stroke="${tc2}" stroke-width="3"`) + L(0, 6, 0, len, `stroke="${tc2}" stroke-width="3"`) + L(14, 6, 14, len, `stroke="${tc2}" stroke-width="3"`); det = P('M-9,-1 L0,9 L9,-1', 'none', 'stroke-width="1.8"'); break;
case 'robe': torso = P(`M-${tw},${len} Q-${tw},10 -20,4 L-9,-1 H9 L20,4 Q${tw},10 ${tw},${len}Z`, tc) + P(`M-9,-1 L10,26 L22,${len} L10,${len} L-2,28 L-9,-1Z`, tc2); det = ''; break;
case 'armor': torso = P(`M-${tw},${len} Q-${tw},10 -20,4 L-9,-1 H9 L20,4 Q${tw},10 ${tw},${len}Z`, '#b9c3d0') + P(`M-${tw},12 Q-${tw},4 -22,2 L-9,-1 H9 L22,2 Q${tw},4 ${tw},12 L24,22 L-24,22Z`, '#8c99a9'); det = L(0, 3, 0, len, 'stroke-width="1.6"') + L(-24, 34, 24, 34, 'stroke-width="1.6"') + L(-26, 48, 26, 48, 'stroke-width="1.6"'); break;
case 'hoodie': det = P('M-14,4 Q0,18 14,4', 'none', 'stroke-width="2"') + L(-4, 14, -4, 30, 'stroke-width="1.8"') + L(4, 14, 4, 30, 'stroke-width="1.8"'); break;
case 'tee': det = P('M-9,-1 Q0,10 9,-1', 'none', 'stroke-width="1.8"'); break;
case 'dress': torso = P(`M-${tw},${len} Q-${tw},10 -20,4 L-9,-1 H9 L20,4 Q${tw},10 ${tw},${len}Z`, tc) + P('M-9,-1 Q0,12 9,-1', tc2, 'stroke-width="1.8"'); break;
default: break;
}
body = torso + det;
const neck = R(-6.5, -15, 13, 16, sk, 3);
const headShape = E(0, -31, 15, 17.5, sk) + E(-15, -30, 3, 4.5, sk, 'stroke-width="1.8"') + E(15, -30, 3, 4.5, sk, 'stroke-width="1.8"');
switch (head) {
case 'hair': front = P('M-16,-30 Q-19,-54 0,-54 Q19,-54 16,-30 Q13,-42 0,-43 Q-13,-42 -16,-30Z', hc); break;
case 'bun': front = P('M-16,-30 Q-19,-54 0,-54 Q19,-54 16,-30 Q13,-42 0,-43 Q-13,-42 -16,-30Z', hc) + C(0, -58, 8, hc); break;
case 'long': front = P('M-16,-32 Q-18,-54 0,-54 Q18,-54 16,-32 Q10,-44 0,-44 Q-10,-44 -16,-32Z', hc); break;
case 'ghutra': case 'shemagh': front = P('M-17,-40 Q0,-54 17,-40 L17,-45 Q0,-61 -17,-45Z', head === 'ghutra' ? '#fbfbf7' : '#e4483d') + E(0, -55, 17, 4.6, 'none', 'stroke-width="4.5" stroke="#1b1b22"'); break;
case 'hijab': front = P('M-17,-34 Q-16,-50 0,-50 Q16,-50 17,-34 Q12,-44 0,-44 Q-12,-44 -17,-34Z', hc) ; break;
case 'cap': front = P('M-17,-38 Q-17,-58 0,-58 Q17,-58 17,-38Z', hc) + P('M-18,-38 H27 Q25,-31 -18,-32Z', hc2) + C(0, -58, 2, hc2); break;
case 'fez': front = P('M-12,-44 L-10,-64 H10 L12,-44Z', '#c8372d') + L(0, -64, 7, -52, 'stroke="#1b1b22" stroke-width="2"') + C(8, -50, 2.6, '#1b1b22', NS); break;
case 'turban': front = P('M-18,-38 Q-20,-62 0,-62 Q20,-62 18,-38 Q0,-48 -18,-38Z', hc) + L(-14, -48, 10, -58, 'stroke-width="1.6"') + L(-16, -42, 14, -55, 'stroke-width="1.6"') + C(0, -60, 3, hc2); break;
case 'wizard': front = P('M-24,-40 Q0,-34 24,-40 Q8,-46 6,-80 Q-2,-60 -14,-46Z', hc) + P('M-24,-40 Q0,-34 24,-40 Q22,-44 18,-45 Q0,-40 -18,-45 Q-22,-44 -24,-40Z', hc2) + star(2, -60, 5, '#ffd166', 'stroke-width="1.2"'); break;
case 'flat': front = P('M-18,-40 Q-18,-54 4,-56 Q22,-56 20,-40Z', hc) + P('M-20,-40 H22 L24,-36 H-20Z', hc2) ; break;
case 'fedora': front = P('M-14,-42 Q-14,-60 0,-60 Q14,-60 14,-42Z', hc) + P('M-14,-46 H14 V-42 H-14Z', hc2, 'stroke-width="1.4"') + P('M-26,-39 Q0,-48 26,-39 Q0,-34 -26,-39Z', hc); break;
case 'tricorn': front = P('M-26,-40 L-12,-62 L0,-52 L12,-62 L26,-40 Q0,-33 -26,-40Z', hc) + C(0, -48, 3, hc2, 'stroke-width="1.2"'); break;
case 'viking': front = P('M-17,-34 Q-18,-58 0,-58 Q18,-58 17,-34Z', '#aeb8c4') + L(-17, -42, 17, -42, 'stroke-width="2"') + P('M-17,-50 Q-30,-56 -28,-70 Q-24,-56 -15,-52Z', '#f5ecd6') + P('M17,-50 Q30,-56 28,-70 Q24,-56 15,-52Z', '#f5ecd6'); break;
case 'helmet': front = P('M-18,-32 Q-20,-58 0,-58 Q20,-58 18,-32 L18,-40 Q0,-44 -18,-40Z', hc) + L(0, -58, 0, -44, 'stroke-width="3" stroke="#fff"'); break;
case 'hard': front = P('M-18,-38 Q-18,-60 0,-60 Q18,-60 18,-38Z', hc) + P('M-24,-38 H24 L22,-34 H-22Z', hc) + R(-3, -60, 6, 14, hc2, 1, NS); break;
case 'deer': front = P('M-17,-38 Q-17,-58 0,-58 Q17,-58 17,-38 Q0,-42 -17,-38Z', hc) + P('M-17,-38 L-24,-34 L-18,-30Z', hc) + P('M17,-38 L24,-34 L18,-30Z', hc) + P('M-8,-58 L0,-64 L8,-58Z', hc2); break;
case 'headset': front = P('M-17,-32 Q-18,-56 0,-56 Q18,-56 17,-32 Q10,-44 0,-44 Q-10,-44 -17,-32Z', hc) + P('M-18,-32 Q-20,-58 0,-58 Q20,-58 18,-32', 'none', 'stroke-width="3.5"') + R(-23, -36, 8, 14, hc2, 3) + R(15, -36, 8, 14, hc2, 3) + P('M19,-24 Q22,-12 8,-10', 'none', 'stroke-width="2"') + C(7, -10, 2.4, hc2); break;
case 'hood': front = P('M-16,-30 Q-17,-48 0,-48 Q17,-48 16,-30 Q10,-42 0,-42 Q-10,-42 -16,-30Z', hc); break;
case 'crown': front = P('M-14,-44 L-16,-62 L-7,-54 L0,-66 L7,-54 L16,-62 L14,-44Z', '#f6b93b') + C(0, -52, 2.4, '#e8553d', NS); break;
case 'bald': break;
default: break;
}
const outline = (o.shadow === false ? '' : '');
return `<g>${back}${body}${neck}${SH('M-6.5,-15 H6.5 V-6 Q0,-2 -6.5,-6Z')}${headShape}${front}</g>`;
}
M.person = person;
return { INK, NS, SK, W, BG, f, P, C, E, R, L, POLY, HL, SH, star, ngon, sparkle, M, T, person };
})();
(function (X) {
const { INK, NS, W, P, C, E, R, L, POLY, HL, SH, star, ngon, sparkle, M, f } = X;
const col = (o, k, d) => (o && o[k]) || d;
M.football = (o) => {
let s = C(0, 0, 40, W);
s += ngon(0, 0, 13, 5, INK, -90);
for (let i = 0; i < 5; i++) { const a = (-90 + i * 72) * Math.PI / 180; const x1 = 13 * Math.cos(a), y1 = 13 * Math.sin(a), x2 = 27 * Math.cos(a), y2 = 27 * Math.sin(a); s += L(f(x1), f(y1), f(x2), f(y2), 'stroke-width="2"'); const b = (-90 + i * 72 + 36) * Math.PI / 180; s += ngon(f(33 * Math.cos(a)), f(33 * Math.sin(a)), 6.5, 5, INK, (-90 + i * 72 + 180), NS); }
return s + C(0, 0, 40, 'none') + HL('M-30,-24 Q-20,-34 -8,-37 Q-20,-30 -26,-18Z');
};
M.trophy = (o) => {
const c = col(o, 'c', '#f6b93b'), d = col(o, 'd', '#e09a1b');
return R(-20, 36, 40, 10, '#7a5a2a', 3) + R(-7, 20, 14, 18, d) + P('M-30,-42 H30 V-10 Q30,24 0,26 Q-30,24 -30,-10Z', c) +
P('M-30,-34 H-44 Q-46,-6 -24,4', 'none', 'stroke-width="5"') + P('M30,-34 H44 Q46,-6 24,4', 'none', 'stroke-width="5"') +
P('M-30,-34 H-44 Q-46,-6 -24,4', 'none', `stroke="${c}" stroke-width="2"`) + P('M30,-34 H44 Q46,-6 24,4', 'none', `stroke="${c}" stroke-width="2"`) +
HL('M-22,-36 H-13 V-8 Q-13,10 -19,14 Q-22,4 -22,-8Z') + star(4, -14, 11, W, 'stroke-width="1.6"');
};
M.cupworld = (o) => { // golden world-cup-like generic cup (sculpted shape)
return R(-20, 38, 40, 8, '#2f9d6b', 3) + R(-16, 30, 32, 10, '#3fb97a', 3) + P('M-9,30 Q-20,10 -16,-8 Q-22,-20 -16,-34 Q-8,-46 0,-46 Q8,-46 16,-34 Q22,-20 16,-8 Q20,10 9,30Z', '#f6b93b') +
C(0, -50, 13, '#f6b93b') + HL('M-8,28 Q-16,10 -12,-8 Q-17,-20 -12,-32 Q-8,-40 -3,-42 Q-8,-30 -6,-8 Q-6,8 -4,28Z') + C(0, -50, 13, 'none') + P('M-9,-50 Q0,-58 9,-50', 'none', 'stroke-width="1.6"');
};
M.medal = (o) => {
const c = col(o, 'c', '#f6b93b');
return P('M-18,-48 L-6,-12 L6,-12 L-6,-48Z', '#e8553d') + P('M18,-48 L6,-12 L-6,-12 L6,-48Z', '#3a7bd5') + C(0, 12, 28, c) + C(0, 12, 20, 'none', 'stroke-width="2"') + star(0, 12, 13, W, 'stroke-width="1.6"') + HL('M-20,0 Q-16,-12 -4,-14 Q-14,-6 -18,6Z');
};
M.jersey = (o) => {
const c = col(o, 'c', '#2f7de1'), d = col(o, 'd', '#ffffff');
return P('M-18,-44 L-46,-30 L-36,-6 L-26,-12 L-26,44 Q0,50 26,44 L26,-12 L36,-6 L46,-30 L18,-44 Q0,-32 -18,-44Z', c) +
P('M-18,-44 Q0,-32 18,-44', 'none', `stroke="${d}" stroke-width="5"`) + P('M-18,-44 Q0,-32 18,-44', 'none', 'stroke-width="1.6"') +
L(-26, -12, -26, 44, `stroke="${d}" stroke-width="4"`) + L(26, -12, 26, 44, `stroke="${d}" stroke-width="4"`) +
(o && o.stripes ? P('M-26,6 H26 V16 H-26Z', d, NS) : '') + (o && o.badge ? star(12, -16, 8, d, 'stroke-width="1.4"') : '') + HL('M-22,-8 L-22,38 L-14,38 L-14,-4Z');
};
M.stadium = (o) => {
const c = col(o, 'c', '#c9d1da');
return E(0, 24, 54, 22, '#5aa96b') + P('M-54,24 Q-54,-6 0,-6 Q54,-6 54,24 Q54,36 0,40 Q-54,36 -54,24Z', c) + E(0, 18, 36, 12, '#5aa96b') + E(0, 18, 36, 12, 'none', 'stroke-width="1.6"') + L(0, 6, 0, 30, `stroke="${W}" stroke-width="1.6"`) +
L(-46, -12, -46, -40, 'stroke-width="2.4"') + L(46, -12, 46, -40, 'stroke-width="2.4"') + R(-54, -48, 16, 8, '#ffe58a', 2) + R(38, -48, 16, 8, '#ffe58a', 2);
};
M.goal = (o) => R(-46, -30, 92, 66, 'rgba(255,255,255,.35)', 2, 'stroke-width="4"') + [-30, -14, 2, 18, 34].map(x => L(x, -30, x, 36, 'stroke-width="1" opacity=".5"')).join('') + [-14, 2, 18].map(y => L(-46, y, 46, y, 'stroke-width="1" opacity=".5"')).join('');
M.boot = (o) => { const c = col(o, 'c', '#e8553d'); return P('M-44,-6 Q-44,-30 -34,-34 L-18,-34 Q-16,-18 -4,-14 Q20,-8 40,2 Q48,8 44,18 L-44,18Z', c) + P('M-44,18 H44 L42,28 H-42Z', '#2b3340') + [-34, -20, -6, 8, 22, 34].map(x => R(x - 3, 28, 6, 7, '#2b3340', 1, NS)).join('') + L(-8, -12, 0, -4, 'stroke-width="2"') + L(0, -10, 8, -2, 'stroke-width="2"') + HL('M-40,-4 Q-40,-22 -32,-28 L-30,-6Z'); };
M.basketball = (o) => C(0, 0, 38, '#f08a3c') + P('M-38,0 H38 M0,-38 V38', 'none', 'stroke-width="2.2"') + P('M-27,-27 Q-12,0 -27,27 M27,-27 Q12,0 27,27', 'none', 'stroke-width="2.2"') + C(0, 0, 38, 'none') + HL('M-30,-22 Q-22,-32 -10,-35 Q-20,-28 -26,-16Z');
M.hoop = (o) => R(-34, -44, 68, 46, W, 4, 'stroke-width="2.6"') + R(-14, -20, 28, 20, 'none', 1, 'stroke-width="2.4" stroke="#e8553d"') + E(0, 8, 20, 5, 'none', 'stroke="#e8553d" stroke-width="3.5"') + P('M-18,10 L-12,34 M-6,13 L-4,36 M6,13 L4,36 M18,10 L12,34', 'none', 'stroke-width="1.4"') + P('M-18,10 Q0,40 18,10', 'none', 'stroke-width="1.2" opacity=".6"');
M.racket = (o) => { const c = col(o, 'c', '#3a7bd5'); return `<g transform="rotate(-35)">` + E(0, -16, 24, 30, 'none', `stroke-width="6" stroke="${c}"`) + E(0, -16, 24, 30, 'none', 'stroke-width="1.6"') + [-14, -4, 6, 16].map(x => L(x, -42, x, 10, 'stroke-width="1" opacity=".55"')).join('') + [-30, -18, -6, 6].map(y => L(-22, y, 22, y, 'stroke-width="1" opacity=".55"')).join('') + R(-5, 14, 10, 34, '#2b3340', 4) + `</g>`; };
M.tennisball = (o) => C(0, 0, 22, '#d6e84a') + P('M-19,-12 Q0,0 -19,12 M19,-12 Q0,0 19,12', 'none', `stroke="${W}" stroke-width="2.4"`) + C(0, 0, 22, 'none');
M.glove = (o) => { const c = col(o, 'c', '#e8553d'); return P('M-26,-6 Q-30,-40 -4,-42 Q28,-44 32,-16 Q36,6 26,18 L24,40 H-20 L-22,18 Q-28,8 -26,-6Z', c) + P('M-4,-20 Q4,-14 -4,-8', 'none', 'stroke-width="2"') + R(-22, 28, 46, 14, W, 3) + HL('M-20,-14 Q-18,-32 -4,-34 Q-16,-26 -16,-8Z'); };
M.cage = (o) => POLY('-20,-40 20,-40 46,-14 46,20 20,46 -20,46 -46,20 -46,-14', 'rgba(255,255,255,.3)', 'stroke-width="3.5"') + POLY('-20,-40 20,-40 46,-14 46,20 20,46 -20,46 -46,20 -46,-14', 'none', 'stroke-width="1"') + [-30, -15, 0, 15, 30].map(x => L(x, -40, x, 46, 'stroke-width="1" opacity=".5"')).join('') + [-20, -5, 10, 25].map(y => L(-46, y, 46, y, 'stroke-width="1" opacity=".5"')).join('') + E(0, 46, 52, 10, '#4a5568');
M.belt = (o) => { const c = col(o, 'c', '#2b3340'); return R(-52, -14, 104, 28, c, 8) + P('M-22,-26 H22 Q30,0 22,26 H-22 Q-30,0 -22,-26Z', '#f6b93b') + P('M-14,-16 H14 Q18,0 14,16 H-14 Q-18,0 -14,-16Z', '#e09a1b') + star(0, 0, 9, W, 'stroke-width="1.4"') + C(-38, 0, 5, '#f6b93b') + C(38, 0, 5, '#f6b93b'); };
M.torch = (o) => P('M-10,-4 H10 L6,46 H-6Z', '#8a5a3b') + R(-14, -10, 28, 8, '#c9d1da', 2) + P('M0,-52 Q-20,-34 -12,-16 Q-8,-8 0,-10 Q10,-8 12,-18 Q18,-32 0,-52Z', '#ff8a3d') + P('M0,-36 Q-8,-26 -4,-18 Q0,-14 4,-18 Q8,-26 0,-36Z', '#ffd166', 'stroke-width="1.6"');
M.laurel = (o) => { const c = col(o, 'c', '#3fb97a'); let s = ''; for (let i = 0; i < 7; i++) { const t = i / 6; const x = -34 + 10 * Math.sin(t * 2.2), y = 34 - i * 11; s += P(`M${f(-34 + 18 * Math.sin(t * 2.1) - 8)},${y} q8,-9 14,-2 q-6,9 -14,2Z`, c, 'stroke-width="1.6"'); s += P(`M${f(34 - 18 * Math.sin(t * 2.1) + 8)},${y} q-8,-9 -14,-2 q6,9 14,2Z`, c, 'stroke-width="1.6"'); } return s; };
M.whistle = (o) => P('M-30,-6 H14 Q30,-6 30,12 Q30,28 12,28 Q-8,28 -10,10 H-30Z', '#c9d1da') + C(12, 12, 8, '#fff') + R(-34, -10, 12, 6, '#8aa0b8', 2);
M.flagcheck = (o) => { let s = L(-30, 46, -30, -44, 'stroke-width="4"'); for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) s += R(-26 + c * 11, -44 + r * 11, 11, 11, (r + c) % 2 ? INK : W, 0, 'stroke-width="1"'); return s; };
M.f1car = (o) => { const c = col(o, 'c', '#e8553d'); return R(-52, -14, 8, 22, c, 1) + R(-54, -18, 14, 5, INK, 1) + P('M-44,6 Q-36,-6 -20,-6 L-4,-18 Q4,-24 12,-18 L16,-8 L34,-4 Q52,0 54,8 L54,12 H-44Z', c) + P('M-4,-16 Q4,-22 10,-16 L12,-8 H-6Z', '#2b3340') + C(-2, -16, 3, '#ffd166') + R(40, -2, 14, 4, INK, 1) + C(-28, 12, 12, '#2b3340') + C(-28, 12, 5, '#c9d1da') + C(30, 12, 12, '#2b3340') + C(30, 12, 5, '#c9d1da') + HL('M-34,2 Q-28,-4 -18,-4 L-10,-10 L-16,-1 Q-26,0 -32,6Z'); };
M.supercar = (o) => { const c = col(o, 'c', '#f2b01e'); return P('M-58,10 Q-58,0 -44,-2 L-18,-6 Q-4,-20 14,-18 Q28,-16 36,-6 L54,0 Q60,4 60,12 H-58Z', c) + P('M-6,-6 Q0,-14 12,-13 Q22,-12 28,-5Z', '#8fd0ff') + C(-32, 12, 12, '#2b3340') + C(-32, 12, 5, '#c9d1da') + C(34, 12, 12, '#2b3340') + C(34, 12, 5, '#c9d1da') + L(8, -4, 8, 10, 'stroke-width="1.4"') + P('M-58,4 H-46 V8 H-58Z', '#fff', 'stroke-width="1.4"') + R(50, 2, 10, 5, '#ffe58a', 2) + P('M-40,-2 H-14', 'none', `stroke="${W}" stroke-width="3" opacity=".45"`); };
M.steering = (o) => C(0, 0, 40, 'none', 'stroke="#2b3340" stroke-width="10"') + C(0, 0, 40, 'none', 'stroke-width="1.6"') + C(0, 0, 14, '#c9d1da') + P('M-12,6 L-36,10 M12,6 L36,10 M0,14 V38', 'none', 'stroke="#2b3340" stroke-width="7" stroke-linecap="round"') + C(0, 0, 14, 'none') + star(0, 0, 7, '#e8553d', NS);
M.tire = (o) => C(0, 0, 40, '#2b3340') + C(0, 0, 24, '#c9d1da') + C(0, 0, 8, '#8aa0b8') + [0, 72, 144, 216, 288].map(a => L(0, 0, f(24 * Math.sin(a * Math.PI / 180)), f(-24 * Math.cos(a * Math.PI / 180)), 'stroke-width="2.4"')).join('');
M.helmetrace = (o) => { const c = col(o, 'c', '#3a7bd5'); return P('M-36,14 Q-40,-36 4,-40 Q40,-38 40,0 V22 Q40,30 30,30 H-24 Q-36,30 -36,14Z', c) + P('M-4,-8 H40 V10 H-8Z', '#2b3340') + P('M-4,-8 H40 V0 H-4Z', '#8fd0ff', NS) + L(-36, 6, -4, 6, 'stroke-width="2"') + P('M-30,-20 Q-10,-34 10,-36', 'none', `stroke="${W}" stroke-width="5" opacity=".7"`); };
M.dumbbell = (o) => R(-26, -4, 52, 8, '#8aa0b8', 3) + R(-40, -22, 14, 44, '#2b3340', 4) + R(26, -22, 14, 44, '#2b3340', 4) + R(-50, -14, 10, 28, '#4a5568', 3) + R(40, -14, 10, 28, '#4a5568', 3);
M.mosque = (o) => {
const c = col(o, 'c', '#f4ead2'), d = col(o, 'd', '#3fb0a5');
const mina = (x) => R(x - 6, -14, 12, 60, c, 1) + P(`M${x - 8},-14 H${x + 8} L${x},-38Z`, d) + L(x, -38, x, -48, 'stroke-width="2"') + C(x, -50, 2, '#f6b93b', NS) + R(x - 7, 6, 14, 4, d, 0, NS) + R(x - 3, 20, 6, 10, '#2b3340', 3, NS);
return mina(-44) + mina(44) + R(-34, 12, 68, 34, c, 1) + P('M-26,12 Q-26,-26 0,-26 Q26,-26 26,12Z', d) + L(0, -26, 0, -40, 'stroke-width="2"') + P('M5,-46 A8,8 0 1 0 5,-34 A6,6 0 1 1 5,-46Z', '#f6b93b', 'stroke-width="1.4"') +
P('M-9,46 V30 Q0,16 9,30 V46Z', '#2b3340') + P('M-28,46 V32 Q-22,24 -16,32 V46Z M16,46 V32 Q22,24 28,32 V46Z', '#5aa9a0') + HL('M-20,8 Q-20,-14 -8,-22 Q-14,-6 -14,8Z');
};
M.crescent = (o) => `<g transform="translate(14,0)">` + P('M0,-42 A42,42 0 0 0 0,42 A22,42 0 0 1 0,-42Z', col(o, 'c', '#f6b93b')) + HL('M-34,-18 Q-30,-32 -14,-38 Q-26,-26 -28,-6Z') + `</g>` + star(26, -2, 12, col(o, 'c', '#f6b93b'), 'stroke-width="1.8"');
M.kaaba = (o) => POLY('-40,-24 20,-24 20,42 -40,42', '#2b3340') + POLY('20,-24 44,-34 44,32 20,42', '#1f2630') + POLY('-40,-24 20,-24 44,-34 -16,-34', '#4a5568') + P('M-40,-6 H20 L44,-14 V-6 L20,2 H-40Z', '#f6b93b') + R(-16, 14, 12, 28, '#f6b93b', 2) + P('M-40,-6 H20 V2 H-40Z', '#f6b93b', NS);
M.quran = (o) => { const c = col(o, 'c', '#2f8f6b'); return P('M-44,-22 L-44,38 L-4,44 V-16Z', c) + P('M44,-22 L44,38 L4,44 V-16Z', '#2a7a5b') + P('M-40,-24 Q-16,-30 0,-18 Q16,-30 40,-24 V34 Q16,28 0,38 Q-16,28 -40,34Z', '#fffaf0') + P('M0,-18 V38', 'none', 'stroke-width="1.6"') + [-8, 2, 12, 22].map(y => L(-32, y - 8, -8, y - 4, 'stroke-width="1" opacity=".5"') + L(8, y - 4, 32, y - 8, 'stroke-width="1" opacity=".5"')).join('') + star(-20, -2, 6, '#f6b93b', 'stroke-width="1"') + star(20, -2, 6, '#f6b93b', 'stroke-width="1"'); };
M.rehal = (o) => P('M-30,44 L0,0 L30,44', 'none', 'stroke="#8a5a3b" stroke-width="7"') + P('M-30,44 L0,0 L30,44', 'none', 'stroke-width="1.4"');
M.fort = (o) => { const c = col(o, 'c', '#e2b98a'); const tw = (x, h) => R(x - 11, -h, 22, h + 44, c, 1) + [-8, -2, 4].map(k => R(x + k - 3, -h - 7, 5, 8, c, 0)).join('') + R(x - 2, -h + 12, 4, 10, '#7a5a3a', 1, NS); return R(-40, -8, 80, 52, c, 1) + [-36, -24, -12, 0, 12, 24, 36].map(x => R(x - 4, -14, 8, 8, c, 0)).join('') + tw(-44, 30) + tw(44, 30) + P('M-10,44 V24 Q0,10 10,24 V44Z', '#6b4a2e') + SH('M-40,-8 H-30 V44 H-40Z') + L(-30, 8, -14, 8, 'stroke-width="1.2"'); };
M.towerArch = (o) => { const c = col(o, 'c', '#4f8fd9'); return P('M-18,46 L-18,-30 Q-18,-44 0,-48 Q18,-44 18,-30 L18,46Z', c) + P('M-8,-20 Q0,-34 8,-20 L8,2 H-8Z', 'rgba(255,255,255,0.0)', NS) + P('M-9,-12 Q0,-36 9,-12 V8 H-9Z', '#cfe3f6') + [-34, -22, -10, 2, 14, 26, 38].map(y => L(-18, y, 18, y, 'stroke-width="1" opacity=".45"')).join('') + HL('M-14,40 V-30 Q-14,-38 -6,-42 V40Z'); };
M.spire = (o) => POLY('0,-52 -4,-10 4,-10', '#e8eef5', 'stroke-width="1.6"') + P('M-4,-10 L-9,8 H9 L4,-10Z', '#c9d9ea') + P('M-9,8 L-14,24 H14 L9,8Z', '#aac4de') + P('M-14,24 L-20,46 H20 L14,24Z', '#8fb2d6') + HL('M-2,-48 L-3,-12 L-1,-12Z') + [8, 24].map(y => L(-14, y, 14, y, 'stroke-width="1" opacity=".5"')).join('');
M.twintowers = (o) => { const sp = (x, h, r, c) => P(`M${x - 3.5},46 L${x - 1.5},${-h} L${x + 1.5},${-h} L${x + 3.5},46Z`, '#e8eef5') + C(x, -h + 22, r, c) + C(x, -h + 22, r, 'none') + HL(`M${x - r * .6},${-h + 22 - r * .4} Q${x - r * .4},${-h + 22 - r * .9} ${x},${-h + 22 - r}Z`); return sp(-12, 40, 11, '#4f8fd9') + P('M-3,46 L-4,-12 L-1,-12 L2,46Z', '#e8eef5', NS) + sp(14, 46, 9, '#3a6fb5') + C(14, -10, 5, '#3a6fb5') + E(0, 46, 30, 5, '#2b3340'); };
M.pyramids = (o) => { const c = col(o, 'c', '#f0c36d'); return POLY('-52,40 -14,-14 24,40', c) + POLY('-14,-14 24,40 -2,40', '#d9a447', NS) + POLY('-14,-14 24,40 -2,40', 'none') + POLY('2,40 32,-4 54,40', '#e9b556') + POLY('32,-4 54,40 40,40', '#c9922f', NS) + L(-40, 24, 14, 24, 'stroke-width="1" opacity=".4"') + L(-28, 8, 4, 8, 'stroke-width="1" opacity=".4"'); };
M.sphinx = (o) => P('M-48,40 V22 Q-48,12 -34,12 H-8 Q-4,-8 8,-14 Q22,-18 30,-6 Q36,4 32,16 H48 V40Z', '#e2b25f') + P('M12,-12 Q24,-18 32,-8 L30,14 H14Z', '#d49f4a') + P('M10,-10 L10,12 H34 L34,-10 Q22,-24 10,-10Z', '#f1ca7a') + SH('M-48,30 H48 V40 H-48Z');
M.castle = (o) => { const c = col(o, 'c', '#c3ccd8'); const tw = (x, h, w) => R(x - w / 2, -h, w, h + 46, c, 0) + [...Array(Math.round(w / 8))].map((_, i) => R(x - w / 2 + i * 8 + 1, -h - 6, 5, 7, c, 0)).join('') + P(`M${x - w / 2 - 3},${-h - 6} H${x + w / 2 + 3} L${x},${-h - 30}Z`, '#d9534f', NS) + R(x - 2, -h + 10, 4, 9, INK, 1, NS); return R(-30, -4, 60, 50, c) + [-26, -14, -2, 10, 22].map(x => R(x, -10, 8, 7, c)).join('') + tw(-38, 26, 18) + tw(38, 26, 18) + tw(0, 46, 20) + P('M-9,46 V26 Q0,12 9,26 V46Z', '#6b4a2e') + SH('M-30,-4 H-24 V46 H-30Z'); };
M.pagoda = (o) => { const roof = (y, w) => P(`M${-w},${y} Q${-w + 8},${y - 6} 0,${y - 12} Q${w - 8},${y - 6} ${w},${y} Q${w - 8},${y + 4} ${w - 12},${y + 4} H${-w + 12} Q${-w + 8},${y + 4} ${-w},${y}Z`, '#d9534f'); return R(-22, -2, 44, 14, '#f4ead2') + roof(-2, 34) + R(-16, -24, 32, 18, '#f4ead2') + roof(-24, 26) + R(-10, -42, 20, 16, '#f4ead2') + roof(-42, 18) + L(0, -54, 0, -66, 'stroke-width="2"') + R(-30, 12, 60, 34, '#f4ead2') + roof(12, 40) + R(-6, 24, 12, 22, '#b9382f', 1) + R(-26, 20, 10, 14, '#6b4a2e', 1, NS) + R(16, 20, 10, 14, '#6b4a2e', 1, NS); };
M.eiffel = (o) => P('M0,-52 L-6,-14 L-10,-6 H10 L6,-14Z', '#8a7a68') + P('M-10,-6 L-16,16 H16 L10,-6Z', '#8a7a68') + P('M-16,16 L-30,46 H-20 Q0,26 20,46 H30 L16,16Z', '#8a7a68') + L(-14, 2, 14, 2, 'stroke-width="2.2"') + L(-18, 16, 18, 16, 'stroke-width="2.6"') + L(-4, -26, 4, -26, 'stroke-width="1.6"') + L(-8, -14, 8, -14, 'stroke-width="2"') + P('M-20,34 Q0,18 20,34', 'none', 'stroke-width="1.4"');
M.colosseum = (o) => { let s = P('M-50,40 V0 Q-50,-24 0,-26 Q50,-24 50,0 V40Z', '#e7c88f'); for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) s += P(`M${-42 + c * 12.5},${-8 + r * 15 + 10} v-6 q4,-6 8,0 v6Z`, '#8a6a3a', NS); return s + SH('M-50,30 H50 V40 H-50Z'); };
M.statue = (o) => P('M-14,46 L-10,6 H10 L14,46Z', '#8fc9b3') + R(-18, 40, 36, 8, '#b9c3d0', 2) + P('M-10,6 Q-12,-14 0,-18 Q12,-14 10,6Z', '#8fc9b3') + C(0, -26, 9, '#8fc9b3') + P('M-9,-32 L-14,-42 M-3,-35 L-4,-46 M3,-35 L4,-46 M9,-32 L14,-42', 'none', 'stroke-width="3" stroke-linecap="round"') + P('M10,-6 L22,-28 L22,-44', 'none', 'stroke-width="5" stroke="#8fc9b3"') + P('M22,-44 Q16,-56 22,-62 Q28,-56 22,-44Z', '#ffd166');
M.skyline = (o) => { const c = col(o, 'c', '#7e8fa6'); return R(-46, -2, 18, 48, c) + R(-26, -30, 22, 76, '#6a7b92') + R(-2, -14, 18, 60, c) + R(18, -38, 18, 84, '#6a7b92') + R(38, 6, 14, 40, c) + L(27, -38, 27, -50, 'stroke-width="2"') + [-8, 4, 16, 28, 40].map(y => `<g opacity=".7">` + R(-22, y - 30, 4, 4, '#ffe58a', 0, NS) + R(-12, y - 30, 4, 4, '#ffe58a', 0, NS) + R(22, y - 30, 4, 4, '#ffe58a', 0, NS) + R(30, y - 30, 4, 4, '#ffe58a', 0, NS) + `</g>`).join(''); };
M.house = (o) => R(-34, -4, 68, 48, col(o, 'c', '#f3e3c3'), 1) + P('M-42,-2 L0,-40 L42,-2Z', col(o, 'd', '#d9534f')) + R(-8, 20, 16, 24, '#6b4a2e', 2) + R(-26, 8, 14, 14, '#9ad0ff', 1) + R(12, 8, 14, 14, '#9ad0ff', 1) + R(14, -34, 9, 18, '#b9382f', 0);
M.tent = (o) => P('M-48,42 L0,-34 L48,42Z', col(o, 'c', '#d9b27c')) + P('M0,-34 L-14,42 H14Z', '#8a5a3b') + P('M-48,42 L0,-34 L48,42Z', 'none') + L(0, -34, 0, -46, 'stroke-width="2.4"') + P('M0,-46 L12,-42 L0,-38Z', '#e8553d') + SH('M0,-34 L48,42 H14Z');
M.torii = (o) => P('M-46,-20 Q0,-34 46,-20 L42,-12 Q0,-24 -42,-12Z', '#d9453d') + R(-38, -8, 76, 8, '#d9453d') + R(-30, -4, 10, 50, '#d9453d') + R(20, -4, 10, 50, '#d9453d') + R(-8, -10, 16, 14, '#2b3340', 1) + HL('M-28,0 H-24 V44 H-28Z');
M.dhow = (o) => { return P('M-50,10 H46 Q40,36 14,38 H-26 Q-44,34 -50,10Z', '#8a5a3b') + P('M-50,10 H46 L42,16 H-48Z', '#d9b27c') + L(-6, 10, -6, -44, 'stroke-width="3"') + P('M-6,-44 L-6,6 L38,6Z', W) + P('M-8,-40 L-8,2 L-42,2Z', '#f1d9a8') + P('M-50,10 L-58,2', 'none', 'stroke-width="3"') + `<path d="M-60,44 Q-44,36 -28,44 T4,44 T36,44 T64,44" fill="none" stroke="#4f9be8" stroke-width="4"/>`; };
M.ship = (o) => P('M-48,12 H48 Q40,38 20,40 H-24 Q-42,36 -48,12Z', '#d9534f') + R(-30, -4, 60, 16, W, 2) + [-22, -8, 6, 20].map(x => C(x, 4, 3.6, '#9ad0ff', 'stroke-width="1.4"')).join('') + R(-14, -22, 28, 18, '#f4ead2', 2) + R(2, -40, 12, 18, '#4f8fd9', 1) + R(4, -46, 8, 6, '#e8553d', 1) + `<path d="M-56,46 Q-40,38 -24,46 T8,46 T40,46 T64,46" fill="none" stroke="#4f9be8" stroke-width="4"/>`;
M.galleon = (o) => P('M-48,12 Q-52,-2 -40,-4 H40 Q52,-2 48,12 Q40,38 14,40 H-18 Q-42,36 -48,12Z', '#8a5a3b') + L(-14, -4, -14, -54, 'stroke-width="3"') + L(16, -4, 16, -46, 'stroke-width="3"') + P('M-14,-52 Q-38,-34 -34,-8 H-14Z', '#fbf3df') + P('M-14,-52 Q8,-34 6,-8 H-14Z', '#efe3c6') + P('M16,-44 Q36,-30 34,-8 H16Z', '#fbf3df') + P('M-14,-54 L2,-50 L-14,-46Z', INK) + `<path d="M-58,46 Q-40,38 -24,46 T8,46 T40,46 T64,46" fill="none" stroke="#4f9be8" stroke-width="4"/>`;
M.anchor = (o) => C(0, -34, 8, 'none', 'stroke-width="5"') + L(0, -26, 0, 38, 'stroke-width="6"') + L(-14, -12, 14, -12, 'stroke-width="6"') + P('M-34,16 Q-30,40 0,40 Q30,40 34,16', 'none', 'stroke-width="6"') + P('M-40,22 L-34,12 L-26,22Z M40,22 L34,12 L26,22Z', INK) + L(0, -26, 0, 38, `stroke="#8aa0b8" stroke-width="2.4"`);
M.compass = (o) => C(0, 0, 42, '#d9b27c') + C(0, 0, 33, '#fbf3df') + POLY('0,-28 7,0 -7,0', '#e8553d') + POLY('0,28 7,0 -7,0', '#4f8fd9') + C(0, 0, 3, INK, NS) + [0, 90, 180, 270].map(a => L(f(33 * Math.sin(a * Math.PI / 180)), f(-33 * Math.cos(a * Math.PI / 180)), f(27 * Math.sin(a * Math.PI / 180)), f(-27 * Math.cos(a * Math.PI / 180)), 'stroke-width="2"')).join('') + R(-5, -50, 10, 8, '#d9b27c', 2);
M.map = (o) => P('M-48,-30 L-16,-38 L16,-30 L48,-38 V30 L16,38 L-16,30 L-48,38Z', '#f1dfb4') + L(-16, -38, -16, 30, 'stroke-width="1.4" opacity=".5"') + L(16, -30, 16, 38, 'stroke-width="1.4" opacity=".5"') + P('M-38,16 Q-24,-8 -6,6 T28,-4', 'none', 'stroke="#e8553d" stroke-width="2.2" stroke-dasharray="4 4"') + L(18, -14, 32, 2, 'stroke="#e8553d" stroke-width="4"') + L(32, -14, 18, 2, 'stroke="#e8553d" stroke-width="4"') + E(-30, 22, 8, 5, '#9ad0ff', 'stroke-width="1.2"') + E(0, -12, 6, 8, '#b6dca0', 'stroke-width="1.2"');
M.pin = (o) => P('M0,46 Q-30,8 -30,-14 A30,30 0 1 1 30,-14 Q30,8 0,46Z', col(o, 'c', '#f08a3c')) + C(0, -14, 11, W) + HL('M-22,-26 Q-18,-40 -4,-42 Q-16,-32 -18,-18Z');
M.mountain = (o) => POLY('-52,42 -16,-30 20,42', col(o, 'c', '#7f93ab')) + POLY('-16,-30 -4,-6 -12,-10 -18,-2 -24,-10 -28,-6', W) + POLY('2,42 28,-12 54,42', col(o, 'd', '#6a7f98')) + POLY('28,-12 34,0 28,-4 22,0', W) + SH('M-16,-30 L20,42 H-4Z');
M.dunes = (o) => P('M-60,30 Q-30,-12 0,16 Q30,-8 60,26 V46 H-60Z', '#f0c36d') + P('M-60,40 Q-20,10 20,34 Q40,22 60,36 V46 H-60Z', '#e4ab4c', NS) + P('M-60,30 Q-30,-12 0,16 Q30,-8 60,26 V46 H-60Z', 'none');
M.island = (o) => E(0, 36, 50, 12, '#4f9be8') + P('M-34,34 Q-24,14 0,12 Q24,14 34,34Z', '#f0d28a') + M.palm({ s: 0.9, x: 2, y: 12 });
M.palm = (o) => { const x = (o && o.x) || 0, y = (o && o.y) || 0, s = (o && o.s) || 1; const lf = (a) => `<g transform="rotate(${a})">` + P('M0,0 Q16,-26 46,-10 Q22,-14 0,0Z', '#3fb97a') + `</g>`; return `<g transform="translate(${x},${y}) scale(${s})">` + P('M-5,46 Q-2,10 -6,-8 L5,-8 Q4,12 8,46Z', '#b98a5b') + `<g transform="translate(0,-8)">` + [-150, -110, -70, -30, 10, 50].map(a => lf(a)).join('') + C(0, 0, 5, '#8a5a3b') + `</g></g>`; };
M.tree = (o) => P('M-6,46 L-4,6 H4 L6,46Z', '#8a5a3b') + C(0, -12, 26, col(o, 'c', '#3fb97a')) + C(-18, 4, 16, col(o, 'c', '#3fb97a')) + C(18, 4, 16, col(o, 'c', '#3fb97a')) + HL('M-14,-26 Q-4,-34 8,-30 Q-4,-26 -14,-16Z');
M.leaf = (o) => P('M0,44 Q-40,10 -14,-34 Q4,-46 30,-40 Q42,-4 10,30 Q4,38 0,44Z', col(o, 'c', '#3fb97a')) + P('M0,44 Q6,10 22,-30', 'none', 'stroke-width="2.2"') + HL('M-12,-22 Q0,-34 14,-34 Q0,-26 -8,-8Z');
M.sprout = (o) => P('M0,46 V6', 'none', 'stroke-width="5" stroke="#3a8a5a"') + P('M0,10 Q-30,6 -34,-22 Q-6,-22 0,10Z', '#5fcf8c') + P('M0,0 Q28,-4 32,-32 Q6,-32 0,0Z', '#3fb97a') + E(0, 46, 26, 7, '#8a5a3b');
M.flower = (o) => { let s = L(0, 0, 0, 46, 'stroke-width="4" stroke="#3a8a5a"') + P('M0,28 Q-22,26 -24,10 Q-4,10 0,28Z', '#3fb97a'); for (let i = 0; i < 6; i++) s += E(0, -18, 9, 16, col(o, 'c', '#f28bb0'), `transform="rotate(${i * 60})"`); return s + C(0, 0, 9, '#ffd166'); };
M.sun = (o) => { let s = ''; for (let i = 0; i < 12; i++) s += L(0, -34, 0, -46, `transform="rotate(${i * 30})" stroke-width="3.4"`); return s + C(0, 0, 28, col(o, 'c', '#ffcf3f')) + HL('M-18,-12 Q-12,-22 0,-24 Q-12,-18 -16,-6Z'); };
M.moon = (o) => P('M14,-42 A44,44 0 1 0 14,42 A34,34 0 1 1 14,-42Z', '#ffe58a') + C(-16, -8, 5, '#f3d36a', 'stroke-width="1.4"') + C(-6, 18, 3.5, '#f3d36a', 'stroke-width="1.2"');
M.cloud = (o) => P('M-34,20 Q-50,20 -48,4 Q-46,-8 -32,-8 Q-30,-28 -8,-26 Q4,-40 22,-28 Q42,-28 42,-8 Q56,-6 52,10 Q50,20 36,20Z', col(o, 'c', '#ffffff'));
M.wave = (o) => `<path d="M-60,10 Q-45,-6 -30,10 T0,10 T30,10 T60,10 V46 H-60Z" fill="${col(o, 'c', '#4f9be8')}"/><path d="M-60,26 Q-45,12 -30,26 T0,26 T30,26 T60,26 V46 H-60Z" fill="${col(o, 'd', '#3a7bd5')}" stroke="none"/><path d="M-60,10 Q-45,-6 -30,10 T0,10 T30,10 T60,10" fill="none"/>`;
M.river = (o) => P('M-52,-30 Q-8,-34 -14,-6 Q-20,18 20,20 Q44,22 52,40 L40,46 Q32,34 14,32 Q-34,28 -30,-4 Q-28,-20 -52,-18Z', '#4f9be8') + HL('M-40,-26 Q-18,-26 -22,-6 Q-24,6 -10,14Z') + P('M-60,30 Q-40,26 -30,34 L-60,46Z', '#5fcf8c', NS) + P('M30,-30 Q46,-30 52,-22 V-40 H30Z', '#5fcf8c', NS);
M.fish = (o) => P('M-34,0 Q-14,-26 14,-18 Q30,-12 38,0 Q30,12 14,18 Q-14,26 -34,0Z', col(o, 'c', '#f08a3c')) + P('M34,0 L50,-16 L50,16Z', col(o, 'c', '#f08a3c')) + C(-16, -3, 3.6, W) + C(-15, -3, 1.6, INK, NS) + P('M-4,-14 Q4,0 -4,14', 'none', 'stroke-width="1.6"') + HL('M-26,-6 Q-14,-18 2,-16Z');
M.volcano = (o) => POLY('-50,44 -14,-16 14,-16 50,44', '#8a6a5a') + POLY('-14,-16 -8,-6 0,-12 8,-4 14,-16', '#e8553d') + P('M-6,-20 Q-16,-40 0,-52 Q10,-36 6,-20Z', '#ff8a3d', NS) + P('M-4,-16 Q-8,6 -2,44 L8,44 Q4,10 6,-12Z', '#ff8a3d', NS);
M.snow = (o) => { let s = ''; for (let i = 0; i < 3; i++) s += L(0, -34, 0, 34, `transform="rotate(${i * 60})" stroke-width="3.2"`); return s + C(0, 0, 6, W); };
})(M8P);
(function (X) {
const { INK, NS, W, P, C, E, R, L, POLY, HL, SH, star, ngon, sparkle, M, f } = X;
const col = (o, k, d) => (o && o[k]) || d;
M.saturn = (o) => { const c = col(o, 'c', '#f0a24c'); return `<g transform="rotate(-18)">` + E(0, 0, 54, 12, 'none', 'stroke="#c58a3a" stroke-width="7"') + C(0, 0, 30, c) + P('M-28,-8 Q0,-2 28,-8 M-30,4 Q0,10 30,4', 'none', 'stroke="#d98a2f" stroke-width="3" opacity=".8"') + HL('M-22,-16 Q-14,-26 -2,-28 Q-14,-22 -20,-8Z') + `<path d="M-54,0 Q0,24 54,0" fill="none" stroke="#c58a3a" stroke-width="7"/><path d="M-54,0 Q0,24 54,0" fill="none" stroke="${INK}" stroke-width="1.4"/></g>`; };
M.planet = (o) => C(0, 0, 34, col(o, 'c', '#7aa7e6')) + P('M-30,-14 Q0,-6 30,-16 M-34,6 Q0,14 34,4', 'none', `stroke="${W}" stroke-width="3" opacity=".55"`) + C(-10, 12, 6, 'rgba(0,0,0,.12)', NS) + C(14, -6, 4, 'rgba(0,0,0,.12)', NS) + HL('M-24,-18 Q-16,-28 -2,-30 Q-16,-24 -22,-8Z');
M.rocket = (o) => { const c = col(o, 'c', '#f4f6fa'); return P('M0,-50 Q22,-30 20,10 H-20 Q-22,-30 0,-50Z', c) + P('M-20,0 L-36,24 L-20,20Z', '#e8553d') + P('M20,0 L36,24 L20,20Z', '#e8553d') + C(0, -16, 9, '#7fc4ff') + P('M-20,-14 H20 V-8 H-20Z', '#e8553d', NS) + R(-12, 10, 24, 6, '#8aa0b8', 2) + P('M-10,16 Q0,52 10,16Z', '#ffb347') + P('M-5,16 Q0,38 5,16Z', '#ffe58a', NS) + HL('M-14,-30 Q-8,-42 -2,-46 Q-10,-30 -12,-6Z'); };
M.atom = (o) => [0, 60, 120].map(a => E(0, 0, 48, 17, 'none', `transform="rotate(${a})" stroke="#3a7bd5" stroke-width="3"`)).join('') + [0, 60, 120].map(a => E(0, 0, 48, 17, 'none', `transform="rotate(${a})" stroke-width="1"`)).join('') + C(0, 0, 11, '#e8553d') + C(0, 0, 11, 'none') + C(44, 0, 5, '#ffd166', 'stroke-width="1.4"') + C(-22, 38, 5, '#ffd166', 'stroke-width="1.4"') + C(-22, -38, 5, '#ffd166', 'stroke-width="1.4"');
M.flask = (o) => { const c = col(o, 'c', '#58c27d'); return P('M-9,-44 H9 V-20 L36,34 Q40,44 28,44 H-28 Q-40,44 -36,34 L-9,-20Z', 'rgba(255,255,255,.55)') + P('M-18,8 Q0,2 18,8 L36,34 Q40,44 28,44 H-28 Q-40,44 -36,34Z', c, NS) + P('M-9,-44 H9 V-20 L36,34 Q40,44 28,44 H-28 Q-40,44 -36,34 L-9,-20Z', 'none') + R(-13, -48, 26, 6, '#c9d1da', 2) + C(-6, 22, 4, W, 'stroke-width="1.4"') + C(8, 14, 3, W, 'stroke-width="1.2"') + C(2, 30, 2.4, W, 'stroke-width="1"'); };
M.microscope = (o) => R(-26, 38, 52, 8, '#4a5568', 3) + P('M-10,38 Q-26,34 -22,8 Q-20,-12 0,-16', 'none', 'stroke="#4a5568" stroke-width="10" stroke-linecap="round"') + `<g transform="rotate(-24 0 -6)">` + R(-8, -40, 16, 40, '#3a7bd5', 3) + R(-5, -46, 10, 8, '#2b3340', 2) + R(-4, 0, 8, 12, '#c9d1da', 1) + `</g>` + R(8, 14, 24, 5, '#8aa0b8', 2);
M.dna = (o) => { let s = ''; for (let i = 0; i < 6; i++) { const y = -40 + i * 16; const x = 16 * Math.sin(i * 1.05); s += L(f(-x), y, f(x), y, 'stroke-width="2.4"'); s += C(f(-x), y, 4.5, '#e8553d', 'stroke-width="1.6"') + C(f(x), y, 4.5, '#3a7bd5', 'stroke-width="1.6"'); } return `<path d="M-14,-44 C26,-30 -26,-10 14,4 C54,18 -26,34 -14,48" fill="none" stroke="#e8553d" stroke-width="4"/><path d="M14,-44 C-26,-30 26,-10 -14,4 C-54,18 26,34 14,48" fill="none" stroke="#3a7bd5" stroke-width="4"/>` + s; };
M.heart = (o) => P('M0,40 Q-46,8 -40,-16 Q-34,-38 -14,-34 Q-2,-32 0,-20 Q2,-32 14,-34 Q34,-38 40,-16 Q46,8 0,40Z', col(o, 'c', '#e8553d')) + HL('M-30,-24 Q-22,-32 -12,-28 Q-24,-26 -28,-10Z');
M.pulse = (o) => P('M-54,4 H-26 L-18,-14 L-6,28 L6,-30 L16,10 L22,4 H54', 'none', `stroke="${col(o, 'c', '#e8553d')}" stroke-width="4" stroke-linejoin="round"`);
M.stetho = (o) => P('M-24,-44 V-8 Q-24,18 0,18 Q24,18 24,-8 V-44', 'none', 'stroke="#4a5568" stroke-width="5"') + P('M0,18 V30 Q0,44 18,44 Q34,44 34,28', 'none', 'stroke="#4a5568" stroke-width="5"') + C(34, 26, 9, '#c9d1da') + C(34, 26, 4, '#8aa0b8') + C(-24, -46, 4, '#e8553d', NS) + C(24, -46, 4, '#e8553d', NS);
M.brain = (o) => P('M-34,6 Q-46,-6 -38,-20 Q-36,-36 -18,-36 Q-8,-46 6,-38 Q22,-44 32,-30 Q46,-24 40,-6 Q46,8 32,16 Q28,32 10,28 Q0,38 -12,28 Q-30,30 -34,6Z', '#f4a3b8') + P('M0,-36 Q-6,-20 4,-8 Q-6,6 2,26 M-24,-26 Q-14,-18 -22,-8 M26,-26 Q16,-16 24,-6 M-30,6 Q-16,4 -10,14 M32,10 Q18,8 14,18', 'none', 'stroke-width="2"') + HL('M-26,-28 Q-16,-38 -4,-36 Q-18,-30 -22,-18Z');
M.skull = (o) => P('M-32,-6 Q-34,-44 0,-44 Q34,-44 32,-6 Q32,8 20,12 V28 H-20 V12 Q-32,8 -32,-6Z', '#f6f1e4') + E(-13, -8, 9, 10, INK, NS) + E(13, -8, 9, 10, INK, NS) + P('M0,4 L-4,14 H4Z', INK, NS) + [-12, -4, 4, 12].map(x => L(x, 18, x, 28, 'stroke-width="1.6"')).join('');
M.lung = (o) => P('M-4,-34 V0 Q-4,20 -20,30 Q-40,34 -42,14 Q-42,-14 -26,-30 Q-12,-40 -4,-34Z', '#f4a3b8') + P('M4,-34 V0 Q4,20 20,30 Q40,34 42,14 Q42,-14 26,-30 Q12,-40 4,-34Z', '#f4a3b8') + P('M0,-48 V-8 M0,-8 Q-10,4 -18,2 M0,-8 Q10,4 18,2', 'none', 'stroke="#d9677f" stroke-width="4"');
M.bone = (o) => P('M-30,-10 Q-44,-12 -42,-24 Q-34,-30 -28,-24 Q-24,-34 -14,-30 L30,10 Q34,4 42,8 Q48,18 38,24 Q40,34 28,34 Q22,30 24,22 L-20,-20 Q-26,-6 -30,-10Z', '#f6f1e4');
M.tooth = (o) => P('M-22,-30 Q-4,-40 0,-32 Q4,-40 22,-30 Q34,-14 22,6 Q20,40 10,40 Q4,40 2,18 H-2 Q-4,40 -10,40 Q-20,40 -22,6 Q-34,-14 -22,-30Z', '#fbfbf7') + HL('M-18,-24 Q-26,-12 -20,0 Q-24,-14 -14,-26Z');
M.bulb = (o) => P('M-22,6 Q-36,-30 0,-42 Q36,-30 22,6 Q16,16 14,24 H-14 Q-16,16 -22,6Z', '#ffe58a') + R(-14, 24, 28, 8, '#c9d1da', 2) + R(-11, 32, 22, 6, '#c9d1da', 2) + R(-6, 38, 12, 6, '#8aa0b8', 2) + P('M-8,24 L-8,6 L0,-6 L8,6 L8,24', 'none', 'stroke="#e09a1b" stroke-width="2"') + HL('M-18,-20 Q-12,-34 0,-36 Q-14,-28 -16,-8Z') + [-60, -30, 0, 30, 60].map(a => L(0, -50, 0, -58, `transform="rotate(${a} 0 -8)" stroke-width="2.6"`)).join('');
M.gear = (o) => { let s = ''; for (let i = 0; i < 8; i++) s += R(-6, -44, 12, 18, col(o, 'c', '#8aa0b8'), 2, `transform="rotate(${i * 45})"`); return s + C(0, 0, 33, col(o, 'c', '#8aa0b8')) + C(0, 0, 14, '#e8eef5') + HL('M-26,-12 Q-20,-24 -8,-28 Q-20,-20 -24,-4Z'); };
M.magnifier = (o) => C(-8, -8, 28, 'rgba(180,225,255,.55)', 'stroke-width="2"') + C(-8, -8, 28, 'none', 'stroke="#4a5568" stroke-width="7"') + C(-8, -8, 28, 'none', 'stroke-width="1.4"') + P('M13,13 L40,40', 'none', 'stroke="#8a5a3b" stroke-width="10" stroke-linecap="round"') + HL('M-26,-18 Q-20,-30 -8,-32 Q-22,-26 -24,-10Z');
M.telescope = (o) => P('M-44,10 L28,-26 L34,-14 L-38,22Z', '#3a7bd5') + R(24, -36, 18, 16, '#2b3340', 3, 'transform="rotate(-26 33 -28)"') + P('M-44,10 L-38,22 L-50,28 L-54,16Z', '#8aa0b8') + P('M-6,18 L-14,46 M-6,18 L8,46 M-6,18 V46', 'none', 'stroke="#4a5568" stroke-width="4"');
M.hourglass = (o) => R(-28, -46, 56, 8, '#8a5a3b', 3) + R(-28, 38, 56, 8, '#8a5a3b', 3) + P('M-22,-38 H22 Q22,-10 4,0 Q22,10 22,38 H-22 Q-22,10 -4,0 Q-22,-10 -22,-38Z', 'rgba(255,255,255,.5)') + P('M-14,-30 H14 Q14,-14 3,-4 H-3 Q-14,-14 -14,-30Z', '#f0c36d', NS) + P('M-16,38 Q-12,20 0,16 Q12,20 16,38Z', '#f0c36d', NS) + L(0, 0, 0, 16, 'stroke="#d9a447" stroke-width="2"');
M.clock = (o) => C(0, 0, 40, W, 'stroke-width="3"') + C(0, 0, 40, 'none', 'stroke="#e8553d" stroke-width="5"') + [...Array(12)].map((_, i) => L(0, -33, 0, i % 3 ? -30 : -27, `transform="rotate(${i * 30})" stroke-width="2"`)).join('') + L(0, 0, 0, -26, 'stroke-width="3.4"') + L(0, 0, 18, 8, 'stroke-width="3.4"') + C(0, 0, 3, INK, NS) + C(-28, -40, 7, '#e8553d') + C(28, -40, 7, '#e8553d');
M.scale = (o) => L(0, -40, 0, 38, 'stroke-width="5"') + R(-20, 38, 40, 8, '#8a5a3b', 3) + L(-40, -28, 40, -28, 'stroke-width="5"') + C(0, -42, 5, '#f6b93b') + L(-40, -28, -48, 2, 'stroke-width="1.6"') + L(-40, -28, -32, 2, 'stroke-width="1.6"') + P('M-52,2 H-28 Q-30,14 -40,14 Q-50,14 -52,2Z', '#f6b93b') + L(40, -28, 32, 2, 'stroke-width="1.6"') + L(40, -28, 48, 2, 'stroke-width="1.6"') + P('M28,2 H52 Q50,14 40,14 Q30,14 28,2Z', '#f6b93b');
M.chart = (o) => R(-46, -40, 92, 80, W, 5) + [[-34, 10, '#4f9be8'], [-16, -6, '#3fb97a'], [2, 14, '#f6b93b'], [20, -18, '#e8553d']].map(([x, h, c]) => R(x, h + 18 - 10, 12, 30 - h + 4, c, 2, 'stroke-width="1.6"')).join('') + P('M-38,-10 L-16,-22 L6,-8 L30,-30', 'none', 'stroke="#2b3340" stroke-width="2.4"') + star(30, -30, 6, '#ffd166', 'stroke-width="1.2"');
M.coin = (o) => C(0, 0, 34, '#f6b93b') + C(0, 0, 26, 'none', 'stroke-width="2"') + star(0, 0, 15, '#fde8a0', 'stroke-width="1.6"') + HL('M-26,-12 Q-20,-26 -6,-30 Q-20,-20 -24,-4Z');
M.coins = (o) => E(-14, 30, 26, 8, '#e09a1b') + E(-14, 24, 26, 8, '#f6b93b') + E(-14, 18, 26, 8, '#e09a1b') + E(-14, 12, 26, 8, '#f6b93b') + E(22, 36, 22, 7, '#e09a1b') + E(22, 30, 22, 7, '#f6b93b') + E(8, -16, 22, 22, '#f6b93b', 'transform="rotate(-14 8 -16)"') + E(8, -16, 16, 16, 'none', 'transform="rotate(-14 8 -16)" stroke-width="1.6"');
M.banknote = (o) => R(-46, -24, 92, 48, col(o, 'c', '#8fd0a0'), 5) + R(-38, -16, 76, 32, 'none', 3, 'stroke-width="1.6"') + C(0, 0, 14, col(o, 'd', '#bfe6c8')) + C(0, 0, 14, 'none') + C(-30, -8, 4, '#bfe6c8', 'stroke-width="1.2"') + C(30, 8, 4, '#bfe6c8', 'stroke-width="1.2"') + L(-6, 0, 6, 0, 'stroke-width="2"');
M.gold = (o) => P('M-46,30 L-36,6 H20 L30,30Z', '#f6b93b') + P('M-18,6 L-8,-18 H44 L54,6Z', '#fbd264') + P('M-46,30 L-36,6 H20 L30,30Z', 'none') + L(-30, 12, -24, 12, 'stroke="#fff" stroke-width="2.4" opacity=".7"') + L(-2, -12, 6, -12, 'stroke="#fff" stroke-width="2.4" opacity=".7"') + R(-52, 30, 88, 10, '#e09a1b', 2);
M.puzzle = (o) => { const c = col(o, 'c', '#7e57c2'); return P('M-36,-36 H-8 Q-8,-50 6,-50 Q20,-50 20,-36 H36 V-10 Q50,-10 50,4 Q50,18 36,18 V36 H8 Q8,50 -6,50 Q-20,50 -20,36 H-36 V10 Q-50,10 -50,-4 Q-50,-18 -36,-18Z', c, 'transform="scale(.85)"') + HL('M-26,-26 H-12 Q-12,-38 -4,-40 Q-20,-34 -26,-26Z'); };
M.dice = (o) => R(-30, -30, 60, 60, W, 12, 'transform="rotate(-12)"') + `<g transform="rotate(-12)">` + [[-14, -14], [14, -14], [0, 0], [-14, 14], [14, 14]].map(([x, y]) => C(x, y, 5, INK, NS)).join('') + `</g>`;
M.qmark = (o) => C(0, 0, 40, col(o, 'c', '#ffcf3f')) + P('M-12,-12 Q-12,-26 0,-26 Q12,-26 12,-14 Q12,-6 2,-2 Q-2,2 -2,8', 'none', `stroke="${INK}" stroke-width="7"`) + C(-2, 22, 4.4, INK, NS) + HL('M-30,-14 Q-24,-30 -8,-34 Q-24,-24 -28,-6Z');
M.speech = (o) => P('M-42,-28 Q-42,-42 -28,-42 H28 Q42,-42 42,-28 V6 Q42,20 28,20 H0 L-18,40 L-16,20 H-28 Q-42,20 -42,6Z', col(o, 'c', W)) + [-16, -4, 8].map((y, i) => L(-26, y, i === 2 ? 6 : 26, y, 'stroke-width="3.2" stroke-linecap="round"')).join('');
M.lock = (o) => P('M-18,-8 V-22 Q-18,-44 0,-44 Q18,-44 18,-22 V-8', 'none', 'stroke="#8aa0b8" stroke-width="8"') + P('M-18,-8 V-22 Q-18,-44 0,-44 Q18,-44 18,-22 V-8', 'none', 'stroke-width="1.4"') + R(-30, -8, 60, 50, '#f6b93b', 8) + C(0, 12, 6, INK, NS) + R(-2, 14, 4, 14, INK, 2, NS);
M.key = (o) => C(-26, 0, 18, '#f6b93b') + C(-26, 0, 7, W) + R(-10, -5, 52, 10, '#f6b93b', 3) + R(26, 5, 8, 12, '#f6b93b', 1) + R(14, 5, 8, 9, '#f6b93b', 1);
M.bars = (o) => [-34, -16, 2, 20].map(x => L(x, -36, x, 36, 'stroke="#4a5568" stroke-width="8"')).join('') + R(-46, -44, 92, 10, '#6b7686', 3) + R(-46, 34, 92, 10, '#6b7686', 3);
M.chain = (o) => [...Array(4)].map((_, i) => `<g transform="translate(${-30 + i * 20},${(i % 2) * 6 - 3})">` + R(-14, -9, 28, 18, 'none', 9, 'stroke="#8aa0b8" stroke-width="7"') + R(-14, -9, 28, 18, 'none', 9, 'stroke-width="1.2"') + `</g>`).join('');
M.hat = (o) => P('M-18,10 Q-18,-34 0,-34 Q18,-34 18,10Z', col(o, 'c', '#2b3340')) + E(0, 12, 42, 9, col(o, 'c', '#2b3340')) + P('M-18,0 H18 V10 H-18Z', col(o, 'd', '#e8553d'), NS);
M.wizardhat = (o) => P('M-38,28 Q0,40 38,28 Q16,22 12,-8 Q6,-32 -2,-46 Q-6,-20 -20,6 Q-30,20 -38,28Z', col(o, 'c', '#5b4bb5')) + P('M-38,28 Q0,40 38,28 Q30,22 22,22 Q0,28 -22,22 Q-32,22 -38,28Z', col(o, 'd', '#f6b93b')) + star(0, 2, 8, '#ffe58a', 'stroke-width="1.2"') + star(-10, -16, 4, '#ffe58a', NS);
M.wand = (o) => P('M-40,40 L30,-30', 'none', 'stroke="#6b4a2e" stroke-width="7" stroke-linecap="round"') + P('M-40,40 L30,-30', 'none', 'stroke="#2b3340" stroke-width="1.4"') + sparkle(38, -38, 12, '#ffe58a') + sparkle(20, -44, 6, '#ffe58a') + sparkle(46, -20, 6, '#ffe58a');
M.ring = (o) => E(0, 14, 28, 26, 'none', 'stroke="#f6b93b" stroke-width="12"') + E(0, 14, 28, 26, 'none', 'stroke-width="1.4" transform="scale(1.1 1.1) translate(0,-1.3)"') + P('M-12,-18 L0,-34 L12,-18 L0,-8Z', '#7fd1ff') + HL('M-8,-18 L-2,-28 L0,-18Z');
M.sword = (o) => P('M-6,-48 L6,-48 L8,18 H-8Z', '#d9e0ea') + L(0, -44, 0, 14, 'stroke="#aab6c6" stroke-width="2"') + R(-24, 18, 48, 8, '#f6b93b', 3) + R(-5, 26, 10, 22, '#8a5a3b', 3) + C(0, 52, 6, '#f6b93b');
M.axe = (o) => R(-4, -40, 8, 86, '#8a5a3b', 3) + P('M4,-36 Q36,-40 40,-12 Q36,16 4,12Z', '#c9d1da') + HL('M10,-30 Q26,-30 30,-14 Q18,-24 10,-20Z');
M.shield = (o) => P('M-34,-36 H34 V0 Q34,32 0,46 Q-34,32 -34,0Z', col(o, 'c', '#4f8fd9')) + P('M-34,-36 H34 V-20 H-34Z', col(o, 'd', '#ffffff'), NS) + P('M-26,-30 H26 V0 Q26,24 0,36 Q-26,24 -26,0Z', 'none', 'stroke-width="1.4"') + star(0, 0, 14, col(o, 'd', '#ffffff'), 'stroke-width="1.4"') + HL('M-28,-26 V0 Q-28,20 -16,32 Q-22,10 -22,-26Z');
M.crest = (o) => P('M-32,-38 H32 V2 Q32,30 0,46 Q-32,30 -32,2Z', col(o, 'c', '#2f7de1')) + P('M0,-38 V46', 'none', `stroke="${col(o, 'd', '#fff')}" stroke-width="5"`) + P('M-32,-6 H32', 'none', `stroke="${col(o, 'd', '#fff')}" stroke-width="5"`) + P('M-32,-38 H32 V2 Q32,30 0,46 Q-32,30 -32,2Z', 'none') + star(0, -22, 8, '#ffd166', 'stroke-width="1.2"');
M.skullflag = (o) => L(-34, 46, -34, -46, 'stroke-width="4"') + P('M-32,-44 Q-6,-34 18,-44 Q40,-50 46,-40 V6 Q22,0 0,10 Q-18,16 -32,6Z', '#2b3340') + C(2, -22, 9, W, 'stroke="none"') + R(-2, -16, 8, 5, W, 1, NS) + L(-12, -4, 16, 4, `stroke="${W}" stroke-width="3"`) + L(-12, 4, 16, -4, `stroke="${W}" stroke-width="3"`) + C(0, -22, 1.8, '#2b3340', NS) + C(5, -22, 1.8, '#2b3340', NS);
M.chest = (o) => R(-40, -2, 80, 44, '#8a5a3b', 4) + P('M-40,-2 Q-40,-34 0,-34 Q40,-34 40,-2Z', '#a36c43') + R(-40, 10, 80, 7, '#f6b93b', 0) + R(-8, 4, 16, 18, '#f6b93b', 3) + C(0, 13, 3, INK, NS) + C(-22, -28, 0.1, '#fff', NS) + sparkle(-30, -30, 8, '#ffe58a') + sparkle(34, -20, 6, '#ffe58a');
M.scroll = (o) => P('M-34,-36 H30 Q42,-36 42,-24 V36 Q42,46 30,46 H-24 Q-34,46 -34,36Z', '#f6e7bf') + P('M-34,-36 Q-46,-36 -46,-24 Q-46,-12 -34,-12', 'none') + [-18, -8, 2, 12, 22, 32].map((y, i) => L(-22, y, i % 2 ? 24 : 28, y, 'stroke-width="2.2" opacity=".55" stroke-linecap="round"')).join('') + R(-40, -42, 8, 12, '#d9b27c', 3, 'transform="rotate(0)"') + R(36, 40, 8, 10, '#d9b27c', 3);
M.book = (o) => { const c = col(o, 'c', '#4f8fd9'); return P('M-44,-30 Q-22,-38 0,-26 Q22,-38 44,-30 V30 Q22,22 0,34 Q-22,22 -44,30Z', '#fffaf0') + P('M0,-26 V34', 'none') + [-12, -2, 8, 18].map(y => L(-36, y - 14, -8, y - 8, 'stroke-width="1.4" opacity=".4"') + L(8, y - 8, 36, y - 14, 'stroke-width="1.4" opacity=".4"')).join('') + P('M-44,30 Q-22,22 0,34 Q22,22 44,30 V38 Q22,30 0,42 Q-22,30 -44,38Z', c); };
M.bookclosed = (o) => R(-30, -42, 60, 84, col(o, 'c', '#3a7bd5'), 4) + R(-30, -42, 10, 84, '#2a5fa8', 3) + R(-12, -26, 34, 22, '#fff', 2, 'stroke-width="1.4"') + L(-6, -18, 16, -18, 'stroke-width="1.8"') + L(-6, -11, 10, -11, 'stroke-width="1.8"') + R(-30, 34, 60, 8, '#fffaf0', 1);
M.quill = (o) => P('M40,-44 Q8,-40 -14,0 L-30,38 L-8,22 Q20,6 40,-44Z', '#f6f1e4') + P('M-30,38 L8,-14', 'none', 'stroke-width="2"') + P('M-30,38 L-40,48', 'none', 'stroke="#2b3340" stroke-width="3"') + P('M30,-30 Q14,-22 4,-8 M26,-18 Q12,-10 2,6', 'none', 'stroke-width="1.2" opacity=".5"');
M.inkwell = (o) => P('M-26,44 H26 Q30,16 20,6 H-20 Q-30,16 -26,44Z', '#2b3340') + R(-12, -6, 24, 12, '#c9d1da', 2) + C(0, 22, 7, '#fff', 'stroke="none" fill-opacity=".25"');
M.pen = (o) => P('M-40,40 L-34,22 L26,-38 L40,-24 L-20,36Z', col(o, 'c', '#f6b93b')) + P('M-40,40 L-34,22 L-20,36Z', '#f1d9a8') + P('M26,-38 L34,-46 L48,-32 L40,-24Z', '#e8553d') + L(-22, 20, 22, -24, 'stroke-width="1.4" opacity=".5"');
M.pencil = M.pen;
M.abc = (o) => R(-40, -34, 80, 68, '#2f6f4f', 4, 'stroke-width="3"') + R(-40, -34, 80, 68, 'none', 4, 'stroke="#d9b27c" stroke-width="5"') + P('M-26,-4 L-16,-20 L-6,-4 M-22,-10 H-10', 'none', `stroke="${W}" stroke-width="3"`) + P('M6,-18 V-2 M6,-18 H14 Q20,-18 20,-12 Q20,-8 14,-8 H6 M6,-8 H16 Q22,-8 22,-2 Q22,4 16,4 H6', 'none', `stroke="${W}" stroke-width="2.6" transform="translate(-2,2)"`) + R(-20, 22, 40, 5, '#c9d1da', 2, NS);
M.mask = (o) => P('M-36,-30 Q0,-42 36,-30 Q38,12 18,30 Q0,40 -18,30 Q-38,12 -36,-30Z', col(o, 'c', '#ffcf3f')) + E(-14, -6, 8, 5, INK, NS) + E(14, -6, 8, 5, INK, NS) + P('M-14,12 Q0,26 14,12', 'none', 'stroke-width="3"') + HL('M-28,-24 Q-14,-34 0,-34 Q-20,-30 -28,-12Z');
M.maskpair = (o) => `<g transform="translate(-16,-4) rotate(-10)">` + M.mask({ c: '#ffcf3f' }) + `</g><g transform="translate(22,6) rotate(10) scale(.9)">` + P('M-36,-30 Q0,-42 36,-30 Q38,12 18,30 Q0,40 -18,30 Q-38,12 -36,-30Z', '#8fa6f0') + E(-14, -8, 8, 5, INK, NS) + E(14, -8, 8, 5, INK, NS) + P('M-14,22 Q0,10 14,22', 'none', 'stroke-width="3"') + `</g>`;
M.controller = (o) => { const c = col(o, 'c', '#4f5d75'); return P('M-30,-18 H30 Q50,-18 54,8 L58,30 Q60,42 48,42 Q38,42 34,32 L30,24 H-30 L-34,32 Q-38,42 -48,42 Q-60,42 -58,30 L-54,8 Q-50,-18 -30,-18Z', c) + L(-30, 0, -14, 0, `stroke="${W}" stroke-width="4"`) + L(-22, -8, -22, 8, `stroke="${W}" stroke-width="4"`) + C(24, -4, 4, '#e8553d', 'stroke-width="1.4"') + C(36, 4, 4, '#4f9be8', 'stroke-width="1.4"') + C(24, 10, 4, '#3fb97a', 'stroke-width="1.4"') + C(12, 4, 4, '#ffd166', 'stroke-width="1.4"') + R(-4, 8, 8, 4, W, 2, NS) + HL('M-30,-14 H12 Q-12,-10 -34,-6Z'); };
M.joystick = (o) => R(-34, 22, 68, 22, '#4a5568', 6) + R(-5, -16, 10, 40, '#8aa0b8', 3) + C(0, -22, 16, '#e8553d') + C(24, 30, 4, '#ffd166', 'stroke-width="1.4"') + C(-24, 30, 4, '#4f9be8', 'stroke-width="1.4"') + HL('M-9,-30 Q-4,-38 4,-36 Q-6,-34 -9,-24Z');
M.laptop = (o) => R(-38, -36, 76, 50, '#2b3340', 5) + R(-33, -31, 66, 40, col(o, 'c', '#7fc4ff'), 2) + P('M-46,18 H46 L40,32 H-40Z', '#c9d1da') + R(-10, 20, 20, 4, '#8aa0b8', 2, NS) + P('M-24,-14 L-14,-6 L-24,2 M-6,4 H8', 'none', `stroke="${W}" stroke-width="3" stroke-linecap="round"`);
M.phone = (o) => R(-24, -46, 48, 92, '#2b3340', 9) + R(-19, -38, 38, 74, col(o, 'c', '#bfe0ff'), 3) + [[-12, -26, '#e8553d'], [4, -26, '#3fb97a'], [-12, -10, '#f6b93b'], [4, -10, '#8b6fd6'], [-12, 6, '#3a7bd5'], [4, 6, '#f28bb0']].map(([x, y, c]) => R(x, y, 12, 12, c, 3, 'stroke-width="1.2"')).join('') + R(-6, 40, 12, 3, '#6b7686', 1.5, NS);
M.chip = (o) => { let s = ''; for (let i = 0; i < 5; i++) { const p = -24 + i * 12; s += L(p, -46, p, -34, 'stroke="#8aa0b8" stroke-width="4"') + L(p, 34, p, 46, 'stroke="#8aa0b8" stroke-width="4"') + L(-46, p, -34, p, 'stroke="#8aa0b8" stroke-width="4"') + L(34, p, 46, p, 'stroke="#8aa0b8" stroke-width="4"'); } return s + R(-34, -34, 68, 68, '#2f6f4f', 8) + R(-18, -18, 36, 36, '#2b3340', 5) + R(-10, -10, 20, 20, 'none', 2, `stroke="#7fd1b5" stroke-width="2"`) + C(-26, -26, 3, '#ffd166', NS); };
M.robot = (o) => L(0, -46, 0, -32, 'stroke-width="3"') + C(0, -50, 5, '#e8553d') + R(-34, -32, 68, 56, '#c9d1da', 14) + R(-26, -22, 52, 30, '#2b3340', 10) + R(-18, -12, 12, 8, '#7fd1ff', 3, NS) + R(6, -12, 12, 8, '#7fd1ff', 3, NS) + R(-42, -14, 8, 22, '#8aa0b8', 3) + R(34, -14, 8, 22, '#8aa0b8', 3) + L(-12, 16, 12, 16, 'stroke-width="3" stroke-linecap="round"') + R(-14, 24, 28, 10, '#8aa0b8', 3) + HL('M-28,-26 Q-20,-30 -8,-30 Q-24,-26 -28,-10Z');
M.headphones = (o) => P('M-34,12 Q-38,-40 0,-40 Q38,-40 34,12', 'none', 'stroke="#2b3340" stroke-width="8"') + P('M-34,12 Q-38,-40 0,-40 Q38,-40 34,12', 'none', 'stroke-width="1.2"') + R(-46, 0, 20, 34, col(o, 'c', '#e8553d'), 8) + R(26, 0, 20, 34, col(o, 'c', '#e8553d'), 8) + R(-42, 6, 6, 22, 'none', 3, `stroke="${W}" stroke-width="2" opacity=".6"`);
M.mic = (o) => R(-12, -44, 24, 46, '#c9d1da', 12) + P('M-12,-26 H12 M-12,-14 H12 M-12,-2 H12', 'none', 'stroke="#8aa0b8" stroke-width="1.6"') + P('M-24,-6 Q-24,22 0,22 Q24,22 24,-6', 'none', 'stroke="#4a5568" stroke-width="5"') + L(0, 22, 0, 40, 'stroke="#4a5568" stroke-width="5"') + R(-14, 40, 28, 7, '#4a5568', 3) + HL('M-8,-36 Q-6,-42 -2,-42 Q-6,-30 -6,-10Z');
M.micold = (o) => P('M-16,-46 H16 Q22,-46 22,-38 V-6 Q22,2 16,2 H-16 Q-22,2 -22,-6 V-38 Q-22,-46 -16,-46Z', '#8aa0b8') + [-36, -28, -20, -12, -4].map(y => L(-22, y, 22, y, 'stroke-width="1.4" opacity=".55"')).join('') + R(-6, 2, 12, 14, '#4a5568', 2) + P('M-20,24 Q0,12 20,24', 'none', 'stroke-width="4"') + L(0, 16, 0, 40, 'stroke-width="5"') + R(-18, 40, 36, 6, '#4a5568', 3);
M.camera = (o) => R(-44, -22, 88, 56, '#4a5568', 10) + R(-26, -34, 28, 14, '#4a5568', 4) + C(0, 6, 22, '#2b3340') + C(0, 6, 15, '#7fc4ff') + C(0, 6, 7, '#2b3340') + C(-5, 1, 3, W, NS) + R(26, -14, 12, 8, '#ffe58a', 2) + HL('M-40,-14 H-30 V-8 H-40Z');
M.clap = (o) => R(-42, -8, 84, 50, '#2b3340', 4) + P('M-42,-8 L-36,-26 L42,-34 L42,-16Z', '#2b3340') + [-30, -10, 10, 30].map(x => P(`M${x - 8},-22 L${x + 2},-24 L${x - 2},-12 L${x - 12},-10Z`, W, NS)).join('') + L(-34, 8, 34, 8, 'stroke="#fff" stroke-width="2" opacity=".6"') + L(-34, 22, 22, 22, 'stroke="#fff" stroke-width="2" opacity=".6"');
M.popcorn = (o) => [-22, -8, 8, 22, 0].map((x, i) => C(x, -28 + (i % 2) * 6 - (i === 4 ? 10 : 0), 13, '#fff6dc')).join('') + P('M-30,-10 H30 L22,46 H-22Z', '#e8553d') + [-18, -6, 6, 18].map(x => P(`M${x - 4},-10 L${x - 2},46 H${x + 2} L${x + 4},-10Z`, W, NS)).join('') + P('M-30,-10 H30 L22,46 H-22Z', 'none');
M.tv = (o) => L(-12, -40, 0, -26, 'stroke-width="2.6"') + L(12, -40, 0, -26, 'stroke-width="2.6"') + R(-44, -26, 88, 62, '#d9b27c', 10) + R(-36, -18, 56, 46, col(o, 'c', '#9fd4ff'), 8) + C(32, -6, 6, '#8a5a3b') + C(32, 12, 6, '#8a5a3b') + L(-26, 36, -26, 46, 'stroke-width="4"') + L(26, 36, 26, 46, 'stroke-width="4"') + HL('M-32,-14 H-14 Q-26,-12 -32,-4Z');
M.radio = (o) => R(-44, -22, 88, 56, '#8a5a3b', 8) + R(-36, -14, 44, 40, '#e8d7a8', 4) + [-8, 2, 12, 22].map(y => L(-32, y - 4, 4, y - 4, 'stroke-width="1.4" opacity=".5"')).join('') + C(24, -4, 9, '#f1d9a8') + C(24, 20, 9, '#f1d9a8') + L(24, -4, 28, -8, 'stroke-width="1.6"') + L(-30, -22, -4, -44, 'stroke-width="2.4"');
M.cassette = (o) => R(-44, -28, 88, 56, '#4a5568', 6) + R(-34, -20, 68, 22, '#f1d9a8', 3) + C(-18, -9, 7, W) + C(18, -9, 7, W) + C(-18, -9, 2.4, INK, NS) + C(18, -9, 2.4, INK, NS) + P('M-24,12 H24 L30,28 H-30Z', '#2b3340') + C(-16, 20, 3, '#c9d1da', NS) + C(16, 20, 3, '#c9d1da', NS);
M.notes = (o) => P('M-18,32 V-30 L26,-40 V22', 'none', 'stroke="#2b3340" stroke-width="5"') + P('M-18,-30 L26,-40 V-24 L-18,-14Z', '#2b3340') + E(-26, 32, 12, 9, col(o, 'c', '#8b6fd6'), 'transform="rotate(-20 -26 32)"') + E(18, 22, 12, 9, col(o, 'c', '#8b6fd6'), 'transform="rotate(-20 18 22)"');
M.oud = (o) => P('M-10,44 Q-34,40 -34,16 Q-34,0 -16,-4 L-4,-8 L-4,-14 Q-6,-30 10,-30 L10,-4 L20,0 Q34,6 34,24 Q34,44 10,44Z', '#c98a4a', 'transform="rotate(-40) translate(0,6)"') + `<g transform="rotate(-40) translate(0,6)">` + C(2, 16, 9, '#5a3a22') + R(1, -62, 8, 58, '#6b4a2e', 2) + R(-4, -70, 18, 12, '#8a5a3b', 3) + [-2, 3].map(x => L(x + 1, -58, x + 1, 38, 'stroke="#fff" stroke-width="1" opacity=".7"')).join('') + `</g>`;
M.drum = (o) => E(0, -22, 36, 11, '#f1d9a8') + P('M-36,-22 V26 Q-36,40 0,40 Q36,40 36,26 V-22 Q36,-10 0,-10 Q-36,-10 -36,-22Z', col(o, 'c', '#c0583d')) + [-24, -8, 8, 24].map(x => L(x, -10, x + 4, 40, 'stroke-width="1.6" opacity=".5"')).join('') + P('M-30,-6 L-16,28 L0,-6 L16,28 L30,-6', 'none', `stroke="${W}" stroke-width="2.4" opacity=".7"`) + L(30, -52, 4, -24, 'stroke="#8a5a3b" stroke-width="5" stroke-linecap="round"');
M.film = (o) => R(-44, -22, 88, 44, '#2b3340', 3) + [-36, -22, -8, 6, 20, 32].map(x => R(x, -17, 8, 7, W, 1, NS) + R(x, 10, 8, 7, W, 1, NS)).join('') + R(-36, -6, 24, 12, '#7fc4ff', 1, NS) + R(-8, -6, 24, 12, '#ffd166', 1, NS) + R(20, -6, 20, 12, '#f28bb0', 1, NS);
M.eye = (o) => P('M-46,0 Q0,-44 46,0 Q0,44 -46,0Z', W) + C(0, 0, 18, col(o, 'c', '#4f9be8')) + C(0, 0, 8, INK, NS) + C(-6, -6, 3.4, W, NS);
M.bike = (o) => C(-30, 16, 20, 'none', 'stroke="#2b3340" stroke-width="5"') + C(30, 16, 20, 'none', 'stroke="#2b3340" stroke-width="5"') + C(-30, 16, 20, 'none', 'stroke-width="1"') + P('M-30,16 L-8,-8 H20 L30,16 M-8,-8 L2,16 H-30 M20,-8 L16,-22 M10,-22 H24 M-10,-14 H0', 'none', `stroke="${col(o, 'c', '#e8553d')}" stroke-width="4.5" stroke-linejoin="round"`) + C(2, 16, 4, '#8aa0b8');
M.lights = (o) => P('M-52,-20 Q-26,10 0,-10 Q26,10 52,-20', 'none', 'stroke="#4a5568" stroke-width="2"') + [[-40, -4, '#e8553d'], [-22, 4, '#ffd166'], [-4, -2, '#3fb97a'], [14, 4, '#4f9be8'], [32, -4, '#f28bb0']].map(([x, y, c]) => P(`M${x},${y} l0,6`, 'none', 'stroke-width="2"') + E(x, y + 12, 6, 9, c, 'stroke-width="1.6"')).join('');
M.flash = (o) => P('M-14,-42 L24,-42 L6,-8 H28 L-16,46 L-4,6 H-26Z', '#ffd166');
M.clover = (o) => [[0, -16], [16, 0], [0, 16], [-16, 0]].map(([x, y]) => C(x, y, 14, '#3fb97a')).join('') + L(0, 16, 6, 46, 'stroke-width="4"');
M.cube = (o) => { const t = col(o, 'c', '#58c27d'), s = col(o, 'd', '#9a6b45'); return P('M0,-44 L40,-24 L0,-4 L-40,-24Z', t) + P('M-40,-24 L0,-4 V42 L-40,22Z', s) + P('M40,-24 L0,-4 V42 L40,22Z', '#7a5333') + P('M-40,-24 L0,-4 L40,-24 L40,-14 L0,6 L-40,-14Z', t, NS) + [[-20, -22], [8, -30], [20, -18], [-4, -14]].map(([x, y]) => R(x - 3, y - 2, 6, 4, '#3aa064', 0, NS)).join('') + [[-26, 20], [-14, 8], [-8, 28]].map(([x, y]) => R(x - 3, y, 6, 6, 'rgba(0,0,0,.2)', 0, NS)).join(''); };
M.pickaxe = (o) => R(-4, -30, 8, 78, '#8a5a3b', 3) + P('M-44,-22 Q0,-52 44,-22 L38,-16 Q0,-38 -38,-16Z', '#aab6c6') + HL('M-34,-22 Q-10,-38 10,-38 Q-12,-32 -30,-18Z');
M.parachute = (o) => P('M-46,-4 Q-46,-46 0,-46 Q46,-46 46,-4 Q36,-10 23,-4 Q10,-10 0,-4 Q-10,-10 -23,-4 Q-36,-10 -46,-4Z', col(o, 'c', '#e8553d')) + P('M-23,-4 Q-24,-30 0,-44 M23,-4 Q24,-30 0,-44', 'none', 'stroke-width="1.6" opacity=".6"') + L(-44, -2, -6, 38, 'stroke-width="1.4"') + L(44, -2, 6, 38, 'stroke-width="1.4"') + L(0, -4, 0, 38, 'stroke-width="1.4"') + R(-10, 38, 20, 10, '#6b7686', 3);
M.hashtag = (o) => R(-38, -34, 76, 68, col(o, 'c', '#8b6fd6'), 16) + P('M-8,-22 L-14,22 M10,-22 L4,22 M-22,-8 H20 M-24,8 H18', 'none', `stroke="${W}" stroke-width="5" stroke-linecap="round"`);
M.play = (o) => R(-44, -30, 88, 60, col(o, 'c', '#e8553d'), 16) + POLY('-10,-16 -10,16 18,0', W, 'stroke-width="2"');
M.bubbleapp = (o) => `<g transform="translate(-18,-10)">` + M.speech({ c: '#fff' }) + `</g>` + C(30, 26, 14, '#e8553d') + P('M24,26 H36 M30,20 V32', 'none', `stroke="${W}" stroke-width="3"`);
M.like = (o) => P('M-34,-4 H-18 V40 H-34Z', '#4f8fd9') + P('M-14,-4 L2,-34 Q10,-40 14,-30 L10,-10 H34 Q44,-8 40,4 L36,34 Q34,42 26,42 H-14Z', col(o, 'c', '#7fc4ff'));
M.wifi = (o) => P('M-40,-8 Q0,-46 40,-8', 'none', 'stroke="#4f9be8" stroke-width="7" stroke-linecap="round"') + P('M-26,6 Q0,-16 26,6', 'none', 'stroke="#4f9be8" stroke-width="7" stroke-linecap="round"') + P('M-12,20 Q0,10 12,20', 'none', 'stroke="#4f9be8" stroke-width="7" stroke-linecap="round"') + C(0, 34, 6, '#4f9be8');
M.burger = (o) => P('M-38,-6 Q-38,-40 0,-40 Q38,-40 38,-6Z', '#e6a14f') + [-16, -2, 12, 24].map((x, i) => E(x, -26 + (i % 2) * 6, 3, 1.6, '#fff6dc', NS)).join('') + P('M-40,-4 Q-24,4 -10,-4 Q4,4 18,-4 Q30,4 40,-4 V2 H-40Z', '#58c27d') + P('M-38,2 H38 L28,16 L18,6 L8,16 L-2,6 L-12,16 L-22,6 L-32,16Z', '#ffc93c') + R(-38, 14, 76, 12, '#7a4a2a', 5) + R(-38, 28, 76, 6, '#58c27d', 3) + P('M-38,36 H38 Q36,46 24,46 H-24 Q-36,46 -38,36Z', '#e6a14f');
M.pizza = (o) => P('M-40,-30 Q0,-46 40,-30 L0,46Z', '#f1c15a') + P('M-40,-30 Q0,-46 40,-30 L36,-22 Q0,-36 -36,-22Z', '#d9964a') + C(-10, -12, 7, '#d9453d') + C(14, -10, 7, '#d9453d') + C(2, 12, 7, '#d9453d') + C(-4, 30, 3, '#58c27d', NS) + C(10, 6, 3, '#58c27d', NS);
M.sushi = (o) => E(0, 8, 32, 14, '#f2f2ec') + E(0, 0, 32, 14, '#fbfbf7') + E(0, -2, 22, 9, '#f08a6c') + P('M-22,-2 Q0,-12 22,-2', 'none', 'stroke-width="1.4"') + R(-34, 2, 68, 12, '#2b3340', 6) + E(0, -2, 32, 14, 'none', 'stroke="#2b3340" stroke-width="0"');
M.dallah = (o) => P('M-26,44 Q-34,14 -16,-4 Q-6,-12 -4,-20 H14 Q16,-12 26,-4 Q40,14 32,44Z', '#e0a63a') + R(-8, -28, 20, 10, '#e0a63a', 3) + P('M-4,-28 Q2,-42 8,-28Z', '#e0a63a') + P('M-24,10 Q-48,4 -44,-14 Q-34,-6 -22,-2', '#e0a63a') + P('M30,12 Q54,-6 50,-26 Q44,-30 40,-24 Q42,-12 26,2', '#e0a63a') + P('M-12,12 Q4,6 20,12 M-14,26 Q4,20 22,26', 'none', 'stroke="#fff" stroke-width="2" opacity=".6"') + C(2, -34, 4, '#8a5a3b') + HL('M-18,24 Q-24,6 -10,-2 Q-14,14 -12,30Z');
M.finjan = (o) => P('M-26,-10 H22 Q22,26 -2,26 Q-26,26 -26,-10Z', W) + P('M22,-4 Q38,-4 34,8 Q30,16 20,14', 'none', 'stroke-width="4"') + P('M-26,-10 H22', 'none', 'stroke="#e0a63a" stroke-width="5"') + E(-2, 36, 26, 5, '#e8d7a8') + P('M-8,-24 Q-14,-34 -6,-42 M6,-24 Q0,-34 8,-42', 'none', 'stroke="#b9c3d0" stroke-width="3" stroke-linecap="round"');
M.cup = (o) => P('M-24,-24 H24 L18,42 H-18Z', col(o, 'c', '#d9b27c')) + R(-28, -32, 56, 10, '#f6f1e4', 4) + R(-22, -6, 44, 22, '#8a5a3b', 0, NS) + P('M-24,-24 H24 L18,42 H-18Z', 'none') + HL('M-18,-18 L-14,36 H-10 L-12,-18Z');
M.glass = (o) => P('M-18,-24 H20 L14,36 H-12Z', 'rgba(255,255,255,.4)') + P('M-16,-8 H18 L14,36 H-12Z', '#c0583d', NS) + P('M-18,-24 H20 L14,36 H-12Z', 'none') + R(-18, -28, 38, 6, 'none', 2, 'stroke="#e0a63a" stroke-width="2"');
M.dates = (o) => E(-14, 14, 14, 9, '#6b3a22', 'transform="rotate(-24 -14 14)"') + E(14, 20, 14, 9, '#7a4529', 'transform="rotate(14 14 20)"') + E(2, 0, 14, 9, '#6b3a22', 'transform="rotate(-8 2 0)"') + P('M-34,26 H34 Q30,46 0,46 Q-30,46 -34,26Z', '#d9b27c');
M.platter = (o) => E(0, 26, 50, 14, '#c9d1da') + P('M-34,22 Q-30,-12 0,-16 Q30,-12 34,22 Q0,32 -34,22Z', '#f4ecd2') + [-14, 0, 12, -4].map((x, i) => E(x, -4 + (i % 2) * 8, 11, 7, '#c0753a', 'stroke-width="1.6"')).join('') + [[-18, 8], [10, 12], [24, 4], [-4, 14]].map(([x, y]) => P(`M${x},${y} l3,-5 l3,5Z`, '#f6f1e4', 'stroke-width="1"')).join('') + [[-8, -16], [12, -14]].map(([x, y]) => E(x, y, 3, 1.6, '#c0392b', NS)).join('');
M.pot = (o) => E(0, -14, 36, 9, '#8aa0b8') + P('M-36,-14 V26 Q-36,40 -20,40 H20 Q36,40 36,26 V-14 Q36,-5 0,-5 Q-36,-5 -36,-14Z', '#aab6c6') + P('M-44,0 H-36 M36,0 H44', 'none', 'stroke-width="5"') + E(0, -14, 28, 6, '#c0753a', NS) + P('M-10,-26 Q-16,-36 -8,-44 M8,-26 Q2,-36 10,-44', 'none', 'stroke="#fff" stroke-width="3" opacity=".8"') + HL('M-30,-4 V26 Q-30,34 -24,36 Q-26,10 -26,-4Z');
M.bowl = (o) => P('M-42,-4 H42 Q40,36 0,38 Q-40,36 -42,-4Z', col(o, 'c', '#ffffff')) + E(0, -4, 42, 9, '#f2c36d') + P('M-30,-6 Q-14,-12 0,-4 Q14,-12 30,-6', 'none', 'stroke="#d9964a" stroke-width="2"') + P('M-6,-14 Q-14,-26 -4,-34 M10,-14 Q2,-26 12,-34', 'none', 'stroke="#fff" stroke-width="3" opacity=".8"') + P('M-30,10 Q0,24 30,10', 'none', `stroke="${col(o, 'd', '#e8553d')}" stroke-width="3"`);
M.kebab = (o) => L(-44, 30, 44, -30, 'stroke="#c9d1da" stroke-width="5"') + [-26, -8, 10, 28].map((x, i) => E(x, 24 - (x + 26) * 0.34 - (i === 3 ? 0 : 0), 14, 11, ['#b25a38', '#58c27d', '#b25a38', '#e8553d'][i], 'transform="rotate(-34 ' + x + ' ' + (24 - (x + 26) * 0.34) + ')"')).join('');
M.apple = (o) => P('M0,-24 Q-34,-40 -42,-8 Q-44,28 -18,42 Q-6,48 0,42 Q6,48 18,42 Q44,28 42,-8 Q34,-40 0,-24Z', col(o, 'c', '#e8553d')) + P('M0,-24 Q2,-36 10,-42', 'none', 'stroke="#6b4a2e" stroke-width="3.4"') + P('M6,-34 Q20,-44 30,-34 Q18,-26 6,-34Z', '#58c27d') + HL('M-28,-12 Q-22,-26 -10,-26 Q-22,-14 -24,6Z');
M.cheese = (o) => P('M-44,26 L-10,-30 L44,-6 V26Z', '#ffcf3f') + P('M-44,26 H44 V36 H-44Z', '#e8a91d') + C(-10, 10, 6, '#e8a91d', NS) + C(14, 4, 4.4, '#e8a91d', NS) + C(30, 16, 3.6, '#e8a91d', NS);
M.lion = (o) => { let s = ''; for (let i = 0; i < 12; i++) s += E(0, -33, 11, 17, '#c98235', `transform="rotate(${i * 30})"`); return s + C(0, 0, 28, '#f2b24c') + P('M-18,-14 Q-10,-24 0,-18 Q10,-24 18,-14', 'none', 'stroke-width="0"') + C(-10, -6, 3.2, INK, NS) + C(10, -6, 3.2, INK, NS) + P('M-6,4 H6 L0,11Z', '#8a4a2e', 'stroke-width="1.4"') + P('M0,11 V16 M0,16 Q-6,22 -12,18 M0,16 Q6,22 12,18', 'none', 'stroke-width="2"') + C(-18, -22, 6, '#f2b24c') + C(18, -22, 6, '#f2b24c'); };
M.falcon = (o) => { const c = col(o, 'c', '#8a5a3b'); return P('M0,-18 Q-14,-30 -52,-22 Q-40,-8 -34,2 Q-24,-2 -18,12 Q-12,6 -8,18 Q-4,10 0,24 Q4,10 8,18 Q12,6 18,12 Q24,-2 34,2 Q40,-8 52,-22 Q14,-30 0,-18Z', c) + P('M0,-18 Q-16,-4 -10,20 L0,36 L10,20 Q16,-4 0,-18Z', '#d9b27c') + C(0, -26, 12, '#d9b27c') + P('M-4,-24 L4,-24 L0,-14Z', '#f6b93b', 'stroke-width="1.6"') + C(-6, -30, 2.4, INK, NS) + C(6, -30, 2.4, INK, NS) + P('M-28,-16 Q-22,-8 -16,-8 M28,-16 Q22,-8 16,-8', 'none', 'stroke-width="1.4" opacity=".5"'); };
M.eagle = M.falcon;
M.elephant = (o) => P('M-20,-20 Q-40,-36 -48,-14 Q-48,10 -30,14 Q-24,20 -24,32 H-8 Q-6,22 -8,14 Q6,16 20,12 Q26,22 22,34 H40 Q40,10 38,-10 Q34,-34 6,-36 Q-8,-34 -20,-20Z', '#9aa9bb') + P('M-30,-6 Q-62,-4 -58,24 Q-56,38 -48,34 Q-50,18 -44,8 Q-34,0 -30,-6Z', '#9aa9bb') + C(-8, -14, 3, INK, NS) + P('M-28,-12 Q-16,-30 2,-26 Q-4,-12 -14,-4Z', '#8999ad') + P('M-24,10 L-14,24', 'none', `stroke="${W}" stroke-width="5" stroke-linecap="round"`);
M.horse = (o) => P('M-30,44 V16 Q-30,0 -16,-2 Q-6,-30 14,-40 Q30,-46 36,-30 L44,-22 Q48,-14 40,-12 L28,-10 Q20,-6 20,6 V44 H8 V14 H-14 V44Z', '#b9784a') + P('M14,-38 Q4,-34 -2,-18 Q-8,-4 -18,-2', 'none', 'stroke="#5a3a22" stroke-width="7"') + C(30, -30, 2.6, INK, NS) + P('M24,-42 L28,-52 L32,-42Z', '#b9784a');
M.cat = (o) => P('M-30,44 Q-36,0 -16,-8 Q-6,-14 -6,-30 Q-6,-44 6,-44 Q18,-44 18,-30 Q18,-22 12,-14 Q30,-6 30,16 Q30,36 12,44Z', '#f2a65a') + P('M-4,-44 L-2,-56 L8,-46Z M10,-44 L16,-54 L18,-42Z', '#f2a65a') + C(2, -32, 2.2, INK, NS) + C(12, -32, 2.2, INK, NS) + P('M30,30 Q52,24 48,2', 'none', 'stroke="#f2a65a" stroke-width="7" stroke-linecap="round"');
M.paw = (o) => E(0, 14, 22, 18, col(o, 'c', '#8a5a3b')) + [[-22, -14], [-8, -26], [8, -26], [22, -14]].map(([x, y]) => E(x, y, 8, 10, col(o, 'c', '#8a5a3b'))).join('');
M.dragon = (o) => { const c = col(o, 'c', '#3fb97a'); return P('M-46,30 Q-52,-6 -20,-12 Q4,-16 6,-34 Q8,-48 26,-46 L38,-52 L36,-40 Q50,-34 44,-22 L30,-18 Q18,-16 22,-2 Q26,16 6,26 Q-14,34 -22,22 Q-32,10 -34,28 Q-38,42 -46,30Z', c) + P('M-8,-8 Q-34,-44 -46,-34 Q-36,-22 -30,-14Z', '#7ee0a4') + P('M-8,-8 Q-16,-48 4,-54 Q-2,-34 4,-18Z', '#58c27d') + C(30, -38, 2.8, '#ffe58a', 'stroke-width="1"') + P('M40,-30 Q52,-26 56,-34', 'none', 'stroke-width="2"') + P('M-46,30 Q-58,26 -60,18', 'none', `stroke="${c}" stroke-width="5"`) + P('M-30,20 L-24,26 M-22,12 L-16,18', 'none', `stroke="${W}" stroke-width="2" opacity=".6"`); };
M.owl = (o) => P('M-28,44 Q-38,10 -30,-20 Q-26,-38 0,-40 Q26,-38 30,-20 Q38,10 28,44Z', '#9a7650') + P('M-34,-30 L-24,-44 L-12,-34Z M34,-30 L24,-44 L12,-34Z', '#9a7650') + C(-12, -14, 12, W) + C(12, -14, 12, W) + C(-12, -14, 5, INK, NS) + C(12, -14, 5, INK, NS) + P('M-5,-4 L0,6 L5,-4Z', '#f6b93b', 'stroke-width="1.6"') + P('M-16,18 Q-10,12 -4,18 M4,18 Q10,12 16,18 M-12,30 Q-6,24 0,30 M0,30 Q6,24 12,30', 'none', 'stroke-width="1.6" opacity=".5"');
M.snake = (o) => P('M-40,30 Q-50,-4 -20,-8 Q10,-12 0,-30 Q-4,-46 18,-44', 'none', `stroke="${col(o, 'c', '#58c27d')}" stroke-width="12" stroke-linecap="round"`) + C(22, -44, 8, col(o, 'c', '#58c27d')) + C(24, -46, 2, INK, NS);
M.bird = (o) => P('M-34,14 Q-30,-14 0,-18 Q24,-18 30,-4 L46,-10 L38,2 Q36,20 6,26 Q-24,30 -34,14Z', col(o, 'c', '#4f9be8')) + P('M-8,-4 Q10,-16 22,-4 Q10,8 -8,-4Z', '#2f6fb8') + C(28, -8, 2.4, INK, NS);
M.camel = (o) => P('M-34,-2 Q-34,-14 -22,-14 Q-14,-34 -2,-14 Q14,-14 26,-12 Q34,-12 34,-2 V10 Q34,16 28,16 H-28 Q-34,16 -34,10Z', '#d9a05a') + P('M26,-10 Q34,-28 38,-42 Q40,-50 48,-48 Q54,-46 52,-40 L46,-38 Q44,-28 40,-12Z', '#d9a05a') + [-28, -14, 14, 26].map(x => R(x - 3.5, 12, 7, 32, '#c48846', 2)).join('') + P('M-34,0 Q-44,6 -42,22', 'none', 'stroke-width="3"') + C(48, -44, 1.8, INK, NS) + SH('M-34,6 H34 V16 H-34Z');
})(M8P);
(function (X) {
const { INK, NS, W, P, C, E, R, L, POLY, HL, SH, star, ngon, sparkle, M, f } = X;
const col = (o, k, d) => (o && o[k]) || d;
const TXT = (t, x, y, size, fill, extra) => `<text x="${x}" y="${y}" font-family="Cairo,Tajawal,'Segoe UI',Arial,sans-serif" font-weight="900" font-size="${size}" text-anchor="middle" fill="${fill}" stroke="none" ${extra || ''}>${t}</text>`;
M.hexgrid = (o) => { const cs = o.cols || ['#ffd166', '#58c27d', '#4f9be8', '#f28bb0', '#8b6fd6', '#f08a3c', '#e8553d']; const ls = o.letters || []; const pos = [[0, 0], [0, -30], [26, -15], [26, 15], [0, 30], [-26, 15], [-26, -15]]; return pos.map((p, i) => ngon(p[0], p[1], 17.5, 6, i === 0 ? (o.hot || '#f08a3c') : cs[i % cs.length], 0, 'stroke-width="2.4"') + (ls[i] ? TXT(ls[i], p[0], p[1] + 6, 17, i === 0 ? '#fff' : INK) : '')).join('') + (o.route ? P('M-26,15 L0,0 L26,-15 L26,15', 'none', 'stroke="#fff" stroke-width="7" stroke-opacity=".9"') + P('M-26,15 L0,0 L26,-15 L26,15', 'none', 'stroke="#e8553d" stroke-width="3.5" stroke-dasharray="1 7"') + C(-26, 15, 4, '#e8553d') + C(26, 15, 4, '#e8553d') : ''); };
M.card = (o) => R(-36, -36, 72, 72, o.c || W, 12, 'stroke-width="2.6"');
M.plus = (o) => P('M-4,-16 H4 V-4 H16 V4 H4 V16 H-4 V4 H-16 V-4 H-4Z', o.c || '#e8553d');
M.lantern = (o) => L(0, -48, 0, -34, 'stroke-width="3"') + P('M-10,-34 H10 L6,-40 H-6Z', '#c9922f') + P('M-18,-30 Q-26,0 -18,26 H18 Q26,0 18,-30Z', o.c || '#f6b93b') + P('M-8,-30 Q-12,0 -8,26 M8,-30 Q12,0 8,26 M-18,-4 H18', 'none', 'stroke-width="1.6" opacity=".6"') + P('M-14,26 H14 L10,36 H-10Z', '#c9922f') + C(0, -2, 9, '#fff3b0', 'stroke="none"') + HL('M-14,-24 Q-20,-2 -14,14 Q-18,-4 -10,-24Z');
M.cactus = (o) => R(-9, -40, 18, 86, '#58c27d', 9) + P('M-9,6 H-22 Q-28,6 -28,-2 V-18 Q-28,-24 -22,-24 Q-16,-24 -16,-18 V-6 H-9', '#58c27d') + P('M9,-4 H20 Q26,-4 26,-12 V-26 Q26,-32 20,-32 Q14,-32 14,-26 V-14 H9', '#58c27d') + L(0, -32, 0, 38, 'stroke-width="1.2" opacity=".35"');
M.shapes3 = (o) => C(-30, 0, 18, 'none', `stroke="${o.c || '#e8553d'}" stroke-width="7"`) + C(-30, 0, 18, 'none', 'stroke-width="1.2"') + POLY('0,-22 20,14 -20,14', 'none', `stroke="${o.c || '#e8553d'}" stroke-width="7" stroke-linejoin="round"`) + R(14, -16, 32, 32, 'none', 0, `stroke="${o.c || '#e8553d'}" stroke-width="7"`);
M.sofa = (o) => R(-46, -10, 92, 36, o.c || '#f08a3c', 12) + R(-52, -2, 18, 38, o.c || '#e0752a', 8) + R(34, -2, 18, 38, o.c || '#e0752a', 8) + R(-36, 14, 72, 22, o.d || '#f5a25d', 8) + L(0, 16, 0, 34, 'stroke-width="1.6"') + L(-42, 38, -42, 46, 'stroke-width="4"') + L(42, 38, 42, 46, 'stroke-width="4"');
M.factory = (o) => R(-44, -2, 88, 46, '#8c5a45', 1) + [-32, -14, 4, 22].map((x, i) => R(x, -22 - (i % 2) * 8, 12, 24 + (i % 2) * 8, '#8c5a45', 1)).join('') + [-30, -10, 10, 30].map(x => R(x, 14, 10, 12, '#ffe58a', 1)).join('') + P('M-30,-26 Q-24,-34 -30,-44 M-12,-34 Q-6,-42 -12,-50', 'none', 'stroke="#b9c3d0" stroke-width="4" opacity=".8"');
M.spiral = (o) => `<path d="M0,0 m0,-4 a4,4 0 1 1 -4,4 a10,10 0 1 1 10,10 a18,18 0 1 1 -18,-18 a28,28 0 1 1 28,28 a38,38 0 1 1 -38,-38" fill="none" stroke="${o.c || '#8fd0ff'}" stroke-width="4"/>`;
M.longship = (o) => P('M-50,6 Q-58,-14 -50,-30 Q-44,-14 -34,-4 H34 Q44,-14 50,-30 Q58,-14 50,6 Q40,28 0,30 Q-40,28 -50,6Z', '#a36c43') + [-30, -10, 10, 30].map((x, i) => C(x, 8, 7, ['#e8553d', '#f6b93b', '#e8553d', '#f6b93b'][i], 'stroke-width="1.6"')).join('') + L(0, -4, 0, -44, 'stroke-width="3"') + P('M0,-44 L0,-6 H30 Z', W, NS) + P('M0,-44 L0,-6 H30Z', 'none') + `<path d="M-60,46 Q-44,38 -28,46 T4,46 T36,46 T64,46" fill="none" stroke="#4f9be8" stroke-width="4"/>`;
M.tractor = (o) => R(-12, -22, 36, 30, '#58a85a', 4) + R(-8, -42, 26, 22, '#58a85a', 3) + R(-4, -38, 18, 14, '#bfe0ff', 2) + R(-44, 4, 70, 18, '#58a85a', 3) + C(-30, 22, 20, '#2b3340') + C(-30, 22, 8, '#e8d7a8') + C(26, 28, 12, '#2b3340') + C(26, 28, 5, '#e8d7a8') + R(22, 8, 18, 10, '#4f8a52', 2) + L(8, -44, 8, -56, 'stroke-width="3"');
M.top = (o) => P('M-30,-10 Q0,-24 30,-10 L22,12 Q0,20 -22,12Z', o.c || '#e8553d') + P('M-22,12 Q0,20 22,12 L0,46Z', '#c9d1da') + L(0, -12, 0, -34, 'stroke-width="5"') + C(0, -38, 5, '#c9d1da') + HL('M-22,-8 Q-8,-16 4,-14 Q-10,-8 -18,6Z');
M.rose = (o) => L(0, 0, 0, 44, 'stroke="#3a8a5a" stroke-width="5"') + P('M0,26 Q-18,24 -22,10 Q-6,10 0,26Z', '#3fb97a') + C(0, -14, 20, o.c || '#d9323f') + P('M-10,-14 Q0,-26 10,-14 Q0,-4 -10,-14Z M-4,-14 Q0,-20 4,-14', 'none', 'stroke-width="1.6"') + HL('M-14,-24 Q-6,-34 6,-32 Q-8,-28 -12,-16Z');
M.shades = (o) => P('M-44,-12 H-4 Q-2,-4 -6,12 Q-12,22 -26,22 Q-42,22 -44,6Z', '#1b1b22') + P('M44,-12 H4 Q2,-4 6,12 Q12,22 26,22 Q42,22 44,6Z', '#1b1b22') + P('M-6,-8 Q0,-14 6,-8', 'none', 'stroke-width="3"') + P('M-38,-8 Q-34,-4 -36,2 M38,-8 Q34,-4 36,2', 'none', 'stroke="#58c27d" stroke-width="3"');
M.rain = (o) => { let s = ''; const cs = ['#3fe07a', '#2bb35c', '#7dffa8']; for (let i = 0; i < 14; i++) { const x = -60 + i * 9; for (let k = 0; k < 6; k++) { const y = -60 + ((i * 37 + k * 23) % 130); s += R(x, y, 4, 7 + (k % 3) * 3, cs[(i + k) % 3], 1, `stroke="none" opacity="${0.35 + 0.1 * (k % 5)}"`); } } return s; };
M.shuriken = (o) => { let s = ''; for (let i = 0; i < 4; i++) s += POLY('0,0 8,-12 0,-40 -8,-12', '#b9c3d0', `transform="rotate(${i * 90})"`); return s + C(0, 0, 6, '#e8eef5') + C(0, 0, 2.6, INK, NS); };
M.kunai = (o) => P('M0,-48 L10,-16 L4,4 H-4 L-10,-16Z', '#c9d1da') + R(-4, 4, 8, 28, '#4a5568', 2) + C(0, 40, 8, 'none', 'stroke="#4a5568" stroke-width="4"') + L(-2, -40, -2, -12, `stroke="${W}" stroke-width="2" opacity=".7"`);
M.wall = (o) => { let s = R(-50, -26, 100, 72, '#b9a898', 2); for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) s += R(-50 + c * 17 - (r % 2 ? 8 : 0), -26 + r * 14.4, 17, 14.4, 'none', 0, 'stroke-width="1.2" opacity=".5"'); return s + [-46, -30, -14, 2, 18, 34].map(x => R(x, -34, 11, 10, '#b9a898', 1)).join('') + SH('M-50,36 H50 V46 H-50Z'); };
M.orb = (o) => C(0, 0, 26, o.c || '#f08a3c') + HL('M-18,-10 Q-12,-22 0,-24 Q-12,-18 -16,-4Z') + star(0, 2, 9, '#fff', 'stroke-width="1.4" fill-opacity=".85"');
M.crown = (o) => P('M-38,26 L-44,-24 L-20,-4 L0,-36 L20,-4 L44,-24 L38,26Z', '#f6b93b') + R(-38, 20, 76, 12, '#e09a1b', 3) + C(-44, -26, 5, '#e8553d') + C(0, -38, 5, '#4f9be8') + C(44, -26, 5, '#e8553d') + [-18, 0, 18].map(x => C(x, 12, 4.4, '#e8553d', 'stroke-width="1.4"')).join('') + HL('M-30,18 L-34,-12 L-22,-2 L-26,18Z');
M.fireworks = (o) => { let s = ''; const burst = (cx, cy, r, c) => { let q = ''; for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; q += L(f(cx + r * 0.4 * Math.cos(a)), f(cy + r * 0.4 * Math.sin(a)), f(cx + r * Math.cos(a)), f(cy + r * Math.sin(a)), `stroke="${c}" stroke-width="4"`) + C(f(cx + (r + 5) * Math.cos(a)), f(cy + (r + 5) * Math.sin(a)), 2.4, c, NS); } return q; }; return burst(-14, -12, 26, '#ffd166') + burst(30, 16, 16, '#7fd1ff') + burst(-34, 28, 10, '#ff8fb1'); };
M.oyster = (o) => P('M-40,10 Q-44,-30 0,-34 Q44,-30 40,10Z', '#d9c9e8') + P('M-40,10 H40 Q36,36 0,40 Q-36,36 -40,10Z', '#c0aed6') + [-24, -12, 0, 12, 24].map(x => P(`M${x},-30 Q${x * 1.1},-10 ${x * 1.2},8`, 'none', 'stroke-width="1.4" opacity=".5"')).join('') + C(0, 8, 11, '#fbf7ef', 'stroke-width="1.8"') + C(-3, 4, 3, W, NS);
M.khanjar = (o) => P('M-8,-44 Q-12,-10 -4,6 L0,10 L6,6 Q16,-10 8,-44Z', '#c9d1da') + P('M-12,4 Q0,-4 12,4 L10,12 Q0,6 -10,12Z', '#f6b93b') + R(-6, 12, 12, 16, '#8a5a3b', 3) + P('M-14,28 H14 L10,36 H-10Z', '#f6b93b') + P('M-10,36 Q0,52 10,36', '#f6b93b') + L(0, -40, 0, 2, `stroke="${W}" stroke-width="2" opacity=".6"`);
M.petra = (o) => R(-38, -34, 76, 80, '#d98a6a', 1) + [-24, -12, 0, 12, 24].map(x => R(x - 3, -6, 6, 52, '#c4755a', 1)).join('') + P('M-30,-6 H30 L24,-20 H-24Z', '#c4755a') + P('M-14,-20 Q0,-42 14,-20Z', '#c4755a') + P('M-10,46 V20 Q0,8 10,20 V46Z', INK) + SH('M-38,36 H38 V46 H-38Z');
M.domerock = (o) => P('M-38,6 L-24,-6 H24 L38,6 V40 H-38Z', '#4f8fd9') + P('M-24,-6 Q-24,-42 0,-42 Q24,-42 24,-6Z', '#f6b93b') + L(0, -42, 0, -52, 'stroke-width="2.4"') + C(0, -55, 3, '#f6b93b', NS) + [-28, -16, -4, 8, 20].map(x => P(`M${x},40 v-14 q4,-6 8,0 v14`, W, 'stroke-width="1.4" opacity=".9"')).join('') + HL('M-18,-10 Q-18,-30 -6,-36 Q-10,-18 -10,-8Z');
M.cedar = (o) => R(-5, 20, 10, 26, '#8a5a3b', 1) + P('M-44,24 Q-30,16 -18,18 Q-8,6 -4,10 Q-26,2 -40,10 Z', '#3a8a5a') + P('M-46,22 Q-30,10 0,14 Q30,10 46,22 Q20,28 0,24 Q-20,28 -46,22Z', '#3fb97a') + P('M-36,6 Q0,-4 36,6 Q16,12 0,8 Q-16,12 -36,6Z', '#58c27d') + P('M-26,-8 Q0,-18 26,-8 Q10,-2 0,-4 Q-10,-2 -26,-8Z', '#3fb97a') + P('M-14,-22 Q0,-34 14,-22 Q4,-16 0,-18 Q-4,-16 -14,-22Z', '#58c27d');
M.ziggurat = (o) => R(-46, 18, 92, 26, '#d9a05a', 1) + R(-34, -2, 68, 20, '#e0ac68', 1) + R(-22, -20, 44, 18, '#d9a05a', 1) + R(-10, -36, 20, 16, '#e0ac68', 1) + P('M-10,44 L-40,18 M10,44 L40,18', 'none', 'stroke-width="1.6" opacity=".4"') + P('M-6,44 V32 Q0,24 6,32 V44Z', INK, NS);
M.towerhouse = (o) => { const bl = (x, h, c) => R(x - 15, 44 - h, 30, h, c, 1) + [0, 1, 2, 3, 4].filter(i => 18 + i * 16 < h).map(i => R(x - 8, 44 - h + 8 + i * 16, 16, 9, '#fff3d0', 4, 'stroke-width="1.4"')).join('') + R(x - 15, 44 - h, 30, 5, W, 1, 'stroke-width="1.4"'); return bl(-28, 70, '#b9754a') + bl(8, 90, '#c98a5a') + bl(40, 56, '#b9754a'); };
M.arch = (o) => R(-34, -38, 68, 84, o.c || '#e9d3a8', 3) + P('M-20,46 V-4 Q-20,-30 0,-34 Q20,-30 20,-4 V46Z', o.d || '#2f7d8a') + P('M-12,46 V0 Q-12,-20 0,-24 Q12,-20 12,0 V46Z', '#173b40', NS) + [-27, 27].map(x => C(x, -14, 3, '#f6b93b')).join('') + [-26, 26].map(x => R(x - 3, 8, 6, 30, '#c4a46e', 2, 'stroke-width="1.4"')).join('');
M.columns = (o) => R(-46, 36, 92, 10, '#e8dcc0', 1) + R(-46, -34, 92, 10, '#e8dcc0', 1) + [-34, -12, 10, 32].map(x => R(x - 6, -24, 12, 60, '#f4ead2', 1) + L(x - 2, -22, x - 2, 34, 'stroke-width="1" opacity=".4"')).join('') + P('M-46,-34 L0,-52 L46,-34Z', '#e8dcc0');
M.flag = (o) => L(-30, 46, -30, -46, 'stroke-width="4"') + C(-30, -48, 3.4, '#f6b93b') + P('M-28,-42 Q-6,-34 14,-42 Q34,-50 44,-42 V0 Q34,-8 14,0 Q-6,8 -28,0Z', o.c || '#e8553d') + P('M-28,-28 Q-6,-20 14,-28 Q34,-36 44,-28 V-14 Q34,-22 14,-14 Q-6,-6 -28,-14Z', o.d || W, NS) + P('M-28,-42 Q-6,-34 14,-42 Q34,-50 44,-42 V0 Q34,-8 14,0 Q-6,8 -28,0Z', 'none');
M.windmill = (o) => P('M-16,46 L-10,-6 H10 L16,46Z', '#f1e3c4') + P('M-12,-6 L0,-22 L12,-6Z', '#c0583d') + [0, 90, 180, 270].map(a => `<g transform="translate(0,-14) rotate(${a + 20})">` + R(-3, -40, 6, 38, '#8a5a3b', 1) + R(3, -40, 14, 22, '#fbf3df', 1, 'stroke-width="1.6"') + `</g>`).join('') + C(0, -14, 4, '#6b4a2e') + R(-5, 28, 10, 18, '#8a5a3b', 2);
M.ptable = (o) => { const cs = ['#ffd166', '#58c27d', '#4f9be8', '#f28bb0', '#8b6fd6', '#f08a3c', '#e8553d', '#7fd1b5']; let s = R(-46, -34, 92, 74, W, 5, 'stroke-width="2.4"'); for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) { if (r < 2 && c > 0 && c < 6) continue; s += R(-40 + c * 12, -28 + r * 16, 11, 14, cs[(r * 3 + c) % 8], 2, 'stroke-width="1.2"'); } return s; };
M.quote = (o) => P('M-34,-4 Q-34,-30 -10,-34 L-8,-26 Q-20,-24 -20,-12 H-10 V10 H-34Z M6,-4 Q6,-30 30,-34 L32,-26 Q20,-24 20,-12 H30 V10 H6Z', o.c || '#8b6fd6');
M.ringarena = (o) => POLY('-46,14 0,-8 46,14 0,36', '#4f8fd9', 'stroke-width="2.4"') + [[-46, 14], [0, -8], [46, 14], [0, 36]].map(([x, y]) => L(x, y, x, y - 30, 'stroke-width="4"')).join('') + P('M-46,-16 L0,-38 L46,-16 M-46,-6 L0,-28 L46,-6', 'none', 'stroke="#e8553d" stroke-width="3"') + P('M-46,-16 L0,6 L46,-16 M-46,-6 L0,16 L46,-6', 'none', 'stroke="#e8553d" stroke-width="3"') + P('M-46,14 V44 H0 V44', 'none', 'stroke="none"');
M.tinhat = (o) => P('M-34,10 Q-34,-30 0,-30 Q34,-30 34,10Z', o.c || '#6b7a5a') + P('M-48,12 Q0,22 48,12 Q40,6 34,10 H-34 Q-40,6 -48,12Z', o.c || '#6b7a5a') + P('M-30,2 Q0,-8 30,2', 'none', 'stroke="#fff" stroke-width="2" opacity=".35"');
M.plane = (o) => P('M-50,4 Q-50,-6 -40,-8 H30 Q50,-8 52,2 Q50,12 30,12 H-40 Q-50,12 -50,4Z', o.c || '#8aa0b8') + P('M-8,-6 L-20,-40 L4,-40 L14,-6Z', '#6b7f99') + P('M-8,10 L-20,36 L4,36 L14,10Z', '#6b7f99') + P('M-50,-6 L-56,-26 L-44,-24 L-40,-6Z', '#6b7f99') + C(52, 2, 4, '#2b3340') + L(54, -22, 54, 26, 'stroke="#2b3340" stroke-width="3"') + C(14, -2, 6, '#bfe0ff') + C(-2, -2, 6, '#bfe0ff') + star(-30, 2, 5, '#fff', NS);
M.clipboard = (o) => R(-34, -40, 68, 86, '#d9b27c', 7) + R(-27, -30, 54, 70, W, 3) + R(-12, -46, 24, 14, '#8aa0b8', 4) + [-14, 0, 14, 28].map((y, i) => TXT(String(i + 1), -17, y + 6, 13, '#e8553d') + L(-8, y + 2, 20, y + 2, 'stroke-width="2.6" stroke-linecap="round"')).join('');
M.numblocks = (o) => [[-34, 6, '1', '#4f9be8', -6], [0, 0, '2', '#f6b93b', 3], [34, 8, '3', '#e8553d', 7]].map(([x, y, t, c, r]) => `<g transform="translate(${x},${y}) rotate(${r})">` + R(-17, -22, 34, 44, c, 7) + TXT(t, 0, 10, 30, '#fff') + `</g>`).join('');
M.dotletters = (o) => R(-40, -30, 80, 60, W, 14, 'stroke-width="2.6"') + TXT('ح', -14, 12, 52, INK) + TXT('ٮ', 18, 12, 40, '#8b6fd6') + C(18, 26, 4, '#e8553d') + L(10, 18, 26, 34, 'stroke="#e8553d" stroke-width="3"');
M.curtain = (o) => R(-54, -44, 108, 12, '#8a1f2b', 2) + P('M-52,-32 Q-34,-6 -44,46 H-14 Q-18,0 0,-32Z', '#c0283a') + P('M52,-32 Q34,-6 44,46 H14 Q18,0 0,-32Z', '#c0283a') + P('M-52,-32 Q-34,-6 -44,46', 'none') + L(-30, -32, -26, 46, 'stroke-width="1.2" opacity=".4"') + L(30, -32, 26, 46, 'stroke-width="1.2" opacity=".4"');
M.gauge = (o) => C(0, 4, 44, '#2b3340') + C(0, 4, 36, '#e8eef5') + [...Array(9)].map((_, i) => L(0, -28, 0, i > 6 ? -24 : -22, `transform="rotate(${-120 + i * 30} 0 4)" stroke="${i > 6 ? '#e8553d' : INK}" stroke-width="2.4"`)).join('') + L(0, 4, 18, -16, 'stroke="#e8553d" stroke-width="4"') + C(0, 4, 5, INK, NS) + P('M-24,32 H24', 'none', 'stroke-width="2"');
M.soundwave = (o) => [[-44, 10], [-34, 24], [-24, 40], [-14, 20], [-4, 52], [6, 30], [16, 46], [26, 22], [36, 34], [46, 14]].map(([x, h], i) => R(x - 3.5, -h / 2, 7, h, ['#4f9be8', '#8b6fd6', '#e8553d'][i % 3], 3.5, 'stroke-width="1.6"')).join('');
M.paperstack = (o) => R(-34, 10, 68, 12, W, 2) + R(-30, -2, 68, 12, '#f6f1e4', 2) + R(-36, -14, 68, 12, W, 2) + R(-32, -26, 68, 12, '#f6f1e4', 2) + L(-24, -20, 8, -20, 'stroke-width="2" opacity=".5"') + L(-26, -8, 12, -8, 'stroke-width="2" opacity=".5"');
M.letterA = (o) => TXT(o.t || 'أ', 0, 18, o.size || 80, o.c || '#8b6fd6', 'stroke="#1f2a3a" stroke-width="2.4" paint-order="stroke"');
M.cape = (o) => '';
})(M8P);
(function (X) {
const { INK, NS, W, P, C, E, R, L, POLY, HL, SH, star, ngon, sparkle, M, f } = X;
const col = (o, k, d) => (o && o[k]) || d;
const TXT = (t, x, y, size, fill, extra) => `<text x="${x}" y="${y}" font-family="Cairo,Tajawal,'Segoe UI',Arial,sans-serif" font-weight="900" font-size="${size}" text-anchor="middle" fill="${fill}" stroke="none" ${extra || ''}>${t}</text>`;
const rot = (a, inner, cx, cy) => `<g transform="rotate(${a}${cx != null ? ',' + cx + ',' + cy : ''})">${inner}</g>`;
M.monkey = (o) => { const br = '#8a5a35', lt = '#f0cfa3'; return C(-36, -4, 12, br) + C(36, -4, 12, br) + C(-36, -4, 6.5, lt, NS) + C(36, -4, 6.5, lt, NS) + P('M-34,10 Q-38,52 0,54 Q38,52 34,10 Q30,-36 0,-36 Q-30,-36 -34,10Z', br) + E(0, 18, 24, 20, lt) + P('M-30,-6 Q-18,-26 0,-14 Q18,-26 30,-6 Q24,14 0,10 Q-24,14 -30,-6Z', lt) + C(-11, -4, 3.6, INK, NS) + C(11, -4, 3.6, INK, NS) + C(-3.5, 14, 1.8, INK, NS) + C(3.5, 14, 1.8, INK, NS) + P('M-10,27 Q0,35 10,27', 'none', 'stroke-width="2.2"') + HL('M-26,-24 Q-14,-33 -2,-31 Q-18,-30 -26,-18Z'); };
M.banana = (o) => P('M-40,-22 Q-14,44 38,-14 L46,-26 L52,-20 Q24,58 -44,-10Z', '#ffd53d') + P('M38,-14 L46,-26 L52,-20 L44,-8Z', '#7a5a2e') + HL('M-32,-12 Q-8,30 28,-6 Q-6,26 -32,-12Z');
M.scissors = (o) => rot(0, P('M-4,14 L22,-48 L30,-44 L2,18Z', '#cfd8e3') + P('M4,14 L-22,-48 L-30,-44 L-2,18Z', '#aab6c4') + C(-17, 30, 14, '#e8553d') + C(17, 30, 14, '#e8553d') + C(-17, 30, 7, W) + C(17, 30, 7, W) + C(0, 6, 3, INK, NS));
M.barberpole = (o) => R(-14, -40, 28, 82, W, 4) + P('M-14,-26 L14,-40 L14,-30 L-14,-16Z', '#e8553d', NS) + P('M-14,-6 L14,-20 L14,-10 L-14,4Z', '#4f8fd9', NS) + P('M-14,14 L14,0 L14,10 L-14,24Z', '#e8553d', NS) + P('M-14,32 L14,18 L14,28 L-14,42Z', '#4f8fd9', NS) + R(-14, -40, 28, 82, 'none', 4) + R(-19, -50, 38, 12, '#4a5568', 4) + R(-19, 40, 38, 12, '#4a5568', 4) + C(0, -58, 8, '#cfd8e3');
M.flame = (o) => P('M0,-50 Q8,-28 22,-18 Q36,-4 30,16 Q24,38 0,40 Q-24,38 -30,16 Q-34,-2 -18,-16 Q-16,-6 -10,-6 Q-14,-30 0,-50Z', '#f26a3d') + P('M0,-8 Q12,4 16,14 Q18,30 0,32 Q-18,30 -14,14 Q-12,6 0,-8Z', '#ffc94a') + HL('M-20,-6 Q-26,6 -22,16 Q-30,2 -20,-6Z');
M.astronaut = (o) => R(-36, -2, 72, 48, '#cdd5df', 10) + R(-26, 8, 52, 44, '#f6f8fb', 14) + R(-46, 10, 18, 32, '#f6f8fb', 9) + R(28, 10, 18, 32, '#f6f8fb', 9) + R(-46, 34, 18, 8, '#e8553d', 4, NS) + R(28, 34, 18, 8, '#e8553d', 4, NS) + R(-12, 24, 24, 14, '#4f8fd9', 3) + C(-6, 31, 2.4, W, NS) + C(6, 31, 2.4, '#ffd166', NS) + C(0, -22, 32, '#f6f8fb') + E(0, -20, 23, 18, '#2b3a67') + P('M-14,-28 Q-8,-34 4,-32 Q-6,-30 -10,-22Z', W, `fill-opacity=".6" ${NS}`) + R(-8, 6, 16, 6, '#cdd5df', 2);
M.fishrod = (o) => L(-44, 44, 36, -42, 'stroke="#8a5a35" stroke-width="6"') + L(-44, 44, 36, -42, 'stroke="#c98c54" stroke-width="2.4"') + P('M36,-42 Q60,-6 40,28', 'none', 'stroke-width="1.8"') + P('M40,28 v8 a5,5 0 1 1 -6,2', 'none', 'stroke="#aab6c4" stroke-width="2.6"') + C(-22, 26, 9, '#aab6c4') + C(-22, 26, 3, INK, NS);
M.hammer = (o) => rot(-35, R(-5.5, -28, 11, 80, '#c98c54', 4) + R(-28, -42, 56, 22, '#9aa6b5', 5) + R(-28, -42, 16, 22, '#7c8898', 5) + HL('M-8,-40 H24 V-36 H-8Z'));
M.saw = (o) => { let t = 'M-50,14'; for (let i = 0; i < 12; i++) t += ` L${-50 + i * 6 + 3},22 L${-50 + (i + 1) * 6},14`; return P('M-50,-12 L22,-18 V14 H-50Z', '#cfd8e3') + P(t + 'Z', '#cfd8e3') + P('M22,-22 H50 Q56,0 50,22 H22Z', '#e8a24a') + R(31, -8, 12, 16, W, 6) + HL('M-44,-8 L16,-12 V-8 L-44,-4Z'); };
M.elevator = (o) => R(-38, -42, 76, 92, '#cfd5de', 4) + R(-30, -26, 29, 72, '#9aa6b5', 2) + R(4, -26, 26, 72, '#9aa6b5', 2) + R(-1, -26, 5, 72, '#2b3340', 0, NS) + R(-18, -40, 36, 11, '#2b3340', 3) + POLY('-4,-33 0,-38 4,-33', '#ffd166', NS) + R(40, -6, 12, 30, '#e6eaf1', 3) + C(46, 2, 3.2, '#ff6b5b') + C(46, 14, 3.2, '#ffd166') + L(-24, -10, -24, 20, 'stroke-width="1.4" opacity=".4"');
M.quicksand = (o) => { const sk = SKIN(o); return L(-26, 14, -42, -30, 'stroke="#3b6fc4" stroke-width="9"') + L(26, 14, 42, -30, 'stroke="#3b6fc4" stroke-width="9"') + C(-42, -36, 6.5, sk) + C(42, -36, 6.5, sk) + M.person({ head: 'hair', top: 'tee', tc: '#3b6fc4', hc: '#3b2a1e', len: 40 }) + P('M-52,30 Q-30,14 0,22 Q30,14 52,30 Q56,48 0,50 Q-56,48 -52,30Z', '#e8c07d') + P('M-34,34 Q-14,28 -2,34 M6,38 Q22,32 34,38', 'none', 'stroke="#c9974e" stroke-width="2"'); };
const SKIN = (o) => ({ a: '#f3c7a2', b: '#dba57d', c: '#bf8559' })[(o && o.skin) || 'a'] || '#f3c7a2';
M.suitcase = (o) => P('M-14,-22 V-34 Q-14,-42 -6,-42 H6 Q14,-42 14,-34 V-22', 'none', 'stroke-width="4.5"') + R(-42, -24, 84, 62, col(o, 'c', '#e8553d'), 9) + R(-24, -24, 9, 62, '#000', 0, `fill-opacity=".14" ${NS}`) + R(15, -24, 9, 62, '#000', 0, `fill-opacity=".14" ${NS}`) + R(-8, -8, 16, 12, '#f6d28a', 3) + C(-28, 44, 5, '#2b3340') + C(28, 44, 5, '#2b3340') + HL('M-38,-18 H-30 V28 H-38Z');
M.candle = (o) => C(0, -26, 30, '#fff1b8', `fill-opacity=".55" ${NS}`) + R(-13, -4, 26, 50, '#fff3d6', 5) + P('M-13,6 Q-8,16 -4,6', '#fff3d6', 'stroke-width="1.6"') + L(0, -4, 0, -12, 'stroke-width="2"') + P('M0,-48 Q10,-32 10,-22 Q10,-12 0,-12 Q-10,-12 -10,-22 Q-10,-34 0,-48Z', '#ffb02e') + P('M0,-30 Q5,-24 4,-18 Q0,-14 -4,-18 Q-5,-24 0,-30Z', '#fff3a8', NS) + E(0, 48, 28, 7, '#c9a050');
M.lightning = (o) => P('M12,-50 L-24,6 H-3 L-12,50 L28,-8 H6Z', col(o, 'c', '#ffd23f'));
M.blackboard = (o) => R(-52, -38, 104, 68, '#2f5d50', 3, 'stroke="#8a5a35" stroke-width="5"') + R(-52, 32, 104, 7, '#8a5a35', 2) + R(-20, 33, 12, 4, W, 1, NS) + TXT('٢ + ٢ = ٥', 0, -6, 20, '#f4f1e6') + P('M-38,10 Q-20,2 -2,10 T34,8', 'none', 'stroke="#f4f1e6" stroke-width="2.4" opacity=".8"');
M.honeyjar = (o) => P('M-28,-12 Q-36,-30 -20,-34 H20 Q36,-30 28,-12 Q42,4 36,30 Q32,46 0,46 Q-32,46 -36,30 Q-42,4 -28,-12Z', '#4a3223') + R(-24, -48, 48, 14, '#c98c54', 4) + R(-24, 0, 48, 26, '#f6d28a', 4) + TXT('عسل', 0, 20, 17, '#4a3223') + P('M-24,-30 Q-26,-18 -18,-8', 'none', `stroke="#7a5538" stroke-width="3"`) + HL('M-30,-4 Q-34,10 -30,24 Q-36,8 -28,-4Z');
M.signpost = (o) => R(-4, -50, 8, 100, '#8a5a35', 2) + P('M-40,-42 H28 L46,-29 L28,-16 H-40Z', '#e8553d') + P('M40,-8 H-28 L-46,5 L-28,18 H40Z', '#3b82d6') + TXT('رايح', -4, -23, 15, W) + TXT('جاي', 6, 12, 15, W);
M.iceberg = (o) => P('M-48,22 L-28,-16 L-10,-2 L6,-42 L28,-8 L52,22Z', '#f2faff') + P('M6,-42 L28,-8 L18,-4 L10,-18Z', '#cfe6f6', NS) + P('M-48,22 L-36,44 L12,52 L52,22Z', '#9ccbec') + P('M-60,22 H60', 'none', 'stroke="#4f9be8" stroke-width="3.5"');
M.clownfish = (o) => P('M34,0 L58,-20 Q52,0 58,20Z', '#ff8a2b') + P('M-8,-24 Q4,-42 20,-26Z', '#ff8a2b') + E(0, 0, 40, 27, '#ff8a2b') + P('M-14,-25 Q-6,0 -14,26 L-3,27 Q6,0 -3,-26Z', W) + P('M18,-22 Q24,0 18,22 L27,18 Q32,0 27,-18Z', W) + C(-26, -6, 5.5, W) + C(-25, -6, 2.6, INK, NS) + P('M-38,6 Q-32,12 -26,10', 'none', 'stroke-width="2"') + P('M-4,12 Q8,24 18,16 Q6,10 -4,12Z', '#ff8a2b');
M.snowflake = (o) => { let s = ''; for (let i = 0; i < 6; i++) s += rot(i * 60, L(0, 0, 0, -46, 'stroke-width="4"') + P('M-9,-30 L0,-20 L9,-30', 'none', 'stroke-width="3.4"') + P('M-7,-42 L0,-34 L7,-42', 'none', 'stroke-width="3"')); return s.replace(/stroke-width="4"/g, `stroke="#5aa9e6" stroke-width="4"`) + C(0, 0, 6, '#eaf6ff'); };
M.dino = (o) => { const g = col(o, 'c', '#5fa86b'); let sp = ''; for (let i = 0; i < 5; i++) sp += POLY(`${-34 + i * 12},${-10 + i * -2} ${-28 + i * 12},${-24 + i * -2} ${-22 + i * 12},${-14 + i * -2}`, '#3f8a55', 'stroke-width="1.6"'); return P('M-58,30 Q-40,16 -22,-4 Q-8,-20 8,-22 Q16,-42 38,-42 Q56,-42 58,-28 Q60,-18 48,-16 L34,-14 Q36,-6 28,2 Q24,12 22,42 H4 Q8,24 2,14 Q-4,34 -8,42 H-26 Q-18,28 -22,18 Q-40,34 -58,30Z', g) + P('M-14,2 Q10,-6 28,2 Q20,24 2,24 Q-12,22 -14,2Z', '#a8d9a8', `fill-opacity=".7" ${NS}`) + C(38, -31, 3.6, INK, NS) + P('M32,-14 L36,-7 L40,-14 L44,-7 L48,-15', W, 'stroke-width="1.6"') + P('M24,-8 L36,0', 'none', 'stroke-width="3.4"') + sp; };
M.groundhog = (o) => E(0, 44, 46, 10, '#5a3b24') + E(0, 20, 32, 30, '#a9794a') + P('M-34,40 Q0,54 34,40 L34,48 Q0,60 -34,48Z', '#7a5538', NS) + C(0, -14, 23, '#a9794a') + C(-17, -32, 6.5, '#8a5f38') + C(17, -32, 6.5, '#8a5f38') + E(0, -6, 13, 10, '#ecd3ab') + C(0, -10, 3.6, INK, NS) + C(-11, -18, 3, INK, NS) + C(11, -18, 3, INK, NS) + R(-4, -2, 8, 7, W, 1.5, 'stroke-width="1.4"') + L(0, -2, 0, 5, 'stroke-width="1.2"') + C(-26, 30, 7, '#a9794a') + C(26, 30, 7, '#a9794a');
M.divingboard = (o) => R(-48, 26, 96, 28, '#4f9be8', 0, NS) + P('M-52,28 Q-40,20 -28,28 T-4,28 T20,28 T44,28 T58,28', 'none', 'stroke="#9ad0ff" stroke-width="3.4"') + R(-40, -22, 10, 60, '#aab6c4', 2) + L(-40, -6, -30, -6, 'stroke-width="1.6"') + L(-40, 10, -30, 10, 'stroke-width="1.6"') + R(-34, -30, 70, 9, '#e8553d', 3) + C(42, 14, 3, W, NS) + C(48, 6, 2.2, W, NS);
M.skate = (o) => P('M-24,-44 H2 L4,-14 Q30,-10 38,10 V22 H-24Z', '#fbfbf7') + P('M-24,-10 H4', 'none', 'stroke-width="1.8"') + L(-20, -26, 2, -26, 'stroke-width="1.6"') + L(-20, -18, 2, -18, 'stroke-width="1.6"') + R(-26, 22, 66, 6, '#8a96a6', 2) + L(-14, 28, -14, 36, 'stroke-width="3"') + L(28, 28, 28, 36, 'stroke-width="3"') + P('M-34,38 H44 Q54,38 52,28', 'none', 'stroke="#aab6c4" stroke-width="5"') + HL('M-20,-40 H-6 V-14 H-20Z');
M.hurdle = (o) => L(-30, 4, -38, 44, 'stroke-width="4.5"') + L(30, 4, 38, 44, 'stroke-width="4.5"') + L(-48, 44, -28, 44, 'stroke-width="4.5"') + L(28, 44, 48, 44, 'stroke-width="4.5"') + R(-38, -14, 76, 20, W, 3) + R(-38, -14, 19, 20, '#e8553d', 0, NS) + R(0, -14, 19, 20, '#e8553d', 0, NS) + R(-38, -14, 76, 20, 'none', 3);
M.highbar = (o) => R(-54, 36, 108, 16, '#4f8fd9', 5) + R(-46, -44, 7, 82, '#aab6c4', 2) + R(39, -44, 7, 82, '#aab6c4', 2) + L(-40, -26, 40, -26, 'stroke="#e8553d" stroke-width="5"') + L(-52, 36, 2, -52, 'stroke="#f2b24c" stroke-width="5.5"');
M.javelin = (o) => L(-52, 30, 40, -30, 'stroke="#8a5a35" stroke-width="5"') + L(-52, 30, 40, -30, 'stroke="#d9a46c" stroke-width="1.8"') + P('M40,-30 L58,-44 L50,-24Z', '#cfd8e3') + L(-6, 2, 6, -6, 'stroke="#e8553d" stroke-width="8"') + P('M-56,44 Q0,56 56,44', 'none', 'stroke="#9ad0ff" stroke-width="3"');
M.hand = (o) => { const sk = (o && o.g) || SKIN(o); return R(-14, -40, 11, 44, sk, 5.5) + R(-1.5, -50, 11, 54, sk, 5.5) + R(11, -42, 11, 46, sk, 5.5) + R(24, -32, 10, 38, sk, 5) + rot(-38, R(-40, -6, 12, 34, sk, 6), -34, 18) + R(-28, -6, 62, 52, sk, 18) + P('M-20,12 Q-6,24 6,12', 'none', 'stroke-width="1.6" opacity=".5"') + R(-28, 44, 62, 10, '#e8553d', 3); };
M.ribbon = (o) => L(-52, -18, -52, 40, 'stroke-width="4"') + L(52, -18, 52, 40, 'stroke-width="4"') + P('M-52,0 Q0,-18 52,0 L52,12 Q0,-6 -52,12Z', '#e8553d') + HL('M-40,0 Q0,-12 40,0 V2 Q0,-8 -40,2Z');
M.net = (o) => { let s = R(-50, -30, 100, 56, 'none', 2, 'stroke-width="3"'); for (let i = -40; i <= 40; i += 10) s += L(i, -30, i, 26, 'stroke-width="1.2" opacity=".55"'); for (let j = -20; j <= 20; j += 10) s += L(-50, j, 50, j, 'stroke-width="1.2" opacity=".55"'); return s; };
M.cone = (o) => P('M-18,38 L-6,-40 H6 L18,38Z', '#f08a3c') + P('M-13,10 H13 L15,20 H-15Z', W, NS) + R(-26, 36, 52, 8, '#d8741f', 3);
M.stairs = (o) => P('M-50,44 V24 H-30 V4 H-10 V-16 H10 V-36 H30 V44Z', '#cfd5de') + L(-30, 24, -30, 44, 'stroke-width="1.4"') + L(-10, 4, -10, 44, 'stroke-width="1.4"') + L(10, -16, 10, 44, 'stroke-width="1.4"');
M.spider = (o) => { let s = ''; for (let i = 0; i < 4; i++) { const y = -10 + i * 8; s += P(`M-8,${y} Q-30,${y - 24} -46,${y + 6 + i * 4}`, 'none', 'stroke-width="3"') + P(`M8,${y} Q30,${y - 24} 46,${y + 6 + i * 4}`, 'none', 'stroke-width="3"'); } return s + E(0, 14, 14, 18, '#2b3340') + C(0, -10, 10, '#2b3340') + P('M-6,18 L0,26 L6,18', '#e8553d', 'stroke-width="1.2"') + C(-4, -12, 2.4, W, NS) + C(4, -12, 2.4, W, NS); };
M.web = (o) => { let s = ''; const n = 8; for (let r = 1; r <= 4; r++) { const pts = []; for (let i = 0; i < n; i++) { const a = i * 2 * Math.PI / n; pts.push(f(Math.cos(a) * r * 12) + ',' + f(Math.sin(a) * r * 12)); } s += POLY(pts.join(' '), 'none', 'stroke="#eef2f7" stroke-width="2"'); } for (let i = 0; i < n; i++) { const a = i * 2 * Math.PI / n; s += L(0, 0, f(Math.cos(a) * 48), f(Math.sin(a) * 48), 'stroke="#eef2f7" stroke-width="2"'); } return s; };
M.jerseynum = (o) => M.jersey(o) + TXT(String((o && o.n) || '7'), 0, 24, 36, (o && o.d) || W, 'stroke="#1f2a3a" stroke-width="1.2"');
M.swimcap = (o) => P('M-36,10 Q-36,-34 0,-34 Q36,-34 36,10Z', col(o, 'c', '#f2b24c')) + R(-26, -4, 52, 11, '#2b3340', 5) + C(-12, 1.5, 4.5, '#9ad0ff') + C(12, 1.5, 4.5, '#9ad0ff') + P('M-48,18 Q-36,10 -24,18 T0,18 T24,18 T48,18', 'none', 'stroke="#4f9be8" stroke-width="4"') + HL('M-28,-6 Q-26,-26 -8,-30 Q-22,-22 -22,-6Z');
})(M8P);
(function (X) {
const { INK, NS, W, P, C, E, R, L, POLY, HL, SH, star, M } = X;
const col = (o, k, d) => (o && o[k]) || d;
const rot = (a, inner, cx, cy) => `<g transform="rotate(${a}${cx != null ? ',' + cx + ',' + cy : ''})">${inner}</g>`;
M.burj = (o) => P('M0,-60 L3,-36 L9,-36 L8,-18 L15,-18 L13,4 L21,4 L18,28 L27,28 L23,48 H-23 L-27,28 L-18,28 L-21,4 L-13,4 L-15,-18 L-8,-18 L-9,-36 L-3,-36Z', '#cfe0ee') + L(0, -60, 0, 48, 'stroke-width="1.2" opacity=".45"') + HL('M-2,-34 L-6,-18 L-12,4 L-16,28 L-20,46 L-14,46 L-10,28 L-6,4 L-2,-18Z');
M.bigben = (o) => P('M-12,-8 L-12,-34 L0,-60 L12,-34 L12,-8Z', '#7a8f9a') + R(-15, -14, 30, 66, '#d9b777', 2) + C(0, -22, 10, W) + L(0, -22, 0, -29, 'stroke-width="2"') + L(0, -22, 6, -22, 'stroke-width="2"') + [-6, 4, 14, 24, 34].map(y => R(-5, y + 4, 10, 6, '#a98c52', 1, 'stroke-width="1.2"')).join('') + R(-19, 50, 38, 6, '#a98c52', 2);
M.kingdom = (o) => P('M-18,52 L-11,-28 Q0,-50 11,-28 L18,52Z', '#8fb3cf') + P('M-6,-14 Q0,-30 6,-14 L6,8 L-6,8Z', '#e8f2fb') + L(0, -50, 0, -64, 'stroke-width="2"') + HL('M-14,48 L-8,-24 L-4,-30 L-10,50Z');
M.pisa = (o) => rot(8, R(-13, -46, 26, 92, '#f1ead8', 4) + [-30, -14, 2, 18, 34].map(y => L(-13, y, 13, y, 'stroke-width="1.8"')).join('') + R(-10, -58, 20, 14, '#f1ead8', 4) + R(-16, 46, 32, 6, '#bcae8a', 2) + [-36, -20, -4, 12, 28].map(y => [-7, 0, 7].map(x => `<path d="M${x - 2.6},${y + 12} v-6 a2.6,2.6 0 0 1 5.2,0 v6" fill="#7a6a4a" stroke="none"/>`).join('')).join(''), 0, 52);
M.opera = (o) => R(-52, 22, 104, 14, '#d8c9a8', 2) + P('M-48,22 Q-44,-30 -10,-40 Q-18,-8 -14,22Z', W) + P('M-10,22 Q-8,-20 22,-34 Q18,0 20,22Z', W) + P('M18,22 Q22,-10 46,-20 Q44,2 46,22Z', W) + L(-44, 10, -16, 8, 'stroke-width="1.2" opacity=".4"') + P('M-60,40 Q-40,32 -20,40 T20,40 T60,40', 'none', 'stroke="#4f9be8" stroke-width="4"');
M.burjarab = (o) => E(2, 50, 40, 8, '#e9d49a') + P('M-8,-60 Q46,-24 24,46 H-8Z', '#f4f6fa') + L(-8, -60, -8, 46, 'stroke-width="3.4"') + L(2, -34, 2, 44, 'stroke-width="1.2" opacity=".45"') + L(12, -22, 12, 44, 'stroke-width="1.2" opacity=".45"') + R(-12, 44, 36, 6, '#e8553d', 2);
M.goldengate = (o) => R(-30, -36, 9, 84, '#d9502e', 1) + R(22, -36, 9, 84, '#d9502e', 1) + R(-30, -10, 9, 3, '#a73d22', 0, NS) + R(22, -10, 9, 3, '#a73d22', 0, NS) + P('M-66,22 Q-26,-8 -26,-36 Q0,18 26,-36 Q26,-8 66,22', 'none', 'stroke="#d9502e" stroke-width="3.4"') + R(-66, 24, 132, 6, '#d9502e', 1) + P('M-66,44 Q-40,36 -14,44 T40,44 T66,44', 'none', 'stroke="#4f9be8" stroke-width="3.6"');
M.christ = (o) => P('M-5,-34 H5 L8,42 H-8Z', '#e9efe6') + R(-44, -28, 88, 9, '#e9efe6', 4) + C(0, -42, 8, '#e9efe6') + R(-18, 42, 36, 12, '#9aa6b5', 2) + R(-26, 54, 52, 6, '#7c8898', 2) + HL('M-2,-30 L-4,40 L-6,40 L-4,-30Z');
M.clocktower = (o) => R(-12, -26, 24, 80, '#d9d2c2', 2) + R(-22, -52, 44, 28, '#d9d2c2', 3) + C(0, -38, 11, W) + L(0, -38, 0, -46, 'stroke-width="2"') + L(0, -38, 7, -38, 'stroke-width="2"') + P('M-24,-52 L0,-66 L24,-52Z', '#6b7a4f') + [-12, 2, 16, 30].map(y => R(-4, y, 8, 8, '#8a96a6', 1, 'stroke-width="1.2"')).join('');
M.taj = (o) => R(-40, -20, 7, 54, '#f7f4ec', 2) + R(33, -20, 7, 54, '#f7f4ec', 2) + P('M-40,-20 H-33 L-36.5,-30Z', '#f7f4ec') + P('M33,-20 H40 L36.5,-30Z', '#f7f4ec') + R(-26, 2, 52, 32, '#f7f4ec', 3) + P('M-20,2 Q-20,-34 0,-40 Q20,-34 20,2Z', '#fdfcf8') + L(0, -40, 0, -52, 'stroke-width="2"') + P('M-6,34 V16 Q0,6 6,16 V34Z', '#8a96a6') + R(-48, 34, 96, 8, '#d8d2c0', 2);
})(M8P);
(function (X) {
const { INK, NS, W, P, C, E, R, L, POLY, HL, SH, star, M, f } = X;
const col = (o, k, d) => (o && o[k]) || d;
const rot = (a, inner, cx, cy) => `<g transform="rotate(${a}${cx != null ? ',' + cx + ',' + cy : ''})">${inner}</g>`;
const mv = (x, y, inner, s, a) => `<g transform="translate(${x},${y})${a ? ' rotate(' + a + ')' : ''}${s ? ' scale(' + s + ')' : ''}">${inner}</g>`;
M.duck = (o) =>
L(-6, 30, -8, 44, 'stroke="#e8923a" stroke-width="4.5" stroke-linecap="round"') + L(10, 30, 12, 44, 'stroke="#e8923a" stroke-width="4.5" stroke-linecap="round"') +
P('M-14,46 H2 M4,46 H20', 'none', 'stroke="#e8923a" stroke-width="4.5" stroke-linecap="round"') +
P('M-30,8 Q-26,-12 0,-14 Q24,-16 38,-8 L54,-18 L48,6 Q40,30 8,32 Q-24,34 -30,8Z', '#d7c7a6') +
P('M-30,8 Q-28,-4 -16,-8 L-10,24 Q-24,24 -30,8Z', '#8a5a35') +
P('M-2,2 Q18,-6 38,0 Q28,22 0,24 Q-8,12 -2,2Z', '#b3a07e') + P('M6,8 Q18,4 30,6', 'none', 'stroke-width="1.5" opacity=".5"') +
P('M-32,-4 Q-36,-24 -26,-32 L-10,-28 Q-14,-10 -12,-2Z', '#2c8a52') +
C(-26, -36, 14, '#2c8a52') + P('M-38,-20 Q-24,-12 -10,-22', 'none', 'stroke="#fff" stroke-width="3.2" stroke-linecap="round"') +
P('M-38,-40 Q-56,-38 -54,-30 Q-44,-27 -35,-31Z', '#f6b93b') + C(-24, -40, 2.3, INK, NS) + HL('M-16,-46 Q-6,-44 -4,-34 Q-10,-40 -18,-40Z');
M.gulp = (o) =>
P('M-34,50 Q-34,22 -14,16 L-14,6 Q-34,2 -34,-22 Q-34,-52 -4,-52 Q22,-52 24,-26 Q24,-14 20,-6 L28,2 L18,6 L18,16 Q40,22 40,50Z', '#f3c7a2') +
P('M-14,50 L-14,30 Q0,36 14,30 L14,50Z', '#fbfbf7', NS) + P('M-30,-30 Q-30,-52 -4,-52 Q16,-52 22,-34 Q6,-46 -16,-40 Q-28,-38 -30,-30Z', '#2b2b33') +
P('M2,12 Q8,10 12,14', 'none', 'stroke="#b8805b" stroke-width="2.4" stroke-linecap="round"') +
mv(14, 4, C(0, 0, 36, '#ffffff', 'stroke-width="3.2"') + C(0, 0, 36, 'none', 'stroke="#3a9cf0" stroke-width="1.6" stroke-dasharray="4 3" transform="scale(.86)"') +
R(-13, -30, 26, 62, '#f6a8a0', 13, 'stroke-width="2"') + R(-7, -28, 9, 58, '#ffd3ce', 4.5, NS) +
P('M0,-20 Q-9,-6 0,2 Q9,-6 0,-20Z', '#2f8fe8', 'stroke-width="2"') + P('M-4,-8 Q-4,-12 -1,-14', 'none', 'stroke="#fff" stroke-width="2" stroke-linecap="round"') +
P('M0,10 V24 M-7,18 L0,26 L7,18', 'none', 'stroke="#e8553d" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"'), 1) + P('M-6,-6 L-2,-2', 'none', 'stroke="none"');
M.ice = (o) => {
const cube = (x, y, a, s) => mv(x, y, R(-22, -22, 44, 44, '#bfe6fb', 8) + R(-14, -14, 28, 28, '#e3f4fd', 5, 'stroke-width="1.4" opacity=".9"') + HL('M-18,-16 Q-12,-20 -6,-20 L-8,-12 Q-14,-12 -16,-6Z') + P('M8,16 L18,16 L18,8', 'none', 'stroke="#7fb9dd" stroke-width="2" stroke-linecap="round"'), s, a);
return cube(-24, 22, -6, 1) + cube(26, 24, 8, .95) + cube(0, -20, 14, 1.0) +
P('M-46,-30 L-40,-26 L-34,-30 L-38,-24 L-34,-18 L-40,-22 L-46,-18 L-42,-24Z', '#fff', 'stroke-width="1.4"') + sparkle2(44, -34, 8) + sparkle2(-46, 0, 5);
};
const sparkle2 = (cx, cy, r) => P(`M${cx},${cy - r} Q${cx},${cy} ${cx + r},${cy} Q${cx},${cy} ${cx},${cy + r} Q${cx},${cy} ${cx - r},${cy} Q${cx},${cy} ${cx},${cy - r}Z`, '#fff', 'stroke-width="1.4"');
M.jasmine = (o) => {
let petals = '';
for (let i = 0; i < 8; i++) petals += rot(i * 45 + 8, E(0, -22, 10, 17, '#ffffff'), 0, 0);
let inner = '';
for (let i = 0; i < 6; i++) inner += rot(i * 60 + 28, E(0, -11, 6.5, 10.5, '#fffdf2', 'stroke-width="1.5"'), 0, 0);
return mv(0, 24, L(0, 0, 0, 34, 'stroke="#3d8a45" stroke-width="5" stroke-linecap="round"') + P('M0,22 Q-30,8 -42,26 Q-18,38 0,22Z', '#5bb35c') + P('M0,28 Q26,12 40,30 Q18,42 0,28Z', '#4aa04f'), 1) +
mv(0, -2, petals + inner + C(0, 0, 6.5, '#f6c93b', 'stroke-width="1.6"') + C(-2, -2, 2, '#fff3b0', NS), 1);
};
M.demolish = (o) =>
R(2, -34, 50, 82, '#c9a98a', 2) + P('M2,-34 L16,-26 L24,-38 L34,-24 L44,-36 L52,-30 V-20 L40,-14 L26,-22 L12,-10 L2,-16Z', '#fff', NS) +
P('M2,-34 H20 L30,-26 L24,-14 L38,-8 L52,-18 V-34 H46 L40,-44 L30,-34 L20,-46 L10,-34Z', '#a98767', 'transform="translate(0,6)"') +
[[8, -20], [28, -20], [8, 2], [28, 2], [8, 24], [28, 24]].map(([x, y]) => R(x, y, 14, 14, '#8fc3e8', 2, 'stroke-width="1.8"')).join('') +
P('M4,-34 L10,-26 L6,-18', 'none', 'stroke-width="2"') +
R(-54, 34, 64, 12, '#6b5a4a', 2) + R(-52, 24, 34, 12, '#f6c93b', 3) + C(-46, 46, 6, '#333', 'stroke-width="1.5"') + C(-26, 46, 6, '#333', 'stroke-width="1.5"') +
L(-44, 24, -20, -46, 'stroke="#f6c93b" stroke-width="7" stroke-linecap="round"') + L(-44, 24, -20, -46, 'stroke="#c9a02a" stroke-width="2" stroke-linecap="round"') +
L(-20, -46, -20, -14, 'stroke="#4a4a52" stroke-width="2.2" stroke-dasharray="3 2"') + C(-20, -3, 13, '#3a3f4a', 'stroke-width="2.4"') + HL('M-28,-8 Q-26,-14 -20,-14 Q-26,-12 -28,-4Z') +
[[-6, -4, 5], [58, 16, 4], [60, -2, 3], [56, 34, 5]].map(([x, y, r]) => R(x, y, r * 2, r * 1.8, '#b08f70', 1, 'stroke-width="1.4"')).join('') +
C(60, 44, 9, '#e9e4dc', 'stroke-width="1.4" opacity=".9"') + C(48, 50, 7, '#e9e4dc', 'stroke-width="1.4" opacity=".9"');
M.oil = (o) =>
P('M-18,-4 Q-18,-14 -8,-20 V-34 H8 V-20 Q18,-14 18,-4 V44 Q18,50 12,50 H-12 Q-18,50 -18,44Z', '#e6b422') +
R(-9, -44, 18, 12, '#f2efe6', 3) + R(-8, -40, 16, 3, '#cfc9ba', 1, NS) +
R(-18, 6, 36, 28, '#fff7dc', 0, 'stroke-width="1.6"') + P('M0,10 Q-8,20 0,26 Q8,20 0,10Z', '#e6b422', 'stroke-width="1.6"') +
HL('M-14,-2 Q-14,-10 -8,-14 L-8,40 Q-14,40 -14,34Z') + P('M30,-4 Q20,12 30,22 Q40,12 30,-4Z', '#f2c230') + HL('M26,6 Q26,2 30,0 Q28,6 28,10Z');
M.one = (o) => R(-38, -40, 76, 80, col(o, 'c', '#3a7bd5'), 16) + HL('M-30,-32 Q-14,-36 4,-36 L2,-30 Q-18,-30 -30,-24Z') +
P('M-16,-18 L6,-30 H14 V28 H0 V-8 L-12,-2Z', '#ffffff', 'stroke-width="2"') + R(-14, 28, 34, 6, '#ffffff', 2, 'stroke-width="1.6"');
M.seeds = (o) => {
const seed = (x, y, a, c) => mv(x, y, P('M-9,0 Q-3,-6 9,-2 Q4,2 -9,0Z', c, 'stroke-width="1.5"') + P('M-9,0 Q-3,2 9,-2', 'none', 'stroke="#555" stroke-width="1" opacity=".7"'), 1.2, a);
const pile = [[-26, 4, -10], [-10, -4, 20], [8, -6, -20], [24, 2, 10], [-18, -14, 30], [0, -16, -5], [16, -16, 25], [-30, -8, -30], [30, -10, -15], [-6, -26, 10], [10, -28, -25], [-22, 6, 40], [18, 8, -40], [0, 4, 0]];
return P('M-46,-4 H46 Q44,40 0,44 Q-44,40 -46,-4Z', '#b8834e') + R(-48, -10, 96, 10, '#9a6b3c', 4) +
pile.map(([x, y, a], i) => seed(x, y - 2, a, i % 3 === 0 ? '#3d3d3d' : (i % 3 === 1 ? '#f4efe0' : '#cfc8b4'))).join('') +
P('M-38,8 Q-30,30 -10,34', 'none', 'stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"') + seed(58, 24, 20, '#f4efe0') + seed(-58, 28, -20, '#3d3d3d');
};
M.naan = (o) =>
P('M-48,6 Q-46,-30 -6,-40 Q36,-48 50,-8 Q56,28 12,40 Q-44,50 -48,6Z', '#e9b565') + P('M-48,6 Q-46,-30 -6,-40 Q36,-48 50,-8', 'none', 'stroke="#c98a3d" stroke-width="3" opacity=".7"') +
[[-24, -6, 7], [10, -18, 6], [26, 6, 8], [-6, 18, 6], [-30, 20, 4], [20, 26, 4], [0, -2, 4]].map(([x, y, r]) => E(x, y, r, r * .8, '#a35f24', 'stroke-width="1.2"')).join('') +
[[-14, -22], [30, -14], [-34, 4], [4, 6], [34, 22], [-14, 30]].map(([x, y]) => C(x, y, 1.8, '#fff3cc', NS)).join('') +
P('M-30,-24 Q-10,-34 16,-34', 'none', 'stroke="#fff" stroke-width="4" opacity=".4" stroke-linecap="round"');
M.hill = (o) =>
P('M-62,46 Q-52,-6 -10,-24 Q34,-34 64,46Z', '#79c05a') + P('M-62,46 Q-52,-6 -10,-24 Q-30,10 -28,46Z', '#4e9a3c', NS + ' opacity=".55"') +
HL('M-36,6 Q-20,-14 -2,-20 Q-16,-4 -30,12Z') +
[[-34, 18], [-20, 30], [26, 14], [44, 30], [12, -18]].map(([x, y]) => P(`M${x - 3},${y} L${x},${y - 7} L${x + 3},${y} M${x - 6},${y} L${x - 4},${y - 5}`, 'none', 'stroke="#2f7a2c" stroke-width="2" stroke-linecap="round"')).join('') +
C(-26, 40, 5, '#9aa3ad', 'stroke-width="1.6"') + C(40, 40, 4, '#9aa3ad', 'stroke-width="1.6"');
M.runner = (o) => {
const sk = '#dba57d';
return L(-56, -20, -40, -20, 'stroke="#7fb3ee" stroke-width="3.5" stroke-linecap="round"') + L(-60, -4, -42, -4, 'stroke="#7fb3ee" stroke-width="3.5" stroke-linecap="round"') + L(-54, 12, -38, 12, 'stroke="#7fb3ee" stroke-width="3.5" stroke-linecap="round"') +
P('M2,-10 L26,38 L16,44 L-6,10 L-22,34 L-32,26 L-8,-8Z', '#2f4d8f') + // legs back
P('M24,38 L40,40 L36,48 L18,46Z', '#f2efe6') + P('M-30,28 L-18,36 L-26,44 L-38,34Z', '#f2efe6') +
P('M-8,-34 Q6,-38 20,-30 L14,8 Q-2,10 -10,4Z', '#e8553d') + // torso
P('M16,-26 Q34,-22 46,-34 L50,-26 Q36,-8 14,-14Z', '#e8553d') + P('M44,-34 L52,-40 L54,-30Z', sk) + // forward arm
P('M-6,-26 Q-22,-14 -34,-26 L-30,-34 Q-16,-30 -6,-38Z', '#e8553d') + P('M-32,-30 L-40,-34 L-38,-24Z', sk) +
C(8, -50, 14, sk) + P('M-6,-52 Q-6,-66 8,-66 Q22,-66 22,-50 Q10,-58 -6,-52Z', '#2b2b33') +
P('M30,-60 Q34,-66 36,-58 Q34,-54 30,-60Z', '#7fc8f8', 'stroke-width="1.4"') + P('M-8,-62 Q-14,-70 -10,-64', 'none') +
P('M50,-54 V-44 M50,-40 V-38', 'none', 'stroke="#e8553d" stroke-width="4" stroke-linecap="round"');
};
M.sheep = (o) =>
L(-18, 24, -18, 44, 'stroke="#3b3b45" stroke-width="6" stroke-linecap="round"') + L(-4, 26, -4, 44, 'stroke="#3b3b45" stroke-width="6" stroke-linecap="round"') + L(14, 26, 14, 44, 'stroke="#3b3b45" stroke-width="6" stroke-linecap="round"') + L(28, 24, 28, 44, 'stroke="#3b3b45" stroke-width="6" stroke-linecap="round"') +
[[-8, 4, 22], [14, -2, 22], [30, 8, 18], [-26, 10, 17], [4, 14, 20], [20, 18, 17], [-18, -8, 15], [36, -4, 12], [-2, -14, 14]].map(([x, y, r]) => C(x, y, r, '#fbfbf7')).join('') +
E(-44, -6, 15, 18, '#3b3b45', 'transform="rotate(-18 -44 -6)"') + E(-34, -22, 10, 5, '#3b3b45', 'transform="rotate(-30 -34 -22)"') + E(-56, -24, 7, 4, '#4a4a55', 'transform="rotate(30 -56 -24)"') +
C(-45, -10, 2, '#fff', NS) + P('M-52,4 Q-46,10 -40,4', 'none', 'stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"') +
C(-26, -18, 11, '#fbfbf7') + HL('M-14,-18 Q-4,-26 8,-22 Q-4,-16 -12,-10Z');
M.horn = (o) =>
P('M-30,50 Q-48,-6 -10,-34 Q22,-54 46,-30 Q18,-40 2,-22 Q-18,-4 -4,50Z', '#ecd9ac') +
P('M-30,50 Q-48,-6 -10,-34 Q22,-54 46,-30', 'none', 'stroke="#b58b45" stroke-width="2.4"') +
[[-33, 36, -9, 40], [-37, 20, -12, 24], [-36, 4, -10, 6], [-29, -10, -6, -8], [-18, -22, 4, -16], [-4, -32, 12, -24]].map(([x1, y1, x2, y2]) => P(`M${x1},${y1} Q${(x1 + x2) / 2},${(y1 + y2) / 2 - 4} ${x2},${y2}`, 'none', 'stroke="#b58b45" stroke-width="2.2" stroke-linecap="round"')).join('') +
R(-36, 44, 36, 8, '#8f6a3a', 2) + HL('M-26,-6 Q-14,-26 8,-34 Q-8,-20 -18,-2Z') + P('M46,-30 Q40,-36 36,-34', 'none', 'stroke="#fff" stroke-width="2" opacity=".6"');
M.wheat = (o) => {
const ear = (x, y, a, s) => mv(x, y, L(0, 0, 0, 56, 'stroke="#c9a02a" stroke-width="3.6" stroke-linecap="round"') +
[0, 1, 2, 3, 4].map(i => E(-6, -8 - i * 9, 4.6, 8, '#f1c84a', `transform="rotate(-24 -6 ${-8 - i * 9})" stroke-width="1.4"`) + E(6, -8 - i * 9 - 2, 4.6, 8, '#e8b937', `transform="rotate(24 6 ${-8 - i * 9 - 2})" stroke-width="1.4"`)).join('') +
E(0, -54, 4.4, 9, '#f1c84a', 'stroke-width="1.4"') + L(0, -62, 0, -80, 'stroke="#c9a02a" stroke-width="1.6" stroke-linecap="round"') +
[-1, 1].map(sx => [0, 1, 2, 3, 4].map(i => L(sx * 9, -12 - i * 9, sx * 17, -34 - i * 9, 'stroke="#c9a02a" stroke-width="1.2" stroke-linecap="round" opacity=".8"')).join('')).join(''), s, a);
return ear(-26, 20, -12, .78) + ear(26, 22, 12, .78) + ear(0, 32, 0, .92) + P('M-30,48 Q0,36 30,48 L26,56 Q0,46 -26,56Z', '#c0392b', 'stroke-width="1.6"') + P('M-8,44 Q0,36 8,44', 'none', 'stroke="#fff" stroke-width="1.5" opacity=".6"');
};
M.can = (o) =>
R(-24, -34, 48, 74, col(o, 'c', '#e03a3a'), 7) + R(-24, -34, 48, 10, '#cfd6de', 5) + R(-24, 31, 48, 9, '#cfd6de', 5) + R(-22, -24, 44, 6, '#aab3bd', 0, NS) +
P('M-24,-2 Q-12,-14 0,-2 T24,-2 V14 Q12,2 0,14 T-24,14Z', '#fff', NS) +
C(0, -36, 7, '#aab3bd', 'stroke-width="1.6"') + P('M-4,-40 Q0,-46 6,-42', 'none', 'stroke-width="2" stroke-linecap="round"') +
HL('M-19,-20 Q-19,-26 -14,-26 L-14,28 Q-19,28 -19,24Z');
M.henna = (o) => {
const sk = '#f3c7a2', hn = '#9a3b1c';
return R(-34, -4, 56, 56, sk, 18) + R(-36, -42, 13, 48, sk, 6.5) + R(-21, -52, 13, 58, sk, 6.5) + R(-6, -54, 13, 60, sk, 6.5) + R(9, -48, 13, 54, sk, 6.5) +
P('M22,28 Q40,18 44,4 Q36,2 28,10Z', sk) +
[[-29.5, -36], [-14.5, -46], [0.5, -48], [15.5, -42]].map(([x, y]) => [0, 1, 2].map(i => C(x, y + 12 + i * 11, 1.8, hn, NS)).join('')).join('') +
C(-6, 22, 4, hn, NS) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => rot(i * 45, E(-6, 11, 3.4, 7, hn, NS), -6, 22)).join('') +
P('M-26,40 Q-14,30 -6,40 Q2,30 14,40', 'none', `stroke="${hn}" stroke-width="2.4" stroke-linecap="round"`) + P('M-28,4 Q-18,0 -14,10', 'none', `stroke="${hn}" stroke-width="2" stroke-linecap="round"`) +
mv(54, 28, P('M-10,-30 L10,-30 L4,26 L0,40 L-4,26Z', '#d9b27c', 'stroke-width="2.2"') + R(-11, -36, 22, 8, '#f6c93b', 3) + P('M0,40 L0,48', 'none', `stroke="${hn}" stroke-width="4" stroke-linecap="round"`), 0.72, -10);
};
M.blood = (o) => {
const drop = (x, y, s, a) => mv(x, y, P('M0,-44 Q-4,-26 -26,-6 Q-38,8 -26,28 Q-14,44 0,44 Q14,44 26,28 Q38,8 26,-6 Q4,-26 0,-44Z', '#d92b2b') + HL('M-18,6 Q-20,-4 -10,-16 Q-8,-4 -12,10Z') + P('M-16,28 Q-8,38 4,38', 'none', 'stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"'), s, a);
return drop(0, 0, 1, 0) + drop(-44, 28, .36, -14) + drop(44, 14, .46, 14);
};
M.mother = (o) => {
const sk = '#f3c7a2', hj = '#8b6fd6';
return P('M-38,60 Q-40,18 -18,10 L-8,5 H8 L18,10 Q40,18 38,60Z', '#a58be0') + P('M-26,12 Q0,34 26,12 Q20,2 0,6 Q-20,2 -26,12Z', hj, NS) + // dress + hijab drape
R(-6.5, -13, 13, 14, sk, 3) + E(0, -29, 15, 17, sk) + P('M-23,-26 Q-26,-58 0,-58 Q26,-58 23,-26 Q30,0 34,14 Q0,28 -34,14 Q-30,0 -23,-26Z', hj) + E(0, -27, 12.5, 15, sk, NS) + P('M-14,-30 Q0,-40 14,-30', 'none', 'stroke="#6f55c0" stroke-width="1.4" opacity=".5"') +
P('M-30,34 Q0,52 36,36 L40,48 Q4,66 -34,48Z', '#a58be0') +
mv(18, 34, P('M-18,6 Q-14,-18 4,-20 Q22,-18 24,6 Q10,20 -18,6Z', '#ffffff') + C(2, -26, 11, sk) + P('M-8,-30 Q2,-40 12,-30 Q4,-34 -8,-30Z', '#3b3b45') + P('M-12,-4 Q4,4 20,-4', 'none', 'stroke="#f0b8c4" stroke-width="3" stroke-linecap="round"'), 1, -6) ;
};
M.tick = (o) => C(0, 0, 46, '#3fb97a') + C(0, 0, 38, 'none', 'stroke="#fff" stroke-width="2.4" opacity=".6"') +
P('M-22,2 L-6,20 L24,-18', 'none', 'stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"') +
HL('M-34,-18 Q-24,-34 -4,-38 Q-24,-28 -30,-8Z') + sparkle2(48, -40, 9) + sparkle2(-50, 36, 6);
M.meltice = (o) =>
P('M-22,-2 L0,56 L22,-2Z', '#e0a45a') + [[-12, 8, 8, -8], [-4, 24, 14, 12], [-14, 22, 6, 8]].map(([x1, y1, x2, y2]) => L(x1, y1, x2, y2, 'stroke="#c98a3d" stroke-width="1.6"')).join('') +
P('M-34,-4 Q-34,-26 -10,-30 Q-6,-48 12,-44 Q30,-42 30,-26 Q38,-20 36,-6 Q40,10 34,22 Q30,32 26,22 Q24,10 22,6 Q20,22 14,26 Q10,14 8,6 L-20,6 Q-22,18 -28,18 Q-34,10 -34,-4Z', '#f48fb1') +
C(-8, -22, 3, '#fff', NS) + HL('M-26,-12 Q-26,-22 -14,-26 Q-22,-16 -22,-6Z') + C(14, -28, 3.4, '#c2185b', NS) + C(22, -14, 3.4, '#c2185b', NS) + C(-14, -6, 3.4, '#c2185b', NS) +
P('M28,22 Q31,34 28,40 Q24,34 28,22Z', '#f48fb1', 'stroke-width="1.6"') + E(20, 50, 28, 6, '#f8bbd0', 'stroke-width="1.8"') +
[[-48, -30], [-54, -12], [48, -34], [54, -16]].map(([x, y], i) => P(`M${x},${y} q${i % 2 ? 6 : -6},-10 0,-20`, 'none', 'stroke="#f6a21a" stroke-width="3" stroke-linecap="round"')).join('');
M.touch = (o) =>
R(-40, -44, 80, 88, '#2b3340', 12) + R(-34, -38, 68, 76, '#9fd0ff', 7) +
C(-4, -6, 30, 'none', 'stroke="#fff" stroke-width="3" opacity=".8"') + C(-4, -6, 20, 'none', 'stroke="#fff" stroke-width="3" opacity=".6"') + C(-4, -6, 10, '#ffffff', 'stroke-width="1.4"') +
P('M2,52 L-6,14 Q-8,6 -2,2 Q4,0 7,8 L10,20 L16,18 Q26,18 30,26 L36,52Z', '#f3c7a2', 'stroke-width="2.6"') + P('M7,8 L10,20', 'none', 'stroke-width="1.6" opacity=".5"') +
P('M20,26 L22,38 M28,30 L30,40', 'none', 'stroke-width="1.6" opacity=".5"') + HL('M-1,12 Q-3,6 0,4 Q-2,10 2,18Z');
M.grandpa = (o) => {
const sk = '#dba57d';
return P('M-36,64 Q-36,16 -20,8 L-9,2 H9 L20,8 Q36,16 36,64Z', '#fbfbf7') + L(0, 4, 0, 34, 'stroke-width="1.6"') + C(0, 34, 1.6, INK, NS) +
P('M-24,-30 Q-26,-60 0,-60 Q26,-60 24,-30 L36,8 Q0,22 -36,8 Z', '#ffffff') + R(-6.5, -14, 13, 16, sk, 3) + E(0, -30, 15, 17.5, sk) + E(-15, -29, 3, 4.5, sk, 'stroke-width="1.8"') + E(15, -29, 3, 4.5, sk, 'stroke-width="1.8"') +
P('M-17,-40 Q0,-54 17,-40 L17,-45 Q0,-61 -17,-45Z', '#ffffff') + E(0, -52, 17, 4.6, 'none', 'stroke-width="4.5" stroke="#1b1b22"') +
P('M-13,-24 Q0,-14 13,-24 Q18,-4 0,6 Q-18,-4 -13,-24Z', '#f4f4f4', 'stroke-width="1.8"') + P('M-6,-20 Q0,-16 6,-20', 'none', 'stroke="#c9c9c9" stroke-width="1.4"') +
P('M-38,10 L-40,70', 'none', 'stroke="#8a5a35" stroke-width="5" stroke-linecap="round"') + P('M-38,10 Q-38,0 -48,4', 'none', 'stroke="#8a5a35" stroke-width="5" stroke-linecap="round"') + C(-37, 22, 6, sk, 'stroke-width="2"');
};
M.beans = (o) => {
const bean = (x, y, a, s) => mv(x, y, E(0, 0, 18, 12, '#6b3f26') + P('M-14,-2 Q-4,-8 0,0 Q4,8 14,2', 'none', 'stroke="#2e1708" stroke-width="2.4" stroke-linecap="round"') + HL('M-12,-5 Q-6,-10 2,-9 Q-6,-4 -12,-2Z'), s, a);
return bean(-26, 18, -24, 1.15) + bean(12, 28, 12, 1.15) + bean(30, -2, 40, 1.1) + bean(-8, -4, -4, 1.15) + bean(-34, -24, 24, 1.05) + bean(6, -34, -20, 1.05) + bean(34, -34, 30, .95) + bean(-52, 8, 5, .8);
};
M.dew = (o) =>
P('M-52,32 Q-46,-34 6,-44 Q54,-40 56,6 Q40,48 -14,44 Q-34,42 -52,32Z', '#58b85c') + P('M-52,32 Q-6,10 56,6', 'none', 'stroke="#2f8a3b" stroke-width="2.4"') + P('M-34,14 L-24,-14 M-12,10 L-2,-24 M12,6 L26,-20 M-22,26 L-16,40 M10,24 L12,40', 'none', 'stroke="#2f8a3b" stroke-width="1.6" stroke-linecap="round" opacity=".7"') +
[[-18, -8, 11], [14, -18, 9], [30, 14, 12], [-30, 24, 8], [4, 22, 8]].map(([x, y, r]) => C(x, y, r, '#bfe8ff', 'stroke-width="2"') + C(x - r * .3, y - r * .3, r * .3, '#fff', NS) + P(`M${x - r * .6},${y + r * .4} Q${x},${y + r * .9} ${x + r * .6},${y + r * .4}`, 'none', 'stroke="#fff" stroke-width="1.4" opacity=".6"')).join('') +
mv(54, -34, C(0, 0, 14, '#ffd86a', 'stroke-width="2"') + [0, 1, 2, 3, 4, 5, 6, 7].map(i => rot(i * 45, L(0, -18, 0, -25, 'stroke="#f6b93b" stroke-width="3" stroke-linecap="round"'), 0, 0)).join(''), .8);
M.gel = (o) =>
R(-34, -2, 68, 52, '#2f7fe0', 12) + R(-30, 4, 60, 40, '#5aa9f5', 9, NS) + HL('M-26,8 Q-24,2 -14,2 L-16,38 Q-26,36 -26,30Z') +
R(-38, -22, 76, 24, '#f6f6f6', 8) + L(-30, -14, -30, -4, 'stroke="#d0d0d0" stroke-width="2"') + L(-14, -14, -14, -4, 'stroke="#d0d0d0" stroke-width="2"') + L(2, -14, 2, -4, 'stroke="#d0d0d0" stroke-width="2"') + L(18, -14, 18, -4, 'stroke="#d0d0d0" stroke-width="2"') + L(30, -14, 30, -4, 'stroke="#d0d0d0" stroke-width="2"') +
R(-22, 14, 44, 18, '#ffffff', 5, 'stroke-width="1.6"') + P('M-12,26 Q-4,16 4,26 Q10,18 14,24', 'none', 'stroke="#2f7fe0" stroke-width="2.4" stroke-linecap="round"') +
P('M-6,-40 Q-4,-52 8,-52 Q22,-52 20,-40 Q24,-34 16,-30 Q6,-26 -4,-30 Q-10,-34 -6,-40Z', '#7bbcff', 'stroke-width="2"') + P('M-2,-44 Q4,-48 12,-46', 'none', 'stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"') ;
M.winner = (o) => {
const sk = '#dba57d';
return P('M-36,66 Q-36,18 -20,10 L-9,4 H9 L20,10 Q36,18 36,66Z', '#1f9d6a') + P('M-9,4 L0,16 L9,4', 'none', 'stroke="#fff" stroke-width="3"') + L(-14, 16, -14, 66, 'stroke="#fff" stroke-width="3"') +
P('M-22,12 Q-40,-6 -30,-50', 'none', 'stroke="#1f9d6a" stroke-width="13" stroke-linecap="round"') + P('M22,12 Q40,-6 30,-50', 'none', 'stroke="#1f9d6a" stroke-width="13" stroke-linecap="round"') +
C(-30, -54, 8, sk) + C(30, -54, 8, sk) +
R(-6.5, -13, 13, 16, sk, 3) + E(0, -29, 15, 17.5, sk) + P('M-16,-30 Q-19,-54 0,-54 Q19,-54 16,-30 Q13,-42 0,-43 Q-13,-42 -16,-30Z', '#2b2b33') +
mv(0, -78, P('M-14,-14 H14 Q14,6 0,10 Q-14,6 -14,-14Z', '#f6b93b') + P('M-14,-10 Q-26,-10 -22,2 Q-18,8 -10,6 M14,-10 Q26,-10 22,2 Q18,8 10,6', 'none', 'stroke-width="2.4"') + R(-3, 8, 6, 8, '#f6b93b', 0) + R(-10, 16, 20, 6, '#c98a1a', 2) + HL('M-9,-12 Q-9,-4 -4,2 Q-10,-2 -10,-10Z'), 1.15) +
[[-50, -70, '#e8553d'], [48, -84, '#3a7bd5'], [52, -56, '#f6b93b'], [-48, -40, '#8b6fd6'], [-6, -104, '#3fb97a']].map(([x, y, c], i) => R(x, y, 7, 4, c, 1, `transform="rotate(${i * 35} ${x} ${y})" stroke-width="1"`)).join('');
};
M.yen = (o) => C(0, 0, 46, '#f6b93b') + C(0, 0, 38, 'none', 'stroke="#b8861a" stroke-width="2.4"') +
P('M-18,-24 L0,0 L18,-24 M0,0 V26 M-14,-6 H14 M-14,8 H14', 'none', 'stroke="#8a5f0f" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"') +
HL('M-36,-14 Q-30,-32 -10,-40 Q-28,-28 -32,-6Z') + sparkle2(50, -38, 8);
})(M8P);
(function (X) {
const { INK, NS, W, P, C, E, R, L, POLY, HL, SH, star, M, f } = X;
const ST = (w) => `stroke-width="${w}"`;
const rows = (n, x0, x1, y0, dy, fn) => { let s = ''; for (let i = 0; i < n; i++) s += fn(i, y0 + i * dy, x0, x1); return s; };
M.stad_bernabeu = (o) => {
let s = P('M-58,40 L-58,6 Q-58,-8 -42,-12 L42,-12 Q58,-8 58,6 L58,40Z', '#c7d1dd');
for (let x = -54; x <= 54; x += 7) s += L(x, -10, x, 40, ST(0.9) + ' opacity=".5"');
for (let y = 2; y <= 34; y += 8) s += P(`M-58,${y} H58`, 'none', ST(0.9) + ' opacity=".45"');
s += HL('M-50,-8 L-34,-8 L-46,38 L-58,38Z') + HL('M14,-8 L24,-8 L12,38 L2,38Z') + HL('M42,-8 L50,-8 L44,38 L36,38Z');
s += R(-58, 26, 116, 6, '#8b5cf6', 0, NS);
[-38, -10, 18, 44].forEach(x => { s += P(`M${x - 6},40 V31 Q${x},23 ${x + 6},31 V40Z`, '#2b3b52'); });
s += P('M-64,-12 Q0,-44 64,-12 L58,0 Q0,-26 -58,0Z', W);
s += P('M-46,-14 Q0,-32 46,-14 L40,-9 Q0,-24 -40,-9Z', '#5aa96b');
s += L(-64, -12, -58, 0) + L(64, -12, 58, 0);
s += P('M-58,0 Q0,-26 58,0', 'none', ST(2.6) + ' stroke="#9aa9bb"');
return s;
};
M.stad_campnou = (o) => {
let s = E(0, 10, 60, 32, '#aab4c2');
s += E(0, 8, 56, 28, '#004d98') + E(0, 8, 47, 22, '#a50044') + E(0, 8, 38, 17, '#004d98');
for (let i = 0; i < 28; i++) {
const a = i / 28 * Math.PI * 2; const c = Math.cos(a), sn = Math.sin(a);
s += L(f(c * 38), f(8 + sn * 17), f(c * 56), f(8 + sn * 28), ST(0.8) + ' stroke="#fff" opacity=".35"');
}
s += E(0, 8, 28, 11, '#4fa862') + E(0, 8, 28, 11, 'none') + L(0, -3, 0, 19, `stroke="${W}" stroke-width="1.6"`) + E(0, 8, 6, 3, 'none', `stroke="${W}" stroke-width="1.4"`);
s += P('M-60,10 Q-60,42 0,44 Q60,42 60,10 Q60,34 0,36 Q-60,34 -60,10Z', '#d7dde6');
for (let x = -46; x <= 46; x += 12) s += P(`M${x - 3},39 V32 Q${x},28 ${x + 3},32 V39Z`, '#2b3b52', NS);
s += HL('M-52,16 Q-40,30 -20,34 Q-40,28 -50,12Z');
return s;
};
M.stad_oldtrafford = (o) => {
let s = R(-56, 2, 112, 40, '#b91c1c', 2);
s += rows(5, -56, 56, 8, 7, (i, y) => R(-56, y, 112, 4, i % 2 ? '#dc2626' : '#991b1b', 0, NS) + [...Array(12)].map((_, k) => C(-50 + k * 9.5, y + 2, 1.1, '#fff', NS)).join(''));
s += P('M-56,2 L-56,40 M56,2 L56,40', 'none', ST(2.4));
s += R(-9, 30, 18, 12, '#1f2937', 2);
s += P('M-62,-18 L62,-18 L56,2 L-56,2Z', W);
for (let x = -52; x <= 52; x += 13) s += L(x, -18, x - 4, 2, ST(1.4) + ' stroke="#8896a8"') + L(x, -18, x + 9, 2, ST(1.1) + ' stroke="#8896a8" opacity=".7"');
s += P('M-62,-18 L62,-18', 'none', ST(3));
[-48, -16, 16, 48].forEach(x => { s += L(x, -18, x, -30, ST(2.2)) + R(x - 6, -36, 12, 7, '#fde68a', 1.5); });
s += L(-62, -18, -62, -42, ST(2.4)) + P('M-62,-42 L-44,-37 L-62,-31Z', '#dc2626');
return s;
};
M.stad_wembley = (o) => {
let s = P('M-58,40 L-58,14 Q-58,6 -46,4 L46,4 Q58,6 58,14 L58,40Z', '#dfe5ec');
s += P('M-62,14 Q0,-2 62,14 L58,22 Q0,6 -58,22Z', '#b6c1cf');
for (let x = -52; x <= 52; x += 8) s += L(x, 20, x, 40, ST(0.9) + ' opacity=".45"');
s += HL('M-52,26 L-30,26 L-36,38 L-54,38Z');
s += R(-58, 32, 116, 4, '#3b82f6', 0, NS);
const d = 'M-52,10 Q-6,-112 56,6';
s += P(d, 'none', `stroke="${INK}" stroke-width="12" stroke-linecap="round"`);
s += P(d, 'none', 'stroke="#ffffff" stroke-width="8.5" stroke-linecap="round"');
for (let t = 0.06; t < 0.97; t += 0.07) {
const x = (1 - t) * (1 - t) * -52 + 2 * (1 - t) * t * -6 + t * t * 56;
const y = (1 - t) * (1 - t) * 10 + 2 * (1 - t) * t * -112 + t * t * 6;
s += L(f(x - 3), f(y - 3), f(x + 3), f(y + 3), ST(1.2) + ' stroke="#7e8da1"');
}
s += P(d, 'none', 'stroke="#ffffff" stroke-width="2" stroke-opacity=".8" transform="translate(-1.5,-1.5)"');
[-30, -8, 14, 34].forEach(x => { s += L(x, x === -30 ? -28 : x === -8 ? -36 : x === 14 ? -30 : -14, x, 6, ST(1) + ' opacity=".55"'); });
return s;
};
M.stad_maracana = (o) => {
let s = E(0, 22, 58, 22, '#e5d6b8');
s += P('M-58,22 L-58,36 Q0,52 58,36 L58,22 Q0,40 -58,22Z', '#cdbb94');
for (let i = 0; i < 14; i++) { const x = -52 + i * 8; s += P(`M${x - 2},41 V36 Q${x},33 ${x + 2},36 V41Z`, '#5b4a2e', NS); }
s += E(0, 8, 60, 26, W) + E(0, 8, 60, 26, 'none');
s += E(0, 9, 38, 14, '#5aa96b') + L(0, -4, 0, 22, `stroke="${W}" stroke-width="1.4"`);
for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; s += L(f(Math.cos(a) * 38), f(9 + Math.sin(a) * 14), f(Math.cos(a) * 60), f(8 + Math.sin(a) * 26), ST(1) + ' stroke="#8896a8" opacity=".75"'); }
s += E(0, 8, 60, 26, 'none', 'stroke="#facc15" stroke-width="3.2"');
s += HL('M-52,0 Q-30,-14 -6,-17 Q-30,-8 -48,6Z');
return s;
};
M.stad_allianz = (o) => {
let s = E(0, 8, 66, 40, '#ef4444', 'fill-opacity=".16" stroke="none"');
s += E(0, 12, 58, 30, '#7f1d1d');
for (let r = -3; r <= 4; r++) for (let c = -7; c <= 7; c++) {
const cx = c * 8.4 + (r % 2 ? 4.2 : 0), cy = 12 + r * 6.2;
const nx = cx / 58, ny = (cy - 12) / 30;
if (nx * nx + ny * ny > 0.93) continue;
const hot = ((r + c) % 3 + 3) % 3;
s += POLY(`${f(cx)},${f(cy - 3.4)} ${f(cx + 4.2)},${f(cy)} ${f(cx)},${f(cy + 3.4)} ${f(cx - 4.2)},${f(cy)}`, hot === 0 ? '#fff' : (hot === 1 ? '#fca5a5' : '#ef4444'), ST(0.8));
}
s += E(0, 12, 58, 30, 'none');
s += E(0, -2, 46, 12, '#fff') + E(0, -2, 32, 7, '#5aa96b') + E(0, -2, 46, 12, 'none');
s += HL('M-50,6 Q-34,-6 -10,-8 Q-34,0 -48,12Z');
return s;
};
M.stad_anfield = (o) => {
let s = P('M-58,-6 L58,-6 L58,40 L-58,40Z', '#7c2d12');
s += P('M-50,-8 L50,-8 L58,12 L-58,12Z', '#991b1b');
for (let r = 0; r < 5; r++) for (let c = 0; c < 18; c++) s += C(-47 + c * 5.6 + (r % 2) * 2.6, -4 + r * 3.2, 1.5, r % 2 ? '#fecaca' : '#ef4444', NS);
[-42, -14, 18, 44].forEach((x, i) => { s += L(x, -8, x, -26, ST(1.8)) + P(`M${x},-26 q8,-4 14,0 q-6,4 0,9 q-8,-4 -14,0Z`, i % 2 ? '#fff' : '#ef4444', ST(1.2)); });
s += P('M-58,12 H58', 'none', ST(2.2));
for (let y = 16; y <= 36; y += 5) s += L(-58, y, 58, y, ST(0.7) + ' stroke="#431407" opacity=".5"');
for (let x = -50; x <= 50; x += 20) for (let y = 16; y <= 31; y += 5) s += L(x + (y % 10 ? 0 : 10), y, x + (y % 10 ? 0 : 10), y + 5, ST(0.7) + ' stroke="#431407" opacity=".5"');
[-40, -14, 12, 38].forEach(x => { s += R(x - 6, 17, 12, 14, '#fde68a', 6, ST(1.6)) + L(x, 17, x, 31, ST(1)); });
s += P('M-12,40 V30 Q0,22 12,30 V40Z', '#1f2937');
s += R(-58, 38, 116, 3, '#ef4444', 0, NS);
return s;
};
M.stad_sansiro = (o) => {
let s = R(-52, -2, 104, 42, '#9ca3af', 2);
s += R(-52, 24, 104, 16, '#6b7280', 0, NS);
for (let x = -46; x <= 46; x += 7) s += L(x, 26, x, 40, ST(0.9) + ' opacity=".5"');
s += P('M-60,-14 L60,-14 L52,-2 L-52,-2Z', '#374151');
for (let i = 0; i < 11; i++) { const x = -44 + i * 8.8; s += P(`M${f(x - 1.6)},-2 L${f(x + 1.6)},-2 L${f(x + 6.6)},40 L${f(x + 3.4)},40Z`, '#ef4444', ST(1)); }
const tower = (cx) => {
let t = R(cx - 12, -30, 24, 70, '#d1d5db', 4);
t += E(cx, -30, 12, 4, '#e5e7eb');
for (let y = -24; y < 38; y += 9) t += P(`M${cx - 12},${y + 7} L${cx + 12},${y - 1}`, 'none', 'stroke="#6b7280" stroke-width="2.4"') + P(`M${cx - 12},${y + 9} L${cx + 12},${y + 1}`, 'none', 'stroke="#fff" stroke-width="1.2" opacity=".7"');
t += R(cx - 12, -34, 24, 6, '#ef4444', 2);
return t;
};
s += tower(-44) + tower(44);
return s;
};
M.stad_kingfahd = (o) => {
let s = P('M-56,40 L-56,12 Q0,2 56,12 L56,40Z', '#e7d4a8');
for (let y = 18; y <= 36; y += 6) s += P(`M-56,${y} Q0,${y - 10} 56,${y}`, 'none', ST(0.9) + ' opacity=".45"');
for (let x = -48; x <= 48; x += 12) s += L(x, 14, x, 40, ST(0.8) + ' opacity=".35"');
s += P('M-64,8 Q-40,-30 0,-34 Q40,-30 64,8 Q56,14 48,8 Q40,16 32,8 Q24,16 16,8 Q8,16 0,8 Q-8,16 -16,8 Q-24,16 -32,8 Q-40,16 -48,8 Q-56,14 -64,8Z', W);
[-52, -34, -17, 0, 17, 34, 52].forEach(x => { s += L(0, -34, x, 8, ST(1) + ' stroke="#9fb4cc" opacity=".9"'); });
s += E(0, -34, 9, 3, '#cbd5e1');
s += HL('M-50,2 Q-34,-22 -8,-30 Q-34,-14 -46,6Z');
[-56, -34, 34, 56].forEach(x => { s += L(x, 8, x, 40, ST(2.6)) + C(x, 8, 2.4, '#ef4444', NS); });
s += L(-56, 8, -64, -4, ST(1)) + L(56, 8, 64, -4, ST(1));
return s;
};
M.stad_lusail = (o) => {
let s = P('M-58,-6 Q-58,40 0,43 Q58,40 58,-6 Q30,-2 0,-2 Q-30,-2 -58,-6Z', '#e9b324');
for (let r = 0; r < 4; r++) for (let c = 0; c < 11; c++) {
const cx = -50 + c * 10 + (r % 2 ? 5 : 0), cy = 4 + r * 9;
const nx = cx / 58, ny = (cy - 8) / 36; if (nx * nx + ny * ny > 0.78) continue;
s += POLY(`${cx},${cy - 4} ${cx + 4},${cy} ${cx},${cy + 4} ${cx - 4},${cy}`, '#7a4b10', ST(0.6));
s += POLY(`${cx},${cy - 2} ${cx + 2},${cy} ${cx},${cy + 2} ${cx - 2},${cy}`, '#fde68a', NS);
}
s += P('M-58,-6 Q-58,40 0,43 Q58,40 58,-6', 'none');
s += E(0, -8, 54, 9, '#f7d35c') + E(0, -8, 42, 6, '#5aa96b') + E(0, -8, 54, 9, 'none');
s += P('M-64,-26 Q-32,-14 0,-8 Q32,-14 64,-26 L64,-20 Q32,-6 0,0 Q-32,-6 -64,-20Z', '#fde68a');
s += P('M-64,-26 Q-32,-14 0,-8 Q32,-14 64,-26', 'none', ST(2.4));
s += HL('M-52,10 Q-40,24 -20,30 Q-40,22 -50,6Z');
return s;
};
M.stad_emirates = (o) => {
let s = P('M-60,40 L-52,-6 L52,-6 L60,40Z', '#dc2626');
s += rows(5, -56, 56, 0, 7, (i, y) => P(`M${f(-52 - (y + 6) * 0.14)},${y} H${f(52 + (y + 6) * 0.14)} V${y + 3.6} H${f(-52 - (y + 6) * 0.14)}Z`, i % 2 ? '#ef4444' : '#991b1b', NS) + [...Array(11)].map((_, k) => C(-46 + k * 9.2, y + 1.8, 1, '#fff', NS)).join(''));
s += P('M-60,40 L-52,-6 L52,-6 L60,40', 'none', ST(2.4));
s += R(-58, 33, 116, 7, '#f8fafc', 0, ST(1.6));
[-40, -14, 14, 40].forEach(x => { s += R(x - 5, 34.5, 10, 5, '#475569', 1, NS); });
s += P('M-66,-4 Q-34,-40 0,-20 Q34,0 66,-34 L66,-24 Q34,10 0,-10 Q-34,-30 -66,6Z', W);
s += P('M-66,-4 Q-34,-40 0,-20 Q34,0 66,-34', 'none', ST(2.6));
s += P('M-66,6 Q-34,-30 0,-10 Q34,10 66,-24', 'none', ST(1.6) + ' opacity=".6"');
[-44, -18, 14, 44].forEach((x, i) => { s += L(x, [-18, -22, -8, -16][i], x, -6, ST(1.2) + ' stroke="#9fb4cc"'); });
return s;
};
M.cannon = (o) => P('M-22,6 L18,-8 L24,2 L-16,16Z', '#1f2937') + R(14, -14, 14, 18, '#374151', 3, `transform="rotate(25 21 -5)"`) + C(-6, 16, 9, '#8b5a2b') + C(-6, 16, 3, '#fcd34d', NS) + L(-6, 7, -6, 25, ST(1.2) + ' opacity=".6"') + L(-15, 16, 3, 16, ST(1.2) + ' opacity=".6"');
M.stad_signal = (o) => {
let s = P('M-58,40 L-58,6 L-40,-30 L40,-30 L58,6 L58,40Z', '#facc15');
for (let r = 0; r < 9; r++) for (let c = 0; c < 20; c++) {
const y = -26 + r * 7; const half = 40 + (y + 30) / 36 * 18;
const x = -half + 4 + c * ((half * 2 - 8) / 19);
s += C(f(x), y + 2, 1.5, r % 2 ? '#111827' : '#fef08a', NS);
}
s += P('M-58,6 H58', 'none', ST(2));
[-14, 0, 14].forEach(y => { s += P(`M-52,${y} H52`, 'none', ST(0.8) + ' opacity=".4"'); });
[-62, 62].forEach((x, i) => { s += L(x, 40, x, -44, ST(3.2) + ' stroke="#f59e0b"') + L(x, -44, i ? 20 : -20, -30, ST(1)) + L(x, -38, i ? 34 : -34, -30, ST(1)); });
[-30, -6, 18].forEach((x, i) => { s += P(`M${x},-30 L${x + 14},-30 L${x + 14},-18 L${x + 7},-22 L${x},-18Z`, i % 2 ? '#111827' : '#fff', ST(1)); });
s += R(-30, 28, 60, 12, '#111827', 3) + [-18, -6, 6, 18].map(x => R(x - 4, 31, 8, 6, '#fde047', 1, NS)).join('');
return s;
};
M.stad_azteca = (o) => {
let s = P('M-56,40 L-56,-8 Q0,-30 56,-8 L56,40Z', '#aeb6c2');
s += E(0, -8, 56, 15, '#d0d6de') + E(0, -6, 40, 9, '#5aa96b');
s += P('M-56,-8 Q0,-30 56,-8', 'none', ST(2.4));
for (let x = -50; x <= 50; x += 10) s += L(x, -2 + (Math.abs(x) / 56) * 4, x, 40, ST(1) + ' stroke="#7b8594" opacity=".7"');
s += P('M-56,34 Q-20,30 4,8 Q-14,28 -56,28Z', '#8d97a6', NS) + P('M56,34 Q20,30 -4,8 Q14,28 56,28Z', '#8d97a6', NS);
s += P('M-56,24 Q-26,22 -2,2', 'none', ST(1.4) + ' stroke="#fff" opacity=".7"') + P('M56,24 Q26,22 2,2', 'none', ST(1.4) + ' stroke="#fff" opacity=".7"');
s += P('M-56,-8 Q0,-30 56,-8 L56,-3 Q0,-25 -56,-3Z', '#16a34a', NS) + P('M-30,-17 Q0,-24 30,-17 L30,-12 Q0,-19 -30,-12Z', '#fff', NS);
s += P('M-56,-8 Q-52,-6 -56,-3', 'none') + L(30, -17, 56, -8, ST(0.1) + ' opacity="0"');
s += P('M30,-17 Q44,-14 56,-8 L56,-3 Q44,-9 30,-12Z', '#dc2626', NS);
s += R(-10, 30, 20, 10, '#374151', 3);
return s;
};
M.stad_etihad = (o) => {
let s = R(-52, 2, 104, 38, '#7bb7e6', 2);
s += rows(4, -52, 52, 8, 8, (i, y) => R(-52, y, 104, 4, i % 2 ? '#a8d1f2' : '#4f9bd6', 0, NS));
s += R(-52, 36, 104, 6, '#e0f2fe', 0, ST(1.6));
s += P('M-60,-10 L60,-10 L52,2 L-52,2Z', W) + P('M-60,-10 L60,-10', 'none', ST(3));
[-58, -20, 20, 58].forEach((x, i) => {
const h = i === 0 || i === 3 ? -46 : -38;
s += L(x, 2, x, h, ST(3)) + C(x, h, 2.4, '#e0f2fe');
[-50, -38, -26, -14].forEach(tx => { if (Math.abs(tx - x) < 46) s += L(x, h + 2, tx, -10, ST(0.8) + ' stroke="#64748b" opacity=".75"'); });
});
s += R(-8, 30, 16, 12, '#1e293b', 2);
return s;
};
M.stad_jawhara = (o) => {
let s = E(0, 10, 66, 40, '#34d399', 'fill-opacity=".14" stroke="none"');
const facet = (pts, c) => POLY(pts, c, ST(1.3));
s += facet('-58,-4 -34,-26 34,-26 58,-4', '#0f766e');
s += E(0, -26, 34, 6, '#a7f3d0') + E(0, -26, 26, 4, '#5aa96b') + E(0, -26, 34, 6, 'none');
s += facet('-58,-4 -34,-26 -22,-4', '#14b8a6') + facet('-22,-4 -34,-26 0,-26', '#5eead4') + facet('-22,-4 0,-26 22,-4', '#0d9488') + facet('22,-4 0,-26 34,-26', '#99f6e4') + facet('22,-4 34,-26 58,-4', '#14b8a6');
s += facet('-58,-4 58,-4 0,42', '#059669');
s += facet('-58,-4 -22,-4 0,42', '#34d399') + facet('-22,-4 22,-4 0,42', '#10b981') + facet('22,-4 58,-4 0,42', '#047857');
s += P('M-34,-26 L-22,-4 L0,42 M34,-26 L22,-4 L0,42 M0,-26 L-22,-4 M0,-26 L22,-4', 'none', ST(1) + ' opacity=".55"');
s += facet('-14,8 14,8 0,30', '#d1fae5');
s += HL('M-50,-4 L-34,-22 L-26,-22 L-42,-4Z');
s += star(44, -34, 7, '#fde047', ST(1.2)) + star(-46, -36, 5, '#fff', ST(1));
return s;
};
M.stad_stamford = (o) => {
let s = R(-56, -8, 112, 40, '#1d4ed8', 2);
s += rows(5, -56, 56, -4, 6.5, (i, y) => R(-56, y, 112, 3.2, i % 2 ? '#3b82f6' : '#1e3a8a', 0, NS) + [...Array(10)].map((_, k) => C(-50 + k * 11.2, y + 1.6, 1, '#fff', NS)).join(''));
s += P('M-62,-20 L62,-20 L56,-8 L-56,-8Z', W) + P('M-62,-20 L62,-20', 'none', ST(3));
for (let x = -50; x <= 50; x += 12.5) s += L(x, -20, x + 3, -8, ST(1.1) + ' stroke="#8896a8"');
[-44, 44].forEach(x => { s += L(x, -20, x, -34, ST(2.2)) + R(x - 6, -40, 12, 7, '#fde68a', 1.5); });
s += R(-60, 24, 120, 18, '#d6d3d1', 2);
[-34, 0, 34].forEach(x => { s += P(`M${x - 13},42 V34 Q${x - 13},24 ${x},24 Q${x + 13},24 ${x + 13},34 V42Z`, '#475569'); });
s += P('M-60,24 H60', 'none', ST(2.4)) + P('M-60,19 H60', 'none', ST(1.6));
for (let x = -56; x <= 56; x += 8) s += L(x, 19, x, 24, ST(1.2));
s += rows(2, -60, 60, 28, 6, (i, y) => L(-60, y, 60, y, ST(0.6) + ' opacity=".35"'));
return s;
};
M.stad_parc = (o) => {
let s = '';
s += P('M0,-48 L-5,-26 L-3,-12 L-12,40 L12,40 L3,-12 L5,-26Z', '#64748b', ST(1.4)) + R(-9, -22, 18, 3, '#94a3b8', 0, NS) + R(-6, -34, 12, 2.5, '#94a3b8', 0, NS);
s += P('M-3,-12 Q0,-4 3,-12', 'none', ST(1)) + P('M-9,16 Q0,6 9,16', 'none', ST(1.2));
s += P('M-58,40 L-58,6 Q-58,-6 -40,-8 L40,-8 Q58,-6 58,6 L58,40Z', '#cbd5e1', 'fill-opacity=".92"');
s += P('M-58,40 L-58,6 Q-58,-6 -40,-8 L40,-8 Q58,-6 58,6 L58,40Z', 'none');
for (let i = 0; i < 13; i++) {
const x = -54 + i * 9;
s += P(`M${x - 4},40 L${x - 2.2},-14 L${x + 2.2},-14 L${x + 4},40Z`, i % 2 ? '#e2e8f0' : '#94a3b8', ST(1));
}
s += P('M-60,-14 L60,-14', 'none', ST(3.2) + ' stroke="#475569"') + R(-60, -18, 120, 4, '#e2e8f0', 1);
s += R(-60, 32, 120, 8, '#1e3a8a', 0, NS) + R(-6, 32, 12, 8, '#dc2626', 0, NS);
return s;
};
const flagBody = (k) => {
switch (k) {
case 'es': return R(0, 0, 40, 26, '#dc2626') + R(0, 6.5, 40, 13, '#facc15', 0, NS) + R(0, 0, 40, 26, 'none');
case 'eng': return R(0, 0, 40, 26, W) + R(17, 0, 6, 26, '#dc2626', 0, NS) + R(0, 10, 40, 6, '#dc2626', 0, NS) + R(0, 0, 40, 26, 'none');
case 'br': return R(0, 0, 40, 26, '#16a34a') + POLY('20,3 36,13 20,23 4,13', '#facc15', ST(1)) + C(20, 13, 6, '#1d4ed8', ST(1)) + P('M14.5,12 Q20,10 25.5,14', 'none', 'stroke="#fff" stroke-width="1.3"') + R(0, 0, 40, 26, 'none');
case 'de': return R(0, 0, 40, 9, '#111827', 0, NS) + R(0, 8.6, 40, 9, '#dc2626', 0, NS) + R(0, 17.3, 40, 8.7, '#facc15', 0, NS) + R(0, 0, 40, 26, 'none');
case 'it': return R(0, 0, 14, 26, '#16a34a', 0, NS) + R(13.3, 0, 13.4, 26, W, 0, NS) + R(26, 0, 14, 26, '#dc2626', 0, NS) + R(0, 0, 40, 26, 'none');
case 'fr': return R(0, 0, 14, 26, '#1d4ed8', 0, NS) + R(13.3, 0, 13.4, 26, W, 0, NS) + R(26, 0, 14, 26, '#dc2626', 0, NS) + R(0, 0, 40, 26, 'none');
case 'mx': return R(0, 0, 14, 26, '#16a34a', 0, NS) + R(13.3, 0, 13.4, 26, W, 0, NS) + R(26, 0, 14, 26, '#dc2626', 0, NS) + C(20, 13, 3.6, '#a16207', ST(0.8)) + R(0, 0, 40, 26, 'none');
case 'sa': return R(0, 0, 40, 26, '#15803d') + P('M8,19 H32', 'none', 'stroke="#fff" stroke-width="2.2" stroke-linecap="round"') + P('M10,10 Q14,6 18,10 T26,10 T32,9', 'none', 'stroke="#fff" stroke-width="1.8" stroke-linecap="round"') + R(0, 0, 40, 26, 'none');
case 'qa': return R(0, 0, 40, 26, '#8a1538') + POLY('0,0 15,0 10,2.3 15,4.6 10,6.9 15,9.2 10,11.5 15,13.8 10,16.1 15,18.4 10,20.7 15,23 10,26 0,26', W, ST(1)) + R(0, 0, 40, 26, 'none');
default: return R(0, 0, 40, 26, '#e5e7eb');
}
};
M.stflag = (o) => L(0, 46, 0, -10, ST(3.2)) + C(0, -12, 3.2, '#facc15', ST(1.4)) + `<g transform="translate(2,-8)">` + flagBody(o.k) + HL('M2,2 H20 L16,8 H2Z') + `</g>`;
M.scarf = (o) => {
const cs = o.cs || ['#dc2626', '#fff'];
let s = '';
for (let i = 0; i < 9; i++) s += R(-36 + i * 8, -8, 8, 16, cs[i % cs.length], 0, NS);
s += R(-36, -8, 72, 16, 'none', 3, ST(2.2));
for (let i = 0; i < 6; i++) s += L(-36, -5 + i * 2.2, -42, -6 + i * 2.6, ST(1.4) + ' stroke-linecap="round"') + L(36, -5 + i * 2.2, 42, -6 + i * 2.6, ST(1.4) + ' stroke-linecap="round"');
s += HL('M-32,-6 H20 L16,-2 H-32Z');
return s;
};
X.STADIUM_MOTIFS = ['stad_bernabeu', 'stad_campnou', 'stad_oldtrafford', 'stad_wembley', 'stad_maracana', 'stad_allianz', 'stad_anfield', 'stad_sansiro', 'stad_kingfahd', 'stad_lusail', 'stad_emirates', 'stad_signal', 'stad_azteca', 'stad_etihad', 'stad_jawhara', 'stad_stamford', 'stad_parc'];
})(M8P);
(function (X) {
const { INK, NS, W, P, C, E, R, L, POLY, HL, SH, star, M, f } = X;
const ST = (w) => `stroke-width="${w}"`;
const col = (o, k, d) => (o && o[k]) || d;
M.najdi = (o) => {
const c = col(o, 'c', '#c99b6b');
let s = R(-40, -8, 80, 52, c, 1);
for (let i = 0; i < 7; i++) s += POLY(`${-40 + i * 11.4},-8 ${-34.3 + i * 11.4},-20 ${-28.6 + i * 11.4},-8`, c, ST(1.8));
s += R(-44, -12, 88, 6, '#b8864f', 1);
[-26, 16].forEach(x => { s += POLY(`${x},4 ${x + 6},4 ${x + 3},-3`, '#4a3220', NS) + R(x, 8, 6, 10, '#4a3220', 1, NS); });
s += P('M-9,44 V22 Q0,12 9,22 V44Z', '#6b4a2e') + L(0, 16, 0, 44, ST(1.2)) + C(-3, 32, 1, '#f6b93b', NS) + C(3, 32, 1, '#f6b93b', NS);
s += HL('M-36,-4 H-26 V40 H-36Z');
return s;
};
M.oldcar = (o) => {
const c = col(o, 'c', '#2f7f9e');
let s = P('M-52,16 Q-52,2 -40,0 L-26,-18 Q-22,-24 -14,-24 H22 Q30,-24 34,-18 L44,0 Q54,2 54,16 V24 H-52Z', c);
s += P('M-24,-2 L-18,-18 H-2 V-2Z', '#bfe3f6') + P('M2,-2 V-18 H20 Q24,-18 28,-12 L34,-2Z', '#bfe3f6');
s += L(-2, -18, -2, -2, ST(1.6)) + R(-52, 16, 106, 4, '#cbd5e1', 1, NS) + R(-54, 10, 6, 6, '#facc15', 1) + R(50, 10, 5, 6, '#ef4444', 1);
s += P('M-20,10 H20', 'none', ST(1.6) + ' opacity=".5"');
[-30, 30].forEach(x => { s += C(x, 26, 11, '#1f2937') + C(x, 26, 5.5, '#cbd5e1') + C(x, 26, 1.6, '#475569', NS); });
s += HL('M-44,2 Q-30,-2 -22,-14 L-26,-14 Q-34,0 -46,4Z');
return s;
};
M.giftbox = (o) => {
const c = col(o, 'c', '#e8553d'), d = col(o, 'd', '#facc15');
return R(-34, -4, 68, 46, c, 4) + R(-38, -16, 76, 16, c, 4) + R(-6, -16, 12, 58, d, 0, NS) + R(-38, -10, 76, 5, d, 0, NS) + R(-6, -16, 12, 58, 'none') +
P('M0,-16 Q-26,-46 -30,-26 Q-26,-12 0,-16Z', d) + P('M0,-16 Q26,-46 30,-26 Q26,-12 0,-16Z', d) + C(0, -16, 6, d) + HL('M-30,0 H-22 V38 H-30Z');
};
M.scarecrow = (o) =>
L(0, -20, 0, 52, ST(5) + ' stroke="#8a5a3b"') + L(-40, 0, 40, 0, ST(5) + ' stroke="#8a5a3b"') +
P('M-26,-4 L-14,-8 H14 L26,-4 L22,28 H-22Z', '#4f8fd9') + R(-8, 4, 14, 12, '#f6b93b', 1, ST(1.4)) + P('M-14,22 L-8,16', 'none', ST(1.2)) +
P('M-40,0 L-52,-8 M-40,0 L-54,2 M-40,0 L-50,10 M40,0 L52,-8 M40,0 L54,2 M40,0 L50,10', 'none', 'stroke="#e0b64a" stroke-width="3" stroke-linecap="round"') +
P('M-22,28 L-26,44 M-12,28 L-14,46 M22,28 L26,44 M12,28 L14,46', 'none', 'stroke="#e0b64a" stroke-width="3" stroke-linecap="round"') +
C(0, -30, 13, '#e8cf8a') + E(0, -40, 30, 6, '#d9a441') + P('M-14,-40 Q0,-64 14,-40Z', '#d9a441') + P('M-14,-42 H14', 'none', ST(2.4) + ' stroke="#8a3b2e"');
M.clinic = (o) => L(0, -10, 0, 48, ST(5) + ' stroke="#8a5a3b"') + R(-30, -48, 60, 54, W, 8, ST(2.6)) + R(-6, -42, 12, 42, '#dc2626', 2, NS) + R(-24, -26, 48, 12, '#dc2626', 2, NS) + HL('M-26,-44 H-12 V-40 H-26Z');
M.rv = (o) => {
const c = col(o, 'c', '#e9e2c9');
let s = R(-54, -26, 100, 52, c, 8) + P('M46,-26 H52 Q60,-26 62,-14 L66,10 Q68,26 56,26 H46Z', c);
s += P('M48,-22 H54 Q58,-22 60,-14 L62,-4 H48Z', '#bfe3f6');
s += R(-42, -16, 22, 16, '#bfe3f6', 2) + R(-14, -16, 22, 16, '#bfe3f6', 2) + R(14, -16, 18, 16, '#bfe3f6', 2);
s += R(-54, 6, 100, 5, '#2f9e8a', 0, NS) + L(-54, 11, 46, 11, ST(1.2)) + R(-4, 12, 14, 12, '#d6cfb3', 2, ST(1.4));
s += R(-54, -30, 40, 4, '#9aa6b2', 1);
[-34, 30].forEach(x => { s += C(x, 28, 10, '#1f2937') + C(x, 28, 4.5, '#cbd5e1'); });
s += HL('M-50,-20 H-44 V4 H-50Z');
return s;
};
M.bluecrystal = (o) => {
const c = col(o, 'c', '#38bdf8'), d = col(o, 'd', '#bae6fd');
const sh = (pts, fill) => POLY(pts, fill, ST(1.8));
return sh('-40,44 -30,0 -16,-12 -4,44', c) + sh('-4,44 8,-30 22,-6 30,44', '#0ea5e9') + sh('20,44 30,6 44,-8 52,44', c) +
sh('-60,44 -50,10 -40,20 -34,44', '#7dd3fc') + sh('-30,0 -16,-12 -22,18', d) + sh('8,-30 22,-6 14,10', d) + sh('30,6 44,-8 40,16', d) +
star(-30, -26, 7, W, ST(1)) + star(40, -28, 5, W, ST(1));
};
M.baggie = (o) => P('M-26,-24 H26 L30,36 Q0,44 -30,36Z', 'rgba(255,255,255,.55)') + P('M-26,-24 H26', 'none', ST(3.2)) + L(-26, -16, 26, -16, ST(1) + ' opacity=".5"') +
POLY('-14,26 -10,6 -2,12 0,28', '#38bdf8', ST(1.4)) + POLY('0,28 4,0 14,10 16,28', '#0ea5e9', ST(1.4)) + POLY('14,26 20,12 26,18 24,28', '#7dd3fc', ST(1.4)) + HL('M-22,-14 H-16 V28 H-24Z');
M.chefhat = (o) => R(-26, 12, 52, 26, W, 3) + C(-20, -4, 18, W) + C(0, -14, 20, W) + C(20, -4, 18, W) + R(-26, 12, 52, 8, '#e2e8f0', 0, NS) + L(-12, 20, -12, 38, ST(1) + ' opacity=".4"') + L(12, 20, 12, 38, ST(1) + ' opacity=".4"') + HL('M-34,-8 Q-28,-22 -14,-22 Q-26,-18 -28,-6Z');
M.guitar = (o) => `<g transform="rotate(-24)">` + R(-4, -64, 8, 54, '#6b4423', 2) + R(-7, -72, 14, 12, '#4a3220', 3) + P('M-26,24 Q-34,4 -14,-4 Q-4,-8 0,-8 Q4,-8 14,-4 Q34,4 26,24 Q36,42 0,46 Q-36,42 -26,24Z', '#d9923a') + C(0, 18, 9, '#2b1a10') + C(0, 18, 11, 'none', ST(2.2) + ' stroke="#6b4423"') + R(-14, 36, 28, 4, '#6b4423', 1, NS) + L(-2, -64, -2, 36, ST(0.8) + ' opacity=".7"') + L(2, -64, 2, 36, ST(0.8) + ' opacity=".7"') + HL('M-22,10 Q-20,2 -10,-2 Q-18,8 -18,20Z') + `</g>`;
M.gate = (o) => {
let s = R(-46, -30, 92, 76, '#c9b08a', 2);
for (let y = -22; y < 44; y += 10) s += L(-46, y, 46, y, ST(0.9) + ' opacity=".45"');
for (let y = -26; y < 44; y += 10) for (let x = -40; x < 46; x += 20) s += L(x + ((y / 10) % 2 ? 10 : 0), y, x + ((y / 10) % 2 ? 10 : 0), y + 10, ST(0.9) + ' opacity=".4"');
s += P('M-22,46 V-4 Q-22,-26 0,-26 Q22,-26 22,-4 V46Z', '#6b4a2e') + P('M-22,46 V-4 Q-22,-26 0,-26 Q22,-26 22,-4 V46', 'none', ST(2.6) + ' stroke="#3a2a1a"');
s += L(0, -24, 0, 46, ST(1.6));
for (let y = -10; y < 44; y += 12) { s += C(-12, y, 1.8, '#d1d5db', ST(0.8)) + C(12, y, 1.8, '#d1d5db', ST(0.8)); }
s += C(-5, 20, 2.4, '#f6b93b') + C(5, 20, 2.4, '#f6b93b');
return s;
};
M.poster = (o) => P('M-30,-44 H30 L34,40 H-34Z', '#fff7d6', ST(2.4)) + R(-22, -36, 44, 6, '#dc2626', 1, NS) + C(0, -8, 9, '#94a3b8', NS) + P('M-16,18 Q-16,2 0,2 Q16,2 16,18Z', '#94a3b8', NS) +
L(-20, 26, 20, 26, ST(1.4) + ' opacity=".5"') + L(-20, 32, 12, 32, ST(1.4) + ' opacity=".5"') + C(0, -48, 4, '#ef4444');
M.megaphone = (o) => P('M-34,-12 L16,-34 V30 L-34,10Z', '#ef4444') + R(-44, -12, 12, 22, '#374151', 3) + P('M16,-34 Q30,-38 30,-2 Q30,34 16,30Z', '#fca5a5') + R(-24, 8, 10, 16, '#374151', 2) + HL('M-28,-6 L10,-24 V-18 L-28,2Z');
M.cane = (o) => P('M-12,-34 Q-12,-50 0,-50 Q12,-50 12,-38 Q12,-30 4,-30', 'none', ST(7) + ' stroke="#8a5a3b" stroke-linecap="round"') + P('M-12,-34 Q-12,-50 0,-50 Q12,-50 12,-38 Q12,-30 4,-30', 'none', ST(3.4) + ' stroke="#c98a56" stroke-linecap="round"') +
L(-12, -34, -12, 48, ST(7) + ' stroke="#8a5a3b" stroke-linecap="round"') + L(-12, -34, -12, 48, ST(3.4) + ' stroke="#c98a56" stroke-linecap="round"') + R(-17, 44, 10, 5, '#374151', 2);
M.tasbih = (o) => { let s = ''; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; s += C(f(Math.cos(a) * 26), f(-6 + Math.sin(a) * 26), 4.4, i % 6 === 0 ? '#facc15' : '#7c4a2a', ST(1.4)); } return s + P('M0,18 L0,34', 'none', ST(2)) + R(-5, 32, 10, 14, '#facc15', 3) + L(-3, 46, -4, 56, ST(1.6)) + L(3, 46, 4, 56, ST(1.6)); };
M.tray = (o) => {
let s = E(0, 28, 50, 11, '#cbd5e1') + E(0, 26, 50, 10, '#e2e8f0');
[-28, 0, 28].forEach(x => { s += P(`M${x - 9},-6 H${x + 9} L${x + 7},24 Q${x},28 ${x - 7},24Z`, 'rgba(255,255,255,.75)') + P(`M${x - 8},4 H${x + 8} L${x + 7},22 Q${x},26 ${x - 7},22Z`, '#b45309', NS) + E(x, -6, 9, 2.5, '#fde68a'); });
return s + HL('M-46,24 H-30 V27 H-46Z');
};
M.stamp = (o) => R(-26, 22, 52, 14, '#334155', 3) + R(-26, 22, 52, 5, '#dc2626', 0, NS) + P('M-6,22 V-10 Q-6,-20 0,-20 Q6,-20 6,-10 V22Z', '#8a5a3b') + E(0, -26, 16, 8, '#8a5a3b') + HL('M-4,-6 H0 V18 H-4Z');
M.spraycan = (o) => R(-14, -26, 28, 66, col(o, 'c', '#2dd4bf'), 5) + R(-10, -38, 20, 14, '#cbd5e1', 3) + R(-4, -46, 8, 10, '#111827', 2) + R(-14, -8, 28, 18, W, 0, NS) + star(0, 1, 7, '#f59e0b', ST(1)) + HL('M-11,-22 H-7 V36 H-11Z');
})(M8P);
(function (X) {
const { M, BG, INK, f, P, C, E, R, sparkle } = X;
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed) => { let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
const hex3 = (c) => { c = c.toLowerCase(); return c.length === 4 ? '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3] : c; };
const rgb = (c) => { const n = parseInt(hex3(c).slice(1, 7), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const hx = (a) => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hx(A.map((v, i) => v + (B[i] - v) * t)); };
const lum = (c) => { const [r, g, b] = rgb(c); return (.2126 * r + .7152 * g + .0722 * b) / 255; };
const stopsOf = (st) => st.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('');
const lg = (id, x1, y1, x2, y2, st, abs) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${abs ? ' gradientUnits="userSpaceOnUse"' : ''}>${stopsOf(st)}</linearGradient>`;
const rg = (id, cx, cy, r, st) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}" gradientUnits="userSpaceOnUse">${stopsOf(st)}</radialGradient>`;
const rect = (x, y, w, h, fill, extra) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}"${extra || ''}/>`;
const FULL = (fill, extra) => rect(-400, -400, 1060, 1040, fill, extra);
const LANDMARKS = { eiffel: 1, pyramids: 1, burj: 1, statue: 1, bigben: 1, kingdom: 1, pisa: 1, colosseum: 1, taj: 1, opera: 1, clocktower: 1, burjarab: 1, wall: 1, goldengate: 1, christ: 1, petra: 1, fort: 1, mosque: 1 };
function kindOf(id, spec) {
const it = spec.items || [];
if (it.some(i => /^stad_/.test(i[0]))) return 'stadium';
if (/^rebus_football_q/.test(id)) return 'stadium';
if (/^rebus_words_q/.test(id) && it[0] && LANDMARKS[it[0][0]]) return 'landmark';
if (/_q\d+_\d+$/.test(id)) return 'scene';
return 'poster';
}
function place(it, sw0) {
const [name, x, y, s0, rot, o] = it;
const fn = M[name];
if (!fn) return '';
const s = s0 || 1;
const sw = f(sw0 / s);
let t = `translate(${x},${y})`;
if (rot) t += ` rotate(${rot})`;
if (s !== 1) t += ` scale(${s})`;
return `<g transform="${t}" stroke-width="${sw}">${fn(o || {})}</g>`;
}
function shade(body, p) {
const map = {}; let n = 0; let defs = '';
body = body.replace(/fill="(#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6})"/g, (m, c0) => {
const c = hex3(c0);
const L = lum(c);
if (L < .05) return m;
let id = map[c];
if (!id) {
id = p + 'f' + (n++); map[c] = id;
const up = L > .85 ? .0 : (.26 - L * .12);
const dn = L > .85 ? .2 : (.24 + (L < .25 ? .0 : .02));
defs += `<linearGradient id="${id}" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="${mix(c, '#ffffff', up)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${mix(c, '#0b1226', dn)}"/></linearGradient>`;
}
return `fill="url(#${id})"`;
});
return { body, defs };
}
function bgStadium(p, h) {
const r = rng(h);
const skies = [['#030716', '#0c1c52', '#27428f', '#5a5fb0'], ['#02101a', '#07304a', '#1d5f86', '#4e8fb0'], ['#0b0720', '#27145a', '#5a2f94', '#a05cb0']];
const sk = skies[h % 3];
let d = '';
d += lg(p + 'sk', 0, -40, 0, 168, [[0, sk[0]], [.5, sk[1]], [.85, sk[2]], [1, sk[3]]], 1);
d += rg(p + 'hg', 130, 168, 160, [[0, '#ffe9a8', .7], [.4, '#ffc15a', .24], [1, '#ffc15a', 0]]);
d += lg(p + 'bm', 0, 0, 0, 1, [[0, '#fffbe0', .9], [.55, '#fff0b0', .28], [1, '#fff0b0', 0]]);
d += lg(p + 'st', 0, 124, 0, 168, [[0, '#33407f'], [1, '#080c26']], 1);
d += lg(p + 'fr', 0, 167, 0, 300, [[0, '#021008', .7], [.4, '#021008', .2], [1, '#021008', 0]], 1);
d += rg(p + 'hl', .5, .5, .5, [[0, '#ffffff', .95], [.35, '#fff6c0', .55], [1, '#fff6c0', 0]]).replace('gradientUnits="userSpaceOnUse"', '');
d += rg(p + 'vg', 130, 120, 200, [[.5, '#000', 0], [1, '#000', .6]]);
d += `<pattern id="${p}cr" width="7" height="6" patternUnits="userSpaceOnUse"><circle cx="1.8" cy="1.8" r="1.25" fill="#f2c14e"/><circle cx="5.2" cy="4.2" r="1.25" fill="#ee6c4d"/><circle cx="3.4" cy="3.2" r=".9" fill="#7aa2ff"/></pattern>`;
let s = '';
s += rect(-400, -400, 1060, 568, `url(#${p}sk)`);
for (let i = 0; i < 28; i++) s += `<circle cx="${f(-30 + r() * 320)}" cy="${f(-8 + r() * 112)}" r="${f(.5 + r() * .8)}" fill="#fff" opacity="${f(.25 + r() * .6)}"/>`;
s += rect(-400, 40, 1060, 128, `url(#${p}hg)`);
[[18, 1], [242, -1]].forEach(([tx, dir]) => {
[[0, 66], [0, 28]].forEach(([_, spread], k) => {
const gx = 130 - dir * (k ? 52 : 6);
s += `<polygon points="${tx - 7},46 ${tx + 7},46 ${gx + spread + 20},236 ${gx - spread - 20},236" fill="url(#${p}bm)" opacity="${k ? .55 : .8}"/>`;
});
});
s += rect(-400, 124, 1060, 44, `url(#${p}st)`);
s += rect(-400, 124, 1060, 44, `url(#${p}cr)`, ' opacity=".5"');
s += rect(-400, 136, 1060, 1.2, '#fff', ' opacity=".12"') + rect(-400, 148, 1060, 1.2, '#fff', ' opacity=".1"');
s += rect(-400, 122.5, 1060, 2.6, '#b8c4ff', ' opacity=".6"');
[18, 242].forEach(tx => {
s += rect(tx - 1.6, 48, 3.2, 100, '#0a1030');
s += `<circle cx="${tx}" cy="38" r="30" fill="url(#${p}hl)" opacity=".55"/>`;
s += `<rect x="${tx - 12}" y="30" width="24" height="16" rx="2.5" fill="#1a2250" stroke="#9fb0ff" stroke-opacity=".7" stroke-width=".8"/>`;
for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) s += `<circle cx="${tx - 7 + a * 7}" cy="${34 + b * 8}" r="2.5" fill="#fffbe6"/>`;
});
let y = 168, hh = 3.1, i = 0;
while (y < 420) { s += rect(-400, y, 1060, hh + .6, i % 2 ? '#1c7a3a' : '#2b9a4c'); y += hh; hh *= 1.31; i++; }
s += rect(-400, 168, 1060, 140, `url(#${p}fr)`);
s += rect(-400, 167.2, 1060, 1.6, '#e3f8d2', ' opacity=".55"');
s += `<ellipse cx="130" cy="236" rx="78" ry="14" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.3"/>` + rect(-400, 236, 1060, 1.1, '#fff', ' opacity=".2"');
s += FULL(`url(#${p}vg)`);
return { d, s };
}
const SKIES = [
['#1b1f5e', '#5b3a8f', '#d4607a', '#ff9a5c', '#ffd08a'],
['#24508f', '#5f8fcc', '#f0b48a', '#ffcf7a', '#fff0b8'],
['#0c1440', '#27337f', '#6a5aa8', '#e08a9a', '#ffc9a0'],
['#143a74', '#3f7fc2', '#8fc4e8', '#f3c98d', '#ffe7b0']
];
function hills(r, base, amp, step, x0, x1) {
let d = `M${x0},300 L${x0},${f(base)}`;
let y = base - amp * .5;
for (let x = x0; x <= x1; x += step) { y = base - amp * (.15 + r() * .85); d += ` L${f(x)},${f(y)}`; }
return d + ` L${x1},300 Z`;
}
function bgLandmark(p, h) {
const r = rng(h);
const s5 = SKIES[h % 4];
let d = '';
d += lg(p + 'sk', 0, -40, 0, 184, [[0, s5[0]], [.3, s5[1]], [.58, s5[2]], [.82, s5[3]], [1, s5[4]]], 1);
d += rg(p + 'sn', 130, 178, 120, [[0, '#fff6cf', .95], [.25, '#ffd27a', .6], [.6, '#ff9a5c', .16], [1, '#ff9a5c', 0]]);
d += rg(p + 'sd', 130, 176, 24, [[0, '#fffbe6'], [1, '#ffd36e']]);
d += lg(p + 'h1', 0, 150, 0, 200, [[0, '#4a3a80'], [1, '#1f1850']], 1);
d += lg(p + 'h2', 0, 165, 0, 210, [[0, '#2a2060'], [1, '#120e34']], 1);
d += lg(p + 'wt', 0, 184, 0, 330, [[0, mix(s5[3], '#1b1448', .4)], [.35, '#2b2060'], [1, '#0e0b2c']], 1);
d += lg(p + 'cl', 0, 0, 1, 0, [[0, '#fff', 0], [.5, '#ffe6d6', .55], [1, '#fff', 0]]);
d += rg(p + 'vg', 130, 120, 210, [[.55, '#000', 0], [1, '#050218', .5]]);
let s = '';
s += rect(-400, -400, 1060, 584, `url(#${p}sk)`);
for (let i = 0; i < 16; i++) s += `<circle cx="${f(-30 + r() * 320)}" cy="${f(-8 + r() * 70)}" r="${f(.5 + r() * .7)}" fill="#fff" opacity="${f(.2 + r() * .5)}"/>`;
s += rect(-400, 30, 1060, 170, `url(#${p}sn)`);
s += `<circle cx="130" cy="176" r="24" fill="url(#${p}sd)"/>`;
for (let i = 0; i < 4; i++) s += `<ellipse cx="${f(30 + r() * 200)}" cy="${f(46 + i * 26 + r() * 10)}" rx="${f(34 + r() * 40)}" ry="${f(3 + r() * 4)}" fill="url(#${p}cl)" opacity="${f(.5 + r() * .4)}"/>`;
s += `<path d="${hills(r, 176, 22, 16, -60, 330)}" fill="url(#${p}h1)"/>`;
s += `<path d="${hills(r, 186, 12, 11, -60, 330)}" fill="url(#${p}h2)"/>`;
s += rect(-400, 190, 1060, 360, `url(#${p}wt)`);
s += rect(-400, 189.4, 1060, 1.4, '#ffe3b0', ' opacity=".55"');
for (let i = 0; i < 14; i++) { const yy = 194 + i * 4.2, w = 8 + i * 2.2 + r() * 10; s += rect(130 - w / 2 + (r() - .5) * 26, yy, w, 1.1 + i * .08, '#ffe0a8', ` opacity="${f(.5 - i * .03)}"`); }
s += FULL(`url(#${p}vg)`);
return { d, s };
}
function bgScene(p, h, bg, dark, lite, noGround, gy, gr) {
const r = rng(h);
const c0 = bg[0], c1 = bg[1];
const edge = mix(c0, '#0b1020', dark ? .5 : .6);
const mid = mix(c0, '#0b1020', dark ? .08 : .14);
let d = '';
d += rg(p + 'bs', 130, 106, 215, [[0, mix(c1, '#ffffff', .42)], [.42, mid], [1, edge]]);
d += lg(p + 'ry', 0, 0, 0, 1, [[0, '#ffffff', .34], [1, '#ffffff', 0]]);
d += lg(p + 'fl', 0, 196, 0, 330, [[0, mix(c0, '#0b1020', .5)], [1, mix(c0, '#0b1020', .84)]], 1);
d += lg(p + 'pl', 0, 0, 0, 1, [[0, mix(c1, '#ffffff', .35)], [1, mix(c0, '#0b1020', .35)]]);
d += rg(p + 'bk', .5, .5, .5, [[0, '#fff', .6], [.7, '#fff', .18], [1, '#fff', 0]]).replace('gradientUnits="userSpaceOnUse"', '');
d += rg(p + 'sh', .5, .5, .5, [[0, '#000', .55], [1, '#000', 0]]).replace('gradientUnits="userSpaceOnUse"', '');
let s = FULL(`url(#${p}bs)`);
if (!lite) {
[-112, -46, 46, 112].forEach((dx, i) => { const w = 22 + (i % 2) * 10; s += `<polygon points="123,-40 137,-40 ${130 + dx + w},250 ${130 + dx - w},250" fill="url(#${p}ry)" opacity="${i % 2 ? .38 : .55}"/>`; });
s += `<circle cx="130" cy="118" r="90" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="1.6"/><circle cx="130" cy="118" r="104" fill="none" stroke="#fff" stroke-opacity=".06" stroke-width="1.2"/>`;
}
const nb = lite ? 4 : 8;
for (let i = 0; i < nb; i++) { const rr = 5 + r() * 11; s += `<circle cx="${f(-10 + r() * 280)}" cy="${f(6 + r() * 190)}" r="${f(rr)}" fill="url(#${p}bk)" opacity="${f(.2 + r() * .3)}"/>`; }
if (!lite && !noGround) {
s += rect(-400, 198, 1060, 360, `url(#${p}fl)`);
s += `<ellipse cx="130" cy="206" rx="112" ry="17" fill="url(#${p}pl)"/><ellipse cx="130" cy="206" rx="112" ry="17" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.2"/>`;
}
if (!noGround) s += `<ellipse cx="130" cy="${gy}" rx="${gr}" ry="${lite ? 9 : 11}" fill="url(#${p}sh)"/>`;
return { d, s };
}
X.POSTERS = {};
const HB = {};
function heroBottom(uid, heroStr) {
if (HB[uid] != null) return HB[uid];
let y = 202;
try {
if (typeof document !== 'undefined' && document.body) {
const sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
sv.setAttribute('width', '260'); sv.setAttribute('height', '240'); sv.setAttribute('viewBox', '0 0 260 240');
sv.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none';
sv.innerHTML = heroStr;
document.body.appendChild(sv);
const bb = sv.firstChild.getBBox();
document.body.removeChild(sv);
if (bb && bb.height > 0) y = 122 + (bb.y + bb.height - 122) * .88;
}
} catch (e) { }
y = Math.max(150, Math.min(226, y));
HB[uid] = y; return y;
}
X.fit = function (svg) {
const g = svg.querySelector('g[data-m8b]'); if (!g) return;
const r = svg.getBoundingClientRect(); if (r.width < 24 || r.height < 24) return;
const bb = g.getBBox(); if (!bb || !bb.width || !bb.height) return;
const k = +g.getAttribute('data-m8k') || .88, ox = 130, oy = 122, big = g.getAttribute('data-m8f') === '1';
const x0 = ox + (bb.x - ox) * k, y0 = oy + (bb.y - oy) * k, w0 = bb.width * k, h0 = bb.height * k;
const ar = r.width / r.height;
let W = w0 / (big ? .93 : .86), H = h0 / (big ? .86 : .78);
if (W / H < ar) W = H * ar; else H = W / ar;
const sDef = Math.max(r.width / 260, r.height / 240), sNew = r.width / W;
const cap = big ? 1.85 : 1.5;
if (sNew > sDef * cap) { W = r.width / (sDef * cap); H = W / ar; }
if (sNew < sDef * .55) { W = r.width / (sDef * .55); H = W / ar; }
const cx = x0 + w0 / 2, cy = y0 + h0 / 2 + H * .015;
svg.setAttribute('viewBox', [cx - W / 2, cy - H / 2, W, H].map(v => +v.toFixed(1)).join(' '));
svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
};
let CNT = 0;
X.render = function (id, name, spec, icon) {
spec = spec || X.POSTERS[id];
let fallback = '';
if (!spec) {
spec = { bg: ['blue', 'mint', 'peach', 'lilac', 'yellow', 'pink', 'teal'][String(id).length % 7], items: [] };
const ic = String(icon || '').replace(/[<>&]/g, '');
fallback = ic ? `<circle cx="130" cy="116" r="62" fill="#fff" stroke="${INK}" stroke-width="3"/><text x="130" y="140" font-size="70" text-anchor="middle" stroke="none">${ic}</text>` : '<g transform="translate(130,118) scale(1.6)">' + M.qmark({}) + '</g>';
}
const uid = String(id).replace(/[^a-zA-Z0-9]/g, '');
const p = 'm' + (++CNT).toString(36) + uid.slice(-6);
const bg = BG[spec.bg || 'blue'] || BG.blue;
const dark = spec.bg === 'navy';
const h = hash(String(id));
let items = spec.items || [];
const kind = items.length ? kindOf(String(id), spec) : 'poster';
let FR = null;
if (kind === 'poster' && items.length && X.front) { FR = X.front.prepare(String(id), spec); spec = FR.spec; items = spec.items || items; }
const heroIsFirst = kind === 'stadium' || kind === 'landmark';
const sw0 = kind === 'poster' ? 1.5 : 1.3;
let heroStr = '', restStr = '';
if (heroIsFirst) {
heroStr = `<g id="${p}h">${place(items[0], sw0)}</g>`;
restStr = items.slice(1).map(it => place(it, sw0)).join('');
} else {
restStr = items.map(it => place(it, sw0)).join('');
}
let body = heroStr + restStr + fallback;
let defs = '';
if (body.indexOf('url(#chk)') >= 0) {
body = body.split('url(#chk)').join(`url(#chk${p})`);
defs += `<pattern id="chk${p}" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#e4483d"/><rect width="4" height="4" fill="#fff"/><rect x="4" y="4" width="4" height="4" fill="#fff"/></pattern>`;
}
const sh = shade(body, p); body = sh.body; defs += sh.defs;
let B;
const gy = spec.gy || 214, gr = spec.gr || 84;
if (kind === 'stadium') B = (X.stadEnv && X.stadEnv(p, h, items[0] && items[0][0])) || bgStadium(p, h);
else if (kind === 'landmark') { B = bgLandmark(p, h); if (X.lmEnv) B.s += X.lmEnv(p, h, items[0] && items[0][0]); }
else if (kind === 'scene' && X.front && !spec.noRich) B = X.front.bg(p, h, String(id), spec, 'scene', null);
else if (FR) B = X.front.bg(p, h, String(id), spec, FR.theme, FR.fr);
else B = bgScene(p, h, bg, dark, kind === 'poster', spec.noGround, gy, gr);
defs += B.d;
let layers = `<g stroke="none">${B.s}</g>`;
if (kind === 'poster' && !FR) {
const dots = [[34, 40], [220, 34], [226, 150], [28, 168], [62, 24], [198, 200], [40, 120], [214, 96]];
const dc = [];
for (let i = 0; i < 4; i++) {
const d = dots[(h + i * 3) % dots.length];
const t = (h >> (i * 3)) % 3;
const fill = 'rgba(255,255,255,.8)';
if (t === 0) dc.push(sparkle(d[0], d[1], 6 + (i % 2) * 2, fill));
else if (t === 1) dc.push(`<circle cx="${d[0]}" cy="${d[1]}" r="${3 + (i % 3)}" fill="${fill}" stroke="none"/>`);
else dc.push(`<path d="M${d[0] - 4},${d[1]} h8 M${d[0]},${d[1] - 4} v8" stroke="${fill}" stroke-width="2.4" fill="none"/>`);
}
layers += `<g stroke="none">${dc.join('')}</g>`;
}
const KS = FR ? FR.k : .88;
let topLight = '';
const BT = `translate(130,122) scale(${KS}) translate(-130,-122)`;
if (heroIsFirst) {
const yb = heroBottom(String(id), `<g>${place(items[0], sw0)}</g>`);
defs += lg(p + 'rf', 0, f(yb), 0, f(yb + 52), [[0, '#fff', .55], [1, '#000', 1]], 1);
defs += `<mask id="${p}rm" maskUnits="userSpaceOnUse" x="-400" y="-400" width="1060" height="1040"><rect x="-400" y="${f(yb)}" width="1060" height="56" fill="url(#${p}rf)"/></mask>`;
defs += rg(p + 'cs', .5, .5, .5, [[0, '#000', .6], [1, '#000', 0]]).replace('gradientUnits="userSpaceOnUse"', '');
layers += `<ellipse cx="130" cy="${f(yb + 1)}" rx="${kind === 'stadium' ? 96 : 70}" ry="10" fill="url(#${p}cs)" stroke="none"/>`;
layers += `<g mask="url(#${p}rm)"><g transform="translate(0,${f(2 * yb)}) scale(1,-1)" opacity=".34"><g transform="${BT}"><use href="#${p}h"/></g></g></g>`;
defs += `<filter id="${p}gw" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="5.5" result="b"/><feFlood flood-color="${kind === 'stadium' ? '#9fc4ff' : '#ffb066'}"/><feComposite in2="b" operator="in"/></filter>`;
defs += `<filter id="${p}wo" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 .95  0 0 0 0 .82  0 0 0 1 0"/></filter>`;
defs += lg(p + 'lk', 0, 20, 0, f(yb), [[0, '#fff', .95], [.5, '#fff', .2], [1, '#000', 0]], 1);
defs += `<mask id="${p}lkm" maskUnits="userSpaceOnUse" x="-400" y="-400" width="1060" height="1040"><rect x="-400" y="-400" width="1060" height="1040" fill="url(#${p}lk)"/></mask>`;
layers += `<g transform="${BT}" opacity=".62"><use href="#${p}h" filter="url(#${p}gw)"/></g>`;
topLight = `<g mask="url(#${p}lkm)" opacity=".3"><g transform="${BT}"><use href="#${p}h" filter="url(#${p}wo)"/></g></g>`;
}
let flt = '';
if (kind !== 'poster') {
defs += `<filter id="${p}ds" x="-25%" y="-25%" width="150%" height="160%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="2.6"/><feOffset dx="1.5" dy="4" result="o"/><feComponentTransfer><feFuncA type="linear" slope=".55"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
flt = ` filter="url(#${p}ds)"`;
}
defs += rg(p + 'gl', 40, 10, 190, [[0, '#ffffff', .2], [1, '#ffffff', 0]]);
const glare = FR ? '' : `<g stroke="none">${FULL(`url(#${p}gl)`)}</g>`;
const label = String(name || '').replace(/[<>&"]/g, '');
return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 240" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role="img" aria-label="${label}" stroke="#0b1226" stroke-opacity=".62" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><defs>${defs}</defs>${layers}<g data-m8b="1" data-m8k="${KS}"${FR ? ' data-m8f="1"' : ''} transform="${BT}"${flt}>${body}</g>${topLight}${glare}</svg>`;
};
})(M8P);
(function (X) {
const { M, INK, f, P, C, E, R, sparkle } = X;
const hex3 = (c) => { c = c.toLowerCase(); return c.length === 4 ? '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3] : c; };
const rgb = (c) => { const n = parseInt(hex3(c).slice(1, 7), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const hx = (a) => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hx(A.map((v, i) => v + (B[i] - v) * t)); };
const rng = (seed) => { let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
const stopsOf = (st) => st.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('');
const lg = (id, x1, y1, x2, y2, st, abs) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${abs ? ' gradientUnits="userSpaceOnUse"' : ''}>${stopsOf(st)}</linearGradient>`;
const rg = (id, cx, cy, r, st, rel) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${rel ? '' : ' gradientUnits="userSpaceOnUse"'}>${stopsOf(st)}</radialGradient>`;
const rect = (x, y, w, h, fill, extra) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}"${extra || ''}/>`;
const FULL = (fill, extra) => rect(-400, -400, 1060, 1040, fill, extra);
const circ = (x, y, r, fill, extra) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}"${extra || ''}/>`;
const poly = (pts, fill, extra) => `<polygon points="${pts}" fill="${fill}"${extra || ''}/>`;
const HUE = {
blue:   { deep: '#06235e', mid: '#1b57d1', bright: '#4fa3ff', glow: '#cfe8ff', acc: '#ffd166', dark: '#030c2b' },
mint:   { deep: '#06453a', mid: '#0f9d7c', bright: '#4fe3c1', glow: '#d4fff1', acc: '#fde68a', dark: '#021a16' },
peach:  { deep: '#7a2610', mid: '#f0661a', bright: '#ffae6b', glow: '#fff0dc', acc: '#fff7ed', dark: '#2a0d04' },
lilac:  { deep: '#34146e', mid: '#7a3ae8', bright: '#c09bff', glow: '#efe3ff', acc: '#fcd34d', dark: '#13072f' },
yellow: { deep: '#8a3d08', mid: '#f29a0a', bright: '#ffd83a', glow: '#fff8c4', acc: '#ef4444', dark: '#3a1803' },
pink:   { deep: '#7a1042', mid: '#e83c92', bright: '#ff9ccb', glow: '#ffe3f1', acc: '#fde68a', dark: '#2e0519' },
teal:   { deep: '#06303f', mid: '#0a8b9c', bright: '#47e3d6', glow: '#c8fbff', acc: '#fde68a', dark: '#02131a' },
sand:   { deep: '#6e300b', mid: '#d38a2c', bright: '#f9cd7d', glow: '#fff1cf', acc: '#7c3aed', dark: '#2a1204' },
green:  { deep: '#05381a', mid: '#13a14a', bright: '#7bf0a0', glow: '#dcffd6', acc: '#fde047', dark: '#021509' },
red:    { deep: '#580812', mid: '#d6212f', bright: '#ff6b78', glow: '#ffd9d6', acc: '#fde047', dark: '#220306' },
grey:   { deep: '#0f1626', mid: '#47597a', bright: '#9fb4d4', glow: '#e7f0ff', acc: '#38bdf8', dark: '#05080f' },
navy:   { deep: '#040922', mid: '#1c2a86', bright: '#5a6df0', glow: '#c9d0ff', acc: '#fbbf24', dark: '#02040f' }
};
X.HUE = HUE;
const THEMES = [
[/^(honeycomb_|interactive_connect)/, 'hive'],
[/^(charades_|gulf_kuwait_theater)/, 'theatre'],
[/^(series_bab_alhara|series_levant|music_tarab)/, 'alley'],
[/^(series_jaafar|series_alkabeer|series_lan_aeesh|series_egypt|series_alasoof|series_alzeer)/, 'village'],
[/^(series_friends|series_the_office|series_tash|series_shabab|series_saudi_general|series_khaleeji|series_la_casa|saudi_brands)/, 'city'],
[/^(series_peaky|series_sherlock|movies_godfather|movies_john_wick|series_prison|series_dark)/, 'fog'],
[/^(series_game_of_thrones|movies_lotr|movies_harry|series_vikings)/, 'castle'],
[/^(movies_matrix)/, 'digital'],
[/^(movies_marvel|movies_nolan|series_stranger)/, 'cosmic'],
[/^(series_breaking_bad)/, 'dusk'],
[/^(movies_pirates)/, 'sea'],
[/^(series_squid)/, 'neon'],
[/^(series_|movies_|turkish_drama|arab_youtubers)/, 'cinema'],
[/^(anime_|cartoon_)/, 'anime'],
[/^(club_|saudi_league|saudi_national|fifa_world|premier|olympic|tennis|basketball|who_is_player|esports|game_fifa)/, 'arena'],
[/^(formula_1|cars_motors|super_cars|wwe_|ufc_)/, 'arena2'],
[/^(video_games|game_|social_media|computer_tech|artificial|saudi_vision)/, 'neon'],
[/^(space_|movies_nolan|general_sciences|chemistry|human_anatomy|great_inventions|amazing_stats)/, 'lab'],
[/^(quran|seerah|qasas|alsahabah|islamic_history|abbasid|saudi_state|saudi_founding|khaleeji|gulf_heritage|nabati|arabic_)/, 'arabesque'],
[/^(country_(kuwait|uae|qatar|bahrain|oman|tunisia)|world_straits|rivers_seas|world_islands)/, 'sea'],
[/^(country_|saudi_|arab_countries|mountains_deserts|ancient_|republic_|europe_|east_asia|americas|world_capitals|world_flags|famous_explorers|historical_battles|world_war)/, 'dusk'],
[/^(wild_animals|plants_nature)/, 'garden']
];
function themeFor(id) { for (const [re, t] of THEMES) if (re.test(id)) return t; return 'pop'; }
const DECOR = {};
DECOR.pop = (p, H, r, d) => {            // disco stage: confetti + diagonal ribbons
let s = '';
for (let i = 0; i < 3; i++) s += poly(`${-60 + i * 110},-40 ${-20 + i * 110},-40 ${60 + i * 110},260 ${20 + i * 110},260`, H.glow, ' opacity=".07"');
for (let i = 0; i < 34; i++) { const x = -20 + r() * 300, y = r() * 200, w = 3 + r() * 5, c = [H.acc, H.glow, H.bright, '#ffffff'][i % 4]; s += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(w * 1.8)}" rx="1" fill="${c}" opacity="${f(.35 + r() * .5)}" transform="rotate(${Math.floor(r() * 180)} ${f(x)} ${f(y)})"/>`; }
return s;
};
DECOR.cinema = (p, H, r, d) => {        // red velvet curtains + marquee bulbs + film grain beams
d.v += lg(p + 'cu', 0, 0, 1, 0, [[0, '#4a0610'], [.25, '#b3182d'], [.5, '#7d0f20'], [.75, '#c41f36'], [1, '#5a0914']]);
let s = '';
const fold = (x0, dir) => {
let q = `M${x0},-40 H${x0 + dir * 62} Q${x0 + dir * 70},40 ${x0 + dir * 44},120 Q${x0 + dir * 34},190 ${x0 + dir * 56},280 H${x0} Z`;
return `<path d="${q}" fill="url(#${p}cu)"/>` + [10, 24, 38, 50].map((o, i) => `<path d="M${x0 + dir * o},-40 Q${x0 + dir * (o + 10)},100 ${x0 + dir * (o - 4)},280" stroke="#2a0309" stroke-opacity=".35" stroke-width="2.2" fill="none"/>`).join('');
};
s += fold(-4, 1) + fold(264, -1);
s += `<path d="M-10,0 Q130,30 270,0 V-30 H-10Z" fill="#7d0f20"/><path d="M-10,0 Q130,30 270,0" stroke="#ffd166" stroke-width="2" fill="none" opacity=".8"/>`;
for (let i = 0; i < 9; i++) { const x = 8 + i * 30.5, y = 4 + Math.sin((x - 130) / 130 * 1.45) * 0 + (1 - Math.pow((x - 130) / 130, 2)) * 22; s += circ(x, y, 3.4, '#fff3b0') + circ(x, y, 7, '#ffe27a', ' opacity=".28"'); }
return s;
};
DECOR.theatre = (p, H, r, d) => {        // silent theatre: curtains + spot circle + dust
let s = DECOR.cinema(p, H, r, d);
d.v += rg(p + 'ts', 130, 120, 92, [[0, '#fffbe0', .65], [.6, '#fff0b0', .18], [1, '#fff0b0', 0]]);
s += circ(130, 120, 92, `url(#${p}ts)`);
for (let i = 0; i < 20; i++) s += circ(40 + r() * 180, 20 + r() * 180, .6 + r() * 1.2, '#fff', ` opacity="${f(.2 + r() * .5)}"`);
return s;
};
DECOR.arena = (p, H, r, d) => {          // night stadium: crowd band + floodlights + striped pitch
d.v += lg(p + 'cb', 0, 118, 0, 160, [[0, mix(H.mid, '#000', .4)], [1, '#070a1c']], 1);
d.v += `<pattern id="${p}cd" width="7" height="6" patternUnits="userSpaceOnUse"><circle cx="1.8" cy="1.8" r="1.2" fill="#f2c14e"/><circle cx="5.2" cy="4.2" r="1.2" fill="#ee6c4d"/><circle cx="3.4" cy="3.2" r=".9" fill="#7aa2ff"/></pattern>`;
let s = rect(-400, 112, 1060, 54, `url(#${p}cb)`) + rect(-400, 112, 1060, 54, `url(#${p}cd)`, ' opacity=".55"') + rect(-400, 111, 1060, 2.4, H.glow, ' opacity=".55"');
[16, 244].forEach(tx => {
s += rect(tx - 1.6, 40, 3.2, 74, '#0a1030');
s += circ(tx, 34, 30, `url(#${p}fh)`, ' opacity=".7"');
s += `<rect x="${tx - 13}" y="26" width="26" height="16" rx="2.5" fill="#1a2250" stroke="#cfe0ff" stroke-opacity=".7" stroke-width=".8"/>`;
for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) s += circ(tx - 8 + a * 8, 30 + b * 8, 2.6, '#fffbe6');
});
d.v += rg(p + 'fh', .5, .5, .5, [[0, '#ffffff', .95], [.4, '#fff6c0', .5], [1, '#fff6c0', 0]], 1);
let y = 166, hh = 3.2, i = 0;
while (y < 330) { s += rect(-400, y, 1060, hh + .6, i % 2 ? '#188a3c' : '#25a84c'); y += hh; hh *= 1.3; i++; }
s += rect(-400, 166, 1060, 120, `url(#${p}fl)`);
s += `<ellipse cx="130" cy="212" rx="90" ry="15" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="1.4"/>` + rect(-400, 212, 1060, 1.2, '#fff', ' opacity=".26"');
return s;
};
DECOR.arena2 = (p, H, r, d) => {         // racing / combat: hard diagonal beams + speed stripes + embers
let s = '';
for (let i = 0; i < 7; i++) s += poly(`${-80 + i * 62},-40 ${-62 + i * 62},-40 ${-120 + i * 62},260 ${-140 + i * 62},260`, i % 2 ? H.glow : H.acc, ` opacity="${i % 2 ? .07 : .09}"`);
for (let i = 0; i < 9; i++) { const y = 150 + i * 6; s += rect(-20 + r() * 40, y, 60 + r() * 150, 1.1 + r() * 1.1, '#fff', ` opacity="${f(.08 + r() * .2)}"`); }
for (let i = 0; i < 26; i++) s += circ(r() * 260, 60 + r() * 150, .7 + r() * 1.5, H.acc, ` opacity="${f(.35 + r() * .5)}"`);
s += poly('-40,206 300,206 300,240 -40,240', '#06080f', ' opacity=".35"');
for (let i = 0; i < 12; i++) s += poly(`${130 + (i - 5.5) * 8},206 ${130 + (i - 5.5) * 60},330 ${130 + (i - 5.5) * 60 + 3},330 ${130 + (i - 5.5) * 8 + 1},206`, '#fff', ' opacity=".07"');
return s;
};
DECOR.neon = (p, H, r, d) => {           // synthwave perspective grid + neon sun + pixels
d.v += lg(p + 'ns', 0, 60, 0, 200, [[0, H.acc], [1, H.bright]], 1);
let s = `<circle cx="130" cy="150" r="58" fill="url(#${p}ns)" opacity=".55"/>`;
for (let i = 0; i < 6; i++) s += rect(70, 130 + i * 9, 120, 1.5 + i * .5, H.deep, ' opacity=".9"');
s += rect(-400, 206, 1060, 400, H.dark, ' opacity=".7"');
for (let i = -14; i <= 14; i++) s += `<line x1="${130 + i * 7}" y1="206" x2="${130 + i * 42}" y2="330" stroke="${H.bright}" stroke-opacity=".5" stroke-width=".9"/>`;
let y = 206, hh = 3; for (let i = 0; i < 9; i++) { s += `<line x1="-400" y1="${f(y)}" x2="660" y2="${f(y)}" stroke="${H.bright}" stroke-opacity=".5" stroke-width=".9"/>`; y += hh; hh *= 1.42; }
for (let i = 0; i < 18; i++) { const w = 3 + r() * 3; s += rect(r() * 250, r() * 140, w, w, [H.acc, H.bright, '#fff'][i % 3], ` opacity="${f(.25 + r() * .5)}"`); }
return s;
};
DECOR.lab = (p, H, r, d) => {            // glowing grid + atoms + data dots
let s = '';
for (let i = -2; i < 16; i++) s += `<line x1="${i * 20}" y1="-40" x2="${i * 20}" y2="260" stroke="${H.bright}" stroke-opacity=".13" stroke-width=".8"/>`;
for (let i = -2; i < 14; i++) s += `<line x1="-40" y1="${i * 20}" x2="300" y2="${i * 20}" stroke="${H.bright}" stroke-opacity=".13" stroke-width=".8"/>`;
for (let i = 0; i < 70; i++) s += circ(r() * 300 - 20, r() * 220 - 10, .5 + r() * 1.3, '#fff', ` opacity="${f(.25 + r() * .6)}"`);
[[34, 52, 16], [226, 60, 11], [208, 170, 14], [42, 168, 9]].forEach(([x, y, rr]) => { s += `<g fill="none" stroke="${H.glow}" stroke-opacity=".38" stroke-width="1.1"><ellipse cx="${x}" cy="${y}" rx="${rr}" ry="${f(rr * .38)}"/><ellipse cx="${x}" cy="${y}" rx="${rr}" ry="${f(rr * .38)}" transform="rotate(60 ${x} ${y})"/><ellipse cx="${x}" cy="${y}" rx="${rr}" ry="${f(rr * .38)}" transform="rotate(-60 ${x} ${y})"/></g>` + circ(x, y, 2.4, H.acc); });
return s;
};
DECOR.dusk = (p, H, r, d) => {           // low sun + two silhouette ridges + dust haze
d.v += rg(p + 'sn', 130, 176, 120, [[0, '#fff6cf', .95], [.25, '#ffd27a', .6], [.6, H.bright, .2], [1, H.bright, 0]]);
d.v += lg(p + 'r1', 0, 150, 0, 210, [[0, mix(H.mid, H.dark, .55)], [1, H.dark]], 1);
d.v += lg(p + 'r2', 0, 170, 0, 215, [[0, mix(H.deep, H.dark, .4)], [1, H.dark]], 1);
const ridge = (base, amp, step) => { let q = `M-60,300 L-60,${f(base)}`; for (let x = -60; x <= 330; x += step) q += ` L${f(x)},${f(base - amp * (.15 + r() * .85))}`; return q + ' L330,300Z'; };
let s = rect(-400, 40, 1060, 170, `url(#${p}sn)`) + circ(130, 176, 24, '#fff2c0', ' opacity=".9"');
s += `<path d="${ridge(176, 24, 17)}" fill="url(#${p}r1)"/><path d="${ridge(190, 12, 11)}" fill="url(#${p}r2)"/>`;
for (let i = 0; i < 4; i++) s += `<ellipse cx="${f(30 + r() * 200)}" cy="${f(50 + i * 28 + r() * 10)}" rx="${f(34 + r() * 40)}" ry="${f(3 + r() * 4)}" fill="#fff" opacity="${f(.14 + r() * .2)}"/>`;
return s;
};
DECOR.sea = (p, H, r, d) => {            // sun glare on layered waves
d.v += rg(p + 'sn', 130, 150, 110, [[0, '#fffbe0', .9], [.3, '#ffe9a0', .45], [1, '#ffe9a0', 0]]);
d.v += lg(p + 'w1', 0, 150, 0, 240, [[0, mix(H.bright, H.mid, .4)], [1, H.deep]], 1);
let s = circ(130, 150, 110, `url(#${p}sn)`) + rect(-400, 160, 1060, 300, `url(#${p}w1)`);
for (let k = 0; k < 6; k++) { const y = 166 + k * 8, a = 3 + k * .7; let q = `M-40,${y}`; for (let x = -40; x <= 300; x += 26) q += ` Q${x + 6.5},${f(y - a)} ${x + 13},${y} T${x + 26},${y}`; s += `<path d="${q}" fill="none" stroke="#fff" stroke-opacity="${f(.4 - k * .04)}" stroke-width="${f(1 + k * .15)}"/>`; }
for (let i = 0; i < 16; i++) s += rect(110 + r() * 50, 156 + r() * 50, 4 + r() * 12, 1, '#fff', ` opacity="${f(.4 + r() * .5)}"`);
return s;
};
DECOR.garden = (p, H, r, d) => {         // layered hills + light shafts + leaf bokeh
d.v += lg(p + 'h1', 0, 130, 0, 220, [[0, mix(H.bright, H.mid, .3)], [1, H.deep]], 1);
d.v += lg(p + 'h2', 0, 150, 0, 230, [[0, mix(H.mid, H.deep, .5)], [1, H.dark]], 1);
let s = '';
for (let i = 0; i < 4; i++) s += poly(`${40 + i * 56},-40 ${64 + i * 56},-40 ${20 + i * 70},230 ${-30 + i * 70},230`, '#fff', ' opacity=".07"');
const hill = (b, a, st, id) => { let q = `M-60,300 L-60,${b}`; for (let x = -60; x <= 330; x += st) q += ` Q${f(x + st / 2)},${f(b - a * (.4 + r() * .6))} ${f(x + st)},${f(b - a * r() * .5)}`; return `<path d="${q} L330,300Z" fill="url(#${p}${id})"/>`; };
s += hill(170, 26, 60, 'h1') + hill(188, 16, 44, 'h2');
for (let i = 0; i < 18; i++) s += `<ellipse cx="${f(r() * 280 - 10)}" cy="${f(r() * 190)}" rx="${f(2 + r() * 4)}" ry="${f(1.2 + r() * 2)}" fill="${[H.bright, H.glow, H.acc][i % 3]}" opacity="${f(.25 + r() * .4)}" transform="rotate(${Math.floor(r() * 180)} ${f(r() * 260)} ${f(r() * 190)})"/>`;
return s;
};
DECOR.arabesque = (p, H, r, d) => {      // islamic geometric star lattice + hanging lanterns + crescent glow
d.v += `<pattern id="${p}ar" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M18,2 L22,14 L34,18 L22,22 L18,34 L14,22 L2,18 L14,14Z" fill="none" stroke="${H.glow}" stroke-opacity=".28" stroke-width="1"/><circle cx="18" cy="18" r="3" fill="${H.acc}" fill-opacity=".25"/></pattern>`;
d.v += rg(p + 'mc', 200, 44, 70, [[0, '#fff7d0', .9], [.3, H.acc, .35], [1, H.acc, 0]]);
let s = rect(-400, -400, 1060, 640, `url(#${p}ar)`) + circ(200, 44, 70, `url(#${p}mc)`);
s += `<path d="M206,24 a22,22 0 1 0 0,40 a17,17 0 1 1 0,-40Z" fill="#fff4c4" opacity=".92"/>`;
[[30, 18], [232, 108]].forEach(([x, y]) => { s += `<line x1="${x}" y1="-20" x2="${x}" y2="${y}" stroke="${H.acc}" stroke-opacity=".7" stroke-width="1"/>` + `<path d="M${x - 7},${y} h14 l-3,-6 h-8Z" fill="${H.acc}"/><path d="M${x - 9},${y} Q${x - 12},${y + 16} ${x},${y + 20} Q${x + 12},${y + 16} ${x + 9},${y}Z" fill="${H.acc}"/><circle cx="${x}" cy="${y + 10}" r="9" fill="#fff6c8" opacity=".35"/>`; });
for (let i = 0; i < 22; i++) s += circ(r() * 260, r() * 210, .6 + r() * 1.2, '#fff', ` opacity="${f(.2 + r() * .5)}"`);
return s;
};
DECOR.anime = (p, H, r, d) => {          // radial speed-line burst + sakura petals
let s = '';
for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2, a2 = a + .035 + r() * .03, R1 = 360; s += poly(`130,118 ${f(130 + Math.cos(a) * R1)},${f(118 + Math.sin(a) * R1)} ${f(130 + Math.cos(a2) * R1)},${f(118 + Math.sin(a2) * R1)}`, i % 2 ? H.glow : H.acc, ` opacity="${f(.06 + r() * .08)}"`); }
d.v += rg(p + 'ab', 130, 118, 90, [[0, '#fff', .8], [.5, H.glow, .25], [1, H.glow, 0]]);
s += circ(130, 118, 90, `url(#${p}ab)`);
for (let i = 0; i < 16; i++) { const x = r() * 270 - 5, y = r() * 220, sz = 3 + r() * 4; s += `<path d="M${f(x)},${f(y)} q${f(sz)},${f(-sz)} ${f(sz * 1.6)},0 q${f(-sz * .3)},${f(sz * 1.4)} ${f(-sz * 1.6)},0Z" fill="${i % 2 ? '#ffd0e4' : '#fff'}" opacity="${f(.5 + r() * .4)}" transform="rotate(${Math.floor(r() * 360)} ${f(x)} ${f(y)})"/>`; }
return s;
};
DECOR.hive = (p, H, r, d) => {           // honeycomb wall with glowing amber cells
const hexp = (cx, cy, rr) => { let q = []; for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; q.push(f(cx + rr * Math.cos(a)) + ',' + f(cy + rr * Math.sin(a))); } return q.join(' '); };
let s = '';
const R0 = 15, w = R0 * Math.sqrt(3);
for (let row = -2; row < 12; row++) for (let col = -2; col < 12; col++) {
const cx = col * w + (row % 2 ? w / 2 : 0), cy = row * R0 * 1.5, lit = r();
s += poly(hexp(cx, cy, R0 - 1.6), lit > .86 ? H.acc : (lit > .6 ? H.bright : 'none'), ` stroke="${H.glow}" stroke-opacity=".38" stroke-width="1" fill-opacity="${lit > .86 ? .55 : lit > .6 ? .2 : 0}"`);
}
return s;
};
function build(p, h, id, spec, theme, fr) {
const key = spec.bg || 'blue';
const H = HUE[key] || HUE.blue;
const r = rng(h);
const d = { v: '' };
d.v += lg(p + 'fs', 0, -40, 0, 230, [[0, H.deep], [.42, H.mid], [1, mix(H.mid, H.bright, .5)]], 1);
d.v += rg(p + 'fg', 130, 108, 150, [[0, H.glow, .8], [.32, H.bright, .38], [1, H.mid, 0]]);
d.v += rg(p + 'fv', 130, 116, 215, [[.42, '#000', 0], [1, H.dark, .85]]);
d.v += lg(p + 'fb', 0, 0, 0, 1, [[0, H.glow, .9], [.5, H.glow, .22], [1, H.glow, 0]]);
d.v += lg(p + 'fl', 0, 196, 0, 330, [[0, mix(H.deep, '#000', .15), .05], [1, H.dark, .9]], 1);
d.v += rg(p + 'fr', 130, 208, 118, [[0, H.glow, .95], [.35, H.bright, .5], [1, H.mid, 0]]);
d.v += rg(p + 'ha', 130, 118, 82, [[0, '#fff', .62], [.5, H.glow, .22], [1, H.glow, 0]]);
d.v += rg(p + 'bk', .5, .5, .5, [[0, '#fff', .75], [.7, H.glow, .22], [1, H.glow, 0]], 1);
let s = FULL(`url(#${p}fs)`) + FULL(`url(#${p}fg)`);
let decor = (DECOR[theme] || DECOR.pop)(p, H, r, d);
let beams = '';
[[-120, 28, .5], [-52, 22, .34], [52, 22, .34], [120, 28, .5]].forEach(([dx, w, o]) => { beams += poly(`${130 + dx * .12 - 7},-40 ${130 + dx * .12 + 7},-40 ${130 + dx + w},250 ${130 + dx - w},250`, `url(#${p}fb)`, ` opacity="${o}"`); });
let floor = rect(-400, 204, 1060, 400, `url(#${p}fl)`);
floor += `<ellipse cx="130" cy="208" rx="124" ry="22" fill="url(#${p}fr)"/>`;
floor += `<ellipse cx="130" cy="208" rx="104" ry="15" fill="none" stroke="${H.glow}" stroke-opacity=".55" stroke-width="1.3"/>`;
floor += `<ellipse cx="130" cy="208" rx="70" ry="9" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1"/>`;
let halo = circ(130, 118, 84, `url(#${p}ha)`);
let bok = '';
for (let i = 0; i < 12; i++) { const rr = 4 + r() * 11; bok += circ(-10 + r() * 280, 6 + r() * 190, rr, `url(#${p}bk)`, ` opacity="${f(.16 + r() * .3)}"`); }
let sp = '';
[[34, 40, 7], [222, 34, 6], [230, 156, 5], [30, 170, 6], [62, 22, 4], [196, 202, 4]].forEach(([x, y, q], i) => { if ((h >> i) & 1) sp += sparkle(x, y, q, 'rgba(255,255,255,.9)'); });
const vig = FULL(`url(#${p}fv)`);
if (fr && fr.decor) { const o = fr.decor(p, H, r, d); decor = (fr.replace ? '' : decor) + (o || ''); }
return { d: d.v, s: s + decor + beams + floor + halo + bok + `<g stroke="none">${sp}</g>` + vig, H, floorY: 208 };
}
X.front = {
themeFor: themeFor,
CH: {},                         // bespoke challenge-category designs, filled by d3_challenge.js
prepare: function (id, spec) {
const ch = X.front.CH[id];
const theme = (ch && ch.theme) || themeFor(id);
const out = { theme: theme, k: (ch && ch.k) || 1.12, fr: ch || null, spec: spec };
if (ch && ch.items) out.spec = Object.assign({}, spec, { items: ch.items, bg: ch.bg || spec.bg });
else if (ch && ch.bg) out.spec = Object.assign({}, spec, { bg: ch.bg });
if (ch && ch.kind) out.kind = ch.kind;
return out;
},
bg: build,
util: { rng, mix, lg, rg, rect, FULL, circ, poly, hexOf: (cx, cy, rr) => { let q = []; for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; q.push(f(cx + rr * Math.cos(a)) + ',' + f(cy + rr * Math.sin(a))); } return q.join(' '); } },
DECOR: DECOR, HUE: HUE
};
})(M8P);
(function (X) {
const { M, INK, NS, f, P, C, E, R, L, POLY, HL, SH, star, sparkle } = X;
const W = '#ffffff';
const FR = X.front, U = FR.util, DECOR = FR.DECOR;
const poly = U.poly;
const TXT = (t, x, y, size, fill, extra) => `<text x="${x}" y="${y}" font-family="Cairo,Tajawal,'Segoe UI',Arial,sans-serif" font-weight="900" font-size="${size}" text-anchor="middle" fill="${fill}" stroke="none" ${extra || ''}>${t}</text>`;
const inner = (name, x, y, s, o, sw) => `<g transform="translate(${x},${y}) scale(${s})" stroke-width="${sw || 3.1}">${(M[name] || (() => ''))(o || {})}</g>`;
M.nosay = (o) =>
P('M-44,-34 Q-44,-50 -28,-50 H28 Q44,-50 44,-34 V8 Q44,24 28,24 H4 L-20,46 L-16,24 H-28 Q-44,24 -44,8Z', W) +
[-18, 0, 18].map(x => C(x, -14, 5.2, '#8a96ab', NS)).join('') +
HL('M-38,-40 Q-30,-46 -18,-46 Q-34,-42 -38,-26Z') +
C(0, -12, 49, 'rgba(230,52,62,.10)', 'stroke="#e6343e" stroke-width="7.5"') +
L(-35, 22, 35, -46, 'stroke="#e6343e" stroke-width="7.5" stroke-linecap="round"');
M.stopwatch = (o) =>
R(-6, -54, 12, 10, '#8aa0b8', 2.5) + R(-4, -58, 8, 5, '#6b7c93', 2) +
`<g transform="rotate(42)">` + R(-5, -52, 10, 9, '#8aa0b8', 2.5) + `</g>` +
C(0, 0, 42, '#e8553d') + C(0, 0, 34.5, W, 'stroke-width="2"') +
[...Array(12)].map((_, i) => L(0, -30, 0, i % 3 ? -27.5 : -25, `transform="rotate(${i * 30})" stroke-width="${i % 3 ? 1.4 : 2.2}"`)).join('') +
P('M0,0 L0,-32 A32,32 0 0 1 27.7,-16Z', '#ffb199', NS) +
L(0, 0, 14, -22, 'stroke-width="3.2" stroke-linecap="round"') + C(0, 0, 4, INK, NS) +
HL('M-30,-18 Q-24,-32 -8,-36 Q-26,-28 -28,-8Z');
M.checklist = (o) =>
R(-37, -45, 74, 94, '#c99a5b', 8) + R(-30, -35, 60, 78, W, 4) + R(-15, -52, 30, 16, '#8aa0b8', 5) + C(0, -46, 3, INK, NS) +
[0, 1, 2, 3].map(i => { const y = -22 + i * 17, on = i < 3; return R(-24, y - 6, 12, 12, on ? '#58c27d' : W, 2.5, 'stroke-width="1.8"') + (on ? P(`M${-22},${y} L${-18.5},${y + 3.6} L${-13},${y - 4}`, 'none', 'stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"') : '') + L(-7, y, on ? 23 : 12, y, 'stroke="#8a96ab" stroke-width="3.2" stroke-linecap="round"') + (on ? '' : TXT('؟', 20, y + 6, 17, '#e8553d')); }).join('') +
HL('M-34,-40 Q-30,-44 -24,-44 Q-32,-34 -33,-12Z');
const polaroid = (x, y, rot, sc, tint, innerStr) =>
`<g transform="translate(${x},${y}) rotate(${rot}) scale(${sc})" stroke-width="${f(1.5 / sc)}">` + R(-27, -31, 54, 64, W, 6, 'stroke-width="2.4"') + R(-22, -26, 44, 44, tint, 3, NS) + innerStr + P('M-22,18 H22', 'none', 'stroke="#d7deea" stroke-width="1.2"') + R(-14, 23, 28, 4, '#cfd8e6', 2, NS) + `</g>`;
M.rebuscards = (o) =>
polaroid(-54, -42, -7, 1.32, o.ta || '#cfe8ff', inner(o.a || 'duck', 0, -5, .43, o.oa)) +
polaroid(54, -46, 6, 1.32, o.tb || '#ffe9c4', inner(o.b || 'ice', 0, -5, .43, o.ob)) +
C(0, -44, 15, '#58c27d', 'stroke-width="2.6"') + R(-8, -46.6, 16, 5.2, W, 1.8, NS) + R(-2.6, -52, 5.2, 16, W, 1.8, NS) +
R(-15, 4, 30, 6, '#fff', 3, 'stroke-width="1.8"') + R(-15, 16, 30, 6, '#fff', 3, 'stroke-width="1.8"') +
`<g transform="translate(0,68) rotate(-3) scale(1.3)" stroke-width="1.15">` + R(-27, -31, 54, 64, '#ffd84a', 6, 'stroke-width="2.4"') + R(-22, -26, 44, 54, '#ffeb85', 3, NS) + TXT('؟', 0, 14, 52, '#d6341e') + HL('M-24,-26 Q-22,-30 -14,-30 Q-22,-22 -23,-6Z') + `</g>`;
M.landframe = (o) =>
R(-70, -52, 140, 104, '#d9a636', 8, 'stroke-width="2.6"') + R(-60, -43, 120, 86, '#9fd3ff', 3, 'stroke-width="1.8"') +
R(-60, 14, 120, 29, '#e8c98a', 3, NS) + C(34, -24, 10, '#ffd84a', NS) +
inner('eiffel', -26, 6, .62, {}, 2.4) + inner('pyramids', 28, 26, .5, {}, 2.6) +
[[-70, -52], [70, -52], [-70, 52], [70, 52]].map(([x, y]) => C(x, y, 5.2, '#fff3b0', 'stroke-width="1.6"')).join('') +
C(64, 46, 17, '#e8553d', 'stroke-width="2.4"') + TXT('؟', 64, 56, 28, '#fff') + HL('M-66,-48 H-20 L-30,-44 H-62Z');
M.cipherboard = (o) => {
const cx = [-38, 0, 38];
return R(-64, -42, 128, 92, '#0f1a38', 11, 'stroke="#52e1ff" stroke-width="3"') + R(-58.5, -36.5, 117, 81, 'none', 8, 'stroke="#52e1ff" stroke-opacity=".35" stroke-width="1.2"') +
TXT('ح', cx[0], 18, 52, W) + TXT('ٮ', cx[1], 16, 46, '#ffd84a') + TXT('ر', cx[2], 18, 50, W) +
`<g fill="rgba(255,179,64,.12)" stroke="#ffb340" stroke-width="2.2" stroke-dasharray="3.4 3" stroke-linecap="round"><circle cx="${cx[0]}" cy="-24" r="8"/><circle cx="${cx[1]}" cy="34" r="8" stroke="#ff7a59"/><circle cx="${cx[2]}" cy="-24" r="8"/></g>` +
TXT('؟', cx[0], -19.6, 13, '#ffb340') + TXT('؟', cx[1], 38.4, 13, '#ff7a59') + TXT('؟', cx[2], -19.6, 13, '#ffb340') +
C(54, -34, 7, '#ff7a59', 'stroke-width="1.5"') + C(-54, 38, 5, '#ffd84a', NS) + C(60, 22, 3.4, '#52e1ff', NS);
};
M.orderstairs = (o) => {
const cols = ['#4f9be8', '#58c27d', '#f6b93b', '#e8553d'], txt = ['#fff', '#fff', '#2a1f08', '#fff'], nums = o.nums || ['3', '1', '4', '2'];
let s = '';
for (let i = 0; i < 4; i++) {
const x = -57 + i * 38, h = 34 + i * 22, y = 50 - h;
s += R(x - 17, y, 34, h, cols[i], 4, 'stroke-width="2"') + R(x - 17, y, 34, 10, W, 4, 'fill-opacity=".30" stroke="none"') + TXT(nums[i], x, y + 31, 26, txt[i]);
}
s += P('M-52,-14 Q-38,-34 -24,-14', 'none', 'stroke="#fff" stroke-width="4.4" stroke-linecap="round"') + POLY('-27,-24 -20,-10 -33,-12', W, NS) + POLY('-49,-24 -56,-10 -43,-12', W, NS);
s += star(57, -62, 11, '#ffd84a', 'stroke-width="1.6"');
return s;
};
M.elephant = (o) => {
const c = o.c || '#9aa9bb', d = '#7d8da3', l = '#b4c1d0';
return R(-3, 8, 15, 31, d, 6) + R(34, 9, 15, 30, d, 6) +                     // far legs
R(-24, 8, 17, 32, c, 7) + R(18, 9, 17, 31, c, 7) +                         // near legs
[[-15.5, 38], [26.5, 37], [4.5, 38], [41.5, 37]].map(([x, y]) => E(x, y, 5.6, 2.6, '#e4d6c3', NS)).join('') +
P('M50,-8 Q60,0 55,20 Q54,26 50,26 Q52,14 49,4', 'none', `stroke="${d}" stroke-width="4" stroke-linecap="round"`) + E(51.5, 28, 3.4, 4.6, d) +   // tail
P('M-40,-27 Q-28,-40 -12,-35 Q8,-42 28,-33 Q51,-28 53,-6 Q55,11 44,13 Q26,17 6,15 Q-10,17 -22,13 Q-36,17 -44,7 Q-51,-4 -48,-17 Q-46,-25 -40,-27Z', c) +
P('M-30,-30 Q-16,-38 -2,-33 Q-18,-22 -30,-30Z', l, NS) + P('M-6,-20 Q16,-32 40,-26 Q22,-22 -6,-20Z', l, 'fill-opacity=".55" stroke="none"') +
P('M-24,-26 Q-4,-42 4,-16 Q6,6 -12,12 Q-34,4 -24,-26Z', d) + P('M-20,-18 Q-6,-30 -2,-14 Q0,0 -12,5 Q-24,-2 -20,-18Z', '#e9b4be', NS) +   // ear
P('M-44,-14 Q-62,-8 -60,16 Q-59,31 -50,36 Q-43,39 -43,31 Q-50,25 -49,13 Q-48,4 -40,0Z', c) +                          // trunk
[-8, 2, 12, 22].map(y => P(`M${-57 + (y > 12 ? 4 : 0)},${y} q4,2 8,0`, 'none', `stroke="${d}" stroke-width="1.3" stroke-linecap="round"`)).join('') +
P('M-47,3 Q-60,10 -55,24 Q-50,16 -42,8Z', '#fbf4e4') +                                                                // tusk
C(-40, -13, 2.6, INK, NS) + C(-40.8, -14, .9, W, NS) +
HL('M-12,-33 Q4,-38 18,-33 Q4,-31 -10,-28Z');
};
M.dreamcloud = (o) => {
const cs = [[-46, 8, 30], [-16, -14, 36], [24, -12, 35], [54, 10, 29], [4, 22, 34], [-24, 26, 26], [32, 28, 26]];
const all = cs.map(([x, y, r]) => C(x, y, r, '#fff')).join('');
const fill = cs.map(([x, y, r]) => C(x, y, r, '#fff', NS)).join('');
return `<g opacity=".97">${all}${fill}</g>` + C(-70, 60, 10, W) + C(-86, 80, 6, W) + C(-96, 92, 3.4, W) +
P('M-30,-26 Q-8,-44 18,-34', 'none', 'stroke="#e6eefc" stroke-width="5" stroke-linecap="round" opacity=".9"');
};
DECOR.dream = (p, H, r, d) => {       // aurora ribbons + moon + stars + soap bubbles
d.v += U.lg(p + 'au', 0, 0, 1, 0, [[0, '#7cf6d0', 0], [.3, '#7cf6d0', .5], [.6, '#a78bff', .5], [1, '#ff9ee0', 0]]);
let s = '';
[[40, 34, 0], [70, 26, 1], [96, 40, 2]].forEach(([y, a, i]) => { s += `<path d="M-40,${y} Q40,${y - a} 130,${y + 6} T300,${y - 6} V${y + 26} Q220,${y + 26 + a / 2} 130,${y + 22} T-40,${y + 30}Z" fill="url(#${p}au)" opacity="${.34 - i * .07}"/>`; });
s += `<path d="M214,28 a26,26 0 1 0 0,48 a21,21 0 1 1 0,-48Z" fill="#fff6c4"/>` + U.circ(214, 52, 46, '#fff6c4', ' opacity=".12"');
for (let i = 0; i < 40; i++) s += U.circ(r() * 280 - 10, r() * 180, .6 + r() * 1.5, '#fff', ` opacity="${f(.3 + r() * .6)}"`);
for (let i = 0; i < 9; i++) { const x = 10 + r() * 240, y = 20 + r() * 190, q = 4 + r() * 9; s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(q)}" fill="rgba(255,255,255,.07)" stroke="#fff" stroke-opacity=".5" stroke-width=".9"/><path d="M${f(x - q * .5)},${f(y - q * .35)} q${f(q * .15)},${f(-q * .35)} ${f(q * .5)},${f(-q * .4)}" stroke="#fff" stroke-opacity=".8" stroke-width="1" fill="none"/>`; }
return s;
};
DECOR.puzzle = (p, H, r, d) => {      // scattered jigsaw pieces + spot-lit frames
const jig = (x, y, s, rot, col, op) => `<path transform="translate(${f(x)},${f(y)}) rotate(${rot}) scale(${s})" d="M0,0 H.35 Q.35,-.2 .5,-.2 Q.65,-.2 .65,0 H1 V.35 Q1.2,.35 1.2,.5 Q1.2,.65 1,.65 V1 H.65 Q.65,1.2 .5,1.2 Q.35,1.2 .35,1 H0Z" fill="${col}" fill-opacity="${op}" stroke="#fff" stroke-opacity="${f(op + .25)}" stroke-width="${f(1.2 / s)}"/>`;
let s = '';
for (let i = 0; i < 16; i++) s += jig(r() * 270 - 16, r() * 210 - 10, 22 + r() * 30, Math.floor(r() * 4) * 90, [H.bright, H.glow, H.acc][i % 3], f(.1 + r() * .14));
for (let i = 0; i < 24; i++) s += U.circ(r() * 270, r() * 200, .6 + r() * 1.3, '#fff', ` opacity="${f(.3 + r() * .5)}"`);
return s;
};
DECOR.cipher = (p, H, r, d) => {      // dark grid + falling glowing dots + dashed target rings
let s = '';
for (let i = -1; i < 14; i++) s += `<line x1="${i * 22}" y1="-40" x2="${i * 22}" y2="260" stroke="#52e1ff" stroke-opacity=".1" stroke-width=".8"/>`;
for (let i = -1; i < 12; i++) s += `<line x1="-40" y1="${i * 22}" x2="300" y2="${i * 22}" stroke="#52e1ff" stroke-opacity=".1" stroke-width=".8"/>`;
for (let c = 0; c < 12; c++) { const x = 10 + c * 22 + r() * 8, y0 = r() * 120, n = 3 + Math.floor(r() * 5); for (let k = 0; k < n; k++) s += U.circ(x, y0 + k * 9, 1.4 + (k === n - 1 ? 1.4 : 0), k === n - 1 ? '#ffb340' : '#52e1ff', ` opacity="${f((k + 1) / n * .7)}"`); }
[[36, 170, 14], [224, 46, 11], [230, 176, 9], [34, 52, 9]].forEach(([x, y, q]) => s += `<circle cx="${x}" cy="${y}" r="${q}" fill="none" stroke="#ffb340" stroke-width="1.6" stroke-dasharray="3 3" opacity=".75"/>`);
return s;
};
DECOR.timer = (p, H, r, d) => {       // giant dial ring + sweep beam + tick marks
d.v += U.rg(p + 'sw', 130, 118, 110, [[0, '#fff', .0], [.55, '#fff', .12], [1, '#fff', .34]]);
let s = `<circle cx="130" cy="118" r="108" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2"/><circle cx="130" cy="118" r="96" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="1.2"/>`;
for (let i = 0; i < 60; i++) { const a = i * 6 * Math.PI / 180, big = i % 5 === 0, r1 = 108, r2 = big ? 96 : 101; s += `<line x1="${f(130 + Math.sin(a) * r1)}" y1="${f(118 - Math.cos(a) * r1)}" x2="${f(130 + Math.sin(a) * r2)}" y2="${f(118 - Math.cos(a) * r2)}" stroke="#fff" stroke-opacity="${big ? .6 : .3}" stroke-width="${big ? 2 : 1}"/>`; }
s += `<path d="M130,118 L130,10 A108,108 0 0 1 222,64Z" fill="url(#${p}sw)" opacity=".7"/>`;
for (let i = 0; i < 14; i++) s += U.circ(r() * 270, r() * 200, .8 + r() * 1.6, H.acc, ` opacity="${f(.3 + r() * .5)}"`);
return s;
};
DECOR.rings = (p, H, r, d) => {       // sound ripples + equalizer floor + sparkles
let s = '';
for (let i = 0; i < 7; i++) s += `<circle cx="130" cy="112" r="${28 + i * 17}" fill="none" stroke="${i % 2 ? H.glow : H.acc}" stroke-opacity="${f(.5 - i * .06)}" stroke-width="${f(2.4 - i * .25)}"${i % 3 === 1 ? ' stroke-dasharray="5 5"' : ''}/>`;
for (let i = 0; i < 40; i++) { const hh = 6 + (Math.sin(i * 1.7) + 1) * 14 + r() * 12; s += U.rect(-6 + i * 7, 240 - hh, 4.4, hh, i % 3 ? H.bright : H.acc, ` opacity=".42" rx="2"`); }
for (let i = 0; i < 20; i++) s += U.circ(r() * 270, r() * 190, .7 + r() * 1.4, '#fff', ` opacity="${f(.3 + r() * .5)}"`);
return s;
};
DECOR.focus = (p, H, r, d) => {       // viewfinder: concentric rings + crosshair + corner brackets
let s = '';
[24, 48, 74, 102].forEach((q, i) => s += `<circle cx="130" cy="118" r="${q}" fill="none" stroke="#fff" stroke-opacity="${f(.5 - i * .1)}" stroke-width="${f(1.8 - i * .2)}"${i === 2 ? ' stroke-dasharray="6 5"' : ''}/>`);
s += `<g stroke="#fff" stroke-opacity=".5" stroke-width="1.4"><line x1="130" y1="-20" x2="130" y2="256"/><line x1="-20" y1="118" x2="280" y2="118"/></g>`;
[[16, 18, 1, 1], [244, 18, -1, 1], [16, 214, 1, -1], [244, 214, -1, -1]].forEach(([x, y, sx, sy]) => s += `<path d="M${x},${y + sy * 22} V${y} H${x + sx * 22}" fill="none" stroke="${H.acc}" stroke-width="3.2" stroke-linecap="round"/>`);
for (let i = 0; i < 18; i++) s += U.circ(r() * 270, r() * 220, .7 + r() * 1.3, '#fff', ` opacity="${f(.25 + r() * .5)}"`);
return s;
};
DECOR.podium = (p, H, r, d) => {      // ghost staircase + arrows + confetti
let s = '';
for (let i = 0; i < 6; i++) s += U.rect(-10 + i * 46, 206 - i * 26, 46, 60 + i * 26, '#fff', ` opacity="${f(.05 + i * .012)}"`);
for (let i = 0; i < 6; i++) s += `<path d="M${-10 + i * 46},${206 - i * 26} h46" stroke="#fff" stroke-opacity=".3" stroke-width="1.6"/>`;
s += DECOR.pop(p, H, r, d);
return s;
};
DECOR.scene = (p, H, r, d) => {       // per-question pictures: light dust only, so the picture itself stays the star
let s = '';
for (let i = 0; i < 22; i++) s += U.circ(r() * 270 - 5, r() * 200, .6 + r() * 1.5, '#fff', ` opacity="${f(.25 + r() * .5)}"`);
return s;
};
const mixc = U.mix;
DECOR.alley = (p, H, r, d) => {       // old-quarter alley: arched stone wall, hanging lanterns, cobbles
d.v += `<pattern id="${p}ac" width="46" height="84" patternUnits="userSpaceOnUse"><path d="M9,84 V40 Q9,16 23,16 Q37,16 37,40 V84Z" fill="${H.dark}" fill-opacity=".6" stroke="${H.glow}" stroke-opacity=".3" stroke-width="1.2"/><rect x="0" y="0" width="46" height="84" fill="none" stroke="${H.glow}" stroke-opacity=".08"/></pattern>`;
d.v += U.rg(p + 'ln', .5, .5, .5, [[0, '#fff0b0', .95], [.4, '#ffc15a', .45], [1, '#ffc15a', 0]], 1);
let s = U.rect(-400, -40, 1060, 240, mixc(H.deep, '#000', .25)) + U.rect(-400, 10, 1060, 168, `url(#${p}ac)`);
s += U.rect(-400, 6, 1060, 8, mixc(H.mid, '#000', .5)) + U.rect(-400, 176, 1060, 8, mixc(H.mid, '#000', .5));
[[34, 40], [96, 66], [172, 56], [232, 74]].forEach(([x, y]) => { s += `<line x1="${x}" y1="-10" x2="${x}" y2="${y}" stroke="#2b1a10" stroke-width="1.2"/>` + U.circ(x, y + 10, 24, `url(#${p}ln)`) + `<path d="M${x - 6},${y} h12 l3,5 v12 q-9,5 -18,0 v-12Z" fill="#ffd36a" stroke="#6b3a12" stroke-width="1"/>`; });
for (let i = 0; i < 40; i++) s += U.rect(-6 + (i % 20) * 14, 186 + Math.floor(i / 20) * 9, 12, 7, '#000', ` opacity="${f(.12 + r() * .12)}" rx="2"`);
return s;
};
DECOR.city = (p, H, r, d) => {        // night city: two skyline layers with lit windows + moon
let s = U.circ(212, 40, 15, '#fff6d0', ' opacity=".9"') + U.circ(212, 40, 34, '#fff6d0', ' opacity=".1"');
const layer = (base, hmin, hmax, col, lit) => { let x = -20; while (x < 290) { const w = 14 + r() * 20, h = hmin + r() * (hmax - hmin); s += U.rect(x, base - h, w, h + 2, col); for (let yy = base - h + 5; yy < base - 3; yy += 7) for (let xx = x + 3; xx < x + w - 3; xx += 6) if (r() < lit) s += U.rect(xx, yy, 2.6, 3.2, '#ffe08a', ' opacity=".85"'); x += w + 1; } };
layer(176, 50, 112, mixc(H.deep, '#000', .35), .16); layer(194, 26, 70, mixc(H.dark, H.deep, .3), .34);
return s;
};
DECOR.fog = (p, H, r, d) => {         // foggy street: gas lamps with light cones + mist banks
d.v += U.lg(p + 'lc', 0, 0, 0, 1, [[0, '#ffe9a8', .55], [1, '#ffe9a8', 0]]);
let s = '';
[[40, .9], [130, 1.1], [220, .9]].forEach(([x, k]) => { s += `<polygon points="${x - 3},${f(30 * k)} ${x + 3},${f(30 * k)} ${x + 34},200 ${x - 34},200" fill="url(#${p}lc)" opacity=".5"/>` + U.rect(x - 1.6, 34 * k, 3.2, 150, '#0a0d16') + U.circ(x, 30 * k, 11, '#fff0b8', ' opacity=".35"') + `<path d="M${x - 6},${f(32 * k)} l3,-9 h6 l3,9Z" fill="#ffe08a"/><rect x="${x - 7}" y="${f(32 * k)}" width="14" height="3" fill="#0a0d16"/>`; });
for (let i = 0; i < 7; i++) s += `<ellipse cx="${f(r() * 260)}" cy="${f(70 + i * 20 + r() * 8)}" rx="${f(50 + r() * 60)}" ry="${f(6 + r() * 6)}" fill="#fff" opacity="${f(.1 + r() * .14)}"/>`;
return s;
};
DECOR.castle = (p, H, r, d) => {      // snowy peaks + distant towers + cloud banks
let s = '';
[[20, 60, 94], [96, 38, 120], [168, 70, 100], [238, 52, 112]].forEach(([x, h, w], i) => { s += poly(`${x - w / 2},190 ${x},${190 - h * 2} ${x + w / 2},190`, mixc(H.deep, '#000', .3 + i * .04)) + poly(`${x - 11},${190 - h * 2 + 22} ${x},${190 - h * 2} ${x + 11},${190 - h * 2 + 22} ${x + 4},${190 - h * 2 + 16} ${x - 3},${190 - h * 2 + 24}`, '#eaf2ff', ' opacity=".9"'); });
[[34, 150, 22], [226, 142, 26]].forEach(([x, y, w]) => { s += U.rect(x - w / 2, y, w, 190 - y, '#10132a') + poly(`${x - w / 2 - 2},${y} ${x},${y - 16} ${x + w / 2 + 2},${y}`, '#10132a') + U.rect(x - 2, y + 8, 4, 7, '#ffd27a'); });
for (let i = 0; i < 4; i++) s += `<ellipse cx="${f(30 + r() * 200)}" cy="${f(150 + i * 12)}" rx="${f(50 + r() * 40)}" ry="${f(7 + r() * 5)}" fill="#fff" opacity="${f(.2 + r() * .16)}"/>`;
for (let i = 0; i < 36; i++) s += U.circ(r() * 270, r() * 110, .5 + r() * 1.2, '#fff', ` opacity="${f(.3 + r() * .5)}"`);
return s;
};
DECOR.village = (p, H, r, d) => {     // mud-brick village + palms at dusk
d.v += U.rg(p + 'vs', 130, 170, 130, [[0, '#fff2c0', .8], [.4, '#ffb35c', .3], [1, '#ffb35c', 0]]);
let s = U.circ(130, 170, 130, `url(#${p}vs)`);
let x = -20; while (x < 290) { const w = 22 + r() * 18, h = 20 + r() * 26, col = mixc(H.mid, '#000', .45 + r() * .15); s += U.rect(x, 190 - h, w, h + 2, col) + U.rect(x - 1, 188 - h, w + 2, 3, mixc(col, '#fff', .12)); for (let k = 0; k < 2; k++) if (r() > .35) s += U.rect(x + 4 + k * (w / 2 - 2), 190 - h + 8, 4, 6, '#ffd27a', ' opacity=".9"'); x += w + 2 + r() * 4; }
const palm = (x, y, k) => `<path d="M${x},${y} Q${x + 3 * k},${y - 26 * k} ${x - k},${y - 52 * k}" stroke="#0d0a1c" stroke-width="${f(3 * k)}" fill="none" stroke-linecap="round"/>` + [0, 1, 2, 3, 4, 5, 6].map(i => { const a = -160 + i * 53, ex = Math.cos(a * Math.PI / 180) * 26 * k, ey = Math.sin(a * Math.PI / 180) * 13 * k; return `<path d="M${x - k},${y - 52 * k} q${f(ex * .5)},${f(ey - 8 * k)} ${f(ex)},${f(ey + 8 * k)}" stroke="#0d0a1c" stroke-width="${f(2.6 * k)}" fill="none" stroke-linecap="round"/>`; }).join('');
return s + palm(24, 192, .9) + palm(238, 194, 1);
};
DECOR.digital = (p, H, r, d) => {     // falling code columns
let s = '';
for (let c = 0; c < 22; c++) { const x = -4 + c * 12.4, y0 = r() * 140, n = 6 + Math.floor(r() * 10); for (let k = 0; k < n; k++) s += U.rect(x, y0 + k * 8.2, 5, 6, k === n - 1 ? '#d8ffd8' : '#3dff7a', ` opacity="${f((k + 1) / n * .62)}" rx="1"`); }
return s;
};
DECOR.cosmic = (p, H, r, d) => {      // nebula + stars + ringed horizon
d.v += U.rg(p + 'n1', 60, 60, 90, [[0, H.bright, .6], [1, H.bright, 0]]) + U.rg(p + 'n2', 210, 130, 100, [[0, H.acc, .4], [1, H.acc, 0]]);
let s = U.circ(60, 60, 90, `url(#${p}n1)`) + U.circ(210, 130, 100, `url(#${p}n2)`);
for (let i = 0; i < 70; i++) s += U.circ(r() * 280 - 10, r() * 200, .5 + r() * 1.5, '#fff', ` opacity="${f(.3 + r() * .6)}"`);
s += `<path d="M-40,210 Q130,150 300,210" fill="none" stroke="${H.glow}" stroke-opacity=".4" stroke-width="2"/><path d="M-40,222 Q130,170 300,222" fill="none" stroke="${H.glow}" stroke-opacity=".18" stroke-width="5"/>`;
return s;
};
const CH = FR.CH;
const charades = (bg, items) => ({ theme: 'theatre', bg, k: 1.12, items });
CH.charades_general = charades('yellow', [['maskpair', 112, 128, 1.6], ['nosay', 198, 62, .86, 8]]);
CH.charades_arabic = charades('peach', [['person', 118, 104, 1.34, 0, { head: 'fez', top: 'gal', tc: '#8b6fd6', tc2: '#fff', hc: '#c8372d', len: 80 }], ['clap', 50, 176, .8], ['popcorn', 208, 178, .78], ['nosay', 204, 58, .78, 8]]);
CH.charades_english = charades('lilac', [['film', 100, 56, 1.1, -6], ['clap', 118, 134, 1.6], ['popcorn', 214, 176, .8], ['nosay', 208, 60, .78, 8]]);
CH.charades_sports = charades('green', [['person', 112, 108, 1.4, 0, { head: 'hair', top: 'jersey', tc: '#2f7de1', tc2: '#fff', hc: '#3b2a1e', skin: 'c', len: 80 }], ['football', 192, 170, .85], ['nosay', 204, 60, .78, 8]]);
CH.rebus_general = { theme: 'puzzle', bg: 'teal', k: 1.12, items: [['rebuscards', 130, 112, 1.1, 0, { a: 'duck', b: 'ice' }]] };
CH.rebus_words = { theme: 'puzzle', bg: 'blue', k: 1.12, items: [['landframe', 130, 120, 1.5]] };
CH.rebus_football = { theme: 'arena', bg: 'navy', k: 1.12, items: [['stadium', 100, 132, 1.2], ['cupworld', 196, 120, .96]] };
CH.imagine_scenes = { theme: 'dream', bg: 'lilac', k: 1.1, items: [['dreamcloud', 124, 112, 1.42], ['elephant', 104, 116, .98], ['plane', 184, 62, .66, -12]] };
CH.interactive_without_dots = { theme: 'cipher', bg: 'navy', k: 1.12, items: [['cipherboard', 130, 118, 1.55]] };
CH.interactive_order_it = { theme: 'podium', bg: 'blue', k: 1.12, items: [['orderstairs', 130, 124, 1.5]] };
CH.interactive_al_lista = { theme: 'timer', bg: 'yellow', k: 1.12, items: [['checklist', 108, 118, 1.72], ['stopwatch', 200, 152, 1.05, 8]] };
CH.honeycomb_ar = { theme: 'hive', bg: 'yellow', k: 1.12, items: [['hexgrid', 130, 118, 1.85, 0, { letters: ['م', 'أ', 'ب', 'ت', 'ح', 'ع', 'ر'], hot: '#f08a3c' }]] };
CH.honeycomb_en = { theme: 'hive', bg: 'lilac', k: 1.12, items: [['hexgrid', 130, 118, 1.85, 0, { letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], hot: '#8b6fd6', cols: ['#fff', '#ffd166', '#7fd1b5', '#f28bb0', '#8fd0ff', '#ffb27a', '#c9b6f2'] }]] };
CH.interactive_connect_wasalha = { theme: 'hive', bg: 'green', k: 1.12, items: [['hexgrid', 130, 116, 1.85, 0, { route: true, cols: ['#fff3c4', '#ffd166', '#c9ecdb', '#fad0dd', '#dcd2f4', '#cfe3f6', '#fff'], hot: '#f08a3c' }]] };
CH.interactive_focus_zoom = { theme: 'focus', bg: 'teal', k: 1.12, items: [['eye', 118, 112, 1.9], ['magnifier', 164, 132, 1.55]] };
CH.interactive_sound_voice = { theme: 'rings', bg: 'navy', k: 1.12, items: [['micold', 130, 88, 1.6], ['soundwave', 130, 186, 1.5]] };
})(M8P);
(function (X) {
const { f } = X;
const U = X.front.util;
const { rng, mix, lg, rg, rect, FULL, circ, poly } = U;
const SKY = {
blue:   ['#030716', '#0c1c52', '#27428f', '#5a5fb0'],
teal:   ['#02101a', '#07304a', '#1d5f86', '#4e8fb0'],
purple: ['#0b0720', '#27145a', '#5a2f94', '#a05cb0'],
dusk:   ['#150a2e', '#5b2a7a', '#d4607a', '#ffb36b'],
desert: ['#1b1030', '#6a2f6a', '#e0734f', '#ffc875'],
green:  ['#02120d', '#06342a', '#0d6b55', '#3fb59a'],
storm:  ['#0a0d16', '#222c40', '#4b5a78', '#8e9bb6'],
crimson: ['#14040a', '#4a0f26', '#a52744', '#ff8a7a']
};
const ENV = {
stad_bernabeu:   { sky: 'teal',   back: 'skyline', bc: '#12283f', crowd: ['#ffffff', '#a78bfa', '#e5e7eb'], lights: 'rim',    grass: 'checker', gc: ['#2f9e4f', '#278a43'], ads: ['#6d28d9', '#e5e7eb'], screen: 'r' },
stad_campnou:    { sky: 'dusk',   back: 'hills',   bc: '#2a1844', crowd: ['#2563eb', '#be185d', '#1e3a8a'], lights: 'towers', grass: 'stripes', gc: ['#2b9a4c', '#1c7a3a'], ads: ['#1d4ed8', '#9d174d'], screen: 'r' },
stad_oldtrafford:{ sky: 'storm',  back: 'chimney', bc: '#1d2230', crowd: ['#dc2626', '#ffffff', '#b91c1c'], lights: 'masts',  grass: 'diag',    gc: ['#2a9448', '#1f7d3a'], ads: ['#dc2626', '#ffffff'], screen: null },
stad_wembley:    { sky: 'blue',   back: 'skyline', bc: '#101a3c', crowd: ['#ffffff', '#3b82f6', '#ef4444'], lights: 'rim',    grass: 'mow',     gc: ['#2fa355', '#238a43'], ads: ['#2563eb', '#ffffff'], screen: 'l' },
stad_maracana:   { sky: 'green',  back: 'mount',   bc: '#08251f', crowd: ['#facc15', '#16a34a', '#2563eb'], lights: 'towers', grass: 'rings',   gc: ['#2fa355', '#238a43'], ads: ['#16a34a', '#facc15'], screen: null },
stad_allianz:    { sky: 'purple', back: 'plain',   bc: '#1b1038', crowd: ['#ef4444', '#ffffff', '#fca5a5'], lights: 'rim',    grass: 'stripes', gc: ['#238a43', '#1a6e35'], ads: ['#ef4444', '#ffffff'], screen: 'l' },
stad_anfield:    { sky: 'storm',  back: 'houses',  bc: '#1a1e2c', crowd: ['#dc2626', '#fbbf24', '#ffffff'], lights: 'masts',  grass: 'diag',    gc: ['#2a9448', '#1f7d3a'], ads: ['#b91c1c', '#fde68a'], screen: null },
stad_sansiro:    { sky: 'purple', back: 'haze',    bc: '#241a3e', crowd: ['#dc2626', '#111827', '#3b82f6'], lights: 'towers', grass: 'checker', gc: ['#2b9a4c', '#228740'], ads: ['#dc2626', '#111827'], screen: 'r' },
stad_kingfahd:   { sky: 'desert', back: 'dunes',   bc: '#4a2238', crowd: ['#16a34a', '#ffffff', '#bbf7d0'], lights: 'masts',  grass: 'stripes', gc: ['#35ab57', '#26904a'], ads: ['#15803d', '#ffffff'], screen: 'l' },
stad_lusail:     { sky: 'green',  back: 'modern',  bc: '#0a2a35', crowd: ['#fbbf24', '#8b1a3a', '#fde68a'], lights: 'rim',    grass: 'mow',     gc: ['#2fa355', '#238a43'], ads: ['#8b1a3a', '#fbbf24'], screen: 'r' },
stad_emirates:   { sky: 'crimson',back: 'houses',  bc: '#2a0e1c', crowd: ['#ef4444', '#ffffff', '#fecaca'], lights: 'rim',    grass: 'checker', gc: ['#2b9a4c', '#1f8038'], ads: ['#ef4444', '#ffffff'], screen: 'both' },
stad_signal:     { sky: 'storm',  back: 'chimney', bc: '#161a24', crowd: ['#facc15', '#111827', '#fde047'], lights: 'masts',  grass: 'stripes', gc: ['#26913f', '#1c7634'], ads: ['#facc15', '#111827'], screen: null },
stad_azteca:     { sky: 'dusk',   back: 'volcano', bc: '#2a1632', crowd: ['#16a34a', '#ffffff', '#ef4444'], lights: 'towers', grass: 'diag',    gc: ['#2fa355', '#238a43'], ads: ['#16a34a', '#ef4444'], screen: 'l' },
stad_etihad:     { sky: 'blue',   back: 'modern',  bc: '#12224a', crowd: ['#7dd3fc', '#ffffff', '#38bdf8'], lights: 'masts',  grass: 'mow',     gc: ['#2fa355', '#238a43'], ads: ['#38bdf8', '#ffffff'], screen: 'r' },
stad_jawhara:    { sky: 'desert', back: 'dunes',   bc: '#3a1a40', crowd: ['#22c55e', '#fde047', '#ffffff'], lights: 'rim',    grass: 'rings',   gc: ['#35ab57', '#26904a'], ads: ['#16a34a', '#fde047'], screen: 'both' },
stad_stamford:   { sky: 'teal',   back: 'houses',  bc: '#0f2236', crowd: ['#2563eb', '#ffffff', '#93c5fd'], lights: 'towers', grass: 'checker', gc: ['#2b9a4c', '#1f8038'], ads: ['#1d4ed8', '#ffffff'], screen: null },
stad_parc:       { sky: 'blue',   back: 'roofs',   bc: '#152044', crowd: ['#1e40af', '#ef4444', '#ffffff'], lights: 'masts',  grass: 'stripes', gc: ['#2b9a4c', '#1c7a3a'], ads: ['#1e40af', '#ef4444'], screen: 'l' }
};
function backdrop(type, r, col, hi) {
let s = '';
const base = 128;
const win = (x, y, w, h) => rect(x, y, w, h, hi, ' opacity=".85"');
switch (type) {
case 'skyline': case 'modern': {
let x = -20;
while (x < 290) {
const w = 12 + r() * 16, h = 18 + r() * (type === 'modern' ? 52 : 34);
s += rect(x, base - h, w, h + 2, col);
if (type === 'modern' && r() > .5) s += poly(`${f(x)},${f(base - h)} ${f(x + w)},${f(base - h)} ${f(x + w * .5)},${f(base - h - 10)}`, col);
for (let k = 0; k < 5; k++) if (r() > .45) s += win(x + 2 + r() * (w - 6), base - h + 4 + k * 8, 2.2, 2.6);
x += w + 1 + r() * 4;
}
if (type === 'modern') s += `<path d="M205,${base} Q212,${base - 78} 224,${base - 92} Q220,${base - 60} 232,${base}Z" fill="${col}"/>`;
else s += rect(150, base - 74, 7, 74, col) + poly(`${150},${base - 74} ${157},${base - 74} ${153.5},${base - 88}`, col);
break;
}
case 'hills': {
s += `<path d="M-30,${base} Q10,${base - 40} 52,${base - 22} Q92,${base - 54} 140,${base - 26} Q190,${base - 62} 232,${base - 28} Q262,${base - 40} 300,${base}Z" fill="${col}"/>`;
for (let i = 0; i < 18; i++) s += circ(r() * 280, base - 6 - r() * 30, .9, hi, ` opacity="${f(.3 + r() * .5)}"`);
break;
}
case 'mount': {
s += `<path d="M-20,${base} Q20,${base - 20} 38,${base - 52} Q50,${base - 66} 60,${base - 50} Q80,${base - 24} 112,${base - 12} Q150,${base - 40} 176,${base - 44} Q186,${base - 62} 198,${base - 44} Q226,${base - 18} 290,${base}Z" fill="${col}"/>`;
s += circ(236, 50, 12, '#fff7d6', ' opacity=".85"');
break;
}
case 'volcano': {
s += `<path d="M-20,${base} L60,${base - 18} Q90,${base - 30} 108,${base - 62} L130,${base - 96} L152,${base - 62} Q170,${base - 30} 200,${base - 18} L290,${base}Z" fill="${col}"/>`;
s += poly(`124,${base - 90} 136,${base - 90} 140,${base - 80} 120,${base - 80}`, '#ff7a3a', ' opacity=".9"') + circ(130, base - 104, 14, '#ff9a5a', ' opacity=".35"');
break;
}
case 'dunes': {
s += `<path d="M-30,${base} Q30,${base - 36} 90,${base - 14} Q150,${base - 44} 210,${base - 18} Q260,${base - 30} 300,${base}Z" fill="${col}"/>`;
[[34, 30], [232, 36]].forEach(([x, hh]) => { s += rect(x - 1.4, base - hh - 4, 2.8, hh + 6, '#1d1228'); for (let k = 0; k < 5; k++) s += `<path d="M${x},${base - hh - 4} q${f(Math.cos(k * 1.26) * 18)},${f(-6 + Math.sin(k * 1.26) * 6)} ${f(Math.cos(k * 1.26) * 24)},${f(6 + Math.sin(k * 1.26) * 10)}" stroke="#1d1228" stroke-width="2.6" fill="none" stroke-linecap="round"/>`; });
break;
}
case 'houses': {
let x = -10;
while (x < 280) {
const w = 14 + r() * 8, h = 12 + r() * 12;
s += rect(x, base - h, w, h + 2, col) + poly(`${f(x - 1)},${f(base - h)} ${f(x + w + 1)},${f(base - h)} ${f(x + w / 2)},${f(base - h - 8)}`, mix(col, '#000', .25));
s += rect(x + w * .6, base - h - 11, 2.6, 8, mix(col, '#000', .25));
if (r() > .3) s += win(x + 3, base - h + 4, 2.6, 3); if (r() > .4) s += win(x + w - 6, base - h + 4, 2.6, 3);
x += w + 1;
}
break;
}
case 'chimney': {
s += rect(-20, base - 26, 310, 28, col);
[[24, 70], [74, 54], [196, 78], [238, 60]].forEach(([x, h]) => { s += poly(`${x - 5},${base} ${x + 5},${base} ${x + 3.4},${base - h} ${x - 3.4},${base - h}`, col) + rect(x - 4, base - h, 8, 3, '#7c2d12', ' opacity=".8"'); for (let k = 0; k < 3; k++) s += circ(x + 6 + k * 7, base - h - 7 - k * 9, 6 + k * 3, '#9aa4b8', ` opacity="${f(.3 - k * .07)}"`); });
break;
}
case 'roofs': {
let x = -10;
while (x < 280) { const w = 22 + r() * 10, h = 14 + r() * 14; s += poly(`${f(x)},${base} ${f(x + 4)},${f(base - h)} ${f(x + w - 4)},${f(base - h)} ${f(x + w)},${base}`, col) + rect(x + w / 2 - 2.4, base - h + 3, 4.8, 5, hi, ' opacity=".8"'); x += w + 1; }
break;
}
case 'haze': {
s += rect(-20, base - 22, 310, 24, col);
for (let i = 0; i < 6; i++) s += `<ellipse cx="${f(r() * 260)}" cy="${f(base - 12 - r() * 26)}" rx="${f(40 + r() * 50)}" ry="${f(5 + r() * 6)}" fill="#c4b5fd" opacity="${f(.1 + r() * .12)}"/>`;
break;
}
default: s += rect(-20, base - 8, 310, 10, col);
}
return s;
}
function led(x, y, w, h, c1, c2, p, r) {
let s = `<line x1="${x + 6}" y1="${y - 16}" x2="${x + 6}" y2="${y}" stroke="#2a3358" stroke-width="1.2"/><line x1="${x + w - 6}" y1="${y - 16}" x2="${x + w - 6}" y2="${y}" stroke="#2a3358" stroke-width="1.2"/>`;
s += circ(x + w / 2, y + h / 2, w * .75, `url(#${p}hl)`, ' opacity=".28"');
s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.4" fill="#0a1030" stroke="#9fb0ff" stroke-opacity=".7" stroke-width=".9"/>`;
s += `<rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="1.4" fill="${c1}" opacity=".9"/>`;
s += `<rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${(h - 4) / 2}" rx="1.4" fill="#fff" opacity=".14"/>`;
s += `<rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" fill="url(#${p}px)" opacity=".5"/>`;
s += `<rect x="${x + 5}" y="${y + h * .55}" width="${(w - 10) * .45}" height="${h * .22}" rx="1" fill="${c2}"/><circle cx="${x + w * .72}" cy="${y + h * .46}" r="${h * .2}" fill="${c2}"/>`;
return s;
}
X.stadEnv = function (p, h, name) {
const E = ENV[name]; if (!E) return null;
const r = rng(h * 7 + 3);
const sk = SKY[E.sky];
const [c1, c2, c3] = E.crowd;
let d = '';
d += lg(p + 'sk', 0, -40, 0, 168, [[0, sk[0]], [.5, sk[1]], [.85, sk[2]], [1, sk[3]]], 1);
d += rg(p + 'hg', 130, 168, 170, [[0, '#ffe9a8', .62], [.4, '#ffc15a', .2], [1, '#ffc15a', 0]]);
d += lg(p + 'bm', 0, 0, 0, 1, [[0, '#fffbe0', .9], [.55, '#fff0b0', .28], [1, '#fff0b0', 0]]);
d += lg(p + 'st', 0, 124, 0, 170, [[0, mix(c1, '#0a0d2a', .72)], [1, '#080c26']], 1);
d += lg(p + 'st2', 0, 108, 0, 128, [[0, mix(E.bc, '#000', .35)], [1, mix(E.bc, '#000', .6)]], 1);
d += lg(p + 'fr', 0, 167, 0, 300, [[0, '#021008', .7], [.4, '#021008', .2], [1, '#021008', 0]], 1);
d += rg(p + 'hl', .5, .5, .5, [[0, '#ffffff', .95], [.35, '#fff6c0', .55], [1, '#fff6c0', 0]]).replace('gradientUnits="userSpaceOnUse"', '');
d += rg(p + 'vg', 130, 120, 200, [[.5, '#000', 0], [1, '#000', .6]]);
d += `<pattern id="${p}cr" width="7" height="6" patternUnits="userSpaceOnUse"><circle cx="1.8" cy="1.8" r="1.3" fill="${c1}"/><circle cx="5.2" cy="4.2" r="1.3" fill="${c2}"/><circle cx="3.4" cy="3.2" r="1" fill="${c3}"/></pattern>`;
d += `<pattern id="${p}cr2" width="5" height="4.4" patternUnits="userSpaceOnUse"><circle cx="1.4" cy="1.4" r=".9" fill="${c3}"/><circle cx="3.9" cy="3.2" r=".9" fill="${c2}"/></pattern>`;
d += `<pattern id="${p}px" width="2.4" height="2.4" patternUnits="userSpaceOnUse"><rect width="1.9" height="1.9" fill="#000" opacity=".35"/></pattern>`;
d += `<pattern id="${p}dg" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><rect width="7" height="14" fill="#fff" opacity=".10"/></pattern>`;
let s = rect(-400, -400, 1060, 568, `url(#${p}sk)`);
for (let i = 0; i < 26; i++) s += circ(-30 + r() * 320, -8 + r() * 96, .5 + r() * .8, '#fff', ` opacity="${f(.25 + r() * .6)}"`);
if (E.sky === 'blue' || E.sky === 'teal' || E.sky === 'green') s += circ(r() > .5 ? 214 : 46, 34, 9, '#fff6d0', ' opacity=".85"') + circ(r() > .5 ? 214 : 46, 34, 22, '#fff6d0', ' opacity=".1"');
s += rect(-400, 40, 1060, 128, `url(#${p}hg)`);
s += backdrop(E.back, r, E.bc, '#ffd27a');
const beams = (tx, gx, spread, o) => `<polygon points="${f(tx - 7)},46 ${f(tx + 7)},46 ${f(gx + spread + 20)},236 ${f(gx - spread - 20)},236" fill="url(#${p}bm)" opacity="${o}"/>`;
if (E.lights === 'towers') [[18, 1], [242, -1]].forEach(([tx, dir]) => { s += beams(tx, 130 - dir * 6, 66, .78) + beams(tx, 130 - dir * 52, 66, .5); });
else if (E.lights === 'masts') [[26, 1], [84, 1], [176, -1], [234, -1]].forEach(([tx, dir], i) => { s += beams(tx, 130 - dir * (i % 3 === 0 ? 40 : 4), i % 3 === 0 ? 50 : 38, i % 3 === 0 ? .56 : .4); });
else if (E.lights === 'rim') [48, 94, 166, 212].forEach((tx, i) => { s += beams(tx, 130 + (tx < 130 ? -10 : 10), 40, .42); });
s += rect(-400, 108, 1060, 18, `url(#${p}st2)`) + rect(-400, 108, 1060, 18, `url(#${p}cr2)`, ' opacity=".35"');
s += rect(-400, 124, 1060, 44, `url(#${p}st)`) + rect(-400, 124, 1060, 44, `url(#${p}cr)`, ' opacity=".62"');
s += rect(-400, 135.5, 1060, 1.2, '#fff', ' opacity=".14"') + rect(-400, 148, 1060, 1.2, '#fff', ' opacity=".12"') + rect(-400, 122.4, 1060, 2.8, '#b8c4ff', ' opacity=".6"') + rect(-400, 107, 1060, 1.6, '#b8c4ff', ' opacity=".35"');
for (let i = 0; i < 26; i++) { const x = -6 + i * 11 + r() * 5; s += poly(`${f(x)},146 ${f(x + 5)},146 ${f(x + 2.5)},153`, i % 2 ? c1 : c2, ' opacity=".75"'); }
for (let i = 0; i < 9; i++) s += rect(-4 + i * 33, 124, 1.6, 44, '#000', ' opacity=".28"');
const ledC = [[c1, c2], [c2, c1]];
if (E.screen === 'l' || E.screen === 'both') s += led(5, 80, 42, 22, mix(c1, '#0a1030', .25), '#ffd84a', p, r);
if (E.screen === 'r' || E.screen === 'both') s += led(213, 80, 42, 22, mix(c2, '#0a1030', .25), '#5eead4', p, r);
const lampBank = (cx, y, n) => { let q = circ(cx, y + 6, 26, `url(#${p}hl)`, ' opacity=".5"') + `<rect x="${cx - 6 - n * 3.6}" y="${y}" width="${12 + n * 7.2}" height="13" rx="2.4" fill="#1a2250" stroke="#9fb0ff" stroke-opacity=".7" stroke-width=".8"/>`; for (let k = 0; k < n + 1; k++) for (let b = 0; b < 2; b++) q += circ(cx - n * 3.6 + k * 7.2, y + 3.6 + b * 6, 2.3, '#fffbe6'); return q; };
if (E.lights === 'towers') [18, 242].forEach(tx => { s += rect(tx - 1.6, 48, 3.2, 100, '#0a1030') + lampBank(tx, 30, 2); });
else if (E.lights === 'masts') [[26, 44], [84, 62], [176, 62], [234, 44]].forEach(([tx, y]) => { s += rect(tx - 1.3, y + 12, 2.6, 130 - y, '#0a1030') + lampBank(tx, y, 1); });
else if (E.lights === 'rim') { s += rect(-400, 99, 1060, 2.2, '#9fb0ff', ' opacity=".35"'); [48, 94, 166, 212].forEach(tx => { s += rect(tx - 1, 100, 2, 8, '#0a1030') + lampBank(tx, 88, 1); }); }
s += rect(-400, 165, 1060, 7, '#0a1030');
for (let i = 0; i < 28; i++) { const x = -10 + i * 11.6; s += rect(x, 166, 10.4, 5, i % 2 ? E.ads[0] : E.ads[1], ' opacity=".95"') + rect(x + 1.6, 167.6, 7.2, 1.2, '#fff', ' opacity=".55"'); }
s += rect(-400, 172, 1060, 1.2, '#e3f8d2', ' opacity=".5"');
const [g1, g2] = E.gc;
let y = 173, hh = E.grass === 'mow' ? 6 : 3.1, i = 0;
while (y < 420) { s += rect(-400, y, 1060, hh + .6, i % 2 ? g2 : g1); y += hh; hh *= E.grass === 'mow' ? 1.24 : 1.31; i++; }
if (E.grass === 'checker') for (let k = -10; k < 10; k++) if (k % 2) s += poly(`${130 + k * 16},173 ${130 + (k + 1) * 16},173 ${130 + (k + 1) * 66},340 ${130 + k * 66},340`, '#000', ' opacity=".13"');
if (E.grass === 'diag') s += rect(-400, 173, 1060, 240, `url(#${p}dg)`, ' opacity=".9"');
if (E.grass === 'rings') for (let k = 1; k < 9; k++) s += `<ellipse cx="130" cy="262" rx="${k * 36}" ry="${k * 11}" fill="none" stroke="#fff" stroke-opacity="${f(.12 - k * .008)}" stroke-width="${f(3.6 + k * .5)}"/>`;
s += rect(-400, 173, 1060, 140, `url(#${p}fr)`);
s += `<ellipse cx="130" cy="240" rx="78" ry="14" fill="none" stroke="#fff" stroke-opacity=".34" stroke-width="1.3"/>` + rect(-400, 240, 1060, 1.1, '#fff', ' opacity=".24"');
s += `<path d="M62,330 L84,282 H176 L198,330" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1.3"/>`;
s += FULL(`url(#${p}vg)`);
return { d, s };
};
})(M8P);
(function (X) {
const { f } = X;
const U = X.front.util;
const { rng, mix, rect, circ, poly } = U;
const SIL = '#1b1240', SIL2 = '#2a1c5a';
const palm = (x, y, s, col) => {
let q = `<path d="M${x},${y} Q${x + 3 * s},${y - 22 * s} ${x - 1 * s},${y - 46 * s}" stroke="${col}" stroke-width="${f(3 * s)}" fill="none" stroke-linecap="round"/>`;
for (let k = 0; k < 7; k++) { const a = -160 + k * 53, ex = Math.cos(a * Math.PI / 180) * 24 * s, ey = Math.sin(a * Math.PI / 180) * 12 * s; q += `<path d="M${x - s},${y - 46 * s} q${f(ex * .5)},${f(ey - 8 * s)} ${f(ex)},${f(ey + 8 * s)}" stroke="${col}" stroke-width="${f(2.6 * s)}" fill="none" stroke-linecap="round"/>`; }
return q;
};
const cypress = (x, y, s, col) => `<path d="M${x},${y - 46 * s} Q${x + 8 * s},${y - 20 * s} ${x + 5 * s},${y} H${x - 5 * s} Q${x - 8 * s},${y - 20 * s} ${x},${y - 46 * s}Z" fill="${col}"/>`;
const boat = (x, y, s, hull, sail) => `<path d="M${x - 16 * s},${y} H${x + 16 * s} L${x + 11 * s},${y + 6 * s} H${x - 11 * s}Z" fill="${hull}"/><line x1="${x}" y1="${y}" x2="${x}" y2="${y - 26 * s}" stroke="${hull}" stroke-width="${f(1.4 * s)}"/><path d="M${x + 2 * s},${y - 25 * s} L${x + 15 * s},${y - 3 * s} H${x + 2 * s}Z" fill="${sail}"/><path d="M${x - 2 * s},${y - 20 * s} L${x - 12 * s},${y - 3 * s} H${x - 2 * s}Z" fill="${sail}" opacity=".85"/>`;
const birds = (x, y, s) => [0, 1, 2].map(i => `<path d="M${x + i * 14 * s},${y + (i % 2) * 6 * s} q${3 * s},${-4 * s} ${6 * s},0 q${3 * s},${-4 * s} ${6 * s},0" stroke="#1b1240" stroke-width="1.3" fill="none" stroke-linecap="round"/>`).join('');
const skyline = (x0, x1, base, col, r, hmin, hmax, glow) => { let s = '', x = x0; while (x < x1) { const w = 8 + r() * 12, h = hmin + r() * (hmax - hmin); s += rect(x, base - h, w, h + 2, col); for (let k = 0; k < 4; k++) if (glow && r() > .5) s += rect(x + 2 + r() * (w - 5), base - h + 4 + k * 7, 1.8, 2.4, '#ffd27a', ' opacity=".8"'); x += w + 1; } return s; };
const dune = (base, amp, col, ph) => `<path d="M-40,${base + 30} L-40,${base} Q${40 + ph},${f(base - amp)} 100,${f(base - amp * .2)} T${220 + ph},${f(base - amp * .4)} T300,${f(base - amp * .1)} V${base + 30}Z" fill="${col}"/>`;
const ripple = (r, y0, n, col, op) => { let s = ''; for (let i = 0; i < n; i++) s += rect(20 + r() * 200, y0 + i * 4.4, 14 + r() * 40, 1, col, ` opacity="${f(op - i * .02)}"`); return s; };
const water = (p, y0, c1, c2) => `<rect x="-400" y="${y0}" width="1060" height="360" fill="${c1}" opacity=".0"/>`;
const SAND = (p, r) => rect(-400, 186, 1060, 360, '#c98a4d') + rect(-400, 186, 1060, 70, '#e8b574', ' opacity=".85"') + rect(-400, 185.4, 1060, 1.6, '#ffe9b8', ' opacity=".7"') + dune(184, 12, '#b9763a', 0) + ripple(r, 200, 8, '#fff2c6', .35);
const GRASS = (p, r, c1, c2) => rect(-400, 186, 1060, 360, c2) + rect(-400, 186, 1060, 60, c1, ' opacity=".9"') + rect(-400, 185.4, 1060, 1.6, '#e9ffd0', ' opacity=".55"');
const ENV = {
eiffel: (p, r) => { let s = skyline(-10, 280, 190, '#34236a', r, 8, 16, true); s += GRASS(p, r, '#2e8a4f', '#1a5a35'); for (let i = 0; i < 6; i++) s += cypress(20 + i * 46, 192, .5, '#16401f'); for (let i = 0; i < 12; i++) s += circ(8 + i * 22, 198 + (i % 3) * 4, 1.6, '#ffe9a0', ' opacity=".85"'); s += birds(30, 60, 1); return s; },
pyramids: (p, r) => { let s = SAND(p, r); s += `<g fill="${SIL}">` + [[28, 1], [60, .9], [96, 1]].map(([x, k], i) => `<ellipse cx="${x}" cy="${180 - (i % 2) * 2}" rx="${f(7 * k)}" ry="${f(3.6 * k)}"/><rect x="${x + 4 * k}" y="${f(168 - (i % 2) * 2)}" width="${f(2.2 * k)}" height="${f(11 * k)}"/><circle cx="${f(x + 6.4 * k)}" cy="${f(167.5 - (i % 2) * 2)}" r="${f(2 * k)}"/>` + [-5, 4].map(o => `<rect x="${f(x + o * k)}" y="180" width="1.4" height="${f(9 * k)}"/>`).join('')).join('') + `</g>`; s += `<path d="M168,190 L186,176 L204,190Z" fill="#b9763a" opacity=".6"/>`; return s; },
burj: (p, r) => { let s = skyline(-10, 280, 192, '#2b1f5e', r, 12, 38, true) + rect(-400, 192, 1060, 360, '#1b1448') + rect(-400, 192, 1060, 8, '#3a2a78', ' opacity=".7"'); s += boat(210, 204, .8, SIL, '#ffd9a0') + boat(46, 210, .6, SIL, '#ffd9a0'); s += ripple(r, 208, 7, '#ffd9a0', .3); for (let i = 0; i < 16; i++) s += circ(6 + i * 17, 193, 1.2, '#ffd27a', ' opacity=".8"'); return s; },
statue: (p, r) => { let s = rect(-400, 188, 1060, 360, '#1d1a52') + rect(-400, 188, 1060, 10, '#3d3b8a', ' opacity=".6"'); s += `<path d="M-30,190 Q40,176 120,190Z" fill="${SIL}"/>` + boat(206, 202, .9, SIL, '#ffd9a0') + skyline(150, 290, 190, '#241a58', r, 6, 22, true); s += ripple(r, 204, 7, '#ffd9a0', .28); s += birds(40, 56, 1.1); return s; },
bigben: (p, r) => { let s = skyline(-10, 280, 192, '#2c2160', r, 6, 20, true) + rect(-400, 192, 1060, 360, '#1a1650') + rect(-400, 192, 1060, 8, '#3a3586', ' opacity=".6"'); s += `<path d="M-20,204 H280 V210 H-20Z" fill="${SIL2}"/>` + [0, 1, 2, 3, 4].map(i => `<path d="M${10 + i * 56},204 q14,-16 28,0" fill="none" stroke="${SIL2}" stroke-width="3"/>`).join(''); for (let i = 0; i < 14; i++) s += circ(8 + i * 20, 206, 1.3, '#ffd27a', ' opacity=".85"'); s += ripple(r, 214, 6, '#ffd9a0', .3); return s; },
kingdom: (p, r) => { let s = skyline(-10, 280, 194, '#2a1f5c', r, 10, 34, true) + dune(196, 8, '#8a5a3c', 20) + rect(-400, 196, 1060, 360, '#6b4630') + rect(-400, 196, 1060, 40, '#8a5d3d', ' opacity=".8"'); s += `<g fill="${SIL}">${palm(36, 200, .8, SIL)}${palm(222, 202, .9, SIL)}</g>`; s += ripple(r, 214, 6, '#ffd9a0', .25); return s; },
pisa: (p, r) => { let s = GRASS(p, r, '#3a9a58', '#1d6a3a'); s += `<g fill="#cdbfe0" opacity=".55">${rect(20, 150, 40, 40, '#cdbfe0')}<path d="M18,150 L40,128 L62,150Z"/>${rect(186, 160, 44, 30, '#cdbfe0')}<path d="M184,160 q24,-26 48,0Z"/></g>`; for (let i = 0; i < 7; i++) s += cypress(10 + i * 40, 194, .5, '#14421f'); s += `<path d="M30,202 Q130,196 230,202" fill="none" stroke="#e8d9b5" stroke-width="5" opacity=".7"/>`; return s; },
colosseum: (p, r) => { let s = rect(-400, 188, 1060, 360, '#b88455') + rect(-400, 188, 1060, 50, '#d8a46a', ' opacity=".8"') + rect(-400, 187.4, 1060, 1.6, '#ffe6b0', ' opacity=".6"'); for (let i = 0; i < 5; i++) s += cypress(14 + i * 62, 192, .55, '#1f3a1c'); [[44, 150], [216, 140]].forEach(([x, y]) => { s += `<g fill="#d9c8a4" opacity=".8">${rect(x - 2.4, y, 4.8, 190 - y, '#d9c8a4')}${rect(x - 4, y - 3, 8, 3, '#d9c8a4')}</g>`; }); s += `<path d="M20,205 Q130,196 240,205" stroke="#8a5a3c" stroke-width="3" fill="none" opacity=".5"/>`; return s; },
taj: (p, r) => { let s = GRASS(p, r, '#3a9a58', '#1d6a3a'); for (let i = 0; i < 4; i++) s += cypress(18 + i * 22, 196, .5, '#14421f') + cypress(250 - i * 22, 196, .5, '#14421f'); s += `<rect x="96" y="194" width="68" height="14" fill="#7cc7e8" opacity=".75"/><rect x="96" y="194" width="68" height="2" fill="#fff" opacity=".6"/>`; for (let i = 0; i < 5; i++) s += rect(104 + i * 12, 198 + (i % 2) * 3, 8, 1, '#fff', ' opacity=".5"'); return s; },
opera: (p, r) => { let s = rect(-400, 188, 1060, 360, '#1d1a52') + rect(-400, 188, 1060, 10, '#3d3b8a', ' opacity=".6"'); s += skyline(-10, 90, 190, '#241a58', r, 6, 20, true) + `<path d="M150,190 Q190,150 240,190" fill="none" stroke="${SIL}" stroke-width="3.4"/><path d="M150,190 H240" stroke="${SIL}" stroke-width="2"/>` + boat(40, 212, .7, SIL, '#ffd9a0'); s += ripple(r, 206, 7, '#ffd9a0', .28); return s; },
clocktower: (p, r) => { let s = skyline(-10, 280, 192, '#2a1f5c', r, 8, 26, true); [[30, 38], [228, 44]].forEach(([x, h]) => { s += `<path d="M${x - 8},192 V${192 - h} Q${x},${192 - h - 16} ${x + 8},${192 - h} V192Z" fill="${SIL2}"/>` + rect(x - 1, 192 - h - 24, 2, 12, SIL2) + circ(x, 192 - h - 26, 2.6, '#ffd84a'); }); s += rect(-400, 192, 1060, 360, '#241a58') + rect(-400, 192, 1060, 10, '#3d3b8a', ' opacity=".5"'); for (let i = 0; i < 18; i++) s += circ(6 + i * 15, 196 + (i % 3) * 3, 1.1, '#ffe9a0', ' opacity=".7"'); return s; },
burjarab: (p, r) => { let s = rect(-400, 188, 1060, 360, '#14336a') + rect(-400, 188, 1060, 12, '#2f63b8', ' opacity=".6"'); s += boat(40, 204, .9, SIL, '#fff3d0') + boat(224, 208, .75, SIL, '#ffd9a0') + boat(120, 222, .5, SIL, '#ffd9a0'); s += ripple(r, 200, 9, '#fff3d0', .4); s += birds(200, 56, 1.1); return s; },
wall: (p, r) => { let s = `<path d="M-30,190 L20,128 L48,152 L84,110 L120,150 L150,124 L192,160 L226,118 L290,190Z" fill="#3a2a78" opacity=".9"/>` + rect(-400, 188, 1060, 360, '#4a3a2a') + rect(-400, 188, 1060, 50, '#6a523a', ' opacity=".8"'); s += `<path d="M-20,206 Q60,196 130,206 T280,204" fill="none" stroke="#a88a5a" stroke-width="4" opacity=".6"/>`; for (let i = 0; i < 8; i++) s += cypress(10 + i * 34, 196, .36, '#243a1c'); return s; },
goldengate: (p, r) => { let s = rect(-400, 188, 1060, 360, '#1d2a66') + rect(-400, 188, 1060, 10, '#3d55a8', ' opacity=".6"'); [0, 1, 2].forEach(i => s += `<ellipse cx="${60 + i * 80}" cy="${178 + i * 4}" rx="${70 - i * 8}" ry="9" fill="#fff" opacity="${f(.34 - i * .06)}"/>`); s += `<path d="M-30,192 Q30,164 90,192Z" fill="${SIL}"/>` + boat(214, 204, .7, SIL, '#ffd9a0'); s += ripple(r, 202, 7, '#ffd9a0', .28); return s; },
christ: (p, r) => { let s = `<path d="M-30,200 Q40,150 120,180 Q190,150 290,200Z" fill="#1a3a4a" opacity=".9"/>` + [0, 1, 2].map(i => `<ellipse cx="${40 + i * 90}" cy="${170 + (i % 2) * 14}" rx="${64 - i * 6}" ry="8" fill="#fff" opacity="${f(.3 + i * .05)}"/>`).join(''); s += rect(-400, 190, 1060, 360, '#14301f') + rect(-400, 190, 1060, 40, '#2a5a35', ' opacity=".8"'); for (let i = 0; i < 14; i++) s += cypress(6 + i * 20, 196 + (i % 2) * 4, .45, '#0e2616'); return s; },
petra: (p, r) => { let s = `<path d="M-30,200 L-30,70 Q10,90 14,130 Q26,160 40,200Z" fill="#8a4a3a"/><path d="M290,200 L290,60 Q252,84 246,130 Q234,162 220,200Z" fill="#8a4a3a"/>`; s += `<path d="M-30,70 Q10,90 14,130" stroke="#d98a6a" stroke-width="3" fill="none" opacity=".6"/><path d="M290,60 Q252,84 246,130" stroke="#d98a6a" stroke-width="3" fill="none" opacity=".6"/>`; s += rect(-400, 192, 1060, 360, '#a8683f') + rect(-400, 192, 1060, 50, '#d49a62', ' opacity=".8"') + ripple(r, 204, 7, '#ffe6b0', .3); [[20, 160], [244, 170]].forEach(([x, y]) => s += `<path d="M${x - 6},200 q6,-18 12,0Z" fill="#6a3a2a"/>`); return s; },
fort: (p, r) => { let s = dune(186, 14, '#7a4a3a', 10); s += rect(-400, 192, 1060, 360, '#b9763a') + rect(-400, 192, 1060, 60, '#e0a560', ' opacity=".85"') + rect(-400, 191.4, 1060, 1.6, '#ffe6b0', ' opacity=".6"'); s += `<g>${palm(34, 202, .9, SIL)}${palm(226, 204, .8, SIL)}</g>` + ripple(r, 208, 7, '#fff2c6', .3); return s; },
mosque: (p, r) => { let s = skyline(-10, 280, 192, '#2a1f5c', r, 8, 22, true); [[26, 52], [236, 60]].forEach(([x, h]) => { s += rect(x - 3.4, 192 - h, 6.8, h, SIL2) + poly(`${x - 4.6},${192 - h} ${x + 4.6},${192 - h} ${x},${192 - h - 12}`, SIL2) + circ(x, 192 - h - 14, 1.6, '#ffd84a'); }); s += rect(-400, 192, 1060, 360, '#1a1650') + rect(-400, 192, 1060, 10, '#3a3586', ' opacity=".6"') + ripple(r, 206, 6, '#ffd9a0', .3) + birds(60, 54, 1) + birds(190, 40, .9); return s; }
};
X.lmEnv = function (p, h, name) {
const fn = ENV[name]; if (!fn) return '';
return `<g stroke="none">${fn(p, rng(h * 5 + 1))}</g>`;
};
})(M8P);
(function (X) {
const S = (id, bg, items, ex) => { X.POSTERS[id] = Object.assign({ bg: bg, items: items }, ex || {}); };
const pr = (x, y, s, o) => ['person', x, y, s, 0, o];
const AR = ['ح', 'م', 'ع', 'ب', 'ك', 'س', 'ر'];
S('honeycomb_ar', 'yellow', [['hexgrid', 130, 118, 1.75, 0, { letters: ['م', 'أ', 'ب', 'ت', 'ح', 'ع', 'ر'], hot: '#f08a3c' }]]);
S('honeycomb_en', 'lilac', [['hexgrid', 130, 118, 1.75, 0, { letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], hot: '#8b6fd6', cols: ['#fff', '#ffd166', '#7fd1b5', '#f28bb0', '#8fd0ff', '#ffb27a', '#c9b6f2'] }]]);
S('rebus_words', 'blue', [['eiffel', 86, 120, .95], ['pyramids', 190, 150, .8], ['sun', 200, 54, .6]]);
S('rebus_football', 'green', [['stadium', 94, 128, 1.1], ['cupworld', 196, 128, .9]]);
S('charades_general', 'yellow', [['maskpair', 130, 112, 1.95]]);
S('charades_arabic', 'peach', [pr(132, 108, 1.4, { head: 'fez', top: 'gal', tc: '#8b6fd6', tc2: '#fff', hc: '#c8372d', len: 80 }), ['clap', 56, 172, .85], ['popcorn', 208, 170, .8]]);
S('charades_english', 'lilac', [['film', 130, 62, 1.25, 0], ['clap', 130, 128, 1.7], ['popcorn', 212, 172, .8], ['popcorn', 48, 176, .7]]);
S('charades_sports', 'mint', [pr(120, 108, 1.4, { head: 'hair', top: 'jersey', tc: '#2f7de1', tc2: '#fff', hc: '#3b2a1e', skin: 'c', len: 80 }), ['football', 196, 168, .85]]);
S('series_jaafar', 'sand', [['house', 52, 148, .95], ['palm', 214, 130, 1.2], pr(130, 108, 1.45, { head: 'turban', top: 'gal', tc: '#7a8f5a', tc2: '#e8d7a8', hc: '#fbfbf7', hc2: '#f6b93b', skin: 'c', len: 80 })]);
S('series_bab_alhara', 'peach', [['arch', 206, 124, .9, 0, { c: '#e2b98a', d: '#6b4a2e' }], ['lantern', 46, 82, 1.25], pr(124, 108, 1.45, { head: 'fez', top: 'robe', tc: '#6b4a2e', tc2: '#e2b98a', skin: 'b', len: 80 })]);
S('series_tash_ma_tash', 'yellow', [['tv', 130, 92, 1.95], pr(50, 178, .85, { head: 'ghutra', top: 'thobe', len: 70 }), pr(210, 178, .85, { head: 'shemagh', top: 'thobe', skin: 'c', len: 70 })]);
S('series_shabab_albomb', 'teal', [pr(58, 134, 1.0, { head: 'cap', top: 'tee', tc: '#e8553d', hc: '#2b3340', hc2: '#2b3340', len: 80 }), pr(202, 134, 1.0, { head: 'shemagh', top: 'thobe', skin: 'c', len: 80 }), pr(130, 108, 1.4, { head: 'ghutra', top: 'thobe', len: 80 })]);
S('series_breaking_bad', 'sand', [['dunes', 130, 176, 2.5], ['flask', 126, 100, 1.9, 0, { c: '#7fd1ff' }], ['hat', 54, 160, .8], ['cactus', 212, 150, .8]]);
S('series_prison_break', 'grey', [['bars', 130, 112, 2.3], ['key', 130, 150, 1.3, -22]]);
S('series_la_casa', 'red', [['gold', 56, 176, .85], ['banknote', 208, 178, .75, -10], pr(130, 108, 1.45, { head: 'hair', top: 'jump', tc: '#d94a3d', tc2: '#fff', hc: '#2b2b33', skin: 'a', len: 80 })]);
S('series_game_of_thrones', 'navy', [['snow', 212, 62, .55], ['snow', 44, 170, .4], ['castle', 138, 140, 1.7, 0, { c: '#aab6c6' }], ['dragon', 70, 66, .85, -6, { c: '#e8553d' }]]);
S('series_squid_game', 'pink', [['shapes3', 130, 108, 1.9, 0, { c: '#e8553d' }], ['orb', 60, 176, .5, 0, { c: '#4f9be8' }], ['orb', 206, 178, .45, 0, { c: '#58c27d' }]]);
S('series_friends', 'yellow', [pr(78, 92, .9, { head: 'hair', top: 'tee', tc: '#e8553d', hc: '#2b2b33', len: 70 }), pr(182, 92, .9, { head: 'hair', top: 'tee', tc: '#3fb97a', hc: '#5a3a22', skin: 'c', len: 70 }), pr(130, 82, .95, { head: 'long', top: 'tee', tc: '#4f9be8', hc: '#c98235', skin: 'a', len: 70 }), ['sofa', 130, 150, 1.5], ['cup', 214, 188, .6, 0, { c: '#fff' }]]);
S('series_peaky_blinders', 'grey', [['factory', 56, 156, 1.0], pr(152, 108, 1.45, { head: 'flat', top: 'suit', tc: '#3a3f4a', hc: '#4a4f5a', hc2: '#3a3f4a', tie: '#8c1d2b', len: 80 })]);
S('series_the_office', 'blue', [['laptop', 124, 98, 1.75], ['cup', 208, 164, .9, 0, { c: '#fff' }], ['paperstack', 52, 164, 1.0]]);
S('series_sherlock', 'sand', [pr(120, 108, 1.45, { head: 'deer', top: 'suit', tc: '#7a5a3a', hc: '#a88458', hc2: '#a88458', tie: '#e8d7a8', len: 80 }), ['magnifier', 196, 156, 1.35]]);
S('series_dark', 'navy', [['spiral', 130, 112, 2.1, 0, { c: '#8fd0ff' }], ['clock', 130, 112, 1.15]]);
S('series_stranger_things', 'navy', [['lights', 130, 50, 2.1], ['bike', 130, 150, 1.8, 0, { c: '#e8553d' }]]);
S('series_vikings', 'teal', [['shield', 46, 164, .95, 0, { c: '#e8553d', d: '#f6b93b' }], ['axe', 212, 150, 1.2, 22], pr(130, 102, 1.4, { head: 'viking', top: 'armor', skin: 'a', cape: '#8a5a3b', len: 80 })]);
S('series_alkabeer_awy', 'green', [['palm', 48, 140, 1.0], ['tractor', 134, 116, 1.85]]);
S('series_lan_aeesh', 'sand', [pr(88, 112, 1.25, { head: 'turban', top: 'gal', tc: '#6b8f9a', tc2: '#fff', hc: '#fbfbf7', skin: 'c', len: 80 }), pr(178, 120, 1.2, { head: 'hair', top: 'suit', tc: '#2b3340', hc: '#2b2b33', tie: '#e8553d', skin: 'b', len: 80 })]);
S('series_alzeer_salem', 'red', [['tent', 212, 160, .7], ['horse', 126, 112, 1.9], ['sword', 58, 122, 1.25, -28]]);
S('series_alasoof', 'sand', [['house', 214, 150, .75], ['palm', 44, 142, 1.0], ['radio', 128, 126, 1.8]]);
S('series_saudi_general', 'mint', [['palm', 46, 150, 1.0], ['falcon', 212, 56, .6], ['tv', 132, 104, 1.85]]);
S('series_egypt_general', 'sand', [['pyramids', 130, 72, 1.25], ['tv', 130, 152, 1.35]]);
S('series_levant_general', 'peach', [['lantern', 48, 100, 1.4], ['tv', 150, 118, 1.65]]);
S('series_khaleeji_ramadan', 'navy', [['crescent', 130, 82, 1.6, 0, { c: '#ffd166' }], ['lantern', 56, 164, 1.1], ['dates', 206, 172, .9]]);
S('series_foreign_general', 'lilac', [['tv', 130, 100, 1.55], ['popcorn', 58, 172, .9], ['clap', 204, 174, .9]]);
S('movies_harry_potter', 'navy', [['castle', 130, 176, 1.0, 0, { c: '#8c99a9' }], ['wizardhat', 128, 76, 1.45], ['owl', 52, 160, .8], ['wand', 204, 150, 1.0]]);
S('movies_lotr', 'green', [['mountain', 130, 112, 2.3, 0, { c: '#8a7f72', d: '#6f665b' }], ['ring', 130, 162, 1.3]]);
S('movies_marvel', 'red', [['skyline', 130, 176, 2.6, 0, { c: '#a8b4c4' }], pr(130, 104, 1.4, { head: 'helmet', top: 'jump', tc: '#2f7de1', tc2: '#fff', hc: '#e8553d', cape: '#d94a3d', skin: 'a', len: 80 })]);
S('movies_nolan', 'navy', [['top', 130, 100, 1.95], ['saturn', 56, 174, .7], ['rocket', 208, 152, .75, 22]]);
S('movies_godfather', 'red', [pr(130, 108, 1.45, { head: 'fedora', top: 'suit', tc: '#23262e', hc: '#23262e', hc2: '#e8e2d0', tie: '#fff', len: 80 }), ['rose', 104, 160, .6, -25]]);
S('movies_john_wick', 'grey', [pr(126, 108, 1.45, { head: 'hair', top: 'suit', tc: '#1d1f26', hc: '#2b2b33', tie: '#1d1f26', len: 80 }), ['coin', 206, 172, .9], ['coins', 52, 178, .65]]);
S('movies_pirates', 'teal', [['skullflag', 46, 160, .7], ['chest', 208, 180, .8], ['galleon', 130, 100, 1.85]]);
S('movies_matrix', 'navy', [['rain', 130, 120, 1.7], ['shades', 130, 112, 1.95]]);
S('movies_general', 'lilac', [['film', 196, 56, .95, 12], ['popcorn', 56, 62, .7], ['clap', 130, 128, 1.8]]);
S('anime_one_piece', 'teal', [['ship', 130, 108, 1.85], ['compass', 56, 176, .7], ['map', 210, 176, .7]]);
S('anime_naruto', 'peach', [['scroll', 50, 160, .9], ['shuriken', 212, 160, .85], pr(130, 110, 1.4, { head: 'hood', top: 'tee', tc: '#2b4170', hc: '#2b4170', skin: 'a', len: 80 })]);
S('anime_aot', 'grey', [['wall', 130, 120, 2.3], ['sword', 100, 124, 1.5, -25], ['sword', 160, 124, 1.5, 25]]);
S('anime_conan', 'blue', [['qmark', 206, 58, .8], ['magnifier', 112, 118, 2.2]]);
S('anime_dragon_ball', 'yellow', [['dragon', 130, 100, 1.9, 0, { c: '#f08a3c' }], ['orb', 56, 176, .75], ['orb', 130, 196, .5], ['orb', 208, 172, .65]]);
S('anime_death_note', 'lilac', [['quill', 52, 162, .9], ['apple', 206, 168, .8], ['bookclosed', 130, 110, 1.9, 0, { c: '#2b3340' }]]);
S('anime_hunter_x_hunter', 'green', [['card', 130, 112, 1.95, 0, { c: '#fff7d6' }], ['compass', 130, 112, 1.1], ['leaf', 52, 170, .7], ['leaf', 212, 60, .6, 40]]);
S('anime_demon_slayer', 'red', [['moon', 58, 70, 1.0], ['wave', 130, 196, 2.5, 0, { c: '#4f9be8', d: '#3a7bd5' }], ['sword', 140, 108, 1.7, 35]]);
S('cartoon_90s_2000s', 'pink', [['tv', 130, 108, 1.9], ['rocket', 212, 60, .7, 25], ['cassette', 56, 180, .8]]);
S('anime_general', 'pink', [['flower', 56, 172, .8, 0, { c: '#f28bb0' }], ['flower', 208, 176, .7, 0, { c: '#f28bb0' }], ['cloud', 200, 54, .7], ['torii', 130, 116, 1.9]]);
})(M8P);
(function (X) {
const S = (id, bg, items, ex) => { X.POSTERS[id] = Object.assign({ bg: bg, items: items }, ex || {}); };
const pr = (x, y, s, o) => ['person', x, y, s, 0, o];
S('who_is_player', 'blue', [['qmark', 200, 54, .85], pr(124, 112, 1.5, { head: 'hair', top: 'jersey', tc: '#3b4252', tc2: '#6b7686', hc: '#3b4252', skin: '#4a5568', len: 80 })]);
S('club_alhilal', 'blue', [['jersey', 130, 110, 2.0, 0, { c: '#2f7de1', d: '#ffffff', badge: true }], ['football', 204, 174, .62]]);
S('club_alnassr', 'yellow', [['jersey', 130, 110, 2.0, 0, { c: '#f6c52b', d: '#1f3a8a', badge: true }], ['football', 204, 174, .62]]);
S('club_alittihad', 'yellow', [['jersey', 130, 110, 2.0, 0, { c: '#f6c52b', d: '#1b1b22', stripes: true }], ['football', 204, 174, .62]]);
S('club_alahli', 'green', [['jersey', 130, 110, 2.0, 0, { c: '#2f9d6b', d: '#ffffff', badge: true }], ['football', 204, 174, .62]]);
S('saudi_league', 'mint', [['football', 56, 52, .62], ['stadium', 130, 124, 1.8], ['trophy', 208, 166, .65]]);
S('saudi_national_team_wc', 'mint', [['palm', 48, 156, .9], ['falcon', 130, 98, 1.9], ['football', 206, 174, .7]]);
S('fifa_world_cup', 'yellow', [['cupworld', 130, 108, 1.95], ['football', 54, 174, .7]]);
S('premier_league', 'lilac', [['lion', 128, 108, 2.0], ['football', 208, 176, .65]]);
S('club_real_madrid', 'blue', [['jersey', 130, 136, 1.8, 0, { c: '#ffffff', d: '#2f4ea8', badge: true }], ['crown', 130, 38, .85]]);
S('club_barcelona', 'blue', [['jersey', 130, 110, 2.0, 0, { c: '#2b4aa8', d: '#a51d3a', stripes: true, badge: true }], ['football', 204, 174, .62]]);
S('country_saudi', 'mint', [['palm', 46, 152, 1.0], ['palm', 214, 152, 1.0], ['fort', 130, 124, 1.7]]);
S('saudi_state_history', 'sand', [['palm', 46, 152, .95], ['fort', 124, 128, 1.5], ['sword', 212, 126, 1.35, 24]]);
S('saudi_founding_national_day', 'green', [['fireworks', 130, 88, 1.95], ['fort', 130, 178, .95]]);
S('saudi_vision_2030', 'blue', [['skyline', 176, 152, 1.0], ['towerArch', 88, 118, 1.65], ['rocket', 210, 66, .85, 22]]);
S('saudi_dialect', 'peach', [['speech', 188, 62, 1.15], pr(112, 120, 1.35, { head: 'ghutra', top: 'thobe', len: 80 })]);
S('saudi_popular_food', 'peach', [['dallah', 48, 162, .85], ['dates', 212, 174, .75], ['platter', 130, 118, 2.0]]);
S('quran_kareem', 'green', [['rehal', 130, 152, 1.7], ['quran', 130, 96, 1.8]]);
S('seerah_nabawiyah', 'sand', [['palm', 44, 160, .9], ['palm', 216, 160, .9], ['mosque', 130, 116, 1.9]]);
S('qasas_alanbiya', 'teal', [['bird', 58, 54, .75, -10, { c: '#ffffff' }], ['sun', 210, 54, .85], ['dhow', 130, 116, 1.7]]);
S('alsahabah_alkiram', 'sand', [['camel', 58, 172, .8], ['tent', 132, 116, 1.8], ['sword', 206, 138, 1.25, 28]]);
S('islamic_history', 'teal', [['sword', 50, 170, .95, -22], ['scroll', 208, 176, .72], ['mosque', 130, 114, 1.85]]);
S('country_kuwait', 'blue', [['twintowers', 130, 108, 2.0], ['dhow', 60, 178, .7]]);
S('country_uae', 'sand', [['dunes', 130, 202, 2.5], ['falcon', 58, 168, .7], ['spire', 130, 108, 2.1]]);
S('country_qatar', 'red', [['football', 206, 58, .72], ['dhow', 130, 124, 1.75]]);
S('country_bahrain', 'pink', [['dhow', 204, 56, .6], ['oyster', 130, 120, 1.95]]);
S('country_oman', 'green', [['fort', 124, 126, 1.65], ['palm', 40, 156, .95], ['khanjar', 214, 150, .9, 18]]);
S('country_egypt', 'sand', [['palm', 214, 160, .9], ['sphinx', 66, 176, .85], ['pyramids', 130, 96, 1.8]]);
S('country_jordan', 'red', [['petra', 130, 114, 1.85], ['camel', 56, 178, .55]]);
S('country_palestine', 'green', [['tree', 50, 162, .7], ['tree', 212, 164, .7], ['domerock', 130, 112, 1.9]]);
S('country_syria', 'peach', [['fort', 130, 124, 1.6, 0, { c: '#e9d3a8' }], ['flower', 52, 164, .9, 0, { c: '#ffffff' }], ['lantern', 212, 90, .9]]);
S('country_lebanon', 'green', [['snow', 206, 54, .5], ['cedar', 130, 112, 2.0]]);
S('country_iraq', 'sand', [['palm', 46, 150, 1.0], ['palm', 214, 154, .95], ['ziggurat', 130, 122, 1.9]]);
S('country_yemen', 'sand', [['towerhouse', 130, 118, 1.85], ['finjan', 210, 178, .7]]);
S('country_morocco', 'red', [['arch', 130, 114, 1.9], ['glass', 210, 176, .75]]);
S('country_algeria', 'green', [['sun', 208, 58, .8], ['palm', 48, 152, 1.0], ['camel', 130, 120, 1.8]]);
S('country_tunisia', 'blue', [['sun', 208, 52, .7], ['columns', 130, 108, 1.8], ['wave', 130, 198, 2.5]]);
S('world_capitals', 'blue', [['eiffel', 58, 128, 1.15], ['pagoda', 204, 128, 1.0], ['statue', 130, 118, 1.3], ['pin', 206, 50, .6]]);
S('world_flags', 'lilac', [['flag', 62, 122, 1.2, 0, { c: '#2f9d6b', d: '#ffffff' }], ['flag', 128, 122, 1.2, 0, { c: '#e8553d', d: '#ffffff' }], ['flag', 194, 122, 1.2, 0, { c: '#2f7de1', d: '#f6c52b' }]]);
S('world_straits', 'blue', [['anchor', 48, 164, .7], ['compass', 212, 172, .7], ['ship', 130, 112, 1.8]]);
S('ancient_monuments', 'sand', [['pyramids', 130, 100, 1.8], ['sphinx', 62, 178, .8], ['columns', 208, 172, .7]]);
S('historical_battles', 'red', [['sword', 130, 112, 2.2, -40], ['sword', 130, 112, 2.2, 40], ['shield', 130, 112, 1.5, 0, { c: '#4f8fd9', d: '#ffffff' }]]);
S('famous_explorers', 'teal', [['map', 58, 176, .8], ['telescope', 208, 176, .8], ['compass', 130, 110, 1.9]]);
S('republic_turkey', 'red', [['flower', 50, 172, .8, 0, { c: '#e8553d' }], ['glass', 212, 178, .72], ['mosque', 130, 116, 1.9, 0, { c: '#f4ead2', d: '#7e9bd9' }]]);
S('europe_continent', 'blue', [['windmill', 54, 152, .9], ['castle', 208, 152, .8], ['eiffel', 130, 110, 1.8]]);
S('east_asia_lands', 'pink', [['mountain', 204, 150, .9, 0, { c: '#7f93ab' }], ['pagoda', 100, 116, 1.7]]);
S('americas_continent', 'lilac', [['cactus', 50, 162, .9], ['skyline', 212, 164, .7], ['statue', 130, 108, 1.8]]);
S('chemistry_table', 'green', [['ptable', 122, 108, 1.8], ['flask', 208, 166, .9]]);
S('general_sciences', 'teal', [['leaf', 50, 172, .8], ['flask', 208, 172, .7], ['atom', 130, 110, 1.8]]);
S('human_anatomy', 'pink', [['stetho', 62, 148, 1.0], ['heart', 138, 98, 1.6], ['pulse', 130, 180, 1.3]]);
})(M8P);
(function (X) {
const S = (id, bg, items, ex) => { X.POSTERS[id] = Object.assign({ bg: bg, items: items }, ex || {}); };
const pr = (x, y, s, o) => ['person', x, y, s, 0, o];
S('space_planets', 'navy', [['moon', 50, 60, .7], ['rocket', 212, 170, .8, 25], ['saturn', 130, 104, 1.9]]);
S('wild_animals', 'green', [['tree', 214, 104, .7], ['paw', 212, 176, .55], ['lion', 118, 110, 1.8]]);
S('computer_tech', 'blue', [['chip', 54, 172, .7], ['wifi', 210, 58, .6], ['laptop', 130, 110, 1.9]]);
S('artificial_intelligence', 'lilac', [['bulb', 208, 60, .7], ['chip', 54, 178, .6], ['robot', 130, 108, 1.9]]);
S('arabic_poetry', 'sand', [['moon', 208, 58, .5], ['inkwell', 208, 174, .7], ['quill', 54, 160, .9], ['scroll', 130, 110, 1.8]]);
S('arabic_lexicon', 'yellow', [['bookclosed', 108, 112, 1.6, 0, { c: '#e8553d' }], ['magnifier', 198, 158, 1.25]]);
S('popular_proverbs', 'peach', [['quote', 54, 170, .6], ['bulb', 202, 160, .9], ['speech', 116, 96, 1.7]]);
S('gulf_heritage', 'blue', [['oyster', 56, 178, .6], ['palm', 212, 150, .9], ['dhow', 130, 112, 1.8]]);
S('logic_puzzles', 'lilac', [['bulb', 206, 68, .8], ['qmark', 208, 172, .5], ['puzzle', 118, 112, 1.9]]);
S('world_currencies', 'green', [['coin', 212, 78, .6], ['banknote', 120, 96, 1.7, -8], ['coins', 130, 162, 1.2]]);
S('world_dishes', 'peach', [['pizza', 58, 130, 1.0], ['kebab', 208, 146, .9], ['bowl', 130, 122, 1.45]]);
S('super_cars', 'red', [['tire', 212, 172, .5], ['supercar', 130, 112, 2.1, 0, { c: '#e8553d' }]]);
S('olympic_sports', 'blue', [['laurel', 130, 112, 1.5], ['torch', 130, 104, 1.8], ['medal', 208, 174, .62]]);
S('wwe_wrestling', 'red', [['ringarena', 130, 134, 1.8], ['belt', 130, 84, 1.4]]);
S('video_games', 'lilac', [['joystick', 54, 172, .7], ['controller', 130, 112, 2.0]]);
S('arab_youtubers', 'red', [['camera', 56, 172, .8], ['mic', 208, 172, .8], ['play', 130, 98, 1.8]]);
S('nabati_poetry', 'sand', [['moon', 52, 60, .8], ['dallah', 212, 176, .8], ['tent', 130, 120, 1.7]]);
S('arab_countries_general', 'green', [['camel', 58, 178, .7], ['palm', 208, 158, 1.0], ['mosque', 130, 112, 1.55]]);
S('basketball_nba', 'peach', [['hoop', 120, 100, 1.8], ['basketball', 204, 166, .9]]);
S('formula_1', 'red', [['flagcheck', 58, 68, .7], ['f1car', 130, 118, 1.9]]);
S('tennis_grand_slam', 'green', [['racket', 110, 112, 1.6], ['tennisball', 196, 168, 1.3]]);
S('ufc_mma', 'grey', [['cage', 130, 112, 1.9], ['glove', 130, 118, 1.1]]);
S('rivers_seas', 'blue', [['wave', 130, 186, 2.5], ['river', 124, 100, 1.5], ['fish', 196, 160, .8]]);
S('mountains_deserts', 'sand', [['mountain', 88, 118, 1.5], ['dunes', 150, 178, 1.8], ['cactus', 212, 150, .8]]);
S('world_islands', 'teal', [['sun', 208, 52, .7], ['island', 130, 116, 1.9]]);
S('plants_nature', 'green', [['sprout', 60, 176, .7], ['tree', 100, 118, 1.5], ['flower', 190, 160, 1.0]]);
S('great_inventions', 'yellow', [['gear', 58, 168, .8], ['gear', 210, 172, .6], ['bulb', 130, 106, 1.9]]);
S('amazing_stats', 'lilac', [['coin', 210, 172, .5], ['chart', 130, 112, 1.9]]);
S('what_is_difference', 'blue', [['qmark', 130, 48, .6], ['scale', 130, 118, 1.8]]);
S('abbasid_andalus', 'sand', [['lantern', 54, 74, .9], ['arch', 130, 112, 1.8, 0, { c: '#f4ead2', d: '#3fb0a5' }]]);
S('world_war_1', 'grey', [['flower', 56, 172, .9, 0, { c: '#d9323f' }], ['flower', 212, 178, .8, 0, { c: '#d9323f' }], ['tinhat', 130, 100, 1.9]]);
S('world_war_2', 'grey', [['cloud', 200, 172, .9], ['medal', 58, 172, .7], ['plane', 130, 100, 1.8]]);
S('game_minecraft', 'green', [['pickaxe', 56, 150, 1.0, -20], ['sword', 212, 150, .9, 25], ['cube', 130, 112, 1.9]]);
S('game_fortnite', 'lilac', [['mountain', 130, 184, 1.6], ['parachute', 130, 90, 2.0]]);
S('game_fifa_fc', 'green', [['football', 206, 58, .75], ['controller', 130, 114, 1.9]]);
S('social_media_platforms', 'pink', [['hashtag', 54, 66, .7], ['like', 208, 70, .7], ['bubbleapp', 60, 176, .6], ['phone', 130, 108, 1.7]]);
S('interactive_al_lista', 'yellow', [['pen', 204, 170, .9, 15], ['clipboard', 126, 112, 1.9]]);
S('interactive_order_it', 'blue', [['numblocks', 130, 112, 1.7]]);
S('interactive_without_dots', 'lilac', [['dotletters', 130, 112, 2.0]]);
S('saudi_brands_restaurants', 'peach', [['finjan', 58, 176, .7], ['cup', 204, 150, 1.0], ['burger', 120, 112, 1.6]]);
S('gulf_kuwait_theater', 'red', [['curtain', 130, 108, 1.9], ['maskpair', 130, 132, 1.3]]);
S('turkish_drama_series', 'pink', [['flower', 56, 172, .8, 0, { c: '#e8553d' }], ['glass', 212, 176, .8], ['tv', 130, 108, 1.7]]);
S('music_tarab_classics', 'sand', [['notes', 204, 68, .8], ['micold', 212, 172, .6], ['oud', 118, 112, 1.9]]);
S('interactive_focus_zoom', 'blue', [['eye', 130, 112, 1.8], ['magnifier', 158, 128, 1.5]]);
S('esports_falcons_gaming', 'green', [pr(116, 108, 1.4, { head: 'headset', top: 'jersey', tc: '#1b1f2a', tc2: '#58c27d', hc: '#2b3340', hc2: '#58c27d', len: 80 }), ['trophy', 206, 170, .8]]);
S('cars_motors_world', 'grey', [['tire', 56, 178, .6], ['gauge', 130, 112, 1.9]]);
S('interactive_connect_wasalha', 'yellow', [['hexgrid', 130, 116, 1.8, 0, { route: true, cols: ['#fff3c4', '#ffd166', '#c9ecdb', '#fad0dd', '#dcd2f4', '#cfe3f6', '#fff'], hot: '#f08a3c' }]]);
S('interactive_sound_voice', 'blue', [['micold', 130, 92, 1.5], ['soundwave', 130, 186, 1.45]]);
})(M8P);
(function (X) {
const S = (id, bg, items, ex) => { X.POSTERS[id] = Object.assign({ bg: bg, items: items }, ex || {}); };
const A = (id, from) => { X.POSTERS[id] = X.POSTERS[from]; };
const pr = (x, y, s, o) => ['person', x, y, s, 0, o];
const G = 'charades_general_q', R_ = 'charades_arabic_q', E_ = 'charades_english_q', SP = 'charades_sports_q';
S(G + '1_200', 'green', [['palm', 210, 104, 1.1], ['monkey', 118, 118, 1.7], ['banana', 204, 188, .75, -20]]);
S(G + '2_200', 'teal', [pr(84, 118, 1.35, { head: 'hair', top: 'lab', tc: '#4fb6c4', hc: '#3b2a1e' }), ['tooth', 192, 116, 1.5], ['plus', 150, 52, .5]]);
S(G + '3_200', 'blue', [['swimcap', 130, 120, 1.8], ['sun', 206, 52, .7]]);
S(G + '4_200', 'peach', [['barberpole', 80, 122, 1.35], ['scissors', 182, 118, 1.5, 18]]);
S(G + '5_200', 'blue', [['cloud', 56, 54, .8], pr(106, 122, 1.45, { head: 'cap', top: 'suit', tc: '#2b4170', hc: '#2b4170', hc2: '#f6b93b', tie: '#f6b93b' }), ['plane', 204, 66, .95, -15]]);
S(G + '6_200', 'grey', [['elephant', 128, 124, 2.0]]);
S(G + '7_400', 'red', [pr(88, 122, 1.4, { head: 'hard', top: 'jump', hc: '#d94a3d', hc2: '#ffd166', tc: '#d94a3d', tc2: '#ffd166' }), ['flame', 196, 118, 1.5]]);
S(G + '8_400', 'navy', [['saturn', 56, 60, .65], ['planet', 214, 190, .5], ['astronaut', 130, 122, 1.6]]);
S(G + '9_400', 'lilac', [pr(100, 120, 1.5, { head: 'hair', top: 'suit', tc: '#2b3340', tie: '#fff', hc: '#3b2a1e' }), ['notes', 200, 78, 1.1], ['notes', 58, 172, .7]]);
S(G + '10_400', 'blue', [['fishrod', 84, 106, 1.5], ['fish', 192, 150, 1.3], ['wave', 130, 208, 1.4]]);
S(G + '11_400', 'yellow', [['camera', 128, 122, 1.8], ['flash', 206, 52, .8]]);
S(G + '12_400', 'sand', [['hammer', 88, 118, 1.5], ['saw', 180, 134, 1.25, -14]]);
S(G + '13_600', 'grey', [['elevator', 130, 122, 1.85]]);
S(G + '14_600', 'sand', [['cactus', 218, 150, .8], ['quicksand', 124, 112, 1.7]]);
S(G + '15_600', 'lilac', [pr(74, 120, 1.3, { head: 'hair', top: 'suit', tc: '#3a4a6b', hc: '#3b2a1e' }), pr(186, 120, 1.3, { head: 'bald', top: 'suit', tc: '#7a5538', tie: '#e8553d', skin: 'b' }), ['clipboard', 130, 176, .8]]);
S(G + '16_600', 'peach', [['lion', 92, 122, 1.6], ['phone', 206, 128, 1.3, 12]]);
S(G + '17_600', 'navy', [['cloud', 96, 64, 1.3], ['lightning', 200, 88, 1.2], ['candle', 112, 164, 1.2]]);
S(G + '18_600', 'blue', [['suitcase', 104, 130, 1.5], ['plane', 200, 62, .8, -10], ['qmark', 198, 172, .8]]);
A(R_ + '1_200', 'series_bab_alhara');
A(R_ + '2_200', 'series_tash_ma_tash');
A(R_ + '3_200', 'series_alkabeer_awy');
S(R_ + '4_200', 'green', [['blackboard', 130, 92, 1.55], pr(64, 188, .8, { head: 'cap', top: 'tee', tc: '#e8553d', hc: '#2b3340', hc2: '#2b3340' }), pr(130, 188, .8, { head: 'hair', top: 'tee', tc: '#4f8fd9', hc: '#3b2a1e' }), pr(196, 188, .8, { head: 'bald', top: 'tee', tc: '#f2b24c', skin: 'b' })]);
S(R_ + '5_200', 'yellow', [['eye', 92, 118, 1.5], ['speech', 192, 94, 1.1], ['qmark', 194, 176, .7]]);
A(R_ + '6_200', 'series_shabab_albomb');
A(R_ + '7_400', 'series_jaafar');
A(R_ + '8_400', 'series_alzeer_salem');
S(R_ + '9_400', 'blue', [pr(104, 120, 1.5, { head: 'bald', top: 'suit', tc: '#5b4a8a', tie: '#e8553d' }), ['clipboard', 202, 138, 1], ['whistle', 52, 176, .8]]);
S(R_ + '10_400', 'peach', [['honeyjar', 104, 126, 1.6], ['plane', 200, 70, .8, -8]]);
S(R_ + '11_400', 'teal', [['palm', 46, 150, .9], ['signpost', 138, 118, 1.7]]);
S(R_ + '12_400', 'yellow', [['bulb', 130, 112, 1.9]]);
S(R_ + '13_600', 'red', [['kebab', 100, 126, 1.4], ['columns', 202, 122, 1.0]]);
S(R_ + '14_600', 'sand', [pr(98, 120, 1.4, { head: 'turban', top: 'gal', tc: '#7a8f5a', tc2: '#e8d7a8', hc: '#fbfbf7', hc2: '#f6b93b', skin: 'c' }), ['oud', 200, 130, 1.3, 14]]);
S(R_ + '15_600', 'navy', [['moon', 202, 54, 1], ['lantern', 58, 94, 1.3], ['house', 132, 150, 1.3]]);
S(R_ + '16_600', 'grey', [pr(100, 120, 1.45, { head: 'fedora', top: 'suit', tc: '#2b3340', hc: '#2b3340', hc2: '#8a5a35' }), ['pyramids', 206, 152, .9], ['magnifier', 208, 68, .8]]);
S(R_ + '17_600', 'green', [pr(96, 120, 1.45, { head: 'bald', top: 'suit', tc: '#1f2a3a', tie: '#ffd166', skin: 'b' }), ['coins', 198, 152, 1.1], ['gold', 202, 82, .8]]);
S(R_ + '18_600', 'grey', [pr(98, 120, 1.45, { head: 'helmet', top: 'jump', hc: '#6b7a4f', tc: '#6b7a4f', tc2: '#e2d8a6' }), ['bars', 198, 122, 1.3]]);
S(E_ + '1_200', 'blue', [['iceberg', 202, 140, 1.1], ['ship', 94, 124, 1.3], ['heart', 202, 52, .6]]);
S(E_ + '2_200', 'teal', [['clownfish', 122, 116, 1.7], ['oyster', 208, 190, .7]]);
S(E_ + '3_200', 'sand', [['sun', 198, 58, .9], ['lion', 112, 128, 1.7]]);
S(E_ + '4_200', 'red', [['skyline', 130, 176, 1.6], ['web', 130, 86, 1.3], ['spider', 130, 120, .7]]);
S(E_ + '5_200', 'blue', [['snowflake', 130, 114, 1.9], ['crown', 62, 180, .6]]);
S(E_ + '6_200', 'yellow', [['hat', 100, 100, 1.5, -8, { c: '#9b6a3c', d: '#e8553d' }], ['numblocks', 194, 156, 1], ['rocket', 200, 60, .7, 30]]);
S(E_ + '7_400', 'green', [['dino', 118, 128, 1.6], ['palm', 212, 100, 1.1]]);
S(E_ + '8_400', 'lilac', [['wizardhat', 100, 112, 1.5], ['wand', 196, 150, 1.3, 55], ['owl', 62, 182, .7]]);
S(E_ + '9_400', 'blue', [['house', 104, 132, 1.6], ['tree', 210, 136, 1.1]]);
S(E_ + '10_400', 'navy', [['galleon', 124, 122, 1.5], ['skullflag', 202, 58, .8], ['chest', 58, 186, .8]]);
S(E_ + '11_400', 'blue', [['iceberg', 198, 142, 1], ['elephant', 96, 128, 1.6]]);
S(E_ + '12_400', 'green', [['house', 98, 130, 1.4], ['tree', 202, 122, 1.2], ['leaf', 62, 192, .7], ['leaf', 194, 198, .7]]);
S(E_ + '13_600', 'navy', [['supercar', 118, 140, 1.6], ['clock', 204, 58, 1], ['lightning', 56, 72, .8]]);
S(E_ + '14_600', 'navy', [['saturn', 98, 100, 1.4], ['rocket', 190, 152, 1, 40], ['planet', 206, 54, .5]]);
S(E_ + '15_600', 'grey', [['bars', 130, 114, 1.9], ['pickaxe', 202, 172, .9]]);
S(E_ + '16_600', 'blue', [['sun', 58, 54, .8], ['island', 130, 152, 1.8]]);
S(E_ + '17_600', 'sand', [['groundhog', 118, 128, 1.7], ['sun', 204, 56, .9], ['clock', 206, 170, .7]]);
S(E_ + '18_600', 'blue', [['tv', 130, 100, 1.9], ['eye', 130, 100, .75], ['camera', 206, 188, .6]]);
const jr = (c, c2) => ({ head: 'hair', top: 'jersey', tc: c, tc2: c2 || '#fff', hc: '#3b2a1e', skin: 'c' });
S(SP + '1_200', 'green', [['goal', 188, 120, 1.4], pr(92, 104, 1.25, jr('#2f7de1')), ['football', 108, 186, .8]]);
S(SP + '2_200', 'green', [['goal', 130, 124, 1.9], pr(130, 140, 1.15, { head: 'cap', top: 'jersey', tc: '#f08a3c', tc2: '#fff', hc: '#2b3340', hc2: '#2b3340' }), ['hand', 52, 118, .8, -14, { g: '#7ad06a' }], ['hand', 208, 118, .8, 14, { g: '#7ad06a' }]]);
S(SP + '3_200', 'peach', [['hoop', 192, 100, 1.4], pr(84, 112, 1.25, jr('#e8553d')), ['basketball', 112, 182, .9]]);
S(SP + '4_200', 'grey', [['dumbbell', 130, 64, 1.9], pr(130, 140, 1.5, { head: 'bald', top: 'tee', tc: '#e8553d', skin: 'b' })]);
S(SP + '5_200', 'mint', [['ribbon', 130, 112, 1.7], ['clock', 202, 56, .7], ['boot', 66, 176, .8]]);
S(SP + '6_200', 'green', [['football', 126, 98, 1.3], ['flag', 202, 156, 1.0], ['whistle', 58, 170, .8]]);
S(SP + '7_400', 'green', [['goal', 130, 66, 1.25], pr(60, 160, .75, jr('#e8553d')), pr(104, 160, .75, jr('#e8553d')), pr(148, 160, .75, jr('#e8553d')), ['football', 208, 190, .55]]);
S(SP + '8_400', 'yellow', [['racket', 100, 120, 1.6, 20], ['tennisball', 198, 66, .9], ['net', 200, 174, .75]]);
S(SP + '9_400', 'blue', [['divingboard', 130, 122, 1.8]]);
S(SP + '10_400', 'red', [['glove', 84, 118, 1.5, -15], ['glove', 178, 118, 1.5, 15], ['belt', 130, 198, .9]]);
S(SP + '11_400', 'green', [['football', 194, 66, 1.0], pr(96, 124, 1.5, jr('#2f7de1'))]);
S(SP + '12_400', 'red', [['jerseynum', 130, 118, 1.8, 0, { c: '#d94a3d', d: '#ffffff', n: '7' }], ['stadium', 204, 190, .5]]);
S(SP + '13_600', 'mint', [['highbar', 130, 118, 1.8]]);
S(SP + '14_600', 'green', [['javelin', 130, 112, 1.9], ['medal', 202, 178, .7]]);
S(SP + '15_600', 'blue', [['hand', 100, 112, 1.5, -10], ['football', 198, 152, 1.2]]);
S(SP + '16_600', 'mint', [['boot', 108, 142, 1.6, -45], ['football', 176, 68, 1.1]]);
S(SP + '17_600', 'blue', [['skate', 118, 118, 1.7], ['snowflake', 204, 62, .6]]);
S(SP + '18_600', 'mint', [['hurdle', 66, 134, 1.0], ['hurdle', 130, 134, 1.0], ['hurdle', 194, 134, 1.0]]);
})(M8P);
(function (X) {
const S = (id, bg, items) => { X.POSTERS[id] = { bg: bg, items: items }; };
const pr = (x, y, s, o) => ['person', x, y, s, 0, o];
const gh = (o) => Object.assign({ head: 'ghutra', top: 'thobe', len: 80 }, o || {});
const turb = { head: 'turban', top: 'gal', tc: '#7a8f5a', tc2: '#e8d7a8', hc: '#fbfbf7', hc2: '#f6b93b', skin: 'c', len: 80 };
const fezr = { head: 'fez', top: 'robe', tc: '#6b4a2e', tc2: '#e2b98a', skin: 'b', len: 80 };
const sh = (o) => Object.assign({ head: 'shemagh', top: 'thobe', skin: 'c', len: 80 }, o || {});
const suit = (o) => Object.assign({ head: 'hair', top: 'suit', tc: '#3a4a6b', hc: '#3b2a1e', len: 80 }, o || {});
const P = 'series_';
S(P + 'alasoof_q1_200', 'sand', [pr(118, 118, 1.5, gh()), ['house', 208, 150, .95]]);
S(P + 'alasoof_q5_200', 'sand', [pr(112, 118, 1.5, sh()), ['house', 208, 148, 1.0]]);
S(P + 'alasoof_q6_200', 'sand', [pr(112, 118, 1.5, gh({ skin: 'b' })), ['coins', 206, 164, .9]]);
S(P + 'alkabeer_awy_q1_200', 'green', [pr(112, 118, 1.5, turb), ['palm', 212, 112, 1.15]]);
S(P + 'alkabeer_awy_q2_200', 'green', [['house', 112, 138, 1.5], ['palm', 210, 118, 1.2]]);
S(P + 'alkabeer_awy_q3_200', 'green', [pr(104, 118, 1.5, turb), ['house', 210, 142, .9]]);
S(P + 'alkabeer_awy_q4_200', 'green', [pr(116, 118, 1.5, { head: 'cap', top: 'hoodie', tc: '#e8553d', hc: '#2b3340', hc2: '#2b3340', len: 80 }), ['plane', 204, 66, .8, -10]]);
S(P + 'alkabeer_awy_q5_200', 'green', [['house', 110, 138, 1.4], ['pot', 206, 154, .8]]);
S(P + 'alkabeer_awy_q6_200', 'green', [pr(116, 118, 1.5, { head: 'cap', top: 'jump', hc: '#2b3340', hc2: '#2b3340', tc: '#2b3340', tc2: '#ffd166', len: 80 }), ['house', 208, 146, .9]]);
S(P + 'alkabeer_awy_q7_400', 'green', [pr(112, 118, 1.5, { head: 'bald', top: 'lab', tc: '#4fb6c4', skin: 'b', len: 80 }), ['stetho', 208, 150, .9]]);
S(P + 'alkabeer_awy_q8_400', 'green', [pr(78, 124, 1.25, suit({ head: 'cap', top: 'tee', tc: '#e8553d', hc: '#2b3340', hc2: '#2b3340' })), pr(182, 124, 1.25, turb), ['cup', 130, 186, .7]]);
S(P + 'alkabeer_awy_q12_400', 'green', [['house', 130, 136, 1.6], ['flower', 208, 172, .85]]);
S(P + 'alkabeer_awy_q13_600', 'green', [pr(112, 118, 1.5, { head: 'turban', top: 'robe', tc: '#6b4a2e', tc2: '#e2b98a', hc: '#fbfbf7', hc2: '#f6b93b', skin: 'c', len: 80 }), ['house', 208, 146, .95]]);
S(P + 'alkabeer_awy_q14_600', 'green', [['house', 112, 140, 1.5], ['palm', 208, 112, 1.2]]);
S(P + 'alzeer_salem_q1_200', 'sand', [['horse', 112, 128, 1.7], ['sword', 206, 130, 1.3, 20]]);
S(P + 'alzeer_salem_q7_400', 'sand', [pr(110, 118, 1.5, { head: 'turban', top: 'armor', hc: '#2b3340', hc2: '#f6b93b', skin: 'c', len: 80 }), ['tent', 208, 152, 1.0]]);
S(P + 'alzeer_salem_q8_400', 'sand', [['tent', 112, 142, 1.5], ['horse', 208, 142, 1.0]]);
S(P + 'bab_alhara_q1_200', 'peach', [['arch', 128, 126, 1.6, 0, { c: '#e2b98a', d: '#6b4a2e' }], ['lantern', 50, 86, 1.1]]);
S(P + 'bab_alhara_q2_200', 'peach', [['arch', 130, 126, 1.85, 0, { c: '#d8a86e', d: '#5a3a22' }]]);
S(P + 'bab_alhara_q3_200', 'peach', [pr(112, 118, 1.5, fezr), ['arch', 208, 128, .9, 0, { c: '#e2b98a', d: '#6b4a2e' }]]);
S(P + 'bab_alhara_q4_200', 'peach', [pr(112, 118, 1.5, Object.assign({}, fezr, { tc: '#2b3340', tc2: '#8a96a6' })), ['lantern', 208, 96, 1.2]]);
S(P + 'bab_alhara_q5_200', 'peach', [['radio', 108, 130, 1.5], ['arch', 210, 128, .9, 0, { c: '#e2b98a', d: '#6b4a2e' }]]);
S(P + 'bab_alhara_q6_200', 'peach', [['house', 110, 142, 1.5], ['lantern', 208, 100, 1.0]]);
S(P + 'breaking_bad_q1_200', 'green', [pr(112, 118, 1.5, { head: 'fedora', top: 'jump', hc: '#2b3340', hc2: '#2b3340', tc: '#6b7a4f', skin: 'b', len: 80 }), ['dunes', 206, 176, .8]]);
S(P + 'breaking_bad_q2_200', 'green', [['dunes', 128, 172, 1.5], ['cactus', 60, 140, .8], ['sun', 204, 58, .8]]);
S(P + 'breaking_bad_q3_200', 'green', [pr(116, 118, 1.5, { head: 'fedora', top: 'suit', tc: '#2b3340', hc: '#2b3340', hc2: '#2b3340', skin: 'b', len: 80 }), ['dunes', 206, 176, .8]]);
S(P + 'breaking_bad_q4_200', 'green', [pr(112, 118, 1.5, { head: 'hood', top: 'hoodie', tc: '#e8553d', hc: '#e8553d', len: 80 }), ['cactus', 208, 150, .8]]);
S(P + 'breaking_bad_q5_200', 'green', [pr(110, 118, 1.5, suit({ tie: '#ffd166', tc: '#7a5538', head: 'bald', skin: 'b' })), ['phone', 206, 140, 1.0, 10]]);
S(P + 'breaking_bad_q6_200', 'green', [['dunes', 128, 172, 1.5], ['sun', 196, 58, .9], ['cactus', 60, 148, .8]]);
S(P + 'egypt_general_q1_200', 'blue', [pr(106, 118, 1.5, { head: 'fedora', top: 'suit', tc: '#2b3340', hc: '#2b3340', hc2: '#8a5a35', len: 80 }), ['pyramids', 206, 154, .85]]);
S(P + 'egypt_general_q2_200', 'blue', [['dhow', 128, 130, 1.5], ['sun', 204, 56, .85]]);
S(P + 'egypt_general_q3_200', 'blue', [['bookclosed', 112, 130, 1.4], ['pencil', 206, 142, 1.0]]);
S(P + 'egypt_general_q6_200', 'blue', [pr(110, 118, 1.5, { head: 'helmet', top: 'jump', hc: '#6b7a4f', tc: '#6b7a4f', tc2: '#e2d8a6', len: 80 }), ['dunes', 208, 176, .75]]);
S(P + 'friends_q1_200', 'yellow', [['sofa', 120, 138, 1.7], ['cup', 212, 116, .9]]);
S(P + 'friends_q2_200', 'yellow', [pr(112, 118, 1.5, suit({ top: 'tee', tc: '#4f8fd9' })), ['sofa', 208, 156, .75]]);
S(P + 'friends_q3_200', 'yellow', [['key', 112, 124, 1.4], ['house', 208, 144, .9]]);
S(P + 'friends_q4_200', 'yellow', [['notes', 112, 112, 1.5], ['cup', 208, 160, .8]]);
S(P + 'friends_q5_200', 'yellow', [pr(112, 118, 1.5, suit({ tc: '#2f3a52', tie: '#7ad06a' })), ['speech', 204, 74, 1.1]]);
S(P + 'friends_q6_200', 'yellow', [pr(110, 118, 1.5, suit({ tc: '#5b4a8a' })), ['clock', 206, 72, .8]]);
S(P + 'jaafar_q1_200', 'sand', [pr(112, 118, 1.5, turb), ['house', 208, 150, .95]]);
S(P + 'jaafar_q2_200', 'sand', [['clap', 112, 118, 1.6], ['camera', 208, 164, .8]]);
S(P + 'jaafar_q3_200', 'sand', [['house', 120, 136, 1.5], ['palm', 210, 116, 1.2]]);
S(P + 'jaafar_q4_200', 'sand', [['house', 130, 138, 1.7]]);
S(P + 'jaafar_q5_200', 'sand', [['house', 110, 138, 1.4], ['rose', 206, 152, .9]]);
S(P + 'jaafar_q6_200', 'sand', [['house', 130, 138, 1.6], ['palm', 214, 118, 1.1]]);
S(P + 'lan_aeesh_q1_200', 'peach', [pr(110, 118, 1.5, { head: 'turban', top: 'robe', tc: '#5b4a8a', tc2: '#e2b98a', hc: '#fbfbf7', hc2: '#f6b93b', skin: 'b', len: 80 }), ['scale', 208, 152, .9]]);
S(P + 'lan_aeesh_q3_200', 'peach', [['pot', 112, 132, 1.3], ['house', 208, 144, .9]]);
S(P + 'lan_aeesh_q5_200', 'peach', [pr(112, 118, 1.5, { head: 'cap', top: 'tee', tc: '#4f8fd9', hc: '#2b3340', hc2: '#2b3340', len: 80 }), ['bookclosed', 208, 152, .9]]);
S(P + 'lan_aeesh_q6_200', 'peach', [['ring', 112, 122, 1.3], ['flower', 208, 152, .9]]);
S(P + 'lan_aeesh_q9_400', 'peach', [pr(110, 118, 1.5, { head: 'turban', top: 'gal', tc: '#6b4a2e', tc2: '#e2b98a', hc: '#eee', hc2: '#c9a050', len: 80 }), ['coins', 208, 164, .9]]);
S(P + 'lan_aeesh_q10_400', 'peach', [pr(110, 118, 1.5, { head: 'cap', top: 'gal', tc: '#6b7a4f', tc2: '#e2d8a6', hc: '#6b4a2e', hc2: '#6b4a2e', len: 80 }), ['house', 208, 146, .9]]);
S(P + 'levant_general_q1_200', 'teal', [pr(110, 118, 1.5, sh({ top: 'robe', tc: '#2b3340', tc2: '#8a96a6' })), ['mountain', 208, 146, 1.1]]);
S(P + 'levant_general_q5_200', 'teal', [pr(110, 118, 1.5, { head: 'fez', top: 'suit', tc: '#6b4a2e', len: 80 }), ['key', 208, 144, .9]]);
S(P + 'levant_general_q7_400', 'teal', [pr(110, 118, 1.5, { head: 'shemagh', top: 'robe', tc: '#6b4a2e', tc2: '#e2b98a', skin: 'c', len: 80 }), ['tree', 208, 142, 1.1]]);
S(P + 'saudi_general_q3_200', 'mint', [pr(116, 118, 1.5, gh()), ['house', 208, 148, .95]]);
S(P + 'saudi_general_q11_400', 'mint', [pr(58, 120, .95, gh()), pr(124, 120, .95, sh()), pr(190, 120, .95, gh({ skin: 'b' })), ['supercar', 130, 196, .8]]);
S(P + 'saudi_general_q12_400', 'mint', [['sofa', 118, 140, 1.6], ['house', 214, 124, .75]]);
S(P + 'tash_ma_tash_q1_200', 'yellow', [['tv', 130, 104, 1.9]]);
S(P + 'tash_ma_tash_q2_200', 'yellow', [['tv', 112, 108, 1.6], ['sofa', 208, 160, .75]]);
S(P + 'tash_ma_tash_q3_200', 'yellow', [['tv', 128, 98, 1.5], ['sofa', 130, 188, .8]]);
S(P + 'tash_ma_tash_q4_200', 'yellow', [pr(84, 126, 1.25, gh()), pr(182, 128, 1.15, sh({ skin: 'b' }))]);
S(P + 'tash_ma_tash_q5_200', 'yellow', [pr(118, 118, 1.5, gh({ skin: 'b' })), ['tv', 210, 150, .8]]);
S(P + 'tash_ma_tash_q6_200', 'yellow', [['tv', 130, 104, 1.7], pr(50, 184, .7, gh()), pr(210, 184, .7, sh())]);
})(M8P);
(function (X) {
const S = (id, bg, items) => { X.POSTERS[id] = { bg: bg, items: items }; };
const P = 'series_';
const pr = (x, y, s, o) => ['person', x, y, s, 0, Object.assign({ len: 70 }, o || {})];
const it = (m, x, y, s, rot, o) => [m, x, y, s, rot || 0, o || {}];
const gh = (o) => Object.assign({ head: 'ghutra', top: 'thobe' }, o || {});
const shm = (o) => Object.assign({ head: 'shemagh', top: 'thobe', skin: 'c' }, o || {});
const turb = (o) => Object.assign({ head: 'turban', top: 'gal', tc: '#7a8f5a', tc2: '#e8d7a8', hc: '#fbfbf7', hc2: '#f6b93b', skin: 'c' }, o || {});
const wm = (c, hc, o) => Object.assign({ head: 'hijab', top: 'dress', tc: c || '#8b5a9f', hc: hc || '#3b2a4a', skin: 'a' }, o || {});
const kid = (o) => Object.assign({ head: 'hair', top: 'tee', tc: '#4f9be8', hc: '#2b2b33' }, o || {});
S(P + 'alasoof_q1_200', 'sand', [it('najdi', 186, 146, 1.2), pr(84, 124, 1.25, gh()), it('radio', 232, 196, .5)]);
S(P + 'alasoof_q5_200', 'peach', [pr(86, 124, 1.25, shm()), it('dallah', 188, 140, 1.15), it('finjan', 228, 190, .8), it('dates', 150, 198, .55)]);
S(P + 'alasoof_q6_200', 'sand', [it('oldcar', 156, 168, 1.35), pr(60, 124, 1.0, gh({ skin: 'b' })), it('sun', 214, 64, .7)]);
S(P + 'alkabeer_awy_q1_200', 'green', [pr(90, 124, 1.3, turb()), it('cane', 186, 148, 1.15), it('wheat', 228, 150, .95)]);
S(P + 'alkabeer_awy_q2_200', 'mint', [it('house', 72, 152, 1.1), it('windmill', 160, 134, 1.2), it('palm', 232, 132, 1.0), it('sheep', 118, 206, .45)]);
S(P + 'alkabeer_awy_q3_200', 'green', [pr(88, 124, 1.25, turb({ tc: '#6b4a2e' })), it('stamp', 188, 138, 1.1), it('paperstack', 208, 190, .85)]);
S(P + 'alkabeer_awy_q4_200', 'blue', [pr(84, 124, 1.25, { head: 'cap', top: 'hoodie', tc: '#e8553d', hc: '#2b3340', hc2: '#2b3340' }), it('statue', 186, 142, 1.1), it('plane', 216, 52, .65, -14)]);
S(P + 'alkabeer_awy_q5_200', 'pink', [pr(88, 124, 1.25, wm('#d9534f', '#2b3340')), it('giftbox', 192, 160, 1.15), it('heart', 222, 78, .5)]);
S(P + 'alkabeer_awy_q6_200', 'yellow', [it('scarecrow', 100, 132, 1.3), it('wheat', 196, 150, 1.0), it('bird', 214, 64, .6, -8)]);
S(P + 'alkabeer_awy_q7_400', 'teal', [pr(88, 124, 1.25, { head: 'bald', top: 'lab', tc: '#4fb6c4', skin: 'b' }), it('clinic', 192, 146, 1.05), it('clipboard', 228, 194, .6)]);
S(P + 'alkabeer_awy_q8_400', 'lilac', [pr(66, 126, 1.1, { head: 'cap', top: 'tee', tc: '#e8553d', hc: '#2b3340', hc2: '#2b3340' }), pr(194, 126, 1.1, turb()), it('tray', 130, 178, .95)]);
S(P + 'alkabeer_awy_q12_400', 'peach', [pr(88, 124, 1.25, wm('#2f9e8a', '#2b3340')), it('pot', 186, 164, 1.0), it('naan', 230, 204, .5)]);
S(P + 'alkabeer_awy_q13_600', 'sand', [pr(88, 124, 1.25, { head: 'fez', top: 'robe', tc: '#6b4a2e', tc2: '#e2b98a', skin: 'b' }), it('tasbih', 188, 130, .95), it('lantern', 226, 164, .75)]);
S(P + 'alkabeer_awy_q14_600', 'green', [pr(88, 124, 1.25, wm('#7c3aed', '#e8e8f0')), it('sheep', 190, 168, 1.05), it('flower', 228, 114, .7)]);
S(P + 'alzeer_salem_q1_200', 'sand', [pr(86, 124, 1.25, { head: 'turban', top: 'armor', hc: '#2b3340', hc2: '#f6b93b', skin: 'c' }), it('sword', 186, 134, 1.25, 18), it('flame', 230, 160, .8)]);
S(P + 'alzeer_salem_q7_400', 'peach', [pr(84, 124, 1.25, { head: 'helmet', top: 'armor', hc: '#94a3b8', skin: 'b' }), it('shield', 188, 150, 1.05), it('tent', 232, 176, .6)]);
S(P + 'alzeer_salem_q8_400', 'red', [pr(64, 126, 1.1, { head: 'turban', top: 'armor', hc: '#3b2a1e', hc2: '#f6b93b', skin: 'c' }), pr(168, 126, 1.1, { head: 'helmet', top: 'armor', hc: '#6b7280', skin: 'b' }), it('khanjar', 128, 168, 1.1, 90), it('camel', 232, 188, .5)]);
S(P + 'bab_alhara_q1_200', 'sand', [it('mosque', 104, 138, 1.5), it('rose', 210, 160, 1.0), it('moon', 214, 60, .55)]);
S(P + 'bab_alhara_q2_200', 'peach', [it('gate', 108, 140, 1.5), it('lantern', 208, 118, .95), it('cat', 228, 188, .5)]);
S(P + 'bab_alhara_q3_200', 'blue', [pr(70, 126, 1.15, { head: 'fez', top: 'thobe', skin: 'b' }), it('barberpole', 160, 142, 1.25), it('scissors', 224, 176, .85, -25)]);
S(P + 'bab_alhara_q4_200', 'red', [pr(86, 124, 1.25, { head: 'fez', top: 'robe', tc: '#3b2a1e', tc2: '#9a7b4f', skin: 'b' }), it('khanjar', 190, 150, 1.15, 28), it('shield', 232, 190, .6)]);
S(P + 'bab_alhara_q5_200', 'sand', [pr(84, 124, 1.25, { head: 'fez', top: 'gal', tc: '#6b7280', tc2: '#d6d3d1', skin: 'b' }), it('radio', 190, 160, 1.05), it('clock', 224, 88, .55)]);
S(P + 'bab_alhara_q6_200', 'mint', [it('map', 118, 138, 1.5), it('pin', 150, 92, .75), it('jasmine', 214, 176, .9)]);
S(P + 'breaking_bad_q1_200', 'sand', [pr(76, 124, 1.25, { head: 'fedora', top: 'suit', tc: '#7a6a4a', hc: '#2b2b33', hc2: '#6b5a40' }), it('rv', 186, 158, 1.0), it('cactus', 238, 150, .6), it('sun', 222, 56, .6)]);
S(P + 'breaking_bad_q2_200', 'green', [it('blackboard', 176, 124, 1.35), pr(70, 124, 1.2, { head: 'hair', top: 'lab', tc: '#4f9be8', hc: '#3b2a1e' }), it('flask', 222, 190, .8)]);
S(P + 'breaking_bad_q3_200', 'navy', [it('hat', 130, 96, 1.9), it('shades', 130, 160, 1.2), it('atom', 214, 62, .6)]);
S(P + 'breaking_bad_q4_200', 'lilac', [pr(84, 124, 1.25, { head: 'cap', top: 'hoodie', tc: '#ef4444', hc: '#facc15', hc2: '#facc15' }), it('baggie', 186, 150, 1.1), it('spraycan', 232, 160, .75)]);
S(P + 'breaking_bad_q5_200', 'yellow', [pr(80, 124, 1.25, { head: 'hair', top: 'suit', tc: '#7c3aed', hc: '#2b2b33', tie: '#f59e0b' }), it('scale', 188, 146, 1.1), it('banknote', 226, 196, .6)]);
S(P + 'breaking_bad_q6_200', 'blue', [it('bluecrystal', 118, 150, 1.55), it('flask', 218, 150, 1.05, 0, { c: '#38bdf8' })]);
S(P + 'egypt_general_q1_200', 'sand', [pr(80, 124, 1.25, { head: 'fedora', top: 'suit', tc: '#6b7280', hc: '#374151', hc2: '#9ca3af' }), it('suitcase', 188, 172, .85), it('pyramids', 206, 98, .8), it('camera', 232, 200, .5)]);
S(P + 'egypt_general_q2_200', 'pink', [pr(76, 124, 1.25, wm('#7c3aed', '#2b3340')), pr(172, 158, .8, kid()), it('scale', 224, 112, .65)]);
S(P + 'egypt_general_q3_200', 'green', [pr(84, 124, 1.25, wm('#0f766e', '#2b3340')), it('blackboard', 188, 126, 1.05), it('apple', 232, 196, .55)]);
S(P + 'egypt_general_q6_200', 'sand', [pr(84, 124, 1.25, { head: 'helmet', top: 'jump', tc: '#8b8a5a', tc2: '#8b8a5a', hc: '#4b5320', skin: 'c' }), it('shield', 190, 146, 1.0, 0, { c: '#4b5320', d: '#e0b44c' }), it('medal', 232, 196, .55)]);
S(P + 'friends_q2_200', 'mint', [it('dino', 122, 142, 1.65), it('bone', 214, 192, .8), it('magnifier', 216, 92, .7)]);
S(P + 'friends_q3_200', 'peach', [it('chefhat', 96, 116, 1.5), it('pot', 186, 156, 1.0), it('cheese', 228, 196, .55)]);
S(P + 'friends_q4_200', 'yellow', [it('cat', 90, 142, 1.2), it('cloud', 112, 74, .55), it('guitar', 190, 144, 1.35), it('notes', 232, 82, .7)]);
S(P + 'friends_q5_200', 'blue', [pr(84, 124, 1.25, { head: 'hair', top: 'tee', tc: '#e8553d', hc: '#3b2a1e', skin: 'b' }), it('speech', 190, 100, 1.0), it('heart', 190, 96, .38), it('pizza', 222, 186, .7)]);
S(P + 'jaafar_q1_200', 'sand', [pr(84, 124, 1.25, turb({ tc: '#1f2937', tc2: '#9ca3af' })), it('chain', 190, 148, 1.15), it('cane', 232, 150, .9)]);
S(P + 'jaafar_q2_200', 'grey', [it('clap', 84, 146, 1.2), it('camera', 186, 134, 1.2), it('megaphone', 228, 82, .8, -16), it('film', 132, 198, .7)]);
S(P + 'jaafar_q3_200', 'navy', [it('crescent', 98, 104, 1.4), it('lantern', 196, 136, 1.2), it('dates', 232, 196, .6), it('star', 150, 60, .5)]);
S(P + 'jaafar_q4_200', 'blue', [it('poster', 98, 128, 1.4), it('magnifier', 192, 152, 1.25), it('suitcase', 234, 192, .55, 0, { c: '#4f8fd9' })]);
S(P + 'jaafar_q5_200', 'pink', [pr(88, 124, 1.25, wm('#be185d', '#2b3340')), it('rose', 192, 160, 1.0), it('ring', 224, 80, .6)]);
S(P + 'jaafar_q6_200', 'yellow', [pr(80, 124, 1.2, turb({ tc: '#374151', tc2: '#9ca3af' })), it('ring', 176, 98, .6), it('ring', 218, 98, .6), it('ring', 176, 156, .6), it('ring', 218, 156, .6)]);
S(P + 'lan_aeesh_q1_200', 'sand', [pr(84, 124, 1.25, turb({ tc: '#6b7280', tc2: '#e5e7eb', hc: '#f8fafc' })), it('rehal', 190, 164, 1.05), it('quran', 190, 126, .85)]);
S(P + 'lan_aeesh_q3_200', 'peach', [pr(86, 124, 1.25, wm('#b45309', '#3b2a1e')), it('platter', 190, 164, 1.15), it('jasmine', 230, 104, .6)]);
S(P + 'lan_aeesh_q5_200', 'blue', [pr(84, 124, 1.25, { head: 'hair', top: 'suit', tc: '#1e3a8a', hc: '#2b2b33', tie: '#dc2626' }), it('steering', 190, 146, 1.05), it('key', 228, 196, .55)]);
S(P + 'lan_aeesh_q6_200', 'lilac', [pr(86, 124, 1.25, wm('#0e7490', '#2b3340')), it('book', 190, 150, 1.1), it('pencil', 230, 110, .7, 30)]);
S(P + 'lan_aeesh_q9_400', 'teal', [pr(80, 124, 1.25, { head: 'flat', top: 'tee', tc: '#a16207', hc: '#78716c', hc2: '#57534e', skin: 'b' }), it('fish', 184, 146, 1.3), it('scale', 232, 196, .55)]);
S(P + 'lan_aeesh_q10_400', 'yellow', [pr(82, 124, 1.25, { head: 'hair', top: 'tee', tc: '#16a34a', hc: '#3b2a1e', skin: 'b' }), it('bowl', 188, 160, 1.2), it('coins', 230, 192, .65)]);
S(P + 'levant_general_q1_200', 'grey', [pr(80, 124, 1.25, shm({ tc: '#1f2937', hc: '#9ca3af' })), it('mountain', 188, 128, 1.5), it('cedar', 234, 152, .8)]);
S(P + 'levant_general_q5_200', 'red', [it('curtain', 130, 108, 2.0), pr(84, 126, 1.25, { head: 'fez', top: 'suit', tc: '#4b5563', skin: 'b' }), it('micold', 196, 156, 1.1)]);
S(P + 'levant_general_q7_400', 'sand', [pr(76, 124, 1.25, gh({ hc: '#fbfbf7' })), it('key', 176, 104, 1.1, -20), it('tree', 224, 156, .95, 0, { c: '#7d9b6a' }), it('tent', 164, 194, .55)]);
S(P + 'saudi_general_q3_200', 'navy', [pr(84, 124, 1.25, gh()), it('clock', 196, 100, .85), it('lock', 226, 168, .75)]);
S(P + 'saudi_general_q11_400', 'sand', [it('dunes', 130, 176, 1.9), it('camel', 98, 150, 1.25), it('suitcase', 196, 172, .7), it('sun', 214, 62, .75)]);
S(P + 'saudi_general_q12_400', 'teal', [pr(88, 124, 1.25, wm('#0f766e', '#2b3340')), it('falcon', 190, 130, 1.05), it('dates', 226, 192, .6)]);
S(P + 'tash_ma_tash_q1_200', 'lilac', [it('tv', 122, 140, 1.7), it('popcorn', 218, 164, .85), it('sofa', 110, 206, .55)]);
S(P + 'tash_ma_tash_q2_200', 'blue', [it('dhow', 120, 148, 1.5), it('palm', 224, 128, 1.0), it('sun', 202, 60, .65)]);
S(P + 'tash_ma_tash_q3_200', 'navy', [it('moon', 100, 100, 1.3), it('dates', 192, 164, 1.2), it('tent', 232, 136, .75)]);
S(P + 'tash_ma_tash_q4_200', 'grey', [pr(84, 124, 1.25, gh({ top: 'suit', tc: '#374151' })), it('laptop', 190, 160, 1.1), it('phone', 230, 100, .6)]);
S(P + 'tash_ma_tash_q5_200', 'peach', [pr(84, 124, 1.25, gh({ skin: 'c' })), it('drum', 190, 158, 1.0), it('notes', 222, 80, .75)]);
S(P + 'tash_ma_tash_q6_200', 'yellow', [it('cassette', 100, 146, 1.4), it('headphones', 196, 142, 1.2), it('radio', 126, 204, .5)]);
})(M8P);
(function (X) {
const S = (id, bg, items) => { X.POSTERS[id] = { bg: bg, items: items }; };
const W_ = 'rebus_words_q', F_ = 'rebus_football_q';
const one = (id, bg, m, sc, extra) => S(id, bg, [[m, 130, 122, (sc || 1.9) * 0.76]].concat(extra || []));
one(W_ + '1_200', 'blue', 'eiffel'); one(W_ + '2_200', 'sand', 'pyramids', 2.0); one(W_ + '3_200', 'blue', 'burj', 2.0);
one(W_ + '4_200', 'mint', 'statue'); one(W_ + '5_200', 'peach', 'bigben', 2.0); one(W_ + '6_200', 'teal', 'kingdom', 2.0);
one(W_ + '7_400', 'green', 'pisa', 2.0); one(W_ + '8_400', 'sand', 'colosseum', 1.9); one(W_ + '9_400', 'pink', 'taj', 1.9);
one(W_ + '10_400', 'blue', 'opera', 1.9); one(W_ + '11_400', 'sand', 'clocktower', 1.9); one(W_ + '12_400', 'teal', 'burjarab', 2.0);
one(W_ + '13_600', 'green', 'wall', 1.8); one(W_ + '14_600', 'peach', 'goldengate', 1.8); one(W_ + '15_600', 'mint', 'christ', 1.9);
one(W_ + '16_600', 'sand', 'petra', 1.9); one(W_ + '17_600', 'sand', 'fort', 1.9); one(W_ + '18_600', 'lilac', 'mosque', 1.9);
S(F_ + '1_200', 'yellow', [['cupworld', 130, 122, 1.5]]);
const stad = (n, pts, bg, m, flag, scarves, sc) => S(F_ + n + '_' + pts, bg, [[m, 130, 120, sc || 1.5]]
.concat(flag ? [['stflag', 26, 58, .6, 0, { k: flag }]] : [])
.concat((scarves || []).map((c, i) => ['scarf', scarves.length === 1 ? 206 : (i ? 186 : 78), 206, .5, scarves.length === 1 ? -7 : (i ? 5 : -5), { cs: c }])));
stad(2, 200, 'lilac', 'stad_bernabeu', 'es', [['#ffffff', '#7c3aed']]);
stad(3, 200, 'blue', 'stad_campnou', 'es', [['#004d98', '#a50044']]);
stad(4, 200, 'pink', 'stad_oldtrafford', 'eng', [['#dc2626', '#ffffff', '#111827']]);
stad(5, 200, 'blue', 'stad_wembley', 'eng', [['#ffffff', '#dc2626']], 1.42);
stad(6, 200, 'green', 'stad_maracana', 'br', [['#16a34a', '#facc15']]);
stad(7, 400, 'pink', 'stad_allianz', 'de', [['#dc2626', '#ffffff']]);
stad(8, 400, 'red', 'stad_anfield', 'eng', [['#dc2626', '#fecaca']]);
stad(9, 400, 'grey', 'stad_sansiro', 'it', [['#dc2626', '#111827'], ['#1d4ed8', '#111827']]);
stad(10, 400, 'sand', 'stad_kingfahd', 'sa', [['#15803d', '#ffffff']]);
stad(11, 400, 'yellow', 'stad_lusail', 'qa', [['#8a1538', '#ffffff']]);
stad(12, 400, 'red', 'stad_emirates', 'eng', [['#dc2626', '#ffffff']]); X.POSTERS[F_ + '12_400'].items.push(['cannon', 52, 196, .62]);
stad(13, 600, 'yellow', 'stad_signal', 'de', [['#facc15', '#111827']]);
stad(14, 600, 'mint', 'stad_azteca', 'mx', [['#16a34a', '#ffffff', '#dc2626']]);
stad(15, 600, 'blue', 'stad_etihad', 'eng', [['#7bb7e6', '#ffffff']]);
stad(16, 600, 'teal', 'stad_jawhara', 'sa', [['#15803d', '#facc15']]);
stad(17, 600, 'blue', 'stad_stamford', 'eng', [['#1d4ed8', '#ffffff']]);
stad(18, 600, 'peach', 'stad_parc', 'fr', [['#1e3a8a', '#dc2626']]);
S('rebus_general', 'mint', [['duck', 82, 134, .95], ['plus', 130, 118, .42], ['ice', 180, 138, .85]]);
S('imagine_scenes', 'lilac', [['elephant', 98, 148, .95], ['plane', 188, 84, .85, -12], ['cloud', 204, 52, .7]]);
const G_ = 'rebus_general_q';
const gm = [['lion', 'yellow'], ['elephant', 'blue'], ['camera', 'green'], ['pizza', 'peach'], ['camel', 'sand'], ['banana', 'yellow'],
['bird', 'blue'], ['bird', 'pink'], ['notes', 'lilac'], ['fish', 'teal'], ['paw', 'sand'], ['falcon', 'blue'],
['wave', 'teal'], ['mountain', 'grey'], ['saturn', 'lilac'], ['fish', 'blue'], ['lights', 'navy'], ['mountain', 'green']];
gm.forEach((m, i) => { const n = i + 1, pts = n <= 6 ? 200 : (n <= 12 ? 400 : 600); S(G_ + n + '_' + pts, m[1], [[m[0], 130, 122, 1.5]]); });
})(M8P);
(function (X) {
const S = (id, bg, items) => { X.POSTERS[id] = { bg: bg, items: items }; };
S("rebus_general_q1_200_p1", "yellow", [["duck", 130, 122, 1.75]]);
S("rebus_general_q1_200_p2", "blue", [["gulp", 130, 122, 1.7]]);
S("rebus_general_q2_200_p1", "mint", [["duck", 130, 122, 1.75]]);
S("rebus_general_q2_200_p2", "blue", [["ice", 130, 122, 1.8]]);
S("rebus_general_q3_200_p1", "lilac", [["jasmine", 130, 122, 1.7]]);
S("rebus_general_q3_200_p2", "mint", [["jasmine", 130, 122, 1.7]]);
S("rebus_general_q4_200_p1", "sand", [["demolish", 130, 122, 1.65]]);
S("rebus_general_q4_200_p2", "peach", [["demolish", 130, 122, 1.65]]);
S("rebus_general_q5_200_p1", "yellow", [["oil", 130, 122, 1.8]]);
S("rebus_general_q5_200_p2", "blue", [["one", 130, 122, 1.8]]);
S("rebus_general_q6_200_p1", "sand", [["seeds", 130, 122, 1.7]]);
S("rebus_general_q6_200_p2", "peach", [["naan", 130, 122, 1.7]]);
S("rebus_general_q7_400_p1", "green", [["hill", 130, 122, 1.7]]);
S("rebus_general_q7_400_p2", "blue", [["phone", 130, 122, 1.8]]);
S("rebus_general_q8_400_p1", "blue", [["runner", 130, 122, 1.6]]);
S("rebus_general_q8_400_p2", "mint", [["sheep", 130, 122, 1.75]]);
S("rebus_general_q9_400_p1", "sand", [["horn", 130, 122, 1.8]]);
S("rebus_general_q9_400_p2", "lilac", [["jasmine", 130, 122, 1.7]]);
S("rebus_general_q10_400_p1", "green", [["hill", 130, 122, 1.7]]);
S("rebus_general_q10_400_p2", "yellow", [["winner", 130, 150, 1.35]]);
S("rebus_general_q11_400_p1", "yellow", [["wheat", 130, 122, 1.6]]);
S("rebus_general_q11_400_p2", "blue", [["can", 130, 122, 1.9]]);
S("rebus_general_q12_400_p1", "mint", [["sheep", 130, 122, 1.75]]);
S("rebus_general_q12_400_p2", "peach", [["henna", 130, 122, 1.55]]);
S("rebus_general_q13_600_p1", "pink", [["blood", 130, 122, 1.8]]);
S("rebus_general_q13_600_p2", "lilac", [["mother", 130, 130, 1.5]]);
S("rebus_general_q14_600_p1", "mint", [["tick", 130, 122, 1.75]]);
S("rebus_general_q14_600_p2", "pink", [["meltice", 130, 122, 1.65]]);
S("rebus_general_q15_600_p1", "blue", [["touch", 130, 122, 1.75]]);
S("rebus_general_q15_600_p2", "sand", [["grandpa", 130, 138, 1.4]]);
S("rebus_general_q16_600_p1", "sand", [["beans", 130, 122, 1.8]]);
S("rebus_general_q16_600_p2", "mint", [["dew", 130, 122, 1.7]]);
S("rebus_general_q16_600_p3", "blue", [["one", 130, 122, 1.8]]);
S("rebus_general_q17_600_p1", "peach", [["suitcase", 118, 142, 1.5], ["plane", 168, 62, 0.8, -10]]);
S("rebus_general_q17_600_p2", "blue", [["gel", 130, 122, 1.7]]);
S("rebus_general_q18_600_p1", "teal", [["wave", 130, 100, 2.2], ["ship", 130, 70, 0.9]]);
S("rebus_general_q18_600_p2", "yellow", [["yen", 130, 122, 1.8]]);
})(M8P);

return M8P;
})();
