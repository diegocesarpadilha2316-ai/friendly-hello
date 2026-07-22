-- Fase 1.16 — Cache Distribuído Enterprise
create table if not exists public.cache_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  namespace text not null,
  key text not null,
  value jsonb not null,
  tags text[] not null default '{}',
  version int not null default 1,
  ttl_seconds int,
  expires_at timestamptz,
  size_bytes int not null default 0,
  hit_count int not null default 0,
  last_hit_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists cache_entries_key_uq
  on public.cache_entries (company_id, namespace, key);
create index if not exists cache_entries_tags_gin on public.cache_entries using gin (tags);
create index if not exists cache_entries_expires_idx
  on public.cache_entries (expires_at) where expires_at is not null;
create index if not exists cache_entries_namespace_idx
  on public.cache_entries (company_id, namespace);

create table if not exists public.cache_namespaces (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  strategy text not null default 'cache_aside'
    check (strategy in ('cache_aside','read_through','write_through','write_behind','swr')),
  default_ttl_seconds int not null default 300,
  max_entries int not null default 10000,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

create table if not exists public.cache_metrics (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  namespace text not null,
  bucket_at timestamptz not null default date_trunc('minute', now()),
  hits int not null default 0,
  misses int not null default 0,
  writes int not null default 0,
  invalidations int not null default 0,
  bytes_written bigint not null default 0,
  unique (company_id, namespace, bucket_at)
);
create index if not exists cache_metrics_bucket_idx on public.cache_metrics (bucket_at desc);

create table if not exists public.cache_invalidations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  scope text not null check (scope in ('key','namespace','tag','tenant','all')),
  target text not null,
  reason text,
  affected int not null default 0,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists cache_invalidations_created_idx
  on public.cache_invalidations (company_id, created_at desc);

create table if not exists public.cache_warmup_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  namespace text not null,
  status text not null default 'pending'
    check (status in ('pending','running','completed','failed')),
  entries int not null default 0,
  duration_ms int,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists cache_warmup_created_idx
  on public.cache_warmup_jobs (company_id, created_at desc);

grant select, insert, update, delete on public.cache_entries to authenticated;
grant all on public.cache_entries to service_role;
grant select, insert, update, delete on public.cache_namespaces to authenticated;
grant all on public.cache_namespaces to service_role;
grant select, insert, update on public.cache_metrics to authenticated;
grant all on public.cache_metrics to service_role;
grant select, insert on public.cache_invalidations to authenticated;
grant all on public.cache_invalidations to service_role;
grant select, insert, update on public.cache_warmup_jobs to authenticated;
grant all on public.cache_warmup_jobs to service_role;

alter table public.cache_entries enable row level security;
alter table public.cache_namespaces enable row level security;
alter table public.cache_metrics enable row level security;
alter table public.cache_invalidations enable row level security;
alter table public.cache_warmup_jobs enable row level security;

create policy "cache_entries_tenant" on public.cache_entries
  for all to authenticated
  using (exists (select 1 from public.company_members m
    where m.company_id = cache_entries.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m
    where m.company_id = cache_entries.company_id and m.user_id = auth.uid() and m.active));

create policy "cache_ns_tenant" on public.cache_namespaces
  for all to authenticated
  using (exists (select 1 from public.company_members m
    where m.company_id = cache_namespaces.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m
    where m.company_id = cache_namespaces.company_id and m.user_id = auth.uid() and m.active));

create policy "cache_metrics_tenant" on public.cache_metrics
  for all to authenticated
  using (exists (select 1 from public.company_members m
    where m.company_id = cache_metrics.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m
    where m.company_id = cache_metrics.company_id and m.user_id = auth.uid() and m.active));

create policy "cache_invalidations_tenant" on public.cache_invalidations
  for all to authenticated
  using (exists (select 1 from public.company_members m
    where m.company_id = cache_invalidations.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m
    where m.company_id = cache_invalidations.company_id and m.user_id = auth.uid() and m.active));

create policy "cache_warmup_tenant" on public.cache_warmup_jobs
  for all to authenticated
  using (exists (select 1 from public.company_members m
    where m.company_id = cache_warmup_jobs.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m
    where m.company_id = cache_warmup_jobs.company_id and m.user_id = auth.uid() and m.active));