/* ============================================================
   LIFE SIM · 检查 / 化验 / 影像 / 器官耦合视图
   独立模块：数据 + 报告生成 + 待回报队列 + 器官功能概览
   ============================================================ */
window.M = window.M || {};
(function () {
  'use strict';
  var M = window.M;
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }

  /* ================= 检查项目表 ================= */
  /* g: poct 床旁即时 / lab 实验室 / imaging 影像 / special 特殊操作
     delay: 游戏内回报时间（秒），1× 速度下约等于真实秒数 */
  var LIB = [
    { id: 'ecg12', n: '心电图（12 导联）', g: 'poct', delay: 5, desc: '心律、心率、PR/QRS/QT、ST-T 改变' },
    { id: 'glucose', n: '末梢血糖', g: 'poct', delay: 3, desc: '床旁快速血糖，低血糖必须立即处理' },
    { id: 'abg', n: '动脉血气分析', g: 'poct', delay: 10, desc: 'pH / PaO₂ / PaCO₂ / HCO₃⁻ / 乳酸 / 氧合' },
    { id: 'lytes', n: '电解质（K/Na/Ca/Mg/P）', g: 'poct', delay: 12, desc: '钾、钠、钙、镁、磷，心律失常的常见根因' },
    { id: 'lactate', n: '乳酸', g: 'poct', delay: 8, desc: '组织低灌注与休克严重度' },
    { id: 'cbc', n: '血常规', g: 'poct', delay: 15, desc: 'Hb / WBC / PLT / 中性粒细胞' },
    { id: 'coags', n: '凝血功能', g: 'poct', delay: 18, desc: 'PT / INR / APTT / 纤维蛋白原 / D-二聚体' },
    { id: 'troponin', n: '心肌标志物（肌钙蛋白/BNP）', g: 'poct', delay: 20, desc: '心肌损伤与心衰负荷' },
    { id: 'renal', n: '肾功能（肌酐/尿素）', g: 'poct', delay: 20, desc: '肾小球滤过与尿毒症负荷' },
    { id: 'liver', n: '肝功能（ALT/胆红素/血氨）', g: 'poct', delay: 22, desc: '肝细胞损伤、胆汁淤积、肝性脑病' },
    { id: 'lipase', n: '胰酶（淀粉酶/脂肪酶）', g: 'poct', delay: 25, desc: '急性胰腺炎的证据' },
    { id: 'pct', n: '感染指标（WBC/CRP/PCT）', g: 'poct', delay: 20, desc: '细菌感染与脓毒症可能性' },
    { id: 'ketone', n: '血酮 / 渗透压', g: 'poct', delay: 10, desc: '糖尿病酮症与高渗状态' },
    { id: 'urine', n: '尿常规', g: 'poct', delay: 15, desc: '蛋白、红细胞、酮体、肌红蛋白' },
    { id: 'preg', n: '尿妊娠试验', g: 'poct', delay: 10, desc: '育龄女性腹痛/休克必须排除' },
    { id: 'tox', n: '毒物筛查（尿液/血液）', g: 'lab', delay: 30, desc: '阿片、苯二氮䓬、三环类、农药、醇类…' },
    { id: 'cohb', n: '碳氧血红蛋白 COHb', g: 'lab', delay: 8, desc: '一氧化碳中毒，脉搏血氧可假性正常' },
    { id: 'methb', n: '高铁血红蛋白 MetHb', g: 'lab', delay: 8, desc: '亚硝酸盐/氧化剂中毒，SpO₂ 与 PaO₂ 不匹配' },
    { id: 'che', n: '胆碱酯酶活性', g: 'lab', delay: 15, desc: '有机磷中毒的诊断与分级' },
    { id: 'apap', n: '对乙酰氨基酚血药浓度', g: 'lab', delay: 30, desc: '过量后 4 小时起有解毒指征判断价值' },
    { id: 'osmol', n: '渗透压间隙', g: 'lab', delay: 15, desc: '甲醇 / 乙二醇 / 异丙醇等中毒的线索' },
    { id: 'bloodtype', n: '血型鉴定（ABO/Rh）', g: 'lab', delay: 10, desc: '输血前必须核对' },
    { id: 'crossmatch', n: '交叉配血试验', g: 'lab', delay: 20, desc: '主侧/次侧配血，避免急性溶血' },
    { id: 'culture', n: '血培养 + 涂片', g: 'lab', delay: 40, desc: '留取双套血培养，指导抗生素降阶梯' },
    { id: 'xray', n: '床旁胸片', g: 'imaging', delay: 20, desc: '肺实变、气胸、胸腔积液、心影' },
    { id: 'us', n: '床旁超声（腹部/FAST）', g: 'imaging', delay: 20, desc: '腹腔积液、胆囊、阑尾、肾积水、宫外孕' },
    { id: 'echo', n: '床旁超声心动图', g: 'imaging', delay: 25, desc: 'EF、节段运动、心包积液、容量状态' },
    { id: 'ct_head', n: '头颅 CT（平扫）', g: 'imaging', delay: 35, desc: '出血、梗死、脑水肿、占位' },
    { id: 'ct_abdomen', n: '腹部 CT（增强）', g: 'imaging', delay: 40, desc: '脏器损伤、穿孔、梗阻、脓肿' },
    { id: 'ct_chest', n: '胸部 CT（增强）', g: 'imaging', delay: 40, desc: '肺栓塞、夹层、实变、气胸' },
    { id: 'lp', n: '腰椎穿刺', g: 'special', delay: 40, desc: '脑膜炎、蛛网膜下腔出血的脑脊液证据' },
    { id: 'endoscopy', n: '急诊胃镜', g: 'special', delay: 30, desc: '上消化道出血的定位与止血' },
    { id: 'bronchoscopy', n: '床旁支气管镜', g: 'special', delay: 35, desc: '气道分泌物、误吸、肺不张' },

    /* ---- v2.8 新增：补齐「穿刺/内分泌/定位」这几类常被问到、但原来开不出来的检查 ---- */
    { id: 'vbg', n: '静脉血气分析', g: 'poct', delay: 8, desc: 'pH / PCO₂ / HCO₃⁻ / BE / 乳酸 / 电解质，无动脉穿刺时替代' },
    { id: 'ck', n: '肌酸激酶 CK + 肌红蛋白', g: 'poct', delay: 10, desc: '横纹肌溶解、挤压伤、长时间制动' },
    { id: 'hcg', n: '血 β-hCG（定量）', g: 'poct', delay: 15, desc: '比尿妊娠试验更早、可定量随访' },
    { id: 'urine_na', n: '尿钠 / 尿渗透压 / FENa', g: 'lab', delay: 25, desc: '鉴别肾前性（<1%）与肾性（>2%）急性肾损伤' },
    { id: 'cortisol', n: '皮质醇（晨 8 时）', g: 'lab', delay: 45, desc: '肾上腺危象、长期激素后的肾上腺抑制' },
    { id: 'tft', n: '甲状腺功能（TSH / FT4）', g: 'lab', delay: 60, desc: '甲亢危象、黏液性水肿昏迷' },
    { id: 'hba1c', n: '糖化血红蛋白 HbA1c', g: 'lab', delay: 30, desc: '区分糖尿病背景与应激性高血糖' },
    { id: 'xray_abd', n: '腹部立位平片', g: 'imaging', delay: 25, desc: '膈下游离气体、肠梗阻气液平、阳性结石' },
    { id: 'xray_pelvis', n: '骨盆 / 股骨 X 线', g: 'imaging', delay: 25, desc: '骨盆与长骨骨折——隐匿性大出血的常见来源' },
    { id: 'us_dvt', n: '下肢静脉超声', g: 'imaging', delay: 30, desc: '深静脉血栓（术后、制动、肿瘤患者）' },
    { id: 'mri_brain', n: '头颅 MRI（DWI）', g: 'imaging', delay: 70, desc: '超早期脑梗死与脑干病变，CT 阴性的补充' },
    { id: 'peri', n: '心包穿刺（诊断 + 引流）', g: 'special', delay: 30, desc: '心包填塞减压，同时送检积液性质' },
    { id: 'thora', n: '胸腔穿刺（诊断 + 引流）', g: 'special', delay: 30, desc: '胸腔积液 / 脓胸 / 血胸的性质判定与减压' },
    { id: 'para', n: '腹腔穿刺（诊断）', g: 'special', delay: 25, desc: '腹腔积血、腹水性质、自发性腹膜炎' },
    /* 皮试：开单时输入药名，5 秒出结果（阴性/阳性） */
    { id: 'skin_test', n: '皮试（药物过敏试验）', g: 'poct', delay: 5, param: 'drug',
      desc: '输入药名，5 秒出结果：阴性可常规使用，阳性禁用并换药' }
  ];
  M.EXAM_LIB = LIB;
  M.EXAM_GROUPS = [
    { id: 'poct', n: '床旁即时检验', hint: '3–25 秒回报，先做这些' },
    { id: 'lab', n: '实验室检查', hint: '毒物 / 血型 / 培养' },
    { id: 'imaging', n: '影像检查', hint: '20–40 秒，需要搬运' },
    { id: 'special', n: '特殊操作', hint: '有创检查，回报较慢' }
  ];
  function examDef(id) {
    for (var i = 0; i < LIB.length; i++) if (LIB[i].id === id) return LIB[i];
    return null;
  }
  M.examDef = examDef;

  /* ================= 小工具 ================= */
  function f(x, d) {
    if (x === undefined || x === null || !isFinite(x)) return '—';
    return (+x).toFixed(d === undefined ? 0 : d);
  }
  function flagOf(val, lo, hi, critLo, critHi) {
    if (critLo !== undefined && critLo !== null && val <= critLo) return 'crit';
    if (critHi !== undefined && critHi !== null && val >= critHi) return 'crit';
    if (lo !== undefined && lo !== null && val < lo) return 'lo';
    if (hi !== undefined && hi !== null && val > hi) return 'hi';
    return 'ok';
  }
  function R(name, val, unit, lo, hi, dec, critLo, critHi) {
    /* 定性结果（阳性/阴性、血型、培养所见）直接显示文字，不能被格式化成「—」 */
    if (typeof val === 'string') {
      return { n: name, v: val, raw: val, u: unit || '', ref: '', flag: 'ok' };
    }
    var v = (typeof val === 'number' && isFinite(val)) ? val : null;
    return {
      n: name, v: v === null ? '—' : f(v, dec), raw: v, u: unit || '',
      ref: (lo === null || lo === undefined ? '' : lo) + (hi === null || hi === undefined ? '' : '–' + hi),
      flag: v === null ? 'ok' : flagOf(v, lo, hi, critLo, critHi)
    };
  }
  function lab(sim, k) {
    var d = sim.disease && sim.disease.def;
    var dl = (d && d.labs) || {};
    if (dl[k] !== undefined && dl[k] !== null) return dl[k];
    /* 旧数据里的肌酸激酶写法 */
    if (k === 'ck' && dl.creatine_kinase !== undefined) return dl.creatine_kinase;
    /* 旧数据里的 PaCO₂ 写法 */
    if (k === 'paco2' && dl.pco2 !== undefined) return dl.pco2;
    return undefined;
  }
  function v(sim, k) { return sim.v[k]; }
  function creat(sim) {
    var c = lab(sim, 'creatinine');
    if (c !== undefined) return c;
    return Math.round(72 + (100 - v(sim, 'renal')) * 6.2 + Math.max(0, v(sim, 'lactate') - 1) * 10);
  }
  function pctVal(sim) {
    var p = lab(sim, 'pct');
    if (p !== undefined) return p;
    var t = v(sim, 'temp'), w = v(sim, 'wbc'), im = v(sim, 'immune'), l = v(sim, 'lactate');
    return +(0.05 + Math.max(0, t - 37.8) * 1.7 + Math.max(0, w - 10) * 0.13 +
      (100 - im) * 0.012 + Math.max(0, l - 2) * 0.20).toFixed(2);
  }
  function crpVal(sim) {
    var c = lab(sim, 'crp');
    if (c !== undefined) return c;
    return Math.round(3 + Math.max(0, v(sim, 'temp') - 37.5) * 28 + Math.max(0, v(sim, 'wbc') - 10) * 2.4);
  }
  function trop(sim) {
    var t = lab(sim, 'troponin');
    if (t !== undefined) return t;
    var cor = v(sim, 'coronary'), ct = v(sim, 'contractility');
    return +(0.006 + Math.max(0, 100 - cor) * 0.028 + Math.max(0, 60 - ct) * 0.006).toFixed(2);
  }
  function bnp(sim) {
    var b = lab(sim, 'bnp');
    if (b !== undefined) return b;
    return Math.round(40 + Math.max(0, 100 - v(sim, 'contractility')) * 16 + Math.max(0, v(sim, 'volume') - 5200) * 0.35);
  }
  function ddimer(sim) {
    var d = lab(sim, 'd_dimer');
    if (d !== undefined) return d;
    return +Math.max(0.12, 0.18 + (100 - v(sim, 'clotting')) * 0.045 + Math.max(0, v(sim, 'inr') - 1) * 0.9 +
      Math.min(3, (sim.inflam || 0) * 0.02)).toFixed(2);
  }
  /* Henderson–Hasselbalch：HCO₃⁻ = 0.03 × PaCO₂ × 10^(pH−6.1) */
  function hco3(sim) {
    var ph = v(sim, 'ph'), pco2 = v(sim, 'paco2');
    return Math.round(clamp(0.03 * pco2 * Math.pow(10, ph - 6.1), 2, 45));
  }
  /* 碱剩余（Siggaard-Andersen 简化式，mmol/L） */
  function baseExcess(sim) {
    return +(0.93 * (hco3(sim) - 24.4) + 14.8 * (v(sim, 'ph') - 7.4)).toFixed(1);
  }
  /* 阴离子间隙：Na − (Cl + HCO₃)，Cl 取 102 mmol/L 的近似值 */
  function anionGap(sim) {
    return Math.round(v(sim, 'na') - 104 - hco3(sim));
  }
  function pao2(sim) { return Math.round(v(sim, 'pao2')); }
  function ekgText(sim) {
    if (M.ecgRead) return M.ecgRead(sim);
    var nm = (M.RHY_NAME && M.RHY_NAME[sim.rhythm]) || sim.rhythm;
    return '心律：' + nm + '，心率 ' + Math.round(v(sim, 'hr')) + ' bpm。';
  }

  /* ================= 单项检查的报告生成 ================= */
  function build(sim, id, param) {
    var d = sim.disease && sim.disease.def;
    var ex = (d && d.exam) || {};
    var out = { rows: [], text: '', clue: '', organs: [], crit: false };
    function addRow(r) { out.rows.push(r); if (r.flag === 'crit') out.crit = true; }
    function addClue(t, organs) {
      if (!t) return;
      out.clue = out.clue ? out.clue + '；' + t : t;
      (organs || []).forEach(function (o) { if (out.organs.indexOf(o) < 0) out.organs.push(o); });
    }
    function summarize() {
      var bad = out.rows.filter(function (r) { return r.flag !== 'ok'; }).map(function (r) {
        return r.n + ' ' + r.v + r.u + (r.flag === 'hi' || r.flag === 'crit' ? '↑' : '↓');
      });
      out.text = bad.length ? ('异常：' + bad.join('、')) : '未见明显异常';
    }

    switch (id) {
      case 'ecg12': {
        var nm = (M.RHY_NAME && M.RHY_NAME[sim.rhythm]) || sim.rhythm;
        var met = M.ecgMetrics ? M.ecgMetrics(sim) : {};
        /* 心脏停搏 / 室颤：没有可测量的间期，报「—」而不是编一个正常值 */
        var gone = !!met.noBeat;
        addRow(R('心率', gone ? 0 : met.hr, 'bpm', 50, 110, 0, 30, 180));
        addRow(R('PR 间期', (gone || !met.pr) ? null : met.pr, 'ms', 120, 200, 0, null, 280));
        addRow(R('QRS 时限', (gone || !met.qrs) ? null : met.qrs, 'ms', 60, 110, 0, null, 160));
        addRow(R('QTc', (gone || !met.qtc) ? null : met.qtc, 'ms', 350, 460, 0, null, 520));
        out.text = ekgText(sim);
        if (ex.ecg) out.text = ex.ecg + '（' + out.text + '）';
        var cor = v(sim, 'coronary');
        if (cor < 70) addClue('ST-T 改变提示心肌缺血/损伤，冠脉灌注仅 ' + Math.round(cor) + '%', ['heart']);
        if (v(sim, 'k') > 5.3) addClue('高钾心电图表现（T 波高尖、QRS 增宽），对应肾脏排钾障碍或补钾过量', ['kidney', 'heart']);
        if ((v(sim, 'qt') || 400) > 480) addClue('QTc 延长，注意低钾/低镁/低钙与致心律失常药物', ['heart']);
        break;
      }
      case 'glucose': {
        addRow(R('血糖', v(sim, 'glucose'), 'mmol/L', 3.9, 7.8, 1, 2.8, 20));
        out.text = v(sim, 'glucose') < 3.9 ? '低血糖，立即口服/静推葡萄糖' :
          v(sim, 'glucose') > 11 ? '高血糖，需查血酮与渗透压' : '血糖在可接受范围';
        if (v(sim, 'glucose') < 3.5) addClue('低血糖可致意识障碍、抽搐与交感兴奋', ['brain', 'endocrine']);
        if (v(sim, 'glucose') > 15) addClue('高血糖 → 渗透性利尿、脱水与酮症风险', ['endocrine', 'kidney']);
        break;
      }
      case 'abg': {
        addRow(R('pH', v(sim, 'ph'), '', 7.35, 7.45, 2, 7.10, 7.60));
        addRow(R('PaO₂', pao2(sim), 'mmHg', 80, 100, 0, 50, null));
        addRow(R('PaCO₂', v(sim, 'paco2'), 'mmHg', 35, 45, 0, null, 65));
        addRow(R('HCO₃⁻', hco3(sim), 'mmol/L', 22, 26, 0, 10, 40));
        addRow(R('碱剩余 BE', baseExcess(sim), 'mmol/L', -2, 2, 1, -10, 10));
        addRow(R('阴离子间隙', anionGap(sim), 'mmol/L', 8, 12, 0, null, 20));
        addRow(R('乳酸', v(sim, 'lactate'), 'mmol/L', 0.5, 2.2, 1, null, 4));
        addRow(R('SaO₂', v(sim, 'spo2'), '%', 94, 100, 0, null, null));
        var l = v(sim, 'lactate'), ph = v(sim, 'ph');
        out.text = (ph < 7.35 ? '代谢性酸中毒' : ph > 7.45 ? '碱中毒' : '酸碱度正常') +
          (l > 2 ? '，乳酸 ' + l.toFixed(1) + ' 提示组织低灌注' : '') +
          (v(sim, 'paco2') > 50 ? '，CO₂ 潴留提示通气不足' : '');
        if (l > 2.5) addClue('乳酸升高 → 休克 / 低灌注 / 脓毒症，需找感染源或出血点', ['heart', 'lung']);
        if (ph < 7.25) addClue('严重酸中毒抑制心肌收缩与升压药反应', ['heart', 'kidney']);
        if (v(sim, 'paco2') > 55) addClue('CO₂ 潴留 → 通气衰竭，考虑气道支持', ['lung', 'brain']);
        break;
      }
      case 'lytes': {
        addRow(R('钾 K⁺', v(sim, 'k'), 'mmol/L', 3.5, 5.3, 1, 2.5, 6.5));
        addRow(R('钠 Na⁺', v(sim, 'na'), 'mmol/L', 135, 147, 0, 120, 160));
        addRow(R('钙 Ca²⁺', v(sim, 'ca'), 'mmol/L', 2.10, 2.60, 2, 1.60, 3.50));
        addRow(R('镁 Mg²⁺', v(sim, 'mg'), 'mmol/L', 0.75, 1.05, 2, 0.40, 2.00));
        addRow(R('磷', v(sim, 'phos'), 'mmol/L', 0.80, 1.45, 2, 0.30, 2.60));
        addRow(R('阴离子间隙', anionGap(sim), 'mmol/L', 8, 12, 0, null, 20));
        out.text = (v(sim, 'k') > 5.3 ? '高钾' : v(sim, 'k') < 3.5 ? '低钾' : '血钾正常') +
          (v(sim, 'ca') < 2.1 ? '，低钙' : '') + (v(sim, 'mg') < 0.75 ? '，低镁' : '');
        if (v(sim, 'k') > 5.5) addClue('高钾 → 肾排钾障碍 / 组织破坏 / 补钾过量，随时可致室颤', ['kidney', 'heart']);
        if (v(sim, 'k') < 3.2) addClue('低钾 → 心律失常、乏力、肠麻痹；需同时补镁', ['heart', 'gut']);
        if (v(sim, 'ca') < 1.9) addClue('低钙 → QT 延长、抽搐；胰腺炎/大量输血/碱中毒常见', ['heart', 'endocrine']);
        break;
      }
      case 'lactate': {
        addRow(R('乳酸', v(sim, 'lactate'), 'mmol/L', 0.5, 2.2, 1, null, 4));
        out.text = v(sim, 'lactate') > 4 ? '乳酸显著升高，提示休克/严重低灌注' : v(sim, 'lactate') > 2 ? '乳酸轻度升高' : '乳酸正常';
        if (v(sim, 'lactate') > 2) addClue('乳酸清除率是复苏有效性的核心指标', ['heart']);
        break;
      }
      case 'cbc': {
        addRow(R('血红蛋白', v(sim, 'hb'), 'g/dL', 11, 17, 1, 7, 20));
        addRow(R('白细胞', v(sim, 'wbc'), '×10⁹/L', 4, 11, 1, 1.5, 25));
        addRow(R('血小板', v(sim, 'plt'), '×10⁹/L', 100, 350, 0, 40, 800));
        out.text = (v(sim, 'hb') < 10 ? '贫血' : '血红蛋白正常') +
          (v(sim, 'wbc') > 12 ? '，白细胞升高提示感染/炎症' : v(sim, 'wbc') < 4 ? '，白细胞减少' : '') +
          (v(sim, 'plt') < 100 ? '，血小板减少' : '');
        if (v(sim, 'hb') < 8) addClue('贫血 → 氧输送下降，活动性出血需输血', ['blood']);
        if (v(sim, 'plt') < 60) addClue('血小板减少 → 出血/ DIC / 脾亢 / 药物性', ['blood', 'liver']);
        break;
      }
      case 'coags': {
        addRow(R('INR', v(sim, 'inr'), '', 0.8, 1.2, 2, null, 3));
        addRow(R('血小板', v(sim, 'plt'), '×10⁹/L', 100, 350, 0, 40, 800));
        addRow(R('D-二聚体', ddimer(sim), 'mg/L FEU', 0, 0.5, 2, null, 5));
        addRow(R('纤维蛋白原', Math.round(clamp(400 - (100 - v(sim, 'clotting')) * 3.2, 50, 500)), 'mg/dL', 200, 400, 0, 100, null));
        out.text = (v(sim, 'inr') > 1.5 ? '凝血酶原时间延长' : '凝血指标基本正常') +
          (ddimer(sim) > 2 ? '，D-二聚体升高（血栓/ DIC / 炎症）' : '');
        if (v(sim, 'inr') > 1.8 || v(sim, 'clotting') < 45) addClue('凝血障碍 → 肝合成功能下降 / DIC / 抗凝过量，活动性出血风险高', ['liver', 'blood']);
        break;
      }
      case 'troponin': {
        addRow(R('高敏肌钙蛋白', trop(sim), 'ng/mL', 0, 0.04, 2, null, 0.5));
        addRow(R('BNP', bnp(sim), 'pg/mL', 0, 100, 0, null, 900));
        out.text = (trop(sim) > 0.04 ? '肌钙蛋白升高，提示心肌损伤' : '肌钙蛋白阴性') +
          (bnp(sim) > 400 ? '；BNP 升高提示心衰/容量负荷' : '');
        if (trop(sim) > 0.1) addClue('心肌损伤 → 急性冠脉综合征 / 心肌炎 / 肺栓塞 / 脓毒症心肌病', ['heart']);
        break;
      }
      case 'renal': {
        addRow(R('肌酐', creat(sim), 'µmol/L', 60, 110, 0, null, 400));
        addRow(R('尿素', Math.round(3.2 + (100 - v(sim, 'renal')) * 0.42), 'mmol/L', 2.5, 7.0, 1, null, 30));
        addRow(R('尿量', v(sim, 'urine'), 'mL/h', 30, 120, 0, 8, null));
        addRow(R('估算 eGFR', Math.round(clamp(120 - (100 - v(sim, 'renal')) * 1.05, 3, 130)), 'mL/min', 90, 130, 0, 15, null));
        out.text = v(sim, 'renal') < 45 ? '肾功能不全（肾前性/肾性需结合尿钠与容量）' : '肾功能大致正常';
        if (v(sim, 'renal') < 45) addClue('肾功能下降 → 排钾排酸障碍、药物蓄积；查容量与肾毒性药物', ['kidney']);
        break;
      }
      case 'liver': {
        addRow(R('ALT', lab(sim, 'alt') !== undefined ? lab(sim, 'alt') : Math.round(24 + (100 - v(sim, 'hepatic')) * 2.6), 'U/L', 0, 40, 0, null, 1000));
        addRow(R('总胆红素', lab(sim, 'bilirubin') !== undefined ? lab(sim, 'bilirubin') : Math.round(10 + (100 - v(sim, 'hepatic')) * 0.9), 'µmol/L', 0, 21, 0, null, 200));
        addRow(R('血氨', v(sim, 'ammonia'), 'µmol/L', 11, 35, 0, null, 100));
        addRow(R('INR', v(sim, 'inr'), '', 0.8, 1.2, 2, null, 3));
        out.text = (v(sim, 'hepatic') < 45 ? '肝功能不全' : '肝功能基本正常') +
          (v(sim, 'ammonia') > 60 ? '；血氨升高，警惕肝性脑病' : '');
        if (v(sim, 'hepatic') < 45) addClue('肝功能不全 → 凝血因子↓、低血糖、肝性脑病、药物半衰期延长', ['liver', 'brain', 'blood']);
        if (v(sim, 'ammonia') > 60) addClue('血氨升高 → 肝性脑病，需乳果糖/利福昔明并去除消化道积血', ['brain', 'liver']);
        break;
      }
      case 'lipase': {
        var amy = lab(sim, 'amylase') !== undefined ? lab(sim, 'amylase') : Math.round(60 + Math.max(0, v(sim, 'pain') - 30) * 2 + (d && /pancreatitis/.test(d.id) ? 500 : 0));
        var lip = lab(sim, 'lipase') !== undefined ? lab(sim, 'lipase') : Math.round(50 + Math.max(0, v(sim, 'pain') - 30) * 3 + (d && /pancreatitis/.test(d.id) ? 900 : 0));
        addRow(R('淀粉酶', amy, 'U/L', 30, 110, 0, null, 500));
        addRow(R('脂肪酶', lip, 'U/L', 10, 60, 0, null, 300));
        out.text = (amy > 300 || lip > 200) ? '胰酶显著升高，支持急性胰腺炎' : '胰酶正常';
        if (amy > 300 || lip > 200) addClue('胰酶升高 → 胰腺炎；注意低钙、ARDS 与第三间隙丢失', ['gut', 'lung', 'endocrine']);
        break;
      }
      case 'pct': {
        addRow(R('白细胞', v(sim, 'wbc'), '×10⁹/L', 4, 11, 1, 1.5, 25));
        addRow(R('CRP', crpVal(sim), 'mg/L', 0, 10, 0, null, 100));
        addRow(R('降钙素原 PCT', pctVal(sim), 'ng/mL', 0, 0.5, 2, null, 2));
        out.text = pctVal(sim) > 2 ? 'PCT 明显升高，高度提示细菌感染/脓毒症' : pctVal(sim) > 0.5 ? 'PCT 轻度升高' : '感染指标不高';
        if (pctVal(sim) > 2) addClue('PCT > 2 → 脓毒症可能性大，1 小时内抗生素 + 培养 + 液体复苏', ['blood']);
        break;
      }
      case 'ketone': {
        var ket = lab(sim, 'ketone') !== undefined ? lab(sim, 'ketone') : +(Math.max(0, v(sim, 'glucose') - 9) * 0.55).toFixed(1);
        addRow(R('血酮', ket, 'mmol/L', 0, 0.6, 1, null, 3));
        addRow(R('血浆渗透压', v(sim, 'osmo'), 'mOsm/kg', 280, 300, 0, null, 320));
        out.text = ket > 1.5 ? '血酮升高，考虑糖尿病酮症' : '血酮不高';
        if (ket > 1.5) addClue('酮症酸中毒 → 补液 + 胰岛素 + 补钾，注意脑水肿', ['endocrine']);
        break;
      }
      case 'urine': {
        var myo = v(sim, 'ck') > 1000;
        addRow(R('尿蛋白', myo ? '+++' : v(sim, 'renal') < 50 ? '+' : '阴性', '', null, null, 0));
        addRow(R('尿红细胞', v(sim, 'hb') < 9 ? '++' : '0–2', '/HP', null, null, 0));
        addRow(R('尿酮体', v(sim, 'glucose') > 13 ? '+' : '阴性', '', null, null, 0));
        out.text = myo ? '尿色呈酱油色，肌红蛋白阳性，考虑横纹肌溶解' : (v(sim, 'renal') < 50 ? '尿蛋白阳性，结合少尿警惕肾损伤' : '尿常规未见明显异常');
        if (myo) addClue('肌红蛋白尿 → 横纹肌溶解，需大量补液碱化尿液', ['kidney', 'muscle']);
        break;
      }
      case 'preg': {
        var female = sim.patient.sex === '女';
        var preg = female && d && /妊娠|异位妊娠|胎盘|子痫|产后/.test(d.name || '');
        addRow(R('尿 hCG', preg ? '阳性' : '阴性', '', null, null, 0));
        out.text = preg ? '妊娠试验阳性，需按孕产妇流程处理' : '妊娠试验阴性';
        if (preg) addClue('育龄女性 + 休克/腹痛 → 必须排除异位妊娠破裂', ['obstetric']);
        break;
      }
      case 'tox': {
        var map = {
          organophosphate_poisoning: '有机磷 / 氨基甲酸酯（胆碱酯酶抑制）',
          opioid_overdose: '阿片类（吗啡/海洛因/芬太尼）',
          benzodiazepine_overdose: '苯二氮䓬类',
          severe_alcohol_intoxication: '乙醇',
          carbon_monoxide_poisoning: '碳氧血红蛋白（CO）',
          methanol_poisoning: '甲醇',
          ethylene_glycol_poisoning: '乙二醇',
          cyanide_poisoning: '氰化物 / 苦杏仁',
          acetaminophen_overdose: '对乙酰氨基酚',
          tca_overdose: '三环类抗抑郁药',
          paraquat_poisoning: '百草枯',
          mushroom_poisoning: '鹅膏毒肽',
          digoxin_toxicity: '强心苷（地高辛）',
          methemoglobinemia: '亚硝酸盐 / 氧化剂',
          snake_bite: '蛇毒（血液毒素）'
        };
        var pid = sim.poisonId || (d && d.id);
        var hit = map[pid] || '';
        addRow(R('常见毒物筛查', hit ? '阳性' : '阴性', '', null, null, 0));
        if (hit) out.text = '检出：' + hit;
        else out.text = '常见毒物筛查阴性（不能排除未覆盖的新型毒物）';
        if (hit) addClue('毒物筛查阳性：' + hit + '，按中毒处理原则稳定气道/循环并给拮抗剂', ['brain', 'heart']);
        break;
      }
      case 'cohb': {
        var co = (d && d.id === 'carbon_monoxide_poisoning') ? 32 : 1.5;
        addRow(R('碳氧血红蛋白', co, '%', 0, 3, 1, null, 15));
        out.text = co > 10 ? 'COHb 明显升高，诊断一氧化碳中毒' : 'COHb 正常';
        if (co > 10) addClue('COHb↑ → 高浓度氧疗，严重者高压氧；脉搏血氧可假性正常', ['blood', 'brain']);
        break;
      }
      case 'methb': {
        var mh = (d && d.id === 'methemoglobinemia') ? 32 : 0.8;
        addRow(R('高铁血红蛋白', mh, '%', 0, 1.5, 1, null, 10));
        out.text = mh > 10 ? 'MetHb 明显升高，血液呈巧克力色' : 'MetHb 正常';
        if (mh > 10) addClue('MetHb↑ → 亚甲蓝 1–2 mg/kg；SpO₂ 低但 PaO₂ 正常是其特点', ['blood']);
        break;
      }
      case 'che': {
        var che = (d && d.id === 'organophosphate_poisoning') ? 18 : 85;
        addRow(R('胆碱酯酶活性', che, '%', 70, 120, 0, 30, null));
        out.text = che < 30 ? '胆碱酯酶显著抑制，符合有机磷中毒' : '胆碱酯酶活性正常';
        if (che < 30) addClue('胆碱酯酶抑制 → 阿托品 + 解磷定，清除污染衣物', ['brain', 'lung']);
        break;
      }
      case 'apap': {
        var ap = (d && d.id === 'acetaminophen_overdose') ? 165 : 4;
        addRow(R('对乙酰氨基酚浓度', ap, 'mg/L', 0, 20, 0, null, 150));
        out.text = ap > 100 ? '血药浓度处于中毒范围，尽早 N-乙酰半胱氨酸' : '血药浓度未达中毒阈值';
        if (ap > 100) addClue('对乙酰氨基酚过量 → N-乙酰半胱氨酸，越早越好（8 小时内最佳）', ['liver']);
        break;
      }
      case 'osmol': {
        var gap = Math.round(v(sim, 'osmo') - (2 * v(sim, 'na') + v(sim, 'glucose')));
        if (d && /methanol|ethylene_glycol/.test(d.id)) gap = Math.max(gap, 28);
        addRow(R('渗透压间隙', gap, 'mOsm/kg', 0, 10, 0, null, 25));
        out.text = gap > 15 ? '渗透压间隙增高，提示醇类中毒可能' : '渗透压间隙正常';
        if (gap > 15) addClue('渗透压间隙↑ → 甲醇/乙二醇/异丙醇；尽早甲吡唑 + 碳酸氢钠', ['brain', 'kidney']);
        break;
      }
      case 'bloodtype': {
        addRow(R('ABO 血型', sim.patient.abo, '', null, null, 0));
        addRow(R('Rh', sim.patient.rh, '', null, null, 0));
        out.text = '患者血型 ' + sim.patient.abo + sim.patient.rh;
        break;
      }
      case 'crossmatch': {
        addRow(R('主侧配血', '相合', '', null, null, 0));
        addRow(R('次侧配血', '相合', '', null, null, 0));
        out.text = '与同型供血者交叉配血相合；输血前仍需双人核对';
        break;
      }
      case 'culture': {
        var positive = (sim.inflam || 0) > 35 || v(sim, 'temp') > 38.3;
        addRow(R('血培养', positive ? '送检中（涂片见革兰阳性球菌）' : '送检中（48h 后回报）', '', null, null, 0));
        out.text = positive ? '涂片提示细菌感染，先按经验覆盖，待药敏降阶梯' : '已留取双套血培养';
        if (positive) addClue('血培养阳性 → 脓毒症，寻找感染源（肺/腹/尿/导管）', ['blood']);
        break;
      }
      case 'xray': {
        var lines = [];
        if (ex.xray) lines.push(ex.xray);
        if (v(sim, 'spo2') < 92) lines.push('双肺透亮度减低，可见斑片状渗出影');
        if (v(sim, 'volume') > 6000) lines.push('肺门影增宽、上肺血管纹理增粗，提示肺淤血');
        if (v(sim, 'contractility') < 45) lines.push('心影增大');
        if (v(sim, 'airway') < 60) lines.push('气管受压/偏移，注意气道梗阻');
        if (v(sim, 'hb') < 8) lines.push('双肺野透亮度增高（贫血）');
        if (!lines.length) lines.push('双肺纹理清晰，心影大小正常，肋膈角锐利');
        out.text = lines.join('；');
        if (v(sim, 'spo2') < 92) addClue('胸片渗出影 → 肺炎/肺水肿/ARDS，结合氧合与容量判断', ['lung']);
        break;
      }
      case 'us': {
        var ul = [];
        if (ex.us) ul.push(ex.us);
        if (/胆囊|胆道/.test((d && d.site) || '')) ul.push('胆囊壁增厚 > 4 mm，可见结石强回声伴声影');
        if (/阑尾/.test((d && d.site) || '')) ul.push('右下腹管状结构直径 9 mm，壁增厚，周围脂肪回声增强');
        if (/肾|输尿管/.test((d && d.site) || '')) ul.push('肾集合系统分离，输尿管上段扩张');
        if (/子宫|卵巢|妊娠/.test((d && d.site) || '')) ul.push('盆腔混合回声包块伴积液，考虑异位妊娠');
        if (sim.bleeding > 0) ul.push('腹腔/盆腔可见游离液体，FAST 阳性');
        if (v(sim, 'volume') > 5800) ul.push('下腔静脉充盈固定，容量过负荷');
        else if (v(sim, 'volume') < 4200) ul.push('下腔静脉塌陷，容量不足');
        if (!ul.length) ul.push('腹腔各脏器未见明显异常，未见游离液体');
        out.text = ul.join('；');
        if (sim.bleeding > 0) addClue('FAST 阳性 → 腹腔内出血，需止血/手术并输血', ['blood']);
        break;
      }
      case 'echo': {
        var ef = Math.round(clamp(18 + v(sim, 'contractility') * 0.46, 5, 78));
        addRow(R('左室射血分数', ef, '%', 55, 70, 0, 15, null));
        addRow(R('心包积液', (d && d.id === 'cardiac_tamponade') ? '中–大量，右室舒张期塌陷' : '未见', '', null, null, 0));
        var tl = [];
        if (ex.us) tl.push(ex.us);
        if (ef < 40) tl.push('左室弥漫性运动减弱');
        if (v(sim, 'volume') < 4200) tl.push('左室舒张末径偏小，容量不足');
        out.text = tl.length ? tl.join('；') : '心脏结构及收缩功能未见明显异常';
        if (ef < 40) addClue('EF 降低 → 心源性休克/心衰，需正性肌力与减容', ['heart']);
        if (d && d.id === 'cardiac_tamponade') addClue('心包积液伴右室塌陷 → 心包填塞，立即心包穿刺引流', ['heart']);
        break;
      }
      case 'ct_head': {
        var cl = [];
        if (ex.ct) cl.push(ex.ct);
        else if (/脑出血|蛛网膜下腔/.test((d && d.name) || '')) cl.push('颅內高密度影，符合急性出血');
        else if (/脑梗死/.test((d && d.name) || '')) cl.push('脑实质低密度区，灰白质分界不清');
        if (v(sim, 'icp') > 25) cl.push('脑沟变浅、脑室受压，提示脑水肿/颅高压');
        if (v(sim, 'pupil') > 5) cl.push('中线结构移位');
        if (!cl.length) cl.push('脑实质未见出血或占位，脑室系统对称');
        out.text = cl.join('；');
        if (v(sim, 'icp') > 25) addClue('颅高压/脑水肿 → 甘露醇/高渗盐水、抬高床头、必要时减压', ['brain']);
        break;
      }
      case 'ct_abdomen': {
        var al = [];
        if (ex.ct) al.push(ex.ct);
        if (sim.bleeding > 0) al.push('腹腔积血，脏器周围可见高密度液体');
        if (v(sim, 'pain') > 55) al.push('病变区域周围脂肪间隙模糊，提示炎症');
        if (!al.length) al.push('肝胆胰脾肾未见明显异常，腹腔无积液');
        out.text = al.join('；');
        if (sim.bleeding > 0) addClue('腹腔积血 → 实质脏器破裂，需手术/介入止血', ['blood']);
        break;
      }
      case 'ct_chest': {
        var tl2 = [];
        if (ex.ct) tl2.push(ex.ct);
        if (/肺栓塞/.test((d && d.name) || '')) tl2.push('肺动脉主干及分支内充盈缺损，右心室扩大');
        if (v(sim, 'spo2') < 90) tl2.push('双肺弥漫磨玻璃影');
        if (!tl2.length) tl2.push('双肺未见明显实变或占位，纵隔结构正常');
        out.text = tl2.join('；');
        if (/肺栓塞/.test((d && d.name) || '')) addClue('CTPA 见充盈缺损 → 肺栓塞，抗凝/溶栓并评估右心负荷', ['lung', 'heart']);
        break;
      }
      case 'lp': {
        var men = d && /meningitis/.test(d.id);
        var sah = d && /subarachnoid/.test(d.id);
        addRow(R('脑脊液外观', men ? '浑浊' : sah ? '均匀血性' : '清亮', '', null, null, 0));
        addRow(R('白细胞', men ? '1200' : sah ? '80' : '2', '/mm³', 0, 5, 0, null, 100));
        addRow(R('蛋白', men ? '1.8' : '0.45', 'g/L', 0.15, 0.45, 2, null, 1.0));
        addRow(R('糖', men ? '2.1' : '3.9', 'mmol/L', 2.8, 4.4, 1, 1.5, null));
        out.text = men ? '外观浑浊、中性粒细胞为主、糖低蛋白高，符合化脓性脑膜炎' :
          sah ? '均匀血性且不凝固，符合蛛网膜下腔出血' : '脑脊液常规生化未见明显异常';
        if (men) addClue('化脓性脑膜炎 → 立即经验性抗生素 + 地塞米松，不能等腰穿结果', ['brain']);
        if (sah) addClue('蛛网膜下腔出血 → 尼莫地平预防血管痉挛，评估介入/夹闭', ['brain']);
        break;
      }
      case 'endoscopy': {
        var gi = d && /upper_gi_bleeding|variceal/.test(d.id);
        out.text = gi ? '胃内大量新鲜积血，可见活动性喷血/渗血病灶，已尝试钛夹与肾上腺素注射' :
          '食管胃十二指肠未见活动性出血或溃疡';
        if (gi) addClue('上消化道出血 → 抑酸 + 生长抑素/特利加压素，内镜下止血', ['gut', 'blood']);
        break;
      }
      case 'bronchoscopy': {
        var asp = v(sim, 'emesis') > 35 && sim.airwayMode === 'none';
        out.text = asp ? '气管支气管内可见食物残渣与脓性分泌物，符合误吸' :
          v(sim, 'secretions') > 40 ? '气道内大量黏稠分泌物，已吸除' : '气道通畅，黏膜光滑';
        if (asp) addClue('误吸 → 气道吸引、抗生素，警惕 ARDS', ['lung']);
        break;
      }
      /* ---- v2.8 新增检查 ---- */
      case 'vbg': {
        var hc0 = hco3(sim), be0 = baseExcess(sim);
        addRow(R('pH（静脉）', +(v(sim, 'ph') - 0.03).toFixed(2), '', 7.32, 7.42, 2, 7.05, 7.55));
        addRow(R('PCO₂（静脉）', Math.round(v(sim, 'paco2') + 5), 'mmHg', 40, 50, 0, null, 70));
        addRow(R('HCO₃⁻', hc0, 'mmol/L', 22, 26, 0, 10, 40));
        addRow(R('碱剩余 BE', be0, 'mmol/L', -2, 2, 1, -10, 10));
        addRow(R('乳酸', v(sim, 'lactate'), 'mmol/L', 0.5, 2.2, 1, null, 4));
        addRow(R('K⁺', v(sim, 'k'), 'mmol/L', 3.5, 5.3, 1, 2.5, 6.5));
        addRow(R('Na⁺', v(sim, 'na'), 'mmol/L', 135, 147, 0, 120, 160));
        addRow(R('阴离子间隙', anionGap(sim), 'mmol/L', 8, 12, 0, null, 20));
        addRow(R('血糖', v(sim, 'glucose'), 'mmol/L', 3.9, 7.8, 1, 2.8, 20));
        out.text = '静脉血气：pH ' + (v(sim, 'ph') - 0.03).toFixed(2) + '，HCO₃⁻ ' + hc0 + ' mmol/L，BE ' + be0 +
          '，乳酸 ' + v(sim, 'lactate').toFixed(1) + ' mmol/L（判读时按静脉 pH 低 0.02–0.04、PCO₂ 高 3–5 mmHg 校正）';
        if (v(sim, 'lactate') > 2) addClue('乳酸升高 → 组织低灌注/无氧代谢，按休克查因', ['heart']);
        if (v(sim, 'k') > 5.5) addClue('高钾 → 肾排钾障碍 / 组织破坏，先稳定心肌膜再排钾', ['kidney', 'heart']);
        break;
      }
      case 'ck': {
        var ck0 = v(sim, 'ck');
        addRow(R('肌酸激酶 CK', ck0, 'U/L', 30, 200, 0, null, 5000));
        addRow(R('肌红蛋白', ck0 > 500 ? Math.round(ck0 * 0.35) : 28, 'ng/mL', 0, 70, 0, null, 500));
        addRow(R('血钾', v(sim, 'k'), 'mmol/L', 3.5, 5.3, 1, 2.5, 6.5));
        addRow(R('肌酐', creat(sim), 'µmol/L', 60, 110, 0, null, 400));
        out.text = ck0 > 5000 ? 'CK 显著升高（>5000 U/L），横纹肌溶解，急性肾损伤风险高' :
          ck0 > 1000 ? 'CK 明显升高，符合横纹肌溶解 / 挤压伤' :
            ck0 > 200 ? 'CK 轻度升高（肌肉损伤、长时间制动、抽搐后）' : 'CK 正常';
        if (ck0 > 1000) addClue('横纹肌溶解 → 大量补液 + 碱化尿液，监测血钾、血钙与肾功能', ['kidney', 'muscle']);
        break;
      }
      case 'hcg': {
        var female0 = sim.patient.sex === '女';
        var preg0 = female0 && d && /妊娠|异位妊娠|胎盘|子痫|产后/.test(d.name || '');
        var hcgV = female0 ? (preg0 ? 4200 : 1.2) : 0.4;
        addRow(R('血 β-hCG', hcgV, 'mIU/mL', 0, 5, 1, null, 5));
        out.text = !female0 ? '男性 / 非育龄女性：β-hCG 阴性，无妊娠可能' :
          hcgV > 5 ? 'β-hCG 阳性（' + Math.round(hcgV) + ' mIU/mL），提示妊娠' : 'β-hCG 阴性';
        if (female0 && hcgV > 5) addClue('育龄女性 + 腹痛/休克 + β-hCG 阳性 → 首先排除异位妊娠破裂', ['obstetric', 'blood']);
        break;
      }
      case 'urine_na': {
        var prerenal = (v(sim, 'volume') < 4300 || sim.bleeding > 0 || v(sim, 'renal') >= 60);
        var una = prerenal ? 12 : 58, uosm = prerenal ? 620 : 305, fena = prerenal ? 0.6 : 3.2;
        addRow(R('尿钠', una, 'mmol/L', 20, 40, 0, null, null));
        addRow(R('尿渗透压', uosm, 'mOsm/kg', 400, 800, 0, null, null));
        addRow(R('钠排泄分数 FENa', fena, '%', 1, 2, 1, null, null));
        addRow(R('尿肌酐', Math.round(clamp(creat(sim) * 90, 800, 20000)), 'µmol/L', 5000, 18000, 0, null, null));
        out.text = prerenal ? '尿钠低、尿渗透压高、FENa < 1%：符合肾前性（容量不足），补液后肾功能可望恢复' :
          '尿钠高、尿渗透压接近血浆、FENa > 2%：符合肾性（急性肾小管损伤），单纯补液效果差';
        if (prerenal) addClue('肾前性氮质血症 → 先补容量再评估，避免盲目利尿', ['kidney']);
        else addClue('肾性 AKI → 停肾毒性药物、维持灌注压，必要时 CRRT', ['kidney']);
        break;
      }
      case 'cortisol': {
        var lowCor = (d && d.id === 'adrenal_crisis');
        var corV = lowCor ? 3.2 : ((v(sim, 'sbp') < 90 && (sim.inflam || 0) > 30) ? 8.5 : 14.2);
        addRow(R('皮质醇（8:00）', corV, 'µg/dL', 5, 25, 1, 3, null));
        out.text = corV < 5 ? '晨间皮质醇明显降低，提示肾上腺皮质功能不全' :
          corV < 10 ? '皮质醇偏低/临界，需结合 ACTH 与临床（休克对升压药不敏感时尤其要怀疑）' : '皮质醇在正常范围';
        if (corV < 10) addClue('怀疑肾上腺危象 → 立即静推氢化可的松 100 mg，不要等结果', ['endocrine']);
        break;
      }
      case 'tft': {
        var storm = (d && d.id === 'thyroid_storm');
        addRow(R('TSH', storm ? 0.01 : 2.1, 'mIU/L', 0.4, 4.0, 2, null, null));
        addRow(R('游离 T4', storm ? 48 : 15.2, 'pmol/L', 12, 22, 1, null, 40));
        out.text = storm ? 'TSH 抑制、FT4 显著升高，符合甲状腺毒症 / 甲亢危象' : '甲状腺功能未见明显异常';
        if (storm) addClue('甲亢危象 → β 阻滞剂控制心率 + 丙硫氧嘧啶 + 碘剂 + 糖皮质激素，积极降温', ['endocrine', 'heart']);
        break;
      }
      case 'hba1c': {
        var dm = d && /dka|hyperosmolar|diabet/.test(d.id || '');
        var a1c = dm ? 9.4 : (v(sim, 'glucose') > 11 ? 6.1 : 5.4);
        addRow(R('HbA1c', a1c, '%', 4.0, 6.0, 1, null, null));
        out.text = a1c >= 6.5 ? 'HbA1c 升高，提示既往已有糖尿病（本次高血糖不全是应激）' : 'HbA1c 正常，本次高血糖更可能是应激性';
        if (a1c >= 6.5) addClue('糖尿病背景 → 按 DKA / 高渗状态流程补液 + 胰岛素 + 补钾', ['endocrine']);
        break;
      }
      case 'xray_abd': {
        var abL = [];
        if (d && d.id === 'gastric_perforation') abL.push('膈下可见游离气体（新月形透亮影），提示消化道穿孔');
        if (d && d.id === 'intestinal_obstruction') abL.push('肠管扩张伴多个气液平面，呈阶梯状，符合机械性肠梗阻');
        if (d && /stone|chole|choledocho/.test(d.id || '')) abL.push('右上腹可见阳性结石影');
        if (v(sim, 'gut') > 3000) abL.push('胃泡明显增大，胃内容物潴留');
        if (sim.bleeding > 0 && /腹|肝|脾|肾/.test((d && d.site) || '')) abL.push('腹腔内可见液性密度影，提示腹腔积血');
        if (!abL.length) abL.push('膈下未见游离气体，肠管未见明显扩张或气液平');
        out.text = abL.join('；');
        if (d && d.id === 'gastric_perforation') addClue('膈下游离气体 → 消化道穿孔：禁食、胃肠减压、急诊手术', ['gut']);
        if (d && d.id === 'intestinal_obstruction') addClue('肠梗阻 → 禁食减压、补液，警惕绞窄与肠坏死', ['gut']);
        break;
      }
      case 'xray_pelvis': {
        var frac = d && /fracture/.test(d.id || '');
        out.text = frac ? '可见骨皮质断裂与移位（' + (d.name || '骨折') + '），骨盆环 / 股骨完整性受损，注意隐匿性失血'
          : '骨盆环与双侧股骨未见骨折线，关节间隙正常';
        if (frac) addClue('骨盆 / 长骨骨折 → 可丢失数千毫升血液：先固定、输血，警惕脂肪栓塞', ['blood', 'muscle']);
        break;
      }
      case 'us_dvt': {
        var dvt = (sim.postopActive && sim.postopActive.postop_dvt) || (d && d.id === 'dvt') ||
          ((sim.surgeryHistory || []).length > 0 && v(sim, 'hb') < 9);
        out.text = dvt ? '股静脉 / 腘静脉管腔内可见实性回声，压之不变形，血流信号消失，符合深静脉血栓' :
          '双下肢深静脉走行通畅，管腔可压闭，未见血栓回声';
        if (dvt) addClue('深静脉血栓 → 患肢制动抬高、抗凝（低分子肝素），警惕肺栓塞', ['blood', 'lung']);
        break;
      }
      case 'mri_brain': {
        var ci = d && /脑梗死/.test(d.name || '');
        out.text = ci ? 'DWI 见高信号、ADC 低信号，符合超早期脑梗死（CT 常为阴性）' :
          v(sim, 'icp') > 25 ? '脑实质肿胀、脑沟变浅，未见明确急性梗死灶' : '脑实质未见异常信号，DWI 未见弥散受限';
        if (ci) addClue('超早期脑梗死 → 评估溶栓 / 取栓时间窗（4.5 h / 24 h），控制血压与血糖', ['brain']);
        break;
      }
      case 'peri': {
        var tamp = d && d.id === 'cardiac_tamponade';
        addRow(R('心包积液性质', tamp ? '不凝血性' : '少许淡黄色浆液', '', null, null, 0));
        addRow(R('抽出量', tamp ? 180 : 5, 'mL', null, null, 0));
        if (tamp) addRow(R('心包内压力', 18, 'mmHg', null, null, 0));
        out.text = tamp ? '抽出不凝血 180 mL，心包内压力升高，穿刺后血压回升——心包填塞诊断成立' :
          '仅抽出少量浆液性液体，未见填塞证据';
        if (tamp) {
          out.crit = true;
          addClue('心包填塞 → 立即心包穿刺引流，同时补液维持前负荷，备外科开窗', ['heart']);
        }
        break;
      }
      case 'thora': {
        /* 胸腔穿刺要看「有没有积液、是什么性质」，不能只看病名里有没有「肺」字 */
        var hemo0 = sim.bleeding > 0;
        var inf = (sim.inflam || 0) > 35 || (d && /肺炎|脓胸|ARDS|结核|肺脓肿/.test(d.name || ''));
        var chf = v(sim, 'contractility') < 45 && v(sim, 'volume') > 5300;
        var wet = hemo0 || inf || chf || v(sim, 'spo2') < 90;
        if (d && d.id === 'pulmonary_embolism') {
          addRow(R('胸水外观', '少量血性', '', null, null, 0));
          addRow(R('李凡他试验', '阳性', '', null, null, 0));
          addRow(R('白细胞', 260, '/mm³', 0, 500, 0, null, 10000));
          out.text = '仅抽出少量血性渗出液，符合肺梗死旁胸膜渗出（不是感染）';
          addClue('肺栓塞旁胸腔积液 → 以抗凝/溶栓为主，积液本身无需引流', ['lung', 'heart']);
          break;
        }
        if (!wet) {
          out.text = '双侧肋膈角锐利，未抽出胸腔积液';
          break;
        }
        addRow(R('胸水外观', hemo0 ? '血性' : inf ? '浑浊黄绿色' : '淡黄清亮', '', null, null, 0));
        addRow(R('李凡他试验', (hemo0 || inf) ? '阳性' : '阴性', '', null, null, 0));
        addRow(R('白细胞', inf ? 1800 : 120, '/mm³', 0, 500, 0, null, 10000));
        out.text = hemo0 ? '抽出不凝血性液体，提示血胸（活动性出血）' :
          inf ? '渗出液、白细胞升高，符合脓胸 / 肺炎旁积液，建议引流 + 抗生素' :
            '漏出液，蛋白低、细胞少，符合心源性胸腔积液';
        if (hemo0) addClue('血胸 → 胸腔闭式引流 + 输血；持续出血需手术止血', ['lung', 'blood']);
        else if (inf) addClue('脓胸 / 肺炎旁积液 → 充分引流 + 广谱抗生素', ['lung']);
        else addClue('漏出液 → 多为心衰/低蛋白，利尿与治疗原发病', ['lung', 'heart']);
        break;
      }
      case 'para': {
        var hemo1 = sim.bleeding > 0 || (d && /ectopic|rupture/.test(d.id || ''));
        var asc = v(sim, 'hepatic') < 45;
        addRow(R('腹腔液外观', hemo1 ? '不凝血性' : asc ? '淡黄色清亮' : '未抽出液体', '', null, null, 0));
        if (hemo1 || asc) {
          addRow(R('红细胞', hemo1 ? 220000 : 800, '/mm³', null, null, 0));
          addRow(R('白细胞', asc ? 480 : 90, '/mm³', 0, 250, 0, null, 500));
          addRow(R('白蛋白', asc ? +(v(sim, 'hb') * 0.28).toFixed(1) : 1.2, 'g/dL', null, null, 1));
        }
        out.text = hemo1 ? '抽出不凝血液，腹腔积血（实质脏器破裂 / 异位妊娠），需急诊手术止血' :
          asc ? '漏出液，血清-腹水白蛋白梯度 > 1.1 g/dL，符合门脉高压性腹水' : '腹腔穿刺阴性，未见积血或腹水';
        if (hemo1) {
          out.crit = true;
          addClue('腹腔积血 → FAST 阳性：输血 + 急诊手术 / 介入止血', ['blood', 'gut']);
        } else if (asc) addClue('门脉高压性腹水 → 限盐利尿，警惕自发性细菌性腹膜炎', ['liver', 'gut']);
        break;
      }
      case 'skin_test': {
        var q0 = (param && (param.drug || param.drugName)) || '';
        var drug = null;
        if (q0) {
          drug = M.getDrug(q0) || null;
          if (!drug) {
            var allD = M.DRUGS || [];
            for (var di = 0; di < allD.length; di++) {
              var DD = allD[di];
              if (DD.name === q0 || (DD.alias && DD.alias.indexOf(q0) >= 0) || DD.id === q0) { drug = DD; break; }
            }
          }
        }
        if (!drug) { out.text = '未找到药品「' + q0 + '」：请检查药名（可输入通用名、商品名或英文名）'; break; }
        var pa0 = sim.patient && sim.patient.allergy;
        var sameDrug = !!(pa0 && (pa0.id === drug.id || (pa0.name && drug.name && pa0.name === drug.name)));
        var sameClass = !!(pa0 && pa0.name && drug.name && pa0.name.length > 1 && drug.name.length > 1 &&
          (pa0.name.slice(0, 2) === drug.name.slice(0, 2) || (drug.alias || '').indexOf(pa0.name) >= 0));
        var pos0 = sameDrug || sameClass;
        if (!pos0 && Math.random() < 0.03) pos0 = true;        /* 假阳性 ~3% */
        else if (pos0 && Math.random() < 0.02) pos0 = false;   /* 假阴性 ~2% */
        var wheal = pos0 ? (10 + Math.round(Math.random() * 8)) : (2 + Math.round(Math.random() * 3));
        addRow(R('皮试部位', '前臂掌侧皮内', '', null, null, 0));
        addRow(R('皮丘直径', wheal, 'mm', null, null, 0));
        addRow(R('红晕 / 伪足', pos0 ? '有' : '无', '', null, null, 0));
        addRow(R('生理盐水对照', '阴性', '', null, null, 0));
        addRow(R('判读结果', pos0 ? '阳性' : '阴性', '', null, null, 0));
        out.text = drug.name + ' 皮试（皮内注射 0.1 mL，5 秒判读）' +
          (pos0 ? '：皮丘 ' + wheal + ' mm 伴红晕/伪足，判为阳性——该药禁用。' +
            (sameDrug || sameClass ? '（与既往过敏史一致）' : '（无既往过敏史，考虑假阳性，需用生理盐水对照复核）') :
            '：皮丘 ' + wheal + ' mm，无红晕与伪足，判为阴性，可按常规剂量使用。');
        if (pos0) {
          out.crit = true;
          addClue('皮试阳性 → 禁用 ' + drug.name + '，换用无交叉过敏的替代药；确需使用时必须脱敏并备好抢救', ['blood']);
        } else {
          addClue('皮试阴性 ≠ 绝不过敏：首次给药仍要慢推、床边观察 30 分钟，备肾上腺素', ['blood']);
        }
        break;
      }
      default:
        out.text = '未开展的检查';
    }
    if (!out.text) summarize();
    return out;
  }
  M.buildExamResult = build;

  /* ================= 开单 / 回报队列 ================= */
  M.orderExam = function (sim, id, opt) {
    if (!sim) return { ok: false, msg: '没有正在接诊的病人' };
    if (sim.dead) return { ok: false, msg: '病人已转归，不能再开检查' };
    var d = examDef(id);
    if (!d) return { ok: false, msg: '未知检查' };
    /* 需要参数的检查（皮试）：先把药名解析成药品 id */
    var drugId = (opt && opt.drug) || '';
    if (d.param === 'drug') {
      if (!drugId) return { ok: false, msg: '这一项需要先输入药品名' };
      var DD0 = M.getDrug(drugId);
      if (!DD0) {
        var allD0 = M.DRUGS || [];
        for (var dx = 0; dx < allD0.length; dx++) {
          if (allD0[dx].name === drugId || (allD0[dx].alias && allD0[dx].alias.indexOf(drugId) >= 0)) { DD0 = allD0[dx]; break; }
        }
      }
      if (!DD0) return { ok: false, msg: '药库里没有「' + drugId + '」，请检查药名' };
      drugId = DD0.id;
    }
    sim.examPending = sim.examPending || [];
    sim.examResults = sim.examResults || [];
    for (var i = 0; i < sim.examPending.length; i++) {
      if (sim.examPending[i].id === id && (sim.examPending[i].drug || '') === drugId) return { ok: false, msg: '该检查已在排队中' };
    }
    if (sim.examPending.length >= 10) return { ok: false, msg: '同时进行的检查不能超过 10 项' };
    var now = sim.t;
    var nm0 = d.n + (drugId ? (' · ' + ((M.getDrug(drugId) || {}).name || drugId)) : '');
    sim.examPending.push({ id: id, name: nm0, t0: now, ready: now + d.delay, drug: drugId });
    sim.examVer = (sim.examVer || 0) + 1;
    M.log(sim, 'act', '开具检查：' + nm0 + '（约 ' + d.delay + ' 秒回报）');
    return { ok: true, msg: '已开具：' + nm0 };
  };

  M.updateExams = function (sim) {
    if (!sim || !sim.examPending || !sim.examPending.length) return;
    var ready = [];
    for (var i = 0; i < sim.examPending.length; i++) {
      if (sim.t >= sim.examPending[i].ready) ready.push(sim.examPending[i]);
    }
    if (!ready.length) return;
    sim.examPending = sim.examPending.filter(function (p) { return sim.t < p.ready; });
    ready.forEach(function (p) {
      var d = examDef(p.id);
      var res = build(sim, p.id, p);
      res.id = p.drug ? (p.id + ':' + p.drug) : p.id;
      res.name = p.drug ? (d.n + ' · ' + ((M.getDrug(p.drug) || {}).name || p.drug)) : d.n;
      res.g = d.g; res.t = sim.t;
      res.at = p.t0; res.delay = d.delay;
      sim.examResults.push(res);
      if (sim.examResults.length > 80) sim.examResults.shift();
      sim.examVer = (sim.examVer || 0) + 1;
      var short = res.text.length > 90 ? res.text.slice(0, 90) + '…' : res.text;
      M.log(sim, res.crit ? 'crit' : 'info', '【' + res.name + '】' + short + (res.clue ? '（线索：' + res.clue + '）' : ''));
      if (res.crit) {
        sim.emit.push({ kind: 'toast', type: 'crit', title: '皮试阳性 · ' + res.name, text: short });
      }
    });
  };
  M.examPendingList = function (sim) { return (sim && sim.examPending) || []; };
  M.latestExams = function (sim) {
    var out = {}, arr = (sim && sim.examResults) || [];
    for (var i = arr.length - 1; i >= 0; i--) if (!out[arr[i].id]) out[arr[i].id] = arr[i];
    return out;
  };

  /* ================= 器官功能概览 ================= */
  M.organOverview = function (sim) {
    if (!sim) return { organs: [], cross: [], clues: [], suspected: [] };
    var v = sim.v;
    function pct(x) { return Math.round(clamp(x, 0, 100)); }
    var organs = [
      { k: 'heart', n: '心脏', pct: pct(Math.min(v.contractility, v.coronary)), sub: 'EF≈' + Math.round(clamp(18 + v.contractility * 0.46, 5, 78)) + '%' },
      { k: 'lung', n: '肺', pct: pct(Math.min(v.spo2, v.airway)), sub: 'SpO₂ ' + Math.round(v.spo2) + '%' },
      { k: 'brain', n: '脑', pct: pct(v.brain), sub: 'GCS ' + Math.round(v.gcs) + ' / ICP ' + Math.round(v.icp) },
      { k: 'liver', n: '肝', pct: pct(v.hepatic), sub: 'INR ' + v.inr.toFixed(1) },
      { k: 'kidney', n: '肾', pct: pct(v.renal), sub: '尿量 ' + Math.round(v.urine) + ' mL/h' },
      { k: 'blood', n: '血液·凝血', pct: pct(Math.min(v.clotting, v.hb * 8)), sub: 'Hb ' + v.hb.toFixed(1) + ' / PLT ' + Math.round(v.plt) },
      { k: 'gut', n: '胃肠', pct: pct(v.gi), sub: '呕吐 ' + Math.round(v.emesis) + '%' },
      { k: 'immune', n: '免疫·炎症', pct: pct(100 - (sim.inflam || 0)), sub: '炎症负荷 ' + Math.round(sim.inflam || 0) }
    ];
    var cross = [];
    function add(from, to, text, sev) { cross.push({ from: from, to: to, text: text, sev: sev || 2 }); }
    if (v.hepatic < 45) add('肝', '血液', '肝功能不全 → 凝血因子合成↓（INR ' + v.inr.toFixed(2) + '）', 3);
    if (v.hepatic < 40) add('肝', '脑', '肝衰竭 → 血氨清除↓（NH₃ ' + Math.round(v.ammonia) + ' µmol/L），可致肝性脑病', 3);
    if (v.renal < 30) add('肾', '心·电解质', '肾功能不全 → 排钾排酸障碍（K⁺ ' + v.k.toFixed(1) + '，pH ' + v.ph.toFixed(2) + '）', 3);
    if (v.clotting < 35) add('凝血', '全身', '凝血崩坏 → 自发性出血、穿刺点渗血', 4);
    if (v.icp > 25) add('脑', '心', '颅高压 → 库欣反应（血压↑ / 心率↓），脑疝前兆', 4);
    if (v.contractility < 45) add('心', '肝·肾', '心输出量↓ → 肝淤血、肾灌注不足（心肾综合征）', 3);
    if (v.hb < 7) add('血液', '全身', '严重贫血 → 氧输送↓、乳酸↑、脑缺氧', 3);
    if (v.gi < 40) add('胃肠', '循环', '胃肠屏障破坏 → 呕吐、第三间隙丢失、细菌移位', 2);
    if ((sim.inflam || 0) > 35) add('炎症', '多器官', '炎症介质 → 血管扩张 + 毛细血管渗漏 + 心肌抑制（脓毒症级联）', 4);
    if (v.ck > 1000) add('肌肉', '肾', '横纹肌溶解 → 肌红蛋白管型、高钾、急性肾损伤（CK ' + Math.round(v.ck) + '）', 4);
    if (v.ammonia > 60) add('肝', '脑', '血氨升高 → 意识障碍/脑水肿（NH₃ ' + Math.round(v.ammonia) + '）', 3);
    if (v.temp < 35.5) add('体温', '凝血', '低体温 → 凝血酶活性下降（致死三联征）', 3);
    if (v.spo2 < 85) add('肺', '心', '缺氧性肺血管收缩 → 右心后负荷↑、心肌抑制', 3);
    if (v.mg < 0.55) add('镁', '心', '低镁 → QT 延长、顽固性低钾、心律失常阈值↓', 3);
    if (v.ca < 1.85) add('钙', '心', '低钙 → QT 延长、抽搐、心肌收缩力↓', 2);
    if (v.ck > 1000 && v.k > 5.3) add('肌肉', '心', '横纹肌溶解 → 高钾 → 恶性心律失常风险', 4);

    /* 诊断线索：把「实验室/影像阳性」与「器官」关联 */
    var clues = [];
    var seen = {};
    var latest = M.latestExams(sim);
    Object.keys(latest).forEach(function (id) {
      var r = latest[id];
      if (r.clue) {
        r.clue.split('；').forEach(function (c) {
          if (!c || seen[c]) return;
          seen[c] = 1; clues.push({ text: c, organ: (r.organs || []).join(','), t: r.t, exam: r.name });
        });
      }
    });
    return { organs: organs, cross: cross, clues: clues, suspected: suspectedOrgans(sim, organs) };
  };

  function suspectedOrgans(sim, organs) {
    var v = sim.v, score = {};
    function add(k, x) { score[k] = (score[k] || 0) + x; }
    add('heart', Math.max(0, 100 - v.coronary) * 0.55 + Math.max(0, 100 - v.contractility) * 0.35 + Math.max(0, v.arrhythmia) * 0.3 + Math.max(0, v.qt - 460) * 0.15);
    add('lung', Math.max(0, 96 - v.spo2) * 2.2 + Math.max(0, 90 - v.airway) * 0.6 + Math.max(0, v.bronchospasm) * 0.5);
    add('brain', Math.max(0, 90 - v.brain) * 0.7 + Math.max(0, v.icp - 15) * 2.4 + Math.max(0, v.seizure) * 0.5);
    add('liver', Math.max(0, 90 - v.hepatic) * 0.7 + Math.max(0, v.inr - 1.2) * 40 + Math.max(0, v.ammonia - 35) * 0.8);
    add('kidney', Math.max(0, 90 - v.renal) * 0.7 + Math.max(0, 30 - v.urine) * 2.2 + Math.max(0, v.k - 5.3) * 22);
    add('blood', Math.max(0, 12 - v.hb) * 8 + Math.max(0, 90 - v.clotting) * 0.6 + Math.max(0, 100 - v.plt) * 0.12);
    add('gut', Math.max(0, 80 - v.gi) * 0.7 + Math.max(0, v.pain - 40) * 0.5);
    add('endocrine', Math.max(0, Math.abs(v.glucose - 6) - 3) * 6 + Math.max(0, Math.abs(v.na - 140) - 6) * 2.5 + Math.max(0, v.temp - 38) * 12);
    add('obstetric', (sim.patient.sex === '女' && /妊娠|胎盘|子痫|产后/.test((sim.disease && sim.disease.def.name) || '')) ? 60 : 0);
    var names = { heart: '心脏', lung: '肺', brain: '脑', liver: '肝', kidney: '肾', blood: '血液/凝血', gut: '胃肠', endocrine: '内分泌/代谢', obstetric: '妇产' };
    var arr = Object.keys(score).map(function (k) { return { k: k, name: names[k], score: score[k] }; });
    arr.sort(function (a, b) { return b.score - a.score; });
    var total = arr.reduce(function (s, x) { return s + x.score; }, 0) || 1;
    return arr.filter(function (x) { return x.score > 8; }).slice(0, 4).map(function (x) {
      return { k: x.k, name: x.name, pct: Math.round(x.score / total * 100) };
    });
  }
  M.suspectedOrgans = function (sim) { return suspectedOrgans(sim, []); };

  /* ================= 临床评分 =================
     参考：Vincent 1996 SOFA；Singer 2016 Sepsis-3 qSOFA；
     Royal College of Physicians 2017 NEWS2；KDIGO 2012 AKI；
     ARDS Berlin 2012 的 P/F 分级；Shock Index（HR/SBP）。
     这些评分只读取现有生理与实验室数据，不改变病程，用于「把问题量化」。 */
  M.clinicalScores = function (sim) {
    if (!sim) return null;
    var v = sim.v || {};
    var wt = sim.patient.weight || 70;

    /* FiO2：根据当前呼吸支持方式估计 */
    var fio2 = sim.vent ? 0.5 : sim.airwayMode === 'ett' ? 0.5 :
      sim.airwayMode === 'bag' ? 0.6 : sim.airwayMode === 'o2' ? 0.4 : 0.21;
    var pf = Math.round((v.pao2 || 0) / fio2);
    var o2sup = sim.airwayMode && sim.airwayMode !== 'none';

    /* NEWS2 的 7 项：RR / SpO2 / 补充氧 / SBP / HR / 意识 / 体温 */
    function newsRR(x) { return x <= 8 ? 3 : x <= 11 ? 1 : x <= 20 ? 0 : x <= 24 ? 2 : 3; }
    function newsSp(x) { return x <= 91 ? 3 : x <= 93 ? 2 : x <= 95 ? 1 : 0; }
    function newsSBP(x) { return x <= 90 ? 3 : x <= 100 ? 2 : x <= 110 ? 1 : x <= 219 ? 0 : 3; }
    function newsHR(x) { return x <= 40 ? 3 : x <= 50 ? 1 : x <= 90 ? 0 : x <= 110 ? 1 : x <= 130 ? 2 : 3; }
    function newsTemp(x) { return x <= 35 ? 3 : x <= 36 ? 1 : x <= 38 ? 0 : x <= 39 ? 1 : 2; }
    var newsParts = {
      rr: newsRR(v.rr || 0), spo2: newsSp(v.spo2 || 0), o2: o2sup ? 2 : 0,
      sbp: newsSBP(v.sbp || 0), hr: newsHR(v.hr || 0),
      cons: (v.gcs || 15) < 15 ? 3 : 0, temp: newsTemp(v.temp || 37)
    };
    var news = 0; for (var nk in newsParts) news += newsParts[nk];

    /* qSOFA / Sepsis-3 */
    var q = 0;
    if ((v.rr || 0) >= 22) q++;
    if ((v.sbp || 0) <= 100) q++;
    if ((v.gcs || 15) < 15) q++;

    /* 血管活性药（SOFA 心血管项） */
    var vaso = 0, vasoName = '';
    (sim.rxList || []).forEach(function (r) {
      if (!r || !r.D) return;
      var id = r.drugId;
      if (['norepinephrine', 'epinephrine', 'vasopressin', 'phenylephrine'].indexOf(id) >= 0 && (r.c > 0.2 || r.active)) {
        if (!vaso || vaso < 3) { vaso = 3; vasoName = r.D.name; }
      } else if (['dopamine', 'dobutamine'].indexOf(id) >= 0 && (r.c > 0.2 || r.active)) {
        if (!vaso) { vaso = 2; vasoName = r.D.name; }
      }
    });

    /* SOFA 六项 */
    var sofa = { resp: 0, coag: 0, liver: 0, cv: 0, cns: 0, renal: 0 };
    if (pf < 100 && sim.vent) sofa.resp = 4;
    else if (pf < 200 && (sim.vent || sim.airwayMode === 'bag')) sofa.resp = 3;
    else if (pf < 300) sofa.resp = 2;
    else if (pf < 400) sofa.resp = 1;
    var plt = v.plt || 0;
    sofa.coag = plt < 20 ? 4 : plt < 50 ? 3 : plt < 100 ? 2 : plt < 150 ? 1 : 0;
    var bili = lab(sim, 'bilirubin');
    if (bili === undefined) bili = Math.round(9 + (100 - (v.hepatic || 100)) * 0.9);
    sofa.liver = bili > 204 ? 4 : bili > 102 ? 3 : bili > 33 ? 2 : bili > 20 ? 1 : 0;
    if (vaso >= 3) sofa.cv = 3;
    else if (vaso === 2) sofa.cv = 2;
    else if ((v.map || 0) < 70) sofa.cv = 1;
    var gcs = v.gcs || 15;
    sofa.cns = gcs < 6 ? 4 : gcs < 10 ? 3 : gcs < 13 ? 2 : gcs < 15 ? 1 : 0;
    var cr = creat(sim);
    sofa.renal = cr > 440 ? 4 : cr > 299 ? 3 : cr > 170 ? 2 : cr > 110 ? 1 : 0;
    var sofaTotal = sofa.resp + sofa.coag + sofa.liver + sofa.cv + sofa.cns + sofa.renal;

    /* KDIGO AKI 近似分期（肌酐绝对值 + 当前尿量；未做 6–12 小时尿量积分） */
    var ukg = (v.urine || 0) / Math.max(30, wt);
    var aki = 0;
    if (cr >= 354 || ukg < 0.3) aki = 3;
    else if (cr >= 177 || ukg < 0.5) aki = 2;
    else if (cr >= 133) aki = 1;

    var si = v.sbp > 0 ? +((v.hr || 0) / v.sbp).toFixed(2) : 0;
    var lac0 = sim.lactate0 || 0;
    var lacClear = lac0 > 2 ? Math.round((1 - (v.lactate || 0) / lac0) * 100) : null;

    return {
      news: news, newsParts: newsParts,
      qsofa: q, sofa: sofa, sofaTotal: sofaTotal,
      pf: pf, fio2: fio2, shockIndex: si,
      aki: aki, creatinine: cr, bilirubin: bili,
      lactateClear: lacClear, vaso: vaso, vasoName: vasoName
    };
  };

})();
