/* qr.js */
/* M8QR — compact ISO 18004 QR encoder (byte mode, ECC L/M/Q/H, versions 1-20). */
(function (g) {
  'use strict';
  var ECC_PER_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28]
  ];
  var NUM_BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25]
  ];
  var ECL_INDEX = { L: 0, M: 1, Q: 2, H: 3 };
  var FORMAT_BITS = [1, 0, 3, 2];

  function rawModules(ver) {
    var r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      var na = Math.floor(ver / 7) + 2;
      r -= (25 * na - 10) * na - 55;
      if (ver >= 7) r -= 36;
    }
    return r;
  }
  function dataCodewords(ver, e) {
    return Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[e][ver] * NUM_BLOCKS[e][ver];
  }
  function gfMul(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; }
    return z & 0xFF;
  }
  function rsDivisor(deg) {
    var res = []; for (var i = 0; i < deg - 1; i++) res.push(0); res.push(1);
    var root = 1;
    for (var i2 = 0; i2 < deg; i2++) {
      for (var j = 0; j < deg; j++) {
        res[j] = gfMul(res[j], root);
        if (j + 1 < deg) res[j] ^= res[j + 1];
      }
      root = gfMul(root, 0x02);
    }
    return res;
  }
  function rsRemainder(data, div) {
    var res = div.map(function () { return 0; });
    data.forEach(function (b) {
      var f = b ^ res.shift(); res.push(0);
      div.forEach(function (c, i) { res[i] ^= gfMul(c, f); });
    });
    return res;
  }
  function utf8(str) {
    if (typeof TextEncoder !== 'undefined') return Array.prototype.slice.call(new TextEncoder().encode(str));
    var s = unescape(encodeURIComponent(str)), out = [];
    for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
    return out;
  }
  function alignPositions(ver, size) {
    if (ver === 1) return [];
    var n = Math.floor(ver / 7) + 2;
    var step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
    var r = [6];
    for (var pos = size - 7; r.length < n; pos -= step) r.splice(1, 0, pos);
    return r;
  }

  function encode(text, eccName) {
    var e = ECL_INDEX[eccName || 'M'];
    var bytes = utf8(text);
    var ver, capBits;
    for (ver = 1; ver <= 20; ver++) {
      capBits = dataCodewords(ver, e) * 8;
      var need = 4 + (ver <= 9 ? 8 : 16) + bytes.length * 8;
      if (need <= capBits) break;
    }
    if (ver > 20) throw new Error('QR: text too long');
    var bits = [];
    function put(v, n) { for (var i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); }
    put(4, 4); put(bytes.length, ver <= 9 ? 8 : 16);
    bytes.forEach(function (b) { put(b, 8); });
    put(0, Math.min(4, capBits - bits.length));
    put(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xEC; bits.length < capBits; pad ^= 0xEC ^ 0x11) put(pad, 8);
    var data = [];
    for (var i = 0; i < bits.length; i += 8) {
      var v = 0; for (var j = 0; j < 8; j++) v = (v << 1) | bits[i + j]; data.push(v);
    }
    // ECC + interleave
    var nb = NUM_BLOCKS[e][ver], eccLen = ECC_PER_BLOCK[e][ver];
    var raw = Math.floor(rawModules(ver) / 8);
    var nShort = nb - raw % nb, shortLen = Math.floor(raw / nb);
    var blocks = [], div = rsDivisor(eccLen);
    for (var bi = 0, k = 0; bi < nb; bi++) {
      var dat = data.slice(k, k + shortLen - eccLen + (bi < nShort ? 0 : 1));
      k += dat.length;
      var ecc = rsRemainder(dat, div);
      if (bi < nShort) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    var all = [];
    for (var ii = 0; ii < blocks[0].length; ii++) {
      for (var jj = 0; jj < blocks.length; jj++) {
        if (ii !== shortLen - eccLen || jj >= nShort) all.push(blocks[jj][ii]);
      }
    }
    // matrix
    var size = ver * 4 + 17;
    var mod = [], fn = [];
    for (var y = 0; y < size; y++) { mod.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    function setFn(x, y, d) { mod[y][x] = d; fn[y][x] = true; }
    function bit(x, i) { return ((x >>> i) & 1) !== 0; }
    for (var t = 0; t < size; t++) { setFn(6, t, t % 2 === 0); setFn(t, 6, t % 2 === 0); }
    function finder(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var d = Math.max(Math.abs(dx), Math.abs(dy)), xx = cx + dx, yy = cy + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) setFn(xx, yy, d !== 2 && d !== 4);
      }
    }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    var ap = alignPositions(ver, size), na = ap.length;
    for (var a = 0; a < na; a++) for (var b = 0; b < na; b++) {
      if ((a === 0 && b === 0) || (a === 0 && b === na - 1) || (a === na - 1 && b === 0)) continue;
      for (var dy2 = -2; dy2 <= 2; dy2++) for (var dx2 = -2; dx2 <= 2; dx2++)
        setFn(ap[a] + dx2, ap[b] + dy2, Math.max(Math.abs(dx2), Math.abs(dy2)) !== 1);
    }
    function drawFormat(mask) {
      var d = (FORMAT_BITS[e] << 3) | mask, rem = d;
      for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var bs = ((d << 10) | rem) ^ 0x5412;
      for (var i1 = 0; i1 <= 5; i1++) setFn(8, i1, bit(bs, i1));
      setFn(8, 7, bit(bs, 6)); setFn(8, 8, bit(bs, 7)); setFn(7, 8, bit(bs, 8));
      for (var i2 = 9; i2 < 15; i2++) setFn(14 - i2, 8, bit(bs, i2));
      for (var i3 = 0; i3 < 8; i3++) setFn(size - 1 - i3, 8, bit(bs, i3));
      for (var i4 = 8; i4 < 15; i4++) setFn(8, size - 15 + i4, bit(bs, i4));
      setFn(8, size - 8, true);
    }
    drawFormat(0);
    if (ver >= 7) {
      var rem = ver;
      for (var q = 0; q < 12; q++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      var vb = (ver << 12) | rem;
      for (var q2 = 0; q2 < 18; q2++) {
        var c = bit(vb, q2), aa = size - 11 + q2 % 3, bb = Math.floor(q2 / 3);
        setFn(aa, bb, c); setFn(bb, aa, c);
      }
    }
    // codewords
    var idx = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        for (var jx = 0; jx < 2; jx++) {
          var x = right - jx, upward = ((right + 1) & 2) === 0, yy2 = upward ? size - 1 - vert : vert;
          if (!fn[yy2][x] && idx < all.length * 8) { mod[yy2][x] = bit(all[idx >>> 3], 7 - (idx & 7)); idx++; }
        }
      }
    }
    function applyMask(m) {
      for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
        var inv;
        switch (m) {
          case 0: inv = (x + y) % 2 === 0; break;
          case 1: inv = y % 2 === 0; break;
          case 2: inv = x % 3 === 0; break;
          case 3: inv = (x + y) % 3 === 0; break;
          case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: inv = x * y % 2 + x * y % 3 === 0; break;
          case 6: inv = (x * y % 2 + x * y % 3) % 2 === 0; break;
          default: inv = ((x + y) % 2 + x * y % 3) % 2 === 0;
        }
        if (!fn[y][x] && inv) mod[y][x] = !mod[y][x];
      }
    }
    function penalty() {
      var res = 0, x, y, i, run, color;
      var P1 = [true, false, true, true, true, false, true, false, false, false, false];
      var P2 = [false, false, false, false, true, false, true, true, true, false, true];
      function lines(get) {
        for (var a = 0; a < size; a++) {
          run = 1; color = get(a, 0);
          for (var b = 1; b < size; b++) {
            var cur = get(a, b);
            if (cur === color) { run++; if (run === 5) res += 3; else if (run > 5) res++; }
            else { color = cur; run = 1; }
          }
          for (var s = 0; s + 11 <= size; s++) {
            var m1 = true, m2 = true;
            for (var k = 0; k < 11; k++) {
              var v = get(a, s + k);
              if (v !== P1[k]) m1 = false;
              if (v !== P2[k]) m2 = false;
              if (!m1 && !m2) break;
            }
            if (m1) res += 40; if (m2) res += 40;
          }
        }
      }
      lines(function (a, b) { return mod[a][b]; });
      lines(function (a, b) { return mod[b][a]; });
      for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) {
        var c0 = mod[y][x];
        if (c0 === mod[y][x + 1] && c0 === mod[y + 1][x] && c0 === mod[y + 1][x + 1]) res += 3;
      }
      var dark = 0; for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (mod[y][x]) dark++;
      var total = size * size, kk = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
      res += kk * 10;
      return res;
    }
    var best = -1, bestPen = Infinity;
    for (var m = 0; m < 8; m++) {
      applyMask(m); drawFormat(m);
      var p = penalty();
      if (p < bestPen) { bestPen = p; best = m; }
      applyMask(m);
    }
    applyMask(best); drawFormat(best);
    return { version: ver, size: size, mask: best, modules: mod };
  }

  function toSvg(text, opts) {
    opts = opts || {};
    var qr = encode(text, opts.ecc || 'M'), border = opts.border == null ? 4 : opts.border;
    var fg = opts.fg || '#000', bg = opts.bg || '#fff', n = qr.size + border * 2, d = [];
    for (var y = 0; y < qr.size; y++) {
      var x = 0;
      while (x < qr.size) {
        if (qr.modules[y][x]) {
          var x0 = x; while (x < qr.size && qr.modules[y][x]) x++;
          d.push('M' + (x0 + border) + ',' + (y + border) + 'h' + (x - x0) + 'v1h-' + (x - x0) + 'z');
        } else x++;
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges">' +
      '<rect width="' + n + '" height="' + n + '" fill="' + bg + '"/><path d="' + d.join('') + '" fill="' + fg + '"/></svg>';
  }
  function toDataUrl(text, opts) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(toSvg(text, opts));
  }
  g.M8QR = { encode: encode, toSvg: toSvg, toDataUrl: toDataUrl };
  if (typeof module !== 'undefined' && module.exports) module.exports = g.M8QR;
})(typeof window !== 'undefined' ? window : globalThis);
