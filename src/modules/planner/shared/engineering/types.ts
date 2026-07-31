/**
 * Engenharia de Marcenaria — Fase 3.5.
 *
 * Tipos-fonte da parametrização de fabricação. Vivem sobre a MESMA
 * primitiva `furniture` (kind:"module", role:"furniture") persistida
 * pelo motor paramétrico das Fases 3.1/3.4 — nada é duplicado.
 * Toda propriedade extra é serializada em `params` (prefixo `eng:`)
 * pelas rotinas de `parameters.ts`.
 */
export type BackKind = "pregado" | "encaixado" | "canal" | "rebaixado";
export type BaseKind = "rodape" | "pe" | "suspenso";
export type AssemblyKind = "minifix" | "cavilha" | "parafuso" | "confirmat";
export type DoorKind = "lisa" | "vidro" | "espelhada" | "moldurada" | "sem-porta";
export type DrawerKind = "padrao" | "americana" | "grande" | "sem-gaveta";
export type HandleKind = "cava" | "perfil" | "puxador" | "tip-on";
export type EdgeKind = "pvc-0-45" | "pvc-1-0" | "abs" | "aluminio" | "sem-fita";
export type GrainDirection = "vertical" | "horizontal" | "livre";

export interface MaterialThickness {
  /** espessura em mm */
  mm: number;
  /** código interno (SKU do fabricante) */
  code?: string;
}

export interface MaterialFinish {
  id: string;
  label: string;
  /** cor aproximada para preview 3D (hex ou nome de token) */
  swatch?: string;
  texture?: string;
  grain?: GrainDirection;
}

export interface MaterialBrand {
  id: string;
  label: string;
  country?: string;
  website?: string;
  category: "MDF" | "MDP" | "Compensado" | "Melamínico";
  thicknesses: readonly MaterialThickness[];
  finishes: readonly MaterialFinish[];
  updatedAt: string;
}

export type HardwareKind =
  | "dobradica"
  | "corredica"
  | "pistao"
  | "trilho"
  | "cabideiro"
  | "perfil"
  | "puxador"
  | "amortecedor";

export interface HardwareItem {
  id: string;
  brand: string;
  kind: HardwareKind;
  label: string;
  code?: string;
  /** capacidade nominal (kg) quando aplicável */
  capacityKg?: number;
  /** medida nominal (mm) — comprimento, curso, diâmetro etc. */
  sizeMm?: number;
  notes?: string;
}

/**
 * Regras de fabricação de UMA empresa. Persistidas em `localStorage`
 * pela camada `company-rules.ts`; jamais criam um provider próprio.
 * A ordem dos campos preserva a ordem apresentada no editor de regras.
 */
export interface CompanyManufacturingRules {
  tenantId: string;
  label: string;
  defaults: {
    thicknessMm: number;
    backThicknessMm: number;
    clearanceMm: number;
    reveal: number;
    edge: EdgeKind;
    grain: GrainDirection;
    back: BackKind;
    base: BaseKind;
    assembly: AssemblyKind;
    door: DoorKind;
    drawer: DrawerKind;
    handle: HandleKind;
    /** marca preferencial de chapa */
    brandId: string;
    /** acabamento default (id do MaterialFinish) */
    finishId: string;
    /** ferragens preferenciais por tipo */
    hardware: Partial<Record<HardwareKind, string>>;
  };
  updatedAt: string;
}

/**
 * Parâmetros de engenharia consolidados de UM móvel — resultado da
 * fusão entre padrão da empresa + overrides do item + overrides do usuário.
 * Nunca são persistidos como bloco; vivem serializados em `params.eng:*`.
 */
export interface FurnitureEngineeringParams {
  thicknessMm: number;
  backThicknessMm: number;
  clearanceMm: number;
  reveal: number;
  edge: EdgeKind;
  grain: GrainDirection;
  back: BackKind;
  base: BaseKind;
  assembly: AssemblyKind;
  door: DoorKind;
  drawer: DrawerKind;
  handle: HandleKind;
  brandId: string;
  finishId: string;
  hardware: Partial<Record<HardwareKind, string>>;
  /** número de prateleiras internas (0 = nenhuma) */
  shelves: number;
  /** número de gavetas frontais (0 = nenhuma) */
  drawers: number;
  /** número de portas frontais (0 = nenhuma) */
  doors: number;
  /** iluminação embutida (id ou "") */
  lighting: string;
  /** rotação/espelhamento do móvel */
  mirrored: boolean;
}

export type PartKind =
  | "lateral"
  | "base"
  | "tampo"
  | "prateleira"
  | "divisoria"
  | "porta"
  // Frentes fixas: parecem porta, mas não têm mecanismo. Ver
  // construction/classification.ts para a taxonomia completa.
  | "frente-fixa"
  | "tapa-vao"
  | "gaveta-frente"
  | "gaveta-lateral"
  | "gaveta-fundo"
  | "gaveta-base"
  | "fundo"
  | "rodape"
  | "travessa"
  | "fita-borda";

export interface FurniturePart {
  id: string;
  kind: PartKind;
  label: string;
  /** dimensões nominais em mm */
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  /** quantidade produzida */
  qty: number;
  material: string;
  finish: string;
  grain: GrainDirection;
  /** metros lineares de fita para peças de fita-borda */
  edgeMeters?: number;
  /** dica para plano de corte / IA */
  notes?: string;
}