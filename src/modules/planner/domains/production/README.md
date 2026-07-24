# Planner / Produção

## Subdomínios previstos
- OP
- Separação
- Etiquetas
- Montagem
- Expedição
- Qualidade
- Dashboard

## Regras
- Consome exclusivamente `@/core` (Auth, Tenant, RBAC, IA Gateway, Créditos, Uploads, Auditoria).
- Comunicação com outros domínios apenas via contratos em `@/modules/planner/shared`.
- Não duplicar stores, providers, tipos ou serviços já existentes no Core.
- Pontos de extensão via `PlannerExtensionHost`.

## Fase 3.13 — Motor de Fabricação (arquitetural)
Camada aditiva em `services/fabrication/` — zero migrations, zero providers, zero stores.

- `types.ts` — otimizador v2, furações, máquinas, KPIs, intents e exportações.
- `machines.ts` — catálogo Homag / Biesse / SCM / Router / Nesting.
- `optimizer.ts` — algoritmo próprio Guillotine + Best-Fit com rotação, kerf, margem, grão e reuso de sobra.
- `drilling.ts` — deriva minifix, cavilha, confirmat, dobradiça, corrediça, perfil, LED e puxador.
- `post-processors.ts` — G-Code / DXF / BPP / CIX / NC (preview, sem integrar máquina).
- `dashboard.ts` — KPIs de peças, chapas, aproveitamento, desperdício, sobra, cortes, tempo, custo.
- `ai-intents.ts` — respostas determinísticas para custo, chapas, desperdício, tempo, material, melhoria.
- `exports.ts` — catálogo de PDF/DXF/GCODE/NC/BPP/CSV/XLSX.

Hook `useFabrication()` memoiza tudo sobre `useProduction()`. UI: `FabricationPanel` renderizado como aba "Fabricação" do `ProductionStudio` (`/planner/producao`).
