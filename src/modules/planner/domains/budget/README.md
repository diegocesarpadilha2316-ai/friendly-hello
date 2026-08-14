# Planner / Orçamento Profissional (Etapa 12)

Orçamento auditável do projeto ativo, separando com clareza:
quantidades → perdas → custos (conhecidos/estimados/ausentes) → mão de obra →
custos indiretos → margem/markup → desconto → impostos → preço final.

## Estrutura

- `types/` — contrato canônico (`ProjectBudget`, `BudgetItem`, `BudgetTotals`).
- `services/`
  - `defaults.ts` — padrões e perdas por categoria (todas viram premissas visíveis).
  - `quantify.ts` — converte o relatório de produção em itens orçáveis.
  - `totals.ts` — fechamento financeiro (margem sobre venda ou markup; imposto por dentro).
  - `calculate.ts` — motor determinístico + reaplicação de overrides por id estável.
  - `signature.ts` — detecta projeto alterado (orçamento desatualizado).
  - `store.ts` — `localStorage` isolado por tenant/projeto + revisões.
  - `compare.ts` / `export.ts` — comparação de revisões, CSV interno e proposta comercial.
- `hooks/use-project-budget.ts` — única porta de entrada da UI.
- `components/BudgetStudio.tsx` — Studio com 4 abas.

## Regras

- Nunca inventa preço: ausente ⇒ `unitCost: null` e orçamento marcado incompleto.
- Quantidade líquida e perda são sempre exibidas separadas.
- Recalcular preserva todos os ajustes manuais (preço, quantidade, perda, exclusões, extras).
- Zero migrations, zero banco, zero provider novo.
- Visão interna (custos/margem) nunca aparece na proposta comercial.

## Regras

- Consome exclusivamente `@/core` (Auth, Tenant, RBAC, IA Gateway, Créditos, Uploads, Auditoria).
- Comunicação com outros domínios apenas via contratos em `@/modules/planner/shared`.
- Não duplicar stores, providers, tipos ou serviços já existentes no Core.
- Pontos de extensão via `PlannerExtensionHost`.
