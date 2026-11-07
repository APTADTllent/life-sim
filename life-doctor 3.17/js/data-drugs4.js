/* LIFE SIM 药库 · 第四册
   急救 / 重症 / 解毒 / 抗微生物 47 种
   字段语义：ec50 = 相对「一个常用剂量」的效应室浓度；max = 饱和时的绝对变化量（非百分比）
   时间单位一律为分钟 */
window.M = window.M || {};
M.DRUGS4 = [
  /* ============ 一、抗心律失常（4） ============ */
  {
    id: "procainamide", name: "普鲁卡因胺", alias: "Procainamide 普鲁卡因酰胺", cls: "抗心律失常药 · IA 类钠通道阻滞",
    unit: "mg", routes: ["iv", "iv_inf", "im"],
    dose: { min: 500, typical: 1000, max: 1500 },
    rateRange: { min: 1, max: 4, per: "mg/min" },
    halfLife: 180, onset: 2, peak: 10, dur: 180,
    metabol: "肝乙酰化生成活性代谢物 NAPA，经肾排泄（NAPA 半衰期 6–8 小时）",
    effects: [
      { t: "arrhythmia", max: -45, ec50: 1 },
      { t: "qt", max: 30, ec50: 1 },
      { t: "avconduction", max: -10, ec50: 1.2 },
      { t: "sbp", max: -12, ec50: 1.2 },
      { t: "hr", max: -5, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "sbp", max: -40, ec50: 1 }, { t: "qt", max: 80, ec50: 1 }, { t: "arrhythmia", max: 25, ec50: 1.2 }, { t: "gcs", max: -3, ec50: 1.5 } ], msg: "尖端扭转型室速、严重低血压、QRS 增宽、狼疮样综合征" },
    allergy: { p: 0.01, msg: "皮疹、发热、粒细胞缺乏、狼疮样反应", effects: [ { t: "histamine", max: 20, ec50: 1 }, { t: "temp", max: 0.8, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "房颤/室速负荷 15–17 mg/kg 缓慢静推（≤50 mg/min），维持 1–4 mg/min；静推过快可致低血压，QRS 增宽>50% 需停药"
  },
  {
    id: "ibutilide", name: "伊布利特", alias: "Ibutilide 伊布利特富马酸盐", cls: "抗心律失常药 · III 类 IKr 阻滞",
    unit: "mg", routes: ["iv"],
    dose: { min: 0.5, typical: 1, max: 2 },
    rateRange: null,
    halfLife: 360, onset: 5, peak: 15, dur: 240,
    metabol: "肝 CYP3A4 氧化代谢，代谢物经肾排泄",
    effects: [
      { t: "arrhythmia", max: -45, ec50: 1 },
      { t: "qt", max: 55, ec50: 1 },
      { t: "hr", max: -5, ec50: 2 }
    ],
    tox: { factor: 2.5, effects: [ { t: "qt", max: 100, ec50: 1 }, { t: "arrhythmia", max: 35, ec50: 1 }, { t: "hr", max: -15, ec50: 1.5 } ], msg: "尖端扭转型室速（3–4%）、QT 显著延长、心动过缓" },
    allergy: { p: 0.006, msg: "皮疹、头痛、恶心、室性早搏", effects: [ { t: "histamine", max: 15, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "房颤/房扑 1 mg 10 分钟静滴，无效可重复一次；用药后至少监测 4 小时，低钾与 QT 延长者禁用"
  },
  {
    id: "sotalol", name: "索他洛尔", alias: "Sotalol 施太可", cls: "抗心律失常药 · III 类（β 阻滞 + IKr 阻滞）",
    unit: "mg", routes: ["po", "iv"],
    dose: { min: 40, typical: 80, max: 160 },
    rateRange: null,
    halfLife: 720, onset: 30, peak: 180, dur: 720,
    metabol: "不经肝代谢，以原型经肾排泄，肾功能不全需减量",
    effects: [
      { t: "arrhythmia", max: -35, ec50: 1 },
      { t: "hr", max: -18, ec50: 1 },
      { t: "qt", max: 40, ec50: 1 },
      { t: "avconduction", max: -14, ec50: 1.2 },
      { t: "contractility", max: -8, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "qt", max: 90, ec50: 1 }, { t: "hr", max: -40, ec50: 1 }, { t: "arrhythmia", max: 30, ec50: 1.2 }, { t: "contractility", max: -20, ec50: 1.5 } ], msg: "尖端扭转型室速、严重心动过缓、心衰加重、支气管痉挛" },
    allergy: { p: 0.008, msg: "皮疹、乏力、心动过缓", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "房颤维持窦律 80 mg 每日 2 次；起始与调量后 3 天查 ECG 与血钾，QTc>500 ms 或 CrCl<40 减量/停用"
  },
  {
    id: "flecainide", name: "氟卡尼", alias: "Flecainide 氟卡胺", cls: "抗心律失常药 · IC 类钠通道阻滞",
    unit: "mg", routes: ["po"],
    dose: { min: 50, typical: 100, max: 200 },
    rateRange: null,
    halfLife: 840, onset: 60, peak: 180, dur: 720,
    metabol: "肝 CYP2D6 代谢，部分以原型经肾排泄（慢代谢者半衰期可达 20 小时）",
    effects: [
      { t: "arrhythmia", max: -45, ec50: 1 },
      { t: "contractility", max: -12, ec50: 1.2 },
      { t: "avconduction", max: -12, ec50: 1.2 },
      { t: "hr", max: -5, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "arrhythmia", max: 35, ec50: 1 }, { t: "contractility", max: -30, ec50: 1 }, { t: "sbp", max: -25, ec50: 1.2 }, { t: "gcs", max: -4, ec50: 1.5 } ], msg: "QRS 增宽、诱发室速/室颤（尤其结构性心脏病）、严重负性肌力与低血压" },
    allergy: { p: 0.006, msg: "皮疹、视力模糊、头晕", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "仅用于无结构性心脏病的房颤复律/维持，100 mg 每日 2 次；心梗后与心功能不全者禁用（CAST 试验），需监测 QRS"
  },
  /* ============ 二、解毒与特异性逆转（14） ============ */
  {
    id: "digoxin_fab", name: "地高辛特异性抗体片段", alias: "Digoxin Immune Fab · DigiFab", cls: "解毒剂 · 洋地黄特异性抗体片段",
    unit: "支", routes: ["iv"],
    dose: { min: 1, typical: 5, max: 20 },
    rateRange: null,
    halfLife: 900, onset: 30, peak: 60, dur: 1440,
    metabol: "Fab-地高辛复合物经肾排泄，肾功能不全时清除延迟",
    effects: [],
    antidote: "用于地高辛/洋地黄中毒的危及生命表现（室性心律失常、高度房室阻滞、高钾>5.5 mmol/L）：按地高辛总负荷（mg）/0.5 计算瓶数，总量未知时成人先给 10 瓶，20–30 分钟静滴",
    tox: { factor: 4, effects: [ { t: "k", max: -0.6, ec50: 1 }, { t: "hr", max: 15, ec50: 1.2 }, { t: "contractility", max: -10, ec50: 1.5 } ], msg: "洋地黄作用被过度逆转：低钾、心衰加重、快速性心律失常（用量过大时）" },
    allergy: { p: 0.01, msg: "过敏样反应（羊源蛋白）、血清病、皮疹", effects: [ { t: "histamine", max: 25, ec50: 1 }, { t: "sbp", max: -15, ec50: 1 } ] },
    flags: ["high_alert", "antidote"],
    note: "洋地黄中毒的首选解毒剂，起效 30 分钟；可干扰血清地高辛测定，逆转后可能出现低钾与心衰反跳"
  },
  {
    id: "hydroxocobalamin", name: "羟钴胺", alias: "Hydroxocobalamin · Cyanokit", cls: "解毒剂 · 氰化物结合剂",
    unit: "g", routes: ["iv", "iv_inf"],
    dose: { min: 2.5, typical: 5, max: 10 },
    rateRange: { min: 5, max: 20, per: "g/h" },
    halfLife: 720, onset: 1, peak: 5, dur: 240,
    metabol: "以原型经肾排泄，使尿液呈深红色",
    effects: [],
    antidote: "用于氰化物中毒（火灾烟雾吸入、工业氰化物、硝普钠蓄积）：5 g 于 15 分钟内静滴，必要时重复 5 g；可与硫代硫酸钠联用",
    tox: { factor: 3, effects: [ { t: "sbp", max: 15, ec50: 1 }, { t: "renal", max: -10, ec50: 1.5 }, { t: "histamine", max: 20, ec50: 1.2 } ], msg: "高血压、过敏样反应、尿液与皮肤变红干扰比色检验、肾损害" },
    allergy: { p: 0.02, msg: "皮疹、过敏样反应、注射部位反应", effects: [ { t: "histamine", max: 30, ec50: 1 }, { t: "sbp", max: -12, ec50: 1 } ] },
    flags: ["high_alert", "antidote"],
    note: "氰化物中毒首选解毒剂，5 g 静滴 15 分钟；尿色变红可干扰比色法与血氧监测读数"
  },
  {
    id: "deferoxamine", name: "去铁胺", alias: "Deferoxamine 去铁敏 · Desferal", cls: "解毒剂 · 铁螯合剂",
    unit: "mg", routes: ["iv_inf", "im", "sc"],
    dose: { min: 500, typical: 2000, max: 6000 },
    rateRange: { min: 500, max: 1000, per: "mg/h" },
    halfLife: 240, onset: 30, peak: 120, dur: 480,
    metabol: "血浆酶降解，铁胺复合物经肾排泄",
    effects: [],
    antidote: "用于急性铁中毒（血清铁 > 500 µg/dL 或出现休克/酸中毒）与慢性铁过载：15 mg/kg/h 持续静滴，最大 6 g/24h；无休克时可 50 mg/kg 肌注",
    tox: { factor: 3, effects: [ { t: "sbp", max: -35, ec50: 1 }, { t: "renal", max: -20, ec50: 1.2 }, { t: "spo2", max: -8, ec50: 1.2 }, { t: "gcs", max: -3, ec50: 1.5 } ], msg: "快速输注致低血压、ARDS/肺毒性、急性肾损伤、视力与听力损害" },
    allergy: { p: 0.02, msg: "皮疹、荨麻疹、过敏样反应（快速输注更常见）", effects: [ { t: "histamine", max: 35, ec50: 1 }, { t: "sbp", max: -18, ec50: 1 } ] },
    flags: ["high_alert", "antidote"],
    note: "铁中毒 15 mg/kg/h 静滴，速度过快可致低血压；尿色呈玫瑰红提示铁胺复合物排出"
  },
  {
    id: "physostigmine", name: "毒扁豆碱", alias: "Physostigmine 依色林", cls: "解毒剂 · 中枢性胆碱酯酶抑制剂",
    unit: "mg", routes: ["iv", "im"],
    dose: { min: 0.5, typical: 1, max: 2 },
    rateRange: null,
    halfLife: 30, onset: 5, peak: 10, dur: 60,
    metabol: "被胆碱酯酶水解，半衰期短，需重复给药",
    effects: [
      { t: "gcs", max: 3, ec50: 1 },
      { t: "sedation", max: -20, ec50: 1 },
      { t: "pupil", max: -2, ec50: 1.2 },
      { t: "secretions", max: 15, ec50: 1.5 },
      { t: "hr", max: -10, ec50: 1.2 }
    ],
    antidote: "用于纯抗胆碱能中毒（阿托品、东莨菪碱、抗组胺药、曼陀罗）所致谵妄与室上速：1–2 mg 至少 5 分钟缓慢静推，20 分钟后可重复",
    tox: { factor: 3, effects: [ { t: "hr", max: -40, ec50: 1 }, { t: "secretions", max: 40, ec50: 1 }, { t: "bronchospasm", max: 30, ec50: 1.2 }, { t: "seizure", max: 25, ec50: 1.2 } ], msg: "胆碱能危象：心动过缓、流涎与支气管分泌物、支气管痉挛、抽搐" },
    allergy: { p: 0.005, msg: "皮疹、恶心呕吐、腹痛", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: ["high_alert", "antidote"],
    note: "仅用于中枢性抗胆碱能谵妄；三环类抗抑郁药过量禁用（可致心脏停搏），给药时床旁备阿托品"
  },
  {
    id: "cyproheptadine", name: "赛庚啶", alias: "Cyproheptadine 盐酸赛庚啶", cls: "解毒剂 · 5-HT2A 拮抗（抗组胺）",
    unit: "mg", routes: ["po"],
    dose: { min: 4, typical: 8, max: 12 },
    rateRange: null,
    halfLife: 480, onset: 30, peak: 120, dur: 480,
    metabol: "肝 CYP3A4 代谢，代谢物经肾排泄",
    effects: [
      { t: "temp", max: -0.6, ec50: 1 },
      { t: "sedation", max: 15, ec50: 1.2 },
      { t: "secretions", max: -15, ec50: 1.5 }
    ],
    antidote: "用于 5-羟色胺综合征（SSRIs/SNRIs、曲马多、利奈唑胺等）：首剂 12 mg 口服或鼻饲，之后每 2 小时 2 mg，24 小时最大 32 mg",
    tox: { factor: 3, effects: [ { t: "sedation", max: 40, ec50: 1 }, { t: "urine", max: -30, ec50: 1.2 }, { t: "secretions", max: -40, ec50: 1 }, { t: "seizure", max: 15, ec50: 1.5 } ], msg: "抗胆碱能作用：嗜睡、口干、尿潴留、谵妄、抽搐" },
    allergy: { p: 0.01, msg: "皮疹、嗜睡、食欲增加", effects: [ { t: "histamine", max: 15, ec50: 1 } ] },
    flags: ["antidote"],
    note: "5-HT 综合征的辅助解毒药，须同时停用致病药、苯二氮䓬镇静与物理降温"
  },
  {
    id: "bromocriptine", name: "溴隐亭", alias: "Bromocriptine 溴麦角环肽", cls: "解毒剂 · 多巴胺 D2 激动（NMS/5-HT 综合征辅助）",
    unit: "mg", routes: ["po"],
    dose: { min: 2.5, typical: 2.5, max: 5 },
    rateRange: null,
    halfLife: 720, onset: 60, peak: 180, dur: 720,
    metabol: "肝 CYP3A4 代谢，主要经胆汁与粪便排泄",
    effects: [
      { t: "temp", max: -0.8, ec50: 1 },
      { t: "sedation", max: -10, ec50: 1.2 },
      { t: "hr", max: -8, ec50: 1.5 }
    ],
    antidote: "用于抗精神病药恶性综合征（NMS）与 5-HT 综合征的辅助治疗：2.5–5 mg 口服或鼻饲，每 6–8 小时一次",
    tox: { factor: 3, effects: [ { t: "sbp", max: -30, ec50: 1 }, { t: "emesis", max: 40, ec50: 1 }, { t: "gcs", max: -3, ec50: 1.5 }, { t: "temp", max: -1.5, ec50: 1.2 } ], msg: "体位性低血压、恶心呕吐、精神症状、肢端血管痉挛" },
    allergy: { p: 0.01, msg: "皮疹、恶心、鼻塞", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: ["antidote"],
    note: "NMS/5-HT 综合征的辅助用药；从小剂量起始，避免与降压药合用加重低血压"
  },
  {
    id: "dantrolene", name: "丹曲林", alias: "Dantrolene 丹曲林钠 · Dantrium", cls: "解毒剂 · 骨骼肌松弛（RyR1 拮抗）",
    unit: "mg", routes: ["iv", "iv_inf", "po"],
    dose: { min: 100, typical: 200, max: 400 },
    rateRange: { min: 100, max: 400, per: "mg/h" },
    halfLife: 480, onset: 5, peak: 30, dur: 360,
    metabol: "肝代谢（CYP），代谢物经肾与胆汁排泄",
    effects: [
      { t: "temp", max: -1.2, ec50: 1 },
      { t: "hr", max: -20, ec50: 1.2 },
      { t: "paco2", max: -8, ec50: 1.5 }
    ],
    antidote: "恶性高热首选：2.5 mg/kg（成人约 200 mg）静推，必要时每 5–10 分钟重复，总量可达 10 mg/kg；同时停用触发药、纯氧过度通气、降温纠酸",
    tox: { factor: 3, effects: [ { t: "contractility", max: -15, ec50: 1 }, { t: "hepatic", max: -20, ec50: 1.2 }, { t: "gcs", max: -3, ec50: 1.5 }, { t: "sbp", max: -15, ec50: 1.5 } ], msg: "肌无力、肝损害、血栓性静脉炎、外渗致组织坏死" },
    allergy: { p: 0.01, msg: "皮疹、嗜睡、腹泻", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: ["high_alert", "antidote"],
    note: "恶性高热唯一特效药：2.5 mg/kg 静推并重复至症状控制，碳酸氢钠需与本品分开管路（配伍禁忌）"
  },
  {
    id: "silibinin", name: "水飞蓟宾", alias: "Silibinin 水飞蓟素 · Legalon SIL", cls: "解毒剂 · 肝保护（鹅膏毒肽）",
    unit: "mg", routes: ["iv_inf", "po"],
    dose: { min: 600, typical: 1500, max: 3000 },
    rateRange: { min: 300, max: 1000, per: "mg/h" },
    halfLife: 360, onset: 30, peak: 120, dur: 480,
    metabol: "肝代谢并存在肠肝循环，主要经胆汁排泄",
    effects: [
      { t: "hepatic", max: 15, ec50: 1 },
      { t: "inr", max: -0.3, ec50: 1.2 }
    ],
    antidote: "用于毒鹅膏（毒伞、白毒伞）中毒：20–50 mg/kg/d 静脉分次给药，越早越好，配合水化、NAC 与肝移植评估",
    tox: { factor: 4, effects: [ { t: "gi", max: -15, ec50: 1 }, { t: "emesis", max: 20, ec50: 1.2 }, { t: "histamine", max: 20, ec50: 1.2 } ], msg: "恶心、腹泻、皮疹、静脉炎（毒性低，主要为肝衰竭本身表现）" },
    allergy: { p: 0.01, msg: "皮疹、瘙痒、轻度腹泻", effects: [ { t: "histamine", max: 15, ec50: 1 } ] },
    flags: ["antidote"],
    note: "毒鹅膏中毒的肝保护剂，24–48 小时内尽早使用；不能替代肝移植评估与 NAC"
  },
  {
    id: "naltrexone", name: "纳曲酮", alias: "Naltrexone 环丙甲羟二羟吗啡酮", cls: "解毒剂 · 长效阿片受体拮抗剂",
    unit: "mg", routes: ["po"],
    dose: { min: 25, typical: 50, max: 100 },
    rateRange: null,
    halfLife: 240, onset: 30, peak: 60, dur: 1440,
    metabol: "肝代谢为 6β-纳曲醇（仍有活性），经肾排泄",
    effects: [
      { t: "sedation", max: -25, ec50: 1 },
      { t: "rr", max: 5, ec50: 1.2 },
      { t: "gcs", max: 3, ec50: 1.2 }
    ],
    antidote: "用于长效阿片（美沙酮、丁丙诺啡、缓释吗啡）中毒的后续拮抗与阿片/酒精依赖维持治疗：50 mg 口服，作用持续 24 小时；急性呼吸抑制仍需先静推纳洛酮",
    tox: { factor: 3, effects: [ { t: "hepatic", max: -25, ec50: 1 }, { t: "emesis", max: 30, ec50: 1 }, { t: "sbp", max: -10, ec50: 1.5 } ], msg: "大剂量肝损害、恶心呕吐、阿片戒断反应（躁动、腹泻、心动过速）" },
    allergy: { p: 0.008, msg: "皮疹、恶心、头痛", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: ["antidote"],
    note: "长效口服拮抗剂，用于美沙酮/丁丙诺啡过量与酒精依赖；起效慢，急性期仍首选纳洛酮静推"
  },
  {
    id: "idarucizumab", name: "依达赛珠单抗", alias: "Idarucizumab · Praxbind", cls: "解毒剂 · 达比加群特异性逆转（单抗片段）",
    unit: "g", routes: ["iv", "iv_inf"],
    dose: { min: 2.5, typical: 5, max: 5 },
    rateRange: { min: 2.5, max: 15, per: "g/h" },
    halfLife: 60, onset: 1, peak: 5, dur: 720,
    metabol: "经蛋白水解降解，片段主要经肾排泄",
    effects: [],
    antidote: "用于达比加群相关大出血或急诊手术前逆转：5 g（2×2.5 g）静滴，若再次出血可重复 5 g；对其他 DOAC 无效",
    tox: { factor: 2, effects: [ { t: "clotting", max: 10, ec50: 1 }, { t: "k", max: -0.3, ec50: 1.5 } ], msg: "逆转后血栓事件、低磷血症、发热与输注反应" },
    allergy: { p: 0.01, msg: "输注反应、皮疹、发热", effects: [ { t: "histamine", max: 20, ec50: 1 }, { t: "temp", max: 0.6, ec50: 1 } ] },
    flags: ["high_alert", "antidote"],
    note: "仅拮抗达比加群，5 g 分两瓶静滴；抗凝作用可在 12–24 小时后重现，需评估是否恢复抗凝"
  },
  {
    id: "andexanet_alfa", name: "凝血因子 Xa 逆转剂（andexanet alfa）", alias: "Andexanet alfa · 安德仙 · 重组 Xa 诱饵蛋白", cls: "解毒剂 · Xa 抑制剂逆转剂",
    unit: "mg", routes: ["iv", "iv_inf"],
    dose: { min: 400, typical: 800, max: 1200 },
    rateRange: { min: 240, max: 480, per: "mg/h" },
    halfLife: 300, onset: 2, peak: 10, dur: 720,
    metabol: "无肝代谢，按内源性蛋白降解途径清除",
    effects: [],
    antidote: "用于利伐沙班/阿哌沙班/艾多沙班相关大出血：低剂量 400 mg 静推（30 mg/min）+ 4 mg/min 维持 120 分钟；高剂量 800 mg 静推（30 mg/min）+ 8 mg/min 维持 120 分钟",
    tox: { factor: 2.5, effects: [ { t: "clotting", max: 15, ec50: 1 }, { t: "temp", max: 0.8, ec50: 1.2 } ], msg: "血栓事件（心梗、卒中、DVT）、输注反应、发热" },
    allergy: { p: 0.012, msg: "输注反应、皮疹、过敏样反应（CHO 细胞表达蛋白）", effects: [ { t: "histamine", max: 25, ec50: 1 }, { t: "sbp", max: -12, ec50: 1 } ] },
    flags: ["high_alert", "antidote"],
    note: "仅逆转 Xa 抑制剂，须在末次服药 18 小时内（大出血）或 15 小时内（手术）使用；与 PCC 的选择需权衡血栓风险"
  },
  {
    id: "pyridoxine", name: "吡哆醇（维生素 B6）", alias: "Pyridoxine · Vitamin B6", cls: "解毒剂 · 维生素 B6（GABA 合成辅酶）",
    unit: "mg", routes: ["iv", "iv_inf", "po", "im"],
    dose: { min: 100, typical: 1000, max: 5000 },
    rateRange: { min: 500, max: 2000, per: "mg/h" },
    halfLife: 60, onset: 2, peak: 10, dur: 180,
    metabol: "肝氧化为吡哆醛，经肾排泄",
    effects: [
      { t: "seizure", max: -45, ec50: 1 },
      { t: "gcs", max: 2, ec50: 1.5 },
      { t: "lactate", max: -1.5, ec50: 1.5 }
    ],
    antidote: "用于异烟肼/肼类（含吡嗪酰胺、蘑菇中毒）所致难治性癫痫：按每克异烟肼给 1 g，最大 5 g，缓慢静推（≤500 mg/min）；不明原因儿童癫痫可先给 100 mg",
    tox: { factor: 3, effects: [ { t: "brain", max: -10, ec50: 1 }, { t: "gcs", max: -1, ec50: 1.5 }, { t: "sbp", max: -10, ec50: 1.5 } ], msg: "长期大剂量致感觉性周围神经病、共济失调；快速静推可致低血压" },
    allergy: { p: 0.005, msg: "皮疹、光敏、注射部位反应", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: ["antidote"],
    note: "异烟肼中毒癫痫：每克异烟肼给 1 g（最大 5 g）静推，同时补碱；慢性过量可致周围神经病"
  },
  {
    id: "activated_charcoal", name: "活性炭", alias: "Activated Charcoal 药用炭", cls: "解毒剂 · 胃肠道吸附剂",
    unit: "g", routes: ["po", "nasal"],
    dose: { min: 25, typical: 50, max: 100 },
    rateRange: null,
    halfLife: 60, onset: 5, peak: 15, dur: 120,
    metabol: "不被吸收，随粪便排出",
    effects: [],
    antidote: "用于多数口服中毒（卡马西平、茶碱、水杨酸、巴比妥类）的吸附：成人 50 g（1 g/kg）与 250 mL 水混悬口服或鼻饲，1 小时内最有效；必要时每 4–6 小时重复（多剂量活性炭）",
    tox: { factor: 3, effects: [ { t: "gi", max: -30, ec50: 1 }, { t: "emesis", max: 25, ec50: 1.2 }, { t: "k", max: -0.3, ec50: 2 } ], msg: "肠梗阻与便秘、呕吐误吸致吸入性肺炎、电解质紊乱" },
    allergy: { p: 0.002, msg: "罕见皮疹、呕吐", effects: [ { t: "emesis", max: 15, ec50: 1 } ] },
    flags: ["antidote"],
    note: "服毒 1 小时内最有效，50 g 混悬给药；禁用于肠梗阻、腐蚀性物质中毒与未插管的气道保护不全者"
  },
  {
    id: "snake_antivenom", name: "抗蛇毒血清（多价）", alias: "Polyvalent Snake Antivenom 抗蝮蛇/五步蛇毒血清", cls: "解毒剂 · 多价抗蛇毒血清",
    unit: "U", routes: ["iv_inf"],
    dose: { min: 4000, typical: 6000, max: 12000 },
    rateRange: { min: 2000, max: 6000, per: "U/h" },
    halfLife: 4320, onset: 10, peak: 60, dur: 1440,
    metabol: "IgG 经网状内皮系统降解，代谢物经肾排泄",
    effects: [
      { t: "clotting", max: 25, ec50: 1 },
      { t: "inr", max: -0.5, ec50: 1.2 }
    ],
    antidote: "用于蝮蛇、五步蛇、银环蛇、眼镜蛇等毒蛇咬伤：尽早 6000–12000 U 加入生理盐水 100–250 mL 静滴，1–2 小时内滴完；凝血障碍未纠正者 6 小时后追加",
    tox: { factor: 3, effects: [ { t: "histamine", max: 40, ec50: 1 }, { t: "sbp", max: -40, ec50: 1 }, { t: "bronchospasm", max: 40, ec50: 1.2 }, { t: "temp", max: 1, ec50: 1.5 } ], msg: "过敏性休克、血清病（发热、关节痛、皮疹，5–10 天后）、致死性过敏反应" },
    allergy: { p: 0.03, msg: "皮疹、寒战发热、过敏性休克（马源血清，需皮试）", effects: [ { t: "histamine", max: 50, ec50: 1 }, { t: "sbp", max: -40, ec50: 1 } ] },
    flags: ["high_alert", "antidote"],
    note: "越早越好，用前皮试并备肾上腺素；过敏者需脱敏分次给药，全程监测血压与气道"
  },
  /* ============ 三、静脉降压与血管扩张（3） ============ */
  {
    id: "clevidipine", name: "氯维地平", alias: "Clevidipine · Cleviprex", cls: "降压药 · 超短效二氢吡啶类钙拮抗剂",
    unit: "mg", routes: ["iv_inf"],
    dose: { min: 0.5, typical: 2, max: 16 },
    rateRange: { min: 0.5, max: 16, per: "mg/h" },
    halfLife: 1, onset: 1, peak: 4, dur: 12,
    metabol: "血与组织酯酶水解，不经 CYP；代谢物经肾与胆汁排泄",
    effects: [
      { t: "sbp", max: -25, ec50: 1 },
      { t: "dbp", max: -18, ec50: 1 },
      { t: "svr", max: -30, ec50: 1 },
      { t: "hr", max: 8, ec50: 1.5 },
      { t: "coronary", max: 15, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "sbp", max: -55, ec50: 1 }, { t: "map", max: -40, ec50: 1 }, { t: "hr", max: 35, ec50: 1.2 } ], msg: "严重低血压、反射性心动过速、头痛与恶心" },
    allergy: { p: 0.006, msg: "皮疹、面部潮红；大豆/卵磷脂赋形剂过敏者禁用", effects: [ { t: "histamine", max: 15, ec50: 1 }, { t: "sbp", max: -15, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "动脉血压连续监测下滴定，起效 2–4 分钟、停药 5–15 分钟失效；大豆油/鸡蛋磷脂过敏与脂质代谢障碍者禁用"
  },
  {
    id: "hydralazine", name: "肼屈嗪", alias: "Hydralazine 肼苯哒嗪", cls: "降压药 · 动脉直接扩张剂",
    unit: "mg", routes: ["iv", "im", "po"],
    dose: { min: 5, typical: 10, max: 20 },
    rateRange: null,
    halfLife: 120, onset: 10, peak: 20, dur: 240,
    metabol: "肝 NAT2 乙酰化，慢乙酰化者血药浓度高、狼疮样反应更多",
    effects: [
      { t: "sbp", max: -30, ec50: 1 },
      { t: "dbp", max: -22, ec50: 1 },
      { t: "svr", max: -35, ec50: 1 },
      { t: "hr", max: 15, ec50: 1.2 },
      { t: "map", max: -25, ec50: 1.2 }
    ],
    tox: { factor: 3, effects: [ { t: "sbp", max: -60, ec50: 1 }, { t: "map", max: -45, ec50: 1 }, { t: "hr", max: 40, ec50: 1.2 }, { t: "temp", max: 0.8, ec50: 2 } ], msg: "严重低血压、反射性心动过速、狼疮样综合征（长期用药）、药物热" },
    allergy: { p: 0.015, msg: "皮疹、发热、狼疮样反应（关节痛、抗核抗体阳性）", effects: [ { t: "histamine", max: 20, ec50: 1 }, { t: "temp", max: 1, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "子痫/妊娠期高血压 5–10 mg 缓慢静推，每 20 分钟可重复；静推过快可致低血压与反射性心动过速"
  },
  {
    id: "enalaprilat", name: "依那普利拉", alias: "Enalaprilat 依那普利拉注射液", cls: "降压药 · 静脉 ACEI",
    unit: "mg", routes: ["iv"],
    dose: { min: 0.625, typical: 1.25, max: 5 },
    rateRange: null,
    halfLife: 660, onset: 15, peak: 60, dur: 720,
    metabol: "为依那普利的活性形式，不经代谢，以原型经肾排泄",
    effects: [
      { t: "sbp", max: -25, ec50: 1 },
      { t: "dbp", max: -15, ec50: 1 },
      { t: "svr", max: -28, ec50: 1 },
      { t: "map", max: -18, ec50: 1.2 }
    ],
    tox: { factor: 3, effects: [ { t: "sbp", max: -55, ec50: 1 }, { t: "renal", max: -25, ec50: 1 }, { t: "k", max: 1, ec50: 1.2 }, { t: "bronchospasm", max: 20, ec50: 1.5 } ], msg: "严重低血压、急性肾损伤、高钾血症、血管性水肿" },
    allergy: { p: 0.02, msg: "皮疹、血管性水肿（舌/喉，可致命）、过敏性休克", effects: [ { t: "histamine", max: 30, ec50: 1 }, { t: "sbp", max: -25, ec50: 1 }, { t: "bronchospasm", max: 25, ec50: 1.2 } ] },
    flags: ["high_alert"],
    note: "高血压急症 1.25 mg 每 6 小时静推，15 分钟起效；妊娠、双侧肾动脉狭窄与血管性水肿史者禁用"
  },
  /* ============ 四、抗微生物（8） ============ */
  {
    id: "ceftazidime_avibactam", name: "头孢他啶阿维巴坦", alias: "Ceftazidime-Avibactam · Avycaz", cls: "抗生素 · 头孢菌素/β-内酰胺酶抑制剂复方",
    unit: "g", routes: ["iv_inf"],
    dose: { min: 1.25, typical: 2.5, max: 2.5 },
    rateRange: { min: 1.25, max: 2.5, per: "g/h" },
    halfLife: 150, onset: 30, peak: 60, dur: 480,
    metabol: "两者均以原型经肾排泄，肾功能不全需按 CrCl 调整剂量",
    effects: [
      { t: "wbc", max: -1.5, ec50: 1 },
      { t: "temp", max: -0.5, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "renal", max: -15, ec50: 1 }, { t: "gi", max: -20, ec50: 1 }, { t: "seizure", max: 15, ec50: 1.5 } ], msg: "肾损害、腹泻、惊厥（肾功能不全时头孢他啶蓄积）" },
    allergy: { p: 0.02, msg: "皮疹、荨麻疹、过敏性休克（青霉素/头孢交叉过敏）", effects: [ { t: "histamine", max: 35, ec50: 1 }, { t: "sbp", max: -25, ec50: 1 } ] },
    flags: [],
    note: "覆盖 KPC/OXA-48 型 CRE 与铜绿假单胞菌：2.5 g 每 8 小时静滴 2 小时，按 CrCl 调整"
  },
  {
    id: "colistin", name: "多黏菌素 E（黏菌素）", alias: "Colistin · 黏菌素甲磺酸钠 CMS", cls: "抗生素 · 多肽类（耐多药革兰阴性菌）",
    unit: "MIU", routes: ["iv_inf", "neb"],
    dose: { min: 2, typical: 4.5, max: 9 },
    rateRange: { min: 2, max: 8, per: "MIU/h" },
    halfLife: 240, onset: 60, peak: 120, dur: 720,
    metabol: "CMS 在体内水解为黏菌素碱基，主要经肾排泄",
    effects: [
      { t: "wbc", max: -1.5, ec50: 1 },
      { t: "temp", max: -0.4, ec50: 1.5 }
    ],
    tox: { factor: 2.5, effects: [ { t: "renal", max: -28, ec50: 1 }, { t: "gcs", max: -3, ec50: 1.5 }, { t: "rr", max: -5, ec50: 1.5 }, { t: "k", max: -0.4, ec50: 1.5 } ], msg: "剂量依赖性肾损害、神经毒性（口周麻木、眩晕、呼吸抑制）" },
    allergy: { p: 0.015, msg: "皮疹、支气管痉挛（雾化时）、注射部位反应", effects: [ { t: "histamine", max: 25, ec50: 1 }, { t: "bronchospasm", max: 20, ec50: 1.5 } ] },
    flags: ["high_alert"],
    note: "碳青霉烯耐药革兰阴性菌的最后线用药：负荷 9 MIU，之后 4.5 MIU 每 12 小时，需监测肾功能与神经症状"
  },
  {
    id: "tigecycline", name: "替加环素", alias: "Tigecycline 泰阁", cls: "抗生素 · 甘氨酰环素类",
    unit: "mg", routes: ["iv_inf"],
    dose: { min: 50, typical: 100, max: 200 },
    rateRange: { min: 50, max: 100, per: "mg/h" },
    halfLife: 2160, onset: 60, peak: 120, dur: 1440,
    metabol: "肝代谢与胆汁排泄，肾功能不全无需调整",
    effects: [
      { t: "wbc", max: -1.5, ec50: 1 },
      { t: "temp", max: -0.4, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "gi", max: -25, ec50: 1 }, { t: "hepatic", max: -20, ec50: 1 }, { t: "inr", max: 0.4, ec50: 1.5 }, { t: "emesis", max: 35, ec50: 1 } ], msg: "恶心呕吐、肝损害、凝血酶原时间延长、胰腺炎" },
    allergy: { p: 0.012, msg: "皮疹、瘙痒、过敏样反应", effects: [ { t: "histamine", max: 20, ec50: 1 } ] },
    flags: [],
    note: "广谱覆盖 CRE 与厌氧菌，但血药浓度低、不宜单用治菌血症；妊娠与 8 岁以下禁用（牙齿变色）"
  },
  {
    id: "clindamycin", name: "克林霉素", alias: "Clindamycin 氯洁霉素", cls: "抗生素 · 林可酰胺类",
    unit: "mg", routes: ["iv", "iv_inf", "po"],
    dose: { min: 300, typical: 600, max: 1200 },
    rateRange: { min: 600, max: 1200, per: "mg/h" },
    halfLife: 150, onset: 30, peak: 60, dur: 480,
    metabol: "肝 CYP3A4 代谢，部分原型经胆汁与肾排泄",
    effects: [
      { t: "wbc", max: -1.2, ec50: 1 },
      { t: "temp", max: -0.4, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "gi", max: -30, ec50: 1 }, { t: "hepatic", max: -15, ec50: 1 }, { t: "emesis", max: 30, ec50: 1 } ], msg: "艰难梭菌相关性腹泻/伪膜性肠炎、肝酶升高、皮疹" },
    allergy: { p: 0.02, msg: "皮疹、发热、过敏性休克（罕见）", effects: [ { t: "histamine", max: 30, ec50: 1 }, { t: "sbp", max: -20, ec50: 1 } ] },
    flags: [],
    note: "覆盖金黄色葡萄球菌与厌氧菌，可抑制毒素产生（坏死性筋膜炎联用）；静滴过快可致心律失常，警惕伪膜性肠炎"
  },
  {
    id: "caspofungin", name: "卡泊芬净", alias: "Caspofungin 科赛斯", cls: "抗真菌药 · 棘白菌素类",
    unit: "mg", routes: ["iv_inf"],
    dose: { min: 35, typical: 50, max: 70 },
    rateRange: { min: 35, max: 70, per: "mg/h" },
    halfLife: 600, onset: 60, peak: 120, dur: 1440,
    metabol: "肝代谢与自发性降解，少量原型经肾排泄",
    effects: [
      { t: "wbc", max: -1, ec50: 1 },
      { t: "temp", max: -0.3, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "hepatic", max: -20, ec50: 1 }, { t: "gi", max: -15, ec50: 1 }, { t: "k", max: -0.4, ec50: 1.5 }, { t: "histamine", max: 25, ec50: 1.2 } ], msg: "肝酶升高、输注反应（面部潮红、静脉炎）、低钾血症" },
    allergy: { p: 0.02, msg: "皮疹、面部潮红、过敏性休克（罕见）", effects: [ { t: "histamine", max: 35, ec50: 1 }, { t: "sbp", max: -15, ec50: 1 } ] },
    flags: [],
    note: "侵袭性念珠菌病一线：首剂 70 mg 负荷，之后 50 mg/d；肝功能不全减量至 35 mg/d"
  },
  {
    id: "voriconazole", name: "伏立康唑", alias: "Voriconazole 威凡", cls: "抗真菌药 · 三唑类",
    unit: "mg", routes: ["iv_inf", "po"],
    dose: { min: 200, typical: 400, max: 600 },
    rateRange: { min: 200, max: 400, per: "mg/h" },
    halfLife: 360, onset: 60, peak: 120, dur: 720,
    metabol: "肝 CYP2C19/2C9/3A4 代谢，个体差异大，需治疗药物监测",
    effects: [
      { t: "wbc", max: -1, ec50: 1 },
      { t: "temp", max: -0.3, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "hepatic", max: -25, ec50: 1 }, { t: "qt", max: 40, ec50: 1 }, { t: "gcs", max: -3, ec50: 1.2 }, { t: "pupil", max: 1, ec50: 1.5 } ], msg: "肝损害、QT 延长、视觉异常与幻觉、光敏性皮炎" },
    allergy: { p: 0.02, msg: "皮疹、光敏反应、过敏性休克", effects: [ { t: "histamine", max: 30, ec50: 1 }, { t: "sbp", max: -15, ec50: 1 } ] },
    flags: [],
    note: "侵袭性曲霉病首选：首日 6 mg/kg 每 12 小时负荷，之后 4 mg/kg 每 12 小时；监测谷浓度 1–5.5 mg/L 与肝功能"
  },
  {
    id: "sulfamethoxazole_trimethoprim", name: "复方磺胺甲噁唑", alias: "SMZ-TMP · 复方新诺明（按 TMP 计）", cls: "抗生素 · 磺胺/叶酸拮抗剂复方",
    unit: "mg", routes: ["po", "iv_inf"],
    dose: { min: 80, typical: 160, max: 320 },
    rateRange: { min: 160, max: 320, per: "mg/h" },
    halfLife: 600, onset: 60, peak: 120, dur: 720,
    metabol: "肝乙酰化代谢，经肾排泄（易结晶尿）",
    effects: [
      { t: "wbc", max: -1.5, ec50: 1 },
      { t: "temp", max: -0.4, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "wbc", max: -4, ec50: 1 }, { t: "plt", max: -80, ec50: 1 }, { t: "renal", max: -25, ec50: 1.2 }, { t: "k", max: 1, ec50: 1.2 } ], msg: "骨髓抑制、高钾血症、结晶尿与肾损害、Stevens-Johnson 综合征" },
    allergy: { p: 0.03, msg: "皮疹、SJS/TEN、过敏性休克（磺胺过敏）", effects: [ { t: "histamine", max: 40, ec50: 1 }, { t: "sbp", max: -25, ec50: 1 }, { t: "temp", max: 1, ec50: 1.2 } ] },
    flags: ["high_alert"],
    note: "肺孢子菌肺炎按 TMP 15–20 mg/kg/d 分 3–4 次（TMP 160 mg = SMZ 800 mg）；充分水化，监测血钾血象，G6PD 缺乏者慎用"
  },
  {
    id: "rifaximin", name: "利福昔明", alias: "Rifaximin 昔服申", cls: "抗生素 · 肠道不吸收利福霉素",
    unit: "mg", routes: ["po"],
    dose: { min: 400, typical: 550, max: 1100 },
    rateRange: null,
    halfLife: 360, onset: 120, peak: 240, dur: 720,
    metabol: "几乎不经肠道吸收，以原型经粪便排出",
    effects: [
      { t: "brain", max: 5, ec50: 1 },
      { t: "gcs", max: 1, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "gi", max: -10, ec50: 1 }, { t: "emesis", max: 15, ec50: 1.2 } ], msg: "腹胀、恶心、皮疹（全身吸收极少，毒性低）" },
    allergy: { p: 0.008, msg: "皮疹、瘙痒、过敏样反应", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: [],
    note: "肝性脑病二级预防 550 mg 每日 2–3 次，几乎不吸收、无需按肾功能调整；肠梗阻者禁用"
  },
  /* ============ 五、镇静、镇痛与抗精神病（3） ============ */
  {
    id: "droperidol", name: "氟哌利多", alias: "Droperidol 氟哌啶", cls: "抗精神病药 · 丁酰苯类（止吐/镇静）",
    unit: "mg", routes: ["iv", "im"],
    dose: { min: 0.625, typical: 1.25, max: 2.5 },
    rateRange: null,
    halfLife: 150, onset: 5, peak: 15, dur: 240,
    metabol: "肝 CYP 代谢，经肾与胆汁排泄",
    effects: [
      { t: "emesis", max: -70, ec50: 1 },
      { t: "sedation", max: 25, ec50: 1.2 },
      { t: "sbp", max: -8, ec50: 1.5 },
      { t: "qt", max: 20, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "qt", max: 80, ec50: 1 }, { t: "sedation", max: 40, ec50: 1.2 }, { t: "sbp", max: -25, ec50: 1.2 }, { t: "gcs", max: -3, ec50: 1.5 } ], msg: "QT 延长与尖端扭转型室速、锥体外系反应（静坐不能、肌张力障碍）、低血压" },
    allergy: { p: 0.008, msg: "皮疹、锥体外系反应、低血压", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "急诊止吐/急性激越 0.625–1.25 mg 静推；有 QT 延长黑框警告，用药前后查 ECG 并纠正低钾低镁"
  },
  {
    id: "olanzapine", name: "奥氮平", alias: "Olanzapine 再普乐", cls: "抗精神病药 · 非典型（噻吩苯二氮䓬）",
    unit: "mg", routes: ["po", "im"],
    dose: { min: 2.5, typical: 10, max: 20 },
    rateRange: null,
    halfLife: 1980, onset: 30, peak: 120, dur: 1440,
    metabol: "肝 CYP1A2 代谢，代谢物经肾排泄",
    effects: [
      { t: "sedation", max: 30, ec50: 1 },
      { t: "emesis", max: -30, ec50: 1.5 },
      { t: "pain", max: -8, ec50: 1.5 },
      { t: "hr", max: -5, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "sedation", max: 50, ec50: 1 }, { t: "sbp", max: -25, ec50: 1.2 }, { t: "qt", max: 30, ec50: 1.2 }, { t: "rr", max: -4, ec50: 1.5 } ], msg: "过度镇静、体位性低血压、QT 延长、恶性综合征" },
    allergy: { p: 0.01, msg: "皮疹、嗜酸性粒细胞增多、过敏样反应", effects: [ { t: "histamine", max: 20, ec50: 1 }, { t: "temp", max: 0.5, ec50: 1.5 } ] },
    flags: [],
    note: "急性激越 10 mg 肌注（24 小时最大 30 mg）；与苯二氮䓬合用可致呼吸抑制与低血压，需监测"
  },
  {
    id: "hydromorphone", name: "氢吗啡酮", alias: "Hydromorphone 二氢吗啡酮 · Dilaudid", cls: "镇痛药 · 强效 μ 阿片激动剂",
    unit: "mg", routes: ["iv", "sc", "im"],
    dose: { min: 0.2, typical: 0.5, max: 2 },
    rateRange: null,
    halfLife: 150, onset: 5, peak: 15, dur: 240,
    metabol: "肝葡萄糖醛酸结合，代谢物经肾排泄（肾功能不全易蓄积）",
    effects: [
      { t: "pain", max: -55, ec50: 1 },
      { t: "sedation", max: 20, ec50: 1.2 },
      { t: "rr", max: -6, ec50: 1.5 },
      { t: "hr", max: -8, ec50: 1.5 },
      { t: "pupil", max: -1.5, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "rr", max: -18, ec50: 1 }, { t: "gcs", max: -8, ec50: 1 }, { t: "sbp", max: -25, ec50: 1.2 }, { t: "pupil", max: -1.5, ec50: 1.5 } ], msg: "呼吸抑制、昏迷、针尖样瞳孔、低血压与心动过缓" },
    allergy: { p: 0.008, msg: "皮疹、瘙痒、组胺释放致低血压", effects: [ { t: "histamine", max: 20, ec50: 1 }, { t: "sbp", max: -12, ec50: 1 } ] },
    flags: ["controlled", "high_alert"],
    note: "强阿片：0.5 mg 静推约等效吗啡 3–5 mg；呼吸抑制时用纳洛酮 0.04–0.4 mg 滴定，避免骤发剧痛与戒断"
  },
  /* ============ 六、内分泌、电解质与代谢（3） ============ */
  {
    id: "fludrocortisone", name: "氟氢可的松", alias: "Fludrocortisone 9α-氟氢可的松", cls: "内分泌 · 盐皮质激素",
    unit: "mg", routes: ["po"],
    dose: { min: 0.05, typical: 0.1, max: 0.4 },
    rateRange: null,
    halfLife: 240, onset: 240, peak: 720, dur: 1440,
    metabol: "肝代谢，代谢物经肾排泄",
    effects: [
      { t: "na", max: 3, ec50: 1 },
      { t: "k", max: -0.5, ec50: 1 },
      { t: "volume", max: 400, ec50: 1.2 },
      { t: "sbp", max: 10, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "na", max: 8, ec50: 1 }, { t: "k", max: -1.2, ec50: 1 }, { t: "sbp", max: 30, ec50: 1 }, { t: "osmo", max: 15, ec50: 1.5 } ], msg: "高血压、低钾性碱中毒、水肿与心衰加重、高钠血症" },
    allergy: { p: 0.005, msg: "皮疹、水肿、高血压", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "失盐性肾上腺危象 0.05–0.2 mg/d 口服（氢化可的松之外补充）；监测血压、血钾与水肿"
  },
  {
    id: "sodium_phosphate", name: "磷酸钠", alias: "Sodium Phosphate 磷酸盐补充", cls: "电解质 · 磷酸盐补充",
    unit: "mmol", routes: ["iv_inf", "po"],
    dose: { min: 10, typical: 20, max: 30 },
    rateRange: { min: 5, max: 10, per: "mmol/h" },
    halfLife: 120, onset: 30, peak: 60, dur: 360,
    metabol: "参与骨矿化与细胞代谢，经肾排泄",
    effects: [
      { t: "phos", max: 0.4, ec50: 1 },
      { t: "ca", max: -0.15, ec50: 1.2 },
      { t: "k", max: -0.2, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "ca", max: -0.6, ec50: 1 }, { t: "renal", max: -25, ec50: 1.2 }, { t: "sbp", max: -20, ec50: 1.5 } ], msg: "低钙血症与手足搐搦、异位钙化、急性肾损伤、低血压（输注过快）" },
    allergy: { p: 0.003, msg: "注射部位疼痛、腹泻（口服）", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: [],
    note: "重度低磷血症（<0.5 mmol/L）静脉补 0.3 mmol/kg，输注速度 ≤7.5 mmol/h；需同步监测血钙、血钾与肾功能"
  },
  {
    id: "epoetin_alfa", name: "重组人促红素", alias: "Epoetin alfa 促红细胞生成素 · EPO", cls: "内分泌 · 造血生长因子",
    unit: "IU", routes: ["sc", "iv"],
    dose: { min: 2000, typical: 10000, max: 40000 },
    rateRange: null,
    halfLife: 1440, onset: 1440, peak: 4320, dur: 10080,
    metabol: "经受体介导降解，少量经肾排泄",
    effects: [
      { t: "hb", max: 1.2, ec50: 1 }
    ],
    tox: { factor: 4, effects: [ { t: "sbp", max: 25, ec50: 1 }, { t: "clotting", max: 15, ec50: 1.2 }, { t: "hb", max: 3, ec50: 1.5 } ], msg: "高血压、血栓事件（卒中、心梗、透析通路血栓）、红细胞增多" },
    allergy: { p: 0.01, msg: "皮疹、注射部位反应、纯红细胞再生障碍（抗 EPO 抗体）", effects: [ { t: "histamine", max: 15, ec50: 1 } ] },
    flags: [],
    note: "肾性贫血 100–150 IU/kg 每周 3 次或 10000 IU 每周一次；目标 Hb 10–11 g/dL，纠正过高增加血栓与死亡风险"
  },
  /* ============ 七、利尿剂（3） ============ */
  {
    id: "torsemide", name: "托拉塞米", alias: "Torsemide 特苏尼", cls: "利尿剂 · 袢利尿剂",
    unit: "mg", routes: ["po", "iv"],
    dose: { min: 5, typical: 20, max: 100 },
    rateRange: null,
    halfLife: 210, onset: 10, peak: 60, dur: 360,
    metabol: "肝 CYP2C9 代谢，部分原型经肾排泄",
    effects: [
      { t: "urine", max: 100, ec50: 1 },
      { t: "volume", max: -450, ec50: 1.2 },
      { t: "k", max: -0.6, ec50: 1.2 },
      { t: "na", max: -2, ec50: 1.5 },
      { t: "sbp", max: -8, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "urine", max: 180, ec50: 1 }, { t: "k", max: -1.5, ec50: 1 }, { t: "na", max: -6, ec50: 1.2 }, { t: "renal", max: -20, ec50: 1.2 } ], msg: "低钾低钠、脱水与低血压、肾前性氮质血症、耳毒性" },
    allergy: { p: 0.01, msg: "皮疹、光敏、磺胺交叉过敏", effects: [ { t: "histamine", max: 20, ec50: 1 } ] },
    flags: [],
    note: "生物利用度近 100%、作用时间比呋塞米长；20 mg 静推约等效呋塞米 40 mg，需每日监测电解质与体重"
  },
  {
    id: "bumetanide", name: "布美他尼", alias: "Bumetanide 丁尿胺", cls: "利尿剂 · 袢利尿剂",
    unit: "mg", routes: ["po", "iv", "iv_inf"],
    dose: { min: 0.5, typical: 1, max: 4 },
    rateRange: { min: 0.5, max: 2, per: "mg/h" },
    halfLife: 60, onset: 5, peak: 30, dur: 240,
    metabol: "部分肝代谢，主要经肾排泄",
    effects: [
      { t: "urine", max: 110, ec50: 1 },
      { t: "volume", max: -500, ec50: 1.2 },
      { t: "k", max: -0.7, ec50: 1.2 },
      { t: "na", max: -2, ec50: 1.5 },
      { t: "sbp", max: -8, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "k", max: -1.6, ec50: 1 }, { t: "na", max: -6, ec50: 1.2 }, { t: "renal", max: -20, ec50: 1.2 }, { t: "urine", max: 190, ec50: 1 } ], msg: "低钾低钠、脱水、肾前性氮质血症、快速静推致耳毒性" },
    allergy: { p: 0.01, msg: "皮疹、肌肉疼痛、磺胺交叉过敏", effects: [ { t: "histamine", max: 18, ec50: 1 } ] },
    flags: [],
    note: "1 mg 布美他尼约等效呋塞米 40 mg；口服吸收好，静推宜慢（≤2 mg/min）以避免耳毒性"
  },
  {
    id: "metolazone", name: "美托拉宗", alias: "Metolazone 美托拉腙 · Zaroxolyn", cls: "利尿剂 · 噻嗪类（远曲小管）",
    unit: "mg", routes: ["po"],
    dose: { min: 2.5, typical: 5, max: 10 },
    rateRange: null,
    halfLife: 480, onset: 60, peak: 120, dur: 1440,
    metabol: "部分肝代谢，主要经肾排泄",
    effects: [
      { t: "urine", max: 70, ec50: 1 },
      { t: "k", max: -0.7, ec50: 1.2 },
      { t: "na", max: -3, ec50: 1.5 },
      { t: "ca", max: -0.1, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "k", max: -1.8, ec50: 1 }, { t: "na", max: -8, ec50: 1.2 }, { t: "renal", max: -20, ec50: 1.2 } ], msg: "严重低钾低钠、脱水与低血压、高尿酸与血糖升高" },
    allergy: { p: 0.012, msg: "皮疹、光敏、磺胺交叉过敏", effects: [ { t: "histamine", max: 20, ec50: 1 } ] },
    flags: [],
    note: "常与袢利尿剂序贯联用治疗利尿剂抵抗的心衰，2.5–5 mg 每日一次；需每日监测电解质与肾功能"
  },
  /* ============ 八、心血管（α/β 阻滞）（3） ============ */
  {
    id: "doxazosin", name: "多沙唑嗪", alias: "Doxazosin 可多华", cls: "心血管药 · α1 受体阻滞剂",
    unit: "mg", routes: ["po"],
    dose: { min: 1, typical: 4, max: 16 },
    rateRange: null,
    halfLife: 1320, onset: 120, peak: 360, dur: 1440,
    metabol: "肝 CYP3A4 代谢，主要经胆汁与粪便排泄",
    effects: [
      { t: "sbp", max: -18, ec50: 1 },
      { t: "dbp", max: -12, ec50: 1 },
      { t: "svr", max: -20, ec50: 1 },
      { t: "urine", max: 10, ec50: 2 }
    ],
    tox: { factor: 3, effects: [ { t: "sbp", max: -45, ec50: 1 }, { t: "dbp", max: -30, ec50: 1 }, { t: "hr", max: 15, ec50: 1.5 } ], msg: "首剂低血压与晕厥、体位性低血压、水肿" },
    allergy: { p: 0.006, msg: "皮疹、头晕、水肿", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: [],
    note: "首剂 1 mg 睡前服以避免首剂晕厥；嗜铬细胞瘤术前控压须先用 β 阻滞剂，以免血压反常升高"
  },
  {
    id: "carvedilol", name: "卡维地洛", alias: "Carvedilol 达利全", cls: "心血管药 · β/α 受体阻滞剂",
    unit: "mg", routes: ["po"],
    dose: { min: 3.125, typical: 12.5, max: 50 },
    rateRange: null,
    halfLife: 420, onset: 60, peak: 120, dur: 720,
    metabol: "肝 CYP2D6/2C9 代谢，首过效应明显",
    effects: [
      { t: "hr", max: -15, ec50: 1 },
      { t: "sbp", max: -15, ec50: 1 },
      { t: "contractility", max: -8, ec50: 1.5 },
      { t: "svr", max: -10, ec50: 1.5 },
      { t: "arrhythmia", max: -20, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "hr", max: -40, ec50: 1 }, { t: "sbp", max: -40, ec50: 1 }, { t: "contractility", max: -25, ec50: 1.2 }, { t: "gcs", max: -3, ec50: 1.5 }, { t: "bronchospasm", max: 25, ec50: 1.5 } ], msg: "严重心动过缓、低血压、心源性休克、支气管痉挛与低血糖掩盖" },
    allergy: { p: 0.008, msg: "皮疹、瘙痒、肝功能异常", effects: [ { t: "histamine", max: 15, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "心衰自 3.125 mg 每日 2 次起始、每 2 周倍增；急性失代偿期不加量，哮喘与严重心动过缓者禁用"
  },
  {
    id: "bisoprolol", name: "比索洛尔", alias: "Bisoprolol 康忻 · 博苏", cls: "心血管药 · β1 选择性阻滞剂",
    unit: "mg", routes: ["po"],
    dose: { min: 1.25, typical: 5, max: 10 },
    rateRange: null,
    halfLife: 660, onset: 60, peak: 180, dur: 1440,
    metabol: "肝代谢与肾原型排泄各约 50%，双通道清除",
    effects: [
      { t: "hr", max: -18, ec50: 1 },
      { t: "sbp", max: -12, ec50: 1 },
      { t: "contractility", max: -6, ec50: 1.5 },
      { t: "avconduction", max: -12, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "hr", max: -40, ec50: 1 }, { t: "sbp", max: -35, ec50: 1 }, { t: "avconduction", max: -45, ec50: 1 }, { t: "gcs", max: -3, ec50: 1.5 } ], msg: "严重心动过缓、房室传导阻滞、低血压、支气管痉挛" },
    allergy: { p: 0.006, msg: "皮疹、乏力、肢端发冷", effects: [ { t: "histamine", max: 10, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "心衰 1.25 mg/d 起始、每 2 周递增；不可突然停药（反跳性心绞痛/心动过速），严重心动过缓与哮喘者禁用"
  },
  /* ============ 九、止血与抗纤溶（2） ============ */
  {
    id: "aminocaproic_acid", name: "氨基己酸", alias: "Aminocaproic Acid 6-氨基己酸 · EACA", cls: "止血药 · 抗纤溶（赖氨酸类似物）",
    unit: "g", routes: ["iv", "iv_inf", "po"],
    dose: { min: 2, typical: 5, max: 10 },
    rateRange: { min: 1, max: 2, per: "g/h" },
    halfLife: 120, onset: 10, peak: 30, dur: 240,
    metabol: "不经代谢，以原型经肾排泄",
    effects: [
      { t: "clotting", max: 18, ec50: 1 },
      { t: "inr", max: -0.2, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "clotting", max: 15, ec50: 1 }, { t: "k", max: 0.5, ec50: 1.2 }, { t: "renal", max: -15, ec50: 1.5 }, { t: "sbp", max: -20, ec50: 1.2 } ], msg: "血栓形成、高钾血症、快速静推致低血压、肌病与肌红蛋白尿" },
    allergy: { p: 0.01, msg: "皮疹、恶心、低血压", effects: [ { t: "histamine", max: 15, ec50: 1 }, { t: "sbp", max: -10, ec50: 1 } ] },
    flags: [],
    note: "用于纤溶亢进性出血（心脏手术、肝移植、口腔/前列腺出血）：负荷 5 g 后 1 g/h；快速静推可致低血压，肾功能不全减量"
  },
  {
    id: "factor_viia", name: "重组凝血因子 VIIa", alias: "Recombinant Factor VIIa · NovoSeven", cls: "止血药 · 重组活化 VII 因子",
    unit: "mg", routes: ["iv"],
    dose: { min: 1, typical: 5, max: 8 },
    rateRange: null,
    halfLife: 170, onset: 5, peak: 15, dur: 120,
    metabol: "与组织因子结合后在凝血过程中消耗，降解产物经肾排泄",
    effects: [
      { t: "clotting", max: 25, ec50: 1 },
      { t: "inr", max: -0.4, ec50: 1.2 }
    ],
    tox: { factor: 3, effects: [ { t: "clotting", max: 20, ec50: 1 }, { t: "plt", max: -30, ec50: 1.5 }, { t: "inr", max: -0.3, ec50: 1.5 } ], msg: "动脉与静脉血栓事件、DIC 样消耗、血小板减少" },
    allergy: { p: 0.01, msg: "皮疹、发热、输注反应", effects: [ { t: "histamine", max: 20, ec50: 1 }, { t: "temp", max: 0.8, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "用于血友病抑制物出血、严重创伤/产后出血的挽救治疗：90 µg/kg（成人约 5 mg）静推；血栓风险随剂量与年龄增加"
  },
  /* ============ 十、产科与呼吸（2） ============ */
  {
    id: "carboprost", name: "卡前列素氨丁三醇", alias: "Carboprost Tromethamine · Hemabate", cls: "产科用药 · 前列腺素 F2α（宫缩剂）",
    unit: "mcg", routes: ["im"],
    dose: { min: 125, typical: 250, max: 500 },
    rateRange: null,
    halfLife: 10, onset: 5, peak: 15, dur: 60,
    metabol: "肝氧化与还原代谢，代谢物经肾排泄",
    effects: [
      { t: "uterus", max: 55, ec50: 1 },
      { t: "gi", max: -25, ec50: 1.2 },
      { t: "temp", max: 0.6, ec50: 1.5 },
      { t: "bronchospasm", max: 10, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "gi", max: -40, ec50: 1 }, { t: "bronchospasm", max: 45, ec50: 1 }, { t: "temp", max: 1.5, ec50: 1.2 }, { t: "sbp", max: 20, ec50: 1.5 } ], msg: "支气管痉挛、严重呕吐腹泻、发热、子宫过度刺激与子宫破裂" },
    allergy: { p: 0.01, msg: "皮疹、发热、寒战", effects: [ { t: "histamine", max: 20, ec50: 1 }, { t: "temp", max: 0.8, ec50: 1 } ] },
    flags: ["high_alert"],
    note: "产后出血 250 mcg 肌注，每 15–90 分钟可重复（最大 2 mg/8 剂）；哮喘与青光眼者禁用，警惕子宫过度刺激"
  },
  {
    id: "terbutaline", name: "特布他林", alias: "Terbutaline 间羟舒喘宁 · 博利康尼", cls: "支气管扩张剂 · β2 受体激动剂",
    unit: "mg", routes: ["sc", "iv_inf", "neb"],
    dose: { min: 0.25, typical: 0.25, max: 0.5 },
    rateRange: { min: 2.5, max: 10, per: "mcg/min" },
    halfLife: 180, onset: 5, peak: 30, dur: 240,
    metabol: "肝硫酸结合代谢，经肾排泄",
    effects: [
      { t: "bronchospasm", max: -45, ec50: 1 },
      { t: "rr", max: 3, ec50: 1.5 },
      { t: "hr", max: 15, ec50: 1.2 },
      { t: "k", max: -0.5, ec50: 1.5 },
      { t: "uterus", max: -30, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "hr", max: 50, ec50: 1 }, { t: "k", max: -1.2, ec50: 1.2 }, { t: "lactate", max: 2, ec50: 1.5 }, { t: "sbp", max: -15, ec50: 1.5 }, { t: "glucose", max: 3, ec50: 1.5 } ], msg: "心动过速、低钾血症、乳酸酸中毒、高血糖、肺水肿" },
    allergy: { p: 0.01, msg: "皮疹、震颤、心悸", effects: [ { t: "histamine", max: 15, ec50: 1 }, { t: "hr", max: 15, ec50: 1 } ] },
    flags: [],
    note: "急性哮喘 0.25 mg 皮下注射（15–20 分钟可重复）；宫缩抑制 2.5–10 µg/min 泵入，需监测心率、血钾、血糖与肺水肿"
  },
  /* ============ 十一、抗癫痫（1） ============ */
  {
    id: "lacosamide", name: "拉考沙胺", alias: "Lacosamide 拉考沙胺 · Vimpat", cls: "抗癫痫药 · 钠通道慢失活阻滞",
    unit: "mg", routes: ["iv", "iv_inf", "po"],
    dose: { min: 50, typical: 200, max: 400 },
    rateRange: { min: 100, max: 400, per: "mg/h" },
    halfLife: 780, onset: 15, peak: 60, dur: 720,
    metabol: "肝 CYP2C19/3A4 代谢，约 40% 以原型经肾排泄",
    effects: [
      { t: "seizure", max: -55, ec50: 1 },
      { t: "brain", max: 5, ec50: 1.5 },
      { t: "hr", max: -5, ec50: 2 },
      { t: "avconduction", max: -8, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "avconduction", max: -35, ec50: 1 }, { t: "gcs", max: -4, ec50: 1.2 }, { t: "hr", max: -20, ec50: 1.5 }, { t: "sbp", max: -15, ec50: 1.5 } ], msg: "PR 间期延长与房室阻滞、眩晕、共济失调、意识模糊" },
    allergy: { p: 0.008, msg: "皮疹、瘙痒、肝功能异常", effects: [ { t: "histamine", max: 15, ec50: 1 } ] },
    flags: [],
    note: "癫痫持续状态二线：200 mg 15 分钟静滴（未用过口服者可用 400 mg）；需监测 ECG 与 PR 间期"
  },
  /* ============ 十二、液体治疗（1） ============ */
  {
    id: "plasma_lyte", name: "复方电解质注射液（Plasma-Lyte）", alias: "Plasma-Lyte 复方电解质 · 勃脉力", cls: "液体治疗 · 平衡晶体液（无钙）",
    unit: "ml", routes: ["iv_inf"],
    dose: { min: 250, typical: 500, max: 2000 },
    rateRange: { min: 100, max: 999, per: "ml/h" },
    halfLife: 45, onset: 0.2, peak: 15, dur: 60,
    metabol: "电解质经肾排泄，醋酸根在肝代谢为碳酸氢盐",
    effects: [
      { t: "volume", max: 650, ec50: 1 },
      { t: "sbp", max: 10, ec50: 1 },
      { t: "ph", max: 0.03, ec50: 1.5 },
      { t: "na", max: 2, ec50: 1.5 },
      { t: "k", max: 0.1, ec50: 1.5 }
    ],
    tox: { factor: 3, effects: [ { t: "volume", max: 900, ec50: 1 }, { t: "spo2", max: -6, ec50: 1 }, { t: "ph", max: 0.05, ec50: 1.5 }, { t: "na", max: 4, ec50: 1.5 } ], msg: "容量过负荷与肺水肿、代谢性碱中毒（大量输注）、稀释性凝血障碍" },
    allergy: { p: 0.001, msg: "罕见输液反应与静脉炎", effects: [ { t: "histamine", max: 12, ec50: 1 } ] },
    flags: [],
    note: "成分接近血浆（Na 140、K 5、Mg 3、醋酸 27、Cl 98），不含钙，可与血制品同管路输注"
  },
  /* ============ 十三、免疫调节（补充） ============ */
  {
    id: "ivig", name: "静脉注射免疫球蛋白", alias: "IVIG 丙种球蛋白", cls: "免疫调节 · 多克隆 IgG",
    unit: "g", routes: ["iv_inf"],
    dose: { min: 10, typical: 20, max: 40 },
    rateRange: { min: 1, max: 8, per: "g/h" },
    halfLife: 1200, onset: 30, peak: 180, dur: 1440,
    metabol: "由网状内皮系统分解，半衰期约 21–28 天",
    effects: [
      { t: "plt", max: 55, ec50: 1 },
      { t: "immune", max: 12, ec50: 1.5 },
      { t: "wbc", max: 1.5, ec50: 2 }
    ],
    tox: { factor: 3, effects: [ { t: "volume", max: 500, ec50: 1 }, { t: "wbc", max: 3, ec50: 1.5 }, { t: "renal", max: -12, ec50: 1.5 } ], msg: "容量负荷、高黏滞血症、可逆性肾功能损害与无菌性脑膜炎" },
    allergy: { p: 0.02, msg: "输注反应：寒战、发热、头痛、皮疹", effects: [ { t: "temp", max: 1.0, ec50: 1 }, { t: "histamine", max: 20, ec50: 1 } ] },
    flags: [],
    note: "ITP / 吉兰-巴雷 / 中毒性休克辅助；输注速度过快易致容量负荷与输注反应"
  }
];
