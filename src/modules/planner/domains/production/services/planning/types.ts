// Dioris — PCP / MRP / Planejamento (Fase 3.20)
// Contratos puros, sem stores/providers.

export type OrderStatus =
  | "backlog"
  | "planejado"
  | "aprovado"
  | "em-producao"
  | "concluido"
  | "entregue"
  | "atrasado"
  | "cancelado";

export type OrderUrgency = "baixa" | "normal" | "alta" | "critica";

export interface PlanningOrder {
  id: string;
  code: string;
  clientName: string;
  company: string;
  projectName: string;
  status: OrderStatus;
  urgency: OrderUrgency;
  priority: number; // 0..100 — quanto maior, mais cedo entra na fila
  totalValue: number;
  totalHours: number;
  parts: number;
  createdAt: string;
  dueDate: string;
  startDate?: string;
  endDate?: string;
  progress: number; // 0..100
}

export type ResourceKind = "maquina" | "operador" | "setor" | "ferramenta";

export interface PlanningResource {
  id: string;
  kind: ResourceKind;
  label: string;
  sector: string;
  hoursPerDay: number;
  status: "ativo" | "manutencao" | "inativo";
  skills?: readonly string[];
}

export interface CalendarDay {
  date: string; // ISO yyyy-mm-dd
  isWorkday: boolean;
  isHoliday: boolean;
  isMaintenance: boolean;
  shiftHours: number;
  overtimeHours: number;
  label?: string;
}

export interface CapacityWindow {
  scope: "diaria" | "semanal" | "mensal";
  from: string;
  to: string;
  availableHours: number;
  usedHours: number;
  idleHours: number;
  utilizationPct: number;
}

export interface CapacityBottleneck {
  resourceId: string;
  label: string;
  loadPct: number;
  overloadedHours: number;
}

export type SequencingStrategy =
  | "fifo"
  | "lifo"
  | "urgencia"
  | "prazo"
  | "menor-tempo"
  | "maior-tempo"
  | "menor-desperdicio"
  | "ia";

export interface ScheduleEntry {
  orderId: string;
  orderCode: string;
  resourceId: string;
  startAt: string;
  endAt: string;
  durationH: number;
  stage: string;
  sequence: number;
}

export interface DeliveryEstimate {
  orderId: string;
  orderCode: string;
  clientName: string;
  dueDate: string;
  estimatedDelivery: string;
  daysRemaining: number;
  delayDays: number;
  atRisk: boolean;
  onTime: boolean;
  progressPct: number;
}

export interface MrpItem {
  code: string;
  label: string;
  category:
    | "MDF"
    | "MDP"
    | "Ferragem"
    | "Parafuso"
    | "Minifix"
    | "Cavilha"
    | "Corredicas"
    | "Dobradica"
    | "LED"
    | "Perfil"
    | "Vidro"
    | "Espelho"
    | "Cola"
    | "Fita"
    | "Puxador"
    | "Rodizio"
    | "Pes";
  unit: "pc" | "m" | "m²" | "kit" | "l" | "kg";
  qty: number;
  unitPrice: number;
  total: number;
  supplierHint?: string;
}

export interface MrpSummary {
  items: readonly MrpItem[];
  totalItems: number;
  totalCost: number;
  byCategory: Readonly<Record<string, { qty: number; cost: number }>>;
}

export interface PriorityScore {
  orderId: string;
  base: number;
  urgencyBoost: number;
  dueBoost: number;
  clientBoost: number;
  final: number;
}

export interface PlanningKpis {
  totalOrders: number;
  inProgress: number;
  completed: number;
  delayed: number;
  capacityHours: number;
  usedHours: number;
  utilizationPct: number;
  totalRevenue: number;
  materialCost: number;
  atRiskOrders: number;
}

export interface PlanningReportRow {
  period: string;
  orders: number;
  produced: number;
  delivered: number;
  delayed: number;
  hours: number;
  revenue: number;
}

export interface PlanningAiAnswer {
  question: string;
  answer: string;
  confidence: "alta" | "media" | "baixa";
  refs: readonly string[];
}
