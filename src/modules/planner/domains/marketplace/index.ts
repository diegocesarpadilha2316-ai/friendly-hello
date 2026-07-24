/**
 * Planner / domínio: marketplace (Fase 3.25).
 *
 * Marketplace de Componentes + Biblioteca Online Enterprise.
 * Comunicação com outros domínios: SOMENTE via contratos publicados em
 * `@/modules/planner/shared`. Toda mutação persistente continua passando por
 * `updateProject()` do PlannerEditorProvider (Fase 3.1).
 */
export * from "./types";
export * from "./services";
export { useMarketplace } from "./hooks/use-marketplace";
export { MarketplaceStudio } from "./components/MarketplaceStudio";
