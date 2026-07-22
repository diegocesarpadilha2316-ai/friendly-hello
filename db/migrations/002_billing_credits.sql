-- ============================================================================
-- Dioris Hub — Fase 1.6 (Billing & Credits)
-- Aplicar UMA vez no Supabase externo via SQL Editor.
-- Idempotente (safe re-run).
-- ============================================================================

do $$ begin
  create type public.subscription_status as enum ('trial','active','past_due','canceled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.credit_kind as enum ('grant','consume','refund','adjustment','expire');
exception when duplicate_object then null; end $$;

-- Catálogo de planos ---------------------------------------------------------
create table if not exists public.plans (
  key text primary key,
  label text not null,
  monthly_credits integer not null default 0,
  price_cents integer not null default 0,
  currency text not null default 'BRL',
  features jsonb not null default '[]'::jsonb,
  is_public boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.plans to authenticated, anon;
grant all on public.plans to service_role;
alter table public.plans enable row level security;

drop policy if exists "public plans readable" on public.plans;
create policy "public plans readable" on public.plans
  for select using (is_public = true);

-- Assinatura por tenant ------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  plan_key text not null references public.plans(key),
  status public.subscription_status not null default 'trial',
  trial_ends_at timestamptz,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default now() + interval '30 days',
  cancel_at_period_end boolean not null default false,
  external_provider text,
  external_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id)
);
grant select, insert, update, delete on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
alter table public.subscriptions enable row level security;

drop policy if exists "member reads subscription" on public.subscriptions;
create policy "member reads subscription" on public.subscriptions
  for select using (
    exists (
      select 1 from public.company_members m
      where m.company_id = subscriptions.company_id
        and m.user_id = auth.uid()
        and m.active = true
    )
  );

-- Ledger de créditos (append-only) -------------------------------------------
create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  kind public.credit_kind not null,
  amount integer not null check (amount <> 0),
  reason text,
  actor_id uuid references auth.users(id) on delete set null,
  reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists credit_ledger_company_idx on public.credit_ledger(company_id, created_at desc);
grant select on public.credit_ledger to authenticated;
grant all on public.credit_ledger to service_role;
alter table public.credit_ledger enable row level security;

drop policy if exists "member reads ledger" on public.credit_ledger;
create policy "member reads ledger" on public.credit_ledger
  for select using (
    exists (
      select 1 from public.company_members m
      where m.company_id = credit_ledger.company_id
        and m.user_id = auth.uid()
        and m.active = true
    )
  );

-- Função de saldo (SECURITY DEFINER, não recursiva) --------------------------
create or replace function public.credit_balance(_company_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(amount), 0)::integer
  from public.credit_ledger
  where company_id = _company_id
$$;

grant execute on function public.credit_balance(uuid) to authenticated, service_role;

-- Seeds de planos ------------------------------------------------------------
insert into public.plans (key, label, monthly_credits, price_cents, sort_order) values
  ('free',       'Free',       100,      0, 10),
  ('starter',    'Starter',    2000,  9900, 20),
  ('pro',        'Pro',       10000, 29900, 30),
  ('business',   'Business',  50000, 89900, 40),
  ('enterprise', 'Enterprise', 250000, 0,   50)
on conflict (key) do update set
  label = excluded.label,
  monthly_credits = excluded.monthly_credits,
  price_cents = excluded.price_cents,
  sort_order = excluded.sort_order,
  updated_at = now();
