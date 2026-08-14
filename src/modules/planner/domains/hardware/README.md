# Planner / Ferragens

## Subdomínios previstos

- Hettich
- Häfele
- FGV
- Corrediças
- Dobradiças
- Pistões
- Trilhos
- Puxadores
- Acessórios

## Regras

- Consome exclusivamente `@/core` (Auth, Tenant, RBAC, IA Gateway, Créditos, Uploads, Auditoria).
- Comunicação com outros domínios apenas via contratos em `@/modules/planner/shared`.
- Não duplicar stores, providers, tipos ou serviços já existentes no Core.
- Pontos de extensão via `PlannerExtensionHost`.
