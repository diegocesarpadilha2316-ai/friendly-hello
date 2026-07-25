-- =====================================================================
-- Migration 045 — Blog público (blog_posts)
-- ---------------------------------------------------------------------
-- Tabela de artigos do blog público, com leitura anônima somente para
-- posts publicados. Escrita restrita ao service_role (admin da Dioris).
-- =====================================================================

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content text not null default '',
  category text not null default 'Produto',
  cover_url text,
  read_minutes integer not null default 5,
  author_name text,
  author_avatar_url text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_blog_posts_published_at
  on public.blog_posts (published_at desc)
  where published = true;
create index if not exists idx_blog_posts_category on public.blog_posts (category);

grant select on public.blog_posts to anon;
grant select on public.blog_posts to authenticated;
grant all on public.blog_posts to service_role;

alter table public.blog_posts enable row level security;

drop policy if exists "blog public read published" on public.blog_posts;
create policy "blog public read published" on public.blog_posts
  for select
  to anon, authenticated
  using (published = true);

-- Seed inicial (idempotente via slug único).
insert into public.blog_posts (slug, title, excerpt, content, category, read_minutes, published, published_at)
values
  ('apresentando-ecossistema-dioris',
   'Apresentando o ecossistema Dioris',
   'O que muda quando um único Core alimenta 7 produtos.',
   E'A Dioris nasceu com uma tese: unificar Planner, CRM, Financeiro, Automação, IA, Sites e Marketplace num único Core multi-tenant.\n\nNão é uma suíte de apps soltos — é um único ecossistema onde a IA, os créditos e os dados fluem entre módulos sem fricção.',
   'Produto', 5, true, '2026-07-23T12:00:00Z'),
  ('multi-tenant-com-rls',
   'Multi-tenant com RLS por padrão',
   'Como isolamos dados por empresa desde o dia 1.',
   E'Toda tabela sensível na Dioris começa com Row Level Security ativa e uma política que restringe leitura/escrita à empresa (company_id) do usuário autenticado.\n\nZero vazamento cross-tenant, mesmo em bugs de código.',
   'Engenharia', 8, true, '2026-07-20T12:00:00Z'),
  ('gateway-de-ia-creditos-unificados',
   'Gateway de IA com créditos unificados',
   'Um único ledger para todos os modelos e provedores.',
   E'Chamadas a DeepSeek, GPT, Gemini, Claude ou Mistral passam por um Gateway central que debita créditos do saldo da empresa antes de repassar ao provedor.\n\nUm ledger, uma cobrança, todos os modelos.',
   'IA', 6, true, '2026-07-15T12:00:00Z'),
  ('planner-do-briefing-a-fabrica',
   'Planner: do briefing à fábrica',
   'Como o Planner conecta projeto, orçamento e produção.',
   E'O Planner Dioris é o primeiro módulo do ecossistema com pipeline completo: projeto 3D → lista de corte → CNC → orçamento → produção.\n\nTudo dentro do mesmo Core, sem exportar/importar entre ferramentas.',
   'Produto', 7, true, '2026-07-10T12:00:00Z'),
  ('valores-enterprise',
   'Nossos valores enterprise',
   'Excelência técnica, obsessão pelo cliente, velocidade.',
   E'Três pilares guiam cada decisão de produto e engenharia na Dioris: excelência técnica, obsessão pelo cliente e velocidade de execução.',
   'Empresa', 4, true, '2026-07-05T12:00:00Z'),
  ('observabilidade-em-cada-camada',
   'Observabilidade em cada camada',
   'Logs, métricas, health checks e SLOs no Core.',
   E'Todo módulo Dioris expõe logs estruturados, métricas de latência e uso, health checks públicos e SLOs de disponibilidade.\n\nO painel de observabilidade administrativa consolida tudo em tempo real.',
   'Engenharia', 6, true, '2026-07-01T12:00:00Z')
on conflict (slug) do nothing;