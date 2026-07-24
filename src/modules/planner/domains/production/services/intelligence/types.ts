/**
 * Fase 3.15 — Produção Inteligente Enterprise (Fábrica 4.0).
 *
 * Camada 100% aditiva. Deriva de ProductionReport + FabricationPlan +
 * IndustrialCostSummary + AssemblyPlan. Zero providers, zero stores,
 * zero migrations. Todas as saídas são readonly e determinísticas.
 */

// ─── Máquinas & Operadores (catálogo determinístico) ───────────

export type FactoryMachineKind =
  | "seccionadora"
  | "coladeira"
  | "furadeira"
  | "router"
  | "montagem"
  | "embalagem";

export interface FactoryMachine {
  id: string;
  label: string;
  kind: FactoryMachineKind;
  /** capacidade em peças por hora (nominal) */
  throughputPh: number;
  /** disponibilidade em % (0..1) */
  availability: number;
  status: "ativa" | "manutencao" | "ociosa";
}

export type OperatorSkill =
  | "corte"
  | "usinagem"
  | "montagem"
  | "acabamento"
  | "conferencia"
  | "embalagem"
  | "logistica";

export interface FactoryOperator {
  id: string;
  name: string;
  shift: "manha" | "tarde" | "noite";
  skills: readonly OperatorSkill[];
  /** eficiência 0..1 */
  efficiency: number;
  /** carga atual em horas do dia */
  loadH: number;
  status: "disponivel" | "ocupado" | "afastado";
}

// ─── Prioridade & Roteamento ───────────────────────────────────

export type PriorityLevel = "urgente" | "alta" | "normal" | "baixa";

export interface PrioritizedOrder {
  orderId: string;
  code: string;
  clientName: string;
  priority: PriorityLevel;
  score: number;
  reason: string;
  parts: number;
  progress: number;
  eta: string;
  delayedDays: number;
}

export type RoutingStage =
  | "corte"
  | "coladeira"
  | "usinagem"
  | "montagem"
  | "conferencia"
  | "embalagem"
  | "expedicao";

export interface RoutingStep {
  stage: RoutingStage;
  label: string;
  machineId: string | null;
  operatorId: string | null;
  minutes: number;
  order: number;
}

export interface RoutingPlan {
  moduleId: string;
  moduleLabel: string;
  steps: readonly RoutingStep[];
  totalMinutes: number;
}

// ─── Filas de produção ─────────────────────────────────────────

export type QueueKind =
  | "producao"
  | "cnc"
  | "montagem"
  | "embalagem"
  | "entrega";

export interface QueueTicket {
  id: string;
  code: string;
  label: string;
  clientName: string;
  priority: PriorityLevel;
  minutes: number;
  progress: number;
  status: "pendente" | "em-execucao" | "concluido";
}

export interface ProductionQueue {
  kind: QueueKind;
  label: string;
  tickets: readonly QueueTicket[];
  totalMinutes: number;
  capacityMinutes: number;
  loadPct: number;
}

// ─── Capacidade ────────────────────────────────────────────────

export interface CapacitySnapshot {
  machines: readonly FactoryMachine[];
  operators: readonly FactoryOperator[];
  shiftHours: number;
  shifts: number;
  dailyCapacityH: number;
  weeklyCapacityH: number;
  monthlyCapacityH: number;
  demandH: number;
  utilizationPct: number;
  daysToComplete: number;
}

// ─── Balanceamento de máquinas ─────────────────────────────────

export interface MachineLoad {
  machineId: string;
  label: string;
  kind: FactoryMachineKind;
  loadMinutes: number;
  capacityMinutes: number;
  utilizationPct: number;
  status: "ok" | "atenção" | "sobrecarregada" | "ociosa";
}

export interface MachineBalance {
  loads: readonly MachineLoad[];
  bottleneckId: string | null;
  bottleneckLabel: string;
  bottleneckStage: RoutingStage;
  idleIds: readonly string[];
  suggestions: readonly string[];
}

// ─── Alocação de operadores ────────────────────────────────────

export interface OperatorAssignment {
  stage: RoutingStage;
  operatorId: string;
  operatorName: string;
  loadH: number;
  reason: string;
}

// ─── Entrega ───────────────────────────────────────────────────

export interface DeliveryEstimate {
  totalMinutes: number;
  totalHours: number;
  effectiveDays: number;
  finishDate: string;
  confidence: "alta" | "media" | "baixa";
  bufferDays: number;
  onTime: boolean;
}

// ─── Qualidade ─────────────────────────────────────────────────

export type QualityCheckKind =
  | "dimensional"
  | "acabamento"
  | "fita-borda"
  | "furacao"
  | "ferragens"
  | "montagem"
  | "estetica"
  | "embalagem";

export interface QualityCheck {
  id: string;
  kind: QualityCheckKind;
  title: string;
  description: string;
  required: boolean;
  targetPartCode?: string;
  severity: "info" | "warn" | "critical";
}

export interface QualityChecklist {
  totalChecks: number;
  criticalChecks: number;
  checks: readonly QualityCheck[];
  reworkRatePct: number;
  defectRatePct: number;
}

// ─── KPIs de Fábrica ───────────────────────────────────────────

export interface FactoryKPI {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: "info" | "success" | "warning" | "muted";
}

export interface FactoryAlert {
  id: string;
  level: "info" | "warning" | "critical";
  title: string;
  message: string;
}

// ─── IA de Fábrica ─────────────────────────────────────────────

export type FactoryIntentId =
  | "fab.quanto-falta"
  | "fab.quando-termina"
  | "fab.operador"
  | "fab.maquina"
  | "fab.economizar"
  | "fab.acelerar"
  | "fab.gargalo"
  | "fab.setor-lento"
  | "fab.oee"
  | "fab.qualidade";

export interface FactoryIntent {
  id: FactoryIntentId;
  question: string;
  patterns: readonly string[];
  answer: string;
}