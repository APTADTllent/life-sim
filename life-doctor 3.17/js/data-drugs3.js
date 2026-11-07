window.M = window.M || {};
M.DRUGS3 = [
  {
    id: "nimodipine", name: "尼莫地平", alias: "Nimodipine 尼莫同", cls: "钙通道阻滞剂 · 脑血管",
    unit: "mg", routes: ["po", "iv_inf"],
    dose: { min: 10, typical: 15, max: 30 },
    rateRange: { min: 0.5, max: 2, per: "mg/h" },
    halfLife: 90, onset: 5, peak: 30, dur: 240,
    metabol: "肝脏 CYP3A4 代谢，首过效应明显",
    effects: [
      { t: "map", max: -10, ec50: 1 },
      { t: "sbp", max: -8, ec50: 1 },
      { t: "hr", max: 6, ec50: 1.2 }
    ],
    tox: { factor: 3, effects: [ { t: "map", max: -25, ec50: 1 }, { t: "hr", max: 20, ec50: 1 } ], msg: "严重低血压、反射性心动过速、头晕" },
    allergy: { p: 0.005, msg: "皮疹、面部潮红、低血压", effects: [ { t: "sbp", max: -12, ec50: 1 } ] },
    flags: [],
    note: "蛛网膜下腔出血后预防脑血管痉挛的一线用药，需监测血压避免过低"
  },
  {
    id: "propylthiouracil", name: "丙硫氧嘧啶", alias: "PTU", cls: "抗甲状腺药",
    unit: "mg", routes: ["po", "pr"],
    dose: { min: 200, typical: 300, max: 600 },
    rateRange: null,
    halfLife: 90, onset: 30, peak: 60, dur: 480,
    metabol: "肝脏代谢，肾排泄",
    effects: [
      { t: "hr", max: -18, ec50: 1 },
      { t: "temp", max: -0.5, ec50: 1.2 },
      { t: "contractility", max: -4, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "wbc", max: -4, ec50: 1 }, { t: "hepatic", max: -18, ec50: 1 } ], msg: "粒细胞缺乏、肝损害、皮疹" },
    allergy: { p: 0.03, msg: "皮疹、发热、粒细胞缺乏", effects: [ { t: "wbc", max: -3, ec50: 1 }, { t: "temp", max: 1, ec50: 1 } ] },
    flags: [],
    note: "甲亢危象首选，抑制外周 T4 转 T3，须在碘剂前 1 小时给药"
  },
  {
    id: "piperacillin_tazobactam", name: "哌拉西林他唑巴坦", alias: "特治星 Tazocin", cls: "抗生素 · β内酰胺酶抑制剂复方",
    unit: "g", routes: ["iv", "iv_inf"],
    dose: { min: 2.25, typical: 4.5, max: 4.5 },
    rateRange: { min: 2, max: 12, per: "g/h" },
    halfLife: 60, onset: 5, peak: 30, dur: 360,
    metabol: "以原型经肾排泄",
    effects: [
      { t: "wbc", max: -2, ec50: 1 },
      { t: "temp", max: -0.3, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "renal", max: -18, ec50: 1 }, { t: "plt", max: -60, ec50: 1 } ], msg: "肾损害、血小板减少、惊厥（肾功能不全时蓄积）" },
    allergy: { p: 0.03, msg: "皮疹、过敏性休克", effects: [ { t: "sbp", max: -35, ec50: 1 }, { t: "histamine", max: 55, ec50: 1 } ] },
    flags: [],
    note: "广谱覆盖革兰阴性菌与厌氧菌，用于腹腔感染、脓毒症、坏死性软组织感染"
  },
  {
    id: "calcitonin", name: "降钙素", alias: "Calcitonin 鲑鱼降钙素 · 密盖息", cls: "激素 · 钙代谢调节",
    unit: "IU", routes: ["sc", "im", "iv_inf"],
    dose: { min: 50, typical: 100, max: 200 },
    rateRange: { min: 2, max: 8, per: "IU/h" },
    halfLife: 70, onset: 15, peak: 60, dur: 240,
    metabol: "主要在肾与血中降解，半衰期短",
    effects: [
      { t: "ca", max: -0.75, ec50: 1 },
      { t: "pain", max: -12, ec50: 1.5 },
      { t: "urine", max: 8, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "ca", max: -0.7, ec50: 1 }, { t: "bronchospasm", max: 25, ec50: 1 } ], msg: "低钙血症、手足搐搦、支气管痉挛" },
    allergy: { p: 0.02, msg: "皮疹、面部潮红、过敏性休克（鱼蛋白过敏者禁用）", effects: [ { t: "histamine", max: 50, ec50: 1 }, { t: "sbp", max: -30, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "高钙危象的辅助用药：先大量补液 + 呋塞米，降钙素 4 IU/kg 皮下注射，配合双膦酸盐；用药前需皮试（鱼蛋白过敏禁用）"
  },
  {
    id: "zoledronate", name: "唑来膦酸", alias: "Zoledronic acid 双膦酸盐", cls: "骨代谢 · 抑制骨吸收",
    unit: "mg", routes: ["iv_inf"],
    dose: { min: 1, typical: 4, max: 4 },
    rateRange: { min: 0.5, max: 2, per: "mg/h" },
    halfLife: 240, onset: 120, peak: 240, dur: 720,
    metabol: "不经代谢，以原型经肾排泄并沉积于骨",
    effects: [
      { t: "ca", max: -0.7, ec50: 1 }
    ],
    tox: { factor: 2, effects: [ { t: "ca", max: -0.5, ec50: 1 }, { t: "renal", max: -20, ec50: 1 }, { t: "temp", max: 1.2, ec50: 1 } ], msg: "低钙血症、肾损害、流感样反应" },
    allergy: { p: 0.005, msg: "皮疹、发热", effects: [ { t: "temp", max: 1, ec50: 1 } ] },
    flags: [],
    note: "恶性肿瘤相关高钙血症的一线用药，需缓慢静滴（>15 分钟）并充分水化"
  }
  ,
  /* ============ 急救复苏补充 ============ */
  {
    id: "lipid_emulsion", name: "脂肪乳（20%）", alias: "Intralipid 英脱利匹特 · 脂肪救援", cls: "解毒剂 · 脂肪救援",
    unit: "mL", routes: ["iv", "iv_inf"],
    dose: { min: 200, typical: 350, max: 500 },
    rateRange: { min: 150, max: 500, per: "mL/h" },
    halfLife: 40, onset: 1, peak: 5, dur: 30,
    metabol: "网状内皮系统清除，肺为限速器官",
    effects: [
      { t: "contractility", max: 12, ec50: 1 },
      { t: "sbp", max: 8, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "contractility", max: -12, ec50: 1 }, { t: "spo2", max: -8, ec50: 1 } ], msg: "脂肪超载、ARDS 加重、发热" },
    allergy: { p: 0.01, msg: "发热、寒战、恶心、皮疹", effects: [ { t: "temp", max: 0.8, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "局麻药全身中毒的抢救用药：1.5 mL/kg 快速静推（约 100 mL），可重复 1–2 次，最大 12 mL/kg；同时维持气道与循环"
  },
  {
    id: "pcc", name: "凝血酶原复合物", alias: "PCC · 凝血酶原复合物", cls: "促凝血药 · 抗凝逆转",
    unit: "IU", routes: ["iv"],
    dose: { min: 500, typical: 1000, max: 2000 },
    halfLife: 360, onset: 2, peak: 10, dur: 360,
    metabol: "凝血因子在体内消耗，半衰期 6 小时左右",
    effects: [
      { t: "inr", max: -1.4, ec50: 1 },
      { t: "clotting", max: 22, ec50: 1 }
    ],
    tox: { factor: 3, effects: [ { t: "clotting", max: 15, ec50: 1 } ], msg: "血栓风险（过量、老年人、既往血栓史）" },
    allergy: { p: 0.01, msg: "发热、皮疹、过敏性休克", effects: [ { t: "histamine", max: 30, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "华法林相关大出血或急诊手术前逆转抗凝：25–50 IU/kg，配合维生素 K1 10 mg 静推"
  },
  {
    id: "fibrinogen", name: "人纤维蛋白原", alias: "Fibrinogen 纤维蛋白原", cls: "促凝血药 · 凝血底物",
    unit: "g", routes: ["iv"],
    dose: { min: 1, typical: 2, max: 4 },
    halfLife: 600, onset: 5, peak: 30, dur: 480,
    metabol: "在凝血过程中被消耗",
    effects: [
      { t: "clotting", max: 20, ec50: 1 },
      { t: "inr", max: -0.4, ec50: 1.2 }
    ],
    tox: { factor: 3, effects: [ { t: "clotting", max: 12, ec50: 1 } ], msg: "高纤维蛋白原血症、血栓风险" },
    allergy: { p: 0.01, msg: "发热、寒战、过敏性反应", effects: [ { t: "temp", max: 0.7, ec50: 1 } ] },
    flags: [],
    note: "大出血时纤维蛋白原 < 1.5 g/L 补充；目标维持 1.5–2 g/L"
  },
  {
    id: "cryoprecipitate", name: "冷沉淀凝血因子", alias: "Cryo 冷沉淀", cls: "促凝血药 · 血制品",
    unit: "U", routes: ["iv"],
    dose: { min: 5, typical: 10, max: 20 },
    halfLife: 480, onset: 5, peak: 20, dur: 360,
    metabol: "凝血因子消耗",
    effects: [
      { t: "clotting", max: 16, ec50: 1 },
      { t: "hb", max: 0.4, ec50: 1 }
    ],
    tox: { factor: 4, effects: [ { t: "volume", max: 300, ec50: 1 } ], msg: "容量过负荷、输血反应" },
    allergy: { p: 0.02, msg: "输血反应、荨麻疹、发热", effects: [ { t: "temp", max: 0.9, ec50: 1 }, { t: "histamine", max: 25, ec50: 1 } ] },
    flags: [],
    note: "含纤维蛋白原、VIII 因子、vWF；大量输血时每 10 U 补充"
  },
  {
    id: "sodium_thiosulfate", name: "硫代硫酸钠", alias: "Sodium Thiosulfate 大苏打", cls: "解毒药 · 氰化物",
    unit: "g", routes: ["iv"],
    dose: { min: 5, typical: 12.5, max: 25 },
    halfLife: 60, onset: 2, peak: 10, dur: 120,
    metabol: "经肾排泄，提供硫供肝硫氰酸酶解毒",
    effects: [
      { t: "ph", max: 0.02, ec50: 1 }
    ],
    tox: { factor: 4, effects: [ { t: "sbp", max: -20, ec50: 1 }, { t: "ph", max: -0.08, ec50: 1 } ], msg: "低血压、代谢性酸中毒" },
    allergy: { p: 0.005, msg: "皮疹、低血压", effects: [ { t: "sbp", max: -10, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "氰化物中毒：先用亚硝酸钠形成高铁血红蛋白，再给硫代硫酸钠 12.5 g（50 mL 25% 溶液）静推"
  },
  {
    id: "sodium_nitrite", name: "亚硝酸钠", alias: "Sodium Nitrite", cls: "解毒药 · 氰化物",
    unit: "mg", routes: ["iv"],
    dose: { min: 150, typical: 300, max: 300 },
    halfLife: 20, onset: 1, peak: 5, dur: 60,
    metabol: "迅速氧化血红蛋白，随后还原",
    effects: [
      { t: "hb", max: -1.2, ec50: 1 },
      { t: "sbp", max: -15, ec50: 1 },
      { t: "hr", max: 10, ec50: 1.2 }
    ],
    tox: { factor: 2, effects: [ { t: "hb", max: -2, ec50: 1 }, { t: "sbp", max: -35, ec50: 1 } ], msg: "严重高铁血红蛋白血症、低血压、发绀" },
    allergy: { p: 0.005, msg: "低血压、头晕", effects: [ { t: "sbp", max: -18, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "氰化物中毒第一步：3% 溶液 10 mL（300 mg）缓慢静推，形成高铁血红蛋白结合氰根；随后必须给硫代硫酸钠"
  },
  {
    id: "fomepizole", name: "甲吡唑", alias: "Fomepizole 4-甲基吡唑", cls: "解毒药 · 醇类中毒",
    unit: "mg", routes: ["iv"],
    dose: { min: 800, typical: 800, max: 1200 },
    halfLife: 300, onset: 5, peak: 20, dur: 480,
    metabol: "肝 CYP2E1 代谢",
    effects: [
      { t: "hepatic", max: 12, ec50: 1 }
    ],
    tox: { factor: 3, effects: [ { t: "hepatic", max: -15, ec50: 1 }, { t: "gcs", max: -3, ec50: 1 } ], msg: "肝损害、中枢抑制" },
    allergy: { p: 0.01, msg: "皮疹、头痛、恶心", effects: [ { t: "histamine", max: 15, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "甲醇 / 乙二醇中毒首选解毒剂：15 mg/kg 负荷，抑制乙醇脱氢酶；同时纠正酸中毒、必要时透析"
  },
  {
    id: "phentolamine", name: "酚妥拉明", alias: "Phentolamine 立其丁", cls: "血管扩张药 · α 阻滞",
    unit: "mg", routes: ["iv", "iv_inf"],
    dose: { min: 1, typical: 5, max: 10 },
    rateRange: { min: 1, max: 10, per: "mg/h" },
    halfLife: 19, onset: 1, peak: 5, dur: 60,
    metabol: "肝代谢，10% 以原型经尿排出",
    effects: [
      { t: "svr", max: -260, ec50: 1 },
      { t: "sbp", max: -28, ec50: 1 },
      { t: "hr", max: 14, ec50: 1.2 }
    ],
    tox: { factor: 3, effects: [ { t: "sbp", max: -40, ec50: 1 }, { t: "hr", max: 25, ec50: 1 } ], msg: "严重低血压、反射性心动过速、心绞痛" },
    allergy: { p: 0.01, msg: "皮疹、心动过速", effects: [ { t: "hr", max: 15, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "嗜铬细胞瘤高血压危象；去甲肾上腺素外渗时局部浸润（5–10 mg 溶于 10 mL 生理盐水）"
  },
  {
    id: "diltiazem", name: "地尔硫䓬", alias: "Diltiazem 合心爽", cls: "非二氢吡啶类钙通道阻滞剂",
    unit: "mg", routes: ["iv", "iv_inf", "po"],
    dose: { min: 5, typical: 15, max: 25 },
    rateRange: { min: 5, max: 15, per: "mg/h" },
    halfLife: 240, onset: 3, peak: 10, dur: 240,
    metabol: "肝 CYP3A4 代谢，首过效应明显",
    effects: [
      { t: "avconduction", max: -25, ec50: 1 },
      { t: "hr", max: -18, ec50: 1 },
      { t: "sbp", max: -10, ec50: 1.2 }
    ],
    tox: { factor: 3, effects: [ { t: "avconduction", max: -45, ec50: 1 }, { t: "hr", max: -25, ec50: 1 }, { t: "sbp", max: -20, ec50: 1 } ], msg: "高度房室传导阻滞、严重低血压、心源性休克" },
    allergy: { p: 0.01, msg: "皮疹、面部潮红、低血压", effects: [ { t: "sbp", max: -12, ec50: 1 } ] },
    flags: [],
    note: "房颤/房扑控制心室率 5–15 mg 缓慢静推；预激合并房颤、心功能不全者禁用"
  },
  {
    id: "nikethamide", name: "尼可刹米", alias: "Nikethamide 可拉明", cls: "呼吸兴奋剂",
    unit: "mg", routes: ["iv", "im"],
    dose: { min: 375, typical: 375, max: 750 },
    halfLife: 120, onset: 1, peak: 5, dur: 60,
    metabol: "肝代谢",
    effects: [
      { t: "rr", max: 5, ec50: 1 },
      { t: "brain", max: 6, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "seizure", max: 25, ec50: 1 }, { t: "hr", max: 20, ec50: 1 } ], msg: "惊厥、心动过速、血压升高" },
    allergy: { p: 0.005, msg: "皮疹、面部潮红", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: [],
    note: "仅用于中枢性呼吸抑制的短期辅助，不能替代气道管理与通气支持"
  },

  /* ============ 常规药物补充 ============ */
  {
    id: "atorvastatin", name: "阿托伐他汀", alias: "Atorvastatin 立普妥", cls: "调脂药 · 他汀类",
    unit: "mg", routes: ["po"],
    dose: { min: 10, typical: 20, max: 80 },
    halfLife: 840, onset: 60, peak: 240, dur: 1440,
    metabol: "肝 CYP3A4 代谢",
    effects: [
      { t: "coronary", max: 6, ec50: 1 }
    ],
    tox: { factor: 5, effects: [ { t: "hepatic", max: -15, ec50: 1 }, { t: "contractility", max: -8, ec50: 1 } ], msg: "横纹肌溶解、转氨酶升高" },
    allergy: { p: 0.01, msg: "皮疹、肌痛", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "ACS 患者尽早启动，目标 LDL < 1.4 mmol/L"
  },
  {
    id: "clopidogrel", name: "氯吡格雷", alias: "Clopidogrel 波立维", cls: "抗血小板药 · P2Y12",
    unit: "mg", routes: ["po"],
    dose: { min: 75, typical: 75, max: 300 },
    halfLife: 360, onset: 30, peak: 120, dur: 720,
    metabol: "肝 CYP2C19 活化",
    effects: [
      { t: "plt", max: -35, ec50: 1 }
    ],
    tox: { factor: 4, effects: [ { t: "plt", max: -60, ec50: 1 }, { t: "clotting", max: -15, ec50: 1 } ], msg: "出血倾向、血小板功能抑制" },
    allergy: { p: 0.01, msg: "皮疹、腹泻", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "ACS / 支架术后双联抗血小板；择期手术前需停药 5–7 天"
  },
  {
    id: "metformin", name: "二甲双胍", alias: "Metformin 格华止", cls: "降糖药 · 双胍类",
    unit: "mg", routes: ["po"],
    dose: { min: 500, typical: 500, max: 1000 },
    halfLife: 300, onset: 30, peak: 120, dur: 480,
    metabol: "以原型经肾排泄",
    effects: [
      { t: "glucose", max: -3.5, ec50: 1 }
    ],
    tox: { factor: 3, effects: [ { t: "lactate", max: 7, ec50: 1 }, { t: "ph", max: -0.18, ec50: 1 }, { t: "gi", max: -15, ec50: 1 } ], msg: "乳酸酸中毒（肾功能不全 / 缺氧时）" },
    allergy: { p: 0.01, msg: "腹泻、恶心、皮疹", effects: [ { t: "gi", max: -10, ec50: 1 } ] },
    flags: [],
    note: "2 型糖尿病一线；eGFR < 30、造影前后、乳酸酸中毒时停用"
  },
  {
    id: "glimepiride", name: "格列美脲", alias: "Glimepiride 亚莫利", cls: "降糖药 · 磺脲类",
    unit: "mg", routes: ["po"],
    dose: { min: 1, typical: 2, max: 4 },
    halfLife: 300, onset: 30, peak: 120, dur: 720,
    metabol: "肝代谢，代谢物有活性",
    effects: [
      { t: "glucose", max: -4.5, ec50: 1 }
    ],
    tox: { factor: 3, effects: [ { t: "glucose", max: -3.5, ec50: 1 }, { t: "brain", max: -10, ec50: 1 } ], msg: "顽固性低血糖、低血糖昏迷" },
    allergy: { p: 0.02, msg: "皮疹、低血糖", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "促胰岛素分泌剂，老年、肾功能不全者易低血糖；过量所致低血糖需持续输注葡萄糖"
  },
  {
    id: "valsartan", name: "缬沙坦", alias: "Valsartan ARB", cls: "血管紧张素受体拮抗剂",
    unit: "mg", routes: ["po"],
    dose: { min: 80, typical: 80, max: 160 },
    halfLife: 360, onset: 60, peak: 120, dur: 720,
    metabol: "少量代谢，主要经胆道排泄",
    effects: [
      { t: "sbp", max: -14, ec50: 1 },
      { t: "svr", max: -140, ec50: 1 }
    ],
    tox: { factor: 4, effects: [ { t: "sbp", max: -25, ec50: 1 }, { t: "k", max: 0.6, ec50: 1 } ], msg: "低血压、高血钾、肾功能恶化" },
    allergy: { p: 0.005, msg: "血管性水肿、头晕", effects: [ { t: "airway", max: -10, ec50: 1 } ] },
    flags: [],
    note: "高血压 / 心衰基础用药；双侧肾动脉狭窄、妊娠禁用"
  },
  {
    id: "methimazole", name: "甲巯咪唑", alias: "Methimazole MMI", cls: "抗甲状腺药",
    unit: "mg", routes: ["po", "pr"],
    dose: { min: 10, typical: 20, max: 40 },
    halfLife: 360, onset: 60, peak: 180, dur: 720,
    metabol: "肝代谢，肾排泄",
    effects: [
      { t: "hr", max: -16, ec50: 1 },
      { t: "temp", max: -0.35, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "wbc", max: -5, ec50: 1 }, { t: "hepatic", max: -12, ec50: 1 } ], msg: "粒细胞缺乏、肝损害" },
    allergy: { p: 0.03, msg: "皮疹、发热、粒细胞缺乏", effects: [ { t: "wbc", max: -3, ec50: 1 }, { t: "temp", max: 0.9, ec50: 1 } ] },
    flags: [],
    note: "甲亢常规治疗；甲亢危象时首选丙硫氧嘧啶（还可抑制 T4→T3）"
  },
  {
    id: "prednisone", name: "泼尼松", alias: "Prednisone 强的松", cls: "糖皮质激素 · 口服",
    unit: "mg", routes: ["po"],
    dose: { min: 10, typical: 30, max: 60 },
    halfLife: 200, onset: 60, peak: 240, dur: 720,
    metabol: "肝转化为泼尼松龙后起效",
    effects: [
      { t: "histamine", max: -18, ec50: 1 },
      { t: "glucose", max: 1.6, ec50: 1 },
      { t: "immune", max: -8, ec50: 1.5 }
    ],
    tox: { factor: 4, effects: [ { t: "glucose", max: 4, ec50: 1 }, { t: "immune", max: -15, ec50: 1 }, { t: "gi", max: -12, ec50: 1 } ], msg: "高血糖、感染扩散、应激性溃疡" },
    allergy: { p: 0.01, msg: "皮疹、面部潮红", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "哮喘 / COPD 急性加重、过敏性疾病维持治疗；应激剂量需按病情加量"
  },
  {
    id: "loratadine", name: "氯雷他定", alias: "Loratadine 开瑞坦", cls: "第二代抗组胺药",
    unit: "mg", routes: ["po"],
    dose: { min: 10, typical: 10, max: 20 },
    halfLife: 480, onset: 60, peak: 120, dur: 720,
    metabol: "肝 CYP3A4 代谢",
    effects: [
      { t: "histamine", max: -32, ec50: 1 }
    ],
    tox: { factor: 5, effects: [ { t: "sedation", max: 10, ec50: 1 }, { t: "hr", max: 12, ec50: 1 } ], msg: "嗜睡、口干、心动过速" },
    allergy: { p: 0.005, msg: "皮疹、头痛", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "过敏性鼻炎 / 荨麻疹；不能替代肾上腺素用于过敏性休克"
  },
  {
    id: "ambroxol", name: "氨溴索", alias: "Ambroxol 沐舒坦", cls: "化痰药",
    unit: "mg", routes: ["iv", "po"],
    dose: { min: 15, typical: 30, max: 60 },
    halfLife: 420, onset: 15, peak: 60, dur: 360,
    metabol: "肝代谢，肾排泄",
    effects: [
      { t: "secretions", max: -35, ec50: 1 }
    ],
    tox: { factor: 4, effects: [ { t: "gi", max: -10, ec50: 1 } ], msg: "恶心、胃部不适" },
    allergy: { p: 0.01, msg: "皮疹、口干", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "稀释痰液、改善排痰；气道梗阻时仍需吸痰与气管镜"
  },
  {
    id: "cefuroxime", name: "头孢呋辛", alias: "Cefuroxime 西力欣", cls: "第二代头孢菌素",
    unit: "g", routes: ["iv", "iv_inf"],
    dose: { min: 0.75, typical: 1.5, max: 3 },
    rateRange: { min: 1, max: 3, per: "g/h" },
    halfLife: 80, onset: 5, peak: 30, dur: 360,
    metabol: "以原型经肾排泄",
    effects: [
      { t: "wbc", max: -1.5, ec50: 1 },
      { t: "temp", max: -0.2, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "renal", max: -15, ec50: 1 } ], msg: "肾损害、二重感染" },
    allergy: { p: 0.03, msg: "皮疹、过敏性休克", effects: [ { t: "sbp", max: -35, ec50: 1 }, { t: "histamine", max: 55, ec50: 1 } ] },
    flags: [],
    note: "社区获得性肺炎、围术期预防用药；青霉素过敏者慎用"
  },
  {
    id: "linezolid", name: "利奈唑胺", alias: "Linezolid 斯沃", cls: "噁唑烷酮类抗菌药",
    unit: "mg", routes: ["iv_inf", "po"],
    dose: { min: 600, typical: 600, max: 600 },
    rateRange: { min: 300, max: 600, per: "mg/h" },
    halfLife: 300, onset: 10, peak: 60, dur: 720,
    metabol: "非酶氧化代谢，肾排泄",
    effects: [
      { t: "wbc", max: -2, ec50: 1 }
    ],
    tox: { factor: 3, effects: [ { t: "plt", max: -80, ec50: 1 }, { t: "wbc", max: -3, ec50: 1 } ], msg: "血小板减少、骨髓抑制、乳酸酸中毒" },
    allergy: { p: 0.02, msg: "皮疹、腹泻", effects: [ { t: "histamine", max: 15, ec50: 1 } ] },
    flags: [],
    note: "MRSA / 耐药革兰阳性菌感染；与拟交感药合用可致高血压"
  },
  {
    id: "fluconazole", name: "氟康唑", alias: "Fluconazole 大扶康", cls: "三唑类抗真菌药",
    unit: "mg", routes: ["po", "iv_inf"],
    dose: { min: 200, typical: 200, max: 400 },
    rateRange: { min: 100, max: 200, per: "mg/h" },
    halfLife: 1800, onset: 30, peak: 120, dur: 1440,
    metabol: "主要经肾排泄",
    effects: [
      { t: "wbc", max: -1, ec50: 1 }
    ],
    tox: { factor: 4, effects: [ { t: "hepatic", max: -20, ec50: 1 } ], msg: "肝损害、QT 延长" },
    allergy: { p: 0.01, msg: "皮疹、肝酶升高", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "念珠菌感染；隐球菌脑膜炎需联合用药"
  },
  {
    id: "oseltamivir", name: "奥司他韦", alias: "Oseltamivir 达菲", cls: "抗病毒药 · 神经氨酸酶抑制剂",
    unit: "mg", routes: ["po"],
    dose: { min: 75, typical: 75, max: 150 },
    halfLife: 480, onset: 60, peak: 180, dur: 720,
    metabol: "肝酯酶转化为活性代谢物，肾排泄",
    effects: [
      { t: "temp", max: -0.4, ec50: 1 },
      { t: "rr", max: -1, ec50: 2 }
    ],
    tox: { factor: 4, effects: [ { t: "gi", max: -12, ec50: 1 }, { t: "gcs", max: -2, ec50: 1 } ], msg: "恶心呕吐、神经精神症状" },
    allergy: { p: 0.01, msg: "皮疹、呕吐", effects: [ { t: "gi", max: -8, ec50: 1 } ] },
    flags: [],
    note: "流感发病 48 小时内使用；重症与高危人群不必等检测结果"
  },
  {
    id: "calcitriol", name: "骨化三醇", alias: "Calcitriol 罗盖全", cls: "维生素 D 衍生物",
    unit: "μg", routes: ["po"],
    dose: { min: 0.25, typical: 0.25, max: 1 },
    halfLife: 300, onset: 120, peak: 360, dur: 1440,
    metabol: "肝、肾代谢，胆汁排泄",
    effects: [
      { t: "ca", max: 0.35, ec50: 1 }
    ],
    tox: { factor: 4, effects: [ { t: "ca", max: 0.6, ec50: 1 }, { t: "urine", max: 20, ec50: 1 } ], msg: "高钙血症、肾结石、心律失常" },
    allergy: { p: 0.005, msg: "皮疹、瘙痒", effects: [ { t: "histamine", max: 8, ec50: 1 } ] },
    flags: [],
    note: "低钙血症 / 慢性肾病继发甲旁亢；需监测血钙与尿钙"
  },
  {
    id: "allopurinol", name: "别嘌醇", alias: "Allopurinol", cls: "抗痛风药 · 黄嘌呤氧化酶抑制剂",
    unit: "mg", routes: ["po"],
    dose: { min: 100, typical: 100, max: 300 },
    halfLife: 120, onset: 120, peak: 360, dur: 1440,
    metabol: "肝代谢为别黄嘌呤，肾排泄",
    effects: [],
    tox: { factor: 5, effects: [ { t: "hepatic", max: -12, ec50: 1 }, { t: "wbc", max: -2, ec50: 1 } ], msg: "剥脱性皮炎、肝损害、粒细胞缺乏" },
    allergy: { p: 0.03, msg: "皮疹（HLA-B*5801 阳性者风险极高）、发热", effects: [ { t: "temp", max: 1.2, ec50: 1 }, { t: "histamine", max: 20, ec50: 1 } ] },
    flags: [],
    note: "痛风降尿酸；急性期不用，需从小剂量开始并监测皮疹"
  }

];