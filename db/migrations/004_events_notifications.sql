-- ============================================================
-- Dioris Hub — Fase 1.9: Centro de Eventos + Notificações Enterprise
-- Infraestrutura ÚNICA de eventos e notificações da plataforma.
-- Todos os módulos publicam eventos e emitem notificações exclusivamente
-- via este subsistema. RLS por company_id em todas as tabelas.
-- ============================================================

-- ================= ENUMS =================
do $$ begin
  create type public.event_priority as enum ('low','normal','high','critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.event_status as enum (
    'pending','processing','delivered','failed','dead','scheduled','deduped'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_channel as enum (
    'in_app','email','whatsapp','sms','push','webhook','discord','slack','teams','telegram'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_status as enum (
    'pending','sent','failed','read','archived','muted','skipped'
  );
exception when duplicate_object then null; end $$;

-- ================= EVENTS =================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  type text not null,                       -- ex: 'planner.project.created'
  source text not null default 'core',      -- módulo emissor
  priority public.event_priority not null default 'normal',
  status public.event_status not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  dedupe_key text,                          -- unique por (company, type, dedupe_key) evita duplicatas
  scheduled_at timestamptz not null default now(),
  processed_at timestamptz,
  attempts int not null default 0,
  max_attempts int not null default 5,
  last_error text,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_events_company_created on public.events(company_id, created_at desc);
create index if not exists idx_events_status_sched on public.events(status, scheduled_at);
create index if not exists idx_events_type on public.events(company_id, type);
create unique index if not exists uq_events_dedupe
  on public.events(company_id, type, dedupe_key) where dedupe_key is not null;

-- Entregas para subscribers/rules (fanout do EventBus)
create table if not exists public.event_deliveries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  subscriber text not null,                 -- id do handler/rule
  status public.event_status not null default 'pending',
  attempts int not null default 0,
  max_attempts int not null default 5,
  last_error text,
  next_attempt_at timestamptz not null default now(),
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_evdel_company on public.event_deliveries(company_id, created_at desc);
create index if not exists idx_evdel_pending on public.event_deliveries(status, next_attempt_at);

-- ================= NOTIFICATION TEMPLATES =================
create table if not exists public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade, -- null = template global
  key text not null,                        -- ex: 'planner.project.created'
  channel public.notification_channel not null,
  locale text not null default 'pt-BR',
  subject text,                             -- suporta {{variaveis}}
  body text not null,                       -- suporta {{variaveis}}
  variables jsonb not null default '[]'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, key, channel, locale)
);
create index if not exists idx_notif_tpl_key on public.notification_templates(key, channel);

-- ================= NOTIFICATION RULES =================
-- Regra: para eventos deste tipo, disparar notificações por estes canais
create table if not exists public.notification_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  event_type text not null,                 -- ex: 'planner.project.created'
  channels public.notification_channel[] not null default '{in_app}',
  category text not null default 'geral',
  audience jsonb not null default '{}'::jsonb, -- ex: {"roles":["admin"]} ou {"users":[uuid]}
  template_key text,
  enabled boolean not null default true,
  priority public.event_priority not null default 'normal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_notif_rules_company_evt on public.notification_rules(company_id, event_type);

-- ================= NOTIFICATION SUBSCRIPTIONS =================
-- Assinatura ad-hoc de um usuário/webhook a um tipo de evento
create table if not exists public.notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  channel public.notification_channel not null,
  event_type text not null,
  target text,                              -- email/telefone/webhook url conforme o canal
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_notif_subs_company on public.notification_subscriptions(company_id, event_type);

-- ================= NOTIFICATION PREFERENCES =================
-- Preferência por usuário (ou empresa quando user_id is null) por canal/categoria
create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  channel public.notification_channel not null,
  category text not null default 'geral',
  enabled boolean not null default true,
  muted_until timestamptz,
  updated_at timestamptz not null default now(),
  unique (company_id, user_id, channel, category)
);
create index if not exists idx_notif_prefs on public.notification_preferences(company_id, user_id);

-- ================= NOTIFICATIONS (in-app center) =================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,  -- destinatário (null = broadcast por role)
  event_id uuid references public.events(id) on delete set null,
  category text not null default 'geral',
  priority public.event_priority not null default 'normal',
  title text not null,
  body text,
  icon text,
  link text,
  data jsonb not null default '{}'::jsonb,
  status public.notification_status not null default 'pending',
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_notif_user on public.notifications(company_id, user_id, created_at desc);
create index if not exists idx_notif_status on public.notifications(company_id, status);

