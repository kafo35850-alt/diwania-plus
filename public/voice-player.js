/* Game narration uses bundled clips, or the owner's recordings when available. */
(function () {
  'use strict';
  var content = window.__DW_CONTENT || {};
  var spoken = /[\p{L}\p{N}]/u;
  var tokens = content.voiceTokens || {};
  var compiled = (content.voice || []).filter(function (line) {
    return line && line.text && Array.isArray(line.parts);
  }).map(function (line) {
    var segments = normalize(line.text).split('{}');
    return {
      segments: segments,
      pattern: new RegExp('^' + segments.map(escapePattern).join('(.*?)') + '$'),
      parts: line.parts
    };
  }).sort(function (a, b) {
    function weight(line) { return line.segments.join('').length; }
    return weight(b) - weight(a);
  });

  var context, source, element, release, volume = 1, sequence = 0;
  var buffers = new Map();

  function normalize(text) { return String(text || '').replace(/\s+/g, ' ').trim(); }
  function escapePattern(text) { return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function unlock(existingContext) {
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (existingContext) context = existingContext;
      else if (!context && compiled.length && AudioContext) context = new AudioContext();
      if (context && context.state !== 'running') context.resume().catch(function () {});
    } catch (e) {}
  }

  function stop() {
    sequence++;
    if (source) {
      source.onended = null;
      try { source.stop(); } catch (e) {}
      source = null;
    }
    if (element) {
      element.onended = element.onerror = null;
      element.pause();
    }
    if (release) { release(); release = null; }
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
  }

  function deviceVoice() {
    try {
      var arabic = window.speechSynthesis.getVoices().filter(function (v) { return /^ar/i.test(v.lang); });
      return arabic.find(function (v) { return /premium|enhanced|neural|natural/i.test(v.name); }) ||
        arabic.find(function (v) { return /^ar[-_]SA/i.test(v.lang); }) || arabic[0];
    } catch (e) { return null; }
  }

  function sayText(text, run, done) {
    if (!window.speechSynthesis || !spoken.test(text)) { done(); return; }
    var timer, ended = false;
    function finish() {
      if (ended) return;
      ended = true;
      clearTimeout(timer);
      done();
    }
    try {
      var utterance = new SpeechSynthesisUtterance(text);
      var voice = deviceVoice();
      if (voice) utterance.voice = voice;
      utterance.lang = voice ? voice.lang : 'ar-SA';
      utterance.rate = 1;
      utterance.volume = volume;
      utterance.onend = utterance.onerror = finish;
      timer = setTimeout(function () {
        if (ended || run !== sequence) return;
        try { window.speechSynthesis.cancel(); } catch (e) {}
        finish();
      }, 900 + text.length * 250);
      window.speechSynthesis.speak(utterance);
    } catch (e) { finish(); }
  }

  function buffered(url) {
    if (!buffers.has(url)) {
      if (buffers.size >= 32) buffers.delete(buffers.keys().next().value);
      var audioContext = context;
      buffers.set(url, fetch(url).then(function (res) {
        if (!res.ok) throw new Error('Audio unavailable');
        return res.arrayBuffer();
      }).then(function (bytes) {
        return new Promise(function (resolve, reject) { audioContext.decodeAudioData(bytes, resolve, reject); });
      }).catch(function (error) {
        buffers.delete(url);
        throw error;
      }));
    }
    return buffers.get(url);
  }

  function playUrl(url, run, done, fail) {
    function playElement() {
      if (run !== sequence) return;
      if (!element) element = new Audio();
      element.src = url;
      element.volume = volume;
      var ended = false;
      function finish(callback) {
        if (ended || run !== sequence) return;
        ended = true;
        element.onerror = element.onended = null;
        callback();
      }
      element.onended = function () { finish(done); };
      element.onerror = function () { finish(fail); };
      var playing = element.play();
      if (playing && playing.catch) playing.catch(function () { finish(fail); });
    }
    if (!context || context.state !== 'running') { playElement(); return; }
    buffered(url).then(function (buffer) {
      if (run !== sequence) return;
      source = context.createBufferSource();
      var gain = context.createGain();
      gain.gain.value = volume;
      source.buffer = buffer;
      source.connect(gain);
      gain.connect(context.destination);
      source.onended = function () {
        source = null;
        if (run === sequence) done();
      };
      source.start();
    }).catch(playElement);
  }

  function tokenKey(text) {
    return text.trim().normalize('NFKD').toUpperCase()
      .replace(/[\p{M}]/gu, '').replace(/[أإآٱ]/g, 'ا')
      .replace(/[٠-٩۰-۹]/g, function (digit) { return String(digit.charCodeAt(0) & 15); });
  }

  // Returns false for text without a matched clip so the original game can read it.
  function play(text, options) {
    var value = normalize(text);
    var index = compiled.findIndex(function (line) { return line.pattern.test(value); });
    if (index < 0) { stop(); return false; }
    var line = compiled[index];
    var captures = line.pattern.exec(value);
    var steps = [], part = 0;
    line.segments.forEach(function (segment, i) {
      if (spoken.test(segment)) steps.push({ url: line.parts[part++], say: segment });
      var field = captures[i + 1];
      if (!field || !spoken.test(field)) return;
      var key = tokenKey(field);
      var clip = tokens[key];
      if (clip) steps.push({ url: clip, say: field });
      else if (/^[0-9]{4}$/.test(key)) {
        Array.from(key).forEach(function (digit) { steps.push({ url: tokens[digit], say: digit }); });
      } else steps.push({ say: field });
    });
    if (!steps.length) return false;
    stop();
    options = options || {};
    volume = Math.max(0, Math.min(1, options.volume == null ? 1 : options.volume));
    if (options.duck) {
      options.duck(true);
      release = function () { options.duck(false); };
    }
    var run = sequence, cursor = 0;
    function next() {
      if (run !== sequence) return;
      if (cursor === steps.length) {
        if (release) { release(); release = null; }
        return;
      }
      var step = steps[cursor++];
      if (step.url) playUrl(step.url, run, next, function () { sayText(step.say, run, next); });
      else sayText(step.say, run, next);
    }
    next();
    return true;
  }

  var effects = {
    fanfare: 'win', win: 'win', correct: 'win', double_surprise: 'win', gift_open: 'win',
    alarm: 'warning', bomb: 'warning', evil: 'warning', wrong: 'warning', deduct_surprise: 'warning', mine_open: 'warning',
    gong: 'round', bell: 'round', gavel: 'vote', buzz: 'vote'
  };
  function effect(name, ctx, output, at) {
    var kind = effects[name];
    if (!kind) return false;
    function tone(freq, end, offset, length, level, shape) {
      var time = at + offset;
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = shape;
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(end, time + length);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(level, time + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
      osc.connect(gain);
      gain.connect(output);
      osc.start(time);
      osc.stop(time + length);
    }
    if (kind === 'win') {
      [392, 493.88, 587.33, 783.99].forEach(function (note, i) {
        tone(note, note, i * 0.085, 0.27, 0.08, 'triangle');
        tone(note * 2, note * 2, i * 0.085, 0.23, 0.026, 'sine');
      });
      tone(100, 59, 0.25, 0.23, 0.11, 'sine');
    } else if (kind === 'warning') {
      tone(135, 50, 0, 0.5, 0.13, 'sine');
      tone(341, 185, 0.055, 0.37, 0.055, 'triangle');
    } else if (kind === 'vote') {
      tone(128, 58, 0, 0.22, 0.17, 'sine');
      tone(740, 380, 0, 0.13, 0.05, 'triangle');
    } else {
      tone(125, 67, 0, 0.38, 0.09, 'sine');
      tone(440, 440, 0.06, 0.34, 0.08, 'triangle');
      tone(659, 659, 0.12, 0.33, 0.06, 'sine');
    }
    return true;
  }

  window.__dwVoice = { play: play, stop: stop, unlock: unlock, effect: effect, count: compiled.length };
  if (compiled.length) {
    document.addEventListener('pointerup', function () { unlock(); }, { capture: true, once: true });
    document.addEventListener('keydown', function () { unlock(); }, { capture: true, once: true });
  }
  window.addEventListener('pagehide', stop);
  window.addEventListener('message', function (event) {
    if (event.source === window.parent && event.origin === window.location.origin &&
      event.data?.type === 'DW_AUDIO_SYNC' && event.data.voiceOn === false) stop();
  });
})();
