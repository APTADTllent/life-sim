window.M = window.M || {};

/* ============================================================
   LIFE SIM · 病例库 II
   重点：心脏骤停 / 创伤 / 中毒（含环境理化、妇产、脓毒症）
   数值约定：vitals 与 stages[].changes 均为「相对健康基线的增量」
   （hr:-30 表示 76→46；sbp:-40 表示 118→78）
   ============================================================ */

M.DISEASES2 = [

  /* ================= 一、心脏骤停（3） ================= */
  {
    id: "ohca_vf",
    name: "院外心脏骤停（心室颤动）",
    category: "arrest",
    dept: "急诊科",
    site: "心脏 · 心室",
    triage: 5,
    hidden: false,
    ecgRegion: "diffuse",
    vitals: { hr: 0, sbp: -78, spo2: -30, gcs: -12, rhythm: "vf", contractility: -70, ph: -0.32, lactate: 6.2, k: 1.2, glucose: 5.4 },
    labs: { k: 5.4, lactate: 7.2, ph: 7.08, troponin: 1.2, glucose: 11.0, hco3: 12 },
    exam: {
      ecg: "粗大室颤波，频率约 300 次/分，无可见 QRS 波群",
      us: "心室无有效收缩，心腔内血流停滞，下腔静脉固定不塌陷",
      xray: "心影不大，双肺未见实变（复苏中床旁片）"
    },
    symptoms: [
      { name: "行走中突发倒地、呼之不应", mode: "视诊", t: 0 },
      { name: "大动脉搏动消失，心音听不到", mode: "触诊", t: 0 },
      { name: "叹息样呼吸继而停止", mode: "视诊", t: 20 },
      { name: "双侧瞳孔散大 5mm、对光反射消失", mode: "视诊", t: 120 },
      { name: "监护仪示心室颤动波形", mode: "监护", t: 0 }
    ],
    stages: [
      { t: 0, label: "室颤初期", changes: { sbp: -20, gcs: -12 }, log: "心室肌呈无序颤动，无有效射血，脑灌注骤停" },
      { t: 120, label: "缺氧酸中毒期", changes: { ph: -0.22, lactate: 4.0, brain: -35, spo2: -8 }, log: "组织无氧代谢，乳酸堆积，心肌收缩力进一步下降" },
      { t: 300, label: "电活动耗竭", changes: { rhythm: "asystole", k: 0.6, brain: -20 }, lethal: true, log: "室颤波幅逐渐变小并转为直线，心脏停搏不可逆" }
    ],
    treat: [
      { type: "drug", id: "epinephrine", need: true, note: "1mg 静推，每 3-5 分钟一次" },
      { type: "drug", id: "amiodarone", need: true, note: "300mg 静推，难治性室颤的首选抗心律失常药" },
      { type: "drug", id: "sodium_bicarbonate", need: false, note: "复苏超过 10 分钟、血气 pH<7.1 时使用" },
      { type: "surgery", proc: "embolization", site: "heart", need: false, note: "ROSC 后如为急性冠脉闭塞，尽早介入开通血管" }
    ],
    harm: [
      { id: "atropine", msg: "把室颤当成心动过缓处理，延误电除颤，抢救失败" },
      { id: "midazolam", msg: "未除颤先镇静，加重循环抑制并掩盖意识评估" },
      { id: "adenosine", msg: "对室颤使用腺苷毫无作用，白白耽误 1 分钟按压" }
    ],
    lethalAfter: 420,
    needSurgery: false,
    note: "室颤的唯一根本治疗是非同步电除颤，药物只是辅助；每延迟 1 分钟生存率下降 7%-10%"
  },
  {
    id: "ohca_pea",
    name: "无脉性电活动（PEA）",
    category: "arrest",
    dept: "急诊科",
    site: "心脏 · 全心（电机械分离）",
    triage: 5,
    hidden: false,
    ecgRegion: "diffuse",
    vitals: { hr: -45, sbp: -62, spo2: -20, gcs: -13, rhythm: "pea", contractility: -55, volume: -400, ph: -0.42, lactate: 8.0, glucose: 3.4, ca: -0.35, k: 2.2 },
    labs: { k: 6.4, lactate: 9.0, ph: 6.98, creatinine: 210, hco3: 10, glucose: 9.0, ca: 1.95 },
    exam: {
      ecg: "宽 QRS 规则节律，频率 31 次/分，有电活动但无机械收缩",
      us: "心腔内有电活动但室壁无运动，下腔静脉充盈固定",
      lab: "血气 pH 6.98、乳酸 9.0 mmol/L；血钾 6.4 mmol/L"
    },
    symptoms: [
      { name: "透析日未透析，家属诉「漏透 3 天、今晨开始嗜睡」", mode: "问诊", t: 0 },
      { name: "突发意识丧失、呼之不应", mode: "视诊", t: 0 },
      { name: "颈动脉搏动消失，监护仪仍有规则波形", mode: "触诊", t: 0 },
      { name: "濒死样呼吸，继而呼吸停止", mode: "视诊", t: 30 },
      { name: "皮肤湿冷、可见尿毒症霜", mode: "视诊", t: 60 }
    ],
    stages: [
      { t: 0, label: "电机械分离", changes: { sbp: -20, gcs: -13 }, log: "心肌有电活动但无有效收缩，循环中断" },
      { t: 150, label: "代谢崩溃期", changes: { ph: -0.20, lactate: 4.0, k: 0.5, brain: -30 }, log: "严重酸中毒与高钾进一步抑制心肌收缩" },
      { t: 330, label: "心脏停搏", changes: { rhythm: "asystole", sbp: -15 }, lethal: true, log: "电活动消失，转为直线，脑损伤不可逆" }
    ],
    treat: [
      { type: "drug", id: "epinephrine", need: true, note: "1mg 静推，同时高质量按压" },
      { type: "drug", id: "sodium_bicarbonate", need: true, note: "5% 碳酸氢钠 125ml，纠正严重代酸并促进钾内移" },
      { type: "drug", id: "calcium_gluconate", need: false, note: "高钾时 10% 葡萄糖酸钙 10ml 稳定心肌膜" },
      { type: "drug", id: "insulin", need: false, note: "常规胰岛素 10U + 50% 葡萄糖 50ml 静推，促进钾进入细胞" }
    ],
    harm: [
      { id: "atropine", msg: "PEA 不是心动过缓，阿托品无效且耽误寻找 5H5T 病因" },
      { id: "potassium_chloride", msg: "患者已高钾，补钾可直接诱发室颤与停搏" },
      { id: "succinylcholine", msg: "高钾状态下使用琥珀胆碱，血钾骤升可致死" }
    ],
    lethalAfter: 480,
    needSurgery: false,
    note: "PEA 的关键是找 5H5T（低血容量、低氧、酸中毒、高/低钾、低体温；张力性气胸、心包填塞、毒素、血栓、创伤）"
  },
  {
    id: "post_arrest_syndrome",
    name: "心脏骤停复苏后综合征",
    category: "arrest",
    dept: "重症医学科",
    site: "全身 · 复苏后多器官",
    triage: 5,
    hidden: false,
    ecgRegion: "anterior",
    vitals: { hr: 28, sbp: -42, dbp: -22, spo2: -9, gcs: -11, temp: 1.0, contractility: -42, urine: -35, icp: 6, ph: -0.18, lactate: 7.5, glucose: 7.2, inr: 0.4, k: 0.4 },
    labs: { lactate: 8.5, troponin: 3.2, ph: 7.22, creatinine: 190, k: 4.6, glucose: 12.8, hco3: 16, alt: 240, inr: 1.4 },
    exam: {
      ecg: "窦性心动过速 104 次/分，V1-V4 病理性 Q 波，ST 段轻度抬高 0.1mV",
      us: "左室前壁及心尖部运动减弱，EF 约 35%，下腔静脉充盈",
      ct: "脑灰白质分界模糊，皮质弥漫低密度，符合缺血缺氧性脑病早期",
      lab: "动脉血乳酸 8.5 mmol/L，肌钙蛋白 3.2 ng/mL"
    },
    symptoms: [
      { name: "ROSC 后仍昏迷，对呼唤与疼痛均无反应", mode: "视诊", t: 0 },
      { name: "双侧瞳孔 3mm、对光反射迟钝", mode: "视诊", t: 0 },
      { name: "四肢肌阵挛样抽动", mode: "视诊", t: 120 },
      { name: "皮肤湿冷、甲床毛细血管再充盈 5 秒", mode: "触诊", t: 0 },
      { name: "尿量减少至 15ml/h", mode: "监护", t: 240 },
      { name: "血压依赖去甲肾上腺素维持", mode: "监护", t: 60 }
    ],
    stages: [
      { t: 0, label: "复苏后低灌注期", changes: { sbp: -20, contractility: -25, urine: -20 }, log: "心肌顿抑 + 血管麻痹，出现复苏后休克" },
      { t: 240, label: "再灌注损伤期", changes: { temp: 1.2, wbc: 6.0, lactate: 2.5, spo2: -6, icp: 6 }, log: "全身缺血再灌注反应，发热、毛细血管渗漏、脑水肿" },
      { t: 540, label: "多器官衰竭/脑死亡", changes: { rhythm: "asystole", sbp: -25, renal: -40, gcs: -2, urine: -30 }, lethal: true, log: "循环再次崩溃，缺血缺氧性脑损伤不可逆" }
    ],
    treat: [
      { type: "drug", id: "norepinephrine", need: true, note: "泵入维持 MAP≥65mmHg，保证脑灌注" },
      { type: "drug", id: "dobutamine", need: false, note: "心肌顿抑、心输出量低时加用" },
      { type: "drug", id: "saline", need: false, note: "评估容量后谨慎补液，避免肺水肿" },
      { type: "drug", id: "levetiracetam", need: false, note: "肌阵挛/抽搐时抗癫痫治疗" }
    ],
    harm: [
      { id: "furosemide", msg: "把复苏后低血压当心衰利尿，脑与冠脉灌注进一步下降" },
      { id: "nitroglycerin", msg: "复苏后休克时扩血管，血压崩溃" },
      { id: "atropine", msg: "心率快而血压低，用阿托品只增加耗氧，不解决泵功能" }
    ],
    lethalAfter: 720,
    needSurgery: false,
    note: "复苏后治疗三件事：目标温度管理（32-36℃）、血流动力学优化、神经功能评估；避免发热与低血压"
  },

  /* ================= 二、创伤（7） ================= */
  {
    id: "pelvic_fracture",
    name: "骨盆骨折大出血",
    category: "trauma",
    dept: "创伤外科",
    site: "骨盆 · 骶髂关节与耻骨支",
    triage: 5,
    hidden: false,
    vitals: { hr: 40, sbp: -46, dbp: -24, spo2: -7, hb: -6.2, volume: -1500, pain: 80, rr: 8, urine: -35, clotting: -22, ph: -0.14, lactate: 4.6, inr: 0.45, k: -0.2 },
    labs: { hb: 7.8, plt: 138, inr: 1.45, lactate: 5.6, creatinine: 132, k: 4.0, ph: 7.26, hco3: 17 },
    exam: {
      xray: "骨盆正位片：右侧耻骨上下支骨折，骶髂关节间隙增宽 8mm",
      ct: "骨盆环双处断裂，盆腔腹膜后血肿约 12cm，动脉期见造影剂外溢",
      us: "盆腔游离液体，膀胱充盈良好，下腔静脉塌陷",
      ecg: "窦性心动过速 116 次/分"
    },
    symptoms: [
      { name: "被货车挤压骨盆后剧痛，不能翻身", mode: "问诊", t: 0 },
      { name: "骨盆挤压分离试验阳性、耻骨联合处压痛", mode: "触诊", t: 0 },
      { name: "面色苍白、四肢湿冷、甲床发绀", mode: "视诊", t: 60 },
      { name: "会阴部及阴囊大片皮下淤血", mode: "视诊", t: 120 },
      { name: "尿道外口滴血、导尿不畅", mode: "视诊", t: 180 },
      { name: "血压对补液反应差，进行性下降", mode: "监护", t: 240 }
    ],
    stages: [
      { t: 0, label: "腹膜后出血期", changes: { hb: -2.0, volume: -400, hr: 15 }, log: "骨盆静脉丛与松质骨面渗血，腹膜后可容纳 3-4L 血液" },
      { t: 240, label: "失血性休克期", changes: { sbp: -45, hb: -2.0, volume: -500, lactate: 2.0, urine: -40, clotting: -18 }, log: "失血超过 30%，出现创伤性凝血病" },
      { t: 540, label: "凝血病/循环崩溃", changes: { rhythm: "pea", hb: -2.0, plt: -60, inr: 1.4, sbp: -20, clotting: -25 }, lethal: true, log: "致死性三联征（低体温、酸中毒、凝血病）形成，循环不可逆崩溃" }
    ],
    treat: [
      { type: "drug", id: "tranexamic_acid", need: true, note: "伤后 3 小时内 1g 静推，随后 1g/8h" },
      { type: "surgery", proc: "embolization", site: "vessel", need: true, note: "骨盆动脉造影 + 髂内动脉栓塞止血" },
      { type: "drug", id: "saline", need: false, note: "允许性低血压复苏，避免过度晶体液稀释凝血因子" },
      { type: "drug", id: "norepinephrine", need: false, note: "容量复苏后仍低血压时维持灌注" },
      { type: "drug", id: "cryoprecipitate", need: false, note: "纤维蛋白原 <1.5g/L 时补充冷沉淀" }
    ],
    harm: [
      { id: "hetastarch", msg: "大量羟乙基淀粉扩容，加重凝血病与肾功能损害" },
      { id: "morphine", msg: "休克状态下静推吗啡，血压骤降并掩盖意识变化" },
      { id: "furosemide", msg: "把少尿当肾衰利尿，血容量进一步不足" }
    ],
    lethalAfter: 720,
    needSurgery: true,
    note: "骨盆骨折可隐性失血 3L 以上；外固定 + 动脉栓塞 + 大量输血（1:1:1）；先绑骨盆带再搬动"
  },
  {
    id: "flail_chest",
    name: "连枷胸 / 肺挫伤",
    category: "trauma",
    dept: "创伤外科",
    site: "胸腔 · 右侧第 4-8 肋",
    triage: 5,
    hidden: false,
    vitals: { hr: 30, sbp: -14, spo2: -15, rr: 18, pao2: -26, paco2: 10, tv: -160, pain: 78, secretions: 30, ph: -0.10, lactate: 2.4, hb: -3.2 },
    labs: { hb: 10.8, ph: 7.30, pco2: 52, lactate: 3.4, wbc: 14.0, troponin: 0.4, plt: 186 },
    exam: {
      xray: "右侧第 4-8 肋双处骨折，右中下肺野斑片状实变，右肋膈角变钝",
      ct: "右肺挫伤范围约 35%，右侧少量气胸及胸腔积液，可见连枷胸段",
      us: "右侧胸膜腔少量积液，膈肌运动幅度减弱",
      ecg: "窦性心动过速 106 次/分，未见 ST 抬高"
    },
    symptoms: [
      { name: "车祸后右胸剧痛，深呼吸与咳嗽时加重", mode: "问诊", t: 0 },
      { name: "吸气时右前胸壁反常内陷、呼气时膨出", mode: "视诊", t: 0 },
      { name: "右肺呼吸音减低，可闻及骨擦音与湿啰音", mode: "听诊", t: 60 },
      { name: "口唇发绀，鼻导管吸氧下 SpO₂ 仅 86%", mode: "视诊", t: 120 },
      { name: "因疼痛不敢咳嗽，气道痰鸣明显", mode: "听诊", t: 240 },
      { name: "呼吸频率进行性增快至 34 次/分", mode: "监护", t: 180 }
    ],
    stages: [
      { t: 0, label: "肺挫伤/低氧期", changes: { spo2: -8, pao2: -18, rr: 8, pain: 15 }, log: "肺挫伤致肺泡出血水肿、通气/血流比例失调" },
      { t: 240, label: "呼吸衰竭期", changes: { spo2: -12, paco2: 8, tv: -120, secretions: 25, gcs: -2 }, log: "反常呼吸 + 痰液潴留，出现二氧化碳蓄积" },
      { t: 540, label: "终末期", changes: { rhythm: "asystole", spo2: -18, paco2: 10, gcs: -2 }, lethal: true, log: "顽固低氧与呼吸性酸中毒致心跳停止" }
    ],
    treat: [
      { type: "surgery", proc: "drainage", site: "pleura", need: true, note: "右侧胸腔闭式引流，处理气胸与积液" },
      { type: "drug", id: "fentanyl", need: true, note: "静脉镇痛（PCA），疼痛控制后才能有效咳嗽与通气" },
      { type: "drug", id: "ceftriaxone", need: false, note: "肺挫伤合并痰液潴留，预防继发感染" },
      { type: "drug", id: "ketamine", need: false, note: "镇痛镇静辅助，保留自主呼吸" }
    ],
    harm: [
      { id: "furosemide", msg: "把肺挫伤当心源性肺水肿大量利尿，血容量不足、氧合更差" },
      { id: "morphine", msg: "大剂量吗啡抑制呼吸与咳嗽反射，痰液堵塞加重肺不张" }
    ],
    lethalAfter: 720,
    needSurgery: true,
    note: "连枷胸的核心治疗是充分镇痛 + 胸腔引流 + 必要时正压通气；肺挫伤本质是肺水肿，切忌脱水"
  },
  {
    id: "severe_tbi",
    name: "重型颅脑外伤",
    category: "trauma",
    dept: "神经外科",
    site: "颅腔 · 左额颞硬膜下",
    triage: 5,
    hidden: false,
    vitals: { hr: -22, sbp: 45, spo2: -5, gcs: -9, pupil: 1.5, icp: 12, rr: 4, pain: 45, hb: -0.6, glucose: 8.6, lactate: 1.2, k: -0.6, na: -2 },
    labs: { glucose: 14.2, k: 3.6, na: 138, lactate: 2.2, wbc: 16.0, inr: 1.15, plt: 205, hb: 13.4 },
    exam: {
      ct: "左额颞硬膜下血肿厚 1.8cm，中线向右移位 1.2cm，脑沟脑回消失",
      ecg: "窦性心动过缓 54 次/分，QT 间期延长至 480ms",
      us: "视神经鞘直径 6.2mm（提示颅内压升高）",
      xray: "未见肋骨骨折及血气胸"
    },
    symptoms: [
      { name: "骑车摔伤后昏迷，GCS 5 分（E1V2M2）", mode: "视诊", t: 0 },
      { name: "左侧瞳孔散大 4.5mm、对光反射消失", mode: "视诊", t: 60 },
      { name: "右侧肢体刺痛无躲避，左侧肢体可见自主活动", mode: "触诊", t: 0 },
      { name: "喷射性呕吐，呕吐物为胃内容物", mode: "视诊", t: 120 },
      { name: "血压升高伴心率减慢（库欣反应）", mode: "监护", t: 180 },
      { name: "呼吸节律不规则，出现潮式呼吸", mode: "视诊", t: 300 }
    ],
    stages: [
      { t: 0, label: "颅内血肿/颅高压期", changes: { icp: 10, pupil: 1.2, gcs: -3 }, log: "硬膜下血肿扩大，颅内压升高，脑灌注压下降" },
      { t: 240, label: "脑疝前期", changes: { icp: 16, pupil: 1.5, hr: -14, sbp: 20, rr: -4 }, log: "库欣反应：高血压、心动过缓、呼吸不规则，颞叶钩回疝形成" },
      { t: 540, label: "小脑幕切迹疝", changes: { icp: 24, pupil: 2.2, rhythm: "asystole", gcs: -2 }, lethal: true, log: "脑干受压致呼吸心跳停止，脑损伤不可逆" }
    ],
    treat: [
      { type: "drug", id: "mannitol", need: true, note: "20% 甘露醇 1g/kg 快速静滴，降颅压" },
      { type: "drug", id: "hypertonic_saline", need: true, note: "3% 高渗盐水 150ml，维持血钠 145-155mmol/L" },
      { type: "surgery", proc: "decompression", site: "cranium", need: true, note: "急诊开颅血肿清除 + 去骨瓣减压" },
      { type: "drug", id: "levetiracetam", need: false, note: "预防外伤后早期癫痫发作" }
    ],
    harm: [
      { id: "dexamethasone", msg: "激素对重型颅脑外伤无益，反而增加感染与消化道出血" },
      { id: "sodium_nitroprusside", msg: "把库欣反应的高血压当高血压危象降压，脑灌注压骤降" },
      { id: "furosemide", msg: "单用呋塞米脱水导致低血容量与低血压，加重继发性脑损伤" }
    ],
    lethalAfter: 720,
    needSurgery: true,
    note: "目标：CPP 60-70mmHg、ICP<22mmHg；避免低血压与低氧；甘露醇与高渗盐交替，血钠不是越高越好"
  },
  {
    id: "spinal_shock",
    name: "颈髓损伤 / 神经源性休克",
    category: "trauma",
    dept: "创伤外科",
    site: "脊柱 · 颈 5 椎体",
    triage: 5,
    hidden: false,
    vitals: { hr: -34, sbp: -38, dbp: -24, svr: -300, spo2: -8, gcs: -2, temp: -0.8, rr: -4, tv: -120, urine: -30, na: -7, ph: -0.04, lactate: 1.6, k: -0.8 },
    labs: { na: 133, k: 3.4, lactate: 2.6, hb: 12.6, glucose: 8.0, creatinine: 100, ph: 7.36, hco3: 22 },
    exam: {
      ct: "颈 5 椎体爆裂骨折，骨块突入椎管，椎管前后径减少 40%",
      xray: "颈椎侧位片：C5 椎体楔形变，椎前软组织肿胀 12mm",
      us: "下腔静脉充盈良好、心腔无扩大（低血压非低容量所致）",
      ecg: "窦性心动过缓 42 次/分，未见 ST 改变"
    },
    symptoms: [
      { name: "高处坠落致颈部剧痛，四肢完全不能活动", mode: "问诊", t: 0 },
      { name: "四肢弛缓性瘫、腱反射消失、病理征阴性", mode: "触诊", t: 0 },
      { name: "皮肤温暖干燥，与低血压程度不相称", mode: "触诊", t: 0 },
      { name: "腹式呼吸，胸廓扩张差，咳嗽无力", mode: "视诊", t: 60 },
      { name: "心率 40 次/分、血压 66/40mmHg", mode: "监护", t: 0 },
      { name: "阴茎异常勃起、尿潴留", mode: "视诊", t: 120 }
    ],
    stages: [
      { t: 0, label: "脊髓休克期", changes: { sbp: -20, hr: -20, svr: -250, urine: -20 }, log: "交感通路中断致血管麻痹、心动过缓，呈神经源性休克" },
      { t: 240, label: "高位截瘫呼吸衰竭", changes: { rr: -8, tv: -200, spo2: -12, gcs: -2 }, log: "膈肌与肋间肌无力，通气量下降、痰液无法排出" },
      { t: 600, label: "终末期", changes: { rhythm: "asystole", sbp: -20, spo2: -12 }, lethal: true, log: "低氧与心动过缓致心脏停搏，颈髓损伤不可逆" }
    ],
    treat: [
      { type: "drug", id: "norepinephrine", need: true, note: "泵入维持 MAP 85-90mmHg，保证脊髓灌注" },
      { type: "drug", id: "saline", need: true, note: "谨慎补液维持前负荷，避免肺水肿" },
      { type: "surgery", proc: "fixation", site: "spine", need: true, note: "颈椎后路减压 + 内固定，稳定脊柱" },
      { type: "drug", id: "atropine", need: false, note: "心率<45 次/分伴低血压时静推 0.5mg" }
    ],
    harm: [
      { id: "furosemide", msg: "神经源性休克并非容量过负荷，利尿使血压进一步下降" },
      { id: "succinylcholine", msg: "脊髓损伤 48 小时后使用琥珀胆碱可致致命性高钾" },
      { id: "nitroglycerin", msg: "血管已麻痹，再用扩血管药使血压崩溃" }
    ],
    lethalAfter: 780,
    needSurgery: true,
    note: "神经源性休克的特点：低血压 + 心动过缓 + 皮肤温暖干燥；先补液再去甲，禁用单纯利尿与扩血管"
  },
  {
    id: "crush_syndrome",
    name: "挤压综合征 / 横纹肌溶解",
    category: "trauma",
    dept: "急诊科",
    site: "全身 · 骨骼肌（右下肢为主）",
    triage: 5,
    hidden: false,
    vitals: { hr: 30, sbp: -30, dbp: -18, spo2: -6, volume: -700, pain: 72, k: 1.4, ph: -0.18, urine: -40, temp: -0.4, lactate: 3.2 },
    labs: { ck: 42000, k: 5.6, creatinine: 240, ph: 7.22, hco3: 14, lactate: 4.2, ca: 1.85, inr: 1.25 },
    exam: {
      ecg: "窦性心动过速，T 波高尖对称，QRS 增宽至 0.12s",
      us: "双肾皮髓质分界不清，肾血流阻力指数 0.82（升高）",
      ct: "右大腿及小腿肌肉弥漫肿胀、密度不均，筋膜间室增宽",
      xray: "右胫腓骨粉碎性骨折，右足软组织肿胀"
    },
    symptoms: [
      { name: "地震塌方右下肢被压 6 小时后救出", mode: "问诊", t: 0 },
      { name: "右小腿肿胀坚硬如木、被动牵拉剧痛", mode: "触诊", t: 0 },
      { name: "尿色呈酱油色、尿量减少", mode: "视诊", t: 120 },
      { name: "心悸、乏力、口周及手足麻木", mode: "问诊", t: 300 },
      { name: "心电监护示 T 波高尖", mode: "监护", t: 240 },
      { name: "尿量 10ml/h，补液后仍少尿", mode: "监护", t: 420 }
    ],
    stages: [
      { t: 0, label: "挤压解除/再灌注期", changes: { k: 0.8, lactate: 2.0, hb: -1.5, sbp: -10 }, log: "解除压迫后肌红蛋白、钾与酸性代谢产物大量入血" },
      { t: 240, label: "横纹肌溶解/高钾期", changes: { k: 1.2, renal: -30, urine: -30, ph: -0.12, ca: -0.45 }, log: "肌红蛋白管型堵塞肾小管，出现急性肾损伤与高钾" },
      { t: 540, label: "高钾致室颤", changes: { rhythm: "vf", k: 1.4, ph: -0.10 }, lethal: true, log: "血钾继续升高，心肌兴奋性失控，室颤不可逆" }
    ],
    treat: [
      { type: "drug", id: "saline", need: true, note: "早期 1-1.5L/h 大量补液，目标尿量 200-300ml/h" },
      { type: "drug", id: "sodium_bicarbonate", need: true, note: "碱化尿液（pH>6.5），减少肌红蛋白管型形成" },
      { type: "surgery", proc: "debridement", site: "longbone", need: true, note: "筋膜切开减压 + 坏死肌肉清创，必要时截肢" },
      { type: "drug", id: "calcium_gluconate", need: false, note: "高钾伴心电图改变时稳定心肌细胞膜" }
    ],
    harm: [
      { id: "potassium_chloride", msg: "患者已高钾，任何补钾都可能直接诱发室颤" },
      { id: "succinylcholine", msg: "挤压伤/横纹肌溶解禁用琥珀胆碱，可致致命性高钾" },
      { id: "furosemide", msg: "在容量不足、肌红蛋白管型堵塞时强行利尿，加重肾损伤" }
    ],
    lethalAfter: 720,
    needSurgery: true,
    note: "挤压综合征三关键：早补液、碱化尿液、监测血钾；血钾与 CK 是病情晴雨表，忌用琥珀胆碱与含钾液体"
  },
  {
    id: "traumatic_arrest",
    name: "创伤性心脏骤停",
    category: "trauma",
    dept: "急诊科",
    site: "胸腔 · 双侧胸腔（心包/肺）",
    triage: 5,
    hidden: false,
    vitals: { hr: -50, sbp: -70, spo2: -30, gcs: -14, rhythm: "pea", contractility: -60, hb: -7.6, volume: -1800, ph: -0.45, lactate: 9.5, k: 1.6 },
    labs: { hb: 6.4, lactate: 10.5, ph: 6.95, k: 5.8, inr: 1.8, plt: 70, hco3: 8, glucose: 13.5 },
    exam: {
      xray: "双侧胸腔大片致密影、肋膈角消失，双侧第 3-9 肋多发骨折，纵隔未见明显移位",
      us: "心包未见明显积液，下腔静脉塌陷，腹腔少量游离液体",
      ecg: "规则宽 QRS 节律，频率 28 次/分，按压时可见电活动但无机械收缩",
      ct: "（复苏中未完成）胸腹联合窗提示双侧血气胸与肺挫伤"
    },
    symptoms: [
      { name: "高处坠落（约 6 米）后当场意识丧失", mode: "视诊", t: 0 },
      { name: "双侧胸廓饱满、呼吸音几乎消失", mode: "听诊", t: 0 },
      { name: "气管居中，颈静脉轻度充盈", mode: "视诊", t: 0 },
      { name: "腹部膨隆、移动性浊音可疑阳性", mode: "触诊", t: 60 },
      { name: "大动脉搏动消失，按压时 ETCO₂ 仅 8mmHg", mode: "监护", t: 0 }
    ],
    stages: [
      { t: 0, label: "创伤性 PEA", changes: { sbp: -15, spo2: -10 }, log: "双侧血气胸 + 失血致无脉性电活动，需同时处理机械与容量因素" },
      { t: 120, label: "缺氧性酸中毒期", changes: { ph: -0.25, lactate: 4.0, brain: -30, k: 0.6 }, log: "持续低氧与低灌注，脑与心肌损伤迅速进展" },
      { t: 300, label: "停搏", changes: { rhythm: "asystole", sbp: -15 }, lethal: true, log: "电活动消失，创伤性骤停抢救失败" }
    ],
    treat: [
      { type: "drug", id: "epinephrine", need: true, note: "1mg 静推，每 3-5 分钟，同时高质量按压" },
      { type: "drug", id: "tranexamic_acid", need: true, note: "1g 静推，创伤性出血早期抗纤溶" },
      { type: "surgery", proc: "drainage", site: "pleura", need: true, note: "双侧胸腔置管减压（必要时开胸探查止血）" },
      { type: "drug", id: "sodium_bicarbonate", need: false, note: "严重代酸时使用，不能替代通气与止血" },
      { type: "drug", id: "saline", need: false, note: "建立 IO/静脉通路后快速加温输液" }
    ],
    harm: [
      { id: "midazolam", msg: "循环已停止仍先镇静，延误胸腔减压与止血" },
      { id: "atropine", msg: "创伤性骤停不是迷走反射，阿托品无效且占用抢救时间" },
      { id: "nitroglycerin", msg: "低血容量状态下扩血管，血压彻底崩溃" }
    ],
    lethalAfter: 420,
    needSurgery: true,
    note: "创伤性骤停的可逆病因：双侧胸腔减压、心包穿刺、止血与容量；按压同时做，不要先搬去 CT"
  },
  {
    id: "electrical_injury",
    name: "电击伤 / 电弧烧伤",
    category: "trauma",
    dept: "烧伤科",
    site: "全身 · 右前臂入口 / 右足出口",
    triage: 5,
    hidden: false,
    vitals: { hr: 34, sbp: -26, dbp: -16, spo2: -8, volume: -800, pain: 85, k: 1.6, temp: -0.5, arrhythmia: 30, qt: 70, hb: -1.8, ph: -0.16, lactate: 3.8 },
    labs: { ck: 18000, k: 5.8, hb: 12.2, lactate: 4.8, ph: 7.24, creatinine: 170, hco3: 15, ca: 1.90, inr: 1.2 },
    exam: {
      ecg: "窦性心动过速 112 次/分，V1-V3 ST 段抬高 0.15mV，QT 480ms，频发室早",
      us: "左室心尖部运动减弱，EF 约 45%",
      ct: "右前臂及手部肌肉广泛水肿坏死，未见腹腔积血",
      xray: "右肩关节脱位，右肱骨未见骨折"
    },
    symptoms: [
      { name: "接触 10kV 高压线后被击倒，从 3 米高处坠落", mode: "问诊", t: 0 },
      { name: "右手掌炭化焦痂、右足底出口创面", mode: "视诊", t: 0 },
      { name: "心悸、胸闷，心电图 ST 段抬高", mode: "监护", t: 60 },
      { name: "右上肢肿胀张力高、手指麻木发凉", mode: "触诊", t: 300 },
      { name: "尿色呈茶色、量少", mode: "视诊", t: 240 },
      { name: "意识模糊、烦躁", mode: "视诊", t: 420 }
    ],
    stages: [
      { t: 0, label: "电击/心肌损伤期", changes: { arrhythmia: 25, qt: 40, contractility: -15 }, log: "电流通过心肌致心律失常与心肌顿抑，QT 延长" },
      { t: 240, label: "横纹肌溶解期", changes: { k: 1.4, renal: -35, urine: -35, ca: -0.45, ph: -0.12 }, log: "深部肌肉大面积坏死，肌红蛋白与钾大量释放" },
      { t: 540, label: "室颤/高钾", changes: { rhythm: "vf", k: 1.2 }, lethal: true, log: "高钾与心肌电不稳定叠加，发生室颤" }
    ],
    treat: [
      { type: "drug", id: "saline", need: true, note: "按烧伤公式补液（乳酸林格/生理盐水），保证尿量 1ml/kg/h" },
      { type: "drug", id: "sodium_bicarbonate", need: true, note: "碱化尿液，防治肌红蛋白管型肾病" },
      { type: "surgery", proc: "debridement", site: "skin", need: true, note: "焦痂切开减压 + 深部坏死肌肉清创" },
      { type: "drug", id: "fentanyl", need: false, note: "充分镇痛，避免掩盖筋膜间室综合征" },
      { type: "drug", id: "amiodarone", need: false, note: "频发室早/室速时抗心律失常" }
    ],
    harm: [
      { id: "succinylcholine", msg: "电击伤伴大面积肌肉损伤，琥珀胆碱可致致命性高钾与室颤" },
      { id: "ibuprofen", msg: "横纹肌溶解伴肾损伤时使用非甾体药，加重急性肾衰" },
      { id: "potassium_chloride", msg: "血钾已升高，补钾可诱发室颤" }
    ],
    lethalAfter: 720,
    needSurgery: true,
    note: "电击伤按「冰山顶」估算：体表创面很小，深部肌肉坏死可能达体表面积数倍；全程心电监护并监测 CK、血钾"
  },

  /* ================= 三、中毒 / 过量（10） ================= */
  {
    id: "methanol_poisoning",
    name: "甲醇中毒",
    category: "poison",
    dept: "急诊科",
    site: "全身 · 甲醇/甲酸蓄积",
    triage: 5,
    hidden: false,
    ecgRegion: "diffuse",
    vitals: { hr: 22, sbp: -12, spo2: -4, gcs: -3, rr: 9, temp: -0.2, osmo: 50, ph: -0.26, pain: 40, lactate: 2.0, glucose: 1.2, k: 0.4 },
    labs: { ph: 7.14, hco3: 8, osmo: 340, lactate: 3.0, glucose: 6.8, k: 4.6, creatinine: 130, amylase: 60 },
    exam: {
      ecg: "窦性心动过速 98 次/分，QT 轻度延长 470ms",
      ct: "双侧豆状核对称性低密度影，符合甲醇中毒典型改变",
      us: "双肾回声增强，皮髓质分界欠清",
      lab: "阴离子间隙 32 mmol/L，渗透压间隙 45 mOsm/kg，血甲醇 62 mg/dL"
    },
    symptoms: [
      { name: "饮散装白酒约 300ml，12 小时后视物模糊、看灯光有彩晕", mode: "问诊", t: 0 },
      { name: "剧烈头痛、恶心呕吐", mode: "问诊", t: 0 },
      { name: "呼吸深大（Kussmaul 呼吸）", mode: "视诊", t: 60 },
      { name: "嗜睡、答话迟缓", mode: "视诊", t: 240 },
      { name: "瞳孔对光反射迟钝，视力仅存光感", mode: "视诊", t: 300 },
      { name: "皮肤干燥、尿量减少", mode: "监护", t: 420 }
    ],
    stages: [
      { t: 0, label: "甲醇/甲酸蓄积期", changes: { rr: 8, osmo: 20, ph: -0.06 }, log: "甲醇经乙醇脱氢酶转化为甲酸，代酸与渗透压间隙升高" },
      { t: 240, label: "高阴离子间隙代酸", changes: { ph: -0.14, gcs: -5, lactate: 2.0, k: -0.4, rr: 4 }, log: "甲酸抑制线粒体呼吸，乳酸与代酸迅速加重，意识下降" },
      { t: 600, label: "视神经损害/昏迷", changes: { gcs: -5, brain: -25, ph: -0.06, pupil: 1.0 }, log: "甲酸选择性损伤视神经与基底节，出现永久性视力损害" },
      { t: 720, label: "终末期", changes: { rhythm: "asystole", ph: -0.10, gcs: -2 }, lethal: true, log: "重度代酸与中枢抑制致心跳停止" }
    ],
    treat: [
      { type: "drug", id: "fomepizole", need: true, note: "甲吡唑 15mg/kg 负荷，抑制乙醇脱氢酶，越早越好" },
      { type: "drug", id: "sodium_bicarbonate", need: true, note: "纠正代酸，目标 pH>7.30、HCO₃⁻>15" },
      { type: "drug", id: "thiamine", need: false, note: "补充维生素 B1，改善代谢并预防 Wernicke 脑病" },
      { type: "drug", id: "folic_acid", need: false, note: "亚叶酸促进甲酸代谢（本药库以叶酸替代）" }
    ],
    harm: [
      { id: "mannitol", msg: "渗透压间隙已显著升高，再用甘露醇加重高渗与肾损伤" },
      { id: "furosemide", msg: "脱水加重低灌注与代酸，且不能清除甲醇" },
      { id: "metformin", msg: "在乳酸酸中毒基础上使用双胍类，加重乳酸蓄积" }
    ],
    lethalAfter: 840,
    needSurgery: false,
    note: "关键线索：视物模糊/视野缺损 + 高阴离子间隙代酸 + 渗透压间隙升高；甲吡唑（或乙醇）抑制代谢，重症需血液透析"
  },
  {
    id: "ethylene_glycol_poisoning",
    name: "乙二醇中毒",
    category: "poison",
    dept: "急诊科",
    site: "全身 · 草酸钙沉积（肾/脑）",
    triage: 5,
    hidden: false,
    ecgRegion: "diffuse",
    vitals: { hr: 24, sbp: -14, spo2: -3, gcs: -3, rr: 7, temp: -0.2, osmo: 40, ca: -0.42, urine: -30, ph: -0.22, lactate: 2.2, glucose: 0.6 },
    labs: { ph: 7.18, hco3: 10, osmo: 330, ca: 1.72, creatinine: 210, k: 5.0, lactate: 3.2, glucose: 6.2 },
    exam: {
      ecg: "窦性心动过速，QT 延长 490ms，可见室性早搏",
      us: "双肾增大、回声增强，皮髓质分界不清",
      ct: "双侧肾周渗出，脑实质未见出血",
      lab: "尿沉渣见大量草酸钙结晶，阴离子间隙 28 mmol/L，血钙 1.72 mmol/L"
    },
    symptoms: [
      { name: "误饮汽车防冻液约 200ml（自认为「甜味饮料」）", mode: "问诊", t: 0 },
      { name: "醉汉样步态、言语含糊但呼气无酒味", mode: "视诊", t: 30 },
      { name: "恶心呕吐、上腹隐痛", mode: "问诊", t: 0 },
      { name: "手足抽搐、Chvostek 征阳性（低钙）", mode: "触诊", t: 180 },
      { name: "尿量减少、尿液浑浊", mode: "监护", t: 300 },
      { name: "嗜睡加深，呼唤仅能睁眼", mode: "视诊", t: 420 }
    ],
    stages: [
      { t: 0, label: "渗透性利尿/中枢抑制期", changes: { osmo: 20, gcs: -3, urine: -20 }, log: "乙二醇本身致渗透性利尿与中枢抑制（似醉酒但无酒味）" },
      { t: 180, label: "草酸钙沉积/低钙期", changes: { ca: -0.45, renal: -35, urine: -30, ph: -0.10, k: 0.8 }, log: "代谢为草酸，与钙结合沉积于肾小管，出现低钙与急性肾损伤" },
      { t: 420, label: "急性肾衰/抽搐期", changes: { seizure: 35, gcs: -4, ca: -0.30, qt: 80 }, log: "低钙诱发抽搐与 QT 延长，少尿型肾衰确立" },
      { t: 660, label: "终末期", changes: { rhythm: "asystole", k: 0.8, ph: -0.10 }, lethal: true, log: "高钾、代酸与低钙共同导致心脏停搏" }
    ],
    treat: [
      { type: "drug", id: "fomepizole", need: true, note: "甲吡唑 15mg/kg 负荷，阻断乙二醇代谢为草酸" },
      { type: "drug", id: "sodium_bicarbonate", need: true, note: "纠正代酸，减少草酸钙在肾小管沉积" },
      { type: "drug", id: "thiamine", need: true, note: "维生素 B1 促进乙二醇经旁路代谢（联合吡哆醇）" },
      { type: "drug", id: "pyridoxine", need: false, note: "维生素 B6 100mg 静推，促进乙二醇代谢为无毒产物" },
      { type: "drug", id: "calcium_gluconate", need: false, note: "低钙抽搐或 QT 延长时补钙，需心电监护" }
    ],
    harm: [
      { id: "potassium_chloride", msg: "已出现高钾与少尿，补钾可诱发致命性心律失常" },
      { id: "furosemide", msg: "强行利尿加重肾损伤与低钙，且不能清除乙二醇" },
      { id: "ibuprofen", msg: "急性肾损伤时使用非甾体药，肾功能进一步恶化" }
    ],
    lethalAfter: 900,
    needSurgery: false,
    note: "「醉酒样但无酒味 + 低钙 + 草酸钙尿结晶 + 高阴离子间隙代酸」；甲吡唑 + 补钙 + 重症血透"
  },
  {
    id: "cyanide_poisoning",
    name: "氰化物中毒（火灾烟雾吸入）",
    category: "poison",
    dept: "急诊科",
    site: "全身 · 细胞色素氧化酶",
    triage: 5,
    hidden: false,
    ecgRegion: "diffuse",
    vitals: { hr: 42, sbp: -28, spo2: -12, gcs: -6, rr: 10, temp: 0.2, arrhythmia: 28, contractility: -22, ph: -0.35, lactate: 13.5, glucose: 3.4 },
    labs: { lactate: 14.5, ph: 7.05, hco3: 6, pco2: 28, glucose: 9.0, k: 4.4, creatinine: 120, inr: 1.1 },
    exam: {
      ecg: "窦性心动过速 118 次/分，ST 段压低 0.1mV，QRS 不宽",
      us: "心腔充盈良好，下腔静脉无塌陷（静脉血鲜红、回流正常）",
      ct: "头颅未见出血或梗死",
      lab: "动脉血呈鲜红色，PaO₂ 96mmHg 而乳酸 14.5mmol/L，血氰化物 3.8mg/L"
    },
    symptoms: [
      { name: "密闭地下室火灾中被救出时已昏迷", mode: "视诊", t: 0 },
      { name: "口唇、甲床呈樱桃红色而发绀不明显", mode: "视诊", t: 0 },
      { name: "现场同事诉呼出气有苦杏仁味", mode: "问诊", t: 0 },
      { name: "全身强直-阵挛抽搐", mode: "视诊", t: 60 },
      { name: "呼吸浅慢、SpO₂ 进行性下降", mode: "监护", t: 120 },
      { name: "血压下降、皮肤湿冷", mode: "监护", t: 180 }
    ],
    stages: [
      { t: 0, label: "细胞氧化酶抑制期", changes: { arrhythmia: 20, contractility: -15, spo2: -6 }, log: "氰化物与细胞色素氧化酶结合，细胞无法利用氧，静脉血呈鲜红" },
      { t: 180, label: "组织中毒性缺氧", changes: { gcs: -6, lactate: 5.0, ph: -0.20, seizure: 30, sbp: -18 }, log: "乳酸暴涨、代酸与抽搐，组织氧利用障碍" },
      { t: 420, label: "循环衰竭", changes: { rhythm: "asystole", sbp: -22, spo2: -10 }, lethal: true, log: "心肌与脑干缺氧，心脏停搏" }
    ],
    treat: [
      { type: "drug", id: "hydroxocobalamin", need: true, note: "羟钴胺 5g 静滴 15 分钟，氰化物一线解毒剂" },
      { type: "drug", id: "sodium_thiosulfate", need: true, note: "25% 硫代硫酸钠 50ml 静推，提供硫供肝酶解毒" },
      { type: "drug", id: "sodium_nitrite", need: false, note: "3% 亚硝酸钠 10ml 生成高铁血红蛋白结合氰根；火灾合并 CO 中毒时慎用" },
      { type: "drug", id: "sodium_bicarbonate", need: false, note: "严重代酸时使用，不能代替解毒剂" },
      { type: "drug", id: "midazolam", need: false, note: "控制抽搐，注意血压" }
    ],
    harm: [
      { id: "pralidoxime", msg: "把氰化物中毒误当有机磷中毒，用碘解磷定毫无作用，耽误解毒" },
      { id: "atropine", msg: "大剂量阿托品掩盖缺氧与心动过速，且对氰化物无效" },
      { id: "methylene_blue", msg: "亚甲蓝本身可氧化血红蛋白，在此场景加重氧输送障碍" }
    ],
    lethalAfter: 600,
    needSurgery: false,
    note: "「严重代酸 + 乳酸极高 + 静脉血鲜红 + 吸氧不改善」是氰化物中毒四联；羟钴胺 5g 为首选（不引起高铁血红蛋白，适合合并 CO 中毒的烟雾吸入），硫代硫酸钠为联合用药；同时排查 CO 与气道烧伤"
  },
  {
    id: "acetaminophen_overdose",
    name: "对乙酰氨基酚过量",
    category: "poison",
    dept: "急诊科",
    site: "肝脏 · 肝小叶中央区",
    triage: 4,
    hidden: false,
    vitals: { hr: 12, sbp: -6, spo2: -2, gcs: -1, temp: -0.3, pain: 28, emesis: 35, hepatic: -12, lactate: 0.6, glucose: -0.4, k: -0.4 },
    labs: { alt: 45, inr: 1.1, bilirubin: 12, creatinine: 88, k: 3.8, glucose: 5.2, lactate: 1.6, amylase: 45, ammonia: 30 },
    exam: {
      ecg: "窦性心律，未见异常",
      us: "肝实质回声均匀，未见腹水，胆囊壁不厚",
      lab: "服毒 4 小时血药浓度 180mg/L，位于 Rumack-Matthew 曲线之上，需全疗程 NAC"
    },
    symptoms: [
      { name: "因情绪问题一次吞服扑热息痛 0.5g×40 片", mode: "问诊", t: 0 },
      { name: "仅轻度恶心、上腹不适，无特异性表现", mode: "问诊", t: 0 },
      { name: "家属带来空药瓶，服药时间明确在 3 小时前", mode: "问诊", t: 0 },
      { name: "6-24 小时后症状明显减轻（假愈期）", mode: "视诊", t: 240 },
      { name: "右上腹疼痛、皮肤巩膜黄染", mode: "视诊", t: 480 },
      { name: "烦躁、扑翼样震颤（肝性脑病）", mode: "视诊", t: 660 }
    ],
    stages: [
      { t: 0, label: "早期/无症状期", changes: { emesis: 25, pain: 15 }, log: "药物经 CYP2E1 生成 NAPQI，谷胱甘肽储备开始耗竭" },
      { t: 240, label: "肝细胞坏死启动（假愈期）", changes: { hepatic: -18, inr: 0.4, emesis: -20 }, log: "症状「好转」是危险信号：转氨酶开始升高，肝细胞坏死进行中" },
      { t: 540, label: "急性肝衰竭", changes: { hepatic: -35, inr: 1.2, gcs: -4, glucose: -1.8, renal: -20 }, log: "凝血障碍、低血糖、肝性脑病，符合急性肝衰竭" },
      { t: 720, label: "肝性脑病/脑水肿", changes: { gcs: -4, icp: 14, rhythm: "asystole" }, lethal: true, log: "脑水肿与脑疝致死亡" }
    ],
    treat: [
      { type: "drug", id: "acetylcysteine", need: true, note: "NAC 21 小时方案：150mg/kg 负荷后持续泵入，越早越好" },
      { type: "drug", id: "activated_charcoal", need: false, note: "服毒 2 小时内可给活性炭 50g，超过 4 小时获益有限" },
      { type: "drug", id: "lactulose", need: false, note: "肝性脑病时降血氨，保持每日 2-3 次软便" },
      { type: "drug", id: "vitamin_k", need: false, note: "肝衰竭致凝血因子合成障碍时补充" },
      { type: "drug", id: "dextrose_50", need: false, note: "低血糖时静推高渗糖，维持血糖 >4mmol/L" }
    ],
    harm: [
      { id: "acetaminophen", msg: "再次给予对乙酰氨基酚「退热」，肝毒性叠加" },
      { id: "phenytoin", msg: "诱导 CYP2E1 并消耗谷胱甘肽，增加毒性代谢产物" },
      { id: "ibuprofen", msg: "肝衰竭合并肾损伤时使用非甾体药，加重肝肾损害" }
    ],
    lethalAfter: 900,
    needSurgery: false,
    note: "「早期无症状」是最容易被放过的地方；4 小时血药浓度对照 Rumack-Matthew 曲线决定是否用 NAC，超过 8 小时仍应给药（模拟时间轴已压缩）"
  },
  {
    id: "tca_overdose",
    name: "三环类抗抑郁药过量",
    category: "poison",
    dept: "急诊科",
    site: "心脏 · 钠通道 / 中枢",
    triage: 5,
    hidden: false,
    ecgRegion: "diffuse",
    vitals: { hr: 45, sbp: -30, dbp: -18, spo2: -7, gcs: -5, temp: 0.3, qt: 120, avconduction: -40, arrhythmia: 35, seizure: 15, pupil: 1.2, rr: -2, urine: -20, ph: -0.12, lactate: 1.8, glucose: 1.6, k: -0.8 },
    labs: { ph: 7.28, k: 3.4, glucose: 7.2, lactate: 2.8, hco3: 18, creatinine: 95, alt: 60 },
    exam: {
      ecg: "窦性心动过速 121 次/分，QRS 增宽至 0.16s，V1 呈 qR 型，电轴右偏，QT 520ms",
      us: "心腔不大，下腔静脉充盈良好",
      lab: "血丙咪嗪浓度 850ng/mL（>500 为重度中毒）"
    },
    symptoms: [
      { name: "吞服阿米替林 25mg×30 片，2 小时后被发现", mode: "问诊", t: 0 },
      { name: "嗜睡、言语含糊但能被唤醒", mode: "视诊", t: 0 },
      { name: "皮肤干燥潮红、瞳孔散大 4.2mm、口腔干", mode: "视诊", t: 0 },
      { name: "口角及四肢小抽动，随后全身抽搐", mode: "视诊", t: 120 },
      { name: "心悸、血压 88/56mmHg", mode: "监护", t: 60 },
      { name: "膀胱充盈、肠鸣音消失（抗胆碱能）", mode: "触诊", t: 180 }
    ],
    stages: [
      { t: 0, label: "抗胆碱能毒性期", changes: { hr: 20, pupil: 1.0, urine: -20, pain: 10 }, log: "M 受体阻断：口干、瞳孔散大、尿潴留、心动过速" },
      { t: 180, label: "钠通道阻滞/QRS 增宽", changes: { qt: 80, avconduction: -30, arrhythmia: 30, sbp: -15, seizure: 25, gcs: -3 }, log: "快钠通道阻滞，QRS 增宽、心肌收缩抑制，抽搐加重酸中毒" },
      { t: 420, label: "室性心律失常", changes: { rhythm: "vt", qt: 40, sbp: -20, gcs: -2 }, lethal: true, log: "宽 QRS 心动过速蜕变为室颤，循环崩溃" }
    ],
    treat: [
      { type: "drug", id: "sodium_bicarbonate", need: true, note: "1-2mEq/kg 静推，目标 pH 7.45-7.55、QRS<120ms" },
      { type: "drug", id: "magnesium_sulfate", need: true, note: "QT 延长/尖端扭转型室速时 2g 静滴" },
      { type: "drug", id: "diazepam", need: false, note: "控制抽搐，减少酸中毒对心律失常的促进作用" },
      { type: "drug", id: "norepinephrine", need: false, note: "补液与碱化后仍低血压时维持灌注" },
      { type: "drug", id: "lipid_emulsion", need: false, note: "重度脂溶性药物中毒可考虑脂肪救援" }
    ],
    harm: [
      { id: "flumazenil", msg: "TCA 混合过量时使用氟马西尼，可诱发难治性抽搐" },
      { id: "phenytoin", msg: "同属钠通道阻滞剂，加重 QRS 增宽与低血压" },
      { id: "procainamide", msg: "Ia 类抗心律失常药在 TCA 中毒时属禁忌，可致心脏停搏" }
    ],
    lethalAfter: 600,
    needSurgery: false,
    note: "TCA 中毒的核心是碳酸氢钠（钠负荷 + 碱化），QRS>100ms 即用；禁用氟马西尼、Ia/Ic 类抗心律失常药"
  },
  {
    id: "paraquat_poisoning",
    name: "百草枯中毒",
    category: "poison",
    dept: "急诊科",
    site: "肺 · 肺泡上皮 / 肾小管",
    triage: 5,
    hidden: false,
    ecgRegion: "diffuse",
    vitals: { hr: 16, sbp: -10, spo2: -13, rr: 12, pao2: -28, gcs: -1, pain: 38, emesis: 40, ph: -0.04, lactate: 1.4, k: -0.6 },
    labs: { creatinine: 190, alt: 85, bilirubin: 20, amylase: 70, k: 3.6, ph: 7.36, pco2: 34, lactate: 2.4, hco3: 20 },
    exam: {
      xray: "双肺弥漫磨玻璃影与网格影，以中下肺野为著，心影不大",
      ct: "双肺间质增厚伴牵拉性支气管扩张，未见肺栓塞",
      us: "双肾回声增强，肾实质增厚",
      lab: "尿百草枯定性试验（+），血药浓度 1.2µg/mL"
    },
    symptoms: [
      { name: "口服 20% 百草枯水剂约 30ml，6 小时后就诊", mode: "问诊", t: 0 },
      { name: "口腔、舌及咽部黏膜糜烂、溃疡", mode: "视诊", t: 0 },
      { name: "恶心呕吐、上腹烧灼样疼痛", mode: "问诊", t: 0 },
      { name: "进行性气促，活动后加重", mode: "问诊", t: 120 },
      { name: "口唇发绀，鼻导管吸氧下 SpO₂ 84%", mode: "视诊", t: 300 },
      { name: "尿量减少至 20ml/h", mode: "监护", t: 420 }
    ],
    stages: [
      { t: 0, label: "腐蚀性损伤期", changes: { emesis: 30, spo2: -6, pain: 30, volume: -400 }, log: "百草枯对黏膜的腐蚀性损伤，伴呕吐与容量丢失" },
      { t: 240, label: "肺泡炎/低氧期", changes: { spo2: -12, pao2: -22, rr: 8, paco2: -4 }, log: "毒物在肺泡 II 型细胞蓄积，产生氧自由基，肺泡炎与低氧" },
      { t: 540, label: "肺纤维化/肾衰期", changes: { spo2: -12, renal: -40, urine: -40, ph: -0.08 }, log: "进行性肺纤维化，同时出现急性肾损伤" },
      { t: 720, label: "终末期", changes: { rhythm: "asystole", spo2: -12, pao2: -18 }, lethal: true, log: "顽固性低氧血症致呼吸循环衰竭" }
    ],
    treat: [
      { type: "drug", id: "activated_charcoal", need: true, note: "活性炭 50g 口服/鼻饲，1 小时内清除胃内毒物" },
      { type: "drug", id: "methylprednisolone", need: true, note: "早期大剂量激素（1g/d×3d）联合免疫抑制，抑制肺泡炎" },
      { type: "drug", id: "silibinin", need: true, note: "水飞蓟宾抗氧化、抑制脂质过氧化，减轻肺与肾损伤" },
      { type: "drug", id: "acetylcysteine", need: false, note: "抗氧化：NAC 清除氧自由基，减轻肺损伤" }
    ],
    harm: [
      { id: "ibuprofen", msg: "非甾体药加重急性肾损伤，且不缓解肺纤维化" },
      { id: "salbutamol", msg: "雾化β激动剂不改善百草枯肺损伤，反致低钾与心动过速" },
      { id: "pralidoxime", msg: "误当有机磷农药中毒使用胆碱酯酶复能剂，对百草枯无效且耽误清除毒物" }
    ],
    lethalAfter: 900,
    needSurgery: false,
    note: "百草枯无特效解毒剂：早期活性炭 50g + 血液灌流清除（6 小时内最有效），大剂量激素 + 水飞蓟宾抑制肺泡炎，限制吸氧浓度（SpO₂ 88-92% 即可），避免高浓度氧加重肺纤维化"
  },
  {
    id: "snake_bite",
    name: "毒蛇咬伤（蝮蛇）",
    category: "poison",
    dept: "急诊科",
    site: "四肢 · 右小腿咬伤",
    triage: 4,
    hidden: false,
    vitals: { hr: 26, sbp: -24, dbp: -14, spo2: -4, hb: -2.8, plt: -144, inr: 0.9, clotting: -30, pain: 62, urine: -20, lactate: 2.2, k: -0.2 },
    labs: { hb: 11.2, plt: 76, inr: 1.9, d_dimer: 8.6, k: 4.0, creatinine: 130, lactate: 3.2, alt: 60, ck: 3200 },
    exam: {
      ecg: "窦性心动过速 102 次/分，未见 ST 抬高",
      us: "右小腿皮下弥漫肿胀，深静脉未见血栓",
      lab: "凝血酶原时间 22s，纤维蛋白原 0.9g/L，3P 试验阳性，D-二聚体 8.6mg/L",
      xray: "右小腿软组织明显肿胀，未见骨折"
    },
    symptoms: [
      { name: "田间劳动时右踝被蝮蛇咬伤 2 小时", mode: "问诊", t: 0 },
      { name: "咬伤处两个毒牙痕，周围瘀斑与血疱", mode: "视诊", t: 0 },
      { name: "右小腿肿胀进行性上升至膝上 10cm", mode: "视诊", t: 120 },
      { name: "牙龈出血、静脉穿刺点渗血不止", mode: "视诊", t: 180 },
      { name: "头晕、恶心、心悸", mode: "问诊", t: 240 },
      { name: "尿色变深呈浓茶色（血红蛋白尿）", mode: "视诊", t: 300 }
    ],
    stages: [
      { t: 0, label: "局部毒性期", changes: { pain: 50, hb: -1.0, volume: -300 }, log: "蛇毒金属蛋白酶破坏血管壁，局部肿胀渗血" },
      { t: 240, label: "凝血障碍/DIC", changes: { plt: -60, inr: 0.6, clotting: -30, hb: -1.5, sbp: -12 }, log: "蛇毒消耗凝血因子与血小板，出现类 DIC 表现" },
      { t: 540, label: "溶血/休克期", changes: { hb: -2.0, sbp: -18, urine: -30, renal: -30, k: 0.8, plt: -40 }, log: "溶血、横纹肌溶解与失血共同导致休克与急性肾损伤" },
      { t: 720, label: "终末期", changes: { rhythm: "pea", sbp: -20, hb: -1.5 }, lethal: true, log: "不可控出血与循环衰竭致死" }
    ],
    treat: [
      { type: "drug", id: "snake_antivenom", need: true, note: "抗蝮蛇毒血清 6000U + 生理盐水静滴，越早越好（皮试后）" },
      { type: "drug", id: "tranexamic_acid", need: true, note: "存在纤溶亢进时 1g 静推，减少出血" },
      { type: "drug", id: "fibrinogen", need: false, note: "纤维蛋白原 <1.0g/L 时补充人纤维蛋白原 2-4g" },
      { type: "drug", id: "cryoprecipitate", need: false, note: "冷沉淀补充纤维蛋白原与 VIII 因子" },
      { type: "drug", id: "ceftriaxone", need: false, note: "咬伤创面污染，预防破伤风与软组织感染" }
    ],
    harm: [
      { id: "heparin", msg: "已存在蛇毒所致凝血障碍，抗凝会导致致命性出血" },
      { id: "aspirin", msg: "抗血小板药加重咬伤部位与内脏出血" },
      { id: "ibuprofen", msg: "非甾体药抑制血小板并加重肾损伤" }
    ],
    lethalAfter: 900,
    needSurgery: false,
    note: "抗蝮蛇毒血清 6000U 越早越好（皮试后静滴），是唯一能阻止毒液继续损伤的措施；监测 PT/纤维蛋白原/血小板；禁用抗凝、抗血小板与切开排毒"
  },
  {
    id: "methemoglobinemia",
    name: "亚硝酸盐中毒 / 高铁血红蛋白血症",
    category: "poison",
    dept: "急诊科",
    site: "血液 · 血红蛋白氧化",
    triage: 5,
    hidden: false,
    ecgRegion: "diffuse",
    vitals: { hr: 24, sbp: -10, spo2: -15, gcs: -3, rr: 8, temp: -0.2, brain: -10, hb: -0.8, lactate: 1.2 },
    labs: { ph: 7.38, pco2: 36, hco3: 22, lactate: 2.2, hb: 13.2, wbc: 9.0, k: 4.1, creatinine: 92 },
    exam: {
      ecg: "窦性心动过速 104 次/分，未见 ST-T 改变",
      us: "心腔充盈良好，下腔静脉无塌陷",
      lab: "高铁血红蛋白 38%，动脉血呈巧克力棕色；PaO₂ 95mmHg 而 SpO₂ 88%，吸氧不改善"
    },
    symptoms: [
      { name: "食用腌制 3 天的咸菜后 1 小时出现头晕乏力", mode: "问诊", t: 0 },
      { name: "口唇、指端明显发绀，吸氧后无改善", mode: "视诊", t: 0 },
      { name: "心悸、活动后气促", mode: "问诊", t: 0 },
      { name: "抽血时发现血液呈巧克力棕色", mode: "视诊", t: 60 },
      { name: "意识模糊、反应迟钝", mode: "视诊", t: 180 },
      { name: "同餐 3 人出现类似症状（群体发病）", mode: "问诊", t: 60 }
    ],
    stages: [
      { t: 0, label: "高铁血红蛋白 30% 期", changes: { spo2: -10, hr: 15, brain: -8 }, log: "Fe²⁺ 被氧化为 Fe³⁺，失去携氧能力，发绀与低氧不成比例" },
      { t: 240, label: "缺氧加重期", changes: { spo2: -8, gcs: -3, brain: -12, lactate: 1.5, sbp: -8 }, log: "高铁血红蛋白 >50% 时组织缺氧迅速加重，意识下降" },
      { t: 540, label: "休克/昏迷", changes: { rhythm: "asystole", sbp: -15, gcs: -2 }, lethal: true, log: "严重组织缺氧与循环衰竭致心脏停搏" }
    ],
    treat: [
      { type: "drug", id: "methylene_blue", need: true, note: "1-2mg/kg 缓慢静推（1% 溶液），最大 7mg/kg" },
      { type: "drug", id: "sodium_bicarbonate", need: false, note: "严重代酸时使用" },
      { type: "drug", id: "saline", need: false, note: "补液维持循环，促进毒物排泄" },
      { type: "drug", id: "dexamethasone", need: false, note: "严重溶血时辅助抗炎（不作常规）" }
    ],
    harm: [
      { id: "sodium_nitrite", msg: "亚硝酸盐本身是氧化剂，会进一步升高高铁血红蛋白，绝对禁用" },
      { id: "iodinated_contrast", msg: "含碘造影剂具氧化性，加重高铁血红蛋白血症" },
      { id: "nitroglycerin", msg: "血管扩张加重低氧所致的反射性心动过速，且对携氧障碍无效" }
    ],
    lethalAfter: 720,
    needSurgery: false,
    note: "「发绀明显但吸氧不改善、SpO₂ 与 PaO₂ 不匹配、血液巧克力色」三联征；亚甲蓝 1-2mg/kg；G6PD 缺乏者亚甲蓝无效且可能溶血"
  },
  {
    id: "mushroom_poisoning",
    name: "毒蕈中毒（鹅膏菌）",
    category: "poison",
    dept: "急诊科",
    site: "肝脏 · 鹅膏毒肽",
    triage: 5,
    hidden: false,
    ecgRegion: "diffuse",
    vitals: { hr: 18, sbp: -12, spo2: -3, gcs: -2, temp: -0.2, pain: 42, emesis: 45, hepatic: -18, volume: -600, ph: -0.06, lactate: 2.0, glucose: -2.2, k: -0.6 },
    labs: { alt: 850, bilirubin: 68, inr: 2.4, glucose: 3.4, ammonia: 120, creatinine: 150, k: 3.6, ph: 7.34, lactate: 3.0 },
    exam: {
      ecg: "窦性心动过速 94 次/分，QT 轻度延长",
      us: "肝实质回声增粗不均，肝体积偏小，腹腔少量积液",
      ct: "肝密度不均、体积缩小，未见胆道梗阻",
      lab: "ALT 850U/L，INR 2.4，血氨 120µmol/L，凝血酶原时间 28s"
    },
    symptoms: [
      { name: "食用自采野生「白毒伞」后 8 小时发病（潜伏期长）", mode: "问诊", t: 0 },
      { name: "剧烈呕吐、水样腹泻（霍乱样）", mode: "视诊", t: 0 },
      { name: "6-12 小时后呕吐腹泻缓解（假愈期）", mode: "问诊", t: 180 },
      { name: "皮肤巩膜黄染、尿色深黄", mode: "视诊", t: 300 },
      { name: "烦躁、双手扑翼样震颤", mode: "视诊", t: 420 },
      { name: "腹胀、尿量减少", mode: "监护", t: 540 }
    ],
    stages: [
      { t: 0, label: "胃肠期", changes: { emesis: 40, volume: -600, k: -0.6, sbp: -8 }, log: "鹅膏毒肽初期仅表现为胃肠炎，易被误判为普通食物中毒" },
      { t: 240, label: "假愈/肝损启动期", changes: { hepatic: -22, inr: 0.5, emesis: -30 }, log: "症状缓解而转氨酶上升，肝细胞凋亡正在进行" },
      { t: 540, label: "急性肝衰竭", changes: { hepatic: -38, inr: 1.2, gcs: -4, glucose: -1.8, ammonia: 60 }, log: "凝血障碍、低血糖、高血氨与肝性脑病" },
      { t: 720, label: "肝性脑病/脑水肿", changes: { gcs: -4, icp: 14, rhythm: "asystole" }, lethal: true, log: "脑水肿与多器官衰竭致死亡" }
    ],
    treat: [
      { type: "drug", id: "acetylcysteine", need: true, note: "NAC 抗氧化、补充谷胱甘肽，疗程 72 小时以上" },
      { type: "drug", id: "silibinin", need: true, note: "水飞蓟宾 20-50mg/kg/d 静滴，阻断鹅膏毒肽入肝" },
      { type: "drug", id: "lactulose", need: false, note: "肝性脑病时乳果糖 30ml 口服/鼻饲，降血氨" },
      { type: "drug", id: "vitamin_k", need: false, note: "肝衰竭致凝血因子合成障碍时补充" },
      { type: "drug", id: "dextrose_50", need: false, note: "低血糖时静推，维持血糖稳定" }
    ],
    harm: [
      { id: "acetaminophen", msg: "肝功能已严重受损，使用对乙酰氨基酚进一步加重肝坏死" },
      { id: "diazepam", msg: "肝衰竭时苯二氮䓬类蓄积，诱发或加重肝性脑病" },
      { id: "haloperidol", msg: "肝性脑病躁动时使用抗精神病药，延长 QT 并加深意识障碍" }
    ],
    lethalAfter: 900,
    needSurgery: false,
    note: "「潜伏 6-12 小时 + 假愈期 + 迟发肝衰」是鹅膏菌中毒经典三阶段；水飞蓟宾 + NAC 是内科治疗核心，重症需肝移植（模拟时间轴已压缩）"
  },
  {
    id: "digoxin_toxicity",
    name: "地高辛中毒",
    category: "poison",
    dept: "急诊科",
    site: "心脏 · 房室结 / 心肌",
    triage: 5,
    hidden: false,
    ecgRegion: "diffuse",
    vitals: { hr: -40, sbp: -16, spo2: -3, gcs: -2, k: 1.2, avconduction: -45, arrhythmia: 30, emesis: 40, pain: 22, urine: -20, ph: -0.04, lactate: 1.0, plt: -40 },
    labs: { k: 5.4, creatinine: 210, ph: 7.36, lactate: 2.0, inr: 1.1, alt: 55, plt: 180 },
    exam: {
      ecg: "三度房室传导阻滞，室率 36 次/分，交界性逸搏，ST 段呈鱼钩样下移",
      us: "心腔不大，室壁运动尚可，未见心包积液",
      lab: "地高辛血药浓度 4.8ng/mL（治疗窗 0.5-2.0ng/mL），血钾 5.4mmol/L"
    },
    symptoms: [
      { name: "因失眠一次吞服地高辛 0.25mg×20 片", mode: "问诊", t: 0 },
      { name: "恶心、呕吐、食欲明显下降", mode: "问诊", t: 0 },
      { name: "视物发黄、看灯光有黄色光晕（黄视）", mode: "视诊", t: 60 },
      { name: "头晕、乏力，心率 36 次/分", mode: "监护", t: 0 },
      { name: "意识模糊、嗜睡", mode: "视诊", t: 300 },
      { name: "短暂意识丧失（阿斯综合征）", mode: "视诊", t: 420 }
    ],
    stages: [
      { t: 0, label: "迷走兴奋/高钾期", changes: { emesis: 30, k: 1.0, hr: -20, avconduction: -30 }, log: "洋地黄抑制 Na⁺-K⁺-ATP 酶，血钾升高、迷走张力增强" },
      { t: 240, label: "缓慢性心律失常期", changes: { hr: -15, avconduction: -20, gcs: -3, sbp: -12, urine: -20 }, log: "房室传导阻滞加重，室率下降致脑与肾灌注不足" },
      { t: 540, label: "室性心律失常", changes: { rhythm: "vt", k: 0.8, qt: 40 }, lethal: true, log: "心肌细胞内钙超载，出现双向性室速/室颤" }
    ],
    treat: [
      { type: "drug", id: "digoxin_fab", need: true, note: "地高辛抗体片段：按血药浓度×体重给药，中毒的特效解毒剂" },
      { type: "drug", id: "atropine", need: true, note: "0.5mg 静推，纠正症状性心动过缓（每 3-5 分钟可重复）" },
      { type: "drug", id: "lidocaine", need: false, note: "室性心律失常时 1-1.5mg/kg 静推" },
      { type: "drug", id: "magnesium_sulfate", need: false, note: "合并低镁或尖端扭转型室速时 2g 静滴" },
      { type: "drug", id: "saline", need: false, note: "补液改善肾灌注，促进地高辛排泄" }
    ],
    harm: [
      { id: "calcium_gluconate", msg: "洋地黄中毒时静推钙剂可致「石样心」，心脏停搏于收缩期" },
      { id: "furosemide", msg: "利尿导致低钾低镁，显著加重洋地黄毒性" },
      { id: "succinylcholine", msg: "高钾状态下使用琥珀胆碱，可诱发致命性心律失常" }
    ],
    lethalAfter: 720,
    needSurgery: false,
    note: "地高辛抗体片段（Fab）是特效解毒剂，按血药浓度×体重计算剂量；绝对禁用钙剂；纠正低钾低镁；严重者血液净化"
  },

  /* ================= 四、环境 / 理化（2） ================= */
  {
    id: "severe_hypothermia",
    name: "重度低体温",
    category: "environment",
    dept: "急诊科",
    site: "全身 · 核心体温 32.5℃",
    triage: 5,
    hidden: false,
    ecgRegion: "diffuse",
    vitals: { hr: -6, sbp: -26, dbp: -16, spo2: -9, rr: -7, gcs: -7, temp: -4.3, avconduction: -30, k: 0.8, glucose: -2.2, clotting: -25, ph: -0.12, lactate: 2.0, hb: 1.2 },
    labs: { k: 5.0, glucose: 3.4, ph: 7.28, lactate: 3.0, hco3: 20, creatinine: 140, inr: 1.6, amylase: 90, hb: 15.2 },
    exam: {
      ecg: "心率 70 次/分，可见 Osborne（J）波，QT 延长至 520ms，肌肉震颤伪差",
      us: "心腔充盈，未见心包积液，下腔静脉充盈",
      ct: "头颅未见出血或梗死",
      lab: "核心体温 32.5℃，凝血酶原时间延长而血小板计数正常（低温性凝血障碍）"
    },
    symptoms: [
      { name: "雪地倒卧约 6 小时后被路人发现", mode: "问诊", t: 0 },
      { name: "皮肤冰冷苍白、质地僵硬", mode: "触诊", t: 0 },
      { name: "意识模糊、言语不清、动作迟缓", mode: "视诊", t: 0 },
      { name: "呼吸浅慢，几乎观察不到胸廓起伏", mode: "视诊", t: 60 },
      { name: "搬运时突发室颤（监护仪报警）", mode: "监护", t: 180 },
      { name: "无尿、肠鸣音消失", mode: "监护", t: 300 }
    ],
    stages: [
      { t: 0, label: "低体温进展期（32℃）", changes: { hr: -8, temp: -0.5, avconduction: -20, rr: -6, gcs: -3 }, log: "体温调节丧失，意识模糊，心率与呼吸进行性减慢" },
      { t: 240, label: "重度低体温期（31℃）", changes: { temp: -0.4, hr: -6, gcs: -4, sbp: -12, avconduction: -10, clotting: -20 }, log: "心肌对药物与除颤均不敏感，凝血酶活性下降" },
      { t: 540, label: "室颤/停搏", changes: { rhythm: "vf", k: 0.6, temp: -0.3 }, lethal: true, log: "低温心肌易激，室颤难以转复，循环崩溃" }
    ],
    treat: [
      { type: "drug", id: "saline", need: true, note: "加温至 40-42℃ 的生理盐水静脉输注；同时立即在「护理处置」行保温复温（保温毯 + 加温湿化氧）" },
      { type: "nurse", id: "warm", need: true, note: "保温毯 + 加温湿化氧；核心体温每 10 分钟复测一次" },
      { type: "drug", id: "magnesium_sulfate", need: true, note: "复温期心律失常与寒战，补镁稳定心肌膜" },
      { type: "drug", id: "dextrose_50", need: false, note: "低血糖时静推（低温下胰岛素敏感性下降）" },
      { type: "drug", id: "sodium_bicarbonate", need: false, note: "仅在严重代酸且复温后仍不纠正时谨慎使用" }
    ],
    harm: [
      { id: "succinylcholine", msg: "低体温时琥珀胆碱可诱发室颤与高钾，属禁忌" },
      { id: "atropine", msg: "30℃ 以下心肌对阿托品几乎无反应，刺激反而可诱发室颤" },
      { id: "furosemide", msg: "低温已有利尿与容量不足，再利尿加重低灌注" }
    ],
    lethalAfter: 720,
    needSurgery: false,
    note: "「不是死人，是冷人」：必须同时做两件事——加温输液 + 护理处置里的「保温复温」，否则体温持续下降会直接把心率拖到停搏；复温后仍昏迷者再判断神经预后，搬动轻柔"
  },
  {
    id: "high_altitude_pulmonary_edema",
    name: "高原肺水肿",
    category: "environment",
    dept: "急诊科",
    site: "肺 · 肺泡（高原性）",
    triage: 5,
    hidden: false,
    ecgRegion: "right",
    vitals: { hr: 34, sbp: 16, spo2: -20, rr: 15, pao2: -32, temp: 0.4, secretions: 48, paco2: -6, ph: 0.03, lactate: 1.6, hb: 3.8, wbc: 5.8 },
    labs: { hb: 17.8, wbc: 12.8, lactate: 2.6, ph: 7.44, pco2: 30, creatinine: 105, bnp: 180, k: 4.0 },
    exam: {
      xray: "双肺门周围斑片状渗出，右肺中叶为著，心影不大，肺动脉段突出",
      ct: "双肺弥漫磨玻璃影，呈蝶翼样分布，未见肺栓塞",
      us: "右心室轻度扩大，估测肺动脉压 55mmHg，左室收缩功能正常",
      ecg: "窦性心动过速 110 次/分，V1 呈 rSr'，电轴右偏，右室高电压"
    },
    symptoms: [
      { name: "快速登顶至 4500m 后第 2 天出现气促", mode: "问诊", t: 0 },
      { name: "干咳后咳出粉红色泡沫痰", mode: "视诊", t: 60 },
      { name: "夜间不能平卧，端坐呼吸", mode: "问诊", t: 120 },
      { name: "双肺中下野可闻及湿啰音", mode: "听诊", t: 60 },
      { name: "口唇发绀，SpO₂ 76%（吸氧后 88%）", mode: "监护", t: 0 },
      { name: "意识淡漠、走路不稳（合并高原脑水肿）", mode: "视诊", t: 300 }
    ],
    stages: [
      { t: 0, label: "高原肺水肿期", changes: { spo2: -12, pao2: -22, rr: 10, secretions: 35 }, log: "缺氧性肺血管收缩不均，毛细血管压力升高，液体渗入肺泡" },
      { t: 300, label: "低氧加重/脑水肿", changes: { spo2: -10, pao2: -18, gcs: -4, brain: -20, sbp: -10, icp: 10 }, log: "顽固低氧合并高原脑水肿，意识与共济失调加重" },
      { t: 600, label: "终末期", changes: { rhythm: "asystole", spo2: -8, gcs: -3 }, lethal: true, log: "严重低氧致心跳停止" }
    ],
    treat: [
      { type: "drug", id: "nifedipine", need: true, note: "硝苯地平 10-20mg 口服/舌下，降低肺动脉压" },
      { type: "drug", id: "dexamethasone", need: true, note: "地塞米松 8mg 静推，减轻脑水肿与肺毛细血管渗漏" },
      { type: "drug", id: "furosemide", need: false, note: "仅在明确容量过负荷时小剂量使用" },
      { type: "drug", id: "saline", need: false, note: "谨慎补液，HAPE 本质是肺水多而非血容量少" }
    ],
    harm: [
      { id: "morphine", msg: "抑制呼吸中枢，低氧与 CO₂ 蓄积加重" },
      { id: "nitroglycerin", msg: "右心前负荷依赖，扩血管使肺灌注与血压进一步下降" },
      { id: "ibuprofen", msg: "非甾体药加重肾损伤并掩盖高原脑水肿症状" }
    ],
    lethalAfter: 780,
    needSurgery: false,
    note: "最有效的治疗是「下降海拔 + 氧疗」；硝苯地平降肺动脉压、地塞米松减轻脑水肿；禁止单纯大量利尿与镇静"
  },

  /* ================= 五、妇产（2） ================= */
  {
    id: "eclampsia",
    name: "子痫",
    category: "obstetric",
    dept: "妇产科",
    site: "全身 · 妊娠期高血压（脑/胎盘）",
    triage: 5,
    hidden: false,
    ecgRegion: "diffuse",
    vitals: { hr: 24, sbp: 58, dbp: 38, spo2: -6, gcs: -4, seizure: 40, pain: 45, rr: 6, temp: 0.3, urine: -30, icp: 8, ph: -0.02, lactate: 1.8, plt: -132, hb: -3.2, glucose: 0.8 },
    labs: { alt: 120, plt: 88, creatinine: 130, inr: 1.1, hb: 10.8, lactate: 2.8, ph: 7.38, glucose: 6.4, bilirubin: 18 },
    exam: {
      ecg: "窦性心动过速 100 次/分，未见 ST 改变",
      us: "胎儿心率 150 次/分，胎盘未见早剥征象，双侧肾动脉阻力升高",
      ct: "头颅未见出血（子痫可逆性后部白质脑病可能，建议复查）",
      lab: "尿蛋白 +++，24 小时尿蛋白 4.2g，ALT 120U/L，血小板 88×10⁹/L"
    },
    symptoms: [
      { name: "孕 34 周，突发全身强直-阵挛抽搐", mode: "视诊", t: 0 },
      { name: "抽搐后面部青紫、意识未恢复", mode: "视诊", t: 60 },
      { name: "剧烈头痛、视物模糊、眼前闪光", mode: "问诊", t: 0 },
      { name: "血压 186/112mmHg", mode: "监护", t: 0 },
      { name: "双下肢及颜面凹陷性水肿", mode: "视诊", t: 0 },
      { name: "右上腹疼痛、恶心（肝被膜牵张）", mode: "问诊", t: 180 }
    ],
    stages: [
      { t: 0, label: "抽搐期", changes: { seizure: 35, spo2: -6, gcs: -4, sbp: 20 }, log: "脑血管痉挛与脑水肿致抽搐，抽搐本身加重低氧" },
      { t: 180, label: "高血压脑病期", changes: { sbp: 15, gcs: -4, icp: 10, seizure: 15, pupil: 1.0 }, log: "脑自动调节失效，出现可逆性后部白质脑病" },
      { t: 480, label: "脑出血/胎盘早剥", changes: { plt: -40, inr: 0.8, sbp: -20, rhythm: "asystole", icp: 12 }, lethal: true, log: "颅内出血合并胎盘早剥、DIC，母胎死亡" }
    ],
    treat: [
      { type: "drug", id: "magnesium_sulfate", need: true, note: "硫酸镁 4-6g 负荷后 1-2g/h 维持，预防与控制抽搐" },
      { type: "drug", id: "hydralazine", need: true, note: "肼屈嗪 5-10mg 静推，目标血压 140-150/90-100mmHg" },
      { type: "drug", id: "labetalol", need: false, note: "血压仍高时拉贝洛尔 20mg 静推交替使用" },
      { type: "drug", id: "nicardipine", need: false, note: "血压难以控制时静脉泵入，注意反射性心动过速" },
      { type: "drug", id: "dexamethasone", need: false, note: "孕 34 周促胎肺成熟（地塞米松 6mg q12h×4）" }
    ],
    harm: [
      { id: "methylergometrine", msg: "麦角新碱有升压作用，子痫/高血压患者禁用，可诱发脑出血" },
      { id: "ibuprofen", msg: "非甾体药升高血压、影响肾功能与血小板，子痫前期禁用" },
      { id: "furosemide", msg: "子痫患者多为血管内脱水，盲目利尿加重胎盘灌注不足" }
    ],
    lethalAfter: 660,
    needSurgery: false,
    note: "子痫三大处理：硫酸镁防抽搐、肼屈嗪/拉贝洛尔降压、终止妊娠（根本治疗）；警惕 HELLP 与胎盘早剥"
  },
  {
    id: "amniotic_fluid_embolism",
    name: "羊水栓塞（妊娠分娩期）",
    category: "obstetric",
    dept: "妇产科",
    site: "全身 · 肺循环 / 凝血系统",
    triage: 5,
    hidden: false,
    ecgRegion: "right",
    vitals: { hr: 46, sbp: -58, dbp: -32, spo2: -24, gcs: -7, rr: 15, clotting: -45, plt: -154, hb: -4.8, temp: 0.4, urine: -40, contractility: -25, ph: -0.24, lactate: 5.2, inr: 1.6, k: 0.6 },
    labs: { hb: 9.2, plt: 66, inr: 2.6, d_dimer: 20.0, ph: 7.16, lactate: 6.2, hco3: 14, creatinine: 160, k: 4.8 },
    exam: {
      ecg: "窦性心动过速 122 次/分，S1Q3T3，V1-V3 T 波倒置，右心负荷表现",
      us: "右心室明显扩大，室间隔左移，下腔静脉充盈，子宫收缩差",
      xray: "双肺弥漫渗出，心影增大，肺动脉段突出",
      lab: "凝血酶原时间 26s，纤维蛋白原 0.6g/L，3P 试验阳性，D-二聚体 20mg/L"
    },
    symptoms: [
      { name: "顺产娩出胎儿后数分钟突发呼吸困难、发绀", mode: "视诊", t: 0 },
      { name: "抽搐、意识丧失", mode: "视诊", t: 30 },
      { name: "血压骤降至 62/35mmHg，脉搏细弱", mode: "监护", t: 0 },
      { name: "阴道持续流出不凝血", mode: "视诊", t: 120 },
      { name: "全身皮肤瘀斑、穿刺点渗血", mode: "视诊", t: 180 },
      { name: "新生儿窒息，Apgar 4 分", mode: "视诊", t: 0 }
    ],
    stages: [
      { t: 0, label: "肺动脉痉挛/右心衰期", changes: { spo2: -14, sbp: -28, contractility: -22, hr: 30 }, log: "羊水有形成分激活补体，肺血管痉挛，急性右心衰" },
      { t: 180, label: "DIC/产后出血期", changes: { clotting: -25, plt: -60, inr: 0.4, hb: -2.0, volume: -1200, sbp: -15, urine: -30 }, log: "凝血系统被激活后耗竭，出现难以控制的产后出血" },
      { t: 420, label: "休克/多器官衰竭", changes: { sbp: -18, gcs: -4, renal: -35, rhythm: "pea" }, lethal: true, log: "顽固性休克与 DIC 致循环崩溃" }
    ],
    treat: [
      { type: "drug", id: "epinephrine", need: true, note: "0.5-1mg 静推（按类过敏反应处理），必要时泵入" },
      { type: "drug", id: "norepinephrine", need: true, note: "泵入维持 MAP≥65mmHg，保证子宫与肾灌注" },
      { type: "drug", id: "tranexamic_acid", need: true, note: "1g 静推后 1g/h 维持，抑制纤溶亢进" },
      { type: "drug", id: "fibrinogen", need: false, note: "纤维蛋白原 <1.5g/L 时补充 2-4g" },
      { type: "drug", id: "cryoprecipitate", need: false, note: "补充纤维蛋白原与凝血因子，目标 Fib>1.5g/L" }
    ],
    harm: [
      { id: "heparin", msg: "DIC 已致凝血因子耗竭，抗凝会加重产后大出血" },
      { id: "aspirin", msg: "抗血小板药加重出血，产后子宫出血难以控制" },
      { id: "methylergometrine", msg: "强烈升压并增加右心负荷，休克状态下可致循环崩溃" }
    ],
    lethalAfter: 600,
    needSurgery: false,
    note: "羊水栓塞三联征：低氧、低血压、凝血障碍（DIC）；按类过敏反应立即肾上腺素；DIC 以补充凝血底物为主，慎用抗凝"
  },

  /* ================= 六、感染 / 其他（2） ================= */
  {
    id: "toxic_shock_syndrome",
    name: "中毒性休克综合征",
    category: "sepsis",
    dept: "感染科",
    site: "全身 · 金黄色葡萄球菌毒素",
    triage: 5,
    hidden: false,
    ecgRegion: "diffuse",
    vitals: { hr: 42, sbp: -48, dbp: -26, spo2: -10, temp: 2.2, gcs: -3, rr: 14, urine: -40, volume: -900, ph: -0.16, lactate: 4.4, plt: -128 },
    labs: { wbc: 18.6, plt: 92, creatinine: 190, alt: 90, bilirubin: 28, inr: 1.5, lactate: 5.4, ph: 7.24, hco3: 16, crp: 220 },
    exam: {
      ecg: "窦性心动过速 120 次/分，ST-T 改变（弥漫低平）",
      us: "下腔静脉塌陷，阴道内可见留置卫生棉条，子宫稍大",
      xray: "双肺未见实变，心影不大",
      ct: "盆腔少量积液，未见脓肿"
    },
    symptoms: [
      { name: "使用卫生棉条 3 天，突发高热 39.8℃", mode: "问诊", t: 0 },
      { name: "全身弥漫性猩红热样皮疹，压之褪色", mode: "视诊", t: 0 },
      { name: "头晕、乏力、全身肌肉酸痛", mode: "问诊", t: 0 },
      { name: "结膜充血、口唇干裂、草莓舌", mode: "视诊", t: 120 },
      { name: "血压 70/40mmHg、四肢湿冷", mode: "监护", t: 0 },
      { name: "呕吐、腹泻", mode: "问诊", t: 180 }
    ],
    stages: [
      { t: 0, label: "毒素介导的毛细血管渗漏", changes: { sbp: -30, temp: 1.0, hr: 26, volume: -600, spo2: -5 }, log: "TSST-1 作为超抗原激活大量 T 细胞，毛细血管渗漏、有效循环血量骤减" },
      { t: 240, label: "休克/器官低灌注", changes: { sbp: -18, urine: -35, lactate: 2.0, renal: -30, gcs: -4, plt: -40 }, log: "分布性休克合并急性肾损伤，意识改变" },
      { t: 540, label: "多器官衰竭", changes: { clotting: -25, hepatic: -30, rhythm: "asystole", sbp: -8 }, lethal: true, log: "难治性休克与多器官功能衰竭致死" }
    ],
    treat: [
      { type: "drug", id: "vancomycin", need: true, note: "万古霉素 15-20mg/kg，覆盖 MRSA" },
      { type: "drug", id: "clindamycin", need: true, note: "克林霉素 900mg 静滴，抑制 TSST-1 毒素合成" },
      { type: "drug", id: "saline", need: true, note: "大量晶体液复苏，首剂 30ml/kg，注意渗漏性水肿" },
      { type: "drug", id: "norepinephrine", need: false, note: "补液后仍低血压时泵入维持 MAP≥65mmHg" },
      { type: "drug", id: "meropenem", need: false, note: "合并坏死性筋膜炎或来源不明重症感染时联合广谱" }
    ],
    harm: [
      { id: "ibuprofen", msg: "非甾体药加重肾损伤并掩盖发热，延误感染灶清除" },
      { id: "furosemide", msg: "毛细血管渗漏期血管内血容量不足，利尿加重休克" },
      { id: "dexamethasone", msg: "大剂量激素在此类毒素介导的休克中不改善预后，反而增加感染风险" }
    ],
    lethalAfter: 720,
    needSurgery: false,
    note: "关键处置是「取出卫生棉条/清除感染灶」+ 克林霉素抑制毒素合成 + 万古霉素杀菌 + 大量补液；皮疹、发热、休克、多器官受累是诊断线索"
  },
  {
    id: "septic_encephalopathy",
    name: "脓毒症相关脑病",
    category: "sepsis",
    dept: "重症医学科",
    site: "脑 · 脓毒症代谢性损害",
    triage: 4,
    hidden: false,
    ecgRegion: "diffuse",
    vitals: { hr: 30, sbp: -20, spo2: -7, temp: 1.8, gcs: -5, rr: 9, icp: 6, brain: -22, urine: -25, ph: -0.08, lactate: 2.6, plt: -110 },
    labs: { wbc: 20.4, crp: 180, lactate: 3.6, creatinine: 170, bilirubin: 24, alt: 70, ammonia: 85, ph: 7.32, inr: 1.3, plt: 110 },
    exam: {
      ecg: "窦性心动过速 106 次/分，未见缺血性 ST 改变",
      ct: "头颅未见出血或大面积梗死，脑沟稍宽，符合年龄改变",
      us: "下腔静脉充盈，胆囊壁增厚（脓毒症相关）",
      lab: "血培养大肠埃希菌阳性；脑脊液白细胞 2×10⁶/L、蛋白正常，不支持颅内感染"
    },
    symptoms: [
      { name: "发热咳嗽 5 天后出现意识模糊、答非所问", mode: "问诊", t: 0 },
      { name: "注意力涣散、昼夜颠倒、夜间躁动", mode: "视诊", t: 0 },
      { name: "双手扑翼样震颤、肌束颤动", mode: "视诊", t: 120 },
      { name: "躁动不安、试图拔除输液管", mode: "视诊", t: 240 },
      { name: "嗜睡，仅对疼痛刺激有反应", mode: "视诊", t: 420 },
      { name: "尿量减少至 20ml/h", mode: "监护", t: 300 }
    ],
    stages: [
      { t: 0, label: "谵妄期", changes: { gcs: -3, brain: -12, temp: 1.2 }, log: "炎症介质与脑微循环障碍致注意力与定向力损害" },
      { t: 240, label: "意识障碍加深", changes: { gcs: -4, brain: -12, icp: 6, sbp: -10, ammonia: 30 }, log: "代谢紊乱（高氨、代酸、尿毒症）叠加，进入昏睡" },
      { t: 540, label: "昏迷/脑干受累", changes: { gcs: -4, brain: -8, rhythm: "asystole", sbp: -8 }, lethal: true, log: "深昏迷、脑干功能衰竭，循环崩溃" }
    ],
    treat: [
      { type: "drug", id: "meropenem", need: true, note: "美罗培南 1g q8h，覆盖革兰阴性菌（按肾功能调整）" },
      { type: "drug", id: "saline", need: false, note: "液体复苏改善脑与肾灌注" },
      { type: "drug", id: "levetiracetam", need: false, note: "合并抽搐或癫痫样放电时抗癫痫" },
      { type: "drug", id: "thiamine", need: false, note: "补充维生素 B1，排除 Wernicke 脑病" }
    ],
    harm: [
      { id: "midazolam", msg: "未处理感染与代谢紊乱即深镇静，掩盖意识评估、延长谵妄" },
      { id: "haloperidol", msg: "未纠正低氧与电解质紊乱时使用抗精神病药，延长 QT 并加重意识障碍" },
      { id: "furosemide", msg: "低灌注状态下利尿，脑与肾灌注进一步下降" }
    ],
    lethalAfter: 720,
    needSurgery: false,
    note: "脓毒症脑病是排除性诊断：先控制感染、纠正低氧/低灌注/电解质与血糖，再考虑镇静与抗精神病药；避免使用加重谵妄的药物"
  },

  /* ================= v2.10 新增：外伤 / 特殊暴露 / 环境 ================= */
  {
    id: "gunshot_wound",
    name: "枪伤（腹部贯通伤）",
    category: "trauma",
    dept: "急诊外科",
    site: "腹部 · 肝脏/肠管贯通伤",
    triage: 5,
    hidden: false,
    vitals: { sbp: -48, dbp: -30, hr: 40, spo2: -8, hb: -4.4, volume: -1600, pain: 68, gi: -25, lactate: 4.6, gcs: -2 },
    labs: { hb: 6.0, lactate: 5.6, inr: 1.5, plt: 120, ph: 7.26, k: 4.6 },
    exam: {
      us: "腹腔大量游离液体，FAST 阳性；肝右叶见贯穿伤道与血肿，弹片存留",
      xray: "腹内可见金属高密度影（弹片），膈下未见游离气体",
      ct: "肝右叶 Ⅵ 段贯通伤，腹腔积血约 1200 mL，肠管多处浆肌层裂伤"
    },
    symptoms: [
      { name: "右上腹枪伤入口、裤腰处出口，活动性渗血", mode: "视诊", t: 0 },
      { name: "面色苍白、四肢湿冷、脉搏细速", mode: "触诊", t: 0 },
      { name: "全腹压痛、肌紧张，肠鸣音消失", mode: "触诊", t: 120 },
      { name: "血压进行性下降，意识淡漠", mode: "监护", t: 300 }
    ],
    stages: [
      { t: 0, label: "失血性休克期", changes: { sbp: -18, hr: 14, hb: -1.0 }, log: "肝实质与肠系膜血管破裂，持续腹腔内出血" },
      { t: 420, label: "凝血障碍期", changes: { inr: 0.8, plt: -60, ph: -0.12, lactate: 2.0 }, log: "大量失血与晶体复苏导致稀释性凝血障碍（致死三联征）" },
      { t: 900, label: "失血性心脏停搏", changes: { rhythm: "asystole", gcs: -10 }, lethal: true, log: "失血超过代偿极限，心脏停搏" }
    ],
    treat: [
      { type: "surgery", proc: "exploration", site: "peritoneum", need: true, note: "急诊剖腹探查：找到出血点压迫/结扎，修补肝与肠管，清除积血" },
      { type: "nurse", id: "tourniquet", need: false, note: "伤口加压包扎，四肢出血可用止血带（记录时间）" },
      { type: "drug", id: "tranexamic_acid", need: false, note: "氨甲环酸 1g 静推，减少纤溶亢进" },
      { type: "drug", id: "saline", need: false, note: "限制性液体复苏，维持可触及脉搏即可，避免稀释性凝血障碍" }
    ],
    harm: [
      { id: "norepinephrine", msg: "未止血就大剂量升压，把血块冲开、出血更凶" },
      { id: "furosemide", msg: "失血性休克时利尿，前负荷进一步下降" }
    ],
    lethalAfter: 1200,
    needSurgery: true,
    note: "枪伤一律按「可能有内脏损伤」处理：先止血复苏，尽快剖腹探查；不要因为血压回升就放弃手术"
  },
  {
    id: "stab_wound",
    name: "刀刺伤（胸部穿透伤）",
    category: "trauma",
    dept: "急诊外科",
    site: "胸部 · 胸膜/肺",
    triage: 5,
    hidden: false,
    vitals: { sbp: -35, hr: 32, spo2: -14, airway: -10, pain: 55, volume: -900, hb: -2.2, lactate: 3.4, rr: 8 },
    labs: { hb: 8.6, lactate: 4.0, inr: 1.2, ph: 7.30 },
    exam: {
      xray: "左侧胸腔大量积液、左肺压缩 60%，纵隔向右移位",
      us: "左侧胸腔积液伴液性暗区，心包未见明显积液",
      ct: "左胸壁贯通伤，左肺裂伤伴血气胸，未见心脏大血管损伤"
    },
    symptoms: [
      { name: "左侧胸壁刀刺伤口，随呼吸有气泡冒出", mode: "视诊", t: 0 },
      { name: "患侧呼吸音消失、叩诊鼓音与浊音交界", mode: "听诊", t: 0 },
      { name: "呼吸急促、口唇发绀", mode: "视诊", t: 90 },
      { name: "血压下降、颈静脉充盈", mode: "视诊", t: 240 }
    ],
    stages: [
      { t: 0, label: "血气胸期", changes: { spo2: -6, sbp: -12, rr: 6 }, log: "胸膜腔积血积气，肺受压萎陷" },
      { t: 300, label: "张力性进展", changes: { airway: -18, spo2: -12, sbp: -20 }, log: "胸腔压力升高，静脉回流受阻" },
      { t: 720, label: "呼吸循环衰竭", changes: { rhythm: "pea", gcs: -8 }, lethal: true, log: "张力性血气胸导致循环衰竭" }
    ],
    treat: [
      { type: "surgery", proc: "drainage", site: "pleura", need: true, note: "胸腔闭式引流（锁骨中线第 5 肋间），必要时开胸探查修补肺裂伤" },
      { type: "nurse", id: "dressing", need: false, note: "胸壁伤口用三边封闭敷料覆盖，避免形成张力性气胸" },
      { type: "drug", id: "tranexamic_acid", need: false, note: "氨甲环酸减少胸腔内继续出血" }
    ],
    harm: [
      { id: "saline", msg: "未引流就快速大量补液，加重肺水肿与稀释性凝血障碍" }
    ],
    lethalAfter: 900,
    needSurgery: true,
    note: "胸部穿透伤的关键是「先减压再修补」：张力性血气胸必须先引流，否则正压通气会迅速致命"
  },
  {
    id: "fall_from_height",
    name: "高处坠落伤（多发伤）",
    category: "trauma",
    dept: "急诊外科",
    site: "全身 · 骨盆/长骨/腹腔",
    triage: 5,
    hidden: false,
    vitals: { sbp: -40, dbp: -26, hr: 34, hb: -3.2, volume: -1400, pain: 80, gi: -20, lactate: 4.0, spo2: -6 },
    labs: { hb: 7.4, lactate: 4.8, inr: 1.4, ck: 2600, k: 4.8, creatine: 150 },
    exam: {
      xray: "骨盆环多发骨折、右侧股骨干骨折，双肺散在挫伤影",
      us: "FAST 见腹腔少量游离液体，下腔静脉塌陷（容量不足）",
      ct: "骨盆多发骨折伴后腹膜血肿，右股骨干骨折，肺挫伤"
    },
    symptoms: [
      { name: "高处坠落史，不能言语、呻吟", mode: "问诊", t: 0 },
      { name: "骨盆挤压试验阳性、右大腿畸形肿胀", mode: "触诊", t: 0 },
      { name: "面色苍白、腹部膨隆、移动性浊音", mode: "视诊", t: 120 },
      { name: "意识由嗜睡转为昏迷", mode: "视诊", t: 420 }
    ],
    stages: [
      { t: 0, label: "急性失血期", changes: { sbp: -15, hr: 12, hb: -1.2 }, log: "骨盆与股骨骨折端大量渗血，后腹膜可容纳数升血液" },
      { t: 480, label: "挤压/凝血期", changes: { ck: 4000, inr: 0.8, k: 0.8, renal: -20 }, log: "肌肉挤压伤释放肌红蛋白，出现凝血障碍与急性肾损伤" },
      { t: 1200, label: "创伤性休克", changes: { sbp: -30, lactate: 3, gcs: -6 }, lethal: true, log: "失血与炎症反应导致难治性休克" }
    ],
    treat: [
      { type: "nurse", id: "splint", need: true, note: "骨盆带固定 + 长骨夹板/牵引固定，减少骨折端继续出血与疼痛" },
      { type: "nurse", id: "tourniquet", need: false, note: "开放伤口加压包扎；活动性出血肢体止血带" },
      { type: "surgery", proc: "fixation", site: "longbone", need: false, note: "生命体征稳定后行骨折内固定" },
      { type: "drug", id: "tranexamic_acid", need: false, note: "伤后 3 小时内使用可降低死亡率" }
    ],
    harm: [
      { id: "saline", msg: "未固定骨盆就大量补液，血压升高后血肿被冲开，出血骤增" }
    ],
    lethalAfter: 1500,
    needSurgery: false,
    note: "骨盆骨折是「看不见的大出血」：先固定骨盆、保温、氨甲环酸，再限制性补液并尽快输血"
  },
  {
    id: "blast_injury",
    name: "爆炸伤（爆震伤）",
    category: "trauma",
    dept: "急诊外科",
    site: "胸部/腹部 · 冲击波损伤",
    triage: 5,
    hidden: false,
    vitals: { sbp: -32, hr: 36, spo2: -20, airway: -12, pain: 70, hb: -2.6, volume: -800, paco2: 8, lactate: 3.8, rr: 10 },
    labs: { hb: 8.8, lactate: 4.4, ph: 7.28, pao2: 68 },
    exam: {
      xray: "双肺弥漫性斑片状渗出（爆震肺），右侧气胸，鼓膜穿孔",
      us: "腹腔少量积液，肝周见小血肿",
      ct: "双肺爆震伤伴气胸，部分肠管壁积气，鼓膜穿孔"
    },
    symptoms: [
      { name: "爆炸现场受伤，双耳流血、听力下降", mode: "视诊", t: 0 },
      { name: "胸闷、呼吸困难、血性泡沫痰", mode: "问诊", t: 60 },
      { name: "双肺湿啰音、皮下捻发感", mode: "触诊", t: 180 },
      { name: "意识模糊、血氧快速下降", mode: "监护", t: 420 }
    ],
    stages: [
      { t: 0, label: "爆震肺期", changes: { spo2: -10, pao2: -35, rr: 8 }, log: "肺泡与毛细血管撕裂，肺内出血与水肿" },
      { t: 480, label: "ARDS 期", changes: { spo2: -12, ph: -0.10, lactate: 2 }, log: "炎症介质释放，进展为急性呼吸窘迫综合征" },
      { t: 1080, label: "呼吸衰竭", changes: { rhythm: "pea", gcs: -8 }, lethal: true, log: "难治性低氧血症导致循环衰竭" }
    ],
    treat: [
      { type: "nurse", id: "dressing", need: false, note: "体表伤口加压包扎，耳道与鼻腔不要填塞过紧" },
      { type: "surgery", proc: "drainage", site: "pleura", need: true, note: "气胸/血胸行胸腔闭式引流，其余损伤按部探查" },
      { type: "drug", id: "saline", need: false, note: "限制性补液，避免加重爆震肺水肿" }
    ],
    harm: [
      { id: "saline", msg: "大量补液加重爆震肺的肺水肿，氧合进一步恶化" }
    ],
    lethalAfter: 1440,
    needSurgery: true,
    note: "爆震伤是「外面看着没事、里面全是伤」：优先处理张力性气胸与活动性出血，肺保护性通气"
  },
  {
    id: "electrical_injury",
    name: "电击伤（高压电）",
    category: "trauma",
    dept: "急诊科",
    site: "全身 · 电流通路/心脏",
    triage: 4,
    hidden: false,
    vitals: { hr: 26, sbp: -20, ck: 3800, pain: 45, arrhythmia: 35, qt: 40, k: 0.9, lactate: 2.4, volume: -400 },
    labs: { ck: 4200, k: 5.4, lactate: 3.0, creatinine: 130, troponin: 0.18 },
    exam: {
      ecg: "窦性心动过速伴频发室早，QT 延长",
      xray: "未见骨折（电击可致肌肉强烈收缩性骨折）",
      us: "心肌运动普遍减弱，EF 约 45%"
    },
    symptoms: [
      { name: "触电后意识丧失数秒，现烦躁", mode: "问诊", t: 0 },
      { name: "手部与足部电流入口/出口焦痂", mode: "视诊", t: 0 },
      { name: "心悸、心电监护频发室早", mode: "监护", t: 120 },
      { name: "尿色变深（肌红蛋白尿）", mode: "视诊", t: 300 }
    ],
    stages: [
      { t: 0, label: "电休克期", changes: { hr: 10, arrhythmia: 20, gcs: -2 }, log: "电流通过心脏，心肌电生理紊乱" },
      { t: 600, label: "横纹肌溶解期", changes: { ck: 6000, k: 1.0, renal: -20 }, log: "深部肌肉广泛坏死，肌红蛋白入血" },
      { t: 1500, label: "急性肾衰/心律失常", changes: { renal: -30, urine: -40, rhythm: "vt" }, lethal: true, log: "肌红蛋白管型与高钾导致肾衰/恶性心律失常" }
    ],
    treat: [
      { type: "nurse", id: "burn_care", need: true, note: "电击出入口焦痂清创、包扎；四肢环形焦痂需切开减压" },
      { type: "drug", id: "saline", need: false, note: "充分补液冲刷肌红蛋白（尿量维持 1 mL/kg/h 以上）" },
      { type: "drug", id: "sodium_bicarbonate", need: false, note: "碱化尿液，减少肌红蛋白管型" },
      { type: "surgery", proc: "debridement", site: "skin", need: false, note: "深部坏死组织清创，必要时筋膜切开" }
    ],
    harm: [
      { id: "furosemide", msg: "未补足容量就利尿，加重肾损伤与低钾" }
    ],
    lethalAfter: 1800,
    needSurgery: false,
    note: "电击伤的关键是「看不出来的深部损伤」：持续心电监护、查 CK 与尿色、大量补液碱化尿液"
  },
  {
    id: "spontaneous_pneumothorax",
    name: "自发性气胸（张力性）",
    category: "respiratory",
    dept: "急诊科",
    site: "胸部 · 胸膜腔",
    triage: 4,
    hidden: false,
    vitals: { spo2: -12, airway: -8, rr: 10, sbp: -12, hr: 22, paco2: 8, pao2: -20, pain: 40 },
    labs: { ph: 7.44, pao2: 62, paco2: 32, lactate: 1.4 },
    exam: {
      xray: "右侧胸腔大量积气，右肺压缩 85%，纵隔向左移位，肋间隙增宽",
      us: "右肺滑动征消失，未见胸腔积液",
      ct: "右侧张力性气胸，右肺完全萎陷"
    },
    symptoms: [
      { name: "突发右侧胸痛、呼吸困难", mode: "问诊", t: 0 },
      { name: "患侧呼吸音消失、叩诊鼓音", mode: "听诊", t: 0 },
      { name: "气管向健侧移位", mode: "视诊", t: 120 },
      { name: "血压下降、颈静脉怒张（张力性）", mode: "视诊", t: 300 }
    ],
    stages: [
      { t: 0, label: "气胸期", changes: { spo2: -6, rr: 6 }, log: "胸膜腔积气，肺部分萎陷" },
      { t: 420, label: "张力性期", changes: { sbp: -20, airway: -10, spo2: -8 }, log: "胸腔压力持续升高，静脉回流受阻" },
      { t: 900, label: "循环衰竭", changes: { rhythm: "pea", gcs: -8 }, lethal: true, log: "纵隔摆动与静脉回流中断导致循环衰竭" }
    ],
    treat: [
      { type: "surgery", proc: "drainage", site: "pleura", need: true, note: "立即胸腔闭式引流（张力性时先粗针穿刺减压）" },
      { type: "nurse", id: "position", need: false, note: "半坐位，高流量吸氧" },
      { type: "drug", id: "ketamine", need: false, note: "必要时镇痛后再操作，避免躁动加重漏气" }
    ],
    harm: [
      { id: "saline", msg: "张力性气胸不减压就快速补液，只会加重循环负担" }
    ],
    lethalAfter: 1200,
    needSurgery: true,
    note: "张力性气胸是「先减压、后拍片」：针刺减压后立即置管，等影像会死人"
  },
  {
    id: "mesenteric_ischemia",
    name: "急性肠系膜缺血",
    category: "gi",
    dept: "普通外科",
    site: "腹部 · 肠系膜上动脉",
    triage: 5,
    hidden: false,
    vitals: { pain: 85, sbp: -22, hr: 28, lactate: 3.6, ph: -0.08, gi: -35, temp: 0.4, wbc: 4 },
    labs: { lactate: 5.2, wbc: 18, ph: 7.28, inr: 1.3, amylase: 180 },
    exam: {
      us: "肠管扩张、蠕动消失，肠系膜上动脉血流信号微弱",
      ct: "肠系膜上动脉充盈缺损，部分小肠壁增厚积气，腹腔少量渗出",
      xray: "肠管扩张伴气液平，见肠壁积气（提示坏死）"
    },
    symptoms: [
      { name: "剧烈腹痛但腹部体征轻微（症状与体征分离）", mode: "问诊", t: 0 },
      { name: "房颤病史，未规律抗凝", mode: "问诊", t: 0 },
      { name: "肠鸣音消失、弥漫性压痛", mode: "触诊", t: 300 },
      { name: "血压下降、乳酸升高", mode: "监护", t: 600 }
    ],
    stages: [
      { t: 0, label: "缺血期", changes: { lactate: 1.5, gi: -20, pain: 10 }, log: "肠系膜血管栓塞，肠壁缺血" },
      { t: 480, label: "肠坏死期", changes: { gi: -25, inr: 0.6, sbp: -15 }, log: "黏膜屏障破坏，毒素吸收入血" },
      { t: 1200, label: "感染性休克期", changes: { sbp: -25, ph: -0.15, lactate: 3 }, lethal: true, log: "肠坏死与腹腔感染导致脓毒症休克" }
    ],
    treat: [
      { type: "surgery", proc: "resection", site: "intestine", need: true, note: "急诊剖腹探查：切除坏死肠管并吻合/造口，看肠管血运是金标准" },
      { type: "drug", id: "heparin", need: false, note: "明确诊断后立即抗凝，防止血栓蔓延" },
      { type: "drug", id: "piperacillin_tazobactam", need: false, note: "覆盖肠道菌群的广谱抗生素" }
    ],
    harm: [
      { id: "morphine", msg: "只给镇痛掩盖腹痛，延误手术时机" },
      { id: "metoclopramide", msg: "当成胃肠炎止吐，掩盖肠坏死" }
    ],
    lethalAfter: 1800,
    needSurgery: true,
    note: "房颤患者出现「剧烈腹痛 + 腹部体征轻」要想到肠系膜栓塞：CTA 确诊后争取 6 小时内手术，不能用止痛药把它压过去"
  },
  {
    id: "acute_glaucoma",
    name: "急性闭角型青光眼",
    category: "other",
    dept: "眼科 / 急诊",
    site: "眼 · 前房角",
    triage: 3,
    hidden: false,
    vitals: { pain: 55, hr: 12, sbp: 12, pupil: 3.2, gcs: -1, temp: 0.2 },
    labs: { wbc: 8.0, glucose: 7.2 },
    exam: { ct: "眼眶 CT 未见占位；眼球前后径偏短", us: "前房浅，房角关闭", lab: "无特殊" },
    symptoms: [
      { name: "左眼剧烈胀痛、同侧头痛", mode: "问诊", t: 0 },
      { name: "看灯光有彩虹圈、视力骤降", mode: "问诊", t: 0 },
      { name: "结膜混合充血、角膜雾状水肿、瞳孔中等散大", mode: "视诊", t: 60 },
      { name: "恶心呕吐（常被误认为胃肠炎）", mode: "问诊", t: 120 }
    ],
    stages: [
      { t: 0, label: "急性发作期", changes: { pain: 5, hr: 6 }, log: "房角关闭，眼压急升至 50 mmHg 以上" },
      { t: 600, label: "视神经缺血期", changes: { brain: -6 }, log: "持续高眼压造成视神经损害" },
      { t: 1800, label: "不可逆视力损害", changes: { brain: -10 }, lethal: false, log: "视神经萎缩，视力永久受损" }
    ],
    treat: [
      { type: "drug", id: "mannitol", need: true, note: "20% 甘露醇 1–2 g/kg 快速静滴，降低眼压" },
      { type: "nurse", id: "position", need: false, note: "半卧位、安静避光，避免情绪激动与暗环境" },
      { type: "drug", id: "acetaminophen", need: false, note: "止痛（避免使用加重抗胆碱作用的药）" }
    ],
    harm: [
      { id: "atropine", msg: "抗胆碱能作用使瞳孔散大、房角进一步关闭，眼压更高" },
      { id: "metoclopramide", msg: "按胃肠炎处理止吐，延误降眼压" }
    ],
    lethalAfter: 3600,
    needSurgery: false,
    note: "单侧眼痛伴头痛、恶心、视物彩虹圈，先想到急性闭角型青光眼；甘露醇降眼压后转眼科激光/手术"
  },
  {
    id: "acute_pericarditis",
    name: "急性心包炎",
    category: "cardiovascular",
    dept: "心内科",
    site: "心脏 · 心包",
    triage: 3,
    hidden: false,
    vitals: { pain: 55, hr: 16, temp: 0.8, sbp: -6, qt: 10, ecgSTDepress: false },
    labs: { crp: 68, wbc: 11.5, troponin: 0.12, lactate: 1.2 },
    exam: {
      ecg: "广泛导联 ST 段弓背向下抬高，PR 段压低",
      us: "心包少量积液，未见右室塌陷",
      xray: "心影稍增大，肺野清晰"
    },
    symptoms: [
      { name: "胸骨后锐痛，前倾坐位减轻、平卧加重", mode: "问诊", t: 0 },
      { name: "近期上呼吸道感染史", mode: "问诊", t: 0 },
      { name: "心包摩擦音", mode: "听诊", t: 60 },
      { name: "吸气时血压下降（奇脉）", mode: "触诊", t: 240 }
    ],
    stages: [
      { t: 0, label: "急性炎症期", changes: { pain: 6, temp: 0.3 }, log: "心包炎症，纤维素渗出" },
      { t: 900, label: "渗出期", changes: { sbp: -6, hr: 6 }, log: "心包积液增多，注意心包填塞" },
      { t: 2400, label: "填塞风险", changes: { sbp: -15, hr: 10 }, lethal: false, log: "积液快速增多可致心包填塞" }
    ],
    treat: [
      { type: "drug", id: "ibuprofen", need: true, note: "NSAID 足量（布洛芬 600mg q8h）+ 胃保护，疗程 2–4 周" },
      { type: "drug", id: "colchicine", need: true, note: "秋水仙碱 0.5mg bid，减少复发" },
      { type: "nurse", id: "position", need: false, note: "前倾坐位缓解疼痛，监测血压与心音" }
    ],
    harm: [
      { id: "furosemide", msg: "把心包炎当成心衰利尿，前负荷下降可诱发填塞" }
    ],
    lethalAfter: 3600,
    needSurgery: false,
    note: "心包炎三联征：胸膜性胸痛、心包摩擦音、广泛 ST 抬高；NSAID + 秋水仙碱是标准治疗"
  },
  {
    id: "tetanus",
    name: "破伤风",
    category: "sepsis",
    dept: "急诊 / 感染科",
    site: "神经系统 · 运动神经元",
    triage: 4,
    hidden: false,
    vitals: { gcs: -4, airway: -25, rr: -6, spo2: -8, pain: 40, temp: 0.6, icp: 3 },
    labs: { wbc: 13, crp: 40, k: 3.6, ph: 7.38 },
    exam: { ct: "头颅 CT 未见异常", lab: "伤口分泌物培养见混合菌生长", us: "无特殊" },
    symptoms: [
      { name: "咀嚼肌紧张、张口困难（牙关紧闭）", mode: "视诊", t: 0 },
      { name: "面部苦笑面容", mode: "视诊", t: 0 },
      { name: "颈部与背部肌强直、角弓反张", mode: "视诊", t: 300 },
      { name: "轻微刺激即诱发全身痉挛、呼吸暂停", mode: "视诊", t: 600 }
    ],
    stages: [
      { t: 0, label: "肌肉强直期", changes: { airway: -8, gcs: -2 }, log: "破伤风痉挛毒素抑制抑制性神经元" },
      { t: 600, label: "痉挛期", changes: { airway: -15, rr: -8, spo2: -10 }, log: "喉肌与呼吸肌痉挛，可出现呼吸骤停" },
      { t: 1500, label: "自主神经紊乱", changes: { hr: 40, sbp: 40, temp: 0.8 }, lethal: true, log: "交感风暴导致心律失常与循环衰竭" }
    ],
    treat: [
      { type: "nurse", id: "debridement", need: true, note: "彻底清创、清除坏死组织与异物，双氧水冲洗（破伤风梭菌厌氧）" },
      { type: "drug", id: "tetanus_antitoxin", need: true, note: "皮试后 TAT 1500 IU 肌注中和游离毒素" },
      { type: "drug", id: "midazolam", need: false, note: "镇静控制痉挛，必要时肌松 + 机械通气" },
      { type: "nurse", id: "restrain", need: false, note: "单间避光安静，减少声光刺激诱发痉挛" }
    ],
    harm: [
      { id: "metoclopramide", msg: "止吐药加重肌肉强直与锥体外系反应" }
    ],
    lethalAfter: 2400,
    needSurgery: false,
    note: "破伤风不会人传人但有传染性伤口：清创 + TAT + 镇静 + 安静避光是核心，死亡率仍高达 10–20%"
  },
  {
    id: "heat_exhaustion",
    name: "热衰竭（重症中暑先兆）",
    category: "environment",
    dept: "急诊科",
    site: "循环 · 容量与电解质",
    triage: 3,
    hidden: true,
    vitals: { temp: 1.2, hr: 25, sbp: -14, dbp: -8, na: -4, k: -0.4, volume: -600, gcs: -1, gi: 15 },
    labs: { na: 132, k: 3.2, creatinine: 96, lactate: 2.2, ph: 7.39 },
    exam: { lab: "血钠 132 mmol/L、血钾 3.2 mmol/L", us: "下腔静脉塌陷，容量不足", xray: "双肺清晰" },
    symptoms: [
      { name: "高温环境活动后头晕、乏力、大汗", mode: "问诊", t: 0 },
      { name: "皮肤湿冷、面色苍白", mode: "视诊", t: 0 },
      { name: "恶心、肌肉痉挛", mode: "问诊", t: 120 },
      { name: "一过性晕厥、血压偏低", mode: "监护", t: 300 }
    ],
    stages: [
      { t: 0, label: "容量不足期", changes: { sbp: -6, hr: 8 }, log: "大量出汗导致水钠丢失" },
      { t: 900, label: "电解质紊乱期", changes: { na: -3, k: -0.4, gi: 10 }, log: "低钠低钾，出现肌痉挛与乏力" }
    ],
    treat: [
      { type: "drug", id: "saline", need: true, note: "生理盐水 1000 mL 快速补液，纠正容量不足" },
      { type: "nurse", id: "cool", need: true, note: "移到阴凉处、解开衣物、冰袋物理降温" },
      { type: "drug", id: "potassium_chloride", need: false, note: "血钾 < 3.3 时缓慢补钾（稀释后静滴）" }
    ],
    harm: [
      { id: "furosemide", msg: "已经容量不足还利尿，直接把人打进热射病" }
    ],
    lethalAfter: 5400,
    needSurgery: false,
    note: "热衰竭 = 容量与电解质丢失，补液 + 降温即可；不要当成热射病过度降温，也别用利尿剂"
  },
  {
    id: "rabies_exposure",
    name: "狂犬病暴露（Ⅲ 级）",
    category: "other",
    dept: "急诊外科",
    site: "皮肤软组织 · 犬咬伤",
    triage: 3,
    hidden: true,
    vitals: { pain: 30, hr: 8, temp: 0.2 },
    labs: { wbc: 9.0, crp: 12 },
    exam: { us: "左小腿多处齿痕样撕裂伤，深达肌层", lab: "伤口分泌物涂片见混合菌" },
    symptoms: [
      { name: "被流浪犬咬伤 2 小时，伤口出血", mode: "问诊", t: 0 },
      { name: "左小腿多处撕裂伤、污染重", mode: "视诊", t: 0 },
      { name: "犬只来源不明、未接种疫苗", mode: "问诊", t: 60 }
    ],
    stages: [
      { t: 0, label: "暴露后窗口期", changes: {}, log: "病毒自伤口侵入周围神经，此时干预最有效" },
      { t: 3600, label: "未处置风险", changes: { temp: 0.6, gcs: -3, airway: -10 }, lethal: true, log: "一旦发病几乎 100% 死亡（教学推演）" }
    ],
    treat: [
      { type: "nurse", id: "debridement", need: true, note: "肥皂水与流动水交替冲洗 15 分钟，碘伏消毒，伤口不缝合" },
      { type: "drug", id: "rabies_vaccine", need: true, note: "0/3/7/14/28 天程序接种，越早越好" },
      { type: "drug", id: "rabies_immunoglobulin", need: true, note: "Ⅲ 级暴露：伤口周围浸润注射 HRIG（20 IU/kg）" },
      { type: "drug", id: "tetanus_antitoxin", need: false, note: "同时评估破伤风免疫" }
    ],
    harm: [
      { id: "dexamethasone", msg: "激素不用于狂犬病暴露后预防，可能抑制免疫应答" }
    ],
    lethalAfter: 7200,
    needSurgery: false,
    note: "Ⅲ 级暴露三件事：冲洗 15 分钟 + 疫苗 + 免疫球蛋白，缺一不可；伤口原则上不缝合"
  }
];
