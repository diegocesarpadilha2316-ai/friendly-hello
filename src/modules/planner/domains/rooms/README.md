# Planner / Ambientes

## Subdomínios previstos

- Closet
- Dormitório
- Banheiro
- Lavanderia
- Escritório
- Comercial
- Corporativo
- Geração IA

## Regras

- Consome exclusivamente `@/core` (Auth, Tenant, RBAC, IA Gateway, Créditos, Uploads, Auditoria).
- Comunicação com outros domínios apenas via contratos em `@/modules/planner/shared`.
- Não duplicar stores, providers, tipos ou serviços já existentes no Core.
- Pontos de extensão via `PlannerExtensionHost`.
