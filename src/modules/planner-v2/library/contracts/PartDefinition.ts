export type PartRole =
  | "side-left"
  | "side-right"
  | "base"
  | "top"
  | "shelf"
  | "back"
  | "door"
  | "drawer-front"
  | "drawer-side"
  | "drawer-bottom"
  | "divider"
  | "toe-kick"
  | "countertop"
  | "decorative"
  | "hardware";

export interface PartDefinition {
  id: string;
  moduleId: string;
  role: PartRole;
  name: string;
  dimensionsMm: { width: number; height: number; depth: number };
  /** Centro da peça, relativo à origem do módulo (centro da base, Y=0 no piso do módulo). */
  positionMm: { x: number; y: number; z: number };
  rotationDeg: { x: number; y: number; z: number };
  materialId: string;
  edgeBanding?: { top?: string; bottom?: string; left?: string; right?: string };
  /** Agrupa peças que se movem juntas (ex.: caixa da gaveta). */
  groupId?: string;
  interactive?: {
    type: "door" | "drawer" | "none";
    hingeSide?: "left" | "right";
    maxOpenAngleDeg?: number;
    maxTravelMm?: number;
  };
}
