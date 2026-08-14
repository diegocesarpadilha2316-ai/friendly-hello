import { DEFAULT_RESOURCES } from "./resources";
import type { PlanningResource } from "./types";

export function listMachines(): readonly PlanningResource[] {
  return DEFAULT_RESOURCES.filter((r) => r.kind === "maquina");
}

export interface MachineLoad {
  resourceId: string;
  label: string;
  sector: string;
  capacityH: number;
  loadH: number;
  loadPct: number;
  overloaded: boolean;
}

export function computeMachineLoad(totalHours: number, windowDays: number): readonly MachineLoad[] {
  const machines = listMachines();
  const share: Record<string, number> = {
    Corte: 0.28,
    Usinagem: 0.32,
    Acabamento: 0.25,
    Montagem: 0.15,
  };
  return machines.map((m) => {
    const capacityH = m.hoursPerDay * windowDays;
    const s = share[m.sector] ?? 0.2;
    const loadH = +(totalHours * s).toFixed(1);
    const loadPct = capacityH > 0 ? +((loadH / capacityH) * 100).toFixed(1) : 0;
    return {
      resourceId: m.id,
      label: m.label,
      sector: m.sector,
      capacityH,
      loadH,
      loadPct,
      overloaded: loadPct > 100,
    };
  });
}

export function findOverloadedMachines(loads: readonly MachineLoad[]): readonly MachineLoad[] {
  return loads.filter((l) => l.overloaded).sort((a, b) => b.loadPct - a.loadPct);
}
