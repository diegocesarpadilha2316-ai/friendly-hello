-- ============================================================
-- Dioris Hub — Fase 1.11: Centro Global de Configurações
-- Infraestrutura ÚNICA de configurações da plataforma.
-- Todos os módulos leem/gravam exclusivamente via core/configuration.
-- RLS por company_id em todas as tabelas (exceto platform_settings,
-- que é global e apenas leitura para authenticated).
-- ============================================================

-- ================= PLATFORM (global) =================
create table if not exists public.platform_settings (
  id boolean primary key default true check (id),  -- singleton
  name text not null default 'Dioris Hub',
  logo_url text,
  favicon_url text,
  theme text not null default 'system',
  primary_color text,
  default_locale text not null default 'pt-BR',
  default_timezone text not null default 'America/Sao_Paulo',
  default_currency text not null default 'BRL',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ================= COMPANY SETTINGS =================
create table if not exists public.company_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  display_name text,
  theme text default 'system',
  locale text not null default 'pt-BR',
  timezone text not null default 'America/Sao_Paulo',
  currency text not null default 'BRL',
  date_format text not null default 'dd/MM/yyyy',
  number_format text not null default 'pt-BR',
  units text not null default 'metric',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ================= FEATURE FLAGS =================
create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,  -- null = global
  key text not null,
  enabled boolean not null default false,
  scope text not null default 'company',  -- 'global' | 'company' | 'user'
  module text,
  description text,
  rules jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (company_id, key)
);
create index if not exists idx_flags_company on public.feature_flags(company_id);

-- ================= API KEYS =================
-- DEFINIÇÃO CANÔNICA ÚNICA de `api_keys` (confere com o banco de produção).
--
-- Compatibilidade histórica: a versão original desta migration criava as
-- colunas `hashed_key` e `revoked_at` e NÃO tinha `status`, `allowed_ips`,
-- `description`, `updated_at` nem `UNIQUE (prefix)`. A migration 010
-- (API Gateway) criava a MESMA tabela com o formato abaixo — como ambas usavam
-- `create table if not exists`, um banco novo ficava com o formato de 006 e o
-- banco de produção ficou com o formato de 010, gerando drift.
--
-- Resolução: 006 passa a ser a ÚNICA criação da tabela e adota o formato real
-- de produção (`key_hash` + `status`); a 010 virou apenas ALTER ... ADD COLUMN
-- IF NOT EXISTS, idempotente em banco novo e em banco já existente.
-- Coluna canônica do hash: `key_hash`. `hashed_key` não existe e não deve ser
-- reintroduzida. Nenhuma linha existente é alterada por esta migration.
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  prefix text not null,
  key_hash text not null,
  scopes text[] not null default '{}',
  allowed_ips text[] not null default '{}',
  status text not null default 'active',   -- 'active' | 'revoked' | 'expired'
  expires_at timestamptz,
  last_used_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (prefix)
);
create index if not exists idx_api_keys_company on public.api_keys(company_id, created_at desc);

-- ================= INTEGRATIONS =================
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider text not null,      -- 'openai','stripe','whatsapp',...
  category text not null default 'generic',
  enabled boolean not null default false,
  status text not null default 'unknown',  -- 'healthy'|'degraded'|'down'|'unknown'
  config jsonb not null default '{}'::jsonb,
  last_tested_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (company_id, provider)
);
create index if not exists idx_integrations_company on public.integrations(company_id);

