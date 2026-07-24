/**
 * Planner / domínio: catalog (Fase 3.24 — Catálogo Paramétrico Enterprise).
 *
 * Comunicação com outros domínios: SOMENTE via contratos publicados em
 * `@/modules/planner/shared` (PlannerRegistry + PlannerEventBus). Toda
 * mutação persistente passa por `updateProject()` (Fase 3.1).
 */
export * from "./types";
export * from "./catalog";
export * from "./manufacturers";
export * from "./collections";
export * from "./materials";
export * from "./textures";
export * from "./colors";
export * from "./handles";
export * from "./hinges";
export * from "./drawers";
export * from "./profiles";
export * from "./glass";
export * from "./mirrors";
export * from "./led";
export * from "./accessories";
export * from "./parametric";
export * from "./variants";
export * from "./pricing";
export * from "./rules";
export * from "./search";
export * from "./favorites";
export * from "./recents";
export * from "./import";
export * from "./export";
export * from "./sync";
export * from "./preview";
export { useCatalog } from "./hooks/use-catalog";
export { CatalogStudio } from "./components/CatalogStudio";
