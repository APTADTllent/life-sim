window.M = window.M || {};
M.DISEASES = [
  {
    id: "stemi",
    name: "急性ST段抬高型心肌梗死",
    dept: "心血管内科",
    site: "心脏 · 冠状动脉左前降支",
    triage: 5,
    hidden: false,
    vitals: { hr: 18, sbp: -18, spo2: -3, pain: 60, contractility: -20, coronary: -55 },
    labs: { troponin: 0.9, k: 4.2, glucose: 8.1, lactate: 2.4, wbc: 11.2 },
    exam: { ecg: "V1-V4 ST段弓背向上抬高 0.4mV，II/III/aVF 镜像压低", xray: "心影稍大，肺淤血", us: "前壁节段性运动减弱" },
    symptoms: [
      { name: "胸骨后压榨性疼痛，向左肩放射", mode: "问诊", t: 0 },
      { name: "大汗淋漓、面色苍白", mode: "视诊", t: 60 },
      { name: "恶心呕吐", mode: "问诊", t: 240 },
      { name: "濒死感、烦躁不安", mode: "问诊", t: 300 },
      { name: "心音低钝、可闻及奔马律", mode: "听诊", t: 300 },
      { name: "血压进行性下降", mode: "监护", t: 600 }
    ],
    stages: [
      { t: 0, label: "超急性期", changes: { hr: 15, sbp: -10 }, log: "心肌缺血进行性加重，ST段开始抬高" },
      { t: 240, label: "坏死进展期", changes: { sbp: -25, spo2: -6, arrhythmia: 30 }, log: "心肌大面积坏死，心功能下降" },
      { t: 600, label: "泵衰竭期", changes: { sbp: -45, spo2: -12, rhythm: "vt", arrhythmia: 60 }, log: "出现室性心动过速，血压进行性下降" },
      { t: 900, label: "终末期", changes: { rhythm: "vf", sbp: -70 }, lethal: true, log: "室颤，循环崩溃" }
    ],
    treat: [
      { type: "drug", id: "aspirin", need: true, note: "嚼服 300mg 负荷" },
      { type: "drug", id: "nitroglycerin", need: false, note: "胸痛+血压允许时舌下含服" },
      { type: "drug", id: "morphine", need: false, note: "镇痛" },
      { type: "surgery", proc: "embolization", site: "heart", need: true, note: "急诊 PCI 开通罪犯血管，90分钟内" }
    ],
    harm: [
      { id: "epinephrine", msg: "未评估心律即大剂量升压药，心肌耗氧激增，梗死扩大" },
      { id: "ondansetron", msg: "仅止吐不查心电图，掩盖恶心呕吐这一心肌缺血预警" }
    ],
    lethalAfter: 1500,
    needSurgery: true,
    note: "时间就是心肌，D2B 时间 < 90 分钟"
  },
  {
    id: "nstemi",
    name: "非ST段抬高型心肌梗死/不稳定型心绞痛",
    dept: "心血管内科",
    site: "心脏 · 冠状动脉多支病变",
    triage: 4,
    hidden: true,
    vitals: { hr: 12, sbp: -8, pain: 45, coronary: -30, contractility: -10 },
    labs: { troponin: 0.35, k: 4.0, glucose: 7.4, wbc: 9.8, creatinine: 96 },
    exam: { ecg: "ST段水平型压低 0.1-0.2mV，T波倒置", xray: "肺纹理增粗", us: "左室下壁运动稍减弱" },
    symptoms: [
      { name: "劳累后胸骨后闷痛，休息可缓解", mode: "问诊", t: 0 },
      { name: "胸部紧缩感伴气短", mode: "问诊", t: 120 },
      { name: "焦虑、出汗", mode: "视诊", t: 180 },
      { name: "心尖区收缩期杂音", mode: "听诊", t: 300 }
    ],
    stages: [
      { t: 0, label: "不稳定期", changes: { pain: 20, coronary: -10 }, log: "斑块不稳定，心肌缺血反复发作" },
      { t: 600, label: "缺血加重期", changes: { sbp: -12, spo2: -4, arrhythmia: 20 }, log: "缺血范围扩大，血流动力学波动" },
      { t: 1800, label: "心功能失代偿", changes: { contractility: -25, sbp: -25, rhythm: "vt" }, log: "左心功能不全，可进展为室速" },
      { t: 3000, label: "终末期", changes: { rhythm: "vf", sbp: -55 }, lethal: true, log: "恶性心律失常致循环崩溃" }
    ],
    treat: [
      { type: "drug", id: "aspirin", need: true, note: "负荷 300mg 并长期维持" },
      { type: "drug", id: "heparin", need: true, note: "低分子肝素抗凝" },
      { type: "drug", id: "nitroglycerin", need: false, note: "缓解缺血性胸痛" },
      { type: "surgery", proc: "embolization", site: "heart", need: false, note: "高危者 24 小时内介入评估" }
    ],
    harm: [
      { id: "ibuprofen", msg: "使用非甾体抗炎药止痛，增加心血管事件与出血风险" }
    ],
    lethalAfter: 3600,
    needSurgery: false,
    note: "按 GRACE 评分危险分层，高危者尽早介入"
  },
  {
    id: "acute_left_heart_failure",
    name: "急性左心衰竭（急性肺水肿）",
    course: "chronic",
    dept: "心血管内科",
    site: "心脏 · 左心室",
    triage: 5,
    hidden: false,
    vitals: { hr: 28, rr: 12, spo2: -14, sbp: 20, pain: 30, contractility: -35, pao2: -25 },
    labs: { bnp: 1800, k: 4.1, glucose: 7.9, lactate: 2.8, creatinine: 118 },
    exam: { ecg: "窦性心动过速，左室高电压", xray: "双肺蝶翼状渗出，心影增大", us: "左室射血分数 32%，弥漫室壁运动减弱" },
    symptoms: [
      { name: "突发呼吸困难，不能平卧", mode: "问诊", t: 0 },
      { name: "咳大量粉红色泡沫痰", mode: "视诊", t: 60 },
      { name: "双肺满布湿性啰音及哮鸣音", mode: "听诊", t: 60 },
      { name: "口唇发绀、端坐呼吸", mode: "视诊", t: 0 },
      { name: "血氧饱和度持续下降", mode: "监护", t: 120 }
    ],
    stages: [
      { t: 0, label: "肺间质水肿期", changes: { rr: 10, spo2: -8 }, log: "肺间质渗出，通气效率下降" },
      { t: 300, label: "肺泡水肿期", changes: { spo2: -16, pao2: -25, secretions: 40 }, log: "大量泡沫痰，氧合急剧恶化" },
      { t: 900, label: "呼吸衰竭期", changes: { spo2: -28, rr: 6, gcs: -4 }, log: "二氧化碳蓄积，意识模糊" },
      { t: 1500, label: "终末期", changes: { rhythm: "asystole", spo2: -40 }, lethal: true, log: "顽固缺氧致心跳停止" }
    ],
    treat: [
      { type: "drug", id: "furosemide", need: true, note: "静脉 40mg 利尿减容" },
      { type: "drug", id: "nitroglycerin", need: true, note: "血压允许时静脉泵入扩血管" },
      { type: "drug", id: "morphine", need: false, note: "小剂量镇静、减轻呼吸困难" },
      { type: "drug", id: "dobutamine", need: false, note: "低血压时正性肌力支持" }
    ],
    harm: [
      { id: "salbutamol", msg: "误按哮喘大剂量雾化β激动剂，心率血压进一步恶化" }
    ],
    lethalAfter: 1200,
    needSurgery: false,
    note: "坐位、吸氧、利尿扩血管，血压低时慎用扩血管药"
  },
  {
    id: "cardiogenic_shock",
    name: "心源性休克",
    dept: "重症医学科",
    site: "心脏 · 左心室广泛梗死",
    triage: 5,
    hidden: false,
    vitals: { hr: 30, sbp: -50, dbp: -25, map: -35, spo2: -8, urine: -40, contractility: -60, lactate: 5 },
    labs: { troponin: 2.4, lactate: 5.2, creatinine: 186, k: 4.6, glucose: 9.4, ph: 7.24 },
    exam: { ecg: "广泛前壁ST段抬高伴Q波形成", xray: "肺淤血伴心影增大", us: "射血分数 25%，心输出量明显下降" },
    symptoms: [
      { name: "皮肤湿冷、花斑", mode: "视诊", t: 0 },
      { name: "意识淡漠、反应迟钝", mode: "问诊", t: 120 },
      { name: "脉搏细速、四肢末梢凉", mode: "触诊", t: 0 },
      { name: "尿量明显减少", mode: "监护", t: 300 },
      { name: "血压持续低于 80/50mmHg", mode: "监护", t: 60 }
    ],
    stages: [
      { t: 0, label: "代偿期", changes: { hr: 20, svr: 30, sbp: -25 }, log: "交感兴奋代偿，外周血管收缩" },
      { t: 300, label: "失代偿期", changes: { sbp: -50, urine: -50, lactate: 3 }, log: "组织灌注不足，乳酸升高" },
      { t: 900, label: "多器官衰竭期", changes: { renal: -50, hepatic: -40, gcs: -5, ph: -0.15 }, log: "肝肾缺血、酸中毒加重" },
      { t: 1500, label: "终末期", changes: { rhythm: "asystole", sbp: -80 }, lethal: true, log: "循环衰竭致心跳停止" }
    ],
    treat: [
      { type: "drug", id: "noradrenaline", need: true, note: "去甲肾上腺素维持灌注压" },
      { type: "drug", id: "dobutamine", need: true, note: "正性肌力改善心输出量" },
      { type: "surgery", proc: "embolization", site: "heart", need: true, note: "急诊血运重建，必要时机械循环支持" }
    ],
    harm: [
      { id: "furosemide", msg: "在容量不足时大量利尿，血压进一步崩溃" }
    ],
    lethalAfter: 900,
    needSurgery: true,
    note: "升压+强心+再灌注，切忌盲目大量补液"
  },
  {
    id: "ventricular_fibrillation",
    name: "心室颤动",
    dept: "心血管内科",
    site: "心脏 · 心室肌",
    triage: 5,
    hidden: false,
    vitals: { hr: 0, sbp: -80, map: -60, spo2: -30, gcs: -10, co: -80, pain: 0, rhythm: "vf" },
    labs: { k: 5.6, lactate: 7.8, ph: 7.05, troponin: 1.8, glucose: 10.2 },
    exam: { ecg: "心室颤动波，无有效QRS波群", us: "心室无有效收缩，心腔内血流停滞" },
    symptoms: [
      { name: "突发意识丧失、倒地", mode: "视诊", t: 0 },
      { name: "大动脉搏动消失", mode: "触诊", t: 0 },
      { name: "呼吸叹息样继而停止", mode: "视诊", t: 30 },
      { name: "瞳孔散大、对光反射消失", mode: "视诊", t: 120 },
      { name: "监护仪示室颤波形", mode: "监护", t: 0 }
    ],
    stages: [
      { t: 0, label: "室颤初期", changes: { gcs: -10, sbp: -70 }, log: "心室无有效射血，循环中断" },
      { t: 120, label: "缺氧期", changes: { brain: -40, ph: -0.25, lactate: 4 }, log: "脑与心肌严重缺氧，酸中毒" },
      { t: 300, label: "电机械分离期", changes: { rhythm: "pea", gcs: -14 }, log: "心肌能量耗竭，转为电机械分离" },
      { t: 480, label: "终末期", changes: { rhythm: "asystole" }, lethal: true, log: "心脏停搏，不可逆脑损伤" }
    ],
    treat: [
      { type: "drug", id: "amiodarone", need: true, note: "除颤后静脉 300mg 抗心律失常" },
      { type: "drug", id: "epinephrine", need: true, note: "每 3-5 分钟 1mg 静脉推注" },
      { type: "surgery", proc: "embolization", site: "heart", need: false, note: "复苏成功后评估冠脉并介入治疗" }
    ],
    harm: [
      { id: "atropine", msg: "把室颤当心动过缓处理，延误电除颤，抢救失败" },
      { id: "midazolam", msg: "未除颤先镇静，加重循环抑制" }
    ],
    lethalAfter: 360,
    needSurgery: false,
    note: "立即非同步电除颤，每延迟 1 分钟生存率下降 7%-10%"
  },
  {
    id: "aortic_dissection",
    name: "主动脉夹层",
    dept: "心血管外科",
    site: "大血管/主动脉 · 升主动脉至主动脉弓",
    triage: 5,
    hidden: true,
    vitals: { hr: 20, sbp: 45, dbp: 25, map: 30, pain: 75, hb: -20, volume: -15 },
    labs: { d_dimer: 6.8, hb: 96, creatinine: 132, lactate: 3.6, wbc: 13.4 },
    exam: { ct: "主动脉内膜片影，真假腔形成，升主动脉增宽", xray: "纵隔增宽，主动脉结突出", us: "主动脉根部内膜撕裂" },
    symptoms: [
      { name: "突发撕裂样剧烈胸背痛，向腰部放射", mode: "问诊", t: 0 },
      { name: "面色苍白、大汗", mode: "视诊", t: 0 },
      { name: "双上肢血压不对称", mode: "监护", t: 60 },
      { name: "一侧桡动脉搏动减弱", mode: "触诊", t: 120 },
      { name: "新发主动脉瓣区舒张期杂音", mode: "听诊", t: 300 }
    ],
    stages: [
      { t: 0, label: "内膜撕裂期", changes: { pain: 40, sbp: 40 }, log: "内膜撕裂，假腔形成" },
      { t: 600, label: "假腔扩展期", changes: { hb: -25, volume: -20, sbp: 15 }, log: "假腔压迫分支血管，失血增多" },
      { t: 1800, label: "器官缺血期", changes: { renal: -45, brain: -35, urine: -40 }, log: "肾、脑、肠系膜供血受损" },
      { t: 2700, label: "破裂期", changes: { volume: -50, sbp: -70, rhythm: "pea" }, lethal: true, log: "主动脉破裂致心包填塞与循环崩溃" }
    ],
    treat: [
      { type: "drug", id: "esmolol", need: true, note: "静脉泵入控制心率 < 60 次/分" },
      { type: "drug", id: "morphine", need: true, note: "充分镇痛，降低交感张力" },
      { type: "drug", id: "noradrenaline", need: false, note: "血压过低时谨慎维持灌注" },
      { type: "surgery", proc: "replacement", site: "aorta", need: true, note: "A 型夹层急诊升主动脉替换" }
    ],
    harm: [
      { id: "nitroglycerin", msg: "单用扩血管药而未先控制心率，反射性心率增快，夹层扩展" },
      { id: "aspirin", msg: "误按心梗抗血小板，术中大出血风险剧增" }
    ],
    lethalAfter: 1500,
    needSurgery: true,
    note: "先镇痛降心率再降压，A 型夹层必须急诊手术"
  },
  {
    id: "cardiac_tamponade",
    name: "急性心包填塞",
    dept: "心血管外科",
    site: "纵隔 · 心包腔",
    triage: 5,
    hidden: true,
    vitals: { hr: 35, sbp: -40, dbp: -20, map: -30, co: -45, sv: -40, spo2: -6 },
    labs: { lactate: 3.8, hb: 92, k: 4.3, creatinine: 128, ph: 7.29 },
    exam: { us: "心包腔大量液性暗区，右室舒张期塌陷", ecg: "低电压，电交替", ct: "心包积液伴心包增厚" },
    symptoms: [
      { name: "呼吸困难、端坐位", mode: "问诊", t: 0 },
      { name: "颈静脉怒张", mode: "视诊", t: 60 },
      { name: "心音遥远低钝", mode: "听诊", t: 0 },
      { name: "脉搏细弱伴奇脉", mode: "触诊", t: 120 },
      { name: "血压进行性下降", mode: "监护", t: 180 }
    ],
    stages: [
      { t: 0, label: "积液积聚期", changes: { hr: 20, sbp: -15 }, log: "心包内压升高，心室充盈受限" },
      { t: 300, label: "充盈受限期", changes: { co: -35, sbp: -35, sv: -30 }, log: "每搏量下降，代偿性心动过速" },
      { t: 720, label: "失代偿期", changes: { sbp: -55, gcs: -5, urine: -50 }, log: "心输出量锐减，器官灌注不足" },
      { t: 1080, label: "终末期", changes: { rhythm: "pea", sbp: -75 }, lethal: true, log: "电机械分离，循环崩溃" }
    ],
    treat: [
      { type: "surgery", proc: "drainage", site: "heart", need: true, note: "超声引导心包穿刺引流，首选救命措施" },
      { type: "drug", id: "noradrenaline", need: true, note: "维持血压与冠脉灌注" },
      { type: "drug", id: "ketamine", need: false, note: "低血压患者诱导麻醉相对安全" }
    ],
    harm: [
      { id: "furosemide", msg: "误判为心衰而利尿，前负荷进一步下降，血压骤降" },
      { id: "nitroglycerin", msg: "扩血管降低前负荷，加速循环崩溃" }
    ],
    lethalAfter: 900,
    needSurgery: true,
    note: "填塞靠引流救命，补液维持前负荷，禁用利尿扩血管"
  },
  {
    id: "pulmonary_embolism",
    name: "急性肺栓塞",
    dept: "呼吸与危重症医学科",
    site: "胸腔 · 肺动脉主干及分支",
    triage: 5,
    hidden: true,
    vitals: { hr: 32, rr: 14, spo2: -16, sbp: -25, pao2: -28, paco2: -8, pain: 35 },
    labs: { d_dimer: 8.4, lactate: 3.4, troponin: 0.6, ph: 7.36, wbc: 11.6, creatinine: 104 },
    exam: { ct: "肺动脉主干及双下肺动脉充盈缺损", ecg: "S1Q3T3，V1-V3 T波倒置，窦性心动过速", us: "右心室扩大，室间隔左移" },
    symptoms: [
      { name: "突发呼吸困难伴胸痛", mode: "问诊", t: 0 },
      { name: "烦躁、濒死感", mode: "视诊", t: 60 },
      { name: "单侧下肢肿胀压痛", mode: "触诊", t: 0 },
      { name: "P2 亢进、三尖瓣区收缩期杂音", mode: "听诊", t: 180 },
      { name: "血氧饱和度吸氧后仍难纠正", mode: "监护", t: 120 }
    ],
    stages: [
      { t: 0, label: "栓塞急性期", changes: { rr: 10, spo2: -12, hr: 20 }, log: "肺血管阻力骤升，右心负荷增加" },
      { t: 600, label: "右心衰竭期", changes: { sbp: -30, spo2: -22, contractility: -25 }, log: "右心扩张，左心前负荷不足" },
      { t: 1800, label: "休克期", changes: { sbp: -50, lactate: 3, urine: -45 }, log: "梗阻性休克，组织灌注恶化" },
      { t: 2700, label: "终末期", changes: { rhythm: "pea", sbp: -70 }, lethal: true, log: "右心衰竭致循环崩溃" }
    ],
    treat: [
      { type: "drug", id: "heparin", need: true, note: "立即普通肝素抗凝" },
      { type: "drug", id: "alteplase", need: true, note: "高危伴休克者溶栓 50-100mg" },
      { type: "drug", id: "noradrenaline", need: false, note: "维持体循环压力" },
      { type: "surgery", proc: "embolization", site: "pleura", need: false, note: "溶栓禁忌时导管碎栓或取栓" }
    ],
    harm: [
      { id: "furosemide", msg: "大量利尿使右心前负荷不足，心输出量进一步下降" }
    ],
    lethalAfter: 1800,
    needSurgery: false,
    note: "高危肺栓塞先抗凝再溶栓，慎用单纯利尿与大量补液"
  },
  {
    id: "severe_pneumonia",
    name: "重症肺炎",
    dept: "呼吸与危重症医学科",
    site: "胸腔 · 左肺下叶",
    triage: 4,
    hidden: false,
    vitals: { rr: 10, spo2: -12, temp: 1.8, hr: 20, pao2: -22, sbp: -10, secretions: 35 },
    labs: { wbc: 18.6, crp: 168, lactate: 2.6, na: 132, creatinine: 118, ph: 7.34 },
    exam: { xray: "左下肺大片实变影，可见支气管充气征", ct: "左下肺叶实变伴少量胸腔积液", pathology: "痰涂片见大量中性粒细胞与革兰阳性球菌" },
    symptoms: [
      { name: "高热寒战、咳嗽咳黄脓痰", mode: "问诊", t: 0 },
      { name: "呼吸急促、鼻翼扇动", mode: "视诊", t: 60 },
      { name: "左下肺呼吸音减低伴湿啰音", mode: "听诊", t: 0 },
      { name: "左下肺叩诊浊音", mode: "叩诊", t: 120 },
      { name: "口唇发绀、意识淡漠", mode: "视诊", t: 600 }
    ],
    stages: [
      { t: 0, label: "感染进展期", changes: { temp: 1.5, rr: 8, spo2: -8 }, log: "肺泡渗出，通气血流比失调" },
      { t: 900, label: "呼吸衰竭期", changes: { spo2: -18, pao2: -20, hr: 20 }, log: "氧合恶化，呼吸做功增加" },
      { t: 2400, label: "脓毒症期", changes: { sbp: -30, lactate: 3, renal: -30 }, log: "炎症播散，血压与肾功能下降" },
      { t: 3600, label: "终末期", changes: { rhythm: "asystole", spo2: -35 }, lethal: true, log: "感染性休克致循环衰竭" }
    ],
    treat: [
      { type: "drug", id: "ceftriaxone", need: true, note: "联合大环内酯类经验性抗感染" },
      { type: "drug", id: "hydrocortisone", need: false, note: "合并休克时小剂量激素" },
      { type: "drug", id: "noradrenaline", need: false, note: "感染性休克时维持血压" },
      { type: "surgery", proc: "drainage", site: "pleura", need: false, note: "合并脓胸时胸腔闭式引流" }
    ],
    harm: [
      { id: "ibuprofen", msg: "单纯退热掩盖病情进展，且加重肾损伤与水钠潴留" }
    ],
    lethalAfter: 3000,
    needSurgery: false,
    note: "1 小时内留取病原学并经验性抗感染，密切监测氧合"
  },
  {
    id: "copd_exacerbation",
    name: "慢性阻塞性肺疾病急性加重",
    course: "chronic",
    dept: "呼吸与危重症医学科",
    site: "气管支气管 · 双肺细小气道",
    triage: 4,
    hidden: false,
    vitals: { rr: 12, spo2: -10, paco2: 16, pao2: -18, hr: 16, temp: 0.8, bronchospasm: 40 },
    labs: { wbc: 12.8, crp: 76, ph: 7.30, paco2: 62, hco3: 28, lactate: 2.0 },
    exam: { xray: "双肺透亮度增高，膈肌低平", ct: "肺气肿改变伴支气管壁增厚", ecg: "肺型P波，窦性心动过速" },
    symptoms: [
      { name: "慢性咳嗽咳痰加重，痰量增多变脓", mode: "问诊", t: 0 },
      { name: "活动后气促明显加重", mode: "问诊", t: 0 },
      { name: "桶状胸、辅助呼吸肌参与呼吸", mode: "视诊", t: 60 },
      { name: "双肺呼气相延长伴哮鸣音", mode: "听诊", t: 0 },
      { name: "嗜睡、球结膜水肿", mode: "视诊", t: 900 }
    ],
    stages: [
      { t: 0, label: "急性加重期", changes: { rr: 8, spo2: -8, bronchospasm: 30 }, log: "气道炎症加重，气流受限" },
      { t: 1200, label: "二氧化碳蓄积期", changes: { paco2: 15, ph: -0.08, gcs: -2 }, log: "通气不足，呼吸性酸中毒" },
      { t: 2400, label: "肺性脑病期", changes: { gcs: -6, paco2: 25, spo2: -16 }, log: "二氧化碳麻醉，意识障碍" },
      { t: 3600, label: "终末期", changes: { rhythm: "asystole", ph: -0.2 }, lethal: true, log: "严重酸中毒与缺氧致心跳停止" }
    ],
    treat: [
      { type: "drug", id: "salbutamol", need: true, note: "联合异丙托溴铵雾化解痉" },
      { type: "drug", id: "hydrocortisone", need: true, note: "全身糖皮质激素 5-7 天" },
      { type: "drug", id: "ceftriaxone", need: false, note: "痰液变脓时抗感染" },
      { type: "drug", id: "dextrose_50", need: false, note: "纠正低血糖等可逆诱因" }
    ],
    harm: [
      { id: "midazolam", msg: "未评估血气即镇静，加重二氧化碳蓄积与呼吸抑制" }
    ],
    lethalAfter: 3000,
    needSurgery: false,
    note: "控制性氧疗目标 SpO2 88%-92%，警惕二氧化碳麻醉"
  },
  {
    id: "acute_asthma",
    name: "重症支气管哮喘急性发作",
    dept: "呼吸与危重症医学科",
    site: "气管支气管 · 细支气管",
    triage: 4,
    hidden: false,
    vitals: { rr: 16, spo2: -12, bronchospasm: 55, hr: 24, pao2: -20, paco2: -6, tv: -30 },
    labs: { wbc: 10.4, crp: 18, k: 3.4, ph: 7.44, lactate: 2.2 },
    exam: { xray: "双肺透亮度增高，无明显实变", ecg: "窦性心动过速，电轴右偏" },
    symptoms: [
      { name: "接触过敏原后突发喘息、憋气", mode: "问诊", t: 0 },
      { name: "不能完整说句、端坐前倾位", mode: "视诊", t: 60 },
      { name: "双肺弥漫呼气相哮鸣音", mode: "听诊", t: 0 },
      { name: "三凹征、大汗淋漓", mode: "视诊", t: 120 },
      { name: "哮鸣音突然减弱、呼吸变浅", mode: "听诊", t: 600 }
    ],
    stages: [
      { t: 0, label: "支气管痉挛期", changes: { bronchospasm: 45, rr: 12, spo2: -10 }, log: "广泛小气道痉挛，气道阻力升高" },
      { t: 600, label: "呼吸肌疲劳期", changes: { rr: -6, tv: -35, paco2: 10 }, log: "呼吸肌疲劳，通气量下降" },
      { t: 1200, label: "静默肺期", changes: { spo2: -25, gcs: -4, hr: -15 }, log: "气道近乎闭塞，哮鸣音消失" },
      { t: 1800, label: "终末期", changes: { rhythm: "asystole", spo2: -35 }, lethal: true, log: "窒息与呼吸衰竭致心跳停止" }
    ],
    treat: [
      { type: "drug", id: "salbutamol", need: true, note: "持续雾化吸入β2激动剂" },
      { type: "drug", id: "hydrocortisone", need: true, note: "静脉糖皮质激素" },
      { type: "drug", id: "epinephrine", need: false, note: "极重度发作可皮下注射" },
      { type: "drug", id: "ketamine", need: false, note: "需插管时氯胺酮诱导有支气管扩张作用" }
    ],
    harm: [
      { id: "midazolam", msg: "未插管即镇静，呼吸抑制迅速恶化" },
      { id: "aspirin", msg: "阿司匹林类可能诱发哮喘加重" }
    ],
    lethalAfter: 1200,
    needSurgery: false,
    note: "哮鸣音消失是危险信号，提示静默肺需立即插管"
  },
  {
    id: "tension_pneumothorax",
    name: "张力性气胸",
    dept: "胸外科",
    site: "胸腔 · 右侧胸膜腔",
    triage: 5,
    hidden: false,
    vitals: { rr: 14, spo2: -18, sbp: -30, hr: 32, pao2: -25, tv: -35, co: -35 },
    labs: { lactate: 3.2, ph: 7.31, wbc: 12.0, k: 4.4, creatinine: 110 },
    exam: { xray: "右侧胸腔大量积气，肺压缩 90%，纵隔左移", ct: "右侧气胸伴纵隔疝", us: "右侧胸膜滑动征消失" },
    symptoms: [
      { name: "突发患侧胸痛伴极度呼吸困难", mode: "问诊", t: 0 },
      { name: "患侧胸廓饱满、呼吸动度减弱", mode: "视诊", t: 0 },
      { name: "患侧叩诊鼓音、气管向健侧移位", mode: "叩诊", t: 60 },
      { name: "患侧呼吸音消失", mode: "听诊", t: 0 },
      { name: "颈静脉怒张、血压下降", mode: "监护", t: 180 }
    ],
    stages: [
      { t: 0, label: "胸腔高压期", changes: { spo2: -14, tv: -25, hr: 20 }, log: "胸腔内压急剧升高，肺萎陷" },
      { t: 300, label: "纵隔移位期", changes: { sbp: -35, co: -30, spo2: -22 }, log: "纵隔移位压迫腔静脉，回心血量锐减" },
      { t: 720, label: "梗阻性休克期", changes: { sbp: -55, gcs: -5, lactate: 3 }, log: "心输出量严重下降" },
      { t: 1080, label: "终末期", changes: { rhythm: "pea", spo2: -40 }, lethal: true, log: "循环崩溃致心跳停止" }
    ],
    treat: [
      { type: "surgery", proc: "drainage", site: "pleura", need: true, note: "立即患侧锁骨中线第二肋间穿刺减压后置管" },
      { type: "drug", id: "ketamine", need: false, note: "置管前镇痛镇静" },
      { type: "drug", id: "noradrenaline", need: false, note: "减压后仍低血压时短期支持" }
    ],
    harm: [
      { id: "midazolam", msg: "未减压先深镇静，呼吸循环迅速恶化" }
    ],
    lethalAfter: 600,
    needSurgery: true,
    note: "先穿刺减压再行影像检查，绝不能等胸片"
  },
  {
    id: "ards",
    name: "急性呼吸窘迫综合征",
    dept: "重症医学科",
    site: "胸腔 · 双肺弥漫性肺泡",
    triage: 5,
    hidden: true,
    vitals: { rr: 18, spo2: -20, pao2: -35, tv: -25, hr: 24, sbp: -15, secretions: 25 },
    labs: { lactate: 3.0, wbc: 16.2, crp: 142, ph: 7.28, creatinine: 136, plt: 92 },
    exam: { xray: "双肺弥漫性斑片状浸润影，呈白肺样改变", ct: "双肺大片磨玻璃影伴实变，重力依赖区明显", us: "双肺B线密集，胸膜线光滑" },
    symptoms: [
      { name: "原发病后 1-2 天出现进行性呼吸困难", mode: "问诊", t: 0 },
      { name: "呼吸窘迫、辅助呼吸肌参与", mode: "视诊", t: 120 },
      { name: "双肺可闻及广泛湿啰音", mode: "听诊", t: 60 },
      { name: "吸氧后发绀不缓解", mode: "视诊", t: 300 },
      { name: "氧合指数进行性下降", mode: "监护", t: 180 }
    ],
    stages: [
      { t: 0, label: "渗出期", changes: { spo2: -14, pao2: -22, rr: 12 }, log: "肺泡毛细血管膜损伤，通透性增高" },
      { t: 1800, label: "氧合恶化期", changes: { spo2: -24, pao2: -32, co: -20 }, log: "肺内分流增加，顽固低氧" },
      { t: 3600, label: "多器官障碍期", changes: { renal: -45, hepatic: -35, lactate: 3, gcs: -4 }, log: "缺氧与炎症致多器官功能受损" },
      { t: 5400, label: "终末期", changes: { rhythm: "asystole", spo2: -40 }, lethal: true, log: "顽固性低氧血症致心跳停止" }
    ],
    treat: [
      { type: "drug", id: "hydrocortisone", need: false, note: "中重度者短期糖皮质激素" },
      { type: "drug", id: "noradrenaline", need: false, note: "合并休克时维持灌注" },
      { type: "drug", id: "midazolam", need: true, note: "肺保护性通气时镇静镇痛" },
      { type: "surgery", proc: "drainage", site: "pleura", need: false, note: "合并气胸时胸腔闭式引流" }
    ],
    harm: [
      { id: "furosemide", msg: "容量不足时强力脱水，心输出量下降加重休克" }
    ],
    lethalAfter: 3600,
    needSurgery: false,
    note: "小潮气量 6ml/kg 肺保护性通气，俯卧位改善氧合"
  },
  {
    id: "acute_cerebral_infarction",
    name: "急性缺血性脑卒中",
    dept: "神经内科",
    site: "颅腔 · 左侧基底节区",
    triage: 5,
    hidden: true,
    vitals: { gcs: -2, sbp: 30, hr: 12, pain: 10, brain: -30, pupil: -8 },
    labs: { glucose: 9.6, inr: 1.0, plt: 210, creatinine: 96, wbc: 8.6, hb: 142 },
    exam: { ct: "左侧基底节区低密度灶，未见出血", mri: "左侧基底节及放射冠 DWI 高信号，ADC 低信号", us: "左侧颈内动脉分叉处斑块伴狭窄" },
    symptoms: [
      { name: "突发右侧肢体无力、麻木", mode: "问诊", t: 0 },
      { name: "口角歪斜、言语含糊", mode: "视诊", t: 0 },
      { name: "右侧肢体肌力 2 级、肌张力低", mode: "触诊", t: 60 },
      { name: "双眼向左侧凝视", mode: "视诊", t: 0 },
      { name: "右侧巴宾斯基征阳性", mode: "触诊", t: 120 }
    ],
    stages: [
      { t: 0, label: "缺血核心形成期", changes: { brain: -25, gcs: -2 }, log: "缺血中心区神经元迅速死亡" },
      { t: 300, label: "半暗带进展期", changes: { brain: -15, gcs: -2, pupil: -5 }, log: "半暗带持续缺血，可挽救组织减少" },
      { t: 900, label: "脑水肿期", changes: { icp: 25, gcs: -5, pupil: -10 }, log: "细胞毒性水肿，颅内压升高" },
      { t: 1800, label: "脑疝期", changes: { icp: 45, pupil: 3.5, rhythm: "asystole" }, lethal: true, log: "大面积水肿致脑疝与呼吸心跳停止" }
    ],
    treat: [
      { type: "drug", id: "alteplase", need: true, note: "发病 4.5 小时内排除禁忌后静脉溶栓" },
      { type: "drug", id: "aspirin", need: true, note: "溶栓 24 小时后启动抗血小板" },
      { type: "drug", id: "mannitol", need: false, note: "脑水肿明显时脱水降颅压" },
      { type: "surgery", proc: "embolization", site: "cranium", need: false, note: "大血管闭塞者机械取栓" }
    ],
    harm: [
      { id: "nitroglycerin", msg: "未经评估快速降压，缺血半暗带灌注进一步下降" },
      { id: "tranexamic_acid", msg: "未行影像排除出血即止血，加重梗死" }
    ],
    lethalAfter: 2400,
    needSurgery: false,
    note: "先 CT 排除出血，抢在时间窗内溶栓或取栓"
  },
  {
    id: "cerebral_hemorrhage",
    name: "高血压性脑出血",
    course: "chronic",
    dept: "神经外科",
    site: "颅腔 · 右侧基底节区",
    triage: 5,
    hidden: false,
    vitals: { gcs: -5, sbp: 55, dbp: 30, icp: 30, brain: -40, pupil: -15, emesis: 30 },
    labs: { glucose: 10.8, wbc: 12.4, plt: 198, inr: 1.1, creatinine: 104, hb: 138 },
    exam: { ct: "右侧基底节区高密度血肿约 35ml，中线结构左移 8mm", mri: "血肿周围水肿带形成" },
    symptoms: [
      { name: "突发剧烈头痛伴呕吐", mode: "问诊", t: 0 },
      { name: "左侧肢体偏瘫、意识模糊", mode: "视诊", t: 0 },
      { name: "喷射性呕吐、血压显著升高", mode: "视诊", t: 120 },
      { name: "右侧瞳孔较左侧偏小后扩大", mode: "视诊", t: 600 },
      { name: "颈项强直", mode: "触诊", t: 300 }
    ],
    stages: [
      { t: 0, label: "超急性出血期", changes: { icp: 20, gcs: -3, sbp: 30 }, log: "血肿形成，颅内压升高" },
      { t: 600, label: "血肿扩大期", changes: { icp: 20, brain: -20, gcs: -4, emesis: 20 }, log: "血肿扩大压迫周围结构" },
      { t: 1800, label: "脑疝前期", changes: { icp: 25, pupil: -15, gcs: -6 }, log: "钩回疝形成，瞳孔不等大" },
      { t: 2700, label: "脑疝期", changes: { icp: 50, pupil: 4, rhythm: "asystole" }, lethal: true, log: "脑干受压致呼吸心跳停止" }
    ],
    treat: [
      { type: "drug", id: "mannitol", need: true, note: "快速静滴脱水降颅压" },
      { type: "drug", id: "noradrenaline", need: false, note: "血压过低时维持脑灌注压" },
      { type: "drug", id: "ondansetron", need: false, note: "控制呕吐，避免颅压进一步升高" },
      { type: "surgery", proc: "decompression", site: "cranium", need: true, note: "血肿量大或脑疝倾向时开颅减压清除血肿" }
    ],
    harm: [
      { id: "heparin", msg: "误认为缺血性卒中而抗凝，血肿急剧扩大" },
      { id: "aspirin", msg: "抗血小板加重活动性出血" }
    ],
    lethalAfter: 1800,
    needSurgery: true,
    note: "平稳降压、脱水降颅压，血肿量大者尽早手术"
  },
  {
    id: "subarachnoid_hemorrhage",
    name: "蛛网膜下腔出血",
    dept: "神经外科",
    site: "颅腔 · 脑底蛛网膜下腔",
    triage: 5,
    hidden: true,
    vitals: { gcs: -3, sbp: 40, hr: 20, icp: 25, pain: 70, emesis: 25 },
    labs: { wbc: 14.2, glucose: 9.2, plt: 205, inr: 1.0, creatinine: 98, k: 4.0 },
    exam: { ct: "脑底池及双侧外侧裂高密度影", mri: "蛛网膜下腔异常信号", us: "经颅多普勒示大脑中动脉血流增快" },
    symptoms: [
      { name: "突发炸裂样剧烈头痛", mode: "问诊", t: 0 },
      { name: "呕吐、面色苍白、大汗", mode: "视诊", t: 0 },
      { name: "颈项强直、凯尔尼格征阳性", mode: "触诊", t: 300 },
      { name: "一过性意识丧失", mode: "问诊", t: 60 },
      { name: "眼底玻璃体膜下出血", mode: "视诊", t: 600 }
    ],
    stages: [
      { t: 0, label: "出血急性期", changes: { icp: 22, pain: 40, sbp: 30 }, log: "动脉瘤破裂，颅内压骤升" },
      { t: 600, label: "脑血管痉挛期", changes: { brain: -20, gcs: -3, icp: 10 }, log: "血性脑脊液刺激血管痉挛" },
      { t: 1800, label: "再出血期", changes: { icp: 30, gcs: -5, pupil: -10 }, log: "动脉瘤再破裂，病情急转直下" },
      { t: 2700, label: "脑疝期", changes: { icp: 50, pupil: 4, rhythm: "asystole" }, lethal: true, log: "颅内压失代偿致脑疝死亡" }
    ],
    treat: [
      { type: "drug", id: "nimodipine", need: true, note: "预防脑血管痉挛" },
      { type: "drug", id: "morphine", need: true, note: "充分镇痛，避免躁动诱发再出血" },
      { type: "drug", id: "mannitol", need: false, note: "颅内压增高时脱水" },
      { type: "surgery", proc: "embolization", site: "cranium", need: true, note: "尽早介入栓塞或夹闭动脉瘤" }
    ],
    harm: [
      { id: "heparin", msg: "误当脑梗抗凝，导致动脉瘤再破裂大出血" }
    ],
    lethalAfter: 1800,
    needSurgery: true,
    note: "绝对卧床、镇痛通便，尽早处理动脉瘤防再出血"
  },
  {
    id: "status_epilepticus",
    name: "癫痫持续状态",
    dept: "神经内科",
    site: "颅腔 · 大脑皮质广泛",
    triage: 5,
    hidden: false,
    vitals: { gcs: -6, seizure: 60, spo2: -14, hr: 30, temp: 1.2, brain: -25, rr: 10 },
    labs: { lactate: 4.6, glucose: 6.2, ph: 7.26, k: 3.8, wbc: 13.0, ca: 2.0 },
    exam: { ecg: "窦性心动过速伴肌电干扰", ct: "未见明显出血或占位", mri: "双侧海马区稍肿胀" },
    symptoms: [
      { name: "四肢强直阵挛抽搐持续超过 5 分钟", mode: "视诊", t: 0 },
      { name: "牙关紧闭、口吐白沫、舌咬伤", mode: "视诊", t: 60 },
      { name: "尿失禁", mode: "问诊", t: 120 },
      { name: "意识丧失、呼之不应", mode: "问诊", t: 0 },
      { name: "抽搐转为细微而持续", mode: "视诊", t: 600 }
    ],
    stages: [
      { t: 0, label: "强直阵挛期", changes: { seizure: 60, spo2: -10, lactate: 2 }, log: "全身肌肉强直阵挛，耗氧剧增" },
      { t: 300, label: "非惊厥持续期", changes: { gcs: -6, brain: -20, temp: 1 }, log: "抽搐动作减弱但脑电持续放电" },
      { t: 1200, label: "脑损伤期", changes: { brain: -25, icp: 20, renal: -25 }, log: "兴奋性氨基酸毒性致神经元损伤" },
      { t: 2400, label: "终末期", changes: { rhythm: "asystole", gcs: -12 }, lethal: true, log: "高热、酸中毒与呼吸循环衰竭" }
    ],
    treat: [
      { type: "drug", id: "midazolam", need: true, note: "首剂 10mg 肌注或静脉，尽快终止发作" },
      { type: "drug", id: "dextrose_50", need: false, note: "低血糖所致者立即静推" },
      { type: "drug", id: "ketamine", need: false, note: "难治性持续状态持续泵入" },
      { type: "drug", id: "mannitol", need: false, note: "脑水肿明显时脱水" }
    ],
    harm: [
      { id: "ondansetron", msg: "只顾止吐未终止发作，脑缺氧持续加重" },
      { id: "epinephrine", msg: "抽搐时误用肾上腺素，加重心动过速与心肌耗氧" }
    ],
    lethalAfter: 1800,
    needSurgery: false,
    note: "超过 5 分钟即按持续状态处理，边抢救边查血糖与病因"
  },
  {
    id: "purulent_meningitis",
    name: "化脓性脑膜炎",
    dept: "神经内科",
    site: "颅腔 · 脑膜及蛛网膜下腔",
    triage: 4,
    hidden: true,
    vitals: { temp: 2.4, hr: 24, gcs: -3, icp: 20, pain: 55, emesis: 30, sbp: 12 },
    labs: { wbc: 19.8, crp: 156, glucose: 3.1, na: 128, lactate: 3.0, plt: 168 },
    exam: { ct: "脑沟稍模糊，未见明确占位", mri: "脑膜强化", pathology: "脑脊液涂片见革兰阳性双球菌，中性粒细胞增多" },
    symptoms: [
      { name: "高热、剧烈头痛", mode: "问诊", t: 0 },
      { name: "喷射性呕吐、畏光", mode: "问诊", t: 60 },
      { name: "颈项强直、克氏征阳性", mode: "触诊", t: 0 },
      { name: "皮肤可见瘀点瘀斑", mode: "视诊", t: 300 },
      { name: "嗜睡、逐渐昏迷", mode: "视诊", t: 900 }
    ],
    stages: [
      { t: 0, label: "菌血症期", changes: { temp: 2, hr: 18, gcs: -1 }, log: "病原菌入血并侵犯脑膜" },
      { t: 900, label: "脑膜炎症期", changes: { icp: 20, gcs: -4, emesis: 20 }, log: "脑膜渗出，颅内压升高" },
      { t: 2400, label: "脑水肿期", changes: { icp: 20, brain: -25, na: -6 }, log: "血管源性水肿、抗利尿激素异常分泌" },
      { t: 3600, label: "脑疝期", changes: { icp: 30, pupil: 3.5, rhythm: "asystole" }, lethal: true, log: "颅内压失代偿致脑疝" }
    ],
    treat: [
      { type: "drug", id: "ceftriaxone", need: true, note: "足量静脉给药，必要时联合万古霉素" },
      { type: "drug", id: "hydrocortisone", need: false, note: "肺炎链球菌脑膜炎早期加用地塞米松类激素" },
      { type: "drug", id: "mannitol", need: false, note: "颅内压增高时脱水" },
      { type: "surgery", proc: "drainage", site: "cranium", need: false, note: "脑室积脓或梗阻性脑积水时引流" }
    ],
    harm: [
      { id: "ibuprofen", msg: "退热掩盖病情并干扰炎症判断，延误抗菌治疗" }
    ],
    lethalAfter: 3000,
    needSurgery: false,
    note: "怀疑即经验性抗菌，不要等腰穿结果而延误治疗"
  },
  {
    id: "brain_herniation",
    name: "颅内高压危象/脑疝",
    dept: "神经外科",
    site: "颅腔 · 小脑幕切迹",
    triage: 5,
    hidden: false,
    vitals: { gcs: -8, icp: 55, pupil: -30, sbp: 45, hr: -20, rr: -8, brain: -50, emesis: 30 },
    labs: { glucose: 11.2, na: 150, k: 3.6, wbc: 14.0, lactate: 3.2, ph: 7.30 },
    exam: { ct: "脑沟消失、脑室受压，中线结构明显移位", mri: "弥漫性脑肿胀伴钩回疝", us: "视神经鞘直径增宽" },
    symptoms: [
      { name: "剧烈头痛、频繁喷射性呕吐", mode: "问诊", t: 0 },
      { name: "意识由嗜睡进展为昏迷", mode: "视诊", t: 0 },
      { name: "患侧瞳孔散大、对光反射消失", mode: "视诊", t: 60 },
      { name: "血压升高伴心率减慢、呼吸不规则", mode: "监护", t: 120 },
      { name: "去大脑强直姿势", mode: "视诊", t: 300 }
    ],
    stages: [
      { t: 0, label: "颅内压增高期", changes: { icp: 30, gcs: -4, emesis: 20 }, log: "脑水肿加重，颅内压显著升高" },
      { t: 300, label: "钩回疝期", changes: { pupil: -25, gcs: -5, icp: 15 }, log: "颞叶钩回疝压迫动眼神经" },
      { t: 720, label: "脑干受压期", changes: { gcs: -6, rr: -10, hr: -20 }, log: "脑干功能进行性丧失" },
      { t: 1080, label: "终末期", changes: { rhythm: "asystole", pupil: 5 }, lethal: true, log: "枕骨大孔疝致呼吸心跳停止" }
    ],
    treat: [
      { type: "drug", id: "mannitol", need: true, note: "快速静滴 125ml 脱水降颅压" },
      { type: "drug", id: "midazolam", need: false, note: "控制躁动与抽搐，降低脑代谢" },
      { type: "drug", id: "noradrenaline", need: false, note: "维持脑灌注压" },
      { type: "surgery", proc: "decompression", site: "cranium", need: true, note: "急诊去骨瓣减压或脑室外引流" }
    ],
    harm: [
      { id: "furosemide", msg: "仅用利尿而不脱水降颅压，脑疝迅速进展" },
      { id: "ketamine", msg: "未控制颅内压时使用可升高颅压的药物" }
    ],
    lethalAfter: 720,
    needSurgery: true,
    note: "头高 30 度、脱水降颅压、保持通气，尽快减压"
  },
  {
    id: "organophosphate_poisoning",
    name: "急性有机磷农药中毒",
    dept: "急诊科",
    site: "颈部 · 副交感神经节及胆碱能突触",
    triage: 5,
    hidden: true,
    vitals: { hr: -25, rr: 8, spo2: -18, secretions: 70, bronchospasm: 40, gcs: -4, pupil: -25, emesis: 40 },
    labs: { wbc: 15.6, glucose: 8.8, ph: 7.26, paco2: 58, k: 3.4, lactate: 3.4 },
    exam: { xray: "双肺渗出性改变", ecg: "窦性心动过缓伴 QT 延长" },
    symptoms: [
      { name: "接触农药后流涎、大汗、流泪", mode: "视诊", t: 0 },
      { name: "恶心呕吐、腹痛腹泻", mode: "问诊", t: 60 },
      { name: "双侧瞳孔缩小呈针尖样", mode: "视诊", t: 0 },
      { name: "双肺满布湿啰音、口鼻大量分泌物", mode: "听诊", t: 0 },
      { name: "肌肉纤维束颤动", mode: "视诊", t: 300 },
      { name: "呼吸肌无力、口唇发绀", mode: "视诊", t: 900 }
    ],
    stages: [
      { t: 0, label: "胆碱能兴奋期", changes: { secretions: 50, pupil: -20, hr: -20, rr: 6 }, log: "毒蕈碱样症状突出，腺体分泌亢进" },
      { t: 600, label: "烟碱样症状期", changes: { seizure: 20, rr: -10, spo2: -15 }, log: "肌束震颤与呼吸肌麻痹" },
      { t: 1800, label: "呼吸衰竭期", changes: { spo2: -25, gcs: -5, paco2: 20 }, log: "气道分泌物与呼吸肌无力致窒息" },
      { t: 2700, label: "终末期", changes: { rhythm: "asystole", ph: -0.2 }, lethal: true, log: "呼吸循环衰竭死亡" }
    ],
    treat: [
      { type: "drug", id: "atropine", need: true, note: "早期足量反复给药，达阿托品化" },
      { type: "drug", id: "pralidoxime", need: true, note: "胆碱酯酶复能剂尽早使用" },
      { type: "drug", id: "midazolam", need: false, note: "控制肌束震颤与抽搐" },
      { type: "surgery", proc: "lavage", site: "stomach", need: false, note: "口服中毒 6 小时内洗胃" }
    ],
    harm: [
      { id: "morphine", msg: "抑制呼吸中枢并加重瞳孔缩小，导致误判与呼吸停止" },
      { id: "epinephrine", msg: "心率慢即用肾上腺素，加重心律失常" }
    ],
    lethalAfter: 1800,
    needSurgery: false,
    note: "阿托品化加复能剂，清洗皮肤、洗胃并保持气道通畅"
  },
  {
    id: "opioid_overdose",
    name: "阿片类药物急性中毒",
    dept: "急诊科",
    site: "颅腔 · 脑干呼吸中枢",
    triage: 5,
    hidden: false,
    vitals: { rr: -12, spo2: -22, gcs: -7, pupil: -30, hr: -12, paco2: 22, pao2: -25 },
    labs: { ph: 7.22, paco2: 62, lactate: 2.6, glucose: 5.6, k: 4.0 },
    exam: { xray: "双肺纹理减少", ecg: "窦性心动过缓" },
    symptoms: [
      { name: "服药后嗜睡、呼之不应", mode: "问诊", t: 0 },
      { name: "双侧瞳孔针尖样缩小", mode: "视诊", t: 0 },
      { name: "呼吸浅慢至 4-6 次/分", mode: "监护", t: 60 },
      { name: "皮肤湿冷、口唇发绀", mode: "视诊", t: 120 },
      { name: "针尖样瞳孔、呼吸抑制、昏迷三联征", mode: "问诊", t: 0 }
    ],
    stages: [
      { t: 0, label: "呼吸抑制期", changes: { rr: -8, spo2: -14, gcs: -4 }, log: "呼吸中枢受抑，通气量下降" },
      { t: 300, label: "缺氧昏迷期", changes: { spo2: -22, gcs: -6, paco2: 18 }, log: "二氧化碳蓄积，意识进一步丧失" },
      { t: 900, label: "呼吸衰竭期", changes: { rr: -14, spo2: -30, ph: -0.15 }, log: "严重呼吸性酸中毒" },
      { t: 1500, label: "终末期", changes: { rhythm: "asystole", rr: -18 }, lethal: true, log: "呼吸停止继发心跳停止" }
    ],
    treat: [
      { type: "drug", id: "naloxone", need: true, note: "0.4mg 静脉推注并酌情重复或泵入" },
      { type: "drug", id: "dextrose_50", need: false, note: "排查并纠正合并低血糖" },
      { type: "drug", id: "noradrenaline", need: false, note: "循环不稳定时短期支持" },
      { type: "surgery", proc: "lavage", site: "stomach", need: false, note: "大量口服 1 小时内洗胃" }
    ],
    harm: [
      { id: "flumazenil", msg: "未辨明复合中毒即用氟马西尼，可诱发抽搐" },
      { id: "midazolam", msg: "将昏迷误判为躁动而镇静，直接导致呼吸停止" }
    ],
    lethalAfter: 1200,
    needSurgery: false,
    note: "通气支持优先，纳洛酮拮抗并警惕再镇静"
  },
  {
    id: "acute_appendicitis",
    name: "急性阑尾炎",
    dept: "普通外科",
    site: "右下腹 · 阑尾",
    triage: 3,
    hidden: false,
    vitals: { temp: 1.4, hr: 16, pain: 45, gi: 25, sbp: 5, wbc: 5 },
    labs: { wbc: 14.8, crp: 68, glucose: 6.4, k: 3.9, creatinine: 88, plt: 236 },
    exam: { us: "阑尾增粗直径 9mm，周围少量渗出", ct: "阑尾增粗伴周围脂肪间隙模糊，可见粪石" },
    symptoms: [
      { name: "转移性右下腹痛，始于脐周", mode: "问诊", t: 0 },
      { name: "恶心呕吐、食欲减退", mode: "问诊", t: 120 },
      { name: "麦氏点固定压痛、反跳痛", mode: "触诊", t: 360 },
      { name: "腰大肌征阳性", mode: "触诊", t: 600 },
      { name: "低热", mode: "问诊", t: 480 }
    ],
    stages: [
      { t: 0, label: "单纯性阑尾炎", changes: { pain: 30, gi: 15, temp: 0.8 }, log: "阑尾腔梗阻，管壁轻度炎症" },
      { t: 3600, label: "化脓性阑尾炎", changes: { temp: 1.2, wbc: 6, pain: 25 }, log: "腔内积脓，浆膜面脓性渗出" },
      { t: 7200, label: "坏疽穿孔期", changes: { temp: 1.5, gi: 25, sbp: -20 }, log: "管壁坏死穿孔，局部腹膜炎" },
      { t: 10800, label: "弥漫性腹膜炎期", changes: { sbp: -35, gcs: -3, lactate: 3, renal: -30, rhythm: "asystole" }, lethal: true, log: "感染性休克危及生命" }
    ],
    treat: [
      { type: "drug", id: "ceftriaxone", need: true, note: "联合甲硝唑覆盖肠道菌群" },
      { type: "drug", id: "ketamine", need: false, note: "术前麻醉诱导" },
      { type: "surgery", proc: "excision", site: "appendix", need: true, note: "腹腔镜阑尾切除术是根治手段" }
    ],
    harm: [
      { id: "morphine", msg: "未确诊即用大剂量镇痛药掩盖压痛与反跳痛，延误诊断" },
      { id: "ondansetron", msg: "仅止吐观察，穿孔后形成腹膜炎" }
    ],
    lethalAfter: 7200,
    needSurgery: true,
    note: "转移性右下腹痛加麦氏点压痛，尽早手术"
  },
  {
    id: "acute_cholecystitis",
    name: "急性胆囊炎",
    dept: "肝胆外科",
    site: "右上腹 · 胆囊",
    triage: 3,
    hidden: false,
    vitals: { temp: 1.6, hr: 18, pain: 50, gi: 30, sbp: 8, wbc: 4 },
    labs: { wbc: 15.2, crp: 92, alt: 86, bilirubin: 32, glucose: 7.2, k: 3.8 },
    exam: { us: "胆囊增大，壁厚 5mm 呈双边征，内见强回声伴声影", ct: "胆囊壁增厚水肿，周围脂肪间隙模糊" },
    symptoms: [
      { name: "进食油腻后右上腹持续疼痛", mode: "问诊", t: 0 },
      { name: "疼痛向右肩背部放射", mode: "问诊", t: 60 },
      { name: "墨菲征阳性", mode: "触诊", t: 120 },
      { name: "恶心呕吐、发热", mode: "问诊", t: 240 },
      { name: "右上腹肌紧张", mode: "触诊", t: 600 }
    ],
    stages: [
      { t: 0, label: "急性单纯性胆囊炎", changes: { pain: 40, temp: 1, gi: 20 }, log: "胆囊管梗阻，胆汁淤积" },
      { t: 3600, label: "化脓性胆囊炎", changes: { temp: 1.5, wbc: 5, pain: 20 }, log: "胆囊积脓，感染加重" },
      { t: 7200, label: "坏疽穿孔期", changes: { sbp: -30, gi: 25, lactate: 3 }, log: "囊壁坏死穿孔形成胆汁性腹膜炎" },
      { t: 10800, label: "感染性休克期", changes: { sbp: -50, renal: -40, gcs: -4, rhythm: "asystole" }, lethal: true, log: "脓毒症休克致多器官衰竭" }
    ],
    treat: [
      { type: "drug", id: "ceftriaxone", need: true, note: "联合甲硝唑抗感染" },
      { type: "drug", id: "morphine", need: false, note: "明确诊断后镇痛解痉" },
      { type: "drug", id: "ondansetron", need: false, note: "止吐减轻胆道压力" },
      { type: "surgery", proc: "excision", site: "biliary", need: true, note: "腹腔镜胆囊切除，重症可先行引流" }
    ],
    harm: [
      { id: "ondansetron", msg: "仅反复止吐镇痛而不抗感染，掩盖穿孔征象" }
    ],
    lethalAfter: 7200,
    needSurgery: true,
    note: "禁食解痉抗感染，72 小时内手术更安全"
  },
  {
    id: "choledocholithiasis",
    name: "胆总管结石梗阻伴急性胆管炎",
    dept: "肝胆外科",
    site: "十二指肠 · 胆总管末端及十二指肠乳头",
    triage: 4,
    hidden: true,
    vitals: { temp: 2.0, hr: 22, sbp: -15, pain: 55, gi: 25, hepatic: -20 },
    labs: { wbc: 16.4, bilirubin: 128, alt: 186, amylase: 420, crp: 118, k: 3.6, creatinine: 106 },
    exam: { us: "胆总管扩张 12mm，内见强回声团", ct: "胆总管末端结石伴肝内外胆管扩张", mri: "MRCP 示胆总管末端充盈缺损" },
    symptoms: [
      { name: "右上腹绞痛阵发性加重", mode: "问诊", t: 0 },
      { name: "寒战高热", mode: "问诊", t: 120 },
      { name: "皮肤巩膜黄染", mode: "视诊", t: 600 },
      { name: "右上腹压痛、肝区叩击痛", mode: "叩诊", t: 60 },
      { name: "尿色加深呈浓茶样", mode: "问诊", t: 900 }
    ],
    stages: [
      { t: 0, label: "胆道梗阻期", changes: { pain: 40, gi: 20 }, log: "结石嵌顿，胆道压力升高" },
      { t: 1800, label: "急性胆管炎期", changes: { temp: 2, hr: 20, hepatic: -25 }, log: "细菌逆行感染，夏科三联征出现" },
      { t: 5400, label: "化脓性胆管炎期", changes: { sbp: -30, gcs: -3, renal: -30, lactate: 3 }, log: "胆道高压致脓毒症，雷诺五联征" },
      { t: 9000, label: "感染性休克期", changes: { sbp: -55, renal: -45, rhythm: "asystole" }, lethal: true, log: "脓毒性休克致循环衰竭" }
    ],
    treat: [
      { type: "drug", id: "ceftriaxone", need: true, note: "联合甲硝唑，覆盖革兰阴性菌与厌氧菌" },
      { type: "drug", id: "noradrenaline", need: false, note: "休克时维持血压" },
      { type: "drug", id: "ondansetron", need: false, note: "止吐缓解症状" },
      { type: "surgery", proc: "endoscopy", site: "biliary", need: true, note: "急诊 ERCP 取石并鼻胆管引流" }
    ],
    harm: [
      { id: "morphine", msg: "单用吗啡使奥狄括约肌痉挛，胆道压力更高" }
    ],
    lethalAfter: 5400,
    needSurgery: true,
    note: "夏科三联征提示胆管炎，急诊 ERCP 减压是关键"
  },
  {
    id: "acute_pancreatitis",
    name: "急性重症胰腺炎",
    dept: "消化内科",
    site: "胰腺 · 胰体尾部及胰周",
    triage: 4,
    hidden: true,
    vitals: { hr: 26, temp: 1.2, sbp: -18, pain: 65, gi: 35, rr: 8, urine: -35 },
    labs: { amylase: 1850, lipase: 2400, wbc: 17.8, crp: 210, glucose: 11.4, ca: 1.82, lactate: 3.2 },
    exam: { ct: "胰腺弥漫肿胀，胰周大量渗出，可见脂肪坏死", us: "胰腺体积增大，回声减低，胰管稍扩张", xray: "左上腹肠管积气，可见结肠切断征" },
    symptoms: [
      { name: "暴饮暴食后上腹剧痛，向腰背部带状放射", mode: "问诊", t: 0 },
      { name: "弯腰抱膝位可稍缓解", mode: "视诊", t: 120 },
      { name: "频繁恶心呕吐，吐后疼痛不减轻", mode: "问诊", t: 180 },
      { name: "上腹压痛、腹胀，肠鸣音减弱", mode: "听诊", t: 600 },
      { name: "腰肋部皮肤瘀斑", mode: "视诊", t: 3600 }
    ],
    stages: [
      { t: 0, label: "胰酶激活期", changes: { pain: 50, gi: 25, hr: 20 }, log: "胰酶自身消化，胰腺水肿" },
      { t: 3600, label: "全身炎症反应期", changes: { sbp: -25, lactate: 3, rr: 10, urine: -30 }, log: "炎症介质释放，毛细血管渗漏" },
      { t: 10800, label: "器官衰竭期", changes: { renal: -45, spo2: -15, ca: -0.3, gcs: -4 }, log: "肺肾等多器官功能障碍" },
      { t: 21600, label: "终末期", changes: { rhythm: "asystole", sbp: -60 }, lethal: true, log: "感染性坏死与器官衰竭致死" }
    ],
    treat: [
      { type: "drug", id: "ondansetron", need: true, note: "止吐并配合禁食胃肠减压" },
      { type: "drug", id: "noradrenaline", need: false, note: "休克时维持灌注" },
      { type: "drug", id: "ceftriaxone", need: false, note: "合并感染性坏死时抗感染" },
      { type: "surgery", proc: "drainage", site: "pancreas", need: false, note: "感染性坏死液化后穿刺或内镜引流" }
    ],
    harm: [
      { id: "morphine", msg: "吗啡使奥狄括约肌痉挛，加重胰管高压" },
      { id: "furosemide", msg: "容量不足时强力利尿，加重低血压与肾损伤" }
    ],
    lethalAfter: 14400,
    needSurgery: false,
    note: "禁食、液体复苏、镇痛抑酶，感染性坏死才需干预"
  },
  {
    id: "upper_gi_bleeding",
    name: "上消化道大出血（十二指肠球部溃疡）",
    dept: "消化内科",
    site: "十二指肠 · 球部后壁",
    triage: 5,
    hidden: false,
    vitals: { hr: 42, sbp: -45, dbp: -25, map: -30, hb: -45, volume: -40, spo2: -6, gi: 40 },
    labs: { hb: 68, plt: 168, inr: 1.3, creatinine: 128, lactate: 3.8, glucose: 8.2 },
    exam: { endoscopy: "十二指肠球部后壁溃疡伴喷射性出血，Forrest Ia", us: "下腔静脉塌陷，提示低血容量" },
    symptoms: [
      { name: "呕大量咖啡渣样物及鲜血", mode: "视诊", t: 0 },
      { name: "解柏油样黑便", mode: "问诊", t: 300 },
      { name: "头晕、心慌、出冷汗", mode: "问诊", t: 0 },
      { name: "皮肤苍白湿冷、脉搏细速", mode: "视诊", t: 60 },
      { name: "肠鸣音活跃", mode: "听诊", t: 120 },
      { name: "血压下降、尿量减少", mode: "监护", t: 600 }
    ],
    stages: [
      { t: 0, label: "活动性出血期", changes: { hb: -25, volume: -25, hr: 25, sbp: -20 }, log: "溃疡基底部血管破裂持续出血" },
      { t: 600, label: "失代偿期", changes: { sbp: -45, hb: -30, urine: -40 }, log: "血容量不足，组织灌注下降" },
      { t: 1800, label: "失血性休克期", changes: { sbp: -65, lactate: 4, gcs: -4, renal: -40 }, log: "休克加深，器官缺血" },
      { t: 3000, label: "终末期", changes: { rhythm: "pea", hb: -60 }, lethal: true, log: "循环衰竭死亡" }
    ],
    treat: [
      { type: "drug", id: "omeprazole", need: true, note: "静脉大剂量抑酸，稳定血痂" },
      { type: "drug", id: "tranexamic_acid", need: false, note: "辅助止血，注意血栓风险" },
      { type: "drug", id: "noradrenaline", need: false, note: "液体复苏后仍低血压时使用" },
      { type: "surgery", proc: "endoscopy", site: "duodenum", need: true, note: "急诊内镜下钛夹或注射止血" }
    ],
    harm: [
      { id: "aspirin", msg: "继续抗血小板或使用非甾体药，出血难以停止" },
      { id: "furosemide", msg: "未评估容量即利尿，加重低血压" }
    ],
    lethalAfter: 2400,
    needSurgery: true,
    note: "先复苏后内镜，输血补液与抑酸并重"
  },
  {
    id: "gastric_perforation",
    name: "急性胃穿孔",
    dept: "普通外科",
    site: "胃 · 胃窦前壁",
    triage: 5,
    hidden: false,
    vitals: { hr: 30, sbp: -25, pain: 85, gi: 45, temp: 1.0, rr: 8, volume: -20 },
    labs: { wbc: 18.2, crp: 156, lactate: 3.6, glucose: 9.0, k: 3.5, creatinine: 118 },
    exam: { xray: "膈下游离气体，呈新月形透亮影", ct: "腹腔游离气体伴胃壁增厚、腹腔积液", us: "腹腔少量积液，肠管扩张" },
    symptoms: [
      { name: "突发上腹刀割样剧痛", mode: "问诊", t: 0 },
      { name: "全腹压痛、反跳痛、板状腹", mode: "触诊", t: 60 },
      { name: "肝浊音界缩小或消失", mode: "叩诊", t: 120 },
      { name: "面色苍白、出冷汗", mode: "视诊", t: 0 },
      { name: "肠鸣音消失", mode: "听诊", t: 300 }
    ],
    stages: [
      { t: 0, label: "化学性腹膜炎期", changes: { pain: 60, gi: 35, hr: 25 }, log: "胃酸外溢引起剧烈化学刺激" },
      { t: 3600, label: "细菌性腹膜炎期", changes: { temp: 1.5, wbc: 6, sbp: -25, gi: 20 }, log: "细菌繁殖，腹腔感染加重" },
      { t: 10800, label: "脓毒症期", changes: { sbp: -45, lactate: 4, renal: -40, gcs: -4 }, log: "弥漫性腹膜炎致脓毒性休克" },
      { t: 14400, label: "终末期", changes: { rhythm: "asystole", sbp: -70 }, lethal: true, log: "多器官衰竭死亡" }
    ],
    treat: [
      { type: "drug", id: "ceftriaxone", need: true, note: "联合甲硝唑覆盖腹腔菌群" },
      { type: "drug", id: "ketamine", need: false, note: "术前麻醉诱导" },
      { type: "drug", id: "noradrenaline", need: false, note: "休克时维持血压" },
      { type: "surgery", proc: "suture", site: "stomach", need: true, note: "急诊穿孔修补加腹腔冲洗引流" }
    ],
    harm: [
      { id: "morphine", msg: "未诊断即强力镇痛，掩盖板状腹等腹膜炎体征" },
      { id: "ondansetron", msg: "仅止吐观察，腹膜炎迅速扩散" }
    ],
    lethalAfter: 7200,
    needSurgery: true,
    note: "膈下游离气体是铁证，禁食胃肠减压并急诊手术"
  },
  {
    id: "variceal_bleeding",
    name: "肝硬化食管胃底静脉曲张破裂出血",
    course: "chronic",
    dept: "消化内科",
    site: "食管 · 食管下段曲张静脉",
    triage: 5,
    hidden: false,
    vitals: { hr: 38, sbp: -40, hb: -40, volume: -35, gi: 45, gcs: -2, plt: -40, inr: 1.6 },
    labs: { hb: 74, plt: 62, inr: 1.8, bilirubin: 68, alt: 96, creatinine: 132, lactate: 3.4 },
    exam: { endoscopy: "食管下段四条曲张静脉呈串珠样，一处喷射性出血", us: "肝硬化、门静脉增宽、脾大伴腹水" },
    symptoms: [
      { name: "突发大量呕鲜血", mode: "视诊", t: 0 },
      { name: "腹胀、腹壁静脉曲张", mode: "视诊", t: 0 },
      { name: "皮肤巩膜黄染、蜘蛛痣", mode: "视诊", t: 0 },
      { name: "黑便、头晕心悸", mode: "问诊", t: 120 },
      { name: "意识模糊、扑翼样震颤", mode: "视诊", t: 1800 }
    ],
    stages: [
      { t: 0, label: "曲张静脉破裂期", changes: { hb: -30, volume: -25, hr: 25 }, log: "门脉高压致曲张静脉破裂大出血" },
      { t: 900, label: "失血性休克期", changes: { sbp: -45, gcs: -2, urine: -40 }, log: "血容量骤减，脑肾灌注不足" },
      { t: 3600, label: "肝性脑病期", changes: { gcs: -5, gi: 20, renal: -35 }, log: "肠道积血产氨，肝功能失代偿" },
      { t: 5400, label: "终末期", changes: { rhythm: "pea", hb: -55 }, lethal: true, log: "失血与肝衰竭致循环崩溃" }
    ],
    treat: [
      { type: "drug", id: "octreotide", need: true, note: "降低门脉压力，持续泵入" },
      { type: "drug", id: "ceftriaxone", need: true, note: "预防性抗感染降低再出血与病死率" },
      { type: "drug", id: "lactulose", need: false, note: "减少肠道氨吸收，防治肝性脑病" },
      { type: "surgery", proc: "endoscopy", site: "esophagus", need: true, note: "急诊内镜下套扎或硬化剂注射" }
    ],
    harm: [
      { id: "aspirin", msg: "继续抗血小板与饮酒，出血无法控制" },
      { id: "mannitol", msg: "合并肝性脑病时误用脱水药，加重肾损伤与电解质紊乱" }
    ],
    lethalAfter: 2400,
    needSurgery: true,
    note: "限制性输血目标 Hb 70-90g/L，降门脉压+内镜套扎"
  },
  {
    id: "intestinal_obstruction",
    name: "急性肠梗阻",
    dept: "普通外科",
    site: "空肠回肠 · 回肠末端",
    triage: 4,
    hidden: false,
    vitals: { hr: 22, sbp: -12, gi: 50, pain: 50, temp: 0.6, urine: -25, rr: 6 },
    labs: { wbc: 12.6, k: 3.2, na: 132, creatinine: 126, lactate: 2.2, amylase: 180 },
    exam: { xray: "小肠扩张伴多发气液平面，呈阶梯状", ct: "回肠末端管腔狭窄，近端肠管扩张积气积液，移行带明确", us: "肠管扩张伴往返蠕动" },
    symptoms: [
      { name: "阵发性腹部绞痛", mode: "问诊", t: 0 },
      { name: "频繁呕吐，呕吐后腹痛稍缓解", mode: "问诊", t: 300 },
      { name: "腹胀、停止排气排便", mode: "问诊", t: 600 },
      { name: "腹部可见肠型及蠕动波", mode: "视诊", t: 900 },
      { name: "肠鸣音亢进呈气过水声", mode: "听诊", t: 300 }
    ],
    stages: [
      { t: 0, label: "单纯性梗阻期", changes: { gi: 40, pain: 35, hr: 15 }, log: "肠腔梗阻，近端肠管扩张" },
      { t: 3600, label: "肠壁水肿期", changes: { gi: 25, k: -0.6, urine: -30, sbp: -15 }, log: "肠壁静脉回流受阻，体液丢失" },
      { t: 10800, label: "绞窄倾向期", changes: { sbp: -30, lactate: 3.5, temp: 1.2 }, log: "肠壁血运障碍，毒素吸收" },
      { t: 18000, label: "肠坏死穿孔期", changes: { sbp: -55, gi: 30, rhythm: "asystole" }, lethal: true, log: "肠坏死穿孔致感染性休克" }
    ],
    treat: [
      { type: "drug", id: "ceftriaxone", need: false, note: "联合甲硝唑预防肠壁细菌移位" },
      { type: "drug", id: "ondansetron", need: false, note: "止吐减轻呕吐" },
      { type: "drug", id: "ketamine", need: false, note: "手术麻醉诱导" },
      { type: "surgery", proc: "exploration", site: "intestine", need: true, note: "剖腹探查解除梗阻，坏死肠段切除吻合" }
    ],
    harm: [
      { id: "morphine", msg: "强效镇痛掩盖绞窄体征，且在腹胀时不宜使用" },
      { id: "lactulose", msg: "完全性梗阻时使用泻剂加重肠管扩张与穿孔风险" }
    ],
    lethalAfter: 14400,
    needSurgery: true,
    note: "胃肠减压补液纠正电解质，绞窄征象出现立即手术"
  },
  {
    id: "strangulated_hernia",
    name: "嵌顿绞窄性腹股沟疝",
    dept: "普通外科",
    site: "腹壁疝 · 右侧腹股沟区",
    triage: 5,
    hidden: false,
    vitals: { hr: 28, sbp: -20, pain: 70, gi: 45, temp: 1.2, rr: 6 },
    labs: { wbc: 16.8, lactate: 3.4, k: 3.3, creatinine: 118, crp: 132, glucose: 7.8 },
    exam: { us: "右侧腹股沟区疝内容物不可回纳，肠壁增厚、血流信号减弱", ct: "右侧腹股沟疝嵌顿，近端小肠扩张，疝囊内肠壁强化减弱", xray: "小肠扩张伴气液平面" },
    symptoms: [
      { name: "右侧腹股沟区突发包块并剧痛", mode: "问诊", t: 0 },
      { name: "平卧或按压后包块不能回纳", mode: "触诊", t: 0 },
      { name: "腹胀、呕吐、停止排气排便", mode: "问诊", t: 600 },
      { name: "包块处皮肤红肿、触痛明显", mode: "视诊", t: 1800 },
      { name: "肠鸣音亢进后转为消失", mode: "听诊", t: 3600 }
    ],
    stages: [
      { t: 0, label: "嵌顿期", changes: { pain: 50, gi: 35, hr: 20 }, log: "疝内容物嵌顿，肠管受压" },
      { t: 3600, label: "静脉回流障碍期", changes: { gi: 25, temp: 1, sbp: -18 }, log: "肠壁淤血水肿，渗液增多" },
      { t: 7200, label: "绞窄坏死期", changes: { sbp: -35, lactate: 4, gcs: -3 }, log: "动脉血供中断，肠壁坏死" },
      { t: 14400, label: "穿孔腹膜炎期", changes: { sbp: -60, rhythm: "asystole", gi: 25 }, lethal: true, log: "肠穿孔腹膜炎致休克死亡" }
    ],
    treat: [
      { type: "drug", id: "ceftriaxone", need: true, note: "联合甲硝唑覆盖肠道菌群" },
      { type: "drug", id: "ketamine", need: false, note: "麻醉诱导" },
      { type: "drug", id: "noradrenaline", need: false, note: "休克时维持血压" },
      { type: "surgery", proc: "resection", site: "abwall", need: true, note: "急诊手术松解嵌顿，坏死肠段切除吻合加疝修补" }
    ],
    harm: [
      { id: "morphine", msg: "用镇痛药后观察，绞窄肠管坏死穿孔" }
    ],
    lethalAfter: 10800,
    needSurgery: true,
    note: "嵌顿疝不能手法回纳，出现绞窄征象立即手术"
  },
  {
    id: "renal_colic",
    name: "输尿管结石致肾绞痛",
    dept: "泌尿外科",
    site: "输尿管 · 左侧输尿管中段",
    triage: 2,
    hidden: false,
    vitals: { hr: 20, pain: 80, sbp: 15, gi: 25, urine: -15 },
    labs: { creatinine: 102, wbc: 10.2, urine_rbc: 120, k: 4.1, na: 138, crp: 12 },
    exam: { ct: "左侧输尿管中段结石 6mm 伴近端输尿管扩张及肾盂积水", us: "左肾轻度积水，输尿管上段扩张", xray: "左侧输尿管走行区可疑致密影" },
    symptoms: [
      { name: "突发左腰部绞痛，沿输尿管向下腹放射", mode: "问诊", t: 0 },
      { name: "疼痛难忍、辗转不安、大汗", mode: "视诊", t: 60 },
      { name: "恶心呕吐", mode: "问诊", t: 300 },
      { name: "左肾区叩击痛阳性", mode: "叩诊", t: 0 },
      { name: "肉眼血尿", mode: "问诊", t: 600 }
    ],
    stages: [
      { t: 0, label: "急性绞痛期", changes: { pain: 70, gi: 20, hr: 15 }, log: "结石嵌顿，输尿管痉挛" },
      { t: 1800, label: "肾盂积水期", changes: { urine: -25, renal: -15, pain: -10 }, log: "上尿路梗阻，肾盂内压升高" },
      { t: 21600, label: "感染积水期", changes: { temp: 1.5, renal: -35, wbc: 5 }, log: "梗阻合并感染，肾功能受损" },
      { t: 43200, label: "脓肾期", changes: { sbp: -40, renal: -50, temp: 2, rhythm: "asystole" }, lethal: true, log: "梗阻性化脓性肾病致脓毒症" }
    ],
    treat: [
      { type: "drug", id: "ketorolac", need: true, note: "非甾体抗炎药为一线镇痛" },
      { type: "drug", id: "morphine", need: false, note: "NSAIDs 无效时联合阿片类" },
      { type: "drug", id: "ondansetron", need: false, note: "止吐缓解症状" },
      { type: "surgery", proc: "embolization", site: "ureter", need: false, note: "结石大于 6mm 或合并感染时输尿管镜碎石" }
    ],
    harm: [
      { id: "furosemide", msg: "误当肾衰大量利尿，加重梗阻侧肾盂高压与疼痛" }
    ],
    lethalAfter: 43200,
    needSurgery: false,
    note: "解痉镇痛为主，合并感染发热需急诊减压"
  },
  {
    id: "acute_pyelonephritis",
    name: "急性肾盂肾炎",
    dept: "泌尿外科",
    site: "肾脏 · 右侧肾盂肾实质",
    triage: 4,
    hidden: true,
    vitals: { temp: 2.2, hr: 26, sbp: -12, pain: 45, gi: 25, urine: -20, wbc: 6 },
    labs: { wbc: 17.4, crp: 148, creatinine: 132, urine_wbc: 80, k: 3.7, lactate: 2.8 },
    exam: { us: "右肾体积增大，皮髓质分界模糊，肾盂壁增厚", ct: "右肾强化减弱，肾周脂肪间隙模糊", pathology: "尿培养见大肠埃希菌" },
    symptoms: [
      { name: "寒战高热伴右侧腰痛", mode: "问诊", t: 0 },
      { name: "尿频尿急尿痛", mode: "问诊", t: 0 },
      { name: "右肾区叩击痛明显", mode: "叩诊", t: 60 },
      { name: "恶心呕吐、乏力", mode: "问诊", t: 300 },
      { name: "尿液浑浊有异味", mode: "视诊", t: 600 }
    ],
    stages: [
      { t: 0, label: "急性感染期", changes: { temp: 2, hr: 22, pain: 35 }, log: "细菌上行感染肾盂，高热寒战" },
      { t: 3600, label: "肾实质受累期", changes: { renal: -25, urine: -25, sbp: -20 }, log: "肾实质炎症，肾功能下降" },
      { t: 14400, label: "脓毒症期", changes: { sbp: -40, lactate: 4, gcs: -3, renal: -40 }, log: "感染播散致脓毒症" },
      { t: 28800, label: "肾脓肿期", changes: { sbp: -60, rhythm: "asystole", temp: 2.4 }, lethal: true, log: "肾脓肿破裂致脓毒性休克" }
    ],
    treat: [
      { type: "drug", id: "ceftriaxone", need: true, note: "静脉抗感染，依据尿培养调整" },
      { type: "drug", id: "noradrenaline", need: false, note: "合并休克时使用" },
      { type: "drug", id: "paracetamol", need: false, note: "退热对症，注意肝功能" },
      { type: "surgery", proc: "drainage", site: "kidney", need: false, note: "合并梗阻或肾脓肿时置管引流" }
    ],
    harm: [
      { id: "ibuprofen", msg: "肾灌注不足时使用非甾体药，诱发急性肾损伤" }
    ],
    lethalAfter: 21600,
    needSurgery: false,
    note: "留取尿培养后立即静脉抗感染，梗阻因素需解除"
  },
  {
    id: "acute_urinary_retention",
    name: "急性尿潴留",
    dept: "泌尿外科",
    site: "膀胱 · 膀胱颈及后尿道",
    triage: 4,
    hidden: false,
    vitals: { hr: 24, sbp: 30, pain: 65, gi: 20, urine: -90, k: 0.9, map: 20 },
    labs: { creatinine: 168, k: 5.4, na: 136, wbc: 11.2, crp: 34, ph: 7.32 },
    exam: { us: "膀胱极度充盈，残余尿约 900ml，前列腺体积增大", ct: "前列腺增生压迫后尿道，双肾轻度积水", xray: "膀胱区密度增高影" },
    symptoms: [
      { name: "下腹憋胀难忍、有尿意但排不出", mode: "问诊", t: 0 },
      { name: "下腹部膨隆，可触及充盈膀胱", mode: "触诊", t: 0 },
      { name: "烦躁不安、大汗", mode: "视诊", t: 60 },
      { name: "下腹叩诊浊音", mode: "叩诊", t: 0 },
      { name: "血压升高伴心率增快", mode: "监护", t: 120 }
    ],
    stages: [
      { t: 0, label: "急性充盈期", changes: { pain: 50, urine: -80, hr: 20 }, log: "膀胱过度充盈，交感兴奋" },
      { t: 1800, label: "膀胱高压期", changes: { renal: -25, k: 0.4, sbp: 10 }, log: "膀胱内压逆行传导，肾盂积水" },
      { t: 7200, label: "肾功能受损期", changes: { renal: -40, k: 0.8, urine: -95 }, log: "梗阻性肾病，电解质紊乱" },
      { t: 21600, label: "终末期", changes: { rhythm: "brady", k: 1.5, renal: -55 }, lethal: true, log: "高钾血症致缓慢心律失常与心搏停止" }
    ],
    treat: [
      { type: "surgery", proc: "drainage", site: "bladder", need: true, note: "立即导尿，失败则耻骨上膀胱穿刺造瘘" },
      { type: "drug", id: "ceftriaxone", need: false, note: "导尿前后预防尿路感染" },
      { type: "drug", id: "morphine", need: false, note: "明确诊断后镇痛" }
    ],
    harm: [
      { id: "furosemide", msg: "未解除梗阻即利尿，膀胱压更高并加重肾损伤" }
    ],
    lethalAfter: 18000,
    needSurgery: true,
    note: "首次导尿放尿不宜过快，防止膀胱出血与低血压"
  },
  {
    id: "testicular_torsion",
    name: "睾丸扭转",
    dept: "泌尿外科",
    site: "前列腺 · 阴囊精索",
    triage: 4,
    hidden: false,
    vitals: { hr: 22, pain: 75, gi: 35, temp: 0.6, sbp: 10 },
    labs: { wbc: 11.6, crp: 18, creatinine: 92, k: 4.0, na: 139, lactate: 1.8 },
    exam: { us: "右侧睾丸体积增大，血流信号明显减少，精索呈漩涡状", ct: "阴囊内容物肿胀伴精索增粗" },
    symptoms: [
      { name: "突发右侧阴囊剧痛，向腹股沟及下腹放射", mode: "问诊", t: 0 },
      { name: "恶心呕吐", mode: "问诊", t: 120 },
      { name: "患侧睾丸位置上抬、横位", mode: "视诊", t: 60 },
      { name: "托起阴囊疼痛不缓解", mode: "触诊", t: 120 },
      { name: "患侧阴囊红肿、皮温升高", mode: "视诊", t: 1800 }
    ],
    stages: [
      { t: 0, label: "精索扭转期", changes: { pain: 60, gi: 25 }, log: "精索扭转，静脉回流受阻" },
      { t: 3600, label: "动脉闭塞期", changes: { pain: 15, temp: 0.8, gi: 15 }, log: "动脉血供中断，睾丸开始缺血" },
      { t: 21600, label: "坏死期", changes: { temp: 1.2, wbc: 4, sbp: -15 }, log: "睾丸坏死，炎症波及全身" },
      { t: 86400, label: "终末期", changes: { rhythm: "asystole", sbp: -40 }, lethal: true, log: "坏死感染扩散致脓毒症（睾丸丧失不可避免）" }
    ],
    treat: [
      { type: "drug", id: "ketamine", need: false, note: "麻醉诱导配合手法复位" },
      { type: "drug", id: "ceftriaxone", need: false, note: "术前预防感染" },
      { type: "surgery", proc: "fixation", site: "prostate", need: true, note: "急诊手术复位并双侧睾丸固定，坏死则切除" }
    ],
    harm: [
      { id: "ondansetron", msg: "仅止吐观察，错过 6 小时黄金复位时间" },
      { id: "ibuprofen", msg: "口服止痛药回家观察，睾丸缺血坏死" }
    ],
    lethalAfter: 43200,
    needSurgery: true,
    note: "6 小时内手术复位可挽救睾丸，超声血流是首选检查"
  },
  {
    id: "dka",
    name: "糖尿病酮症酸中毒",
    course: "chronic",
    dept: "内分泌科",
    site: "胰腺 · 胰岛β细胞功能衰竭",
    triage: 5,
    hidden: true,
    vitals: { rr: 14, hr: 30, sbp: -25, gcs: -3, glucose: 12, ph: -0.2, k: -0.6, urine: -40 },
    labs: { glucose: 28.6, k: 5.6, ph: 7.12, lactate: 3.2, creatinine: 148, na: 130, wbc: 15.2 },
    exam: { xray: "双肺未见实变", ecg: "窦性心动过速，T波高尖", us: "胰腺回声尚可，未见占位" },
    symptoms: [
      { name: "多饮多尿、口渴加重数日", mode: "问诊", t: 0 },
      { name: "深大呼吸伴烂苹果味", mode: "视诊", t: 0 },
      { name: "恶心呕吐、腹痛", mode: "问诊", t: 300 },
      { name: "皮肤干燥、眼窝凹陷", mode: "视诊", t: 120 },
      { name: "嗜睡、反应迟钝", mode: "视诊", t: 900 }
    ],
    stages: [
      { t: 0, label: "酮症期", changes: { glucose: 8, rr: 10, urine: -30 }, log: "胰岛素缺乏，脂肪分解产生酮体" },
      { t: 1800, label: "酸中毒期", changes: { ph: -0.18, k: 0.5, hr: 18, rr: 6 }, log: "酮酸堆积，代偿性深大呼吸" },
      { t: 5400, label: "严重脱水期", changes: { sbp: -35, gcs: -4, renal: -40, k: -0.4 }, log: "渗透性利尿致血容量不足" },
      { t: 10800, label: "终末期", changes: { rhythm: "asystole", ph: -0.3, gcs: -8 }, lethal: true, log: "严重酸中毒与休克致心跳停止" }
    ],
    treat: [
      { type: "drug", id: "insulin", need: true, note: "小剂量静脉泵入 0.1U/kg/h" },
      { type: "drug", id: "sodium_bicarbonate", need: false, note: "pH < 7.0 时谨慎补碱" },
      { type: "drug", id: "dextrose_50", need: false, note: "血糖降至 13.9mmol/L 后加用葡萄糖" },
      { type: "drug", id: "ceftriaxone", need: false, note: "积极寻找并治疗感染诱因" }
    ],
    harm: [
      { id: "furosemide", msg: "误判为水肿而利尿，脱水与休克急剧加重" },
      { id: "hydrocortisone", msg: "未明确诱因即用激素，血糖进一步失控" }
    ],
    lethalAfter: 7200,
    needSurgery: false,
    note: "先补液再胰岛素，见尿补钾，警惕血糖下降过快致脑水肿"
  },
  {
    id: "hypoglycemic_coma",
    name: "低血糖昏迷",
    dept: "急诊科",
    site: "颅腔 · 大脑皮质及脑干",
    triage: 5,
    hidden: false,
    vitals: { gcs: -8, hr: 25, sbp: -10, temp: -0.8, brain: -40, seizure: 30, glucose: -4 },
    labs: { glucose: 1.6, k: 3.6, na: 138, lactate: 1.6, wbc: 9.4, creatinine: 98 },
    exam: { ecg: "窦性心动过速，可见室性早搏", ct: "头颅 CT 未见出血及占位" },
    symptoms: [
      { name: "心悸、出汗、手抖、饥饿感", mode: "问诊", t: 0 },
      { name: "意识模糊、言语不清、行为异常", mode: "视诊", t: 120 },
      { name: "皮肤湿冷、面色苍白", mode: "视诊", t: 0 },
      { name: "四肢抽搐", mode: "视诊", t: 300 },
      { name: "深昏迷、病理征阳性", mode: "问诊", t: 600 }
    ],
    stages: [
      { t: 0, label: "交感兴奋期", changes: { hr: 25, glucose: -2, pain: 20 }, log: "低血糖触发交感肾上腺反应" },
      { t: 300, label: "神经低糖期", changes: { gcs: -5, brain: -30, seizure: 25 }, log: "脑细胞缺糖，意识障碍与抽搐" },
      { t: 900, label: "脑水肿期", changes: { gcs: -8, brain: -40, icp: 20 }, log: "持续低糖致神经元不可逆损伤" },
      { t: 1800, label: "终末期", changes: { icp: 40, rhythm: "asystole" }, lethal: true, log: "脑死亡与循环衰竭" }
    ],
    treat: [
      { type: "drug", id: "dextrose_50", need: true, note: "50% 葡萄糖 40-60ml 静脉推注后维持" },
      { type: "drug", id: "hydrocortisone", need: false, note: "怀疑肾上腺危象时补充激素" },
      { type: "drug", id: "midazolam", need: false, note: "抽搐不止时控制发作" }
    ],
    harm: [
      { id: "insulin", msg: "误将昏迷当高血糖而给胰岛素，造成不可逆脑损伤" }
    ],
    lethalAfter: 1500,
    needSurgery: false,
    note: "不明原因昏迷一律先测血糖，及时补糖可完全逆转"
  },
  {
    id: "thyroid_storm",
    name: "甲状腺危象",
    course: "chronic",
    dept: "内分泌科",
    site: "甲状腺 · 颈部弥漫肿大",
    triage: 5,
    hidden: true,
    vitals: { hr: 55, temp: 2.8, sbp: 35, rr: 12, gi: 40, glucose: 3 },
    labs: { ft3: 18.6, ft4: 52, tsh: 0.01, wbc: 14.2, alt: 78, k: 3.4, glucose: 9.8 },
    exam: { ecg: "快速心房颤动，心室率 160 次/分", us: "甲状腺弥漫性肿大伴血流丰富", xray: "心影增大" },
    symptoms: [
      { name: "高热大汗、烦躁不安", mode: "问诊", t: 0 },
      { name: "心悸、气促、不能平卧", mode: "问诊", t: 0 },
      { name: "双手细颤、甲状腺弥漫肿大", mode: "视诊", t: 60 },
      { name: "呕吐腹泻、黄疸", mode: "问诊", t: 600 },
      { name: "谵妄、嗜睡", mode: "视诊", t: 1800 }
    ],
    stages: [
      { t: 0, label: "高代谢危象期", changes: { hr: 40, temp: 2, rr: 10, gi: 30 }, log: "甲状腺激素骤增，代谢率飙升" },
      { t: 1800, label: "心血管失代偿期", changes: { rhythm: "afib", hr: 20, sbp: -25 }, log: "快速房颤致心输出量下降" },
      { t: 5400, label: "多器官衰竭期", changes: { hepatic: -40, temp: 1, gcs: -4, renal: -30 }, log: "高热脱水与肝肾功能衰竭" },
      { t: 10800, label: "终末期", changes: { rhythm: "asystole", temp: -2 }, lethal: true, log: "高热衰竭与循环崩溃" }
    ],
    treat: [
      { type: "drug", id: "propylthiouracil", need: true, note: "抑制甲状腺激素合成，先于碘剂使用" },
      { type: "drug", id: "hydrocortisone", need: true, note: "抑制外周 T4 转 T3 并防肾上腺危象" },
      { type: "drug", id: "esmolol", need: false, note: "控制心率，慎用于心衰患者" },
      { type: "drug", id: "paracetamol", need: false, note: "物理降温为主，禁用阿司匹林" }
    ],
    harm: [
      { id: "aspirin", msg: "阿司匹林置换结合蛋白使游离甲状腺激素升高，加重危象" },
      { id: "atropine", msg: "误判心率快为相对缓脉而用阿托品，心率进一步失控" }
    ],
    lethalAfter: 7200,
    needSurgery: false,
    note: "丙硫氧嘧啶+碘剂+激素+β阻滞剂，积极降温补液"
  },
  {
    id: "adrenal_crisis",
    name: "急性肾上腺危象",
    dept: "内分泌科",
    site: "肾脏 · 肾上腺皮质",
    triage: 5,
    hidden: true,
    vitals: { sbp: -55, dbp: -30, map: -40, hr: 30, na: -8, k: 0.8, glucose: -3, temp: -0.6 },
    labs: { na: 126, k: 5.8, glucose: 2.8, cortisol: 3.2, creatinine: 156, lactate: 4.2, ph: 7.28 },
    exam: { ecg: "窦性心动过速，T波低平伴高钾样改变", ct: "双侧肾上腺稍增粗", us: "下腔静脉塌陷" },
    symptoms: [
      { name: "极度乏力、恶心呕吐、腹痛", mode: "问诊", t: 0 },
      { name: "皮肤色素沉着（长期者）", mode: "视诊", t: 0 },
      { name: "血压进行性下降、脉细速", mode: "监护", t: 120 },
      { name: "脱水、少尿", mode: "视诊", t: 300 },
      { name: "嗜睡、意识模糊", mode: "视诊", t: 900 }
    ],
    stages: [
      { t: 0, label: "皮质醇缺乏期", changes: { sbp: -30, na: -6, glucose: -2 }, log: "糖皮质激素缺乏，血管对儿茶酚胺反应下降" },
      { t: 900, label: "循环衰竭期", changes: { sbp: -50, k: 0.8, urine: -40 }, log: "顽固低血压伴高钾低钠" },
      { t: 2400, label: "休克加深期", changes: { gcs: -4, lactate: 4, renal: -40 }, log: "组织灌注严重不足" },
      { t: 3600, label: "终末期", changes: { rhythm: "asystole", sbp: -70 }, lethal: true, log: "循环衰竭死亡" }
    ],
    treat: [
      { type: "drug", id: "hydrocortisone", need: true, note: "立即静推 100mg 后持续补充" },
      { type: "drug", id: "dextrose_50", need: true, note: "纠正低血糖" },
      { type: "drug", id: "noradrenaline", need: false, note: "液体复苏后仍低血压时使用" },
      { type: "drug", id: "sodium_bicarbonate", need: false, note: "严重高钾伴酸中毒时谨慎使用" }
    ],
    harm: [
      { id: "insulin", msg: "将高钾高血糖误判为糖尿病急症，低血糖与休克加重" },
      { id: "furosemide", msg: "利尿进一步减少有效循环血量，低钠加重" }
    ],
    lethalAfter: 2400,
    needSurgery: false,
    note: "不明原因休克伴低钠高钾先想肾上腺危象，激素不能等结果"
  },
  {
    id: "hyperkalemia",
    name: "急性重度高钾血症",
    dept: "肾内科",
    site: "肾脏 · 肾小管排钾障碍",
    triage: 5,
    hidden: true,
    vitals: { hr: -25, k: 2.2, contractility: -25, sbp: -25, renal: -45, urine: -50, map: -20 },
    labs: { k: 7.4, creatinine: 428, ph: 7.22, glucose: 8.6, na: 132, lactate: 3.0, hb: 96 },
    exam: { ecg: "T波高尖、QRS 增宽、P 波消失呈正弦波", us: "双肾皮质变薄，实质回声增强" },
    symptoms: [
      { name: "四肢麻木无力", mode: "问诊", t: 0 },
      { name: "心悸、胸闷", mode: "问诊", t: 0 },
      { name: "脉搏缓慢不规则", mode: "触诊", t: 120 },
      { name: "少尿、水肿", mode: "视诊", t: 0 },
      { name: "心电监护示心动过缓与宽 QRS", mode: "监护", t: 60 }
    ],
    stages: [
      { t: 0, label: "心肌兴奋性增高期", changes: { k: 1.2, hr: -10, qt: 20 }, log: "高钾使心肌复极异常，T波高尖" },
      { t: 600, label: "传导阻滞期", changes: { k: 0.8, avconduction: -40, hr: -20 }, log: "房室传导受抑，心率减慢" },
      { t: 1200, label: "心律失常期", changes: { rhythm: "vt", contractility: -30, sbp: -35 }, log: "出现室性心律失常，血压下降" },
      { t: 1800, label: "终末期", changes: { rhythm: "asystole", k: 0.6 }, lethal: true, log: "心脏停搏于舒张期" }
    ],
    treat: [
      { type: "drug", id: "calcium_gluconate", need: true, note: "10% 葡萄糖酸钙静推稳定心肌膜" },
      { type: "drug", id: "insulin", need: true, note: "胰岛素加葡萄糖促钾向细胞内转移" },
      { type: "drug", id: "sodium_bicarbonate", need: false, note: "合并代谢性酸中毒时使用" },
      { type: "surgery", proc: "drainage", site: "kidney", need: false, note: "药物无效或肾衰竭时紧急血液透析" }
    ],
    harm: [
      { id: "hydrocortisone", msg: "未鉴别病因即用激素，可能进一步升高血钾" },
      { id: "aspirin", msg: "使用含钾药物或保钾利尿剂，血钾继续升高" }
    ],
    lethalAfter: 1200,
    needSurgery: false,
    note: "先护心（钙剂）再降钾（胰岛素+葡萄糖），透析是终极大招"
  },
  {
    id: "dic",
    name: "弥散性血管内凝血",
    dept: "血液科",
    site: "皮肤软组织 · 全身微小血管",
    triage: 5,
    hidden: true,
    vitals: { hr: 32, sbp: -35, plt: -60, inr: 1.8, clotting: -50, volume: -25, spo2: -8 },
    labs: { plt: 32, inr: 2.6, pt: 28, d_dimer: 12.4, hb: 78, lactate: 4.0, creatinine: 168 },
    exam: { us: "腹腔及胸腔少量积液", ct: "双肺散在斑片影，腹腔积液" },
    symptoms: [
      { name: "全身皮肤瘀点瘀斑、穿刺点渗血", mode: "视诊", t: 0 },
      { name: "牙龈及鼻出血", mode: "视诊", t: 300 },
      { name: "呕血、黑便、血尿", mode: "问诊", t: 900 },
      { name: "肢端发凉、花斑", mode: "视诊", t: 600 },
      { name: "意识改变", mode: "视诊", t: 1800 }
    ],
    stages: [
      { t: 0, label: "高凝期", changes: { clotting: -20, plt: -20, inr: 0.4 }, log: "微血栓广泛形成，凝血因子消耗" },
      { t: 900, label: "消耗性低凝期", changes: { plt: -30, inr: 1.2, hb: -15 }, log: "血小板与凝血因子耗竭，出血倾向明显" },
      { t: 3600, label: "纤溶亢进期", changes: { inr: 1.5, clotting: -40, volume: -25 }, log: "继发纤溶，出血难以控制" },
      { t: 7200, label: "终末期", changes: { sbp: -60, rhythm: "asystole", plt: -20 }, lethal: true, log: "大出血与器官衰竭致死" }
    ],
    treat: [
      { type: "drug", id: "heparin", need: false, note: "高凝期伴有血栓表现时小剂量使用" },
      { type: "drug", id: "tranexamic_acid", need: false, note: "纤溶亢进为主时谨慎抗纤溶" },
      { type: "drug", id: "noradrenaline", need: false, note: "维持循环灌注" },
      { type: "surgery", proc: "ligation", site: "vessel", need: false, note: "局部出血点压迫或缝扎止血" }
    ],
    harm: [
      { id: "heparin", msg: "在纤溶亢进期大剂量抗凝，出血迅速失控" },
      { id: "aspirin", msg: "抗血小板药物加重出血" }
    ],
    lethalAfter: 5400,
    needSurgery: false,
    note: "治疗原发病是根本，按分期抗凝或补充凝血因子"
  },
  {
    id: "itp",
    name: "免疫性血小板减少性紫癜",
    dept: "血液科",
    site: "皮肤软组织 · 全身皮肤黏膜",
    triage: 4,
    hidden: true,
    vitals: { plt: -70, hr: 12, sbp: -5, immune: 40, clotting: -15 },
    labs: { plt: 12, hb: 118, wbc: 6.8, inr: 1.0, crp: 8, creatinine: 88 },
    exam: { us: "脾脏不大", pathology: "骨髓象示巨核细胞增多伴成熟障碍，血小板少见" },
    symptoms: [
      { name: "皮肤散在瘀点瘀斑，碰撞后加重", mode: "视诊", t: 0 },
      { name: "牙龈渗血、鼻出血", mode: "视诊", t: 300 },
      { name: "月经量明显增多", mode: "问诊", t: 0 },
      { name: "口腔黏膜血疱", mode: "视诊", t: 900 },
      { name: "头痛、视物模糊", mode: "问诊", t: 3600 }
    ],
    stages: [
      { t: 0, label: "血小板破坏期", changes: { plt: -50, clotting: -10 }, log: "自身抗体介导血小板破坏" },
      { t: 3600, label: "出血倾向期", changes: { plt: -15, hb: -5 }, log: "血小板进一步下降，黏膜出血" },
      { t: 21600, label: "严重出血期", changes: { plt: -10, hb: -20, volume: -12 }, log: "内脏或颅内出血风险显著升高" },
      { t: 43200, label: "颅内出血期", changes: { icp: 35, brain: -40, rhythm: "asystole" }, lethal: true, log: "颅内出血致脑疝死亡" }
    ],
    treat: [
      { type: "drug", id: "hydrocortisone", need: true, note: "糖皮质激素为一线治疗" },
      { type: "drug", id: "tranexamic_acid", need: false, note: "黏膜出血时辅助抗纤溶" },
      { type: "drug", id: "ivig", need: false, note: "激素无效或需快速升血小板时的一线/二线治疗" },
      { type: "surgery", proc: "excision", site: "spleen", need: false, note: "难治性病例可考虑脾切除（非首选）" }
    ],
    harm: [
      { id: "heparin", msg: "未核实血小板即抗凝，诱发致命性颅内出血" },
      { id: "aspirin", msg: "使用抗血小板药物加重出血" }
    ],
    lethalAfter: 21600,
    needSurgery: false,
    note: "血小板 < 20×10⁹/L 或有出血时需积极升板治疗"
  },
  {
    id: "acute_hemorrhagic_shock",
    name: "急性失血性休克",
    dept: "急诊科",
    site: "四肢血管 · 多处血管断裂出血",
    triage: 5,
    hidden: false,
    vitals: { hr: 55, sbp: -60, dbp: -35, map: -45, hb: -45, volume: -55, urine: -60, spo2: -8 },
    labs: { hb: 62, plt: 148, inr: 1.4, lactate: 6.2, ph: 7.18, creatinine: 168, k: 4.6 },
    exam: { us: "下腔静脉明显塌陷，心脏呈高动力状态", xray: "未见明确气胸或血胸" },
    symptoms: [
      { name: "伤口持续大量出血", mode: "视诊", t: 0 },
      { name: "面色苍白、四肢湿冷", mode: "视诊", t: 0 },
      { name: "脉搏细速、甚至摸不清", mode: "触诊", t: 60 },
      { name: "口渴、烦躁继而意识淡漠", mode: "问诊", t: 300 },
      { name: "尿量极少", mode: "监护", t: 600 }
    ],
    stages: [
      { t: 0, label: "代偿期", changes: { hr: 35, svr: 40, sbp: -15 }, log: "交感兴奋，外周血管收缩代偿" },
      { t: 600, label: "失代偿期", changes: { sbp: -45, volume: -40, urine: -55 }, log: "代偿失效，血压显著下降" },
      { t: 1800, label: "微循环淤血期", changes: { lactate: 5, ph: -0.15, gcs: -4, renal: -45 }, log: "组织缺氧，代谢性酸中毒" },
      { t: 3000, label: "终末期", changes: { rhythm: "pea", hb: -60 }, lethal: true, log: "循环衰竭死亡" }
    ],
    treat: [
      { type: "surgery", proc: "ligation", site: "vessel", need: true, note: "立即压迫止血并手术止血" },
      { type: "drug", id: "tranexamic_acid", need: true, note: "创伤出血早期 1g 静脉使用" },
      { type: "drug", id: "noradrenaline", need: false, note: "液体复苏后仍低血压时使用" },
      { type: "drug", id: "dextrose_50", need: false, note: "纠正合并低血糖" }
    ],
    harm: [
      { id: "furosemide", msg: "误判为容量过负荷而利尿，休克迅速恶化" },
      { id: "morphine", msg: "休克未纠正时使用镇痛药，加重低血压" }
    ],
    lethalAfter: 2400,
    needSurgery: true,
    note: "止血优先于补液，允许性低血压复苏至手术止血"
  },
  {
    id: "polytrauma",
    name: "严重多发伤",
    dept: "创伤外科",
    site: "脊柱 · 胸腰椎爆裂骨折合并多发损伤",
    triage: 5,
    hidden: false,
    vitals: { hr: 48, sbp: -45, hb: -35, volume: -40, spo2: -14, pain: 70, gcs: -4 },
    labs: { hb: 82, plt: 118, inr: 1.5, lactate: 5.4, ph: 7.22, creatinine: 148, k: 4.4 },
    exam: { ct: "胸腰椎爆裂骨折伴椎管受累，右侧多发肋骨骨折伴少量气胸，肝脾周围少量积液", xray: "骨盆多发骨折，股骨干骨折", us: "腹腔少量游离液体，肝脾未见明确破裂" },
    symptoms: [
      { name: "高处坠落致全身多处疼痛", mode: "问诊", t: 0 },
      { name: "胸腰部畸形、活动受限", mode: "视诊", t: 0 },
      { name: "胸腰部压痛伴骨擦感", mode: "触诊", t: 60 },
      { name: "呼吸浅快、患侧呼吸音减低", mode: "听诊", t: 120 },
      { name: "面色苍白、四肢湿冷", mode: "视诊", t: 0 },
      { name: "下肢感觉运动障碍", mode: "触诊", t: 300 }
    ],
    stages: [
      { t: 0, label: "急性失血期", changes: { hb: -25, volume: -30, hr: 35 }, log: "多发骨折与实质脏器损伤出血" },
      { t: 600, label: "休克进展期", changes: { sbp: -45, lactate: 4, urine: -50 }, log: "失血性休克加深" },
      { t: 1800, label: "致死三联征期", changes: { temp: -2, inr: 1.2, ph: -0.18 }, log: "低体温、酸中毒、凝血障碍互相加重" },
      { t: 3600, label: "终末期", changes: { rhythm: "pea", sbp: -70 }, lethal: true, log: "不可控出血与循环衰竭" }
    ],
    treat: [
      { type: "surgery", proc: "fixation", site: "spine", need: false, note: "血流动力学稳定后脊柱固定" },
      { type: "surgery", proc: "fixation", site: "longbone", need: false, note: "长骨骨折外固定架临时固定" },
      { type: "drug", id: "tranexamic_acid", need: true, note: "伤后 3 小时内使用降低病死率" },
      { type: "drug", id: "noradrenaline", need: false, note: "维持灌注压至出血控制" },
      { type: "surgery", proc: "drainage", site: "pleura", need: false, note: "气胸或血胸置管引流" }
    ],
    harm: [
      { id: "midazolam", msg: "未评估循环即深镇静，掩盖意识变化并加重低血压" },
      { id: "furosemide", msg: "误判肺水肿而利尿，休克恶化" }
    ],
    lethalAfter: 2400,
    needSurgery: true,
    note: "按损伤控制外科原则，先止血后确定性手术"
  },
  {
    id: "splenic_rupture",
    name: "外伤性脾破裂",
    dept: "创伤外科",
    site: "脾脏 · 脾门及脾实质",
    triage: 5,
    hidden: true,
    vitals: { hr: 45, sbp: -40, hb: -35, volume: -35, pain: 55, gi: 25, map: -30 },
    labs: { hb: 76, plt: 142, inr: 1.2, lactate: 4.4, wbc: 15.6, creatinine: 132 },
    exam: { us: "脾周及肝肾隐窝积液，脾实质回声不均", ct: "脾实质撕裂伴脾周血肿及腹腔积血，增强扫描见造影剂外溢", xray: "左侧肋骨骨折" },
    symptoms: [
      { name: "左上腹外伤后持续腹痛", mode: "问诊", t: 0 },
      { name: "左季肋区压痛、肌紧张", mode: "触诊", t: 60 },
      { name: "面色苍白、口渴、心慌", mode: "视诊", t: 120 },
      { name: "腹部逐渐膨隆", mode: "视诊", t: 600 },
      { name: "血压下降、心率增快", mode: "监护", t: 900 }
    ],
    stages: [
      { t: 0, label: "包膜下出血期", changes: { hb: -15, pain: 40 }, log: "脾实质损伤，包膜下积血" },
      { t: 600, label: "包膜破裂期", changes: { hb: -30, volume: -30, hr: 30 }, log: "包膜破裂，腹腔内大量出血" },
      { t: 1800, label: "失血性休克期", changes: { sbp: -50, urine: -50, gcs: -3 }, log: "循环血量不足，器官灌注下降" },
      { t: 3000, label: "终末期", changes: { rhythm: "pea", hb: -60 }, lethal: true, log: "失血性休克死亡" }
    ],
    treat: [
      { type: "surgery", proc: "ligation", site: "spleen", need: true, note: "急诊剖腹探查脾切除或脾动脉结扎止血" },
      { type: "surgery", proc: "embolization", site: "spleen", need: false, note: "血流动力学稳定者可行脾动脉栓塞" },
      { type: "drug", id: "tranexamic_acid", need: false, note: "辅助止血" },
      { type: "drug", id: "noradrenaline", need: false, note: "维持灌注压" }
    ],
    harm: [
      { id: "morphine", msg: "未明确诊断即镇痛并让患者走动，包膜下血肿破裂" },
      { id: "furosemide", msg: "利尿加重低血容量" }
    ],
    lethalAfter: 1800,
    needSurgery: true,
    note: "左季肋外伤加失血表现，迅速 CT 增强并准备手术"
  },
  {
    id: "liver_rupture",
    name: "外伤性肝破裂",
    dept: "创伤外科",
    site: "肝脏 · 右肝叶实质",
    triage: 5,
    hidden: true,
    vitals: { hr: 42, sbp: -45, hb: -30, volume: -38, pain: 60, gi: 30, map: -32 },
    labs: { hb: 84, alt: 386, ast: 452, inr: 1.5, lactate: 4.8, plt: 128, creatinine: 138 },
    exam: { us: "右肝周围及肝肾隐窝大量积液，肝实质回声不均", ct: "右肝叶撕裂伤伴活动性出血，腹腔大量积血", xray: "右侧膈肌抬高" },
    symptoms: [
      { name: "右上腹及右季肋区外伤后剧痛", mode: "问诊", t: 0 },
      { name: "右上腹压痛、反跳痛", mode: "触诊", t: 60 },
      { name: "腹胀进行性加重", mode: "视诊", t: 600 },
      { name: "皮肤苍白、脉搏细速", mode: "视诊", t: 300 },
      { name: "血压迅速下降", mode: "监护", t: 900 }
    ],
    stages: [
      { t: 0, label: "实质损伤期", changes: { hb: -15, pain: 45, hepatic: -25 }, log: "肝实质裂伤出血，转氨酶升高" },
      { t: 600, label: "活动性出血期", changes: { hb: -25, volume: -35, hr: 30 }, log: "肝血窦丰富，出血迅猛" },
      { t: 1800, label: "失血性休克期", changes: { sbp: -50, urine: -50, lactate: 4 }, log: "休克加深，凝血功能恶化" },
      { t: 3000, label: "终末期", changes: { rhythm: "pea", hb: -55 }, lethal: true, log: "失血与肝衰竭致死" }
    ],
    treat: [
      { type: "surgery", proc: "ligation", site: "liver", need: true, note: "剖腹探查行肝周填塞、缝扎或肝动脉结扎止血" },
      { type: "surgery", proc: "drainage", site: "peritoneum", need: false, note: "腹腔积血积液引流" },
      { type: "drug", id: "tranexamic_acid", need: true, note: "早期抗纤溶减少出血" },
      { type: "drug", id: "noradrenaline", need: false, note: "循环支持" }
    ],
    harm: [
      { id: "paracetamol", msg: "肝功能受损时使用对乙酰氨基酚，加重肝毒性" },
      { id: "morphine", msg: "休克状态下使用吗啡，加重低血压" }
    ],
    lethalAfter: 1800,
    needSurgery: true,
    note: "肝破裂出血快，扩容同时尽快手术止血"
  },
  {
    id: "long_bone_fracture",
    name: "股骨干骨折",
    dept: "骨科",
    site: "长骨/四肢骨 · 右侧股骨干",
    triage: 4,
    hidden: false,
    vitals: { hr: 32, sbp: -25, hb: -20, volume: -20, pain: 75, clotting: -15 },
    labs: { hb: 96, plt: 186, inr: 1.1, lactate: 3.0, creatinine: 106, k: 4.2, wbc: 12.4 },
    exam: { xray: "右侧股骨干中段横行骨折伴移位，周围软组织肿胀", ct: "骨折断端周围血肿形成，未见血管损伤", us: "股静脉血流尚通畅" },
    symptoms: [
      { name: "外伤后右大腿剧痛，不能活动", mode: "问诊", t: 0 },
      { name: "右大腿明显肿胀、短缩畸形", mode: "视诊", t: 0 },
      { name: "骨折处压痛伴骨擦感和异常活动", mode: "触诊", t: 60 },
      { name: "足背动脉搏动可触及但较弱", mode: "触诊", t: 120 },
      { name: "患肢远端麻木", mode: "问诊", t: 600 }
    ],
    stages: [
      { t: 0, label: "骨折出血期", changes: { pain: 60, hb: -15, hr: 20 }, log: "骨折断端与骨髓腔出血，可失血 1000ml 以上" },
      { t: 1800, label: "软组织肿胀期", changes: { volume: -15, pain: 15, clotting: -10 }, log: "软组织进行性肿胀，筋膜间室压力升高" },
      { t: 7200, label: "脂肪栓塞/骨筋膜室期", changes: { spo2: -15, brain: -25, gcs: -4, pain: 20 }, log: "脂肪栓塞与骨筋膜室综合征" },
      { t: 14400, label: "终末期", changes: { rhythm: "asystole", spo2: -30 }, lethal: true, log: "脂肪栓塞综合征致呼吸循环衰竭" }
    ],
    treat: [
      { type: "surgery", proc: "fixation", site: "longbone", need: true, note: "髓内钉或外固定架固定骨折" },
      { type: "drug", id: "ketamine", need: false, note: "镇痛与麻醉诱导" },
      { type: "drug", id: "tranexamic_acid", need: false, note: "减少围手术期出血" },
      { type: "drug", id: "noradrenaline", need: false, note: "合并休克时维持血压" }
    ],
    harm: [
      { id: "ibuprofen", msg: "骨折早期使用非甾体药影响骨愈合，且掩盖骨筋膜室疼痛" },
      { id: "morphine", msg: "大剂量镇痛掩盖骨筋膜室综合征的剧痛，导致截肢" }
    ],
    lethalAfter: 10800,
    needSurgery: true,
    note: "股骨干骨折可隐蔽大量失血，警惕骨筋膜室综合征"
  },
  {
    id: "burn",
    name: "大面积热烧伤",
    dept: "烧伤科",
    site: "皮肤软组织 · 躯干及双下肢",
    triage: 5,
    hidden: false,
    vitals: { hr: 38, sbp: -25, spo2: -10, pain: 80, volume: -35, temp: -1.0, rr: 10 },
    labs: { hb: 158, plt: 176, k: 5.2, na: 130, creatinine: 148, lactate: 3.6, wbc: 16.8 },
    exam: { us: "下腔静脉塌陷", xray: "双肺未见明显实变", pathology: "创面培养见金黄色葡萄球菌" },
    symptoms: [
      { name: "火焰烧伤后剧烈疼痛", mode: "问诊", t: 0 },
      { name: "烧伤面积约 45%，创面焦痂与渗出", mode: "视诊", t: 0 },
      { name: "创面周围红肿、皮肤温度升高", mode: "触诊", t: 600 },
      { name: "声音嘶哑、鼻毛烧焦", mode: "视诊", t: 0 },
      { name: "尿量减少、尿色深", mode: "监护", t: 1800 }
    ],
    stages: [
      { t: 0, label: "急性渗出期", changes: { volume: -30, pain: 60, hr: 30 }, log: "毛细血管通透性增加，大量体液外渗" },
      { t: 3600, label: "烧伤休克期", changes: { sbp: -35, urine: -50, k: 0.8 }, log: "低血容量性休克与电解质紊乱" },
      { t: 21600, label: "感染期", changes: { temp: 2, wbc: 6, sbp: -25, spo2: -12 }, log: "创面感染进展为脓毒症" },
      { t: 43200, label: "终末期", changes: { rhythm: "asystole", sbp: -55, renal: -50 }, lethal: true, log: "脓毒性休克与多器官衰竭" }
    ],
    treat: [
      { type: "drug", id: "morphine", need: true, note: "充分镇痛，注意血压" },
      { type: "drug", id: "ceftriaxone", need: false, note: "创面感染或脓毒症时抗感染" },
      { type: "drug", id: "noradrenaline", need: false, note: "补液后仍低血压时使用" },
      { type: "surgery", proc: "debridement", site: "skin", need: true, note: "早期切痂植皮与创面清创" }
    ],
    harm: [
      { id: "furosemide", msg: "把渗出期少尿当肾衰而利尿，休克加重" },
      { id: "ibuprofen", msg: "大面积烧伤使用非甾体药，加重肾损伤" }
    ],
    lethalAfter: 21600,
    needSurgery: true,
    note: "按 Parkland 公式补液，警惕吸入性损伤与气道水肿"
  },
  {
    id: "ectopic_pregnancy_rupture",
    name: "异位妊娠破裂",
    dept: "妇产科",
    site: "子宫卵巢 · 左侧输卵管壶腹部",
    triage: 5,
    hidden: true,
    vitals: { hr: 42, sbp: -45, hb: -35, volume: -40, pain: 70, gi: 20, uterus: -30 },
    labs: { hcg: 3200, hb: 72, plt: 168, lactate: 4.0, creatinine: 108, wbc: 13.2 },
    exam: { us: "左侧附件区混合回声包块，盆腔大量积液，宫内未见孕囊", ct: "盆腔大量积血，左侧附件占位" },
    symptoms: [
      { name: "停经 6 周后突发左下腹撕裂样痛", mode: "问诊", t: 0 },
      { name: "少量阴道流血", mode: "问诊", t: 0 },
      { name: "下腹压痛、反跳痛伴宫颈举痛", mode: "触诊", t: 60 },
      { name: "面色苍白、头晕、肛门坠胀感", mode: "视诊", t: 120 },
      { name: "血压下降、脉搏细速", mode: "监护", t: 600 }
    ],
    stages: [
      { t: 0, label: "输卵管破裂期", changes: { pain: 60, hb: -20, hr: 30 }, log: "输卵管破裂，腹腔内出血" },
      { t: 600, label: "腹腔积血期", changes: { volume: -35, sbp: -40, hb: -25 }, log: "腹腔大量积血，失血性休克" },
      { t: 1800, label: "休克加深期", changes: { sbp: -55, urine: -50, gcs: -3 }, log: "循环血量严重不足" },
      { t: 3000, label: "终末期", changes: { rhythm: "pea", hb: -55 }, lethal: true, log: "失血性休克死亡" }
    ],
    treat: [
      { type: "surgery", proc: "excision", site: "uterus", need: true, note: "急诊腹腔镜或开腹输卵管切除止血" },
      { type: "drug", id: "tranexamic_acid", need: false, note: "辅助止血" },
      { type: "drug", id: "noradrenaline", need: false, note: "循环支持" },
      { type: "drug", id: "ceftriaxone", need: false, note: "术前预防感染" }
    ],
    harm: [
      { id: "misoprostol", msg: "误当宫内早孕药物流产，破裂出血急剧加重" },
      { id: "furosemide", msg: "利尿加重低血容量" }
    ],
    lethalAfter: 1800,
    needSurgery: true,
    note: "育龄女性腹痛伴停经首先查 HCG 与超声，休克者直接手术"
  },
  {
    id: "ovarian_torsion",
    name: "卵巢囊肿蒂扭转",
    dept: "妇产科",
    site: "子宫卵巢 · 右侧卵巢及蒂部",
    triage: 4,
    hidden: false,
    vitals: { hr: 28, pain: 75, gi: 40, sbp: -8, temp: 0.5, uterus: -20 },
    labs: { wbc: 13.6, crp: 42, hb: 122, plt: 214, creatinine: 92, k: 3.8 },
    exam: { us: "右侧附件区囊性包块 8cm，蒂部血流信号消失，盆腔少量积液", ct: "右侧附件囊性占位伴蒂部扭转征象", mri: "右侧卵巢囊性病变伴出血信号" },
    symptoms: [
      { name: "突发右下腹剧痛，与体位改变相关", mode: "问诊", t: 0 },
      { name: "恶心呕吐、出冷汗", mode: "问诊", t: 120 },
      { name: "右下腹压痛伴轻度反跳痛", mode: "触诊", t: 60 },
      { name: "腹部可触及活动度差的包块", mode: "触诊", t: 300 },
      { name: "疼痛呈持续性并逐渐加重", mode: "问诊", t: 1800 }
    ],
    stages: [
      { t: 0, label: "蒂部扭转期", changes: { pain: 60, gi: 30, uterus: -15 }, log: "卵巢蒂扭转，静脉回流受阻" },
      { t: 3600, label: "充血水肿期", changes: { pain: 10, temp: 0.8, gi: 15 }, log: "卵巢充血水肿，体积增大" },
      { t: 14400, label: "坏死期", changes: { temp: 1.2, wbc: 5, sbp: -20, gi: 20 }, log: "动脉血供中断，卵巢坏死" },
      { t: 43200, label: "破裂感染期", changes: { sbp: -45, rhythm: "asystole", gi: 25 }, lethal: true, log: "坏死囊破裂致弥漫性腹膜炎与休克" }
    ],
    treat: [
      { type: "surgery", proc: "exploration", site: "uterus", need: true, note: "急诊腹腔镜探查复位，坏死则切除附件" },
      { type: "drug", id: "ketamine", need: false, note: "麻醉诱导" },
      { type: "drug", id: "ceftriaxone", need: false, note: "预防感染" },
      { type: "drug", id: "ondansetron", need: false, note: "止吐对症" }
    ],
    harm: [
      { id: "morphine", msg: "仅用镇痛药观察，卵巢缺血坏死被迫切除" }
    ],
    lethalAfter: 36000,
    needSurgery: true,
    note: "年轻女性突发下腹痛伴附件包块，尽早手术可保留卵巢"
  },
  {
    id: "placental_abruption",
    name: "胎盘早剥",
    dept: "妇产科",
    site: "子宫卵巢 · 胎盘与子宫壁之间",
    triage: 5,
    hidden: true,
    vitals: { hr: 38, sbp: -35, hb: -25, volume: -30, pain: 70, uterus: 40, clotting: -35 },
    labs: { hb: 88, plt: 92, inr: 1.6, d_dimer: 8.2, creatinine: 126, lactate: 3.8, k: 4.6 },
    exam: { us: "胎盘后血肿形成，胎盘增厚", ct: "子宫壁与胎盘间血肿，腹腔少量积液" },
    symptoms: [
      { name: "突发持续性剧烈腹痛伴腰背痛", mode: "问诊", t: 0 },
      { name: "阴道流血，量与休克程度不符", mode: "视诊", t: 0 },
      { name: "子宫呈板状硬、压痛明显", mode: "触诊", t: 60 },
      { name: "胎动减少、胎心异常", mode: "听诊", t: 300 },
      { name: "面色苍白、血压下降", mode: "视诊", t: 600 }
    ],
    stages: [
      { t: 0, label: "胎盘剥离期", changes: { pain: 60, uterus: 30, hb: -15 }, log: "底蜕膜出血，胎盘部分剥离" },
      { t: 900, label: "隐性出血期", changes: { volume: -30, sbp: -40, hb: -20 }, log: "血液积于宫腔，休克与出血量不符" },
      { t: 2400, label: "凝血障碍期", changes: { clotting: -40, plt: -30, inr: 1.4 }, log: "组织凝血活酶释放，继发 DIC" },
      { t: 3600, label: "终末期", changes: { rhythm: "asystole", volume: -50, gcs: -4 }, lethal: true, log: "失血与凝血障碍致母婴死亡" }
    ],
    treat: [
      { type: "surgery", proc: "excision", site: "uterus", need: true, note: "立即剖宫产终止妊娠，必要时切除子宫止血" },
      { type: "drug", id: "tranexamic_acid", need: true, note: "抗纤溶辅助止血" },
      { type: "drug", id: "noradrenaline", need: false, note: "维持母体循环" },
      { type: "drug", id: "oxytocin", need: true, note: "胎儿娩出后促进子宫收缩" }
    ],
    harm: [
      { id: "midazolam", msg: "未评估胎儿与母体状态即镇静，延误剖宫产时机" }
    ],
    lethalAfter: 2400,
    needSurgery: true,
    note: "阴道出血量与休克不符是特点，立即剖宫产并纠正凝血"
  },
  {
    id: "postpartum_hemorrhage",
    name: "产后大出血",
    dept: "妇产科",
    site: "子宫卵巢 · 子宫下段及胎盘剥离面",
    triage: 5,
    hidden: false,
    vitals: { hr: 45, sbp: -45, hb: -35, volume: -45, uterus: -50, clotting: -30, urine: -50 },
    labs: { hb: 68, plt: 118, inr: 1.5, fibrinogen: 1.4, lactate: 4.6, creatinine: 138, k: 4.4 },
    exam: { us: "宫腔内大量积血，子宫收缩差", ct: "子宫增大伴宫腔积血" },
    symptoms: [
      { name: "胎儿娩出后阴道大量流血", mode: "视诊", t: 0 },
      { name: "子宫底升高、质软如袋状", mode: "触诊", t: 60 },
      { name: "面色苍白、头晕、心慌", mode: "问诊", t: 120 },
      { name: "脉搏细速、血压下降", mode: "监护", t: 300 },
      { name: "按摩子宫后仍有活动性出血", mode: "触诊", t: 600 }
    ],
    stages: [
      { t: 0, label: "子宫收缩乏力期", changes: { uterus: -45, hb: -20, hr: 30 }, log: "子宫收缩乏力，血窦开放出血" },
      { t: 600, label: "失血性休克期", changes: { sbp: -45, hb: -25, urine: -45 }, log: "失血量超过 1000ml，休克出现" },
      { t: 1800, label: "凝血障碍期", changes: { clotting: -35, inr: 1.3, plt: -25 }, log: "稀释性凝血病与 DIC" },
      { t: 3000, label: "终末期", changes: { rhythm: "pea", hb: -55 }, lethal: true, log: "不可控出血致死亡" }
    ],
    treat: [
      { type: "drug", id: "oxytocin", need: true, note: "缩宫素静脉维持促进子宫收缩" },
      { type: "drug", id: "misoprostol", need: true, note: "前列腺素类加强宫缩" },
      { type: "drug", id: "tranexamic_acid", need: true, note: "1g 静脉使用减少出血" },
      { type: "surgery", proc: "ligation", site: "uterus", need: false, note: "药物无效时子宫动脉结扎或球囊压迫" },
      { type: "surgery", proc: "excision", site: "uterus", need: false, note: "难治性出血行子宫切除救命" }
    ],
    harm: [
      { id: "furosemide", msg: "未纠正血容量即利尿，休克加重" }
    ],
    lethalAfter: 2400,
    needSurgery: false,
    note: "按摩子宫+宫缩剂+抗纤溶，必要时手术止血与输血"
  },
  {
    id: "sepsis",
    name: "脓毒症",
    dept: "重症医学科",
    site: "腹膜/腹腔 · 结肠穿孔继发弥漫性腹膜炎",
    triage: 5,
    hidden: true,
    vitals: { hr: 40, temp: 2.2, rr: 14, sbp: -30, spo2: -8, urine: -40, gi: 30 },
    labs: { wbc: 21.4, crp: 268, procalcitonin: 12.6, lactate: 4.2, creatinine: 168, plt: 96, ph: 7.29 },
    exam: { ct: "腹腔游离气体伴弥漫性腹腔积液，肠壁增厚强化减弱", us: "腹腔积液，肠管扩张", xray: "膈下游离气体" },
    symptoms: [
      { name: "高热寒战或体温不升", mode: "问诊", t: 0 },
      { name: "全腹压痛、反跳痛、腹肌紧张", mode: "触诊", t: 0 },
      { name: "呼吸急促、意识改变", mode: "视诊", t: 300 },
      { name: "皮肤花斑、四肢湿冷", mode: "视诊", t: 600 },
      { name: "尿量减少", mode: "监护", t: 900 }
    ],
    stages: [
      { t: 0, label: "感染失控期", changes: { temp: 2, hr: 30, rr: 10, gi: 25 }, log: "病原体入血，全身炎症反应启动" },
      { t: 1800, label: "脓毒症期", changes: { sbp: -30, lactate: 4, urine: -40 }, log: "组织灌注不足，乳酸升高" },
      { t: 5400, label: "多器官障碍期", changes: { renal: -45, hepatic: -35, gcs: -4, plt: -30 }, log: "多器官功能障碍" },
      { t: 10800, label: "终末期", changes: { rhythm: "asystole", sbp: -65 }, lethal: true, log: "循环衰竭死亡" }
    ],
    treat: [
      { type: "drug", id: "ceftriaxone", need: true, note: "1 小时内经验性广谱抗感染，联合甲硝唑" },
      { type: "drug", id: "noradrenaline", need: true, note: "液体复苏后维持平均动脉压 65mmHg 以上" },
      { type: "drug", id: "hydrocortisone", need: false, note: "液体复苏与升压药无效时使用" },
      { type: "surgery", proc: "drainage", site: "peritoneum", need: true, note: "急诊开腹清除感染灶并冲洗引流" }
    ],
    harm: [
      { id: "ibuprofen", msg: "退热掩盖病情，且加重肾损伤" },
      { id: "furosemide", msg: "容量不足时利尿，休克迅速恶化" }
    ],
    lethalAfter: 7200,
    needSurgery: true,
    note: "1 小时集束化治疗：血培养、抗菌、液体复苏、乳酸监测"
  },
  {
    id: "septic_shock",
    name: "脓毒性休克",
    dept: "重症医学科",
    site: "腹膜/腹腔 · 感染灶持续存在",
    triage: 5,
    hidden: false,
    vitals: { hr: 45, sbp: -60, map: -45, svr: -50, temp: 1.6, urine: -60, spo2: -10, lactate: 6 },
    labs: { lactate: 6.8, wbc: 24.6, crp: 320, creatinine: 236, plt: 68, inr: 1.6, ph: 7.16 },
    exam: { us: "下腔静脉变异度大，心脏高动力", ct: "腹腔大量积液伴感染灶", xray: "双肺散在浸润影" },
    symptoms: [
      { name: "顽固性低血压，补液后不回升", mode: "监护", t: 0 },
      { name: "皮肤花斑、肢端厥冷", mode: "视诊", t: 0 },
      { name: "意识模糊、嗜睡", mode: "问诊", t: 300 },
      { name: "尿量近乎为零", mode: "监护", t: 600 },
      { name: "脉搏细速、周围脉搏难以触及", mode: "触诊", t: 0 }
    ],
    stages: [
      { t: 0, label: "高动力期", changes: { hr: 40, svr: -40, sbp: -40, lactate: 4 }, log: "外周血管扩张，血压依赖升压药" },
      { t: 1800, label: "失代偿期", changes: { sbp: -55, urine: -60, gcs: -4 }, log: "微循环衰竭，器官灌注丧失" },
      { t: 5400, label: "多器官衰竭期", changes: { renal: -55, hepatic: -45, ph: -0.18, clotting: -35 }, log: "肝肾凝血功能全面崩溃" },
      { t: 9000, label: "终末期", changes: { rhythm: "asystole" }, lethal: true, log: "难治性休克死亡" }
    ],
    treat: [
      { type: "drug", id: "noradrenaline", need: true, note: "首选升压药，必要时联合血管加压素" },
      { type: "drug", id: "hydrocortisone", need: true, note: "难治性休克加用氢化可的松" },
      { type: "drug", id: "ceftriaxone", need: true, note: "广谱抗感染并尽快清除感染灶" },
      { type: "surgery", proc: "drainage", site: "peritoneum", need: true, note: "紧急控制感染源" }
    ],
    harm: [
      { id: "furosemide", msg: "复苏未达标即利尿，血压进一步崩溃" },
      { id: "midazolam", msg: "未评估循环即深镇静，加重低血压" }
    ],
    lethalAfter: 5400,
    needSurgery: true,
    note: "3 小时内 30ml/kg 晶体复苏，升压药与感染源控制并重"
  },
  {
    id: "necrotizing_fasciitis",
    name: "坏死性筋膜炎（福尼尔坏疽）",
    dept: "普通外科",
    site: "直肠肛管 · 会阴肛周及腹壁筋膜",
    triage: 5,
    hidden: true,
    vitals: { hr: 40, temp: 2.6, sbp: -35, pain: 85, immune: -25, wbc: 8, urine: -35 },
    labs: { wbc: 23.8, crp: 296, lactate: 5.2, creatinine: 186, plt: 88, inr: 1.5, k: 5.0 },
    exam: { ct: "会阴及腹壁软组织内大量积气，筋膜层增厚，可见液体积聚", us: "皮下组织增厚伴气体强回声", pathology: "组织涂片见革兰阳性粗大杆菌" },
    symptoms: [
      { name: "会阴肛周剧痛，与局部体征不符", mode: "问诊", t: 0 },
      { name: "皮肤红肿发亮、边界不清", mode: "视诊", t: 0 },
      { name: "皮肤出现水疱及捻发音", mode: "触诊", t: 600 },
      { name: "皮肤感觉减退、颜色发暗", mode: "视诊", t: 1800 },
      { name: "高热寒战、意识模糊", mode: "问诊", t: 900 }
    ],
    stages: [
      { t: 0, label: "筋膜感染期", changes: { pain: 70, temp: 2, hr: 30, immune: -20 }, log: "细菌沿筋膜层迅速蔓延" },
      { t: 1800, label: "组织坏死期", changes: { immune: -35, sbp: -30, temp: 1 }, log: "微血管血栓形成，皮肤坏死" },
      { t: 5400, label: "脓毒性休克期", changes: { sbp: -50, lactate: 5, urine: -50, gcs: -4 }, log: "毒素吸收致休克" },
      { t: 10800, label: "终末期", changes: { rhythm: "asystole", renal: -55 }, lethal: true, log: "多器官衰竭死亡" }
    ],
    treat: [
      { type: "surgery", proc: "debridement", site: "skin", need: true, note: "立即广泛清创，切除所有坏死筋膜，必要时反复清创" },
      { type: "drug", id: "piperacillin_tazobactam", need: true, note: "广谱抗感染，联合克林霉素抑制毒素" },
      { type: "drug", id: "noradrenaline", need: false, note: "休克时维持血压" },
      { type: "drug", id: "hydrocortisone", need: false, note: "难治性休克辅助治疗" }
    ],
    harm: [
      { id: "ibuprofen", msg: "仅用止痛药掩盖剧痛，感染沿筋膜扩散" },
      { id: "hydrocortisone", msg: "未清创即大剂量激素，免疫抑制加重感染" }
    ],
    lethalAfter: 5400,
    needSurgery: true,
    note: "疼痛与体征不符加捻发音是警报，清创比抗菌更救命"
  },
  {
    id: "abdominal_abscess",
    name: "腹腔脓肿",
    dept: "普通外科",
    site: "腹膜/腹腔 · 右下腹及盆腔",
    triage: 4,
    hidden: true,
    vitals: { hr: 28, temp: 2.0, sbp: -15, pain: 50, gi: 30, wbc: 7, urine: -20 },
    labs: { wbc: 19.2, crp: 226, glucose: 8.4, creatinine: 116, plt: 224, k: 3.5 },
    exam: { ct: "右下腹包裹性液性低密度灶伴环形强化，周围脂肪间隙模糊", us: "右下腹混合回声包块，内可见絮状回声", xray: "右下腹肠管积气伴局部肠壁增厚" },
    symptoms: [
      { name: "术后或腹膜炎后持续发热", mode: "问诊", t: 0 },
      { name: "右下腹隐痛、坠胀感", mode: "问诊", t: 0 },
      { name: "右下腹局限性压痛、可触及包块", mode: "触诊", t: 300 },
      { name: "里急后重、腹泻", mode: "问诊", t: 600 },
      { name: "食欲减退、消瘦", mode: "问诊", t: 1800 }
    ],
    stages: [
      { t: 0, label: "脓肿形成期", changes: { temp: 1.8, hr: 20, pain: 35, gi: 20 }, log: "感染局限化，脓液积聚" },
      { t: 3600, label: "脓肿增大期", changes: { temp: 0.6, wbc: 4, gi: 15 }, log: "脓腔扩大，全身炎症反应持续" },
      { t: 21600, label: "破溃风险期", changes: { sbp: -25, temp: 1, gi: 25, lactate: 3 }, log: "脓肿破溃可致弥漫性腹膜炎" },
      { t: 43200, label: "脓毒症期", changes: { sbp: -50, renal: -40, rhythm: "asystole" }, lethal: true, log: "脓毒性休克死亡" }
    ],
    treat: [
      { type: "drug", id: "ceftriaxone", need: true, note: "联合甲硝唑抗感染" },
      { type: "drug", id: "paracetamol", need: false, note: "退热对症" },
      { type: "surgery", proc: "drainage", site: "peritoneum", need: true, note: "超声或 CT 引导下穿刺置管引流" },
      { type: "drug", id: "noradrenaline", need: false, note: "合并休克时使用" }
    ],
    harm: [
      { id: "ibuprofen", msg: "长期退热掩盖脓肿进展，延误引流" }
    ],
    lethalAfter: 36000,
    needSurgery: true,
    note: "持续发热伴局限性压痛要想到脓肿，引流加抗菌是关键"
  },
  {
    id: "severe_alcohol_intoxication",
    name: "急性重度酒精中毒",
    dept: "急诊科",
    site: "颅腔 · 大脑皮质及小脑",
    triage: 4,
    hidden: false,
    vitals: { rr: -8, spo2: -14, gcs: -7, temp: -1.2, hr: 20, sbp: -15, emesis: 40 },
    labs: { glucose: 3.2, ph: 7.28, lactate: 3.2, k: 3.3, na: 134, osmo: 300, creatinine: 96 },
    exam: { ct: "头颅 CT 未见出血", xray: "双肺吸入性肺炎可能，右下肺片状影", ecg: "窦性心动过速" },
    symptoms: [
      { name: "大量饮酒后昏睡不醒", mode: "问诊", t: 0 },
      { name: "呼气有浓烈酒味、面色潮红", mode: "视诊", t: 0 },
      { name: "呕吐、误吸风险高", mode: "视诊", t: 120 },
      { name: "瞳孔对光反射迟钝", mode: "视诊", t: 300 },
      { name: "呼吸浅慢伴鼾声", mode: "听诊", t: 600 }
    ],
    stages: [
      { t: 0, label: "兴奋共济失调期", changes: { gcs: -3, hr: 20, emesis: 30 }, log: "血乙醇浓度升高，共济失调" },
      { t: 1800, label: "昏迷期", changes: { gcs: -5, rr: -8, spo2: -12 }, log: "呼吸中枢受抑，意识丧失" },
      { t: 5400, label: "误吸与低温期", changes: { spo2: -20, temp: -1.5, pao2: -20 }, log: "呕吐误吸致肺炎，体温下降" },
      { t: 10800, label: "终末期", changes: { rhythm: "asystole", rr: -14, glucose: -2 }, lethal: true, log: "呼吸抑制与低血糖致死亡" }
    ],
    treat: [
      { type: "drug", id: "dextrose_50", need: true, note: "常规补糖，纠正低血糖" },
      { type: "drug", id: "thiamine", need: true, note: "补充维生素 B1 预防 Wernicke 脑病" },
      { type: "drug", id: "naloxone", need: false, note: "怀疑合并阿片类中毒时试用" },
      { type: "surgery", proc: "lavage", site: "stomach", need: false, note: "大量饮酒 1-2 小时内可谨慎洗胃" }
    ],
    harm: [
      { id: "midazolam", msg: "将昏迷误判为躁动而镇静，呼吸抑制加重" },
      { id: "flumazenil", msg: "未辨明复合中毒即用氟马西尼，诱发癫痫" }
    ],
    lethalAfter: 7200,
    needSurgery: false,
    note: "侧卧位防误吸，先补糖补 B1 再评估意识"
  },
  {
    id: "benzodiazepine_overdose",
    name: "苯二氮䓬类药物过量中毒",
    dept: "急诊科",
    site: "颅腔 · 脑干及大脑皮质 GABA 受体",
    triage: 4,
    hidden: true,
    vitals: { rr: -10, spo2: -18, gcs: -8, sedation: 65, hr: -8, sbp: -12 },
    labs: { ph: 7.24, paco2: 58, glucose: 5.4, lactate: 2.4, k: 3.9, na: 138 },
    exam: { ecg: "窦性心动过缓，QT 间期正常", xray: "双肺未见实变，膈肌位置稍高" },
    symptoms: [
      { name: "自服大量安眠药后嗜睡", mode: "问诊", t: 0 },
      { name: "言语含糊、步态不稳、共济失调", mode: "视诊", t: 60 },
      { name: "呼吸浅慢、口唇发绀", mode: "视诊", t: 300 },
      { name: "昏迷、腱反射减弱", mode: "问诊", t: 900 },
      { name: "血压偏低、四肢温暖", mode: "监护", t: 600 }
    ],
    stages: [
      { t: 0, label: "中枢抑制期", changes: { sedation: 50, gcs: -4, hr: -6 }, log: "GABA 受体增强，中枢广泛抑制" },
      { t: 600, label: "呼吸抑制期", changes: { rr: -8, spo2: -16, gcs: -4 }, log: "呼吸中枢受抑，通气量下降" },
      { t: 1800, label: "深昏迷期", changes: { gcs: -5, paco2: 20, ph: -0.12 }, log: "二氧化碳蓄积，呼吸性酸中毒" },
      { t: 3600, label: "终末期", changes: { rhythm: "asystole", rr: -14 }, lethal: true, log: "呼吸停止继发心跳停止" }
    ],
    treat: [
      { type: "drug", id: "flumazenil", need: false, note: "单纯苯二氮类中毒可用，混合中毒慎用" },
      { type: "drug", id: "dextrose_50", need: false, note: "排查低血糖并补糖" },
      { type: "drug", id: "naloxone", need: false, note: "怀疑合并阿片类时试用" },
      { type: "surgery", proc: "lavage", site: "stomach", need: false, note: "服药 1 小时内洗胃并予活性炭" }
    ],
    harm: [
      { id: "flumazenil", msg: "合并三环类抗抑郁药中毒时使用氟马西尼，诱发难治性癫痫" },
      { id: "midazolam", msg: "将中毒昏迷误判为躁动而追加镇静，呼吸停止" }
    ],
    lethalAfter: 3000,
    needSurgery: false,
    note: "以通气支持为核心，氟马西尼仅用于单纯苯二氮类中毒"
  },
  {
    id: "carbon_monoxide_poisoning",
    name: "急性一氧化碳中毒",
    dept: "急诊科",
    site: "颅腔 · 大脑皮质及基底节",
    triage: 4,
    hidden: true,
    vitals: { spo2: -6, gcs: -6, brain: -35, hr: 25, sbp: -12, temp: -0.4, pain: 45, seizure: 20 },
    labs: { cohb: 42, lactate: 5.6, ph: 7.26, glucose: 6.8, creatinine: 108, wbc: 13.6 },
    exam: { ct: "双侧基底节及脑白质对称性低密度影", mri: "双侧苍白球 T2 高信号", ecg: "窦性心动过速伴 ST 段改变" },
    symptoms: [
      { name: "密闭环境内头痛头晕、恶心", mode: "问诊", t: 0 },
      { name: "口唇及皮肤呈樱桃红色", mode: "视诊", t: 0 },
      { name: "意识模糊、胡言乱语", mode: "视诊", t: 300 },
      { name: "四肢抽搐", mode: "视诊", t: 600 },
      { name: "呼吸急促、面色潮红", mode: "视诊", t: 120 }
    ],
    stages: [
      { t: 0, label: "轻度中毒期", changes: { brain: -20, pain: 35, gcs: -2 }, log: "碳氧血红蛋白形成，组织携氧能力下降" },
      { t: 600, label: "昏迷期", changes: { gcs: -6, brain: -25, seizure: 20 }, log: "脑组织严重缺氧，意识丧失抽搐" },
      { t: 2400, label: "脑水肿期", changes: { icp: 25, brain: -20, spo2: -10 }, log: "缺氧性脑水肿，颅内压升高" },
      { t: 4800, label: "终末期", changes: { rhythm: "asystole", icp: 45 }, lethal: true, log: "脑疝与循环衰竭死亡" }
    ],
    treat: [
      { type: "drug", id: "dextrose_50", need: false, note: "合并酒精中毒或低血糖时补糖" },
      { type: "drug", id: "mannitol", need: false, note: "脑水肿明显时脱水降颅压" },
      { type: "drug", id: "midazolam", need: false, note: "控制抽搐发作" },
      { type: "drug", id: "ondansetron", need: false, note: "止吐对症" }
    ],
    harm: [
      { id: "epinephrine", msg: "将心动过速误判为休克而用升压药，加重心肌缺氧" }
    ],
    lethalAfter: 3600,
    needSurgery: false,
    note: "立即脱离现场并给予 100% 高流量吸氧，重症尽早高压氧"
  },
  {
    id: "drowning_pulmonary_edema",
    name: "溺水性肺水肿",
    dept: "急诊科",
    site: "胸腔 · 双肺肺泡及气道",
    triage: 5,
    hidden: false,
    vitals: { spo2: -22, rr: 6, pao2: -32, hr: 28, temp: -1.2, secretions: 65, gcs: -5, tv: -30 },
    labs: { ph: 7.20, pao2: 48, lactate: 4.6, na: 128, k: 4.4, creatinine: 132, hb: 108 },
    exam: { xray: "双肺弥漫性片状渗出，呈蝶翼样分布", ct: "双肺弥漫磨玻璃影伴实变", us: "双肺 B 线密集" },
    symptoms: [
      { name: "溺水被救起后剧烈咳嗽、气促", mode: "问诊", t: 0 },
      { name: "口鼻溢出大量粉红色泡沫痰", mode: "视诊", t: 60 },
      { name: "双肺满布湿啰音及哮鸣音", mode: "听诊", t: 0 },
      { name: "口唇发绀、烦躁不安", mode: "视诊", t: 120 },
      { name: "体温下降、寒战", mode: "触诊", t: 600 }
    ],
    stages: [
      { t: 0, label: "淹溺窒息期", changes: { spo2: -18, rr: -8, gcs: -4 }, log: "液体吸入气道，通气换气障碍" },
      { t: 300, label: "肺水肿期", changes: { secretions: 50, spo2: -26, pao2: -28 }, log: "肺泡表面活性物质破坏，肺水肿加重" },
      { t: 1200, label: "呼吸衰竭期", changes: { spo2: -35, gcs: -5, ph: -0.15 }, log: "顽固低氧与酸中毒" },
      { t: 2400, label: "终末期", changes: { rhythm: "asystole", spo2: -45 }, lethal: true, log: "窒息与循环衰竭死亡" }
    ],
    treat: [
      { type: "drug", id: "salbutamol", need: true, note: "雾化解除支气管痉挛" },
      { type: "drug", id: "hydrocortisone", need: false, note: "减轻肺水肿与炎症反应" },
      { type: "drug", id: "midazolam", need: false, note: "需机械通气时镇静" },
      { type: "drug", id: "noradrenaline", need: false, note: "合并低体温与休克时维持循环" }
    ],
    harm: [
      { id: "furosemide", msg: "对淡水淹溺常规大量利尿，导致低血容量与电解质紊乱" }
    ],
    lethalAfter: 1800,
    needSurgery: false,
    note: "先清理气道并给氧，肺保护性通气，注意复温与低血糖"
  },
  {
    id: "heat_stroke",
    name: "重症中暑（热射病）",
    dept: "急诊科",
    site: "颅腔 · 下丘脑体温调节中枢",
    triage: 5,
    hidden: true,
    vitals: { temp: 4.2, hr: 45, rr: 14, sbp: -20, gcs: -6, seizure: 30, gi: 30, urine: -40 },
    labs: { creatine_kinase: 3800, k: 5.2, na: 148, creatinine: 186, lactate: 5.4, ph: 7.22, plt: 78, inr: 1.5 },
    exam: { ct: "脑实质弥漫性肿胀，脑沟变浅", ecg: "窦性心动过速伴 ST-T 改变", us: "下腔静脉塌陷，心脏高动力状态" },
    symptoms: [
      { name: "高温环境下劳动后头晕、乏力", mode: "问诊", t: 0 },
      { name: "皮肤灼热干燥、无汗", mode: "视诊", t: 0 },
      { name: "体温超过 40 摄氏度", mode: "监护", t: 60 },
      { name: "意识模糊、谵妄", mode: "视诊", t: 300 },
      { name: "四肢抽搐、肌肉痉挛", mode: "视诊", t: 600 },
      { name: "呕吐、腹泻", mode: "问诊", t: 900 }
    ],
    stages: [
      { t: 0, label: "高热期", changes: { temp: 3, hr: 35, gi: 20, gcs: -2 }, log: "体温调节中枢衰竭，核心体温飙升" },
      { t: 900, label: "器官损伤期", changes: { renal: -40, clotting: -30, gcs: -4, seizure: 25 }, log: "横纹肌溶解与凝血功能障碍" },
      { t: 2400, label: "多器官衰竭期", changes: { hepatic: -45, plt: -35, inr: 1.2, urine: -50 }, log: "肝肾与凝血系统全面受损" },
      { t: 4800, label: "终末期", changes: { rhythm: "asystole", temp: 1, gcs: -8 }, lethal: true, log: "高热与多器官衰竭死亡" }
    ],
    treat: [
      { type: "nurse", id: "cool", need: true, note: "黄金半小时：冰毯 + 冰帽 + 大血管处冰敷，把核心体温降到 39℃ 以下" },
      { type: "nurse", id: "ice_lavage", need: true, note: "冰盐水胃 / 腹腔灌洗：单靠体表降温不够时，这是最快把核心体温拉下来的办法" },
      { type: "drug", id: "saline", need: true, note: "补液 1000–1500 mL：热射病几乎都合并脱水与低容量，不补液光降温会休克" },
      { type: "drug", id: "midazolam", need: false, note: "控制抽搐与寒战，减少产热" },
      { type: "drug", id: "norepinephrine", need: false, note: "降温后仍低血压时维持灌注" },
      { type: "drug", id: "sodium_bicarbonate", need: false, note: "严重代谢性酸中毒与高钾时谨慎使用" },
      { type: "surgery", proc: "lavage", site: "peritoneum", need: false, note: "腹腔灌洗快速降温（与护理栏灌洗等效，二选一）" }
    ],
    stableSec: 120,
    harm: [
      { id: "paracetamol", msg: "试图用退热药降温，对热射病无效且加重肝损伤" },
      { id: "epinephrine", msg: "未降温即用升压药，加重心肌与器官损伤" }
    ],
    lethalAfter: 2700,
    needSurgery: false,
    note: "黄金半小时内把核心体温降到 39 摄氏度以下：体表降温 + 灌洗 + 补液三件套缺一不可；体温降下来后仍要稳定 2 分钟才算法转归"
  }
];