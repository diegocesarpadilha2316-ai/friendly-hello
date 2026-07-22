# Convenções — Dioris Hub

## Onde colocar cada coisa

| Recurso | Local |
|---|---|
| Auth, usuários, permissões, notificações, créditos, uploads | `src/core/` |
| Componentes base (Design System) | `src/core/components` + `src/components/ui` |
| Feature específica de um módulo | `src/modules/<modulo>/` |
| Rota | `src/routes/` (file-based TanStack Router) |
| Server function | `*.functions.ts` (client-safe) + `*.server.ts` (server-only) |
| Assets compartilhados | `src/shared/assets` |
| Tokens de tema | `src/styles.css` + `src/core/styles/tokens.ts` |

## Imports

```ts
// externo
import { z } from "zod";
// core
import { app } from "@/core/config/app";
// módulo
import { PlannerBoard } from "@/modules/planner";
// shared
import logo from "@/shared/assets/logo.svg";
```

Nunca usar `../../../..`.

## Naming

- Arquivo React: `PascalCase.tsx`
- Arquivo TS utilitário: `kebab-case.ts`
- Hook: `use-nome.ts` exporta `useNome`
- Service: `entidade.service.ts` exporta funções
- Tipos: `dominio.ts` exporta interfaces PascalCase

## Proibições

- ❌ Duplicar auth/users/companies em módulo
- ❌ Cores hard-coded (`text-white`, `bg-[#fff]`) fora do Design System
- ❌ Estado global paralelo — usar o do Core
- ❌ Import cruzado entre módulos (`modules/crm` importando de `modules/planner`)
