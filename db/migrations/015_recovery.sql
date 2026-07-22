-- Fase 1.20 — Backup, DR & Business Continuity Enterprise
-- Reutiliza tenant/RBAC via public.company_members.

create table if not exists public.recovery_targets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  slug text not null,
  name text not null,
  kind text not null check (kind in (
    'database','storage','assets','configuration','sdk','plugins',
    'cache','logs','events','notifications'
  )),
  destination text not null default 'internal' check (destination in (
    'internal','s3','r2','gcs','azure_blob','b2','supabase_pitr'
  )),
  retention_days int not null default 30,
  encryption text not null default 'aes256',
  enabled boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, slug)
);
create index if not exists recovery_targets_company_idx on public.recovery_targets(company_id);

create table if not exists public.recovery_schedules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  target_id uuid not null references public.recovery_targets(id) on delete cascade,
  cron text not null,
  strategy text not null default 'incremental' check (strategy in ('full','incremental','differential')),
  enabled boolean not null default true,
  next_run_at timestamptz,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists recovery_schedules_company_idx on public.recovery_schedules(company_id, next_run_at);

create table if not exists public.recovery_backups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  target_id uuid references public.recovery_targets(id) on delete set null,
  target_slug text not null,
  kind text not null,
  strategy text not null default 'full' check (strategy in ('full','incremental','differential')),
  trigger text not null default 'manual' check (trigger in ('manual','scheduled','event','disaster')),
  status text not null default 'queued' check (status in (
    'queued','running','completed','failed','verified','expired','cancelled'
  )),
  size_bytes bigint,
  checksum text,
  storage_uri text,
  parent_backup_id uuid references public.recovery_backups(id) on delete set null,
  correlation_id text,
  started_at timestamptz,
  finished_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists recovery_backups_company_idx on public.recovery_backups(company_id, created_at desc);

create table if not exists public.recovery_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  backup_id uuid references public.recovery_backups(id) on delete cascade,
  scope text not null default 'tenant' check (scope in ('tenant','module','table','file')),
  target text not null,
  version text,
  size_bytes bigint,
  checksum text,
  storage_uri text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists recovery_snapshots_company_idx on public.recovery_snapshots(company_id, created_at desc);

create table if not exists public.recovery_restores (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  backup_id uuid references public.recovery_backups(id) on delete set null,
  snapshot_id uuid references public.recovery_snapshots(id) on delete set null,
  mode text not null default 'full' check (mode in ('full','partial','tenant','pit','snapshot')),
  status text not null default 'queued' check (status in (
    'queued','running','completed','failed','cancelled'
  )),
  point_in_time timestamptz,
  target_scope text,
  requested_by uuid,
  correlation_id text,
  started_at timestamptz,
  finished_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists recovery_restores_company_idx on public.recovery_restores(company_id, created_at desc);

create table if not exists public.recovery_integrity (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  backup_id uuid references public.recovery_backups(id) on delete cascade,
  check_kind text not null default 'checksum' check (check_kind in ('checksum','restore_test','structural','deep')),
  status text not null check (status in ('pass','fail','warn','unknown')),
  detail text,
  duration_ms int,
  checked_at timestamptz not null default now()
);
create index if not exists recovery_integrity_company_idx on public.recovery_integrity(company_id, checked_at desc);

create table if not exists public.recovery_dr_plans (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  slug text not null,
  name text not null,
  rto_minutes int not null default 60,
  rpo_minutes int not null default 15,
  replication text not null default 'async' check (replication in ('none','async','sync','multi_region')),
  failover text not null default 'manual' check (failover in ('manual','automatic','warm_standby','pilot_light')),
  status text not null default 'draft' check (status in ('draft','active','testing','failing','archived')),
  last_drill_at timestamptz,
  last_drill_status text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, slug)
);

create table if not exists public.recovery_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  bucket_at timestamptz not null default date_trunc('hour', now()),
  backups int not null default 0,
  restores int not null default 0,
  failed int not null default 0,
  verified int not null default 0,
  bytes bigint not null default 0
);
create index if not exists recovery_history_company_idx on public.recovery_history(company_id, bucket_at desc);

grant select, insert, update, delete on public.recovery_targets to authenticated;
grant select, insert, update, delete on public.recovery_schedules to authenticated;
grant select, insert, update on public.recovery_backups to authenticated;
grant select, insert on public.recovery_snapshots to authenticated;
grant select, insert, update on public.recovery_restores to authenticated;
grant select, insert on public.recovery_integrity to authenticated;
grant select, insert, update, delete on public.recovery_dr_plans to authenticated;
grant select, insert on public.recovery_history to authenticated;
grant all on public.recovery_targets, public.recovery_schedules,
  public.recovery_backups, public.recovery_snapshots, public.recovery_restores,
  public.recovery_integrity, public.recovery_dr_plans, public.recovery_history to service_role;

alter table public.recovery_targets enable row level security;
alter table public.recovery_schedules enable row level security;
alter table public.recovery_backups enable row level security;
alter table public.recovery_snapshots enable row level security;
alter table public.recovery_restores enable row level security;
alter table public.recovery_integrity enable row level security;
alter table public.recovery_dr_plans enable row level security;
alter table public.recovery_history enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'recovery_targets','recovery_schedules','recovery_backups','recovery_snapshots',
    'recovery_restores','recovery_integrity','recovery_dr_plans','recovery_history'
  ] loop
    execute format($f$
      create policy "%1$s_tenant" on public.%1$s
        for all to authenticated
        using (exists (select 1 from public.company_members m
          where m.company_id = %1$s.company_id and m.user_id = auth.uid() and m.active))
        with check (exists (select 1 from public.company_members m
          where m.company_id = %1$s.company_id and m.user_id = auth.uid() and m.active));
    $f$, t);
  end loop;
end $$;
