/**
 * Planner / domínio: rooms
 *
 * Estrutura interna:
 *  - types/       tipos privados do domínio
 *  - services/    server functions + integração com Core (Auth/Tenant/RBAC/IA/Créditos)
 *  - hooks/       React hooks (client) — leitura via TanStack Query
 *  - components/  UI específica do domínio (consome UI Kit do Core)
 *
 * Comunicação com outros domínios: SOMENTE via contratos publicados em
 * `@/modules/planner/shared` (PlannerRegistry + PlannerEventBus).
 * Não importe outros domínios diretamente.
 *
 * Fase 3.7 — Vision (foto → PlannerRoom).
 * Fase 3.8 — Decor (estilos, sugestões, aceitar/rejeitar).
 */
export * from "./vision";
export * from "./decor";
