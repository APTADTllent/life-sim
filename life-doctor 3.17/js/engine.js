/* ============================================================
   LIFE SIM · 引擎
   生理稳态 / 器官耦合 / 药代-药效动力学 / 疾病进程 / 手术 / 输血
   ============================================================ */
window.M = window.M || {};
(function () {
  'use strict';
  var M = window.M;
  var LN2 = Math.log(2);

  /* ================= 1. 工具 ================= */
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function irnd(a, b) { return Math.floor(rnd(a, b + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function chance(p) { return Math.random() < p; }
  function fmtT(s) {
    s = Math.max(0, Math.floor(s));
    var m = Math.floor(s / 60), ss = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss;
  }
  function fmtClock(d) {
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }
  function fmtDate(d) {
    return d.getFullYear() + '-' + (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1) + '-' +
      (d.getDate() < 10 ? '0' : '') + d.getDate();
  }
  M.clamp = clamp; M.rnd = rnd; M.irnd = irnd; M.pick = pick; M.chance = chance;
  M.fmtT = fmtT; M.fmtClock = fmtClock; M.fmtDate = fmtDate;

  /* ================= 2. 生理基线 & 靶点元数据 ================= */
  var HEALTHY = {
    hr: 76, sbp: 118, dbp: 74, map: 89, co: 5.2, svr: 1100, sv: 70, contractility: 100,
    rr: 16, tv: 450, spo2: 98, paco2: 40, pao2: 96, airway: 100, bronchospasm: 0, secretions: 0,
    brain: 100, gcs: 15, sedation: 0, pain: 0, seizure: 0, pupil: 3, icp: 10, emesis: 0,
    k: 4.2, na: 140, ca: 2.3, glucose: 5.6, ph: 7.4, lactate: 1.0, temp: 36.8, osmo: 290,
    mg: 0.9, phos: 1.15, ck: 120, ammonia: 22,
    hb: 14, plt: 220, inr: 1.0, wbc: 7, volume: 5000, clotting: 100,
    renal: 100, hepatic: 100, urine: 60, histamine: 0, anaphylaxis: 0,
    qt: 400, avconduction: 100, arrhythmia: 0, coronary: 100, gi: 100, uterus: 100, immune: 100,
    svo2: 72, do2: 950, vo2: 250, cao2: 18.5, symp: 35
  };
  M.HEALTHY = HEALTHY;

  /* n=显示名 u=单位 lo/hi=正常范围 cl/ch=危急范围 dec=小数位 fmt=特殊 */
  var TMETA = {
    hr: { n: '心率', u: 'bpm', lo: 50, hi: 110, cl: 30, ch: 180, dec: 0 },
    sbp: { n: '收缩压', u: 'mmHg', lo: 90, hi: 150, cl: 60, ch: 210, dec: 0 },
    dbp: { n: '舒张压', u: 'mmHg', lo: 55, hi: 95, cl: 30, ch: 130, dec: 0 },
    map: { n: '平均动脉压', u: 'mmHg', lo: 65, hi: 110, cl: 45, ch: 155, dec: 0 },
    co: { n: '心输出量', u: 'L/min', lo: 4, hi: 8, cl: 2, ch: 12, dec: 1 },
    svr: { n: '体循环阻力', u: 'dyn·s·cm⁻⁵', lo: 800, hi: 1400, cl: 400, ch: 2400, dec: 0 },
    sv: { n: '每搏输出量', u: 'mL', lo: 60, hi: 100, cl: 25, ch: 160, dec: 0 },
    contractility: { n: '心肌收缩力', u: '%', lo: 70, hi: 130, cl: 30, ch: 200, dec: 0 },
    rr: { n: '呼吸频率', u: '/min', lo: 10, hi: 22, cl: 5, ch: 38, dec: 0 },
    tv: { n: '潮气量', u: 'mL', lo: 350, hi: 600, cl: 150, ch: 900, dec: 0 },
    spo2: { n: '血氧饱和度', u: '%', lo: 94, hi: 100, cl: 85, ch: 101, dec: 0, inv: 1 },
    paco2: { n: '呼末CO₂', u: 'mmHg', lo: 35, hi: 45, cl: 25, ch: 65, dec: 0 },
    pao2: { n: '动脉氧分压', u: 'mmHg', lo: 80, hi: 100, cl: 50, ch: 500, dec: 0, inv: 1 },
    airway: { n: '气道通畅度', u: '%', lo: 85, hi: 100, cl: 50, ch: 101, dec: 0, inv: 1 },
    bronchospasm: { n: '支气管痉挛', u: '%', lo: 0, hi: 15, cl: 0, ch: 70, dec: 0 },
    secretions: { n: '气道分泌物', u: '%', lo: 0, hi: 20, cl: 0, ch: 80, dec: 0 },
    brain: { n: '脑电活动', u: '%', lo: 70, hi: 100, cl: 25, ch: 101, dec: 0, inv: 1 },
    gcs: { n: 'GCS 意识', u: '分', lo: 13, hi: 15, cl: 6, ch: 15, dec: 0, inv: 1 },
    sedation: { n: '镇静深度', u: '%', lo: 0, hi: 30, cl: 0, ch: 90, dec: 0 },
    pain: { n: '疼痛评分', u: '分', lo: 0, hi: 30, cl: 0, ch: 80, dec: 0 },
    seizure: { n: '癫痫活动', u: '%', lo: 0, hi: 5, cl: 0, ch: 60, dec: 0 },
    pupil: { n: '瞳孔直径', u: 'mm', lo: 2, hi: 5, cl: 1, ch: 8, dec: 1 },
    icp: { n: '颅内压', u: 'mmHg', lo: 5, hi: 15, cl: 0, ch: 30, dec: 0 },
    emesis: { n: '恶心呕吐', u: '%', lo: 0, hi: 10, cl: 0, ch: 80, dec: 0 },
    k: { n: '血钾', u: 'mmol/L', lo: 3.5, hi: 5.3, cl: 2.5, ch: 6.5, dec: 1 },
    mg: { n: '血镁', u: 'mmol/L', lo: 0.75, hi: 1.05, cl: 0.40, ch: 2.0, dec: 2 },
    phos: { n: '血磷', u: 'mmol/L', lo: 0.80, hi: 1.45, cl: 0.30, ch: 2.6, dec: 2 },
    ck: { n: '肌酸激酶', u: 'U/L', lo: 30, hi: 200, cl: 0, ch: 5000, dec: 0 },
    ammonia: { n: '血氨', u: 'µmol/L', lo: 11, hi: 35, cl: 0, ch: 100, dec: 0 },
    na: { n: '血钠', u: 'mmol/L', lo: 135, hi: 147, cl: 120, ch: 160, dec: 0 },
    ca: { n: '血钙', u: 'mmol/L', lo: 2.1, hi: 2.6, cl: 1.6, ch: 3.5, dec: 2 },
    glucose: { n: '血糖', u: 'mmol/L', lo: 3.9, hi: 7.8, cl: 2.8, ch: 20, dec: 1 },
    ph: { n: '酸碱 pH', u: '', lo: 7.35, hi: 7.45, cl: 7.1, ch: 7.6, dec: 2 },
    lactate: { n: '乳酸', u: 'mmol/L', lo: 0.5, hi: 2.2, cl: 0, ch: 6, dec: 1 },
    temp: { n: '核心体温', u: '℃', lo: 36, hi: 37.5, cl: 34, ch: 39.5, dec: 1 },
    osmo: { n: '血浆渗透压', u: 'mOsm', lo: 280, hi: 300, cl: 260, ch: 330, dec: 0 },
    hb: { n: '血红蛋白', u: 'g/dL', lo: 11, hi: 17, cl: 7, ch: 20, dec: 1, inv: 1 },
    plt: { n: '血小板', u: '×10⁹/L', lo: 100, hi: 350, cl: 40, ch: 800, dec: 0, inv: 1 },
    inr: { n: '凝血 INR', u: '', lo: 0.8, hi: 1.2, cl: 0, ch: 3, dec: 2 },
    wbc: { n: '白细胞', u: '×10⁹/L', lo: 4, hi: 11, cl: 1.5, ch: 25, dec: 1 },
    volume: { n: '体液总量', u: 'mL', lo: 4000, hi: 6000, cl: 2600, ch: 12000, dec: 0, inv: 1 },
    gut: { n: '胃内容量', u: 'mL', lo: 0, hi: 3000, cl: -1, ch: 10000, dec: 0, inv: 1 },
    clotting: { n: '凝血功能', u: '%', lo: 70, hi: 100, cl: 30, ch: 101, dec: 0, inv: 1 },
    renal: { n: '肾功能', u: '%', lo: 70, hi: 100, cl: 30, ch: 101, dec: 0, inv: 1 },
    hepatic: { n: '肝功能', u: '%', lo: 70, hi: 100, cl: 30, ch: 101, dec: 0, inv: 1 },
    urine: { n: '尿量', u: 'mL/h', lo: 30, hi: 120, cl: 8, ch: 500, dec: 0, inv: 1 },
    histamine: { n: '组胺释放', u: '%', lo: 0, hi: 10, cl: 0, ch: 70, dec: 0 },
    anaphylaxis: { n: '过敏反应', u: '%', lo: 0, hi: 5, cl: 0, ch: 60, dec: 0 },
    qt: { n: 'QT 间期', u: 'ms', lo: 350, hi: 450, cl: 280, ch: 520, dec: 0 },
    avconduction: { n: '房室传导', u: '%', lo: 80, hi: 100, cl: 40, ch: 101, dec: 0, inv: 1 },
    arrhythmia: { n: '致心律失常性', u: '%', lo: 0, hi: 20, cl: 0, ch: 70, dec: 0 },
    coronary: { n: '冠脉灌注', u: '%', lo: 75, hi: 100, cl: 40, ch: 101, dec: 0, inv: 1 },
    gi: { n: '胃肠功能', u: '%', lo: 70, hi: 100, cl: 30, ch: 101, dec: 0, inv: 1 },
    uterus: { n: '子宫张力', u: '%', lo: 0, hi: 20, cl: 0, ch: 80, dec: 0 },
    immune: { n: '免疫状态', u: '%', lo: 70, hi: 100, cl: 30, ch: 101, dec: 0, inv: 1 },
    svo2: { n: '混合静脉血氧', u: '%', lo: 65, hi: 75, cl: 40, ch: 85, dec: 0, inv: 1 },
    do2: { n: '氧输送 DO₂', u: 'mL/min', lo: 600, hi: 1200, cl: 300, ch: 1700, dec: 0, inv: 1 },
    vo2: { n: '氧耗 VO₂', u: 'mL/min', lo: 180, hi: 320, cl: 0, ch: 600, dec: 0 },
    cao2: { n: '动脉氧含量', u: 'mL/dL', lo: 16, hi: 20, cl: 8, ch: 24, dec: 1, inv: 1 },
    symp: { n: '交感张力', u: '%', lo: 20, hi: 60, cl: 0, ch: 120, dec: 0 }
  };
  M.TMETA = TMETA;

  /* 体液 / 胃内容量的硬上限：超过即容量性心脏停搏，且容量恢复前无法复苏 */
  var FLUID_MAX = 12000;    /* 体液总量 > 12 L */
  var FLUID_SAFE = 6500;    /* 放血 / 利尿回到这个水平才可能恢复自主循环 */
  var GUT_MAX = 10000;      /* 胃内容量 ≥ 10 L */
  var GUT_SAFE = 4000;      /* 洗胃清除到这个水平以下才可能恢复 */
  M.FLUID_MAX = FLUID_MAX; M.FLUID_SAFE = FLUID_SAFE;
  M.GUT_MAX = GUT_MAX; M.GUT_SAFE = GUT_SAFE;

  /* 估算循环血容量（mL）：成人男性 70 mL/kg、女性 65 mL/kg，儿童 80 mL/kg。
     补液/输血的“过量”本质是对血容量的占比，不是某个固定的毫升数。 */
  function bloodVolume(sim) {
    var p = (sim && sim.patient) || {};
    var kg = clamp(p.weight || 70, 2, 220);
    var mlkg = (p.sex === '女') ? 65 : 70;
    if (p.age !== undefined && p.age < 16) mlkg = 80;
    return Math.round(clamp(kg * mlkg, 1200, 7500) / 50) * 50;
  }
  M.bloodVolume = bloodVolume;

  /* 单次快速输注的容量过负荷阈值：约 40% 血容量（成人 1.5–2.5 L）。
     以 g 计的药物（白蛋白）用 D.fluidLimit 单独给。 */
  M.fluidLimit = function (sim, D) {
    if (D && D.fluidLimit) return D.fluidLimit;
    return Math.max(750, Math.round(bloodVolume(sim) * 0.4 / 50) * 50);
  };

  /* 近 2 小时累计补液量（mL），用于面板提示，不参与判定 */
  M.fluidLoad = function (sim, windowSec) {
    var win = windowSec || 7200, ml = 0;
    var list = (sim && sim.rxList) || [];
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (!r.D || !r.D.fluid) continue;
      if (sim.t - r.t0 > win) continue;
      /* 滴注按「速率 × 已滴时间」折算，静推按单次剂量 */
      var mlOne = r.infusion ? (r.dose || 0) * Math.max(0, sim.t - r.t0) / 3600 : (r.dose || 0);
      ml += mlOne * (r.D.fluidMlPer || 1);
    }
    return Math.round(ml);
  };

  /* 生命体征主卡片（中栏显示） */
  M.VITAL_CARDS = [
    { k: 'hr', big: 1, sub: '心律' }, { k: 'sbp', big: 1 }, { k: 'spo2', big: 1 },
    { k: 'rr', big: 1 }, { k: 'temp', big: 1 }, { k: 'paco2', big: 1 },
    { k: 'map', big: 0 }, { k: 'dbp', big: 0 }, { k: 'co', big: 0 },
    { k: 'gcs', big: 0 }, { k: 'brain', big: 0 }, { k: 'pain', big: 0 },
    { k: 'k', big: 0 }, { k: 'glucose', big: 0 }, { k: 'lactate', big: 0 },
    { k: 'hb', big: 0 }, { k: 'ph', big: 0 }, { k: 'urine', big: 0 },
    { k: 'volume', big: 0 }, { k: 'renal', big: 0 }, { k: 'hepatic', big: 0 },
    { k: 'inr', big: 0 }, { k: 'plt', big: 0 }, { k: 'wbc', big: 0 },
    { k: 'na', big: 0 }, { k: 'ca', big: 0 }, { k: 'osmo', big: 0 },
    { k: 'coronary', big: 0 }, { k: 'icp', big: 0 }, { k: 'airway', big: 0 }
  ];

  /* ================= 医师职称 = 难度 ================= */
  M.DOCTOR_RANKS = [
    {
      id: 'trainee', name: '见习医师', short: '见习', rank: '见习医师',
      desc: '分步指南（含剂量） · 手术并发症 ×0.6 · 病程进展 ×0.55 · 只接诊轻中度病例',
      compMul: 0.6, progMul: 0.55, guide: 'full', doseHint: true, triageMin: 1, triageMax: 3,
      bullets: ['每一例都给出分步处理指南（含药名、剂量、术式）', '只在轻中度病例（危重 1–3 级）里接诊，不会遇到骤停/大出血', '术中并发症概率降低 40%，病程进展放慢 45%', '给药面板显示常用剂量与过量阈值']
    },
    {
      id: 'intern', name: '实习医师', short: '实习', rank: '实习医师',
      desc: '全程分步指南 · 手术并发症 ×0.75 · 病程进展 ×0.85 · 剂量提示全开',
      compMul: 0.75, progMul: 0.70, guide: 'full', doseHint: true, triageMin: 1,
      bullets: ['每一例都给出分步处理指南（含药名、剂量、术式）', '术中并发症概率降低 25%', '病情进展速度放慢 15%，容错时间更长', '给药面板显示常用剂量与过量阈值']
    },
    {
      id: 'resident', name: '住院医师', short: '住院', rank: '住院医师',
      desc: '要点式指南 · 手术并发症 ×1.0 · 标准病程 · 剂量提示开',
      compMul: 1.0, progMul: 1.0, guide: 'key', doseHint: true, triageMin: 1,
      bullets: ['指南只给出处理要点（药名与术式，不含剂量备注）', '术中并发症概率为标准值', '病情按标准速度进展', '给药面板显示常用剂量与过量阈值']
    },
    {
      id: 'attending', name: '主治医师', short: '主治', rank: '主治医师',
      desc: '方向性提示 · 手术并发症 ×1.2 · 病程进展 ×1.15 · 剂量提示关闭',
      compMul: 1.2, progMul: 1.40, guide: 'hint', doseHint: false, triageMin: 2,
      bullets: ['指南只提示「需要几项关键处置」与是否需手术', '术中并发症概率提高 20%', '病情进展加快 15%', '给药面板不再提示常用剂量与过量阈值']
    },
    {
      id: 'associate', name: '副主任医师', short: '副高', rank: '副主任医师',
      desc: '只给方向 · 手术并发症 ×1.3 · 病程进展 ×1.65 · 病人更重',
      compMul: 1.3, progMul: 1.65, guide: 'hint', doseHint: false, triageMin: 2,
      bullets: ['只提示「需要几项关键处置」与是否需手术，不给具体药名', '术中并发症概率提高 30%', '病情进展加快 65%，抢救窗口明显变短', '危重 2 级以上病例，且更容易遇到创伤/中毒']
    },
    {
      id: 'chief', name: '主任医师', short: '主任', rank: '主任医师',
      desc: '无病例提示 · 手术并发症 ×1.4 · 病程进展 ×1.9 · 病人更危重',
      compMul: 1.4, progMul: 1.90, guide: 'none', doseHint: false, triageMin: 3,
      bullets: ['完全不给病例提示，只能依靠通用指南与自己的判断', '术中并发症概率提高 40%', '病情进展加快 30%，抢救窗口更短', '只会遇到危重度 3 级以上的病人', '给药面板不再提示剂量']
    }
  ];
  M.getRank = function (id) {
    var R = M.DOCTOR_RANKS;
    for (var i = 0; i < R.length; i++) if (R[i].id === id) return R[i];
    for (var j = 0; j < R.length; j++) if (R[j].id === 'resident') return R[j];
    return R.length > 1 ? R[1] : R[0];
  };

  /* ================= 3. 药物索引 ================= */
  var DRUG_BY_ID = {};
  /* 别名归一：疾病数据里可能使用习惯名，统一映射到药库真实 id */
  var DRUG_ALIAS = {
    noradrenaline: 'norepinephrine', levophed: 'norepinephrine', norepinephrin: 'norepinephrine',
    adrenaline: 'epinephrine', paracetamol: 'acetaminophen', dextrose_50: 'dextrose_50',
    glucose_50: 'dextrose_50', d50: 'dextrose_50', normal_saline: 'saline', ns: 'saline',
    lr: 'ringer_lactate', ringers: 'ringer_lactate', kcl: 'potassium_chloride',
    vitamin_k1: 'vitamin_k', ffp: 'fresh_frozen_plasma', ptu: 'propylthiouracil',
    midazolam_hcl: 'midazolam', furosemide_iv: 'furosemide', ceftriaxone_sodium: 'ceftriaxone'
  };
  function normDrugId(id) { return DRUG_ALIAS[id] || id; }
  M.normDrugId = normDrugId;

  function indexDrugs() {
    DRUG_BY_ID = {};
    var all = [];
    if (M.DRUGS_BASE) all = all.concat(M.DRUGS_BASE);
    else if (M.DRUGS) all = all.concat(M.DRUGS);
    ['M.DRUGS2', 'M.DRUGS3', 'M.DRUGS4', 'M.DRUGS5'].forEach(function (k, i) {
      var arr = [M.DRUGS2, M.DRUGS3, M.DRUGS4, M.DRUGS5][i];
      if (arr && arr.length) all = all.concat(arr);
    });
    /* M.DRUGS 会被本函数改写为合并后的总表：第一次调用时把原始表留底，
       之后再调用（热重载 / 测试）不会把同一批药重复叠加。 */
    M.DRUGS_BASE = M.DRUGS_BASE || (M.DRUGS ? M.DRUGS.slice() : []);
    var seen = {};
    var uniq = [];
    for (var j = 0; j < all.length; j++) {
      var dj = all[j];
      if (!dj || !dj.id || seen[dj.id]) continue;
      seen[dj.id] = 1;
      uniq.push(dj);
    }
    for (var i = 0; i < uniq.length; i++) {
      DRUG_BY_ID[uniq[i].id] = uniq[i];
    }
    M.DRUGS = uniq;
    M.DRUG_BY_ID = DRUG_BY_ID;
  }
  indexDrugs();
  M.reindexDrugs = indexDrugs;
  M.getDrug = function (id) {
    if (!id) return null;
    return DRUG_BY_ID[id] || DRUG_BY_ID[normDrugId(id)] || null;
  };

  /* ---------- 病例库合并 & 接诊类型 ---------- */
  function mergeDiseases() {
    var base = (M.DISEASES_BASE || M.DISEASES || []).slice();
    M.DISEASES_BASE = base;
    var extra = M.DISEASES2 || [];
    var seen = {};
    base.forEach(function (d) { if (d && d.id) seen[d.id] = 1; });
    extra.forEach(function (d) {
      if (!d || !d.id || seen[d.id]) return;
      seen[d.id] = 1;
      base.push(d);
    });
    M.DISEASES = base;
  }
  mergeDiseases();
  M.mergeDiseases = function () {
    M.DISEASES_BASE = null;
    M.DISEASES = M.DISEASES || [];
    /* 重新从两份原始表合并（供热重载使用） */
    var extra = M.DISEASES2 || [];
    var base = (M.DISEASES || []).filter(function (d) { return !extra.some(function (x) { return x.id === d.id; }); });
    M.DISEASES_BASE = base;
    mergeDiseases();
  };

  /* 接诊类型：开局 / 换病人时可按类型筛选病例 */
  M.CASE_CATEGORIES = [
    { id: 'random', name: '随机', desc: '全部病例随机加权' },
    { id: 'arrest', name: '心脏骤停', desc: '室颤 / PEA / 停搏 / 复苏后' },
    { id: 'trauma', name: '创伤', desc: '多发伤 / 骨折 / 颅脑 / 挤压 / 烧伤' },
    { id: 'poison', name: '中毒', desc: '农药 / 药物 / 酒精 / 气体 / 毒物' },
    { id: 'cardiovascular', name: '心血管', desc: '心梗 / 心衰 / 休克 / 夹层' },
    { id: 'respiratory', name: '呼吸', desc: '哮喘 / 肺炎 / 肺栓塞 / ARDS' },
    { id: 'neuro', name: '神经', desc: '卒中 / 出血 / 癫痫 / 颅高压' },
    { id: 'gi', name: '消化·腹部', desc: '急腹症 / 出血 / 梗阻' },
    { id: 'renal_metabolic', name: '肾·内分泌', desc: 'DKA / 高钾 / 肾上腺危象' },
    { id: 'obstetric', name: '妇产', desc: '异位妊娠 / 产后出血 / 子痫' },
    { id: 'environment', name: '环境·理化', desc: '中暑 / 溺水 / 低体温 / 电击' },
    { id: 'sepsis', name: '感染·脓毒症', desc: '脓毒症 / 感染性休克 / 坏死性筋膜炎' },
    { id: 'heme', name: '血液', desc: 'DIC / 血小板减少' }
  ];
  var CAT_MAP = {
    stemi: 'cardiovascular', nstemi: 'cardiovascular', acute_left_heart_failure: 'cardiovascular',
    cardiogenic_shock: 'cardiovascular', ventricular_fibrillation: 'arrest',
    aortic_dissection: 'cardiovascular', cardiac_tamponade: 'cardiovascular',
    pulmonary_embolism: 'respiratory', severe_pneumonia: 'respiratory', copd_exacerbation: 'respiratory',
    acute_asthma: 'respiratory', tension_pneumothorax: 'respiratory', ards: 'respiratory',
    acute_cerebral_infarction: 'neuro', cerebral_hemorrhage: 'neuro', subarachnoid_hemorrhage: 'neuro',
    status_epilepticus: 'neuro', purulent_meningitis: 'neuro', brain_herniation: 'neuro',
    organophosphate_poisoning: 'poison', opioid_overdose: 'poison',
    acute_appendicitis: 'gi', acute_cholecystitis: 'gi', choledocholithiasis: 'gi',
    acute_pancreatitis: 'gi', upper_gi_bleeding: 'gi', gastric_perforation: 'gi',
    variceal_bleeding: 'gi', intestinal_obstruction: 'gi', strangulated_hernia: 'gi',
    renal_colic: 'renal_metabolic', acute_pyelonephritis: 'renal_metabolic',
    acute_urinary_retention: 'renal_metabolic', testicular_torsion: 'renal_metabolic',
    dka: 'renal_metabolic', hypoglycemic_coma: 'renal_metabolic', thyroid_storm: 'renal_metabolic',
    adrenal_crisis: 'renal_metabolic', hyperkalemia: 'renal_metabolic',
    dic: 'heme', itp: 'heme',
    acute_hemorrhagic_shock: 'trauma', polytrauma: 'trauma', splenic_rupture: 'trauma',
    liver_rupture: 'trauma', long_bone_fracture: 'trauma', burn: 'trauma',
    ectopic_pregnancy_rupture: 'obstetric', ovarian_torsion: 'obstetric',
    placental_abruption: 'obstetric', postpartum_hemorrhage: 'obstetric',
    sepsis: 'sepsis', septic_shock: 'sepsis', necrotizing_fasciitis: 'sepsis',
    abdominal_abscess: 'gi',
    severe_alcohol_intoxication: 'poison', benzodiazepine_overdose: 'poison',
    carbon_monoxide_poisoning: 'poison', drowning_pulmonary_edema: 'environment',
    heat_stroke: 'environment'
  };
  function diseaseCategory(def) {
    if (!def) return 'other';
    if (def.category) return def.category;
    if (CAT_MAP[def.id]) return CAT_MAP[def.id];
    var s = (def.id || '') + ' ' + (def.name || '') + ' ' + (def.dept || '') + ' ' + (def.site || '');
    if (/骤停|室颤|复苏|asystole|arrest/.test(s)) return 'arrest';
    if (/中毒|过量|poison|overdose|intoxic/.test(s)) return 'poison';
    if (/外伤|创伤|骨折|破裂|烧伤|挤压|trauma|rupture|fracture|burn/.test(s)) return 'trauma';
    if (/产科|妊娠|产后|子痫|胎盘|子宫|卵巢/.test(s)) return 'obstetric';
    if (/脓毒|感染性休克|sepsis|感染/.test(s)) return 'sepsis';
    if (/神经|脑|癫痫|颅内/.test(s)) return 'neuro';
    if (/呼吸|肺/.test(s)) return 'respiratory';
    if (/心|冠|血管|循环/.test(s)) return 'cardiovascular';
    if (/肾|糖|内分泌|代谢|钾|钠/.test(s)) return 'renal_metabolic';
    return 'other';
  }
  M.diseaseCategory = diseaseCategory;
  M.categoryName = function (id) {
    for (var i = 0; i < M.CASE_CATEGORIES.length; i++) if (M.CASE_CATEGORIES[i].id === id) return M.CASE_CATEGORIES[i].name;
    return '其他';
  };
  /* ================= 白班 / 夜班病例分布 =================
     白班：普通病例多、少量危重；
     夜班：以急诊、危重为主（创伤 / 中毒 / 骤停 / 心血管急症）。
     热射病只在盛夏（6–8 月）的白天才明显增多，其它时间几乎见不到；
     热衰竭（轻症中暑）夏季门诊常见，但不致命。
     急诊室按电脑时间自动切换（06:00–18:00 白班），诊室模式按“第几天”切换。 */
  M.currentShift = function () {
    var h = new Date().getHours();
    return (h >= 6 && h < 18) ? 'day' : 'night';
  };
  function isHeatDisease(d) {
    return d && (d.id === 'heat_stroke' || d.id === 'heat_exhaustion' || /中暑|热射病/.test(d.name || ''));
  }
  function shiftWeight(d, night) {
    var t = d.triage || 3;
    if (night) return t >= 5 ? 3.2 : (t >= 4 ? 2.2 : 0.12);
    if (isHeatDisease(d)) {
      var m = new Date().getMonth() + 1;
      var summer = (m >= 6 && m <= 8);
      if (d.id === 'heat_stroke') return summer ? 1.4 : 0.05;   /* 以前是 8，白天几乎必来一位 */
      return summer ? 2.2 : 0.25;                              /* 热衰竭：夏季多见，轻症 */
    }
    if (t <= 2) return 3.4;
    if (t === 3) return 2.6;
    if (t === 4) return 0.9;
    return 0.25;
  }
  M.pickShiftDisease = function (opts) {
    opts = opts || {};
    var pool = M.pickDiseasePool(opts.category || 'random', opts.rank, opts.patient);
    if (!pool.length) pool = (M.DISEASES || []).slice();
    var total = 0, i;
    for (i = 0; i < pool.length; i++) total += shiftWeight(pool[i], !!opts.night);
    var r = Math.random() * Math.max(0.001, total), acc = 0;
    for (i = 0; i < pool.length; i++) {
      acc += shiftWeight(pool[i], !!opts.night);
      if (r <= acc) return pool[i];
    }
    return pool[pool.length - 1];
  };
  M.makeShiftQueue = function (n, night, category, rank, patient) {
    var out = [], seen = {}, guard = 0;
    while (out.length < n && guard++ < 300) {
      var d = M.pickShiftDisease({ night: !!night, category: category || 'random', rank: rank, patient: patient });
      if (!d || seen[d.id]) continue;
      seen[d.id] = 1;
      out.push(d);
    }
    if (!night) {
      /* 以前这里会把「热射病」强行塞进每个白班的候诊队列里 ——
         现在只在盛夏、且队列里恰好没有中暑类病例时，才用「热衰竭」占一个位置。 */
      var hot = new Date().getMonth() + 1;
      var warm = (hot >= 6 && hot <= 8);
      var hasHeat = out.some(isHeatDisease);
      if (warm && !hasHeat && out.length) {
        var he = (M.DISEASES || []).filter(function (x) { return x.id === 'heat_exhaustion'; })[0];
        if (he) out[out.length - 1] = he;
      }
    }
    return out;
  };

  /* 按接诊类型筛选病例（random / 空 = 不筛选） */
  M.pickDiseasePool = function (category, rank, patient) {
    var all = (M.DISEASES || []).slice();
    var pool = all.filter(function (d) {
      if (category && category !== 'random' && diseaseCategory(d) !== category) return false;
      var n = (d.name || '') + (d.site || '');
      if (patient) {
        if (patient.sex === '男' && /妊娠|子宫|卵巢|产后|子痫|胎盘|异位妊娠|附件/.test(n)) return false;
        if (patient.sex === '女' && /前列腺|睾丸/.test(n)) return false;
      }
      if (rank) {
        if ((d.triage || 3) < (rank.triageMin || 1)) return false;
        if (rank.triageMax && (d.triage || 3) > rank.triageMax) return false;
        if (rank.id === 'intern' && d.triage >= 5) return false;
      }
      return true;
    });
    /* 明确选择了类型时，不能因为职称/性别过滤把该类型全部筛掉后
       又静默退回「全部病例」——先保证类型，再在类型内放宽职称门槛。 */
    if (!pool.length && category && category !== 'random') {
      pool = all.filter(function (d) { return diseaseCategory(d) === category; });
    }
    if (!pool.length) pool = all;
    return pool;
  };

  var ROUTE_NAME = { po: '口服', sl: '舌下', iv: '静脉推注', iv_inf: '静脉滴注', im: '肌肉注射', sc: '皮下注射', io: '骨髓腔', inhale: '吸入', neb: '雾化', pr: '直肠给药', top: '外用', nasal: '鼻饲/滴鼻' };
  var ROUTE_BIO = { iv: 1, io: 1, iv_inf: 1, im: 0.9, sc: 0.85, po: 0.45, sl: 0.7, pr: 0.5, inhale: 0.92, neb: 0.22, top: 0.08, nasal: 0.8 };
  M.ROUTE_NAME = ROUTE_NAME; M.ROUTE_BIO = ROUTE_BIO;

  /* ================= 4. 病人生成 ================= */
  var XING = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗', '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧'];
  var MING = ['建国', '秀英', '伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '洋', '艳', '勇', '军', '杰', '娟', '涛', '明', '超', '秀兰', '桂英', '文博', '子涵', '雨欣', '浩然', '思远', '嘉怡'];

  var COMORB = [
    { id: 'htn', n: '高血压病', mods: { sbp: 12, dbp: 8 }, note: '长期口服降压药' },
    { id: 'dm', n: '2型糖尿病', mods: { glucose: 3.2 }, note: '血糖控制不佳' },
    { id: 'copd', n: '慢性阻塞性肺病', mods: { spo2: -3, rr: 3, pao2: -12 }, note: '长期吸烟史' },
    { id: 'ckd', n: '慢性肾功能不全', mods: { renal: -32, urine: -18 }, note: '肌酐基础值偏高' },
    { id: 'af', n: '心房颤动', mods: { qt: 20 }, note: '长期抗凝', rhythm: 'afib' },
    { id: 'chf', n: '慢性心力衰竭', mods: { contractility: -22, sv: -12 }, note: 'EF 35%' },
    { id: 'cirr', n: '酒精性肝硬化', mods: { hepatic: -38, inr: 0.5, plt: -60 }, note: '有食管静脉曲张' },
    { id: 'anemia', n: '慢性贫血', mods: { hb: -3.5 }, note: '' },
    { id: 'asthma', n: '支气管哮喘', mods: { bronchospasm: 8 }, note: '' },
    { id: 'obese', n: '肥胖', mods: { svr: 120, tv: -60 }, note: 'BMI 33' },
    { id: 'cad', n: '冠心病', mods: { coronary: -22 }, note: '曾行支架植入' },
    { id: 'hypothy', n: '甲状腺功能减退', mods: { temp: -0.5, hr: -8 }, note: '' }
  ];

  var SOCIAL = [
    { id: 'alcohol', n: '长期酗酒', mods: { hepatic: -20, gi: -12 }, flag: 'alcohol', note: '每日饮酒 > 半斤，存在酒精依赖' },
    { id: 'psych', n: '长期服用精神类药物', mods: { qt: 30 }, flag: 'psych', note: '院外自行服用抗精神病药，剂量不详' },
    { id: 'smoke', n: '吸烟 30 年', mods: { spo2: -1 }, flag: 'smoke', note: '' },
    { id: 'drugabuse', n: '静脉药物滥用史', mods: { immune: -20, wbc: 2 }, flag: 'abuse', note: '有共用针具史' },
    { id: 'anticoag', n: '长期口服抗凝药', mods: { inr: 0.9, clotting: -25 }, flag: 'bleed', note: '华法林，INR 不稳' },
    { id: 'none', n: '无特殊', mods: {}, flag: '', note: '' }
  ];

  var ABO = ['A', 'B', 'O', 'AB'];
  var ABO_P = [0.28, 0.24, 0.34, 0.14];
  function randABO() {
    var r = Math.random(), c = 0;
    for (var i = 0; i < 4; i++) { c += ABO_P[i]; if (r < c) return ABO[i]; }
    return 'O';
  }
  function compat(donor, recip) {
    if (donor.abo === 'O') return recip.rh === '-' ? donor.rh === '-' : true;
    if (donor.abo === recip.abo) return !(donor.rh === '+' && recip.rh === '-');
    if (recip.abo === 'AB') return !(donor.rh === '+' && recip.rh === '-');
    return false;
  }
  M.compat = compat;

  function makePatient() {
    var sex = chance(0.52) ? '男' : '女';
    var age = irnd(19, 88);
    var name = pick(XING) + pick(MING);
    var p = {
      name: name, sex: sex, age: age,
      bed: '急诊 ' + irnd(1, 24) + ' 床',
      abo: randABO(), rh: chance(0.99) ? '+' : '-',
      allergy: null,
      comorb: [], social: [], mods: {}, flags: {}, notes: [], rhythm: null,
      weight: sex === '男' ? irnd(58, 92) : irnd(45, 76)
    };
    var nc = age > 55 ? irnd(1, 2) : (age > 40 && chance(0.4) ? 1 : 0);
    var pool = COMORB.slice();
    for (var i = 0; i < nc && pool.length; i++) {
      var c = pool.splice(irnd(0, pool.length - 1), 1)[0];
      if (p.comorb.some(function (x) { return x.id === c.id; })) continue;
      p.comorb.push(c);
      for (var k in c.mods) p.mods[k] = (p.mods[k] || 0) + c.mods[k];
      if (c.rhythm) p.rhythm = c.rhythm;
      if (c.note) p.notes.push(c.n);
    }
    var ns = irnd(0, 2);
    var sp = SOCIAL.slice();
    for (var j = 0; j < ns && sp.length; j++) {
      var s = sp.splice(irnd(0, sp.length - 1), 1)[0];
      if (s.id === 'none') continue;
      p.social.push(s);
      for (var k2 in s.mods) p.mods[k2] = (p.mods[k2] || 0) + s.mods[k2];
      if (s.flag) p.flags[s.flag] = true;
      if (s.note) p.notes.push(s.n);
    }
    if (chance(0.18)) {
      var d = (M.DRUGS || [])[irnd(0, Math.max(0, (M.DRUGS || []).length - 1))];
      if (d) p.allergy = { id: d.id, name: d.name, sev: pick(['皮疹', '荨麻疹', '喉头水肿', '过敏性休克']) };
    }
    if (age > 70) { p.mods.renal = (p.mods.renal || 0) - 15; p.mods.coronary = (p.mods.coronary || 0) - 10; }
    return p;
  }
  M.makePatient = makePatient;

  /* ================= 5. 创建模拟 ================= */
  function blank() { return {}; }

  function create(opts) {
    opts = opts || {};
    var rank = M.getRank(opts.rank || opts.difficulty || 'resident');
    var sim = {
      t: 0,
      uid: 0,
      speed: 1,
      doctor: opts.doctor || 'Dr. 林',
      rank: rank,
      difficulty: rank.id,
      patient: opts.patient || makePatient(),
      dis: blank(), drift: blank(), drugMod: blank(), evtMod: blank(), supportMod: blank(),
      v: {}, vPrev: {},
      rhythm: 'sinus', rhythmT: 0, vtPulse: false,
      perfusion: 1,
      symp: 0.35, autoMod: {},
      lactate0: 0,
      arrestT: 0, arrest: false, dead: false, deathAt: null, deathCause: '',
      logs: [], symptoms: [], rxList: [], emit: [], examFindings: [], labs: [],
      examResults: [], examPending: [], examVer: 0,
      inflam: 0, ecgRegion: '', ecgSTDepress: false, ecgLowVoltage: false, surgeryHistory: [],
      trend: [], marks: [], trendT: 0,
      postop: [], postopMod: {}, postopActive: {}, findings: [],
      shockFx: -1, postShockUntil: -1,
      disease: null, treatDone: {}, controlled: false,
      surgery: null,
      cpr: false, cprQuality: 0,
      airwayMode: 'none', vent: false, o2: false,
      bloodGiven: [],
      gut: 0, bleed: null,
      counters: { shock: 0, drug: 0, surg: 0, comp: 0, compFixed: 0, compFail: 0 },
      startedAt: new Date(),
      outcome: null, score: 0
    };
    var p = sim.patient;
    for (var k in p.mods) sim.dis[k] = (sim.dis[k] || 0) + p.mods[k];
    if (p.rhythm) sim.rhythm = p.rhythm;
    sim.perfusion = 1;
    sim.v = computeVal(sim);
    sim.vPrev = sim.v;
    log(sim, 'info', '接诊：' + p.name + '，' + p.sex + '，' + p.age + ' 岁，血型 ' + p.abo + p.rh + '。');
    if (p.comorb.length) log(sim, 'info', '既往史：' + p.comorb.map(function (c) { return c.n; }).join('、') + '。');
    if (p.social.length) log(sim, 'info', '个人史：' + p.social.map(function (c) { return c.n; }).join('、') + '。');
    if (p.allergy) log(sim, 'warn', '⚠ 过敏史：' + p.allergy.name + '过敏（曾出现' + p.allergy.sev + '）。');
    return sim;
  }
  M.createSim = create;

  function log(sim, type, text) {
    sim.logs.push({ t: sim.t, type: type || 'info', text: text });
    if (sim.logs.length > 400) sim.logs.splice(0, sim.logs.length - 400);
  }
  M.log = log;

  /* ================= 6. 数值合成 ================= */
  /* 把「偏移量表」叠加到数值表上。
     注意：o 里全部是相对健康基线的增量，累加器（sim.dis / drift / drugMod / evtMod / supportMod）
     初始必须视为 0，绝不能拿 HEALTHY 基线当种子，否则同一项会被重复叠加一次基线。 */
  function applyMods(v, o) {
    if (!o) return;
    for (var k in o) {
      var x = o[k];
      if (typeof x !== 'number' || !isFinite(x) || x === 0) continue;
      if (k === 'map') {
        v.sbp = (typeof v.sbp === 'number' ? v.sbp : 0) + x * 1.25;
        v.dbp = (typeof v.dbp === 'number' ? v.dbp : 0) + x * 0.75;
        continue;
      }
      v[k] = (typeof v[k] === 'number' ? v[k] : 0) + x;
    }
  }

  function computeVal(sim) {
    var v = {};
    for (var k in HEALTHY) v[k] = HEALTHY[k];
    applyMods(v, sim.dis);
    applyMods(v, sim.drift);
    applyMods(v, sim.drugMod);
    applyMods(v, sim.evtMod);
    applyMods(v, sim.supportMod);
    applyMods(v, sim.postopMod);   /* 术后并发症 / 术中所见留下的持续负担 */
    applyMods(v, sim.autoMod);     /* 压力感受器反射 / 自主神经代偿（上一帧计算） */

    /* 生理约束 */
    v.spo2 = clamp(v.spo2, 0, 100);
    v.pao2 = clamp(v.pao2, 0, 600);
    v.paco2 = clamp(v.paco2, 5, 120);
    v.gcs = clamp(v.gcs, 3, 15);
    v.brain = clamp(v.brain, 0, 100);
    v.airway = clamp(v.airway, 0, 100);
    v.avconduction = clamp(v.avconduction, 0, 100);
    v.contractility = clamp(v.contractility, 0, 200);
    v.arrhythmia = clamp(v.arrhythmia, 0, 100);
    v.k = clamp(v.k, 1, 12);
    v.mg = clamp(v.mg, 0.2, 3.5);
    v.phos = clamp(v.phos, 0.1, 4);
    v.ck = clamp(v.ck, 20, 60000);
    v.ammonia = clamp(v.ammonia, 5, 500);
    v.na = clamp(v.na, 100, 180);
    v.ca = clamp(v.ca, 0.8, 5);
    v.glucose = clamp(v.glucose, 0.4, 45);
    v.ph = clamp(v.ph, 6.6, 7.8);
    v.lactate = clamp(v.lactate, 0.2, 25);
    v.temp = clamp(v.temp, 28, 43);
    v.hb = clamp(v.hb, 1.5, 22);
    v.plt = clamp(v.plt, 2, 900);
    v.inr = clamp(v.inr, 0.5, 12);
    v.volume = clamp(v.volume, 1200, 16000);
    v.renal = clamp(v.renal, 0, 100);
    v.hepatic = clamp(v.hepatic, 0, 100);
    v.clotting = clamp(v.clotting, 0, 100);
    v.urine = clamp(v.urine, 0, 600);
    v.icp = clamp(v.icp, 0, 80);
    v.qt = clamp(v.qt, 200, 700);
    v.svr = clamp(v.svr, 200, 3000);
    v.coronary = clamp(v.coronary, 0, 100);
    v.bronchospasm = clamp(v.bronchospasm, 0, 100);
    v.seizure = clamp(v.seizure, 0, 100);
    v.anaphylaxis = clamp(v.anaphylaxis, 0, 100);
    v.histamine = clamp(v.histamine, 0, 100);
    v.immune = clamp(v.immune, 0, 100);
    v.rr = clamp(v.rr, 0, 60);
    v.hr = clamp(v.hr, 0, 280);
    v.sedation = clamp(v.sedation, 0, 100);
    v.pain = clamp(v.pain, 0, 100);
    v.sv = clamp(v.sv, 5, 200);
    v.tv = clamp(v.tv, 0, 1000);
    v.pupil = clamp(v.pupil, 1, 9);

    /* —— 血液稀释 ——
       输入大量液体后血液被稀释：血红蛋白 / 血小板 / 凝血因子一起下降。
       体液回到 5 L 后稀释自动解除（`dil` 由当前体液量反算，不是永久惩罚）。 */
    var dil = clamp(5000 / Math.max(1500, v.volume), 0.25, 1);
    v.dilution = +dil.toFixed(3);
    v.hb = clamp(v.hb * dil, 1.2, 22);
    v.plt = clamp(v.plt * dil, 2, 900);
    v.clotting = clamp(v.clotting * dil, 0, 100);

    /* —— 胃内容量（口服药物 / 饮水） —— */
    v.gut = clamp(sim.gut || 0, 0, 30000);
    v.fluidMax = FLUID_MAX;
    v.gutMax = GUT_MAX;

    /* 心脏停搏 / 室颤时监护仪数不出心率：HR 必须为 0（不是还显示 76）
       PEA 例外：有电活动，能计出「电频率」，但按 20–55 次/分显示 */
    v.rhythmLabel = sim.rhythm;
    if (sim.rhythm === 'asystole' || sim.rhythm === 'vf' || sim.rhythm === 'agonal') {
      v.hr = 0;
      v.contractility = Math.min(v.contractility, 4);
    } else if (sim.rhythm === 'torsades') {
      /* 尖端扭转型室速：电活动 180–250 次/分，但无有效机械收缩 */
      v.hr = clamp(v.hr, 150, 260);
      v.contractility = Math.min(v.contractility, 18);
    } else if (sim.rhythm === 'pea') {
      v.hr = clamp(v.hr, 20, 55);
    }

    /* 心输出量：由心率与每搏量推导，再用 contractility 修正 */
    var svEff = v.sv * (0.55 + 0.45 * (v.contractility / 100)) * (v.volume / 5000);
    v.sv = clamp(svEff, 5, 200);
    v.co = clamp((v.hr * v.sv) / 1000, 0.2, 16);

    /* 血压：容量与阻力修正（叠加在已合成的 sbp/dbp 之上） */
    var volF = (v.volume - 5000) / 5000;
    var svrF = (v.svr - 1100) / 1100;
    var coF = (v.co - 5.2) / 5.2;
    var bpf = volF * 0.55 + svrF * 0.5 + coF * 0.55;
    v.sbp = v.sbp * (1 + bpf);
    v.dbp = v.dbp * (1 + bpf * 0.8);
    v.sbp = clamp(v.sbp, 0, 300);
    v.dbp = clamp(v.dbp, 0, 180);
    if (v.dbp > v.sbp) v.dbp = v.sbp * 0.7;

    /* 平均动脉压必须先由收缩压/舒张压推导出来，脉搏判定才有意义 */
    v.map = (v.sbp + 2 * v.dbp) / 3;
    var pulse = hasPulse(sim, v);
    /* 记录「若无机械收缩障碍时」的血压，用于判断 PEA 是否恢复机械收缩 */
    v.sbpPre = v.sbp;
    v.mapPre = v.map;
    if (!pulse) {
      var pf = sim.perfusion;
      v.sbp = v.sbp * (0.15 + 0.85 * pf) * (sim.cpr ? 1 : 0.85);
      v.dbp = v.dbp * (0.1 + 0.9 * pf) * (sim.cpr ? 1 : 0.85);
      v.map = (v.sbp + 2 * v.dbp) / 3;
      v.co = v.co * (0.1 + 0.9 * pf);
    }
    v.map = clamp(v.map, 0, 220);
    v.pulseOK = pulse;
    v.symp = Math.round(clamp(sim.symp || 0.35, 0, 1.6) * 100);

    /* ---- 氧输送 / 氧耗（Fick 原理） ----
       CaO2 = 1.34 × Hb × SaO2 + 0.003 × PaO2；DO2 = CO × CaO2 × 10；
       VO2 随体温、疼痛、癫痫、炎症升高；SvO2 = 1 − VO2/DO2。
       SvO2 是「氧供是否够用」的最终共同通路，比单看 SpO2 更接近临床。 */
    /* SpO₂ 与 PaO₂ 必须自洽：用氧解离曲线的 Hill 近似反推 PaO₂。
       否则会出现「SpO₂ 87%、PaO₂ 96 mmHg、P/F 457」这种不可能的组合。 */
    var sfrac = clamp((v.spo2 || 0) / 100, 0.05, 0.995);
    var pao2Inv = 27 * Math.pow(sfrac / (1 - sfrac), 1 / 2.7);
    var spo2Unreliable = /methemoglobinemia|carbon_monoxide/.test((sim.disease && sim.disease.def.id) || '');
    /* 高铁血红蛋白/CO 中毒时脉搏血氧不可靠，PaO₂ 可以正常——这是病例的教学点 */
    if (!spo2Unreliable && v.spo2 < 96 && v.pao2 > pao2Inv + 5) v.pao2 = clamp(pao2Inv, 24, 600);
    var sao2 = clamp(v.spo2, 0, 100) / 100;
    v.cao2 = clamp(1.34 * (v.hb || 14) * sao2 + 0.003 * (v.pao2 || 96), 1.5, 26);
    v.do2 = clamp(v.co * v.cao2 * 10, 30, 2400);
    var vo2 = 225 + Math.max(0, (v.temp || 37) - 37) * 28 +
      (v.pain || 0) * 1.6 + (v.seizure || 0) * 2.4 + (sim.inflam || 0) * 2.0;
    if (!pulse) vo2 *= 0.25;                     /* 无循环时组织仍在耗氧，但总量下降 */
    v.vo2 = clamp(vo2, 80, 900);
    v.svo2 = clamp((1 - v.vo2 / Math.max(50, v.do2)) * 100, 3, 90);
    if (sim.ecgLock) {
      if (sim.ecgLock.hr) v.hr = sim.ecgLock.hr;
      if (sim.ecgLock.av !== undefined) v.avconduction = sim.ecgLock.av;
      if (sim.ecgLock.coronary !== undefined) v.coronary = sim.ecgLock.coronary;
      sim.rhythm = sim.ecgLock.rhythm || sim.rhythm;
    }
    return v;
  }
  M.computeVal = computeVal;

  function hasPulse(sim, v) {
    var r = sim.rhythm;
    if (r === 'vf' || r === 'asystole' || r === 'pea' || r === 'agonal' || r === 'torsades') return false;
    if (r === 'vt') return sim.vtPulse && (v ? v.sbp > 50 : true);
    /* 容量性停搏：体液 > 12 L 或胃内容 >= 10 L 时不可能有有效脉搏 */
    if (v && v.volume >= FLUID_MAX) return false;
    if (sim && (sim.gut || 0) >= GUT_MAX) return false;
    if (v && v.hr < 18) return false;
    if (v && v.map < 18) return false;
    return true;
  }
  M.hasPulse = hasPulse;

  /* ================= 7. 药理动力学 ================= */
  function metabFactor(sim, D) {
    var v = sim.v || {};
    var hep = (v.hepatic === undefined ? 100 : v.hepatic) / 100;
    var ren = (v.renal === undefined ? 100 : v.renal) / 100;
    /* 按说明书/代谢途径决定主要清除器官：万古霉素经肾、咪达唑仑经肝；
       两者都写或都没写时取平均值。旧版对 all drugs 一律 50/50，肾功能差时把肝代谢药也拖慢。 */
    var mb = String(D.metabol || '');
    var hasHep = /肝|hepatic|liver/i.test(mb);
    var hasRen = /肾|renal|kidney/i.test(mb);
    var clear;
    if (hasHep && !hasRen) clear = 0.15 + 0.85 * hep;
    else if (hasRen && !hasHep) clear = 0.15 + 0.85 * ren;
    else clear = 0.5 * hep + 0.5 * ren;
    var f = 0.30 + 0.70 * clear;
    if (sim.patient.flags.alcohol) f *= 0.9;
    return clamp(f, 0.25, 1.6);
  }

  function concOf(sim, rec, t) {
    var D = rec.D;
    if (rec.failed) return 0;          /* 过敏等原因：这一针根本没起效 */
    var dt = t - rec.t0 - (rec.onsetDelay || 0);
    if (dt < 0) return 0;
    var mf = metabFactor(sim, D);
    var ke = LN2 / Math.max(0.15, (D.halfLife || 10)) / 60 * mf; /* 每秒 */
    if (rec.infusion) {
      var kf0 = kfOf(D), ff = 0.35;
      if (!rec.active) {
        var dtStop = rec.stoppedAt - rec.t0;
        var cAtStop = steady(rec, ke, dtStop);
        var dtOff = t - rec.stoppedAt;
        /* 停药后：先快速再分布，再按终末半衰期衰减（二室模型的简化解析解） */
        return cAtStop * (ff * Math.exp(-kf0 * dtOff) + (1 - ff) * Math.exp(-ke * dtOff));
      }
      return steady(rec, ke, dt);
    }
    var ka = 3 / Math.max(0.02, (D.onset || 0.2)) / 60;
    if (rec.route === 'iv' || rec.route === 'io') ka = ke * 12 + 0.4;
    var c0 = rec.c0;
    if (Math.abs(ka - ke) < 1e-4) return c0 * ke * dt * Math.exp(-ke * dt);
    return c0 * (ka / (ka - ke)) * (Math.exp(-ke * dt) - Math.exp(-ka * dt));
  }
  /* 分布相速率：从「达峰时间」估计，限制在 0.25–6 分钟内完成 63% */
  function kfOf(D) {
    return LN2 / Math.max(0.25, Math.min(6, (D && D.peak) || 1)) / 60;
  }
  /* 滴注：35% 快速分布 + 65% 按终末半衰期蓄积；
     旧版用固定的 25 秒时间常数，会让长效药（胺碘酮、地高辛）像推注一样立刻满量。 */
  function steady(rec, ke, dt) {
    var target = rec.rateLevel;
    var kf = kfOf(rec.D), f = 0.35;
    return target * (1 - f * Math.exp(-kf * dt) - (1 - f) * Math.exp(-ke * dt));
  }

  function effectOf(D, c) {
    var out = {}, h = 1.6;
    if (c <= 0) return out;
    var E = D.effects || [];
    for (var i = 0; i < E.length; i++) {
      var e = E[i]; if (!e || !e.t) continue;
      var ec = e.ec50 || 1;
      /* linear: 剂量负荷型效应（电解质、液体），随剂量线性累积，不饱和；
         此时 max 表示「1 个常用剂量」带来的效应量 */
      var f = e.linear ? (c / ec) : Math.pow(c, h) / (Math.pow(ec, h) + Math.pow(c, h));
      out[e.t] = (out[e.t] || 0) + (e.max || 0) * f;
    }
    var tf = D.tox ? (D.tox.factor || 3) : 3;
    if (c > tf && D.tox && D.tox.effects) {
      var cx = c - tf;
      for (var j = 0; j < D.tox.effects.length; j++) {
        var te = D.tox.effects[j]; if (!te || !te.t) continue;
        var tec = te.ec50 || 1;
        /* 毒性效应同样支持 linear：按超出阈值的剂量倍数线性放大 */
        var tf2 = te.linear ? (cx / tec) : Math.pow(cx, h) / (Math.pow(tec, h) + Math.pow(cx, h));
        out[te.t] = (out[te.t] || 0) + (te.max || 0) * tf2;
      }
    }
    return out;
  }
  M.effectOf = effectOf;

  /* 靶器官归属：把药物作用的「靶点」映射到具体器官，
     过量时按剂量倍数对该器官造成进行性损伤 */
  var ORGAN_OF = {
    heart: ['hr', 'sbp', 'dbp', 'map', 'co', 'svr', 'sv', 'contractility', 'qt', 'avconduction', 'arrhythmia', 'coronary'],
    lung: ['rr', 'tv', 'spo2', 'pao2', 'paco2', 'airway', 'bronchospasm', 'secretions'],
    brain: ['brain', 'gcs', 'sedation', 'seizure', 'pupil', 'icp', 'pain'],
    liver: ['hepatic', 'inr', 'clotting'],
    kidney: ['renal', 'urine', 'k', 'osmo', 'volume'],
    blood: ['hb', 'plt', 'wbc', 'immune', 'histamine', 'ca'],
    gut: ['gi', 'emesis']
  };
  function organFor(target) {
    for (var o in ORGAN_OF) if (ORGAN_OF[o].indexOf(target) >= 0) return o;
    return '';
  }
  M.organFor = organFor;
  M.ORGAN_NAME = { heart: '心脏', lung: '肺', brain: '中枢神经', liver: '肝脏', kidney: '肾脏', blood: '血液系统', gut: '胃肠' };

  /* ================= 7.0 体液 / 胃内容物 / 放血 ================= */
  function updateFluids(sim, dt) {
    /* —— 胃内容物吸收：内容越多，吸收越快（游戏规则） ——
       但胃扩张到极限（>= 10 L）时吸收停止：必须手术清除才能解除停搏。 */
    if (sim.gut > 0 && sim.gut < GUT_MAX) {
      var g = sim.gut;
      var rate = (40 + 80 * Math.min(1, g / 4000)) / 60;   /* mL/s：40–120 mL/min */
      var move = Math.min(g, rate * dt);
      sim.gut = Math.max(0, g - move);
      sim.drift.volume = (sim.drift.volume || 0) + move * 0.35;
      if (sim.gut < 1) sim.gut = 0;
    }
    /* —— 放血：按玩家设定的速率抽血，直到达到目标剩余量 —— */
    var b = sim.bleed;
    if (b && b.active) {
      var cur = (sim.v && sim.v.volume) || 5000;
      var floorMl = Math.max(1200, +b.target || 1200);
      var room = cur - floorMl;
      if (b.rate <= 0 || room <= 0.5) {
        b.active = false;
        log(sim, 'info', '放血结束：共放出 ' + Math.round(b.ml) + ' mL，体液总量约 ' + (cur / 1000).toFixed(1) + ' L。');
      } else {
        var drop = Math.min(room, (b.rate / 60) * dt);
        sim.drift.volume = (sim.drift.volume || 0) - drop;
        b.ml += drop;
        /* 放血同时带走血红蛋白、血小板与凝血因子 */
        sim.drift.hb = (sim.drift.hb || 0) - 0.0024 * drop;
        sim.drift.plt = (sim.drift.plt || 0) - 0.03 * drop;
        sim.drift.clotting = (sim.drift.clotting || 0) - 0.02 * drop;
        if (cur - drop <= floorMl + 0.5) {
          b.active = false;
          log(sim, 'good', '放血达到目标：已放出 ' + Math.round(b.ml) + ' mL，体液总量约 ' + ((cur - drop) / 1000).toFixed(1) + ' L。');
        }
      }
    }
  }
  M.updateFluids = updateFluids;

  /* 放血医嘱：速率 0–2000 mL/min，目标剩余量 0–5000 mL */
  M.startBleed = function (sim, rate, target) {
    if (!sim) return null;
    var r = clamp(+rate || 0, 0, 2000);
    var t = clamp(+target || 0, 0, 5000);
    if (r <= 0) { log(sim, 'warn', '放血速率必须大于 0。'); return null; }
    sim.bleed = { rate: r, target: t, ml: 0, active: true, t0: sim.t };
    log(sim, 'act', '开始放血：速率 ' + r + ' mL/min，目标剩余 ' + (t / 1000).toFixed(1) + ' L。');
    sim.emit.push({ kind: 'toast', type: 'warn', title: '开始放血', text: r + ' mL/min → 目标 ' + (t / 1000).toFixed(1) + ' L' });
    return sim.bleed;
  };
  M.stopBleed = function (sim) {
    if (!sim || !sim.bleed || !sim.bleed.active) return false;
    sim.bleed.active = false;
    log(sim, 'info', '停止放血：共放出 ' + Math.round(sim.bleed.ml) + ' mL。');
    return true;
  };

  function updateDrugs(sim, dt) {
    var mods = {};
    var list = sim.rxList;
    var toxLevel = 0, toxOrgan = {}, toxDrug = '';
    for (var i = 0; i < list.length; i++) {
      var rec = list[i];
      var c = concOf(sim, rec, sim.t);
      rec.c = c;
      rec.peakC = Math.max(rec.peakC || 0, c);
      /* 补液按「占血容量的比例」计算，而不是按血药浓度：
         把「40% 血容量」映射到注毒阈值 factor=3 的刻度上，效果与警戒线都随体重走 */
      var cUse = c;
      if (rec.D.fluid) {
        var fLim = M.fluidLimit(sim, rec.D);
        cUse = 3 * (rec.dose || 0) / Math.max(1, fLim);
      }
      var eff = effectOf(rec.D, cUse);
      for (var k in eff) mods[k] = (mods[k] || 0) + eff[k];
      if (!rec.done && c > 0.02 && sim.t - rec.t0 > 0.5) rec.done = true;
      if (!rec.ended && !rec.infusion && c < 0.02 && sim.t - rec.t0 > (rec.D.dur || 10) * 60 * 0.6) rec.ended = true;
      if (!rec.ended && rec.infusion && !rec.active) rec.ended = true;

      /* 过量 → 靶器官负荷（leve = 相对「中毒阈值」的倍数） */
      var tf = (rec.D.tox && rec.D.tox.factor) || 3;
      if (cUse > tf) {
        var ratio = cUse / tf;
        /* 补液不进入「中毒→室颤」通道：容量过负荷走肺水肿/低氧通路 */
        if (!rec.D.fluid && ratio > toxLevel) { toxLevel = ratio; toxDrug = rec.D.name; }
        var effs = (rec.D.effects || []).concat((rec.D.tox && rec.D.tox.effects) || []);
        for (var j = 0; j < effs.length; j++) {
          var org = organFor(effs[j].t);
          if (org && (!toxOrgan[org] || ratio > toxOrgan[org])) toxOrgan[org] = ratio;
        }
      }
    }
    sim.drugMod = mods;
    sim.tox = { level: toxLevel, organ: toxOrgan, drug: toxDrug, sev: Math.max(0, toxLevel - 1) };
  }

  /* 一次给药对应的液体体积（mL）：体液 / 胃内容量建模用。
     注射液按稀释后的体积计；口服按吞下的水/溶剂计（20 mL 起，超量按比例）。 */
  function mlOf(D, dose, route) {
    var d = Math.max(0, +dose || 0);
    if (!D) return 0;
    var u = String(D.unit || '').toLowerCase();
    if (u === 'ml') return d;
    var oral = (route === 'po' || route === 'pr' || route === 'sl' || route === 'nasal');
    if (oral) return Math.max(20, Math.min(12000, d * 0.5));
    if (u === 'g') return d * 20;
    if (u === 'mg') return d * 0.2;   /* 多数急救药 1–5 mg/mL 稀释后注射 */
    if (u === 'mcg' || u === 'µg' || u === 'ug') return d * 0.001;
    if (u === 'iu' || u === 'u' || u === '单位') return d * 0.05;
    return d * 0.5;
  }
  M.mlOf = mlOf;

  function give(sim, drugId, dose, route, opt) {
    opt = opt || {};
    var D = M.getDrug(drugId);
    if (!D) return null;
    var allowed = D.routes || ['iv'];
    if (allowed.indexOf(route) < 0) { log(sim, 'warn', '该药不支持' + (ROUTE_NAME[route] || route) + '途径。'); return null; }
    if (route === 'iv_inf') return startInfusion(sim, drugId, dose, opt);
    var bio = ROUTE_BIO[route] || 0.5;
    var typical = (D.dose && D.dose.typical) || 1;
    var doseMax = (D.dose && D.dose.max) || typical;
    /* 循环越差，药物越难分布到位：低灌注时 iv 给药也会打折扣 */
    var perf = (sim.perfusion === undefined ? 1 : sim.perfusion);
    var perfMul = route === 'iv' || route === 'io'
      ? clamp(0.55 + 0.45 * perf, 0.55, 1)
      : clamp(0.25 + 0.75 * perf, 0.25, 1);
    bio *= perfMul;
    /* 起效延迟：静推 2 秒左右起步，肌注/口服按药物 onset 放大；
       致死量级（>3 倍上限）统一给 1.5~3 秒的「推下去还没反应」窗口 */
    var lethalPush = !D.fluid && dose > doseMax * 3;
    var onsetDelay = 0;
    if (route === 'iv' || route === 'io') {
      onsetDelay = D.pushOnset || (lethalPush ? 2 : clamp((D.onset || 1) * 1.2, 1.5, 8));
    } else if (route === 'im' || route === 'sc') {
      onsetDelay = clamp((D.onset || 5) * 6, 20, 300);
    } else if (route === 'po' || route === 'pr' || route === 'sl' || route === 'nasal') {
      onsetDelay = clamp((D.onset || 15) * 8, 60, 900);
      /* 胃内容物越多，吸收越快（内容物增加接触面积与胃排空） */
      onsetDelay = clamp(onsetDelay / (1 + (sim.gut || 0) / 3000), 8, 900);
    } else if (route === 'inhale' || route === 'neb') {
      onsetDelay = clamp((D.onset || 2) * 2, 3, 30);
    }
    /* 体重→分布容积：按异速生长 0.85 次方缩放，50 kg 与 100 kg 的同一 mg 剂量浓度不同 */
    var wt = clamp(((sim.patient && sim.patient.weight) || 70) / 70, 0.55, 1.8);
    var vd = Math.pow(wt, 0.85);
    var rec = {
      uid: ++sim.uid, D: D, drugId: D.id, dose: dose, unit: D.unit, route: route,
      t0: sim.t, onsetDelay: onsetDelay, c0: (dose * bio) / (typical * vd), c: 0, peakC: 0, vd: vd,
      failed: false, perfusion: perfMul,
      infusion: false, active: false, patient: sim.patient.name
    };
    sim.rxList.push(rec);
    sim.counters.drug++;
    var actLine = '给药：' + D.name + ' ' + fmtDose(dose, D.unit) + ' · ' + ROUTE_NAME[route];
    if (onsetDelay >= 1) {
      actLine += '（约 ' + Math.round(onsetDelay) + ' 秒起效' +
        (perfMul < 0.8 ? '，当前低灌注，可能起效不完全' : '') + '）';
    } else {
      actLine += '。';
    }
    log(sim, 'act', actLine);

    /* 过敏：直接判为「这针没起效」，同时触发过敏反应 */
    var ap = (D.allergy && D.allergy.p) || 0;
    var pmul = sim.patient.allergy && sim.patient.allergy.id === D.id ? 4 : 1;
    if (ap > 0 && chance(ap * pmul)) {
      rec.failed = true;
      triggerAllergy(sim, D, route);
      log(sim, 'crit', '✗ ' + D.name + ' 未能起效：过敏反应先于药效出现。');
    }

    /* —— 这次给药带来的实际液体量 ——
       口服：进入胃内，累积到 10 L 会因胃扩张 / 迷走反射停搏，必须洗胃清除；
       静脉：直接进入循环，量大会稀释血液；超大量（例如 99999999 mL）立即触发容量性停搏。 */
    var mlVol = mlOf(D, dose, route);
    var oralRoute = (route === 'po' || route === 'pr' || route === 'sl' || route === 'nasal');
    if (oralRoute) {
      sim.gut = (sim.gut || 0) + mlVol;
      if (sim.gut >= GUT_MAX) {
        log(sim, 'crit', '⚠ 胃内容量 ' + (sim.gut / 1000).toFixed(1) + ' L 已超过胃扩张极限：迷走反射性心脏停搏，必须立即洗胃 / 清除胃内容物。');
        sim.emit.push({ kind: 'toast', type: 'crit', title: '胃扩张 · 心脏停搏', text: '胃内容 ' + (sim.gut / 1000).toFixed(1) + ' L，需手术清除' });
      } else if (sim.gut > 3000) {
        log(sim, 'warn', '胃内容量 ' + (sim.gut / 1000).toFixed(1) + ' L，腹胀明显，注意误吸与迷走反射。');
      }
    } else if (route === 'iv' || route === 'io' || route === 'iv_inf') {
      if (!D.fluid) sim.drift.volume = (sim.drift.volume || 0) + mlVol * 0.6;
      if (mlVol >= 4000) {
        log(sim, 'crit', '⚠ 单次注入约 ' + Math.round(mlVol) + ' mL 液体：血液被明显稀释（Hb / 凝血因子下降），体液总量逼近上限。');
      }
      if (mlVol >= FLUID_MAX) {
        sim.drift.volume = (sim.drift.volume || 0) + (FLUID_MAX + 800);
        log(sim, 'crit', '⚠⚠ 一次注入 ' + Math.round(mlVol) + ' mL（超过全身体液上限 12 L）：容量性心脏停搏，放血前无法救回。');
        sim.emit.push({ kind: 'toast', type: 'crit', title: '容量性心脏停搏', text: '注入 ' + Math.round(mlVol) + ' mL，体液超过 12 L' });
      }
    }

    /* 过量提示：补液按血容量算，不套用「常用量 ×3 = 中毒」 */
    var mx = (D.dose && D.dose.max) || typical;
    var tf = (D.tox && D.tox.factor) || 3;
    if (D.fluid) {
      var ebv0 = bloodVolume(sim);
      var lim0 = M.fluidLimit(sim, D);
      var ml0 = (dose || 0) * (D.fluidMlPer || 1);
      var pct0 = ebv0 > 0 ? Math.round(ml0 / ebv0 * 100) : 0;
      if (dose > lim0) {
        log(sim, 'crit', '⚠ 单次补液 ' + fmtDose(dose, D.unit) + ' ≈ 血容量的 ' + pct0 +
          '%（估算 ' + (ebv0 / 1000).toFixed(1) + ' L），已超过容量过负荷阈值 ' + fmtDose(lim0, D.unit) +
          '，将出现肺水肿与氧合下降。');
        sim.emit.push({ kind: 'toast', type: 'crit', title: '容量过负荷', text: D.name + ' ' + fmtDose(dose, D.unit) + ' ≈ ' + pct0 + '% 血容量，警惕肺水肿' });
      } else if (dose > lim0 * 0.6) {
        log(sim, 'warn', '补液量偏大：' + fmtDose(dose, D.unit) + ' ≈ 血容量的 ' + pct0 + '%，注意肺部啰音与氧合。');
      }
    } else if (dose > mx * tf) {
      log(sim, 'crit', '⚠ 剂量严重超常：' + D.name + ' ' + fmtDose(dose, D.unit) + '（常用上限 ' + fmtDose(mx, D.unit) + '），出现' + ((D.tox && D.tox.msg) || '毒性反应') + '。');
      sim.emit.push({ kind: 'toast', type: 'crit', title: '药物过量', text: D.name + ' 剂量超常，' + ((D.tox && D.tox.msg) || '') });
    } else if (dose > mx) {
      log(sim, 'warn', '剂量高于常用上限：' + D.name + ' ' + fmtDose(dose, D.unit) + '。');
    }
    /* 氯化钾静推：绝对禁忌，快速致命 */
    if (D.id === 'potassium_chloride' && route === 'iv') {
      log(sim, 'crit', '⚠⚠ 氯化钾静脉直接推注属绝对禁忌！血钾将在数十秒内骤升，随时心脏停搏。');
      sim.emit.push({ kind: 'toast', type: 'crit', title: '氯化钾静推 · 绝对禁忌', text: '血钾骤升，可立即致心脏停搏' });
    }
    checkTreat(sim, 'drug', D.id);
    postopNote(sim, 'drug', D.id);
    return rec;
  }
  M.give = give;

  function fmtDose(x, u) {
    var n = Math.round(x * 1000) / 1000;
    return n + ' ' + (u || '');
  }
  M.fmtDose = fmtDose;

  /* 供界面预览：这条途径大概多久起效（秒） */
  function drugOnset(D, route, dose) {
    if (!D) return 0;
    if (route === 'iv_inf') return 2;   /* 滴注：2 秒后开始起效，达稳态需数分钟 */
    var typical = (D.dose && D.dose.typical) || 1;
    var doseMax = (D.dose && D.dose.max) || typical;
    var lethal = dose > doseMax * 3;
    if (route === 'iv' || route === 'io') return D.pushOnset || (lethal ? 2 : clamp((D.onset || 1) * 1.2, 1.5, 8));
    if (route === 'im' || route === 'sc') return clamp((D.onset || 5) * 6, 20, 300);
    if (route === 'po' || route === 'pr' || route === 'sl' || route === 'nasal') return clamp((D.onset || 15) * 8, 60, 900);
    if (route === 'inhale' || route === 'neb') return clamp((D.onset || 2) * 2, 3, 30);
    return 0;
  }
  M.drugOnset = drugOnset;

  function startInfusion(sim, drugId, rate, opt) {
    opt = opt || {};
    var D = M.getDrug(drugId);
    if (!D) return null;
    var rr = D.rateRange || { min: 0.02, max: 2, per: '单位/min' };
    var mid = (rr.min + rr.max) / 2 || 1;
    var rec = {
      uid: ++sim.uid, D: D, drugId: D.id, dose: rate, unit: (rr.per || '') + '', route: 'iv_inf',
      t0: sim.t, onsetDelay: 2, c0: 0, c: 0, peakC: 0, infusion: true, active: true,
      failed: false, rate: rate, rateLevel: rate / mid
    };
    sim.rxList.push(rec);
    sim.counters.drug++;
    log(sim, 'act', '开始静脉滴注：' + D.name + ' ' + rate + ' ' + (rr.per || '') + '。');
    var ap2 = (D.allergy && D.allergy.p) || 0;
    var pm2 = sim.patient.allergy && sim.patient.allergy.id === D.id ? 4 : 1;
    if (ap2 > 0 && chance(ap2 * pm2)) {
      rec.failed = true;
      triggerAllergy(sim, D, 'iv_inf');
      log(sim, 'crit', '✗ ' + D.name + ' 滴注未能起效：过敏反应先出现。');
    }
    checkTreat(sim, 'drug', D.id);
    return rec;
  }
  M.startInfusion = startInfusion;

  function stopInfusion(sim, uid) {
    for (var i = 0; i < sim.rxList.length; i++) {
      var r = sim.rxList[i];
      if (r.uid === uid && r.infusion && r.active) {
        r.active = false; r.stoppedAt = sim.t;
        log(sim, 'act', '停止滴注：' + r.D.name + '。');
      }
    }
  }
  M.stopInfusion = stopInfusion;

  function triggerAllergy(sim, D, route) {
    var A = D.allergy || {};
    sim.evtMod.anaphylaxis = (sim.evtMod.anaphylaxis || 0) + 55;
    sim.evtMod.histamine = (sim.evtMod.histamine || 0) + 65;
    sim.evtMod.sbp = (sim.evtMod.sbp || 0) - 45;
    sim.evtMod.svr = (sim.evtMod.svr || 0) - 550;
    sim.evtMod.spo2 = (sim.evtMod.spo2 || 0) - 10;
    sim.evtMod.bronchospasm = (sim.evtMod.bronchospasm || 0) + 45;
    sim.evtMod.hr = (sim.evtMod.hr || 0) + 30;
    sim.drift.airway = (sim.drift.airway || 0) - 25;
    log(sim, 'crit', '⚠⚠ 药物过敏反应：' + D.name + ' 后出现' + (A.msg || '过敏性休克') + '！立即停药、肾上腺素、补液。');
    sim.emit.push({ kind: 'toast', type: 'crit', title: '过敏性休克', text: D.name + '：' + (A.msg || '') + '。立即肾上腺素 0.5mg 肌注！' });
  }

  /* ================= 8. 事件 / 瞬时扰动 ================= */
  function addEvent(sim, mods, name, decay) {
    for (var k in mods) sim.evtMod[k] = (sim.evtMod[k] || 0) + mods[k];
    if (name) log(sim, 'info', name);
  }
  M.addEvent = addEvent;

  function decayEvents(sim, dt) {
    var hl = 45; /* 半衰期秒 */
    var f = Math.pow(0.5, dt / hl);
    for (var k in sim.evtMod) {
      sim.evtMod[k] *= f;
      if (Math.abs(sim.evtMod[k]) < 0.02) delete sim.evtMod[k];
    }
  }

  /* ================= 9. 疾病进程 ================= */
  /* 血压偏移归一化：数据里若同时给了 sbp 和 map，只认 sbp（map 由 sbp/dbp 推导，
     两者同时叠加会把收缩压压到 0 以下）。map 只在没有 sbp 时才参与换算。 */
  function normalizeVitals(def) {
    var v = def.vitals;
    if (!v || typeof v.map !== 'number' || typeof v.sbp !== 'number') return v;
    var out = {};
    for (var k in v) if (k !== 'map') out[k] = v[k];
    return out;
  }

  function ecgRegionOf(def) {
    if (!def) return '';
    if (def.ecgRegion) return def.ecgRegion;
    var s = (def.site || '') + ' ' + (def.name || '');
    if (/前降支|前壁|前间壁|广泛前壁/.test(s)) return 'anterior';
    if (/下壁|右冠状动脉|右冠/.test(s)) return 'inferior';
    if (/回旋支|侧壁|高侧壁/.test(s)) return 'lateral';
    if (/后壁/.test(s)) return 'posterior';
    if (/心包|心包填塞/.test(s)) return 'diffuse';
    if (/肺栓塞|右心/.test(s)) return 'right';
    if (/冠脉|心肌梗死|心绞痛|缺血/.test(s)) return 'anterior';
    return '';
  }
  M.ecgRegionOf = ecgRegionOf;

  /* 横纹肌溶解高风险病例：到院即有大量肌红蛋白入血 */
  var RHABDO_IDS = {
    crush_syndrome: 1, electrical_injury: 1, traumatic_arrest: 1, burn: 1,
    long_bone_fracture: 1, polytrauma: 1, pelvic_fracture: 1, spinal_shock: 1,
    compartment_syndrome: 1
  };

  /* 把病例的「到院化验」同步进初始生理状态，避免出现
     「化验单写 K⁺ 5.2，监护仪却显示 4.2」的自相矛盾。
     只同步与 TMETA 同单位的项目；hb 兼容 g/L 写法；vitals 已显式覆盖的项不重复叠加。 */
  var LAB_VITAL_MAP = {
    k: 'k', na: 'na', ca: 'ca', mg: 'mg', phos: 'phos', glucose: 'glucose',
    ph: 'ph', lactate: 'lactate', hb: 'hb', plt: 'plt', inr: 'inr', wbc: 'wbc',
    osmo: 'osmo', ck: 'ck', creatine_kinase: 'ck', ammonia: 'ammonia',
    temp: 'temp', pco2: 'paco2'
  };
  function applyLabBaseline(sim, def) {
    var labs = def && def.labs;
    if (!labs) return;
    for (var lk in labs) {
      var tk = LAB_VITAL_MAP[lk];
      if (!tk || !(tk in HEALTHY)) continue;
      var val = labs[lk];
      if (typeof val !== 'number' || !isFinite(val)) continue;
      if (def.vitals && def.vitals[tk] !== undefined) continue;
      if (tk === 'hb' && val > 30) val = val / 10;   /* 78 g/L → 7.8 g/dL */
      var delta = val - HEALTHY[tk];
      if (Math.abs(delta) < 0.01) continue;
      sim.dis[tk] = (sim.dis[tk] || 0) + delta;
    }
  }

  function startDisease(sim, def) {
    sim.disease = { def: def, t0: sim.t, stage: -1, controlled: false, lethal: false, elapsed: 0, symAdded: {} };
    /* 病例与年龄匹配：避免「77 岁异位妊娠」这种组合 */
    var nm = (def.name || '') + ' ' + (def.site || '');
    if (sim.patient && /妊娠|子宫|卵巢|产后|子痫|胎盘|异位妊娠|附件/.test(nm)) {
      if (sim.patient.age < 16 || sim.patient.age > 45) sim.patient.age = 20 + irnd(0, 20);
      sim.patient.sex = '女';
    } else if (sim.patient && /前列腺|睾丸/.test(nm)) {
      sim.patient.sex = '男';
      if (sim.patient.age < 18) sim.patient.age = 45 + irnd(0, 30);
    }
    sim.ecgRegion = ecgRegionOf(def);
    /* NSTEMI / 不稳定型心绞痛 / 供需失衡性缺血：ST 段以压低为主，而不是抬高 */
    sim.ecgSTDepress = /nstemi|unstable|angina|ischemia|demand/.test((def.id || '') + ' ' + (def.name || ''));
    /* 心包填塞 / 大量心包积液：低电压 + 电交替 */
    sim.ecgLowVoltage = /tamponade|pericardial|心包/.test((def.id || '') + ' ' + (def.name || '') + ' ' + (def.site || ''));
    sim.diseaseCategory = diseaseCategory(def);
    applyLabBaseline(sim, def);
    applyMods(sim.dis, normalizeVitals(def));
    sim.symp = 0.35;
    sim.lactate0 = clamp(HEALTHY.lactate + (sim.dis.lactate || 0), 0.2, 25);
    if (RHABDO_IDS[def.id] && !(sim.dis.ck > 0)) applyMods(sim.dis, { ck: 1800 });
    if (sim.diseaseCategory === 'poison') sim.poisonId = def.id;
    /* 有些疾病到院时就是致命心律（如室颤），允许在 vitals / 疾病定义里直接指定 */
    var r0 = (def.vitals && def.vitals.rhythm) || def.rhythm;
    if (r0) setRhythm(sim, r0, '起病即 ' + (RHY_NAME[RHY_ALIAS[r0] || r0] || r0));
    (def.symptoms || []).forEach(function (s, i) {
      if ((s.t || 0) <= 0) { addSymptom(sim, s); sim.disease.symAdded[i] = 1; }
    });
    if (def.labs) {
      for (var k in def.labs) sim.labs.push({ t: sim.t, k: k, v: def.labs[k] });
    }
    if (def.exam) {
      for (var e in def.exam) sim.examFindings.push({ t: sim.t, k: e, v: def.exam[e] });
    }
    log(sim, 'warn', '主诉/初步判断：' + def.name + '（' + def.dept + '）');
    sim.emit.push({ kind: 'toast', type: 'warn', title: '新病人', text: '初步考虑：' + def.name });
    advanceStage(sim, 0);
    return sim.disease;
  }
  M.startDisease = startDisease;

  function addSymptom(sim, s) {
    sim.symptoms.push({ name: s.name, mode: s.mode || '问诊', at: sim.t });
    log(sim, 'warn', '症状（' + (s.mode || '问诊') + '）：' + s.name);
  }

  function advanceStage(sim, idx) {
    var d = sim.disease; if (!d) return;
    var stages = d.def.stages || [];
    if (idx >= stages.length) return;
    d.stage = idx;
    var st = stages[idx];
    var changes = st.changes;
    /* 第 0 期就是「到院时的表现」，def.vitals 已经描述了它。
       同一项若在两处都写了，只认 vitals，避免初诊体征被重复叠加成天文数字。 */
    if (idx === 0 && changes && d.def.vitals) {
      var filtered = {};
      for (var ck in changes) if (!(ck in d.def.vitals)) filtered[ck] = changes[ck];
      changes = filtered;
    }
    applyMods(sim.dis, changes);
    if (st.changes && st.changes.rhythm) setRhythm(sim, st.changes.rhythm, '疾病进展');
    if (st.lethal) {
      d.lethal = true;
      log(sim, 'crit', '⚠ 病情进入' + st.label + '：' + (st.log || '') );
    } else {
      log(sim, 'warn', '病程进展 → ' + st.label + '：' + (st.log || ''));
    }
    sim.emit.push({ kind: 'toast', type: st.lethal ? 'crit' : 'warn', title: '病程进展 · ' + st.label, text: st.log || '' });
  }

  function updateDisease(sim, dt) {
    var d = sim.disease; if (!d) return;
    var pm = (sim.rank && sim.rank.progMul) || 1;
    var chronic = d.def.course === 'chronic';
    /* 慢性病：自然病程慢（0.65×）；急性病：进展快（1.15×），不处理更容易走掉 */
    d.elapsed = (sim.t - d.t0) * pm * (chronic ? 0.65 : 1.15);
    if (d.controlled) {
      /* 病因清单做完 ≠ 病人好了：只有循环/氧合/体温/血钾都达到「可以恢复」的条件，
         疾病偏移才会回退；否则病因虽已处理，器官损伤仍在继续，不能转归。 */
      var vv = sim.v || {};
      var recoveringOK = vv.map > 60 && vv.spo2 > 88 && vv.pulseOK !== false &&
        vv.temp > 33 && vv.temp < 40 && vv.k < 7 && vv.lactate < 6;
      if (!recoveringOK) {
        if (!d.__waitLog || sim.t - d.__waitLog > 30) {
          d.__waitLog = sim.t;
          log(sim, 'warn', '病因已处理，但循环/氧合仍不稳定，病情尚未真正好转——继续支持治疗后再观察。');
        }
        return;
      }
      /* 好转：缓慢回退疾病偏移。慢性病只能「缓解」，
         回到基线的 35% 就停住 —— 留下的那部分就是难以根治的底子 */
      if (!d.residual) {
        d.residual = {};
        var keep = chronic ? 0.35 : 0;
        for (var k0 in sim.dis) {
          if (sim.patient.mods[k0]) continue;
          d.residual[k0] = (sim.dis[k0] || 0) * keep;
        }
      }
      for (var k in sim.dis) {
        if (sim.patient.mods[k]) continue;
        var cur = sim.dis[k];
        var res = d.residual[k] || 0;
        if (Math.abs(cur - res) > 0.05) sim.dis[k] = res + (cur - res) * Math.pow(0.5, dt / 40);
      }
      return;
    }
    var stages = d.def.stages || [];
    while (d.stage + 1 < stages.length && d.elapsed >= (stages[d.stage + 1].t || 0)) {
      advanceStage(sim, d.stage + 1);
    }
    (d.def.symptoms || []).forEach(function (s, i) {
      var tt = s.t || 0;
      if (tt > 0 && d.elapsed >= tt && !d.symAdded[i]) {
        d.symAdded[i] = 1;
        if (!sim.symptoms.some(function (x) { return x.name === s.name; })) addSymptom(sim, s);
      }
    });
  }

  function checkTreat(sim, type, id, siteId, procId) {
    var d = sim.disease; if (!d || d.controlled) return;
    var T = d.def.treat || [];
    for (var i = 0; i < T.length; i++) {
      var t = T[i];
      if (sim.treatDone[i]) continue;
      if (t.type === 'drug' && type === 'drug' && normDrugId(t.id) === normDrugId(id)) {
        sim.treatDone[i] = 1;
        d.support = (d.support || 0) + 1;
        log(sim, 'good', '✓ 关键处置完成：' + (M.getDrug(t.id) || { name: t.id }).name + (t.note ? '（' + t.note + '）' : ''));
      }
      if (t.type === 'surgery' && type === 'surgery' && t.proc === procId && (!t.site || t.site === siteId)) {
        sim.treatDone[i] = 1;
        d.support = (d.support || 0) + 1;
        log(sim, 'good', '✓ 关键手术完成：' + procName(t.proc) + ' @ ' + siteName(t.site));
      }
      if (t.type === 'nurse' && type === 'nurse' && normDrugId(t.id) === normDrugId(id)) {
        sim.treatDone[i] = 1;
        d.support = (d.support || 0) + 1;
        log(sim, 'good', '✓ 关键处置完成：' + nurseName(t.id) + (t.note ? '（' + t.note + '）' : ''));
      }
    }
    /* 治愈判定 */
    var needAll = true, needAny = false;
    for (var j = 0; j < T.length; j++) {
      if (!T[j].need) continue;
      needAny = true;
      if (!sim.treatDone[j]) needAll = false;
    }
    if (needAny && needAll) {
      d.controlled = true; sim.controlled = true;
      log(sim, 'good', '★ 病因已处理：「' + d.def.name + '」的病因处置完成；但只有在生命体征稳定后病情才会真正好转。');
      sim.emit.push({ kind: 'toast', type: 'good', title: '病因已处理', text: d.def.name + '：继续稳定循环/氧合，才能转归' });
    }
  }
  M.checkTreat = checkTreat;

  function procName(id) {
    var P = M.SURGERY_PROCS || [];
    for (var i = 0; i < P.length; i++) if (P[i].id === id) return P[i].name;
    return id;
  }
  function siteName(id) {
    var S = M.SURGERY_SITES || [];
    for (var i = 0; i < S.length; i++) if (S[i].id === id) return S[i].name;
    return id || '';
  }
  M.procName = procName; M.siteName = siteName;

  var NURSE_NAME = {
    foley: '留置导尿', ng: '留置胃管 / 洗胃', warm: '保温复温', cool: '冰毯降温',
    position: '休克体位', sample: '留取血培养', restrain: '约束 / 镇静评估',
    ecmo: '启动 ECMO / 机械循环支持', dialysis: '血液净化（CRRT）'
  };
  function nurseName(id) { return NURSE_NAME[id] || id; }
  M.nurseName = nurseName;
  M.treatLabel = function (t) {
    if (!t) return '';
    if (t.type === 'drug') return (M.getDrug(t.id) || { name: t.id }).name;
    if (t.type === 'surgery') return procName(t.proc) + ' @ ' + siteName(t.site);
    if (t.type === 'nurse') return nurseName(t.id);
    return t.id || '';
  };

  /* ================= 10. 器官耦合漂移 ================= */
  function bump(sim, key, amount, lo, hi) {
    if (typeof amount !== 'number' || !isFinite(amount) || amount === 0) return;
    var cur = sim.drift[key] || 0;
    var next = cur + amount;
    /* 旧版把「累计漂移」夹在 lo/hi 里，而很多调用只给负向限幅（hi=0）：
       只要存在一个负向贡献，任何正向治疗（如吸氧提高 SpO₂）都会被夹回 0。
       现在只对「本次变化的方向」应用边界：正向变化遵守正的上限，负向变化遵守负的下限。 */
    if (amount > 0) {
      if (hi !== undefined && hi !== null && hi > 0) next = Math.min(next, hi);
    } else {
      if (lo !== undefined && lo !== null && lo < 0) next = Math.max(next, lo);
    }
    sim.drift[key] = next;
  }

  /* 病程进展速度（职称）= 器官恶化速度：
     疾病未控制时，所有器官漂移按 progMul 加速（恢复类漂移只在受控后出现，不受影响） */
  function dbump(sim, key, amount, lo, hi) {
    var f = 1;
    if (sim.disease && !sim.disease.controlled) {
      var course = (sim.disease.def && sim.disease.def.course === 'chronic') ? 0.70 : 1.15;
      f = ((sim.rank && sim.rank.progMul) || 1) * course;
    }
    bump(sim, key, amount * f * 1.25, lo, hi);
  }

  function applyCoupling(sim, v, dt) {
    var pulse = v.pulseOK;
    var map = v.map;

    /* --- 循环灌注 --- */
    var targetPerf = 1;
    if (!pulse) targetPerf = sim.cpr ? 0.32 : 0.04;
    else if (map < 45) targetPerf = 0.3;
    else if (map < 60) targetPerf = 0.65;
    else if (map < 70) targetPerf = 0.88;
    var tau = pulse ? 12 : (sim.cpr ? 6 : 9);
    sim.perfusion += (targetPerf - sim.perfusion) * clamp(dt / tau, 0, 0.6);

    /* --- 压力感受器反射（baroreflex）---
       参考 Ursino 的颈动脉窦压力感受器模型：MAP 偏离调定点 → 交感张力以时间常数
       约 6–10 秒变化，经 HR / SVR / 心肌收缩力 / 呼吸频率四条通路代偿。
       感染性休克、镇静、老年、房颤会削弱这条反射（临床上的「代偿能力差」）。 */
    var baroGain = 1;
    baroGain *= (1 - clamp((v.sedation || 0) / 180, 0, 0.65));
    if (sim.patient.age > 70) baroGain *= 0.80;
    if ((sim.inflam || 0) > 30) baroGain *= 0.65;
    if (sim.rhythm === 'afib' || sim.rhythm === 'flutter') baroGain *= 0.55;
    /* 调定点约 90 mmHg：正常血压时交感张力维持在基线 0.35，
       低血压才明显升高，高血压则下降（与颈动脉窦的静态特性一致）。 */
    var mapErr = clamp((90 - map) / 28, -1.2, 2.0);
    var targetSymp = clamp(0.35 + mapErr * 0.75 + (v.pain > 50 ? 0.10 : 0) + (v.spo2 < 88 ? 0.15 : 0), 0, 1.55);
    if (!pulse) targetSymp = clamp(targetSymp + 0.35, 0, 1.6);
    sim.symp += (targetSymp - sim.symp) * clamp(dt / 7, 0, 0.4);
    var sdelta = sim.symp - 0.35;
    sim.autoMod = sim.autoMod || {};
    sim.autoMod.hr = 24 * sdelta * baroGain;
    sim.autoMod.svr = 300 * sdelta * baroGain;
    sim.autoMod.contractility = 10 * sdelta * baroGain;
    sim.autoMod.rr = 3.5 * sdelta * baroGain;

    /* --- 缺氧 / 通气 --- */
    var o2sup = sim.airwayMode === 'o2' ? 0.9 : (sim.airwayMode === 'bag' ? 2.0 : (sim.airwayMode === 'ett' ? 2.4 : 0));
    if (sim.vent) o2sup = 3.2;
    if (sim.cpr && sim.airwayMode === 'none') o2sup += 0.3;
    var airF = (v.airway === undefined ? 100 : v.airway) / 100;
    var ventOK = (v.rr >= 6 && airF > 0.35) || o2sup > 1.2;
    var hypox = 1 - clamp(v.spo2 / 96, 0, 1.2);
    if (!ventOK) {
      dbump(sim, 'spo2', -1.6 * dt * (1 - o2sup * 0.25), -30, 0);
      dbump(sim, 'paco2', 0.55 * dt, 0, 45);
      dbump(sim, 'ph', -0.00035 * dt, -0.55, 0);
    } else {
      if (o2sup > 0) dbump(sim, 'spo2', (100 - v.spo2) * 0.035 * o2sup * dt, -30, 12);
      if (o2sup > 1.2) {
        var rrTarget = sim.vent ? 12 : (sim.airwayMode === 'bag' ? 12 : v.rr);
        dbump(sim, 'rr', (rrTarget - v.rr) * 0.15 * dt, -20, 20);
        if (sim.vent || sim.airwayMode === 'bag') dbump(sim, 'paco2', (38 - v.paco2) * 0.02 * dt, -25, 25);
      }
      dbump(sim, 'paco2', (0 - hypox) * 0.02 * dt, -25, 25);
    }
    if (v.secretions > 55) dbump(sim, 'airway', -0.12 * dt * (v.secretions / 100), -60, 0);
    if (v.bronchospasm > 20) dbump(sim, 'spo2', -0.25 * dt * (v.bronchospasm / 100), -30, 0);

    /* --- 脑 --- */
    var cpp = map - (v.icp || 10);
    var brainIsch = 1 - clamp(cpp / 70, 0, 1.2);
    if (brainIsch > 0.1) dbump(sim, 'brain', -0.5 * brainIsch * dt, -100, 0);
    if (v.spo2 < 88) dbump(sim, 'brain', -0.35 * (1 - v.spo2 / 88) * dt, -100, 0);
    if (v.glucose < 3.0) dbump(sim, 'brain', -0.55 * dt, -100, 0);
    if (v.temp > 40.5) dbump(sim, 'brain', -0.3 * dt, -100, 0);
    if (v.brain > 40 && v.spo2 > 92 && cpp > 60) dbump(sim, 'brain', 0.35 * dt, 0, 40);
    /* 脑功能恢复：颅压受控、氧合与血糖达标后，缺血/水肿的脑组织可以逐步恢复。
       没有这一条，任何一次严重缺氧都会把脑电活动永久锁死在 40% 以下，病例永远无法转归。 */
    if (v.brain < 48 && cpp > 55 && v.spo2 > 90 && v.glucose > 3.5 && v.icp < 22 &&
        v.temp > 34 && v.temp < 39) {
      dbump(sim, 'brain', 0.16 * dt, 0, 40);
    }
    var gTarget = 3 + 12 * clamp((v.brain - 5) / 95, 0, 1);
    if (v.gcs > gTarget) dbump(sim, 'gcs', -(v.gcs - gTarget) * 0.25 * dt, -14, 0);
    else if (v.gcs < gTarget) dbump(sim, 'gcs', (gTarget - v.gcs) * 0.12 * dt, 0, 14);
    if (v.icp > 20) {
      dbump(sim, 'gcs', -0.08 * (v.icp - 20) * dt, -14, 0);
      dbump(sim, 'pupil', 0.02 * (v.icp - 20) * dt, 0, 5);
    }

    /* --- 呼吸驱动 --- */
    var drive = clamp((v.brain - 20) / 60, 0, 1.4) * (1 - clamp((v.sedation - 40) / 90, 0, 0.85));
    if (sim.vent || sim.airwayMode === 'bag') drive = Math.max(drive, 0.4);
    if (!sim.dead) {
      var rrBase = 16 * drive + clamp((v.paco2 - 40) * 0.35, -6, 12);
      dbump(sim, 'rr', (rrBase - v.rr) * 0.25 * dt, -30, 30);
    } else {
      dbump(sim, 'rr', -v.rr, -60, 0);
    }
    if (v.rr < 4 && !sim.vent) dbump(sim, 'tv', -v.tv * 0.3 * dt, -600, 0);

    /* --- 肾 --- */
    if (map < 62 || !pulse) {
      var sev = clamp((62 - map) / 40 + (pulse ? 0 : 0.6), 0, 1.6);
      dbump(sim, 'renal', -0.28 * sev * dt, -100, 0);
      dbump(sim, 'urine', -0.5 * sev * dt, -200, 0);
      dbump(sim, 'k', 0.006 * sev * dt, -1.5, 3);
    } else if (v.renal > 40) {
      dbump(sim, 'renal', 0.12 * dt, 0, 20);
      dbump(sim, 'urine', (45 - v.urine) * 0.02 * dt, -60, 60);
    }
    if (v.hb < 7) dbump(sim, 'renal', -0.2 * dt, -100, 0);
    if (v.lactate > 4) dbump(sim, 'renal', -0.15 * dt, -100, 0);

    /* --- 肝 --- */
    if (map < 55 || v.spo2 < 85) dbump(sim, 'hepatic', -0.2 * dt, -100, 0);
    else if (v.hepatic < 90) dbump(sim, 'hepatic', 0.05 * dt, 0, 10);

    /* 容量过负荷 → 肺水肿（大量输液 / 输血过快）。
       阈值随血容量走：同样输 2 L，50 kg 的病人比 90 kg 更早肺水肿；
       心功能差、肾功能差的病人阈值更低（同样的容量更容易肺水肿）。
       与「一次快速输注 > 40% 血容量」的补液警戒线基本对齐。 */
    var volLimit = 5000 + 1000 * clamp(bloodVolume(sim) / 4900, 0.75, 1.35)
      - Math.max(0, 100 - (v.contractility === undefined ? 100 : v.contractility)) * 5
      - Math.max(0, 100 - (v.renal === undefined ? 100 : v.renal)) * 4;
    volLimit = Math.max(4700, volLimit);
    if (v.volume > volLimit) {
      var volSev = (v.volume - volLimit) / 1200;
      dbump(sim, 'spo2', -0.35 * volSev * dt, -25, 0);
      dbump(sim, 'airway', -0.06 * volSev * dt, -30, 0);
      dbump(sim, 'rr', 0.15 * volSev * dt, 0, 12);
      if (chance(dt * 0.01 * volSev)) log(sim, 'crit', '容量过负荷：双肺湿啰音增多、氧合下降，需限液 / 利尿 / 无创通气。');
    }

    /* --- 器官互相影响（多器官耦合） --- */
    /* 肝功能衰竭：凝血因子合成减少 → INR 上升、纤维蛋白原/血小板消耗 → 自发出血倾向 */
    if (v.hepatic < 45) {
      var hsev = (45 - v.hepatic) / 45;
      dbump(sim, 'clotting', -0.5 * hsev * dt, -80, 0);
      dbump(sim, 'inr', 0.004 * hsev * dt, 0, 4);
      /* 肝性低血糖 + 肝性脑病 */
      if (v.glucose > 3.6) dbump(sim, 'glucose', -0.02 * hsev * dt, -3, 0);
      if (v.brain > 10) dbump(sim, 'brain', -0.06 * hsev * dt, -40, 0);
    }
    /* 肾功能衰竭：排钾排酸障碍 + 尿毒症脑病 */
    if (v.renal < 30) {
      var rsev = (30 - v.renal) / 30;
      dbump(sim, 'k', 0.02 * rsev * dt, -0.5, 2.5);
      dbump(sim, 'ph', -0.00025 * rsev * dt, -0.5, 0);
      dbump(sim, 'urine', -0.4 * rsev * dt, -200, 0);
      if (v.brain > 12) dbump(sim, 'brain', -0.05 * rsev * dt, -35, 0);
    }
    /* 凝血功能崩坏：全身自发出血 */
    if (v.clotting < 35 && chance(dt * 0.06 * ((35 - v.clotting) / 35))) {
      sim.bleeding = (sim.bleeding || 0) + 1.5;
      if (chance(0.3)) log(sim, 'crit', '凝血功能严重障碍，出现自发性出血（皮肤瘀斑 / 穿刺点渗血）。');
    }
    /* 颅高压危象 → 库欣反应：血压升高、心率减慢（脑疝前兆） */
    if (v.icp > 25) {
      var icpSev = (v.icp - 25) / 30;
      dbump(sim, 'sbp', 0.6 * icpSev * dt, 0, 60);
      dbump(sim, 'hr', -0.5 * icpSev * dt, -40, 0);
      if (v.icp > 35 && chance(dt * 0.01 * icpSev)) log(sim, 'crit', '⚠ 库欣反应加重：血压升高伴心动过缓，提示脑疝即将发生。');
    }
    /* 心功能不全 → 肝淤血 / 肾灌注下降（心衰的器官代价） */
    if (v.contractility < 45 && pulse) {
      dbump(sim, 'hepatic', -0.05 * dt, -60, 0);
      dbump(sim, 'renal', -0.05 * dt, -60, 0);
    }
    /* 严重贫血 → 组织缺氧加重（携氧不足） */
    if (v.hb < 7) {
      dbump(sim, 'lactate', 0.012 * dt, 0, 20);
      if (v.brain > 10) dbump(sim, 'brain', -0.04 * dt, -30, 0);
    }
    /* 胃肠功能崩溃 → 呕吐 / 第三间隙丢失 → 有效容量不足 */
    if (v.gi < 40) {
      dbump(sim, 'volume', -0.8 * dt, -1500, 0);
      dbump(sim, 'emesis', 0.4 * dt, 0, 60);
    }

    /* ================= 器官互作（第二轮：炎症介质 / 肌肉 / 血氨 / 心肺脑轴） ================= */
    var cat = sim.diseaseCategory || (sim.disease ? diseaseCategory(sim.disease.def) : '');
    var defId = (sim.disease && sim.disease.def && sim.disease.def.id) || '';

    /* --- 全身炎症反应（SIRS）/ 脓毒症级联：一个器官的感染会把所有器官拖下水 --- */
    var inflamTarget = 0;
    if (v.temp > 38.2) inflamTarget += (v.temp - 38.2) * 11;
    if (v.wbc > 12) inflamTarget += (v.wbc - 12) * 2.2;
    if (v.immune < 60) inflamTarget += (60 - v.immune) * 0.55;
    if (cat === 'sepsis' || defId === 'sepsis' || defId === 'septic_shock') inflamTarget += 42;
    if (v.gi < 35) inflamTarget += 12;                     /* 肠屏障破坏 → 细菌移位 */
    if (sim.postopActive) {
      for (var pp in sim.postopActive) {
        if (/感染|漏|脓肿|肺炎/.test(sim.postopActive[pp].n || '')) inflamTarget += 10;
      }
    }
    if (v.temp < 36 && inflamTarget > 0) inflamTarget += 8;  /* 低体温型脓毒症更凶险 */
    inflamTarget = clamp(inflamTarget, 0, 100);
    sim.inflam = (sim.inflam || 0) + (inflamTarget - (sim.inflam || 0)) * clamp(dt / 25, 0, 0.5);
    /* 炎症消退：感染源控制 + 体温白细胞回落时自然下降 */
    if (inflamTarget < 12 && (sim.inflam || 0) > 0) sim.inflam *= Math.pow(0.5, dt / 90);
    var infl = sim.inflam || 0;
    if (infl > 18) {
      var isev = clamp((infl - 18) / 70, 0, 1.4);
      dbump(sim, 'svr', -1.6 * isev * dt, -1400, 0);
      dbump(sim, 'volume', -1.7 * isev * dt, -3000, 0);        /* 毛细血管渗漏 */
      dbump(sim, 'contractility', -0.10 * isev * dt, -80, 0);  /* 脓毒症心肌抑制 */
      dbump(sim, 'spo2', -0.10 * isev * dt, -35, 0);
      dbump(sim, 'renal', -0.06 * isev * dt, -90, 0);
      dbump(sim, 'hepatic', -0.05 * isev * dt, -80, 0);
      dbump(sim, 'clotting', -0.05 * isev * dt, -80, 0);
      dbump(sim, 'brain', -0.04 * isev * dt, -70, 0);
      dbump(sim, 'lactate', 0.02 * isev * dt, 0, 15);
      dbump(sim, 'glucose', 0.01 * isev * dt, 0, 8);
      if (isev > 0.5 && chance(dt * 0.004 * isev)) log(sim, 'warn', '炎症介质释放：外周血管扩张、毛细血管渗漏，血压与氧合同时恶化。');
    }

    /* --- 横纹肌溶解 / 挤压伤：肌红蛋白堵塞肾小管 → 高钾、酸中毒、急性肾衰 --- */
    if (v.ck > 1000) {
      var cksev = clamp((v.ck - 1000) / 9000, 0, 1.6);
      /* 肌红蛋白管型造成的是「数分钟到数小时」的肾损伤，不是每秒钟都在崩；
         系数按游戏时间压缩后取临床可救治的速率，补液/碱化尿液能明显对冲。 */
      dbump(sim, 'renal', -0.06 * cksev * dt, -100, 0);
      dbump(sim, 'urine', -0.18 * cksev * dt, -300, 0);
      dbump(sim, 'k', 0.0025 * cksev * dt, -1, 3);
      dbump(sim, 'phos', 0.0008 * cksev * dt, 0, 2);
      dbump(sim, 'ca', -0.0005 * cksev * dt, -1.2, 0);
      dbump(sim, 'ph', -0.00006 * cksev * dt, -0.4, 0);
      if (chance(dt * 0.001 * cksev)) log(sim, 'crit', '肌红蛋白尿：尿色呈酱油色，急性肾损伤与高钾风险急剧上升。');
    }
    if (v.ck > 600 && pulse && map > 65 && v.renal > 35) dbump(sim, 'ck', -0.12 * dt, -2000, 0);

    /* --- 血氨 / 肝性脑病：肝衰或消化道积血 → 氨升高 → 意识障碍 --- */
    var ammTarget = 22;
    if (v.hepatic < 60) ammTarget += (60 - v.hepatic) * 1.3;
    if ((sim.bleeding || 0) > 0) ammTarget += Math.min(180, sim.bleeding * 18);
    if (/variceal|hepatic|cirrhosis/.test(defId)) ammTarget += 35;
    ammTarget = clamp(ammTarget, 10, 380);
    bump(sim, 'ammonia', (ammTarget - v.ammonia) * 0.09 * dt, -150, 380);
    if (v.ammonia > 60) {
      var amsev = (v.ammonia - 60) / 120;
      dbump(sim, 'brain', -0.05 * amsev * dt, -60, 0);
      dbump(sim, 'gcs', -0.04 * amsev * dt, -10, 0);
      dbump(sim, 'icp', 0.03 * amsev * dt, 0, 25);            /* 肝性脑病可伴脑水肿 */
    }

    /* --- 镁 / 钙 / 磷：电解质之间的相互牵制 --- */
    if (v.mg < 0.55) {
      dbump(sim, 'arrhythmia', 0.55 * dt, 0, 100);
      dbump(sim, 'qt', 0.5 * dt, 0, 160);
      if (chance(dt * 0.003)) log(sim, 'warn', '低镁血症：QT 延长、心律失常阈值下降，单纯补钾往往无效。');
    }
    if (v.mg > 1.6) {
      dbump(sim, 'hr', -0.5 * (v.mg - 1.6) * dt, -50, 0);
      dbump(sim, 'contractility', -0.6 * (v.mg - 1.6) * dt, -50, 0);
      dbump(sim, 'avconduction', -1.2 * (v.mg - 1.6) * dt, -60, 0);
    }
    if (v.ca < 1.85) {
      dbump(sim, 'qt', 18 * (1.85 - v.ca) * dt, 0, 140);
      dbump(sim, 'arrhythmia', 0.15 * dt, 0, 100);
    } else if (v.ca > 3.0) {
      dbump(sim, 'qt', -10 * dt, -80, 0);
      dbump(sim, 'arrhythmia', 0.25 * dt, 0, 100);
      dbump(sim, 'renal', -0.05 * dt, -60, 0);
    }
    if (v.phos < 0.45) {
      dbump(sim, 'contractility', -0.12 * dt, -40, 0);
      dbump(sim, 'rr', -0.12 * dt, -10, 0);
    } else if (v.phos > 2.0 && v.renal < 45) {
      dbump(sim, 'ca', -0.0008 * dt, -0.8, 0);               /* 高磷 → 钙磷沉积 */
      dbump(sim, 'qt', 4 * dt, 0, 80);
    }
    if (v.ph < 7.2) dbump(sim, 'k', 0.004 * dt, 0, 2);       /* 酸中毒 → 钾外移 */
    else if (v.ph > 7.5) dbump(sim, 'k', -0.004 * dt, -1.5, 0);

    /* --- 心 → 肺：左心功能不全 + 容量负荷 → 心源性肺水肿 --- */
    if (pulse && v.contractility < 45 && v.volume > 4900) {
      var pse = ((45 - v.contractility) / 45) * clamp((v.volume - 4900) / 1500, 0, 1.2);
      dbump(sim, 'spo2', -0.30 * pse * dt, -30, 0);
      dbump(sim, 'secretions', 0.20 * pse * dt, 0, 70);
      dbump(sim, 'rr', 0.12 * pse * dt, 0, 15);
      dbump(sim, 'airway', -0.03 * pse * dt, -30, 0);
    }
    /* --- 肺 → 心：缺氧性肺血管收缩 → 右心后负荷增加、心肌抑制 --- */
    if (v.spo2 < 85 || v.paco2 > 55) {
      dbump(sim, 'contractility', -0.07 * dt, -50, 0);
      dbump(sim, 'hr', 0.25 * dt, 0, 30);
      dbump(sim, 'arrhythmia', 0.12 * dt, 0, 100);
    }
    /* --- 极重度低氧（SpO₂ < 32%）：交感代偿转为缺氧性心肌抑制 ---
       先心动过缓，约 1–2 分钟内滑向停搏。这一条是为了让「严重肺水肿 / 窒息 / 分流」
       有一个生理终点：没有它，SpO₂ 掉到 0 也能靠代偿维持心率，病人永远不死。 */
    if (v.spo2 < 32) {
      var hypSev = (32 - v.spo2) / 32;
      dbump(sim, 'hr', -1.10 * hypSev * dt, -95, 0);
      dbump(sim, 'contractility', -0.05 * hypSev * dt, -60, 0);
      dbump(sim, 'brain', -0.25 * hypSev * dt, -100, 0);
      if (hypSev > 0.55 && !sim.__hypoxLogged) {
        sim.__hypoxLogged = true;
        log(sim, 'crit', '⚠ 极重度低氧（SpO₂ ' + v.spo2.toFixed(0) + '%）：心动过缓、心肌抑制，离停搏只剩 1–2 分钟。');
      }
    } else if (v.spo2 > 60) {
      sim.__hypoxLogged = false;
    }
    /* --- 低体温 → 凝血酶活性下降（创伤致死三联征之一） --- */
    if (v.temp < 35.5) dbump(sim, 'clotting', -0.10 * (35.5 - v.temp) * dt, -70, 0);
    /* --- 高热 → 不显性失水与代谢需求增加 --- */
    if (v.temp > 39) dbump(sim, 'volume', -0.45 * (v.temp - 39) * dt, -1200, 0);
    /* --- 肾 → 心 / 血：尿毒症性心肌病、血小板功能异常 --- */
    if (v.renal < 22) {
      var ursev = (22 - v.renal) / 22;
      dbump(sim, 'contractility', -0.05 * ursev * dt, -40, 0);
      dbump(sim, 'arrhythmia', 0.18 * ursev * dt, 0, 80);
      dbump(sim, 'clotting', -0.05 * ursev * dt, -50, 0);
      dbump(sim, 'plt', -0.10 * ursev * dt, -60, 0);
    }
    /* --- 肝 → 肺：肝肺综合征（肺内分流） --- */
    if (v.hepatic < 32) dbump(sim, 'spo2', -0.05 * ((32 - v.hepatic) / 32) * dt * 10, -25, 0);
    /* --- 颅高压 → 神经源性心肌顿抑 / 尿崩 --- */
    if (v.icp > 30) {
      var nse = (v.icp - 30) / 30;
      dbump(sim, 'contractility', -0.06 * nse * dt, -40, 0);
      dbump(sim, 'arrhythmia', 0.20 * nse * dt, 0, 80);
      if (v.icp > 42) {
        dbump(sim, 'urine', 1.2 * nse * dt, 0, 300);          /* 中枢性尿崩 */
        dbump(sim, 'na', 0.03 * nse * dt, 0, 15);
        dbump(sim, 'volume', -0.5 * nse * dt, -1500, 0);
      }
    }
    /* --- 胰 → 肺 / 钙：重症胰腺炎的全身炎症与低钙 --- */
    if (/pancreatitis/.test(defId)) {
      dbump(sim, 'ca', -0.0016 * dt, -1.0, 0);
      dbump(sim, 'spo2', -0.06 * dt, -30, 0);
      dbump(sim, 'volume', -0.7 * dt, -2000, 0);
    }
    /* --- 肾上腺 / 甲状腺危象的器官外效应 --- */
    if (defId === 'adrenal_crisis') {
      dbump(sim, 'na', -0.004 * dt, -12, 0);
      dbump(sim, 'k', 0.004 * dt, 0, 2.0);
      dbump(sim, 'glucose', -0.006 * dt, -2.5, 0);
      dbump(sim, 'svr', -0.15 * dt, -350, 0);
    }
    if (defId === 'thyroid_storm') {
      dbump(sim, 'hr', 0.15 * dt, 0, 40);
      dbump(sim, 'temp', 0.0015 * dt, 0, 2.0);
      dbump(sim, 'arrhythmia', 0.05 * dt, 0, 80);
    }
    /* --- 误吸：呕吐 + 气道保护丧失 → 吸入性肺炎 --- */
    if (v.emesis > 35 && sim.airwayMode === 'none' && v.sedation > 25 && chance(dt * 0.006)) {
      dbump(sim, 'airway', -18, -60, 0);
      dbump(sim, 'spo2', -8, -40, 0);
      dbump(sim, 'temp', 0.5, 0, 2);
      dbump(sim, 'wbc', 3, 0, 15);
      log(sim, 'crit', '⚠ 呕吐后误吸：气道分泌物增多、氧合下降，考虑吸入性肺炎。');
      sim.emit.push({ kind: 'toast', type: 'crit', title: '误吸', text: '气道保护丧失，出现吸入性肺炎' });
    }

    /* --- 内环境 --- */
    if (!pulse) {
      dbump(sim, 'lactate', 0.075 * dt, 0, 20);
      dbump(sim, 'ph', -0.00045 * dt, -0.8, 0);
      dbump(sim, 'paco2', 0.18 * dt, -10, 40);
    } else if (v.map < 65 || v.spo2 < 90) {
      dbump(sim, 'lactate', 0.02 * dt, 0, 20);
      dbump(sim, 'ph', -0.00012 * dt, -0.8, 0);
    } else if (v.lactate > 1) {
      dbump(sim, 'lactate', -0.05 * dt, -5, 0);
      dbump(sim, 'ph', 0.00008 * dt, -0.2, 0.1);
    }
    /* 氧输送不足：即使 MAP/SpO₂ 尚可，SvO₂ 低仍说明「氧供不够组织用」 */
    if (pulse && v.svo2 < 50) {
      var oxysev = clamp((50 - v.svo2) / 50, 0, 1);
      if (map >= 65 && v.spo2 >= 90) dbump(sim, 'lactate', 0.035 * oxysev * dt, 0, 20);
      if (v.svo2 < 32) {
        dbump(sim, 'renal', -0.05 * oxysev * dt, -80, 0);
        dbump(sim, 'hepatic', -0.04 * oxysev * dt, -70, 0);
        dbump(sim, 'brain', -0.04 * oxysev * dt, -60, 0);
      }
    }
    if (v.lactate > 5) dbump(sim, 'contractility', -0.25 * dt, -70, 0);
    if (v.ph < 7.2) { dbump(sim, 'contractility', -0.2 * dt, -70, 0); dbump(sim, 'svr', -6 * dt, -700, 0); }
    /* --- 药物过量：靶器官进行性损伤 + 致死性心律失常 --- */
    var tox = sim.tox;
    if (tox && tox.level > 1) {
      var org = tox.organ || {};
      /* 血药浓度是「相对毒性阈值的倍数」，不设上限：浓度越高，靶器官损伤越快 */
      var lv = tox.level;
      var sev = Math.min(lv, 80);          /* 只约束单帧数值稳定性，不代表临床封顶 */
      if (org.heart) {
        var hse = sev * 0.6;
        dbump(sim, 'contractility', -0.12 * hse * dt, -95, 0);
        dbump(sim, 'arrhythmia', 0.30 * hse * dt, 0, 100);
        dbump(sim, 'hr', -0.05 * hse * dt, -120, 0);
      }
      if (org.lung) {
        var lse = sev * 0.6;
        dbump(sim, 'airway', -0.10 * lse * dt, -80, 0);
        dbump(sim, 'spo2', -0.12 * lse * dt, -40, 0);
        dbump(sim, 'rr', -0.08 * lse * dt, -30, 0);
        if (chance(dt * 0.004 * Math.min(lse, 40))) dbump(sim, 'bronchospasm', 2, 0, 60);
      }
      if (org.brain) {
        var bse = sev * 0.6;
        dbump(sim, 'gcs', -0.03 * bse * dt, -12, 0);
        dbump(sim, 'rr', -0.03 * bse * dt, -20, 0);
      }
      if (org.liver) dbump(sim, 'hepatic', -0.06 * sev * dt, -100, 0);
      if (org.kidney) {
        dbump(sim, 'renal', -0.06 * sev * dt, -100, 0);
        dbump(sim, 'urine', -0.10 * Math.min(sev, 60) * dt, -200, 0);
      }
      if (org.blood) {
        dbump(sim, 'clotting', -0.04 * sev * dt, -90, 0);
        dbump(sim, 'plt', -0.6 * sev * dt, -300, 0);
      }
      if (org.gut) dbump(sim, 'gi', -0.04 * sev * dt, -80, 0);

      /* 高浓度直接抑制循环：血压先是「飙高」，随后心肌抑制 + 血管麻痹 → 崩落。
         这一步让「浓度更高」在数值上一定更糟，而不是被受体饱和掩盖。 */
      if (lv > 2) {
        var col = Math.min(lv - 2, 40);
        dbump(sim, 'contractility', -0.10 * col * dt, -95, 0);
        dbump(sim, 'svr', -6 * col * dt, -2000, 0);
        dbump(sim, 'lactate', 0.03 * col * dt, 0, 20);
      }

      /* 致死通道：按血药浓度分级，确定性触发，不再靠小概率摇骰子 */
      if (lv >= 25 && sim.rhythm !== 'asystole') {
        sim.vtPulse = false;
        setRhythm(sim, 'asystole', '血药浓度 ' + lv.toFixed(0) + '× 毒性阈值（' + (tox.drug || '药物') + '）· 中毒性心脏停搏');
        sim.tox.lethal = true;
      } else if (lv >= 8 && sim.rhythm !== 'vf' && sim.rhythm !== 'asystole') {
        sim.vtPulse = false;
        setRhythm(sim, 'vf', '血药浓度 ' + lv.toFixed(0) + '× 毒性阈值（' + (tox.drug || '药物') + '）· 恶性心律失常');
        sim.tox.lethal = true;
      }
    }

    /* --- 血钾：低钾易激，高钾先兴奋后抑制，最终心脏停搏 --- */
    if (v.k > 5.5) {
      /* 5.5-6.5 心肌兴奋性增高（T 波高尖） */
      dbump(sim, 'arrhythmia', (v.k - 5.5) * 2.4 * dt, 0, 100);
      /* >6.5 传导抑制：QRS 增宽、心动过缓、收缩力下降 */
      if (v.k > 6.5) {
        dbump(sim, 'avconduction', -(v.k - 6.5) * 7 * dt, -90, 0);
        dbump(sim, 'hr', -(v.k - 6.5) * 2.2 * dt, -90, 0);
        dbump(sim, 'contractility', -(v.k - 6.5) * 5 * dt, -85, 0);
        dbump(sim, 'arrhythmia', (v.k - 6.5) * 6 * dt, 0, 100);
      }
      /* 致命性心律失常：血钾越高，单位时间发生率越高 */
      if (v.k > 7.0) {
        var vfRisk = (v.k - 7.0) * 0.22;          /* 7.0→0/s，8.0→0.22/s */
        if (sim.rhythm !== 'vf' && sim.rhythm !== 'asystole' && chance(dt * vfRisk)) {
          sim.vtPulse = false;
          setRhythm(sim, 'vf', '高钾血症（K⁺ ' + v.k.toFixed(1) + '）');
        }
      }
      if (v.k > 8.0) {
        var asyRisk = (v.k - 8.0) * 0.5;          /* 8.0→0/s，10→1/s */
        if (sim.rhythm !== 'asystole' && chance(dt * asyRisk)) {
          setRhythm(sim, 'asystole', '高钾性心脏停搏（K⁺ ' + v.k.toFixed(1) + '）');
        }
      }
      /* 极端高钾：直接电静息，任何复苏都无法恢复自主循环 */
      if (v.k >= 10 && sim.rhythm !== 'asystole') {
        setRhythm(sim, 'asystole', '极度高钾血症 · 心肌电活动消失（K⁺ ' + v.k.toFixed(1) + '）');
        log(sim, 'crit', '⚠⚠ 血清钾 ' + v.k.toFixed(1) + ' mmol/L，心肌电活动完全消失。立即停用含钾药物，静推葡萄糖酸钙 + 胰岛素/葡萄糖，否则不可逆。');
      }
    } else if (v.k > 0 && v.k < 2.9) {
      dbump(sim, 'arrhythmia', 0.8 * dt, 0, 100);
    }
    if (v.ca < 1.8) dbump(sim, 'contractility', -0.3 * dt, -60, 0);
    if (v.temp < 34.5) { dbump(sim, 'hr', -0.35 * dt * (34.5 - v.temp), -50, 0); dbump(sim, 'arrhythmia', 0.6 * dt, 0, 100); }
    if (v.temp > 39.5) dbump(sim, 'hr', 0.25 * dt * (v.temp - 39.5), -20, 40);
    if (v.glucose > 15) { dbump(sim, 'urine', 0.4 * dt, -100, 300); dbump(sim, 'na', -0.02 * dt, -12, 0); }
    if (v.glucose < 3.5 && v.gcs < 12) dbump(sim, 'seizure', 0.3 * dt, 0, 80);
    if (v.na > 152) dbump(sim, 'brain', -0.25 * dt, -100, 0);
    if (v.na < 122) dbump(sim, 'brain', -0.35 * dt, -100, 0);
    if (v.seizure > 25) { dbump(sim, 'brain', -0.3 * dt, -100, 0); dbump(sim, 'icp', 0.15 * dt, 0, 50); if (chance(dt * 0.1)) dbump(sim, 'temp', 0.02, 0, 3); }
    if (v.anaphylaxis > 10) { dbump(sim, 'svr', -30 * dt * (v.anaphylaxis / 60), -800, 0); dbump(sim, 'airway', -0.4 * dt, -70, 0); }

    /* --- 血液 --- */
    if (v.inr > 2.5 && v.clotting > 20) dbump(sim, 'clotting', -0.06 * dt, -80, 0);
    if (v.plt < 50 && v.clotting > 10) dbump(sim, 'clotting', -0.05 * dt, -80, 0);
    if (sim.bleeding) {
      dbump(sim, 'volume', -sim.bleeding * dt, -3500, 0);
      dbump(sim, 'hb', -sim.bleeding * 0.0045 * dt, -12, 0);
      if (chance(dt * 0.02 * sim.bleeding)) dbump(sim, 'clotting', -0.2, -60, 0);
      if (chance(dt * 0.05)) log(sim, 'crit', '持续活动性出血，血压进行性下降…');
    }

    /* --- 心肌 --- */
    if (v.coronary < 60) {
      dbump(sim, 'contractility', -0.25 * (1 - v.coronary / 60) * dt, -80, 0);
      if (chance(dt * 0.012 * (1 - v.coronary / 100))) {
        dbump(sim, 'arrhythmia', 6, 0, 100);
        if (chance(0.35)) setRhythm(sim, 'vt', '心肌缺血');
      }
    } else if (v.contractility < 100) dbump(sim, 'contractility', 0.06 * dt, 0, 20);

    /* --- 疼痛 / 寒战 --- */
    if (v.pain > 60) dbump(sim, 'hr', 0.12 * dt * (v.pain / 100), -10, 25);
    if (v.pain > 0) dbump(sim, 'pain', -0.03 * dt, -100, 0);
    if (v.sedation > 0) dbump(sim, 'sedation', -0.02 * dt, -100, 0);
  }

  /* ================= 11. 心律 ================= */
  var RHY_NAME = {
    sinus: '窦性心律', sinus_brady: '窦性心动过缓', sinus_tach: '窦性心动过速',
    afib: '心房颤动', flutter: '心房扑动', svt: '室上性心动过速', vt: '室性心动过速',
    torsades: '尖端扭转型室速', vf: '心室颤动',
    asystole: '心脏停搏', pea: '无脉性电活动', block3: '三度房室传导阻滞',
    block2: '二度房室传导阻滞', junctional: '交界性心律', agonal: '濒死心律'
  };
  M.RHY_NAME = RHY_NAME;

  var RHY_ALIAS = {
    brady: 'sinus_brady', bradycardia: 'sinus_brady', tachycardia: 'sinus_tach', sinus_tachycardia: 'sinus_tach',
    vfib: 'vf', pulseless_vt: 'vt', svt_t: 'svt', aflutter: 'flutter', junctional_rhythm: 'junctional',
    mobitz2: 'block2', mobitz: 'block2', torsade: 'torsades', tdp: 'torsades'
  };
  M.RHY_ALIAS = RHY_ALIAS;
  function setRhythm(sim, r, cause) {
    r = RHY_ALIAS[r] || r;
    if (sim.rhythm === r) return;
    var old = sim.rhythm;
    sim.rhythm = r; sim.rhythmT = sim.t;
    if (r === 'vf' && !sim.vtPulse) sim.vtPulse = false;
    var txt = (RHY_NAME[r] || r);
    var crit = (r === 'vf' || r === 'asystole' || r === 'pea' || r === 'vt');
    log(sim, crit ? 'crit' : 'warn', '心律改变：' + (RHY_NAME[old] || old) + ' → ' + txt + (cause ? '（' + cause + '）' : ''));
    sim.emit.push({ kind: 'toast', type: crit ? 'crit' : 'warn', title: '心律变化', text: '转为 ' + txt + (cause ? ' · ' + cause : '') });
  }
  M.setRhythm = setRhythm;

  function updateRhythm(sim, v, dt) {
    /* —— 容量性心脏停搏 ——
       体液总量 > 12 L 或胃内容量 >= 10 L 时必须停搏；
       而且容量恢复之前，CPR / 除颤 / 肾上腺素都无法恢复自主循环（见下方 ROSC 与 shock 判定）。 */
    if (!sim.ecgLock) {
      if ((v.volume || 0) >= FLUID_MAX && sim.rhythm !== 'asystole') {
        sim.vtPulse = false;
        setRhythm(sim, 'asystole', '体液总量 ' + (v.volume / 1000).toFixed(1) + ' L 超过 12 L · 容量性心脏停搏');
      } else if ((sim.gut || 0) >= GUT_MAX && sim.rhythm !== 'asystole') {
        sim.vtPulse = false;
        setRhythm(sim, 'asystole', '胃内容量 ' + ((sim.gut || 0) / 1000).toFixed(1) + ' L 超过 10 L · 胃扩张迷走性停搏');
      }
    }
    if (sim.ecgLock) return;
    var r = sim.rhythm;
    if (sim.controlled && r === 'sinus') return;
    var lowMg = (v.mg || 0.9) < 0.55;
    switch (r) {
      case 'sinus':
        if (v.hr < 45) setRhythm(sim, 'sinus_brady', '心率下降');
        else if (v.hr > 130) setRhythm(sim, 'sinus_tach', '心率增快');
        else if (v.avconduction < 40) setRhythm(sim, 'block3', '房室传导阻滞');
        else if (v.avconduction < 62 && chance(dt * 0.03)) setRhythm(sim, 'block2', '房室传导延迟，出现脱落搏动');
        else if ((v.qt || 400) > 500 && (v.k < 3.3 || lowMg) && v.arrhythmia > 30 && chance(dt * 0.012)) {
          sim.vtPulse = false;
          setRhythm(sim, 'torsades', '长 QT + 低钾/低镁，出现尖端扭转型室速');
        }
        else if (v.arrhythmia > 70 && chance(dt * 0.006 * (v.arrhythmia / 100))) { sim.vtPulse = true; setRhythm(sim, 'vt', '室性心律失常'); }
        else if (v.arrhythmia > 55 && chance(dt * 0.006 * (v.arrhythmia / 100))) setRhythm(sim, 'afib', '心房易激');
        else if (v.arrhythmia > 55 && chance(dt * 0.0025)) setRhythm(sim, 'flutter', '心房内大折返，形成心房扑动');
        break;
      case 'sinus_brady':
        if (v.hr >= 50) setRhythm(sim, 'sinus', '心率恢复');
        else if (v.hr < 22 || v.avconduction < 25) setRhythm(sim, 'block3', '传导恶化');
        else if (v.avconduction < 50 && chance(dt * 0.012)) setRhythm(sim, 'junctional', '窦房结抑制，交界区逸搏');
        break;
      case 'sinus_tach':
        if (v.hr <= 120) setRhythm(sim, 'sinus', '心率恢复');
        else if (v.hr > 180) setRhythm(sim, 'svt', '心动过速恶化');
        break;
      case 'afib':
        if (v.arrhythmia < 20 && chance(dt * 0.02)) setRhythm(sim, 'sinus', '心律转复');
        else if (v.arrhythmia > 72 && chance(dt * 0.006)) setRhythm(sim, 'flutter', '房颤转为心房扑动');
        break;
      case 'flutter':
        if (v.arrhythmia < 15 && v.avconduction > 75 && chance(dt * 0.02)) setRhythm(sim, 'sinus', '恢复窦性心律');
        else if (v.arrhythmia > 60 && chance(dt * 0.004)) setRhythm(sim, 'afib', '转为心房颤动');
        else if (v.hr < 60 && v.avconduction < 45) setRhythm(sim, 'junctional', '房室传导抑制');
        break;
      case 'junctional':
        if (v.hr > 65 && v.avconduction > 60) setRhythm(sim, 'sinus', '窦房结恢复起搏');
        else if (v.avconduction < 25 && chance(dt * 0.02)) setRhythm(sim, 'block3', '传导恶化');
        break;
      case 'block2':
        if (v.avconduction < 30 && chance(dt * 0.03)) setRhythm(sim, 'block3', '进展为三度阻滞');
        else if (v.avconduction > 72) setRhythm(sim, 'sinus', '房室传导恢复');
        break;
      case 'svt':
        if (v.hr < 110) setRhythm(sim, 'sinus', '转复');
        else if (v.hr > 220) setRhythm(sim, 'flutter', '室上速蜕变为房扑（2:1 传导）');
        else if (chance(dt * 0.004)) { sim.vtPulse = true; setRhythm(sim, 'vt', '恶化'); }
        break;
      case 'vt':
        if ((v.qt || 400) > 520 && chance(dt * 0.006)) {
          sim.vtPulse = false;
          setRhythm(sim, 'torsades', 'QT 延长，退化为尖端扭转型室速');
        } else if (v.arrhythmia < 25 && chance(dt * 0.03)) { sim.vtPulse = true; setRhythm(sim, 'sinus', '自行转复'); }
        else if (sim.t - sim.rhythmT > 60 && chance(dt * 0.02)) { sim.vtPulse = false; setRhythm(sim, 'vf', '蜕变为室颤'); }
        break;
      case 'torsades':
        if (sim.t - sim.rhythmT > 20 && chance(dt * 0.02)) setRhythm(sim, 'vf', '尖端扭转型室速恶化为室颤');
        break;
      case 'vf':
        if (sim.t - sim.rhythmT > 200 && chance(dt * 0.01)) setRhythm(sim, 'asystole', '电活动耗尽');
        break;
      case 'block3':
        if (v.avconduction > 75) setRhythm(sim, 'sinus', '传导恢复');
        else if (v.hr < 20 && chance(dt * 0.01)) setRhythm(sim, 'asystole', '停搏');
        break;
      case 'pea':
        if (chance(dt * 0.02)) setRhythm(sim, 'asystole', '电机械分离恶化');
        else if (v.sbpPre > 65 && v.hr > 30 && v.volume < FLUID_MAX && (sim.gut || 0) < GUT_MAX &&
          !(sim.tox && sim.tox.level >= 2)) setRhythm(sim, 'sinus', '机械收缩恢复（ROSC）');
        break;
      case 'asystole':
        /* 病因可逆（血钾回落、氧合恢复）时，持续高质量 CPR 仍有 ROSC 机会 */
        if (sim.cpr && v.k < 6.8 && v.spo2 > 70 && v.temp > 33 &&
            v.volume < FLUID_MAX && (sim.gut || 0) < GUT_SAFE &&
            !(sim.tox && sim.tox.level >= 2) &&
            sim.t - sim.rhythmT > 20 && chance(dt * 0.012)) {
          sim.vtPulse = true;
          setRhythm(sim, 'sinus', '自主循环恢复（ROSC）');
          sim.perfusion = Math.max(sim.perfusion, 0.35);
          log(sim, 'good', '✓ 自主循环恢复（ROSC）！继续纠正病因、维持血压与氧合。');
          sim.emit.push({ kind: 'rosc' });
        }
        break;
    }
    /* 心率极端 */
    if (r !== 'asystole' && r !== 'vf' && r !== 'torsades' && v.hr <= 1 && chance(dt * 0.25)) setRhythm(sim, 'asystole', '心率消失');
    /* 有组织心电活动但没有机械收缩 → 无脉性电活动（PEA） */
    var organized = (r === 'sinus' || r === 'sinus_brady' || r === 'sinus_tach' || r === 'afib' ||
      r === 'flutter' || r === 'svt' || r === 'block2' || r === 'block3' || r === 'junctional');
    if (organized && !v.pulseOK && v.hr > 20 && sim.t - sim.rhythmT > 1.5) {
      setRhythm(sim, 'pea', '有电活动、无机械收缩（PEA）');
    }
  }


  /* ================= 慌乱操作与误处置 ================= */
  /* 没事乱点、手忙脚乱时，可能出现误放电、拿错药、扯脱管路这类「人祸」，
     其中误放电会直接落在 T 波易损期上诱发室颤。 */
  var MISHAPS = [
    { id: 'mis_shock', n: '除颤仪误放电', msg: '慌乱中误触放电键，非同步电流落在 T 波易损期', arrest: 0.55, mods: { arrhythmia: 45 } },
    { id: 'mis_drug', n: '拿错药 / 抽错剂量', msg: '慌乱中抽错了药，患者随即出现明显不良反应', arrest: 0.12, mods: { sbp: -20, hr: 25 } },
    { id: 'mis_line', n: '管路与导线被扯脱', msg: '监护导线与输液管路被扯脱，监护中断、输液外渗', arrest: 0.06, mods: { spo2: -6, pain: 8 } },
    { id: 'mis_cpr', n: '按压手法错误', msg: '按压位置过低，出现肋骨骨折与上腹疼痛', arrest: 0.05, mods: { pain: 25, hb: -0.6 } },
    { id: 'mis_airway', n: '气道操作失误', msg: '插管时误入食管，血氧骤降', arrest: 0.10, mods: { spo2: -14, airway: -20 } }
  ];
  M.MISHAPS = MISHAPS;

  function doMishap(sim, act) {
    var m = pick(MISHAPS);
    sim.counters.mistake = (sim.counters.mistake || 0) + 1;
    for (var k in (m.mods || {})) {
      if (k === 'hb') sim.drift.hb = (sim.drift.hb || 0) + m.mods[k];
      else sim.evtMod[k] = (sim.evtMod[k] || 0) + m.mods[k];
    }
    log(sim, 'crit', '⚠ 操作失误（' + act + '）：' + m.n + ' —— ' + m.msg);
    sim.emit.push({ kind: 'toast', type: 'crit', title: '操作失误 · ' + m.n, text: m.msg });
    M.mark(sim, 'mistake', m.n);
    if (chance(m.arrest)) {
      sim.vtPulse = false;
      setRhythm(sim, 'vf', '操作失误：' + m.n);
      log(sim, 'crit', '⚠ 由于' + m.n + '，心律恶化为心室颤动，立即除颤 / 按压！');
    }
  }

  /* 记录一次操作；短时间内反复点同一操作 / 频繁乱点，就可能出事 */
  M.misclick = function (sim, act) {
    if (!sim || sim.dead) return;
    var safeActs = { guide: 1, trend: 1, examine: 1, nurse: 1, transfuse: 1 };
    if (safeActs[act]) return;
    if (act === 'cpr' && sim.cpr) return;      /* 正在按压时再点停止，不算慌乱 */
    var w = sim.clickWin;
    if (!w || sim.t - w.t0 > 4) w = sim.clickWin = { t0: sim.t, n: 0, same: {} };
    if (sim.t - w.t0 > 4) { w.t0 = sim.t; w.n = 0; w.same = {}; }
    w.n++;
    w.same[act] = (w.same[act] || 0) + 1;

    var burst = w.n >= 8;
    var spam = w.same[act] >= 4;
    if (!burst && !spam) return;
    if (sim.__misCool && sim.t - sim.__misCool < 3) return;
    sim.__misCool = sim.t;

    var p = burst ? clamp(0.06 + (w.n - 8) * 0.03, 0.06, 0.40) : 0.10;
    if (!chance(p)) {
      if (!sim.__panicAt || sim.t - sim.__panicAt > 8) {
        sim.__panicAt = sim.t;
        log(sim, 'warn', '操作过于频繁（' + act + '）：先看清监护再动手，慌乱操作迟早出事。');
      }
      return;
    }
    doMishap(sim, act);
  };

  /* ================= 12. 电击 / CPR / 气道 ================= */
  function shock(sim, joules, sync) {
    sim.counters.shock++;
    /* 放电伪影：波形上会出现一个巨大的尖峰 + 衰减噪声 */
    sim.shockFx = sim.t;
    sim.shockJ = joules;
    M.mark(sim, 'shock', joules + 'J');
    var r = sim.rhythm;
    var pulse = hasPulse(sim, sim.v);
    /* 容量性停搏：除颤/复律一律无效，必须先放血或清除胃内容物 */
    if ((sim.v.volume || 0) >= FLUID_MAX || (sim.gut || 0) >= GUT_MAX) {
      log(sim, 'warn', '电击 ' + joules + 'J 无效：容量性心脏停搏（体液 ' + (sim.v.volume / 1000).toFixed(1) +
        ' L，胃内容 ' + ((sim.gut || 0) / 1000).toFixed(1) + ' L）。必须先放血 / 洗胃把容量降下来。');
      sim.emit.push({ kind: 'toast', type: 'warn', title: '电击无效', text: '容量性停搏：先放血或洗胃' });
      return false;
    }
    /* 血药浓度仍在致死水平：电击即使转复也会立刻再恶化 */
    if (sim.tox && sim.tox.level >= 8) {
      log(sim, 'warn', '电击 ' + joules + 'J 无效：血药浓度 ' + sim.tox.level.toFixed(0) +
        '× 毒性阈值（' + (sim.tox.drug || '药物') + '），浓度降下来之前无法维持窦性心律。');
      sim.emit.push({ kind: 'toast', type: 'warn', title: '电击无效', text: '血药浓度过高：先停药等待代谢 / 拮抗' });
      return false;
    }
    if (r === 'asystole') {
      log(sim, 'warn', '电击 ' + joules + 'J：心脏停搏无除颤指征，无效。');
      sim.emit.push({ kind: 'toast', type: 'warn', title: '除颤无效', text: '心脏停搏（直线）不可电击，继续 CPR + 肾上腺素' });
      return false;
    }
    if (r === 'vf' || r === 'torsades' || (r === 'vt' && !pulse)) {
      var elapsed = sim.t - sim.rhythmT;
      var p = 0.72 * Math.exp(-elapsed / 160) + 0.8 * clamp((joules - 100) / 150, 0, 0.35);
      p *= (0.75 + 0.5 * sim.perfusion);
      if (sim.airwayMode !== 'none') p += 0.08;
      /* 尖端扭转型室速常需先纠正低镁/长 QT，单纯电击容易复发 */
      if (r === 'torsades') p *= (sim.v && (sim.v.mg || 0.9) < 0.6 ? 0.75 : 1);
      p = clamp(p, 0.05, 0.95);
      if (chance(p)) {
        sim.vtPulse = true;
        /* 除颤成功后心脏需要短暂「重启」：约 1.2 秒的电静息，然后窦性心律带脉搏回来 */
        sim.postShockUntil = sim.t + 1.2;
        setRhythm(sim, 'sinus', '电击除颤成功');
        sim.drift.arrhythmia = (sim.drift.arrhythmia || 0) - 25;
        log(sim, 'good', '⚡ 电击 ' + joules + 'J 成功！除颤后短暂电静息，随后恢复窦性心律与脉搏。');
        sim.emit.push({ kind: 'toast', type: 'good', title: '除颤成功', text: joules + 'J 后恢复窦性心律' });
        if (sim.rhythm === 'sinus') sim.rhythmT = sim.t;
        return true;
      }
      log(sim, 'crit', '⚡ 电击 ' + joules + 'J 未转复，继续 CPR，肾上腺素 1mg，可提高能量再试。');
      return false;
    }
    if (r === 'afib' || r === 'flutter' || r === 'svt' || r === 'sinus_tach') {
      if (sync === false) {
        log(sim, 'crit', '⚠ 未同步电击，R-on-T 诱发心室颤动！');
        sim.vtPulse = false; setRhythm(sim, 'vf', '非同步电击');
        return false;
      }
      /* 房扑所需能量更低（50–100 J），复律成功率也更高 */
      if (chance(r === 'flutter' ? 0.88 : 0.8)) {
        sim.postShockUntil = sim.t + 0.6;
        setRhythm(sim, 'sinus', '同步电复律成功');
        log(sim, 'good', '⚡ 同步电复律成功，转为窦性心律。');
        return true;
      }
      log(sim, 'warn', '电复律未成功，可加大能量或药物辅助。');
      return false;
    }
    /* 有脉搏、又不需要除颤的心律上放电：电流落在 T 波易损期，可能直接诱发室颤 */
    if (pulse && chance(0.35)) {
      sim.vtPulse = false;
      log(sim, 'crit', '⚠ 在无需除颤的心律上放电，电流落在 T 波易损期（R-on-T），诱发心室颤动！');
      setRhythm(sim, 'vf', '误放电 · R-on-T');
      return false;
    }
    if (!pulse && r === 'asystole' && chance(0.5)) {
      sim.postopMod = sim.postopMod || {};
      sim.postopMod.contractility = (sim.postopMod.contractility || 0) - 1.5;
      log(sim, 'warn', '直线状态下反复放电只会加重心肌损伤，应继续 CPR + 肾上腺素。');
    }
    log(sim, 'info', '电击 ' + joules + 'J 已放电，当前心律无需除颤。');
    return false;
  }
  M.shock = shock;

  function setCPR(sim, on) {
    if (sim.cpr === on) return;
    sim.cpr = on;
    M.mark(sim, on ? 'cpr' : 'cprOff', on ? 'CPR' : '');
    log(sim, on ? 'act' : 'info', on ? '开始胸外按压（高质量 CPR，100-120 次/分）。' : '停止胸外按压。');
    if (on && sim.v && sim.v.pulseOK) {
      log(sim, 'warn', '⚠ 患者仍有脉搏，胸外按压属于无指征操作：可能造成肋骨骨折、肝脾损伤与心肌挫伤。');
      sim.evtMod.pain = (sim.evtMod.pain || 0) + 10;
      sim.postopMod = sim.postopMod || {};
      sim.postopMod.contractility = (sim.postopMod.contractility || 0) - 2;   /* 心肌挫伤 */
      if (chance(0.06)) {
        sim.bleeding = (sim.bleeding || 0) + 2;
        log(sim, 'crit', '按压导致肋骨骨折并腹腔内出血，血压开始下降。');
      }
    }
    if (on) sim.emit.push({ kind: 'toast', type: 'good', title: 'CPR 开始', text: '维持基础循环，为除颤和给药争取时间' });
  }
  M.setCPR = setCPR;

  function setAirway(sim, mode) {
    sim.airwayMode = mode;
    sim.vent = (mode === 'ett');
    var nm = { none: '未给予气道支持', o2: '面罩吸氧 10L/min', bag: '简易呼吸器辅助通气', ett: '气管插管 + 机械通气' };
    log(sim, 'act', '气道处理：' + (nm[mode] || mode) + '。');
    if (mode === 'ett') { sim.drift.airway = 0; sim.evtMod.airway = (sim.evtMod.airway || 0) + 100; }
    if (mode === 'o2' || mode === 'bag') sim.evtMod.airway = (sim.evtMod.airway || 0) + 60;
    if (mode && mode !== 'none') postopNote(sim, 'airway');
  }
  M.setAirway = setAirway;

  /* ================= 13. 输血 ================= */
  function transfuse(sim, product, abo, rh, units) {
    var p = sim.patient;
    var n = Math.max(0.5, Math.min(12, +(units || 1)));
    var donor = { abo: abo, rh: rh };
    var ok = (product === 'ffp' || product === 'plasma') ? plasmaCompat(donor, { abo: p.abo, rh: p.rh }) : compat(donor, { abo: p.abo, rh: p.rh });
    var rec = { t: sim.t, product: product, abo: abo, rh: rh, ok: ok, units: n };
    sim.bloodGiven.push(rec);
    if (product === 'prbc' || product === 'whole') {
      sim.evtMod.volume = (sim.evtMod.volume || 0) + 450 * n;
      sim.drift.hb = (sim.drift.hb || 0) + 2.2 * n;
      sim.drift.volume = (sim.drift.volume || 0) + 350 * n;
    } else if (product === 'ffp') {
      sim.drift.clotting = (sim.drift.clotting || 0) + 15 * n;
      sim.drift.inr = (sim.drift.inr || 0) - 0.35 * n;
    } else if (product === 'plt') {
      sim.drift.plt = (sim.drift.plt || 0) + 45 * n;
    } else if (product === 'albumin') {
      sim.evtMod.volume = (sim.evtMod.volume || 0) + 300 * n;
    }
    if (ok) {
      log(sim, 'good', '输血：' + productName(product) + ' ' + n + ' U（' + abo + rh + '），交叉配血相合，输注顺利。');
      sim.emit.push({ kind: 'toast', type: 'good', title: '输血 ' + n + ' U', text: productName(product) + ' ' + abo + rh });
      postopNote(sim, 'transfuse');
    } else {
      log(sim, 'crit', '⚠⚠⚠ 输血错误！供血 ' + abo + rh + ' 与受血者 ' + p.abo + p.rh + ' 不相合，发生急性溶血反应！');
      sim.emit.push({ kind: 'toast', type: 'crit', title: '急性溶血性输血反应', text: 'ABO 不相合！立即停止输血、补液、碱化尿液、升压' });
      sim.drift.hb = (sim.drift.hb || 0) - 4.5;
      sim.drift.k = (sim.drift.k || 0) + 1.6;
      sim.drift.inr = (sim.drift.inr || 0) + 1.4;
      sim.drift.plt = (sim.drift.plt || 0) - 110;
      sim.drift.clotting = (sim.drift.clotting || 0) - 45;
      sim.drift.renal = (sim.drift.renal || 0) - 45;
      sim.drift.urine = (sim.drift.urine || 0) - 60;
      sim.evtMod.sbp = (sim.evtMod.sbp || 0) - 50;
      sim.evtMod.hr = (sim.evtMod.hr || 0) + 35;
      sim.evtMod.temp = (sim.evtMod.temp || 0) + 1.6;
      sim.evtMod.pain = (sim.evtMod.pain || 0) + 35;
      sim.drift.arrhythmia = (sim.drift.arrhythmia || 0) + 25;
      sim.bleeding = (sim.bleeding || 0) + 3;
      if (chance(0.5)) setRhythm(sim, 'vf', '溶血反应');
    }
    return ok;
  }
  function plasmaCompat(donor, recip) {
    if (recip.abo === 'AB') return true;
    if (recip.abo === 'A') return donor.abo === 'A' || donor.abo === 'AB';
    if (recip.abo === 'B') return donor.abo === 'B' || donor.abo === 'AB';
    return donor.abo === 'O';
  }
  function productName(p) {
    return { prbc: '浓缩红细胞', whole: '全血', ffp: '新鲜冰冻血浆', plt: '血小板', albumin: '白蛋白' }[p] || p;
  }
  M.transfuse = transfuse; M.productName = productName;

  /* ================= 14. 手术 ================= */
  function findSite(id) {
    var S = M.SURGERY_SITES || [];
    for (var i = 0; i < S.length; i++) if (S[i].id === id) return S[i];
    return null;
  }
  function findProc(id) {
    var P = M.SURGERY_PROCS || [];
    for (var i = 0; i < P.length; i++) if (P[i].id === id) return P[i];
    return null;
  }
  M.findSite = findSite; M.findProc = findProc;
  function findComp(id) {
    var C = M.SURGERY_COMPLICATIONS || [];
    for (var i = 0; i < C.length; i++) if (C[i].id === id) return C[i];
    return null;
  }
  M.findComp = findComp;

  function complicationsFor(site, proc) {
    var ids = [];
    (site.complications || []).forEach(function (x) { if (ids.indexOf(x) < 0) ids.push(x); });
    (proc.complications || []).forEach(function (x) { if (ids.indexOf(x) < 0) ids.push(x); });
    return ids.map(findComp).filter(Boolean);
  }
  M.complicationsFor = complicationsFor;

  /* 手术收尾：把本次手术记入历史，避免「上次手术」占着 sim.surgery 让新手术开不了 */
  function archiveSurgery(sim, status) {
    var s = sim.surgery;
    if (!s) return;
    s.status = status || s.status || 'done';
    if (s.archived) return;
    s.archived = true;
    sim.surgeryHistory = sim.surgeryHistory || [];
    sim.surgeryHistory.push({
      t: sim.t, site: s.site.id, siteName: s.site.name,
      proc: s.proc.id, procName: s.proc.name,
      status: s.status, elapsed: s.t
    });
    if (sim.surgeryHistory.length > 20) sim.surgeryHistory.shift();
  }
  M.archiveSurgery = archiveSurgery;

  function startSurgery(sim, siteId, procId) {
    if (sim.surgery && sim.surgery.active) { log(sim, 'warn', '已有手术在进行中。'); return null; }
    if (sim.surgery) { archiveSurgery(sim, sim.surgery.status || 'done'); }
    var site = findSite(siteId), proc = findProc(procId);
    if (!site || !proc) { log(sim, 'warn', '手术方案无效。'); return null; }
    /* 洗胃 / 胃内容物清除：立刻抽空胃内容物，解除胃扩张与迷走反射 */
    if (procId === 'gastric_evac') {
      var had = sim.gut || 0;
      sim.gut = 0;
      log(sim, 'good', '胃内容物清除：抽出 ' + Math.round(had) + ' mL（' + (had / 1000).toFixed(1) + ' L），胃扩张解除。');
      if (had > 0) sim.emit.push({ kind: 'toast', type: 'good', title: '胃内容物已清除', text: '抽出 ' + Math.round(had) + ' mL' });
    }
    if ((site.procs || []).indexOf(procId) < 0) {
      var okList = (site.procs || []).map(function (x) { return M.procName(x); }).join('、');
      log(sim, 'warn', '「' + site.name + '」不适用「' + proc.name + '」。该部位可用术式：' + okList);
      sim.emit.push({ kind: 'toast', type: 'warn', title: '术式不适用', text: site.name + ' 只能做：' + okList });
      return null;
    }
    var nPh = Math.max(1, (proc.phases || []).length);
    var phases = (proc.phases || ['切皮', '操作', '关创']).map(function (n) {
      return { name: n, dur: (proc.durSec || 1200) / nPh, done: false, t: 0 };
    });
    sim.surgery = {
      site: site, proc: proc, phases: phases, idx: 0, t: 0, phaseT: 0,
      active: true, done: false, log: [],
      comp: null, compT: 0, compOptions: [], compResolved: null,
      riskMul: (sim.rank && sim.rank.compMul) || 1,
      bleeding: 0, status: 'running', archived: false
    };
    sim.counters.surg++;
    sim.bleeding = 0;
    sim.lastSurgSite = site.id;
    log(sim, 'act', '⚕ 开始手术：' + proc.name + ' @ ' + site.name + '（预计 ' + Math.round((proc.durSec || 1200) / 60) + ' 分钟）');
    log(sim, 'info', '手术步骤：' + phases.map(function (p) { return p.name; }).join(' → '));
    sim.emit.push({ kind: 'toast', type: 'warn', title: '手术开始', text: proc.name + ' @ ' + site.name });
    /* 因术后出血/吻合口漏等原因再次开台：开台即算「已按方案处理」，销掉对应的术后问题 */
    postopNote(sim, 'surgery', null, site.id);
    return sim.surgery;
  }
  M.startSurgery = startSurgery;

  function surgeryStep(sim) {
    var s = sim.surgery; if (!s || !s.active) return;
    sim.surgery.speedUp = true;
  }
  M.surgeryStep = surgeryStep;

  function makeFixOptions(sim, comp) {
    var right = (comp.fix || []).slice(0, 3);
    var wrongPool = [];
    var all = M.SURGERY_COMPLICATIONS || [];
    for (var i = 0; i < all.length && wrongPool.length < 12; i++) {
      if (all[i].id === comp.id) continue;
      (all[i].fix || []).forEach(function (f) { wrongPool.push(f); });
    }
    var generic = ['继续手术不予处理，观察变化', '加深麻醉、等待自行恢复', '快速关创结束手术', '仅记录不干预，待术后处理'];
    var opts = [], used = {};
    right.forEach(function (t) { opts.push({ text: t, ok: true }); used[t] = 1; });
    var g = generic.slice();
    while (opts.length < 5) {
      var pool = chance(0.5) && wrongPool.length ? wrongPool : g;
      if (!pool.length) break;
      var t2 = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      if (used[t2]) continue;
      used[t2] = 1;
      opts.push({ text: t2, ok: false });
    }
    for (var i2 = opts.length - 1; i2 > 0; i2--) {
      var j = Math.floor(Math.random() * (i2 + 1));
      var tmp = opts[i2]; opts[i2] = opts[j]; opts[j] = tmp;
    }
    return opts;
  }

  function triggerComplication(sim) {
    var s = sim.surgery; if (!s || !s.active || s.comp) return;
    var pool = complicationsFor(s.site, s.proc);
    if (!pool.length) return;
    var base = 0.10 * (s.site.risk || 3) / 3 * (s.proc.difficulty || 3) / 3 * s.riskMul;
    if (sim.patient.flags.bleed) base *= 1.3;
    if (sim.patient.flags.alcohol) base *= 1.15;
    if (!chance(clamp(base, 0.02, 0.5))) return;
    var comp = pick(pool);
    s.comp = comp; s.compT = 0; s.compResolved = null;
    s.compOptions = makeFixOptions(sim, comp);
    sim.counters.comp++;
    for (var k in (comp.vitals || {})) {
      if (k === 'volume' || k === 'hb') { sim.drift[k] = (sim.drift[k] || 0) + (comp.vitals[k] || 0); }
      else sim.evtMod[k] = (sim.evtMod[k] || 0) + (comp.vitals[k] || 0);
    }
    if (comp.id === 'big_bleed' || comp.id === 'vessel_rupture' || comp.id === 'surgical_bleed') {
      sim.bleeding = (sim.bleeding || 0) + 14 * (s.site.bleed || 1);
    }
    s.log.push({ t: sim.t, type: 'crit', text: '⚠ 并发症：' + comp.name + ' — ' + comp.msg });
    log(sim, 'crit', '⚠ 术中并发症：' + comp.name + '（' + comp.msg + '）必须在 ' + (comp.window || 45) + ' 秒内处理！');
    sim.emit.push({ kind: 'toast', type: 'crit', title: '术中 ' + comp.name, text: comp.msg + ' 窗口 ' + (comp.window || 45) + 's' });
  }

  function resolveComplication(sim, optIdx) {
    var s = sim.surgery; if (!s || !s.comp || s.compResolved) return;
    var opt = s.compOptions[optIdx];
    if (!opt) return;
    if (opt.ok) {
      s.compResolved = 'ok';
      sim.counters.compFixed++;
      s.log.push({ t: sim.t, type: 'good', text: '✓ 处置：' + opt.text + ' → 并发症得到控制' });
      log(sim, 'good', '✓ 术中处理（' + s.comp.name + '）：' + opt.text);
      if (s.comp.id === 'big_bleed' || s.comp.id === 'vessel_rupture') sim.bleeding = Math.max(0, (sim.bleeding || 0) - 12);
      sim.emit.push({ kind: 'toast', type: 'good', title: '并发症已控制', text: s.comp.name });
    } else {
      s.compResolved = 'bad';
      sim.counters.compFail++;
      s.log.push({ t: sim.t, type: 'crit', text: '✗ 处置不当：' + opt.text + ' → 病情恶化' });
      log(sim, 'crit', '✗ 术中处置不当：' + opt.text + '，' + s.comp.name + ' 加重！');
      var f = s.comp.fail || {};
      for (var k in (f.vitals || {})) sim.evtMod[k] = (sim.evtMod[k] || 0) + f.vitals[k];
      if (f.sbp) sim.drift.sbp = (sim.drift.sbp || 0) + f.sbp * 0.5;
      if (f.hb) sim.drift.hb = (sim.drift.hb || 0) + f.hb;
      sim.bleeding = (sim.bleeding || 0) + 8;
      if (f.risk && chance(f.risk * 0.5)) setRhythm(sim, 'vf', '术中并发症未控制');
    }
  }
  M.resolveComplication = resolveComplication;

  function cancelSurgery(sim) {
    var s = sim.surgery; if (!s || !s.active) return;
    s.active = false; s.done = false; s.aborted = true; s.status = 'aborted';
    sim.bleeding = 0;
    carryComplication(sim, s);
    archiveSurgery(sim, 'aborted');
    log(sim, 'warn', '手术终止：' + s.proc.name + ' @ ' + s.site.name + '（病灶未处理，可重新规划手术）');
    sim.emit.push({ kind: 'toast', type: 'warn', title: '手术终止', text: '可再次进入手术室，重新选择部位与术式' });
  }
  M.cancelSurgery = cancelSurgery;

  function updateSurgery(sim, dt) {
    var s = sim.surgery; if (!s || !s.active) return;
    var mul = sim.surgery.speedUp ? 2.2 : 1;
    sim.surgery.speedUp = false;
    s.phaseT += dt * mul;
    s.t += dt * mul;

    /* 手术应激 */
    var stim = 1 + (s.idx / Math.max(1, s.phases.length)) * 0.4;

    /* 每阶段基础出血 */
    sim.bleeding = Math.max(0, (sim.bleeding || 0) - 0.4 * dt);

    var ph = s.phases[s.idx];
    if (ph && s.phaseT >= ph.dur) {
      ph.done = true;
      s.phaseT = 0;
      s.idx++;
      if (s.idx >= s.phases.length) {
        s.active = false; s.done = true; s.status = 'done';
        sim.bleeding = 0;
        log(sim, 'good', '⚕ 手术完成：' + s.proc.name + ' @ ' + s.site.name + '，共历时 ' + fmtT(s.t) + '。');
        sim.emit.push({ kind: 'toast', type: 'good', title: '手术结束', text: s.proc.name + ' @ ' + s.site.name });
        checkTreat(sim, 'surgery', null, s.site.id, s.proc.id);
        carryComplication(sim, s);
        s.comp = null;
        intraopFindings(sim, s);
        pickPostop(sim);
        archiveSurgery(sim, 'done');
        return;
      }
      log(sim, 'act', '手术阶段完成 → ' + s.phases[s.idx].name);
    }

    /* 阶段进行中的应激反应 */
    sim.evtMod.pain = (sim.evtMod.pain || 0) + 0.6 * dt * stim;
    if (sim.v.sedation < 25 && chance(dt * 0.02)) sim.evtMod.hr = (sim.evtMod.hr || 0) + 6;

    /* 并发症 */
    if (!s.comp) {
      if (chance(dt * 0.045)) triggerComplication(sim);
    } else {
      s.compT += dt;
      var win = s.comp.window || 45;
      if (!s.compResolved && s.compT > win) {
        s.compResolved = 'timeout';
        sim.counters.compFail++;
        var f = s.comp.fail || {};
        for (var k in (f.vitals || {})) sim.evtMod[k] = (sim.evtMod[k] || 0) + f.vitals[k];
        if (f.hb) sim.drift.hb = (sim.drift.hb || 0) + f.hb;
        if (f.sbp) sim.drift.sbp = (sim.drift.sbp || 0) + f.sbp * 0.6;
        sim.bleeding = (sim.bleeding || 0) + 6;
        s.log.push({ t: sim.t, type: 'crit', text: '✗ 超时未处理 ' + s.comp.name + '，病情恶化' });
        log(sim, 'crit', '✗ 未能及时处理 ' + s.comp.name + '，出现严重后果！');
        sim.emit.push({ kind: 'toast', type: 'crit', title: '并发症失控', text: s.comp.name + ' 超时未处理' });
        if (f.risk && chance(f.risk * 0.6)) setRhythm(sim, 'vf', '术中并发症失控');
        carryComplication(sim, s);          /* 转成术后问题，别让玩家「找不到」 */
      }
      if (s.compResolved === 'ok' && s.compT > win * 0.6) { s.comp = null; }
      if (s.compResolved === 'bad' && s.compT > win * 1.2) { s.comp = null; }
      if (s.compResolved === 'timeout' && s.compT > win * 1.5) { s.comp = null; }
    }
  }

  /* ================= 15. 生命体征判定 & 死亡 ================= */
  var ARREST_WINDOW = 240;   /* 抢救窗口：无生命体征满 4 分钟后宣告死亡 */

  function updateVitalStatus(sim, v, dt) {
    var pulse = v.pulseOK;

    if (!pulse) {
      sim.arrest = true;
      sim.arrestT += dt;
      /* 容量性停搏（体液 > 12 L / 胃内容 >= 10 L）不是「电活动耗尽」，
         抢救窗口延长到 15 分钟，足够放血或洗胃把容量降下来。 */
      var overload = (v.volume >= FLUID_MAX) || ((sim.gut || 0) >= GUT_MAX);
      /* 只增不减：放血让容量回落时不会因为窗口突然缩回 240 s 而立刻判定死亡 */
      sim.arrestWindow = Math.max(sim.arrestWindow || 0, overload ? 900 : ARREST_WINDOW);
      if (sim.arrestT > (sim.arrestWindow || ARREST_WINDOW) && !sim.dead) {
        var cause = '心跳骤停，无生命体征持续 4 分钟，抢救无效';
        if (v.k >= 10) cause = '血清钾 ' + v.k.toFixed(1) + ' mmol/L（极端高钾血症）致心脏停搏，无生命体征持续 4 分钟，抢救无效';
        else if (sim.tox && sim.tox.level >= 5) cause = '药物中毒（' + (sim.tox.drug || '药物') + ' 血药浓度 ' +
          sim.tox.level.toFixed(0) + '× 毒性阈值）致心脏停搏，抢救无效';
        declareDeath(sim, cause);
      }
      if (!sim.__arrestLogged) {
        sim.__arrestLogged = true;
        var why = sim.rhythm === 'vf' ? '心室颤动'
          : sim.rhythm === 'pea' ? '无脉性电活动（PEA）'
            : sim.rhythm === 'asystole' ? '心脏停搏（直线）'
              : '无脉搏';
        log(sim, 'crit', '⚠⚠ ' + why + '，生命体征消失！开始 4 分钟抢救倒计时，立即 CPR / 除颤 / 肾上腺素。');
        sim.emit.push({ kind: 'arrest', text: why + '，开始 4 分钟倒计时' });
      }
    } else {
      if (sim.__arrestLogged) { log(sim, 'good', '✓ 自主循环恢复（ROSC），生命体征回来了一部分。'); sim.emit.push({ kind: 'rosc' }); }
      sim.arrest = false; sim.__arrestLogged = false; sim.arrestT = 0; sim.arrestWindow = ARREST_WINDOW;
    }
  }

  function declareDeath(sim, cause) {
    if (sim.dead) return;
    sim.dead = true;
    sim.deathAt = new Date();
    sim.deathCause = cause || '心跳骤停';
    sim.deathKind = M.deathKindOf(sim);
    sim.outcome = 'lose';
    var d = sim.disease;
    var isRight = d && d.controlled;
    var summary = {
      name: sim.patient.name, age: sim.patient.age, sex: sim.patient.sex,
      dx: d ? d.def.name : '未明确诊断',
      cause: sim.deathCause,
      time: fmtClock(sim.deathAt), date: fmtDate(sim.deathAt),
      elapsed: fmtT(sim.t),
      doctor: sim.doctor,
      attribution: sim.deathKind,
      attributionText: M.deathKindLabel(sim.deathKind, sim),
      special: sim.special || null,
      treatRate: treatProgress(sim)
    };
    sim.deathSummary = summary;
    log(sim, 'crit', '—— 宣告死亡 —— 死亡时间 ' + summary.time + '（' + summary.date + '），原因：' + summary.cause +
      '；归责：' + summary.attributionText);
    sim.emit.push({ kind: 'death', summary: summary });
  }
  M.declareDeath = declareDeath;

  function treatProgress(sim) {
    var d = sim.disease; if (!d) return { done: 0, total: 0 };
    var T = d.def.treat || [], done = 0, total = 0;
    var need = needIdx(d.def);
    if (!need.length) {
      /* 无必需项（支持治疗型病例）：进度 = 已完成的任意处置 */
      return { done: (d.support || 0), total: T.length, optional: true };
    }
    for (var i = 0; i < need.length; i++) {
      total++;
      if (sim.treatDone[need[i]]) done++;
    }
    return { done: done, total: total };
  }
  M.treatProgress = treatProgress;

  function cure(sim) {
    if (sim.dead) return;
    sim.dead = true;
    sim.outcome = 'win';
    sim.deathAt = new Date();
    var d = sim.disease;
    var chronic = !!(d && d.def.course === 'chronic');
    var summary = {
      name: sim.patient.name, age: sim.patient.age, sex: sim.patient.sex,
      dx: d ? d.def.name : '—',
      time: fmtClock(sim.deathAt), date: fmtDate(sim.deathAt),
      elapsed: fmtT(sim.t), doctor: sim.doctor,
      course: chronic ? 'chronic' : 'acute',
      stats: sim.counters, treatRate: treatProgress(sim)
    };
    sim.cureSummary = summary;
    log(sim, 'good', chronic
      ? '★ 急性加重已控制，转归为「临床缓解」——慢性基础病无法根治，需长期随访与维持治疗。'
      : '★ 病人生命体征稳定，转归良好，可以转科/出院。');
    sim.emit.push({ kind: 'cure', summary: summary });
  }
  M.cure = cure;

  /* ================= 术后并发症 & 术中暴露的问题 ================= */
  var POSTOP = [
    {
      id: 'postop_bleed', n: '术后出血', sev: 4,
      msg: '切口与引流管持续引出新鲜血性液体，血压进行性下降',
      hint: '查血常规 / 凝血，加快补液、输红细胞与血浆，必要时再次探查止血',
      delay: [30, 150], mods: { hb: -1.6, sbp: -14, hr: 14 },
      acts: ['transfuse', 'drug:pcc', 'surgery']
    },
    {
      id: 'postop_leak', n: '吻合口漏', sev: 4,
      msg: '引流液变浑浊、呈胆汁样，腹痛加剧伴发热',
      hint: '禁食、充分引流、广谱抗生素，必要时再次手术修补或造口',
      delay: [240, 900], mods: { sbp: -16, hr: 18, pain: 25, temp: 0.9 },
      acts: ['drug:piperacillin_tazobactam', 'surgery']
    },
    {
      id: 'postop_ssi', n: '切口感染', sev: 3,
      msg: '切口红肿、渗出增多，体温上升',
      hint: '敞开引流、取分泌物培养、按经验使用抗生素',
      delay: [600, 1800], mods: { temp: 0.8, wbc: 3 },
      acts: ['drug:cefuroxime', 'drug:vancomycin']
    },
    {
      id: 'postop_lung', n: '肺不张 / 肺部感染', sev: 3,
      msg: '术后低氧、呼吸浅快，双肺底可闻及湿啰音',
      hint: '翻身拍背、激励肺量计、雾化排痰，必要时支气管镜吸痰与无创通气',
      delay: [180, 900], mods: { spo2: -6, rr: 6, temp: 0.5 },
      acts: ['airway', 'drug:ambroxol']
    },
    {
      id: 'postop_ileus', n: '术后肠麻痹', sev: 2,
      msg: '腹胀明显、肠鸣音消失，伴恶心呕吐',
      hint: '禁食、胃肠减压、补液与电解质，警惕腹腔感染',
      delay: [180, 720], mods: { gi: -25, emesis: 25 },
      acts: ['nurse', 'drug:metoclopramide']
    },
    {
      id: 'postop_aki', n: '术后急性肾损伤', sev: 3,
      msg: '尿量减少、肌酐上升，血钾开始升高',
      hint: '补足容量、停肾毒性药物、监测血钾与尿量，必要时透析',
      delay: [240, 1080], mods: { renal: -20, urine: -25, k: 0.5 },
      acts: ['drug:saline', 'drug:furosemide']
    },
    {
      id: 'postop_af', n: '术后心房颤动', sev: 3,
      msg: '心率快而不齐，血压波动',
      hint: '纠正低钾低镁、控制心室率（地尔硫䓬 / 艾司洛尔），评估抗凝',
      delay: [60, 600], mods: { hr: 25, arrhythmia: 35 },
      acts: ['drug:diltiazem', 'drug:esmolol']
    },
    {
      id: 'postop_delirium', n: '术后谵妄', sev: 2,
      msg: '躁动、定向力障碍、夜间加重',
      hint: '去除诱因（疼痛、缺氧、尿潴留、电解质），镇痛，必要时小剂量氟哌啶醇',
      delay: [120, 600], mods: { gcs: -3, brain: -8 },
      acts: ['drug:haloperidol', 'drug:fentanyl']
    },
    {
      id: 'postop_dvt', n: '下肢深静脉血栓', sev: 3,
      msg: '小腿肿胀、压痛，Homans 征阳性',
      hint: '下肢静脉超声，启动抗凝（低分子肝素），警惕肺栓塞',
      delay: [900, 2400], mods: { pain: 12 },
      acts: ['drug:enoxaparin', 'exam']
    },
    {
      id: 'postop_mh', n: '恶性高热', sev: 5,
      msg: '体温骤升、肌强直、呼气末 CO₂ 明显升高、心动过速',
      hint: '立即停用挥发性麻醉药与琥珀胆碱，丹曲林 2.5 mg/kg，积极物理降温、纠酸、降钾',
      delay: [30, 240], mods: { temp: 2.4, hr: 40, paco2: 15 },
      acts: ['airway', 'drug:sodium_bicarbonate']
    }
  ];
  M.POSTOP = POSTOP;

  var FINDINGS = [
    { id: 'adhesion', n: '术中发现广泛粘连', msg: '腹腔内广泛致密粘连，分离耗时较长，术野渗血增多', mods: { pain: 8, hb: -0.5 } },
    { id: 'pus', n: '术区脓性渗出', msg: '术野可见脓性渗出液约 200 mL，污染较重', mods: { temp: 0.6, wbc: 2.5 } },
    { id: 'tumor', n: '可疑肿瘤浸润', msg: '病灶与周围组织分界不清，疑似肿瘤浸润，已取活检送病理', mods: {} },
    { id: 'cirrhosis', n: '肝脏结节样改变', msg: '肝脏表面呈结节样，质地偏硬，提示肝硬化基础', mods: { hepatic: -10, inr: 0.3 } },
    { id: 'ischemia', n: '肠管血运欠佳', msg: '部分肠管色泽暗红、蠕动差，热敷后略改善', mods: { gi: -15, lactate: 1.0 } },
    { id: 'old_bleed', n: '陈旧性积血', msg: '盆腔可见陈旧性积血约 300 mL，已清除', mods: {} }
  ];

  function pickPostop(sim) {
    var n = 1;
    if (chance(0.45)) n++;
    if (chance(0.15)) n++;
    var pool = POSTOP.slice(), out = [];
    for (var i = 0; i < n && pool.length; i++) {
      var idx = irnd(0, pool.length - 1);
      var p = pool.splice(idx, 1)[0];
      out.push(p);
    }
    sim.postop = sim.postop || [];
    out.forEach(function (p) {
      var d = p.delay || [120, 900];
      /* 需要再次手术的并发症记住这次的部位，问题清单/手术室才能直接落到原切口 */
      if ((p.acts || []).indexOf('surgery') >= 0) p.site = (sim.surgery && sim.surgery.site && sim.surgery.site.id) || sim.lastSurgSite || null;
      sim.postop.push({ t: sim.t + rnd(d[0], d[1]), def: p, fired: false });
    });
    if (out.length) {
      log(sim, 'warn', '术后随访：预计可能出现 ' + out.length + ' 项术后问题（' + out.map(function (x) { return x.n; }).join('、') + '），注意观察。');
    }
  }

  function runPostop(sim, dt) {
    if (!sim.postop || !sim.postop.length) return;
    sim.postopActive = sim.postopActive || {};
    for (var i = 0; i < sim.postop.length; i++) {
      var p = sim.postop[i];
      if (p.fired || sim.t < p.t) continue;
      p.fired = true;
      sim.postopActive[p.def.id] = p.def;
      sim.postopMod = sim.postopMod || {};
      for (var k in (p.def.mods || {})) {
        sim.postopMod[k] = (sim.postopMod[k] || 0) + p.def.mods[k];
      }
      sim.counters.postop = (sim.counters.postop || 0) + 1;
      log(sim, 'crit', '【术后并发症】' + p.def.n + '：' + p.def.msg);
      sim.emit.push({ kind: 'toast', type: 'crit', title: '术后 · ' + p.def.n, text: p.def.msg });
      M.mark(sim, 'postop', p.def.n);
    }
  }

  /* ================= 术后并发症的「解决方法」 =================
     以前术后问题只在日志里报一句，玩家回到手术室也找不到该干什么：
     - 每项并发症都带 hint（处理要点）与 acts（推荐处置）；
     - 真正做对其中任何一项（给药 / 输血 / 再次手术 / 气道 / 护理）就自动销账，
       同时撤掉这项并发症带来的持续负担，不会「处理了也不消失」。 */
  function postopSolveList(p) {
    var acts = (p.acts || []).filter(function (a) { return a !== 'exam'; });
    return (p.solve && p.solve.length) ? p.solve : acts;
  }
  M.postopSolveList = postopSolveList;

  function resolvePostop(sim, pid, why) {
    var p = sim.postopActive && sim.postopActive[pid];
    if (!p) return false;
    delete sim.postopActive[pid];
    for (var k in (p.mods || {})) {
      if (!sim.postopMod || sim.postopMod[k] === undefined) continue;
      sim.postopMod[k] -= p.mods[k];
      if (Math.abs(sim.postopMod[k]) < 1e-6) delete sim.postopMod[k];
    }
    sim.counters.postopFixed = (sim.counters.postopFixed || 0) + 1;
    log(sim, 'good', '✓ 术后并发症已处理：' + p.n + '（' + (why || '按方案处置') + '）');
    sim.emit.push({ kind: 'toast', type: 'good', title: '术后问题已解决', text: p.n });
    return true;
  }
  M.resolvePostop = resolvePostop;

  function postopNote(sim, kind, key, siteId) {
    if (!sim || !sim.postopActive) return;
    var hit = [];
    for (var pid in sim.postopActive) {
      var p = sim.postopActive[pid];
      var list = postopSolveList(p);
      for (var i = 0; i < list.length; i++) {
        var a = list[i];
        if (kind === 'drug') {
          if (a === 'drug:' + key) {
            var DD = M.getDrug(key);
            hit.push([pid, '给予 ' + (DD ? DD.name : key)]);
            break;
          }
          continue;
        }
        if (a !== kind) continue;
        if (kind === 'surgery' && p.site && siteId && p.site !== siteId) continue;
        hit.push([pid, kind === 'transfuse' ? '输血' : kind === 'surgery' ? '再次手术' :
          kind === 'airway' ? '气道支持' : '护理处置']);
        break;
      }
    }
    hit.forEach(function (x) { resolvePostop(sim, x[0], x[1]); });
  }
  M.postopNote = postopNote;

  /* 「再次手术」该选哪个部位/术式：给问题清单和手术室一个明确落点 */
  function procForSite(siteId, prefer) {
    var st = findSite(siteId);
    if (!st) return null;
    var have = st.procs || [];
    for (var i = 0; i < prefer.length; i++) if (have.indexOf(prefer[i]) >= 0) return prefer[i];
    return have[0] || null;
  }
  function postopSurgeryPlan(sim, p) {
    var siteId = (p && p.site) || sim.lastSurgSite || null;
    if (!siteId) return null;
    var bleeding = /bleed|rupture/i.test((p && p.id) || '');
    var proc = procForSite(siteId, bleeding
      ? ['ligation', 'exploration', 'suture', 'drainage']
      : ['suture', 'drainage', 'exploration', 'resection', 'ostomy']);
    return proc ? { site: siteId, proc: proc } : null;
  }
  M.postopSurgeryPlan = postopSurgeryPlan;

  /* 术中并发症转术后时，按它影响的系统给出可点的处置入口 */
  function compActs(c) {
    var acts = ['surgery'], vt = c.vitals || {}, id = c.id || '';
    if (vt.hb || vt.volume || vt.sbp || vt.dbp || vt.map || vt.lactate ||
      /bleed|shock|rupture|dic|transfusion|vessel/.test(id)) acts.push('transfuse');
    if (vt.spo2 || vt.pao2 || vt.airway || vt.paco2 || vt.rr ||
      /airway|hypox|pneumo|bronch|laryng|embol/.test(id)) acts.push('airway');
    if (vt.temp && vt.temp < 0) acts.push('nurse');
    return acts;
  }

  /* 术中并发症没处理完手术就结束了：不能悄悄消失，转成术后问题并给出处理方法 */
  function carryComplication(sim, s) {
    var c = s && s.comp;
    if (!c || s.compResolved === 'ok') return;
    var untouched = !s.compResolved;
    if (untouched) {
      var f = c.fail || {};
      for (var k in (f.vitals || {})) sim.evtMod[k] = (sim.evtMod[k] || 0) + f.vitals[k];
      if (f.hb) sim.drift.hb = (sim.drift.hb || 0) + f.hb;
      if (f.sbp) sim.drift.sbp = (sim.drift.sbp || 0) + f.sbp * 0.5;
      sim.bleeding = (sim.bleeding || 0) + 6;
      if (f.risk && chance(f.risk * 0.4)) setRhythm(sim, 'vf', '术中并发症未控制');
    }
    var def = {
      id: 'unresolved_' + c.id, n: c.name + '（术中未控制）', sev: c.sev || 4,
      msg: c.msg,
      hint: (untouched ? '术中未能及时处理：' : '术中处理失败/超时：') +
        (c.fix || []).slice(0, 3).join('；') + '；必要时回手术室再次探查',
      acts: compActs(c),
      site: (s.site && s.site.id) || null,
      mods: {}
    };
    sim.postopActive = sim.postopActive || {};
    if (sim.postopActive[def.id]) return;      /* 已经转过一次，不重复记 */
    sim.postopActive[def.id] = def;
    sim.counters.postop = (sim.counters.postop || 0) + 1;
    log(sim, 'crit', '⚠ 手术结束时「' + c.name + '」仍未控制，转入术后处理：' + def.hint);
    sim.emit.push({ kind: 'toast', type: 'crit', title: '并发症转入术后', text: c.name + ' 仍未控制' });
  }

  function intraopFindings(sim, s) {
    if (!chance(0.55)) return;
    var f = pick(FINDINGS);
    sim.postopMod = sim.postopMod || {};
    for (var k in (f.mods || {})) sim.postopMod[k] = (sim.postopMod[k] || 0) + f.mods[k];
    sim.findings = sim.findings || [];
    sim.findings.push({ t: sim.t, n: f.n, msg: f.msg });
    log(sim, 'warn', '【术中所见】' + f.n + '：' + f.msg);
    sim.emit.push({ kind: 'toast', type: 'warn', title: '术中所见 · ' + f.n, text: f.msg });
  }

  /* ================= 16. 检查 ================= */
  var EXAM_PARTS = [
    { id: 'general', n: '全身查体', find: function (sim) { return generalExam(sim); } },
    { id: 'chest', n: '胸部查体', find: function (sim) { return chestExam(sim); } },
    { id: 'heart', n: '心脏听诊', find: function (sim) { return heartExam(sim); } },
    { id: 'abdomen', n: '腹部查体', find: function (sim) { return abdomenExam(sim); } },
    { id: 'neuro', n: '神经系统查体', find: function (sim) { return neuroExam(sim); } },
    { id: 'skin', n: '皮肤与末梢', find: function (sim) { return skinExam(sim); } }
  ];
  M.EXAM_PARTS = EXAM_PARTS;

  function generalExam(sim) {
    var v = sim.v, out = [];
    out.push('神志：' + (v.gcs >= 14 ? '清楚' : v.gcs >= 9 ? '嗜睡/模糊' : v.gcs >= 6 ? '昏睡' : '深昏迷') + '（GCS ' + Math.round(v.gcs) + '）');
    out.push('体位与面容：' + (v.pain > 50 ? '痛苦面容、被动体位' : '尚平静'));
    out.push('末梢：' + (v.spo2 < 90 ? '口唇发绀' : '口唇红润') + '，' + (v.temp > 38.3 ? '皮肤灼热' : v.temp < 35.5 ? '皮肤湿冷' : '皮温正常'));
    if (v.sbp < 90) out.push('休克貌：面色苍白、四肢湿冷、脉搏细速');
    return out;
  }
  function chestExam(sim) {
    var v = sim.v, out = [];
    out.push('呼吸：' + (v.rr > 24 ? '急促' : v.rr < 10 ? '浅慢' : '平稳') + '，' + Math.round(v.rr) + ' 次/分');
    if (v.bronchospasm > 25) out.push('双肺可闻及广泛哮鸣音，呼气相延长');
    if (v.secretions > 40) out.push('双肺可闻及大量湿性啰音');
    out.push('胸廓：' + (v.airway < 70 ? '呼吸动度减弱，可能存在气道梗阻' : '双侧呼吸动度对称'));
    return out;
  }
  function heartExam(sim) {
    var v = sim.v, out = [];
    out.push('心率 ' + Math.round(v.hr) + ' 次/分，心律' + (RHY_NAME[sim.rhythm] || ''));
    if (v.sbp < 90) out.push('心音低钝、遥远');
    if (v.contractility < 55) out.push('可闻及第三心音奔马律，提示心功能不全');
    if (sim.rhythm === 'afib') out.push('心律绝对不齐，第一心音强弱不等，脉搏短绌');
    return out;
  }
  function abdomenExam(sim) {
    var v = sim.v, out = [];
    out.push('腹：' + (v.pain > 40 ? '压痛明显' : '柔软'));
    if (v.pain > 60) out.push('反跳痛、肌紧张，提示腹膜刺激征');
    out.push('肠鸣音：' + (v.gi < 45 ? '减弱/消失' : '正常'));
    if (sim.surgery && sim.surgery.site.region && sim.surgery.site.region.indexOf('腹') >= 0) out.push('可见手术切口及敷料');
    return out;
  }
  function neuroExam(sim) {
    var v = sim.v, out = [];
    out.push('瞳孔：左 ' + v.pupil.toFixed(1) + ' mm / 右 ' + (v.icp > 22 ? (v.pupil + 0.8).toFixed(1) : v.pupil.toFixed(1)) + ' mm，对光反射' + (v.icp > 25 ? '迟钝' : '灵敏'));
    out.push('GCS：' + Math.round(v.gcs) + ' 分，脑电活动 ' + Math.round(v.brain) + '%');
    if (v.icp > 20) out.push('颈抵抗阳性，提示颅内压升高');
    if (v.seizure > 20) out.push('可见肢体抽搐，考虑癫痫发作');
    return out;
  }
  function skinExam(sim) {
    var v = sim.v, out = [];
    out.push('皮肤黏膜：' + (v.hb < 9 ? '苍白' : '色泽正常'));
    if (v.inr > 2 || v.plt < 80) out.push('可见皮下瘀斑、穿刺点渗血');
    if (v.anaphylaxis > 15) out.push('全身大片荨麻疹');
    return out;
  }

  function examine(sim, partId) {
    var part = null;
    for (var i = 0; i < EXAM_PARTS.length; i++) if (EXAM_PARTS[i].id === partId) part = EXAM_PARTS[i];
    if (!part) return null;
    var lines = part.find(sim);
    var rec = { t: sim.t, part: part.n, lines: lines };
    sim.examFindings.push(rec);
    log(sim, 'info', '【' + part.n + '】' + lines.join('；'));
    return rec;
  }
  M.examine = examine;

  /* ---------- 化验 ---------- */
  function pushLab(sim, k, v) {
    sim.labVer = (sim.labVer || 0) + 1;
    for (var i = sim.labs.length - 1; i >= 0; i--) {
      if (sim.labs[i].k === k) { sim.labs[i].v = v; sim.labs[i].t = sim.t; return; }
    }
    sim.labs.push({ t: sim.t, k: k, v: v });
  }
  function runLabs(sim) {
    var v = sim.v;
    var creat = Math.round(90 + (100 - v.renal) * 8 + (v.lactate - 1) * 12);
    /* 降钙素原（PCT）：细菌感染 / 脓毒症的标志物，随体温、白细胞、免疫状态变化 */
    var pct = +(0.05 + (v.temp > 37.8 ? (v.temp - 37.8) * 1.6 : 0) +
      Math.max(0, v.wbc - 10) * 0.12 + (100 - v.immune) * 0.012 +
      (v.lactate > 2 ? (v.lactate - 2) * 0.18 : 0)).toFixed(2);
    var rows = [
      ['ph', +v.ph.toFixed(2)], ['lactate', +v.lactate.toFixed(1)],
      ['k', +v.k.toFixed(1)], ['na', Math.round(v.na)], ['ca', +v.ca.toFixed(2)],
      ['glucose', +v.glucose.toFixed(1)], ['hb', +v.hb.toFixed(1)],
      ['plt', Math.round(v.plt)], ['inr', +v.inr.toFixed(2)], ['wbc', +v.wbc.toFixed(1)],
      ['pct', pct], ['creatinine', creat], ['hco3', Math.round(24 - (7.4 - v.ph) * 40)]
    ];
    var html = rows.map(function (r) {
      pushLab(sim, r[0], r[1]);
      return r[0] + ' : ' + r[1];
    }).join('<br>');
    var extra = '';
    if (v.glucose > 11) { pushLab(sim, 'ketone', +(v.glucose * 0.12).toFixed(1)); extra += '<br>血酮 : ' + (v.glucose * 0.12).toFixed(1); }
    if (v.lactate > 2) extra += '<br><span style="color:#ffb02e">乳酸升高提示组织低灌注/无氧代谢</span>';
    if (v.k > 5.3) extra += '<br><span style="color:#ff3d5a">高钾血症，警惕恶性心律失常</span>';
    if (v.k < 3.5) extra += '<br><span style="color:#38a9ff">低钾血症，需补钾并监测心律</span>';
    if (v.ph < 7.35) extra += '<br><span style="color:#ffb02e">代谢性酸中毒</span>';
    if (pct > 0.5) extra += '<br><span style="color:' + (pct > 2 ? '#ff3d5a' : '#ffb02e') + '">降钙素原 ' + pct + ' ng/mL，' + (pct > 2 ? '高度提示细菌感染/脓毒症' : '轻度升高，需结合临床') + '</span>';
    log(sim, 'info', '急查化验回报：pH ' + v.ph.toFixed(2) + '，乳酸 ' + v.lactate.toFixed(1) + '，K⁺ ' + v.k.toFixed(1) + '，Hb ' + v.hb.toFixed(1) + '，PCT ' + pct + '。');
    return html + extra;
  }
  M.runLabs = runLabs;

  /* ---------- 影像 ---------- */
  function specialExam(sim, kind) {
    var v = sim.v, d = sim.disease;
    var site = d ? (d.def.site || '') : '';
    var out = [];
    if (kind === 'us') {
      if (/胆囊|胆道/.test(site)) out.push('胆囊增大，壁增厚 > 4mm，可见结石强回声伴声影，胆囊周围少量渗出');
      if (/阑尾/.test(site)) out.push('右下腹可见管状结构，直径 9mm，壁增厚，周围脂肪回声增强，压之不变形');
      if (/肾|输尿管/.test(site)) out.push('右肾集合系统分离 12mm，输尿管上段扩张，可见强回声结石影');
      if (/子宫|卵巢|妊娠/.test(site)) out.push('子宫旁混合回声包块，盆腔积液，考虑异位妊娠可能');
      if (/胰/.test(site)) out.push('胰腺弥漫性肿大，回声减低，胰周积液');
      if (/心脏|冠脉/.test(site)) out.push('左室前壁节段性运动减弱，EF 约 42%，未见明显心包积液');
      if (/主动脉|大血管/.test(site)) out.push('升主动脉增宽，可见内膜片漂浮，考虑主动脉夹层');
      if (!out.length) out.push('腹腔各脏器未见明显异常，未见积液');
      if (v.volume > 5600) out.push('下腔静脉充盈，内径增宽（容量过负荷）');
      if (v.volume < 4200) out.push('下腔静脉塌陷，内径 < 1cm（容量不足）');
    } else {
      if (v.spo2 < 92) out.push('双肺透亮度减低，可见片状渗出影');
      if (/肺|胸|呼吸/.test(site)) out.push('患侧肺野可见大片实变/致密影，肋膈角变钝');
      if (v.airway < 80) out.push('气管居中，未见明显狭窄');
      if (v.contractility < 60) out.push('心影增大，肺门影模糊，提示肺淤血');
      if (!out.length) out.push('双肺纹理清晰，心影大小正常，肋膈角锐利');
    }
    log(sim, 'info', '【' + (kind === 'us' ? '床旁超声' : '床旁胸片') + '】' + out.join('；'));
    sim.examFindings.push({ t: sim.t, k: kind, v: out.join('；') });
    return out.map(function (x) { return '· ' + x; }).join('<br>');
  }
  M.specialExam = specialExam;

  /* ---------- 护理处置 ---------- */
  /* ================= 外伤处置（护理栏） =================
     现场与床旁就能做、见效直接，但每次都要消耗耗材：
     诊室版扣库存并拦截，急诊室版（无限药品）只做概念展示。 */
  var NURSE_TRAUMA = [
    { id: 'debridement', n: '清创缝合', d: '冲洗 + 去除异物与坏死组织 + 缝合', supply: { cs_suture: 1, cs_gloves: 1 },
      note: '污染伤口、撕裂伤的基础处理；深部伤口要先探查' },
    { id: 'dressing', n: '伤口包扎换药', d: '消毒 + 无菌敷料 + 加压包扎', supply: { cs_gloves: 1, cs_irrigation: 1 },
      note: '止血、保护创面、减少污染；渗湿后要及时更换' },
    { id: 'splint', n: '夹板 / 石膏固定', d: '骨折临时固定与制动', supply: { cs_splint: 1 },
      note: '固定后要检查末梢血运与感觉' },
    { id: 'tourniquet', n: '止血带 / 加压止血', d: '四肢活动性出血的现场止血', supply: { cs_hemostat: 1 },
      note: '记录上止血带时间，每 1 小时放松一次' },
    { id: 'burn_care', n: '烧伤清创包扎', d: '清创、保留水疱皮、无菌包扎', supply: { cs_burn: 1, cs_gloves: 1 },
      note: '大面积烧伤先补液，再处理创面' },
    { id: 'ice_lavage', n: '冰盐水灌洗降温', d: '胃 / 腹腔冰盐水灌洗', supply: { cs_irrigation: 1 },
      note: '热射病的强化降温手段，注意寒战与电解质' }
  ];
  M.NURSE_TRAUMA = NURSE_TRAUMA;
  M.findNurseTrauma = function (id) {
    for (var i = 0; i < NURSE_TRAUMA.length; i++) if (NURSE_TRAUMA[i].id === id) return NURSE_TRAUMA[i];
    return null;
  };
  function useSupply(sim, need) {
    if (!need) return true;
    if (M.Clinic && M.Clinic.takeConsumable) return M.Clinic.takeConsumable(need);
    return true;   /* 急诊室版：无限库存，只展示概念 */
  }
  M.useSupply = useSupply;
  function traumaEffect(sim, t) {
    switch (t.id) {
      case 'debridement':
        sim.evtMod.pain = (sim.evtMod.pain || 0) - 10;
        sim.bleeding = Math.max(0, (sim.bleeding || 0) - 4);
        sim.evtMod.wbc = (sim.evtMod.wbc || 0) - 0.6;
        return '伤口冲洗后清除异物与坏死组织并分层缝合，疼痛与感染风险下降。';
      case 'dressing':
        sim.bleeding = Math.max(0, (sim.bleeding || 0) - 6);
        sim.evtMod.pain = (sim.evtMod.pain || 0) - 5;
        return '伤口已消毒并加压包扎，渗血明显减少。';
      case 'splint':
        sim.evtMod.pain = (sim.evtMod.pain || 0) - 12;
        sim.drift.hb = (sim.drift.hb || 0) + 0.2;
        return '骨折已固定，疼痛减轻，骨折端异常活动与继续出血减少。';
      case 'tourniquet':
        sim.bleeding = Math.max(0, (sim.bleeding || 0) - 10);
        sim.evtMod.pain = (sim.evtMod.pain || 0) - 4;
        return '活动性出血已用止血带/加压控制（记录时间，定时放松）。';
      case 'burn_care':
        sim.evtMod.pain = (sim.evtMod.pain || 0) - 10;
        sim.bleeding = Math.max(0, (sim.bleeding || 0) - 2);
        sim.evtMod.temp = (sim.evtMod.temp || 0) - 0.2;
        return '烧伤创面已清创包扎，渗出与疼痛减少。';
      case 'ice_lavage':
        sim.drift.temp = (sim.drift.temp || 0) - 1.2;
        sim.evtMod.seizure = (sim.evtMod.seizure || 0) - 5;
        return '冰盐水灌洗完成，核心体温进一步下降。';
    }
    return '';
  }

  function nurse(sim, id) {
    var v = sim.v;
    var tr = M.findNurseTrauma(id);
    if (tr) {
      if (!useSupply(sim, tr.supply)) {
        log(sim, 'warn', '【护理】' + tr.n + ' 未能完成：耗材不足。');
        return '<span style="color:#ffb02e">耗材不足，无法完成「' + tr.n + '」——请到药房 / 耗材库补货。</span>';
      }
      checkTreat(sim, 'nurse', id);
      var txt = traumaEffect(sim, tr);
      log(sim, 'act', '【护理】' + tr.n + '：' + txt);
      sim.emit.push({ kind: 'toast', type: 'good', title: tr.n, text: txt });
      return '<b>' + tr.n + '</b><br>' + txt;
    }
    checkTreat(sim, 'nurse', id);
    postopNote(sim, 'nurse', id);
    switch (id) {
      case 'foley':
        sim.drift.urine = (sim.drift.urine || 0) + 8;
        log(sim, 'act', '留置导尿，可精确监测每小时尿量。');
        return '已留置导尿。当前尿量约 <b>' + Math.round(v.urine) + ' mL/h</b>（正常 > 30）。' + (v.urine < 20 ? '<br><span style="color:#ff3d5a">少尿，提示肾灌注不足，警惕急性肾损伤</span>' : '');
      case 'ng':
        sim.drift.emesis = (sim.drift.emesis || 0) - 40;
        log(sim, 'act', '留置胃管，行胃肠减压。');
        return '已留置胃管并减压，呕吐/腹胀可缓解。误服药物者可经胃管洗胃。';
      case 'warm':
        sim.drift.temp = (sim.drift.temp || 0) + 1.6;
        log(sim, 'act', '保温复温措施已实施。');
        return '已给予保温毯 + 加温输液。核心体温将逐步回升（当前 <b>' + v.temp.toFixed(1) + '℃</b>）。';
      case 'cool':
        sim.drift.temp = (sim.drift.temp || 0) - 1.4;
        sim.drift.brain = (sim.drift.brain || 0) + 6;
        log(sim, 'act', '冰毯降温，目标体温 32-36℃。');
        return '已启动冰毯降温，可降低脑代谢率、保护神经功能。注意监测寒战与心律。';
      case 'position':
        sim.evtMod.sbp = (sim.evtMod.sbp || 0) + 12;
        log(sim, 'act', '采取休克体位，抬高下肢 30°。');
        return '已抬高下肢，回心血量增加，血压可一过性上升约 10 mmHg。';
      case 'sample':
        log(sim, 'act', '留取双侧双套血培养。');
        return '血培养已送检（48 小时后回报）。抗生素应在留取培养后 1 小时内给予。';
      case 'restrain':
        log(sim, 'act', '评估约束与镇静需求。');
        return '已完成约束评估。当前镇静深度 <b>' + Math.round(v.sedation) + '%</b>，疼痛评分 <b>' + Math.round(v.pain) + '</b>。';
      default:
        return '已记录。';
    }
  }
  M.nurse = nurse;

  /* ================= 17. 主循环 ================= */
  /* 生命体征趋势：每 2 秒记一个点，最多 30 分钟 */
  function pushTrend(sim) {
    var v = sim.v;
    sim.trend.push({
      t: +sim.t.toFixed(1),
      hr: Math.round(v.hr), sbp: Math.round(v.sbp), dbp: Math.round(v.dbp),
      map: Math.round(v.map), spo2: Math.round(v.spo2), rr: Math.round(v.rr),
      temp: +v.temp.toFixed(1), k: +v.k.toFixed(1), lac: +v.lactate.toFixed(1),
      gcs: Math.round(v.gcs), pulse: v.pulseOK ? 1 : 0
    });
    if (sim.trend.length > 900) sim.trend.splice(0, sim.trend.length - 900);
  }
  M.pushTrend = pushTrend;

  M.mark = function (sim, kind, label) {
    sim.marks.push({ t: +sim.t.toFixed(1), kind: kind, label: label || '' });
    if (sim.marks.length > 400) sim.marks.splice(0, sim.marks.length - 400);
  };

  function tick(sim, dt) {
    if (sim.dead) return;
    dt = Math.min(dt, 2.0);
    sim.t += dt;
    sim.vPrev = sim.v;
    updateDrugs(sim, dt);
    updateFluids(sim, dt);
    updateDisease(sim, dt);
    if (M.updateExams) M.updateExams(sim, dt);
    decayEvents(sim, dt);
    var v = computeVal(sim);
    sim.v = v;
    applyCoupling(sim, v, dt);
    updateRhythm(sim, v, dt);
    updateSurgery(sim, dt);
    runPostop(sim, dt);
    v = computeVal(sim);
    sim.v = v;
    updateVitalStatus(sim, v, dt);
    checkCure(sim, v, dt);
    if (sim.t - (sim.trendT || 0) >= 2) { sim.trendT = sim.t; pushTrend(sim); }
  }
  M.tick = tick;

  /* 病因解除后，须「连续」维持稳定 45 秒才算抢救成功 */
  var STABLE_NEED = 45;   /* 急性病：连续稳定 45 秒 */
  var STABLE_NEED_CHRONIC = 75;  /* 慢性病：需要更久的稳定，且只能「缓解」 */

  function stableNeed(sim) {
    var def = sim && sim.disease && sim.disease.def;
    /* 病例可自定义稳定维持时间：热射病这类「看着好了、其实还在损伤」的需要更久 */
    if (def && def.stableSec) return def.stableSec;
    return (def && def.course === 'chronic') ? STABLE_NEED_CHRONIC : STABLE_NEED;
  }
  M.stableNeed = stableNeed;
  var STABLE_GRACE = 2.5; /* 允许短暂波动而不清零（秒） */

  /* 生命体征是否达到「可转归」标准 */
  function isStable(v) {
    if (!v || !v.pulseOK) return false;
    if (v.volume >= 12000) return false;          /* 容量过负荷不可能「转归」 */
    if ((v.gut || 0) >= 4000) return false;       /* 胃内潴留需先清除 */
    if (v.map < 65) return false;          /* 平均动脉压必须 > 65 */
    if (v.spo2 < 90) return false;
    if (v.lactate >= 2.8) return false;    /* 乳酸必须基本清掉 */
    if (v.temp > 39.0 || v.temp < 34.8) return false;
    if (v.k > 5.8 || v.k < 3.1) return false;
    if (v.hb < 7) return false;            /* 贫血必须先纠正 */
    if (v.brain < 45) return false;        /* 脑电活动必须恢复（镇静状态不算脑功能衰竭） */
    return true;
  }
  M.isStable = isStable;

  /* ================= 当前问题与快速处置建议 ================= */
  /* 每个「新问题」都必须给得出下一步：怎么处理、按哪个键、开什么药。
     返回按严重度排序的列表，UI 直接渲染成一键处置。 */
  function problems(sim) {
    var v = sim.v || {}, out = [];
    function add(id, name, hint, acts, sev, tag) {
      out.push({ id: id, name: name, hint: hint, acts: acts || [], sev: sev || 2, tag: tag || '' });
    }
    /* --- 容量性停搏（体液 > 12 L / 胃内容 >= 10 L）--- */
    if ((v.volume || 0) >= 12000) {
      add('volover', '容量性心脏停搏 · 体液 ' + (v.volume / 1000).toFixed(1) + ' L',
        '体液总量超过 12 L 导致心脏停搏，容量降下来之前 CPR / 除颤 / 肾上腺素都无法恢复自主循环：立即放血（最高 2000 mL/min，目标 5–6 L），再持续 CPR',
        [{ a: 'bleed', n: '放血' }, { a: 'cpr', n: '胸外按压' }, { a: 'drug', id: 'epinephrine', n: '肾上腺素 1mg' }], 5, '致命');
    } else if ((v.volume || 0) >= 9000) {
      add('volhigh', '体液过负荷 · ' + (v.volume / 1000).toFixed(1) + ' L',
        '距离 12 L 上限只差 ' + ((12000 - v.volume) / 1000).toFixed(1) + ' L：停止补液、放血，监测肺水肿与血红蛋白稀释',
        [{ a: 'bleed', n: '放血' }], 4);
    }
    if ((v.gut || 0) >= 10000) {
      add('gutover', '胃扩张 · 迷走性停搏 · ' + ((v.gut || 0) / 1000).toFixed(1) + ' L',
        '胃内容超过 10 L 导致迷走反射性心脏停搏，必须手术清除：手术 → 胃 → 洗胃 / 胃内容物清除；清除后再 CPR 才能恢复',
        [{ a: 'surgery', n: '洗胃 / 胃内容物清除' }, { a: 'cpr', n: '胸外按压' }], 5, '致命');
    } else if ((v.gut || 0) >= 4000) {
      add('guthigh', '胃内容物潴留 · ' + ((v.gut || 0) / 1000).toFixed(1) + ' L',
        '接近 10 L 上限：尽早洗胃，注意呕吐误吸；口服药物越多吸收越快',
        [{ a: 'surgery', n: '洗胃' }], 3);
    }
    var A_CPR = { a: 'cpr', n: '胸外按压' };
    var A_SHOCK = { a: 'shock', n: '电击除颤' };
    var A_EPI = { a: 'drug', id: 'epinephrine', n: '肾上腺素 1mg' };
    var A_AIR = { a: 'airway', n: '气道 / 氧疗' };

    /* --- 循环 --- */
    if (sim.rhythm === 'vf') {
      add('vf', '心室颤动', '立即非同步除颤 120–200 J（每 2 分钟可重复），按压不要中断，肾上腺素 1mg / 3–5 min',
        [A_SHOCK, A_CPR, A_EPI], 5, '致命');
    } else if (sim.rhythm === 'torsades') {
      add('torsades', '尖端扭转型室速', '立即非同步除颤；同时补镁（硫酸镁 2g 静推）、纠正低钾、停用延长 QT 的药物',
        [A_SHOCK, { a: 'drug', id: 'magnesium_sulfate', n: '硫酸镁 2g' }, A_CPR], 5, '致命');
    } else if (sim.rhythm === 'asystole') {
      add('asystole', '心脏停搏（直线）', '立即 CPR + 肾上腺素 1mg；不可电击。逐条排查 5H5T（低血容量/低氧/酸中毒/高钾/低体温、张力性气胸/心包填塞/中毒/血栓）',
        [A_CPR, A_EPI, { a: 'guide', id: 'cardiac_arrest', n: 'ACLS 流程' }], 5, '致命');
    } else if (sim.rhythm === 'pea') {
      add('pea', '无脉性电活动（PEA）', '有电活动无机械收缩：持续 CPR，按 5H5T 找可逆病因（血钾、血气、体温、气胸、心包填塞）',
        [A_CPR, A_EPI, { a: 'guide', id: 'cardiac_arrest', n: 'ACLS 流程' }], 5, '致命');
    } else if (sim.v.pulseOK && v.map < 60) {
      add('hypotension', '低血压 / 休克', '平均动脉压 < 60：快速补液 500 mL 评估反应，必要时去甲肾上腺素维持 MAP > 65；找出血/感染/心源性原因',
        [{ a: 'drug', id: 'norepinephrine', n: '去甲肾上腺素' }, { a: 'drug', id: 'saline', n: '快速补液' }, { a: 'guide', id: 'shock', n: '休克复苏' }], 4);
    }
    if (v.hr > 0 && v.hr < 50 && sim.v.pulseOK) {
      add('brady', '心动过缓', '心率 < 50 伴灌注不足：阿托品 0.5–1 mg 静推，无效则经皮起搏；查血钾与药物原因',
        [{ a: 'drug', id: 'atropine', n: '阿托品 0.5mg' }, { a: 'guide', id: 'arrhythmia', n: '心律失常' }], 3);
    }
    if (sim.rhythm === 'block2' || sim.rhythm === 'block3') {
      add('avblock', '房室传导阻滞（' + (RHY_NAME[sim.rhythm] || '') + '）', '二度 II 型 / 三度阻滞随时可进展为停搏：阿托品、异丙肾上腺素过渡，尽快经皮/经静脉起搏；排查高钾、缺血与药物',
        [{ a: 'drug', id: 'atropine', n: '阿托品' }, { a: 'drug', id: 'isoproterenol', n: '异丙肾上腺素' },
        { a: 'guide', id: 'arrhythmia', n: '心律失常流程' }], 4);
    }
    if (sim.rhythm === 'flutter') {
      add('flutter', '心房扑动', '房扑多为 2:1 传导（心室率约 150）：血流动力学不稳定者同步电复律 50–100 J；稳定者控制心室率或药物复律',
        [{ a: 'drug', id: 'diltiazem', n: '地尔硫䓬' }, { a: 'drug', id: 'amiodarone', n: '胺碘酮' }, A_SHOCK], 3);
    }
    if (v.hr > 130 && sim.v.pulseOK && sim.rhythm !== 'afib') {
      add('tachy', '心动过速', '先看是窦速（找疼痛/发热/低容量/缺氧）还是窄/宽 QRS 心动过速；不稳定者同步电复律',
        [{ a: 'guide', id: 'arrhythmia', n: '心律失常流程' }, A_SHOCK], 3);
    }
    /* --- 电解质 / 内环境 --- */
    if (v.k > 6.0) {
      add('hyperk', '高钾血症 K⁺ ' + v.k.toFixed(1), '葡萄糖酸钙 10mL 静推稳定心肌膜 → 胰岛素 + 葡萄糖 → 碳酸氢钠；停用一切含钾药物，复查血气',
        [{ a: 'drug', id: 'calcium_gluconate', n: '葡萄糖酸钙' }, { a: 'drug', id: 'insulin', n: '胰岛素+葡萄糖' },
        { a: 'drug', id: 'sodium_bicarbonate', n: '碳酸氢钠' }, { a: 'guide', id: 'electrolyte', n: '电解质急症' }], 4, '危及生命');
    }
    if (v.k < 3.0) {
      add('hypok', '低钾血症 K⁺ ' + v.k.toFixed(1), '静脉补钾（≤20 mmol/h，浓度 ≤0.3%）+ 补镁；持续心电监护',
        [{ a: 'drug', id: 'potassium_chloride', n: '氯化钾' }, { a: 'guide', id: 'electrolyte', n: '电解质急症' }], 3);
    }
    if (v.ph < 7.25) {
      add('acidosis', '严重酸中毒 pH ' + v.ph.toFixed(2), '先找原因（低灌注/酮症/肾衰）；pH < 7.1 时谨慎补碱，同时改善通气与灌注',
        [{ a: 'drug', id: 'sodium_bicarbonate', n: '碳酸氢钠' }, { a: 'guide', id: 'electrolyte', n: '电解质与酸碱' }], 3);
    }
    if (v.ca > 2.9) {
      add('hyperca', '高钙血症 Ca²⁺ ' + v.ca.toFixed(2), '大量生理盐水 + 呋塞米促排，降钙素 4 IU/kg 皮下，必要时双膦酸盐；监测心律（QT 缩短）',
        [{ a: 'drug', id: 'calcitonin', n: '降钙素' }, { a: 'drug', id: 'furosemide', n: '呋塞米' },
        { a: 'drug', id: 'zoledronate', n: '唑来膦酸' }], 3);
    }
    if (v.glucose < 3.5) {
      add('hypogly', '低血糖 ' + v.glucose.toFixed(1), '50% 葡萄糖 40–60 mL 静推，随后 10% 葡萄糖维持；15 分钟后复测',
        [{ a: 'drug', id: 'dextrose_50', n: '50% 葡萄糖' }], 4, '危及生命');
    }
    if (v.glucose > 15) {
      add('hypergly', '高血糖 ' + v.glucose.toFixed(1), '胰岛素泵入 0.1 U/kg/h，血糖降到 13.9 以下改含糖液体；监测血钾',
        [{ a: 'drug', id: 'insulin', n: '胰岛素' }], 2);
    }
    if (v.ammonia > 60) {
      add('ammonia', '血氨升高 ' + Math.round(v.ammonia) + ' µmol/L', '肝性脑病：乳果糖 / 利福昔明减少肠源性氨，去除消化道积血，纠正低钾与碱中毒，必要时 CRRT',
        [{ a: 'drug', id: 'lactulose', n: '乳果糖' }, { a: 'drug', id: 'rifaximin', n: '利福昔明' },
        { a: 'nurse', id: 'ng', n: '胃肠减压' }], 3, '肝性脑病');
    }
    if (v.ck > 1500) {
      add('rhabdo', '横纹肌溶解 CK ' + Math.round(v.ck), '大量晶体液（1–2 mL/kg/h）冲刷肾小管 + 碳酸氢钠碱化尿液；监测血钾、血钙与尿量，必要时透析',
        [{ a: 'drug', id: 'saline', n: '大量补液' }, { a: 'drug', id: 'sodium_bicarbonate', n: '碳酸氢钠' },
        { a: 'guide', id: 'electrolyte', n: '电解质急症' }], 4, '急性肾损伤');
    }
    if (v.mg < 0.55) {
      add('hypomg', '低镁血症 Mg²⁺ ' + v.mg.toFixed(2), '硫酸镁 2 g 静滴；低镁常伴顽固性低钾与 QT 延长，单纯补钾无效',
        [{ a: 'drug', id: 'magnesium_sulfate', n: '硫酸镁' }], 3);
    }
    if (v.mg > 1.6) {
      add('hypermag', '高镁血症 Mg²⁺ ' + v.mg.toFixed(2), '停用含镁药物；严重者（>2.5 或呼吸抑制/心动过缓）静推葡萄糖酸钙拮抗',
        [{ a: 'drug', id: 'calcium_gluconate', n: '葡萄糖酸钙' }], 3);
    }
    if (v.ca < 1.8) {
      add('hypoca', '低钙血症 Ca²⁺ ' + v.ca.toFixed(2), '葡萄糖酸钙 1 g 静推（先补镁）；纠正碱中毒，监测 QT 与抽搐',
        [{ a: 'drug', id: 'calcium_gluconate', n: '葡萄糖酸钙' }], 3);
    }
    if ((sim.inflam || 0) > 35) {
      add('sirs', '全身炎症反应（SIRS）', '寻找并控制感染源（培养、影像、引流），1 小时内广谱抗生素 + 30 mL/kg 晶体液，乳酸 > 4 时加用升压药',
        [{ a: 'drug', id: 'piperacillin_tazobactam', n: '广谱抗生素' }, { a: 'drug', id: 'saline', n: '液体复苏' },
        { a: 'guide', id: 'sepsis', n: '脓毒症集束化' }], 4, '炎症介质');
    }
    if (sim.v.pulseOK && v.contractility < 40 && v.volume > 5200 && v.spo2 < 94) {
      add('pulm_edema', '肺水肿 / 容量过负荷', '半坐位、吸氧/无创通气，呋塞米利尿，血压允许时硝酸甘油扩血管；限制输液速度',
        [{ a: 'drug', id: 'furosemide', n: '呋塞米' }, { a: 'drug', id: 'nitroglycerin', n: '硝酸甘油' },
        { a: 'airway', n: '气道 / 氧疗' }], 4, '心源性');
    }
    /* --- 呼吸 --- */
    if (!sim.vent && v.spo2 < 90) {
      add('hypoxia', '低氧血症 SpO₂ ' + Math.round(v.spo2) + '%', '面罩吸氧 10 L/min；无效则简易呼吸器 / 气管插管；查气胸、肺水肿、气道梗阻',
        [A_AIR, { a: 'guide', id: 'resp', n: '呼吸衰竭' }], 4, '危及生命');
    }
    if (v.temp > 39.2) {
      add('fever', '高热 ' + v.temp.toFixed(1) + '℃', '物理降温 + 对乙酰氨基酚；＞40℃ 或伴意识障碍按热射病处理（冰毯、补液）',
        [{ a: 'drug', id: 'acetaminophen', n: '对乙酰氨基酚' }, { a: 'nurse', id: 'cool', n: '冰毯降温' }], 3);
    }
    if (v.temp < 35) {
      add('hypothermia', '低体温 ' + v.temp.toFixed(1) + '℃', '保温毯 + 加温输液；＜32℃ 需主动复温，警惕心律失常',
        [{ a: 'nurse', id: 'warm', n: '保温复温' }], 3);
    }
    /* --- 血液 --- */
    if (v.hb < 8) {
      add('anemia', '贫血 Hb ' + v.hb.toFixed(1) + ' g/dL', 'Hb < 7 或有活动性出血时输浓缩红细胞；同时止血、补液',
        [{ a: 'transfuse', n: '输血' }, { a: 'guide', id: 'transfusion', n: '输血反应' }], 4);
    }
    if (v.svo2 < 50 && sim.v.pulseOK) {
      add('do2low', '氧输送不足 SvO₂ ' + Math.round(v.svo2) + '%', 'DO₂ ' + Math.round(v.do2) + ' mL/min 不足以满足 VO₂ ' + Math.round(v.vo2) +
        '：输血纠正贫血、补液/升压提高心输出量、氧疗提高 SaO₂，同时控制发热/疼痛/躁动降低氧耗',
        [{ a: 'transfuse', n: '输血' }, { a: 'airway', n: '氧疗' }, { a: 'drug', id: 'norepinephrine', n: '去甲肾上腺素' }], 4, '氧供/氧耗失衡');
    }
    if (v.inr > 2.5 || v.plt < 50) {
      add('coag', '凝血功能障碍 INR ' + v.inr.toFixed(1) + ' / PLT ' + Math.round(v.plt), '输新鲜冰冻血浆 / 血小板，必要时维生素 K；活动性出血优先压迫止血',
        [{ a: 'transfuse', n: '输血制品' }, { a: 'drug', id: 'vitamin_k', n: '维生素 K1' }], 3);
    }
    /* --- 神经 --- */
    if (v.icp > 20) {
      add('icp', '颅内压升高 ' + Math.round(v.icp) + ' mmHg', '抬高床头 30°、过度通气、甘露醇 0.5 g/kg 快速静滴；查瞳孔与 GCS',
        [{ a: 'drug', id: 'mannitol', n: '甘露醇' }, { a: 'guide', id: 'abcde', n: '颅高压处理' }], 4);
    }
    if (v.seizure > 25) {
      add('seizure', '癫痫发作', '地西泮 10 mg 静推或咪达唑仑 5 mg 肌注；持续发作按癫痫持续状态处理',
        [{ a: 'drug', id: 'midazolam', n: '咪达唑仑' }, { a: 'guide', id: 'abcde', n: '神经急症' }], 4);
    }
    if (v.anaphylaxis > 10) {
      add('anaphy', '过敏性休克', '立即停用可疑药物，肾上腺素 0.5 mg 肌注（大腿外侧），快速补液，必要时气道支持',
        [{ a: 'drug', id: 'epinephrine', n: '肾上腺素 0.5mg' }, A_AIR, { a: 'guide', id: 'shock', n: '休克复苏' }], 5, '致命');
    }
    /* --- 药物过量 / 靶器官中毒 --- */
    if (sim.tox && sim.tox.level > 1.5) {
      var orgNames = [];
      for (var ok in (sim.tox.organ || {})) if (M.ORGAN_NAME[ok]) orgNames.push(M.ORGAN_NAME[ok]);
      add('overdose', '药物过量 · ' + (sim.tox.drug || '未知药物'),
        '折合 ' + sim.tox.level.toFixed(1) + ' 倍中毒阈值；受累靶器官：' + (orgNames.join('、') || '全身') +
        '。立即停药、减量或换药，按中毒原则支持治疗（拮抗剂 / 补液 / 血管活性药 / 纠正电解质）',
        [{ a: 'guide', id: 'poison', n: '中毒处理原则' }, { a: 'guide', id: 'shock', n: '休克复苏' }], 4, '靶器官损伤');
    }
    /* --- 肾脏 / 尿量 --- */
    if (v.urine < 20 && sim.v.pulseOK) {
      add('oliguria', '少尿 ' + Math.round(v.urine) + ' mL/h', '先补容量（500 mL 晶体）再看反应；必要时呋塞米，查肌酐与血钾',
        [{ a: 'drug', id: 'saline', n: '补液试验' }, { a: 'drug', id: 'furosemide', n: '呋塞米' }], 2);
    }
    /* --- 术后并发症 / 术中所见 --- */
    if (sim.postopActive) {
      for (var pid in sim.postopActive) {
        var po = sim.postopActive[pid];
        var pacts = (po.acts || []).map(function (a) {
          if (a === 'transfuse') return { a: 'transfuse', n: '输血' };
          if (a === 'surgery') {
            var plan = postopSurgeryPlan(sim, po);
            return {
              a: 'surgery',
              n: plan ? '再次手术（' + (M.siteName ? M.siteName(plan.site) : plan.site) + '）' : '再次手术',
              site: plan ? plan.site : null, proc: plan ? plan.proc : null
            };
          }
          if (a === 'airway') return { a: 'airway', n: '气道 / 氧疗' };
          if (a === 'exam') return { a: 'exam', n: '辅助检查' };
          if (a === 'nurse') return { a: 'nurse', n: '护理处置' };
          if (a.indexOf('drug:') === 0) {
            var did = a.slice(5), DD = M.getDrug(did);
            return { a: 'drug', id: did, n: DD ? DD.name : did };
          }
          return null;
        }).filter(Boolean);
        add('postop:' + pid, '术后 · ' + po.n, po.msg + '　处理：' + po.hint, pacts, po.sev || 3, '术后');
      }
    }

    /* --- 术中并发症 --- */
    if (sim.surgery && sim.surgery.active && sim.surgery.comp) {
      add('comp:' + sim.surgery.comp.id, '术中：' + sim.surgery.comp.name, sim.surgery.comp.msg + '（限时 ' + (sim.surgery.comp.window || 45) + ' 秒）',
        [{ a: 'surgery', n: '回手术室处理' }], 5, '限时');
    }
    return out.sort(function (a, b) { return b.sev - a.sev; });
  }
  M.problems = problems;

  /* 本病例的「必需处置」索引；若数据里一项 need 都没有，则视为「任一对症处置」型病例 */
  function needIdx(def) {
    var T = (def && def.treat) || [], out = [];
    for (var i = 0; i < T.length; i++) if (T[i].need) out.push(i);
    return out;
  }
  M.needIdx = needIdx;

  /* 稳定计时进度（供 UI 显示倒计时） */
  function stableProgress(sim) {
    if (!sim || sim.dead || sim.__cureFired) return null;
    var d = sim.disease; if (!d) return null;
    var T = d.def.treat || [];
    var need = needIdx(d.def);
    var needSup = Math.min(2, T.length);
    var eligible = need.length ? !!d.controlled : (T.length === 0 || (d.support || 0) >= needSup);
    if (!eligible) return null;
    var need = stableNeed(sim);
    return { t: sim.stableT || 0, need: need, ready: (sim.stableT || 0) >= need, chronic: !!(d.def && d.def.course === 'chronic') };
  }
  M.stableProgress = stableProgress;

  function checkCure(sim, v, dt) {
    if (sim.__cureFired || sim.dead) return;
    var d = sim.disease; if (!d) return;
    var need = needIdx(d.def);
    var T = d.def.treat || [];

    var eligible;
    if (need.length) {
      /* 有明确必需处置：全部完成（= controlled）后才进入稳定观察期 */
      eligible = !!d.controlled;
    } else {
      /* 没有 need 标记的病例（DIC / CO 中毒 / 热射病 / 镇静药过量…）：
         至少完成 2 项对症处置，并且体征持续稳定，才允许转归；
         只点一项清单不再等于「治好了」。 */
      var needSup = Math.min(2, T.length);
      eligible = (T.length === 0) || (d.support || 0) >= needSup;
    }
    if (!eligible) { sim.stableT = 0; return; }

    if (isStable(v)) {
      sim.stableT = (sim.stableT || 0) + dt;
      sim.unstableT = 0;
      if (sim.__stableLogged === undefined) {
        sim.__stableLogged = 0;
        log(sim, 'good', '生命体征达到转归标准，维持稳定 ' + stableNeed(sim) + ' 秒即可判定转归。');
      }
    } else {
      sim.unstableT = (sim.unstableT || 0) + dt;
      if (sim.unstableT > STABLE_GRACE && (sim.stableT || 0) > 0) {
        sim.stableT = 0;
        sim.__stableLogged = 0;
        log(sim, 'warn', '生命体征再次波动，稳定计时重新开始。');
      }
    }
    if ((sim.stableT || 0) >= stableNeed(sim)) {
      sim.__cureFired = true;
      cure(sim);
    }
  }

  /* 评分 */
  function finalScore(sim) {
    if (sim.outcome !== 'win') return 0;
    var s = 1000;
    s -= Math.round(sim.t * 0.6);
    s += sim.counters.compFixed * 40;
    s -= sim.counters.compFail * 60;
    s += (100 - Math.round(sim.v.lactate * 6));
    if (sim.patient.allergy) s += 30;
    return Math.max(0, s);
  }
  M.finalScore = finalScore;

  /* ================= 死亡归责 =================
     error     ：本可避免 —— 关键处置没做完 / 并发症处理失败 / 药物过量 / 术后问题没处理
     disease   ：病情本身不可逆（暴发性心肌炎、大规模创伤、院外骤停等）
     excluded  ：不计入统计（例如嫌犯被击中数十枪送到时已无生命体征）
     只有 error / disease 计入「接诊人数」与「死亡率」，excluded 只留记录。 */
  M.deathKindOf = function (sim) {
    if (!sim) return 'disease';
    if (sim.special && sim.special.noStats) return 'excluded';
    var tf = treatProgress(sim);
    var missed = tf && tf.total > 0 && tf.done < tf.total;
    var compFail = (sim.counters.compFail || 0) > (sim.counters.compFixed || 0);
    var postopLeft = !!(sim.postopActive && Object.keys(sim.postopActive).length);
    var overdose = !!(sim.tox && sim.tox.level > 3);
    var wrongDose = !!sim.lethalDose;
    if (missed || compFail || postopLeft || overdose || wrongDose) return 'error';
    return 'disease';
  };
  M.deathKindLabel = function (kind, sim) {
    if (kind === 'excluded') return '不计入统计（现场已死亡 / 非救治对象）';
    if (kind === 'error') {
      var why = [];
      var tf = treatProgress(sim);
      if (tf && tf.total > 0 && tf.done < tf.total) why.push('关键处置 ' + tf.done + '/' + tf.total);
      if ((sim.counters.compFail || 0) > (sim.counters.compFixed || 0)) why.push('术中并发症 ' + sim.counters.compFail + ' 次失败');
      if (sim.postopActive && Object.keys(sim.postopActive).length) why.push('术后问题未处理');
      if (sim.tox && sim.tox.level > 3) why.push('药物过量 ' + sim.tox.level.toFixed(0) + '×');
      return '可避免死亡 · 处置失误（' + (why.join('、') || '延误') + '）';
    }
    return '病情不可逆 · 非处置失误';
  };

  /* ================= 特殊事件病人（新闻 → 接诊） ================= */
  /* 由 news.js 决定「发生了什么」，这里负责把病人按事件改造成对应病例 */
  M.applySpecial = function (sim, kind) {
    if (!sim) return null;
    var S = (M.SPECIAL_PATIENTS || {})[kind];
    if (!S) return null;
    sim.special = {
      kind: kind, title: S.title, news: S.news,
      noStats: !!S.noStats, deadOnArrival: !!S.deadOnArrival,
      note: S.note || ''
    };
    if (S.patient) {
      for (var k in S.patient) sim.patient[k] = S.patient[k];
    }
    sim.patient.name = S.patient && S.patient.name ? S.patient.name : sim.patient.name;
    if (S.disease) {
      var def = null;
      for (var i = 0; i < (M.DISEASES || []).length; i++) if (M.DISEASES[i].id === S.disease) def = M.DISEASES[i];
      if (def) startDisease(sim, def);
    }
    if (S.vitals) applyMods(sim.dis, S.vitals);
    if (S.deadOnArrival) {
      sim.rhythm = 'asystole'; sim.v = computeVal(sim);
      sim.v.hr = 0;
    }
    log(sim, 'crit', '【特殊事件】' + S.title + '：' + S.news);
    return sim;
  };

  /* ================= 存 / 读当前患者 ================= */
  var SNAP_FIELDS = ['dis', 'drift', 'drugMod', 'evtMod', 'supportMod', 'autoMod'];
  M.snapshotSim = function (sim) {
    if (!sim || !sim.disease) return null;
    var o = {
      v: 2, t: +sim.t.toFixed(2), doctor: sim.doctor, rank: sim.difficulty,
      patient: sim.patient,
      rhythm: sim.rhythm, rhythmT: sim.rhythmT, vtPulse: !!sim.vtPulse,
      perfusion: sim.perfusion, symp: sim.symp, lactate0: sim.lactate0,
      arrestT: sim.arrestT, cpr: !!sim.cpr, cprQuality: sim.cprQuality,
      airwayMode: sim.airwayMode, vent: !!sim.vent, o2: !!sim.o2,
      gut: sim.gut, bleeding: sim.bleeding, inflam: sim.inflam,
      ecgRegion: sim.ecgRegion, ecgSTDepress: !!sim.ecgSTDepress, ecgLowVoltage: !!sim.ecgLowVoltage,
      disease: {
        id: sim.disease.def.id, t0: sim.disease.t0, stage: sim.disease.stage,
        controlled: !!sim.disease.controlled, support: sim.disease.support || 0,
        elapsed: sim.disease.elapsed || 0, residual: sim.disease.residual || null
      },
      treatDone: sim.treatDone, counters: sim.counters,
      logs: (sim.logs || []).slice(-60),
      symptoms: sim.symptoms, marks: sim.marks,
      examResults: (sim.examResults || []).slice(-10),
      examPending: (sim.examPending || []).slice(),
      labs: (sim.labs || []).slice(-40),
      examFindings: (sim.examFindings || []).slice(-8),
      rxList: (sim.rxList || []).map(function (r) {
        return { drugId: r.drugId, dose: r.dose, route: r.route, t: r.t, c: r.c,
          active: !!r.active, rate: r.rate, total: r.total, left: r.left, uid: r.uid };
      }),
      postop: (sim.postop || []).map(function (p) { return { t: p.t, id: p.def.id, fired: !!p.fired }; }),
      postopMod: sim.postopMod, postopActive: sim.postopActive,
      findings: sim.findings, surgeryHistory: sim.surgeryHistory, lastSurgSite: sim.lastSurgSite,
      bloodGiven: sim.bloodGiven, stableT: sim.stableT || 0,
      special: sim.special || null, iatrogenic: !!sim.iatrogenic
    };
    SNAP_FIELDS.forEach(function (k) { o[k] = sim[k]; });
    return o;
  };
  M.restoreSim = function (snap) {
    if (!snap || !snap.disease) return null;
    var def = null;
    for (var i = 0; i < (M.DISEASES || []).length; i++) if (M.DISEASES[i].id === snap.disease.id) def = M.DISEASES[i];
    if (!def) return null;
    var sim = create({ doctor: snap.doctor || 'Dr. 林', rank: snap.rank || 'resident' });
    if (snap.patient) {
      var p0 = sim.patient;
      sim.patient = snap.patient;
      sim.dis = {}; sim.drift = {}; sim.drugMod = {}; sim.evtMod = {}; sim.supportMod = {}; sim.autoMod = {};
      for (var k in (sim.patient.mods || {})) sim.dis[k] = sim.dis[k] || 0;
      /* 保留新生成患者的血型等缺失字段 */
      for (var pk in p0) if (sim.patient[pk] === undefined) sim.patient[pk] = p0[pk];
    }
    SNAP_FIELDS.forEach(function (k) { if (snap[k]) sim[k] = snap[k]; });
    sim.t = snap.t || 0;
    ['rhythm', 'rhythmT', 'vtPulse', 'perfusion', 'symp', 'lactate0', 'arrestT', 'cpr',
      'airwayMode', 'vent', 'gut', 'bleeding', 'inflam', 'ecgRegion', 'ecgSTDepress',
      'ecgLowVoltage', 'treatDone', 'counters', 'symptoms', 'marks', 'examResults',
      'labs', 'examFindings', 'postopMod', 'postopActive', 'findings', 'surgeryHistory',
      'lastSurgSite', 'bloodGiven', 'stableT', 'special'].forEach(function (k) {
        if (snap[k] !== undefined) sim[k] = snap[k];
      });
    sim.logs = snap.logs || [];
    sim.examPending = (snap.examPending || []).map(function (p) {
      return { id: p.id, name: p.name, t0: p.t0, ready: p.ready };
    });
    sim.rxList = (snap.rxList || []).map(function (r) {
      var D = M.getDrug(r.drugId);
      return D ? { D: D, drugId: r.drugId, dose: r.dose, route: r.route, t: r.t, c: r.c,
        active: r.active, rate: r.rate, total: r.total, left: r.left, uid: r.uid } : null;
    }).filter(Boolean);
    sim.postop = (snap.postop || []).map(function (p) {
      var d2 = null;
      (M.POSTOP || []).forEach(function (x) { if (x.id === p.id) d2 = x; });
      return d2 ? { t: p.t, def: d2, fired: p.fired } : null;
    }).filter(Boolean);
    sim.disease = {
      def: def, t0: snap.disease.t0, stage: snap.disease.stage,
      controlled: snap.disease.controlled, support: snap.disease.support,
      elapsed: snap.disease.elapsed, residual: snap.disease.residual, symAdded: {}
    };
    (sim.symptoms || []).forEach(function (s, idx) { sim.disease.symAdded[idx] = 1; });
    sim.outcome = null; sim.dead = false; sim.__cureFired = false;
    sim.v = computeVal(sim);
    sim.vPrev = sim.v;
    log(sim, 'info', '【继续接诊】恢复上次未结束的病人：' + sim.patient.name + '（' + def.name + '），病程 ' + fmtT(sim.t) + '。');
    return sim;
  };

})();
