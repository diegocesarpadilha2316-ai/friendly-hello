-- ============================================================
-- Dioris Hub — Fase 1.8: Storage, Uploads & Assets Enterprise
-- Requisitos:
--   * bucket privado `dioris-assets` no Supabase Storage
--   * tenant-scope por company_id
--   * RLS via has_role/company_members (fases 1.3/1.4)
-- ============================================================

-- Bucket privado (idempotente).
insert into storage.buckets (id, name, public)
values ('dioris-assets', 'dioris-assets', false)
on conflict (id) do nothing;

-- =================== TIPOS ===================
do $$ begin
  create type public.asset_kind as enum (
    'image','video','audio','document','pdf','cad','model3d','archive','other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.asset_visibility as enum ('private','tenant','public');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.upload_status as enum (
    'pending','uploading','processing','ready','failed','canceled'
  );
exception when duplicate_object then null; end $$;

-- =================== PASTAS ===================
create table if not exists public.asset_folders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  parent_id uuid references public.asset_folders(id) on delete cascade,
  name text not null,
  path text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, path)
);
create index if not exists idx_asset_folders_company on public.asset_folders(company_id);
create index if not exists idx_asset_folders_parent on public.asset_folders(parent_id);

-- =================== ASSETS ===================
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  folder_id uuid references public.asset_folders(id) on delete set null,
  provider text not null default 'supabase',
  bucket text not null default 'dioris-assets',
  object_key text not null,
  filename text not null,
  mime text not null,
  kind public.asset_kind not null default 'other',
  visibility public.asset_visibility not null default 'tenant',
  size_bytes bigint not null default 0,
  sha256 text,
  width int,
  height int,
  duration_ms int,
  metadata jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, object_key)
);
create index if not exists idx_assets_company on public.assets(company_id) where deleted_at is null;
create index if not exists idx_assets_folder on public.assets(folder_id);
create index if not exists idx_assets_sha on public.assets(company_id, sha256);
create index if not exists idx_assets_kind on public.assets(company_id, kind);

-- =================== VERSÕES ===================
create table if not exists public.asset_versions (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  version int not null,
  object_key text not null,
  size_bytes bigint not null default 0,
  sha256 text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (asset_id, version)
);

-- =================== MINIATURAS ===================
create table if not exists public.asset_thumbnails (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  variant text not null,
  object_key text not null,
  width int,
  height int,
  size_bytes bigint,
  created_at timestamptz not null default now(),
  unique (asset_id, variant)
);

-- =================== PERMISSÕES ===================
create table if not exists public.asset_permissions (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  subject_type text not null check (subject_type in ('user','role','company')),
  subject_id text not null,
  can_read boolean not null default true,
  can_write boolean not null default false,
  can_delete boolean not null default false,
  created_at timestamptz not null default now(),
  unique (asset_id, subject_type, subject_id)
);

-- =================== USO / REFERÊNCIAS ===================
create table if not exists public.asset_usage (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  module text not null,
  entity_type text not null,
  entity_id text not null,
  created_at timestamptz not null default now(),
  unique (asset_id, module, entity_type, entity_id)
);
create index if not exists idx_asset_usage_asset on public.asset_usage(asset_id);

