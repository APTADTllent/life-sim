window.M = window.M || {};
/* 药品数据 5：常规 / 慢病 / 精神 / 呼吸 / 消化 / 泌尿（49 种口服与吸入制剂）
   约定：halfLife / onset / peak / dur 单位为分钟；ec50 相对「一个常用剂量」；
   max 为靶点饱和时的绝对变化量（非百分比）；慢病药效应偏温和，tox.factor 4-5。 */
M.DRUGS5 = [

  /* ============ 调脂与抗栓 ============ */
  {
    id: "rosuvastatin", name: "瑞舒伐他汀", alias: "Rosuvastatin 可定", cls: "调脂药 · 他汀类 HMG-CoA 还原酶抑制剂",
    unit: "mg", routes: ["po"],
    dose: { min: 5, typical: 10, max: 40 },
    rateRange: null,
    halfLife: 1140, onset: 60, peak: 240, dur: 1440,
    metabol: "肝 CYP2C9 少量代谢，约 90% 以原型经胆汁与肾排泄",
    effects: [
      { t: "coronary", max: 5, ec50: 1 }
    ],
    tox: { factor: 5, effects: [ { t: "hepatic", max: -18, ec50: 1 }, { t: "contractility", max: -8, ec50: 1 }, { t: "renal", max: -12, ec50: 1 } ], msg: "横纹肌溶解（肌痛、酱油色尿、CK 显著升高）、转氨酶升高、急性肾损伤" },
    allergy: { p: 0.01, msg: "皮疹、瘙痒、肌痛", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "强效他汀，LDL 降幅约 50%；亚洲人群起始 5 mg，与吉非贝齐、环孢素合用显著增加肌病风险"
  },
  {
    id: "ezetimibe", name: "依折麦布", alias: "Ezetimibe 益适纯", cls: "调脂药 · 肠道胆固醇吸收抑制剂",
    unit: "mg", routes: ["po"],
    dose: { min: 5, typical: 10, max: 20 },
    rateRange: null,
    halfLife: 1320, onset: 60, peak: 240, dur: 1440,
    metabol: "小肠与肝葡萄糖醛酸化（UGT1A1），存在肠肝循环，经粪便与肾排泄",
    effects: [
      { t: "coronary", max: 2.5, ec50: 1 }
    ],
    tox: { factor: 5, effects: [ { t: "hepatic", max: -12, ec50: 1 }, { t: "gi", max: -12, ec50: 1 } ], msg: "腹泻、腹痛、转氨酶升高；与他汀联用时肌病与横纹肌溶解风险增加" },
    allergy: { p: 0.008, msg: "皮疹、血管性水肿、荨麻疹", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: [],
    note: "抑制肠道胆固醇吸收，单用 LDL 降约 18%，常与他汀联用；活动性肝病禁用"
  },
  {
    id: "rivaroxaban", name: "利伐沙班", alias: "Rivaroxaban 拜瑞妥", cls: "抗凝药 · 直接 Xa 因子抑制剂",
    unit: "mg", routes: ["po"],
    dose: { min: 10, typical: 20, max: 20 },
    rateRange: null,
    halfLife: 540, onset: 30, peak: 180, dur: 720,
    metabol: "肝 CYP3A4/2J2 代谢，约 1/3 以原型经肾排泄",
    effects: [
      { t: "clotting", max: -45, ec50: 1 },
      { t: "inr", max: 0.25, ec50: 2 }
    ],
    tox: { factor: 4, effects: [ { t: "clotting", max: -75, ec50: 1 }, { t: "hb", max: -15, ec50: 1.2 } ], msg: "严重出血（消化道、颅内、腹膜后）、血红蛋白进行性下降；可用 Andexanet alfa 或凝血酶原复合物拮抗" },
    allergy: { p: 0.01, msg: "皮疹、瘙痒、转氨酶升高", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "固定剂量口服抗凝，无需常规监测 INR；CrCl < 15 禁用，15–20 mg 需随餐服用以保证吸收"
  },
  {
    id: "apixaban", name: "阿哌沙班", alias: "Apixaban 艾乐妥", cls: "抗凝药 · 直接 Xa 因子抑制剂",
    unit: "mg", routes: ["po"],
    dose: { min: 2.5, typical: 5, max: 10 },
    rateRange: null,
    halfLife: 720, onset: 30, peak: 180, dur: 720,
    metabol: "肝 CYP3A4 代谢，约 27% 经肾排泄，其余经胆汁与粪便",
    effects: [
      { t: "clotting", max: -40, ec50: 1 },
      { t: "inr", max: 0.2, ec50: 2 }
    ],
    tox: { factor: 4, effects: [ { t: "clotting", max: -70, ec50: 1 }, { t: "hb", max: -12, ec50: 1.2 } ], msg: "严重出血、贫血、血肿；过量可用 Andexanet alfa，无特异性解毒剂" },
    allergy: { p: 0.008, msg: "皮疹、瘙痒、肝功能异常", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "房颤卒中预防与 VTE 治疗首选之一；≥80 岁、≤60 kg 或 Cr ≥ 1.5 mg/dL 者减量为 2.5 mg bid"
  },
  {
    id: "dabigatran", name: "达比加群酯", alias: "Dabigatran Etexilate 泰毕全", cls: "抗凝药 · 直接凝血酶抑制剂",
    unit: "mg", routes: ["po"],
    dose: { min: 75, typical: 150, max: 150 },
    rateRange: null,
    halfLife: 840, onset: 30, peak: 120, dur: 720,
    metabol: "前体药经酯酶水解为达比加群，约 80% 以原型经肾排泄，不经 CYP 代谢",
    effects: [
      { t: "clotting", max: -40, ec50: 1 },
      { t: "gi", max: -10, ec50: 1.5 },
      { t: "inr", max: 0.2, ec50: 2 }
    ],
    tox: { factor: 4, effects: [ { t: "clotting", max: -70, ec50: 1 }, { t: "hb", max: -12, ec50: 1.2 }, { t: "gi", max: -20, ec50: 1 } ], msg: "严重出血、消化道出血与消化不良；可用依达赛珠单抗（idarucizumab）快速逆转" },
    allergy: { p: 0.01, msg: "皮疹、瘙痒、食管刺激", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "直接凝血酶抑制剂，胶囊须整粒吞服不可掰开；CrCl < 30 减量，机械瓣置换者禁用"
  },
  {
    id: "prasugrel", name: "普拉格雷", alias: "Prasugrel 普拉格雷片", cls: "抗血小板药 · P2Y12 受体拮抗",
    unit: "mg", routes: ["po"],
    dose: { min: 5, typical: 10, max: 60 },
    rateRange: null,
    halfLife: 420, onset: 30, peak: 60, dur: 720,
    metabol: "前体药经 CYP3A4/2B6/2C9 两步活化，活性代谢物经肾排泄",
    effects: [
      { t: "plt", max: -45, ec50: 1 },
      { t: "clotting", max: -20, ec50: 1.2 }
    ],
    tox: { factor: 4, effects: [ { t: "plt", max: -70, ec50: 1 }, { t: "clotting", max: -45, ec50: 1 }, { t: "hb", max: -15, ec50: 1.5 } ], msg: "严重出血、颅内出血、消化道出血；出血风险高于氯吡格雷" },
    allergy: { p: 0.008, msg: "皮疹、瘙痒、血管性水肿", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "ACS/PCI 抗血小板，起效快于氯吡格雷；既往卒中/TIA 禁用，≥75 岁或 < 60 kg 减量"
  },

  /* ============ 糖尿病用药 ============ */
  {
    id: "sitagliptin", name: "西格列汀", alias: "Sitagliptin 捷诺维", cls: "降糖药 · DPP-4 抑制剂",
    unit: "mg", routes: ["po"],
    dose: { min: 25, typical: 100, max: 100 },
    rateRange: null,
    halfLife: 720, onset: 30, peak: 120, dur: 720,
    metabol: "基本不经代谢，约 80% 以原型经肾排泄",
    effects: [
      { t: "glucose", max: -2.5, ec50: 1 },
      { t: "insulin", max: 2, ec50: 1.5 },
      { t: "gi", max: -4, ec50: 1.5 }
    ],
    tox: { factor: 4, effects: [ { t: "gi", max: -20, ec50: 1 }, { t: "hepatic", max: -10, ec50: 1.5 }, { t: "glucose", max: -2.5, ec50: 1 } ], msg: "低血糖（与磺脲类或胰岛素联用时）、急性胰腺炎、关节痛、上呼吸道感染" },
    allergy: { p: 0.01, msg: "皮疹、荨麻疹、血管性水肿（罕见过敏性休克）", effects: [ { t: "histamine", max: 15, ec50: 1 } ] },
    flags: [],
    note: "葡萄糖依赖性促胰岛素分泌，单用低血糖风险低；eGFR 30–45 减为 50 mg，< 30 减为 25 mg"
  },
  {
    id: "empagliflozin", name: "恩格列净", alias: "Empagliflozin 欧唐静", cls: "降糖药 · SGLT2 抑制剂",
    unit: "mg", routes: ["po"],
    dose: { min: 10, typical: 10, max: 25 },
    rateRange: null,
    halfLife: 720, onset: 60, peak: 120, dur: 1440,
    metabol: "肝 UGT 葡萄糖醛酸化，约 50% 经肾排泄",
    effects: [
      { t: "glucose", max: -2.6, ec50: 1 },
      { t: "urine", max: 15, ec50: 1.5 },
      { t: "volume", max: -150, ec50: 1.5 },
      { t: "sbp", max: -4, ec50: 1.5 }
    ],
    tox: { factor: 4, effects: [ { t: "glucose", max: -3, ec50: 1 }, { t: "urine", max: 40, ec50: 1 }, { t: "volume", max: -400, ec50: 1 }, { t: "sbp", max: -15, ec50: 1 } ], msg: "容量不足与低血压、渗透性利尿脱水、正常血糖酮症酸中毒、泌尿生殖道真菌感染" },
    allergy: { p: 0.005, msg: "皮疹、瘙痒、外阴阴道炎", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "心衰与 CKD 获益明确；急性病、禁食或围术期前 3 天停药以防正常血糖酮症酸中毒"
  },
  {
    id: "dapagliflozin", name: "达格列净", alias: "Dapagliflozin 安达唐", cls: "降糖药 · SGLT2 抑制剂",
    unit: "mg", routes: ["po"],
    dose: { min: 5, typical: 10, max: 10 },
    rateRange: null,
    halfLife: 780, onset: 60, peak: 120, dur: 1440,
    metabol: "肝 UGT1A9 代谢，主要经肾排泄",
    effects: [
      { t: "glucose", max: -2.4, ec50: 1 },
      { t: "urine", max: 14, ec50: 1.5 },
      { t: "volume", max: -140, ec50: 1.5 },
      { t: "sbp", max: -4, ec50: 1.5 }
    ],
    tox: { factor: 4, effects: [ { t: "glucose", max: -2.8, ec50: 1 }, { t: "urine", max: 38, ec50: 1 }, { t: "volume", max: -380, ec50: 1 }, { t: "sbp", max: -14, ec50: 1 } ], msg: "脱水与低血压、酮症酸中毒（血糖可正常）、生殖道真菌感染、会阴坏死性筋膜炎（罕见）" },
    allergy: { p: 0.005, msg: "皮疹、外阴瘙痒", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "HFrEF 与 CKD 一线用药，可延缓肾功能下降；同样警惕容量不足与正常血糖酮症酸中毒"
  },
  {
    id: "gliclazide", name: "格列齐特", alias: "Gliclazide 达美康", cls: "降糖药 · 磺脲类促泌剂",
    unit: "mg", routes: ["po"],
    dose: { min: 30, typical: 60, max: 120 },
    rateRange: null,
    halfLife: 600, onset: 30, peak: 120, dur: 720,
    metabol: "肝 CYP2C9 代谢，代谢物无活性，经肾排泄",
    effects: [
      { t: "glucose", max: -4.5, ec50: 1 }
    ],
    tox: { factor: 3, effects: [ { t: "glucose", max: -4, ec50: 1 }, { t: "brain", max: -12, ec50: 1 }, { t: "seizure", max: 10, ec50: 1.2 } ], msg: "顽固性低血糖、低血糖昏迷与癫痫；老年、肾功能不全、进食不足者风险最高" },
    allergy: { p: 0.02, msg: "皮疹、瘙痒、血细胞减少", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: [],
    note: "磺脲类促胰岛素分泌，须规律进餐；eGFR < 45 慎用，反复低血糖者改用胰岛素"
  },
  {
    id: "pioglitazone", name: "吡格列酮", alias: "Pioglitazone 艾可拓", cls: "降糖药 · 噻唑烷二酮类胰岛素增敏剂",
    unit: "mg", routes: ["po"],
    dose: { min: 15, typical: 30, max: 45 },
    rateRange: null,
    halfLife: 1200, onset: 120, peak: 240, dur: 1440,
    metabol: "肝 CYP2C8 代谢，活性代谢物半衰期 16–24 小时",
    effects: [
      { t: "glucose", max: -3, ec50: 1 },
      { t: "volume", max: 200, ec50: 1.5 },
      { t: "sbp", max: -4, ec50: 1.5 }
    ],
    tox: { factor: 4, effects: [ { t: "volume", max: 500, ec50: 1 }, { t: "sbp", max: -8, ec50: 1.5 }, { t: "hepatic", max: -20, ec50: 1 }, { t: "glucose", max: -2, ec50: 1.5 } ], msg: "水钠潴留致心衰加重与体重增加、肝损害、骨折与膀胱癌风险升高" },
    allergy: { p: 0.005, msg: "皮疹、瘙痒、水肿", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "胰岛素增敏剂，起效需 2–4 周；NYHA III–IV 心衰、活动性肝病与膀胱癌史者禁用"
  },
  {
    id: "acarbose", name: "阿卡波糖", alias: "Acarbose 拜唐苹", cls: "降糖药 · α-糖苷酶抑制剂",
    unit: "mg", routes: ["po"],
    dose: { min: 25, typical: 50, max: 100 },
    rateRange: null,
    halfLife: 120, onset: 15, peak: 60, dur: 240,
    metabol: "肠道内几乎不吸收，经肠道菌群与淀粉酶降解后排出",
    effects: [
      { t: "glucose", max: -2.2, ec50: 1 },
      { t: "gi", max: -12, ec50: 1.5 }
    ],
    tox: { factor: 4, effects: [ { t: "gi", max: -30, ec50: 1 }, { t: "hepatic", max: -12, ec50: 1.5 } ], msg: "腹胀、排气增多、腹泻；与其他降糖药联用的低血糖必须口服葡萄糖纠正，蔗糖无效" },
    allergy: { p: 0.005, msg: "皮疹、腹胀、肝酶升高", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "延缓碳水化合物吸收，随第一口饭嚼服；炎症性肠病、肠梗阻与严重肾功能不全禁用"
  },
  {
    id: "liraglutide", name: "利拉鲁肽", alias: "Liraglutide 诺和力", cls: "降糖药 · GLP-1 受体激动剂",
    unit: "mg", routes: ["sc"],
    dose: { min: 0.6, typical: 1.2, max: 1.8 },
    rateRange: null,
    halfLife: 780, onset: 30, peak: 480, dur: 1440,
    metabol: "皮下缓慢吸收，经 DPP-4 与中性内肽酶降解，代谢物经肾排泄",
    effects: [
      { t: "glucose", max: -3, ec50: 1 },
      { t: "gi", max: -10, ec50: 1.5 },
      { t: "hr", max: 5, ec50: 1.5 },
      { t: "sbp", max: -4, ec50: 1.5 }
    ],
    tox: { factor: 4, effects: [ { t: "emesis", max: 30, ec50: 1 }, { t: "gi", max: -25, ec50: 1 }, { t: "glucose", max: -3, ec50: 1 }, { t: "hr", max: 12, ec50: 1.2 } ], msg: "剧烈恶心呕吐与脱水、低血糖（联用磺脲类/胰岛素）、急性胰腺炎、胆囊疾病" },
    allergy: { p: 0.008, msg: "皮疹、注射部位反应、瘙痒", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: [],
    note: "每日一次皮下注射，0.6 mg 起始逐步加量；甲状腺髓样癌家族史或 MEN2 患者禁用"
  },
  {
    id: "semaglutide", name: "司美格鲁肽", alias: "Semaglutide 诺和泰", cls: "降糖药 · 长效 GLP-1 受体激动剂",
    unit: "mg", routes: ["sc"],
    dose: { min: 0.25, typical: 0.5, max: 1 },
    rateRange: null,
    halfLife: 9900, onset: 60, peak: 1440, dur: 10080,
    metabol: "脂肪酸侧链延长半衰期，经蛋白水解与肾排泄清除",
    effects: [
      { t: "glucose", max: -3.5, ec50: 1 },
      { t: "gi", max: -10, ec50: 1.5 },
      { t: "hr", max: 4, ec50: 1.5 },
      { t: "sbp", max: -5, ec50: 1.5 }
    ],
    tox: { factor: 4, effects: [ { t: "emesis", max: 35, ec50: 1 }, { t: "gi", max: -30, ec50: 1 }, { t: "glucose", max: -3, ec50: 1 } ], msg: "顽固恶心呕吐与脱水、急性胰腺炎、胆囊结石；与胰岛素或磺脲类联用可致低血糖" },
    allergy: { p: 0.006, msg: "皮疹、注射部位红肿", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "每周一次皮下注射，0.25 mg 起始每 4 周递增至 1 mg（降糖）；减重适应证可至 2.4 mg。禁用于甲状腺髓样癌史、MEN2 与妊娠"
  },

  /* ============ 甲状腺与激素 ============ */
  {
    id: "carbimazole", name: "卡比马唑", alias: "Carbimazole 甲亢平", cls: "抗甲状腺药 · 硫脲类",
    unit: "mg", routes: ["po"],
    dose: { min: 5, typical: 10, max: 30 },
    rateRange: null,
    halfLife: 360, onset: 60, peak: 180, dur: 720,
    metabol: "前体药在肝内转化为甲巯咪唑后起效，经肾排泄",
    effects: [
      { t: "hr", max: -15, ec50: 1 },
      { t: "temp", max: -0.3, ec50: 1.5 },
      { t: "thyroid", max: -12, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "wbc", max: -5, ec50: 1 }, { t: "hepatic", max: -12, ec50: 1 }, { t: "hr", max: -5, ec50: 1.5 } ], msg: "粒细胞缺乏（发热、咽痛须立即查血常规并停药）、肝损害、胆汁淤积性黄疸" },
    allergy: { p: 0.03, msg: "皮疹、瘙痒、药物热、粒细胞减少", effects: [ { t: "histamine", max: 20, ec50: 1 }, { t: "temp", max: 0.8, ec50: 1 } ] },
    flags: [],
    note: "甲亢常规治疗，起效需 2–4 周；妊娠早期改用丙硫氧嘧啶，用药前查血常规与肝功能"
  },
  {
    id: "prednisolone", name: "泼尼松龙", alias: "Prednisolone 强的松龙", cls: "糖皮质激素 · 中效口服",
    unit: "mg", routes: ["po"],
    dose: { min: 5, typical: 30, max: 60 },
    rateRange: null,
    halfLife: 200, onset: 60, peak: 240, dur: 720,
    metabol: "肝代谢为无活性产物，部分经肾排泄；本身即活性型，无需肝转化",
    effects: [
      { t: "histamine", max: -20, ec50: 1 },
      { t: "glucose", max: 1.8, ec50: 1 },
      { t: "immune", max: -10, ec50: 1.5 },
      { t: "gi", max: -6, ec50: 1.5 }
    ],
    tox: { factor: 4, effects: [ { t: "glucose", max: 4, ec50: 1 }, { t: "immune", max: -15, ec50: 1 }, { t: "gi", max: -15, ec50: 1 }, { t: "k", max: -0.6, ec50: 1.5 } ], msg: "高血糖、感染扩散、应激性溃疡出血、低钾与精神症状；长期使用致骨质疏松与库欣貌" },
    allergy: { p: 0.01, msg: "皮疹、面部潮红、注射部位反应", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "中效糖皮质激素，晨起顿服；肝功能不全者优于泼尼松，长期使用需补钙并缓慢减停"
  },

  /* ============ 精神科 ============ */
  {
    id: "escitalopram", name: "艾司西酞普兰", alias: "Escitalopram 来士普", cls: "抗抑郁药 · SSRI",
    unit: "mg", routes: ["po"],
    dose: { min: 5, typical: 10, max: 20 },
    rateRange: null,
    halfLife: 1800, onset: 1440, peak: 300, dur: 1440,
    metabol: "肝 CYP2C19 与 CYP3A4 代谢，经肾排泄",
    effects: [
      { t: "brain", max: 12, ec50: 1.5 },
      { t: "qt", max: 12, ec50: 1.5 },
      { t: "na", max: -2, ec50: 1.5 },
      { t: "gi", max: -6, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "qt", max: 50, ec50: 1 }, { t: "brain", max: -20, ec50: 1 }, { t: "na", max: -5, ec50: 1 }, { t: "seizure", max: 15, ec50: 1.2 } ], msg: "5-羟色胺综合征（激越、震颤、高热、肌阵挛）、QT 延长、低钠血症与癫痫" },
    allergy: { p: 0.01, msg: "皮疹、荨麻疹、血管性水肿", effects: [ { t: "histamine", max: 18, ec50: 1 } ] },
    flags: [],
    note: "抑郁与广泛性焦虑一线，2–4 周起效；禁与 MAOI 合用，老年人低钠血症与 QT 风险需监测"
  },
  {
    id: "fluoxetine", name: "氟西汀", alias: "Fluoxetine 百优解", cls: "抗抑郁药 · SSRI",
    unit: "mg", routes: ["po"],
    dose: { min: 10, typical: 20, max: 60 },
    rateRange: null,
    halfLife: 4320, onset: 1440, peak: 480, dur: 1440,
    metabol: "肝 CYP2D6 代谢为去甲氟西汀，活性代谢物半衰期 7–15 天",
    effects: [
      { t: "brain", max: 10, ec50: 1.5 },
      { t: "gi", max: -10, ec50: 1.5 },
      { t: "qt", max: 8, ec50: 2 }
    ],
    tox: { factor: 3, effects: [ { t: "qt", max: 35, ec50: 1 }, { t: "seizure", max: 20, ec50: 1.2 }, { t: "brain", max: -20, ec50: 1 }, { t: "gi", max: -20, ec50: 1 } ], msg: "5-羟色胺综合征、癫痫、QT 延长；因半衰期极长，症状迁延数天" },
    allergy: { p: 0.01, msg: "皮疹、荨麻疹、血管性水肿", effects: [ { t: "histamine", max: 18, ec50: 1 } ] },
    flags: [],
    note: "半衰期最长的 SSRI，停药反应少但为强 CYP2D6 抑制剂；儿童青少年用药初期需监测自杀观念"
  },
  {
    id: "venlafaxine", name: "文拉法辛", alias: "Venlafaxine 怡诺思", cls: "抗抑郁药 · SNRI",
    unit: "mg", routes: ["po"],
    dose: { min: 37.5, typical: 75, max: 225 },
    rateRange: null,
    halfLife: 300, onset: 1440, peak: 480, dur: 1440,
    metabol: "肝 CYP2D6 代谢为去甲文拉法辛（活性），两者均经肾排泄",
    effects: [
      { t: "brain", max: 10, ec50: 1.5 },
      { t: "hr", max: 6, ec50: 1.5 },
      { t: "sbp", max: 6, ec50: 1.5 },
      { t: "gi", max: -10, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "sbp", max: 30, ec50: 1 }, { t: "hr", max: 30, ec50: 1 }, { t: "seizure", max: 20, ec50: 1.2 }, { t: "brain", max: -15, ec50: 1 } ], msg: "5-羟色胺综合征、高血压、心动过速与癫痫；撤药反应明显（头晕、电击感）" },
    allergy: { p: 0.01, msg: "皮疹、瘙痒、血管性水肿", effects: [ { t: "histamine", max: 15, ec50: 1 } ] },
    flags: [],
    note: "SNRI，高剂量可升高血压需监测；停药须缓慢减量，禁与 MAOI 联用"
  },
  {
    id: "mirtazapine", name: "米氮平", alias: "Mirtazapine 瑞美隆", cls: "抗抑郁药 · NaSSA",
    unit: "mg", routes: ["po"],
    dose: { min: 15, typical: 30, max: 45 },
    rateRange: null,
    halfLife: 1800, onset: 60, peak: 120, dur: 1440,
    metabol: "肝 CYP2D6/1A2/3A4 代谢，经肾与粪便排泄",
    effects: [
      { t: "sedation", max: 40, ec50: 1 },
      { t: "brain", max: 10, ec50: 1.5 },
      { t: "histamine", max: -15, ec50: 1.5 }
    ],
    tox: { factor: 4, effects: [ { t: "sedation", max: 65, ec50: 1 }, { t: "gcs", max: -5, ec50: 1 }, { t: "rr", max: -5, ec50: 1.2 }, { t: "hr", max: 15, ec50: 1.2 } ], msg: "过度镇静、呼吸抑制与意识障碍，与酒精或苯二氮䓬类合用时风险显著增加" },
    allergy: { p: 0.008, msg: "皮疹、水肿、肝酶升高", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: [],
    note: "促食欲与镇静作用明显，适合伴失眠、消瘦的抑郁患者；低剂量镇静更强，需警惕体重增加"
  },
  {
    id: "quetiapine", name: "喹硫平", alias: "Quetiapine 思瑞康", cls: "抗精神病药 · 非典型（SGA）",
    unit: "mg", routes: ["po"],
    dose: { min: 25, typical: 100, max: 400 },
    rateRange: null,
    halfLife: 400, onset: 60, peak: 120, dur: 720,
    metabol: "肝 CYP3A4 代谢，活性代谢物去甲喹硫平经肾排泄",
    effects: [
      { t: "sedation", max: 50, ec50: 1 },
      { t: "sbp", max: -12, ec50: 1.5 },
      { t: "hr", max: 8, ec50: 1.5 },
      { t: "qt", max: 10, ec50: 1.5 },
      { t: "histamine", max: -20, ec50: 1.5 }
    ],
    tox: { factor: 4, effects: [ { t: "sedation", max: 85, ec50: 1 }, { t: "sbp", max: -35, ec50: 1 }, { t: "qt", max: 45, ec50: 1 }, { t: "gcs", max: -6, ec50: 1 } ], msg: "过度镇静、直立性低血压、QT 延长与昏迷；与 CYP3A4 抑制剂或酒精合用风险显著增加" },
    allergy: { p: 0.01, msg: "皮疹、瘙痒、肝酶升高", effects: [ { t: "histamine", max: 15, ec50: 1 } ] },
    flags: [],
    note: "小剂量用于失眠与焦虑、足量治疗精神分裂与双相；需缓慢滴定并监测体位性低血压与代谢指标"
  },
  {
    id: "risperidone", name: "利培酮", alias: "Risperidone 维思通", cls: "抗精神病药 · 非典型（SGA）",
    unit: "mg", routes: ["po"],
    dose: { min: 0.5, typical: 2, max: 6 },
    rateRange: null,
    halfLife: 1200, onset: 60, peak: 120, dur: 1440,
    metabol: "肝 CYP2D6 代谢为 9-羟利培酮（活性），经肾排泄",
    effects: [
      { t: "sedation", max: 25, ec50: 1 },
      { t: "sbp", max: -10, ec50: 1.5 },
      { t: "qt", max: 8, ec50: 1.5 },
      { t: "gi", max: -6, ec50: 1.5 }
    ],
    tox: { factor: 4, effects: [ { t: "sedation", max: 60, ec50: 1 }, { t: "sbp", max: -35, ec50: 1 }, { t: "qt", max: 40, ec50: 1 }, { t: "seizure", max: 15, ec50: 1.2 } ], msg: "锥体外系反应（肌张力障碍、静坐不能）、高泌乳素血症、QT 延长与体位性低血压" },
    allergy: { p: 0.015, msg: "皮疹、瘙痒、血管性水肿", effects: [ { t: "histamine", max: 18, ec50: 1 } ] },
    flags: [],
    note: "精神分裂症与躁狂一线；帕金森病与路易体痴呆患者锥体外系反应风险极高，需小剂量起始"
  },
  {
    id: "aripiprazole", name: "阿立哌唑", alias: "Aripiprazole 安律凡", cls: "抗精神病药 · 多巴胺部分激动剂",
    unit: "mg", routes: ["po"],
    dose: { min: 2.5, typical: 10, max: 30 },
    rateRange: null,
    halfLife: 4500, onset: 120, peak: 240, dur: 1440,
    metabol: "肝 CYP2D6/3A4 代谢，去氢阿立哌唑具活性，经肾与粪便排泄",
    effects: [
      { t: "sedation", max: 12, ec50: 1 },
      { t: "sbp", max: -5, ec50: 2 },
      { t: "gi", max: -5, ec50: 1.5 },
      { t: "qt", max: 5, ec50: 2 }
    ],
    tox: { factor: 4, effects: [ { t: "sedation", max: 45, ec50: 1 }, { t: "sbp", max: -15, ec50: 1.5 }, { t: "seizure", max: 12, ec50: 1.2 }, { t: "qt", max: 20, ec50: 1.2 } ], msg: "静坐不能、嗜睡、恶心、心动过速；过量以镇静与锥体外系反应为主" },
    allergy: { p: 0.008, msg: "皮疹、瘙痒、注射部位反应", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: [],
    note: "多巴胺部分激动剂，镇静与体重增加较轻、代谢影响小；长效针剂适用于依从性差者"
  },
  {
    id: "clozapine", name: "氯氮平", alias: "Clozapine 氯扎平", cls: "抗精神病药 · 难治性精神分裂症",
    unit: "mg", routes: ["po"],
    dose: { min: 12.5, typical: 100, max: 450 },
    rateRange: null,
    halfLife: 720, onset: 120, peak: 180, dur: 1440,
    metabol: "肝 CYP1A2（主要）、CYP2D6 与 CYP3A4 代谢，经肾排泄",
    effects: [
      { t: "sedation", max: 60, ec50: 1 },
      { t: "sbp", max: -20, ec50: 1.5 },
      { t: "hr", max: 12, ec50: 1.2 },
      { t: "secretions", max: 30, ec50: 1.5 },
      { t: "wbc", max: -1.5, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "wbc", max: -6, ec50: 1 }, { t: "sedation", max: 90, ec50: 1 }, { t: "sbp", max: -40, ec50: 1 }, { t: "qt", max: 40, ec50: 1 }, { t: "seizure", max: 30, ec50: 1 } ], msg: "粒细胞缺乏、心肌炎、癫痫、肠麻痹与恶性综合征；过量致昏迷、呼吸抑制与严重低血压" },
    allergy: { p: 0.02, msg: "皮疹、发热、嗜酸性粒细胞增多", effects: [ { t: "histamine", max: 20, ec50: 1 }, { t: "temp", max: 0.9, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "难治性精神分裂症的最后选择，需定期监测血常规（前 6 个月每周）；发热咽痛立即停药查中性粒细胞"
  },

  /* ============ 神经科 ============ */
  {
    id: "donepezil", name: "多奈哌齐", alias: "Donepezil 安理申", cls: "抗痴呆药 · 胆碱酯酶抑制剂",
    unit: "mg", routes: ["po"],
    dose: { min: 5, typical: 5, max: 10 },
    rateRange: null,
    halfLife: 4200, onset: 60, peak: 180, dur: 1440,
    metabol: "肝 CYP2D6/3A4 代谢，经肾排泄",
    effects: [
      { t: "brain", max: 8, ec50: 1.5 },
      { t: "gcs", max: 1, ec50: 1.5 },
      { t: "gi", max: -10, ec50: 1.5 },
      { t: "hr", max: -6, ec50: 1.5 }
    ],
    tox: { factor: 4, effects: [ { t: "gi", max: -35, ec50: 1 }, { t: "hr", max: -30, ec50: 1 }, { t: "secretions", max: 35, ec50: 1 }, { t: "seizure", max: 10, ec50: 1.2 } ], msg: "胆碱能危象：恶心呕吐、流涎、大汗、心动过缓与抽搐" },
    allergy: { p: 0.008, msg: "皮疹、瘙痒、恶心", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "阿尔茨海默病一线，5 mg 睡前服 4 周后可增至 10 mg；病态窦房结综合征与消化性溃疡者慎用"
  },
  {
    id: "levodopa_carbidopa", name: "左旋多巴/卡比多巴", alias: "Levodopa/Carbidopa 息宁", cls: "抗帕金森药 · 多巴胺前体复方",
    unit: "mg", routes: ["po"],
    dose: { min: 50, typical: 100, max: 250 },
    rateRange: null,
    halfLife: 90, onset: 30, peak: 60, dur: 180,
    metabol: "左旋多巴经外周脱羧酶（卡比多巴抑制）与 COMT 代谢，主要经肾排泄",
    effects: [
      { t: "brain", max: 18, ec50: 1 },
      { t: "gcs", max: 2, ec50: 1.5 },
      { t: "gi", max: -12, ec50: 1.5 },
      { t: "sbp", max: -8, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "brain", max: -20, ec50: 1 }, { t: "emesis", max: 40, ec50: 1 }, { t: "sbp", max: -30, ec50: 1 }, { t: "hr", max: 25, ec50: 1.2 } ], msg: "异动症、精神症状与幻觉、直立性低血压、心律失常；长期用药出现剂末现象与开关现象" },
    allergy: { p: 0.01, msg: "皮疹、瘙痒、恶心", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: [],
    note: "帕金森病金标准，按左旋多巴计量（100 mg 复方含卡比多巴 25 mg）；高蛋白饮食影响吸收，禁与非选择性 MAOI 合用"
  },
  {
    id: "sumatriptan", name: "舒马曲普坦", alias: "Sumatriptan 英明格", cls: "偏头痛药 · 5-HT1B/1D 激动剂",
    unit: "mg", routes: ["po"],
    dose: { min: 25, typical: 50, max: 100 },
    rateRange: null,
    halfLife: 120, onset: 30, peak: 120, dur: 360,
    metabol: "单胺氧化酶 A 代谢，代谢物经肾排泄",
    effects: [
      { t: "pain", max: -30, ec50: 1 },
      { t: "coronary", max: -12, ec50: 1.5 },
      { t: "sbp", max: 8, ec50: 1.5 },
      { t: "gi", max: -5, ec50: 2 }
    ],
    tox: { factor: 3, effects: [ { t: "coronary", max: -40, ec50: 1 }, { t: "sbp", max: 35, ec50: 1 }, { t: "hr", max: 20, ec50: 1.2 }, { t: "brain", max: -10, ec50: 1.5 } ], msg: "冠脉痉挛与心肌缺血、高血压危象、5-羟色胺综合征（与 SSRI 合用）" },
    allergy: { p: 0.005, msg: "皮疹、注射部位反应、喉部紧束感", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "偏头痛急性期用药，24 小时内不超过 200 mg；缺血性心脏病、未控制高血压与卒中史者禁用"
  },
  {
    id: "topiramate", name: "托吡酯", alias: "Topiramate 妥泰", cls: "抗癫痫药 · 钠通道与 GABA 增强",
    unit: "mg", routes: ["po"],
    dose: { min: 25, typical: 50, max: 200 },
    rateRange: null,
    halfLife: 1260, onset: 60, peak: 240, dur: 1440,
    metabol: "约 70% 以原型经肾排泄，其余经肝氧化代谢",
    effects: [
      { t: "seizure", max: -35, ec50: 1 },
      { t: "brain", max: -8, ec50: 1.5 },
      { t: "gi", max: -8, ec50: 1.5 },
      { t: "ph", max: -0.03, ec50: 2 }
    ],
    tox: { factor: 4, effects: [ { t: "brain", max: -30, ec50: 1 }, { t: "gi", max: -25, ec50: 1 }, { t: "ph", max: -0.12, ec50: 1 }, { t: "renal", max: -18, ec50: 1.2 } ], msg: "认知迟缓与言语找词困难、代谢性酸中毒、肾结石、少汗与高热" },
    allergy: { p: 0.01, msg: "皮疹、瘙痒、感觉异常", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: [],
    note: "抗癫痫与偏头痛预防，须缓慢滴定；用药前查肾功能与眼压（可致急性闭角型青光眼）"
  },
  {
    id: "gabapentin", name: "加巴喷丁", alias: "Gabapentin 加巴喷丁胶囊", cls: "抗癫痫药 · 钙通道 α2δ 配体",
    unit: "mg", routes: ["po"],
    dose: { min: 100, typical: 300, max: 1200 },
    rateRange: null,
    halfLife: 360, onset: 60, peak: 180, dur: 480,
    metabol: "不经代谢，以原型经肾排泄",
    effects: [
      { t: "seizure", max: -20, ec50: 1.5 },
      { t: "pain", max: -22, ec50: 1.5 },
      { t: "sedation", max: 20, ec50: 1.5 },
      { t: "gi", max: -5, ec50: 2 }
    ],
    tox: { factor: 4, effects: [ { t: "sedation", max: 60, ec50: 1 }, { t: "gcs", max: -5, ec50: 1 }, { t: "rr", max: -6, ec50: 1.2 } ], msg: "嗜睡、共济失调、视物模糊与呼吸抑制，与阿片类合用时死亡风险增加" },
    allergy: { p: 0.008, msg: "皮疹、瘙痒、水肿", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "神经病理性疼痛与癫痫辅助用药，按 CrCl 调整剂量；突然停药可诱发癫痫"
  },
  {
    id: "pregabalin", name: "普瑞巴林", alias: "Pregabalin 乐瑞卡", cls: "抗癫痫药 · 钙通道 α2δ 配体",
    unit: "mg", routes: ["po"],
    dose: { min: 25, typical: 75, max: 300 },
    rateRange: null,
    halfLife: 360, onset: 60, peak: 120, dur: 480,
    metabol: "几乎不经代谢，以原型经肾排泄",
    effects: [
      { t: "pain", max: -25, ec50: 1.5 },
      { t: "seizure", max: -18, ec50: 1.5 },
      { t: "sedation", max: 22, ec50: 1.5 },
      { t: "gi", max: -5, ec50: 2 }
    ],
    tox: { factor: 4, effects: [ { t: "sedation", max: 65, ec50: 1 }, { t: "gcs", max: -5, ec50: 1 }, { t: "rr", max: -7, ec50: 1.2 }, { t: "gi", max: -10, ec50: 1.5 } ], msg: "嗜睡、头晕、共济失调与呼吸抑制；与阿片类或酒精合用可致死" },
    allergy: { p: 0.008, msg: "皮疹、瘙痒、血管性水肿", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: [],
    note: "神经病理性疼痛与纤维肌痛一线，需按肾功能减量；长期使用后须缓慢减停"
  },
  /* ============ 呼吸科 ============ */
  {
    id: "montelukast", name: "孟鲁司特", alias: "Montelukast 顺尔宁", cls: "平喘药 · 白三烯受体拮抗剂",
    unit: "mg", routes: ["po"],
    dose: { min: 4, typical: 10, max: 10 },
    rateRange: null,
    halfLife: 300, onset: 60, peak: 180, dur: 720,
    metabol: "肝 CYP2C8 代谢，经胆汁与粪便排泄",
    effects: [
      { t: "bronchospasm", max: -18, ec50: 1 },
      { t: "cough", max: -22, ec50: 1 },
      { t: "secretions", max: -6, ec50: 1.5 }
    ],
    tox: { factor: 5, effects: [ { t: "brain", max: -18, ec50: 1 }, { t: "gi", max: -12, ec50: 1.5 }, { t: "hepatic", max: -8, ec50: 1.5 } ], msg: "神经精神事件（噩梦、激越、抑郁、自杀观念）、头痛与腹痛；过量以精神症状为主" },
    allergy: { p: 0.01, msg: "皮疹、瘙痒、嗜酸性粒细胞增多", effects: [ { t: "histamine", max: 15, ec50: 1 } ] },
    flags: [],
    note: "哮喘控制与运动诱发支气管痉挛预防，不用于急性发作；用药期间需关注情绪与行为改变"
  },
  {
    id: "tiotropium", name: "噻托溴铵", alias: "Tiotropium 思力华", cls: "平喘药 · 长效抗胆碱能（LAMA）",
    unit: "mcg", routes: ["inhale"],
    dose: { min: 9, typical: 18, max: 36 },
    rateRange: null,
    halfLife: 7920, onset: 30, peak: 120, dur: 1440,
    metabol: "吸入后少量吸收，以原型经肾排泄，不经 CYP 代谢",
    effects: [
      { t: "bronchospasm", max: -30, ec50: 1 },
      { t: "secretions", max: -12, ec50: 1.5 },
      { t: "rr", max: -2, ec50: 1.5 },
      { t: "cough", max: -10, ec50: 1.5 }
    ],
    tox: { factor: 4, effects: [ { t: "pupil", max: 30, ec50: 1 }, { t: "hr", max: 30, ec50: 1.2 }, { t: "urine", max: -35, ec50: 1.2 }, { t: "gcs", max: -3, ec50: 1.5 } ], msg: "抗胆碱能中毒：口干、瞳孔散大、心动过速、尿潴留与意识模糊" },
    allergy: { p: 0.008, msg: "皮疹、口苦、支气管痉挛", effects: [ { t: "histamine", max: 12, ec50: 1 }, { t: "bronchospasm", max: 15, ec50: 1 } ] },
    flags: [],
    note: "慢阻肺维持治疗每日一次；药粉误入眼可诱发闭角型青光眼，中重度肾功能不全者慎用"
  },
  {
    id: "formoterol", name: "福莫特罗", alias: "Formoterol 福莫特罗吸入剂", cls: "平喘药 · 长效 β2 激动剂（LABA）",
    unit: "mcg", routes: ["inhale"],
    dose: { min: 6, typical: 12, max: 24 },
    rateRange: null,
    halfLife: 600, onset: 5, peak: 30, dur: 720,
    metabol: "肝葡萄糖醛酸化与 O-去甲基化，代谢物经肾排泄",
    effects: [
      { t: "bronchospasm", max: -45, ec50: 1 },
      { t: "hr", max: 10, ec50: 1.5 },
      { t: "k", max: -0.3, ec50: 1.5 },
      { t: "sbp", max: 5, ec50: 2 }
    ],
    tox: { factor: 3, effects: [ { t: "hr", max: 50, ec50: 1 }, { t: "k", max: -1, ec50: 1 }, { t: "arrhythmia", max: 30, ec50: 1.2 }, { t: "qt", max: 25, ec50: 1.2 } ], msg: "心悸、震颤、低钾血症、QT 延长与室性心律失常" },
    allergy: { p: 0.006, msg: "皮疹、口咽刺激、支气管痉挛", effects: [ { t: "histamine", max: 12, ec50: 1 }, { t: "bronchospasm", max: 20, ec50: 1 } ] },
    flags: [],
    note: "长效 β2 激动剂，起效快可作维持与缓解；哮喘中不可单药使用，必须联合吸入激素"
  },
  {
    id: "codeine", name: "可待因", alias: "Codeine 磷酸可待因", cls: "止咳药 · 中枢性镇咳与弱阿片",
    unit: "mg", routes: ["po"],
    dose: { min: 15, typical: 30, max: 60 },
    rateRange: null,
    halfLife: 180, onset: 30, peak: 60, dur: 360,
    metabol: "肝 CYP2D6 转化为吗啡（约 10%），CYP3A4 生成去甲可待因",
    effects: [
      { t: "cough", max: -35, ec50: 1 },
      { t: "pain", max: -22, ec50: 1.5 },
      { t: "sedation", max: 15, ec50: 1.5 },
      { t: "rr", max: -2, ec50: 1.5 },
      { t: "gi", max: -10, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "rr", max: -9, ec50: 1 }, { t: "spo2", max: -10, ec50: 1 }, { t: "gcs", max: -6, ec50: 1 }, { t: "sedation", max: 65, ec50: 1 } ], msg: "呼吸抑制、昏迷、针尖样瞳孔；CYP2D6 超快代谢型与 12 岁以下儿童可致死" },
    allergy: { p: 0.01, msg: "皮疹、瘙痒、支气管痉挛", effects: [ { t: "histamine", max: 25, ec50: 1 }, { t: "bronchospasm", max: 20, ec50: 1 } ] },
    flags: ["controlled"],
    note: "中枢性镇咳与弱阿片镇痛；12 岁以下、哺乳期、超快代谢型禁用，长期使用可致依赖与便秘"
  },
  {
    id: "dextromethorphan", name: "右美沙芬", alias: "Dextromethorphan 美沙芬", cls: "止咳药 · 非阿片类中枢镇咳",
    unit: "mg", routes: ["po"],
    dose: { min: 10, typical: 30, max: 60 },
    rateRange: null,
    halfLife: 240, onset: 30, peak: 90, dur: 360,
    metabol: "肝 CYP2D6 代谢为右啡烷，代谢物经肾排泄",
    effects: [
      { t: "cough", max: -45, ec50: 1 },
      { t: "sedation", max: 8, ec50: 1.5 },
      { t: "gi", max: -5, ec50: 2 }
    ],
    tox: { factor: 3, effects: [ { t: "sedation", max: 55, ec50: 1 }, { t: "gcs", max: -5, ec50: 1 }, { t: "hr", max: 25, ec50: 1.2 }, { t: "brain", max: -15, ec50: 1 }, { t: "seizure", max: 15, ec50: 1.2 } ], msg: "滥用剂量致解离样幻觉、共济失调、心动过速、5-羟色胺综合征与癫痫" },
    allergy: { p: 0.006, msg: "皮疹、瘙痒、恶心", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "非阿片类中枢镇咳药，无镇痛与成瘾性；与 SSRI/MAOI 合用可致 5-羟色胺综合征，青少年滥用有致幻风险"
  },

  /* ============ 消化科 ============ */
  {
    id: "esomeprazole", name: "艾司奥美拉唑", alias: "Esomeprazole 耐信", cls: "抑酸药 · 质子泵抑制剂",
    unit: "mg", routes: ["po"],
    dose: { min: 20, typical: 20, max: 40 },
    rateRange: null,
    halfLife: 70, onset: 60, peak: 120, dur: 1440,
    metabol: "肝 CYP2C19 代谢（S-异构体代谢较慢），经肾与粪便排泄",
    effects: [
      { t: "gi", max: 10, ec50: 1 },
      { t: "cough", max: -8, ec50: 1.5 }
    ],
    tox: { factor: 5, effects: [ { t: "gi", max: -12, ec50: 1 }, { t: "renal", max: -12, ec50: 1.5 }, { t: "hepatic", max: -8, ec50: 1.5 } ], msg: "头痛腹泻、低镁血症、间质性肾炎、艰难梭菌感染与骨折风险升高" },
    allergy: { p: 0.01, msg: "皮疹、瘙痒、荨麻疹", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: [],
    note: "质子泵抑制剂，餐前 30–60 分钟服；长期使用需评估血镁与维生素 B12，警惕骨折与肠道感染"
  },
  {
    id: "domperidone", name: "多潘立酮", alias: "Domperidone 吗丁啉", cls: "促胃动力药 · 外周 D2 拮抗",
    unit: "mg", routes: ["po"],
    dose: { min: 10, typical: 10, max: 20 },
    rateRange: null,
    halfLife: 420, onset: 30, peak: 60, dur: 360,
    metabol: "肝 CYP3A4 首过代谢，经粪便与肾排泄",
    effects: [
      { t: "emesis", max: -40, ec50: 1 },
      { t: "gi", max: 12, ec50: 1.5 },
      { t: "qt", max: 15, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "qt", max: 60, ec50: 1 }, { t: "arrhythmia", max: 45, ec50: 1 }, { t: "sbp", max: -15, ec50: 1.5 } ], msg: "QT 延长、尖端扭转型室速与心源性猝死；不易透过血脑屏障故锥体外系反应少见" },
    allergy: { p: 0.008, msg: "皮疹、瘙痒、泌乳素升高（溢乳、男性乳房发育）", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "促胃动力与止吐，餐前 15–30 分钟服；禁用于 QT 延长、严重肝损及合用强 CYP3A4 抑制剂者"
  },
  {
    id: "ursodeoxycholic_acid", name: "熊去氧胆酸", alias: "Ursodeoxycholic Acid 优思弗", cls: "利胆药 · 亲水性胆汁酸",
    unit: "mg", routes: ["po"],
    dose: { min: 150, typical: 250, max: 500 },
    rateRange: null,
    halfLife: 4320, onset: 120, peak: 360, dur: 1440,
    metabol: "在肝内与甘氨酸/牛磺酸结合，存在肠肝循环，部分经粪便排出",
    effects: [
      { t: "hepatic", max: 12, ec50: 1 },
      { t: "gi", max: 8, ec50: 1.5 }
    ],
    tox: { factor: 5, effects: [ { t: "gi", max: -25, ec50: 1 }, { t: "hepatic", max: -10, ec50: 1.5 } ], msg: "腹泻、腹痛、转氨酶一过性升高；结石钙化或胆道完全梗阻时禁用" },
    allergy: { p: 0.008, msg: "皮疹、瘙痒、腹痛", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "原发性胆汁性胆管炎一线，按体重 13–15 mg/kg 分次服；溶石治疗需定期影像随访结石是否钙化"
  },
  {
    id: "mesalazine", name: "美沙拉嗪", alias: "Mesalazine 5-氨基水杨酸", cls: "氨基水杨酸 · 肠道局部抗炎",
    unit: "mg", routes: ["po"],
    dose: { min: 500, typical: 1000, max: 4000 },
    rateRange: null,
    halfLife: 90, onset: 120, peak: 240, dur: 720,
    metabol: "肠黏膜与肝乙酰化，代谢物经肾排泄",
    effects: [
      { t: "gi", max: 12, ec50: 1 },
      { t: "pain", max: -8, ec50: 1.5 },
      { t: "wbc", max: -0.4, ec50: 2 }
    ],
    tox: { factor: 4, effects: [ { t: "gi", max: -25, ec50: 1 }, { t: "renal", max: -20, ec50: 1.2 }, { t: "wbc", max: -2, ec50: 1.2 } ], msg: "腹泻加重、间质性肾炎、骨髓抑制；罕见但致命的水杨酸过敏反应" },
    allergy: { p: 0.03, msg: "发热、皮疹、腹痛加重（药物性结肠炎）", effects: [ { t: "temp", max: 1, ec50: 1 }, { t: "histamine", max: 20, ec50: 1 } ] },
    flags: [],
    note: "溃疡性结肠炎诱导与维持缓解；肾功能不全者需监测肌酐，肠溶片须整片吞服不可嚼碎"
  },

  /* ============ 泌尿科 ============ */
  {
    id: "tamsulosin", name: "坦索罗辛", alias: "Tamsulosin 哈乐", cls: "前列腺用药 · α1A 受体阻滞",
    unit: "mg", routes: ["po"],
    dose: { min: 0.2, typical: 0.4, max: 0.8 },
    rateRange: null,
    halfLife: 600, onset: 60, peak: 240, dur: 1440,
    metabol: "肝 CYP3A4/2D6 代谢，代谢物经肾与胆汁排泄",
    effects: [
      { t: "urine", max: 25, ec50: 1 },
      { t: "sbp", max: -10, ec50: 1.5 },
      { t: "dbp", max: -6, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "sbp", max: -30, ec50: 1 }, { t: "dbp", max: -20, ec50: 1 }, { t: "gcs", max: -3, ec50: 1.5 }, { t: "hr", max: 10, ec50: 1.5 } ], msg: "严重低血压、晕厥、逆行射精；与 PDE5 抑制剂或降压药合用风险增加" },
    allergy: { p: 0.008, msg: "皮疹、瘙痒、血管性水肿", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: [],
    note: "α1A 选择性阻滞剂，睡前服以减少体位性低血压；白内障术前须告知用药史（虹膜松软综合征）"
  },
  {
    id: "finasteride", name: "非那雄胺", alias: "Finasteride 保列治", cls: "前列腺用药 · 5α-还原酶抑制剂",
    unit: "mg", routes: ["po"],
    dose: { min: 1, typical: 5, max: 5 },
    rateRange: null,
    halfLife: 420, onset: 1440, peak: 2880, dur: 1440,
    metabol: "肝 CYP3A4 代谢，代谢物经粪便与肾排泄",
    effects: [
      { t: "urine", max: 10, ec50: 1.5 }
    ],
    tox: { factor: 5, effects: [ { t: "gi", max: -8, ec50: 1 }, { t: "hepatic", max: -6, ec50: 1.5 } ], msg: "性欲减退、勃起功能障碍、男性乳房发育、抑郁；可使 PSA 降低约 50%，干扰前列腺癌筛查" },
    allergy: { p: 0.005, msg: "皮疹、瘙痒、乳房胀痛", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "缩小前列腺体积需 3–6 个月；育龄女性禁用（致畸），献血前需停药 1 个月"
  },
  {
    id: "solifenacin", name: "索利那新", alias: "Solifenacin 卫喜康", cls: "膀胱用药 · M3 受体拮抗",
    unit: "mg", routes: ["po"],
    dose: { min: 5, typical: 5, max: 10 },
    rateRange: null,
    halfLife: 3000, onset: 60, peak: 240, dur: 1440,
    metabol: "肝 CYP3A4 代谢，活性代谢物经肾排泄",
    effects: [
      { t: "urine", max: -12, ec50: 1 },
      { t: "secretions", max: -25, ec50: 1 },
      { t: "gi", max: -8, ec50: 1.5 }
    ],
    tox: { factor: 4, effects: [ { t: "pupil", max: 30, ec50: 1 }, { t: "hr", max: 30, ec50: 1.2 }, { t: "urine", max: -40, ec50: 1.2 }, { t: "gcs", max: -3, ec50: 1.5 } ], msg: "抗胆碱能中毒：口干、视物模糊、瞳孔散大、心动过速、尿潴留与谵妄" },
    allergy: { p: 0.008, msg: "皮疹、瘙痒、口干", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "膀胱过度活动症一线，减少尿频尿急；残余尿 > 200 mL、闭角型青光眼与重症肌无力者禁用"
  },

  /* ============ 镇痛抗炎与痛风 ============ */
  {
    id: "celecoxib", name: "塞来昔布", alias: "Celecoxib 西乐葆", cls: "抗炎镇痛药 · 选择性 COX-2 抑制剂",
    unit: "mg", routes: ["po"],
    dose: { min: 100, typical: 200, max: 400 },
    rateRange: null,
    halfLife: 660, onset: 60, peak: 180, dur: 720,
    metabol: "肝 CYP2C9 代谢，经粪便与肾排泄",
    effects: [
      { t: "pain", max: -25, ec50: 1 },
      { t: "gi", max: -4, ec50: 1.5 },
      { t: "coronary", max: -6, ec50: 2 }
    ],
    tox: { factor: 4, effects: [ { t: "gi", max: -30, ec50: 1 }, { t: "renal", max: -25, ec50: 1.2 }, { t: "coronary", max: -25, ec50: 1.5 }, { t: "sbp", max: 15, ec50: 1.5 } ], msg: "消化道溃疡出血、肾损害、血压升高与心血管血栓事件；过量可致急性肾衰" },
    allergy: { p: 0.02, msg: "皮疹、血管性水肿、支气管痉挛（阿司匹林哮喘）", effects: [ { t: "histamine", max: 25, ec50: 1 }, { t: "bronchospasm", max: 30, ec50: 1 } ] },
    flags: [],
    note: "选择性 COX-2 抑制剂，胃肠风险低于非选择性 NSAID；磺胺过敏、冠心病与心衰者慎用"
  },
  {
    id: "tramadol", name: "曲马多", alias: "Tramadol 盐酸曲马多", cls: "镇痛药 · 弱阿片与 SNRI 双重机制",
    unit: "mg", routes: ["po"],
    dose: { min: 25, typical: 50, max: 100 },
    rateRange: null,
    halfLife: 360, onset: 30, peak: 120, dur: 360,
    metabol: "肝 CYP2D6 生成 O-去甲基曲马多（活性，μ 亲和力强），CYP3A4 生成无活性产物",
    effects: [
      { t: "pain", max: -30, ec50: 1 },
      { t: "sedation", max: 15, ec50: 1.5 },
      { t: "gi", max: -10, ec50: 1.5 },
      { t: "emesis", max: 15, ec50: 1.5 },
      { t: "seizure", max: 5, ec50: 2 }
    ],
    tox: { factor: 3, effects: [ { t: "seizure", max: 45, ec50: 1 }, { t: "rr", max: -7, ec50: 1.2 }, { t: "sedation", max: 60, ec50: 1 }, { t: "hr", max: 20, ec50: 1.5 } ], msg: "癫痫发作（降低惊厥阈值，与 SSRI/曲普坦/抗精神病药合用时风险更高）、呼吸抑制与 5-羟色胺综合征" },
    allergy: { p: 0.01, msg: "皮疹、瘙痒、支气管痉挛", effects: [ { t: "histamine", max: 25, ec50: 1 }, { t: "bronchospasm", max: 15, ec50: 1 } ] },
    flags: ["controlled"],
    note: "弱阿片类镇痛，每日最大 400 mg；癫痫史、合用 SSRI/MAOI、肾功能不全与自杀风险者慎用"
  },
  {
    id: "colchicine", name: "秋水仙碱", alias: "Colchicine 秋水仙素", cls: "抗痛风药 · 微管抑制剂",
    unit: "mg", routes: ["po"],
    dose: { min: 0.5, typical: 0.5, max: 1 },
    rateRange: null,
    halfLife: 1740, onset: 120, peak: 240, dur: 1440,
    metabol: "肝 CYP3A4 代谢并经 P-糖蛋白转运，经胆汁与肾排泄",
    effects: [
      { t: "pain", max: -22, ec50: 1 },
      { t: "gi", max: -20, ec50: 1 },
      { t: "wbc", max: -1, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "gi", max: -50, ec50: 1 }, { t: "wbc", max: -5, ec50: 1 }, { t: "renal", max: -25, ec50: 1.2 }, { t: "hepatic", max: -20, ec50: 1.2 }, { t: "contractility", max: -10, ec50: 1.5 } ], msg: "迟发性中毒：剧烈呕吐腹泻致脱水、骨髓抑制、横纹肌溶解与多器官衰竭，常在服药数小时后才显现" },
    allergy: { p: 0.01, msg: "皮疹、荨麻疹、骨髓抑制", effects: [ { t: "histamine", max: 15, ec50: 1 }, { t: "wbc", max: -1, ec50: 1.5 } ] },
    flags: ["high_alert"],
    note: "痛风急性期 0.5 mg 每日 2–3 次，出现腹泻即停药；肾功能不全或合用 CYP3A4/P-gp 抑制剂时减量或禁用"
  },
  {
    id: "febuxostat", name: "非布司他", alias: "Febuxostat 优立通", cls: "抗痛风药 · 黄嘌呤氧化酶抑制剂",
    unit: "mg", routes: ["po"],
    dose: { min: 20, typical: 40, max: 80 },
    rateRange: null,
    halfLife: 420, onset: 120, peak: 240, dur: 1440,
    metabol: "肝 UGT 葡萄糖醛酸化与 CYP2C8 氧化，经肾与粪便排泄",
    effects: [
      { t: "coronary", max: 2, ec50: 1.5 },
      { t: "gi", max: -5, ec50: 1.5 }
    ],
    tox: { factor: 5, effects: [ { t: "hepatic", max: -18, ec50: 1 }, { t: "coronary", max: -15, ec50: 1.5 }, { t: "gi", max: -18, ec50: 1 }, { t: "wbc", max: -1.5, ec50: 1.5 } ], msg: "肝酶升高、心血管事件（CARES 研究提示心血管死亡增加）、皮疹与粒细胞减少" },
    allergy: { p: 0.02, msg: "皮疹、药物超敏反应（DRESS）、发热", effects: [ { t: "temp", max: 1, ec50: 1 }, { t: "histamine", max: 20, ec50: 1 } ] },
    flags: [],
    note: "非嘌呤类黄嘌呤氧化酶抑制剂，用于别嘌醇不耐受者；急性痛风期不启动，合并心血管病者慎用"
  },

  /* ============ 矿物质与抗组胺 ============ */
  {
    id: "calcium_carbonate", name: "碳酸钙", alias: "Calcium Carbonate 碳酸钙片", cls: "矿物质 · 钙补充与抗酸",
    unit: "mg", routes: ["po"],
    dose: { min: 250, typical: 500, max: 1500 },
    rateRange: null,
    halfLife: 300, onset: 30, peak: 120, dur: 480,
    metabol: "与胃酸反应生成氯化钙，经肾排泄，部分沉积于骨",
    effects: [
      { t: "ca", max: 0.15, ec50: 1 },
      { t: "ph", max: 0.03, ec50: 1.5 },
      { t: "gi", max: 5, ec50: 1.5 }
    ],
    tox: { factor: 4, effects: [ { t: "ca", max: 0.5, ec50: 1 }, { t: "ph", max: 0.1, ec50: 1 }, { t: "renal", max: -15, ec50: 1.2 }, { t: "gi", max: -15, ec50: 1.5 } ], msg: "高钙血症、乳碱综合征（高钙 + 代谢性碱中毒 + 肾损害）、便秘与泌尿系结石" },
    allergy: { p: 0.003, msg: "皮疹、便秘、腹胀", effects: [ { t: "histamine", max: 8, ec50: 1 } ] },
    flags: [],
    note: "补钙与抗酸，随餐服吸收更好；长期大剂量需监测血钙与尿钙，高钙血症与结石者慎用"
  },
  {
    id: "cetirizine", name: "西替利嗪", alias: "Cetirizine 仙特明", cls: "抗组胺药 · 第二代 H1 受体阻断",
    unit: "mg", routes: ["po"],
    dose: { min: 5, typical: 10, max: 20 },
    rateRange: null,
    halfLife: 540, onset: 30, peak: 120, dur: 720,
    metabol: "少量肝代谢，约 60% 以原型经肾排泄",
    effects: [
      { t: "histamine", max: -35, ec50: 1 },
      { t: "sedation", max: 10, ec50: 1.5 },
      { t: "gi", max: -4, ec50: 2 }
    ],
    tox: { factor: 4, effects: [ { t: "sedation", max: 45, ec50: 1 }, { t: "hr", max: 15, ec50: 1.2 }, { t: "gcs", max: -2, ec50: 1.5 } ], msg: "嗜睡、口干、心动过速；儿童过量可致激越与锥体外系症状" },
    allergy: { p: 0.006, msg: "皮疹、瘙痒、水肿", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: [],
    note: "过敏性鼻炎与荨麻疹，嗜睡较轻；肾功能不全需减量，不能替代肾上腺素抢救过敏性休克"
  },
  {
    id: "chlorpheniramine", name: "氯苯那敏", alias: "Chlorpheniramine 扑尔敏", cls: "抗组胺药 · 第一代 H1 受体阻断",
    unit: "mg", routes: ["po"],
    dose: { min: 2, typical: 4, max: 8 },
    rateRange: null,
    halfLife: 1200, onset: 30, peak: 120, dur: 360,
    metabol: "肝 CYP2D6 代谢，代谢物经肾排泄",
    effects: [
      { t: "histamine", max: -45, ec50: 1 },
      { t: "sedation", max: 35, ec50: 1 },
      { t: "secretions", max: -20, ec50: 1.5 },
      { t: "pupil", max: 8, ec50: 2 }
    ],
    tox: { factor: 3, effects: [ { t: "sedation", max: 70, ec50: 1 }, { t: "hr", max: 30, ec50: 1.2 }, { t: "seizure", max: 20, ec50: 1 }, { t: "urine", max: -30, ec50: 1.2 }, { t: "temp", max: 1, ec50: 1.5 } ], msg: "抗胆碱能中毒：嗜睡或反常兴奋、瞳孔散大、心动过速、尿潴留、抽搐与高热" },
    allergy: { p: 0.01, msg: "皮疹、瘙痒、粒细胞减少", effects: [ { t: "histamine", max: 15, ec50: 1 } ] },
    flags: [],
    note: "第一代抗组胺药，镇静与抗胆碱作用明显；青光眼、前列腺增生、驾驶员与幼儿慎用"
  },
  /* ============ v2.10 急诊外伤 / 特殊暴露 ============ */
  {
    id: "tetanus_antitoxin", name: "破伤风抗毒素 TAT", alias: "Tetanus Antitoxin 破抗", cls: "被动免疫 · 破伤风抗毒素",
    unit: "IU", routes: ["im", "iv"],
    dose: { min: 1500, typical: 1500, max: 3000 },
    rateRange: null,
    halfLife: 240, onset: 5, peak: 20, dur: 180,
    metabol: "不经肝代谢，以原型经肾排泄",
    effects: [ { t: "immune", max: 6, ec50: 1 } ],
    tox: { factor: 4, effects: [ { t: "histamine", max: 45, ec50: 1 }, { t: "anaphylaxis", max: 35, ec50: 1.2 } ], msg: "血清病样反应 / 过敏性休克：皮疹、发热、关节痛，重者喉头水肿" },
    allergy: { p: 0.03, msg: "过敏性休克、血清病样反应", effects: [ { t: "histamine", max: 40, ec50: 1 }, { t: "airway", max: -25, ec50: 1 } ] },
    flags: [], note: "破伤风被动免疫：皮试后 1500 IU 肌注；伤口污染重、免疫史不明时使用，同时要清创"
  },
  {
    id: "rabies_vaccine", name: "狂犬病疫苗", alias: "Rabies Vaccine 人用狂犬疫苗", cls: "主动免疫 · 狂犬病疫苗",
    unit: "剂", routes: ["im"],
    dose: { min: 1, typical: 1, max: 1 },
    rateRange: null,
    halfLife: 10080, onset: 60, peak: 720, dur: 4320,
    metabol: "抗原制剂，按 0/3/7/14/28 天程序接种",
    effects: [ { t: "immune", max: 8, ec50: 1 } ],
    tox: { factor: 6, effects: [ { t: "temp", max: 0.8, ec50: 1 }, { t: "histamine", max: 12, ec50: 1 } ], msg: "接种后发热、局部红肿、一过性皮疹" },
    flags: [], note: "Ⅱ/Ⅲ 级暴露必须接种；越早越好，不能因为伤口小就省略"
  },
  {
    id: "rabies_immunoglobulin", name: "狂犬病免疫球蛋白", alias: "HRIG 狂犬病人免疫球蛋白", cls: "被动免疫 · 狂犬病免疫球蛋白",
    unit: "IU", routes: ["im"],
    dose: { min: 200, typical: 800, max: 2000 },
    rateRange: null,
    halfLife: 5040, onset: 10, peak: 60, dur: 1440,
    metabol: "局部浸润为主，少量进入循环",
    effects: [ { t: "immune", max: 10, ec50: 1 } ],
    tox: { factor: 6, effects: [ { t: "histamine", max: 20, ec50: 1 }, { t: "temp", max: 0.6, ec50: 1 } ], msg: "局部疼痛、发热、血清病样反应" },
    flags: [], note: "Ⅲ 级暴露：伤口周围浸润注射（20 IU/kg），与疫苗同日、不同部位"
  }
];