-- ================= NOTIFICATION DELIVERIES (out-of-app channels) =================
create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  notification_id uuid references public.notifications(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  channel public.notification_channel not null,
  target text not null,                     -- email/phone/url
  status public.notification_status not null default 'pending',
  attempts int not null default 0,
  max_attempts int not null default 5,
  last_error text,
  provider text,
  provider_message_id text,
  next_attempt_at timestamptz not null default now(),
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_notif_del_company on public.notification_deliveries(company_id, created_at desc);
create index if not exists idx_notif_del_pending on public.notification_deliveries(status, next_attempt_at);

-- ================= AUDIT =================
create table if not exists public.notification_audit (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  entity text not null,                     -- 'event' | 'notification' | 'template' | 'rule' | 'preference'
  entity_id uuid,
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_notif_audit_company on public.notification_audit(company_id, created_at desc);

-- ================= GRANTS =================
grant select, insert, update, delete on public.events                     to authenticated;
grant select, insert, update, delete on public.event_deliveries           to authenticated;
grant select, insert, update, delete on public.notification_templates     to authenticated;
grant select, insert, update, delete on public.notification_rules         to authenticated;
grant select, insert, update, delete on public.notification_subscriptions to authenticated;
grant select, insert, update, delete on public.notification_preferences   to authenticated;
grant select, insert, update, delete on public.notifications              to authenticated;
grant select, insert, update, delete on public.notification_deliveries    to authenticated;
grant select, insert                 on public.notification_audit         to authenticated;
grant all on public.events, public.event_deliveries,
          public.notification_templates, public.notification_rules,
          public.notification_subscriptions, public.notification_preferences,
          public.notifications, public.notification_deliveries,
          public.notification_audit to service_role;

-- ================= RLS =================
alter table public.events                     enable row level security;
alter table public.event_deliveries           enable row level security;
alter table public.notification_templates     enable row level security;
alter table public.notification_rules         enable row level security;
alter table public.notification_subscriptions enable row level security;
alter table public.notification_preferences   enable row level security;
alter table public.notifications              enable row level security;
alter table public.notification_deliveries    enable row level security;
alter table public.notification_audit         enable row level security;

-- Reaproveita helper is_company_member(_company uuid) criado na fase 1.3.
-- Policy padrão: membros da empresa acessam tudo do próprio tenant.
do $$ begin
  create policy "tenant read/write events"
    on public.events for all to authenticated
    using (public.is_company_member(company_id, auth.uid()))
    with check (public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "tenant read/write event_deliveries"
    on public.event_deliveries for all to authenticated
    using (public.is_company_member(company_id, auth.uid()))
    with check (public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "templates: tenant or global read"
    on public.notification_templates for select to authenticated
    using (company_id is null or public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "templates: tenant write"
    on public.notification_templates for insert to authenticated
    with check (company_id is not null and public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "templates: tenant update"
    on public.notification_templates for update to authenticated
    using (company_id is not null and public.is_company_member(company_id, auth.uid()))
    with check (company_id is not null and public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "templates: tenant delete"
    on public.notification_templates for delete to authenticated
    using (company_id is not null and public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "tenant rules"
    on public.notification_rules for all to authenticated
    using (public.is_company_member(company_id, auth.uid()))
    with check (public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "tenant subscriptions"
    on public.notification_subscriptions for all to authenticated
    using (public.is_company_member(company_id, auth.uid()))
    with check (public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "prefs: owner or admin"
    on public.notification_preferences for all to authenticated
    using (
      public.is_company_member(company_id, auth.uid())
      and (user_id is null or user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
    )
    with check (
      public.is_company_member(company_id, auth.uid())
      and (user_id is null or user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "notifications: destinatário ou admin"
    on public.notifications for select to authenticated
    using (
      public.is_company_member(company_id, auth.uid())
      and (user_id is null or user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "notifications: owner marks read/archive"
    on public.notifications for update to authenticated
    using (
      public.is_company_member(company_id, auth.uid())
      and (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
    )
    with check (
      public.is_company_member(company_id, auth.uid())
      and (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "notifications: admin insert"
    on public.notifications for insert to authenticated
    with check (
      public.is_company_member(company_id, auth.uid())
      and public.has_role(auth.uid(), 'admin')
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "tenant deliveries"
    on public.notification_deliveries for all to authenticated
    using (public.is_company_member(company_id, auth.uid()))
    with check (public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "tenant audit read"
    on public.notification_audit for select to authenticated
    using (public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "tenant audit insert"
    on public.notification_audit for insert to authenticated
    with check (public.is_company_member(company_id, auth.uid()));
exception when duplicate_object then null; end $$;
