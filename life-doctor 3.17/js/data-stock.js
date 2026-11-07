/* ============================================================
   LIFE SIM · 诊室模式 · 药品 / 耗材库存与采购数据
   —— 每份 = 一个最小包装（瓶 / 支 / 袋 / 板 / 包）
   ============================================================ */
window.M = window.M || {};
(function () {
  'use strict';
  var M = window.M;

  M.CLINIC_CFG = {
    daySeconds: 48 * 60,        /* 白班 48 分钟 */
    nightSeconds: 48 * 60,      /* 夜班 48 分钟（与白班等长） */
    restMin: 2 * 60,            /* 每位病人结束后休息 2–8 分钟 */
    restMax: 8 * 60,
    restPausesClock: true,      /* 休息不计入上班时间：本班 48 分钟都是干活的时间 */
    budget: 12000,              /* 每天经费 */
    deliveryMin: 60,            /* 采购送达 1–5 分钟（声望可加速） */
    deliveryMax: 300,
    peakDeliveryMul: 0.55,      /* 高峰期（白班）优先配送的时长系数 */
    defaultUnits: 10,           /* 普通药品初始库存 */
    commonUnits: 40,            /* 常用药初始库存 */
    consumableUnits: 8          /* 每种手术耗材初始库存 */
  };

  /* 常用药：每天 40 份；其余 10 份 */
  M.COMMON_DRUGS = [
    'epinephrine', 'norepinephrine', 'dopamine', 'dobutamine', 'atropine',
    'amiodarone', 'lidocaine', 'adenosine', 'diltiazem', 'esmolol',
    'furosemide', 'nitroglycerin', 'aspirin', 'clopidogrel', 'heparin',
    'insulin', 'dextrose_50', 'saline', 'ringer_lactate', 'calcium_gluconate',
    'potassium_chloride', 'magnesium_sulfate', 'sodium_bicarbonate',
    'fentanyl', 'morphine', 'midazolam', 'propofol', 'ketamine',
    'rocuronium', 'succinylcholine', 'ceftriaxone', 'piperacillin_tazobactam',
    'vancomycin', 'metronidazole', 'ondansetron', 'pantoprazole',
    'salbutamol', 'ipratropium', 'methylprednisolone', 'hydrocortisone',
    'tranexamic_acid', 'naloxone', 'oxytocin'
  ];

  /* ============================================================
     声望等级：接诊越多、治愈率越高，医誉越高
     高级职称有福利：药品/耗材折扣、配送提速、高峰期优先配送
     ============================================================ */
  M.REPUTATION = [
    { id: 'trainee', n: '见习医士', rep: 0, discount: 0, speed: 1.00, peak: false,
      perk: '无折扣' },
    { id: 'resident', n: '住院医师', rep: 100, discount: 2, speed: 1.05, peak: false,
      perk: '药品与耗材 98 折' },
    { id: 'attending', n: '主治医师', rep: 300, discount: 4, speed: 1.10, peak: false,
      perk: '药品与耗材 96 折 · 配送提速 10%' },
    { id: 'associate', n: '副主任医师', rep: 700, discount: 7, speed: 1.15, peak: true,
      perk: '药品与耗材 93 折 · 配送提速 15% · 高峰期优先配送' },
    { id: 'director', n: '主任医师', rep: 1300, discount: 10, speed: 1.20, peak: true,
      perk: '药品与耗材 9 折 · 配送提速 20% · 高峰期优先配送' },
    { id: 'leader', n: '学科带头人', rep: 2200, discount: 13, speed: 1.28, peak: true,
      perk: '药品与耗材 87 折 · 配送提速 28% · 高峰期优先配送' },
    { id: 'dean', n: '院长', rep: 3500, discount: 16, speed: 1.36, peak: true,
      perk: '药品与耗材 84 折 · 配送提速 36% · 高峰期优先配送' },
    { id: 'legend', n: '杏林国手', rep: 5500, discount: 20, speed: 1.45, peak: true,
      perk: '药品与耗材 8 折 · 配送提速 45% · 高峰期优先配送' },
    { id: 'master', n: '大医精诚', rep: 8000, discount: 22, speed: 1.50, peak: true,
      perk: '药品与耗材 78 折 · 配送提速 50% · 高峰期优先配送' },
    { id: 'sage', n: '杏林圣手', rep: 12000, discount: 25, speed: 1.58, peak: true,
      perk: '药品与耗材 75 折 · 配送提速 58% · 高峰期优先配送' },
    { id: 'lifesaver', n: '生命守护者', rep: 18000, discount: 28, speed: 1.66, peak: true,
      perk: '药品与耗材 72 折 · 配送提速 66% · 高峰期优先配送' },
    { id: 'immortal', n: '回春圣手', rep: 26000, discount: 30, speed: 1.75, peak: true,
      perk: '药品与耗材 7 折 · 配送提速 75% · 高峰期优先配送' }
  ];

  M.repLevel = function (rep) {
    var L = M.REPUTATION, out = L[0];
    rep = Math.max(0, +rep || 0);
    for (var i = 0; i < L.length; i++) if (rep >= L[i].rep) out = L[i];
    return out;
  };
  M.repNext = function (rep) {
    var L = M.REPUTATION;
    rep = Math.max(0, +rep || 0);
    for (var i = 0; i < L.length; i++) if (rep < L[i].rep) return L[i];
    return null;
  };

  /* ============================================================
     手术耗材：与药品同一套库存 / 采购系统（id 以 cs_ 开头）
     ============================================================ */
  M.CONSUMABLES = [
    { id: 'cs_pack', name: '一次性无菌手术包', price: 180, unit: '包', desc: '铺巾、器械盘、纱布、缝合包布' },
    { id: 'cs_gloves', name: '无菌手套', price: 20, unit: '双', desc: '每台手术至少 1 双，污染需更换' },
    { id: 'cs_suture', name: '缝线套件', price: 90, unit: '套', desc: '可吸收 + 不可吸收缝线、持针器、打结器' },
    { id: 'cs_stapler', name: '一次性吻合器', price: 1200, unit: '把', desc: '管腔吻合 / 闭合，钉仓一次性使用' },
    { id: 'cs_hemostat', name: '止血材料', price: 120, unit: '包', desc: '明胶海绵、止血纱、双极电凝笔' },
    { id: 'cs_drain', name: '引流管 / 引流袋', price: 60, unit: '套', desc: '腹腔、胸腔、切口引流' },
    { id: 'cs_irrigation', name: '冲洗液与吸引管', price: 35, unit: '套', desc: '生理盐水冲洗、吸引头' },
    { id: 'cs_plate', name: '骨科钢板螺钉', price: 1600, unit: '套', desc: '内固定器材，型号按骨折部位选择' },
    { id: 'cs_cement', name: '骨水泥', price: 500, unit: '包', desc: '假体固定 / 椎体成形' },
    { id: 'cs_chest', name: '胸腔闭式引流套件', price: 350, unit: '套', desc: '胸腔引流管 + 水封瓶' },
    { id: 'cs_cranio', name: '开颅 / 颅钻套件', price: 2000, unit: '套', desc: '颅骨钻、铣刀、硬膜修补材料' },
    { id: 'cs_vascular', name: '血管器械 / 人工血管', price: 2600, unit: '套', desc: '血管阻断钳、吻合线、人工血管' },
    { id: 'cs_endoscope', name: '内镜 / 介入耗材', price: 800, unit: '套', desc: '内镜套管、导丝、导管、活检钳' },
    { id: 'cs_anesthesia', name: '麻醉与气道耗材', price: 200, unit: '套', desc: '气管导管、螺纹管、面罩、过滤器' },
  { id: 'cs_splint', name: '夹板 / 石膏 / 绷带', price: 80, unit: '套', desc: '骨折临时固定、石膏与弹力绷带' },
  { id: 'cs_burn', name: '烧伤敷料 / 银锌霜', price: 150, unit: '份', desc: '烧伤创面清创与覆盖，含抗菌敷料' }
  ];
  M.CONSUMABLE_BY_ID = {};
  M.CONSUMABLES.forEach(function (c) { M.CONSUMABLE_BY_ID[c.id] = c; });

  /* 一台手术需要哪些耗材：由术式 + 部位共同决定 */
  M.surgeryNeeds = function (proc, site) {
    var n = {}, p = (proc && proc.id) || '', s = (site && site.id) || '';
    function add(id, q) { n[id] = (n[id] || 0) + (q || 1); }
    add('cs_pack', 1);
    add('cs_gloves', 1);
    add('cs_anesthesia', 1);
    if (/resection|excision|amputation/.test(p)) { add('cs_suture', 1); add('cs_hemostat', 1); }
    if (/anastomosis|shunt/.test(p)) { add('cs_stapler', 1); add('cs_suture', 1); }
    if (/^suture$/.test(p)) add('cs_suture', 1);
    if (/drainage|decompression|ostomy/.test(p)) add('cs_drain', 1);
    if (/debridement|lavage|exploration/.test(p)) add('cs_irrigation', 1);
    if (/fixation|reduction/.test(p)) { add('cs_plate', 1); add('cs_cement', 1); }
    if (/ligation/.test(p)) { add('cs_suture', 1); add('cs_hemostat', 1); }
    if (/replacement/.test(p)) { add('cs_vascular', 1); add('cs_cement', 1); }
    if (/biopsy|endoscopy|embolization/.test(p)) add('cs_endoscope', 1);
    if (/cranium/.test(s)) add('cs_cranio', 1);
    if (/pleura|airway|heart|mediastinum|diaphragm|aorta/.test(s)) add('cs_chest', 1);
    if (/vessel|aorta|heart/.test(s)) add('cs_vascular', 1);
    if (proc && (proc.bleed || 0) >= 1.5) add('cs_hemostat', 1);
    var out = {};
    for (var k in n) if (n[k] > 0) out[k] = n[k];
    return out;
  };

  /* 每份包装量（用于「消耗量 = 输入量 / 每份量，向上取整」）与单价（¥/份） */
  var PACK = {
    epinephrine: { per: 1, price: 80 },
    norepinephrine: { per: 4, price: 120 },
    dopamine: { per: 200, price: 60 },
    dobutamine: { per: 250, price: 70 },
    atropine: { per: 1, price: 20 },
    amiodarone: { per: 150, price: 150 },
    lidocaine: { per: 100, price: 40 },
    adenosine: { per: 6, price: 90 },
    diltiazem: { per: 10, price: 60 },
    esmolol: { per: 100, price: 80 },
    metoprolol: { per: 50, price: 30 },
    furosemide: { per: 20, price: 20 },
    nitroglycerin: { per: 5, price: 40 },
    sodium_nitroprusside: { per: 50, price: 90 },
    aspirin: { per: 100, price: 5 },
    clopidogrel: { per: 75, price: 30 },
    heparin: { per: 5000, price: 50 },
    enoxaparin: { per: 40, price: 80 },
    insulin: { per: 400, price: 40 },
    dextrose_50: { per: 25, price: 20 },
    saline: { per: 500, price: 25 },
    ringer_lactate: { per: 500, price: 30 },
    calcium_gluconate: { per: 2, price: 25 },
    potassium_chloride: { per: 20, price: 15 },
    magnesium_sulfate: { per: 2, price: 30 },
    sodium_bicarbonate: { per: 50, price: 20 },
    fentanyl: { per: 100, price: 50 },
    morphine: { per: 10, price: 30 },
    midazolam: { per: 5, price: 25 },
    propofol: { per: 200, price: 120 },
    ketamine: { per: 100, price: 90 },
    rocuronium: { per: 50, price: 80 },
    succinylcholine: { per: 100, price: 40 },
    ceftriaxone: { per: 1, price: 40 },
    piperacillin_tazobactam: { per: 4.5, price: 120 },
    vancomycin: { per: 500, price: 90 },
    metronidazole: { per: 500, price: 25 },
    ondansetron: { per: 8, price: 20 },
    pantoprazole: { per: 40, price: 25 },
    salbutamol: { per: 5, price: 20 },
    ipratropium: { per: 500, price: 25 },
    methylprednisolone: { per: 40, price: 40 },
    hydrocortisone: { per: 100, price: 30 },
    tranexamic_acid: { per: 1, price: 50 },
    naloxone: { per: 0.4, price: 40 },
    oxytocin: { per: 5, price: 20 },
    /* 昂贵/稀有药 */
    pcc: { per: 500, price: 1500 },
    fibrinogen: { per: 1, price: 1200 },
    cryoprecipitate: { per: 1, price: 600 },
    ivig: { per: 20, price: 2500 },
    snake_antivenom: { per: 6000, price: 3000 },
    hydroxocobalamin: { per: 5, price: 2000 },
    digoxin_fab: { per: 40, price: 2500 },
    dantrolene: { per: 20, price: 800 },
    silibinin: { per: 600, price: 900 },
    activated_charcoal: { per: 50, price: 80 },
    alteplase: { per: 50, price: 2200 },
    factor_viia: { per: 1, price: 4000 },
    idarucizumab: { per: 2.5, price: 6000 },
    andexanet_alfa: { per: 400, price: 6000 },
    levosimendan: { per: 12.5, price: 900 },
    milrinone: { per: 10, price: 300 },
    vasopressin: { per: 20, price: 180 },
    phenylephrine: { per: 10, price: 60 },
    ephedrine: { per: 30, price: 30 },
    sodium_nitrite: { per: 300, price: 400 },
    sodium_thiosulfate: { per: 12.5, price: 300 },
    fomepizole: { per: 1.5, price: 1800 },
    deferoxamine: { per: 500, price: 900 },
    physostigmine: { per: 1, price: 600 },
    pralidoxime: { per: 500, price: 400 },
    methylene_blue: { per: 50, price: 300 },
    lipid_emulsion: { per: 500, price: 300 },
    calcitonin: { per: 100, price: 500 },
    zoledronate: { per: 4, price: 1200 }
  };

  function packMeta(D) {
    if (!D) return { per: 1, price: 10 };
    if (PACK[D.id]) return PACK[D.id];
    var typ = (D.dose && D.dose.typical) || 1;
    var max = (D.dose && D.dose.max) || typ;
    var per = Math.max(1, max);
    if (D.unit === 'ml') per = Math.max(100, max);
    if (D.unit === 'g') per = Math.max(1, max);
    var price;
    if (D.unit === 'ml') price = 30;
    else if (D.unit === 'g') price = Math.max(30, Math.round(80 * max));
    else price = M.clamp ? Math.round(Math.max(15, Math.min(600, 30 + typ * 2))) : Math.round(Math.max(15, Math.min(600, 30 + typ * 2)));
    if ((D.flags || []).indexOf('high_alert') >= 0) price = Math.max(price, 120);
    if (D.antidote) price = Math.max(price, 600);
    return { per: +per.toFixed(4), price: price };
  }
  M.stockMeta = packMeta;

  /* 耗材也能用 stockMeta 查询：{ per, price } */
  var packMetaDrug = packMeta;
  M.stockMeta = function (D) {
    if (D && typeof D === 'string' && M.CONSUMABLE_BY_ID[D]) {
      var c = M.CONSUMABLE_BY_ID[D];
      return { per: 1, price: c.price, consumable: true, unit: c.unit };
    }
    if (D && D.id && M.CONSUMABLE_BY_ID[D.id]) {
      var c2 = M.CONSUMABLE_BY_ID[D.id];
      return { per: 1, price: c2.price, consumable: true, unit: c2.unit };
    }
    return packMetaDrug(D);
  };

  M.initialStock = function () {
    var out = {}, common = {};
    (M.COMMON_DRUGS || []).forEach(function (id) { common[id] = 1; });
    (M.DRUGS || []).forEach(function (D) {
      if (!D || !D.id) return;
      out[D.id] = common[D.id] ? M.CLINIC_CFG.commonUnits : M.CLINIC_CFG.defaultUnits;
    });
    (M.CONSUMABLES || []).forEach(function (c) {
      out[c.id] = M.CLINIC_CFG.consumableUnits;
    });
    return out;
  };
})();
