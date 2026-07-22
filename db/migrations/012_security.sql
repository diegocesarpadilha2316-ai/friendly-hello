-- Fase 1.17 — Segurança Avançada Enterprise
-- Sessões, dispositivos, tentativas de login, MFA, políticas, incidentes e auditoria.

create table if not exists public.security_policies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  csp text not null default $$default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https:; frame-ancestors 'none';$$,
  hsts_max_age int not null default 31536000,
  frame_options text not null default 'DENY' check (frame_options in ('DENY','SAMEORIGIN')),
  content_type_options text not null default 'nosniff',
  referrer_policy text not null default 'strict-origin-when-cross-origin',
  permissions_policy text not null default 'camera=(), microphone=(), geolocation=(self)',
  cors_allowed_origins text[] not null default '{}',
  csrf_enabled boolean not null default true,
  replay_window_seconds int not null default 300,
  brute_force_max_attempts int not null default 5,
  brute_force_lockout_minutes int not null default 15,
  session_ttl_minutes int not null default 43200,
  require_mfa boolean not null default false,
  allow_totp boolean not null default true,
  allow_passkey boolean not null default false,
  allow_backup_codes boolean not null default true,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id)
);

create table if not exists public.security_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null,
  device_id uuid,
  ip inet,
  user_agent text,
  location text,
  correlation_id text,
  active boolean not null default true,
  revoked_at timestamptz,
  revoked_reason text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  expires_at timestamptz
);
create index if not exists security_sessions_tenant_idx on public.security_sessions (company_id, active, last_seen_at desc);
create index if not exists security_sessions_user_idx on public.security_sessions (user_id, active);

create table if not exists public.security_devices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null,
  fingerprint text not null,
  name text,
  platform text,
  trusted boolean not null default false,
  last_ip inet,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (company_id, user_id, fingerprint)
);
create index if not exists security_devices_user_idx on public.security_devices (company_id, user_id);

create table if not exists public.security_login_attempts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  email text,
  user_id uuid,
  ip inet,
  user_agent text,
  outcome text not null check (outcome in ('success','invalid_credentials','locked','mfa_required','mfa_failed','suspicious')),
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists security_login_attempts_email_idx on public.security_login_attempts (email, created_at desc);
create index if not exists security_login_attempts_tenant_idx on public.security_login_attempts (company_id, created_at desc);

create table if not exists public.security_mfa_factors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null,
  method text not null check (method in ('totp','webauthn','passkey','backup_codes')),
  label text,
  enabled boolean not null default false,
  verified_at timestamptz,
  last_used_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists security_mfa_user_idx on public.security_mfa_factors (company_id, user_id);

create table if not exists public.security_incidents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  category text not null,
  title text not null,
  description text,
  user_id uuid,
  ip inet,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open','investigating','resolved','ignored')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists security_incidents_tenant_idx on public.security_incidents (company_id, status, created_at desc);

create table if not exists public.security_audit_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_id uuid,
  actor_email text,
  action text not null,
  target_type text,
  target_id text,
  ip inet,
  user_agent text,
  correlation_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists security_audit_tenant_idx on public.security_audit_log (company_id, created_at desc);
create index if not exists security_audit_action_idx on public.security_audit_log (company_id, action, created_at desc);

grant select, insert, update on public.security_policies to authenticated;
grant all on public.security_policies to service_role;
grant select, insert, update on public.security_sessions to authenticated;
grant all on public.security_sessions to service_role;
grant select, insert, update, delete on public.security_devices to authenticated;
grant all on public.security_devices to service_role;
grant select, insert on public.security_login_attempts to authenticated;
grant all on public.security_login_attempts to service_role;
grant select, insert, update, delete on public.security_mfa_factors to authenticated;
grant all on public.security_mfa_factors to service_role;
grant select, insert, update on public.security_incidents to authenticated;
grant all on public.security_incidents to service_role;
grant select, insert on public.security_audit_log to authenticated;
grant all on public.security_audit_log to service_role;

alter table public.security_policies enable row level security;
alter table public.security_sessions enable row level security;
alter table public.security_devices enable row level security;
alter table public.security_login_attempts enable row level security;
alter table public.security_mfa_factors enable row level security;
alter table public.security_incidents enable row level security;
alter table public.security_audit_log enable row level security;

create policy "sec_policies_tenant" on public.security_policies
  for all to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = security_policies.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m where m.company_id = security_policies.company_id and m.user_id = auth.uid() and m.active));

create policy "sec_sessions_tenant" on public.security_sessions
  for all to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = security_sessions.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m where m.company_id = security_sessions.company_id and m.user_id = auth.uid() and m.active));

create policy "sec_devices_tenant" on public.security_devices
  for all to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = security_devices.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m where m.company_id = security_devices.company_id and m.user_id = auth.uid() and m.active));

create policy "sec_login_tenant" on public.security_login_attempts
  for all to authenticated
  using (company_id is null or exists (select 1 from public.company_members m where m.company_id = security_login_attempts.company_id and m.user_id = auth.uid() and m.active))
  with check (company_id is null or exists (select 1 from public.company_members m where m.company_id = security_login_attempts.company_id and m.user_id = auth.uid() and m.active));

create policy "sec_mfa_tenant" on public.security_mfa_factors
  for all to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = security_mfa_factors.company_id and m.user_id = auth.uid() and m.active) and user_id = auth.uid())
  with check (exists (select 1 from public.company_members m where m.company_id = security_mfa_factors.company_id and m.user_id = auth.uid() and m.active) and user_id = auth.uid());

create policy "sec_incidents_tenant" on public.security_incidents
  for all to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = security_incidents.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m where m.company_id = security_incidents.company_id and m.user_id = auth.uid() and m.active));

create policy "sec_audit_tenant" on public.security_audit_log
  for all to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = security_audit_log.company_id and m.user_id = auth.uid() and m.active))
  with check (exists (select 1 from public.company_members m where m.company_id = security_audit_log.company_id and m.user_id = auth.uid() and m.active));