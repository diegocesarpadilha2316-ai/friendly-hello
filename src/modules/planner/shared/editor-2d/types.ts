/**
 * Tipos internos do Editor 2D (Fase 3.2).
 *
 * Estes tipos existem apenas na camada de apresentação do editor e são
 * derivados dos `PlannerParametricNode` já persistidos pelo domínio
 * (Fase 3.1). Nenhuma nova store/provider — o estado do documento
 * continua sob `PlannerEditorProvider` do Core do módulo.
 */
export type Editor2DTool =
  | "select"
  | "pan"
  | "wall"
  | "door"
  | "window"
  | "floor"
  | "ceiling"
  | "guide";

export type Editor2DLayerId =
  | "walls"
  | "openings"
  | "floors"
  | "ceilings"
  | "guides";

export interface Editor2DLayerState {
  id: Editor2DLayerId;
  label: string;
  visible: boolean;
  locked: boolean;
}

export interface Editor2DViewport {
  /** origem X do viewBox em mm */
  x: number;
  /** origem Y do viewBox em mm */
  y: number;
  /** largura visível em mm */
  w: number;
  /** altura visível em mm */
  h: number;
}

/** Primitiva 2D reconstruída a partir de `PlannerParametricNode.params`. */
export type Editor2DPrimitive =
  | {
      id: string;
      kind: "wall";
      layer: Editor2DLayerId;
      locked: boolean;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      thickness: number;
    }
  | {
      id: string;
      kind: "opening";
      role: "door" | "window";
      layer: Editor2DLayerId;
      locked: boolean;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
    }
  | {
      id: string;
      kind: "floor" | "ceiling";
      layer: Editor2DLayerId;
      locked: boolean;
      x: number;
      y: number;
      width: number;
      depth: number;
    }
  | {
      id: string;
      kind: "guide";
      layer: Editor2DLayerId;
      locked: boolean;
      axis: "h" | "v";
      pos: number;
    };

export interface Editor2DDraft {
  tool: Exclude<Editor2DTool, "select" | "pan">;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
