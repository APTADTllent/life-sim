/* ============================================================
   LIFE SIM · 界面层
   ============================================================ */
window.M = window.M || {};
(function () {
  'use strict';
  var M = window.M;
  var UI = {};
  M.UI = UI;

  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  UI.esc = esc;

  /* ================= 波形面板 ================= */
  var WAVES = [
    { kind: 'ecg', label: 'ECG', lead: 'II', sub: 'II 导联', zoom: 1 },
    { kind: 'abp', label: 'ART', sub: '动脉压' },
    { kind: 'pleth', label: 'SpO₂', sub: '脉搏波' },
    { kind: 'resp', label: 'RESP', sub: '呼吸阻抗' },
    { kind: 'eeg', label: 'EEG', sub: '脑电' },
    { kind: 'co2', label: 'EtCO₂', sub: '二氧化碳' }
  ];
  var wstates = {};

  UI.initWaves = function () {
    var list = el('waveList');
    list.innerHTML = '';
    wstates = {};
    WAVES.forEach(function (w) {
      var row = document.createElement('div');
      row.className = 'wave-row';
      row.dataset.kind = w.kind;
      row.innerHTML = '<div class="wave-label">' + w.label + ' <b data-val></b>' +
        (w.kind === 'ecg' ? ' <i class="rhy-badge" data-rhy>窦性心律</i>' : '') +
        (w.zoom ? ' <span style="color:#25e3c6">·双击放大</span>' : '') + '</div>' +
        '<div class="wave-zoom">' + w.sub + '</div>' +
        '<canvas></canvas>';
      if (w.zoom) {
        row.addEventListener('dblclick', function () { UI.open12Lead(M.GAME.sim); });
      }
      list.appendChild(row);
      wstates[w.kind] = M.newWaveState(w.kind === 'ecg' ? 130 : 110);
      w.canvas = row.querySelector('canvas');
      w.valEl = row.querySelector('[data-val]');
      w.rhyEl = row.querySelector('[data-rhy]');
      w.rowEl = row;
    });
  };

  function waveValueText(sim, kind) {
    var v = sim.v;
    if (kind === 'ecg') return Math.round(v.hr) + ' bpm';
    if (kind === 'abp') return v.pulseOK ? (Math.round(v.sbp) + '/' + Math.round(v.dbp)) : '无脉搏';
    if (kind === 'pleth') return Math.round(v.spo2) + '%';
    if (kind === 'resp') return Math.round(v.rr) + ' /min';
    if (kind === 'eeg') return Math.round(v.brain) + '%';
    if (kind === 'co2') return Math.round(v.paco2) + ' mmHg';
    return '';
  }

  UI.drawWaves = function (sim) {
    for (var i = 0; i < WAVES.length; i++) {
      var w = WAVES[i];
      if (!w.canvas) continue;
      M.drawWave(w.canvas, sim, wstates[w.kind], w.kind, w.lead, 1);
      w.valEl.textContent = waveValueText(sim, w.kind);
      var bad = (w.kind === 'ecg' && !sim.v.pulseOK) || (w.kind === 'pleth' && sim.v.spo2 < 90);
      w.rowEl.classList.toggle('flat', !!bad);
      if (w.kind === 'ecg' && w.rhyEl) {
        var nm = M.RHY_NAME[sim.rhythm] || sim.rhythm;
        var noPulse = !sim.v.pulseOK;
        var txt = nm + (noPulse ? ' · 无脉' : '');
        if (w.rhyEl.textContent !== txt) w.rhyEl.textContent = txt;
        var cls = 'rhy-badge';
        if (sim.rhythm === 'vf' || sim.rhythm === 'asystole' || sim.rhythm === 'torsades') cls += ' crit';
        else if (sim.rhythm === 'pea' || noPulse) cls += ' pea';
        else if (sim.rhythm === 'vt' || sim.rhythm === 'svt') cls += ' warn';
        else if (sim.rhythm === 'flutter' || sim.rhythm === 'block2' || sim.rhythm === 'block3' || sim.rhythm === 'junctional') cls += ' warn';
        if (w.rhyEl.className !== cls) w.rhyEl.className = cls;
      }
    }
  };

  /* ================= 生命体征（分组显示，降低密集度） ================= */
  var VITAL_GROUPS = [
    { id: 'circ', name: '循环', keys: ['hr', 'sbp', 'dbp', 'map', 'co', 'sv', 'svr', 'contractility', 'coronary', 'svo2', 'do2', 'symp', 'qt', 'arrhythmia'] },
    { id: 'resp', name: '呼吸', keys: ['rr', 'tv', 'spo2', 'paco2', 'pao2', 'airway', 'bronchospasm', 'secretions'] },
    { id: 'neuro', name: '神经', keys: ['gcs', 'brain', 'sedation', 'pain', 'seizure', 'pupil', 'icp'] },
    { id: 'meta', name: '内环境', keys: ['k', 'na', 'ca', 'mg', 'glucose', 'ph', 'lactate', 'temp', 'osmo', 'emesis'] },
    { id: 'organ', name: '器官·血液', keys: ['hb', 'plt', 'inr', 'wbc', 'volume', 'gut', 'clotting', 'renal', 'hepatic', 'urine', 'ammonia', 'ck', 'phos', 'histamine', 'anaphylaxis', 'gi', 'immune', 'uterus'] }
  ];
  M.VITAL_GROUPS = VITAL_GROUPS;
  var BIG_KEYS = { hr: 1, sbp: 1, spo2: 1, rr: 1, temp: 1, paco2: 1 };
  var vitalEls = {}, vitalKeys = [];

  UI.buildVitals = function () {
    var wrap = el('vitalPaneWrap');
    wrap.innerHTML = '';
    vitalEls = {}; vitalKeys = [];
    VITAL_GROUPS.forEach(function (g, gi) {
      var pane = document.createElement('div');
      pane.className = 'vgroup' + (gi === 0 ? ' on' : '');
      pane.dataset.g = g.id;
      wrap.appendChild(pane);
      g.keys.forEach(function (k) {
        var meta = M.TMETA[k]; if (!meta) return;
        var d = document.createElement('div');
        d.className = 'vital-card' + (BIG_KEYS[k] ? '' : ' small');
        d.innerHTML = '<div class="vc-label">' + (k === 'sbp' ? '血压' : meta.n) + '</div>' +
          '<div class="vc-value"><span data-v>--</span><span class="vc-unit">' + meta.u + '</span></div>' +
          '<div class="vc-sub" data-s></div><div class="vc-bar" data-b></div>';
        pane.appendChild(d);
        vitalEls[k] = { box: d, v: d.querySelector('[data-v]'), s: d.querySelector('[data-s]'), b: d.querySelector('[data-b]'), last: null };
        vitalKeys.push(k);
      });
    });
  };

  UI.showVitalGroup = function (gid) {
    var tabs = el('vitalTabs');
    if (tabs) Array.prototype.forEach.call(tabs.children, function (b) { b.classList.toggle('on', b.dataset.g === gid); });
    var wrap = el('vitalPaneWrap');
    if (wrap) Array.prototype.forEach.call(wrap.children, function (p) { p.classList.toggle('on', p.dataset.g === gid); });
  };

  function stateOf(k, val) {
    var t = M.TMETA[k]; if (!t) return 'ok';
    if (val <= t.cl || val >= t.ch) return 'crit';
    if (val < t.lo || val > t.hi) return 'warn';
    return 'ok';
  }
  UI.stateOf = stateOf;

  UI.renderVitals = function (sim) {
    var v = sim.v;
    for (var i = 0; i < vitalKeys.length; i++) {
      var ck = vitalKeys[i];
      var e = vitalEls[ck]; if (!e) continue;
      var val = v[ck];
      var txt, sub = '';
      if (ck === 'sbp') {
        txt = v.pulseOK ? (Math.round(v.sbp) + '/' + Math.round(v.dbp)) : (sim.cpr ? '按压 ' + Math.round(v.sbp) + '/' + Math.round(v.dbp) : '--/--');
        sub = v.pulseOK ? ('MAP ' + Math.round(v.map)) : (sim.cpr ? 'CPR 人工循环' : '无脉搏');
      } else if (ck === 'hr') {
        txt = Math.round(val);
        sub = M.RHY_NAME[sim.rhythm] || '';
      } else if (ck === 'temp') {
        txt = val.toFixed(1); sub = val > 38 ? '发热' : val < 35.5 ? '低体温' : '正常';
      } else if (ck === 'spo2') {
        txt = Math.round(val); sub = val < 90 ? '低氧血症' : '氧合可';
      } else if (ck === 'gcs') {
        txt = Math.round(val); sub = val >= 14 ? '清醒' : val >= 9 ? '嗜睡' : val >= 6 ? '昏睡' : '昏迷';
      } else if (ck === 'k') {
        txt = val.toFixed(1); sub = val > 5.3 ? '高钾' : val < 3.5 ? '低钾' : '';
      } else if (ck === 'ph') {
        txt = val.toFixed(2); sub = val < 7.35 ? '酸中毒' : val > 7.45 ? '碱中毒' : '';
      } else if (ck === 'lactate') {
        txt = val.toFixed(1); sub = val > 2.2 ? '组织低灌注' : '';
      } else if (ck === 'urine') {
        txt = Math.round(val); sub = val < 20 ? '少尿' : '';
      } else if (ck === 'volume') {
        txt = Math.round(val);
        sub = val >= 12000 ? '容量过负荷 · 停搏' : val >= 8000 ? '体液过负荷' : val < 4000 ? '容量不足' : '';
      } else if (ck === 'gut') {
        txt = Math.round(val);
        sub = val >= 10000 ? '胃扩张 · 停搏' : val >= 4000 ? '胃内容物潴留' : '';
      } else if (ck === 'hb') {
        txt = val.toFixed(1); sub = val < 7 ? '重度贫血' : val < 10 ? '贫血' : '';
      } else if (ck === 'inr') {
        txt = val.toFixed(2); sub = val > 1.5 ? '凝血延迟' : '';
      } else if (ck === 'pupil') {
        txt = val.toFixed(1); sub = val > 5.5 ? '瞳孔散大' : val < 2 ? '针尖样' : '';
      } else {
        txt = (Math.abs(val) >= 100 ? Math.round(val) : (M.TMETA[ck] && M.TMETA[ck].dec ? val.toFixed(M.TMETA[ck].dec) : Math.round(val)));
      }
      if (e.last !== txt) {
        e.v.textContent = txt;
        e.last = txt;
        e.box.classList.remove('flash');
        void e.box.offsetWidth;
        e.box.classList.add('flash');
      }
      e.s.textContent = sub;
      var st = stateOf(ck, ck === 'sbp' ? v.sbp : val);
      if (ck === 'sbp') st = v.pulseOK ? st : 'crit';
      e.box.classList.toggle('warn', st === 'warn');
      e.box.classList.toggle('crit', st === 'crit');
      var t = M.TMETA[ck];
      if (t) {
        var pct = M.clamp((val - t.cl) / (t.ch - t.cl), 0, 1) * 100;
        e.b.style.width = pct + '%';
        e.b.style.background = st === 'crit' ? 'var(--red)' : st === 'warn' ? 'var(--amber)' : 'var(--green)';
      }
    }
  };

  /* ================= 右侧标签分区 ================= */
  var rightTab = 'guide', seenLogN = 0, lastLogN = -1, lastExamSig = '';

  /* 统一错误捕获：单个面板/操作出错时不拖垮整个界面，并报出精确位置 */
  var safeTag = '';
  function safe(name, fn, sim) {
    try { return fn(sim); } catch (e) {
      var tag = name + '|' + (e && e.message ? e.message : e);
      if (safeTag === tag) return null;
      safeTag = tag;
      if (window.console && console.error) console.error('[LIFESIM]', name, e);
      if (M.reportError) M.reportError(name, e);
      return null;
    }
  }

  UI.initTabs = function () {
    var rt = el('rightTabs');
    if (rt) rt.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      safe('标签切换', function () { UI.showTab(b.dataset.t); });
    });
    var vt = el('vitalTabs');
    if (vt) vt.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      safe('体征分组', function () { UI.showVitalGroup(b.dataset.g); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-fold]'), function (b) {
      b.__fb = 1;
      b.addEventListener('click', function () { safe('折叠面板', function () { UI.toggleFold(b.dataset.fold); }); });
    });
  };

  UI.showTab = function (t) {
    rightTab = t;
    var rt = el('rightTabs'), pw = el('paneWrap');
    if (rt) {
      Array.prototype.forEach.call(rt.children, function (x) { x.classList.toggle('on', x.dataset.t === t); });
      var btn = rt.querySelector('[data-t="' + t + '"]');
      if (btn) btn.classList.remove('dot');
    }
    if (pw) Array.prototype.forEach.call(pw.children, function (p) { p.classList.toggle('hidden', p.dataset.p !== t); });
    lastLogN = -1; lastSymN = -1; rxSig = ''; lastExamSig = '';
    var sim = M.GAME.sim;
    if (sim) {
      safe('症状列表', UI.renderSymptoms, sim);
      safe('处方列表', UI.renderRx, sim);
      safe('事件日志', UI.renderLog, sim);
      safe('检查化验', UI.renderExam, sim);
    }
  };

  UI.toggleFold = function (id) {
    var node = el(id); if (!node) return;
    node.classList.toggle('folded');
    if (id === 'monitorCol') {
      var main = el('main');
      if (main) main.classList.toggle('mon-off', node.classList.contains('folded'));
    }
  };

  var LAB_NAME = {
    troponin: '肌钙蛋白', wbc: '白细胞', crp: 'CRP', k: '血钾', na: '血钠', glucose: '血糖',
    hb: '血红蛋白', inr: 'INR', plt: '血小板', creatinine: '肌酐', amylase: '淀粉酶',
    lipase: '脂肪酶', lactate: '乳酸', ph: 'pH', bnp: 'BNP', alt: 'ALT', bilirubin: '胆红素',
    d_dimer: 'D-二聚体', pt: '凝血酶原时间', urea: '尿素', ketone: '血酮', hco3: '碳酸氢根', pco2: 'PCO₂'
  };
  var EXAM_KEY = { ecg: '心电图', xray: '胸片', ct: 'CT', us: '超声', mri: 'MRI', endoscopy: '内镜', pathology: '病理' };

  UI.renderLog = function (sim) {
    var n = sim.logs.length;
    var btn = el('rightTabs') ? el('rightTabs').querySelector('[data-t="log"]') : null;
    if (rightTab !== 'log') { if (n > seenLogN && btn) btn.classList.add('dot'); }
    else seenLogN = n;
    if (n === lastLogN) return;
    lastLogN = n;
    var body = el('logBody'); if (!body) return;
    var arr = sim.logs.slice(-70).reverse();
    body.innerHTML = arr.map(function (l) {
      return '<div class="log-item t-' + l.type + '"><span class="lt">' + M.fmtT(l.t) + '</span><span class="lm">' + esc(l.text) + '</span></div>';
    }).join('') || '<div class="empty">暂无事件记录</div>';
  };

  UI.renderExam = function (sim) {
    if (rightTab !== 'exam') return;
    /* 待回报倒计时只改文字，不重建 DOM（否则会打断滚动与选择） */
    var pend = (sim.examPending || []).length;
    var body0 = el('examBody');
    if (body0 && pend) {
      Array.prototype.forEach.call(body0.querySelectorAll('[data-pend]'), function (n) {
        for (var i = 0; i < (sim.examPending || []).length; i++) {
          if (sim.examPending[i].id === n.dataset.pend) {
            n.textContent = Math.max(0, Math.ceil(sim.examPending[i].ready - sim.t)) + 's';
            return;
          }
        }
      });
    }
    var sig = sim.examFindings.length + '|' + (sim.labVer || 0) + '|' + (sim.examVer || 0) + '|' + pend + '|' + Math.floor((sim.t || 0) / 4);
    if (sig === lastExamSig) return;
    lastExamSig = sig;
    var body = body0; if (!body) return;
    var html = '';

    /* ---------- 开检查 ---------- */
    html += '<div class="exam-actions"><button class="btn primary" data-open-exam>开检查 / 化验 / 影像</button>' +
      '<span class="hint">床旁 3–25 s · 影像 20–45 s</span></div>';
    html += '<div class="exam-quick">' + ['ecg12', 'abg', 'lytes', 'cbc', 'troponin', 'us', 'ct_head', 'tox']
      .map(function (id) {
        var d = M.examDef ? M.examDef(id) : null;
        return d ? '<button class="eq-btn" data-order="' + id + '" title="' + esc(d.desc) + '">' + esc(d.n) + '</button>' : '';
      }).join('') + '</div>';

    /* ---------- 待回报 ---------- */
    if (pend) {
      html += '<div class="exam-block pending"><h4>待回报 <span>' + pend + ' 项</span></h4>' +
        (sim.examPending || []).map(function (p) {
          var left = Math.max(0, p.ready - sim.t);
          var pct = Math.min(100, (1 - left / Math.max(1, p.ready - p.t0)) * 100);
          return '<div class="pend-row"><span>' + esc(p.name) + '</span><b data-pend="' + esc(p.id) + '">' + Math.ceil(left) + 's</b>' +
            '<i class="pend-bar"><em style="width:' + pct + '%"></em></i></div>';
        }).join('') + '</div>';
    }

    /* ---------- 临床评分 ---------- */
    var sc = M.clinicalScores ? M.clinicalScores(sim) : null;
    if (sc) {
      var scoreChip = function (name, val, sub, cls) {
        return '<div class="score-chip ' + (cls || '') + '"><div class="sc-top"><span>' + esc(name) + '</span><b>' + esc(val) + '</b></div>' +
          '<i>' + esc(sub || '') + '</i></div>';
      };
      var newsCls = sc.news >= 7 ? 'crit' : sc.news >= 5 ? 'warn' : 'ok';
      var qCls = sc.qsofa >= 2 ? 'crit' : sc.qsofa === 1 ? 'warn' : 'ok';
      var sofaCls = sc.sofaTotal >= 10 ? 'crit' : sc.sofaTotal >= 6 ? 'warn' : 'ok';
      var pfCls = sc.pf <= 200 ? 'crit' : sc.pf <= 300 ? 'warn' : 'ok';
      var siCls = sc.shockIndex >= 1.4 ? 'crit' : sc.shockIndex >= 0.9 ? 'warn' : 'ok';
      var akiCls = sc.aki >= 2 ? 'crit' : sc.aki === 1 ? 'warn' : 'ok';
      var lacCls = sc.lactateClear === null ? 'ok' : sc.lactateClear < 0 ? 'crit' : sc.lactateClear < 30 ? 'warn' : 'ok';
      html += '<div class="exam-block scores"><h4>临床评分 <span>实时</span></h4><div class="score-grid">' +
        scoreChip('NEWS2', sc.news, '≥7 高危', newsCls) +
        scoreChip('qSOFA', sc.qsofa + '/3', '≥2 脓毒症风险', qCls) +
        scoreChip('SOFA', sc.sofaTotal + '/24', '器官衰竭评分', sofaCls) +
        scoreChip('P/F', sc.pf, 'FiO₂ ' + Math.round(sc.fio2 * 100) + '%', pfCls) +
        scoreChip('休克指数', sc.shockIndex.toFixed(2), 'HR/SBP', siCls) +
        scoreChip('AKI', sc.aki + ' 期', 'KDIGO 近似', akiCls) +
        (sc.lactateClear === null ? '' : scoreChip('乳酸清除', (sc.lactateClear > 0 ? '' : '') + sc.lactateClear + '%', '入院至今', lacCls)) +
        '</div><div class="exam-note">NEWS2 用于早期预警；qSOFA ≥2 / SOFA ≥2 提示脓毒症可能；P/F <300 需考虑 ARDS；' +
        '休克指数 >0.9 提示休克代偿，>1.4 为失代偿。评分只作量化参考，不替代临床判断。</div></div>';
    }

    /* ---------- 器官功能 + 互作 ---------- */
    var ov = M.organOverview ? M.organOverview(sim) : null;
    if (ov) {
      html += '<div class="exam-block"><h4>器官功能概览 <span>实时</span></h4><div class="organ-grid">' +
        ov.organs.map(function (o) {
          var cls = o.pct < 45 ? 'crit' : o.pct < 70 ? 'warn' : 'ok';
          return '<div class="organ-cell ' + cls + '"><div class="oc-top"><span>' + o.n + '</span><b>' + o.pct + '%</b></div>' +
            '<i class="oc-bar"><em style="width:' + o.pct + '%"></em></i><div class="oc-sub">' + esc(o.sub || '') + '</div></div>';
        }).join('') + '</div></div>';
      if (ov.suspected && ov.suspected.length) {
        html += '<div class="exam-block"><h4>问题定位 <span>根据当前异常推断</span></h4><div class="suspect">' +
          ov.suspected.map(function (s) {
            return '<span class="sus-chip">' + esc(s.name) + ' <b>' + s.pct + '%</b></span>';
          }).join('') + '</div><div class="exam-note">这是器官层面的可能性排序，不是最终诊断；结合病史与检查结果判断。</div></div>';
      }
      if (ov.cross.length) {
        html += '<div class="exam-block cross"><h4>活跃的器官相互作用 <span>' + ov.cross.length + ' 条</span></h4>' +
          ov.cross.map(function (c) {
            return '<div class="cross-row sev' + c.sev + '"><b>' + esc(c.from) + ' → ' + esc(c.to) + '</b><span>' + esc(c.text) + '</span></div>';
          }).join('') + '</div>';
      }
      if (ov.clues.length) {
        html += '<div class="exam-block clue"><h4>检查线索 <span>由阳性结果归纳</span></h4>' +
          ov.clues.slice(0, 8).map(function (c) {
            return '<div class="clue-row"><b>' + esc(c.exam) + '</b><span>' + esc(c.text) + '</span></div>';
          }).join('') + '</div>';
      }
    }

    /* ---------- 检查结果 ---------- */
    var res = (sim.examResults || []).slice(-10).reverse();
    if (res.length) {
      html += res.map(function (r) {
        return '<div class="exam-block' + (r.crit ? ' crit' : '') + '"><h4>' + esc(r.name) +
          '<span>' + M.fmtT(r.t) + ' · ' + (r.crit ? '危急值' : '已回报') + '</span></h4>' +
          '<div class="exam-text">' + esc(r.text) + '</div>' +
          (r.clue ? '<div class="exam-clue">线索：' + esc(r.clue) + '</div>' : '') +
          (r.rows && r.rows.length ? '<div class="kv-grid">' + r.rows.map(function (x) {
            var arrow = x.flag === 'hi' ? '↑' : x.flag === 'lo' ? '↓' : x.flag === 'crit' ? '⚠' : '';
            return '<div class="kv ' + x.flag + '"><span>' + esc(x.n) + '</span><b>' + esc(x.v) + (arrow ? ' ' + arrow : '') +
              (x.u ? ' <i>' + esc(x.u) + '</i>' : '') + '</b></div>';
          }).join('') + '</div>' : '') + '</div>';
      }).join('');
    }

    /* ---------- 体格检查 / 既往化验 ---------- */
    var ex = sim.examFindings.slice().reverse();
    if (ex.length) {
      html += ex.slice(0, 6).map(function (e2) {
        if (e2.lines) return '<div class="exam-block"><h4>体格检查 · ' + esc(e2.part) + ' <span>' + M.fmtT(e2.t) + '</span></h4>' + e2.lines.map(esc).join('<br>') + '</div>';
        return '<div class="exam-block"><h4>' + esc(EXAM_KEY[e2.k] || e2.k) + ' <span>' + M.fmtT(e2.t) + '</span></h4>' + esc(e2.v) + '</div>';
      }).join('');
    }
    var lbs = sim.labs;
    if (lbs.length) {
      html += '<div class="exam-block" style="background:rgba(37,224,122,.05);border-color:rgba(37,224,122,.18)"><h4 style="color:#7ff0b0">既往化验</h4>' +
        lbs.slice().reverse().map(function (l) {
          var t = M.TMETA[l.k];
          var bad = t ? (stateOf(l.k, l.v) !== 'ok') : false;
          return '<div class="kv"><span>' + (LAB_NAME[l.k] || l.k) + '</span><b style="' + (bad ? 'color:#ff8fa0' : '') + '">' + l.v + (t ? ' ' + t.u : '') + '</b></div>';
        }).join('') + '</div>';
    }
    var keepScroll = body.scrollTop || 0;
    body.innerHTML = html || '<div class="empty">尚未进行任何检查<br>点上方「开检查 / 化验 / 影像」</div>';
    body.scrollTop = keepScroll;
    if (body.querySelector('[data-open-exam]')) UI.bindExamBody(body, sim);
  };

  /* 检查面板内的事件委托（只在重建后绑定一次） */
  UI.bindExamBody = function (body, sim) {
    if (!body) return;
    Array.prototype.forEach.call(body.querySelectorAll('[data-order]'), function (b) {
      if (b.__ob) return; b.__ob = 1;
      b.addEventListener('click', function () {
        safe('开检查', function () {
          var r = M.orderExam(sim, b.dataset.order);
          UI.toast(r.ok ? 'good' : 'warn', r.ok ? '已开单' : '无法开单', r.msg);
        });
      });
    });
    var ob = body.querySelector('[data-open-exam]');
    if (ob && !ob.__ob) {
      ob.__ob = 1;
      ob.addEventListener('click', function () { safe('检查面板', function () { UI.openExam(sim); }); });
    }
  };

  /* ================= 疾病面板 ================= */
  var lastDz = '';
  UI.renderDisease = function (sim) {
    var body = el('diseaseBody');
    var d = sim.disease;
    var badge = el('triageBadge');
    if (!d) {
      badge.textContent = '—'; badge.className = 'triage';
      body.innerHTML = '<div class="dz-undx">尚未明确诊断<br><b>通过体格检查、化验与心电图寻找病因</b></div>';
      return;
    }
    var def = d.def;
    badge.textContent = '危重 ' + def.triage + '/5';
    badge.className = 'triage t' + def.triage;

    var elapsed = sim.t - d.t0;
    var lethal = def.lethalAfter || 900;
    var sev = d.controlled ? 6 : M.clamp(elapsed / lethal * 100, 3, 100);
    var stage = def.stages && def.stages[d.stage] ? def.stages[d.stage] : null;
    var tp = M.treatProgress(sim);
    var organLoad = M.clamp((sim.v.lactate / 6) * 100 * 0.5 + (1 - M.clamp(sim.v.map / 80, 0, 1)) * 100 * 0.3 + (100 - sim.v.spo2) * 1.5, 0, 100);

    var html = '';
    html += '<div class="dz-name">' + esc(def.name) + '</div>';
    html += '<div class="dz-meta"><span>' + esc(def.dept) + '</span><span>' + esc(def.site || '') + '</span>' +
      (M.diseaseCategory ? '<span class="cat-badge">' + esc(M.categoryName(M.diseaseCategory(def))) + '</span>' : '') +
      (def.course === 'chronic'
        ? '<span class="course-badge chronic" title="慢性基础病：进展慢但无法根治，容易反复急性加重">慢性 · 难根治</span>'
        : '<span class="course-badge acute" title="急性病：进展快，不处理容易迅速恶化">急性 · 进展快</span>') +
      (def.needSurgery ? '<span style="color:#c9b6ff">需手术根治</span>' : '') +
      (d.controlled ? '<span style="color:#7ff0b0">已控制</span>' : '') + '</div>';
    html += '<div class="dz-row"><span class="lbl">病情</span><div class="bar"><div class="bar-fill ' + (sev > 70 ? 'crit' : sev > 40 ? 'warn' : 'ok') + '" style="width:' + sev + '%"></div></div><span>' + Math.round(sev) + '%</span></div>';
    html += '<div class="dz-row"><span class="lbl">器官负荷</span><div class="bar"><div class="bar-fill ' + (organLoad > 70 ? 'crit' : organLoad > 40 ? 'warn' : 'ok') + '" style="width:' + organLoad + '%"></div></div><span>' + Math.round(organLoad) + '%</span></div>';
    html += '<div class="dz-row"><span class="lbl">处置进度</span><div class="bar"><div class="bar-fill ok" style="width:' + (tp.total ? tp.done / tp.total * 100 : 0) + '%"></div></div><span>' + tp.done + '/' + tp.total + '</span></div>';
    if (stage) {
      html += '<div class="dz-stage"><b>当前病程 · ' + esc(stage.label) + (d.controlled ? '（已控制）' : '') + '</b>' + esc(stage.log || '') + '</div>';
    }
    html += '<div class="dz-hint">发病 ' + M.fmtT(elapsed) + '｜' + (d.controlled ? '病因已处理，仍需把循环/氧合稳定下来' : '未处理预计 ' + M.fmtT(Math.max(0, lethal - elapsed)) + ' 后不可逆') + '</div>';
    if (def.needSurgery && !d.controlled) {
      var need = (def.treat || []).filter(function (t) { return t.type === 'surgery' && t.need; })[0];
      if (need) {
        var done9 = sim.treatDone[(def.treat || []).indexOf(need)];
        html += '<div class="need-surg">建议术式：<b>' + esc(M.procName(need.proc) + ' @ ' + M.siteName(need.site)) + '</b>' +
          (done9 ? ' <span style="color:#7ff0b0">✓ 已完成</span>' : surgBtn(need.site, need.proc, '去做这台手术 →')) + '</div>';
      }
    }
    /* 按职称分级给出处置提示 */
    var gLvl = gdTier(sim);
    var nIdx = M.needIdx ? M.needIdx(def) : [];
    if (!d.controlled && (def.treat || []).length && gLvl !== 'none') {
      var nDone = 0, nAll = 0;
      (def.treat || []).forEach(function (t, i) { if (t.need) { nAll++; if (sim.treatDone[i]) nDone++; } });
      var rows;
      if (!nAll) {
        /* 该病例没有「必需项」：至少完成 2 项对症处置 + 持续稳定才转归 */
        nAll = (def.treat || []).length;
        nDone = d.support || 0;
        rows = (def.treat || []).map(function (t, i) {
          var label = M.treatLabel ? M.treatLabel(t) : (t.type === 'drug' ? ((M.getDrug(t.id) || { name: t.id }).name) : (M.procName(t.proc) + ' @ ' + M.siteName(t.site)));
          var mark = sim.treatDone[i] ? '<span style="color:#7ff0b0">✓</span>' : '<span style="color:#5b6f80">○</span>';
          var note = (gLvl === 'full' && t.note) ? '<span style="color:#5b6f80">（' + esc(t.note) + '）</span>' : '';
          return mark + ' ' + esc(label) + note;
        }).join('<br>') + '<div style="margin-top:4px;color:#7d93a6">本病例以支持治疗为主：至少完成 2 项对症处置，并把生命体征持续稳定下来才能转归。</div>';
        html += '<div class="dz-hint" style="border-left:2px solid #25e3c6;padding-left:8px;margin-top:8px">' +
          '<b style="color:#25e3c6;display:block;margin-bottom:4px">处置提示（对症支持 · 已完成 ' + nDone + ' 项）</b>' + rows + '</div>';
      } else if (gLvl === 'hint') {
        rows = '<div style="color:#7d93a6">必需处置共 <b style="color:#25e3c6">' + nAll + '</b> 项，已完成 <b style="color:#25e3c6">' + nDone + '</b> 项。<br>' +
          '本职称不提供具体方案，请在「指南」标签或 <b>G</b> 键查阅通用临床指南。</div>';
        html += '<div class="dz-hint" style="border-left:2px solid #25e3c6;padding-left:8px;margin-top:8px">' +
          '<b style="color:#25e3c6;display:block;margin-bottom:4px">处置提示（方向 · ' + nDone + '/' + nAll + '）</b>' + rows + '</div>';
      } else {
        rows = (def.treat || []).map(function (t, i) {
          var label = M.treatLabel ? M.treatLabel(t) : (t.type === 'drug' ? ((M.getDrug(t.id) || { name: t.id }).name) : (M.procName(t.proc) + ' @ ' + M.siteName(t.site)));
          var mark = sim.treatDone[i] ? '<span style="color:#7ff0b0">✓</span>' : (t.need ? '<span style="color:#ffb02e">●</span>' : '<span style="color:#5b6f80">○</span>');
          var note = (gLvl === 'full' && t.note) ? '<span style="color:#5b6f80">（' + esc(t.note) + '）</span>' : '';
          return mark + ' ' + esc(label) + note;
        }).join('<br>');
        html += '<div class="dz-hint" style="border-left:2px solid #25e3c6;padding-left:8px;margin-top:8px">' +
          '<b style="color:#25e3c6;display:block;margin-bottom:4px">处置提示（' + (gLvl === 'full' ? '完整' : '要点') + ' · ' + nDone + '/' + nAll + '）</b>' +
          rows + '</div>';
      }
    } else if (!d.controlled && gLvl === 'none') {
      html += '<div class="dz-hint" style="margin-top:8px;color:#7d93a6">主任医师模式：不提供病例提示，请查阅 <b>G</b> 键的通用指南自行判断。</div>';
    }
    /* 转归计时器：让玩家看到「稳定 45 秒」的实时进度 */
    var sp = M.stableProgress ? M.stableProgress(sim) : null;
    if (sp) {
      var pct = Math.min(100, sp.t / sp.need * 100);
      html += '<div class="dz-row" style="margin-top:8px"><span class="lbl">稳定计时</span>' +
        '<div class="bar"><div class="bar-fill ok" style="width:' + pct + '%"></div></div>' +
        '<span>' + Math.floor(Math.min(sp.t, sp.need)) + '/' + sp.need + 's</span></div>' +
        '<div class="dz-hint" style="color:#7ff0b0">' + (sp.ready
          ? '已达标，正在判定转归…'
          : '维持 MAP > 65、SpO₂ > 90%、乳酸 < 2.8、体温 34.8–39.0℃、血钾 3.1–5.8、Hb > 7，连续 ' + sp.need + ' 秒即抢救成功。') + '</div>';
    } else if (sim.controlled && !sim.__cureFired) {
      html += '<div class="dz-hint" style="color:#ffb02e">病因已处理，但生命体征尚未达到转归标准：纠正低血压 / 低氧 / 酸中毒 / 电解质紊乱。</div>';
    }
    if (html !== lastDz) {
      body.innerHTML = html;
      lastDz = html;
      bindSurgButtons(body, sim);
    }
  };

  /* ================= 症状 ================= */
  UI.renderSymptoms = function (sim) {
    var n = sim.symptoms.length;
    el('symCount').textContent = n;
    if (n === lastSymN) return;
    lastSymN = n;
    var body = el('symptomBody');
    if (!n) { body.innerHTML = '<div class="empty">尚未采集到症状<br>可通过「体格检查」进一步评估</div>'; return; }
    body.innerHTML = sim.symptoms.slice().reverse().map(function (s) {
      return '<div class="sym-item"><span class="sym-mode m' + esc(s.mode) + '">' + esc(s.mode) + '</span><span>' + esc(s.name) + '</span></div>';
    }).join('');
  };
  var lastSymN = -1;

  /* ================= 处方 ================= */
  /* 处方列表每帧都会被 tick 刷新：不能每次重写 innerHTML，
     否则 .rx-item 的 slidein 动画会不停重播、「起效中 Ns」也会把 DOM 磨得乱闪。
     做法：结构不变就只改文字节点；结构变了才重建，并且用事件委托绑「停止」。 */
  var rxSig = '';
  var rxEls = {};

  function rxLabel(r, sim) {
    var onsetLeft = (r.onsetDelay || 0) - (sim.t - r.t0);
    if (r.failed) return '未起效（过敏）';
    if (r.infusion) return r.active ? '滴注中' : '已停止';
    if (onsetLeft > 0.5) return '起效中 ' + Math.ceil(onsetLeft) + 's';
    return (r.ended && !(r.infusion && r.active)) ? '已代谢' : '作用中';
  }

  UI.renderRx = function (sim) {
    var list = sim.rxList;
    var cnt = el('rxCount');
    if (cnt && cnt.textContent !== String(list.length)) cnt.textContent = list.length;
    var body = el('rxBody');
    if (!body) return;

    if (!list.length) {
      if (rxSig !== 'empty') {
        rxSig = 'empty'; rxEls = {};
        body.innerHTML = '<div class="empty">尚未开具任何处方</div>';
      }
      return;
    }

    var arr = list.slice(-40).reverse();

    /* 结构指纹：只有这些变化才需要重建 DOM */
    var sig = arr.map(function (r) {
      var over = r.peakC > ((r.D.tox && r.D.tox.factor) || 3);
      return r.uid + (r.failed ? 'F' : '') + (r.infusion ? (r.active ? 'A' : 'S') : (r.ended ? 'E' : 'O')) + (over ? '!' : '');
    }).join('|');

    if (sig !== rxSig) {
      rxSig = sig;
      rxEls = {};
      body.innerHTML = arr.map(function (r) {
        var ended = r.ended && !(r.infusion && r.active);
        var over = r.peakC > ((r.D.tox && r.D.tox.factor) || 3);
        var cls = 'rx-item' + (ended ? ' ended' : '') + (over ? ' bad' : '');
        var doseTxt = r.infusion
          ? (r.rate + ' ' + ((r.D.rateRange && r.D.rateRange.per) || ''))
          : M.fmtDose(r.dose, r.unit);
        return '<div class="' + cls + '" data-uid="' + r.uid + '">' +
          '<div class="rx-top"><span class="rx-name">' + esc(r.D.name) + '</span>' +
          '<span class="rx-dose">' + esc(doseTxt) + '</span>' +
          (function () {
            var pk = r.peakC || 0;
            if (pk < 0.5) return '';
            var tf = (r.D.tox && r.D.tox.factor) || 3;
            var mult = pk / tf;
            var num = pk >= 10 ? Math.round(pk) : pk.toFixed(1);
            return '<span class="rx-pk' + (mult >= 1 ? ' over' : '') + '">峰值 ' + num + '×' +
              (mult >= 1 ? ' · 毒性 ' + (mult >= 10 ? Math.round(mult) : mult.toFixed(1)) + '×' : '') + '</span>';
          })() +
          '</div>' +
          '<div class="rx-bot"><span class="rt">' + esc(M.ROUTE_NAME[r.route] || r.route) + '</span>' +
          '<span>' + M.fmtT(r.t0) + '</span>' +
          (r.infusion && r.active
            ? '<button class="mini-stop" data-stop="' + r.uid + '" style="cursor:pointer;background:transparent;border:1px solid #ff3d5a;color:#ff8fa0;border-radius:4px;padding:0 4px">停止</button>'
            : '') +
          '<span class="rx-inf"><b data-rx-inf="' + r.uid + '"></b>' +
          (over ? '<span style="color:#ff8fa0"> ⚠ 过量</span>' : '') + '</span></div></div>';
      }).join('');
      Array.prototype.forEach.call(body.querySelectorAll('[data-rx-inf]'), function (n) {
        rxEls[n.dataset.rxInf] = n;
      });
      /* 事件委托一次即可，重建后依然有效 */
      if (!body.__rxBound) {
        body.__rxBound = 1;
        body.addEventListener('click', function (ev) {
          var b = ev.target.closest ? ev.target.closest('[data-stop]') : null;
          if (!b) return;
          safe('停止滴注', function () { M.stopInfusion(sim, parseInt(b.dataset.stop, 10)); });
        });
      }
    }

    /* 只更新会变的那几个字，避免整块重排/重放动画 */
    for (var i = 0; i < arr.length; i++) {
      var r = arr[i];
      var n = rxEls[r.uid];
      if (!n) continue;
      var txt = rxLabel(r, sim);
      if (n.firstChild) {
        if (n.firstChild.nodeValue !== txt) n.firstChild.nodeValue = txt;
      } else if (n.textContent !== txt) {
        n.textContent = txt;
      }
    }
  };

  /* ================= 药品库（功能大类 + 列表） ================= */
  var drugSearch = '', drugOpen = {}, drugUsed = {};

  function catOf(D) {
    var c = (D.cls || '其他').split('·')[0].split('/')[0].trim();
    if (!c || c.length > 9) c = '其他';
    return c;
  }
  UI.catOf = catOf;

  function drugHay(D) {
    return (D.name + ' ' + (D.alias || '') + ' ' + (D.cls || '') + ' ' + (D.id || '') + ' ' +
      (D.routes || []).map(function (r) { return M.ROUTE_NAME[r] || r; }).join(' ') + ' ' +
      (D.effects || []).map(function (e) { return (M.TMETA[e.t] ? M.TMETA[e.t].n : e.t); }).join(' ')).toLowerCase();
  }

  function itemHtml(D) {
    var flags = D.flags || [];
    var dot = '';
    if (flags.indexOf('high_alert') >= 0) dot = '<span class="di-flag red" title="高危药品"></span>';
    else if (flags.indexOf('controlled') >= 0 || flags.indexOf('narcotic') >= 0) dot = '<span class="di-flag violet" title="管制药品"></span>';
    else if (D.allergy && D.allergy.p > 0) dot = '<span class="di-flag" title="有过敏风险"></span>';
    var sub = (D.cls || '未分类') + ' · ' + ((D.routes || []).length) + ' 种途径';
    if (D.dose) sub += ' · 常用 ' + D.dose.typical + ' ' + (D.unit || '');
    if (M.Clinic && M.Clinic.isOn()) {
      var stk = M.Clinic.stockOf(D.id);
      sub += ' · 库存 ' + stk + ' 份';
    }
    return '<div class="ditem' + (drugUsed[D.id] ? ' used' : '') + '" data-id="' + esc(D.id) + '">' + dot +
      '<div class="di-main"><div class="di-name">' + esc(D.name) + '</div>' +
      '<div class="di-sub">' + esc(sub) + '</div></div>' +
      '<div class="di-unit">' + esc(D.unit || '') + '</div></div>';
  }

  function buildDrugListHtml(q) {
    q = (q === undefined ? drugSearch : q);
    var groups = {};
    (M.DRUGS || []).forEach(function (D) {
      if (q && drugHay(D).indexOf(q) < 0) return;
      var c = catOf(D);
      if (!groups[c]) groups[c] = [];
      groups[c].push(D);
    });
    var cats = Object.keys(groups).sort(function (a, b) { return groups[b].length - groups[a].length; });
    if (!cats.length) {
      return '<div class="empty">没有匹配的药品<br><span style="color:#5b6f80">试试药名、别名或靶点，如「胺碘酮」「升压」「血钾」</span></div>';
    }
    return cats.map(function (c, i) {
      var list = groups[c];
      var open = q ? true : (drugOpen[c] !== undefined ? drugOpen[c] : (i === 0));
      return '<div class="dgroup' + (open ? ' open' : '') + '" data-c="' + esc(c) + '">' +
        '<div class="dgroup-head"><span class="dg-a">›</span><span class="dg-n">' + esc(c) + '</span>' +
        '<span class="dg-c">' + list.length + '</span></div>' +
        '<div class="dgroup-body">' + list.map(itemHtml).join('') + '</div></div>';
    }).join('');
  }

  function bindDrugList(box, sim, closeAfter) {
    if (!box) return;
    Array.prototype.forEach.call(box.querySelectorAll('.dgroup-head'), function (h) {
      h.addEventListener('click', function () {
        var g = h.parentNode;
        g.classList.toggle('open');
        drugOpen[g.dataset.c] = g.classList.contains('open');
      });
    });
    Array.prototype.forEach.call(box.querySelectorAll('.ditem'), function (n) {
      n.addEventListener('click', function () {
        safe('选择药品', function () {
          drugUsed[n.dataset.id] = 1;
          if (closeAfter) UI.closeModal();
          UI.openDrug(sim || M.GAME.sim, n.dataset.id);
        });
      });
    });
  }

  UI.initDrugBar = function () {
    var inp = el('drugSearch');
    if (inp) inp.addEventListener('input', function () {
      drugSearch = inp.value.trim().toLowerCase();
      UI.renderDrugs();
    });
    UI.renderDrugs();
  };

  UI.renderDrugs = function () {
    var box = el('drugList'); if (!box) return;
    var total = (M.DRUGS || []).length;
    var shown = 0;
    if (drugSearch) {
      (M.DRUGS || []).forEach(function (D) { if (drugHay(D).indexOf(drugSearch) >= 0) shown++; });
    } else shown = total;
    var cnt = el('drugCount');
    if (cnt) cnt.textContent = drugSearch ? (shown + ' / ' + total) : (total + ' 种');
    box.innerHTML = buildDrugListHtml();
    bindDrugList(box, M.GAME.sim, false);
  };

  UI.filterDrugsBy = function (kw) {
    drugSearch = (kw || '').trim().toLowerCase();
    var inp = el('drugSearch');
    if (inp) inp.value = kw || '';
    UI.showTab('drug');
    UI.renderDrugs();
  };

  /* ================= 弹窗基础 ================= */
  var modalTick = null, modalCleanup = null;
  UI.openModal = function (html, onTick, onClose) {
    var root = el('modalRoot');
    root.innerHTML = html;
    root.classList.remove('hidden');
    modalTick = onTick || null;
    modalCleanup = onClose || null;
  };
  UI.closeModal = function () {
    var root = el('modalRoot');
    if (modalCleanup) { try { modalCleanup(); } catch (e) { } }
    root.innerHTML = '';
    root.classList.add('hidden');
    modalTick = null; modalCleanup = null;
    if (M.reset12Lead) M.reset12Lead();
    if (M.GAME && M.GAME.sim) M.GAME.sim.ecgLock = null;
  };
  UI.isModalOpen = function () { return !el('modalRoot').classList.contains('hidden'); };
  UI.tickModal = function (sim) { if (modalTick) modalTick(sim); };
  UI.bindClose = function () {
    var root = el('modalRoot');
    Array.prototype.forEach.call(root.querySelectorAll('[data-close]'), function (b) {
      b.addEventListener('click', function () { UI.closeModal(); });
    });
  };
  UI.modalHead = function (title, sub, wide) {
    return '<div class="modal-head"><h2>' + esc(title) + '</h2>' +
      (sub ? '<span class="sub">' + esc(sub) + '</span>' : '') +
      '<span class="spacer"></span><button class="close-x" data-close>✕</button></div>';
  };
  UI.modalShell = function (cls, head, body, foot) {
    return '<div class="modal ' + (cls || '') + '">' + head + '<div class="modal-body">' + body + '</div>' +
      (foot ? '<div class="modal-foot">' + foot + '</div>' : '') + '</div>';
  };

  /* ================= 给药面板 ================= */
  var EFFECT_DIR = {};
  UI.openDrug = function (sim, drugId) {
    if (!sim) sim = M.GAME.sim;
    if (!sim) return;
    var D = M.getDrug(drugId);
    if (!D) return;
    var rank = sim.rank || M.getRank('resident');
    var showHint = rank.doseHint !== false;
    var routes = (D.routes && D.routes.length) ? D.routes.slice() : ['iv'];
    var rr0 = D.rateRange;
    /* 升压药/抗心律失常药按「持续泵入」使用才符合临床：有滴注途径时默认选滴注 */
    var preferInf = !!(rr0 && routes.indexOf('iv_inf') >= 0);
    var cur = {
      route: preferInf ? 'iv_inf' : routes[0],
      dose: (D.dose && D.dose.typical) || 1,
      rate: preferInf ? (rr0.min + rr0.max) / 2 : undefined
    };
    var h = D.halfLife || 10;
    var rr = D.rateRange;

    function effChips() {
      return (D.effects || []).map(function (e) {
        var t = M.TMETA[e.t] ? M.TMETA[e.t].n : e.t;
        var up = (e.max || 0) >= 0;
        return '<span class="eff-chip' + (up ? '' : ' dn') + '">' + esc(t) + ' <b>' + (up ? '↑' : '↓') + '</b></span>';
      }).join('') || '<span class="hint">—</span>';
    }

    /* 剂量提示：普通药按“常用量 ×3”判过量；补液按血容量占比判容量过负荷 */
    function doseHintText() {
      if (D.fluid) {
        var ebv = M.bloodVolume ? M.bloodVolume(sim) : 4900;
        var lim = M.fluidLimit ? M.fluidLimit(sim, D) : 2000;
        var mlPer = D.fluidMlPer || 1;
        var typ = D.dose.typical || 500;
        var pct = Math.round(typ * mlPer / ebv * 100);
        var kg2 = Math.round((sim.patient && sim.patient.weight) || 70);
        var base = '按 ' + kg2 + ' kg 估算，循环血容量约 <b>' + (ebv / 1000).toFixed(1) + ' L</b>。' +
          '一次快速输注超过 <b>' + lim + ' ' + esc(D.unit) + '</b>（≈40% 血容量）即为<b>容量过负荷</b>：' +
          '肺水肿、氧合下降、血压不升反降。补液不按“中毒浓度”判定，也不存在固定 6 L 的阈值。';
        if (!showHint) return base;
        return base + '<br>单次 ' + typ + ' ' + esc(D.unit) + ' ≈ 血容量的 ' + pct + '%。';
      }
      return '常用范围 <b>' + D.dose.min + '–' + D.dose.max + ' ' + esc(D.unit) + '</b>，超过 ' +
        ((D.dose.max || D.dose.typical) * ((D.tox && D.tox.factor) || 3)).toFixed(2) + ' ' + esc(D.unit) + ' 将判定为<b>药物过量</b>。';
    }

    function bodyHtml() {
      var doseRow;
      if (cur.route === 'iv_inf' && rr) {
        doseRow = '<div class="field"><label>滴注速率（' + esc(rr.per || '') + '）</label><div class="dose-input">' +
          '<input id="doseIn" type="number" step="any" value="' + (cur.rate === undefined ? ((rr.min + rr.max) / 2) : cur.rate) + '">' +
          '<span class="u">' + esc((rr.per || '').split('/')[0]) + '</span></div>' +
          (showHint ? '<div class="quick-dose"><button data-r="min">下限 ' + rr.min + '</button><button data-r="mid">常用 ' + ((rr.min + rr.max) / 2).toFixed(2) + '</button><button data-r="max" class="danger">上限 ' + rr.max + '</button></div>' : '') +
          '<div class="dose-hint">持续静脉滴注，效果与速率成正比；停药后按半衰期衰减。' + (showHint ? '' : ' <b style="color:#ffb02e">本职称不显示推荐速率区间。</b>') + (D.fluid ? '<br>' + doseHintText() : '') + '</div></div>';
      } else {
        doseRow = '<div class="field"><label>单次剂量（' + esc(D.unit) + '）</label><div class="dose-input">' +
          '<input id="doseIn" type="number" step="any" value="' + cur.dose + '">' +
          '<span class="u">' + esc(D.unit) + '</span></div>' +
          (showHint && D.dose ? '<div class="quick-dose">' +
            '<button data-d="min">下限 ' + D.dose.min + '</button>' +
            '<button data-d="typ">常用 ' + D.dose.typical + '</button>' +
            '<button data-d="max">上限 ' + D.dose.max + '</button>' +
            '<button data-d="x2" class="danger">2× 上限 ' + (D.dose.max * 2) + '</button>' +
            '</div>' +
            '<div class="dose-hint">' + doseHintText() + '</div>'
            : '<div class="dose-hint"><b style="color:#ffb02e">本职称不显示推荐剂量区间</b>，请自行判断剂量（可在指南「急救药物速查」中查阅常用量）。</div>') +
          '</div>';
      }
      var allergyWarn = (D.allergy && D.allergy.p > 0) ?
        '<div class="dd-warn"><b>过敏风险 ' + (D.allergy.p * 100).toFixed(1) + '%</b>：' + esc(D.allergy.msg || '') +
        (sim.patient.allergy && sim.patient.allergy.id === D.id ? '<br><b style="color:#ff3d5a">⚠ 该患者有明确本药过敏史，给药将极大可能诱发过敏性休克！</b>' : '') + '</div>' : '';
      var stockHtml = '';
      if (M.Clinic && M.Clinic.isOn()) {
        var meta = M.stockMeta(D);
        var stk = M.Clinic.stockOf(D.id);
        stockHtml = '<div class="dd-sec"><h4>药房库存</h4><div class="dd-note">' +
          '<b style="color:' + (stk < 5 ? '#ff9aa8' : '#7ff0b0') + '">' + stk + ' 份</b>（每份 ' + meta.per + ' ' + esc(D.unit || '') +
          '，单价 ¥' + meta.price + '）<br>每次消耗 = 输入量 / 每份量，向上取整。库存不足时请到「药房 / 库存」采购（1–5 分钟送达）。</div></div>';
      }
      var toxWarn;
      if (D.tox && D.fluid) {
        var fLim = M.fluidLimit ? M.fluidLimit(sim, D) : 2000;
        var fEbv = M.bloodVolume ? M.bloodVolume(sim) : 4900;
        toxWarn = '<div class="dd-warn"><b>过量后果</b>：' + esc(D.tox.msg || '') +
          '。<br>补液按血容量判定（<b>' + (fEbv / 1000).toFixed(1) + ' L</b>）：超过约 <b>' + fLim + ' ' + esc(D.unit) +
          '</b>（≈40%）开始肺水肿；超过 1 倍血容量可致急性心衰、低氧与停搏。' +
          '<br><b style="color:#ff8fa0">不会因为“浓度过高”诱发室颤——那是药物过量的判定，不适用于补液。</b></div>';
      } else if (D.tox) {
        toxWarn = '<div class="dd-warn"><b>过量表现</b>：' + esc(D.tox.msg || '') + '（超过常用量 ' + (D.tox.factor || 3) + ' 倍即进入中毒）' +
          '<br><b style="color:#ff8fa0">超过 6 倍中毒阈值会出现恶性心律失常，12 倍以上可致心脏停搏。</b></div>';
      } else {
        toxWarn = '';
      }

      /* 靶器官 */
      var orgSet = {};
      ((D.effects || []).concat((D.tox && D.tox.effects) || [])).forEach(function (e) {
        var o = M.organFor ? M.organFor(e.t) : '';
        if (o) orgSet[o] = 1;
      });
      var orgChips = Object.keys(orgSet).map(function (o) {
        return '<span class="eff-chip org">' + esc((M.ORGAN_NAME && M.ORGAN_NAME[o]) || o) + '</span>';
      }).join('') || '<span class="hint">—</span>';

      return '<div class="drug-detail"><div class="dd-left">' +
        '<h3>' + esc(D.name) + '</h3><div class="dd-alias">' + esc(D.alias || D.id) + '</div>' +
        '<div class="dd-cls">' + esc(D.cls || '') + '</div>' +
        '<div class="dd-sec"><h4>药理作用（靶点）</h4>' + effChips() + '</div>' +
        '<div class="dd-sec"><h4>靶器官（过量损伤部位）</h4>' + orgChips + '</div>' +
        '<div class="dd-sec"><h4>药代动力学</h4><div class="dd-note">半衰期 <b>' + h + ' 分钟</b>｜起效 ' + (D.onset || '—') + ' min｜达峰 ' + (D.peak || '—') + ' min｜维持 ' + (D.dur || '—') + ' min<br>代谢：' + esc(D.metabol || '—') + '</div></div>' +
        (D.note ? '<div class="dd-sec"><h4>临床要点</h4><div class="dd-note">' + esc(D.note) + '</div></div>' : '') +
        stockHtml + toxWarn + allergyWarn +
        '</div><div class="dd-right">' +
        '<div class="field"><label>给药途径</label><div class="route-pills">' +
        Object.keys(M.ROUTE_NAME).map(function (r) {
          var has = routes.indexOf(r) >= 0;
          return '<div class="route-pill' + (has ? (r === cur.route ? ' on' : '') : ' dis') + '" data-route="' + r + '">' + M.ROUTE_NAME[r] + (has ? '' : ' ✕') + '</div>';
        }).join('') +
        '</div></div>' + doseRow +
        '<div class="pk-preview" id="pkPrev"></div>' +
        '<div style="display:flex;gap:8px;margin-top:14px"><button class="btn ghost" data-close style="flex:0 0 auto">取消</button>' +
        '<button class="btn primary" data-give style="flex:1">开具并执行医嘱</button></div>' +
        (sim.airwayMode !== undefined ? '' : '') +
        '</div></div>';
    }

    function pkText() {
      var bio = M.ROUTE_BIO[cur.route] || 0.5;
      var dose = cur.route === 'iv_inf' ? (cur.rate || 1) : (cur.dose || 0);
      if (D.fluid) {
        var ebv3 = M.bloodVolume ? M.bloodVolume(sim) : 4900;
        var lim3 = M.fluidLimit ? M.fluidLimit(sim, D) : 2000;
        var ml3 = dose * (D.fluidMlPer || 1);
        var pct3 = ebv3 > 0 ? ml3 / ebv3 * 100 : 0;
        var cls3 = pct3 > 40 ? '#ff6b81' : pct3 > 25 ? '#ffb02e' : '#25e3c6';
        var load3 = M.fluidLoad ? M.fluidLoad(sim) : 0;
        var isInf3 = cur.route === 'iv_inf';
        return (isInf3 ? '滴注速率 <b>' + Math.round(ml3) + ' ml/h</b> ≈ 每小时 ' : '输入量 <b>' + Math.round(ml3) + ' ml</b> ≈ 血容量的 <b>') +
          (isInf3 ? '</b>血容量的 <b>' : '') + pct3.toFixed(0) + '%</b>（估算 ' +
          (ebv3 / 1000).toFixed(1) + ' L）<br>' +
          '<span style="color:' + cls3 + '">' + (pct3 > 40 ? '⚠ 已超过容量过负荷阈值（≈40% 血容量）' :
            pct3 > 25 ? '接近单次补液上限，注意肺部啰音' : '剂量合适') + '</span>' +
          '<br>容量过负荷阈值 <b>' + lim3 + ' ' + esc(D.unit) + '</b>｜近 2 小时已补 <b>' + load3 + ' ml</b>';
      }
      var rel;
      if (cur.route === 'iv_inf' && rr) rel = dose / (((rr.min + rr.max) / 2) || 1);
      else rel = (dose * bio) / ((D.dose && D.dose.typical) || 1);
      if (!showHint) {
        return '预计效应室相对浓度 <b>' + rel.toFixed(2) + '</b><br>' +
          '<span style="color:#7d93a6">本职称不显示毒性阈值判断</span>' +
          '<br>起效约 <b>' + (M.drugOnset ? M.drugOnset(D, cur.route, cur.route === 'iv_inf' ? 0 : cur.dose) : (D.onset || 0.2) * 60).toFixed(0) + ' 秒</b>｜生物利用度 ' + Math.round(bio * 100) + '%';
      }
      var tf = (D.tox && D.tox.factor) || 3;
      var pct = rel / tf * 100;
      var cls = pct > 100 ? '#ff6b81' : pct > 70 ? '#ffb02e' : '#25e3c6';
      return '预计效应室相对浓度 <b>' + rel.toFixed(2) + '</b>（毒性阈值 ' + tf.toFixed(2) + '）<br>' +
        '<span style="color:' + cls + '">' + (pct > 100 ? '⚠ 已达毒性剂量范围！' : pct > 70 ? '接近上限，谨慎观察' : '剂量安全') + '</span>' +
        '<br>起效约 <b>' + (M.drugOnset ? M.drugOnset(D, cur.route, cur.route === 'iv_inf' ? 0 : cur.dose) : (D.onset || 0.2) * 60).toFixed(0) + ' 秒</b>｜生物利用度 ' + Math.round(bio * 100) + '%';
    }

    function full() {
      return UI.modalShell('', UI.modalHead('开具医嘱', '剂量 / 途径 / 药代动力学预览'), bodyHtml());
    }

    UI.openModal(full(), function (sim2) {
      var p = el('pkPrev'); if (p) p.innerHTML = pkText();
    });
    UI.bindClose();

    function rebind() {
      var root = el('modalRoot');
      Array.prototype.forEach.call(root.querySelectorAll('[data-route]'), function (x) {
        if (x.classList.contains('dis')) return;
        x.addEventListener('click', function () {
          cur.route = x.dataset.route;
          if (cur.route === 'iv_inf' && rr) cur.rate = (rr.min + rr.max) / 2;
          refresh();
        });
      });
      Array.prototype.forEach.call(root.querySelectorAll('[data-d]'), function (b) {
        b.addEventListener('click', function () {
          var k = b.dataset.d;
          cur.dose = k === 'min' ? D.dose.min : k === 'typ' ? D.dose.typical : k === 'max' ? D.dose.max : D.dose.max * 2;
          refresh();
        });
      });
      Array.prototype.forEach.call(root.querySelectorAll('[data-r]'), function (b) {
        b.addEventListener('click', function () {
          var k = b.dataset.r;
          cur.rate = k === 'min' ? rr.min : k === 'mid' ? (rr.min + rr.max) / 2 : rr.max;
          refresh();
        });
      });
      var inp = el('doseIn');
      if (inp) inp.addEventListener('input', function () {
        var val = parseFloat(inp.value);
        if (isNaN(val)) return;
        if (cur.route === 'iv_inf') cur.rate = val; else cur.dose = val;
      });
      var g = root.querySelector('[data-give]');
      if (g) g.addEventListener('click', function () {
        var inp2 = el('doseIn');
        var val = parseFloat(inp2 ? inp2.value : '0');
        if (isNaN(val) || val <= 0) { UI.toast('warn', '剂量无效', '请输入大于 0 的剂量'); return; }
        var d = cur.route === 'iv_inf' ? val : val;
        if (cur.route === 'iv_inf') { M.give(sim, D.id, d, 'iv_inf'); }
        else { M.give(sim, D.id, d, cur.route); }
        UI.closeModal();
        UI.renderDrugs();
        if (M.GAME.onDrugGiven) M.GAME.onDrugGiven(D);
      });
      root.querySelectorAll('[data-close]').forEach(function (b) {
        if (!b.__bound) { b.__bound = 1; b.addEventListener('click', function () { UI.closeModal(); }); }
      });
    }
    function refresh() {
      el('modalRoot').innerHTML = full();
      UI.bindClose();
      rebind();
    }
    rebind();
  };

  /* ================= 12 导联 ================= */
  UI.open12Lead = function (sim) {
    if (M.reset12Lead) M.reset12Lead();
    var order = ['I', 'aVR', 'V1', 'V4', 'II', 'aVL', 'V2', 'V5', 'III', 'aVF', 'V3', 'V6'];
    var byK = {};
    M.LEADS.forEach(function (L) { byK[L.k] = L; });
    var cells = order.map(function (k) {
      var L = byK[k];
      return '<div class="lead-cell"><div class="ln">' + L.k + '</div><div class="lv" data-lv="' + L.k + '"></div><canvas data-lead="' + L.k + '"></canvas></div>';
    }).join('');
    var head = UI.modalHead('12 导联心电图', '25 mm/s · 10 mm/mV · 4 秒/导联 + 10 秒 II 节律条', true);
    var foot = '<div class="ecg12-foot" id="ecgFoot"></div>';
    var presets = [['normal','窦性'],['sinus_tach','窦速'],['svt','室上速'],['afib','房颤'],['flutter','房扑'],['block2','二度 AVB'],['block3','三度 AVB'],['vt','室速'],['stemi_ant','前壁 STEMI'],['stemi_inf','下壁 STEMI'],['nstemi','NSTEMI']];
    var presetHtml = '<div class="ecg-presets">' + presets.map(function (p) { return '<button data-ecg="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div>';
    var body = '<div class="ecg12">' + cells + '</div>' +
      '<div class="rhythm-strip"><div class="ln">II · 10 s 节律条</div><canvas id="ecgRhythm"></canvas></div>' + presetHtml + foot;
    UI.openModal(UI.modalShell('wide', head, body), function (sim2) {
      Array.prototype.forEach.call(el('modalRoot').querySelectorAll('canvas[data-lead]'), function (c) {
        M.draw12Lead(c, sim2, c.dataset.lead, ['I', 'II', 'III'].indexOf(c.dataset.lead) >= 0);
      });
      var rc = el('ecgRhythm');
      if (rc && M.drawRhythm) M.drawRhythm(rc, sim2, 'II', 10);
      var v = sim2.v;
      var met = M.ecgMetrics ? M.ecgMetrics(sim2) : null;
      /* 心脏停搏 / 室颤：测不出来的间期一律显示 —，绝不显示假数值 */
      var noBeat = !!(met && met.noBeat);
      var axisTxt = (met && met.axis !== null && met.axis !== undefined)
        ? (met.axis + '°（' + (met.axis > 90 ? '右偏' : met.axis < -30 ? '左偏' : '正常') + '）') : '—';
      var f = el('ecgFoot');
      if (f) f.innerHTML =
        '<span>心律 <b>' + (M.RHY_NAME[sim2.rhythm] || '') + '</b></span>' +
        '<span>心率 <b>' + (noBeat ? ('0 bpm（' + (sim2.rhythm === 'asystole' ? '无电活动' : '无有效心搏') + '）') : ((met ? met.hr : Math.round(v.hr)) + ' bpm')) + '</b></span>' +
        '<span>PR <b>' + (met && met.pr ? met.pr + ' ms' : '—') + '</b></span>' +
        '<span>QRS <b>' + (met && met.qrs ? met.qrs + ' ms' : '—') + '</b></span>' +
        '<span>QTc <b>' + (met && met.qtc ? met.qtc + ' ms' : '—') + '</b></span>' +
        '<span>电轴 <b>' + axisTxt + '</b></span>' +
        '<span>血钾 <b>' + v.k.toFixed(1) + '</b></span>' +
        '<span>记录 <b>' + (sim2.t - (UI.__ecg12T0 === undefined ? sim2.t : UI.__ecg12T0)).toFixed(1) + ' s</b></span>' +
        '<div class="ecg-read">' + esc(M.ecgRead ? M.ecgRead(sim2) : '') + '</div>';
    });
    var root = el('modalRoot');
    Array.prototype.forEach.call(root.querySelectorAll('[data-ecg]'), function (b) {
      b.addEventListener('click', function () {
        var p = b.dataset.ecg;
        sim.ecgSTDepress = false;
        sim.ecgRegion = '';
        sim.ecgLock = null;
        sim.v.coronary = 100;
        if (p === 'normal') { sim.v.hr = 75; M.setRhythm(sim, 'sinus'); sim.ecgLock = null; }
        else if (p === 'sinus_tach') { sim.v.hr = 130; M.setRhythm(sim, 'sinus_tach'); }
        else if (p === 'svt') { sim.v.hr = 180; M.setRhythm(sim, 'svt'); sim.ecgLock = { rhythm: 'svt', hr: 180 }; }
        else if (p === 'afib') { sim.v.hr = 130; M.setRhythm(sim, 'afib'); sim.ecgLock = { rhythm: 'afib', hr: 130 }; }
        else if (p === 'flutter') { sim.v.hr = 150; M.setRhythm(sim, 'flutter'); sim.ecgLock = { rhythm: 'flutter', hr: 150 }; }
        else if (p === 'block2') { sim.v.hr = 75; sim.v.avconduction = 35; M.setRhythm(sim, 'block2'); sim.ecgLock = { rhythm: 'block2', hr: 75, av: 35 }; }
        else if (p === 'block3') { sim.v.hr = 40; sim.v.avconduction = 18; M.setRhythm(sim, 'block3'); sim.ecgLock = { rhythm: 'block3', hr: 40, av: 18 }; }
        else if (p === 'vt') { sim.v.hr = 170; M.setRhythm(sim, 'vt'); sim.ecgLock = { rhythm: 'vt', hr: 170 }; }
        else if (p === 'stemi_ant') { sim.ecgRegion = 'anterior'; sim.v.coronary = 15; sim.v.hr = 90; M.setRhythm(sim, 'sinus'); sim.ecgLock = { rhythm: 'sinus', hr: 90, coronary: 15 }; }
        else if (p === 'stemi_inf') { sim.ecgRegion = 'inferior'; sim.v.coronary = 15; sim.v.hr = 85; M.setRhythm(sim, 'sinus'); sim.ecgLock = { rhythm: 'sinus', hr: 85, coronary: 15 }; }
        else if (p === 'nstemi') { sim.ecgSTDepress = true; sim.v.coronary = 45; sim.v.hr = 85; M.setRhythm(sim, 'sinus'); sim.ecgLock = { rhythm: 'sinus', hr: 85, coronary: 45 }; }
        if (M.reset12Lead) M.reset12Lead();
        if (UI.tickModal) UI.tickModal(sim);
      });
    });
    var hm = String(location.hash || '').match(/rhythm=([a-z0-9_]+)/);
    if (hm && root.querySelector('[data-ecg="' + hm[1] + '"]')) setTimeout(function () { root.querySelector('[data-ecg="' + hm[1] + '"]').click(); }, 60);
    UI.__ecg12T0 = sim.t;
    UI.bindClose();
  };

  /* ================= 手术室 ================= */
  var surgSel = { site: null, proc: null };
  UI.resetSurgery = function () { surgSel = { site: null, proc: null }; };

  /* 给任意容器里的「进入手术室」按钮绑定跳转（可预选部位与术式） */
  function bindSurgButtons(box, sim) {
    if (!box) return;
    Array.prototype.forEach.call(box.querySelectorAll('[data-surg]'), function (b) {
      if (b.__sb) return;
      b.__sb = 1;
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        safe('手术室', function () {
          var parts = String(b.dataset.surg || '').split('|');
          UI.openSurgery(sim || M.GAME.sim, { site: parts[0] || null, proc: parts[1] || null });
        });
      });
    });
  }
  UI.bindSurgButtons = bindSurgButtons;

  function surgBtn(site, proc, label) {
    return '<button class="btn-surg" data-surg="' + esc(site || '') + '|' + esc(proc || '') + '">' +
      esc(label || '进入手术室') + '</button>';
  }

  /* 手术室里的「并发症 / 术后问题」卡片：把处理方法直接摆出来，按钮一点就能执行。
     之前这些只出现在日志和问题清单里，回到手术室就找不到该做什么。 */
  function postopPanelHtml(sim) {
    if (!sim || !M.problems) return '';
    var list = M.problems(sim).filter(function (p) { return String(p.id).indexOf('postop:') === 0; });
    if (!list.length) return '';
    return '<div class="comp-card" style="margin-bottom:10px"><h5><span>⚠ 需处理的并发症（' + list.length + '）</span>' +
      '<span class="cwin">处理后自动解除</span></h5>' +
      list.map(function (p, pi) {
        return '<div class="cm"><b>' + esc(p.name) + '</b>　' + esc(p.hint) + '</div>' +
          '<div class="fix-grid" style="margin-bottom:10px">' + p.acts.map(function (a, ai) {
            return '<button class="fix-btn" data-popb="' + pi + ':' + ai + '">' + esc(a.n) + '</button>';
          }).join('') + '</div>';
      }).join('') + '</div>';
  }
  UI.postopPanelHtml = postopPanelHtml;

  function bindPostopPanel(box, sim) {
    if (!box) return;
    var list = M.problems ? M.problems(sim).filter(function (p) { return String(p.id).indexOf('postop:') === 0; }) : [];
    Array.prototype.forEach.call(box.querySelectorAll('[data-popb]'), function (b) {
      if (b.__pb2) return;
      b.__pb2 = 1;
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var parts = String(b.dataset.popb).split(':');
        var p = list[parseInt(parts[0], 10)];
        if (!p) return;
        safe('并发症处置', function () { runProblemAction(sim, p.acts[parseInt(parts[1], 10)]); });
      });
    });
  }

  /* 只在「待处理集合」变化时重绘，避免每帧重建 DOM 把点击吃掉 */
  function refreshPostopPanel(sim) {
    var box = el('postopBox');
    if (!box) return;
    var sig = Object.keys(sim.postopActive || {}).sort().join(',');
    if (box.dataset.sig === sig) return;
    box.dataset.sig = sig;
    box.innerHTML = postopPanelHtml(sim);
    bindPostopPanel(box, sim);
  }
  UI.refreshPostopPanel = refreshPostopPanel;

  UI.openSurgery = function (sim, preset) {
    if (!sim) sim = M.GAME.sim;
    if (!sim) return;
    /* 只有「正在进行」的手术才显示术中界面；已完成/已终止的旧手术不应再挡住新手术 */
    var prev = sim.surgery && !sim.surgery.active ? sim.surgery : null;
    if (!sim.surgery || !sim.surgery.active) {
      if (preset && preset.site) {
        surgSel.site = M.findSite(preset.site);
        surgSel.proc = preset.proc ? M.findProc(preset.proc) : null;
        /* 推荐术式若不在该部位可用列表内，只预选部位并提示 */
        if (surgSel.site && surgSel.proc && (surgSel.site.procs || []).indexOf(surgSel.proc.id) < 0) {
          surgSel.proc = null;
        }
      } else if (!surgSel.site) {
        surgSel = { site: null, proc: null };
      }
      var sites = M.SURGERY_SITES || [];
      var prevNote = '';
      if (prev) {
        prevNote = '<div class="surg-prev">上一台手术：<b>' + esc(prev.proc.name) + ' @ ' + esc(prev.site.name) + '</b>' +
          (prev.status === 'aborted' ? '<span style="color:#ffb02e">　已终止（病灶未处理，可重新规划）</span>' :
            '<span style="color:#7ff0b0">　已完成</span>') + '</div>';
      }
      var body = prevNote + '<div id="postopBox">' + postopPanelHtml(sim) + '</div>' + '<div class="surg-wrap">' +
        '<div class="surg-col"><h4>手术部位（' + sites.length + '）</h4><div class="surg-list" id="surgSites"></div></div>' +
        '<div class="surg-col surg-main" id="surgMain"></div>' +
        '<div class="surg-col"><h4>术中监护</h4><div class="surg-list" id="surgMonitor"></div></div>' +
        '</div>';
      var foot = '<button class="btn primary" data-start disabled>开始手术</button>' +
        '<button class="btn ghost" data-close>返回</button>';
      UI.openModal(UI.modalShell('wide', UI.modalHead('手术室 · 术前规划', '选择部位与术式，评估风险'), body, foot), function (sim2) {
        var m = el('surgMonitor');
        if (m && !m.dataset.filled) {
          m.dataset.filled = '1';
          m.innerHTML = ['hr', 'sbp', 'spo2', 'k', 'hb', 'temp', 'lactate', 'plt'].map(function (k) {
            return '<div class="site-item"><span>' + M.TMETA[k].n + '</span><span class="risk" data-mv="' + k + '">--</span></div>';
          }).join('');
        }
        if (m) Array.prototype.forEach.call(m.querySelectorAll('[data-mv]'), function (x) {
          var val = sim2.v[x.dataset.mv];
          x.textContent = (M.TMETA[x.dataset.mv] && M.TMETA[x.dataset.mv].dec ? val.toFixed(M.TMETA[x.dataset.mv].dec) : Math.round(val)) + ' ' + (M.TMETA[x.dataset.mv] ? M.TMETA[x.dataset.mv].u : '');
        });
        refreshPostopPanel(sim2);
      });
      renderSiteList(sim);
      bindPostopPanel(el('modalRoot'), sim);
      UI.bindClose();
      return;
    }
    /* 术中界面 */
    UI.openModal(UI.modalShell('wide', UI.modalHead('手术进行中', '术中实时监护与干预'), surgeryHtml(sim)), function (sim2) {
      refreshSurgery(sim2);
    });
    bindSurgery(sim);
    UI.bindClose();
  };

  function renderSiteList(sim) {
    var box = el('surgSites'); if (!box) return;
    var sites = M.SURGERY_SITES || [];
    /* 本病例推荐的部位与术式 */
    var recSite = null, recProc = null;
    var dd = sim && sim.disease ? (sim.disease.def.treat || []) : [];
    for (var i = 0; i < dd.length; i++) {
      if (dd[i].type === 'surgery' && dd[i].need) { recSite = dd[i].site; recProc = dd[i].proc; break; }
    }
    box.innerHTML = sites.map(function (s) {
      var on = (surgSel.site && surgSel.site.id === s.id) ? ' on' : '';
      var star = (recSite === s.id) ? '<span class="site-star" title="本病例推荐部位">★</span>' : '';
      return '<div class="site-item' + on + '" data-site="' + esc(s.id) + '"><span>' + star + esc(s.name) + '</span><span class="risk">险 ' + (s.risk || 3) + '</span></div>';
    }).join('');
    Array.prototype.forEach.call(box.querySelectorAll('[data-site]'), function (x) {
      x.addEventListener('click', function () {
        surgSel.site = M.findSite(x.dataset.site);
        surgSel.proc = null;
        Array.prototype.forEach.call(box.children, function (c) { c.classList.toggle('on', c === x); });
        renderProcList(sim);
      });
    });
    if (surgSel.site) {
      Array.prototype.forEach.call(box.children, function (c) {
        c.classList.toggle('on', c.dataset.site === surgSel.site.id);
      });
    }
    renderProcList(sim);
  }

  function renderProcList(sim) {
    var main = el('surgMain'); if (!main) return;
    if (!surgSel.site) { main.innerHTML = '<div class="empty" style="margin:auto">← 请先选择手术部位</div>'; return; }
    var s = surgSel.site;
    var procs = (s.procs || []).map(M.findProc).filter(Boolean);
    var dd = sim && sim.disease ? (sim.disease.def.treat || []) : [];
    var recProc = null;
    for (var i = 0; i < dd.length; i++) {
      if (dd[i].type === 'surgery' && dd[i].need && dd[i].site === s.id) { recProc = dd[i].proc; break; }
    }
    var html = '<div class="plan-card"><div class="pl">已选部位</div><div class="pv">' + esc(s.name) + '</div>' +
      '<div style="font-size:11px;color:#7d93a6;margin-top:5px">出血倾向 ' + s.bleed + '｜感染风险 ' + s.infect + '｜总体风险 ' + s.risk + '/5</div></div>';
    html += '<div style="font-size:10.5px;letter-spacing:2px;color:#7d93a6">可用术式（' + procs.length + '）' +
      (recProc ? '<span style="color:#7ff0b0;letter-spacing:0">　★ 本病例推荐</span>' : '') + '</div>';
    html += '<div>' + procs.map(function (p) {
      var on = (surgSel.proc && surgSel.proc.id === p.id) ? ' on' : '';
      var star = (recProc === p.id) ? '<span class="site-star" title="本病例推荐术式">★</span> ' : '';
      return '<div class="proc-item' + on + '" data-proc="' + esc(p.id) + '"><span>' + star + esc(p.name) + '</span><span class="risk">难度 ' + p.difficulty + ' · ' + Math.round((p.durSec || 900) / 60) + 'min</span></div>';
    }).join('') + '</div>';
    if (surgSel.proc) {
      var p2 = surgSel.proc;
      html += '<div class="plan-card"><div class="pl">术式说明</div><div class="pv">' + esc(p2.name) + '</div>' +
        '<div style="font-size:11.5px;color:#a9c0cf;margin-top:6px;line-height:1.7">' + esc(p2.desc || '') + '</div>' +
        '<div style="font-size:11px;color:#7d93a6;margin-top:7px">步骤：' + (p2.phases || []).map(esc).join(' → ') + '</div></div>';
      html += '<div style="font-size:10.5px;color:#ffb02e;line-height:1.7">可能并发症：' +
        M.complicationsFor(s, p2).map(function (c) { return esc(c.name); }).join('、') + '</div>';
    }
    main.innerHTML = html;
    Array.prototype.forEach.call(main.querySelectorAll('[data-proc]'), function (x) {
      x.addEventListener('click', function () {
        surgSel.proc = M.findProc(x.dataset.proc);
        renderProcList(sim);
      });
    });
    var st = el('modalRoot').querySelector('[data-start]');
    if (st) {
      st.disabled = !(surgSel.site && surgSel.proc);
      if (!st.__b) {
        st.__b = 1;
        st.addEventListener('click', function () {
          if (!surgSel.site || !surgSel.proc) return;
          M.startSurgery(sim, surgSel.site.id, surgSel.proc.id);
          UI.closeModal();
          UI.openSurgery(sim);
        });
      }
    }
  }

  function surgeryHtml(sim) {
    var s = sim.surgery;
    var phases = s.phases.map(function (p, i) {
      var cls = p.done ? 'done' : (i === s.idx && s.active ? 'now' : '');
      return '<div class="phase ' + cls + '">' + esc(p.name) + '</div>';
    }).join('');
    return '<div class="surg-wrap">' +
      '<div class="surg-col"><h4>手术方案</h4><div class="surg-list">' +
      '<div class="plan-card"><div class="pl">术式</div><div class="pv">' + esc(s.proc.name) + '</div></div>' +
      '<div class="plan-card" style="margin-top:8px"><div class="pl">部位</div><div class="pv">' + esc(s.site.name) + '</div></div>' +
      '<div class="plan-card" style="margin-top:8px"><div class="pl">已历时</div><div class="pv" data-elapsed>' + M.fmtT(s.t) + '</div></div>' +
      '</div></div>' +
      '<div class="surg-col surg-main">' +
      '<div style="font-size:10.5px;letter-spacing:2px;color:#7d93a6">手术进程</div>' +
      '<div class="surg-track">' + phases + '</div>' +
      '<div style="font-size:10.5px;letter-spacing:2px;color:#7d93a6;margin-top:6px">术中事件</div>' +
      '<div id="surgLog"></div>' +
      '</div>' +
      '<div class="surg-col"><h4>术中监护</h4><div class="surg-list" id="surgVitals"></div>' +
      '<div id="postopBox" style="padding:0 8px"></div>' +
      '<div id="compBox" style="padding:0 8px 8px"></div>' +
      '<div style="padding:0 8px 8px;display:flex;flex-direction:column;gap:6px">' +
      '<button class="btn warn" data-speedup>加快手术进度（×2.2）</button>' +
      '<button class="btn" data-drug>术中给药 / 医嘱</button>' +
      '<button class="btn danger" data-abort>终止手术</button>' +
      '</div></div></div>';
  }

  function refreshSurgery(sim) {
    var s = sim.surgery; if (!s) return;
    var root = el('modalRoot');
    var v = sim.v;
    refreshPostopPanel(sim);
    var vBox = el('surgVitals');
    if (vBox) {
      if (!vBox.dataset.filled) {
        vBox.dataset.filled = '1';
        vBox.innerHTML = ['hr', 'sbp', 'spo2', 'k', 'hb', 'temp', 'lactate', 'plt', 'gcs', 'volume', 'anaphylaxis', 'pain'].map(function (k) {
          return '<div class="sv-card" data-sc="' + k + '"><div class="sl">' + M.TMETA[k].n + '</div><div class="sv">--</div></div>';
        }).join('');
      }
      Array.prototype.forEach.call(vBox.querySelectorAll('[data-sc]'), function (c) {
        var k = c.dataset.sc, val = k === 'sbp' ? v.sbp : v[k];
        var t = M.TMETA[k];
        var txt = t.dec ? val.toFixed(t.dec) : Math.round(val);
        c.querySelector('.sv').textContent = txt;
        var st = stateOf(k, val);
        c.classList.toggle('warn', st === 'warn'); c.classList.toggle('crit', st === 'crit');
      });
    }
    var el2 = root.querySelector('[data-elapsed]');
    if (el2) el2.textContent = M.fmtT(s.t);
    var track = root.querySelector('.surg-track');
    if (track) {
      Array.prototype.forEach.call(track.children, function (p, i) {
        p.className = 'phase ' + (s.phases[i].done ? 'done' : (i === s.idx && s.active ? 'now' : ''));
      });
    }
    var lg = el('surgLog');
    if (lg) {
      lg.innerHTML = s.log.slice(-14).reverse().map(function (l) {
        return '<div class="surg-log ' + l.type + '">[' + M.fmtT(l.t) + '] ' + esc(l.text) + '</div>';
      }).join('') || '<div class="empty">手术平稳进行中…</div>';
    }
    var cb = el('compBox');
    if (cb) {
      if (s.comp && !s.compResolved) {
        var win = s.comp.window || 45;
        var left = Math.max(0, win - s.compT);
        cb.innerHTML = '<div class="comp-card"><h5><span>⚠ ' + esc(s.comp.name) + '</span><span class="cwin">' + left.toFixed(0) + 's</span></h5>' +
          '<div class="cm">' + esc(s.comp.msg) + '</div>' +
          '<div class="fix-grid">' + s.compOptions.map(function (o, i) {
            return '<button class="fix-btn" data-fix="' + i + '">' + esc(o.text) + '</button>';
          }).join('') + '</div></div>';
        Array.prototype.forEach.call(cb.querySelectorAll('[data-fix]'), function (b) {
          b.addEventListener('click', function () {
            M.resolveComplication(sim, parseInt(b.dataset.fix, 10));
            refreshSurgery(sim);
          });
        });
      } else if (s.comp && s.compResolved) {
        cb.innerHTML = '<div class="surg-log ' + (s.compResolved === 'ok' ? 'good' : 'crit') + '">' +
          (s.compResolved === 'ok' ? '✓ ' + esc(s.comp.name) + ' 已控制' : '✗ ' + esc(s.comp.name) + ' 处理失败/超时') + '</div>';
      } else cb.innerHTML = '';
    }
    if (!s.active && s.done) {
      var foot = root.querySelector('.modal-foot');
      if (!foot) {
        var box = root.querySelector('.modal');
        var f = document.createElement('div');
        f.className = 'modal-foot';
        f.innerHTML = '<button class="btn primary" data-close>手术结束 · 返回病房</button>';
        box.appendChild(f);
        UI.bindClose();
      }
    }
  }

  function bindSurgery(sim) {
    var root = el('modalRoot');
    var b1 = root.querySelector('[data-speedup]');
    if (b1) b1.addEventListener('click', function () { M.surgeryStep(sim); UI.toast('good', '加快进度', '手术进程加速'); });
    var b2 = root.querySelector('[data-drug]');
    if (b2) b2.addEventListener('click', function () { UI.openDrugPicker(sim); });
    var b3 = root.querySelector('[data-abort]');
    if (b3) b3.addEventListener('click', function () {
      M.cancelSurgery(sim);
      UI.toast('warn', '手术终止', '病灶未处理，病情将继续进展');
      UI.closeModal();
    });
  }

  UI.openDrugPicker = function (sim) {
    var body = '<div style="font-size:11.5px;color:#7d93a6;margin-bottom:10px">按功能大类选择药品，设置剂量与途径；给药完毕自动返回手术台。</div>' +
      '<div class="drug-picker-list" id="pickerList">' + buildDrugListHtml('') + '</div>';
    UI.openModal(UI.modalShell('narrow', UI.modalHead('术中给药', '按功能大类选择药品'), body), null, function () {
      var s = sim.surgery;
      if (s && s.active) {
        setTimeout(function () { if (!UI.isModalOpen()) UI.openSurgery(sim); }, 30);
      }
    });
    UI.bindClose();
    bindDrugList(el('pickerList'), sim, true);
  };

  /* ================= 输血 ================= */
  UI.openTransfuse = function (sim) {
    var p = sim.patient;
    var units = ['prbc', 'whole', 'ffp', 'plt', 'albumin'];
    var uname = { prbc: '浓缩红细胞', whole: '全血', ffp: '新鲜冰冻血浆', plt: '血小板', albumin: '白蛋白' };
    var body = '<div style="font-size:12px;color:#a9c0cf;line-height:1.9">' +
      '受血者：<b style="color:#fff">' + esc(p.name) + '</b>　血型：<b style="color:#ff8fa0">' + p.abo + p.rh + '</b>' +
      (p.flags.bleed ? '　<span style="color:#ffb02e">长期抗凝，出血风险高</span>' : '') + '</div>' +
      '<div style="margin-top:14px;font-size:10.5px;letter-spacing:2px;color:#7d93a6">① 选择血液制品</div>' +
      '<div class="route-pills" id="prodPills" style="margin:8px 0">' +
      units.map(function (u, i) { return '<div class="route-pill' + (i === 0 ? ' on' : '') + '" data-prod="' + u + '">' + uname[u] + '</div>'; }).join('') +
      '</div>' +
      '<div style="font-size:10.5px;letter-spacing:2px;color:#7d93a6;margin-top:10px">② 选择供血血型（ABO / Rh）</div>' +
      '<div class="blood-grid" id="bloodGrid">' +
      ['A', 'B', 'O', 'AB'].map(function (a) {
        return ['+', '-'].map(function (r) {
          return '<div class="blood-btn" data-abo="' + a + '" data-rh="' + r + '"><div class="bt">' + a + r + '</div><div class="bd">供血者</div></div>';
        }).join('');
      }).join('') + '</div>' +
      '<div id="crossResult" style="font-size:11.5px;line-height:1.8;color:#7d93a6">选择血型后可直接输注；也可先做交叉配血试验确认相容性。</div>' +
      '<div style="font-size:10.5px;letter-spacing:2px;color:#7d93a6;margin-top:12px">③ 输血量</div>' +
      '<div class="route-pills" id="unitPills" style="margin:8px 0">' +
      [1, 2, 3, 5].map(function (u, i) { return '<div class="route-pill' + (i === 0 ? ' on' : '') + '" data-units="' + u + '">' + u + ' U</div>'; }).join('') +
      '</div>' +
      '<div id="unitHint" style="font-size:11px;color:#7d93a6;margin-bottom:6px">1 U 浓缩红细胞约提升 Hb 2 g/dL；按目标血红蛋白选择，心功能不全者少量多次。</div>' +
      '<div style="display:flex;gap:8px;margin-top:14px"><button class="btn" data-cross>交叉配血试验</button>' +
      '<button class="btn ghost" data-close>返回</button></div>';
    UI.openModal(UI.modalShell('narrow', UI.modalHead('输血', '血型相容性决定生死'), body));
    UI.bindClose();
    var prod = 'prbc', abo = null, rh = null, qty = 1;
    var root = el('modalRoot');
    Array.prototype.forEach.call(root.querySelectorAll('[data-prod]'), function (x) {
      x.addEventListener('click', function () {
        prod = x.dataset.prod;
        Array.prototype.forEach.call(root.querySelectorAll('[data-prod]'), function (y) { y.classList.toggle('on', y === x); });
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-units]'), function (x) {
      x.addEventListener('click', function () {
        qty = parseInt(x.dataset.units, 10) || 1;
        Array.prototype.forEach.call(root.querySelectorAll('[data-units]'), function (y) { y.classList.toggle('on', y === x); });
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('.blood-btn'), function (b) {
      b.addEventListener('click', function () {
        abo = b.dataset.abo; rh = b.dataset.rh;
        Array.prototype.forEach.call(root.querySelectorAll('.blood-btn'), function (y) { y.style.borderColor = ''; });
        b.style.borderColor = 'var(--red)';
        var res = el('crossResult');
        res.innerHTML = '已选择供血：<b style="color:#ff8fa0">' + abo + rh + '</b>，点击「交叉配血试验」或直接输注。';
      });
    });
    var cross = root.querySelector('[data-cross]');
    if (cross) cross.addEventListener('click', function () {
      if (!abo) { UI.toast('warn', '未选择', '请先选择供血血型'); return; }
      var ok = prod === 'ffp' ? okPlasma(abo, p.abo) : M.compat({ abo: abo, rh: rh }, { abo: p.abo, rh: p.rh });
      el('crossResult').innerHTML = ok ?
        '<span style="color:#25e07a">✓ 主侧/次侧配血均无凝集，<b>相合</b>，可以输注。</span>' :
        '<span style="color:#ff3d5a">✗ 主侧配血出现明显凝集，<b style="color:#ff3d5a">不相合！严禁输注</b>，将引发急性溶血反应。</span>';
    });
    var grid = root.querySelector('#bloodGrid');
    /* 单击按钮输注 */
    var g = root.querySelector('#bloodGrid');
    if (g && !g.dataset.b) {
      g.dataset.b = '1';
      var btn = document.createElement('div');
      btn.style.cssText = 'grid-column:1/-1;display:flex;gap:8px;margin-top:6px';
      btn.innerHTML = '<button class="btn primary" style="flex:1" data-go>确认输注</button>';
      g.parentNode.insertBefore(btn, g.nextSibling);
      btn.querySelector('[data-go]').addEventListener('click', function () {
        if (!abo) { UI.toast('warn', '未选择', '请先选择供血血型'); return; }
        M.transfuse(sim, prod, abo, rh, qty);
        UI.closeModal();
      });
    }
  };
  function okPlasma(donor, recip) {
    if (recip === 'AB') return true;
    if (recip === 'A') return donor === 'A' || donor === 'AB';
    if (recip === 'B') return donor === 'B' || donor === 'AB';
    return donor === 'O';
  }

  /* ================= 检查（开单 + 回报 + 器官概览） ================= */
  UI.openExam = function (sim) {
    if (!sim) sim = M.GAME.sim;
    if (!sim) return;
    var v = sim.v || {};
    var head = UI.modalHead('检查与检验', '按系统开单 · 结果自动回报 · 定位问题器官');
    var intro = '<div class="exam-head-line">' +
      'GCS <b>' + Math.round(v.gcs || 0) + '</b>　HR <b>' + Math.round(v.hr || 0) + '</b>　BP <b>' +
      Math.round(v.sbp || 0) + '/' + Math.round(v.dbp || 0) + '</b>　SpO₂ <b>' + Math.round(v.spo2 || 0) + '%</b>　' +
      'T <b>' + (v.temp || 0).toFixed(1) + '℃</b>　乳酸 <b>' + (v.lactate || 0).toFixed(1) + '</b></div>';
    var phys = '<div class="exam-sec"><h4>① 体格检查 <span>立即出结果</span></h4><div class="route-pills">' +
      M.EXAM_PARTS.map(function (p) {
        return '<div class="route-pill" data-exam="' + p.id + '">' + esc(p.n) + '</div>';
      }).join('') + '</div></div>';
    var groups = '';
    M.EXAM_GROUPS.forEach(function (g) {
      var list = M.EXAM_LIB.filter(function (x) { return x.g === g.id; });
      groups += '<div class="exam-sec"><h4>' + esc(g.n) + ' <span>' + esc(g.hint) + '</span></h4><div class="exam-btns">' +
        list.map(function (x) {
          return '<button class="ex-btn" data-order="' + x.id + '" title="' + esc(x.desc) + '"><b>' + esc(x.n) + '</b>' +
            '<i>' + x.delay + 's</i></button>';
        }).join('') + '</div></div>';
    });
    var body = '<div class="exam-wrap"><div class="exam-left">' + intro + phys + groups + '</div>' +
      '<div class="exam-right"><div id="examLive"><div class="exam-out"><div class="empty">选择检查后结果会出现在这里<br><span style="color:#5b6f80">危急值会立即提示</span></div></div></div>' +
      '<div id="examOut"></div></div></div>';
    UI.__examT = -99;
    UI.openModal(UI.modalShell('wide', head, body), function (sim2) {
      if (Math.abs((sim2.t || 0) - UI.__examT) < 1.2) return;
      UI.__examT = sim2.t;
      var live = el('examLive');
      if (!live) return;
      var pend = sim2.examPending || [];
      var res = (sim2.examResults || []).slice(-4).reverse();
      var html = '';
      if (pend.length) {
        html += '<div class="exam-block pending"><h4>待回报</h4>' + pend.map(function (p) {
          return '<div class="pend-row"><span>' + esc(p.name) + '</span><b>' +
            Math.max(0, Math.ceil(p.ready - sim2.t)) + 's</b></div>';
        }).join('') + '</div>';
      }
      if (res.length) {
        html += res.map(function (r) {
          return '<div class="exam-block' + (r.crit ? ' crit' : '') + '"><h4>' + esc(r.name) + '<span>' + M.fmtT(r.t) + '</span></h4>' +
            '<div class="exam-text">' + esc(r.text) + '</div>' +
            (r.clue ? '<div class="exam-clue">线索：' + esc(r.clue) + '</div>' : '') +
            '<div class="kv-grid">' + r.rows.map(function (x) {
              var arrow = x.flag === 'hi' ? '↑' : x.flag === 'lo' ? '↓' : x.flag === 'crit' ? '⚠' : '';
              return '<div class="kv ' + x.flag + '"><span>' + esc(x.n) + '</span><b>' + esc(x.v) + (arrow ? ' ' + arrow : '') +
                (x.u ? ' <i>' + esc(x.u) + '</i>' : '') + '</b></div>';
            }).join('') + '</div></div>';
        }).join('');
      }
      if (html) live.innerHTML = html;
    });
    UI.bindClose();
    var root = el('modalRoot');
    Array.prototype.forEach.call(root.querySelectorAll('[data-exam]'), function (x) {
      x.addEventListener('click', function () {
        var r = M.examine(sim, x.dataset.exam);
        if (r) el('examOut').innerHTML = '<div class="exam-block"><h4>' + esc(r.part) + '</h4>' + r.lines.map(esc).join('<br>') + '</div>';
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-order]'), function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.order === 'skin_test') { UI.openSkinTest(sim); return; }
        var r = M.orderExam(sim, b.dataset.order);
        UI.toast(r.ok ? 'good' : 'warn', r.ok ? '已开单' : '无法开单', r.msg);
        if (r.ok) { el('examOut').innerHTML = '<div class="exam-block"><h4>' + esc((M.examDef(b.dataset.order) || {}).n) + '</h4>' + esc(r.msg) + '<br><span style="color:#7d93a6">结果将自动出现在这里，并在「检查」标签中留档。</span></div>'; }
      });
    });
  };

  /* ================= 皮试 ================= */
  UI.openSkinTest = function (sim) {
    var picks = (M.DRUGS || []).filter(function (D) {
      return /青霉素|头孢|抗毒素|免疫球蛋白|碘|造影|利多卡因|普鲁卡因/.test((D.name || '') + (D.alias || ''));
    }).slice(0, 8);
    var body = '<div style="font-size:11.5px;color:#7d93a6;margin-bottom:8px">输入要皮试的药品名（通用名 / 商品名 / 英文名均可），<b>5 秒</b>出结果。</div>' +
      '<input id="skinDrug" type="text" placeholder="例如：青霉素、头孢呋辛、破伤风抗毒素" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(90,190,220,.25);background:rgba(255,255,255,.04);color:#e8f4fa;font-size:13px;box-sizing:border-box">' +
      (picks.length ? '<div style="margin-top:9px;display:flex;gap:6px;flex-wrap:wrap">' + picks.map(function (D) {
        return '<button class="ph-btn" data-skin-pick="' + esc(D.id) + '" style="padding:3px 9px;font-size:11px">' + esc(D.name) + '</button>';
      }).join('') + '</div>' : '') +
      '<div style="margin-top:12px;display:flex;gap:8px"><button class="btn primary" data-skin-go>开始皮试（5 秒）</button></div>' +
      '<div id="skinOut" style="margin-top:12px;font-size:11.5px;line-height:1.8;color:#a9c0cf"></div>';
    UI.openModal(UI.modalShell('narrow', UI.modalHead('皮试 · 药物过敏试验', '输入药名 → 5 秒判读'), body));
    UI.bindClose();
    var root = el('modalRoot');
    var inp = el('skinDrug');
    Array.prototype.forEach.call(root.querySelectorAll('[data-skin-pick]'), function (b) {
      b.addEventListener('click', function () { if (inp) { inp.value = (M.getDrug(b.dataset.skinPick) || {}).name || b.dataset.skinPick; } });
    });
    function go() {
      var q = (inp && inp.value || '').trim();
      if (!q) { UI.toast('warn', '请先输入药名', '例如：青霉素、头孢呋辛'); return; }
      var r = M.orderExam(sim, 'skin_test', { drug: q });
      UI.toast(r.ok ? 'good' : 'warn', r.ok ? '已开单' : '无法开单', r.msg);
      if (r.ok) {
        el('skinOut').innerHTML = '<b>' + esc(r.msg) + '</b><br><span style="color:#7d93a6">结果 5 秒后自动出现在「检查」的结果区，危急值会弹窗。</span>';
        UI.closeModal();
        if (UI.openExam) UI.openExam(sim);
      }
    }
    var gob = root.querySelector('[data-skin-go]');
    if (gob) gob.addEventListener('click', go);
    if (inp) inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
  };

  /* ================= 新闻 ================= */
  UI.openNews = function () {
    var S = (M.Clinic && M.Clinic.state && M.Clinic.isOn && M.Clinic.isOn()) ? M.Clinic.state : null;
    if (S && M.Clinic.openNews) { M.Clinic.openNews(); return; }
    var list = (M.GAME && M.GAME.news) || [];
    var recs = (M.GAME && M.GAME.sim && M.GAME.sim.records) || [];
    function item(n) {
      return '<div style="padding:9px 11px;margin-bottom:7px;border-radius:9px;line-height:1.7;font-size:12px;' +
        (n.event ? 'background:rgba(255,61,90,.12);border-left:3px solid #ff5a7a;color:#ffc4cd' :
          'background:rgba(255,255,255,.035);border-left:3px solid rgba(90,190,220,.35);color:#bcd4e2') + '">' +
        (n.event ? '<b style="color:#ff8fa0">【突发】</b>' : '') + esc(n.text) + '</div>';
    }
    var body = '<div style="font-size:11px;color:#7d93a6;margin-bottom:8px">社会新闻与突发事件。小概率出现枪击 / 车祸 / 比赛猝死等伤员，会作为下一位病人送到本院；' +
      '「现场已死亡、非救治对象」的只留记录，不计入接诊与死亡率。</div>' +
      (list.length ? list.slice(0, 20).map(item).join('') : '<div class="empty">暂时没有新闻，多接诊几位病人后再来看看。</div>') +
      (recs.length ? '<div style="font-size:10.5px;letter-spacing:2px;color:#7d93a6;margin:14px 0 7px">特殊记录（不计入统计）</div>' +
        recs.slice(-12).map(function (r) {
          return '<div style="padding:7px 10px;margin-bottom:6px;border-radius:8px;font-size:11.5px;color:#9fb4c4;background:rgba(255,255,255,.025)">' +
            esc(r.text) + '</div>';
        }).join('') : '');
    UI.openModal(UI.modalShell('narrow', UI.modalHead('新闻 · 本院通报', '社会新闻与突发事件'), body));
    UI.bindClose();
  };

  /* ================= 护理 ================= */
  function supplyText(need) {
    if (!need) return '';
    var out = [];
    for (var id in need) {
      var c = (M.CONSUMABLE_BY_ID && M.CONSUMABLE_BY_ID[id]) || null;
      out.push((c ? c.name : id) + '×' + need[id]);
    }
    return out.join(' + ');
  }
  UI.supplyText = supplyText;

  UI.openNurse = function (sim) {
    var acts = [
      { id: 'foley', n: '留置导尿', d: '监测尿量，评估肾灌注' },
      { id: 'ng', n: '留置胃管', d: '胃肠减压 / 洗胃' },
      { id: 'warm', n: '保温 / 复温', d: '提升核心体温' },
      { id: 'cool', n: '冰毯降温', d: '降低核心体温与脑代谢' },
      { id: 'position', n: '抬高下肢 / 休克体位', d: '增加回心血量' },
      { id: 'sample', n: '留取血培养', d: '感染证据' },
      { id: 'restrain', n: '约束 / 镇静评估', d: '防止坠床与拔管' }
    ];
    var trauma = M.NURSE_TRAUMA || [];
    var body = (trauma.length ? '<div class="exam-sec"><h4>外伤处置 <span>每次消耗耗材</span></h4><div class="exam-btns">' +
      trauma.map(function (a) {
        return '<button class="ex-btn" data-tn="' + a.id + '" title="' + esc(a.d || '') + '"><b>' + esc(a.n) + '</b>' +
          '<i>' + esc(supplyText(a.supply)) + '</i></button>';
      }).join('') + '</div></div>' : '') +
      '<div class="exam-sec"><h4>基础护理 <span>即时生效</span></h4><div class="route-pills">' + acts.map(function (a) {
        return '<div class="route-pill" data-n="' + a.id + '" title="' + esc(a.d) + '">' + a.n + '</div>';
      }).join('') + '</div></div>' +
      '<div id="nurseOut" style="margin-top:14px;font-size:11.5px;line-height:1.8;color:#a9c0cf"></div>';
    UI.openModal(UI.modalShell('narrow', UI.modalHead('护理处置', '外伤处理会消耗耗材，缺货时到药房采购'), body));
    UI.bindClose();
    Array.prototype.forEach.call(el('modalRoot').querySelectorAll('[data-n]'), function (x) {
      x.addEventListener('click', function () {
        var msg = M.nurse(sim, x.dataset.n);
        el('nurseOut').innerHTML = msg;
      });
    });
    Array.prototype.forEach.call(el('modalRoot').querySelectorAll('[data-tn]'), function (x) {
      x.addEventListener('click', function () {
        var msg = M.nurse(sim, x.dataset.tn);
        el('nurseOut').innerHTML = msg;
      });
    });
  };

  /* ================= 死亡 / 转归 ================= */
  UI.openDeath = function (sim) {
    var s = sim.deathSummary || {};
    var body = '<div class="death-cert">' +
      '<h3>死 亡 记 录</h3>' +
      '<div class="result-badge lose">抢救无效</div>' +
      (M.Clinic && M.Clinic.isOn() ? '<div class="clinic-result-tip">诊室模式：本次诊疗结束，休息 0–4 分钟后接诊下一位。</div>' : '') +
      '<div class="death-time">' + esc(s.time || '--:--:--') + '</div>' +
      '<div class="death-sub">死亡日期：' + esc(s.date || '') + '　｜　抢救时长：' + esc(s.elapsed || '') + '</div>' +
      '<div class="death-sum">' +
      '<div>姓名<b>' + esc(s.name) + '</b></div>' +
      '<div>年龄 / 性别<b>' + esc(s.age) + ' 岁 / ' + esc(s.sex) + '</b></div>' +
      '<div>临床诊断<b>' + esc(s.dx) + '</b></div>' +
      '<div>直接死因<b>' + esc(s.cause) + '</b></div>' +
      '<div>死亡归责<b style="color:' + (s.attribution === 'error' ? '#ff8fa0' : (s.attribution === 'excluded' ? '#7d93a6' : '#7ff0b0')) + '">' + esc(s.attributionText || '—') + '</b></div>' +
      '<div>关键处置完成<b>' + (s.treatRate ? s.treatRate.done + ' / ' + s.treatRate.total : '0 / 0') + '</b></div>' +
      '<div>病情转归<b style="color:#ff8fa0">死亡</b></div>' +
      '</div>' +
      '<div class="sign-row"><span class="sign-line">医师签名：</span>' +
      '<input id="signName" type="text" value="' + esc(sim.doctor) + '" maxlength="16">' +
      '<span class="sign-line">' + esc(s.time) + '</span></div>' +
      '<div class="death-sub" style="margin-top:10px">签署后即完成死亡宣告，病历封存。</div>' +
      '</div>';
    var win = sim.arrestWindow || 240;
    var headSub = win < 240
      ? '无生命体征 ' + Math.round(win) + ' 秒（极高钾血症 · 心肌电静息）'
      : '系统检测到无生命体征已满 4 分钟';
    UI.openModal(UI.modalShell('narrow death-modal', UI.modalHead('宣告死亡', headSub), body,
      '<button class="btn ghost" data-review>病历复盘</button><button class="btn danger" data-sign>签署并宣告死亡</button>'), null, null);
    UI.bindClose();
    var root = el('modalRoot');
    root.querySelector('[data-sign]').addEventListener('click', function () {
      var n = el('signName').value.trim() || sim.doctor;
      sim.doctor = n;
      sim.signedBy = n;
      UI.openDeathSealed(sim);
    });
    root.querySelector('[data-review]').addEventListener('click', function () { UI.openReview(sim); });
  };

  UI.openDeathSealed = function (sim) {
    var s = sim.deathSummary || {};
    var body = '<div class="death-cert">' +
      '<h3>死 亡 证 明</h3>' +
      '<div class="death-time" style="font-size:24px">' + esc(s.date) + ' ' + esc(s.time) + '</div>' +
      '<div class="death-sub">兹证明患者 <b style="color:#fff">' + esc(s.name) + '</b>（' + esc(s.sex) + '，' + esc(s.age) + ' 岁）于上述时间因 <b style="color:#ff8fa0">' +
      esc(s.cause) + '</b> 经抢救无效死亡。</div>' +
      '<div class="death-sum"><div>临床诊断<b>' + esc(s.dx) + '</b></div><div>抢救时长<b>' + esc(s.elapsed) + '</b></div>' +
      '<div>关键处置<b>' + (s.treatRate ? s.treatRate.done + '/' + s.treatRate.total : '0/0') + '</b></div>' +
      '<div>签署医师<b style="color:#25e3c6">' + esc(sim.signedBy || sim.doctor) + '</b></div>' +
      '<div>职称<b>' + esc((sim.rank || M.getRank('resident')).name) + '</b></div>' +
      '<div>本机战绩<b>' + (M.GAME.stats ? (M.GAME.stats.seen + ' 例 / 救活 ' + M.GAME.stats.saved) : '—') + '</b></div></div>' +
      '<div class="death-sub">签署时间（电脑时间）：' + M.fmtDate(new Date()) + ' ' + M.fmtClock(new Date()) + '</div>' +
      '</div>';
    UI.openModal(UI.modalShell('narrow death-modal', UI.modalHead('死亡证明已签署', ''), body,
      '<button class="btn ghost" data-review>查看复盘</button><button class="btn primary" data-next>接诊下一位病人</button>'));
    UI.bindClose();
    var root = el('modalRoot');
    root.querySelector('[data-review]').addEventListener('click', function () { UI.openReview(sim); });
    root.querySelector('[data-next]').addEventListener('click', function () { UI.closeModal(); (M.Clinic && M.Clinic.forceNext) ? M.Clinic.forceNext() : M.GAME.nextPatient(); });
  };

  UI.openCure = function (sim) {
    var s = sim.cureSummary || {};
    var score = M.finalScore(sim);
    var chronic = s.course === 'chronic';
    var body = '<div class="death-cert">' +
      '<h3 style="color:#7ff0b0">' + (chronic ? '病 情 缓 解' : '抢 救 成 功') + '</h3>' +
      '<div class="result-badge win">' + (chronic ? '急性加重已控制 · 慢性基础病需长期管理' : '病情稳定 · 可转科') + '</div>' +
      (M.Clinic && M.Clinic.isOn() ? '<div class="clinic-result-tip">诊室模式：本次诊疗结束，休息 0–4 分钟后接诊下一位；点下方按钮可跳过休息。</div>' : '') +
      '<div class="death-time" style="color:#7ff0b0;font-size:26px">' + esc(s.time) + '</div>' +
      '<div class="death-sum"><div>姓名<b>' + esc(s.name) + '</b></div><div>诊断<b>' + esc(s.dx) + '</b></div>' +
      '<div>总耗时<b>' + esc(s.elapsed) + '</b></div><div>综合评分<b style="color:#25e3c6">' + score + '</b></div>' +
      '<div>用药次数<b>' + (sim.counters.drug) + '</b></div><div>电击次数<b>' + sim.counters.shock + '</b></div>' +
      '<div>手术次数<b>' + sim.counters.surg + '</b></div>' +
      '<div>并发症处理<b>' + sim.counters.compFixed + ' 成功 / ' + sim.counters.compFail + ' 失败</b></div>' +
      (sim.counters.postop ? '<div>术后并发症<b>' + sim.counters.postop + ' 项</b></div>' : '') + '</div>' +
      (chronic ? '<div class="death-sub">慢性基础病无法根治：本次仅解除急性加重，出院后需长期用药与随访，随时可能再次加重。</div>' : '') +
      '<div class="death-sub">医师签名：<b style="color:#25e3c6">' + esc(sim.doctor) + '</b>（' + esc((sim.rank || M.getRank('resident')).name) + '）　' + esc(s.date) + ' ' + esc(s.time) + '</div>' +
      '</div>';
    UI.openModal(UI.modalShell('narrow', UI.modalHead(chronic ? '临床缓解' : '转归良好', chronic ? '急性期已控制' : '生命体征平稳'), body,
      '<button class="btn ghost" data-review>复盘</button><button class="btn primary" data-next>接诊下一位病人</button>'));
    UI.bindClose();
    el('modalRoot').querySelector('[data-review]').addEventListener('click', function () { UI.openReview(sim); });
    el('modalRoot').querySelector('[data-next]').addEventListener('click', function () { UI.closeModal(); (M.Clinic && M.Clinic.forceNext) ? M.Clinic.forceNext() : M.GAME.nextPatient(); });
  };

  UI.openReview = function (sim) {
    var d = sim.disease;
    var body = '<div class="help-grid">' +
      '<div class="help-sec"><h4>诊断</h4><b>' + esc(d ? d.def.name : '未知') + '</b><br>' +
      (d ? esc(d.def.dept) + '<br>发病至结束：' + M.fmtT(sim.t - d.t0) + '<br>' +
        '标准处置：<br>' + (d.def.treat || []).map(function (t, i) {
          return (sim.treatDone[i] ? '<span style="color:#7ff0b0">✓ ' : '<span style="color:#ff8fa0">✗ ') + esc(M.treatLabel ? M.treatLabel(t) : (t.type === 'drug' ? (M.getDrug(t.id) || { name: t.id }).name : M.procName(t.proc) + ' @ ' + M.siteName(t.site))) + '</span>';
        }).join('<br>') : '') + '</div>' +
      '<div class="help-sec"><h4>病程事件</h4>' + sim.logs.filter(function (l) { return l.type === 'crit' || l.type === 'warn'; }).slice(-14).map(function (l) {
        return '[' + M.fmtT(l.t) + '] ' + esc(l.text);
      }).join('<br>') + '</div>' +
      '<div class="help-sec"><h4>用药记录（' + sim.rxList.length + '）</h4>' +
      sim.rxList.map(function (r) {
        return M.fmtT(r.t0) + ' ' + esc(r.D.name) + ' ' + (r.infusion ? r.rate + ' 滴注' : M.fmtDose(r.dose, r.unit)) + ' · ' + esc(M.ROUTE_NAME[r.route] || '');
      }).join('<br>') + '</div>' +
      '<div class="help-sec"><h4>输血记录</h4>' + (sim.bloodGiven.length ? sim.bloodGiven.map(function (b) {
        return M.fmtT(b.t) + ' ' + (M.productName(b.product)) + ' ' + b.abo + b.rh + ' ' + (b.ok ? '<span style="color:#7ff0b0">相合</span>' : '<span style="color:#ff8fa0">不相合 → 溶血</span>');
      }).join('<br>') : '无') + '</div>' +
      '</div>';
    UI.openModal(UI.modalShell('', UI.modalHead('病历复盘', '回顾这次抢救'), body, '<button class="btn primary" data-close>关闭</button>'));
    UI.bindClose();
  };

  /* ================= 帮助 ================= */
  UI.openHelp = function () {
    var body = '<div class="help-grid">' +
      '<div class="help-sec"><h4>职称 = 难度</h4>开局选择的职称决定整局难度：<br>' +
      '<b>实习医师</b>：完整分步指南 + 并发症 ×0.75 + 病程 ×0.85 + 剂量提示全开<br>' +
      '<b>住院医师</b>：要点式指南 + 标准难度<br>' +
      '<b>主治医师</b>：只给方向性提示 + 并发症 ×1.2 + 病程 ×1.15 + 无剂量提示<br>' +
      '<b>主任医师</b>：无病例提示 + 并发症 ×1.4 + 病程 ×1.3 + 只接危重病人</div>' +
      '<div class="help-sec"><h4>处理指南</h4>按 <b>G</b> 键或点操作条「处理指南」：<br>' +
      '「当前病例」给出分步方案（评估 → 关键用药 → 关键手术 → 监测目标 → 病程时间轴 → 避免的错误）；<br>' +
      '「临床指南手册」是通用流程（ABCDE、ACLS、休克、脓毒症、中毒、输血反应、电解质…），可搜索；<br>' +
      '「医师档案」查看职称能力与本机战绩。</div>' +
      '<div class="help-sec"><h4>接诊类型</h4>开局可选「随机 / 心脏骤停 / 创伤 / 中毒 / 心血管 / 呼吸 / 神经 / 消化·腹部 / 肾·内分泌 / 妇产 / 环境·理化 / 感染·脓毒症 / 血液」。<br>' +
      '不同类型的病人到院表现完全不同，换类型会重新抽取该类的病例。</div>' +
      '<div class="help-sec"><h4>检查（快捷键 E）</h4>点底部「体格检查」或右侧「<b>检查</b>」标签：<br>' +
      '① 体格检查（全身 / 胸 / 心 / 腹 / 神经 / 皮肤）立即出结果；<br>' +
      '② 床旁检验（血气、电解质、心肌标志物、凝血、感染指标、毒物筛查…）3–30 秒回报；<br>' +
      '③ 影像（胸片、床旁超声、CT）与特殊操作（腰穿、胃镜、支气管镜）20–40 秒回报；<br>' +
      '右侧同时显示<b>临床评分（NEWS2 / qSOFA / SOFA / P-F 比 / 休克指数 / AKI / 乳酸清除）、器官功能概览、' +
      '活跃的器官相互作用、问题定位与检查线索</b>，危急值会直接弹窗。</div>' +
      '<div class="help-sec"><h4>器官互作</h4>器官不是孤立的：肝衰 → 凝血因子↓ + 血氨↑ → 肝性脑病；肾衰 → 高钾/酸中毒 → 室颤；' +
      '感染 → 炎症介质 → 血管扩张 + 毛细血管渗漏 → 多器官衰竭；横纹肌溶解 → 肌红蛋白管型 → 急性肾衰 + 高钾；' +
      '颅高压 → 库欣反应 / 神经源性肺水肿；低体温 → 凝血障碍。检查标签会把这些链条实时列出来。</div>' +
      '<div class="help-sec"><h4>玩法</h4>你扮演急诊/手术医师。每位病人随机发病，病情会持续进展。<br>' +
      '找到病因 → 对症用药 / 手术 → 稳定生命体征。<br><b>生命体征消失满 4 分钟，系统自动按电脑时间宣告死亡并需要你签署。</b></div>' +
      '<div class="help-sec"><h4>监护</h4>左侧为实时波形：ECG II、动脉压、脉搏波、呼吸、脑电、呼末 CO₂。<br>' +
      '<b>双击 ECG 波形</b>可放大为全 12 导联心电图，底部自动测量 PR / QRS / QTc / 电轴并给出中文判读；' +
      '前壁/下壁/侧壁/后壁缺血会显示对应的 ST 抬高与镜像压低，房扑、交界性心律、二度阻滞、尖端扭转型室速都有独立波形。</div>' +
      '<div class="help-sec"><h4>用药</h4>右侧「<b>药品</b>」标签内选药：按<b>功能大类</b>折叠分组，点分组标题展开，点药品打开给药面板。' +
      '可自选剂量与给药途径（口服/静推/滴注/肌注/皮下/骨髓腔/吸入…）。<br>' +
      '每种药有真实半衰期与效应靶点，过量会中毒，部分药物有过敏风险（尤其患者已有过敏史时）。<br>' +
      '<b>Ctrl K</b> 可直接搜药名、分类或靶点。</div>' +
      '<div class="help-sec"><h4>界面</h4>生命体征按<b>循环 / 呼吸 / 神经 / 内环境 / 器官·血液</b>分组，点标签切换。' +
      '右侧「症状 / 处方 / 检查 / 日志」也是标签分区，有新日志时标签会亮提示点。<br>' +
      '波形列、疾病状态都可点标题右侧 <b>⌄</b> 折叠，给操作腾出空间。</div>' +
      '<div class="help-sec"><h4>手术</h4>三个入口都能进：<br>' +
      '① 底部操作条 <b>「手术 · 术式」</b>（快捷键 <b>S</b>）<br>' +
      '② 疾病状态面板里的 <b>「去做这台手术 →」</b> 按钮（会自动预选推荐部位与术式，用 ★ 标出）<br>' +
      '③ 处理指南「当前病例」STEP 3 里的手术按钮<br><br>' +
      '弹窗里先选<b>部位（33 种）</b>再选<b>术式（18 种）</b>，术中会随机出现并发症，须在时限内选择正确处置；' +
      '也可术中给药、加快或终止手术。</div>' +
      '<div class="help-sec"><h4>输血</h4>患者有 ABO/Rh 血型。选错血型会触发<b>急性溶血性输血反应</b>：血红蛋白骤降、高钾、DIC、急性肾衰。</div>' +
      '<div class="help-sec"><h4>抢救</h4>无脉搏时立即 CPR、除颤（室颤/无脉室速）、肾上腺素 1mg 静推。心脏停搏（直线）不可电击。</div>' +
      '</div>';
    UI.openModal(UI.modalShell('', UI.modalHead('使用说明', 'LIFE SIM'), body, '<button class="btn primary" data-close>知道了</button>'));
    UI.bindClose();
  };

  /* ================= Toast ================= */
  UI.toast = function (type, title, text) {
    var box = el('toasts');
    var d = document.createElement('div');
    d.className = 'toast ' + (type || '');
    d.innerHTML = '<b>' + esc(title) + '</b>' + esc(text || '');
    box.appendChild(d);
    setTimeout(function () {
      d.classList.add('out');
      setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 320);
    }, 4200);
    while (box.children.length > 6) box.removeChild(box.firstChild);
  };

  /* ================= 顶栏 ================= */
  UI.renderTop = function (sim) {
    var p = sim.patient;
    el('ptBed').textContent = (M.Clinic && M.Clinic.isOn()) ? String(p.bed).replace('急诊', '诊室') : p.bed;
    el('ptName').textContent = p.name;
    el('ptDemo').textContent = p.sex + ' · ' + p.age + ' 岁 · ' + p.weight + 'kg';
    el('ptBlood').textContent = '血型 ' + p.abo + p.rh;
    var al = el('ptAllergy');
    if (p.allergy) { al.textContent = '过敏：' + p.allergy.name; al.className = 'tag allergy'; }
    else { al.textContent = '过敏史：否认'; al.className = 'tag'; }
    var rank0 = sim.rank || M.getRank('resident');
    el('docRank').textContent = rank0.name;
    el('docName').textContent = sim.doctor;
    var st0 = M.GAME.stats;
    el('docStats').textContent = st0 ? ('接诊 ' + st0.seen + ' · 救活 ' + st0.saved) : '';
    var now = new Date();
    el('simClock').textContent = M.fmtClock(now);
    el('elapsed').textContent = (M.Clinic && M.Clinic.isOn() ? '本次诊疗 ' : '病程 ') + M.fmtT(sim.t);
    var bar = el('codeBar');
    if (!sim.dead && sim.arrest) {
      bar.classList.remove('hidden');
      document.body.classList.add('code-red');
      var win = sim.arrestWindow || 240;
      var left = Math.max(0, win - sim.arrestT);
      var nm = M.RHY_NAME[sim.rhythm] || '';
      var txt;
      if (sim.rhythm === 'vf') txt = '心室颤动 · 无脉搏 · 立即除颤';
      else if (sim.rhythm === 'asystole') txt = '心脏停搏（直线）· 无脉搏 · CPR + 肾上腺素';
      else if (sim.rhythm === 'pea') txt = '无脉性电活动（PEA）· 有电活动但无脉搏';
      else txt = (nm ? nm + ' · ' : '') + '无生命体征';
      el('codeText').textContent = txt;
      el('codeTimer').textContent = M.fmtT(left);
    } else {
      bar.classList.add('hidden');
      document.body.classList.remove('code-red');
    }
    /* 当前问题条 */
    var probs = M.problems ? M.problems(sim) : [];
    checkNewProblems(sim, probs);
    var pbar = el('probBar');
    if (pbar) {
      if (!sim.dead && probs.length) {
        pbar.classList.remove('hidden');
        pbar.className = 'prob-bar sev' + probs[0].sev;
        el('probText').textContent = probs[0].name;
        el('probMore').textContent = probs.length > 1 ? ('另有 ' + (probs.length - 1) + ' 项') : '';
      } else {
        pbar.classList.add('hidden');
      }
    }
  };

  /* ================= 当前问题 · 快速处置 ================= */
  var probSeen = {};

  function runProblemAction(sim, act) {
    if (!act) return;
    if (act.a === 'cpr') { M.setCPR(sim, !sim.cpr); return; }
    if (act.a === 'shock') return UI.openShock(sim);
    if (act.a === 'bleed') return UI.openBleed(sim);
    if (act.a === 'airway') return UI.openAirway(sim);
    if (act.a === 'surgery') return UI.openSurgery(sim, act.site ? { site: act.site, proc: act.proc } : null);
    if (act.a === 'transfuse') return UI.openTransfuse(sim);
    if (act.a === 'nurse') return UI.openNurse(sim);
    if (act.a === 'exam') return UI.openExam(sim);
    if (act.a === 'drug') return UI.openDrug(sim, act.id);
    if (act.a === 'guide') return UI.openGuide(sim);
  }
  UI.runProblemAction = runProblemAction;

  function problemsHtml(sim) {
    var list = M.problems ? M.problems(sim) : [];
    if (!list.length) return '';
    var html = '<div class="pb-list"><div class="pb-head">当前问题 · 快速处置<i>' + list.length + ' 项</i></div>';
    list.forEach(function (p, i) {
      html += '<div class="pb-item sev' + p.sev + '">' +
        '<div class="pb-title">' + esc(p.name) + (p.tag ? '<span class="pb-tag">' + esc(p.tag) + '</span>' : '') + '</div>' +
        '<div class="pb-hint">' + esc(p.hint) + '</div>' +
        '<div class="pb-acts">' + p.acts.map(function (a, j) {
          return '<button class="pb-act" data-pb="' + i + ':' + j + '">' + esc(a.n) + '</button>';
        }).join('') + '</div></div>';
    });
    return html + '</div>';
  }
  UI.problemsHtml = problemsHtml;

  function bindProblemButtons(box, sim) {
    if (!box) return;
    var list = M.problems ? M.problems(sim) : [];
    Array.prototype.forEach.call(box.querySelectorAll('[data-pb]'), function (b) {
      if (b.__bound) return;
      b.__bound = 1;
      b.addEventListener('click', function () {
        var parts = String(b.dataset.pb).split(':');
        var p = list[parseInt(parts[0], 10)];
        if (!p) return;
        safe('快速处置', function () { runProblemAction(sim, p.acts[parseInt(parts[1], 10)]); });
      });
    });
  }

  /* 新问题提醒（同一问题 30 秒内只提醒一次） */
  function checkNewProblems(sim, list) {
    var now = Date.now();
    var cur = {};
    list.forEach(function (p) {
      cur[p.id] = 1;
      var last = probSeen[p.id];
      if (!last || now - last > 30000) {
        probSeen[p.id] = now;
        UI.toast(p.sev >= 4 ? 'crit' : 'warn', '新问题 · ' + p.name, p.hint + '（右侧「指南」或 G 键可查看处置）');
        M.log(sim, p.sev >= 4 ? 'crit' : 'warn', '【新问题】' + p.name + ' —— ' + p.hint);
      }
    });
    for (var k in probSeen) if (!cur[k] && now - probSeen[k] > 30000) delete probSeen[k];
  }

  /* ================= 趋势曲线 ================= */
  var TREND_LANES = [
    { k: 'hr', n: '心率', u: 'bpm', lo: 50, hi: 110, min: 20, max: 210, col: '#ff6b81' },
    { k: 'sbp', n: '收缩压', u: 'mmHg', lo: 90, hi: 150, min: 30, max: 220, col: '#ffb02e' },
    { k: 'spo2', n: 'SpO₂', u: '%', lo: 94, hi: 100, min: 50, max: 100, col: '#38a9ff' },
    { k: 'temp', n: '体温', u: '℃', lo: 36, hi: 37.5, min: 32, max: 43, col: '#9d7bff' },
    { k: 'k', n: '血钾', u: 'mmol/L', lo: 3.5, hi: 5.3, min: 2, max: 9, col: '#25e3c6' }
  ];

  function drawTrend(cv, sim) {
    if (!cv) return;
    var rect = cv.getBoundingClientRect();
    var W = Math.max(320, Math.round(rect.width || 860));
    var H = Math.max(220, Math.round(rect.height || 420));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    }
    var g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);

    var data = (sim.trend || []).slice();
    var padL = 66, padR = 54, padT = 18, padB = 26;
    var laneH = (H - padT - padB) / TREND_LANES.length;

    g.font = '11px ui-monospace, Consolas, monospace';
    g.textBaseline = 'middle';

    if (data.length < 2) {
      g.fillStyle = '#7d93a6';
      g.font = '13px system-ui, sans-serif';
      g.textAlign = 'center';
      g.fillText('趋势数据采集中…（每 2 秒记录一个点）', W / 2, H / 2);
      return;
    }

    var tEnd = Math.max(sim.t, data[data.length - 1].t);
    var winSec = 600;                       /* 展示最近 10 分钟 */
    var tStart = Math.max(0, tEnd - winSec);
    if (tEnd - tStart < 60) tStart = Math.max(0, tEnd - 60);
    function xOf(t) { return padL + (t - tStart) / Math.max(1, (tEnd - tStart)) * (W - padL - padR); }

    /* 时间轴刻度 */
    g.strokeStyle = 'rgba(120,150,170,.16)';
    g.lineWidth = 1;
    var stepSec = 60;
    for (var tt = Math.ceil(tStart / stepSec) * stepSec; tt <= tEnd; tt += stepSec) {
      var x = xOf(tt);
      g.beginPath(); g.moveTo(x, padT); g.lineTo(x, H - padB); g.stroke();
      g.fillStyle = '#5b6f80'; g.textAlign = 'center';
      g.fillText(M.fmtT(tt), x, H - padB + 12);
    }

    TREND_LANES.forEach(function (L, i) {
      var top = padT + i * laneH, bot = top + laneH - 6;
      function yOf(val) {
        var p = (val - L.min) / Math.max(0.001, L.max - L.min);
        return bot - M.clamp(p, 0, 1) * (bot - top - 8);
      }
      /* 正常区间底色 */
      g.fillStyle = 'rgba(37,227,198,.06)';
      g.fillRect(padL, yOf(L.hi), W - padL - padR, Math.max(1, yOf(L.lo) - yOf(L.hi)));
      /* 分隔线 */
      g.strokeStyle = 'rgba(120,150,170,.10)';
      g.beginPath(); g.moveTo(padL, bot + 3); g.lineTo(W - padR, bot + 3); g.stroke();

      /* 曲线 */
      var started = false;
      g.beginPath();
      data.forEach(function (d) {
        if (d.t < tStart) return;
        var vv = d[L.k];
        if (typeof vv !== 'number' || !isFinite(vv)) return;
        var px = xOf(d.t), py = yOf(vv);
        if (!started) { g.moveTo(px, py); started = true; } else g.lineTo(px, py);
      });
      g.strokeStyle = L.col; g.lineWidth = 1.6;
      g.shadowColor = L.col; g.shadowBlur = 6;
      g.stroke();
      g.shadowBlur = 0;

      /* 当前值 */
      var last = data[data.length - 1][L.k];
      g.fillStyle = L.col;
      g.textAlign = 'left';
      g.font = '11px ui-monospace, Consolas, monospace';
      g.fillText((typeof last === 'number' ? (L.k === 'temp' || L.k === 'k' ? last.toFixed(1) : Math.round(last)) : '--') + ' ' + L.u, W - padR + 6, (top + bot) / 2);
      /* 名称 */
      g.fillStyle = '#8fa8b8';
      g.textAlign = 'right';
      g.fillText(L.n, padL - 8, (top + bot) / 2);
      /* 量程 */
      g.fillStyle = '#44586a';
      g.font = '9px ui-monospace, Consolas, monospace';
      g.fillText(String(L.max), padL - 8, top + 5);
      g.fillText(String(L.min), padL - 8, bot - 2);
    });

    /* 事件标记：电击 / CPR */
    (sim.marks || []).forEach(function (mk) {
      if (mk.t < tStart || mk.t > tEnd) return;
      var x = xOf(mk.t);
      if (mk.kind === 'shock') {
        g.strokeStyle = 'rgba(255,176,46,.85)';
        g.setLineDash([3, 3]);
        g.beginPath(); g.moveTo(x, padT); g.lineTo(x, H - padB); g.stroke();
        g.setLineDash([]);
        g.fillStyle = '#ffb02e';
        g.textAlign = 'center';
        g.font = '12px system-ui, sans-serif';
        g.fillText('⚡', x, padT - 6);
      } else if (mk.kind === 'postop') {
        g.strokeStyle = 'rgba(255,61,90,.6)';
        g.setLineDash([2, 4]);
        g.beginPath(); g.moveTo(x, padT); g.lineTo(x, H - padB); g.stroke();
        g.setLineDash([]);
        g.fillStyle = '#ff3d5a';
        g.textAlign = 'center';
        g.font = '11px system-ui, sans-serif';
        g.fillText('▼', x, padT - 6);
        } else if (mk.kind === 'cpr') {
        g.strokeStyle = 'rgba(37,224,122,.45)';
        g.beginPath(); g.moveTo(x, padT); g.lineTo(x, H - padB); g.stroke();
        g.fillStyle = '#25e07a';
        g.textAlign = 'center';
        g.font = '11px system-ui, sans-serif';
        g.fillText('✚', x, padT - 6);
      }
    });
  }
  UI.drawTrend = drawTrend;

  UI.openTrend = function (sim) {
    var body = '<div class="trend-wrap"><canvas id="trendCv"></canvas></div>' +
      '<div class="trend-legend"><span><b style="color:#ffb02e">⚡</b> 电击除颤</span>' +
      '<span><b style="color:#25e07a">✚</b> 胸外按压</span>' +
      '<span class="hint">绿色带为正常参考区间 · 每 2 秒采样一次 · 显示最近 10 分钟</span></div>';
    UI.openModal(UI.modalShell('wide', UI.modalHead('生命体征趋势', '曲线 · 事件标记'), body,
      '<button class="btn primary" data-close>关闭</button>'), function (s2) {
        var now = (window.performance && performance.now) ? performance.now() : Date.now();
        if (!UI._trendLast || now - UI._trendLast > 350) {
          UI._trendLast = now;
          drawTrend(el('trendCv'), s2);
        }
      });
    UI.bindClose();
    drawTrend(el('trendCv'), sim);
  };

  /* ================= 音效控制 ================= */
  UI.initAudio = function () {
    if (M.Audio) M.Audio.syncUI();
    var r = el('volRange');
    if (r && !r.__bound) {
      r.__bound = 1;
      r.value = M.Audio ? M.Audio.volume : 45;
      r.addEventListener('input', function () {
        if (M.Audio) M.Audio.setVolume(parseFloat(r.value));
      });
    }
    var b = el('btnMute');
    if (b && !b.__bound) {
      b.__bound = 1;
      b.addEventListener('click', function () {
        if (!M.Audio) return;
        if (!M.Audio.ready) M.Audio.init();
        M.Audio.toggleMute();
      });
    }
  };

  /* ================= 操作台绑定 ================= */
  UI.initActions = function () {
    var bar = el('actionbar');
    if (!bar) return;
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('.act'); if (!b) return;
      var sim = M.GAME.sim;
      if (!sim) return;
      safe('操作台 · ' + (b.textContent || ''), function () {
        var a = b.dataset.act;
        if (M.misclick) M.misclick(sim, a);   /* 手忙脚乱地反复点，可能出事 */
        if (a === 'guide') UI.openGuide(sim);
        else if (a === 'surgery') UI.openSurgery(sim);
        else if (a === 'transfuse') UI.openTransfuse(sim);
        else if (a === 'shock') UI.openShock(sim);
        else if (a === 'bleed') UI.openBleed(sim);
        else if (a === 'cpr') { M.setCPR(sim, !sim.cpr); UI.toast(sim.cpr ? 'good' : 'warn', sim.cpr ? '开始胸外按压' : '停止按压', ''); }
        else if (a === 'airway') UI.openAirway(sim);
        else if (a === 'examine') UI.openExam(sim);
        else if (a === 'nurse') UI.openNurse(sim);
        else if (a === 'trend') UI.openTrend(sim);
      });
    });
  };

  UI.openBleed = function (sim) {
    var v = sim.v || {};
    var rate = 200, target = 4.5;
    if (sim.bleed && sim.bleed.active) { rate = sim.bleed.rate; target = (sim.bleed.target || 4500) / 1000; }
    var body = '<div class="bleed-box">' +
      '<div class="bleed-head">当前体液总量 <b id="bleedVol">' + (v.volume / 1000).toFixed(1) + ' L</b>' +
      ' · 血红蛋白 <b>' + (v.hb || 0).toFixed(1) + '</b> g/dL' +
      ' · 凝血 <b>' + Math.round(v.clotting || 0) + '%</b></div>' +
      '<div class="bleed-sub">体液总量超过 <b style="color:#ff9aa8">12.0 L</b> 会心脏停搏，且在放血 / 洗胃把容量降下来之前无法复苏。' +
      '放血会同时带走血红蛋白与凝血因子。</div>' +
      '<div class="field"><label>放血速率：<b id="bleedRateTxt">' + rate + '</b> mL/min（0–2000）</label>' +
      '<input id="bleedRate" type="range" min="0" max="2000" step="10" value="' + rate + '"></div>' +
      '<div class="field"><label>目标剩余量：<b id="bleedTargetTxt">' + target.toFixed(1) + '</b> L（0–5 L）</label>' +
      '<input id="bleedTarget" type="range" min="0" max="5" step="0.1" value="' + target + '"></div>' +
      '<div id="bleedLive" class="bleed-live"></div>' +
      '<div class="bleed-actions"><button class="btn primary" id="bleedStart">开始放血</button>' +
      '<button class="btn ghost" id="bleedStop">停止放血</button>' +
      '<button class="btn ghost" data-close>关闭</button></div></div>';
    UI.openModal(UI.modalShell('narrow', UI.modalHead('放血 / 血液置换', '按设定速率抽出血液，直到目标剩余量'), body), function (sim2) {
      var b = sim2.bleed;
      var live = document.getElementById('bleedLive');
      if (!live) return;
      var cur = (sim2.v.volume / 1000).toFixed(2);
      if (b && b.active) {
        live.innerHTML = '<span style="color:#ffb02e">放血中</span> · 已放出 <b>' + Math.round(b.ml) + ' mL</b>' +
          ' · 当前 <b>' + cur + ' L</b> · 速率 ' + b.rate + ' mL/min → 目标 ' + (b.target / 1000).toFixed(1) + ' L';
      } else if (b && b.ml > 0) {
        live.innerHTML = '<span style="color:#7ff0b0">已结束</span> · 共放出 <b>' + Math.round(b.ml) + ' mL</b> · 当前 <b>' + cur + ' L</b>';
      } else {
        live.innerHTML = '当前体液 <b>' + cur + ' L</b> · 尚未开始放血';
      }
      var bv = document.getElementById('bleedVol');
      if (bv) bv.textContent = cur + ' L';
    });
    UI.bindClose();
    var root = el('modalRoot');
    var ri = root.querySelector('#bleedRate'), ti = root.querySelector('#bleedTarget');
    if (ri) ri.addEventListener('input', function () {
      var t = root.querySelector('#bleedRateTxt'); if (t) t.textContent = ri.value;
    });
    if (ti) ti.addEventListener('input', function () {
      var t = root.querySelector('#bleedTargetTxt'); if (t) t.textContent = (+ti.value).toFixed(1);
    });
    var st = root.querySelector('#bleedStart');
    if (st) st.addEventListener('click', function () {
      var r = parseInt((root.querySelector('#bleedRate') || {}).value, 10) || 0;
      var tg = Math.round((parseFloat((root.querySelector('#bleedTarget') || {}).value) || 0) * 1000);
      var res = M.startBleed(sim, r, tg);
      if (!res) UI.toast('warn', '放血未开始', '速率需要大于 0');
      else UI.toast('warn', '开始放血', r + ' mL/min → 目标 ' + (tg / 1000).toFixed(1) + ' L');
    });
    var sp = root.querySelector('#bleedStop');
    if (sp) sp.addEventListener('click', function () {
      if (M.stopBleed(sim)) UI.toast('warn', '已停止放血', '已放出的血量不会回补');
    });
  };

  UI.openShock = function (sim) {
    var body = '<div style="font-size:12px;color:#a9c0cf;line-height:1.9">当前心律：<b style="color:#ff8fa0">' +
      (M.RHY_NAME[sim.rhythm] || '') + '</b>　' +
      (sim.v.pulseOK ? '<span style="color:#25e07a">有脉搏</span>' : '<span style="color:#ff3d5a">无脉搏</span>') + '</div>' +
      '<div style="font-size:11.5px;color:#7d93a6;margin-top:10px;line-height:1.8">' +
      '室颤 / 无脉性室速 → 非同步除颤（双相波 120–200 J）<br>' +
      '房颤 / 室上速 / 房扑 → 同步电复律（100–200 J）<br>' +
      '心脏停搏（直线）/ 无脉电活动 → <b style="color:#ffb02e">无电击指征</b>，继续 CPR + 肾上腺素</div>' +
      '<div class="route-pills" style="margin-top:14px">' +
      [50, 100, 120, 150, 200, 300, 360].map(function (j) {
        return '<div class="route-pill" data-j="' + j + '">' + j + ' J   非同步</div>';
      }).join('') +
      [70, 100, 150, 200].map(function (j) {
        return '<div class="route-pill" data-js="' + j + '">' + j + ' J   同步</div>';
      }).join('') +
      '</div>';
    UI.openModal(UI.modalShell('narrow', UI.modalHead('电击 / 除颤', '选择能量与模式'), body));
    UI.bindClose();
    var root = el('modalRoot');
    Array.prototype.forEach.call(root.querySelectorAll('[data-j]'), function (x) {
      x.addEventListener('click', function () {
        M.shock(sim, parseInt(x.dataset.j, 10), false);
        UI.closeModal();
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-js]'), function (x) {
      x.addEventListener('click', function () {
        M.shock(sim, parseInt(x.dataset.js, 10), true);
        UI.closeModal();
      });
    });
  };

  UI.openAirway = function (sim) {
    var modes = [
      { id: 'none', n: '不给予氧疗', d: '仅观察' },
      { id: 'o2', n: '面罩吸氧 10 L/min', d: '提升吸入氧浓度，改善低氧' },
      { id: 'bag', n: '简易呼吸器辅助通气', d: '球囊面罩正压通气，可维持氧合' },
      { id: 'ett', n: '气管插管 + 机械通气', d: '确定气道，呼吸机控制通气' }
    ];
    var body = '<div style="font-size:11.5px;color:#a9c0cf;line-height:1.8;margin-bottom:12px">' +
      '气道通畅度 <b>' + Math.round(sim.v.airway) + '%</b>　自主呼吸 <b>' + Math.round(sim.v.rr) + '/min</b>　SpO₂ <b>' + Math.round(sim.v.spo2) + '%</b></div>' +
      '<div class="route-pills">' + modes.map(function (m) {
        return '<div class="route-pill' + (sim.airwayMode === m.id ? ' on' : '') + '" data-air="' + m.id + '" title="' + esc(m.d) + '">' + m.n + '</div>';
      }).join('') + '</div>';
    UI.openModal(UI.modalShell('narrow', UI.modalHead('气道与氧疗', '呼吸支持阶梯'), body));
    UI.bindClose();
    Array.prototype.forEach.call(el('modalRoot').querySelectorAll('[data-air]'), function (x) {
      x.addEventListener('click', function () {
        M.setAirway(sim, x.dataset.air);
        UI.closeModal();
      });
    });
  };

  /* ================= 处理指南 ================= */
  function gdItem(t) { return '<li>' + t + '</li>'; }

  function gdStep(n, title, items) {
    if (!items || !items.length) return '';
    return '<div class="gd-step"><div class="gd-step-h"><i>' + esc(n) + '</i>' + esc(title) + '</div>' +
      '<ul>' + items.map(gdItem).join('') + '</ul></div>';
  }

  function gdTier(sim) {
    var rank = sim.rank || M.getRank('resident');
    return rank.guide || 'key';
  }

  /* 当前病例的分步处理指南（按职称分级显示） */
  function guideCaseHtml(sim) {
    var d = sim.disease;
    var rank = sim.rank || M.getRank('resident');
    var lvl = gdTier(sim);
    if (!d) {
      return '<div class="empty">尚未明确诊断<br><span style="color:#5b6f80">做体格检查、化验与心电图后再查看指南</span></div>';
    }
    var def = d.def, v = sim.v;
    var tp = M.treatProgress(sim);
    var elapsed = (sim.t - d.t0);
    var lethal = def.lethalAfter || 900;
    var html = problemsHtml(sim);

    html += '<div class="gd-case"><div class="gd-case-name">' + esc(def.name) + '</div>' +
      '<div class="gd-case-meta">' + esc(def.dept) + ' · ' + esc(def.site || '') + ' · 危重 ' + def.triage + '/5' +
      ' · 处置进度 ' + tp.done + '/' + tp.total + '</div></div>';

    html += '<div class="gd-tier">当前职称：<b>' + esc(rank.name) + '</b> · ' +
      (lvl === 'full' ? '完整分步指南' : lvl === 'key' ? '要点式指南' : lvl === 'hint' ? '方向性提示' : '不提供病例提示') + '</div>';

    if (lvl === 'none') {
      html += '<div class="gd-none">本职称不提供病例处理提示。<br>请自行判断，或切到「临床指南」查阅通用流程。</div>';
      html += '<div class="gd-hint-line">病程已进行 ' + M.fmtT(elapsed) + '，未处理预计 ' + M.fmtT(Math.max(0, lethal - elapsed)) + ' 后不可逆。</div>';
      return html;
    }

    /* STEP 1 评估 */
    html += gdStep('1', '评估与监测', [
      '持续心电监护 + 血压 + SpO₂；建立两条静脉通路',
      '采血：血气、血常规、生化、凝血、心肌标志物（右侧「检查」标签可急查化验）',
      '双击 ECG 波形查看全 12 导联，判断心律与 ST 段改变',
      '当前：HR ' + Math.round(v.hr) + '｜BP ' + Math.round(v.sbp) + '/' + Math.round(v.dbp) +
      '｜SpO₂ ' + Math.round(v.spo2) + '%｜GCS ' + Math.round(v.gcs)
    ]);

    /* STEP 2 立即处理：必需药物 */
    var needDrugs = [], optDrugs = [];
    (def.treat || []).forEach(function (t, i) {
      if (t.type !== 'drug') return;
      var nm = (M.getDrug(t.id) || { name: t.id }).name;
      var good = sim.treatDone[i] ? '<b class="gd-ok">✓</b> ' : '';
      if (t.need) needDrugs.push(good + esc(nm) + (lvl === 'full' && t.note ? '　<span class="gd-note">' + esc(t.note) + '</span>' : ''));
      else optDrugs.push(good + esc(nm) + (lvl === 'full' && t.note ? '　<span class="gd-note">' + esc(t.note) + '</span>' : ''));
    });
    if (needDrugs.length) html += gdStep('2', '关键用药（必须完成）', needDrugs);

    /* STEP 2b 关键护理/操作（保温、降温、导尿、洗胃等） */
    var needNurse = [], optNurse = [];
    (def.treat || []).forEach(function (t, i) {
      if (t.type !== 'nurse') return;
      var nm = M.nurseName ? M.nurseName(t.id) : t.id;
      var good = sim.treatDone[i] ? '<b class="gd-ok">✓</b> ' : '';
      var line = good + esc(nm) + (lvl === 'full' && t.note ? '　<span class="gd-note">' + esc(t.note) + '</span>' : '');
      if (t.need) needNurse.push(line); else optNurse.push(line);
    });
    if (needNurse.length) html += gdStep('2b', '关键护理处置（必须完成）', needNurse);

    /* STEP 3 手术 */
    var needSurg = [], optSurg = [];
    (def.treat || []).forEach(function (t, i) {
      if (t.type !== 'surgery') return;
      var nm = M.treatLabel ? M.treatLabel(t) : (M.procName(t.proc) + ' @ ' + M.siteName(t.site));
      var good = sim.treatDone[i] ? '<b class="gd-ok">✓</b> ' : '';
      var tail = (lvl === 'full' && t.note ? '　<span class="gd-note">' + esc(t.note) + '</span>' : '');
      if (t.need) needSurg.push(good + esc(nm) + tail + '　' + surgBtn(t.site, t.proc, sim.treatDone[i] ? '查看' : '去做这台手术 →'));
      else optSurg.push(good + esc(nm) + tail + '　' + surgBtn(t.site, t.proc, '查看'));
    });
    if (lvl === 'hint') {
      html += gdStep('3', '关键治疗方向', [
        '需要药物处置：<b>' + (needDrugs.length ? needDrugs.length + ' 项' : '无') + '</b>',
        '需要手术处置：<b>' + (needSurg.length ? needSurg.length + ' 项' : '无') + '</b>' +
        (needSurg.length ? '　' + surgBtn(null, null, '打开手术室 →') : ''),
        '具体方案请自行判断或查阅「临床指南」'
      ]);
    } else {
      if (needSurg.length) html += gdStep('3', '关键手术（必须完成）', needSurg);
      if (optDrugs.length || optSurg.length || optNurse.length) {
        html += gdStep('4', '可选辅助处置', optDrugs.concat(optSurg, optNurse));
      }
    }

    /* 监测目标 */
    html += gdStep(lvl === 'hint' ? '4' : '5', '监测目标', [
      'MAP ≥ 65 mmHg、尿量 ≥ 30 mL/h',
      'SpO₂ ≥ 94%、乳酸逐步下降',
      lvl === 'full' ? '病因处置全部完成后，生命体征平稳维持 45 秒即判定转归良好' : '完成全部必需处置后维持稳定即可转归'
    ]);

    /* 病程时间轴 */
    var stages = def.stages || [];
    if (stages.length && lvl !== 'none') {
      var lines = stages.map(function (s, i) {
        var at = M.fmtT(s.t / ((rank.progMul) || 1));
        var here = (i === d.stage) ? ' ←当前' : '';
        var lethalTag = s.lethal ? ' <b class="gd-warn">致命</b>' : '';
        if (lvl === 'full') return '第 ' + at + '　' + esc(s.label) + lethalTag + here + '　<span class="gd-note">' + esc(s.log || '') + '</span>';
        return '第 ' + at + '　' + esc(s.label) + lethalTag + here;
      });
      html += gdStep(lvl === 'hint' ? '5' : '6', '病程进展时间轴', lines);
    }

    /* 避免的错误 */
    if (def.harm && def.harm.length && lvl !== 'hint') {
      html += '<div class="gd-step gd-danger"><div class="gd-step-h"><i>⚠</i>避免以下处置</div><ul>' +
        def.harm.map(function (h) {
          var nm = (M.getDrug(h.id) || { name: h.id }).name;
          return '<li>' + esc(nm) + '：' + esc(h.msg) + '</li>';
        }).join('') + '</ul></div>';
    }

    html += '<div class="gd-hint-line">病程已进行 ' + M.fmtT(elapsed) + '｜未处理预计 ' + M.fmtT(Math.max(0, lethal - elapsed)) + ' 后不可逆</div>';
    return html;
  }

  /* 通用指南手册 */
  function guideManualHtml(filter) {
    var list = M.GUIDES || [];
    var q = (filter || '').trim().toLowerCase();
    if (!list.length) return '<div class="empty">指南数据未加载（js/data-guide.js）</div>';
    var hit = list.filter(function (g) {
      if (!q) return true;
      var hay = (g.title + ' ' + (g.tags || []).join(' ') + ' ' +
        (g.steps || []).map(function (s) { return s.h + ' ' + (s.items || []).join(' '); }).join(' ')).toLowerCase();
      return hay.indexOf(q) >= 0;
    });
    if (!hit.length) return '<div class="empty">没有匹配的指南条目</div>';
    return hit.map(function (g, i) {
      return '<div class="gd-entry' + (i === 0 ? ' open' : '') + '" data-gid="' + esc(g.id) + '">' +
        '<div class="gd-entry-h"><span class="gd-arrow">›</span><span class="gd-entry-t">' + esc(g.title) + '</span>' +
        '<span class="gd-tags">' + (g.tags || []).slice(0, 3).map(function (t) { return '<em>' + esc(t) + '</em>'; }).join('') + '</span></div>' +
        '<div class="gd-entry-b">' + (g.steps || []).map(function (s) {
          return '<div class="gd-sub"><div class="gd-sub-h">' + esc(s.h) + '</div><ul>' +
            (s.items || []).map(gdItem).join('') + '</ul></div>';
        }).join('') + '</div></div>';
    }).join('');
  }

  function bindGuideEntries(box) {
    if (!box) return;
    Array.prototype.forEach.call(box.querySelectorAll('.gd-entry-h'), function (h) {
      h.addEventListener('click', function () {
        var e = h.parentNode;
        e.classList.toggle('open');
      });
    });
  }

  /* 医师档案 */
  function guideDoctorHtml(sim) {
    var rank = sim.rank || M.getRank('resident');
    var st = M.GAME.stats || { seen: 0, saved: 0, lost: 0, score: 0, best: 0 };
    var rate = st.seen ? Math.round(st.saved / st.seen * 100) : 0;
    var html = '<div class="gd-doc">' +
      '<div class="gd-doc-name">' + esc(sim.doctor) + '</div>' +
      '<div class="gd-doc-rank">' + esc(rank.name) + '</div>' +
      '<div class="gd-doc-desc">' + esc(rank.desc) + '</div>' +
      '<ul class="gd-doc-list">' + (rank.bullets || []).map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' +
      '</div>';
    html += '<div class="gd-stats">' +
      '<div><span>接诊</span><b>' + st.seen + '</b></div>' +
      '<div><span>救活</span><b class="ok">' + st.saved + '</b></div>' +
      '<div><span>死亡</span><b class="bad">' + st.lost + '</b></div>' +
      '<div><span>存活率</span><b>' + rate + '%</b></div>' +
      '<div><span>累计评分</span><b>' + st.score + '</b></div>' +
      '<div><span>最佳单例</span><b>' + st.best + '</b></div>' +
      '</div>';
    html += '<div class="gd-hint-line">战绩保存在本机浏览器中。换职称不影响历史战绩。</div>';
    html += '<div class="gd-tier" style="margin-top:12px">想换职称？点右上角 <b>↻</b> 重新接诊会保留当前职称；刷新页面可回到启动页重选。</div>';
    return html;
  }

  /* 右栏「指南」标签 */
  UI.renderGuide = function (sim) {
    var box = el('guideBody'); if (!box) return;
    var probs = M.problems ? M.problems(sim) : [];
    var sig = (sim.disease ? (sim.disease.stage + '|' + Object.keys(sim.treatDone).length + '|' + Math.floor((sim.t - sim.disease.t0) / 10)) : 'none') +
      '|p:' + probs.map(function (p) { return p.id; }).join(',');
    if (sig === lastGuideSig) return;
    lastGuideSig = sig;
    box.innerHTML = guideCaseHtml(sim) +
      '<button class="btn ghost gd-open" data-guide-open style="width:100%;margin-top:12px">打开完整临床指南手册</button>';
    bindSurgButtons(box, sim);
    bindProblemButtons(box, sim);
    var btn = box.querySelector('[data-guide-open]');
    if (btn) btn.addEventListener('click', function () { safe('处理指南', function () { UI.openGuide(sim); }); });
  };
  var lastGuideSig = '';

  /* 完整指南弹窗 */
  UI.openGuide = function (sim) {
    if (!sim) sim = M.GAME.sim;
    if (!sim) return;
    var rank = sim.rank || M.getRank('resident');
    var body = '<div class="gd-wrap">' +
      '<div class="gd-tabs" id="gdTabs">' +
      '<button data-gt="case" class="on">当前病例</button>' +
      '<button data-gt="manual">临床指南手册（' + ((M.GUIDES || []).length) + '）</button>' +
      '<button data-gt="doctor">医师档案</button>' +
      '</div>' +
      '<div class="gd-panes">' +
      '<div class="gd-pane" data-gp="case"><div id="gdCase"></div></div>' +
      '<div class="gd-pane hidden" data-gp="manual">' +
      '<input id="gdSearch" class="gd-search" type="search" placeholder="搜索指南：心跳骤停 / 休克 / 高钾 / 输血反应 / 中毒…" autocomplete="off">' +
      '<div id="gdManual" class="gd-manual"></div>' +
      '</div>' +
      '<div class="gd-pane hidden" data-gp="doctor"><div id="gdDoctor"></div></div>' +
      '</div></div>';

    var lastGdT = 0;
    UI.openModal(UI.modalShell('wide', UI.modalHead('处理指南', sim.doctor + ' · ' + rank.name), body), function (sim2) {
      var now = (window.performance && performance.now) ? performance.now() : Date.now();
      if (now - lastGdT < 450) return;
      lastGdT = now;
      var c = el('gdCase');
      if (!c) return;
      var pane = c.parentNode;
      if (pane && pane.classList.contains('hidden')) return;
      c.innerHTML = guideCaseHtml(sim2);
      bindSurgButtons(c, sim2);
      bindProblemButtons(c, sim2);
    });
    UI.bindClose();
    var root = el('modalRoot');

    var tabs = el('gdTabs');
    if (tabs) tabs.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      Array.prototype.forEach.call(tabs.children, function (x) { x.classList.toggle('on', x === b); });
      Array.prototype.forEach.call(root.querySelectorAll('.gd-pane'), function (p) {
        p.classList.toggle('hidden', p.dataset.gp !== b.dataset.gt);
      });
    });

    var caseBox = el('gdCase');
    if (caseBox) { caseBox.innerHTML = guideCaseHtml(sim); bindSurgButtons(caseBox, sim); }

    var man = el('gdManual');
    if (man) {
      man.innerHTML = guideManualHtml('');
      bindGuideEntries(man);
      var sInp = el('gdSearch');
      if (sInp) sInp.addEventListener('input', function () {
        man.innerHTML = guideManualHtml(sInp.value);
        bindGuideEntries(man);
      });
    }

    var doc = el('gdDoctor');
    if (doc) doc.innerHTML = guideDoctorHtml(sim);
  };

  /* ================= 全局检索（命令面板） ================= */
  var KIND_NAME = { act: '操作', vital: '体征', drug: '药品', guide: '指南' };
  var PAL_ACTIONS = [
    { n: '处理指南 · 当前病例', d: '分步处理提示、病程时间轴、监测目标', kw: 'guide 指南 处理 流程 怎么办', run: function (sim) { UI.openGuide(sim); } },
    { n: '手术室', d: '33 部位 × 18 术式，术中处理并发症', kw: 'surgery 开刀 术式 手术', run: function (sim) { UI.openSurgery(sim); } },
    { n: '输血', d: '红细胞 / 血浆 / 血小板 · 交叉配血', kw: 'transfusion blood 血型 溶血', run: function (sim) { UI.openTransfuse(sim); } },
    { n: '电击除颤', d: '非同步除颤 / 同步电复律', kw: 'defib shock 复律 除颤 电击', run: function (sim) { UI.openShock(sim); } },
    { n: '胸外按压 CPR', d: '开始 / 停止胸外按压', kw: 'cpr 按压 复苏', run: function (sim) { M.setCPR(sim, !sim.cpr); } },
    { n: '气道 / 氧疗', d: '面罩吸氧 / 球囊通气 / 气管插管', kw: 'airway 氧 插管 通气 呼吸机', run: function (sim) { UI.openAirway(sim); } },
    { n: '检查 / 化验 / 影像', d: '床旁检验、实验室、影像与器官功能概览', kw: 'exam 查体 检查 体检 化验 影像 ct 超声', run: function (sim) { UI.openExam(sim); } },
    { n: '护理处置', d: '导尿 / 胃管 / 复温 / 降温 / 休克体位', kw: 'nurse 护理 导尿 胃管', run: function (sim) { UI.openNurse(sim); } },
    { n: '12 导联心电图', d: '全导联放大实时视图 + 自动判读', kw: 'ecg ekg 心电图 12导联', run: function (sim) { UI.open12Lead(sim); } },
    { n: '急查血气分析', d: 'pH / 氧合 / 乳酸，约 10 秒回报', kw: 'abg 血气 氧合 乳酸', run: function (sim) { if (M.orderExam) M.orderExam(sim, 'abg'); UI.showTab('exam'); } },
    { n: '急查电解质 + 心肌标志物', d: '钾钠钙镁 / 肌钙蛋白 / BNP', kw: 'lab 化验 电解质 钾 肌钙蛋白', run: function (sim) { if (M.orderExam) { M.orderExam(sim, 'lytes'); M.orderExam(sim, 'troponin'); } UI.showTab('exam'); } },
    { n: '毒物筛查', d: '阿片 / 苯二氮䓬 / 农药 / 醇类', kw: 'tox 毒物 中毒 筛查', run: function (sim) { if (M.orderExam) M.orderExam(sim, 'tox'); UI.showTab('exam'); } },
    { n: '暂停 / 继续', d: '切换时间流速', kw: 'pause speed 速度 暂停', run: function () { M.GAME.setSpeed(M.GAME.speed === 0 ? 1 : 0); } },
    { n: '使用说明', d: '玩法与机制说明', kw: 'help 帮助 说明 教程', run: function () { UI.openHelp(); } }
  ];
  var palItems = [], palFiltered = [], palIdx = 0, palOpen = false, palDrugCache = null;

  function buildPalette(sim) {
    var items = [];
    PAL_ACTIONS.forEach(function (a) {
      items.push({ kind: 'act', label: a.n, sub: a.d, group: '操作', hay: (a.n + ' ' + a.d + ' ' + (a.kw || '')).toLowerCase(), run: function () { a.run(sim); } });
    });
    VITAL_GROUPS.forEach(function (g) {
      items.push({
        kind: 'vital', label: g.name + ' 生命体征', sub: g.keys.length + ' 项指标', group: '体征分组',
        hay: (g.name + ' 生命体征 指标 分组 vital ' + g.keys.join(' ')).toLowerCase(),
        run: function () { UI.showVitalGroup(g.id); }
      });
    });
    (M.GUIDES || []).forEach(function (g) {
      items.push({
        kind: 'guide', label: g.title, sub: (g.tags || []).join(' / '), group: '临床指南',
        hay: (g.title + ' 指南 ' + (g.tags || []).join(' ') + ' ' +
          (g.steps || []).map(function (s) { return s.h + ' ' + (s.items || []).join(' '); }).join(' ')).toLowerCase(),
        run: function () {
          UI.openGuide(sim);
          setTimeout(function () {
            var tb = document.querySelector('#gdTabs [data-gt="manual"]');
            if (tb) tb.click();
            var es = document.querySelectorAll('.gd-entry');
            Array.prototype.forEach.call(es, function (x) { x.classList.remove('open'); });
            var e = document.querySelector('.gd-entry[data-gid="' + g.id + '"]');
            if (e) {
              e.classList.add('open');
              if (e.scrollIntoView) { try { e.scrollIntoView({ block: 'start' }); } catch (err) { } }
            }
          }, 60);
        }
      });
    });
    if (!palDrugCache) {
      palDrugCache = (M.DRUGS || []).map(function (D) {
        return {
          kind: 'drug', label: D.name, sub: D.cls || '', group: '药品', id: D.id,
          hay: (D.name + ' ' + (D.alias || '') + ' ' + (D.cls || '') + ' ' + (D.id || '') + ' ' +
            (D.effects || []).map(function (e) { return (M.TMETA[e.t] ? M.TMETA[e.t].n : e.t); }).join(' ')).toLowerCase()
        };
      });
    }
    palDrugCache.forEach(function (d) {
      items.push({
        kind: 'drug', label: d.label, sub: d.sub, group: '药品', hay: d.hay,
        run: function () { UI.openDrug(sim, d.id); }
      });
    });
    return items;
  }

  function renderPalette() {
    var list = el('paletteList');
    var cnt = el('paletteCount');
    if (!palFiltered.length) {
      list.innerHTML = '<div class="empty">没有匹配项<br><span style="color:#5b6f80">试试药品名、分类、或「手术 / 输血 / 除颤」</span></div>';
      if (cnt) cnt.textContent = '0 项';
      return;
    }
    var html = '', lastGroup = '';
    palFiltered.forEach(function (it, i) {
      if (it.group !== lastGroup) { lastGroup = it.group; html += '<div class="pal-group">' + lastGroup + '</div>'; }
      html += '<div class="pal-item' + (i === palIdx ? ' on' : '') + '" data-i="' + i + '">' +
        '<span class="pi-kind k-' + it.kind + '">' + (KIND_NAME[it.kind] || it.kind) + '</span>' +
        '<span class="pi-title">' + esc(it.label) + '</span>' +
        '<span class="pi-sub">' + esc(it.sub || '') + '</span></div>';
    });
    list.innerHTML = html;
    if (cnt) cnt.textContent = palFiltered.length + ' 项';
    var on = list.querySelector('.pal-item.on');
    if (on && on.scrollIntoView) { try { on.scrollIntoView({ block: 'nearest' }); } catch (e) { } }
    Array.prototype.forEach.call(list.querySelectorAll('.pal-item'), function (n) {
      var i = parseInt(n.dataset.i, 10);
      n.addEventListener('click', function () { palIdx = i; runPalette(); });
      n.addEventListener('mousemove', function () {
        if (palIdx === i) return;
        palIdx = i;
        Array.prototype.forEach.call(list.querySelectorAll('.pal-item'), function (x) { x.classList.toggle('on', x === n); });
      });
    });
  }

  function filterPalette(q) {
    q = (q || '').trim().toLowerCase();
    palFiltered = q ? palItems.filter(function (it) { return it.hay.indexOf(q) >= 0; }) : palItems;
    palIdx = 0;
    renderPalette();
  }

  function runPalette() {
    var it = palFiltered[palIdx];
    if (!it) return;
    UI.closePalette();
    try { it.run(); } catch (err) { UI.toast('warn', '执行失败', (err && err.message) ? err.message : ''); }
  }

  UI.openPalette = function () {
    var sim = M.GAME.sim;
    if (!sim) return;
    if (UI.isModalOpen()) UI.closeModal();
    palItems = buildPalette(sim);
    palOpen = true;
    el('palette').classList.remove('hidden');
    var inp = el('paletteInput');
    if (inp) { inp.value = ''; inp.focus(); }
    filterPalette('');
  };
  UI.closePalette = function () {
    palOpen = false;
    var p = el('palette');
    if (p) p.classList.add('hidden');
  };
  UI.isPaletteOpen = function () { return palOpen; };
  UI.togglePalette = function () { if (palOpen) UI.closePalette(); else UI.openPalette(); };

  UI.initPalette = function () {
    var inp = el('paletteInput');
    if (inp) {
      inp.addEventListener('input', function () { filterPalette(inp.value); });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); if (palIdx < palFiltered.length - 1) palIdx++; renderPalette(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); if (palIdx > 0) palIdx--; renderPalette(); }
        else if (e.key === 'Enter') { e.preventDefault(); runPalette(); }
        else if (e.key === 'Escape') { e.preventDefault(); UI.closePalette(); }
      });
    }
    var p = el('palette');
    if (p) p.addEventListener('click', function (e) { if (e.target === p) UI.closePalette(); });
    var c = el('paletteClose');
    if (c) c.addEventListener('click', function () { UI.closePalette(); });
    var st = el('btnSearch');
    if (st) st.addEventListener('click', function () { UI.openPalette(); });
  };

  /* ================= 全量刷新 ================= */
  var lastPanelT = 0;

  UI.tick = function (sim, nowMs) {
    safe('波形绘制', UI.drawWaves, sim);
    if (nowMs - lastPanelT > 180) {
      lastPanelT = nowMs;
      safe('顶栏', UI.renderTop, sim);
      safe('生命体征', UI.renderVitals, sim);
      safe('疾病状态', UI.renderDisease, sim);
      safe('处理指南', UI.renderGuide, sim);
      safe('症状列表', UI.renderSymptoms, sim);
      safe('处方列表', UI.renderRx, sim);
      safe('事件日志', UI.renderLog, sim);
      safe('检查化验', UI.renderExam, sim);
    }
    if (UI.isModalOpen()) safe('弹窗刷新', UI.tickModal, sim);
  };

})();