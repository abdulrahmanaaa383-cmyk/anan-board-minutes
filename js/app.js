(function () {
  'use strict';

  const D = window.DEPARTMENTS;
  const api = window.createApi();
  const $app = document.getElementById('app');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const ATTENDEES = [
    ['chairman', 'رئيس مجلس الإدارة'],
    ['ceo', 'الرئيس التنفيذي'],
    ['ops', 'مدير العمليات'],
    ['cfo', 'المدير المالي والإداري'],
    ['hr', 'مدير الموارد البشرية'],
    ['projects', 'مديرو المشاريع'],
    ['others', 'الحضور الآخرون']
  ];
  const DEC = {
    proposed: { label: 'بانتظار الاعتماد', cls: 'warn' },
    approved: { label: 'معتمد', cls: 'ok' },
    rejected: { label: 'مرفوض', cls: 'bad' }
  };
  const BLANK = '<span class="blank">………………..</span>';

  // ---------------- icons ----------------
  const P = {
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    unlock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    print: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
    back: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    fwd: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    clip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    building: '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1M14 9h1M9 13h1M14 13h1M10 21v-4h4v4"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    gavel: '<path d="m14 13-7.5 7.5a2.12 2.12 0 0 1-3-3L11 10M16 16l6-6M8 8l6-6M9 7l8 8M21 11l-8-8"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>'
  };
  const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;

  // ---------------- state ----------------
  let me = null;
  let activeDept = null;
  let adminTab = 'overview';
  let decFilter = 'proposed';
  let dirty = false;

  // ---------------- helpers ----------------
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isAdmin = () => !!me && me.role === 'admin';
  const deptName = k => (D.find(d => d.key === k) || {}).name || k;
  const deptIdx = k => D.findIndex(d => d.key === k);
  const st = d => d.status || 'proposed';
  const LOCALE = 'ar-EG-u-nu-latn';
  const fmtDate = (d, style = 'long') => {
    if (!d) return '';
    const dt = new Date(String(d).length <= 10 ? d + 'T00:00:00' : d);
    if (isNaN(dt)) return esc(d);
    const o = style === 'long' ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      : style === 'time' ? { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { year: 'numeric', month: 'short', day: 'numeric' };
    return dt.toLocaleString(LOCALE, o);
  };
  const todayISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const val = v => (v && String(v).trim() ? esc(v) : BLANK);
  const meetingChip = (s, dark) => s === 'closed'
    ? `<span class="chip ${dark ? 'on-dark' : 'neutral'}">مغلق ومعتمد</span>`
    : `<span class="chip ok ${dark ? 'on-dark' : ''}">مفتوح للإدخال</span>`;
  const decChip = s => `<span class="chip ${DEC[s].cls}">${DEC[s].label}</span>`;
  const initials = n => (n || '؟').trim().charAt(0);

  function toast(msg, type = 'ok') {
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.innerHTML = `<span class="ti">${ic(type === 'ok' ? 'check' : 'x', 'sm')}</span>${esc(msg)}`;
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }
  async function busy(btn, fn) {
    const t = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spinner sm"></span>';
    try { return await fn(); } catch (e) { toast(e.message || 'حدث خطأ', 'err'); throw e; }
    finally { if (btn.isConnected) { btn.disabled = false; btn.innerHTML = t; } }
  }
  const quiet = p => p.catch(() => {});
  // ---------------- attachments (shared) ----------------
  const DROP_TEXT = 'اسحب الملفات هنا أو اضغط للاختيار';
  const urlCache = new Map();
  const fmtSize = n => !n ? '' : n < 1024 * 1024 ? Math.max(1, Math.round(n / 1024)) + ' ك.ب' : (n / 1048576).toFixed(1) + ' م.ب';
  async function fileUrl(a) {
    if (!urlCache.has(a.id)) urlCache.set(a.id, await api.attachmentUrl(a));
    return urlCache.get(a.id);
  }
  async function openFile(a) {
    if (!a) return;
    const isXls = window.ATTACH.kind(a.name) === 'xls';
    const win = isXls ? null : window.open('', '_blank');
    try {
      const url = await fileUrl(a);
      if (isXls) {
        const blobUrl = URL.createObjectURL(await (await fetch(url)).blob());
        const link = document.createElement('a');
        link.href = blobUrl; link.download = a.name; document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
      } else if (win) win.location.href = url;
      else location.href = url;
    } catch (e) { if (win) win.close(); toast(e.message || 'تعذّر فتح الملف', 'err'); }
  }

  const confirmLeave = () => !dirty || confirm('لديك تعديلات غير محفوظة. هل تريد تجاهلها؟');

  // ---------------- routing ----------------
  let lastHash = location.hash, skipNext = false;
  window.addEventListener('hashchange', () => {
    if (skipNext) { skipNext = false; return; }
    if (!confirmLeave()) { skipNext = true; location.hash = lastHash; return; }
    dirty = false; route();
  });
  window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  async function route() {
    lastHash = location.hash;
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    if (!me) return viewLogin();
    try {
      if (parts[0] === 'm' && parts[1]) {
        if (parts[2] === 'minutes' && isAdmin()) return await viewMinutes(parts[1]);
        return await viewMeeting(parts[1]);
      }
      if (parts[0] === 'users' && isAdmin()) return await viewUsers();
      return await viewMeetings();
    } catch (e) {
      shell(`<div class="card empty error"><div class="big">${ic('alert')}</div>${esc(e.message || 'حدث خطأ')}<br><br><a class="btn sm" href="#/">العودة للاجتماعات</a></div>`, null, { title: 'حدث خطأ' });
    }
  }

  // ---------------- shell ----------------
  // hero = { back, eyebrow, title, sub, meta, actions }
  function heroHtml(h) {
    if (!h) return '';
    return `<div class="hero">
      <div>
        ${h.back ? `<a class="back" href="${h.back[0]}">${ic('back', 'sm')}${h.back[1]}</a>` : ''}
        ${h.eyebrow ? `<small>${h.eyebrow}</small>` : ''}
        <h1>${h.title || '&nbsp;'}</h1>
        ${h.sub ? `<p>${h.sub}</p>` : ''}
        ${h.meta || ''}
      </div>
      ${h.actions ? `<div class="actions">${h.actions}</div>` : ''}
    </div>`;
  }

  function shell(inner, section, hero) {
    const sec = section || (location.hash.startsWith('#/users') ? 'users' : 'meetings');
    const sub = isAdmin() ? 'مدير النظام' : (me.departments.map(deptName).join('، ') || 'لم تُعيَّن إدارة');
    $app.innerHTML = `
      <header class="top">
        <div class="bar">
          <a class="brand" href="#/" aria-label="الرئيسية"><img src="assets/logo.png" alt="عنان العاصمة"></a>
          <nav class="nav">
            <a href="#/" class="${sec === 'meetings' ? 'active' : ''}">${ic('calendar', 'sm')}الاجتماعات</a>
            ${isAdmin() ? `<a href="#/users" class="${sec === 'users' ? 'active' : ''}">${ic('users', 'sm')}المستخدمون</a>` : ''}
          </nav>
          ${api.mode === 'demo' ? `<div class="demo-pill">${ic('info', 'sm')}وضع تجريبي <button id="resetDemo">إعادة ضبط</button></div>` : ''}
          <div class="me">
            <div class="who"><strong>${esc(me.full_name || me.email)}</strong><span>${esc(sub)}</span></div>
            <span class="avatar">${esc(initials(me.full_name))}</span>
            <button class="icon-btn light" id="logout" title="تسجيل الخروج" aria-label="تسجيل الخروج">${ic('logout')}</button>
          </div>
        </div>
        ${heroHtml(hero)}
      </header>
      <main class="body">${inner}</main>`;
    $('#logout').onclick = async () => {
      if (!confirmLeave()) return;
      dirty = false; await api.signOut(); me = null; activeDept = null; adminTab = 'overview';
      location.hash = '#/'; viewLogin();
    };
    const r = $('#resetDemo');
    if (r) r.onclick = async () => {
      if (!confirm('سيتم حذف كل البيانات التجريبية والرجوع للبداية. متابعة؟')) return;
      await api.resetDemo(); me = null; dirty = false; location.hash = '#/'; location.reload();
    };
  }
  const loading = () => shell('<div class="card skeleton"><span class="spinner"></span></div>', null, { title: '' });

  // ---------------- login ----------------
  function viewLogin() {
    const demo = api.mode === 'demo';
    const users = demo ? api.demoUsers() : [];
    $app.innerHTML = `
      <div class="auth"><div class="auth-inner">
        <section class="auth-text">
          <img class="auth-logo" src="assets/logo.png" alt="عنان العاصمة">
          <h2>منصة محاضر اجتماعات مجلس الإدارة</h2>
          <p>كل إدارة تكتب تقريرها وقراراتها المقترحة بسرية تامة، والإدارة العليا تراجع وتعتمد وتُصدر المحضر الرسمي.</p>
          <ul class="auth-points">
            <li><span>${ic('shield')}</span>فصل كامل بين الإدارات</li>
            <li><span>${ic('gavel')}</span>كل قرار يمر على الاعتماد</li>
            <li><span>${ic('file')}</span>محضر رسمي جاهز للطباعة</li>
          </ul>
        </section>
        <section class="auth-card">
          <h1>تسجيل الدخول</h1>
          <p>${demo ? 'وضع تجريبي — اختر حساباً لتجربة المنصة من منظوره.' : 'ادخل ببريدك وكلمة المرور التي استلمتها من مدير النظام.'}</p>
          ${demo ? `
            <div class="demo-users">
              ${users.map(u => `
                <button class="demo-user" data-id="${esc(u.id)}">
                  <span class="avatar ${u.role === 'admin' ? 'dark' : 'soft'}">${esc(initials(u.full_name))}</span>
                  <span class="who"><strong>${esc(u.full_name)}</strong><span class="sub">${u.role === 'admin' ? 'أدمن — يرى الكل ويعتمد القرارات' : esc(u.departments.map(deptName).join('، '))}</span></span>
                  <span class="arrow">${ic('fwd', 'sm')}</span>
                </button>`).join('')}
            </div>` : `
            <form id="loginForm">
              <label class="field"><span>البريد الإلكتروني</span><input type="email" name="email" required autocomplete="username" dir="ltr"></label>
              <label class="field"><span>كلمة المرور</span><input type="password" name="password" required autocomplete="current-password" dir="ltr"></label>
              <button class="btn primary block" type="submit">دخول</button>
            </form>
            <p class="auth-note">ليس لديك حساب؟ تواصل مع مدير النظام.</p>`}
        </section>
      </div></div>`;
    if (demo) {
      $$('.demo-user').forEach(b => b.onclick = async () => { me = await api.signIn(b.dataset.id); route(); });
    } else {
      $('#loginForm').onsubmit = e => {
        e.preventDefault();
        const f = new FormData(e.target);
        quiet(busy($('button[type=submit]', e.target), async () => {
          me = await api.signIn(f.get('email').trim(), f.get('password'));
          route();
        }));
      };
    }
  }

  // ---------------- meetings list ----------------
  async function viewMeetings() {
    loading();
    const list = await api.listMeetings();
    shell(`
      ${list.length ? `<div class="meeting-grid">${list.map(m => `
        <a class="card m-card" href="#/m/${esc(m.id)}">
          <div class="top-row">
            <div class="m-badge"><small>رقم</small><b class="num">${esc(m.number)}</b></div>
            ${meetingChip(m.status)}
          </div>
          <h3>اجتماع مجلس الإدارة</h3>
          <div class="meta">
            <span>${ic('calendar', 'sm')}${m.meeting_date ? fmtDate(m.meeting_date) : 'لم يحدد التاريخ'}</span>
            <span>${ic('pin', 'sm')}${esc(m.location || 'المكان لم يحدد')}</span>
          </div>
          <div class="go">${isAdmin() ? 'إدارة الاجتماع' : 'كتابة تقرير إدارتي'}${ic('fwd', 'sm')}</div>
        </a>`).join('')}</div>`
      : `<div class="card empty"><div class="big">${ic('calendar')}</div>لا توجد اجتماعات بعد</div>`}`, 'meetings', {
      eyebrow: isAdmin() ? `أهلاً ${esc(me.full_name || '')}` : `أهلاً ${esc(me.full_name || '')} — ${esc(me.departments.map(deptName).join('، '))}`,
      title: 'اجتماعات مجلس الإدارة',
      sub: isAdmin() ? 'أنشئ الاجتماع، تابع تسليم الإدارات، اعتمد القرارات، ثم أصدر المحضر الرسمي.' : 'اختر الاجتماع لكتابة تقرير إدارتك وقراراتها المقترحة.',
      actions: isAdmin() ? `<button class="btn white" id="newMeeting">${ic('plus')}اجتماع جديد</button>` : ''
    });

    const nb = $('#newMeeting');
    if (nb) nb.onclick = () => quiet(busy(nb, async () => {
      const max = list.reduce((a, m) => Math.max(a, parseInt(m.number, 10) || 0), 0);
      const m = await api.saveMeeting({ number: String(max + 1).padStart(3, '0'), meeting_date: todayISO(), chair: 'الرئيس التنفيذي', status: 'open', attendees: {} });
      toast('تم إنشاء الاجتماع');
      adminTab = 'info';
      location.hash = '#/m/' + m.id;
    }));
  }

  // ---------------- meeting page ----------------
  async function viewMeeting(id) {
    loading();
    const [m, entries] = await Promise.all([api.getMeeting(id), api.getEntries(id)]);
    const admin = isAdmin();
    const myDepts = D.map(d => d.key).filter(k => admin || me.departments.includes(k));
    if (!myDepts.includes(activeDept)) activeDept = myDepts[0] || null;
    const readOnly = !admin && m.status !== 'open';
    entries.attachments = entries.attachments || [];

    const has = k => {
      const r = entries.reports.find(x => x.department === k);
      return !!((r && r.summary.trim()) || entries.decisions.some(x => x.department === k) || entries.attachments.some(x => x.department === k));
    };
    const decs = entries.decisions;
    const cnt = s => decs.filter(d => st(d) === s).length;
    const done = D.filter(d => has(d.key)).length;

    const hero = {
      back: ['#/', 'كل الاجتماعات'],
      eyebrow: 'محضر اجتماع مجلس الإدارة',
      title: `الاجتماع رقم <span class="num">${esc(m.number)}</span>`,
      meta: `<div class="hero-meta">
        <span>${ic('calendar', 'sm')}${m.meeting_date ? fmtDate(m.meeting_date) : 'لم يحدد التاريخ'}</span>
        <span>${ic('pin', 'sm')}${esc(m.location || 'المكان لم يحدد')}</span>
        <span>${ic('user', 'sm')}${esc(m.chair || '—')}</span>
        <span class="status ${m.status === 'closed' ? 'closed' : ''}">${m.status === 'closed' ? 'مغلق ومعتمد' : 'مفتوح للإدخال'}</span>
      </div>`,
      actions: admin ? `
        <button class="icon-btn light" id="delMeeting" title="حذف الاجتماع" aria-label="حذف الاجتماع">${ic('trash')}</button>
        <button class="btn glass" id="toggleStatus">${m.status === 'open' ? ic('lock') + 'قفل واعتماد' : ic('unlock') + 'إعادة فتح'}</button>
        <a class="btn white" href="#/m/${esc(m.id)}/minutes">${ic('file')}المحضر الرسمي</a>` : ''
    };

    if (admin) {
      shell(`
        <div class="stack">
          <div class="kpis">
            <div class="kpi"><div class="ic">${ic('building')}</div><b class="num">${done}<small>/${D.length}</small></b><span>إدارات سلّمت</span><div class="bar-line"><i style="width:${Math.round(done / D.length * 100)}%"></i></div></div>
            <div class="kpi y"><div class="ic">${ic('clock')}</div><b class="num">${cnt('proposed')}</b><span>بانتظار الاعتماد</span></div>
            <div class="kpi g"><div class="ic">${ic('check')}</div><b class="num">${cnt('approved')}</b><span>قرارات معتمدة</span></div>
            <div class="kpi r"><div class="ic">${ic('x')}</div><b class="num">${cnt('rejected')}</b><span>قرارات مرفوضة</span></div>
          </div>
          <div class="seg" role="tablist">
            <button data-atab="overview">${ic('grid', 'sm')}متابعة الإدارات</button>
            <button data-atab="decisions">${ic('gavel', 'sm')}اعتماد القرارات${cnt('proposed') ? `<span class="count num">${cnt('proposed')}</span>` : ''}</button>
            <button data-atab="content">${ic('edit', 'sm')}محتوى الإدارات</button>
            <button data-atab="info">${ic('info', 'sm')}بيانات الاجتماع</button>
          </div>
          <section class="card" id="panel"></section>
        </div>`, 'meetings', hero);
    } else {
      shell(`<section class="card" id="panel"></section>`, 'meetings', hero);
    }

    // ---- admin actions
    if (admin) {
      $('#toggleStatus').onclick = e => {
        const closing = m.status === 'open';
        if (closing) {
          const p = cnt('proposed');
          const msg = (p ? `تنبيه: يوجد ${p} قرار بانتظار الاعتماد ولن يظهر في المحضر.\n\n` : '') + 'بعد القفل لن يستطيع مديرو الإدارات التعديل. متابعة؟';
          if (!confirm(msg)) return;
        }
        quiet(busy(e.currentTarget, async () => {
          await api.saveMeeting({ id: m.id, status: closing ? 'closed' : 'open' });
          toast(closing ? 'تم قفل الاجتماع واعتماد المحضر' : 'تمت إعادة فتح الاجتماع');
          await rerender();
        }));
      };
      $('#delMeeting').onclick = e => {
        if (!confirm(`حذف الاجتماع رقم ${m.number} وكل محتواه نهائياً؟`)) return;
        quiet(busy(e.currentTarget, async () => { await api.deleteMeeting(m.id); dirty = false; toast('تم حذف الاجتماع'); location.hash = '#/'; }));
      };
      $$('[data-atab]').forEach(b => b.onclick = () => {
        if (b.dataset.atab === adminTab) return;
        if (!confirmLeave()) return;
        dirty = false; adminTab = b.dataset.atab; renderPanel();
      });
    }

    async function rerender() { const y = scrollY; await viewMeeting(id); scrollTo(0, y); }

    function renderPanel() {
      $$('[data-atab]').forEach(b => b.classList.toggle('active', b.dataset.atab === adminTab));
      if (!admin) return panelEditor();
      ({ overview: panelOverview, decisions: panelDecisions, content: panelEditor, info: panelInfo })[adminTab]();
    }

    // ---- overview
    function panelOverview() {
      $('#panel').innerHTML = `
        <div class="card-head"><div><h2>متابعة تسليم الإدارات</h2><p>اضغط على أي إدارة لعرض محتواها أو تعديله.</p></div></div>
        <div class="dept-list">${D.map((d, i) => {
          const r = entries.reports.find(x => x.department === d.key);
          const dd = decs.filter(x => x.department === d.key);
          const pp = dd.filter(x => st(x) === 'proposed').length;
          const ok = dd.filter(x => st(x) === 'approved').length;
          return `<div class="dept-row ${has(d.key) ? 'done' : ''}">
            <span class="ix num">${has(d.key) ? ic('check', 'sm') : i + 1}</span>
            <div><strong>${esc(d.name)}</strong><small>${esc(d.owner)}</small></div>
            <div class="counts">${dd.length ? `<span class="pill num">${dd.length} قرار</span>${pp ? `<span class="chip warn num">${pp} بانتظار</span>` : ''}${ok ? `<span class="chip ok num">${ok} معتمد</span>` : ''}` : '<span class="hint">لا قرارات</span>'}${(n => n ? `<span class="pill neutral num">${ic('clip', 'sm')}${n}</span>` : '')(entries.attachments.filter(x => x.department === d.key).length)}</div>
            <div class="when hint">${r && r.updated_at ? fmtDate(r.updated_at, 'time') : ''}</div>
            <div class="actions">${has(d.key) ? '<span class="chip ok">سلّم</span>' : '<span class="chip neutral">لم يسلّم</span>'}<button class="btn sm" data-open="${d.key}">فتح</button></div>
          </div>`;
        }).join('')}</div>`;
      $$('[data-open]').forEach(b => b.onclick = () => { activeDept = b.dataset.open; adminTab = 'content'; renderPanel(); });
    }

    // ---- decision review
    function panelDecisions() {
      const filters = [['proposed', 'بانتظار'], ['approved', 'معتمد'], ['rejected', 'مرفوض'], ['all', 'الكل']];
      const list = decs.filter(d => decFilter === 'all' || st(d) === decFilter)
        .sort((a, b) => deptIdx(a.department) - deptIdx(b.department) || a.sort - b.sort);
      $('#panel').innerHTML = `
        <div class="card-head">
          <div><h2>اعتماد القرارات</h2><p>القرارات المعتمدة فقط هي التي تظهر في جدول «القرارات المعتمدة» بالمحضر الرسمي.</p></div>
          ${cnt('proposed') ? `<button class="btn ok sm" id="approveAll">${ic('check', 'sm')}اعتماد كل المعلّق (${cnt('proposed')})</button>` : ''}
        </div>
        <div class="filters">${filters.map(([k, l]) => `<button class="filter ${decFilter === k ? 'active' : ''}" data-f="${k}">${l} <b class="num">${k === 'all' ? decs.length : cnt(k)}</b></button>`).join('')}</div>
        ${list.length ? `<div class="dec-list">${list.map(d => {
          const s = st(d);
          return `<article class="dec ${s}" data-id="${esc(d.id)}">
            <div class="top-row"><span class="pill">${esc(deptName(d.department))}</span>${decChip(s)}</div>
            <div class="text">${esc(d.text)}</div>
            <div class="meta">
              <span>${ic('user', 'sm')}${esc(d.owner || 'لم يحدد المسؤول')}</span>
              <span>${ic('clock', 'sm')}${d.deadline ? fmtDate(d.deadline, 'short') : 'بدون موعد'}</span>
            </div>
            <div class="act">
              <input type="text" class="dnote" placeholder="ملاحظة لمدير الإدارة (اختياري)" value="${esc(d.admin_note || '')}">
              ${s !== 'rejected' ? `<button class="btn bad-ghost" data-do="rejected">${ic('x', 'sm')}رفض</button>` : ''}
              ${s !== 'proposed' ? `<button class="btn" data-do="proposed">${ic('undo', 'sm')}إرجاع للمراجعة</button>` : ''}
              ${s !== 'approved' ? `<button class="btn ok" data-do="approved">${ic('check', 'sm')}اعتماد</button>` : ''}
            </div>
          </article>`;
        }).join('')}</div>`
        : `<div class="empty"><div class="big">${ic('gavel')}</div>${decFilter === 'proposed' ? 'لا توجد قرارات بانتظار الاعتماد' : 'لا توجد قرارات في هذا التصنيف'}</div>`}`;

      $$('[data-f]').forEach(b => b.onclick = () => { decFilter = b.dataset.f; panelDecisions(); });
      $$('[data-do]').forEach(b => b.onclick = () => {
        const card = b.closest('.dec');
        const status = b.dataset.do;
        if (status === 'rejected' && !$('.dnote', card).value.trim() && !confirm('رفض القرار بدون كتابة سبب للمدير؟')) return;
        quiet(busy(b, async () => {
          await api.decideDecision(card.dataset.id, status, $('.dnote', card).value.trim());
          toast(status === 'approved' ? 'تم اعتماد القرار' : status === 'rejected' ? 'تم رفض القرار' : 'أُرجع القرار للمراجعة');
          await rerender();
        }));
      });
      const aa = $('#approveAll');
      if (aa) aa.onclick = () => {
        if (!confirm(`اعتماد ${cnt('proposed')} قرار دفعة واحدة؟`)) return;
        quiet(busy(aa, async () => {
          for (const d of decs.filter(x => st(x) === 'proposed')) await api.decideDecision(d.id, 'approved', d.admin_note || '');
          toast('تم اعتماد كل القرارات المعلّقة');
          await rerender();
        }));
      };
    }

    // ---- meeting info
    function panelInfo() {
      const att = m.attendees || {};
      $('#panel').innerHTML = `
        <div class="card-head"><div><h2>بيانات الاجتماع</h2><p>تظهر هذه البيانات في رأس المحضر الرسمي.</p></div><button class="btn primary sm" id="saveMeta">${ic('check', 'sm')}حفظ البيانات</button></div>
        <form id="metaForm" class="form-grid card-pad">
          <label class="field"><span>رقم الاجتماع</span><input type="text" name="number" value="${esc(m.number)}"></label>
          <label class="field"><span>التاريخ</span><input type="date" name="meeting_date" value="${esc(m.meeting_date || '')}"></label>
          <label class="field"><span>مكان الاجتماع</span><input type="text" name="location" value="${esc(m.location || '')}"></label>
          <label class="field"><span>رئيس الاجتماع</span><input type="text" name="chair" value="${esc(m.chair || '')}"></label>
          <label class="field"><span>كاتب المحضر</span><input type="text" name="secretary" value="${esc(m.secretary || '')}"></label>
          <label class="field"><span>موعد الاجتماع القادم</span><input type="date" name="next_meeting" value="${esc(m.next_meeting || '')}"></label>
          <div class="form-sep"><h3>الحضور</h3><p class="hint">اكتب الأسماء كما ستظهر في المحضر وخانات التوقيع.</p></div>
          ${ATTENDEES.map(([k, l]) => `<label class="field ${k === 'others' ? 'span-all' : ''}"><span>${l}</span><input type="text" data-att="${k}" value="${esc(att[k] || '')}"></label>`).join('')}
        </form>`;
      $('#metaForm').oninput = () => { dirty = true; };
      $('#saveMeta').onclick = e => quiet(busy(e.currentTarget, async () => {
        const f = new FormData($('#metaForm'));
        const attendees = {};
        $$('[data-att]').forEach(i => { attendees[i.dataset.att] = i.value.trim(); });
        await api.saveMeeting({
          id: m.id, number: f.get('number').trim(), meeting_date: f.get('meeting_date'), location: f.get('location').trim(),
          chair: f.get('chair').trim(), secretary: f.get('secretary').trim(), next_meeting: f.get('next_meeting'), attendees
        });
        dirty = false;
        toast('تم حفظ بيانات الاجتماع');
        await rerender();
      }));
    }

    // ---- department editor (manager + admin)
    let ed = null;
    function panelEditor() {
      const panel = $('#panel');
      if (!myDepts.length) {
        panel.innerHTML = `<div class="empty"><div class="big">${ic('user')}</div>لم يتم تعيين إدارة لحسابك بعد. تواصل مع مدير النظام.</div>`;
        return;
      }
      panel.innerHTML = `
        ${!admin ? `<div class="ed-top"><div class="privacy"><span class="pic">${ic('shield')}</span><div>ما تكتبه هنا <b>سري</b> — يظهر فقط لمدير النظام، ولا يراه مديرو الإدارات الأخرى. كل قرار تقترحه يُراجع ويُعتمد من الإدارة العليا قبل دخوله المحضر.</div></div></div>` : ''}
        ${myDepts.length > 1 ? `<div class="tabs">${myDepts.map(k => `<button class="tab ${k === activeDept ? 'active' : ''}" data-dept="${k}"><span class="dot ${has(k) ? 'on' : ''}"></span>${esc(deptName(k))}</button>`).join('')}</div>` : ''}
        ${readOnly ? `<div class="locked">${ic('lock')}تم قفل هذا الاجتماع واعتماد المحضر — المحتوى للعرض فقط.</div>` : ''}
        <div id="editor"></div>`;
      $$('[data-dept]').forEach(b => b.onclick = () => {
        if (b.dataset.dept === activeDept || !confirmLeave()) return;
        dirty = false; activeDept = b.dataset.dept; panelEditor();
      });
      const r = entries.reports.find(x => x.department === activeDept);
      ed = {
        summary: r ? r.summary : '',
        decisions: decs.filter(x => x.department === activeDept).map(x => ({ id: x.id, text: x.text || '', owner: x.owner || '', deadline: x.deadline || '', status: st(x), admin_note: x.admin_note || '' })),
        postponed: entries.postponed.filter(x => x.department === activeDept).map(x => ({ id: x.id, topic: x.topic || '', reason: x.reason || '', revisit_date: x.revisit_date || '' }))
      };
      renderEditor();
    }

    function renderEditor() {
      const host = $('#editor');
      const dname = deptName(activeDept);
      const dis = readOnly ? 'disabled' : '';
      const decLocked = d => readOnly || (!admin && d.status === 'approved');
      host.innerHTML = `
        <div class="ed">
          <div class="ed-sec">
            <div class="ed-head"><div><h2>ملخص المناقشة — ${esc(dname)}</h2><p>أهم ما تم، المؤشرات، المشكلات، والتوصيات. يظهر في جدول «الموضوعات التي تمت مناقشتها».</p></div></div>
            <textarea class="summary" id="sumBox" data-k="summary" ${dis} placeholder="اكتب ملخص تقرير ${esc(dname)} هنا…">${esc(ed.summary)}</textarea>
          </div>

          <div class="ed-sec">
            <div class="ed-head"><div><h2>القرارات المقترحة</h2><p>${admin ? 'تُعتمد من تبويب «اعتماد القرارات».' : 'كل قرار يُراجع من الإدارة العليا — المعتمد يدخل المحضر ويُقفل للتعديل.'}</p></div></div>
            <div class="rows">
              ${ed.decisions.map((d, i) => {
                const lk = decLocked(d) ? 'disabled' : '';
                return `<div class="row ${d.status}">
                  <span class="ix num">${i + 1}</span>
                  <div class="fields">
                    <div class="rhead">${decChip(d.status)}${decLocked(d) || readOnly ? '' : `<button class="icon-btn" title="حذف القرار" aria-label="حذف القرار" data-del="decisions" data-i="${i}">${ic('trash', 'sm')}</button>`}</div>
                    <textarea rows="2" data-l="decisions" data-i="${i}" data-f="text" ${lk} placeholder="نص القرار">${esc(d.text)}</textarea>
                    <div class="sub">
                      <label>المسؤول عن التنفيذ<input type="text" data-l="decisions" data-i="${i}" data-f="owner" value="${esc(d.owner)}" ${lk}></label>
                      <label>الموعد النهائي<input type="date" data-l="decisions" data-i="${i}" data-f="deadline" value="${esc(d.deadline)}" ${lk}></label>
                    </div>
                    ${d.status === 'rejected' && d.admin_note ? `<div class="note bad">${ic('info', 'sm')}<span><b>سبب الرفض:</b> ${esc(d.admin_note)}${admin ? '' : ' — عدّل القرار واحفظ ليعود للمراجعة.'}</span></div>` : ''}
                    ${d.status === 'approved' && d.admin_note ? `<div class="note ok">${ic('info', 'sm')}<span><b>ملاحظة الإدارة:</b> ${esc(d.admin_note)}</span></div>` : ''}
                  </div>
                </div>`;
              }).join('')}
              ${readOnly ? (ed.decisions.length ? '' : '<p class="hint">لا توجد قرارات.</p>') : `<button class="add-row" data-add="decisions">${ic('plus', 'sm')}إضافة قرار مقترح</button>`}
            </div>
          </div>

          <div class="ed-sec">
            <div class="ed-head"><div><h2>موضوعات مقترح تأجيلها</h2><p>تظهر في قسم «الموضوعات المؤجلة» بالمحضر.</p></div></div>
            <div class="rows">
              ${ed.postponed.map((p, i) => `
                <div class="row">
                  <span class="ix num">${i + 1}</span>
                  <div class="fields">
                    <input type="text" data-l="postponed" data-i="${i}" data-f="topic" value="${esc(p.topic)}" ${dis} placeholder="الموضوع">
                    <div class="sub">
                      <label>سبب التأجيل<input type="text" data-l="postponed" data-i="${i}" data-f="reason" value="${esc(p.reason)}" ${dis}></label>
                      <label>موعد إعادة المناقشة<input type="date" data-l="postponed" data-i="${i}" data-f="revisit_date" value="${esc(p.revisit_date)}" ${dis}></label>
                    </div>
                  </div>
                  ${readOnly ? '' : `<button class="icon-btn" title="حذف" aria-label="حذف الموضوع" data-del="postponed" data-i="${i}">${ic('trash', 'sm')}</button>`}
                </div>`).join('')}
              ${readOnly ? (ed.postponed.length ? '' : '<p class="hint">لا توجد موضوعات مؤجلة.</p>') : `<button class="add-row" data-add="postponed">${ic('plus', 'sm')}إضافة موضوع مؤجل</button>`}
            </div>
          </div>

          <div class="ed-sec">
            <div class="ed-head"><div><h2>المرفقات <span class="hint num" id="filesCount"></span></h2><p>صور، PDF، أو Excel تدعم التقرير — تُرفع وتُحفظ فوراً، ولا يراها إلا مدير النظام.</p></div></div>
            ${readOnly ? '' : `
            <label class="drop" id="drop">
              <input type="file" id="fileIn" multiple accept="${window.ATTACH.accept}" hidden>
              <span class="dic">${ic('upload')}</span>
              <b>${DROP_TEXT}</b>
              <span>صور · PDF · Excel — حتى 10 ميجا للملف</span>
            </label>`}
            <div class="files" id="files"></div>
          </div>
        </div>
        ${readOnly ? '' : `
        <div class="save-bar">
          <span class="state ${dirty ? 'dirty' : ''}" id="saveState">${dirty ? '● غير محفوظ' : ic('check', 'sm') + 'كل شيء محفوظ'}</span>
          <button class="btn primary" id="saveDept">${ic('check', 'sm')}حفظ التقرير<span class="hide-sm">&nbsp;— ${esc(dname)}</span></button>
        </div>`}`;

      host.oninput = e => {
        const t = e.target;
        if (t.dataset.k) ed[t.dataset.k] = t.value;
        else if (t.dataset.l) ed[t.dataset.l][+t.dataset.i][t.dataset.f] = t.value;
        else return;
        markDirty();
      };
      host.onclick = e => {
        const add = e.target.closest('[data-add]'), del = e.target.closest('[data-del]');
        const fOpen = e.target.closest('[data-file-open]'), fDel = e.target.closest('[data-file-del]');
        if (fOpen) { e.preventDefault(); return openFile(entries.attachments.find(a => a.id === fOpen.dataset.fileOpen)); }
        if (fDel) { e.preventDefault(); return removeFile(entries.attachments.find(a => a.id === fDel.dataset.fileDel), fDel); }
        if (add) {
          const l = add.dataset.add;
          ed[l].push(l === 'decisions'
            ? { id: window.newId(), text: '', owner: '', deadline: '', status: 'proposed', admin_note: '' }
            : { id: window.newId(), topic: '', reason: '', revisit_date: '' });
          markDirty(); renderEditor();
          const items = $$(`[data-l="${l}"][data-f="${l === 'decisions' ? 'text' : 'topic'}"]`, host);
          if (items.length) items[items.length - 1].focus();
        } else if (del) {
          const l = del.dataset.del, i = +del.dataset.i, item = ed[l][i];
          const filled = ['text', 'owner', 'topic', 'reason'].some(k => item[k]);
          if (filled && !confirm('حذف هذا البند؟')) return;
          ed[l].splice(i, 1); markDirty(); renderEditor();
        }
      };
      // --- attachments
      const fileIn = $('#fileIn'), drop = $('#drop');
      if (fileIn) {
        fileIn.onchange = () => { uploadFiles(fileIn.files); fileIn.value = ''; };
        drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
        drop.ondragleave = () => drop.classList.remove('over');
        drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); uploadFiles(e.dataTransfer.files); };
      }
      renderFiles();

      const sb = $('#saveDept');
      if (sb) sb.onclick = () => quiet(busy(sb, async () => {
        const decisions = ed.decisions.filter(d => d.text.trim() || d.owner.trim())
          .map(d => ({ id: d.id, text: d.text.trim(), owner: d.owner.trim(), deadline: d.deadline }));
        const postponed = ed.postponed.filter(p => p.topic.trim() || p.reason.trim())
          .map(p => ({ id: p.id, topic: p.topic.trim(), reason: p.reason.trim(), revisit_date: p.revisit_date }));
        await api.saveDepartment(m.id, activeDept, { summary: ed.summary.trim(), decisions, postponed });
        dirty = false;
        toast('تم حفظ تقرير ' + deptName(activeDept));
        await rerender();
      }));
    }

    // ---- attachments helpers
    const deptFiles = () => entries.attachments.filter(a => a.department === activeDept);
    function fileCard(a) {
      const k = window.ATTACH.kind(a.name);
      const label = { img: 'صورة', pdf: 'PDF', xls: 'Excel' }[k];
      return `<div class="file">
        <button class="thumb k-${k}" data-file-open="${esc(a.id)}" title="فتح الملف" aria-label="فتح ${esc(a.name)}">${k === 'img' ? `<img alt="" data-thumb="${esc(a.id)}">` : `<span>${esc(window.ATTACH.extOf(a.name).toUpperCase())}</span>`}</button>
        <div class="finfo"><strong title="${esc(a.name)}">${esc(a.name)}</strong><span>${label} · ${fmtSize(a.size)}</span></div>
        <button class="icon-btn plain" data-file-open="${esc(a.id)}" title="${k === 'xls' ? 'تنزيل' : 'فتح'}" aria-label="فتح الملف">${ic(k === 'xls' ? 'download' : 'eye', 'sm')}</button>
        ${readOnly ? '' : `<button class="icon-btn" data-file-del="${esc(a.id)}" title="حذف" aria-label="حذف الملف">${ic('trash', 'sm')}</button>`}
      </div>`;
    }
    function renderFiles() {
      const box = $('#files'); if (!box) return;
      const list = deptFiles();
      box.innerHTML = list.length ? list.map(fileCard).join('') : (readOnly ? '<p class="hint">لا توجد مرفقات.</p>' : '');
      $$('[data-thumb]', box).forEach(async img => {
        try { img.src = await fileUrl(list.find(a => a.id === img.dataset.thumb)); } catch (e) { /* ignore */ }
      });
      const c = $('#filesCount'); if (c) c.textContent = list.length ? `(${list.length})` : '';
    }
    async function uploadFiles(fileList) {
      const A = window.ATTACH, dept = activeDept;
      const all = [...fileList];
      const bad = all.filter(f => !A.exts.includes(A.extOf(f.name)));
      const big = all.filter(f => !bad.includes(f) && f.size > A.max);
      if (bad.length) toast('نوع غير مسموح: ' + bad.map(f => f.name).join('، '), 'err');
      if (big.length) toast('أكبر من 10 ميجا: ' + big.map(f => f.name).join('، '), 'err');
      const good = all.filter(f => !bad.includes(f) && !big.includes(f));
      if (!good.length) return;
      const drop = $('#drop'), label = drop && $('b', drop);
      if (drop) drop.classList.add('busy');
      let n = 0;
      for (const f of good) {
        if (label) label.textContent = `جاري رفع ${f.name}…`;
        try { entries.attachments.push(await api.uploadAttachment(m.id, dept, f)); n++; if (dept === activeDept) renderFiles(); }
        catch (e) { toast(e.message || 'تعذّر رفع الملف', 'err'); }
      }
      if (drop && drop.isConnected) { drop.classList.remove('busy'); label.textContent = DROP_TEXT; }
      if (n) toast(n === 1 ? 'تم رفع الملف' : `تم رفع ${n} ملفات`);
    }
    async function removeFile(a, btn) {
      if (!a || !confirm(`حذف الملف «${a.name}»؟`)) return;
      await quiet(busy(btn, async () => {
        await api.deleteAttachment(a);
        entries.attachments = entries.attachments.filter(x => x.id !== a.id);
        urlCache.delete(a.id);
        renderFiles(); toast('تم حذف الملف');
      }));
    }

    function markDirty() {
      dirty = true;
      const s = $('#saveState');
      if (s) { s.textContent = '● غير محفوظ'; s.classList.add('dirty'); }
    }

    renderPanel();
  }

  // ---------------- minutes document ----------------
  async function viewMinutes(id) {
    loading();
    const [m, e] = await Promise.all([api.getMeeting(id), api.getEntries(id)]);
    const att = m.attendees || {};
    const byDept = (a, b) => deptIdx(a.department) - deptIdx(b.department) || a.sort - b.sort;
    const decisions = e.decisions.filter(d => st(d) === 'approved' && (d.text || '').trim()).sort(byDept);
    const pending = e.decisions.filter(d => st(d) === 'proposed').length;
    const postponed = e.postponed.filter(p => (p.topic || '').trim()).sort(byDept);

    shell(`
      ${pending ? `<div class="doc-warn">${ic('alert')}يوجد ${pending} قرار بانتظار الاعتماد ولا يظهر في المحضر. <a href="#/m/${esc(m.id)}" id="goReview">مراجعتها الآن</a></div>` : ''}

      <article class="doc">
        <header class="doc-header">
          <img src="assets/logo.png" alt="">
          <div><div class="co">شركة عنان العاصمة للخدمات اللوجستية</div><div class="title">محضر اجتماع مجلس الإدارة</div></div>
          <div class="no"><span>رقم الاجتماع</span><strong class="num">${esc(m.number)}</strong></div>
        </header>

        <div class="doc-meta">
          <div><b>التاريخ:</b>${m.meeting_date ? fmtDate(m.meeting_date) : BLANK}</div>
          <div><b>مكان الاجتماع:</b>${val(m.location)}</div>
          <div><b>رئيس الاجتماع:</b>${val(m.chair)}</div>
          <div><b>كاتب المحضر:</b>${val(m.secretary)}</div>
        </div>

        <h2 class="sec">الحضور</h2>
        <ul class="att">${ATTENDEES.map(([k, l]) => `<li><b>${l}:</b> ${val(att[k])}</li>`).join('')}</ul>

        <h2 class="sec">أولاً: الموضوعات التي تمت مناقشتها</h2>
        <table>
          <thead><tr><th>م</th><th>الموضوع</th><th>ملخص المناقشة</th></tr></thead>
          <tbody>${D.map((d, i) => {
            const r = e.reports.find(x => x.department === d.key);
            const files = (e.attachments || []).filter(x => x.department === d.key);
            return `<tr><td class="n">${i + 1}</td><td class="topic">${esc(d.name)}</td><td><div class="pre">${r && r.summary.trim() ? esc(r.summary) : ''}</div>${files.length ? `<div class="doc-files"><b>المرفقات:</b> ${files.map(f => `<a href="#" data-doc-file="${esc(f.id)}">${esc(f.name)}</a>`).join('، ')}</div>` : ''}</td></tr>`;
          }).join('')}</tbody>
        </table>

        <h2 class="sec">ثانياً: القرارات المعتمدة</h2>
        <table>
          <thead><tr><th>م</th><th>القرار</th><th>المسؤول عن التنفيذ</th><th>الموعد النهائي</th></tr></thead>
          <tbody>
            ${decisions.map((d, i) => `<tr><td class="n">${i + 1}</td><td><div class="pre">${esc(d.text)}</div><span class="dept-tag">${esc(deptName(d.department))}</span></td><td>${esc(d.owner || '')}</td><td style="white-space:nowrap">${d.deadline ? fmtDate(d.deadline, 'short') : ''}</td></tr>`).join('')}
            ${Array.from({ length: Math.max(0, 5 - decisions.length) }, (_, j) => `<tr><td class="n">${decisions.length + j + 1}</td><td>&nbsp;</td><td></td><td></td></tr>`).join('')}
          </tbody>
        </table>

        <h2 class="sec">ثالثاً: الموضوعات المؤجلة</h2>
        ${postponed.length ? postponed.map((p, i) => `
          <div class="post">
            <div><b>${i + 1}. الموضوع:</b> ${esc(p.topic)} <span class="dept-tag">(${esc(deptName(p.department))})</span></div>
            <div><b>سبب التأجيل:</b> ${val(p.reason)}</div>
            <div><b>موعد إعادة المناقشة:</b> ${p.revisit_date ? fmtDate(p.revisit_date) : BLANK}</div>
          </div>`).join('') : `
          <div class="post"><div><b>1. الموضوع:</b> ${BLANK}</div><div><b>سبب التأجيل:</b> ${BLANK}</div><div><b>موعد إعادة المناقشة:</b> ${BLANK}</div></div>`}

        <h2 class="sec">رابعاً: موعد الاجتماع القادم</h2>
        <p><b>اليوم والتاريخ:</b> ${m.next_meeting ? fmtDate(m.next_meeting) : BLANK}</p>

        <h2 class="sec">خامساً: اعتماد المحضر</h2>
        <div class="sign-grid">
          <div class="sig"><span>رئيس الاجتماع: ${esc(m.chair || '')}</span><span>التوقيع</span></div>
          <div class="sig"><span>الرئيس التنفيذي: ${esc(att.ceo || '')}</span><span>التوقيع</span></div>
        </div>
        <h3 style="margin:30px 0 0;font-size:14px">توقيعات الحضور</h3>
        <div class="sign-grid">
          ${ATTENDEES.filter(([k]) => k !== 'others').map(([k, l]) => `<div class="sig"><span>${l}${att[k] ? ': ' + esc(att[k]) : ''}</span><span>التوقيع</span></div>`).join('')}
        </div>

        <div class="doc-foot">يتم تعميم المحضر على جميع المسؤولين المعنيين، وتعتبر القرارات والتكليفات الواردة به أساساً للمتابعة والمساءلة الإدارية.</div>
      </article>`, 'meetings', {
      back: [`#/m/${esc(m.id)}`, 'العودة للاجتماع'],
      eyebrow: m.status === 'closed' ? 'المحضر الرسمي — معتمد' : 'المحضر الرسمي — مسودة لم تُقفل بعد',
      title: `محضر الاجتماع رقم <span class="num">${esc(m.number)}</span>`,
      sub: 'هذا هو الشكل النهائي للطباعة. يظهر فيه فقط القرارات المعتمدة.',
      actions: `<button class="btn white" id="printBtn">${ic('print')}طباعة / حفظ PDF</button>`
    });
    $('#printBtn').onclick = () => window.print();
    $$('[data-doc-file]').forEach(l => l.onclick = ev => { ev.preventDefault(); openFile((e.attachments || []).find(f => f.id === l.dataset.docFile)); });
    const gr = $('#goReview');
    if (gr) gr.onclick = () => { adminTab = 'decisions'; decFilter = 'proposed'; };
  }

  // ---------------- users ----------------
  async function viewUsers() {
    loading();
    const users = await api.listProfiles();
    shell(`
      <section class="card">
      ${api.mode === 'supabase' ? `<div class="ed-top"><div class="privacy"><span class="pic">${ic('info')}</span><div><b>إضافة مستخدم جديد:</b> من لوحة Supabase ← Authentication ← Users ← Add user (بريد + كلمة مرور)، وسيظهر هنا تلقائياً لتعيين إدارته.</div></div></div>` : ''}
      <div class="table-wrap"><table class="users">
        <thead><tr><th>المستخدم</th><th>الدور</th><th>الإدارات المسؤول عنها</th><th></th></tr></thead>
        <tbody>${users.map(u => `
          <tr data-uid="${esc(u.id)}">
            <td><div class="u-cell"><span class="avatar ${u.role === 'admin' ? 'dark' : 'soft'}">${esc(initials(u.full_name))}</span>
              <div style="flex:1"><input type="text" data-f="full_name" value="${esc(u.full_name || '')}" aria-label="الاسم"><small dir="ltr" style="text-align:end">${esc(u.email || '')}</small></div></div></td>
            <td><select data-f="role" ${u.id === me.id ? 'disabled title="لا يمكنك تغيير دورك"' : ''} style="min-width:140px">
              <option value="manager" ${u.role === 'manager' ? 'selected' : ''}>مدير إدارة</option>
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>أدمن</option>
            </select></td>
            <td><div class="dept-chips">${D.map(d => { const on = (u.departments || []).includes(d.key); return `<label class="dept-chip ${on ? 'on' : ''}"><input type="checkbox" value="${d.key}" ${on ? 'checked' : ''}>${esc(d.name)}</label>`; }).join('')}</div></td>
            <td><button class="btn sm" data-save>حفظ</button></td>
          </tr>`).join('')}</tbody>
      </table></div></section>`, 'users', {
      eyebrow: 'الإعدادات',
      title: 'المستخدمون والصلاحيات',
      sub: 'حدد لكل مدير الإدارة التي يكتب تقريرها. المدير لا يرى إلا إداراته — الأدمن يرى الكل ويعتمد القرارات.'
    });

    $$('.dept-chip input').forEach(c => c.onchange = () => c.parentElement.classList.toggle('on', c.checked));
    $$('[data-save]').forEach(b => b.onclick = () => {
      const tr = b.closest('tr');
      const patch = { full_name: $('[data-f=full_name]', tr).value.trim(), departments: $$('.dept-chip input:checked', tr).map(c => c.value) };
      const role = $('[data-f=role]', tr);
      if (!role.disabled) patch.role = role.value;
      quiet(busy(b, async () => { await api.updateProfile(tr.dataset.uid, patch); toast('تم حفظ الصلاحيات'); }));
    });
  }

  // ---------------- boot ----------------
  (async () => {
    try { me = await api.init(); } catch (e) { me = null; }
    route();
  })();
})();
