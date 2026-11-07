/* ============================================================
   LIFE SIM · 主控
   ============================================================ */
window.M = window.M || {};
(function () {
  'use strict';
  var M = window.M;
  var UI = M.UI;

  var GAME = {
    sim: null,
    speed: 1,
    paused: false,
    over: false,
    rank: 'resident',
    category: 'random',
    doctor: 'Dr. 林',
    stats: { seen: 0, saved: 0, lost: 0, score: 0, best: 0 }
  };
  M.GAME = GAME;

  /* ---------- 医师战绩（本机保存；有账号时按账号保存） ---------- */
  var STATS_KEY = 'lifesim.stats.v1';
  function loadStats() {
    var d = { seen: 0, saved: 0, lost: 0, score: 0, best: 0 };
    try {
      var s = window.localStorage ? localStorage.getItem(STATS_KEY) : null;
      if (s) {
        var o = JSON.parse(s);
        for (var k in d) if (typeof o[k] === 'number' && isFinite(o[k])) d[k] = o[k];
      }
    } catch (e) { }
    return d;
  }
  function saveStats() {
    if (M.Account && M.Account.saveStats) { M.Account.saveStats(GAME.stats); return; }
    try { if (window.localStorage) localStorage.setItem(STATS_KEY, JSON.stringify(GAME.stats)); } catch (e) { }
  }
  GAME.stats = loadStats();
  GAME.loadStats = loadStats;
  GAME.saveStats = saveStats;

  /* ---------- 运行时错误可视化 ---------- */
  var lastFatalKey = '';
  function showFatal(title, detail) {
    var key = String(title) + '|' + String(detail);
    if (key === lastFatalKey) return;
    lastFatalKey = key;
    var html = '<b>⚠ ' + String(title) + '</b>' + String(detail);
    var box = document.getElementById('fatal');
    if (box) { box.classList.remove('hidden'); box.innerHTML = html; }
    var be = document.getElementById('bootError');
    if (be) { be.classList.remove('hidden'); be.innerHTML = html; }
    if (window.console && console.error) console.error(title, detail);
  }
  function errText(err) {
    if (!err) return '未知错误（无异常对象）';
    var msg = err.message ? String(err.message) : String(err);
    var st = err.stack ? String(err.stack) : '';
    var tail = '';
    if (st) {
      var lines = st.split('\n');
      for (var i = 1; i < lines.length && i < 4; i++) {
        var ln = lines[i].trim();
        if (!ln) continue;
        tail += '<br>' + ln.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      }
    }
    return msg + (tail ? '<span class="ft-stack">' + tail + '</span>' : '');
  }
  M.errText = errText;
  M.reportError = function (where, err) { showFatal('运行错误 · ' + where, errText(err)); };

  window.addEventListener('error', function (ev) {
    /* 资源加载失败（脚本 / 样式表缺失） */
    var t = ev.target;
    if (t && t !== window && t.tagName && (t.tagName === 'SCRIPT' || t.tagName === 'LINK')) {
      var src = t.src || t.href || '未知文件';
      var short = String(src).split(/[\\/]/).slice(-2).join('/');
      showFatal('资源加载失败', short + ' —— 请确认 js/ 与 css/ 下文件齐全');
      return;
    }
    var where = '';
    if (ev.filename) {
      where = String(ev.filename).split(/[\\/]/).pop() + ':' + (ev.lineno || '?') + (ev.colno ? ':' + ev.colno : '');
    }
    var body = (ev.error && ev.error.stack) ? errText(ev.error) : String(ev.message || '未知脚本错误');
    showFatal('运行错误' + (where ? ' · ' + where : ''), body);
  }, true);

  /* ---------- 数据完整性自检 ---------- */
  function selfCheck() {
    var p = [];
    if (!M.DRUGS || !M.DRUGS.length) p.push('药品库 data-drugs.js 未加载');
    else if (M.DRUGS.length < 20) p.push('药品库条目过少（' + M.DRUGS.length + '）');
    if (!M.DISEASES || M.DISEASES.length < 5) p.push('疾病库 data-diseases.js 未加载');
    if (!M.SURGERY_SITES || M.SURGERY_SITES.length < 5) p.push('手术库 data-surgery.js 未加载');
    if (!M.SURGERY_PROCS || M.SURGERY_PROCS.length < 5) p.push('术式表缺失');
    if (!M.GUIDES || M.GUIDES.length < 3) p.push('指南库 data-guide.js 未加载');
    if (!M.DOCTOR_RANKS || M.DOCTOR_RANKS.length < 3) p.push('职称表缺失');
    if (typeof M.tick !== 'function') p.push('生理引擎 engine.js 未加载');
    if (typeof M.drawWave !== 'function') p.push('波形模块 ecg.js 未加载');
    if (!M.UI || !M.UI.initWaves) p.push('界面模块 ui.js 未加载');
    return p;
  }

  /* ---------- 疾病选择（按接诊类型筛选） ---------- */
  function femaleOnly(name) { return /妊娠|子宫|卵巢|产后|子痫|胎盘|异位妊娠|附件/.test(name); }
  function maleOnly(name) { return /前列腺|睾丸/.test(name); }

  function pickDisease(sim, rank) {
    rank = rank || sim.rank || M.getRank('resident');
    var all = (M.DISEASES || []).slice();
    if (!all.length) return null;
    var pool;
    if (M.pickDiseasePool) pool = M.pickDiseasePool(GAME.category, rank, sim.patient);
    else {
      pool = all.filter(function (d) {
        var n = (d.name || '') + (d.site || '');
        if (sim.patient.sex === '男' && femaleOnly(n)) return false;
        if (sim.patient.sex === '女' && maleOnly(n)) return false;
        if ((d.triage || 3) < (rank.triageMin || 1)) return false;
        if (rank.id === 'intern' && d.triage >= 5) return false;
        return true;
      });
    }
    if (!pool.length) pool = all;
    /* 加权：中间紧急度更常见 */
    var weighted = [];
    pool.forEach(function (d) {
      var w = 3 - Math.abs((d.triage || 3) - 3);
      for (var i = 0; i < Math.max(1, w); i++) weighted.push(d);
    });
    return weighted[Math.floor(Math.random() * weighted.length)];
  }

  /* ---------- 启动 ---------- */
  function bootSim(defOverride, specialKind) {
    var sim = M.createSim({ doctor: GAME.doctor, rank: GAME.rank });
    /* 诊室模式：病人类型一律随机（不给玩家挑病例类型） */
    if (M.Clinic && M.Clinic.isOn && M.Clinic.isOn() && GAME.category !== 'random') GAME.category = 'random';
    /* 妇产类型只会有女性病例，避免抽出「男性异位妊娠」这种荒谬组合 */
    if (GAME.category === 'obstetric') sim.patient.sex = '女';
    var def = defOverride;
    if (specialKind && M.applySpecial) {
      M.applySpecial(sim, specialKind);          /* 新闻里的特殊事件病人 */
    } else {
      if (!def && M.Clinic && M.Clinic.nextDisease) def = M.Clinic.nextDisease();
      if (!def) def = pickDisease(sim, sim.rank);
      if (def) M.startDisease(sim, def);
    }
    GAME.sim = sim;
    GAME.over = false;
    /* 不计入统计的病人（如被击中数十枪的嫌犯）不进接诊人数 */
    var excl = !!(sim.special && sim.special.noStats);
    if (!excl) { GAME.stats.seen++; saveStats(); }
    else if (M.addRecord) M.addRecord(sim, '特殊记录：' + (sim.special.title || '') + '（不计入接诊与死亡率）');
    sim.speed = GAME.speed;
    UI.initWaves();
    UI.buildVitals();
    UI.renderDrugs();
    if (M.reset12Lead) M.reset12Lead();
    if (UI.resetSurgery) UI.resetSurgery();
    UI.showTab('guide');
    setSpeed(GAME.speed);
    return sim;
  }
  GAME.bootSim = bootSim;

  GAME.nextPatient = function (defOverride, specialKind) {
    try {
      var s = bootSim(defOverride, specialKind);
      var cat = M.categoryName ? M.categoryName(GAME.category) : GAME.category;
      if (!(M.Clinic && M.Clinic.isOn())) {
        if (s.special) UI.toast('warn', s.special.title, s.special.note || '');
        else UI.toast('warn', '新病人到达 · ' + cat, '主诉：' + (s.disease ? s.disease.def.name : '待查'));
      }
    } catch (err) {
      showFatal('接诊失败', (err && err.message ? err.message : String(err)));
      if (window.console && window.console.error) window.console.error(err);
    }
  };

  /* ---------- 速度 ---------- */
  function setSpeed(v) {
    GAME.speed = v;
    var seg = document.getElementById('speedSeg');
    Array.prototype.forEach.call(seg.children, function (b) {
      b.classList.toggle('on', parseInt(b.dataset.s, 10) === v);
    });
    if (GAME.sim) GAME.sim.speed = v;
  }
  GAME.setSpeed = setSpeed;

  /* ---------- 事件消费 ---------- */
  /* 结局弹窗优先级最高：先关掉当前任何弹窗/检索，避免「结算被吞掉」 */
  function openEndModal(sim, kind) {
    function show() {
      try {
        if (UI.closePalette) UI.closePalette();
        if (UI.isModalOpen()) UI.closeModal();
        if (kind === 'cure') UI.openCure(sim); else UI.openDeath(sim);
      } catch (err) { showFatal('结算界面', errText(err)); }
    }
    setTimeout(show, 400);
  }

  function consume(sim) {
    if (!sim.emit.length) return;
    var list = sim.emit.splice(0, sim.emit.length);
    list.forEach(function (e) {
      if (e.kind === 'toast') UI.toast(e.type, e.title, e.text);
      else if (e.kind === 'death') {
        GAME.over = true;
        var exclD = !!(sim.special && sim.special.noStats); if (exclD) { if (M.addRecord) M.addRecord(sim, '死亡：' + sim.special.title + '（不计入死亡率）'); } else { GAME.stats.lost++; saveStats(); }
        if (M.Audio) M.Audio.cue('death');
        openEndModal(sim, 'death');
      } else if (e.kind === 'cure') {
        GAME.over = true;
        var sc = M.finalScore(sim);
        GAME.stats.saved++;
        GAME.stats.score += sc;
        if (sc > GAME.stats.best) GAME.stats.best = sc;
        saveStats();
        if (M.Audio) M.Audio.cue('cure');
        openEndModal(sim, 'cure');
      } else if (e.kind === 'arrest') UI.toast('crit', '无生命体征', e.text);
      else if (e.kind === 'rosc') {
        UI.toast('good', '自主循环恢复', '继续稳定生命体征');
        if (M.Audio) M.Audio.cue('rosc');
      }
    });
  }

  /* ---------- 主循环 ---------- */
  var last = 0, errCount = 0;
  function loop(now) {
    if (!last) last = now;
    var dtReal = Math.min(0.06, (now - last) / 1000);
    last = now;
    var sim = GAME.sim;
    try {
      if (sim) {
        if (!sim.dead && GAME.speed > 0) M.tick(sim, dtReal * GAME.speed);
        consume(sim);
        UI.tick(sim, now);
        if (M.Audio) M.Audio.tick(sim, now);
      }
      errCount = 0;
    } catch (err) {
      errCount++;
      showFatal('运行错误 · 主循环', errText(err));
      if (errCount > 4) return; /* 连续报错则停下，避免刷屏 */
    }
    requestAnimationFrame(loop);
  }

  /* ---------- 初始化 ---------- */
  function initUI() {
    UI.initTabs();
    UI.initPalette();
    UI.initActions();
    if (UI.initAudio) UI.initAudio();
    /* 病人信息行内提示 */
    document.getElementById('btnHelp').addEventListener('click', function () { UI.openHelp(); });
    var probOpen = document.getElementById('probOpen');
    if (probOpen) probOpen.addEventListener('click', function () { if (GAME.sim) UI.openGuide(GAME.sim); });
    document.getElementById('btnRestart').addEventListener('click', function () {
      if (confirm('放弃当前病人并重新接诊？')) { if (M.Clinic && M.Clinic.isOn()) M.Clinic.abandon(); else GAME.nextPatient(); }
    });
    document.getElementById('speedSeg').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      setSpeed(parseInt(b.dataset.s, 10));
    });
    document.addEventListener('keydown', function (e) {
      var k = (e.key || '').toLowerCase();
      /* 全局检索：Ctrl/⌘ + K */
      if ((e.ctrlKey || e.metaKey) && k === 'k') { e.preventDefault(); UI.togglePalette(); return; }
      if (k === 'escape' && UI.isPaletteOpen()) { e.preventDefault(); UI.closePalette(); return; }
      if (UI.isPaletteOpen()) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (k === ' ') { e.preventDefault(); setSpeed(GAME.speed === 0 ? 1 : 0); }
      else if (k === '1') setSpeed(1);
      else if (k === '2') setSpeed(2);
      else if (k === '4') setSpeed(4);
      else if (k === '8') setSpeed(8);
      else if (k === 'g') { if (!UI.isModalOpen()) UI.openGuide(GAME.sim); }
      else if (k === 'e') { if (!UI.isModalOpen()) UI.openExam(GAME.sim); }
      else if (k === 's') { if (!UI.isModalOpen()) UI.openSurgery(GAME.sim); }
      else if (k === 't') { if (!UI.isModalOpen()) UI.openTransfuse(GAME.sim); }
      else if (k === 'c') { if (M.misclick) M.misclick(GAME.sim, 'cpr'); M.setCPR(GAME.sim, !GAME.sim.cpr); }
      else if (k === 'b') { if (!UI.isModalOpen()) UI.openBleed(GAME.sim); }
      else if (k === 'f') { if (M.misclick) M.misclick(GAME.sim, 'shock'); if (!UI.isModalOpen()) UI.openShock(GAME.sim); }
      else if (k === 'a') { if (M.misclick) M.misclick(GAME.sim, 'airway'); if (!UI.isModalOpen()) UI.openAirway(GAME.sim); }
      else if (k === '/') { e.preventDefault(); UI.showTab('drug'); var di = document.getElementById('drugSearch'); if (di) di.focus(); }
      else if (k === 'd') { UI.showTab('drug'); }
      else if (k === 'x') { UI.showTab('rx'); }
      else if (k === 'y') { UI.showTab('symptom'); }
      else if (k === 'r') { if (!UI.isModalOpen()) UI.openTrend(GAME.sim); }
      else if (k === 'escape') { if (UI.isModalOpen()) UI.closeModal(); }
    });
  }

  /* ---------- 启动流程 ---------- */
  function start() {
    var problems = selfCheck();
    if (problems.length) {
      showFatal('数据自检未通过', problems.join('<br>') + '<br><br>请确认 js/ 目录下所有文件都存在且未被破坏。');
      return;
    }
    try {
      document.getElementById('boot').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
      if (M.Audio) M.Audio.init();   /* 必须在用户点击的手势里初始化音频 */
      UI.initDrugBar();
      initUI();
      bootSim();
      if (M.Clinic && M.Clinic.beginDay) M.Clinic.beginDay();
      if (!last) requestAnimationFrame(loop);
      var d = GAME.sim.disease;
      UI.toast('warn', '接诊新病人', d ? ('初步主诉考虑：' + d.def.name) : '');
    } catch (err) {
      showFatal('启动失败', (err && err.message ? err.message : String(err)));
      if (window.console && console.error) console.error(err);
    }
  }

  var bootBound = false;
  function buildRankCards() {
    var box = document.getElementById('bootDiff');
    if (!box) return;
    var ranks = M.DOCTOR_RANKS || [];
    box.innerHTML = ranks.map(function (r, i) {
      return '<button class="rank-card' + (i === 1 ? ' on' : '') + '" data-v="' + r.id + '">' +
        '<b>' + r.name + '</b><span>' + r.desc + '</span></button>';
    }).join('');
    var btns = box.querySelectorAll('button');
    GAME.rank = ranks.length > 1 ? ranks[1].id : 'resident';
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () {
        GAME.rank = b.dataset.v;
        Array.prototype.forEach.call(btns, function (x) { x.classList.toggle('on', x === b); });
      });
    });
  }

  function buildCatCards() {
    var box = document.getElementById('bootCat');
    if (!box || !M.CASE_CATEGORIES) return;
    var cats = M.CASE_CATEGORIES;
    box.innerHTML = cats.map(function (c) {
      return '<button class="cat-card' + (c.id === GAME.category ? ' on' : '') + '" data-c="' + c.id + '" title="' + (c.desc || '') + '">' +
        '<b>' + c.name + '</b><span>' + (c.desc || '') + '</span></button>';
    }).join('');
    Array.prototype.forEach.call(box.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () {
        GAME.category = b.dataset.c;
        Array.prototype.forEach.call(box.querySelectorAll('button'), function (x) {
          x.classList.toggle('on', x === b);
        });
      });
    });
  }

  function bindBoot() {
    if (bootBound) return;
    bootBound = true;
    buildRankCards();
    buildCatCards();
    var startBtn = document.getElementById('bootStart');
    if (startBtn) startBtn.addEventListener('click', function () {
      var inp = document.getElementById('bootDoctor');
      GAME.doctor = ((inp && inp.value) || 'Dr. 林').trim().slice(0, 16) || 'Dr. 林';
      start();
    });
    var docInp = document.getElementById('bootDoctor');
    if (docInp) docInp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && startBtn) startBtn.click();
    });
    /* 演示 / 自动化：index.html#autostart 可直接接诊；可加 &cat=poison&rank=chief */
    if (window.location && String(location.hash).indexOf('autostart') >= 0) {
      var h = String(location.hash);
      var cm = h.match(/cat=([a-z_]+)/); if (cm) GAME.category = cm[1];
      var rm = h.match(/rank=([a-z]+)/); if (rm) GAME.rank = rm[1];
      setTimeout(function () { if (startBtn) startBtn.click(); }, 80);
      if (/surgtest=abort/.test(h)) setTimeout(function () {
        var sim = GAME.sim; if (!sim) return;
        M.startSurgery(sim, 'appendix', 'resection');
        M.cancelSurgery(sim);
        UI.openSurgery(sim);
      }, 600);
      var tm = h.match(/tab=([a-z]+)/);
      if (tm) setTimeout(function () { UI.showTab(tm[1]); }, 700);
      var om = h.match(/open=([a-z0-9]+)/);
      if (om) setTimeout(function () {
        var sim = GAME.sim; if (!sim) return;
        var p = om[1];
        if (p === 'exam') UI.openExam(sim);
        else if (p === 'surgery') UI.openSurgery(sim);
        else if (p === 'ecg') UI.open12Lead(sim);
        else if (p === 'guide') UI.openGuide(sim);
        else if (p === 'bleed') UI.openBleed(sim);
        else if (p === 'drug') UI.openDrug(sim, (h.match(/drug=([a-z0-9_]+)/) || [])[1] || 'epinephrine');
        var ck = h.match(/check=([a-z0-9_,]+)/);
        if (ck) ck[1].split(',').forEach(function (id) { M.orderExam(sim, id); });
      }, 500);
      /* 演示 / 自动化：warp=N 先把 N 秒病程「快进」出来，再截图或观察 */
      var wm = h.match(/warp=(\d+)/);
      if (wm) setTimeout(function () {
        var s = GAME.sim; if (!s) return;
        var sec = Math.min(120, parseInt(wm[1], 10) || 0);
        var base = Date.now();
        var n = Math.round(sec / 0.05);
        for (var i = 0; i < n; i++) {
          if (s.dead) break;
          M.tick(s, 0.05);
          UI.tick(s, base + i * 60);
        }
        UI.drawWaves(s);
      }, 900);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindBoot);
  else bindBoot();

})();