# Etapa 9 — Ferramentas profissionais da IA do Planner

Sem migrations, sem `db push`, sem novos providers/stores. Toda mutação
continua passando por `updateProject()` (Undo/Redo/Autosave preservados).

## Contrato único
`src/modules/planner/domains/ia/tools/types.ts` define `PlannerToolContract`
(nome, agente proprietário, categoria, schema, `mutating`, `destructive`,
`supportsPreview`, timeout, teto de objetos) e `PlannerToolResult`
(`ok`, `toolCallId`, `agent`, `tool`, `summary`, `affectedIds`, `warnings`,
`data`, `errorCode`). O registro canônico está em `tools/registry.ts`.

## Validação
`tools/validation.ts`: unidade interna **milímetro inteiro**; `"1,20 m"`,
`"80cm"` e `2.4` são convertidos. Schemas são estritos (campo desconhecido
é recusado) e têm limites físicos. Erros voltam como mensagem genérica —
nunca stack ou payload interno.

## Ferramentas por agente
| Agente | Ferramentas novas |
| --- | --- |
| Designer | `check_circulation`, `review_project` |
| Materiais | `search_material` (só acabamento real de catálogo) |
| Orçamentista | `estimate_budget` (nunca inventa preço; declara pendências) |
| Produção | `production_summary`, `preliminary_cut_list` |
| Render | `set_render_preset`, `set_camera` |

As 20 ferramentas anteriores foram migradas para o mesmo contrato, com
schema real, sem duplicar executor.

## Runner
`tools/runner.ts`: valida → checa escopo (projeto/cômodo) → exige
confirmação em operações destrutivas → cria checkpoint em operações amplas
→ executa com timeout → normaliza o resultado. Idempotência por
`toolCallId`: a mesma chamada nunca roda duas vezes no mesmo turno. Em
falha, o projeto de entrada é preservado (rollback implícito);
`rollbackTool(toolCallId)` devolve o snapshot para reaplicação via
`updateProject`.

## Limitação declarada
Presets de cena/câmera vivem em memória (`tools/scene-prefs.ts`) porque o
`PlannerProject` não tem campo de cena e criar um exigiria alteração de
schema — proibido nesta etapa.