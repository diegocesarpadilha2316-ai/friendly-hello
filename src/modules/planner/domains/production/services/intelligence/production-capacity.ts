import type { ProductionReport } from "../../types";
import type { AssemblyPlan } from "../industrial";
import type {
  CapacitySnapshot,
  FactoryMachine,
  FactoryOperator,
} from "./types";

/** Catálogo determinístico de máquinas — não persistido. */
export const FACTORY_MACHINES: readonly FactoryMachine[] = [
  { id: "mch-sec-01", label: "Seccionadora Homag HPP", kind: "seccionadora", throughputPh: 18, availability: 0.92, status: "ativa" },
  { id: "mch-col-01", label: "Coladeira Biesse Akron", kind: "coladeira", throughputPh: 32, availability: 0.88, status: "ativa" },
  { id: "mch-fur-01", label: "Furadeira SCM Startech", kind: "furadeira", throughputPh: 40, availability: 0.9, status: "ativa" },
  { id: "mch-rou-01", label: "Router CNC Nesting", kind: "router", throughputPh: 10, availability: 0.85, status: "ativa" },
  { id: "mch-mnt-01", label: "Bancada de Montagem A", kind: "montagem", throughputPh: 14, availability: 0.95, status: "ativa" },
  { id: "mch-emb-01", label: "Estação de Embalagem", kind: "embalagem", throughputPh: 22, availability: 0.98, status: "ativa" },
];

/** Catálogo determinístico de operadores. */
export const FACTORY_OPERATORS: readonly FactoryOperator[] = [
  { id: "op-01", name: "Carlos Souza", shift: "manha", skills: ["corte", "usinagem"], efficiency: 0.92, loadH: 4, status: "disponivel" },
  { id: "op-02", name: "Marina Alves", shift: "manha", skills: ["montagem", "acabamento", "conferencia"], efficiency: 0.95, loadH: 5.5, status: "ocupado" },
  { id: "op-03", name: "Rafael Lima", shift: "tarde", skills: ["corte", "usinagem", "montagem"], efficiency: 0.88, loadH: 3, status: "disponivel" },
  { id: "op-04", name: "Bianca Rocha", shift: "tarde", skills: ["conferencia", "embalagem", "logistica"], efficiency: 0.9, loadH: 2, status: "disponivel" },
  { id: "op-05", name: "Diego Martins", shift: "noite", skills: ["montagem", "acabamento"], efficiency: 0.86, loadH: 1, status: "disponivel" },
];

export interface CapacityConfig {
  shifts: number;
  shiftHours: number;
  workingDaysPerWeek: number;
  workingDaysPerMonth: number;
}

export const DEFAULT_CAPACITY: CapacityConfig = {
  shifts: 2,
  shiftHours: 8,
  workingDaysPerWeek: 5,
  workingDaysPerMonth: 22,
};

export function buildCapacitySnapshot(
  report: ProductionReport,
  assembly: AssemblyPlan,
  cfg: CapacityConfig = DEFAULT_CAPACITY,
): CapacitySnapshot {
  const dailyCapacityH = cfg.shifts * cfg.shiftHours;
  const weeklyCapacityH = dailyCapacityH * cfg.workingDaysPerWeek;
  const monthlyCapacityH = dailyCapacityH * cfg.workingDaysPerMonth;
  const demandH = report.time.totalH + Math.round((assembly.totalMinutes / 60) * 10) / 10;
  const utilizationPct = dailyCapacityH === 0 ? 0 : Math.min(100, Math.round((demandH / dailyCapacityH) * 100));
  const daysToComplete = dailyCapacityH === 0 ? 0 : Math.max(1, Math.ceil(demandH / dailyCapacityH));
  return {
    machines: FACTORY_MACHINES,
    operators: FACTORY_OPERATORS,
    shiftHours: cfg.shiftHours,
    shifts: cfg.shifts,
    dailyCapacityH,
    weeklyCapacityH,
    monthlyCapacityH,
    demandH,
    utilizationPct,
    daysToComplete,
  };
}