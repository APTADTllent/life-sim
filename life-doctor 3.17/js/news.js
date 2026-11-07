/* ============================================================
   LIFE SIM · 新闻与特殊事件
   休息时可以在「新闻」里看到当天的社会/医疗新闻；小概率出现
   特殊事件（枪击、运动会猝死、飞机失事、车祸），对应病人会
   在接下来的一两位里被送来。
   特殊病人可以带「不计入统计」标记（例如嫌犯被击中数十枪）。
   ============================================================ */
window.M = window.M || {};
(function () {
  'use strict';
  var M = window.M;

  /* ---------- 普通新闻素材 ---------- */
  var POOL = [
    '市卫健委通报：近期流感样病例上升，门诊量较上周增加 18%，建议老人与儿童及时接种疫苗。',
    '本市三甲医院胸痛中心通过国家级认证，急性心梗患者平均门球时间缩短至 62 分钟。',
    '气象台发布高温橙色预警：未来三天最高气温 38℃，提醒户外作业人员注意补水与防暑。',
    '一男子连续熬夜加班后突发胸痛，送医确诊急性心肌梗死，医生提醒年轻人也要警惕。',
    '市急救中心新增 12 辆负压救护车，院前急救平均反应时间缩短到 9 分钟。',
    '本周进入手足口病高发期，疾控提醒托幼机构加强晨检与消毒。',
    '一位 78 岁老人误服降压药过量导致低血压昏迷，经急诊洗胃与升压治疗已脱险。',
    '市人民医院开展「卒中绿色通道」演练，静脉溶栓时间窗内到院率提升至 71%。',
    '外卖骑手雨天路滑摔伤致锁骨骨折，骨科提醒雨天骑行注意减速。',
    '本地血库 O 型血库存偏低，中心血站呼吁市民踊跃献血。',
    '一家庭聚餐食用野生蘑菇后 4 人中毒，其中 1 人肝功能衰竭正在 ICU 救治。',
    '医院急诊科一晚接诊 6 例急性酒精中毒，医生提醒过节莫贪杯。',
    '市医保局：门诊慢特病报销范围扩大，高血压、糖尿病等 12 个病种纳入。',
    '研究显示：每周 150 分钟中等强度运动可显著降低心血管事件风险。',
    '一儿童误吞纽扣电池，内镜下成功取出，医生提醒家长收好小物件。',
    '近期诺如病毒感染增多，疾控提示注意手卫生与食物彻底加热。',
    '急救科普：心脏骤停后 4 分钟内开始按压，生存率可提高 2–3 倍。',
    '市三院引进 ECMO 团队，成功救治一例暴发性心肌炎合并心源性休克患者。',
    '夏季溺水事故多发，消防提醒：不熟悉水域不要下水施救，先呼救再借助漂浮物。',
    '一患者因「感冒」自行服用多种感冒药导致对乙酰氨基酚过量，出现急性肝损伤。'
  ];

  /* ---------- 特殊事件（小概率） ---------- */
  var EVENTS = [
    {
      kind: 'police_shot', chance: 0.05, weight: 3,
      title: '持枪拒捕 · 民警中弹',
      news: '昨晚 22 时，城西一出租屋内嫌疑人持枪拒捕，一名 34 岁民警在破门时腹部中弹，已由同事紧急送医。',
      detail: '伤者送达时血压 78/45，腹部贯通伤、腹腔积血，需要立即剖腹探查止血。'
    },
    {
      kind: 'suspect_shot', chance: 0.03, weight: 2,
      title: '警情通报 · 嫌疑人被击中',
      news: '警方通报：拒捕嫌疑人被依法开枪制止，身中多弹，120 到场时已无生命体征；案件正在进一步侦办。',
      detail: '这类送来的「病人」不是救治对象，只做记录，不计入接诊与死亡率。'
    },
    {
      kind: 'marathon', chance: 0.04, weight: 2,
      title: '城市马拉松 · 选手倒地',
      news: '今晨城市马拉松 32 公里处，一名 26 岁选手突然倒地、呼之不应，现场医疗队立即开始心肺复苏并转运。',
      detail: '年轻运动员的心脏骤停，黄金 4 分钟决定生死。'
    },
    {
      kind: 'plane_crash', chance: 0.02, weight: 1,
      title: '支线客机迫降 · 多人受伤',
      news: '一架支线客机在郊区迫降，机上 9 人受伤，3 名重伤员被分流至我院，其中 1 人爆震伤合并气胸。',
      detail: '批量伤员，优先处理张力性气胸与活动性出血。'
    },
    {
      kind: 'car_crash', chance: 0.05, weight: 3,
      title: '绕城高速连环追尾',
      news: '绕城高速发生 5 车连环追尾，一名司机被卡在驾驶室 20 分钟后救出，送至我院时面色苍白、血压偏低。',
      detail: '车祸多发伤：先按 ABCDE 评估，别被表面的骨折吸引全部注意力。'
    }
  ];

  /* ---------- 特殊病人模板 ---------- */
  M.SPECIAL_PATIENTS = {
    police_shot: {
      title: '民警中弹', news: EVENTS[0].news, disease: 'gunshot_wound', noStats: false,
      patient: { name: '陈志远', sex: '男', age: 34, job: '民警' },
      vitals: { sbp: -8, hb: -0.6 },
      note: '执法中受伤，按普通病人计入统计'
    },
    suspect_shot: {
      title: '嫌疑人中弹（现场死亡）', news: EVENTS[1].news, disease: 'gunshot_wound',
      noStats: true, deadOnArrival: true,
      patient: { name: '不明身份男子', sex: '男', age: 41, job: '嫌疑人' },
      note: '非救治对象：只留记录，不计入接诊人数与死亡率'
    },
    marathon: {
      title: '马拉松选手猝死', news: EVENTS[2].news, disease: 'ohca_vf', noStats: false,
      patient: { name: '林一鸣', sex: '男', age: 26, job: '马拉松选手' },
      note: '年轻运动员心脏骤停，抢救成功率取决于第一时间除颤'
    },
    plane_crash: {
      title: '空难伤员', news: EVENTS[3].news, disease: 'blast_injury', noStats: false,
      patient: { name: '周启航', sex: '男', age: 45, job: '乘客' },
      note: '爆震伤合并气胸'
    },
    car_crash: {
      title: '车祸多发伤', news: EVENTS[4].news, disease: 'fall_from_height', noStats: false,
      patient: { name: '黄建国', sex: '男', age: 38, job: '司机' },
      note: '方向盘撞击伤 + 骨盆骨折'
    }
  };
  M.SPECIAL_EVENTS = EVENTS;

  /* ---------- 新闻流 ---------- */
  var feedSeq = 0;
  M.newsFeed = function (n) {
    n = n || 3;
    var out = [];
    for (var i = 0; i < n; i++) {
      feedSeq++;
      out.push({ id: 'n' + feedSeq, t: Date.now(), text: POOL[Math.floor(Math.random() * POOL.length)] });
    }
    return out;
  };

  /* 掷一次特殊事件：默认 6% 概率（可在配置里调） */
  M.rollSpecialEvent = function (p) {
    if (Math.random() > (p === undefined ? 0.06 : p)) return null;
    var total = 0, i;
    for (i = 0; i < EVENTS.length; i++) total += EVENTS[i].weight || 1;
    var r = Math.random() * total, acc = 0;
    for (i = 0; i < EVENTS.length; i++) {
      acc += EVENTS[i].weight || 1;
      if (r <= acc) return EVENTS[i];
    }
    return EVENTS[0];
  };
  M.eventDef = function (kind) {
    for (var i = 0; i < EVENTS.length; i++) if (EVENTS[i].kind === kind) return EVENTS[i];
    return null;
  };

  /* 一条「记录」：不计入统计的病人也留档 */
  M.addRecord = function (sim, text) {
    sim.records = sim.records || [];
    sim.records.push({ t: sim.t, text: text });
    if (sim.records.length > 40) sim.records.shift();
  };
})();
