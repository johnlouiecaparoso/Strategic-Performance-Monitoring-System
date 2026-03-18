-- Strategic Performance Monitoring System (SPMS)
-- Supabase Database Schema
-- Run this in your Supabase SQL Editor: https://app.supabase.com → SQL Editor

-- Enable RLS
alter database postgres set timezone to 'Asia/Manila';

-- ─────────────────────────────── ENUMS ────────────────────────────────────

do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin', 'encoder', 'validator', 'executive');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'kpi_status') then
    create type kpi_status as enum ('completed', 'ongoing', 'delayed', 'not_started');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'submission_status') then
    create type submission_status as enum ('submitted', 'not_submitted', 'late');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'issue_severity') then
    create type issue_severity as enum ('low', 'medium', 'high');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'issue_status') then
    create type issue_status as enum ('open', 'resolved');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'validation_status') then
    create type validation_status as enum ('pending', 'approved', 'rejected');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'accomplishment_month') then
    create type accomplishment_month as enum (
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'kpi_status' and e.enumlabel = 'for_validation'
  ) then
    alter type kpi_status add value 'for_validation';
  end if;
end $$;

-- ─────────────────────────────── TABLES ───────────────────────────────────

create table if not exists offices (
  id          text primary key,
  name        text not null,
  code        text not null unique,
  focal_person text not null,
  created_at  timestamptz default now()
);

create table if not exists goals (
  id          text primary key,
  number      int  not null,
  name        text not null,
  description text,
  created_at  timestamptz default now()
);

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null unique,
  role        user_role not null default 'encoder',
  office_id   text references offices(id),
  created_at  timestamptz default now()
);

