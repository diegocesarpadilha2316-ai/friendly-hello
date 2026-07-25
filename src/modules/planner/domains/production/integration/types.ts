/**
 * Fase 3.32 — Produção Industrial Final Enterprise.
 *
 * Camada 100% ADITIVA. Tipos derivados dos subdomínios existentes
 * (Production, Planning, Industrial, Fabrication, Nesting, CNC,
 * Intelligence). Zero providers, zero stores, zero migrations.
 */
import type { NestingAlgorithm, NestingComparison, NestingPlan } from "../services/nesting";
import type { CncFormat, CncProgram } from "../services/cnc";
import type { FabricationPlan } from "../services/fabrication";
import type { AssemblyPlan, IndustrialCostSummary, OffcutInventoryItem } from "../services/industrial";
import type {
  CapacitySnapshot,
  DeliveryEstimate as FactoryDelivery,
  FactoryAlert,
  FactoryKPI,
  MachineBalance,
  OperatorAssignment,
  PrioritizedOrder,
  ProductionQueue,
  QualityChecklist,
  RoutingPlan,
} from "../services/intelligence";
import type {
  CapacityWindow,
  MrpSummary,
  PlanningOrder,
  ScheduleEntry,
  DeliveryEstimate as PlanningDelivery,
} from "../services/planning";
import type { ProductionOrder, ProductionReport } from "../types";

export interface NestingSelection {
  readonly best: NestingPlan;
  readonly runners: readonly NestingComparison[];
  readonly winnerAlgorithm: NestingAlgorithm;
  readonly reason: string;
}

export interface CncManifestEntry {
  readonly machineId: string;
  readonly machineLabel: string;
  readonly format: CncFormat;
  readonly programs: readonly CncProgram[];
  readonly totalMin: number;
  readonly totalOps: number;
}

export interface CncManifest {
  readonly primaryMachineId: string;
  readonly entries: readonly CncManifestEntry[];
  readonly totalPrograms: number;
  readonly totalMinutes: number;
}

export interface FinalKPI {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly hint: string;
  readonly group: "producao" | "fabrica" | "financeiro" | "corte" | "cnc" | "logistica";
  readonly tone: "info" | "success" | "warning" | "muted";
}

export interface FinalAiIntentInput {
  readonly prompt: string;
}

export interface FinalAiAnswer {
  readonly question: string;
  readonly answer: string;
  readonly confidence: "alta" | "media" | "baixa";
  readonly source: readonly string[];
}

export type FinalExportFormat =
  | "manifesto-cnc"
  | "relatorio-industrial-pdf"
  | "plano-corte-csv"
  | "plano-corte-dxf"
  | "mrp-xlsx"
  | "cnc-lote-zip"
  | "kpis-json";

export interface FinalExportSpec {
  readonly format: FinalExportFormat;
  readonly label: string;
  readonly description: string;
  readonly extension: string;
  readonly mime: string;
  readonly target: "escritorio" | "cnc" | "producao" | "logistica";
}

/**
 * Bundle industrial completo — snapshot determinístico produzido pelo
 * `industrial-builder`. Reutiliza todos os relatórios já existentes.
 */
export interface IndustrialBundle {
  readonly generatedAt: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly clientName: string;

  readonly production: ProductionReport;
  readonly orders: readonly ProductionOrder[];

  readonly fabrication: FabricationPlan | null;
  readonly nesting: NestingSelection | null;
  readonly offcuts: readonly OffcutInventoryItem[];

  readonly cnc: CncManifest;

  readonly assembly: AssemblyPlan;
  readonly cost: IndustrialCostSummary | null;

  readonly capacity: CapacitySnapshot | null;
  readonly balance: MachineBalance | null;
  readonly assignments: readonly OperatorAssignment[];
  readonly routings: readonly RoutingPlan[];
  readonly quality: QualityChecklist | null;
  readonly queues: readonly ProductionQueue[];
  readonly prioritized: readonly PrioritizedOrder[];
  readonly factoryDelivery: FactoryDelivery | null;
  readonly factoryAlerts: readonly FactoryAlert[];
  readonly factoryKpis: readonly FactoryKPI[];

  readonly planningOrders: readonly PlanningOrder[];
  readonly mrp: MrpSummary;
  readonly capacityWindow: CapacityWindow;
  readonly schedule: readonly ScheduleEntry[];
  readonly planningDelivery: readonly PlanningDelivery[];

  readonly kpis: readonly FinalKPI[];
}