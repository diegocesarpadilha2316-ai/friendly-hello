import { FACTORY_MACHINES } from "./production-capacity";
import type {
  FactoryMachineKind,
  MachineBalance,
  MachineLoad,
  RoutingPlan,
  RoutingStage,
} from "./types";

const STAGE_KIND: Record<RoutingStage, FactoryMachineKind | null> = {
  corte: "seccionadora",
  coladeira: "coladeira",
  usinagem: "furadeira",
  montagem: "montagem",
  conferencia: null,
  embalagem: "embalagem",
  expedicao: null,
};

const STAGE_BY_KIND: Record<FactoryMachineKind, RoutingStage> = {
  seccionadora: "corte",
  coladeira: "coladeira",
  furadeira: "usinagem",
  router: "usinagem",
  montagem: "montagem",
  embalagem: "embalagem",
};

export function balanceMachines(routings: readonly RoutingPlan[]): MachineBalance {
  const loadByKind = new Map<FactoryMachineKind, number>();
  for (const r of routings) {
    for (const s of r.steps) {
      const kind = STAGE_KIND[s.stage];
      if (!kind) continue;
      loadByKind.set(kind, (loadByKind.get(kind) ?? 0) + s.minutes);
    }
  }
  const loads: MachineLoad[] = FACTORY_MACHINES.map((m) => {
    const loadMinutes = Math.round(loadByKind.get(m.kind) ?? 0);
    const capacityMinutes = Math.round(m.throughputPh * 60 * m.availability * 2);
    const util = capacityMinutes === 0 ? 0 : Math.round((loadMinutes / capacityMinutes) * 100);
    const status: MachineLoad["status"] =
      util >= 100 ? "sobrecarregada" : util >= 80 ? "atenção" : util <= 20 ? "ociosa" : "ok";
    return {
      machineId: m.id,
      label: m.label,
      kind: m.kind,
      loadMinutes,
      capacityMinutes,
      utilizationPct: util,
      status,
    };
  });

  const bottleneck = [...loads].sort((a, b) => b.utilizationPct - a.utilizationPct)[0] ?? null;
  const idle = loads.filter((l) => l.status === "ociosa").map((l) => l.machineId);
  const suggestions: string[] = [];
  if (bottleneck && bottleneck.utilizationPct >= 80)
    suggestions.push(`Adicionar turno em ${bottleneck.label} ou terceirizar excedente.`);
  if (idle.length > 0)
    suggestions.push(`Máquinas ociosas (${idle.length}) podem absorver picos de demanda.`);
  if (suggestions.length === 0) suggestions.push("Carga equilibrada — mantenha ritmo atual.");

  return {
    loads,
    bottleneckId: bottleneck?.machineId ?? null,
    bottleneckLabel: bottleneck?.label ?? "—",
    bottleneckStage: bottleneck ? STAGE_BY_KIND[bottleneck.kind] : "corte",
    idleIds: idle,
    suggestions,
  };
}
