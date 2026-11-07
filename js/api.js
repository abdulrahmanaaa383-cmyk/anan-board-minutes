// طبقة البيانات: Supabase (إنتاج) أو تخزين محلي (وضع تجريبي) — بنفس الواجهة
(function () {
  const DEPARTMENTS = [
    { key: 'general',     name: 'الأداء العام للشركة',  owner: 'الرئيس التنفيذي' },
    { key: 'operations',  name: 'إدارة التشغيل',        owner: 'مدير العمليات' },
    { key: 'finance',     name: 'الإدارة المالية',      owner: 'المدير المالي والإداري' },
    { key: 'hr',          name: 'الموارد البشرية',      owner: 'مدير الموارد البشرية' },
    { key: 'projects',    name: 'إدارة المشاريع',       owner: 'مديرو المشاريع' },
    { key: 'fleet',       name: 'الأسطول والأصول',      owner: 'مدير الأسطول' },
    { key: 'development', name: 'خطط التطوير والتوسع',  owner: 'الرئيس التنفيذي' }
  ];
  window.DEPARTMENTS = DEPARTMENTS;

  const uuid = () => (window.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
  window.newId = uuid;
  const nn = v => (v === '' || v === undefined ? null : v);

  // المرفقات المسموحة
  const MIMES = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif',
    pdf: 'application/pdf',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv'
  };
  const extOf = name => (String(name).split('.').pop() || '').toLowerCase();
  window.ATTACH = {
    exts: Object.keys(MIMES),
    accept: Object.keys(MIMES).map(e => '.' + e).join(','),
    max: 10 * 1024 * 1024,
    extOf,
    kind: name => { const e = extOf(name); return ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(e) ? 'img' : e === 'pdf' ? 'pdf' : 'xls'; }
  };
  const mimeOf = file => MIMES[extOf(file.name)] || file.type || 'application/octet-stream';

  const ERRORS = [
    [/Invalid login credentials/i, 'البريد الإلكتروني أو كلمة المرور غير صحيحة'],
    [/Email not confirmed/i, 'البريد الإلكتروني لم يتم تأكيده بعد'],
    [/row-level security|violates row-level/i, 'ليس لديك صلاحية لتنفيذ هذا الإجراء (قد يكون الاجتماع مغلقاً)'],
    [/JSON object requested, multiple \(or no\) rows/i, 'العنصر غير موجود أو ليس لديك صلاحية لعرضه'],
    [/Failed to fetch|NetworkError/i, 'تعذّر الاتصال بالخادم، تحقق من الإنترنت'],
    [/maximum allowed size|Payload too large/i, 'حجم الملف أكبر من المسموح (10 ميجا)'],
    [/mime type .* is not supported/i, 'نوع الملف غير مسموح — صور أو PDF أو Excel فقط']
  ];
  const tr = msg => { for (const [re, ar] of ERRORS) if (re.test(msg)) return ar; return msg; };

  // ------------------------------------------------------------------
  // Supabase
  // ------------------------------------------------------------------
  function SupabaseApi(cfg) {
    const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    const ok = ({ data, error }) => { if (error) throw new Error(tr(error.message)); return data; };
    let profile = null;

    async function loadProfile() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return null;
      profile = ok(await sb.from('profiles').select('*').eq('id', user.id).single());
      return profile;
    }

    return {
      mode: 'supabase',
      async init() {
        const { data: { session } } = await sb.auth.getSession();
        return session ? loadProfile() : null;
      },
      async signIn(email, password) {
        ok(await sb.auth.signInWithPassword({ email, password }));
        return loadProfile();
      },
      async signOut() { await sb.auth.signOut(); profile = null; },

      async listMeetings() {
        return ok(await sb.from('meetings').select('*').order('meeting_date', { ascending: false, nullsFirst: false }));
      },
      async getMeeting(id) { return ok(await sb.from('meetings').select('*').eq('id', id).single()); },
      async saveMeeting(m) {
        const row = { ...m };
        for (const k of ['meeting_date', 'next_meeting']) if (k in row) row[k] = nn(row[k]);
        delete row.created_at;
        if (row.id) {
          const id = row.id; delete row.id;
          return ok(await sb.from('meetings').update(row).eq('id', id).select().single());
        }
        delete row.id;
        return ok(await sb.from('meetings').insert(row).select().single());
      },
      async deleteMeeting(id) {
        const files = ok(await sb.from('attachments').select('path').eq('meeting_id', id));
        if (files.length) await sb.storage.from('attachments').remove(files.map(f => f.path));
        ok(await sb.from('meetings').delete().eq('id', id));
      },

      async getEntries(mid) {
        const [r, d, p, a] = await Promise.all([
          sb.from('reports').select('*').eq('meeting_id', mid),
          sb.from('decisions').select('*').eq('meeting_id', mid).order('sort'),
          sb.from('postponed').select('*').eq('meeting_id', mid).order('sort'),
          sb.from('attachments').select('*').eq('meeting_id', mid).order('created_at')
        ]);
        return { reports: ok(r), decisions: ok(d), postponed: ok(p), attachments: ok(a) };
      },

      async uploadAttachment(mid, dept, file) {
        const path = `${mid}/${dept}/${uuid()}.${extOf(file.name)}`;
        const mime = mimeOf(file);
        const up = await sb.storage.from('attachments').upload(path, file, { contentType: mime, upsert: false });
        if (up.error) throw new Error(tr(up.error.message));
        const { data, error } = await sb.from('attachments')
          .insert({ meeting_id: mid, department: dept, name: file.name, path, size: file.size, mime }).select().single();
        if (error) { await sb.storage.from('attachments').remove([path]); throw new Error(tr(error.message)); }
        return data;
      },
      async deleteAttachment(a) {
        ok(await sb.from('attachments').delete().eq('id', a.id));
        await sb.storage.from('attachments').remove([a.path]);
      },
      async attachmentUrl(a) {
        const { data, error } = await sb.storage.from('attachments').createSignedUrl(a.path, 3600);
        if (error) throw new Error(tr(error.message));
        return data.signedUrl;
      },
      async saveDepartment(mid, dept, p) {
        ok(await sb.from('reports').upsert({
          meeting_id: mid, department: dept, summary: p.summary || '',
          updated_by: profile && profile.id, updated_at: new Date().toISOString()
        }, { onConflict: 'meeting_id,department' }));

        const sets = [
          ['decisions', p.decisions.map((r, i) => ({ id: r.id, meeting_id: mid, department: dept, text: r.text || '', owner: r.owner || null, deadline: nn(r.deadline), sort: i }))],
          ['postponed', p.postponed.map((r, i) => ({ id: r.id, meeting_id: mid, department: dept, topic: r.topic || '', reason: r.reason || null, revisit_date: nn(r.revisit_date), sort: i }))]
        ];
        for (const [table, rows] of sets) {
          let del = sb.from(table).delete().eq('meeting_id', mid).eq('department', dept);
          if (rows.length) del = del.not('id', 'in', `(${rows.map(r => r.id).join(',')})`);
          ok(await del);
          if (rows.length) ok(await sb.from(table).upsert(rows));
        }
      },

      async decideDecision(id, status, note) {
        return ok(await sb.from('decisions').update({ status, admin_note: note || null }).eq('id', id).select().single());
      },

      async listProfiles() { return ok(await sb.from('profiles').select('*').order('created_at')); },
      async updateProfile(id, patch) {
        const row = ok(await sb.from('profiles').update(patch).eq('id', id).select().single());
        if (profile && id === profile.id) Object.assign(profile, row);
        return row;
      }
    };
  }

  // ------------------------------------------------------------------
  // الوضع التجريبي (localStorage) — يحاكي نفس قواعد الصلاحيات
  // ------------------------------------------------------------------
  function DemoApi() {
    const KEY = 'anan-minutes-demo-v2', SKEY = 'anan-minutes-demo-session';
    const store = {
      get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
      set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
      del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
    };
    const seed = () => {
      const mid = uuid(), now = new Date().toISOString();
      const db0 = seedBase(mid);
      db0.reports.push(
        { id: uuid(), meeting_id: mid, department: 'finance', summary: 'تحسّن التدفق النقدي بنسبة 12% مقارنة بالربع السابق.\nنسبة تحصيل المستحقات وصلت 85%، ومتبقي 3 عملاء متأخرين في السداد.\nالمصروفات التشغيلية ضمن الموازنة المعتمدة.', updated_by: 'u-fin', updated_at: now },
        { id: uuid(), meeting_id: mid, department: 'operations', summary: 'تنفيذ 1,240 شحنة خلال الشهر بنسبة التزام بالمواعيد 94%.\nارتفاع زمن التحميل في مستودع الرياض بسبب نقص العمالة في الوردية المسائية.', updated_by: 'u-ops', updated_at: now }
      );
      db0.decisions.push(
        { id: uuid(), meeting_id: mid, department: 'finance', text: 'اعتماد خطة تحصيل عاجلة للعملاء المتأخرين مع إيقاف الائتمان لمن تجاوز 90 يوماً', owner: 'المدير المالي والإداري', deadline: '2026-11-30', sort: 0, status: 'proposed' },
        { id: uuid(), meeting_id: mid, department: 'operations', text: 'إضافة وردية مسائية ثانية في مستودع الرياض', owner: 'مدير العمليات', deadline: '2026-11-20', sort: 0, status: 'proposed' },
        { id: uuid(), meeting_id: mid, department: 'operations', text: 'تعميم نظام تتبع الشحنات على كامل الأسطول', owner: 'مدير العمليات', deadline: '2026-12-15', sort: 1, status: 'proposed' }
      );
      return db0;
    };
    const seedBase = mid => ({
      users: [
        { id: 'u-admin', full_name: 'مدير النظام', email: 'admin@anan.demo', role: 'admin', departments: [] },
        { id: 'u-ceo', full_name: 'الرئيس التنفيذي', email: 'ceo@anan.demo', role: 'manager', departments: ['general', 'development'] },
        { id: 'u-ops', full_name: 'مدير العمليات', email: 'ops@anan.demo', role: 'manager', departments: ['operations', 'fleet'] },
        { id: 'u-fin', full_name: 'المدير المالي والإداري', email: 'finance@anan.demo', role: 'manager', departments: ['finance'] },
        { id: 'u-hr', full_name: 'مدير الموارد البشرية', email: 'hr@anan.demo', role: 'manager', departments: ['hr'] },
        { id: 'u-pm', full_name: 'مدير المشاريع', email: 'projects@anan.demo', role: 'manager', departments: ['projects'] }
      ],
      meetings: [{
        id: mid, number: '001', meeting_date: '2026-11-07', location: 'المقر الرئيسي', chair: 'الرئيس التنفيذي',
        secretary: '', attendees: {}, next_meeting: null, status: 'open', created_at: new Date().toISOString()
      }],
      reports: [], decisions: [], postponed: [], attachments: []
    });
    let db; try { db = JSON.parse(store.get(KEY)); } catch (e) { db = null; }
    if (!db || !db.users) db = seed();
    if (!db.attachments) db.attachments = [];
    const persist = () => store.set(KEY, JSON.stringify(db));
    persist();

    let me = null;
    const out = v => new Promise(r => setTimeout(() => r(v == null ? v : JSON.parse(JSON.stringify(v))), 80));
    const isAdmin = () => !!me && me.role === 'admin';
    const need = c => { if (!c) throw new Error('ليس لديك صلاحية لتنفيذ هذا الإجراء'); };
    const canRead = d => isAdmin() || (me && me.departments.includes(d));
    const meeting = id => { const m = db.meetings.find(x => x.id === id); if (!m) throw new Error('الاجتماع غير موجود'); return m; };

    return {
      mode: 'demo',
      demoUsers: () => JSON.parse(JSON.stringify(db.users)),
      async init() { me = db.users.find(u => u.id === store.get(SKEY)) || null; return out(me); },
      async signIn(id) { me = db.users.find(u => u.id === id) || null; if (me) store.set(SKEY, id); return out(me); },
      async signOut() { me = null; store.del(SKEY); },

      async listMeetings() { need(me); return out([...db.meetings].sort((a, b) => (b.meeting_date || '').localeCompare(a.meeting_date || ''))); },
      async getMeeting(id) { need(me); return out(meeting(id)); },
      async saveMeeting(row) {
        need(isAdmin());
        if (row.id) { const m = meeting(row.id); Object.assign(m, row); persist(); return out(m); }
        const m = { attendees: {}, status: 'open', ...row, id: uuid(), created_at: new Date().toISOString() };
        db.meetings.push(m); persist(); return out(m);
      },
      async deleteMeeting(id) {
        need(isAdmin());
        db.meetings = db.meetings.filter(m => m.id !== id);
        for (const t of ['reports', 'decisions', 'postponed', 'attachments']) db[t] = db[t].filter(x => x.meeting_id !== id);
        persist();
      },

      async getEntries(mid) {
        need(me);
        const f = x => x.meeting_id === mid && canRead(x.department);
        const s = (a, b) => a.sort - b.sort;
        return out({
          reports: db.reports.filter(f), decisions: db.decisions.filter(f).sort(s), postponed: db.postponed.filter(f).sort(s),
          attachments: db.attachments.filter(f).map(({ data, ...meta }) => meta)
        });
      },

      async uploadAttachment(mid, dept, file) {
        const m = meeting(mid);
        need(isAdmin() || (me && me.departments.includes(dept)));
        if (!isAdmin() && m.status !== 'open') throw new Error('الاجتماع مغلق ولا يمكن التعديل');
        if (file.size > 2 * 1024 * 1024) throw new Error('في الوضع التجريبي الحد الأقصى 2 ميجا للملف (في النسخة الفعلية 10 ميجا)');
        const data = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result); r.onerror = () => rej(new Error('تعذّرت قراءة الملف'));
          r.readAsDataURL(file);
        });
        const row = { id: uuid(), meeting_id: mid, department: dept, name: file.name, path: '', size: file.size, mime: mimeOf(file), uploaded_by: me.id, created_at: new Date().toISOString(), data };
        db.attachments.push(row);
        try { localStorage.setItem(KEY, JSON.stringify(db)); }
        catch (e) { db.attachments.pop(); throw new Error('مساحة التخزين التجريبية في المتصفح امتلأت — احذف بعض المرفقات'); }
        const { data: _, ...meta } = row;
        return out(meta);
      },
      async deleteAttachment(a) {
        const row = db.attachments.find(x => x.id === a.id); if (!row) return;
        const m = meeting(row.meeting_id);
        need(isAdmin() || (me && me.departments.includes(row.department)));
        if (!isAdmin() && m.status !== 'open') throw new Error('الاجتماع مغلق ولا يمكن التعديل');
        db.attachments = db.attachments.filter(x => x.id !== a.id);
        persist();
      },
      async attachmentUrl(a) {
        const row = db.attachments.find(x => x.id === a.id);
        if (!row || !(isAdmin() || (me && me.departments.includes(row.department)))) throw new Error('الملف غير موجود');
        const blob = await (await fetch(row.data)).blob();
        return URL.createObjectURL(blob);
      },
      async saveDepartment(mid, dept, p) {
        const m = meeting(mid);
        need(isAdmin() || (me && me.departments.includes(dept)));
        if (!isAdmin() && m.status !== 'open') throw new Error('الاجتماع مغلق ولا يمكن التعديل');
        const now = new Date().toISOString();
        const r = db.reports.find(x => x.meeting_id === mid && x.department === dept);
        if (r) Object.assign(r, { summary: p.summary || '', updated_by: me.id, updated_at: now });
        else db.reports.push({ id: uuid(), meeting_id: mid, department: dept, summary: p.summary || '', updated_by: me.id, updated_at: now });
        const mine = x => x.meeting_id === mid && x.department === dept;
        // القرارات — نفس قواعد trigger قاعدة البيانات
        const old = db.decisions.filter(mine);
        const next = p.decisions.map((x, i) => {
          const o = old.find(y => y.id === x.id);
          const row = { id: x.id, text: x.text, owner: x.owner, deadline: x.deadline, meeting_id: mid, department: dept, sort: i, status: 'proposed', admin_note: null, decided_at: null };
          if (!o) return row;
          if (!isAdmin() && o.status === 'approved') return { ...o, sort: i };
          const changed = o.text !== x.text || (o.owner || '') !== (x.owner || '') || (o.deadline || '') !== (x.deadline || '');
          return { ...row, status: (!isAdmin() && changed) ? 'proposed' : o.status, admin_note: o.admin_note, decided_at: o.decided_at };
        });
        const keepApproved = isAdmin() ? [] : old.filter(o => o.status === 'approved' && !next.some(n => n.id === o.id));
        db.decisions = db.decisions.filter(x => !mine(x)).concat(next, keepApproved);
        db.postponed = db.postponed.filter(x => !mine(x)).concat(p.postponed.map((x, i) => ({ ...x, meeting_id: mid, department: dept, sort: i })));
        persist();
      },
      async decideDecision(id, status, note) {
        need(isAdmin());
        const d = db.decisions.find(x => x.id === id); if (!d) throw new Error('القرار غير موجود');
        Object.assign(d, { status, admin_note: note || null, decided_at: new Date().toISOString() });
        persist(); return out(d);
      },

      async listProfiles() { need(isAdmin()); return out(db.users); },
      async updateProfile(id, patch) {
        need(isAdmin());
        const u = db.users.find(x => x.id === id); Object.assign(u, patch);
        if (me && me.id === id) Object.assign(me, patch);
        persist(); return out(u);
      },
      async resetDemo() { db = seed(); persist(); me = null; store.del(SKEY); }
    };
  }

  window.createApi = function () {
    const cfg = window.APP_CONFIG || {};
    if (cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase) return SupabaseApi(cfg);
    return DemoApi();
  };
})();
