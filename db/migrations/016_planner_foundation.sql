-- ============================================================================
-- Dioris Hub — Fase 3.1: Planner Foundation
-- Aplicar UMA vez no Supabase externo via SQL Editor.
-- Idempotente (safe re-run).
--
-- Espelha exatamente as shapes definidas em:
--   src/modules/planner/shared/types/project.ts
--   src/modules/planner/shared/persistence/local-store.ts
--
-- Requer migrations anteriores:
--   001_tenant_rbac.sql (companies, company_members, public.is_tenant_member)
-- ============================================================================

-- =================== ENUMS ===================
do $$ begin
  create type public.planner_project_status as enum (
    'draft','in_progress','review','approved','archived'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.planner_room_type as enum (
    'closet','dormitorio','banheiro','lavanderia','escritorio',
    'cozinha','sala','comercial','corporativo','outro'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.planner_node_kind as enum (
    'wall','floor','ceiling','opening','module','hardware','material'
  );
exception when duplicate_object then null; end $$;

-- =================== TABELAS ===================

-- Projetos do Planner (raiz do domínio, tenant-scoped).
create table if not exists public.planner_projects (
  id text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null,
  client text,
  status public.planner_project_status not null default 'draft',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planner_projects_name_len check (char_length(name) between 1 and 200),
  constraint planner_projects_version_pos check (version >= 1)
);
grant select, insert, update, delete on public.planner_projects to authenticated;
grant all on public.planner_projects to service_role;
alter table public.planner_projects enable row level security;

create index if not exists idx_planner_projects_company on public.planner_projects(company_id);
create index if not exists idx_planner_projects_owner   on public.planner_projects(owner_id);
create index if not exists idx_planner_projects_status  on public.planner_projects(company_id, status);
create index if not exists idx_planner_projects_updated on public.planner_projects(company_id, updated_at desc);

-- Ambientes (agrupam cômodos dentro de um projeto).
create table if not exists public.planner_environments (
  id text primary key,
  project_id text not null references public.planner_projects(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planner_environments_name_len check (char_length(name) between 1 and 200)
);
grant select, insert, update, delete on public.planner_environments to authenticated;
grant all on public.planner_environments to service_role;
alter table public.planner_environments enable row level security;

create index if not exists idx_planner_env_project on public.planner_environments(project_id, position);
create index if not exists idx_planner_env_company on public.planner_environments(company_id);

-- Cômodos (com dimensões em milímetros — unidade oficial do motor paramétrico).
create table if not exists public.planner_rooms (
  id text primary key,
  environment_id text not null references public.planner_environments(id) on delete cascade,
  project_id text not null references public.planner_projects(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  type public.planner_room_type not null default 'outro',
  width_mm integer not null,
  height_mm integer not null,
  depth_mm integer not null,
  node_order jsonb not null default '[]'::jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planner_rooms_name_len   check (char_length(name) between 1 and 200),
  constraint planner_rooms_width_pos  check (width_mm  > 0 and width_mm  <= 1000000),
  constraint planner_rooms_height_pos check (height_mm > 0 and height_mm <= 1000000),
  constraint planner_rooms_depth_pos  check (depth_mm  > 0 and depth_mm  <= 1000000),
  constraint planner_rooms_node_order_array check (jsonb_typeof(node_order) = 'array')
);
grant select, insert, update, delete on public.planner_rooms to authenticated;
grant all on public.planner_rooms to service_role;
alter table public.planner_rooms enable row level security;

create index if not exists idx_planner_rooms_env     on public.planner_rooms(environment_id, position);
create index if not exists idx_planner_rooms_project on public.planner_rooms(project_id);
create index if not exists idx_planner_rooms_company on public.planner_rooms(company_id);
create index if not exists idx_planner_rooms_type    on public.planner_rooms(company_id, type);

-- Nós paramétricos (grafo plano id -> nó, ligado ao cômodo).
create table if not exists public.planner_parametric_nodes (
  id text primary key,
  room_id text not null references public.planner_rooms(id) on delete cascade,
  project_id text not null references public.planner_projects(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  kind public.planner_node_kind not null,
  label text not null,
  params jsonb not null default '{}'::jsonb,
  children jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planner_nodes_label_len       check (char_length(label) between 1 and 200),
  constraint planner_nodes_params_object   check (jsonb_typeof(params)   = 'object'),
  constraint planner_nodes_children_array  check (jsonb_typeof(children) = 'array')
);
grant select, insert, update, delete on public.planner_parametric_nodes to authenticated;
grant all on public.planner_parametric_nodes to service_role;
alter table public.planner_parametric_nodes enable row level security;

create index if not exists idx_planner_nodes_room    on public.planner_parametric_nodes(room_id);
create index if not exists idx_planner_nodes_project on public.planner_parametric_nodes(project_id);
create index if not exists idx_planner_nodes_company on public.planner_parametric_nodes(company_id);
create index if not exists idx_planner_nodes_kind    on public.planner_parametric_nodes(company_id, kind);

-- Histórico de versões (snapshots completos do PlannerProject).
create table if not exists public.planner_project_versions (
  id text primary key,
  project_id text not null references public.planner_projects(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  version integer not null,
  label text not null,
  snapshot jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint planner_versions_label_len      check (char_length(label) between 1 and 200),
  constraint planner_versions_version_pos    check (version >= 1),
  constraint planner_versions_snapshot_object check (jsonb_typeof(snapshot) = 'object'),
  unique (project_id, version, id)
);
grant select, insert, update, delete on public.planner_project_versions to authenticated;
grant all on public.planner_project_versions to service_role;
alter table public.planner_project_versions enable row level security;

create index if not exists idx_planner_versions_project on public.planner_project_versions(project_id, created_at desc);
create index if not exists idx_planner_versions_company on public.planner_project_versions(company_id);

-- =================== TRIGGERS updated_at ===================
create or replace function public.planner_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$ begin
  create trigger trg_planner_projects_updated
    before update on public.planner_projects
    for each row execute function public.planner_touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_planner_environments_updated
    before update on public.planner_environments
    for each row execute function public.planner_touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_planner_rooms_updated
    before update on public.planner_rooms
    for each row execute function public.planner_touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_planner_nodes_updated
    before update on public.planner_parametric_nodes
    for each row execute function public.planner_touch_updated_at();
exception when duplicate_object then null; end $$;

-- =================== RLS POLICIES ===================
-- Reutiliza public.is_tenant_member(company_id) da migration 001.

do $$ begin
  create policy "tenant read planner_projects"
    on public.planner_projects for select
    using (public.is_tenant_member(company_id));
  create policy "tenant write planner_projects"
    on public.planner_projects for all
    using (public.is_tenant_member(company_id))
    with check (public.is_tenant_member(company_id));

  create policy "tenant read planner_environments"
    on public.planner_environments for select
    using (public.is_tenant_member(company_id));
  create policy "tenant write planner_environments"
    on public.planner_environments for all
    using (public.is_tenant_member(company_id))
    with check (public.is_tenant_member(company_id));

  create policy "tenant read planner_rooms"
    on public.planner_rooms for select
    using (public.is_tenant_member(company_id));
  create policy "tenant write planner_rooms"
    on public.planner_rooms for all
    using (public.is_tenant_member(company_id))
    with check (public.is_tenant_member(company_id));

  create policy "tenant read planner_nodes"
    on public.planner_parametric_nodes for select
    using (public.is_tenant_member(company_id));
  create policy "tenant write planner_nodes"
    on public.planner_parametric_nodes for all
    using (public.is_tenant_member(company_id))
    with check (public.is_tenant_member(company_id));

  create policy "tenant read planner_versions"
    on public.planner_project_versions for select
    using (public.is_tenant_member(company_id));
  create policy "tenant write planner_versions"
    on public.planner_project_versions for all
    using (public.is_tenant_member(company_id))
    with check (public.is_tenant_member(company_id));
exception when duplicate_object then null; end $$;

-- ============================================================================
-- FIM — 016_planner_foundation.sql
-- ============================================================================