create table if not exists kpis (
  id                text primary key,
  code              text not null unique,
  name              text not null,
  description       text,
  goal_id           text not null references goals(id),
  office_id         text not null references offices(id),
  target            numeric not null,
  unit              text not null,
  status            kpi_status not null default 'not_started',
  submission_status submission_status not null default 'not_submitted',
  submission_date   date,
  focal_person      text not null,
  pillar            text,
  assignment_type   text,
  perspective       text,
  strategic_objective text,
  q1_target         numeric,
  target_text       text,
  key_activities_outputs text,
  mov_text          text,
  bsc_remarks       text,
  source_sheet      text,
  source_row        int,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create table if not exists kpi_assignments (
  id               text primary key,
  kpi_id           text not null references kpis(id) on delete cascade,
  assigned_office_unit text not null,
  assignment_type  text,
  pillar           text,
  focal_person     text,
  source_sheet     text,
  source_row       int,
  created_at       timestamptz default now(),
  unique(kpi_id, assigned_office_unit, assignment_type)
);

create table if not exists monthly_accomplishments (
  id              text primary key,
  kpi_id          text not null references kpis(id) on delete cascade,
  month           accomplishment_month not null,
  accomplishment  numeric not null default 0,
  percentage      numeric not null default 0,
  remarks         text,
  created_at      timestamptz default now(),
  unique(kpi_id, month)
);

create table if not exists issues (
  id                text primary key,
  kpi_id            text not null references kpis(id) on delete cascade,
  office_id         text not null references offices(id),
  category          text not null,
  description       text not null,
  severity          issue_severity not null default 'low',
  status            issue_status not null default 'open',
  assistance_needed text,
  date_reported     date not null default current_date,
  created_at        timestamptz default now()
);

create table if not exists movs (
  id             text primary key,
  kpi_id         text not null references kpis(id) on delete cascade,
  month          text not null,
  file_name      text not null,
  file_url       text not null,
  uploaded_by    text not null,
  uploaded_date  date not null default current_date,
  validated      boolean not null default false,
  validator_notes text,
  created_at     timestamptz default now()
);

create table if not exists validations (
  id           text primary key,
  kpi_id       text not null references kpis(id) on delete cascade,
  validator_id uuid references profiles(id),
  status       validation_status not null default 'pending',
  notes        text,
  date         date not null default current_date,
  created_at   timestamptz default now()
);

alter table kpis add column if not exists pillar text;
alter table kpis add column if not exists assignment_type text;
alter table kpis add column if not exists perspective text;
alter table kpis add column if not exists strategic_objective text;
alter table kpis add column if not exists q1_target numeric;
alter table kpis add column if not exists target_text text;
alter table kpis add column if not exists key_activities_outputs text;
alter table kpis add column if not exists mov_text text;
alter table kpis add column if not exists bsc_remarks text;
alter table kpis add column if not exists source_sheet text;
alter table kpis add column if not exists source_row int;

-- ─────────────────────────────── INDEXES ──────────────────────────────────

create index idx_kpis_goal_id   on kpis(goal_id);
create index idx_kpis_office_id on kpis(office_id);
create index idx_monthly_acc_kpi_id on monthly_accomplishments(kpi_id);
create index idx_issues_kpi_id  on issues(kpi_id);
create index idx_issues_office_id on issues(office_id);
create index idx_movs_kpi_id    on movs(kpi_id);
create index if not exists idx_kpis_source on kpis(source_sheet, source_row);
create index if not exists idx_kpi_assignments_kpi_id on kpi_assignments(kpi_id);

-- ──────────────────────── ROW LEVEL SECURITY ──────────────────────────────

alter table offices                enable row level security;
alter table goals                  enable row level security;
alter table profiles               enable row level security;
alter table kpis                   enable row level security;
alter table monthly_accomplishments enable row level security;
alter table issues                 enable row level security;
alter table movs                   enable row level security;
alter table validations            enable row level security;
alter table kpi_assignments        enable row level security;

-- Authenticated users can read all reference data
create policy "Authenticated read offices"  on offices  for select to authenticated using (true);
create policy "Authenticated read goals"    on goals    for select to authenticated using (true);
create policy "Authenticated read kpis"     on kpis     for select to authenticated using (true);
create policy "Authenticated read monthly"  on monthly_accomplishments for select to authenticated using (true);
create policy "Authenticated read issues"   on issues   for select to authenticated using (true);
create policy "Authenticated read movs"     on movs     for select to authenticated using (true);
create policy "Authenticated read validations" on validations for select to authenticated using (true);
create policy "Authenticated read kpi assignments" on kpi_assignments for select to authenticated using (true);

-- Users can read their own profile
create policy "Users read own profile" on profiles for select to authenticated using (auth.uid() = id);

-- Admin / encoder can insert/update KPIs
create policy "Admin insert kpis" on kpis for insert to authenticated
  with check ((select role from profiles where id = auth.uid()) in ('admin','encoder'));

create policy "Admin update kpis" on kpis for update to authenticated
  using ((select role from profiles where id = auth.uid()) in ('admin','encoder'));

-- Encoder can insert monthly accomplishments
create policy "Encoder insert monthly" on monthly_accomplishments for insert to authenticated
  with check ((select role from profiles where id = auth.uid()) in ('admin','encoder'));

create policy "Encoder update monthly" on monthly_accomplishments for update to authenticated
  using ((select role from profiles where id = auth.uid()) in ('admin','encoder'));

-- Encoder can upload MOVs
create policy "Encoder insert movs" on movs for insert to authenticated
  with check ((select role from profiles where id = auth.uid()) in ('admin','encoder'));

-- Validator can update validations and MOV validation status
create policy "Validator update movs" on movs for update to authenticated
  using ((select role from profiles where id = auth.uid()) in ('admin','validator'));

-- Admin full access
create policy "Admin all offices" on offices for all to authenticated
  using ((select role from profiles where id = auth.uid()) = 'admin');

create policy "Admin all goals" on goals for all to authenticated
  using ((select role from profiles where id = auth.uid()) = 'admin');

create policy "Admin insert kpi assignments" on kpi_assignments for insert to authenticated
  with check ((select role from profiles where id = auth.uid()) in ('admin','encoder'));

create policy "Admin update kpi assignments" on kpi_assignments for update to authenticated
  using ((select role from profiles where id = auth.uid()) in ('admin','encoder'));

-- ──────────────────────────── AUTO-PROFILE ────────────────────────────────
-- Automatically create a profile row when a user signs up

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'encoder'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
