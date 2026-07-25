/**
 * Fase 3.30 — Fachada pública da integração real do Render.
 * Camada 100% aditiva.
 */
export * from "./types";
export * from "./scene-builder-real";
export * from "./pbr-consumer";
export * from "./lighting-real";
export * from "./reflection";
export * from "./shadows";
export * from "./performance-real";
export * from "./executor";
export * from "./exporter";
export * from "./compare";
export * from "./config";
export * from "./integrations";
export { useRenderReal } from "./hooks/use-render-real";
export type { UseRenderReal } from "./hooks/use-render-real";
export { RenderRealPanel } from "./components/RenderRealPanel";