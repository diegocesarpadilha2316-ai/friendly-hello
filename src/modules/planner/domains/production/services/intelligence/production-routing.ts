import type { ProductionReport } from "../../types";
import { FACTORY_MACHINES } from "./production-capacity";
import type { RoutingPlan, RoutingStage, RoutingStep } from "./types";

const STAGE_MACHINE: Record<RoutingStage, string | null> = {
  corte: "mch-sec-01",
  coladeira: "mch-col-01",
  usinagem: "mch-fur-01",
  montagem: "mch-mnt-01",
  conferencia: null,
  embalagem: "mch-emb-01",
  expedicao: null,
};

const STAGE_LABEL: Record<RoutingStage, string> = {
  corte: "Corte",
  coladeira: "Coladeira de borda",
  usinagem: "Usinagem CNC",
  montagem: "Montagem",
  conferencia: "Conferência QA",
  embalagem: "Embalagem",
  expedicao: "Expedição",
};

export function buildRoutingPlans(report: ProductionReport): readonly RoutingPlan[] {
  const byFurniture = new Map<
    string,
    { label: string; parts: number; edgeM: number; weightKg: number }
  >();
  for (const p of report.parts) {
    const g = byFurniture.get(p.furnitureId) ?? {
      label: p.furnitureLabel,
      parts: 0,
      edgeM: 0,
      weightKg: 0,
    };
    g.parts += p.qty;
    g.edgeM += p.edgeMetersEach * p.qty;
    g.weightKg += p.weightKg * p.qty;
    byFurniture.set(p.furnitureId, g);
  }
  const totalTimeMin = report.time.totalH * 60;
  const totalParts = Math.max(1, report.totals.parts);
  const plans: RoutingPlan[] = [];
  for (const [furnitureId, g] of byFurniture) {
    const share = g.parts / totalParts;
    const totalMinutes = Math.max(1, Math.round(totalTimeMin * share));
    const steps: RoutingStep[] = [
      {
        stage: "corte",
        label: STAGE_LABEL.corte,
        machineId: STAGE_MACHINE.corte,
        operatorId: null,
        minutes: Math.max(1, Math.round(totalMinutes * 0.22)),
        order: 1,
      },
      {
        stage: "coladeira",
        label: STAGE_LABEL.coladeira,
        machineId: STAGE_MACHINE.coladeira,
        operatorId: null,
        minutes: Math.max(1, Math.round(g.edgeM * 1.2)),
        order: 2,
      },
      {
        stage: "usinagem",
        label: STAGE_LABEL.usinagem,
        machineId: STAGE_MACHINE.usinagem,
        operatorId: null,
        minutes: Math.max(1, Math.round(totalMinutes * 0.18)),
        order: 3,
      },
      {
        stage: "montagem",
        label: STAGE_LABEL.montagem,
        machineId: STAGE_MACHINE.montagem,
        operatorId: null,
        minutes: Math.max(1, Math.round(totalMinutes * 0.32)),
        order: 4,
      },
      {
        stage: "conferencia",
        label: STAGE_LABEL.conferencia,
        machineId: null,
        operatorId: null,
        minutes: Math.max(2, Math.round(g.parts * 0.8)),
        order: 5,
      },
      {
        stage: "embalagem",
        label: STAGE_LABEL.embalagem,
        machineId: STAGE_MACHINE.embalagem,
        operatorId: null,
        minutes: Math.max(3, Math.round(g.parts * 0.6)),
        order: 6,
      },
      {
        stage: "expedicao",
        label: STAGE_LABEL.expedicao,
        machineId: null,
        operatorId: null,
        minutes: Math.max(2, Math.round(g.weightKg * 0.15)),
        order: 7,
      },
    ];
    const total = steps.reduce((a, s) => a + s.minutes, 0);
    plans.push({ moduleId: furnitureId, moduleLabel: g.label, steps, totalMinutes: total });
  }
  return plans;
}

export function stageMachineLabel(stage: RoutingStage): string | null {
  const id = STAGE_MACHINE[stage];
  if (!id) return null;
  return FACTORY_MACHINES.find((m) => m.id === id)?.label ?? null;
}
