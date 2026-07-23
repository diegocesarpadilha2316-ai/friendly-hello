/**
 * Tipos internos do Editor 3D (Fase 3.3).
 *
 * O 3D é derivado dos mesmos `PlannerParametricNode` persistidos pela
 * Fase 3.1. Nenhum modelo paralelo — o `PlannerEditorProvider` continua
 * sendo a fonte da verdade para Undo/Redo/Autosave.
 */
export type Camera3DMode = "orbit" | "first-person" | "fly";

export type Render3DMode = "solid" | "wireframe" | "material";

export interface Viewport3DState {
  camera: Camera3DMode;
  render: Render3DMode;
  showGrid: boolean;
  showAxes: boolean;
  /** altura em milímetros — corta acima do plano */
  sectionHeight: number | null;
  /** fator 0..1 de explosão dos elementos */
  explode: number;
  wallHeight: number;
  wallOpacity: number;
}

export const DEFAULT_VIEWPORT_3D: Viewport3DState = {
  camera: "orbit",
  render: "solid",
  showGrid: true,
  showAxes: true,
  sectionHeight: null,
  explode: 0,
  wallHeight: 2700,
  wallOpacity: 1,
};