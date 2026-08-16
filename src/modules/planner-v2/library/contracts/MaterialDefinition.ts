export type MaterialCategory = "mdf" | "glass" | "mirror" | "stone" | "metal";
export type MaterialFinish = "matte" | "satin" | "gloss" | "textured";
export type GrainDirection = "vertical" | "horizontal" | "none";
export type StoneType =
  "quartz" | "marble" | "granite" | "quartzite" | "porcelain" | "solid-surface";
export type StoneFinish = "honed" | "polished" | "leathered" | "matte";

export interface MaterialMapSet {
  baseColorUrl?: string;
  normalUrl?: string;
  roughnessUrl?: string;
  metalnessUrl?: string;
  aoUrl?: string;
  heightUrl?: string;
}

export interface UVTransform {
  scaleX: number;
  scaleY: number;
  rotationDeg: number;
  offsetX: number;
  offsetY: number;
}

export interface MaterialDefinition {
  id: string;
  name: string;
  category: MaterialCategory;
  baseColor: string;
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness?: number;
  textureUrl?: string;
  normalUrl?: string;
  bumpUrl?: string;
  normalScale: number;
  bumpScale?: number;
  grain: GrainDirection;
  textureScale: number;
  textureRotationDeg?: number;
  uvRepeat?: { x: number; y: number };
  intensity?: number;
  finish: MaterialFinish;
  /** Papéis de peça em que este material pode ser aplicado. */
  allowedRoles: string[];
  /** Metadados de catálogo; preenchidos apenas quando confirmados em fonte oficial. */
  manufacturer?: string;
  collection?: string;
  pattern?: string;
  availableThicknessesMm?: number[];
  /** Espessura padrão usada quando o projeto não informa um perfil explícito. */
  defaultThicknessMm?: number;
  /** Espessura padrão de fundos quando o material é aplicado a painéis de fundo. */
  defaultBackThicknessMm?: number;
  sheetDimensionsMm?: { width: number; height: number };
  moistureResistance?: boolean;
  fireResistance?: boolean;
  faceCount?: 1 | 2;
  sourceUrl?: string;
  verifiedAt?: string;
  catalogStatus?: "verified" | "unverified" | "discontinued";
  transparent?: boolean;
  opacity?: number;
  maps?: MaterialMapSet;
  uvTransform?: UVTransform;
  physicalSizeMm?: { x: number; y: number };
  environmentResponse?: number;
  stone?: {
    type: StoneType;
    finish: StoneFinish;
    physicalScaleMm: { x: number; y: number };
    veinDirection: "length" | "width" | "diagonal" | "none";
    veinScale: number;
    thicknessMm: number;
    edgeProfile: "square" | "eased" | "waterfall";
  };
}
