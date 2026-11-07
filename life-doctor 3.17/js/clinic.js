/* ============================================================
   LIFE SIM · 诊室模式
   白班 48 分钟 / 夜班 48 分钟；接诊 → 治疗 → 休息 2–8 分钟 → 下一位
   药品 + 手术耗材库存 / 每日经费 / 采购配送（医誉折扣与优先配送）
   ============================================================ */
window.M = window.M || {};
(function () {
  'use strict';
  var M = window.M;
  if (!M || !M.GAME) return;
  var UI = M.UI, GAME = M.GAME, CFG = M.CLINIC_CFG;
  var C = {};
  M.Clinic = C;

  function el(id) { return document.getElementById(id); }
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function fmt(s) {
    s = Math.max(0, Math.floor(s));
    var m = Math.floor(s / 60), ss = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss;
  }
  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var S = {
    started: false, day: 1, night: false,
    timeLeft: CFG.daySeconds, budget: CFG.budget,
    stock: {}, queue: [], active: false, sim: null,
    seen: 0, saved: 0, lost: 0, spent: 0, repGain: 0,
    excluded: 0, records: [], news: [], specialNext: null,
    restLeft: 0, restTotal: 0, endedAt: 0,
    deliveries: [], pendingEnd: false, ended: false,
    pharmOpen: false, pharmQuery: '', pharmFilter: 'all',
    lastTick: 0, lastBar: '', saveAt: 0
  };
  C.state = S;
  C.isOn = function () { return S.started && !S.ended; };

  function shiftSeconds() { return S.night ? (CFG.nightSeconds || CFG.daySeconds) : CFG.daySeconds; }
  /* 病人类别一律随机：诊室模式不再让玩家挑病例类型 */
  function queueCategory() { return 'random'; }

  /* ================= 存档 ================= */
  function restoreSnapshot(s) {
    if (!s) return false;
    S.day = Math.max(1, parseInt(s.day, 10) || 1);
    S.night = !!s.night;
    S.timeLeft = clamp(+s.timeLeft || shiftSeconds(), 0, shiftSeconds());
    S.budget = Math.max(0, Math.round(+s.budget || 0)) || CFG.budget;
    var base = M.initialStock();
    if (s.stock && typeof s.stock === 'object') {
      for (var id in base) if (typeof s.stock[id] === 'number') base[id] = Math.max(0, s.stock[id]);
    }
    S.stock = base;
    S.deliveries = (s.deliveries || []).filter(function (d) {
      return d && d.id && (M.CONSUMABLE_BY_ID[d.id] || M.getDrug(d.id));
    }).map(function (d) {
      return { id: d.id, qty: Math.max(1, d.qty | 0), left: Math.max(1, +d.left || 1), total: Math.max(1, +d.total || 1), name: d.name || d.id };
    });
    S.seen = s.seen | 0; S.saved = s.saved | 0; S.lost = s.lost | 0; S.spent = s.spent | 0;
    S.transferred = s.transferred | 0;
    S.excluded = s.excluded | 0;
    S.records = Array.isArray(s.records) ? s.records.slice(0, 40) : [];
    S.news = Array.isArray(s.news) ? s.news.slice(0, 40) : [];
    S.specialNext = s.specialNext && M.SPECIAL_PATIENTS && M.SPECIAL_PATIENTS[s.specialNext] ? s.specialNext : null;
    S.repGain = 0;
    S.queue = makeQueue(queueSize());
    /* 恢复上次没看完的那位病人 */
    if (s.sim && M.restoreSim) {
      try {
        var rs = M.restoreSim(s.sim);
        if (rs) { GAME.sim = rs; S.sim = rs; S.active = true; }
      } catch (e) { }
    }
    return true;
  }

  C.snapshot = function () {
    if (!S.started) return null;
    var o = {
      day: S.day, night: S.night, timeLeft: Math.round(S.timeLeft),
      budget: Math.round(S.budget), stock: S.stock,
      deliveries: S.deliveries.map(function (d) {
        return { id: d.id, qty: d.qty, left: Math.round(d.left), total: Math.round(d.total), name: d.name };
      }),
      seen: S.seen, saved: S.saved, lost: S.lost, spent: S.spent,
      transferred: S.transferred || 0, ended: S.ended,
      excluded: S.excluded || 0, records: (S.records || []).slice(0, 40),
      news: (S.news || []).slice(0, 20), specialNext: S.specialNext || null,
      sim: (S.active && M.snapshotSim && (S.sim || GAME.sim)) ? M.snapshotSim(S.sim || GAME.sim) : null
    };
    return o;
  };
  C.saveNow = function () {
    if (!S.started || !M.Account || !M.Account.saveProgress) return;
    M.Account.saveProgress(C.snapshot());
  };
  C.reloadProgress = function () { /* 切换账号后，由下一次 beginDay 读取该账号的存档 */ };

  /* ================= 启动 / 天循环 ================= */
  C.beginDay = function () {
    if (S.started) return;
    S.started = true;
    var snap = (M.Account && M.Account.loadProgress) ? M.Account.loadProgress(48) : null;
    if (snap && !snap.ended) {
      restoreSnapshot(snap);
      UI.toast('good', '继续上次门诊', '第 ' + S.day + ' 天 · ' + (S.night ? '夜班' : '白班') +
        ' · 剩余 ' + fmt(S.timeLeft) + ' · 经费 ¥' + S.budget);
    } else if (!restoreSnapshot(null)) {
      S.day = 1; S.night = false;
      S.timeLeft = CFG.daySeconds;
      S.budget = CFG.budget;
      S.stock = M.initialStock();
      S.queue = makeQueue(queueSize());
      S.deliveries = [];
      S.seen = 0; S.saved = 0; S.lost = 0; S.spent = 0; S.repGain = 0;
      S.transferred = 0;
    }
    GAME.category = 'random';
    S.active = !!GAME.sim;
    S.sim = GAME.sim;
    S.restLeft = 0; S.restTotal = 0;
    S.ended = false; S.pendingEnd = false; S.endedAt = 0;
    S.lastTick = performance.now ? performance.now() : Date.now();
    S.saveAt = Date.now();
    if (S.active) {
      S.seen = Math.max(1, S.seen);
      GAME.over = false;
      /* 恢复的病人要把整套界面重建成「正在接诊」的状态 */
      try {
        UI.initWaves(); UI.buildVitals(); UI.renderDrugs();
        if (M.reset12Lead) M.reset12Lead();
        if (UI.resetSurgery) UI.resetSurgery();
        UI.showTab('guide');
        if (GAME.setSpeed) GAME.setSpeed(GAME.speed || 1);
      } catch (e) { }
      UI.toast('good', '继续上次接诊', (GAME.sim && GAME.sim.disease ? GAME.sim.disease.def.name : '上次未结束的病人') +
        '　病程 ' + M.fmtT(GAME.sim.t));
    }
    var bar = el('clinicBar');
    if (bar) bar.classList.remove('hidden');
    document.body.classList.add('clinic-mode');
    document.body.classList.toggle('night-shift', S.night);
    renderBar(true);
    if (UI.renderDrugs) UI.renderDrugs();
    M.log(GAME.sim, 'info', '【诊室模式】第 ' + S.day + ' 天 · ' + (S.night ? '夜班' : '白班') +
      '开始，经费 ¥' + S.budget + '。');
    C.saveNow();
  };

  function queueSize() { return S.night ? 4 : 10; }
  function makeQueue(n) {
    n = n || queueSize();
    if (M.makeShiftQueue) {
      return M.makeShiftQueue(n, S.night, queueCategory(), M.getRank(GAME.rank), null);
    }
    var out = [], seen = {}, guard = 0;
    while (out.length < n && guard++ < 200) {
      var d = M.pickDiseasePool(queueCategory(), M.getRank(GAME.rank), null)[0];
      if (!d || seen[d.id]) continue;
      seen[d.id] = 1;
      out.push(d);
    }
    return out;
  }
  C.makeQueue = makeQueue;

  function startNext() {
    if (!S.started || S.ended || S.active) return;
    if (S.timeLeft <= 0) { endDay(); return; }
    if (!S.queue.length) S.queue = makeQueue(queueSize());
    var def = S.queue.shift();
    if (!def) return;
    var kind = (S.specialNext && M.SPECIAL_PATIENTS && M.SPECIAL_PATIENTS[S.specialNext]) ? S.specialNext : null;
    try {
      S.active = true;
      S.sim = null;
      S.restLeft = 0;
      S.endedAt = 0;
      if (kind && GAME.bootSim) {
        S.specialNext = null;
        GAME.bootSim(null, kind);
      } else {
        GAME.nextPatient(def);
      }
      S.sim = GAME.sim;
      /* 兜底：bootSim 版本不支持特殊病人时，套用事件病例 */
      if (kind && S.sim && !S.sim.special && M.applySpecial) M.applySpecial(S.sim, kind);
      if (!kind) {
        /* 队列按性别筛过病例，但 bootSim 会重新生成患者；这里兜底修正性别 */
        var nm = (def.name || '') + (def.site || '');
        var femaleOnly = /妊娠|子宫|卵巢|产后|子痫|胎盘|异位妊娠|附件/.test(nm);
        var maleOnly = /前列腺|睾丸/.test(nm);
        if (S.sim && S.sim.patient) {
          if (femaleOnly && S.sim.patient.sex === '男') S.sim.patient.sex = '女';
          if (maleOnly && S.sim.patient.sex === '女') S.sim.patient.sex = '男';
        }
      }
      /* 不计入统计的特殊病人（例如嫌犯被击中数十枪）不增加接诊人数 */
      var excl = !!(S.sim && S.sim.special && S.sim.special.noStats);
      if (excl) {
        S.excluded = (S.excluded || 0) + 1;
        if (M.addRecord) M.addRecord(S.sim, '特殊记录：' + (S.sim.special.title || '') + '（不计入接诊与死亡率）');
        UI.toast('warn', '特殊记录 · 不计入统计', (S.sim.special.title || '') + '：' + (S.sim.special.note || ''));
      } else {
        S.seen++;
        UI.toast('warn', '诊室 · 新病人', (kind ? (S.sim.special.title + ' · ') : '疑似：') + (def.name || '') + '　危重 ' + (def.triage || 3) + '/5');
      }
      renderBar(true);
    } catch (e) {
      S.active = false;
      if (M.reportError) M.reportError('诊室接诊', e);
    }
  }
  C.startNext = startNext;
  C.nextDisease = function () {
    if (!S.queue || !S.queue.length) S.queue = makeQueue(queueSize());
    return S.queue.shift();
  };
  C.abandon = function () {
    if (S.active) { S.active = false; S.transferred = (S.transferred || 0) + 1; }
    S.restLeft = 0;
    if (UI.isModalOpen()) UI.closeModal();
    startNext();
  };
  C.forceNext = function () {
    var sim = S.sim || GAME.sim;
    if (S.active && sim && (sim.outcome === 'win' || sim.outcome === 'lose')) finishPatient(sim.outcome);
    S.restLeft = 0;
    if (UI.isModalOpen()) UI.closeModal();
    startNext();
  };

  function finishPatient(outcome) {
    if (!S.active) return;
    S.active = false;
    S.sim = GAME.sim;
    var sim0 = S.sim;
    var excl = !!(sim0 && sim0.special && sim0.special.noStats);
    if (!excl) {
      if (outcome === 'win') S.saved++; else S.lost++;
    } else if (M.addRecord) {
      M.addRecord(sim0, (outcome === 'win' ? '已处置' : '死亡') + '：' + (sim0.special.title || '') + '（不计入统计）');
    }
    /* 医誉：治愈 +10~+18（按评分），死亡 −6；不计入统计的特殊病例不结算医誉 */
    var score = 0;
    if (!excl && outcome === 'win' && M.finalScore) {
      try { score = M.finalScore(S.sim || GAME.sim) || 0; } catch (e) { score = 0; }
    }
    var repDelta = excl ? 0 : (outcome === 'win' ? (10 + Math.round(score / 30)) : -6);
    if (repDelta && M.Account && M.Account.addRep) {
      var r = M.Account.addRep(repDelta);
      if (r) {
        S.repGain += r.delta;
        if (r.up) UI.toast('good', '医誉提升 · ' + r.level.n,
          '医誉 ' + r.to + '｜' + r.level.perk);
      }
    }
    /* 新闻：每次诊疗结束刷新两条；小概率出现特殊事件，下一位就是事件伤员 */
    if (M.newsFeed) S.news = M.newsFeed(2).concat(S.news || []).slice(0, 40);
    var excl2 = !!(S.sim && S.sim.special && S.sim.special.noStats);
    var ev = (M.rollSpecialEvent && !excl2) ? M.rollSpecialEvent(0.06) : null;
    if (ev) {
      S.news.unshift({ id: 'ev' + Date.now(), t: Date.now(), text: '【突发】' + ev.title + '：' + ev.news, event: ev.kind });
      S.specialNext = ev.kind;
      UI.toast('crit', '突发 · ' + ev.title, '下一位病人可能是这次事件的伤员（可在「新闻」里查看）');
      if (M.log) M.log(sim0, 'crit', '【新闻】' + ev.title + '：' + ev.news);
    }
    S.restTotal = Math.round(rnd(CFG.restMin || 60, CFG.restMax || 240));
    S.restLeft = Math.min(S.restTotal, Math.max(0, S.timeLeft));
    S.endedAt = Date.now();
    if (S.timeLeft <= 0) S.pendingEnd = true;
    renderBar(true);
    if (M.log) M.log(S.sim, 'info', '【诊室】本次诊疗结束（' + (outcome === 'win' ? '治愈' : '死亡') + '），休息 ' +
      fmt(S.restLeft) + ' 后接诊下一位。');
    C.saveNow();
  }

  function endDay() {
    if (S.ended) return;
    if (S.active) {
      S.active = false;
      S.transferred = (S.transferred || 0) + 1;
    }
    S.ended = true;
    S.restLeft = 0;
    /* 本班结束：暂停主循环，避免旧病人在结算页后面继续死亡/治愈 */
    S.savedSpeed = GAME.speed || 1;
    if (GAME.setSpeed) GAME.setSpeed(0);
    /* 全勤奖：治愈多于死亡再补一点医誉 */
    var bonus = 0;
    if (S.saved > 0 && S.saved >= S.lost) {
      bonus = 8 + Math.min(12, S.saved * 2);
      if (M.Account && M.Account.addRep) M.Account.addRep(bonus);
    }
    renderBar(true);
    C.saveNow();
    var low = 0, total = 0;
    for (var id in S.stock) { total += S.stock[id] || 0; if ((S.stock[id] || 0) < 5) low++; }
    var box = el('dayCard');
    var lv = M.Account && M.Account.level ? M.Account.level() : null;
    if (box) {
      box.innerHTML = '<div class="day-head">第 ' + S.day + ' 天 · ' + (S.night ? '夜班' : '白班') + ' 结束</div>' +
        '<div class="day-sub">本班诊疗结束，感谢值守。' + (lv ? ('当前 <b style="color:#7ff0b0">' + lv.n + '</b> · 医誉 ' + M.Account.rep()) : '') + '</div>' +
        '<div class="day-stats">' +
        stat('接诊', S.seen + ' 人') + stat('治愈', S.saved + ' 人') + stat('死亡', S.lost + ' 人') +
        stat('支出', '¥' + S.spent) + stat('结余', '¥' + S.budget) + stat('剩余库存', total + ' 份') +
        stat('本班医誉', (S.repGain + bonus >= 0 ? '+' : '') + (S.repGain + bonus) + (bonus ? ('（全勤 +' + bonus + '）') : '')) +
        (S.transferred ? stat('转交', S.transferred + ' 人') : '') +
        '</div>' +
        '<div class="day-tip">库存低于 5 份的药品/耗材：' + low + ' 种。下一天会重置为「常用药 ' + CFG.commonUnits + ' 份 / 其他药 ' + CFG.defaultUnits + ' 份 / 手术耗材 ' + CFG.consumableUnits + ' 份」，经费 ¥' + CFG.budget + '。' +
        (lv && lv.discount ? ('<br>医誉福利：药品与耗材 <b>' + (100 - lv.discount) + ' 折</b>' + (lv.peak ? ' · 高峰期优先配送' : '')) : '') + '</div>' +
        '<button class="btn primary day-next" data-next-day>进入第 ' + (S.day + 1) + ' 天 · ' + (S.night ? '白班' : '夜班') + '</button>';
    }
    var ov = el('dayOverlay');
    if (ov) ov.classList.remove('hidden');
  }
  C.endDay = endDay;

  function stat(n, v) {
    return '<div class="day-stat"><span>' + n + '</span><b>' + esc(v) + '</b></div>';
  }

  function nextDay() {
    var ov = el('dayOverlay');
    if (ov) ov.classList.add('hidden');
    S.day++;
    S.night = !S.night;
    S.timeLeft = shiftSeconds();
    S.budget = CFG.budget;
    S.stock = M.initialStock();
    S.deliveries = [];
    S.queue = makeQueue(queueSize());
    S.seen = 0; S.saved = 0; S.lost = 0; S.spent = 0; S.repGain = 0;
    S.ended = false; S.pendingEnd = false; S.active = false;
    S.restLeft = 0; S.restTotal = 0; S.endedAt = 0; S.transferred = 0;
    if (GAME.setSpeed) GAME.setSpeed(S.savedSpeed || 1);
    if (UI.isModalOpen()) UI.closeModal();
    document.body.classList.toggle('night-shift', S.night);
    renderBar(true);
    UI.toast('good', '第 ' + S.day + ' 天', (S.night ? '夜班' : '白班') + '开始 · 经费 ¥' + S.budget);
    startNext();
    C.saveNow();
  }
  C.nextDay = nextDay;

  /* ================= 主循环（真实时间 / 倍速） ================= */
  function loop(now) {
    if (!S.started || S.ended) return;
    var dt = (now - S.lastTick) / 1000;
    S.lastTick = now;
    if (!isFinite(dt) || dt <= 0) return;
    dt = Math.min(dt, 1.0);
    var speed = (GAME.speed === undefined ? 1 : GAME.speed);
    if (speed <= 0) { renderBar(false); return; }
    var gdt = dt * speed;

    /* 休息不计入上班时间：本班 48 分钟都是真正干活的时间 */
    var resting = !S.active && S.restLeft > 0 && CFG.restPausesClock;
    if (!resting) S.timeLeft = Math.max(0, S.timeLeft - gdt);

    /* 采购配送 */
    if (S.deliveries.length) {
      for (var i = S.deliveries.length - 1; i >= 0; i--) {
        var d = S.deliveries[i];
        d.left -= gdt;
        if (d.left <= 0) {
          S.stock[d.id] = (S.stock[d.id] || 0) + d.qty;
          if (UI.renderDrugs) UI.renderDrugs();
          UI.toast('good', '采购到货', d.name + ' ×' + d.qty + ' 已入库');
          S.deliveries.splice(i, 1);
          if (S.pharmOpen) refreshPharmLive();
        }
      }
    }

    /* 休息倒计时 */
    if (!S.active && S.restLeft > 0) S.restLeft = Math.max(0, S.restLeft - gdt);

    /* 病人结束检测 */
    var sim = S.sim || GAME.sim;
    if (S.active && sim && (sim.outcome === 'win' || sim.outcome === 'lose') && !sim.__clinicDone) {
      sim.__clinicDone = true;
      finishPatient(sim.outcome);
    }

    /* 本班结束判定 */
    if (S.timeLeft <= 0 && !S.ended) endDay();
    if (S.pendingEnd && !S.active && !S.ended) endDay();

    /* 休息结束后自动接诊：要求报告已关闭，避免吞掉结算报告 */
    if (!S.active && !S.ended && !S.pendingEnd && S.restLeft <= 0 && S.endedAt > 0 &&
        Date.now() - S.endedAt > 6000 && !UI.isModalOpen()) {
      startNext();
    }

    /* 每 20 秒自动存档一次，防止崩溃 / 直接关掉浏览器丢进度 */
    if (Date.now() - S.saveAt > 20000) { S.saveAt = Date.now(); C.saveNow(); }

    renderBar(false);
    if (S.pharmOpen) refreshPharmLive();
  }

  /* ================= 库存 / 给药扣费 ================= */
  function stockOf(id) { return S.stock[id] || 0; }
  C.stockOf = stockOf;

  function consume(D, dose, route) {
    if (!D || !S.started || S.ended) return true;
    var allowed = D.routes || ['iv'];
    if (allowed.indexOf(route) < 0) return true;   /* 非法途径交给引擎报错，不扣库存 */
    var meta = M.stockMeta(D);
    var amt = (typeof dose === 'number' && dose > 0) ? dose : ((D.dose && D.dose.typical) || 1);
    var units = Math.max(1, Math.ceil(amt / meta.per));
    if (stockOf(D.id) < units) {
      UI.toast('crit', '库存不足 · ' + D.name, '需要 ' + units + ' 份，现有 ' + stockOf(D.id) + ' 份。请到「药房」采购（1–5 分钟送达）');
      if (M.log) M.log(S.sim || GAME.sim, 'warn', '【药房】' + D.name + ' 库存不足（需 ' + units + '，有 ' + stockOf(D.id) + '）。');
      return false;
    }
    S.stock[D.id] = stockOf(D.id) - units;
    renderBar(true);
    if (UI.renderDrugs) UI.renderDrugs();
    return true;
  }
  C.consume = consume;

  /* ---------- 手术耗材 ---------- */
  function itemById(id) {
    if (M.CONSUMABLE_BY_ID && M.CONSUMABLE_BY_ID[id]) {
      var c = M.CONSUMABLE_BY_ID[id];
      return { id: c.id, name: c.name, unit: c.unit, price: c.price, cls: '手术耗材', desc: c.desc, consumable: true };
    }
    var D = M.getDrug(id);
    if (!D) return null;
    var meta = M.stockMeta(D);
    return { id: D.id, name: D.name, unit: D.unit, price: meta.price, per: meta.per, cls: D.cls || '', drug: D };
  }
  C.itemById = itemById;

  /* 一台手术的耗材是否齐备；齐备则扣库存 */
  function takeSurgerySupplies(site, proc) {
    if (!M.surgeryNeeds) return true;
    var need = M.surgeryNeeds(proc, site);
    var miss = [];
    for (var id in need) if (stockOf(id) < need[id]) {
      var c = M.CONSUMABLE_BY_ID[id] || { name: id, unit: '份' };
      miss.push(c.name + '（需 ' + need[id] + '，有 ' + stockOf(id) + '）');
    }
    if (miss.length) {
      UI.toast('crit', '手术耗材不足', '缺：' + miss.join('、') + '。请到「药房 → 耗材」采购后再开台。');
      if (M.log) M.log(S.sim || GAME.sim, 'warn', '【手术室】耗材不足，无法开台：' + miss.join('、'));
      return false;
    }
    for (var id2 in need) S.stock[id2] = Math.max(0, stockOf(id2) - need[id2]);
    renderBar(true);
    return true;
  }
  C.takeSurgerySupplies = takeSurgerySupplies;

  /* 护理外伤处置的耗材扣减（清创缝合 / 包扎 / 固定 / 止血带 / 烧伤 / 灌洗） */
  function takeConsumable(need) {
    if (!need) return true;
    var miss = [];
    for (var id in need) {
      if (stockOf(id) < need[id]) {
        var c = (M.CONSUMABLE_BY_ID && M.CONSUMABLE_BY_ID[id]) || { name: id };
        miss.push(c.name + '（需 ' + need[id] + '，有 ' + stockOf(id) + '）');
      }
    }
    if (miss.length) {
      UI.toast('crit', '耗材不足', '缺：' + miss.join('、') + '。请到「药房 → 耗材」采购后再处理。');
      if (M.log) M.log(S.sim || GAME.sim, 'warn', '【护理】耗材不足，未能完成处置：' + miss.join('、'));
      return false;
    }
    for (var id2 in need) S.stock[id2] = Math.max(0, stockOf(id2) - need[id2]);
    renderBar(true);
    if (UI.renderDrugs) UI.renderDrugs();
    C.saveNow();
    return true;
  }
  C.takeConsumable = takeConsumable;

  /* 新闻 / 特殊记录 */
  C.openNews = function () {
    var list = (S.news || []).slice(0, 20);
    var recs = (S.records || []).slice(0, 12);
    var body = '<div style="font-size:11px;color:#7d93a6;margin-bottom:8px">第 ' + S.day + ' 天 · ' +
      (S.night ? '夜班' : '白班') + ' · 休息时刷新；小概率出现突发事件，伤员会被送到本院。</div>' +
      (list.length ? list.map(function (n) {
        return '<div style="padding:9px 11px;margin-bottom:7px;border-radius:9px;line-height:1.7;font-size:12px;' +
          (n.event ? 'background:rgba(255,61,90,.12);border-left:3px solid #ff5a7a;color:#ffc4cd' :
            'background:rgba(255,255,255,.035);border-left:3px solid rgba(90,190,220,.35);color:#bcd4e2') + '">' +
          (n.event ? '<b style="color:#ff8fa0">【突发】</b>' : '') + esc(n.text) + '</div>';
      }).join('') : '<div class="empty">今天的新闻还没更新，接诊结束（进入休息）后就会刷新。</div>') +
      (recs.length ? '<div style="font-size:10.5px;letter-spacing:2px;color:#7d93a6;margin:14px 0 7px">特殊记录（不计入接诊与死亡率）</div>' +
        recs.map(function (r) {
          return '<div style="padding:7px 10px;margin-bottom:6px;border-radius:8px;font-size:11.5px;color:#9fb4c4;background:rgba(255,255,255,.025)">' +
            esc(r.text) + '</div>';
        }).join('') : '');
    UI.openModal(UI.modalShell('narrow', UI.modalHead('新闻 · 本院通报', '社会新闻与突发事件'), body));
    UI.bindClose();
  };

  /* ---------- 采购 ---------- */
  function priceOf(base) {
    return (M.Account && M.Account.priceOf) ? M.Account.priceOf(base) : base;
  }
  function deliveryEta() {
    var base = rnd(CFG.deliveryMin, CFG.deliveryMax);
    if (M.Account && M.Account.deliveryTime) return Math.round(M.Account.deliveryTime(base, !S.night));
    return Math.round(base);
  }

  function buy(id, qty) {
    var it = itemById(id);
    if (!it) return false;
    qty = Math.max(1, parseInt(qty, 10) || 1);
    var unitPrice = priceOf(it.price);
    var total = unitPrice * qty;
    if (S.budget < total) {
      UI.toast('warn', '经费不足', it.name + ' ×' + qty + ' 需要 ¥' + total + '，当前结余 ¥' + S.budget);
      return false;
    }
    S.budget -= total;
    S.spent += total;
    var eta = deliveryEta();
    S.deliveries.push({ id: id, qty: qty, left: eta, total: eta, name: it.name });
    var fast = (M.Account && M.Account.level && M.Account.level().peak && !S.night)
      ? '（高峰期优先配送）' : '';
    UI.toast('good', '已下单', it.name + ' ×' + qty + ' · ¥' + total + ' · 约 ' + fmt(eta) + ' 送达' + fast);
    renderBar(true);
    if (S.pharmOpen) refreshPharmLive();
    C.saveNow();
    return true;
  }
  C.buy = buy;

  /* ================= 诊室状态条 ================= */
  function renderBar(force) {
    var bar = el('clinicBar');
    if (!bar) return;
    var day = el('cbDay'), shift = el('cbShift'), time = el('cbTime'),
      budget = el('cbBudget'), queue = el('cbQueue'), status = el('cbStatus'),
      prog = el('cbProg'), next = el('btnNext'), low = el('cbLow'), rep = el('cbRep');
    if (day) day.textContent = '第 ' + S.day + ' 天';
    if (shift) {
      shift.textContent = S.night ? '夜班' : '白班';
      shift.className = 'cb-shift ' + (S.night ? 'night' : 'day');
    }
    if (time) time.textContent = fmt(S.timeLeft);
    if (budget) budget.textContent = '¥' + S.budget;
    if (queue) queue.textContent = '候诊 ' + S.queue.length;
    if (rep && M.Account) {
      var lv = M.Account.level();
      rep.textContent = lv.n + ' · 医誉 ' + M.Account.rep() + (lv.discount ? (' · ' + (100 - lv.discount) + ' 折') : '');
      rep.title = lv.perk;
    }
    if (status) {
      if (S.ended) status.textContent = '本班结束';
      else if (S.active) status.textContent = '诊疗中';
      else if (S.restLeft > 0) status.textContent = '休息 ' + fmt(S.restLeft) + '（不计时）';
      else status.textContent = '准备接诊';
    }
    if (prog) prog.style.width = clamp(S.timeLeft / shiftSeconds() * 100, 0, 100) + '%';
    if (next) {
      var ready = !S.active && !S.ended && !S.pendingEnd && S.restLeft <= 0 && S.started;
      next.classList.toggle('hidden', !ready);
    }
    if (low) {
      var n = 0;
      for (var id in S.stock) if ((S.stock[id] || 0) < 5) n++;
      low.textContent = n ? ('库存告急 ' + n) : '';
      low.classList.toggle('hidden', !n);
    }
    var restBox = el('restOverlay');
    if (restBox) {
      var showRest = !S.active && !S.ended && S.restLeft > 0;
      restBox.classList.toggle('hidden', !showRest);
      if (showRest) {
        var rt = el('restTime'); if (rt) rt.textContent = fmt(S.restLeft);
        var rs = el('restSub'); if (rs) rs.textContent = '本班剩余 ' + fmt(S.timeLeft) + '（休息不计时）';
      }
    }
    var sig = [S.day, S.night, Math.floor(S.timeLeft), S.budget, S.queue.length, S.active, Math.floor(S.restLeft), S.ended].join('|');
    if (force || sig !== S.lastBar) {
      S.lastBar = sig;
      document.body.classList.toggle('night-shift', S.night);
    }
  }
  C.renderBar = renderBar;

  /* ================= 药房 ================= */
  function drugHay(D) {
    return (D.name + ' ' + (D.alias || '') + ' ' + (D.cls || '') + ' ' + D.id).toLowerCase();
  }
  function pharmListHtml() {
    var q = (S.pharmQuery || '').toLowerCase();
    var html = '';
    /* 耗材页签 */
    if (S.pharmFilter === 'cs') {
      var cs = (M.CONSUMABLES || []).filter(function (c) {
        return !q || (c.name + ' ' + c.desc + ' ' + c.id).toLowerCase().indexOf(q) >= 0;
      });
      html = cs.map(function (c) {
        var st = stockOf(c.id);
        var cls = st <= 0 ? 'out' : st < 3 ? 'low' : '';
        var p = priceOf(c.price);
        return '<div class="pharm-row ' + cls + '" data-pid="' + esc(c.id) + '">' +
          '<div class="pr-main"><b>' + esc(c.name) + '</b><span>' + esc(c.desc || '') + '</span></div>' +
          '<div class="pr-stock" data-stock-id="' + esc(c.id) + '">' + st + '<i>份</i></div>' +
          '<div class="pr-pack">每份 1 ' + esc(c.unit || '份') + '</div>' +
          '<div class="pr-price">' + (p < c.price ? ('<s>¥' + c.price + '</s> ') : '') + '¥' + p + '</div>' +
          '<div class="pr-buy">' + [1, 3, 5].map(function (n) {
            return '<button data-buy="' + esc(c.id) + '" data-qty="' + n + '">+' + n + '</button>';
          }).join('') + '</div></div>';
      }).join('');
      return html || '<div class="empty">没有匹配的耗材</div>';
    }

    var arr = (M.DRUGS || []).filter(function (D) {
      if (S.pharmFilter === 'low' && stockOf(D.id) > 10) return false;
      if (S.pharmFilter === 'common' && (M.COMMON_DRUGS || []).indexOf(D.id) < 0) return false;
      return !q || drugHay(D).indexOf(q) >= 0;
    });
    arr.sort(function (a, b) {
      var ca = (M.COMMON_DRUGS || []).indexOf(a.id) >= 0 ? 0 : 1;
      var cb = (M.COMMON_DRUGS || []).indexOf(b.id) >= 0 ? 0 : 1;
      if (ca !== cb) return ca - cb;
      var sa = stockOf(a.id), sb = stockOf(b.id);
      if (sa !== sb) return sa - sb;
      return (a.cls || '').localeCompare(b.cls || '') || a.name.localeCompare(b.name);
    });
    var max = 120;
    var cut = arr.length > max;
    html = arr.slice(0, max).map(function (D) {
      var meta = M.stockMeta(D);
      var st = stockOf(D.id);
      var cls = st <= 0 ? 'out' : st < 10 ? 'low' : '';
      var p = priceOf(meta.price);
      return '<div class="pharm-row ' + cls + '" data-pid="' + esc(D.id) + '">' +
        '<div class="pr-main"><b>' + esc(D.name) + '</b><span>' + esc(D.cls || '') + '</span></div>' +
        '<div class="pr-stock" data-stock-id="' + esc(D.id) + '">' + st + '<i>份</i></div>' +
        '<div class="pr-pack">每份 ' + meta.per + ' ' + esc(D.unit || '') + '</div>' +
        '<div class="pr-price">' + (p < meta.price ? ('<s>¥' + meta.price + '</s> ') : '') + '¥' + p + '</div>' +
        '<div class="pr-buy">' +
        [1, 5, 10].map(function (n) {
          return '<button data-buy="' + esc(D.id) + '" data-qty="' + n + '">+' + n + '</button>';
        }).join('') + '</div></div>';
    }).join('');
    if (!html) html = '<div class="empty">没有匹配的药品</div>';
    if (cut) html += '<div class="exam-note" style="padding:8px 2px">只显示前 ' + max + ' 条，请用搜索缩小范围。</div>';
    return html;
  }
  function refreshPharmList() {
    var box = el('pharmList');
    if (box) box.innerHTML = pharmListHtml();
  }
  function refreshPharmLive() {
    if (!S.pharmOpen) return;
    var b = el('pharmBudget'); if (b) b.textContent = '¥' + S.budget;
    var d = el('pharmDeliv');
    if (d) d.innerHTML = delivHtml();
    Array.prototype.forEach.call(document.querySelectorAll('[data-stock-id]'), function (n) {
      var id = n.dataset.stockId;
      var st = stockOf(id);
      n.innerHTML = st + '<i>份</i>';
      var row = n.parentNode;
      if (row) { row.classList.toggle('out', st <= 0); row.classList.toggle('low', st > 0 && st < 10); }
    });
  }
  function delivHtml() {
    if (!S.deliveries.length) return '<div class="empty" style="padding:6px">暂无在途采购</div>';
    return S.deliveries.map(function (d) {
      return '<div class="deliv-row"><span>' + esc(d.name) + ' ×' + d.qty + '</span><b>' + fmt(d.left) + '</b>' +
        '<i class="deliv-bar"><em style="width:' + clamp((1 - d.left / Math.max(1, d.total)) * 100, 0, 100) + '%"></em></i></div>';
    }).join('');
  }
  function repTipHtml() {
    if (!M.Account || !M.Account.level) return '';
    var L = M.Account.level();
    var s = L.discount ? ('医誉 <b>' + L.n + '</b> · 药品与耗材 <b>' + (100 - L.discount) + ' 折</b>') : ('医誉 <b>' + L.n + '</b> · 暂无折扣');
    if (L.speed > 1) s += ' · 配送提速 ' + Math.round((L.speed - 1) * 100) + '%';
    if (L.peak) s += ' · 白班高峰期优先配送';
    return s;
  }
  function openPharmacy() {
    var head = UI.modalHead('药房 · 药品与手术耗材', '每日经费 ¥' + CFG.budget + ' · 采购 1–5 分钟送达');
    var body = '<div class="pharm-top">' +
      '<span>可用经费 <b id="pharmBudget">¥' + S.budget + '</b></span>' +
      '<span class="hint">' + repTipHtml() + '</span></div>' +
      '<div class="pharm-tools"><input id="pharmSearch" type="search" placeholder="搜索药名 / 耗材 / 分类…" value="' + esc(S.pharmQuery) + '">' +
      '<button class="ph-btn ' + (S.pharmFilter === 'all' ? 'on' : '') + '" data-pf="all">全部</button>' +
      '<button class="ph-btn ' + (S.pharmFilter === 'cs' ? 'on' : '') + '" data-pf="cs">手术耗材</button>' +
      '<button class="ph-btn ' + (S.pharmFilter === 'low' ? 'on' : '') + '" data-pf="low">库存≤10</button>' +
      '<button class="ph-btn ' + (S.pharmFilter === 'common' ? 'on' : '') + '" data-pf="common">常用药</button></div>' +
      '<div class="pharm-grid"><div class="pharm-list" id="pharmList">' + pharmListHtml() + '</div>' +
      '<div class="pharm-side"><h4>在途采购</h4><div id="pharmDeliv">' + delivHtml() + '</div>' +
      '<div class="exam-note">采购立即扣除经费，送达后才入库。手术开台会按术式消耗耗材（无菌手术包、缝线、吻合器、引流、内固定等），缺任何一项都无法开台。</div></div></div>';
    UI.openModal(UI.modalShell('wide', head, body), null, function () { S.pharmOpen = false; });
    S.pharmOpen = true;
    UI.bindClose();
    var root = el('modalRoot');
    var inp = el('pharmSearch');
    if (inp) inp.addEventListener('input', function () {
      S.pharmQuery = inp.value;
      refreshPharmList();
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-pf]'), function (b) {
      b.addEventListener('click', function () {
        S.pharmFilter = b.dataset.pf;
        Array.prototype.forEach.call(root.querySelectorAll('[data-pf]'), function (x) { x.classList.toggle('on', x === b); });
        refreshPharmList();
      });
    });
    if (!root.__pharmBound) {
      root.__pharmBound = 1;
      root.addEventListener('click', function (ev) {
        var b = ev.target.closest ? ev.target.closest('[data-buy]') : null;
        if (!b) return;
        C.buy(b.dataset.buy, parseInt(b.dataset.qty, 10) || 1);
        refreshPharmList();
        refreshPharmLive();
      });
    }
  }
  C.openPharmacy = openPharmacy;

  /* ================= 候诊区 / 休息 ================= */
  function openQueue() {
    var head = UI.modalHead('候诊区 · 本班进度', (S.night ? '夜班' : '白班') + ' · 剩余 ' + fmt(S.timeLeft));
    var rest = S.restLeft > 0 ? ('休息中 ' + fmt(S.restLeft)) : (S.active ? '正在诊疗' : '可以接诊');
    var body = '<div class="q-head"><span>' + rest + '</span><span>候诊 <b>' + S.queue.length + '</b> 人</span>' +
      '<span>已接诊 <b>' + S.seen + '</b> · 治愈 <b>' + S.saved + '</b> · 死亡 <b>' + S.lost + '</b></span></div>' +
      '<div class="q-list">' + (S.queue.length ? S.queue.map(function (d, i) {
        var chief = (d.symptoms && d.symptoms[0] && d.symptoms[0].name) || '待查';
        return '<div class="q-item"><span class="q-no">' + (i + 1) + '</span><div><b>' + esc(chief) + '</b>' +
          '<span>' + esc(d.dept || '') + ' · 危重 ' + (d.triage || 3) + '/5</span></div></div>';
      }).join('') : '<div class="empty">候诊区暂时没有病人</div>') + '</div>' +
      '<div class="q-actions">' +
      (S.restLeft > 0 ? '<button class="btn warn" data-skip-rest>跳过休息</button>' : '') +
      '<button class="btn primary" data-next-patient ' + (S.active || S.ended ? 'disabled' : '') + '>立即接诊下一位</button>' +
      '</div>';
    UI.openModal(UI.modalShell('narrow', head, body));
    UI.bindClose();
    var root = el('modalRoot');
    var skip = root.querySelector('[data-skip-rest]');
    if (skip) skip.addEventListener('click', function () { S.restLeft = 0; openQueue(); });
    var next = root.querySelector('[data-next-patient]');
    if (next) next.addEventListener('click', function () {
      if (S.active) return;
      UI.closeModal();
      startNext();
    });
  }
  C.openQueue = openQueue;

  /* ================= 事件绑定 ================= */
  function init() {
    S.stock = M.initialStock();
    S.lastTick = performance.now ? performance.now() : Date.now();
    var bp = el('btnPharmacy'); if (bp) bp.addEventListener('click', openPharmacy);
    var bq = el('btnQueue'); if (bq) bq.addEventListener('click', openQueue);
    var bn = el('btnNext'); if (bn) bn.addEventListener('click', function () {
      if (UI.isModalOpen()) UI.closeModal();
      startNext();
    });
    var bs = el('btnSkipRest'); if (bs) bs.addEventListener('click', function () { S.restLeft = 0; renderBar(true); });
    var brs = el('btnRestSkip'); if (brs) brs.addEventListener('click', function () { S.restLeft = 0; renderBar(true); });
    var brq = el('btnRestQueue'); if (brq) brq.addEventListener('click', openQueue);
    var brn = el('btnRestNews'); if (brn) brn.addEventListener('click', function () { C.openNews(); });
    var bnews = el('btnNews'); if (bnews) bnews.addEventListener('click', function () { C.openNews(); });
    var ov = el('dayOverlay');
    if (ov) ov.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('[data-next-day]')) nextDay();
    });

    /* 给药扣库存：包装 M.give / M.startInfusion，不侵入引擎 */
    if (!M.__clinicGivePatched) {
      M.__clinicGivePatched = 1;
      var give0 = M.give;
      M.give = function (sim, drugId, dose, route, opt) {
        var D = M.getDrug(drugId);
        if (D && S.started && !S.ended && sim === GAME.sim) {
          if (!consume(D, dose, route)) return null;
        }
        return give0.apply(M, arguments);
      };
      var inf0 = M.startInfusion;
      M.startInfusion = function (sim, drugId, rate, opt) {
        var D = M.getDrug(drugId);
        if (D && S.started && !S.ended && sim === GAME.sim) {
          if (!consume(D, rate, 'iv_inf')) return null;
        }
        return inf0.apply(M, arguments);
      };
      /* 手术开台：先核对并扣除耗材 */
      var surg0 = M.startSurgery;
      if (typeof surg0 === 'function') {
        M.startSurgery = function (sim, siteId, procId) {
          if (S.started && !S.ended && sim === GAME.sim) {
            var site = M.findSite ? M.findSite(siteId) : null;
            var proc = M.findProc ? M.findProc(procId) : null;
            if (site && proc && (site.procs || []).indexOf(procId) >= 0) {
              if (!takeSurgerySupplies(site, proc)) return null;
            }
          }
          return surg0.apply(M, arguments);
        };
      }
    }
    if (!M.__clinicTicker) {
      M.__clinicTicker = 1;
      setInterval(function () { loop(performance.now ? performance.now() : Date.now()); }, 200);
    }
    /* 演示 / 自动化：诊室页支持 #openpharm / #openqueue / #clinicend 等 */
    var h = String((window.location && location.hash) || '');
    if (h.indexOf('openpharm') >= 0) setTimeout(openPharmacy, 900);
    if (h.indexOf('openqueue') >= 0) setTimeout(openQueue, 900);
    if (h.indexOf('clinicgive') >= 0) setTimeout(function () {
      if (GAME.sim) M.give(GAME.sim, 'epinephrine', 1, 'iv');
    }, 1000);
    if (h.indexOf('clinicbuy') >= 0) setTimeout(function () { C.buy('epinephrine', 5); }, 1000);
    if (h.indexOf('cliniccs') >= 0) setTimeout(function () { S.pharmFilter = 'cs'; openPharmacy(); }, 1000);
    if (h.indexOf('clinicnextday') >= 0) setTimeout(function () { nextDay(); }, 1200);
    if (h.indexOf('cliniccure') >= 0) setTimeout(function () { if (GAME.sim && !GAME.sim.dead) M.cure(GAME.sim); }, 1200);
    if (h.indexOf('clinicend') >= 0) setTimeout(function () {
      var sim = GAME.sim;
      if (sim && !sim.outcome) { sim.outcome = 'win'; sim.dead = true; sim.__cureFired = true; }
    }, 1400);
    if (h.indexOf('clinicsurgery') >= 0) setTimeout(function () {
      if (GAME.sim) M.startSurgery(GAME.sim, 'appendix', 'resection');
    }, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