-- =================== AUDITORIA ===================
create table if not exists public.asset_audit (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  asset_id uuid references public.assets(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_asset_audit_company on public.asset_audit(company_id, created_at desc);

-- =================== UPLOAD JOBS ===================
create table if not exists public.upload_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  asset_id uuid references public.assets(id) on delete set null,
  status public.upload_status not null default 'pending',
  provider text not null default 'supabase',
  bucket text not null default 'dioris-assets',
  object_key text not null,
  filename text not null,
  mime text not null,
  size_bytes bigint not null default 0,
  bytes_uploaded bigint not null default 0,
  parts_total int,
  parts_done int not null default 0,
  error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_upload_jobs_company on public.upload_jobs(company_id, status);

-- =================== GRANTS ===================
grant select, insert, update, delete on public.asset_folders    to authenticated;
grant select, insert, update, delete on public.assets           to authenticated;
grant select, insert                 on public.asset_versions   to authenticated;
grant select, insert                 on public.asset_thumbnails to authenticated;
grant select, insert, update, delete on public.asset_permissions to authenticated;
grant select, insert, delete         on public.asset_usage      to authenticated;
grant select, insert                 on public.asset_audit      to authenticated;
grant select, insert, update, delete on public.upload_jobs      to authenticated;
grant all on public.asset_folders, public.assets, public.asset_versions,
           public.asset_thumbnails, public.asset_permissions, public.asset_usage,
           public.asset_audit, public.upload_jobs
  to service_role;

-- =================== RLS ===================
alter table public.asset_folders    enable row level security;
alter table public.assets           enable row level security;
alter table public.asset_versions   enable row level security;
alter table public.asset_thumbnails enable row level security;
alter table public.asset_permissions enable row level security;
alter table public.asset_usage      enable row level security;
alter table public.asset_audit      enable row level security;
alter table public.upload_jobs      enable row level security;

-- helper: membro ativo do tenant?
create or replace function public.is_tenant_member(_company uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.company_members
    where company_id = _company and user_id = auth.uid() and active = true
  )
$$;

-- Políticas simétricas (SELECT/INSERT/UPDATE/DELETE) para membros do tenant.
do $$ begin
  create policy "tenant read folders"   on public.asset_folders    for select using (public.is_tenant_member(company_id));
  create policy "tenant write folders"  on public.asset_folders    for all    using (public.is_tenant_member(company_id)) with check (public.is_tenant_member(company_id));

  create policy "tenant read assets"    on public.assets           for select using (public.is_tenant_member(company_id));
  create policy "tenant write assets"   on public.assets           for all    using (public.is_tenant_member(company_id)) with check (public.is_tenant_member(company_id));

  create policy "tenant read versions"  on public.asset_versions   for select using (exists (select 1 from public.assets a where a.id = asset_id and public.is_tenant_member(a.company_id)));
  create policy "tenant write versions" on public.asset_versions   for insert with check (exists (select 1 from public.assets a where a.id = asset_id and public.is_tenant_member(a.company_id)));

  create policy "tenant read thumbs"    on public.asset_thumbnails for select using (exists (select 1 from public.assets a where a.id = asset_id and public.is_tenant_member(a.company_id)));
  create policy "tenant write thumbs"   on public.asset_thumbnails for insert with check (exists (select 1 from public.assets a where a.id = asset_id and public.is_tenant_member(a.company_id)));

  create policy "tenant asset perms rw" on public.asset_permissions for all using (exists (select 1 from public.assets a where a.id = asset_id and public.is_tenant_member(a.company_id))) with check (exists (select 1 from public.assets a where a.id = asset_id and public.is_tenant_member(a.company_id)));

  create policy "tenant asset usage rw" on public.asset_usage      for all using (exists (select 1 from public.assets a where a.id = asset_id and public.is_tenant_member(a.company_id))) with check (exists (select 1 from public.assets a where a.id = asset_id and public.is_tenant_member(a.company_id)));

  create policy "tenant read audit"     on public.asset_audit      for select using (public.is_tenant_member(company_id));
  create policy "tenant insert audit"   on public.asset_audit      for insert with check (public.is_tenant_member(company_id));

  create policy "tenant upload jobs rw" on public.upload_jobs      for all using (public.is_tenant_member(company_id)) with check (public.is_tenant_member(company_id));
exception when duplicate_object then null; end $$;

-- Políticas de storage.objects (bucket dioris-assets) — object_key: `<company_id>/...`
do $$ begin
  create policy "dioris-assets tenant read"
    on storage.objects for select
    using (
      bucket_id = 'dioris-assets'
      and public.is_tenant_member(((storage.foldername(name))[1])::uuid)
    );
  create policy "dioris-assets tenant write"
    on storage.objects for insert
    with check (
      bucket_id = 'dioris-assets'
      and public.is_tenant_member(((storage.foldername(name))[1])::uuid)
    );
  create policy "dioris-assets tenant delete"
    on storage.objects for delete
    using (
      bucket_id = 'dioris-assets'
      and public.is_tenant_member(((storage.foldername(name))[1])::uuid)
    );
exception when duplicate_object then null; end $$;

-- =================== QUOTAS ===================
create or replace function public.tenant_storage_bytes(_company uuid)
returns bigint language sql stable security definer set search_path = public as $$
  select coalesce(sum(size_bytes), 0)::bigint
  from public.assets
  where company_id = _company and deleted_at is null
$$;

grant execute on function public.is_tenant_member(uuid)      to authenticated;
grant execute on function public.tenant_storage_bytes(uuid)  to authenticated;
