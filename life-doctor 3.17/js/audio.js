/* ============================================================
   LIFE SIM · 音效层
   监护仪心搏提示音 / 各类报警（SpO₂、心率、血压、室颤、心脏停搏、PEA）
   全部用 Web Audio 实时合成，不依赖任何音频文件，可离线运行。
   ============================================================ */
window.M = window.M || {};
(function () {
  'use strict';
  var M = window.M;
  var KEY = 'lifesim.volume.v1';

  var ctx = null, master = null, comp = null;
  var vol = 45;          /* 0-100 */
  var muted = false;
  var started = false;
  var lastQRS = -1, lastAlarm = 0, lastKind = '', lastShockFx = -1;
  var alarmT = 0;

  function loadPref() {
    try {
      var s = window.localStorage && localStorage.getItem(KEY);
      if (s) {
        var o = JSON.parse(s);
        if (typeof o.vol === 'number') vol = Math.max(0, Math.min(100, o.vol));
        if (typeof o.muted === 'boolean') muted = o.muted;
      }
    } catch (e) { }
  }
  function savePref() {
    try { if (window.localStorage) localStorage.setItem(KEY, JSON.stringify({ vol: vol, muted: muted })); } catch (e) { }
  }
  loadPref();

  var Audio_ = {
    get volume() { return vol; },
    get muted() { return muted; },
    get ready() { return !!ctx && started; }
  };

  /* 在用户第一次点击「开始接诊」时调用：浏览器要求手势后才能出声 */
  Audio_.init = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
      comp = ctx.createDynamicsCompressor ? ctx.createDynamicsCompressor() : null;
      master = ctx.createGain();
      applyGain();
      if (comp) { master.connect(comp); comp.connect(ctx.destination); }
      else master.connect(ctx.destination);
      started = true;
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { ctx = null; }
  };

  function applyGain() {
    if (!master) return;
    var g = muted ? 0 : Math.pow(vol / 100, 1.6) * 0.5;
    master.gain.value = g;
  }

  Audio_.setVolume = function (v) {
    vol = Math.max(0, Math.min(100, Math.round(v)));
    if (vol > 0) muted = false;
    applyGain(); savePref(); syncUI();
  };
  Audio_.toggleMute = function (force) {
    muted = (force === undefined) ? !muted : !!force;
    if (!muted && vol === 0) vol = 45;   /* 静音后从 0 恢复时给一个可听见的默认音量 */
    applyGain(); savePref(); syncUI();
    return muted;
  };

  function syncUI() {
    var r = document.getElementById('volRange');
    if (r && parseInt(r.value, 10) !== vol) r.value = vol;
    var b = document.getElementById('btnMute');
    if (b) {
      b.textContent = muted || vol === 0 ? '🔇' : (vol < 35 ? '🔉' : '🔊');
      b.classList.toggle('muted', muted || vol === 0);
    }
  }
  Audio_.syncUI = syncUI;

  /* ---------- 合成基础 ---------- */
  function tone(freq, dur, at, type, gain, slideTo) {
    if (!ctx || !master) return;
    var t0 = ctx.currentTime + (at || 0);
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    var peak = gain === undefined ? 0.25 : gain;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  function noiseBurst(dur, at, gain, hp) {
    if (!ctx || !master) return;
    var t0 = ctx.currentTime + (at || 0);
    var n = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.2);
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var g = ctx.createGain(); g.gain.value = gain === undefined ? 0.3 : gain;
    var f = ctx.createBiquadFilter ? ctx.createBiquadFilter() : null;
    if (f) { f.type = 'highpass'; f.frequency.value = hp || 700; src.connect(f); f.connect(g); }
    else src.connect(g);
    g.connect(master);
    src.start(t0);
  }

  /* ---------- 各种提示音 ---------- */
  function qrsBeep(hr) {
    /* 心率越快音调略高，模拟真实监护仪 */
    var f = 780 + Math.max(0, Math.min(60, hr - 60)) * 2.2;
    tone(f, 0.055, 0, 'sine', 0.22);
  }
  var PAT = {
    spo2: function () { tone(660, 0.075, 0, 'square', 0.10); tone(660, 0.075, 0.13, 'square', 0.10); tone(880, 0.10, 0.26, 'square', 0.10); },
    spo2crit: function () { tone(880, 0.07, 0, 'square', 0.13); tone(880, 0.07, 0.11, 'square', 0.13); tone(880, 0.07, 0.22, 'square', 0.13); },
    hr: function () { tone(520, 0.09, 0, 'square', 0.10); tone(520, 0.09, 0.16, 'square', 0.10); },
    bp: function () { tone(392, 0.16, 0, 'sine', 0.13); tone(330, 0.20, 0.2, 'sine', 0.12); },
    vf: function () { tone(940, 0.08, 0, 'sawtooth', 0.12); tone(660, 0.08, 0.1, 'sawtooth', 0.12); tone(940, 0.08, 0.2, 'sawtooth', 0.12); },
    asystole: function () { tone(1046, 0.42, 0, 'square', 0.09); tone(1046, 0.42, 0.55, 'square', 0.09); },
    pea: function () { tone(784, 0.10, 0, 'triangle', 0.11); tone(784, 0.10, 0.16, 'triangle', 0.11); tone(988, 0.14, 0.36, 'triangle', 0.11); },
    cure: function () { tone(523, 0.12, 0, 'sine', 0.2); tone(659, 0.12, 0.12, 'sine', 0.2); tone(784, 0.12, 0.24, 'sine', 0.2); tone(1046, 0.3, 0.36, 'sine', 0.2); },
    death: function () { tone(440, 0.5, 0, 'sine', 0.18, 220); tone(220, 0.9, 0.45, 'sine', 0.16, 110); },
    zap: function () { noiseBurst(0.18, 0, 0.35, 500); tone(120, 0.12, 0, 'square', 0.1, 60); },
    rosc: function () { tone(660, 0.1, 0, 'sine', 0.18); tone(990, 0.18, 0.1, 'sine', 0.18); }
  };

  function alarmKind(sim) {
    if (!sim || sim.dead) return '';
    var v = sim.v || {};
    var r = sim.rhythm;
    if (r === 'vf' || r === 'torsades') return 'vf';
    if (r === 'asystole') return 'asystole';
    if (r === 'pea') return 'pea';
    if (!v.pulseOK) return 'asystole';
    if (v.spo2 < 85) return 'spo2crit';
    if (v.spo2 < 90) return 'spo2';
    if (v.hr < 50 || v.hr > 130) return 'hr';
    if (v.sbp < 90) return 'bp';
    return '';
  }
  var INTERVAL = { vf: 1.0, asystole: 1.6, pea: 2.4, spo2crit: 1.6, spo2: 3.0, hr: 4.0, bp: 6.0 };

  /* 每帧调用 */
  Audio_.tick = function (sim, nowMs) {
    if (!ctx || !started || !sim) return;
    if (ctx.state === 'suspended') { ctx.resume(); }

    /* 除颤放电音 */
    if (sim.shockFx !== undefined && sim.shockFx >= 0 && sim.shockFx !== lastShockFx) {
      lastShockFx = sim.shockFx;
      PAT.zap();
    }

    /* 心搏提示音（只有真正有脉搏时才「嘀」） */
    if (!muted && sim.v && sim.v.pulseOK && !sim.dead) {
      var hr = M.clamp(sim.v.hr || 76, 24, 220);
      if (lastQRS < 0) lastQRS = sim.t;
      var iv = 60 / hr;
      if (sim.t - lastQRS >= iv) {
        lastQRS = sim.t - ((sim.t - lastQRS) % iv);
        qrsBeep(hr);
      }
    } else {
      lastQRS = sim.t;
    }

    /* 报警 */
    if (muted || sim.dead) { lastKind = ''; return; }
    var kind = alarmKind(sim);
    if (!kind) { lastKind = ''; return; }
    if (kind !== lastKind) { alarmT = 0; lastKind = kind; }
    var now = (nowMs || 0) / 1000;
    if (now - alarmT >= 0) {
      alarmT = now + (INTERVAL[kind] || 3);
      if (PAT[kind]) PAT[kind]();
    }
  };

  Audio_.cue = function (name) {
    if (!ctx || !started || muted) return;
    if (PAT[name]) PAT[name]();
  };

  M.Audio = Audio_;
})();
