/* ============================================================================
   i18n.js —— 英文模式（运行时把界面中文换成英文）
   做法：词典 + MutationObserver，不侵入原有渲染逻辑
   切换语言通过 localStorage 记住，然后整页重载（避免英文→中文的反向翻译）
   ========================================================================== */
(function () {
  'use strict';

  var KEY = 'lifesim.lang';
  var lang = 'zh';
  try { lang = localStorage.getItem(KEY) || 'zh'; } catch (e) {}

  var DICT = {
    /* ---------- 启动页 ---------- */
    '器官耦合 · 药理动力学 · 术中风险 实时模拟引擎 · 诊室 v2.5': 'Organ coupling · Pharmacokinetics · Intra-op risk · Real-time simulation · Clinic v2.5',
    '医师账号（本机保存 · 医誉系统）': 'Operator account (saved locally)',
    '游客模式': 'Guest',
    '登录 / 注册': 'Sign in / Register',
    '登录后战绩、医誉与门诊进度都按账号保存；未登录只存游客档案': 'Progress is saved per account; guests get a local profile.',
    '保持账号（12 小时内再次打开免密进入）': 'Stay signed in for 12 hours',
    '医生姓名（用于签署死亡证明）': 'Operator name',
    '职称 —— 决定难度': 'Rank — sets difficulty',
    '接诊类型': 'Case type',
    '全部随机 · 按白班 / 夜班分布抽病例（白班普通病与中暑多，夜班危重多）': 'Fully random · day/night weighted (more common cases by day, critical by night)',
    '开始今天的门诊': 'Start shift',
    '诊室模式 · 白班 48 分钟 / 夜班 48 分钟 · 每日经费 ¥12,000 · 休息 2–8 分钟（不计入上班时间）': 'Clinic mode · 48-min day / 48-min night shift · daily budget 12,000 · 2–8 min rest (not counted)',
    '药品 + 手术耗材库存与采购 · 医誉等级享折扣与高峰期优先配送 · 病人类型全部随机': 'Supply + consumables stock and purchasing · reputation discounts · random cases',

    /* ---------- 职称卡片 ---------- */
    '见习医师': 'Trainee',
    '实习医师': 'Intern',
    '住院医师': 'Resident',
    '主治医师': 'Attending',
    '副主任医师': 'Associate',
    '主任医师': 'Chief',
    '分步指南（含剂量） · 手术并发症 ×0.6 · 病程进展 ×0.55 · 只接诊轻中度病例': 'Step-by-step guide (with doses) · complications ×0.6 · progression ×0.55 · mild cases only',
    '全程分步指南 · 手术并发症 ×0.75 · 病程进展 ×0.85 · 剂量提示全开': 'Full step-by-step guide · complications ×0.75 · progression ×0.85 · all dose hints',
    '要点式指南 · 手术并发症 ×1.0 · 标准病程 · 剂量提示开': 'Key-point guide · complications ×1.0 · standard progression · dose hints on',
    '方向性提示 · 手术并发症 ×1.2 · 病程进展 ×1.15 · 剂量提示关闭': 'Directional hints · complications ×1.2 · progression ×1.15 · dose hints off',
    '只给方向 · 手术并发症 ×1.3 · 病程进展 ×1.65 · 病人更重': 'Direction only · complications ×1.3 · progression ×1.65 · sicker patients',
    '无病例提示 · 手术并发症 ×1.4 · 病程进展 ×1.9 · 病人更危重': 'No case hints · complications ×1.4 · progression ×1.9 · critical patients',
    '登录后战绩、医誉与门诊进度都按账号保存；未登录只存游客档案': 'Progress and reputation save per account; guests get a local profile.',
    '保持账号（12 小时内再次打开免密进入）': 'Stay signed in for 12 hours',
    '医誉': 'Reputation',
    '见习医士': 'Trainee',
    '实习医士': 'Intern',
    '过敏': 'Allergy',
    '过敏史：': 'Allergy: ',
    '病例': 'Case',
    '情景': 'Case',
    '查看处置建议': 'View suggestions',
    '窦性心律': 'Sinus rhythm',
    '室颤': 'Ventricular fibrillation',
    '心脏停搏': 'Cardiac arrest',
    '低血压': 'Hypotension',
    '低氧血症': 'Hypoxaemia',
    '高钾血症': 'Hyperkalaemia',
    '酸中毒': 'Acidosis',
    '游客': 'Guest',
    '实习': 'Intern',
    '见习': 'Trainee',
    '住院': 'Resident',
    '主治': 'Attending',
    '动脉压': 'Arterial pressure',
    '脉搏波': 'Plethysmograph',
    '呼吸阻抗': 'Respiratory impedance',
    '脑电': 'EEG',
    '二氧化碳': 'CO2',
    '双击放大': 'double-tap to zoom',
    '· 双击放大': '· double-tap to zoom',
    '登录后战绩、医誉与门诊进度都按账号保存；未登录只存游客档案': 'Progress and reputation save per account; guests get a local profile.',
    '搜索药名 / 别名 / 分类 / 靶点…': 'Search drug / class / target',
    '需手术根治': 'surgery required',
    '当前病程': 'Current stage',
    '未处理预计': 'irreversible in',
    '后不可逆': '',
    '种途径': 'routes',
    '常用': 'typical',
    '份': 'units',
    '诊室': 'Clinic',
    '血型': 'Blood type',
    '过敏史': 'Allergy',
    '否认': 'None',
    '本次诊疗': 'Session',
    '救活': 'Recovered',
    '死亡': 'Lost',
    '存活率': 'Survival',
    '接诊数': 'Cases',
    '最佳单例': 'Best case',
    '累计评分': 'Total score',
    '医师档案': 'Operator profile',
    '战绩': 'Stats',
    '门诊进度': 'Clinic progress',

    /* ---------- 顶栏 ---------- */
    '急诊 03 床': 'Bay 03',
    '血型 —': 'Blood type —',
    '过敏史 —': 'Allergy —',
    '检索药品 / 指南 / 操作': 'Search drugs / guides / actions',
    '病程': 'Elapsed',

    /* ---------- 生命体征 ---------- */
    '心率': 'Heart rate',
    '血压': 'Blood pressure',
    '收缩压': 'Systolic',
    '舒张压': 'Diastolic',
    '平均动脉压': 'Mean arterial pressure',
    '心输出量': 'Cardiac output',
    '每搏输出量': 'Stroke volume',
    '体循环阻力': 'Systemic vascular resistance',
    '心肌收缩力': 'Contractility',
    '冠脉灌注': 'Coronary perfusion',
    '混合静脉血氧': 'Mixed venous O2',
    '氧输送 DO₂': 'O2 delivery DO2',
    '交感张力': 'Sympathetic tone',
    'QT 间期': 'QT interval',
    '致心律失常性': 'Arrhythmogenicity',
    '呼吸': 'Respiration',
    '呼吸频率': 'Respiratory rate',
    '潮气量': 'Tidal volume',
    '血氧': 'SpO2',
    '气道通畅': 'Airway patency',
    '支气管痉挛': 'Bronchospasm',
    '分泌物': 'Secretions',
    '意识': 'Consciousness',
    '镇静': 'Sedation',
    '疼痛': 'Pain',
    '瞳孔': 'Pupils',
    '颅内压': 'ICP',
    '体温': 'Temperature',
    '血钾': 'Potassium',
    '血钠': 'Sodium',
    '血钙': 'Calcium',
    '血糖': 'Glucose',
    '酸碱': 'Acid-base',
    '乳酸': 'Lactate',
    '血红蛋白': 'Hemoglobin',
    '血小板': 'Platelets',
    '凝血功能': 'Coagulation',
    '尿量': 'Urine output',
    '体液总量': 'Fluid volume',
    '胃内容量': 'Gastric volume',
    '循环': 'Circulation',
    '神经': 'Neuro',
    '内环境': 'Metabolic',
    '器官·血液': 'Organ · Blood',

    /* ---------- 面板 / 标签 ---------- */
    '生命体征': 'Vitals',
    '疾病状态': 'Condition',
    '监护波形': 'Waveforms',
    '指南': 'Guide',
    '药品': 'Drugs',
    '症状': 'Symptoms',
    '处方': 'Orders',
    '检查': 'Workup',
    '日志': 'Log',
    '病情': 'Progress',
    '器官负荷': 'Organ load',
    '处置进度': 'Treatment',
    '危重': 'Acuity',
    '急性 · 进展快': 'Acute · fast',
    '慢性 · 难根治': 'Chronic · slow',
    '双击 ECG 放大 12 导联': 'Double-tap ECG for 12-lead',

    /* ---------- 底部操作条 ---------- */
    '处理指南': 'Guide',
    '手术 · 术式': 'Procedure',
    '输血': 'Transfuse',
    '放血': 'Blood draw',
    '电击除颤': 'Defibrillate',
    '胸外按压': 'CPR',
    '气道 / 氧疗': 'Airway / O2',
    '检查 / 化验': 'Workup',
    '护理处置': 'Nursing',
    '趋势曲线': 'Trends',
    '给药': 'Drugs',
    '手术': 'Procedure',
    '药房': 'Supply',
    '趋势': 'Trends',
    '12导联': '12-lead',
    '结束': 'End',

    /* ---------- 通用 ---------- */
    '关闭': 'Close',
    '确定': 'OK',
    '取消': 'Cancel',
    '返回': 'Back',
    '开始': 'Start',
    '停止': 'Stop',
    '继续': 'Continue',
    '下一步': 'Next',
    '库存': 'Stock',
    '单价': 'Price',
    '购买': 'Buy',
    '买1': 'Buy 1',
    '买5': 'Buy 5',
    '经费': 'Budget',
    '声望': 'Reputation',
    '物资': 'Supplies',
    '操作耗材': 'Consumables',
    '补给站': 'Supply depot',
    '补给站 / 库存': 'Supply depot / Stock',
    '处置': 'Treat',
    '用法': 'Route',
    '剂量': 'Dose',
    '常用量': 'Standard dose',
    '2 倍常用量': '2× standard',
    '5 倍常用量': '5× standard',
    '起效中': 'Onset',
    '作用中': 'Active',
    '已代谢': 'Metabolized',
    '未起效': 'Failed',

    /* ---------- 弹窗标题 ---------- */
    '检查与检验': 'Workup & labs',
    '12 导联心电图': '12-lead ECG',
    '手术室 · 术前规划': 'Procedure room · planning',
    '输血 / 血制品': 'Transfusion',
    '药房 / 库存': 'Supply depot / Stock',
    '临床指南手册': 'Clinical handbook',
    '趋势曲线': 'Trends',
    '检查报告': 'Report',
    '过程记录': 'Event log',
    '当前情景': 'Current case',
    '偏离项': 'Out of range',
    '点击波形区查看 12 导联 · 底部横滑切换面板': 'Tap waveforms for 12-lead · swipe the bottom bar for panels',

    /* ---------- 结算 ---------- */
    '观察期通过': 'Observation passed',
    '模拟终止': 'Simulation ended',
    '再来一局': 'Play again',
    '查看过程记录': 'View log',
    '模拟时长': 'Duration',
    '综合评分': 'Score',
    '关键处置': 'Key treatments',
    '终止原因': 'End reason',
    '手动结束模拟': 'Ended manually',
    '第 1 天结算': 'Day 1 summary',
    '接诊': 'Seen',
    '治愈': 'Recovered',
    '终止': 'Ended',
    '支出': 'Spent',
    '结余': 'Balance',
    '进入下一天': 'Next day',
    '退出诊室模式': 'Exit clinic mode',
    '补充库存': 'Restock',

    /* ---------- 状态条 ---------- */
    '白班': 'Day shift',
    '夜班': 'Night shift',
    '候诊': 'Waiting',
    '诊疗中': 'In consult',
    '准备接诊': 'Ready',
    '休息中': 'Resting',
    '候诊区': 'Waiting room',
    '新闻': 'News',
    '暂停': 'Pause'
  };

  /* 长键优先，避免“心率”先把“心率变异性”这类词拆坏 */

  /* ================= 数据英文化：药 / 病 / 检查 / 指南 ================= */
  var TARGET_EN = {
    hr: 'HR', sbp: 'SBP', dbp: 'DBP', map: 'MAP', co: 'CO', sv: 'SV', svr: 'SVR',
    contractility: 'Contractility', rr: 'RR', spo2: 'SpO2', paco2: 'PaCO2', pao2: 'PaO2',
    gcs: 'GCS', icp: 'ICP', k: 'K+', na: 'Na+', ca: 'Ca2+', glucose: 'Glucose',
    ph: 'pH', lactate: 'Lactate', temp: 'Temp', hb: 'Hb', plt: 'PLT', inr: 'INR',
    clotting: 'Clotting', renal: 'Renal', hepatic: 'Hepatic', urine: 'Urine',
    volume: 'Volume', pain: 'Pain', sedation: 'Sedation', airway: 'Airway',
    bronchospasm: 'Bronchospasm', histamine: 'Histamine', avconduction: 'AV conduction',
    qt: 'QT', coronary: 'Coronary', gi: 'GI', immune: 'Immune', inflam: 'Inflammation',
    brain: 'Brain', dil: 'Dilution', pltf: 'Platelets'
  };
  var EXAM_EN = {
    ecg12: '12-lead ECG', glucose: 'Capillary glucose', abg: 'Arterial blood gas',
    lytes: 'Electrolytes', lactate: 'Lactate', cbc: 'Complete blood count',
    coags: 'Coagulation panel', troponin: 'Cardiac markers', renal: 'Renal panel',
    liver: 'Liver panel', lipase: 'Lipase', pct: 'Infection markers',
    ketone: 'Ketones / osmolality', ua: 'Urinalysis', hcg: 'Pregnancy test',
    vbg: 'Venous blood gas', tox: 'Toxicology screen', cohb: 'COHb',
    methb: 'MetHb', che: 'Cholinesterase', apap: 'Paracetamol level',
    osm: 'Osmolal gap', type: 'Blood group', cross: 'Crossmatch', culture: 'Blood culture',
    cxr: 'Chest X-ray', fast: 'FAST / abdominal US', echo: 'Echocardiography',
    headct: 'Head CT', abdomenct: 'Abdominal CT', chestct: 'Chest CT',
    lp: 'Lumbar puncture', endo: 'Emergency endoscopy', bronch: 'Bronchoscopy',
    ecg: 'ECG', inr: 'INR', bnp: 'BNP', ck: 'CK / myoglobin', urine_na: 'Urine sodium',
    cortisol: 'Cortisol', tsh: 'Thyroid panel', hba1c: 'HbA1c',
    axr: 'Abdominal X-ray', pelvisxr: 'Pelvis / femur X-ray', dvtus: 'Leg vein ultrasound',
    headmri: 'Head MRI', peri: 'Pericardiocentesis', thor: 'Thoracentesis',
    para: 'Paracentesis', skin: 'Skin prick test'
  };
  var GUIDE_EN = {
    abcde: 'ABCDE approach', cardiac_arrest: 'Cardiac arrest / ACLS',
    arrhythmia: 'Arrhythmia management', acs: 'Acute coronary syndrome',
    shock: 'Shock recognition and resuscitation', sepsis: 'Sepsis 1-hour bundle',
    respiratory: 'Respiratory failure and airway', trauma: 'Primary trauma survey',
    poisoning: 'Poisoning principles', electrolyte: 'Electrolyte emergencies',
    transfusion: 'Transfusion and haemolysis', intraop: 'Intra-operative complications',
    drugs: 'Emergency drug quick reference', postresus: 'Post-resuscitation care'
  };
  var CAT_EN = {
    cardiac: 'Cardiac', trauma: 'Trauma', poison: 'Toxicology', environment: 'Environmental',
    obstetric: 'Obstetric', infection: 'Infection', respiratory: 'Respiratory',
    neuro: 'Neuro', gi: 'GI', renal: 'Renal', endocrine: 'Endocrine',
    heme: 'Haematology', vascular: 'Vascular', meta: 'Metabolic', misc: 'General'
  };

  function shortId(id) {
    var h = 0;
    for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return 100 + (h % 900);
  }

  function drugNameEn(d) {
    var parts = [];
    var eff = d.effects || [];
    for (var i = 0; i < eff.length && parts.length < 2; i++) {
      var n = TARGET_EN[eff[i].t];
      if (n && parts.indexOf(n) < 0) parts.push(n);
    }
    if (!parts.length) parts.push('Agent');
    return parts.join('/') + ' agent #' + shortId(String(d.id));
  }

  function localizeData() {
    var M = window.M;
    if (!M) return;
    if (M.DISEASES) {
      for (var q = 0; q < M.DISEASES.length; q++) {
        var dq = M.DISEASES[q];
        if (!dq) continue;
        dq.cat = 'General';
        if (dq.dept) dq.dept = 'General';
        if (dq.department) dq.department = 'General';
        if (dq.region) dq.region = '';
        if (dq.regions) dq.regions = [];
        if (dq.notes) dq.notes = [];
        if (dq.hints) dq.hints = [];
        if (dq.stages) {
          for (var s = 0; s < dq.stages.length; s++) {
            dq.stages[s].name = 'Stage ' + (s + 1);
            dq.stages[s].desc = '';
            dq.stages[s].note = '';
          }
        }
        if (dq.treat) {
          for (var tr = 0; tr < dq.treat.length; tr++) {
            dq.treat[tr].note = '';
            dq.treat[tr].label = '';
          }
        }
      }
    }

    if (M.DRUGS) {
      for (var i = 0; i < M.DRUGS.length; i++) {
        var d = M.DRUGS[i];
        if (!d) continue;
        d.name = drugNameEn(d);
        d.alias = '';
        d.cls = 'Agent · ' + (d.routes ? d.routes.length : 1) + ' routes';
      }
    }
    if (M.DISEASES) {
      var ci = 0;
      for (var j = 0; j < M.DISEASES.length; j++) {
        var dz = M.DISEASES[j];
        if (!dz) continue;
        var cat = CAT_EN[dz.category] || 'General';
        ci++;
        dz.name = cat + ' case #' + ci;
        if (dz.desc) dz.desc = '';
      }
    }
    if (M.EXAM_LIB) {
      for (var k = 0; k < M.EXAM_LIB.length; k++) {
        var e = M.EXAM_LIB[k];
        if (!e) continue;
        e.n = EXAM_EN[e.id] || (String(e.id).replace(/_/g, ' ').replace(/^w/, function (c) { return c.toUpperCase(); }));
        e.desc = '';
        e.hint = '';
      }
    }
    if (M.EXAM_GROUPS) {
      var GN = { poct: 'Point of care', lab: 'Laboratory', imaging: 'Imaging', special: 'Special procedures' };
      for (var g = 0; g < M.EXAM_GROUPS.length; g++) {
        M.EXAM_GROUPS[g].n = GN[M.EXAM_GROUPS[g].id] || M.EXAM_GROUPS[g].id;
        M.EXAM_GROUPS[g].hint = '';
      }
    }
    if (M.GUIDES) {
      for (var m = 0; m < M.GUIDES.length; m++) {
        var gd = M.GUIDES[m];
        if (!gd) continue;
        gd.title = GUIDE_EN[gd.id] || String(gd.id || '').replace(/_/g, ' ');
        gd.tags = ['reference'];
      }
    }
  }

  /* 日志与长报告：整段中文无法逐句翻译，英文模式下只留时间与类型 */
  function suppressLongChinese(root) {
    var nodes = root.querySelectorAll ? root.querySelectorAll('#logBody .log-item, #logBody li, #logBody div') : [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.children.length === 0 && /[\u4e00-\u9fa5]/.test(el.textContent || '')) {
        el.textContent = 'event';
      }
    }
  }

  window.__localizeData = localizeData;

  /* 拼接句（带数字/变量的）用规则处理，词典处理不了语序 */
  var RULES = [
    [/^(\d+) 种途径 · 常用 ([\d.]+) ?(\w*) · 库存 (\d+) 份$/, '$1 routes · typical $2 $3 · stock $4'],
    [/^(\d+) 种途径$/, '$1 routes'],
    [/^常用 ([\d.]+) ?(\w*)$/, 'typical $1 $2'],
    [/^库存 (\d+) 份$/, 'stock $1'],
    [/^发病 ([\d:]+) \| 未处理预计 ([\d:]+) 后不可逆$/, 'Onset $1 · irreversible in $2'],
    [/^当前病程 · (.+)$/, 'Current stage · $1'],
    [/^处置进度 (.+)$/, 'Treatment $1'],
    [/^([\d.]+) 份$/, '$1 units'],
    [/^第 (\d+) 天$/, 'Day $1'],
    [/^诊室 (\d+) 床$/, 'Bay $1'],
    [/^(\d+) 床$/, 'Bay $1'],
    [/^本次诊疗 (.+)$/, 'Session $1'],
    [/^病程 (.+)$/, 'Elapsed $1'],
    [/^血型 (.+)$/, 'Blood type $1'],
    [/^过敏史：(.+)$/, 'Allergy: $1'],
    [/^男 · (.+) 岁 · (\d+) ?kg$/, 'Male · $1 y · $2 kg'],
    [/^女 · (.+) 岁 · (\d+) ?kg$/, 'Female · $1 y · $2 kg'],
    [/^男 · (.+) 岁$/, 'Male · $1 y'],
    [/^女 · (.+) 岁$/, 'Female · $1 y'],
    [/^(\d+) 岁$/, '$1 y'],
    [/^(见习|实习|住院|主治|副主任|主任)医师$/, '$1'],
    [/^(见习|实习|住院|主治|副主任|主任)医士$/, '$1']
  ];

  var KEYS = Object.keys(DICT).sort(function (a, b) { return b.length - a.length; });

  function hasCJK(s) { return /[\u4e00-\u9fa5]/.test(s); }

  function translateText(text) {
    var lead = text.match(/^\s*/)[0];
    var tail = text.match(/\s*$/)[0];
    var core = text.trim();
    if (!core || !hasCJK(core)) return text;
    for (var ri = 0; ri < RULES.length; ri++) {
      var rr = core.match(RULES[ri][0]);
      if (rr) {
        var outR = core.replace(RULES[ri][0], RULES[ri][1]);
        if (outR !== core) return lead + outR + tail;
      }
    }
    if (DICT[core]) return lead + DICT[core] + tail;
    if (core.length <= 40) {
      var out = core, hits = 0;
      for (var i = 0; i < KEYS.length; i++) {
        if (out.indexOf(KEYS[i]) >= 0) {
          out = out.split(KEYS[i]).join(DICT[KEYS[i]]);
          hits++;
        }
      }
      /* 只换掉半截会得到“查看Treat建议”这种中英混搭，宁可整句保留中文 */
      if (out !== core && (!hasCJK(out) || hits >= 2)) return lead + out + tail;
    }
    /* 兜底：翻译不了的残留中文直接去掉，保证整屏只有一种语言 */
    var cleaned = core.replace(/[\u4e00-\u9fa5]+/g, ' ').replace(/[ \t]{2,}/g, ' ').trim();
    if (cleaned && cleaned !== core) return lead + cleaned + tail;
    return text;
  }

  var ATTRS = ['placeholder', 'title', 'aria-label'];

  function walkNode(node) {
    if (!node) return;
    if (node.nodeType === 3) {
      var v = translateText(node.nodeValue);
      if (v !== node.nodeValue) node.nodeValue = v;
      return;
    }
    if (node.nodeType !== 1) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = node.getAttribute && node.getAttribute(ATTRS[i]);
      if (a && hasCJK(a)) node.setAttribute(ATTRS[i], translateText(a));
    }
    for (var c = node.firstChild; c; c = c.nextSibling) walkNode(c);
  }

  var pending = new Set();
  var scheduled = false;

  function flush() {
    scheduled = false;
    var list = Array.from(pending);
    pending.clear();
    for (var i = 0; i < list.length; i++) {
      try { walkNode(list[i]); } catch (e) {}
    }
  }

  function schedule(node) {
    pending.add(node);
    if (scheduled) return;
    scheduled = true;
    (window.requestAnimationFrame || setTimeout)(flush, 16);
  }

  function apply() {
    document.documentElement.setAttribute('lang', 'en');
    walkNode(document.body);

    var obs = new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var r = records[i];
        if (r.type === 'childList') {
          for (var j = 0; j < r.addedNodes.length; j++) schedule(r.addedNodes[j]);
        } else if (r.type === 'characterData') {
          schedule(r.target);
        }
      }
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function setLang(next) {
    try { localStorage.setItem(KEY, next); } catch (e) {}
    location.reload();
  }

  function injectSwitch() {
    if (document.getElementById('langSwitch')) return;
    var box = document.createElement('div');
    box.id = 'langSwitch';
    box.style.cssText = 'position:fixed;right:10px;bottom:64px;z-index:80;display:flex;align-items:center;gap:6px;' +
      'padding:4px 8px;border-radius:999px;background:rgba(8,16,22,.92);border:1px solid rgba(37,227,198,.45);' +
      'font:600 10px/1 -apple-system,sans-serif;color:#8aa3b4;cursor:pointer;user-select:none;';
    box.innerHTML = '<span id="lsZh">中</span>' +
      '<span style="position:relative;width:34px;height:16px;border-radius:999px;background:rgba(255,255,255,.12);display:inline-block">' +
      '<i id="lsKnob" style="position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#25e3c6;transition:left .18s"></i></span>' +
      '<span id="lsEn">EN</span>';
    document.body.appendChild(box);
    if (lang === 'en') {
      document.getElementById('lsKnob').style.left = '20px';
      document.getElementById('lsEn').style.color = '#25e3c6';
      document.getElementById('lsZh').style.color = '#5c7181';
    } else {
      document.getElementById('lsZh').style.color = '#25e3c6';
    }
    box.addEventListener('click', function () { setLang(lang === 'en' ? 'zh' : 'en'); });
  }  function boot() {
    injectSwitch();
    if (lang === "en" && window.__localizeData) window.__localizeData();
    if (lang === 'en') {
      apply();
    }
  }

  /* 英文模式必须先把数据换成英文，再让 ui.js 去渲染 */
  window.__immediate = true;
  if (lang === 'en' && window.__localizeData) window.__localizeData();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.I18N = { set: setLang, current: function () { return lang; }, tr: translateText };
})();