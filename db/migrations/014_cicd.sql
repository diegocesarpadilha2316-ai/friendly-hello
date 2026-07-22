-- Fase 1.19 — CI/CD Enterprise
-- Ambientes, pipelines, builds, deploys, releases, artefatos, aprovações e histórico.

create table if not exists public.cicd_environments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  slug text not null,
  name text not null,
  kind text not null check (kind in ('local','development','staging','production','preview')),
  url text,
  protected boolean not null default false,
  requires_approval boolean not null default false,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, slug)
);
create index if not exists cicd_environments_company_idx on public.cicd_environments(company_id);

create table if not exists public.cicd_pipelines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  slug text not null,
  name text not null,
  module text,
  provider text not null default 'internal' check (provider in (
    'internal','github_actions','gitlab_ci','azure_devops','jenkins',
    'vercel','cloudflare','supabase','docker','kubernetes','custom'
  )),
  stages jsonb not null default '[]',
  enabled boolean not null default true,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, slug)
);
create index if not exists cicd_pipelines_company_idx on public.cicd_pipelines(company_id);

create table if not exists public.cicd_builds (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  pipeline_id uuid references public.cicd_pipelines(id) on delete set null,
  pipeline_slug text not null,
  version text,
  commit_sha text,
  branch text,
  trigger text not null default 'manual' check (trigger in (
    'manual','push','pr','tag','cron','event','webhook','rollback'
  )),
  status text not null default 'queued' check (status in (
    'queued','running','passed','failed','cancelled','skipped'
  )),
  duration_ms int,
  logs_url text,
  correlation_id text,
  metadata jsonb not null default '{}',
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists cicd_builds_company_idx on public.cicd_builds(company_id, created_at desc);

create table if not exists public.cicd_deploys (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  build_id uuid references public.cicd_builds(id) on delete set null,
  environment_id uuid references public.cicd_environments(id) on delete set null,
  environment_slug text not null,
  version text,
  status text not null default 'queued' check (status in (
    'queued','running','succeeded','failed','cancelled','rolled_back'
  )),
  strategy text not null default 'rolling' check (strategy in (
    'rolling','blue_green','canary','recreate','preview'
  )),
  approved_by uuid,
  approved_at timestamptz,
  rollback_of uuid references public.cicd_deploys(id) on delete set null,
  duration_ms int,
  correlation_id text,
  metadata jsonb not null default '{}',
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists cicd_deploys_company_idx on public.cicd_deploys(company_id, created_at desc);

create table if not exists public.cicd_releases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  version text not null,
  channel text not null default 'stable' check (channel in ('stable','beta','alpha','preview','hotfix')),
  tag text,
  changelog text,
  notes text,
  build_id uuid references public.cicd_builds(id) on delete set null,
  published_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (company_id, version)
);
create index if not exists cicd_releases_company_idx on public.cicd_releases(company_id, created_at desc);

create table if not exists public.cicd_artifacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  build_id uuid references public.cicd_builds(id) on delete cascade,
  release_id uuid references public.cicd_releases(id) on delete set null,
  kind text not null check (kind in ('asset','log','package','container','export','snapshot','other')),
  name text not null,
  uri text,
  size_bytes bigint,
  checksum text,
  content_type text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists cicd_artifacts_company_idx on public.cicd_artifacts(company_id, created_at desc);

create table if not exists public.cicd_approvals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  deploy_id uuid not null references public.cicd_deploys(id) on delete cascade,
  requested_by uuid,
  approver uuid,
  status text not null default 'pending' check (status in ('pending','approved','rejected','expired')),
  reason text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists cicd_approvals_company_idx on public.cicd_approvals(company_id, created_at desc);

create table if not exists public.cicd_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  bucket_at timestamptz not null default date_trunc('hour', now()),
  builds int not null default 0,
  deploys int not null default 0,
  rollbacks int not null default 0,
  failed int not null default 0,
  avg_duration_ms int
);
create index if not exists cicd_history_company_idx on public.cicd_history(company_id, bucket_at desc);

grant select, insert, update, delete on public.cicd_environments to authenticated;
grant all on public.cicd_environments to service_role;
grant select, insert, update, delete on public.cicd_pipelines to authenticated;
grant all on public.cicd_pipelines to service_role;
grant select, insert, update on public.cicd_builds to authenticated;
grant all on public.cicd_builds to service_role;
grant select, insert, update on public.cicd_deploys to authenticated;
grant all on public.cicd_deploys to service_role;
grant select, insert, update, delete on public.cicd_releases to authenticated;
grant all on public.cicd_releases to service_role;
grant select, insert, delete on public.cicd_artifacts to authenticated;
grant all on public.cicd_artifacts to service_role;
grant select, insert, update on public.cicd_approvals to authenticated;
grant all on public.cicd_approvals to service_role;
grant select, insert on public.cicd_history to authenticated;
grant all on public.cicd_history to service_role;

alter table public.cicd_environments enable row level security;
alter table public.cicd_pipelines enable row level security;
alter table public.cicd_builds enable row level security;
alter table public.cicd_deploys enable row level security;
alter table public.cicd_releases enable row level security;
alter table public.cicd_artifacts enable row level security;
alter table public.cicd_approvals enable row level security;
alter table public.cicd_history enable row level security;

create policy "cicd_environments_tenant" on public.cicd_environments
  for all to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = cicd_environments.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m where m.company_id = cicd_environments.company_id and m.user_id = auth.uid() and m.active));

create policy "cicd_pipelines_tenant" on public.cicd_pipelines
  for all to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = cicd_pipelines.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m where m.company_id = cicd_pipelines.company_id and m.user_id = auth.uid() and m.active));

create policy "cicd_builds_tenant" on public.cicd_builds
  for all to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = cicd_builds.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m where m.company_id = cicd_builds.company_id and m.user_id = auth.uid() and m.active));

create policy "cicd_deploys_tenant" on public.cicd_deploys
  for all to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = cicd_deploys.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m where m.company_id = cicd_deploys.company_id and m.user_id = auth.uid() and m.active));

create policy "cicd_releases_tenant" on public.cicd_releases
  for all to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = cicd_releases.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m where m.company_id = cicd_releases.company_id and m.user_id = auth.uid() and m.active));

create policy "cicd_artifacts_tenant" on public.cicd_artifacts
  for all to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = cicd_artifacts.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m where m.company_id = cicd_artifacts.company_id and m.user_id = auth.uid() and m.active));

create policy "cicd_approvals_tenant" on public.cicd_approvals
  for all to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = cicd_approvals.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m where m.company_id = cicd_approvals.company_id and m.user_id = auth.uid() and m.active));

create policy "cicd_history_tenant" on public.cicd_history
  for all to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = cicd_history.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m where m.company_id = cicd_history.company_id and m.user_id = auth.uid() and m.active));
