-- =====================================================================
--  منصة محاضر مجلس الإدارة — شركة عنان العاصمة للخدمات اللوجستية
--  شغّل هذا الملف مرة واحدة في Supabase → SQL Editor
--  (آمن لإعادة التشغيل)
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- الجداول
-- ---------------------------------------------------------------------

-- ملف كل مستخدم: الدور + الإدارات المسؤول عنها
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  full_name    text,
  role         text not null default 'manager' check (role in ('admin','manager')),
  departments  text[] not null default '{}',
  created_at   timestamptz not null default now()
);

-- الاجتماعات (بيانات رأس المحضر)
create table if not exists public.meetings (
  id            uuid primary key default gen_random_uuid(),
  number        text not null,
  meeting_date  date,
  location      text,
  chair         text default 'الرئيس التنفيذي',
  secretary     text,
  attendees     jsonb not null default '{}'::jsonb,
  next_meeting  date,
  status        text not null default 'open' check (status in ('open','closed')),
  created_at    timestamptz not null default now()
);

-- ملخص المناقشة لكل إدارة في كل اجتماع
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  meeting_id  uuid not null references public.meetings(id) on delete cascade,
  department  text not null,
  summary     text not null default '',
  updated_by  uuid references public.profiles(id) on delete set null,
  updated_at  timestamptz not null default now(),
  unique (meeting_id, department)
);

-- القرارات المقترحة / المعتمدة
create table if not exists public.decisions (
  id          uuid primary key default gen_random_uuid(),
  meeting_id  uuid not null references public.meetings(id) on delete cascade,
  department  text not null,
  text        text not null default '',
  owner       text,
  deadline    date,
  sort        int not null default 0,
  created_by  uuid default auth.uid(),
  created_at  timestamptz not null default now()
);

-- الموضوعات المؤجلة
create table if not exists public.postponed (
  id            uuid primary key default gen_random_uuid(),
  meeting_id    uuid not null references public.meetings(id) on delete cascade,
  department    text not null,
  topic         text not null default '',
  reason        text,
  revisit_date  date,
  sort          int not null default 0,
  created_by    uuid default auth.uid(),
  created_at    timestamptz not null default now()
);

