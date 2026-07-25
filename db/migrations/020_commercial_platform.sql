-- ============================================================================
-- Dioris Hub — Fase 3.33 (Plataforma Comercial Enterprise)
-- Aplicar UMA vez no Supabase externo via SQL Editor.
-- Idempotente (safe re-run). Reutiliza helpers is_company_member / has_company_role.
-- ============================================================================

-- ENUMs -----------------------------------------------------------------------
do $$ begin
  create type public.job_status as enum ('queued','running','succeeded','failed','canceled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('pending','processing','paid','failed','refunded','canceled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_provider as enum ('stripe','mercadopago','asaas','pagseguro','manual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ticket_status as enum ('open','pending','resolved','closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ticket_priority as enum ('low','normal','high','urgent');
exception when duplicate_object then null; end $$;

-- Profiles (1:1 auth.users) ---------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  phone text,
  locale text not null default 'pt-BR',
  timezone text not null default 'America/Sao_Paulo',
  preferences jsonb not null default '{}'::jsonb,
  onboarding_complete boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

drop policy if exists "profile self read" on public.profiles;
create policy "profile self read" on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profile self update" on public.profiles;
create policy "profile self update" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profile self insert" on public.profiles;
create policy "profile self insert" on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup ------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Usage logs (medidor genérico) -----------------------------------------------
create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  feature text not null,
  action text not null,
  units numeric not null default 1,
  credits_consumed integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists usage_logs_company_idx on public.usage_logs(company_id, created_at desc);
create index if not exists usage_logs_feature_idx on public.usage_logs(company_id, feature, created_at desc);
grant select on public.usage_logs to authenticated;
grant all on public.usage_logs to service_role;
alter table public.usage_logs enable row level security;

drop policy if exists "member reads usage" on public.usage_logs;
create policy "member reads usage" on public.usage_logs for select
  using (public.is_company_member(company_id, auth.uid()));

-- Render Jobs -----------------------------------------------------------------
create table if not exists public.render_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.planner_projects(id) on delete set null,
  requested_by uuid references auth.users(id) on delete set null,
  status public.job_status not null default 'queued',
  preset text,
  resolution text,
  scene jsonb not null default '{}'::jsonb,
  output_url text,
  thumbnail_url text,
  progress integer not null default 0,
  credits_cost integer not null default 0,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists render_jobs_company_idx on public.render_jobs(company_id, created_at desc);
grant select, insert, update, delete on public.render_jobs to authenticated;
grant all on public.render_jobs to service_role;
alter table public.render_jobs enable row level security;

drop policy if exists "member manages render jobs" on public.render_jobs;
create policy "member manages render jobs" on public.render_jobs for all
  using (public.is_company_member(company_id, auth.uid()))
  with check (public.is_company_member(company_id, auth.uid()));

-- Video Jobs ------------------------------------------------------------------
create table if not exists public.video_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.planner_projects(id) on delete set null,
  requested_by uuid references auth.users(id) on delete set null,
  status public.job_status not null default 'queued',
  duration_seconds integer not null default 0,
  resolution text,
  format text,
  timeline jsonb not null default '{}'::jsonb,
  output_url text,
  thumbnail_url text,
  progress integer not null default 0,
  credits_cost integer not null default 0,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists video_jobs_company_idx on public.video_jobs(company_id, created_at desc);
grant select, insert, update, delete on public.video_jobs to authenticated;
grant all on public.video_jobs to service_role;
alter table public.video_jobs enable row level security;

drop policy if exists "member manages video jobs" on public.video_jobs;
create policy "member manages video jobs" on public.video_jobs for all
  using (public.is_company_member(company_id, auth.uid()))
  with check (public.is_company_member(company_id, auth.uid()));

-- AI Requests -----------------------------------------------------------------
create table if not exists public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  provider text not null,
  model text not null,
  feature text,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  credits_cost integer not null default 0,
  latency_ms integer,
  status public.job_status not null default 'succeeded',
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ai_requests_company_idx on public.ai_requests(company_id, created_at desc);
create index if not exists ai_requests_provider_idx on public.ai_requests(company_id, provider, created_at desc);
grant select, insert on public.ai_requests to authenticated;
grant all on public.ai_requests to service_role;
alter table public.ai_requests enable row level security;

drop policy if exists "member reads ai requests" on public.ai_requests;
create policy "member reads ai requests" on public.ai_requests for select
  using (public.is_company_member(company_id, auth.uid()));

drop policy if exists "member inserts ai requests" on public.ai_requests;
create policy "member inserts ai requests" on public.ai_requests for insert
  with check (public.is_company_member(company_id, auth.uid()));

-- Library Downloads (rastreio por tenant) -------------------------------------
create table if not exists public.library_downloads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  asset_type text not null,
  asset_ref text not null,
  bytes bigint not null default 0,
  credits_cost integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists library_downloads_company_idx on public.library_downloads(company_id, created_at desc);
grant select, insert on public.library_downloads to authenticated;
grant all on public.library_downloads to service_role;
alter table public.library_downloads enable row level security;

drop policy if exists "member reads library downloads" on public.library_downloads;
create policy "member reads library downloads" on public.library_downloads for select
  using (public.is_company_member(company_id, auth.uid()));

drop policy if exists "member inserts library downloads" on public.library_downloads;
create policy "member inserts library downloads" on public.library_downloads for insert
  with check (public.is_company_member(company_id, auth.uid()));

-- Payments --------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  provider public.payment_provider not null default 'manual',
  external_id text,
  amount_cents integer not null,
  currency text not null default 'BRL',
  status public.payment_status not null default 'pending',
  description text,
  invoice_url text,
  receipt_url text,
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_company_idx on public.payments(company_id, created_at desc);
create unique index if not exists payments_provider_ext_idx
  on public.payments(provider, external_id) where external_id is not null;
grant select on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;

drop policy if exists "admin reads payments" on public.payments;
create policy "admin reads payments" on public.payments for select
  using (public.has_company_role(company_id, auth.uid(), array['owner','admin']::public.tenant_role[]));

-- Payment history (append-only ledger de eventos de cobrança) ------------------
create table if not exists public.payment_history (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  event text not null,
  status public.payment_status not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists payment_history_payment_idx on public.payment_history(payment_id, created_at desc);
create index if not exists payment_history_company_idx on public.payment_history(company_id, created_at desc);
grant select on public.payment_history to authenticated;
grant all on public.payment_history to service_role;
alter table public.payment_history enable row level security;

drop policy if exists "admin reads payment history" on public.payment_history;
create policy "admin reads payment history" on public.payment_history for select
  using (public.has_company_role(company_id, auth.uid(), array['owner','admin']::public.tenant_role[]));

-- Support Tickets -------------------------------------------------------------
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  opened_by uuid references auth.users(id) on delete set null,
  subject text not null,
  body text not null,
  status public.ticket_status not null default 'open',
  priority public.ticket_priority not null default 'normal',
  assignee uuid references auth.users(id) on delete set null,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists support_tickets_company_idx on public.support_tickets(company_id, created_at desc);
grant select, insert, update on public.support_tickets to authenticated;
grant all on public.support_tickets to service_role;
alter table public.support_tickets enable row level security;

drop policy if exists "member reads own tickets" on public.support_tickets;
create policy "member reads own tickets" on public.support_tickets for select
  using (
    (company_id is not null and public.is_company_member(company_id, auth.uid()))
    or opened_by = auth.uid()
  );

drop policy if exists "member opens tickets" on public.support_tickets;
create policy "member opens tickets" on public.support_tickets for insert
  with check (
    opened_by = auth.uid()
    and (company_id is null or public.is_company_member(company_id, auth.uid()))
  );

drop policy if exists "admin updates tickets" on public.support_tickets;
create policy "admin updates tickets" on public.support_tickets for update
  using (
    opened_by = auth.uid()
    or (company_id is not null and public.has_company_role(company_id, auth.uid(), array['owner','admin']::public.tenant_role[]))
  );

-- Storage Buckets (private por padrão) ----------------------------------------
insert into storage.buckets (id, name, public) values
  ('planner-projects', 'planner-projects', false),
  ('planner-renders',  'planner-renders',  false),
  ('planner-videos',   'planner-videos',   false),
  ('planner-library',  'planner-library',  false),
  ('planner-uploads',  'planner-uploads',  false),
  ('planner-avatars',  'planner-avatars',  true)
on conflict (id) do nothing;

-- Storage policies: membros da empresa acessam objetos cujo primeiro segmento
-- do path é o company_id (convenção: `<company_id>/...`).
drop policy if exists "planner buckets member read" on storage.objects;
create policy "planner buckets member read" on storage.objects for select
  using (
    bucket_id in ('planner-projects','planner-renders','planner-videos','planner-library','planner-uploads')
    and public.is_company_member((split_part(name, '/', 1))::uuid, auth.uid())
  );

drop policy if exists "planner buckets member write" on storage.objects;
create policy "planner buckets member write" on storage.objects for insert
  with check (
    bucket_id in ('planner-projects','planner-renders','planner-videos','planner-library','planner-uploads')
    and public.is_company_member((split_part(name, '/', 1))::uuid, auth.uid())
  );

drop policy if exists "planner buckets member update" on storage.objects;
create policy "planner buckets member update" on storage.objects for update
  using (
    bucket_id in ('planner-projects','planner-renders','planner-videos','planner-library','planner-uploads')
    and public.is_company_member((split_part(name, '/', 1))::uuid, auth.uid())
  );

drop policy if exists "planner buckets member delete" on storage.objects;
create policy "planner buckets member delete" on storage.objects for delete
  using (
    bucket_id in ('planner-projects','planner-renders','planner-videos','planner-library','planner-uploads')
    and public.is_company_member((split_part(name, '/', 1))::uuid, auth.uid())
  );

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects for select
  using (bucket_id = 'planner-avatars');

drop policy if exists "avatars self write" on storage.objects;
create policy "avatars self write" on storage.objects for insert
  with check (bucket_id = 'planner-avatars' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "avatars self update" on storage.objects;
create policy "avatars self update" on storage.objects for update
  using (bucket_id = 'planner-avatars' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "avatars self delete" on storage.objects;
create policy "avatars self delete" on storage.objects for delete
  using (bucket_id = 'planner-avatars' and split_part(name, '/', 1) = auth.uid()::text);

-- Backfill: profiles para usuários já existentes ------------------------------
insert into public.profiles (id, email)
select u.id, u.email from auth.users u
on conflict (id) do nothing;

-- Atualização do catálogo de planos (nomes comerciais oficiais) ---------------
insert into public.plans (key, label, monthly_credits, price_cents, sort_order, features) values
  ('free',         'Free',         100,         0, 10, '["1 projeto","Editor 2D/3D","Suporte comunitário"]'::jsonb),
  ('starter',      'Starter',      2000,     9900, 20, '["5 projetos","Render local","Biblioteca básica"]'::jsonb),
  ('professional', 'Professional', 10000,   29900, 30, '["Projetos ilimitados","Render Ultra","IA avançada","Vídeo 4K"]'::jsonb),
  ('enterprise',   'Enterprise',   50000,   89900, 40, '["Multiempresa","SSO","API dedicada","SLA 99.9%"]'::jsonb),
  ('custom',       'Custom',       250000,      0, 50, '["Contrato dedicado","On-premise opcional","Suporte 24/7"]'::jsonb)
on conflict (key) do update set
  label = excluded.label,
  monthly_credits = excluded.monthly_credits,
  price_cents = excluded.price_cents,
  sort_order = excluded.sort_order,
  features = excluded.features,
  updated_at = now();