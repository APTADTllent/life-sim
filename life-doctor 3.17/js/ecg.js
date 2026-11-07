/* ============================================================
   LIFE SIM · 波形合成与绘制 · v2.5
   ECG(12 导联) / 动脉压 / 脉搏波 / 呼吸 / 脑电 / 呼末 CO2

   v2.5 重写（按真实心电图校准）：
   1) 肢体导联不再各写各的：先定额面心电向量，再投影出 I/II/III/aVR/aVL/aVF。
      Einthoven 定律（I + III = II）与 aVR = −(I + II)/2 自动成立，
      电轴也由波形本身算出来，而不是另外编一个数字。
   2) 心搏按「R 波时刻表」合成：P 波画在下一个 R 波之前
      （旧版把 P 画在 R 之后，实际从未显示出来），
      各导联共用同一份时刻表 → 12 导联真正同步，房颤的 RR 也各导联一致。
   3) 纸速 / 增益标定：横向 25 mm/s、纵向 10 mm/mV，1 mm 网格与波形严格对应，
      PR / QRS / QT 都能在格子上数出来。
   4) 形态取参考值：P 波 ≤ 2.5 mm、胸前 R 波递增（V1 rS → V5 qR）、
      V1 与 aVR 的 T 波倒置、T 波上升慢下降快（不对称高斯）。
   5) 缺血按区域给出 ST 抬高 + 镜像压低 + 病理性 Q + R 波丢失 + 超急期高 T。
   ============================================================ */
