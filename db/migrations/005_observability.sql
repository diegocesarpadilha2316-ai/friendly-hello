-- ============================================================
-- Dioris Hub — Fase 1.10: Logs, Auditoria & Observabilidade
-- Infraestrutura ÚNICA de observabilidade. Todos os módulos
-- escrevem via core/observability (Logger, Audit, Metrics).
-- RLS por company_id em todas as tabelas.
-- ============================================================

do $$ begin
  create type public.log_level as enum ('trace','debug','info','warn','error','fatal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.audit_action as enum (
    'CREATE','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT','IMPORT',
    'PAYMENT','AI_USAGE','CREDIT_USAGE','PERMISSION_CHANGE','CONFIG_CHANGE'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.health_status as enum ('healthy','degraded','down','unknown');
exception when duplicate_object then null; end $$;

-- ================= LOGS =================
create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  level public.log_level not null default 'info',
  module text not null,
  action text not null,
  message text,
  context jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  ip text,
  user_agent text,
  trace_id text,
  correlation_id text,
  duration_ms integer,
  status text,
  created_at timestamptz not null default now()
);
create index if not exists idx_logs_company_created on public.logs(company_id, created_at desc);
create index if not exists idx_logs_level on public.logs(company_id, level, created_at desc);
create index if not exists idx_logs_module on public.logs(company_id, module, created_at desc);
create index if not exists idx_logs_trace on public.logs(trace_id);
create index if not exists idx_logs_correlation on public.logs(correlation_id);

-- ================= AUDIT =================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action public.audit_action not null,
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  diff jsonb,
  metadata jsonb not null default '{}'::jsonb,
  ip text,
  user_agent text,
  trace_id text,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_company_created on public.audit_logs(company_id, created_at desc);
create index if not exists idx_audit_entity on public.audit_logs(company_id, entity, entity_id);
create index if not exists idx_audit_action on public.audit_logs(company_id, action, created_at desc);

-- ================= METRICS =================
create table if not exists public.metrics (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  value double precision not null,
  unit text,
  tags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_metrics_company_name on public.metrics(company_id, name, created_at desc);

-- ================= HEALTH CHECKS =================
create table if not exists public.health_checks (
  id uuid primary key default gen_random_uuid(),
  component text not null,
  status public.health_status not null default 'unknown',
  latency_ms integer,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_health_component on public.health_checks(component, created_at desc);

-- ================= PERFORMANCE SNAPSHOTS =================
create table if not exists public.performance_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  scope text not null,
  p50_ms integer,
  p95_ms integer,
  p99_ms integer,
  avg_ms integer,
  requests bigint not null default 0,
  errors bigint not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_perf_company_scope on public.performance_snapshots(company_id, scope, created_at desc);

-- ================= ERROR REPORTS =================
create table if not exists public.error_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  module text not null,
  message text not null,
  stack text,
  fingerprint text,
  occurrences integer not null default 1,
  context jsonb not null default '{}'::jsonb,
  trace_id text,
  resolved boolean not null default false,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_errors_company_created on public.error_reports(company_id, created_at desc);
create index if not exists idx_errors_fingerprint on public.error_reports(company_id, fingerprint);

-- ================= TRACE SESSIONS / EVENTS =================
create table if not exists public.trace_sessions (
  id uuid primary key default gen_random_uuid(),
  trace_id text not null unique,
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  root_module text,
  root_action text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_ms integer,
  status text,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists idx_trace_company on public.trace_sessions(company_id, started_at desc);

create table if not exists public.trace_events (
  id uuid primary key default gen_random_uuid(),
  trace_id text not null,
  span_id text not null,
  parent_span_id text,
  company_id uuid references public.companies(id) on delete cascade,
  module text not null,
  action text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_ms integer,
  status text,
  attributes jsonb not null default '{}'::jsonb
);
create index if not exists idx_trace_events_trace on public.trace_events(trace_id, started_at);
create index if not exists idx_trace_events_company on public.trace_events(company_id, started_at desc);

-- ================= GRANTS =================
grant select, insert on public.logs                    to authenticated;
grant select, insert on public.audit_logs              to authenticated;
grant select, insert on public.metrics                 to authenticated;
grant select        on public.health_checks            to authenticated;
grant select, insert on public.performance_snapshots   to authenticated;
grant select, insert, update on public.error_reports   to authenticated;
grant select, insert, update on public.trace_sessions  to authenticated;
grant select, insert on public.trace_events            to authenticated;
grant all on public.logs, public.audit_logs, public.metrics,
          public.health_checks, public.performance_snapshots,
          public.error_reports, public.trace_sessions, public.trace_events
          to service_role;

-- ================= RLS =================
alter table public.logs                   enable row level security;
alter table public.audit_logs             enable row level security;
alter table public.metrics                enable row level security;
alter table public.health_checks          enable row level security;
alter table public.performance_snapshots  enable row level security;
alter table public.error_reports          enable row level security;
alter table public.trace_sessions         enable row level security;
alter table public.trace_events           enable row level security;

do $$ begin
  create policy "tenant logs rw" on public.logs for all to authenticated
    using (company_id is null or public.is_company_member(company_id, auth.uid()))
    with check (company_id is null or public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "tenant audit rw" on public.audit_logs for all to authenticated
    using (public.is_company_member(company_id, auth.uid()))
    with check (public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "tenant metrics rw" on public.metrics for all to authenticated
    using (company_id is null or public.is_company_member(company_id, auth.uid()))
    with check (company_id is null or public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "health read all" on public.health_checks for select to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "tenant perf rw" on public.performance_snapshots for all to authenticated
    using (company_id is null or public.is_company_member(company_id, auth.uid()))
    with check (company_id is null or public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "tenant errors rw" on public.error_reports for all to authenticated
    using (company_id is null or public.is_company_member(company_id, auth.uid()))
    with check (company_id is null or public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "tenant trace sessions rw" on public.trace_sessions for all to authenticated
    using (company_id is null or public.is_company_member(company_id, auth.uid()))
    with check (company_id is null or public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "tenant trace events rw" on public.trace_events for all to authenticated
    using (company_id is null or public.is_company_member(company_id, auth.uid()))
    with check (company_id is null or public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;

-- ================= FUNCTIONS =================
-- Contadores rápidos por nível para dashboards.
create or replace function public.observability_summary(_company uuid)
returns table (
  logs_total bigint,
  logs_errors bigint,
  audit_total bigint,
  errors_open bigint,
  traces_total bigint
) language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.logs where company_id = _company),
    (select count(*) from public.logs where company_id = _company and level in ('error','fatal')),
    (select count(*) from public.audit_logs where company_id = _company),
    (select count(*) from public.error_reports where company_id = _company and resolved = false),
    (select count(*) from public.trace_sessions where company_id = _company);
$$;

grant execute on function public.observability_summary(uuid) to authenticated;

-- Trigger: last_seen automático em error_reports.
create or replace function public.tg_error_reports_touch()
returns trigger language plpgsql as $$
begin
  new.last_seen_at := now();
  return new;
end$$;

do $$ begin
  create trigger trg_error_reports_touch
    before update on public.error_reports
    for each row execute function public.tg_error_reports_touch();
exception when duplicate_object then null; end $$;