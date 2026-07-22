# Dioris Hub — Arquitetura (Fase 1.1)

Fundação enterprise da plataforma Dioris Hub. Esta fase entrega apenas a
estrutura; nenhum módulo de negócio (Planner, Sites, CRM, Financeiro etc.)
possui funcionalidade nesta fase.

## Estrutura de diretórios

```
src/
  core/                 # Base compartilhada consumida por todos os módulos
    components/         # Componentes base (Design System)
    hooks/              # Hooks reutilizáveis (auth, permissões, notificações…)
    lib/                # Clients (supabase, ai gateway, http)
    services/           # Serviços de domínio do Core (users, companies, credits…)
    providers/          # Providers globais (theme, auth, query, i18n)
    types/              # Tipos base (identity, permissions, api)
    utils/              # Helpers puros
    config/             # Configuração global (app, env, features)
    styles/             # Tokens do Design System (referência TS)
  modules/              # Um diretório por módulo de negócio
    planner/
    sites/
    systems/
    crm/
    finance/
    marketplace/
    automation/
    ai/
  shared/               # Recursos transversais que não são funcionalidade
    assets/
  components/ui/        # shadcn/ui (base — mantido pelo template)
  hooks/                # Hooks legados do template (use-mobile)
  lib/                  # Utilitários legados do template (utils, error-*)
  routes/               # Rotas file-based do TanStack Router
  styles.css            # Design System (CSS variables + @theme inline)
```

> `src/components/ui`, `src/hooks`, `src/lib` e `src/routes` permanecem
> onde o template exige. O Core espelha essas categorias em nível de
> domínio Dioris; novos recursos vão para `core/*`, não para essas pastas.

## Camadas

1. **Core** — única fonte de verdade para auth, usuários, empresas,
   permissões, notificações, créditos, uploads, config, logs, auditoria,
   integrações, cache e helpers. Nenhum módulo pode reimplementar.
2. **Modules** — cada módulo consome exclusivamente `@/core` e expõe
   suas próprias rotas, componentes, hooks e services *específicos* do
   domínio.
3. **Shared** — assets e recursos genuinamente transversais que não são
   funcionalidade (imagens, fontes locais, mocks).
4. **Routes** — arquivos file-based do TanStack Router. Cada módulo
   registrará suas rotas aqui seguindo o padrão `modulo.*.tsx`.

## Padronização

- **Componentes:** PascalCase (`UserCard.tsx`). Um componente por arquivo.
- **Hooks:** `useCamelCase` em arquivo `use-kebab-case.ts`.
- **Services:** `entidade.service.ts`, funções nomeadas, sem classes.
- **Providers:** `NomeProvider.tsx` exportando componente + hook `useNome`.
- **Rotas:** convenção do TanStack Router (`modulo.pagina.tsx`,
  `modulo.$id.tsx`, `_authenticated.modulo.tsx`).
- **Tipos:** `PascalCase`, arquivos `dominio.ts`. IDs com brand types
  (`UserId`, `CompanyId`).
- **Helpers:** funções puras, `camelCase`.
- **Imports:** sempre via alias `@/` — nunca caminhos relativos longos
  (`../../..`). Ordem: libs externas → `@/core` → `@/modules/*` →
  `@/shared` → relativo curto.
- **Nomenclatura de arquivos:** `kebab-case.ts` para módulos utilitários,
  `PascalCase.tsx` para componentes React.

## Design System

- Tokens declarados em `src/styles.css` como CSS variables (`oklch`)
  dentro de `:root` e `.dark`, e mapeados para utilitários Tailwind v4
  via `@theme inline`.
- Espelho em TypeScript em `src/core/styles/tokens.ts` para uso em
  código (motion, radius, cores semânticas).
- Componentes base ficam em `src/components/ui` (shadcn) e novos
  primitivos Dioris em `src/core/components`.

## Regras arquiteturais

- Nenhum módulo depende de outro módulo diretamente. Comunicação
  cross-module acontece via Core (eventos, services, tipos).
- Nenhum código duplicado; nenhum store paralelo.
- Toda funcionalidade nova nasce em `core/` (se transversal) ou em
  `modules/<modulo>/` (se específica).
- Server functions autenticadas seguem o padrão TanStack
  (`createServerFn` + `requireSupabaseAuth`), com arquivos
  `*.functions.ts` fora de `src/server/`.

## Próximas fases

Esta fase entrega apenas fundação. Funcionalidades reais (auth flows,
CRUD, telas de módulos) serão construídas nas fases 1.2+.
