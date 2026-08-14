---
name: Planner IA — próximas etapas da IA Editora
description: Roadmap da IA editora do Planner após o loop de seleção — biblioteca por imagem, aprovação admin, aprendizado contínuo
type: preference
---

Loop de edição por seleção JÁ implementado:

- `PlannerEditorProvider.selectedNodeId` + `selectNode()` é o canal único de seleção; Viewport3D e árvore compartilham.
- `use-planner-chat` envia `selectionIds` no `ToolContext`; o system prompt descreve o item selecionado (kind, dims, material, cor).
- Todas as tools de mutação (change_material/color, resize, open_all, set_front_type, change_hardware, toggle_led, duplicate, rotate, mirror, remove, center) já respeitam `selectionIds` via `applySelection`.
- Nova tool `convert_to` cobre "transforme em torre quente"/"vira cristaleira" preservando posição.

**Pendências desta linha de trabalho (executar em prompts futuros, não agora):**

1. Biblioteca inteligente por imagem — server function `analyzeReferenceImage` que envia foto para Lovable AI multimodal (google/gemini-3.6-flash) e devolve JSON estruturado {subtype, dims mm, material, cor, frontType, ferragens}. Anexar via chat (paperclip) na `PlannerAIPanel`.
2. Proposta → módulo paramétrico: mapear o JSON no matcher/catalog, gerar CatalogItem privado do tenant.
3. Fluxo de aprovação: usuários criam apenas módulos privados; admin (RBAC has_role 'admin') aprova para publicar. Tabela `planner_library_modules` (owner_id, tenant_id, status: draft|private|pending|public).
4. Miniatura automática via Render Engine (fase already exists) — snapshot do módulo isolado.
5. Aprendizado contínuo: registrar padrões (dims, materiais, ferragens) e alimentar `matcher.ts` com pesos por frequência.

**Não implementar sem prompt explícito** — o usuário pediu, mas rodada anterior priorizou o loop de edição por seleção.