-- المرفقات (صور / PDF / Excel) — الملف نفسه في Storage، وهنا بياناته
create table if not exists public.attachments (
  id           uuid primary key default gen_random_uuid(),
  meeting_id   uuid not null references public.meetings(id) on delete cascade,
  department   text not null,
  name         text not null,
  path         text not null unique,
  size         bigint,
  mime         text,
  uploaded_by  uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists attachments_meeting_idx on public.attachments(meeting_id, department);

-- حالة اعتماد القرار: proposed = بانتظار الاعتماد / approved = معتمد / rejected = مرفوض
alter table public.decisions add column if not exists status text not null default 'proposed';
alter table public.decisions add column if not exists admin_note text;
alter table public.decisions add column if not exists decided_by uuid references public.profiles(id) on delete set null;
alter table public.decisions add column if not exists decided_at timestamptz;
alter table public.decisions drop constraint if exists decisions_status_check;
alter table public.decisions add constraint decisions_status_check check (status in ('proposed','approved','rejected'));

create index if not exists decisions_meeting_idx on public.decisions(meeting_id, department);
create index if not exists postponed_meeting_idx on public.postponed(meeting_id, department);

-- ---------------------------------------------------------------------
-- دوال الصلاحيات
-- ---------------------------------------------------------------------

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_departments() returns text[]
language sql stable security definer set search_path = public as $$
  select coalesce((select departments from public.profiles where id = auth.uid()), '{}');
$$;

create or replace function public.meeting_open(mid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.meetings where id = mid and status = 'open');
$$;

-- القراءة: الأدمن يرى الكل — المدير يرى إدارته فقط
create or replace function public.can_read(dept text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or dept = any(public.my_departments());
$$;

-- الكتابة: الأدمن دائماً — المدير لإدارته فقط وطالما الاجتماع مفتوح
create or replace function public.can_write(mid uuid, dept text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin()
      or (dept = any(public.my_departments()) and public.meeting_open(mid));
$$;

-- ---------------------------------------------------------------------
-- إنشاء ملف تلقائي عند إضافة مستخدم جديد
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ملفات للمستخدمين الموجودين مسبقاً (إن وجدوا)
insert into public.profiles (id, email, full_name)
select id, email, split_part(email, '@', 1) from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- سياسات الأمان (Row Level Security) — هنا يتم الفصل بين الإدارات
-- ---------------------------------------------------------------------

alter table public.profiles  enable row level security;
alter table public.meetings  enable row level security;
alter table public.reports   enable row level security;
alter table public.decisions enable row level security;
alter table public.postponed enable row level security;
alter table public.attachments enable row level security;

-- profiles: كل شخص يرى ملفه، الأدمن يرى ويعدّل الكل. لا أحد يرفع صلاحيته بنفسه.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

-- meetings: كل مستخدم مسجّل يرى الاجتماعات، الأدمن فقط يُنشئ ويعدّل ويحذف
drop policy if exists meetings_select on public.meetings;
create policy meetings_select on public.meetings for select
  using (auth.uid() is not null);
drop policy if exists meetings_insert on public.meetings;
create policy meetings_insert on public.meetings for insert
  with check (public.is_admin());
drop policy if exists meetings_update on public.meetings;
create policy meetings_update on public.meetings for update
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists meetings_delete on public.meetings;
create policy meetings_delete on public.meetings for delete
  using (public.is_admin());

-- reports / decisions / postponed / attachments: نفس القاعدة
do $$
declare t text;
begin
  foreach t in array array['reports','decisions','postponed','attachments'] loop
    execute format('drop policy if exists %1$s_select on public.%1$s', t);
    execute format('create policy %1$s_select on public.%1$s for select using (public.can_read(department))', t);
    execute format('drop policy if exists %1$s_insert on public.%1$s', t);
    execute format('create policy %1$s_insert on public.%1$s for insert with check (public.can_write(meeting_id, department))', t);
    execute format('drop policy if exists %1$s_update on public.%1$s', t);
    execute format('create policy %1$s_update on public.%1$s for update using (public.can_write(meeting_id, department)) with check (public.can_write(meeting_id, department))', t);
    execute format('drop policy if exists %1$s_delete on public.%1$s', t);
    execute format('create policy %1$s_delete on public.%1$s for delete using (public.can_write(meeting_id, department))', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- حماية اعتماد القرارات: الأدمن فقط يعتمد أو يرفض
--   • المدير لا يستطيع تغيير حالة القرار أبداً
--   • القرار المعتمد لا يستطيع المدير تعديله أو حذفه
--   • لو عدّل المدير قراراً مرفوضاً، يرجع تلقائياً «بانتظار الاعتماد»
-- ---------------------------------------------------------------------

create or replace function public.guard_decision() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then
    if tg_op = 'UPDATE' and new.status is distinct from old.status then
      new.decided_by := auth.uid();
      new.decided_at := now();
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'proposed'; new.admin_note := null; new.decided_by := null; new.decided_at := null;
    return new;
  end if;

  if old.status = 'approved' then
    return old;  -- القرار المعتمد مقفول على المدير
  end if;

  if (new.text, new.owner, new.deadline) is distinct from (old.text, old.owner, old.deadline) then
    new.status := 'proposed';
  else
    new.status := old.status;
  end if;
  new.admin_note := old.admin_note; new.decided_by := old.decided_by; new.decided_at := old.decided_at;
  return new;
end;
$$;

drop trigger if exists decisions_guard on public.decisions;
create trigger decisions_guard
  before insert or update on public.decisions
  for each row execute function public.guard_decision();

-- المدير لا يحذف قراراً معتمداً
drop policy if exists decisions_delete on public.decisions;
create policy decisions_delete on public.decisions for delete
  using (public.can_write(meeting_id, department) and (public.is_admin() or status <> 'approved'));

-- ---------------------------------------------------------------------
-- تخزين الملفات (Storage) — مخزن خاص (غير عام)
-- مسار كل ملف: <meeting_id>/<department>/<random>.<ext>
-- نفس قواعد الفصل: المدير يرى ويرفع ملفات إدارته فقط
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attachments', 'attachments', false, 10485760, array[
  'image/png','image/jpeg','image/webp','image/gif',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv'
])
on conflict (id) do update set public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists attachments_obj_select on storage.objects;
create policy attachments_obj_select on storage.objects for select
  using (bucket_id = 'attachments' and public.can_read((storage.foldername(name))[2]));

drop policy if exists attachments_obj_insert on storage.objects;
create policy attachments_obj_insert on storage.objects for insert
  with check (bucket_id = 'attachments'
    and public.can_write(((storage.foldername(name))[1])::uuid, (storage.foldername(name))[2]));

drop policy if exists attachments_obj_delete on storage.objects;
create policy attachments_obj_delete on storage.objects for delete
  using (bucket_id = 'attachments'
    and public.can_write(((storage.foldername(name))[1])::uuid, (storage.foldername(name))[2]));

-- ---------------------------------------------------------------------
-- بيانات أولية: الاجتماع رقم 001
-- ---------------------------------------------------------------------

insert into public.meetings (number, meeting_date, chair)
select '001', '2026-11-07', 'الرئيس التنفيذي'
where not exists (select 1 from public.meetings where number = '001');

-- ---------------------------------------------------------------------
-- بعد إنشاء حسابك من Authentication → Users، اجعل نفسك أدمن:
--
--   update public.profiles set role = 'admin' where email = 'you@example.com';
--
-- مفاتيح الإدارات المستخدمة في عمود departments:
--   general      الأداء العام للشركة
--   operations   إدارة التشغيل
--   finance      الإدارة المالية
--   hr           الموارد البشرية
--   projects     إدارة المشاريع
--   fleet        الأسطول والأصول
--   development  خطط التطوير والتوسع
-- (يمكن أيضاً تعيينها من شاشة «المستخدمون والصلاحيات» داخل المنصة)
-- ---------------------------------------------------------------------
