# Conectar Planner ao Banco — Roadmap por Etapas

Vamos ligar as telas do Planner ao Supabase gradualmente, garantindo typecheck limpo e cada etapa 100% funcional antes de avançar.

## Etapa 1 — Projetos (Fundação)
- `src/lib/planner-projects.functions.ts`: `listProjects`, `getProject`, `createProject`, `renameProject`, `duplicateProject`, `archiveProject`, `deleteProject` (todos com `requireSupabaseAuth`, scoped por `company_id`).
- Ligar rotas: `_authenticated.planner.projetos.tsx` (lista), `.novo.tsx` (criar), `.$projectId.tsx` (abrir).
- Usar `queryOptions` + `ensureQueryData` + `useSuspenseQuery`.

## Etapa 2 — Snapshots & Auto-save
- `planner-snapshots.functions.ts`: `saveSnapshot`, `loadLatestSnapshot`, `listVersions`, `restoreVersion`.
- Integrar com `PlannerEditorProvider` (auto-save a cada N alterações via `updateProject`).

## Etapa 3 — Biblioteca / Catálogo
- `planner-library.functions.ts`: `listCatalogItems`, `searchCatalog`, `listFavorites`, `toggleFavorite`, `listCategories`.
- Ligar `LibraryPanel` do editor.

## Etapa 4 — Materiais & Preços por Empresa
- `materials.functions.ts`: `listMaterials`, `getCompanyPrice`, `upsertCompanyPrice`.
- Ligar página de Materiais no Workspace.

## Etapa 5 — Orçamentos / Faturas
- `quotes.functions.ts`: CRUD de quotes + items, gerar PDF (stub), enviar.
- `invoices.functions.ts`: emissão a partir de quote aprovado, pagamentos.

## Etapa 6 — Produção & CNC
- `production.functions.ts`: criar ordem a partir de projeto, atualizar estágios.
- `cnc.functions.ts`: enfileirar job CNC, atualizar status da máquina.

## Etapa 7 — Render & Vídeo (jobs persistidos)
- `render-jobs.functions.ts` / `video-jobs.functions.ts`: enfileirar, listar histórico, marcar concluído com URL do asset.

## Etapa 8 — Colaboração / Compartilhamento
- `sharing.functions.ts`: gerar link público, comentários de cliente, aprovações/assinaturas.

## Etapa 9 — Analytics & Créditos
- `analytics.functions.ts`: emitir eventos de uso.
- `credits.functions.ts`: consumir/reembolsar créditos ligado ao `credit_wallets` + `credit_ledger`.

## Convenções técnicas
- Todos os server fns em `src/lib/*.functions.ts` (thin wrappers).
- Helpers e queries complexas em `*.server.ts` quando necessário.
- Middleware: `requireSupabaseAuth`; scoping por `context.userId` e `company_id` do tenant ativo.
- Nenhuma alteração em `PlannerEditorProvider` que quebre Undo/Redo — persistência é aditiva.
- Após cada etapa: typecheck + smoke test manual + só então avanço.

Começo agora pela **Etapa 1 — Projetos**.
