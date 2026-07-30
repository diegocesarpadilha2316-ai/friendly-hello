/**
 * Planner / domínio: budget
 *
 * Estrutura interna:
 *  - types/       tipos privados do domínio
 *  - services/    server functions + integração com Core (Auth/Tenant/RBAC/IA/Créditos)
 *  - hooks/       React hooks (client) — leitura via TanStack Query
 *  - components/  UI específica do domínio (consome UI Kit do Core)
 *
 * Etapa 12 — Orçamento Profissional: contrato canônico, motor de cálculo
 * determinístico, persistência local por tenant/projeto, revisões e
 * exportação (interna e comercial).
 *
 * O motor (`services/`) é puro e não conhece outros domínios; apenas o hook
 * consome o relatório de produção e o catálogo como fontes de quantidade e
 * preço, garantindo fonte única de verdade.
 */
export * from "./types";
export * from "./services";
export * from "./hooks";
export * from "./components";
