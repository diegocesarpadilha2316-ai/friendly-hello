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
  /** Abrir portas de todos os armários (toolbar do editor). */
  openDoors?: boolean;
  /** Abrir gavetas de todos os móveis (toolbar do editor). */
  openDrawers?: boolean;
  /**
   * Auto-esconde o teto durante a edição para o usuário sempre enxergar o
   * ambiente. O teto volta automaticamente no modo Foto (cinematic).
   */
  autoHideCeiling?: boolean;
  /**
   * Fade automático das paredes que ficam ENTRE a câmera e o centro do
   * ambiente (regra de "corte inteligente"): mantém a visão aberta em
   * qualquer ângulo, sem o usuário mexer em nada.
   */
  autoFadeNearWalls?: boolean;
  /**
   * Sinal para o viewport reenquadrar automaticamente a cena inteira.
   * Incrementado sempre que um novo projeto é gerado pela IA, para que a
   * câmera "apresente" o ambiente completo sem entrar em parede/teto.
   */
  autoFitVersion?: number;
  /**
   * Gatilho para reenquadrar especificamente o item selecionado.
   * Usado pela IA após criar um móvel para garantir que ele está visível.
   */
  focusTick?: number;
}

export const DEFAULT_VIEWPORT_3D: Viewport3DState = {
  camera: "orbit",
  render: "material",
  showGrid: true,
  showAxes: true,
  view: "perspectiva",
  showLights: true,
  sectionHeight: null,
  explode: 0,
  wallHeight: 2700,
  wallOpacity: 1,
  cinematic: true,
  daytime: "noon",
  openDoors: false,
  openDrawers: false,
  autoHideCeiling: true,
  autoFadeNearWalls: true,
  autoFitVersion: 0,
  focusTick: 0,
};