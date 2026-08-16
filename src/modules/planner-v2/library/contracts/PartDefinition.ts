import type { GrainDirection } from "./MaterialDefinition";

export type EdgeBand = "top" | "bottom" | "left" | "right" | "front" | "back";

export type PartVolumeType = "physical" | "opening" | "technical" | "safety";

export type HardwareGeometry =
  | { kind: "box" }
  | { kind: "cylinder"; radiusMm: number; radialSegments?: number }
  | { kind: "gola"; lipMm: number; recessMm: number }
  | { kind: "cava"; lipMm: number; recessMm: number }
  | { kind: "profile"; radiusMm: number };

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
  /** Identificador da FurnitureInstance que possui esta peça. */
  parentInstanceId?: string;
  role: PartRole;
  name: string;
  dimensionsMm: { width: number; height: number; depth: number };
  /** Centro da peça, relativo à origem do módulo (centro da base, Y=0 no piso do módulo). */
  positionMm: { x: number; y: number; z: number };
  /** Centro da dobradiça/pivot no sistema local do módulo, quando aplicável. */
  pivotMm?: { x: number; y: number; z: number };
  rotationDeg: { x: number; y: number; z: number };
  materialId: string;
  /** Categoria técnica resolvida do material, por exemplo mdf, stone ou metal. */
  materialType?: string;
  /** Espessura física da peça, resolvida da ficha de material/perfil do módulo. */
  thicknessMm?: number;
  grainDirection?: GrainDirection;
  edgeBanding?: Partial<Record<EdgeBand, string>>;
  hardwareId?: string;
  /** Geometria visual específica de ferragem; ausente mantém o box legado. */
  hardwareGeometry?: HardwareGeometry;
  /** Classifica o envelope usado em colisão e análise técnica. */
  volumeType?: PartVolumeType;
  /** Folga adicional usada para segurança/trajectória de abertura. */
  clearanceMm?: number;
  /** Agrupa peças que se movem juntas (ex.: caixa da gaveta). */
  groupId?: string;
  interactive?: {
    type: "door" | "drawer" | "flap" | "none";
    hingeSide?: "left" | "right";
    maxOpenAngleDeg?: number;
    maxTravelMm?: number;
  };
}
