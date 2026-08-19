import type { AnyHardwareManufacturingVariant } from "./HardwareManufacturingSpec";

export type HardwareCategory =
  "hinge" | "slide" | "handle" | "leg" | "shelf-support" | "piston" | "rod" | "led" | "accessory" | "profile" | "connector";

export interface HardwareDefinition {
  id: string;
  name: string;
  category: HardwareCategory;
  manufacturer?: string;
  dimensionsMm: { width: number; height: number; depth: number };
  /** Onde a ferragem é instalada dentro do módulo. */
  installation: "door" | "drawer" | "front" | "carcass" | "base" | "interior" | "countertop";
  /** Papéis de peça compatíveis. */
  compatibleRoles: string[];
  /** Representação 3D simplificada opcional. */
  mesh3d?: "box" | "cylinder" | "profile" | "gola" | "cava" | "none";
  /** Acabamento visual para material PBR e auditoria do catálogo. */
  finish?:
    "aluminio-anodizado" | "aluminio-anodizado-preto" | "inox-escovado" | "preto-fosco" | "grafite" | "champagne" | "polimero";
  costBrl?: number;
  /** Variantes industriais verificadas; o hardware genérico pode não possuir nenhuma. */
  manufacturingVariants?: AnyHardwareManufacturingVariant[];
}
