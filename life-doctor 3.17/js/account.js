/* ============================================================
   LIFE SIM · 诊室模式 · 医师账号 + 医誉（声望）+ 进度存档
   - 账号与本机 localStorage 绑定；密码仅本地加盐哈希，不是服务端认证
   - 与急诊室版共用 lifesim.accounts.v1，同源下账号互通（跨版本）
   - 医誉等级决定：药品/耗材折扣、配送提速、高峰期优先配送
   - 退出时保存本班进度；勾选「保持账号」可在 12 小时内免密进入
   ============================================================ */
window.M = window.M || {};
(function () {
  'use strict';
  var M = window.M;
  if (!M || !M.GAME) return;
  var A = {};
  M.Account = A;

  var KEY = 'lifesim.accounts.v1';          /* 与急诊室版相同的账号表 */
  var CUR = 'lifesim.account.current.v1';
  var KEEP = 'lifesim.keep.v1';             /* { user, exp } 12 小时内免密 */
  var SESS = 'lifesim.account.session.v1';  /* 本标签页会话：关闭浏览器即失效 */
  var GUEST = 'lifesim.stats.v1';
  var GREP = 'lifesim.guest.rep.v1';
  var GPROG = 'lifesim.clinic.progress.guest.v1';
  var KEEP_HOURS = 12;

  var data = { accounts: {} };
  var current = null;
  var keptUntil = 0;

  function readRaw(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function read(k, d) {
    try { var s = readRaw(k); return s ? JSON.parse(s) : d; } catch (e) { return d; }
  }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function drop(k) { try { localStorage.removeItem(k); } catch (e) { } }
  function sessGet() { try { return sessionStorage.getItem(SESS) || ''; } catch (e) { return ''; } }
  function sessSet(v) { try { if (v) sessionStorage.setItem(SESS, v); else sessionStorage.removeItem(SESS); } catch (e) { } }

  function copyStats(s) {
    return {
      seen: +(s && s.seen) || 0, saved: +(s && s.saved) || 0,
      lost: +(s && s.lost) || 0, score: +(s && s.score) || 0,
      best: +(s && s.best) || 0
    };
  }
  function hash(pass, salt) {
    var s = String(salt) + '::' + String(pass), h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }
  function persist() { write(KEY, data); }
  function acct(user) { return data.accounts[String(user || '').toLowerCase()] || null; }
  function me() { return current ? acct(current) : null; }

  A.current = null;
  A.keepHours = KEEP_HOURS;

  /* ================= 医誉 / 声望 ================= */
  A.rep = function () {
    var a = me();
    if (a) return Math.max(0, +(a.rep) || 0);
    return Math.max(0, +(read(GREP, 0)) || 0);
  };
  A.level = function () { return M.repLevel(A.rep()); };
  A.nextLevel = function () { return M.repNext(A.rep()); };
  A.repProgress = function () {
    var L = A.level(), N = A.nextLevel(), r = A.rep();
    if (!N) return { pct: 100, need: 0 };
    var span = Math.max(1, N.rep - L.rep);
    return { pct: Math.max(0, Math.min(100, Math.round((r - L.rep) / span * 100))), need: Math.max(0, N.rep - r) };
  };
  /* 医誉变化：返回 { delta, from, to, up } */
  A.addRep = function (delta) {
    delta = Math.round(+delta || 0);
    if (!delta) return null;
    var a = me();
    var before = A.rep();
    var after = Math.max(0, before + delta);
    if (a) { a.rep = after; persist(); }
    else write(GREP, after);
    var lv0 = M.repLevel(before), lv1 = M.repLevel(after);
    updateChip();
    return { delta: after - before, from: before, to: after, up: lv1.rep > lv0.rep, level: lv1, oldLevel: lv0 };
  };

  /* ================= 福利：折扣 / 配送 ================= */
  A.priceMul = function () { return 1 - (A.level().discount || 0) / 100; };
  A.priceOf = function (price) { return Math.max(1, Math.round((+price || 0) * A.priceMul())); };
  /* 配送时长：基础时长 ÷ 医誉提速；高峰期（白班）高级职称享优先配送 */
  A.deliveryTime = function (baseSec, peak) {
    var L = A.level();
    var t = (+baseSec || 60) / (L.speed || 1);
    if (L.peak && peak) t *= (M.CLINIC_CFG && M.CLINIC_CFG.peakDeliveryMul) || 0.55;
    return Math.max(15, Math.round(t));
  };

  /* ================= 战绩 ================= */
  A.currentStats = function () {
    var a = me();
    if (a) return copyStats(a.stats);
    return copyStats(read(GUEST, null));
  };
  A.saveStats = function (st) {
    var a = me();
    if (a) a.stats = copyStats(st); else write(GUEST, copyStats(st));
    persist();
    updateChip();
  };
  A.currentName = function () { var a = me(); return a ? a.name : '游客'; };

  /* ================= 进度存档 ================= */
  function progressStore(snap) {
    var a = me();
    if (a) a.clinic = snap; else write(GPROG, snap);
    persist();
  }
  A.saveProgress = function (snap) {
    if (!snap) return;
    snap.savedAt = Date.now();
    progressStore(snap);
  };
  A.loadProgress = function (maxHours) {
    var a = me();
    var s = a ? a.clinic : read(GPROG, null);
    if (!s || s.ended) return null;
    var age = Date.now() - (+s.savedAt || 0);
    if (!isFinite(age) || age < 0 || age > (maxHours || 48) * 3600e3) return null;
    return s;
  };
  A.clearProgress = function () {
    var a = me();
    if (a) delete a.clinic; else drop(GPROG);
    persist();
  };

  /* ================= 登录 / 注册 ================= */
  function apply(acc) {
    current = acc ? acc.user : null;
    A.current = current;
    M.GAME.doctor = acc ? acc.doctor : (read('lifesim.guestDoctor', 'Dr. 林') || 'Dr. 林');
    M.GAME.rank = acc ? acc.rank : (M.GAME.rank || 'resident');
    M.GAME.stats = acc ? copyStats(acc.stats) : copyStats(read(GUEST, null));
    syncBoot();
    syncRank();
    updateChip();
  }
  A.apply = apply;

  A.register = function (user, pass, doctor, rank) {
    user = String(user || '').trim();
    if (user.length < 2) return { ok: false, msg: '用户名至少 2 个字符' };
    if (String(pass || '').length < 4) return { ok: false, msg: '密码至少 4 位' };
    var key = user.toLowerCase();
    if (data.accounts[key]) return { ok: false, msg: '该用户名已存在，请直接登录' };
    var salt = Math.random().toString(36).slice(2) + Date.now().toString(36);
    var acc = {
      user: key, name: user, salt: salt, hash: hash(pass, salt),
      doctor: (doctor || 'Dr. 林').slice(0, 16), rank: rank || 'resident',
      stats: { seen: 0, saved: 0, lost: 0, score: 0, best: 0 },
      rep: 0, createdAt: new Date().toISOString(), lastLogin: new Date().toISOString()
    };
    data.accounts[key] = acc;
    persist();
    current = key; A.current = key;
    sessSet(key);
    apply(acc);
    return { ok: true, msg: '注册成功，已登录 ' + user };
  };

  A.login = function (user, pass, keep) {
    var acc = acct(user);
    if (!acc) return { ok: false, msg: '账号不存在，请先注册' };
    if (acc.hash !== hash(pass, acc.salt)) return { ok: false, msg: '密码错误' };
    acc.lastLogin = new Date().toISOString();
    persist();
    current = acc.user; A.current = current;
    sessSet(acc.user);
    A.setKeep(!!keep);
    apply(acc);
    return { ok: true, msg: '欢迎回来，' + acc.name };
  };

  /* 免密进入（保持账号 / 同标签页刷新） */
  A.loginSilent = function (user) {
    var acc = acct(user);
    if (!acc) return false;
    current = acc.user; A.current = current;
    sessSet(acc.user);
    apply(acc);
    return true;
  };

  A.logout = function () {
    current = null; A.current = null;
    sessSet('');
    drop(CUR);
    drop(KEEP);
    keptUntil = 0;
    apply(null);
  };

  A.setKeep = function (on) {
    if (on && current) {
      keptUntil = Date.now() + KEEP_HOURS * 3600e3;
      write(KEEP, { user: current, exp: keptUntil });
      write(CUR, current);
    } else {
      keptUntil = 0;
      drop(KEEP);
      drop(CUR);
    }
  };
  A.keepOn = function () { return keptUntil > Date.now(); };
  A.keepLeft = function () { return Math.max(0, keptUntil - Date.now()); };

  /* ================= 跨版本账号追回 ================= */
  /* 1) 扫描本机所有 lifesim.* 键，把能识别的账号表 / 战绩合并进来
     2) 也支持粘贴「账号码」在另一台机器 / 另一个版本里恢复 */
  function mergeAccount(dst, src) {
    if (!src || !src.user) return false;
    var a = dst.accounts[src.user];
    if (!a) { dst.accounts[src.user] = src; return true; }
    /* 同名账号：保留战绩更高的一份，密码以本地为准 */
    var sa = copyStats(a.stats), sb = copyStats(src.stats);
    var scoreA = sa.saved * 10 + sa.score, scoreB = sb.saved * 10 + sb.score;
    if (scoreB > scoreA) { a.stats = sb; a.rep = Math.max(+a.rep || 0, +src.rep || 0); }
    else if ((+src.rep || 0) > (+a.rep || 0)) a.rep = +src.rep;
    if (src.clinic && !a.clinic) a.clinic = src.clinic;
    return false;
  }

  A.recover = function () {
    var merged = 0, scanned = 0, r;
    var candidates = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k.indexOf('lifesim') !== 0) continue;
        if (k === KEY || k === SESS) continue;
        scanned++;
        r = read(k, null);
        if (r && r.accounts && typeof r.accounts === 'object') candidates.push(r);
      }
    } catch (e) { }
    candidates.forEach(function (tbl) {
      for (var u in tbl.accounts) if (mergeAccount(data, tbl.accounts[u])) merged++;
    });
    /* 旧版战绩（lifesim.stats.v1）迁移到当前账号 / 游客 */
    var gs = read(GUEST, null);
    if (gs && (gs.seen || gs.saved)) {
      var a = me();
      var cur = a ? copyStats(a.stats) : { seen: 0, saved: 0, lost: 0, score: 0, best: 0 };
      if (!cur.seen && !cur.saved) {
        if (a) a.stats = copyStats(gs); else write(GUEST, copyStats(gs));
        merged++;
      }
    }
    /* 旧版游客医誉 */
    if (!me() && !read(GREP, 0) && read('lifesim.rep.v1', 0)) write(GREP, read('lifesim.rep.v1', 0));
    persist();
    apply(me());
    return { scanned: scanned, merged: merged, total: Object.keys(data.accounts).length };
  };

  A.exportCode = function () {
    var payload = { v: 1, at: Date.now(), accounts: {}, guest: { stats: read(GUEST, null), rep: read(GREP, 0) } };
    var a = me();
    if (a) payload.accounts[a.user] = a;
    else for (var u in data.accounts) payload.accounts[u] = data.accounts[u];
    try { return 'LSACC1.' + btoa(unescape(encodeURIComponent(JSON.stringify(payload)))); } catch (e) { return ''; }
  };
  A.importCode = function (code) {
    code = String(code || '').trim().replace(/^LSACC1\./, '');
    if (!code) return { ok: false, msg: '账号码为空' };
    var obj;
    try { obj = JSON.parse(decodeURIComponent(escape(atob(code)))); } catch (e) { return { ok: false, msg: '账号码格式不正确' }; }
    if (!obj || !obj.accounts) return { ok: false, msg: '账号码里没有账号' };
    var merged = 0;
    for (var u in obj.accounts) if (mergeAccount(data, obj.accounts[u])) merged++;
    if (obj.guest && obj.guest.stats && !me()) {
      var cur = read(GUEST, null);
      if (!cur || (!cur.seen && obj.guest.stats.seen)) write(GUEST, copyStats(obj.guest.stats));
    }
    if (obj.guest && obj.guest.rep && !me()) write(GREP, Math.max(+read(GREP, 0) || 0, +obj.guest.rep || 0));
    persist();
    apply(me());
    return { ok: true, msg: '已追回 ' + Object.keys(obj.accounts).length + ' 个账号（新增 ' + merged + '）' };
  };

  /* ================= 界面 ================= */
  function syncBoot() {
    var n = document.getElementById('bootAcctName');
    var h = document.getElementById('bootAcctHint');
    var doc = document.getElementById('bootDoctor');
    var a = me();
    if (n) n.textContent = a ? a.name : '游客模式';
    if (h) {
      if (a) {
        var lv = A.level();
        h.innerHTML = '已登录 · <b style="color:#7ff0b0">' + lv.n + '</b> · 医誉 ' + A.rep() +
          (A.keepOn() ? ' · <span style="color:#25e3c6">免密保持至 ' + new Date(keptUntil).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) + '</span>' : '');
      } else {
        h.textContent = '登录后战绩、医誉与门诊进度都按账号保存；未登录时只保存在游客档案';
      }
    }
    if (doc && a) doc.value = a.doctor;
    var keep = document.getElementById('bootKeep');
    if (keep) keep.checked = A.keepOn();
  }
  function syncRank() {
    if (!M.GAME) return;
    var cards = document.querySelectorAll('#bootDiff .rank-card');
    Array.prototype.forEach.call(cards, function (b) {
      b.classList.toggle('on', b.dataset.v === M.GAME.rank);
    });
  }
  function updateChip() {
    var chip = document.getElementById('acctChip');
    var n = document.getElementById('acctNameTop');
    var r = document.getElementById('acctRepTop');
    var a = me();
    if (n) n.textContent = a ? a.name : '游客';
    if (r) {
      var lv = A.level();
      r.textContent = lv.n + ' · ' + A.rep();
    }
    if (chip) {
      chip.classList.toggle('logged', !!current);
      chip.title = a ? ('账号：' + a.name + '｜' + A.level().n + '｜医誉 ' + A.rep() + '｜' + A.level().perk) : '游客模式 · 点击登录 / 注册';
    }
  }

  function repBarHtml() {
    var L = A.level(), N = A.nextLevel(), pr = A.repProgress();
    return '<div class="rep-box">' +
      '<div class="rep-line"><b>' + L.n + '</b><span>医誉 ' + A.rep() + (N ? (' / ' + N.rep + ' → ' + N.n) : ' · 已满级') + '</span></div>' +
      '<i class="rep-bar"><em style="width:' + pr.pct + '%"></em></i>' +
      '<div class="rep-perk">当前福利：' + L.perk + (N && pr.need ? ('<br>再获得 ' + pr.need + ' 医誉升到「' + N.n + '」：' + N.perk) : '') + '</div></div>';
  }

  function openModal(mode) {
    mode = mode || 'login';
    var body = '';
    var a = me();
    if (a) {
      var st = a.stats || {};
      var survive = st.seen ? Math.round(st.saved / st.seen * 100) : 0;
      var c = a.clinic || null;
      body = '<div class="acct-profile"><div class="ap-avatar">' + (a.name.slice(0, 1) || '医') + '</div>' +
        '<div><b>' + M.UI.esc(a.name) + '</b><span>' + M.UI.esc(a.doctor) + ' · 职称 ' + M.UI.esc(M.getRank(a.rank).name) + '</span></div></div>' +
        repBarHtml() +
        '<div class="acct-stats">' +
        '<div><span>接诊</span><b>' + (st.seen || 0) + '</b></div>' +
        '<div><span>治愈</span><b>' + (st.saved || 0) + '</b></div>' +
        '<div><span>死亡</span><b>' + (st.lost || 0) + '</b></div>' +
        '<div><span>存活率</span><b>' + survive + '%</b></div>' +
        '<div><span>累计分</span><b>' + (st.score || 0) + '</b></div>' +
        '<div><span>最佳单例</span><b>' + (st.best || 0) + '</b></div></div>' +
        (c ? ('<div class="acct-note">上次离开：第 ' + c.day + ' 天 · ' + (c.night ? '夜班' : '白班') + ' · 剩余 ' +
          Math.floor((c.timeLeft || 0) / 60) + ' 分钟 · 经费 ¥' + (c.budget || 0) + '</div>') : '') +
        '<label class="acct-keep"><input type="checkbox" id="acctKeep" ' + (A.keepOn() ? 'checked' : '') + '> 保持账号（' + KEEP_HOURS + ' 小时内免密进入）</label>' +
        '<div class="acct-note">账号与本机浏览器绑定；密码只做本地校验，不是服务器认证。退出时会自动保存本班进度。</div>' +
        '<div class="acct-actions"><button class="btn ghost" data-keep-save>保存设置</button>' +
        '<button class="btn ghost" data-acct-code>账号码</button>' +
        '<button class="btn warn" data-acct-logout>退出登录</button></div>';
    } else {
      body = '<div class="acct-tabs"><button class="' + (mode === 'login' ? 'on' : '') + '" data-am="login">登录</button>' +
        '<button class="' + (mode === 'register' ? 'on' : '') + '" data-am="register">注册</button></div>' +
        '<div class="acct-form"><label>用户名</label><input id="acctUser" maxlength="16" autocomplete="username" placeholder="2–16 个字符">' +
        '<label>密码</label><input id="acctPass" type="password" maxlength="32" autocomplete="current-password" placeholder="至少 4 位">' +
        '<label class="acct-keep"><input type="checkbox" id="acctKeep" checked> 保持账号（' + KEEP_HOURS + ' 小时内免密进入）</label>' +
        '<div class="acct-err" id="acctErr"></div>' +
        '<button class="btn primary acct-submit" id="acctSubmit">' + (mode === 'register' ? '注册并登录' : '登录') + '</button>' +
        '<button class="btn ghost acct-guest" id="acctGuest">以游客身份继续</button>' +
        '<div class="acct-note">账号保存在本机；登录后医誉、战绩与门诊进度按账号保存。' +
        (Object.keys(data.accounts).length ? '<br>已有账号：' + Object.keys(data.accounts).map(function (k) { return M.UI.esc(data.accounts[k].name); }).join('、') : '') + '</div></div>' +
        '<div class="acct-recover"><button class="btn ghost" data-acct-recover>追回旧版本账号</button>' +
        '<button class="btn ghost" data-acct-import>粘贴账号码追回</button></div>';
    }
    M.UI.openModal(M.UI.modalShell('narrow', M.UI.modalHead('医师账号 · 医誉', '本机档案 · 跨版本可追回'), body));
    M.UI.bindClose();
    var root = document.getElementById('modalRoot');

    Array.prototype.forEach.call(root.querySelectorAll('[data-am]'), function (b) {
      b.addEventListener('click', function () { openModal(b.dataset.am); });
    });
    var submit = root.querySelector('#acctSubmit');
    if (submit) submit.addEventListener('click', function () {
      var u = document.getElementById('acctUser').value.trim();
      var p = document.getElementById('acctPass').value;
      var keep = !!(document.getElementById('acctKeep') || {}).checked;
      var res = mode === 'register'
        ? A.register(u, p, (document.getElementById('bootDoctor') || {}).value || M.GAME.doctor, M.GAME.rank)
        : A.login(u, p, keep);
      var err = document.getElementById('acctErr');
      if (!res.ok) { if (err) err.textContent = res.msg; return; }
      if (mode === 'register') A.setKeep(keep);
      M.UI.closeModal();
      M.UI.toast('good', '账号', res.msg);
      onAccountChanged();
    });
    var guest = root.querySelector('#acctGuest');
    if (guest) guest.addEventListener('click', function () {
      A.logout();
      M.UI.closeModal();
      M.UI.toast('warn', '游客模式', '战绩只保存在本机游客档案');
      onAccountChanged();
    });
    var save = root.querySelector('[data-keep-save]');
    if (save) save.addEventListener('click', function () {
      var keep = !!(document.getElementById('acctKeep') || {}).checked;
      A.setKeep(keep);
      M.UI.closeModal();
      M.UI.toast('good', keep ? '已开启保持账号' : '已关闭保持账号',
        keep ? (KEEP_HOURS + ' 小时内再次打开将直接进入，无需密码') : '下次打开需要重新输入密码');
    });
    var lo = root.querySelector('[data-acct-logout]');
    if (lo) lo.addEventListener('click', function () {
      A.logout();
      M.UI.closeModal();
      M.UI.toast('warn', '已退出登录', '当前为游客模式');
      onAccountChanged();
    });
    var rec = root.querySelector('[data-acct-recover]');
    if (rec) rec.addEventListener('click', function () {
      var r = A.recover();
      M.UI.toast(r.merged ? 'good' : 'warn', '账号追回',
        '扫描 ' + r.scanned + ' 个本机存档，新增 ' + r.merged + ' 个账号（现有 ' + r.total + ' 个）');
      openModal('login');
    });
    var imp = root.querySelector('[data-acct-import]');
    if (imp) imp.addEventListener('click', function () {
      var code = window.prompt('粘贴账号码（LSACC1.…）');
      if (!code) return;
      var r = A.importCode(code);
      M.UI.toast(r.ok ? 'good' : 'crit', '账号码追回', r.msg);
      if (r.ok) openModal('login');
    });
    var codeBtn = root.querySelector('[data-acct-code]');
    if (codeBtn) codeBtn.addEventListener('click', function () {
      var code = A.exportCode();
      if (window.prompt('账号码已生成，复制保存（可在另一台机器 / 另一个版本里追回）：', code)) { }
    });
  }
  A.openModal = openModal;

  function onAccountChanged() {
    updateChip();
    if (M.UI && M.UI.renderTop && M.GAME.sim) M.UI.renderTop(M.GAME.sim);
    if (M.Clinic && M.Clinic.reloadProgress) M.Clinic.reloadProgress();
  }

  /* ================= 退出保存 ================= */
  function flush() {
    try { if (M.Clinic && M.Clinic.snapshot) A.saveProgress(M.Clinic.snapshot()); } catch (e) { }
    persist();
  }
  window.addEventListener('beforeunload', flush);
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flush();
  });

  /* ================= 启动 ================= */
  function init() {
    var raw = read(KEY, null);
    data = (raw && raw.accounts) ? raw : { accounts: {} };

    var k = read(KEEP, null);
    var keptUser = (k && k.exp > Date.now() && acct(k.user)) ? k.user : null;
    if (k && !keptUser) drop(KEEP);

    if (keptUser) {
      keptUntil = k.exp;
      A.loginSilent(keptUser);
    } else {
      var s = sessGet();
      if (s && acct(s)) A.loginSilent(s);
      else apply(null);
    }

    var btn = document.getElementById('bootAcctBtn');
    if (btn) btn.addEventListener('click', function () { openModal('login'); });
    var chip = document.getElementById('acctChip');
    if (chip) chip.addEventListener('click', function () { openModal('login'); });
    var keepBox = document.getElementById('bootKeep');
    if (keepBox) keepBox.addEventListener('change', function () {
      if (!current) { keepBox.checked = false; M.UI.toast('warn', '先登录', '保持账号需要先登录账号'); return; }
      A.setKeep(keepBox.checked);
      updateChip();
      syncBoot();
    });

    updateChip();
    syncBoot();
    syncRank();
    var h = String((window.location && location.hash) || '');
    if (h.indexOf('acctopen') >= 0) setTimeout(function () { openModal('register'); }, 900);
    if (h.indexOf('recover=1') >= 0) setTimeout(function () {
      var r = A.recover();
      if (M.UI) M.UI.toast(r.merged ? 'good' : 'warn', '账号追回',
        '扫描 ' + r.scanned + ' 个本机存档，新增 ' + r.merged + ' 个账号（现有 ' + r.total + ' 个）');
    }, 1200);
  }
  A.init = init;
  A.flush = flush;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
