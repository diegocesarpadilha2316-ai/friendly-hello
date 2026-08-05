export type HardwareCategory =
  | "hinge"
  | "slide"
  | "handle"
  | "leg"
  | "shelf-support"
  | "piston"
  | "rod"
  | "led";

export interface HardwareDefinition {
  id: string;
  name: string;
  category: HardwareCategory;
  manufacturer?: string;
  dimensionsMm: { width: number; height: number; depth: number };
  /** Onde a ferragem é instalada dentro do módulo. */
  installation: "door" | "drawer" | "front" | "carcass" | "base" | "interior";
  /** Papéis de peça compatíveis. */
  compatibleRoles: string[];
  /** Representação 3D simplificada opcional. */
  mesh3d?: "box" | "cylinder" | "profile" | "none";
  costBrl?: number;
}
