/**
 * Fase 3.13 — Motor de Fabricação / Plano de Corte Inteligente / CNC.
 *
 * Camada arquitetural aditiva sobre o domínio de Produção. Nenhum tipo
 * novo é persistido — todos derivam dos dados paramétricos existentes
 * (`PlannerProject` → engenharia → produção). Zero providers, zero
 * stores, zero migrations.
 */
import type {
  CuttingBoard,
  CuttingBoardSpec,
  CuttingPlacement,
  CutListRow,
  ProductionPart,
} from "../../types";

// ─── Otimizador v2 ─────────────────────────────────────────────

export interface OptimizerConstraints {
  /** margem de segurança em todo o perímetro da chapa (mm) */
  marginMm: number;
  /** largura da serra (kerf) (mm) */
  kerfMm: number;
  /** permite girar 90° peças de veio livre */
  allowRotation: boolean;
  /** aceita reaproveitar sobra útil de chapas anteriores */
  reuseOffcuts: boolean;
  /** área mínima de uma sobra para ser útil (m²) */
  minOffcutM2: number;
}

export const DEFAULT_OPTIMIZER_CONSTRAINTS: OptimizerConstraints = {
  marginMm: 10,
  kerfMm: 4,
  allowRotation: true,
  reuseOffcuts: true,
  minOffcutM2: 0.15,
};

export interface FabricationBoard extends CuttingBoard {
  /** sobra útil (retalhos ≥ minOffcutM2) desta chapa */
  offcuts: readonly OffcutRect[];
  /** ordem sugerida de corte (guilhotina) */
  cutOrder: readonly number[];
}

export interface OffcutRect {
  x: number;
  y: number;
  w: number;
  h: number;
  areaM2: number;
}

export interface FabricationPlan {
  boards: readonly FabricationBoard[];
  constraints: OptimizerConstraints;
  totals: {
    boardsCount: number;
    usedAreaM2: number;
    wasteAreaM2: number;
    offcutAreaM2: number;
    /** aproveitamento efetivo = used / (used+waste), sem contar sobra útil */
    avgUsageRatio: number;
    /** aproveitamento total = (used+offcut) / board, considerando reuso */
    effectiveRatio: number;
    totalCuts: number;
    grainRespectedPct: number;
  };
  /** peças que não couberam em nenhuma chapa (diagnóstico) */
  unplaced: readonly { code: string; reason: string }[];
}

// ─── Furações & Usinagem ───────────────────────────────────────

export type DrillOpKind =
  | "minifix-cabeca"
  | "minifix-corpo"
  | "cavilha"
  | "confirmat"
  | "dobradica-copo"
  | "dobradica-fixacao"
  | "corredica-fixacao"
  | "perfil-canal"
  | "led-canal"
  | "puxador-passante"
  | "furacao-livre";

export interface DrillOp {
  id: string;
  partCode: string;
  kind: DrillOpKind;
  face: "F1" | "F2" | "T" | "B" | "L" | "R";
  x: number;
  y: number;
  diameterMm: number;
  depthMm: number;
  angleDeg?: number;
  tool: string;
  notes?: string;
}

export interface DrillingSheet {
  partCode: string;
  partName: string;
  ops: readonly DrillOp[];
  totalHoles: number;
  estimatedSeconds: number;
}

// ─── Máquinas & Pós-processadores ──────────────────────────────

export type CamFormat = "gcode" | "dxf" | "nc" | "bpp" | "cix" | "xxl" | "cid3" | "iso" | "mpr";

export type MachineVendor = "Homag" | "Biesse" | "SCM" | "Felder" | "Casadei" | "Genérico";

export type MachineFamily =
  "seccionadora" | "coladeira" | "furadeira" | "router" | "centro-usinagem" | "nesting";

export interface FabricationMachine {
  id: string;
  vendor: MachineVendor;
  model: string;
  family: MachineFamily;
  formats: readonly CamFormat[];
  workAreaMm: { x: number; y: number; z: number };
  spindleRpm?: number;
  toolChanger?: boolean;
  status: "planejado" | "beta" | "indisponivel";
  tags: readonly string[];
}

export interface PostProcessorPreview {
  code: string;
  machineId: string;
  format: CamFormat;
  header: string;
  body: string;
  footer: string;
  operationsCount: number;
  estimatedMinutes: number;
}

// ─── Dashboard de Fabricação ───────────────────────────────────

export interface FabricationKPI {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: "info" | "success" | "warning" | "muted";
}

// ─── IA (intenção → resposta local) ────────────────────────────

export type FabricationIntentId =
  | "fab.custo"
  | "fab.chapas"
  | "fab.desperdicio"
  | "fab.aproveitamento"
  | "fab.tempo"
  | "fab.material"
  | "fab.melhorar-corte";

export interface FabricationIntent {
  id: FabricationIntentId;
  question: string;
  patterns: readonly string[];
  answer: string;
}

// ─── Exportações estendidas ────────────────────────────────────

export type FabricationExportFormat =
  | "pdf-plano"
  | "pdf-etiquetas"
  | "dxf-plano"
  | "gcode-lote"
  | "nc-lote"
  | "bpp-lote"
  | "csv-corte"
  | "xlsx-fabricacao";

export interface FabricationExportSpec {
  format: FabricationExportFormat;
  label: string;
  description: string;
  extension: string;
  mime: string;
  target: "escritorio" | "cnc" | "producao";
}

// ─── Re-export utilitário ──────────────────────────────────────

export type { CutListRow, CuttingBoardSpec, CuttingPlacement, ProductionPart };
