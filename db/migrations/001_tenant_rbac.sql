-- ============================================================================
-- Dioris Hub — Fase 1.3 (Multi-tenant) + Fase 1.4 (RBAC)
-- Aplicar UMA vez no Supabase externo via SQL Editor.
-- Idempotente (safe re-run).
-- ============================================================================

do $$ begin
  create type public.tenant_role as enum ('owner','admin','manager','member');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.tenant_plan as enum ('free','starter','pro','business','enterprise');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.tenant_status as enum ('active','suspended','canceled');
exception when duplicate_object then null; end $$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  cnpj text,
  logo_url text,
  plan public.tenant_plan not null default 'free',
  status public.tenant_status not null default 'active',
  custom_domain text unique,
  settings jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.companies to authenticated;
grant all on public.companies to service_role;
alter table public.companies enable row level security;

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.tenant_role not null default 'member',
  active boolean not null default true,
  invited_by uuid references auth.users(id) on delete set null,
  invited_at timestamptz,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, user_id)
);
grant select, insert, update, delete on public.company_members to authenticated;
grant all on public.company_members to service_role;
alter table public.company_members enable row level security;

create table if not exists public.company_invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  role public.tenant_role not null default 'member',
  token text not null unique,
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique(company_id, email)
);
grant select, insert, update, delete on public.company_invitations to authenticated;
grant all on public.company_invitations to service_role;
alter table public.company_invitations enable row level security;

-- Security definer helpers (evitam recursão RLS) ------------------------------
create or replace function public.is_company_member(_company uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.company_members
    where company_id = _company and user_id = _user and active = true
  )
$$;

create or replace function public.has_company_role(_company uuid, _user uuid, _roles public.tenant_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.company_members
    where company_id = _company and user_id = _user and active = true
      and role = any(_roles)
  )
$$;

create or replace function public.company_role(_company uuid, _user uuid)
returns public.tenant_role language sql stable security definer set search_path = public as $$
  select role from public.company_members
  where company_id = _company and user_id = _user and active = true
  limit 1
$$;

create or replace function public.has_min_role(_company uuid, _user uuid, _min public.tenant_role)
returns boolean language sql stable security definer set search_path = public as $$
  select case _min
    when 'member'  then public.has_company_role(_company, _user, array['owner','admin','manager','member']::public.tenant_role[])
    when 'manager' then public.has_company_role(_company, _user, array['owner','admin','manager']::public.tenant_role[])
    when 'admin'   then public.has_company_role(_company, _user, array['owner','admin']::public.tenant_role[])
    when 'owner'   then public.has_company_role(_company, _user, array['owner']::public.tenant_role[])
  end
$$;

-- Policies: companies --------------------------------------------------------
drop policy if exists "companies_select_members" on public.companies;
create policy "companies_select_members" on public.companies
  for select to authenticated
  using (public.is_company_member(id, auth.uid()));

drop policy if exists "companies_insert_self" on public.companies;
create policy "companies_insert_self" on public.companies
  for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists "companies_update_admins" on public.companies;
create policy "companies_update_admins" on public.companies
  for update to authenticated
  using (public.has_company_role(id, auth.uid(), array['owner','admin']::public.tenant_role[]))
  with check (public.has_company_role(id, auth.uid(), array['owner','admin']::public.tenant_role[]));

drop policy if exists "companies_delete_owner" on public.companies;
create policy "companies_delete_owner" on public.companies
  for delete to authenticated
  using (public.has_company_role(id, auth.uid(), array['owner']::public.tenant_role[]));

-- Policies: company_members --------------------------------------------------
drop policy if exists "members_select_same_company" on public.company_members;
create policy "members_select_same_company" on public.company_members
  for select to authenticated
  using (public.is_company_member(company_id, auth.uid()));

drop policy if exists "members_insert_bootstrap_or_admin" on public.company_members;
create policy "members_insert_bootstrap_or_admin" on public.company_members
  for insert to authenticated
  with check (
    (user_id = auth.uid() and role = 'owner')
    or public.has_company_role(company_id, auth.uid(), array['owner','admin']::public.tenant_role[])
  );

drop policy if exists "members_update_admins" on public.company_members;
create policy "members_update_admins" on public.company_members
  for update to authenticated
  using (public.has_company_role(company_id, auth.uid(), array['owner','admin']::public.tenant_role[]));

drop policy if exists "members_delete_admins" on public.company_members;
create policy "members_delete_admins" on public.company_members
  for delete to authenticated
  using (public.has_company_role(company_id, auth.uid(), array['owner','admin']::public.tenant_role[]));

-- Policies: invitations ------------------------------------------------------
drop policy if exists "invitations_select_members" on public.company_invitations;
create policy "invitations_select_members" on public.company_invitations
  for select to authenticated
  using (public.is_company_member(company_id, auth.uid()));

drop policy if exists "invitations_insert_admins" on public.company_invitations;
create policy "invitations_insert_admins" on public.company_invitations
  for insert to authenticated
  with check (public.has_company_role(company_id, auth.uid(), array['owner','admin']::public.tenant_role[]));

drop policy if exists "invitations_delete_admins" on public.company_invitations;
create policy "invitations_delete_admins" on public.company_invitations
  for delete to authenticated
  using (public.has_company_role(company_id, auth.uid(), array['owner','admin']::public.tenant_role[]));

-- Triggers -------------------------------------------------------------------
create or replace function public.tenant_bootstrap_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null then
    insert into public.company_members (company_id, user_id, role, active)
    values (new.id, new.created_by, 'owner', true)
    on conflict (company_id, user_id) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_tenant_bootstrap_owner on public.companies;
create trigger trg_tenant_bootstrap_owner
  after insert on public.companies
  for each row execute function public.tenant_bootstrap_owner();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists trg_companies_updated on public.companies;
create trigger trg_companies_updated before update on public.companies
  for each row execute function public.set_updated_at();
drop trigger if exists trg_members_updated on public.company_members;
create trigger trg_members_updated before update on public.company_members
  for each row execute function public.set_updated_at();

-- Índices --------------------------------------------------------------------
create index if not exists idx_company_members_user on public.company_members(user_id) where active = true;
create index if not exists idx_company_members_company on public.company_members(company_id) where active = true;
create index if not exists idx_invitations_email on public.company_invitations(lower(email));