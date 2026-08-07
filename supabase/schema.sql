-- ============================================================================
-- NEXUS AGÊNCIA - ERP - Supabase Schema
-- Run this in Supabase > SQL Editor
-- ============================================================================

-- ---------------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------------

-- Companies (workspaces). Each company has its own isolated data.
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  trade_name text,
  cnpj text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  zip_code text,
  logo_url text,
  theme text not null default 'dark',
  language text not null default 'pt-BR',
  currency text not null default 'BRL',
  created_at timestamptz not null default now()
);

-- Profiles: app-level user info linked to Supabase auth users.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'Funcionário' check (role in ('Administrador', 'Gerente', 'Funcionário')),
  avatar text,
  phone text,
  created_at timestamptz not null default now()
);

-- Single-document state per company (mirrors the app's in-memory data model).
create table if not exists public.company_state (
  company_id uuid primary key references public.companies (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists profiles_company_idx on public.profiles (company_id);

-- ---------------------------------------------------------------------------
-- HELPERS
-- ---------------------------------------------------------------------------

create or replace function public.fn_company_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select p.company_id
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.fn_is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((p.role = 'Administrador'), false)
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.generate_company_code()
returns text
language plpgsql
set search_path = public
as $$
declare v_code text;
begin
  loop
    v_code := upper(substring(md5(random()::text) from 1 for 6));
    exit when not exists (select 1 from public.companies where code = v_code);
  end loop;
  return v_code;
end;
$$;

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER FUNCTIONS (create company, join company, remove member)
-- ---------------------------------------------------------------------------

create or replace function public.create_company(
  p_company_name text,
  p_user_name text,
  p_email text,
  p_role text default 'Administrador'
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_code text;
begin
  v_code := public.generate_company_code();

  insert into public.companies (id, code, name, trade_name)
  values (gen_random_uuid(), v_code, p_company_name, p_company_name)
  returning id into v_company_id;

  insert into public.profiles (id, company_id, name, email, role)
  values (auth.uid(), v_company_id, p_user_name, p_email, p_role);

  insert into public.company_state (company_id, data)
  values (v_company_id, '{}'::jsonb);

  return jsonb_build_object('company_id', v_company_id, 'code', v_code);
end;
$$;

create or replace function public.join_company(
  p_code text,
  p_user_name text,
  p_email text,
  p_role text default 'Funcionário'
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_company_id uuid;
begin
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Este e-mail já está vinculado a uma empresa';
  end if;

  select id into v_company_id
  from public.companies
  where code = upper(trim(p_code));

  if v_company_id is null then
    raise exception 'Código de empresa inválido';
  end if;

  insert into public.profiles (id, company_id, name, email, role)
  values (auth.uid(), v_company_id, p_user_name, p_email, p_role);

  return jsonb_build_object('company_id', v_company_id, 'code', upper(trim(p_code)));
end;
$$;

create or replace function public.remove_member(p_member_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.fn_is_admin() then
    raise exception 'Apenas administradores podem remover membros';
  end if;
  if p_member_id = auth.uid() then
    raise exception 'Você não pode remover a si mesmo';
  end if;
  delete from public.profiles
  where id = p_member_id and company_id = public.fn_company_id();
end;
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_company_state_updated on public.company_state;
create trigger trg_company_state_updated
before update on public.company_state
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.company_state enable row level security;

drop policy if exists "companies_select_members" on public.companies;
create policy "companies_select_members" on public.companies
  for select using (public.fn_company_id() = id);

drop policy if exists "companies_update_members" on public.companies;
create policy "companies_update_members" on public.companies
  for update using (public.fn_company_id() = id);

drop policy if exists "profiles_select_members" on public.profiles;
create policy "profiles_select_members" on public.profiles
  for select using (company_id = public.fn_company_id());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin" on public.profiles
  for update using (
    id = auth.uid()
    or (public.fn_is_admin() and company_id = public.fn_company_id())
  );

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles
  for delete using (
    public.fn_is_admin()
    and company_id = public.fn_company_id()
    and id <> auth.uid()
  );

drop policy if exists "state_members_all" on public.company_state;
create policy "state_members_all" on public.company_state
  for all using (company_id = public.fn_company_id());

-- ---------------------------------------------------------------------------
-- REALTIME (live sync between team members)
-- ---------------------------------------------------------------------------

drop publication if exists supabase_realtime; -- safe no-op if missing
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.company_state;
  end if;
end $$;