window.M = window.M || {};
(function () {
  'use strict';
  var M = window.M;
  var clamp = M.clamp;
  var rnd = M.rnd || function (a, b) { return a + Math.random() * (b - a); };
  var DEG = Math.PI / 180;

  /* ---------- 数学工具 ---------- */
  function gauss(x, s) { return Math.exp(-(x * x) / (2 * s * s)); }
  /* 不对称高斯：x < 0 一侧更宽（上升慢），x > 0 一侧更窄（下降快）——T 波即此形态 */
  function skew(x, s, k) {
    var ss = s * (1 + (x < 0 ? (k || 0) : -(k || 0)));
    var u = x / ss;
    return Math.exp(-0.5 * u * u);
  }
  function smoothstep(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }
  /* 由心搏序号取得稳定的伪随机数：同一时刻所有导联拿到同一个值（房颤 RR 才能同步） */
  function hash01(n) { var x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }
  /* 软限幅：波形越界时按 tanh 平滑压缩，不会出现平顶（真实记录仪也不会画出方头） */
  function softLimit(x, lim) {
    var a = Math.abs(x);
    if (a <= lim * 0.8) return x;
    var y = lim * 0.8 + lim * 0.2 * Math.tanh((a - lim * 0.8) / (lim * 0.2));
    return x < 0 ? -y : y;
  }

  /* ============================================================
     一、导联体系
     ============================================================
     额面六轴：I 0°、II 60°、III 120°、aVR −150°、aVL −30°、aVF 90°。
     一个额面向量（角度 θ、幅度 M）在导联 φ 上的投影为 M·cos(θ−φ)；
     加压肢体导联的幅度再乘 √3/2 ≈ 0.866（Goldberger 加压）。
     这样 I + III = II 与 aVR = −(I+II)/2 恒成立。 */
  var LEAD_AXIS = { I: 0, II: 60, III: 120, aVR: -150, aVL: -30, aVF: 90 };
  var LEADS = [
    { k: 'I', grp: 'limb' }, { k: 'II', grp: 'limb' }, { k: 'III', grp: 'limb' },
    { k: 'aVR', grp: 'limb' }, { k: 'aVL', grp: 'limb' }, { k: 'aVF', grp: 'limb' },
    { k: 'V1', grp: 'chest' }, { k: 'V2', grp: 'chest' }, { k: 'V3', grp: 'chest' },
    { k: 'V4', grp: 'chest' }, { k: 'V5', grp: 'chest' }, { k: 'V6', grp: 'chest' }
  ];
  M.LEADS = LEADS;
  M.LEAD_AXIS = LEAD_AXIS;

  function proj(axis, lead) {
    var phi = LEAD_AXIS[lead];
    if (phi === undefined) return 0;
    var a = Math.cos((axis - phi) * DEG);
    return (lead === 'aVR' || lead === 'aVL' || lead === 'aVF') ? a * 0.866 : a;
  }

  /* 胸前导联正常形态（mV；1 mV = 10 mm）：
     R 波从 V1 的 rS 递增到 V5 的 qR，S 波在 V2 最深，V1 的 T 波倒置。
     这些数值按正常成人心电图的常见幅度取，量大者（V4–V5 R 波 25 mm）
     会被画面的软限幅压一点，属于正常变异范围。 */
  var PREC = {
    V1: { p: 0.08, q: 0.00, r: 0.18, s: -1.05, t: -0.12, st: 0.02 },
    V2: { p: 0.11, q: 0.00, r: 0.30, s: -1.28, t: 0.40, st: 0.06 },
    V3: { p: 0.12, q: 0.00, r: 0.62, s: -0.95, t: 0.48, st: 0.05 },
    V4: { p: 0.12, q: -0.05, r: 1.12, s: -0.42, t: 0.44, st: 0.02 },
    V5: { p: 0.11, q: -0.09, r: 1.22, s: -0.22, t: 0.36, st: 0.01 },
    V6: { p: 0.10, q: -0.08, r: 1.02, s: -0.14, t: 0.30, st: 0.00 }
  };

  /* 区域缺血的「损伤电流向量」方向（额面）。
     肢体导联的 ST 段由这个向量投影得到，因此 I + III = II 与 aVR = −(I+II)/2
     在 ST 段和 T 波上也成立（否则抬高的 II、III 与压低的 I 会互相矛盾）。 */
  var ST_AXIS = { anterior: -60, inferior: 105, lateral: 5, posterior: 75, diffuse: 25, right: 135 };
  /* 肢体导联的损伤电流幅度系数：胸前导联抬高通常 4–8 mm，
     肢体导联的镜像压低只有 1–2 mm，两者不能同幅。 */
  var ST_LIMB = { anterior: 0.55, inferior: 1.05, lateral: 0.85, posterior: 0.25, diffuse: 0.55, right: 0.50 };
  /* 病理性 Q 波的方向（额面）：指向背离梗死区的一侧 */
  var Q_AXIS = { anterior: 200, inferior: 285, lateral: 180, posterior: 20, diffuse: 180, right: 285 };

  /* 胸前导联（不受 Einthoven 约束）的 ST 偏移权重：× 最大抬高幅度。
     正值 = 抬高，负值 = 镜像压低，按冠脉供血区域定位。 */
  var ST_MAP = {
    anterior: { V1: 0.55, V2: 1.00, V3: 1.15, V4: 0.88, V5: 0.35, V6: 0.15 },
    inferior: { V1: -0.10, V2: -0.12, V3: -0.08 },
    lateral: { V5: 0.78, V6: 0.66, V2: -0.10 },
    posterior: { V1: -0.55, V2: -0.72, V3: -0.46, V4: -0.16 },
    diffuse: { V2: 0.34, V3: 0.40, V4: 0.40, V5: 0.34, V6: 0.28 },
    right: { V1: 0.46, V2: -0.10 }
  };

  /* 心电轴：每例病人固定一个基础轴（±15° 内随机），再按病变区域偏移。
     右心负荷 → 电轴右偏；左前分支/侧壁梗死 → 电轴左偏。 */
  function axisOf(sim) {
    var v = sim.v || {};
    var base = sim.ecgAxis;
    if (base === undefined) { base = 55 + rnd(-15, 15); sim.ecgAxis = base; }
    var reg = sim.ecgRegion || '';
    var a = base;
    if (reg === 'right') a = 112;
    else if (reg === 'inferior') a = base - 12;
    else if (reg === 'lateral') a = base - 22;
    else if (reg === 'anterior') a = base - 4;
    var kk = v.k === undefined ? 4.2 : v.k;
    if (kk > 6.4) a += (kk - 6.4) * 10;              /* 严重高钾：电轴向右上偏移 */
    return clamp(a, -120, 175);
  }

  /* ============================================================
     二、单搏形态参数（按导联、按生理状态）
     ============================================================ */
  function ecgParams(sim, leadK) {
    var v = sim.v || {};
    var lead = leadK || 'II';
    var prec = PREC[lead];
    var k = v.k === undefined ? 4.2 : v.k;
    var ca = v.ca === undefined ? 2.3 : v.ca;
    var mg = v.mg === undefined ? 0.9 : v.mg;
    var ph = v.ph === undefined ? 7.4 : v.ph;
    var temp = v.temp === undefined ? 36.8 : v.temp;
    var spo2 = v.spo2 === undefined ? 98 : v.spo2;
    var hr = clamp(v.hr === undefined ? 75 : v.hr, 20, 260);
    var volume = v.volume === undefined ? 5000 : v.volume;
    var contract = v.contractility === undefined ? 100 : v.contractility;
    var av = v.avconduction === undefined ? 100 : v.avconduction;
    var cor = v.coronary === undefined ? 100 : v.coronary;

    var hyperK = clamp((k - 4.5) / 2.5, 0, 1.7);
    var hypoK = clamp((3.5 - k) / 1.2, 0, 1);
    var hypoCa = clamp((2.15 - ca) / 0.6, 0, 1);
    var hyperCa = clamp((ca - 2.6) / 0.8, 0, 1);
    var hypoMg = clamp((0.72 - mg) / 0.32, 0, 1);
    var acidosis = clamp((7.30 - ph) / 0.45, 0, 1);
    var hypox = clamp((93 - spo2) / 22, 0, 1.4);
    var hypo = clamp((35.2 - temp) / 4.6, 0, 1);
    var fever = clamp((temp - 37.6) / 2.4, 0, 1);

    /* ---- 间期：QT 按 Bazett 随 RR 校正 ---- */
    var rr = 60 / hr;
    var qtc = clamp(v.qt || 400, 260, 700) / 1000;
    var qt = clamp(qtc * Math.sqrt(rr), 0.19, 0.70);
    var pr = clamp(0.150 + (100 - av) / 100 * 0.080 + hyperK * 0.018, 0.11, 0.40);
    var qw = clamp(1 + Math.max(0, hyperK - 0.12) * 1.30 + acidosis * 0.30 + hypo * 0.18, 1, 3.0);
    /* 绘图用的宽度：高钾到正弦波时不再继续加宽，避免画面与报告值脱节 */
    var qwDraw = Math.min(qw, 2.35);
    var qrs = 0.088 * qwDraw;

    /* ---- 振幅：收缩力、容量、高钾低电压、低温、心包/肥胖 ---- */
    var amp = 1;
    amp *= 0.70 + 0.30 * clamp(contract / 100, 0.1, 1.8);
    amp *= 0.70 + 0.30 * clamp(volume / 5000, 0.4, 1.6);
    amp *= 1 - 0.20 * hyperK - 0.14 * hypo;
    if (sim.ecgLowVoltage) amp *= 0.45;

    var rMag = 1.30 * amp;
    var sMag = 0.26 * amp;
    var qMag = 0.10 * amp;
    var pMag = 0.20 * amp * (1 - clamp((hr - 100) / 120, 0, 0.55));
    pMag *= clamp(1 - Math.max(0, k - 5.4) / 1.5, 0, 1);       /* 高钾使 P 波低平 */
    var tMag = 0.40 * amp;
    tMag *= 1 + hyperK * 1.55 + hypoCa * 0.10 + hyperCa * 0.05 - hypoK * 0.55 - hypo * 0.25 - fever * 0.05;

    /* ---- 缺血 ---- */
    var axis = axisOf(sim);
    var region = sim.ecgRegion || '';
    var smap = ST_MAP[region];
    var isch = clamp((78 - cor) / 78, 0, 1);
    var stBase = isch * 0.45;                                   /* 最大 ST 偏移 4.5 mm */

    var pA = 0, qA = 0, rA = 0, sA = 0, tA = 0, stA = 0;
    var pathologicalQ = false;

    if (!prec) {
      /* 肢体导联：全部由额面向量投影得到 */
      pA = pMag * proj(55, lead);
      qA = qMag * proj(180, lead);                              /* 室间隔 q：向右、向前 */
      rA = rMag * proj(axis, lead);
      sA = -sMag * proj(axis, lead);                            /* 终末向量指向反方向 */
      tA = tMag * proj(axis - 10, lead);
    } else {
      var right = clamp((axis - 60) / 60, -1, 1.4);             /* >0 表示电轴右偏 */
      pA = prec.p * amp * (1 - clamp((hr - 100) / 130, 0, 0.5));
      pA *= clamp(1 - Math.max(0, k - 5.4) / 1.5, 0, 1);
      qA = prec.q * amp;
      rA = prec.r * amp;
      sA = prec.s * amp;
      tA = prec.t * amp;
      /* 电轴右偏：V1/V2 的 r 变大、V5/V6 的 S 变深（右室肥厚/右心负荷的表现） */
      if (right > 0) {
        if (prec.r < 0.4) rA *= 1 + 0.45 * right;
        if (prec.r > 0.9) rA *= 1 - 0.22 * right;
        if (prec.s < -0.8) sA *= 1 - 0.12 * right;
        if (prec.s > -0.3) sA *= 1 + 0.40 * right;
      }
      /* 后壁梗死：V1/V2 出现高大 R 波（正后壁 Q 波的镜像） */
      if (region === 'posterior' && (lead === 'V1' || lead === 'V2') && isch > 0.3) {
        rA *= 1 + 0.75 * isch;
      }
    }

    /* ---- ST 段 ---- */
    var stMag = stBase * (ST_LIMB[region] === undefined ? 0.6 : ST_LIMB[region]);
    var stAxis = ST_AXIS[region];
    if (sim.ecgSTDepress) {
      /* NSTEMI / 不稳定型心绞痛：压低为主，aVR 反而抬高 */
      var dep = isch * 0.16;
      if (smap && smap[lead] !== undefined) stA = -(Math.abs(smap[lead]) * 0.55 + 0.45) * dep;
      else stA = (lead === 'aVR' ? dep * 1.5 : -dep);
    } else if (smap) {
      /* 肢体导联：损伤电流向量投影；胸前导联：按区域权重 */
      stA = prec ? stBase * (smap[lead] || 0) : stMag * proj(stAxis, lead);
    } else if (isch > 0.18) {
      stA = -isch * 0.10;                                       /* 无明确区域的弥漫性压低 */
    }
    /* 正常早期复极：V2/V3 可有 0.5 mm 左右的抬高，V1/V2 最明显 */
    if (!smap && !sim.ecgSTDepress && prec) stA += prec.st;
    if (hypox > 0.4) stA -= (hypox - 0.4) * 0.16;
    if (hyperK > 0.8) stA -= (hyperK - 0.8) * 0.10;
    if (hypoK > 0.4) stA -= hypoK * 0.06;
    stA = clamp(stA, -0.75, 0.75);

    /* 梗死相关导联：R 波丢失 + 病理性 Q（Q 波宽度 > 40 ms）。
       肢体导联的 Q 用同一个向量投影，避免出现「I 有 Q、III 却没有」的矛盾。 */
    if (smap) {
      var gm = prec ? (smap[lead] || 0) : stA / Math.max(0.02, stMag);
      if (gm > 0.5 && isch > 0.45) {
        var loss = clamp((isch - 0.45) / 0.55, 0, 1) * clamp((gm - 0.5) * 2, 0, 1);
        rA *= 1 - 0.45 * loss;
        if (lead !== 'aVR') {
          if (prec) qA -= 0.22 * loss;
          else qA += 0.22 * loss * proj(Q_AXIS[region] === undefined ? 180 : Q_AXIS[region], lead);
          if (loss > 0.25) pathologicalQ = true;
        }
      }
    }

    /* 右心负荷（肺栓塞）：S1Q3T3、右胸导联 T 波倒置——与冠脉灌注无关，
       因此单独叠加，不受 isch 影响。 */
    if (region === 'right') {
      if (lead === 'I') { sA -= 0.18 * amp; tA *= 0.55; }
      if (lead === 'III') { qA -= 0.16 * amp; tA = -Math.abs(tA) * 0.90; }
      if (lead === 'aVF') tA = -Math.abs(tA) * 0.70;
      if (lead === 'V1') { rA *= 1.45; tA = -Math.abs(tA) * 1.15; }
      if (lead === 'V2' || lead === 'V3') tA = -Math.abs(tA) * 0.85;
    }

    /* ---- T 波 ----
       肢体导联：正常 T 向量 + 损伤 T 向量（同一方向），Einthoven 关系仍然成立。
       胸前导联：损伤导联 T 高宽，镜像/压低导联 T 倒置。 */
    if (!prec && smap && !sim.ecgSTDepress) {
      tA = 1.25 * stA + tMag * proj(axis - 10, lead) * (1 - 0.7 * clamp(isch, 0, 1));
    } else if (region === 'posterior' && prec && lead !== 'V4') {
      /* 后壁梗死的镜像：V1–V3 ST 压低但 T 波高耸直立 */
      tA = Math.abs(tA) * 1.35;
    } else {
      var inj = 0;
      if (smap && Math.abs(stA) > 0.07) inj = stA > 0 ? 1 : -1;
      else if (sim.ecgSTDepress && stA < -0.05) inj = -1;
      if (inj > 0) {
        tA = Math.abs(tA) * (1.15 + clamp(stA * 1.6, 0, 1.2));
      } else if (inj < 0) {
        tA = -Math.abs(tA) * 0.90;
      }
    }
    var tSig = 0.040 * (1 + hypoCa * 0.30 - hyperK * 0.34 - hypo * 0.10 + hypoK * 0.05);
    /* T 波峰位于 QT 的 70% 处：这样 QRS 之后留有明确的等电位 ST 段，
       不会出现「T 波紧贴 QRS、没有 ST 段」的假图。 */
    var tPeak = clamp(qt * 0.70, 0.15, 0.44);
    var tEnd = clamp(tPeak + 3.0 * tSig, 0.20, 0.72);

    /* ---- U 波（低钾、低镁）---- */
    var uA = 0;
    if (hypoK > 0.05 || hypoMg > 0.25) {
      uA = 0.06 * Math.max(hypoK, hypoMg * 0.6) * (prec ? 1.30 : 0.75) * amp;
    }
    var uOff = tPeak + 2.6 * tSig + 0.07;

    /* ---- J 波（Osborne）：低体温，出现在 QRS 主波向上的导联 ---- */
    var jA = 0;
    if (hypo > 0.15 && rA > 0) jA = (prec ? 0.10 : 0.06) * (hypo - 0.15) * amp;

    return {
      pr: pr, qrs: qrs, qw: qw, qwDraw: qwDraw, qt: qt, qtc: qtc,
      pA: pA, pBiphasic: (lead === 'V1'),
      qA: qA, rA: rA, sA: sA, jA: jA,
      rNotch: qw > 1.55,
      stA: stA, tA: tA, tPeak: tPeak, tSig: tSig, uA: uA, uOff: uOff,
      isch: isch, region: region, lead: lead, axis: axis, pathologicalQ: pathologicalQ
    };
  }
  M.ecgParams = ecgParams;

  /* ============================================================
     三、心搏时刻表（带记忆）
     ============================================================
     真实心脏不会因为「心率变了」就把已经发生过的心搏挪个位置。旧实现直接用
     R(k) = k / f 现算，f 取的是当前心率：心率只要变动零点几次/分，t 越大、
     k 越大，整条波形就会被横向推移（t = 100 s 时可达 0.2 s，接近半个 RR）。
     表现就是波形无缘无故地抖一下、12 导联每 0.45 s 重画时整条描记微微横跳，
     看着像噪点。现在改成有心搏表：已经排定的心搏时刻固定不动，新心搏按当前
     心率往后排，房颤/RSA 的逐搏不规则仍然保留。
     ============================================================ */
  function beatTime(k, f, irregular, rsaAmp) {
    var r = k / f;
    if (rsaAmp) r += rsaAmp * Math.sin(2 * Math.PI * (k / f) / 4);   /* 呼吸性窦性心律不齐 */
    if (irregular) r += (hash01(k) - 0.5) * 0.42 / f;                /* 房颤的绝对不规则 */
    return r;
  }
  /* 相邻两搏的间隔；按当前心率算，所以心率变化只影响「以后」的心搏 */
  function beatStep(k, f, irregular, rsaAmp) {
    var d = beatTime(k, f, irregular, rsaAmp) - beatTime(k - 1, f, irregular, rsaAmp);
    return d > 0.05 ? d : 0.05;
  }
  function beatGrid(sim, t, f, irregular, rsaAmp, key) {
    f = Math.max(0.25, f);
    var all = sim.ecgBeat || (sim.ecgBeat = {});
    var B = all[key || 'ecg'];
    var irr = !!irregular, rsa = rsaAmp || 0;
    /* 换心律、读档、时间被快进（warp / 换病人）时，旧表已经对不上了，重建 */
    if (B && (!B.list || !B.list.length ||
      B.irr !== irr || B.rsa !== rsa ||
      t > B.list[B.list.length - 1].t + 6 || t < B.list[0].t - 6)) B = null;
    if (!B) {
      var k0 = Math.floor(t * f);
      B = all[key || 'ecg'] = { irr: irr, rsa: rsa, i: 0, list: [] };
      B.list.push({ k: k0, t: beatTime(k0, f, irr, rsa) });
      /* 往过去补 20 个心搏：够 12 导联 4 秒窗口（300 次/分也只有 5 搏/秒） */
      for (var q = 0; q < 20; q++) {
        var kf = B.list[0].k;
        B.list.unshift({ k: kf - 1, t: B.list[0].t - beatStep(kf, f, irr, rsa) });
      }
      B.i = B.list.length - 1;
    }
    /* 往后排：覆盖到 t 之后两个心搏，P 波要画在下一个 R 波之前 */
    var guard = 0;
    while (B.list[B.list.length - 1].t <= t + 2 && guard++ < 64) {
      var kn = B.list[B.list.length - 1].k + 1;
      B.list.push({ k: kn, t: B.list[B.list.length - 1].t + beatStep(kn, f, irr, rsa) });
    }
    /* t 落在表头之前（12 导联往回取样）：继续往过去补 */
    guard = 0;
    while (B.list[0].t > t - 0.5 && guard++ < 64) {
      var kb = B.list[0].k;
      B.list.unshift({ k: kb - 1, t: B.list[0].t - beatStep(kb, f, irr, rsa) });
      B.i++;
    }
    /* 只留最近 64 搏，避免长局内存无限增长 */
    while (B.list.length > 64) {
      B.list.shift();
      if (B.i > 0) B.i--;
    }
    var i = B.i;
    if (i >= B.list.length) i = B.list.length - 1;
    if (i < 0) i = 0;
    while (i > 0 && B.list[i].t > t) i--;
    while (i + 1 < B.list.length && B.list[i + 1].t <= t) i++;
    B.i = i;
    var a = B.list[i], b = B.list[i + 1] || a, p = B.list[i - 1] || a;
    return {
      last: a.t, next: b.t, prev: p.t,
      period: Math.max(0.12, b.t - a.t), idx: a.k
    };
  }

  /* ============================================================
     四、波形合成
     ============================================================ */
  /* P 波：圆钝、略不对称，时限约 100 ms；V1 呈双相（先正后负） */
  function pWave(x, P) {
    if (!P.pA) return 0;
    var w = 0.024 * (P.pw || 1);
    var v = P.pA * skew(x, w, 0.20);
    if (P.pBiphasic) v += -0.75 * P.pA * gauss(x - 0.045, 0.011);
    return v;
  }
  /* 与 R 波表对齐的 P 波：dN = t − 下一个 R 波（负值），P 峰落在 R 前约 PR 处 */
  function pBeforeR(dN, P) {
    var pk = -0.045 - P.pr + 0.050;        /* QRS 起点在 R 峰前 45 ms */
    return pWave(dN - pk, P);
  }
  /* 独立心房节律（三度阻滞、房扑、二度阻滞用） */
  function pOsc(t, rate, P) {
    var ph = t * rate;
    var d = (ph - Math.floor(ph)) / rate;
    return pWave(d - 0.016, P);
  }

  /* 心室复合波：dNear = 距最近 R 峰的时间（可为负，画出 Q 波与 R 波升支）；
     dTail = 距上一个 R 峰的时间（≥ 0，画出 S 波、ST 段、T 波、U 波）。
     旧版只从「上一个 R」往后画，R 波升支与 Q 波被整段裁掉，
     所以波形看起来像一根针 —— 这里按前后两侧分别合成。 */
  function vent(dNear, dTail, P) {
    var qw = P.qwDraw || P.qw, v = 0;
    var qSig = Math.abs(P.qA) > 0.15 ? 0.016 : 0.0080 * qw;     /* 病理性 Q 更宽（> 40 ms） */
    /* Q 波 */
    if (P.qA) v += P.qA * gauss(dNear + 0.024 * qw, qSig);
    /* R 波（以峰为界，两侧都画） */
    if (P.rA) {
      v += P.rA * skew(dNear, 0.0098 * qw, 0.10);
      if (P.rNotch) v += P.rA * 0.28 * gauss(dNear - 0.022 * qw, 0.0090 * qw);
    }
    if (dTail < 0) return v;
    /* S 波 */
    if (P.sA) v += P.sA * gauss(dTail - 0.028 * qw, 0.0098 * qw);
    /* J 点 / Osborne 波 */
    if (P.jA) v += P.jA * gauss(dTail - 0.048 * qw, 0.014);
    /* ST 段：从 J 点平滑起跳，在 T 波起点处交给 T 波，抬高时形成穹隆样融合 */
    if (Math.abs(P.stA) > 0.001) {
      var on = smoothstep((dTail - 0.042 * qw) / 0.016);
      var off = 1 - smoothstep((dTail - (P.tPeak - 1.2 * P.tSig)) / 0.030);
      v += P.stA * on * off;
    }
    /* T 波：上升慢、下降快 */
    if (P.tA) v += P.tA * skew(dTail - P.tPeak, P.tSig, 0.34);
    /* U 波 */
    if (P.uA) v += P.uA * gauss(dTail - P.uOff, 0.030);
    return v;
  }

  /* 各心律下的 QRS 极性（室速/PEA 用） */
  var VT_POL = { I: 0.80, II: 0.95, III: 0.50, aVR: -0.90, aVL: 0.30, aVF: 0.80,
    V1: -0.90, V2: -0.60, V3: 0.20, V4: 0.75, V5: 0.90, V6: 0.85 };
  function leadPol(sim, leadK) {
    if (PREC[leadK]) return 1;
    return proj(axisOf(sim), leadK) || 0.6;
  }

  /* ---------- 按压伪差 ---------- */
  function cprArtifact(t) {
    var f = 110 / 60;
    var ph = (t * f) % 1;
    return 0.30 * Math.sin(2 * Math.PI * ph) + 0.10 * Math.sin(4 * Math.PI * ph + 0.6);
  }

  /* ---------- ECG 采样 ---------- */
  function ecgSample(sim, st, t, leadK) {
    var v = sim.v || {};
    var r = sim.rhythm || 'sinus';
    var lead = leadK || 'II';

    /* 除颤放电伪差：巨大尖峰 + 快速衰减的抖动 */
    if (sim.shockFx !== undefined && sim.shockFx >= 0) {
      var dFx = t - sim.shockFx;
      if (dFx >= -0.02 && dFx < 0.35) {
        if (dFx < 0.04) {
          var jf = clamp((sim.shockJ || 200) / 200, 0.6, 1.8);
          return -2.6 * jf * Math.exp(-dFx / 0.012) + 1.8 * jf * Math.exp(-dFx / 0.03) * Math.sin(dFx * 220);
        }
        return 0.55 * Math.exp(-(dFx - 0.04) / 0.09) * Math.sin(t * 63) * Math.exp(-dFx * 4);
      }
    }
    /* 除颤成功后的短暂电静息 */
    if (sim.postShockUntil && sim.postShockUntil > 0 && t < sim.postShockUntil) {
      return 0.012 * Math.sin(t * 31) + 0.008 * Math.sin(t * 7);
    }

    /* 心脏停搏：直线 + 基线漂移，偶发濒死波 */
    if (r === 'asystole') {
      var base0 = 0.012 * Math.sin(t * 31) + 0.008 * Math.sin(t * 7);
      if ((t % 7.3) < 0.12) base0 += 0.06 * Math.sin((t % 7.3) / 0.12 * Math.PI);
      return base0;
    }
    /* 室颤：粗颤逐渐变细 */
    if (r === 'vf') {
      var since = Math.max(0, sim.t - (sim.rhythmT || 0));
      var amp = clamp(1 - since / 300, 0.35, 1);
      return amp * (0.42 * Math.sin(t * 12.7) + 0.30 * Math.sin(t * 7.3 + 1.3) +
        0.22 * Math.sin(t * 19.1 + 2.7) + 0.16 * Math.sin(t * 3.3 + 0.6) +
        0.10 * Math.sin(t * 27.4 + 0.9));
    }
    if (r === 'agonal') return 0.10 * Math.sin(t * 4.1) + 0.05 * Math.sin(t * 9);

    var P = ecgParams(sim, lead);
    var prec = PREC[lead];
    var hr = clamp(v.hr === undefined ? 75 : v.hr, 20, 260);
    var f = hr / 60;
    var cpr = sim.cpr ? cprArtifact(t) : 0;
    var s = 0;

    /* PEA：有组织电活动、无机械收缩——宽大缓慢的 QRS，无 P 波 */
    if (r === 'pea') {
      var gp0 = beatGrid(sim, t, clamp(hr, 18, 55) / 60, false, 0, 'pea');
      var dp0 = t - gp0.last;
      var dpN = dp0 <= gp0.period * 0.5 ? dp0 : dp0 - gp0.period;
      var pea = 0.55 * gauss(dpN - 0.02, 0.030) - 0.40 * gauss(dp0 - 0.10, 0.032) + 0.24 * gauss(dp0 - 0.26, 0.075);
      s = pea * 1.05 * (prec ? 1 : leadPol(sim, lead));
    }
    /* 尖端扭转型室速：振幅围绕基线扭转，呈纺锤形 */
    else if (r === 'torsades') {
      var tf = clamp(hr, 150, 260) / 60;
      var spindle = 0.35 + 0.65 * Math.abs(Math.sin(Math.PI * t / 2.3));
      var twist = Math.sin(2 * Math.PI * tf * t + 1.4 * Math.sin(2 * Math.PI * t / 2.3));
      s = 0.95 * spindle * twist * (prec ? 1 : leadPol(sim, lead)) + 0.04 * Math.sin(t * 17);
    }
    /* 单形性室速：宽大畸形的 QRS，无 P 波，各导联极性相反 */
    else if (r === 'vt') {
      var gv = beatGrid(sim, t, f, false, 0, 'vt');
      var wph = clamp((t - gv.last) / gv.period, 0, 1);
      var shape = 1.15 * gauss(wph - 0.10, 0.075) - 0.95 * gauss(wph - 0.28, 0.085) +
        0.55 * gauss(wph - 0.52, 0.110) - 0.25 * gauss(wph - 0.80, 0.120);
      s = shape * (VT_POL[lead] || 0.6) * 1.35;
    } else {
      /* 一般心律：R 波时刻表 + 相应的心房活动 */
      var rsaT = (r === 'sinus' || r === 'sinus_tach' || r === 'sinus_brady') ? 0.05 : 0;
      var g = beatGrid(sim, t, f, r === 'afib', rsaT);
      var d1 = t - g.last;
      var dN = t - g.next;
      /* 距最近 R 峰（峰值前为负）——Q 波与 R 波升支要用它 */
      var dNear = d1 <= g.period * 0.5 ? d1 : dN;

      if (r === 'flutter') {
        /* 心房扑动：F 波 300 次/分，锯齿状，2:1 传导 */
        var af = clamp(v.atrialRate || 300, 220, 380) / 60;
        var fph = (t * af) % 1;
        var fw = Math.sin(2 * Math.PI * fph + 0.55 * Math.sin(2 * Math.PI * fph));
        var fAmp = 0.13 * (prec ? 0.70 : 1) * (lead === 'aVR' ? -0.85 : 1);
        s = fw * fAmp + vent(dNear, d1, P) * 0.96;
      } else {
        s = vent(dNear, d1, P);

        /* --- 心房活动 --- */
        if (r === 'afib') {
          /* 无 P 波，代之以大小不等、形态不同的 f 波（V1 最明显） */
          var fAmp2 = (lead === 'V1' ? 0.11 : 0.045) * (1 - 0.3 * P.isch);
          s += fAmp2 * (Math.sin(2 * Math.PI * 6.1 * t) + 0.7 * Math.sin(2 * Math.PI * 8.7 * t + 1.3) +
            0.5 * Math.sin(2 * Math.PI * 4.3 * t + 2.1));
        } else if (r === 'svt') {
          /* 窄 QRS、P 波埋于 QRS/T 中，不可辨 */
        } else if (r === 'junctional') {
          /* 交界性心律：P 波倒置，紧邻 QRS（可在其前或其后） */
          s += -0.45 * pBeforeR(dN + 0.10, P);
        } else if (r === 'block2') {
          /* 3:2 传导：心房率是心室率的 1.5 倍，每 3 个 P 有 1 个未下传 */
          s += pOsc(t, f * 1.5, P);
        } else if (r === 'block3') {
          /* 三度阻滞：P 波按自己的窦房结节律出现，与 QRS 完全脱节 */
          s += pOsc(t, 1.30, P);
        } else {
          /* 窦性：P 波在下一个 QRS 之前（PR 间期固定） */
          s += pBeforeR(dN, P);
        }

        /* 频发室早：心肌易激时，每 5 个心搏插入一个宽大畸形的提前搏动。
           只有 RR 足够长（<100 次/分）时才插：否则这个 0.3 s 宽的室早会和下一个
           正常 QRS 撞在一起，看起来像凭空的「双 R 波」尖刺（也是玩家眼中的噪点）。 */
        if ((v.arrhythmia || 0) > 45 && (r === 'sinus' || r === 'sinus_tach') &&
          g.period > 0.62 && g.idx % 5 === 0 && d1 > 0.05) {
          var pd = d1 - 0.20;
          if (pd > -0.08 && pd < 0.30) {
            var pol = prec ? 1 : leadPol(sim, lead);
            s += (0.80 * gauss(pd, 0.026) - 0.60 * gauss(pd - 0.07, 0.030) +
              0.30 * gauss(pd - 0.24, 0.070)) * pol;
          }
        }
      }
    }

    /* 呼吸引起的基线漂移与逐搏振幅波动 */
    var respT = 60 / clamp(v.rr || 16, 4, 60);
    var respPh = Math.sin(2 * Math.PI * t / respT);
    s *= 1 + 0.020 * respPh;
    /* 基线漂移：真实心电图只有很慢、很小的漂移，4 秒窗口里几乎是一条直线 */
    s += 0.005 * Math.sin(2 * Math.PI * 0.09 * t + 0.4) + 0.003 * Math.sin(2 * Math.PI * 0.045 * t);

    /* 低温寒战 / 肌肉震颤 */
    if ((v.temp || 36.8) < 35 || (v.seizure || 0) > 20) s += 0.028 * Math.sin(t * 43.1) * (1 + Math.sin(t * 7.7));
    /* 仪器噪声：保持很低，真实监护仪是一条干净的基线 */
    s += 0.0035 * Math.sin(t * 47.3) + 0.0025 * Math.sin(t * 23.7);
    return s + cpr;
  }
  M.ecgSample = ecgSample;

  /* ============================================================
     五、测量与中文判读
     ============================================================ */
  var REGION_NAME = {
    anterior: '前壁（V1–V4）', inferior: '下壁（II、III、aVF）', lateral: '侧壁（I、aVL、V5、V6）',
    posterior: '后壁（V1–V3 镜像）', diffuse: '心包/弥漫性', right: '右心（III、V1）'
  };
  var NO_PR = { afib: 1, flutter: 1, svt: 1, vt: 1, torsades: 1, vf: 1, block3: 1, junctional: 1, pea: 1 };
  /* 完全没有电活动的心律：测不出心率，更测不出 PR / QRS / QT */
  var NO_BEAT = { asystole: 1, vf: 1, agonal: 1 };

  M.ecgMetrics = function (sim) {
    var v = sim.v || {};
    var r = sim.rhythm;
    var noBeat = !!NO_BEAT[r];
    var pI = ecgParams(sim, 'I'), pF = ecgParams(sim, 'aVF');
    var netI = pI.rA + pI.sA + pI.qA;
    var netF = pF.rA + pF.sA + pF.qA;
    var axis = Math.round(Math.atan2(netF / 0.866, netI) / DEG);
    if (!isFinite(axis)) axis = 0;
    var noPR = !!NO_PR[r];
    /* 室速/尖端扭转的 QRS 天生宽大，按心律校正，不跟着电解质走 */
    var qrsMs = Math.round(pI.qrs * 1000);
    if (r === 'vt') qrsMs = 160;
    else if (r === 'torsades') qrsMs = 180;
    var stMax = 0, stLead = '', anyQ = false;
    for (var i = 0; i < LEADS.length; i++) {
      var pp = ecgParams(sim, LEADS[i].k);
      if (Math.abs(pp.stA) > Math.abs(stMax)) { stMax = pp.stA; stLead = LEADS[i].k; }
      if (pp.pathologicalQ) anyQ = true;
    }
    /* 心率用真实值：心脏停搏时 v.hr = 0，不能再用 "|| 75" 兜底显示成 75 次/分 */
    var hrTrue = Math.round(clamp(v.hr === undefined ? 75 : v.hr, 0, 260));
    return {
      hr: hrTrue,
      noBeat: noBeat,
      pr: (noBeat || noPR) ? 0 : Math.round(pI.pr * 1000),
      qrs: noBeat ? 0 : qrsMs,
      qt: noBeat ? 0 : Math.round(pI.qt * 1000),
      qtc: noBeat ? 0 : Math.round(pI.qtc * 1000),
      axis: noBeat ? null : axis,
      st: noBeat ? 0 : +(Math.abs(stMax)).toFixed(2),
      stMm: noBeat ? 0 : +(Math.abs(stMax) * 10).toFixed(1),
      stLead: noBeat ? '' : stLead,
      stElev: !noBeat && stMax > 0.02,
      region: sim.ecgRegion || '',
      pathologicalQ: !noBeat && anyQ
    };
  };

  M.ecgRead = function (sim) {
    var v = sim.v || {};
    var m = M.ecgMetrics(sim);
    var nm = (M.RHY_NAME && M.RHY_NAME[sim.rhythm]) || sim.rhythm;
    var k = v.k === undefined ? 4.2 : v.k;
    var ca = v.ca === undefined ? 2.3 : v.ca;

    function lytes() {
      var s = '';
      if (k > 5.6) s += 'T 波高尖、基底窄' + (k > 6.5 ? '，P 波低平、QRS 增宽' : '') + '。';
      if (k > 8.4) s += 'QRS 与 T 波融合呈正弦波，提示心肌电活动濒临消失。';
      if (k < 3.3) s += 'T 波低平伴 U 波，符合低钾改变。';
      if (ca < 2.05) s += 'ST 段延长、QT 延长，符合低钙。';
      if (ca > 2.75) s += 'QT 缩短，注意高钙。';
      if ((v.temp || 36.8) < 34.5) s += '可见 J 波（Osborne 波），低温改变。';
      if (sim.ecgLowVoltage) s += '肢体导联低电压（< 5 mm）。';
      return s;
    }

    /* 心脏停搏 / 室颤：没有可测量的心搏，不要硬报心率与各间期 */
    if (m.noBeat) {
      var t0;
      if (sim.rhythm === 'vf') t0 = nm + '，波形紊乱、无有效心搏，测不出心率与各间期。';
      else if (sim.rhythm === 'agonal') t0 = nm + '，仅见极缓慢的濒死波，无有效心搏，测不出心率与各间期。';
      else t0 = nm + '，无有效心电活动（直线），测不出心率与各间期。';
      var kk = '';
      if (k > 6.0) kk += '血钾 ' + k.toFixed(1) + ' mmol/L 明显升高，需排查高钾；';
      else if (k < 3.0) kk += '血钾 ' + k.toFixed(1) + ' mmol/L 偏低；';
      if (ca < 1.90) kk += '血钙 ' + ca.toFixed(2) + ' mmol/L 偏低；';
      if ((v.temp || 36.8) < 32) kk += '体温 ' + (v.temp || 36.8).toFixed(1) + ' ℃ 过低；';
      return t0 + (kk ? kk + '按 5H5T 逐条排查可逆原因。' : '按 5H5T 逐条排查可逆原因。');
    }

    var axisTxt = m.axis === null ? '—' : (m.axis > 90 ? '右偏' : (m.axis < -30 ? '左偏' : '正常'));
    var txt = nm + '，心率 ' + m.hr + ' 次/分。';
    txt += (m.pr ? 'PR ' + m.pr + ' ms，' : 'PR 不可测，') +
      'QRS ' + m.qrs + ' ms，QT/QTc ' + m.qt + '/' + m.qtc + ' ms，电轴 ' +
      (m.axis === null ? '—' : ((m.axis >= 0 ? '+' : '') + m.axis + '°（' + axisTxt + '）')) + '。';
    if (sim.rhythm === 'pea') txt += '有组织心电活动但无机械收缩（无脉搏），此处为电活动频率。';

    txt += lytes();

    if (m.region && m.st > 0.05) {
      txt += (m.stElev ? 'ST 段抬高' : 'ST 段压低') + ' ' + m.stMm.toFixed(1) + ' mm（' +
        m.st.toFixed(2) + ' mV），以' + m.stLead + ' 导联最著，位于' +
        (REGION_NAME[m.region] || m.region) +
        (m.stElev && m.region !== 'diffuse' ? '，伴对应导联镜像压低' : '') + '。';
      if (m.stElev && m.stMm >= 1 && m.region !== 'diffuse') txt += '符合急性 STEMI 定位标准。';
    } else if ((v.coronary || 100) < 65) {
      txt += '广泛 ST-T 压低，提示弥漫性心肌缺血。';
    }
    if (m.pathologicalQ) txt += '梗死相关导联可见病理性 Q 波。';

    if (sim.rhythm === 'afib') txt += 'RR 间期绝对不规则，未见 P 波，代之以 f 波。';
    if (sim.rhythm === 'flutter') txt += '可见规则锯齿状 F 波（约 300 次/分），心室率多呈 2:1 传导。';
    if (sim.rhythm === 'block3') txt += 'P 波与 QRS 完全脱节，为三度房室传导阻滞。';
    if (sim.rhythm === 'block2') txt += '可见 P 波后 QRS 脱落，为二度房室传导阻滞。';
    if (sim.rhythm === 'junctional') txt += 'P 波消失或倒置，QRS 窄，为交界性心律。';
    if (sim.rhythm === 'svt') txt += '窄 QRS，P 波不可辨，为室上性心动过速。';
    if (sim.rhythm === 'vt') txt += 'QRS 宽大畸形，未见 P 波，为室性心动过速。';
    if (sim.rhythm === 'torsades') txt += '宽大 QRS 振幅围绕基线扭转，为尖端扭转型室速。';
    return txt;
  };

  /* ============================================================
     六、其他波形
     ============================================================ */
  function abpSample(sim, st, t) {
    var v = sim.v || {};
    var r = sim.rhythm;
    var pulse = v.pulseOK;
    var hr = clamp(v.hr === undefined ? 75 : v.hr, 20, 220);
    if (!pulse) {
      if (sim.cpr) {
        var f = clamp(hr, 60, 140) / 60;
        var b0 = beatGrid(sim, t, f, false, 0, 'abpCpr');
        var w0 = gauss(t - b0.last - 0.09, 0.045) - 0.55 * gauss(t - b0.last - 0.03, 0.075);
        return w0 * 0.9;
      }
      return 0.01 * Math.sin(t * 13) + (v.map || 0) / 400;
    }
    var g = beatGrid(sim, t, hr / 60, r === 'afib', 0, 'abp');
    var d = t - g.last;
    var up = gauss(d - 0.055, 0.038);
    var dn = 1.05 * gauss(d - 0.26, 0.055);
    var dic = 0.30 * gauss(d - 0.44, 0.075);
    var pulseP = up - dn + dic + 0.20;
    var ampF = clamp((v.sbp || 110) / 120, 0, 2.2);
    var width = clamp(0.55 * (v.svr || 1100) / 1100, 0.3, 1.6);
    return pulseP * (0.6 + 0.5 * ampF) * width;
  }

  function plethSample(sim, st, t) {
    var v = sim.v || {};
    var r = sim.rhythm;
    if (!v.pulseOK) {
      if (sim.cpr) {
        var g0 = beatGrid(sim, t, 110 / 60, false, 0, 'plethCpr');
        return gauss(t - g0.last - 0.1, 0.075) * 0.5;
      }
      return 0.004 * Math.sin(t * 4);
    }
    var g = beatGrid(sim, t, clamp(v.hr === undefined ? 75 : v.hr, 20, 220) / 60, r === 'afib', 0, 'pleth');
    var d = t - g.last;
    var main = gauss(d - 0.14, 0.075);
    var dic = 0.42 * gauss(d - 0.42, 0.10);
    var amp = clamp(((v.spo2 || 98) - 60) / 40, 0.15, 1.2) * clamp((v.sv || 70) / 70, 0.3, 1.6);
    return (main + dic) * amp;
  }

  function respSample(sim, st, t) {
    var v = sim.v || {};
    var rr = clamp(v.rr || 16, 0, 60);
    if (rr < 1 || sim.vent) rr = Math.max(rr, sim.vent ? 12 : 0.1);
    var f = rr / 60;
    var amp = (sim.vent || sim.airwayMode === 'bag') ? 1.2 : clamp((v.tv || 450) / 450, 0.15, 1.5);
    var base = Math.sin(2 * Math.PI * f * t - Math.PI / 2);
    var s = base * amp;
    s += 0.05 * Math.sin(2 * Math.PI * f * 3 * t);
    if ((v.bronchospasm || 0) > 25) s += 0.14 * Math.sin(2 * Math.PI * f * 7 * t);
    return s * 0.85;
  }

  function eegSample(sim, st, t) {
    var v = sim.v || {};
    var act = (v.brain === undefined ? 100 : v.brain) / 100;
    var sed = (v.sedation || 0) / 100;
    if (act < 0.05) return 0.006 * Math.sin(t * 3);
    var slow = Math.sin(t * 2.1) * (0.35 + sed * 0.6);
    var alpha = Math.sin(t * 10.3 + 0.4) * 0.45 * (1 - sed * 0.75);
    var beta = Math.sin(t * 23.7 + 1.1) * 0.28 * (1 - sed * 0.85) * act;
    var noise = (Math.sin(t * 61.7) + Math.sin(t * 97.3)) * 0.09;
    var s = (slow + alpha + beta + noise) * act;
    if ((v.seizure || 0) > 20) {
      var k = clamp(v.seizure / 100, 0, 1);
      s += k * 1.5 * Math.sin(t * 33.1) * (0.6 + 0.4 * Math.sin(t * 5.3));
    }
    return s * 1.5;
  }

  function co2Sample(sim, st, t) {
    var v = sim.v || {};
    var rr = (sim.vent ? 12 : clamp(v.rr || 16, 1, 60));
    var f = rr / 60;
    var ph = (t * f) % 1;
    var s;
    if (ph < 0.42) s = Math.pow(ph / 0.42, 0.65);
    else if (ph < 0.52) s = 1;
    else s = Math.exp(-(ph - 0.52) / 0.10);
    var target = clamp((v.paco2 || 40) / 40, 0.2, 1.8);
    return s * target * 1.4 - 0.35;
  }

  var COLORS = { ecg: '#25e07a', abp: '#ff5a7a', pleth: '#38a9ff', resp: '#25e3c6', eeg: '#9d7bff', co2: '#ffb02e' };
  M.WAVE_COLORS = COLORS;

  function sampler(sim, st, t, kind, leadK) {
    switch (kind) {
      case 'abp': return abpSample(sim, st, t);
      case 'pleth': return plethSample(sim, st, t);
      case 'resp': return respSample(sim, st, t);
      case 'eeg': return eegSample(sim, st, t);
      case 'co2': return co2Sample(sim, st, t);
      default: return ecgSample(sim, st, t, leadK || 'II');
    }
  }

  /* ============================================================
     七、绘制
     ============================================================ */
  function newState(pxPerSec) {
    var N = 900;
    return {
      buf: new Float32Array(N), idx: 0, count: 0, N: N,
      pxPerSec: pxPerSec || 110, t: null,
      lastR: 0, prevR: -1, nextR: 0, init: false, beatN: 0
    };
  }
  M.newWaveState = newState;

  /* 监护仪网格（无标定，只是背景） */
  function monitorGrid(ctx, w, h, kind) {
    var minor = kind === 'eeg' ? 7 : 5, major = minor * 5;
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = kind === 'eeg' ? 'rgba(157,123,255,.10)' : 'rgba(255,90,110,.085)';
    ctx.beginPath();
    for (var x = 0; x < w; x += minor) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, h); }
    for (var y = 0; y < h; y += minor) { ctx.moveTo(0, y + .5); ctx.lineTo(w, y + .5); }
    ctx.stroke();
    ctx.strokeStyle = kind === 'eeg' ? 'rgba(157,123,255,.22)' : 'rgba(255,90,110,.18)';
    ctx.beginPath();
    for (var x2 = 0; x2 < w; x2 += major) { ctx.moveTo(x2 + .5, 0); ctx.lineTo(x2 + .5, h); }
    for (var y2 = 0; y2 < h; y2 += major) { ctx.moveTo(0, y2 + .5); ctx.lineTo(w, y2 + .5); }
    ctx.stroke();
    ctx.restore();
  }

  /* 心电图纸：1 mm 小格 / 5 mm 大格，与 25 mm/s、10 mm/mV 严格对应 */
  function paper(ctx, W, H, pxPerMm) {
    var minor = pxPerMm, major = pxPerMm * 5;
    ctx.save();
    ctx.lineWidth = 1;
    if (minor >= 2.2) {
      ctx.strokeStyle = 'rgba(255,86,104,.105)';
      ctx.beginPath();
      for (var x = 0; x < W; x += minor) { var xx = Math.round(x) + .5; ctx.moveTo(xx, 0); ctx.lineTo(xx, H); }
      for (var y = 0; y < H; y += minor) { var yy = Math.round(y) + .5; ctx.moveTo(0, yy); ctx.lineTo(W, yy); }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,86,104,.235)';
    ctx.beginPath();
    for (var x2 = 0; x2 < W + 1; x2 += major) { var x3 = Math.round(x2) + .5; ctx.moveTo(x3, 0); ctx.lineTo(x3, H); }
    for (var y2 = 0; y2 < H + 1; y2 += major) { var y3 = Math.round(y2) + .5; ctx.moveTo(0, y3); ctx.lineTo(W, y3); }
    ctx.stroke();
    ctx.restore();
  }

  function fitCanvas(canvas, dpr) {
    var rect = canvas.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return null;
    var W = Math.round(rect.width), H = Math.round(rect.height);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    }
    return { W: W, H: H, ctx: canvas.getContext('2d') };
  }

  /* 监护仪：扫描式描记（光点从左向右走，走到右端回到左边继续） */
  function draw(canvas, sim, st, kind, leadK, scale) {
    if (!canvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cv = fitCanvas(canvas, dpr);
    if (!cv) return;
    var W = cv.W, H = cv.H, ctx = cv.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    monitorGrid(ctx, W, H, kind);

    if (!st.pix || Math.abs((st.W || 0) - W) > 40) {
      st.W = W; st.pix = new Float32Array(W); st.pix.fill(NaN); st.pen = 0; st.acc = 0;
    } else {
      W = st.W;
    }

    var nowT = sim.t;
    if (st.t === null || st.t === undefined) st.t = nowT;
    var span = nowT - st.t;
    if (span < 0) { st.t = nowT; span = 0; }
    /* 画布被折叠 / 切到别的页签 / 窗口卡住时，本函数不会被调用，而 sim.t 一直在走。
       回来时 span 可能长达几分钟，旧写法会把这几分钟硬塞进一屏像素里（每列隔十几毫秒
       ～几秒），屏幕上就是一整屏噪点。这里把跨度截到正好一屏，再按正确的时间间隔铺满，
       波形始终是连续、可读的。 */
    var maxSpan = W / st.pxPerSec;
    if (span > maxSpan) { st.t = nowT - maxSpan; span = maxSpan; }
    if (span > 0) {
      var pixN = span * st.pxPerSec + (st.acc || 0);
      var n = Math.floor(pixN);
      st.acc = pixN - n;
      if (n > W) n = W;
      var dtSub = span / Math.max(1, n);
      for (var i = 0; i < n; i++) {
        var t0 = st.t + dtSub * i;
        var best = 0, bestAbs = -1;
        for (var s2 = 0; s2 < 4; s2++) {
          /* 4 个取样点必须都落在本像素的时间窗内（0.17 + 0.33×3 = 1.16 会偷到下一列去） */
          var val = sampler(sim, st, t0 + dtSub * (0.125 + s2 * 0.25), kind, leadK);
          if (Math.abs(val) > bestAbs) { bestAbs = Math.abs(val); best = val; }
        }
        st.pix[st.pen] = best;
        st.pen = (st.pen + 1) % W;
      }
      st.t = nowT;
    }

    var scaleF = scale || 1;
    var cy = H * 0.55;
    var half = H * 0.40;
    /* 监护仪没有网格标定，纵向增益按行高定：ECG 以 mV 为单位，取 0.75 倍避免削顶 */
    var pxPerMv = half * (kind === 'ecg' ? 0.75 : 1);
    var col = COLORS[kind] || COLORS.ecg;
    var pen = st.pen;

    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = kind === 'eeg' ? 1.0 : 1.5;
    ctx.shadowColor = col;
    ctx.shadowBlur = kind === 'eeg' ? 4 : 5;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    var started = false;
    for (var x = 0; x < W; x++) {
      if (((x - pen + W) % W) <= 2) { started = false; continue; }
      var v2 = st.pix[x];
      if (!isFinite(v2)) { started = false; continue; }
      var y = cy - softLimit(v2 * scaleF * pxPerMv, half * 1.05);
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    if (pen >= 0 && pen < W) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,.20)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pen + .5, 0); ctx.lineTo(pen + .5, H);
      ctx.stroke();
      var lastVal = st.pix[pen === 0 ? W - 1 : pen - 1];
      if (isFinite(lastVal)) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(pen === 0 ? W - 1 : pen - 1, cy - softLimit(lastVal * scaleF * pxPerMv, half * 1.05), 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
  M.drawWave = draw;

  /* ---------- 12 导联：4 秒 / 导联，静态整幅 ---------- */
  var c12 = {};
  var SEC12 = 4;              /* 每导联显示 4 秒（横向 100 mm） */
  function draw12(canvas, sim, leadK, showCal) {
    if (!canvas) return;
    var key = leadK || 'II';
    var last = c12[key];
    if (last && sim.t - last.t < 0.45) return;
    c12[key] = { t: sim.t };
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cv = fitCanvas(canvas, dpr);
    if (!cv) return;
    var W = cv.W, H = cv.H, c = cv.ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);

    var pxPerMm = W / (SEC12 * 25);      /* 25 mm/s */
    var pxPerMv = pxPerMm * 10;          /* 10 mm/mV */
    paper(c, W, H, pxPerMm);

    var cy = H * 0.54;
    var lim = Math.min(cy, H - cy) * 0.97;
    /* 取样密度：每个横向像素至少 6 个点，R 波峰才不会被漏掉（否则每次重画峰高都变） */
    var N = Math.max(960, Math.round(W * 6));
    var t0 = Math.max(0, sim.t - SEC12);
    var started = false;

    c.save();
    c.strokeStyle = COLORS.ecg;
    c.lineWidth = 1.5;
    c.shadowColor = 'rgba(37,224,122,.45)';
    c.shadowBlur = 3;
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath();
    for (var i = 0; i <= N; i++) {
      var tt = t0 + SEC12 * i / N;
      var val = sampler(sim, null, tt, 'ecg', key);
      var x = i / N * W;
      var y = cy - softLimit(val * pxPerMv, lim);
      if (!started) { c.moveTo(x, y); started = true; } else c.lineTo(x, y);
    }
    c.stroke();
    c.restore();
  }
  M.draw12Lead = draw12;

  /* ---------- 10 秒 II 导联节律条 ---------- */
  var cRhythm = {};
  function drawRhythm(canvas, sim, leadK, seconds) {
    if (!canvas) return;
    var key = leadK || 'II';
    var last = cRhythm[key];
    if (last && sim.t - last.t < 0.45) return;
    cRhythm[key] = { t: sim.t };
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cv = fitCanvas(canvas, dpr);
    if (!cv) return;
    var W = cv.W, H = cv.H, c = cv.ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);

    var sec = seconds || 10;
    var pxPerMm = W / (sec * 25);
    var pxPerMv = pxPerMm * 10;
    paper(c, W, H, pxPerMm);

    var cy = H * 0.52;
    var lim = Math.min(cy, H - cy) * 0.97;
    var N = Math.max(2000, Math.round(W * 4.5));
    var t0 = Math.max(0, sim.t - sec);
    c.save();
    c.strokeStyle = COLORS.ecg;
    c.lineWidth = 1.4;
    c.shadowColor = 'rgba(37,224,122,.45)';
    c.shadowBlur = 3;
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath();
    for (var i = 0; i <= N; i++) {
      var v = sampler(sim, null, t0 + sec * i / N, 'ecg', key);
      var x = i / N * W;
      var y = cy - softLimit(v * pxPerMv, lim);
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
    c.restore();
  }
  M.drawRhythm = drawRhythm;

  M.reset12Lead = function () { c12 = {}; cRhythm = {}; };
  M.ECG_PAPER = { speed: 25, gain: 10, sec12: SEC12 };

})();
