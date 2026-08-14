/**
 * Dioris Produção Inteligente — Fase 3.11.
 *
 * Tipos privados do domínio. Toda a saída é derivada dos dados
 * paramétricos existentes (`PlannerProject` → `Editor2DPrimitive`
 * `kind:furniture`) via `decomposeFurniture` — nenhuma duplicação de
 * motor, store ou provider.
 */
import type { FurniturePart, HardwareKind } from "@/modules/planner/shared/engineering/types";

// ─── Peças agregadas ────────────────────────────────────────────

export type ProductionPartCategory =
  | "lateral"
  | "base"
  | "tampo"
  | "fundo"
  | "travessa"
  | "prateleira"
  | "divisoria"
  | "porta"
  | "frente"
  | "gaveta"
  | "rodape"
  | "painel"
  | "ripado"
  | "nicho"
  | "bancada"
  | "vidro"
  | "perfil"
  | "ferragem"
  | "iluminacao"
  | "outro";

export interface ProductionPart extends FurniturePart {
  /** categoria alto-nível para o Studio (agrupamento visual) */
  category: ProductionPartCategory;
  /** referência ao móvel de origem */
  furnitureId: string;
  furnitureLabel: string;
  roomId: string;
  roomLabel: string;
  environmentId: string;
  /** área de chapa em m² para 1 unidade */
  areaM2: number;
  /** peso estimado em kg (1 unidade) */
  weightKg: number;
  /** fita de borda em metros lineares (perímetro × peças com fita) */
  edgeMetersEach: number;
}

// ─── Lista de corte ─────────────────────────────────────────────

export interface CutListRow {
  code: string;
  name: string;
  material: string;
  brand: string;
  thicknessMm: number;
  lengthMm: number;
  widthMm: number;
  qty: number;
  grain: string;
  edges: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  edgeTape: string;
  weightKg: number;
  areaM2: number;
  notes?: string;
}

// ─── Plano de corte ─────────────────────────────────────────────

export interface CuttingBoardSpec {
  brand: string;
  material: string;
  thicknessMm: number;
  lengthMm: number;
  widthMm: number;
}

export interface CuttingPlacement {
  code: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotated: boolean;
  grainRespected: boolean;
}

export interface CuttingBoard {
  index: number;
  spec: CuttingBoardSpec;
  placements: readonly CuttingPlacement[];
  usageRatio: number;
  wasteM2: number;
  usedM2: number;
}

export interface CuttingPlan {
  boards: readonly CuttingBoard[];
  totals: {
    boardsCount: number;
    usedAreaM2: number;
    wasteAreaM2: number;
    avgUsageRatio: number;
  };
}

// ─── Ferragens (BOM) ────────────────────────────────────────────

export type HardwareBomKind =
  HardwareKind | "parafuso" | "minifix" | "cavilha" | "confirmat" | "led" | "transformador";

export interface HardwareBomRow {
  kind: HardwareBomKind;
  brand: string;
  code: string;
  label: string;
  qty: number;
  unit: "pc" | "m" | "kit";
  unitPrice: number;
  total: number;
}

// ─── Orçamento ──────────────────────────────────────────────────

export interface BudgetLine {
  id: string;
  group: "materiais" | "ferragens" | "mao-obra" | "pintura" | "montagem" | "entrega";
  label: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface BudgetSummary {
  subtotal: number;
  overhead: number;
  margin: number;
  taxes: number;
  final: number;
  perM2: number;
}

export interface Budget {
  lines: readonly BudgetLine[];
  summary: BudgetSummary;
  parameters: {
    overheadPct: number;
    marginPct: number;
    taxPct: number;
    laborRatePerHour: number;
    deliveryFlat: number;
  };
}

// ─── Tempo ──────────────────────────────────────────────────────

export interface TimeBreakdown {
  cuttingH: number;
  machiningH: number;
  assemblyH: number;
  finishingH: number;
  totalH: number;
}

// ─── Produção (fluxo) ───────────────────────────────────────────

export type ProductionStageId =
  "fila" | "separacao" | "producao" | "montagem" | "conferencia" | "expedicao" | "entrega";

export interface ProductionStage {
  id: ProductionStageId;
  label: string;
  order: number;
  color: string;
  description: string;
}

export interface ProductionOrder {
  id: string;
  code: string;
  projectId: string;
  clientName: string;
  stage: ProductionStageId;
  createdAt: string;
  eta: string;
  progress: number;
  parts: number;
}

// ─── Etiquetas ──────────────────────────────────────────────────

export interface PartLabel {
  code: string;
  qrPayload: string;
  barcodePayload: string;
  projectName: string;
  clientName: string;
  environmentLabel: string;
  roomLabel: string;
  moduleLabel: string;
  partLabel: string;
  position: string;
  dimensions: string;
  material: string;
  edgeTape: string;
}

// ─── Exportação ─────────────────────────────────────────────────

export type ProductionExportFormat = "pdf" | "excel" | "csv" | "xml" | "json";

export interface ProductionExportSpec {
  format: ProductionExportFormat;
  label: string;
  description: string;
  extension: string;
  mime: string;
}

// ─── CNC ────────────────────────────────────────────────────────

export type CncMachineKind = "seccionadora" | "coladeira" | "furadeira" | "router";

export interface CncTargetMachine {
  id: string;
  brand: string;
  model: string;
  kind: CncMachineKind;
  formats: readonly ("gcode" | "dxf" | "nc" | "cix" | "xxl")[];
  status: "planejado" | "beta" | "indisponivel";
}

export interface CncJobPreview {
  code: string;
  machineId: string;
  format: "gcode" | "dxf";
  operations: readonly string[];
  estimatedMinutes: number;
}

// ─── ERP ────────────────────────────────────────────────────────

export type ErpProviderId = "tiny" | "bling" | "omie" | "conta-azul" | "sap" | "totvs";

export interface ErpProvider {
  id: ErpProviderId;
  label: string;
  category: "nacional" | "enterprise";
  status: "planejado" | "beta" | "indisponivel";
  scopes: readonly string[];
}

// ─── Comandos IA ────────────────────────────────────────────────

export type ProductionAiCommandId =
  | "producao.gerar"
  | "producao.lista-corte"
  | "producao.orcamento"
  | "producao.etiquetas"
  | "producao.plano-corte"
  | "producao.cnc";

export interface ProductionAiCommand {
  id: ProductionAiCommandId;
  label: string;
  description: string;
  hint: string;
}

// ─── Resultado agregado do domínio ──────────────────────────────

export interface ProductionReport {
  generatedAt: string;
  parts: readonly ProductionPart[];
  cutList: readonly CutListRow[];
  cuttingPlan: CuttingPlan;
  hardware: readonly HardwareBomRow[];
  budget: Budget;
  time: TimeBreakdown;
  labels: readonly PartLabel[];
  totals: {
    modules: number;
    parts: number;
    boardsM2: number;
    edgeMeters: number;
    weightKg: number;
  };
}

export interface ProductionDashboardKPI {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: "info" | "success" | "warning" | "muted";
}
