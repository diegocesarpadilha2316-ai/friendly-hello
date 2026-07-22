-- Fase 1.18 — Testes Automatizados & Qualidade Enterprise
-- Suites, execuções, casos, cobertura, quality gates e histórico agregado.

create table if not exists public.quality_suites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  slug text not null,
  name text not null,
  kind text not null check (kind in (
    'unit','integration','e2e','component','server_fn','api',
    'performance','load','security','regression','smoke'
  )),
  runner text not null default 'vitest' check (runner in (
    'vitest','playwright','cypress','lighthouse','k6','zap','custom'
  )),
  target_module text,
  enabled boolean not null default true,
  tags text[] not null default '{}',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, slug)
);
create index if not exists quality_suites_company_idx on public.quality_suites(company_id);

create table if not exists public.quality_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  suite_id uuid references public.quality_suites(id) on delete set null,
  suite_slug text not null,
  trigger text not null default 'manual' check (trigger in (
    'manual','ci','cron','event','webhook','regression'
  )),
  status text not null default 'queued' check (status in (
    'queued','running','passed','failed','skipped','error','cancelled'
  )),
  total int not null default 0,
  passed int not null default 0,
  failed int not null default 0,
  skipped int not null default 0,
  duration_ms int,
  coverage_pct numeric(5,2),
  correlation_id text,
  started_by uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists quality_runs_company_idx on public.quality_runs(company_id, created_at desc);

create table if not exists public.quality_cases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  run_id uuid not null references public.quality_runs(id) on delete cascade,
  name text not null,
  file text,
  status text not null check (status in ('passed','failed','skipped','todo')),
  duration_ms int,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists quality_cases_run_idx on public.quality_cases(run_id);

create table if not exists public.quality_coverage (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  run_id uuid references public.quality_runs(id) on delete cascade,
  scope text not null check (scope in ('file','module','feature','tenant','total')),
  target text not null,
  lines_pct numeric(5,2) not null default 0,
  branches_pct numeric(5,2) not null default 0,
  functions_pct numeric(5,2) not null default 0,
  statements_pct numeric(5,2) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists quality_coverage_company_idx on public.quality_coverage(company_id, scope, target);

create table if not exists public.quality_gates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  slug text not null,
  name text not null,
  category text not null check (category in (
    'typescript','eslint','build','imports','circular','duplication',
    'dead_code','complexity','performance','security','coverage'
  )),
  threshold numeric,
  status text not null default 'unknown' check (status in ('pass','warn','fail','unknown')),
  value numeric,
  message text,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, slug)
);

create table if not exists public.quality_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  bucket_at timestamptz not null default date_trunc('hour', now()),
  runs int not null default 0,
  passed int not null default 0,
  failed int not null default 0,
  coverage_pct numeric(5,2),
  gates_pass int not null default 0,
  gates_fail int not null default 0
);
create index if not exists quality_history_company_idx on public.quality_history(company_id, bucket_at desc);

grant select, insert, update, delete on public.quality_suites to authenticated;
grant all on public.quality_suites to service_role;
grant select, insert, update on public.quality_runs to authenticated;
grant all on public.quality_runs to service_role;
grant select, insert on public.quality_cases to authenticated;
grant all on public.quality_cases to service_role;
grant select, insert on public.quality_coverage to authenticated;
grant all on public.quality_coverage to service_role;
grant select, insert, update, delete on public.quality_gates to authenticated;
grant all on public.quality_gates to service_role;
grant select, insert on public.quality_history to authenticated;
grant all on public.quality_history to service_role;

alter table public.quality_suites enable row level security;
alter table public.quality_runs enable row level security;
alter table public.quality_cases enable row level security;
alter table public.quality_coverage enable row level security;
alter table public.quality_gates enable row level security;
alter table public.quality_history enable row level security;

create policy "quality_suites_tenant" on public.quality_suites
  for all to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = quality_suites.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m where m.company_id = quality_suites.company_id and m.user_id = auth.uid() and m.active));

create policy "quality_runs_tenant" on public.quality_runs
  for all to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = quality_runs.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m where m.company_id = quality_runs.company_id and m.user_id = auth.uid() and m.active));

create policy "quality_cases_tenant" on public.quality_cases
  for all to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = quality_cases.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m where m.company_id = quality_cases.company_id and m.user_id = auth.uid() and m.active));

create policy "quality_coverage_tenant" on public.quality_coverage
  for all to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = quality_coverage.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m where m.company_id = quality_coverage.company_id and m.user_id = auth.uid() and m.active));

create policy "quality_gates_tenant" on public.quality_gates
  for all to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = quality_gates.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m where m.company_id = quality_gates.company_id and m.user_id = auth.uid() and m.active));

create policy "quality_history_tenant" on public.quality_history
  for all to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = quality_history.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m where m.company_id = quality_history.company_id and m.user_id = auth.uid() and m.active));