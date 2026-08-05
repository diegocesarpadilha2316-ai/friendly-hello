export type MaterialCategory = "mdf" | "glass" | "mirror" | "stone" | "metal";
export type MaterialFinish = "matte" | "satin" | "gloss" | "textured";
export type GrainDirection = "vertical" | "horizontal" | "none";

export interface MaterialDefinition {
  id: string;
  name: string;
  category: MaterialCategory;
  baseColor: string;
  roughness: number;
  metalness: number;
  clearcoat: number;
  normalScale: number;
  textureUrl?: string;
  grain: GrainDirection;
  textureScale: number;
  finish: MaterialFinish;
  /** Papéis de peça em que este material pode ser aplicado. */
  allowedRoles: string[];
  transparent?: boolean;
  opacity?: number;
}
