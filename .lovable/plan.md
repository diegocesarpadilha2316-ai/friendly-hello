# Fundação Enterprise Dioris Hub — Fases 1.2 a 1.8

Cada fase termina com relatório (arquivos criados/modificados, integrações, compatibilidade, performance, checklist). TypeScript sempre em 0 erros. Módulos permanecem como scaffold.

## Contexto técnico

Usaremos o **Supabase externo** já conectado via secrets (`EXTERNAL_SUPABASE_URL`, `EXTERNAL_SUPABASE_PUBLISHABLE_KEY`, `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY`) — não a integração Lovable Cloud. Isso significa:

- Criar clients próprios em `src/core/lib/supabase/` (browser, server, admin).
- Middleware de auth próprio para `createServerFn` (não usar `@/integrations/supabase/*` que não existe).
- Migrations SQL serão fornecidas em `docs/migrations/*.sql` para o usuário rodar no painel do Supabase externo (não temos ferramenta `supabase--*` sem enable).
- Rotas autenticadas via layout `_authenticated.tsx` com redirect para `/auth`.

## Fase 1.2 — Autenticação Enterprise

**Core**
- `src/core/lib/supabase/client.ts` — browser client (publishable key, persistSession).
- `src/core/lib/supabase/server.ts` — server publishable client (server functions).
- `src/core/lib/supabase/admin.server.ts` — service-role (server-only, import dinâmico).
- `src/core/lib/supabase/env.ts` — leitura tipada de env vars.
- `src/core/providers/AuthProvider.tsx` + `useAuth()` — sessão, user, signIn/signUp/signOut, listener `onAuthStateChange`.
- `src/core/services/auth.service.ts` — wrappers (email+senha, magic link, reset).
- `src/core/hooks/use-auth.ts` re-export.
- `src/core/middleware/require-auth.ts` — `functionMiddleware` para `createServerFn`.

**Rotas**
- `src/routes/auth.tsx` — login/signup/reset (tabs).
- `src/routes/_authenticated.tsx` — layout gate (redirect `/auth`).
- Mover `/`, `/planner`, `/sites`, `/sistemas`, `/crm`, `/financeiro`, `/marketplace`, `/automacao`, `/ia` para dentro de `_authenticated`.
- `src/start.ts` — adicionar middleware que anexa bearer token.

**SQL** (`docs/migrations/001_auth.sql`) — profiles table + trigger `on_auth_user_created`.

## Fase 1.3 — Multiempresa (Tenant)

**Core**
- `src/core/types/tenant.ts` — `CompanyId`, `Company`, `Membership`.
- `src/core/services/company.service.ts` — list/create/switch.
- `src/core/providers/TenantProvider.tsx` + `useTenant()` — empresa ativa (persistida em localStorage + validada server-side), lista de memberships.
- `src/core/hooks/use-tenant.ts`.
- Adicionar `TenantSwitcher` no `Topbar` (UI kit component novo em `ui-kit/tenant-switcher.tsx`).

**SQL** (`002_tenants.sql`) — `companies`, `company_members(user_id, company_id, role)`, RLS por membership, grants.

## Fase 1.4 — Usuários e Equipes

**Core**
- `src/core/services/user.service.ts` — perfil, avatar upload.
- `src/core/services/team.service.ts` — convidar membro (edge via server function), listar, remover.
- `src/core/functions/team.functions.ts` — `inviteMember`, `removeMember` (usa admin dinamicamente).

**SQL** (`003_teams.sql`) — `team_invites` opcional.

**Rota**: `src/routes/_authenticated/configuracoes.equipe.tsx` — placeholder listando membros (usa DataTable existente).

## Fase 1.5 — Papéis e Permissões (RBAC)

**Core**
- `src/core/types/permissions.ts` — enum `AppRole = 'owner'|'admin'|'member'|'viewer'`, catálogo de `Permission` strings por módulo.
- `src/core/services/rbac.service.ts` — `hasRole`, `hasPermission` (consulta `user_roles`).
- `src/core/hooks/use-permissions.ts` — hook client (carregado via TanStack Query, cache por tenant).
- `src/core/components/PermissionGate.tsx` — wrapper que esconde/renderiza fallback.

**SQL** (`004_rbac.sql`) — enum `app_role`, tabela `user_roles(user_id, company_id, role)`, função `has_role(uuid, uuid, app_role)` SECURITY DEFINER, RLS.

## Fase 1.6 — Dashboard Base

Substituir `routes/index.tsx` atual por dashboard autenticado:
- Métricas placeholder via `MetricCard` (créditos, membros, módulos ativos).
- Grid `ModuleCard` filtrada por permissões.
- SEO head próprio.

Sem lógica de negócio nos módulos — apenas leitura de counts genéricos.

## Fase 1.7 — Créditos e Assinaturas

**Core**
- `src/core/types/credits.ts` — `CreditBalance`, `CreditTransaction`, `Plan`.
- `src/core/services/credits.service.ts` — `getBalance`, `consume` (server fn), `history`.
- `src/core/services/subscription.service.ts` — plano atual, upgrade (placeholder Stripe hook).
- `src/core/hooks/use-credits.ts` — query balance.
- `src/core/providers/CreditsProvider.tsx` — opcional; ou apenas hook.

**SQL** (`005_credits.sql`) — `plans`, `subscriptions(company_id, plan_id, status)`, `credit_ledger(company_id, delta, reason, ref)`, view `credit_balances`, função `consume_credits(company, amount, reason)` SECURITY DEFINER que grava ledger.

**UI**: badge de saldo no `Topbar`.

## Fase 1.8 — Gateway Central de IA

**Core**
- `src/core/lib/ai/gateway.ts` — client único que roteia para Lovable AI Gateway (LOVABLE_API_KEY via `ai_gateway--create`).
- `src/core/functions/ai.functions.ts` — `aiChat`, `aiEmbed`, `aiImage` server fns; cada uma:
  1. `requireAuth` middleware
  2. valida tenant ativo
  3. debita créditos via `consume_credits`
  4. chama gateway
  5. registra log
- `src/core/services/ai.service.ts` — wrappers client (chama server fns).
- `src/core/hooks/use-ai.ts` — hooks TanStack Query/Mutation.
- Modelos default: `google/gemini-2.5-flash` (chat), `google/gemini-2.5-flash-image` (image).

**SQL** (`006_ai_logs.sql`) — `ai_requests(id, company_id, user_id, model, tokens_in, tokens_out, cost_credits, created_at)`.

Todos os módulos futuros consomem `useAI()`; nenhum módulo terá client próprio de IA.

## Ordem de execução

Vou executar sequencialmente: 1.2 → 1.3 → 1.4 → 1.5 → 1.6 → 1.7 → 1.8. Ao final de cada fase, um relatório resumido no chat. Sem pausar para confirmação entre fases.

## Riscos e mitigações

- **Supabase externo sem migrations automáticas**: SQL fica em `docs/migrations/` — usuário aplica manualmente. Código escrito para funcionar assim que as tabelas existirem; UIs mostram estado vazio até lá.
- **`build:dev` prerender**: rotas autenticadas ficam sob `_authenticated`, cujo loader/gate redireciona para `/auth` — nunca chama server fn protegida em route pública.
- **Créditos como fonte única**: Gateway IA sempre passa por `consume_credits`. Nenhum módulo pode chamar provedores de IA diretamente.

## Confirmação

Prosseguir com esse plano das 7 fases sequenciais? Assim que aprovado, executo tudo e reporto no final de cada fase.