-- ================= BRANDING =================
create table if not exists public.branding (
  company_id uuid primary key references public.companies(id) on delete cascade,
  logo_url text,
  icon_url text,
  palette jsonb not null default '{}'::jsonb,
  typography jsonb not null default '{}'::jsonb,
  css_variables jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ================= LOCALIZATION =================
create table if not exists public.localization (
  company_id uuid primary key references public.companies(id) on delete cascade,
  default_locale text not null default 'pt-BR',
  supported_locales text[] not null default '{pt-BR}',
  translations jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ================= SECURITY SETTINGS =================
create table if not exists public.security_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  require_2fa boolean not null default false,
  session_ttl_seconds integer not null default 604800,
  jwt_ttl_seconds integer not null default 3600,
  password_min_length integer not null default 8,
  password_require_symbol boolean not null default false,
  rate_limit_per_min integer not null default 120,
  allowed_origins text[] not null default '{}',
  ip_allowlist text[] not null default '{}',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ================= BACKUP SETTINGS =================
create table if not exists public.backup_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  enabled boolean not null default false,
  frequency text not null default 'daily',   -- hourly|daily|weekly|monthly
  retention_days integer not null default 30,
  storage_provider text not null default 'supabase',
  last_run_at timestamptz,
  last_status text,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ================= SYSTEM PREFERENCES (per user, per company) =================
create table if not exists public.system_preferences (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (company_id, user_id, key)
);
create index if not exists idx_sysprefs_lookup on public.system_preferences(company_id, user_id, key);

-- ================= GRANTS =================
grant select                       on public.platform_settings   to authenticated;
grant select, insert, update       on public.company_settings    to authenticated;
grant select, insert, update, delete on public.feature_flags     to authenticated;
grant select, insert, update, delete on public.api_keys          to authenticated;
grant select, insert, update, delete on public.integrations      to authenticated;
grant select, insert, update       on public.branding            to authenticated;
grant select, insert, update       on public.localization        to authenticated;
grant select, insert, update       on public.security_settings   to authenticated;
grant select, insert, update       on public.backup_settings     to authenticated;
grant select, insert, update, delete on public.system_preferences to authenticated;
grant all on public.platform_settings, public.company_settings, public.feature_flags,
          public.api_keys, public.integrations, public.branding, public.localization,
          public.security_settings, public.backup_settings, public.system_preferences
          to service_role;

-- ================= RLS =================
alter table public.platform_settings   enable row level security;
alter table public.company_settings    enable row level security;
alter table public.feature_flags       enable row level security;
alter table public.api_keys            enable row level security;
alter table public.integrations        enable row level security;
alter table public.branding            enable row level security;
alter table public.localization        enable row level security;
alter table public.security_settings   enable row level security;
alter table public.backup_settings     enable row level security;
alter table public.system_preferences  enable row level security;

do $$ begin
  create policy "platform read" on public.platform_settings for select to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "company settings rw" on public.company_settings for all to authenticated
    using (public.is_company_member(company_id, auth.uid()))
    with check (public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "flags: tenant or global read" on public.feature_flags for select to authenticated
    using (company_id is null or public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "flags: admin write" on public.feature_flags for all to authenticated
    using (
      company_id is not null
      and public.is_company_member(company_id, auth.uid())
      and public.has_min_role(company_id, auth.uid(), 'admin'::public.tenant_role)
    )
    with check (
      company_id is not null
      and public.is_company_member(company_id, auth.uid())
      and public.has_min_role(company_id, auth.uid(), 'admin'::public.tenant_role)
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "api_keys admin" on public.api_keys for all to authenticated
    using (
      public.is_company_member(company_id, auth.uid())
      and public.has_min_role(company_id, auth.uid(), 'admin'::public.tenant_role)
    )
    with check (
      public.is_company_member(company_id, auth.uid())
      and public.has_min_role(company_id, auth.uid(), 'admin'::public.tenant_role)
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "integrations rw" on public.integrations for all to authenticated
    using (public.is_company_member(company_id, auth.uid()))
    with check (public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "branding rw" on public.branding for all to authenticated
    using (public.is_company_member(company_id, auth.uid()))
    with check (public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "localization rw" on public.localization for all to authenticated
    using (public.is_company_member(company_id, auth.uid()))
    with check (public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "security rw admin" on public.security_settings for all to authenticated
    using (
      public.is_company_member(company_id, auth.uid())
      and public.has_min_role(company_id, auth.uid(), 'admin'::public.tenant_role)
    )
    with check (
      public.is_company_member(company_id, auth.uid())
      and public.has_min_role(company_id, auth.uid(), 'admin'::public.tenant_role)
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "backup rw admin" on public.backup_settings for all to authenticated
    using (
      public.is_company_member(company_id, auth.uid())
      and public.has_min_role(company_id, auth.uid(), 'admin'::public.tenant_role)
    )
    with check (
      public.is_company_member(company_id, auth.uid())
      and public.has_min_role(company_id, auth.uid(), 'admin'::public.tenant_role)
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "sysprefs owner or admin" on public.system_preferences for all to authenticated
    using (
      public.is_company_member(company_id, auth.uid())
      and (user_id is null or user_id = auth.uid() or public.has_min_role(company_id, auth.uid(), 'admin'::public.tenant_role))
    )
    with check (
      public.is_company_member(company_id, auth.uid())
      and (user_id is null or user_id = auth.uid() or public.has_min_role(company_id, auth.uid(), 'admin'::public.tenant_role))
    );
exception when duplicate_object then null; end $$;

-- ================= TRIGGERS =================
create or replace function public.tg_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

do $$ begin
  create trigger trg_company_settings_touch before update on public.company_settings for each row execute function public.tg_touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger trg_flags_touch before update on public.feature_flags for each row execute function public.tg_touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger trg_integrations_touch before update on public.integrations for each row execute function public.tg_touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger trg_branding_touch before update on public.branding for each row execute function public.tg_touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger trg_localization_touch before update on public.localization for each row execute function public.tg_touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger trg_security_touch before update on public.security_settings for each row execute function public.tg_touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger trg_backup_touch before update on public.backup_settings for each row execute function public.tg_touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger trg_sysprefs_touch before update on public.system_preferences for each row execute function public.tg_touch_updated_at();
exception when duplicate_object then null; end $$;