/**
 * Fase 3.21 — Barrel público do Renderizador Local.
 */
export * from "./types";
export * from "./scene-builder";
export * from "./materials";
export * from "./lights";
export * from "./cameras";
export * from "./quality";
export * from "./reflection";
export * from "./shadows";
export * from "./gi";
export * from "./textures";
export * from "./animation";
export * from "./capture";
export * from "./batch";
export * from "./queue";
export * from "./performance";
export * from "./viewport";
export * from "./renderer";
export { useLocalRender } from "./hooks/use-local-render";
export type { UseLocalRender } from "./hooks/use-local-render";
export { LocalRenderPanel } from "./components/LocalRenderPanel";