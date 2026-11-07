/* ============================================================
   LIFE SIM 2.5 · 急诊/诊室 · 药物相互作用监测
   规则库是教学近似；只对有临床意义的组合提示。
   ============================================================ */
window.M = window.M || {};
(function () {
  'use strict';
  var M = window.M;
  if (!M) return;
  var I = {};
  M.Interactions = I;

  var RULES = [
    { id: 'qt', n: 'QT 叠加', re: /胺碘酮|氟哌啶醇|昂丹司琼|氟西汀|克拉霉素|索他洛尔|多非利特|红霉素|西酞普兰/, min: 2, lvl: 'crit', tip: '多种延长 QT 的药物联用，尖端扭转型室速风险升高。' },
    { id: 'bleed', n: '出血叠加', re: /肝素|华法林|阿司匹林|氯吡格雷|替格瑞洛|利伐沙班|阿哌沙班|依诺肝素/, min: 2, lvl: 'crit', tip: '抗凝/抗血小板多药联合，出血风险显著增加。' },
    { id: 'sero', n: '5-HT 综合征', re: /氟西汀|曲马多|利奈唑胺|舍曲林|帕罗西汀|文拉法辛/, min: 2, lvl: 'crit', tip: '两种以上 5-HT 能药物：警惕高热、肌阵挛、意识改变。' },
    { id: 'sed', n: '呼吸抑制协同', re: /咪达唑仑|丙泊酚|芬太尼|瑞芬太尼|吗啡|氯胺酮/, min: 2, lvl: 'crit', tip: '镇静/阿片多药联用，呼吸驱动与意识抑制叠加。' },
    { id: 'av', n: '房室传导抑制', re: /美托洛尔|艾司洛尔|地尔硫|维拉帕米|地高辛|胺碘酮|拉贝洛尔/, min: 2, lvl: 'warn', tip: '负性变时/房室传导药物叠加，警惕心动过缓或高度阻滞。' },
    { id: 'nephro', n: '肾毒性叠加', re: /万古霉素|庆大霉素|阿米卡星|呋塞米|两性霉素/, min: 2, lvl: 'warn', tip: '多种潜在肾毒性药物，监测肌酐与尿量。' },
    { id: 'hyperk', n: '高钾风险', re: /琥珀酰胆碱|氯化钾/, min: 2, lvl: 'crit', tip: '去极化肌松药与补钾叠加，警惕高钾性心律失常。' }
  ];

  function activeNames(sim) {
    var out = [];
    (sim.rxList || []).forEach(function (r) {
      if (r.c > 0.02 && !r.ended) out.push({ name: r.D.name, c: r.c, D: r.D });
    });
    return out;
  }

  I.scan = function (sim) {
    var meds = activeNames(sim);
    var alerts = [];
    RULES.forEach(function (rule) {
      var hits = meds.filter(function (m) { return rule.re.test(m.name) || rule.re.test((m.D.cls || '')); });
      if (hits.length >= rule.min) {
        alerts.push({
          id: rule.id, level: rule.lvl, title: rule.n,
          text: rule.tip + '（' + hits.map(function (x) { return x.name; }).join(' + ') + '）'
        });
      }
    });
    // 阿片 + 苯二氮䓬单独强化
    var opioid = meds.some(function (m) { return /芬太尼|瑞芬太尼|吗啡|氢吗啡酮/.test(m.name); });
    var benzo = meds.some(function (m) { return /咪达唑仑|地西泮|劳拉西泮/.test(m.name); });
    if (opioid && benzo && !alerts.some(function (a) { return a.id === 'sed'; })) {
      alerts.push({ id: 'opibenzo', level: 'crit', title: '阿片 + 苯二氮䓬', text: '呼吸抑制与镇静显著协同，警惕呼吸暂停。' });
    }
    if (alerts.some(function (a) { return a.id === 'av'; }) && (sim.v && sim.v.hr < 50)) {
      alerts.push({ id: 'brady', level: 'crit', title: '症状性心动过缓', text: '当前心率 ' + Math.round(sim.v.hr) + ' 次/分，房室传导药物叠加。' });
    }
    return alerts;
  };

  function badge() {
    var b = document.getElementById('ixBadge');
    if (!b) {
      b = document.createElement('button');
      b.id = 'ixBadge';
      b.className = 'ix-badge';
      b.innerHTML = '相互作用 <b>0</b>';
      b.title = '查看药物相互作用';
      b.addEventListener('click', open);
      document.body.appendChild(b);
    }
    return b;
  }

  function update() {
    var sim = M.GAME && M.GAME.sim;
    if (!sim) return;
    var alerts = I.scan(sim);
    I.last = alerts;
    var b = badge();
    b.querySelector('b').textContent = alerts.length;
    b.classList.toggle('on', alerts.length > 0);
    b.classList.toggle('crit', alerts.some(function (a) { return a.level === 'crit'; }));
  }

  function open() {
    var sim = M.GAME && M.GAME.sim;
    if (!sim) return;
    var alerts = I.scan(sim);
    var body = '<div class="ix-list">' + (alerts.length ? alerts.map(function (a) {
      return '<div class="alert ' + (a.level === 'crit' ? 'crit' : '') + '"><b>' + M.UI.esc(a.title) + '</b>' + M.UI.esc(a.text) + '</div>';
    }).join('') : '<div class="alert good"><b>未检测到显著相互作用</b>继续添加药物，系统会实时匹配规则库。</div>') + '</div>' +
      '<div class="exam-note">规则库为教学近似：QT 叠加、出血、5-HT、镇静/呼吸抑制、房室传导、肾毒性、高钾。</div>';
    M.UI.openModal(M.UI.modalShell('narrow', M.UI.modalHead('药物相互作用', '实时监测 · 教学规则库'), body));
    M.UI.bindClose();
  }
  I.open = open;

  function init() {
    if (!document.getElementById('ixBadge')) badge();
    setInterval(update, 900);
    update();
    if (String(location.hash || '').indexOf('ixdemo') >= 0) {
      setTimeout(function () {
        var sim = M.GAME && M.GAME.sim;
        if (!sim) return;
        M.give(sim, 'amiodarone', 150, 'iv');
        M.give(sim, 'haloperidol', 5, 'iv');
        M.give(sim, 'ondansetron', 4, 'iv');
      }, 1200);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
