/**
 * Indicadores agregados para o Dashboard do Plano de Corte.
 */
import type { NestingPlan } from "./types";

export interface NestingDashboardKPI {
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
}

export function dashboardKpis(plan: NestingPlan): readonly NestingDashboardKPI[] {
  const s = plan.statistics;
  const usagePct = (s.avgUsageRatio * 100).toFixed(1);
  const wastePct = (100 - Number(usagePct)).toFixed(1);
  return [
    { label: "Aproveitamento médio", value: `${usagePct}%`, hint: `algoritmo ${plan.algorithm}` },
    { label: "Desperdício", value: `${wastePct}%`, hint: `${s.wasteAreaM2} m²` },
    { label: "Chapas", value: String(s.boardsCount), hint: `${s.partsCount} peças` },
    { label: "Sobras aproveitáveis", value: `${s.offcutAreaM2} m²` },
    { label: "Peso total", value: `${s.totalWeightKg} kg` },
    { label: "Custo estimado", value: `R$ ${s.totalCost.toFixed(2)}` },
    { label: "Tempo estimado", value: `${s.estimatedTimeMin} min` },
    { label: "Geração", value: new Date(plan.generatedAt).toLocaleTimeString() },
  ];
}

export function economyVs(baseline: NestingPlan, current: NestingPlan): number {
  const diff = baseline.statistics.wasteAreaM2 - current.statistics.wasteAreaM2;
  return Math.round(diff * 1000) / 1000;
}
