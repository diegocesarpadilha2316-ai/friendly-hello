import type { ProductionReport } from "../../types";
import type { FabricationKPI, FabricationPlan } from "./types";

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

export function buildFabricationKpis(
  report: ProductionReport,
  plan: FabricationPlan,
): readonly FabricationKPI[] {
  const total = plan.totals;
  const wastePct = total.usedAreaM2 + total.wasteAreaM2 > 0
    ? total.wasteAreaM2 / (total.usedAreaM2 + total.wasteAreaM2 + total.offcutAreaM2)
    : 0;
  const cost = report.budget.summary.final;
  const perM2 = report.budget.summary.perM2;
  return [
    { id: "pieces", label: "Peças", value: `${report.totals.parts}`, hint: `${report.totals.modules} módulos`, tone: "info" },
    { id: "boards", label: "Chapas", value: `${total.boardsCount}`, hint: `${total.usedAreaM2.toFixed(2)} m² usados`, tone: "info" },
    { id: "usage", label: "Aproveitamento", value: pct(total.avgUsageRatio), hint: `Efetivo ${pct(total.effectiveRatio)} c/ sobra`, tone: "success" },
    { id: "waste", label: "Desperdício", value: `${total.wasteAreaM2.toFixed(2)} m²`, hint: pct(wastePct), tone: wastePct > 0.15 ? "warning" : "muted" },
    { id: "offcut", label: "Sobra útil", value: `${total.offcutAreaM2.toFixed(2)} m²`, hint: "Reutilizável", tone: "info" },
    { id: "cuts", label: "Cortes", value: `${total.totalCuts}`, hint: `Grão respeitado ${total.grainRespectedPct}%`, tone: "muted" },
    { id: "time", label: "Tempo total", value: `${report.time.totalH}h`, hint: `Corte ${report.time.cuttingH}h · Mont. ${report.time.assemblyH}h`, tone: "info" },
    { id: "weight", label: "Peso", value: `${report.totals.weightKg.toFixed(0)} kg`, hint: `${report.totals.boardsM2.toFixed(2)} m² total`, tone: "muted" },
    { id: "cost", label: "Custo final", value: cost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), hint: `${perM2.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/m²`, tone: "success" },
    { id: "profit", label: "Margem", value: pct(report.budget.parameters.marginPct / 100), hint: `Overhead ${report.budget.parameters.overheadPct}% · Imp ${report.budget.parameters.taxPct}%`, tone: "muted" },
  ];
}