import { DEFAULT_RESOURCES } from "./resources";
import type { PlanningResource } from "./types";

export function listOperators(): readonly PlanningResource[] {
  return DEFAULT_RESOURCES.filter((r) => r.kind === "operador");
}

export interface OperatorLoad {
  resourceId: string;
  label: string;
  sector: string;
  capacityH: number;
  loadH: number;
  loadPct: number;
  free: boolean;
  skills: readonly string[];
}

export function computeOperatorLoad(
  totalHours: number,
  windowDays: number,
): readonly OperatorLoad[] {
  const ops = listOperators();
  const perOperator = ops.length > 0 ? totalHours / ops.length : 0;
  return ops.map((o) => {
    const capacityH = o.hoursPerDay * windowDays;
    const loadH = +perOperator.toFixed(1);
    const loadPct = capacityH > 0 ? +((loadH / capacityH) * 100).toFixed(1) : 0;
    return {
      resourceId: o.id,
      label: o.label,
      sector: o.sector,
      capacityH,
      loadH,
      loadPct,
      free: loadPct < 60,
      skills: o.skills ?? [],
    };
  });
}

export function findFreeOperators(loads: readonly OperatorLoad[]): readonly OperatorLoad[] {
  return loads.filter((l) => l.free).sort((a, b) => a.loadPct - b.loadPct);
}

export function assignOperator(
  loads: readonly OperatorLoad[],
  skill: string,
): OperatorLoad | undefined {
  const eligible = loads
    .filter((l) => l.skills.length === 0 || l.skills.includes(skill))
    .sort((a, b) => a.loadPct - b.loadPct);
  return eligible[0];
}
