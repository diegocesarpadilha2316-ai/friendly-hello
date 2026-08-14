/**
 * Fase 3.14 — Produção Industrial (aditivo).
 * Nenhum tipo persistido. Deriva de ProductionReport + FabricationPlan.
 */

export interface OffcutInventoryItem {
  id: string;
  tenantId: string;
  projectId: string;
  projectName: string;
  material: string;
  brand: string;
  color: string;
  thicknessMm: number;
  lengthMm: number;
  widthMm: number;
  areaM2: number;
  createdAt: string;
  origin: "plano-corte" | "manual";
  status: "disponivel" | "reservado" | "consumido";
  notes?: string;
}

export type AssemblyStepKind =
  | "separacao"
  | "furacao"
  | "cavilha"
  | "minifix"
  | "estrutura"
  | "fundo"
  | "prateleira"
  | "porta"
  | "gaveta"
  | "puxador"
  | "ferragem"
  | "regulagem"
  | "conferencia";

export interface AssemblyStep {
  order: number;
  furnitureId: string;
  furnitureLabel: string;
  kind: AssemblyStepKind;
  title: string;
  description: string;
  estimatedMinutes: number;
  toolset: readonly string[];
  partCodes: readonly string[];
}

export interface AssemblyPlan {
  steps: readonly AssemblyStep[];
  totalMinutes: number;
  totalSteps: number;
}

export interface IndustrialCostRow {
  id: string;
  group:
    | "material"
    | "ferragens"
    | "mao-obra"
    | "tempo"
    | "desperdicio"
    | "overhead"
    | "lucro"
    | "imposto";
  label: string;
  value: number;
  hint: string;
}

export interface IndustrialCostSummary {
  rows: readonly IndustrialCostRow[];
  cost: number;
  overhead: number;
  margin: number;
  taxes: number;
  final: number;
  marginPct: number;
  costPerM2: number;
  pricePerM2: number;
}

export interface OptimizerCompare {
  before: { boards: number; usagePct: number; wasteM2: number };
  after: { boards: number; usagePct: number; wasteM2: number };
  diff: { boards: number; usagePct: number; wasteM2: number };
  economyBRL: number;
}

export type IndustrialIntentId =
  | "ind.pior-peca"
  | "ind.economizar-chapa"
  | "ind.reduzir-custo"
  | "ind.reaproveitar"
  | "ind.economia-total"
  | "ind.tempo-fabrica"
  | "ind.gargalo";

export interface IndustrialIntent {
  id: IndustrialIntentId;
  question: string;
  patterns: readonly string[];
  answer: string;
}

export interface BoardPieceState {
  code: string;
  locked: boolean;
  pinned: boolean;
  rotated: boolean;
}
