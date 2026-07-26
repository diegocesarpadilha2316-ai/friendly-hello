/**
 * Tipos internos do Editor 3D (Fase 3.3).
 *
 * O 3D é derivado dos mesmos `PlannerParametricNode` persistidos pela
 * Fase 3.1. Nenhum modelo paralelo — o `PlannerEditorProvider` continua
 * sendo a fonte da verdade para Undo/Redo/Autosave.
 */
export type Camera3DMode = "orbit" | "first-person" | "fly";

export type Render3DMode = "solid" | "wireframe" | "material";

/** Ângulos padrão do viewport, controlados pela barra inferior do editor. */
export type Camera3DView = "perspectiva" | "topo" | "frontal" | "lateral";

export interface Viewport3DState {
  camera: Camera3DMode;
  render: Render3DMode;
  showGrid: boolean;
  showAxes: boolean;
  /** ângulo de câmera pré-definido */
  view: Camera3DView;
  /** iluminação da cena (direcional + hemisférica); ambiente mínimo sempre ligado */
  showLights: boolean;
  /** altura em milímetros — corta acima do plano */
  sectionHeight: number | null;
  /** fator 0..1 de explosão dos elementos */
  explode: number;
  wallHeight: number;
  wallOpacity: number;
  /** Preview Fotorrealista: liga postprocessing (SSAO + Bloom + Vignette). */
  cinematic?: boolean;
  /** Horário do dia — controla sol, céu e ambiente. */
  daytime?: "morning" | "noon" | "golden" | "night";
}

export const DEFAULT_VIEWPORT_3D: Viewport3DState = {
  camera: "orbit",
  render: "solid",
  showGrid: true,
  showAxes: true,
  view: "perspectiva",
  showLights: true,
  sectionHeight: null,
  explode: 0,
  wallHeight: 2700,
  wallOpacity: 1,
  cinematic: false,
  daytime: "noon",
};