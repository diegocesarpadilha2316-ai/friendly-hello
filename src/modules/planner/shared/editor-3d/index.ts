/**
 * Editor 3D — Fase 3.3. Módulo isolado, consumido apenas pelo
 * `EditorCanvas` (client-only). Reutiliza integralmente o
 * `PlannerEditorProvider` e os `PlannerParametricNode` das Fases
 * 3.1 e 3.2 — nenhum estado global novo.
 */
export { Viewport3D } from "./Viewport3D";
export { Scene3D } from "./Scene3D";
export * from "./types";
export * from "./extrusion";