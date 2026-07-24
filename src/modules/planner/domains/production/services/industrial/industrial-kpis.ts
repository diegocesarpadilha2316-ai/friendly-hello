import type { ProductionReport } from "../../types";
import type { FabricationPlan } from "../fabrication";
import type { IndustrialCostSummary, OffcutInventoryItem } from "./types";

export interface IndustrialKPI {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: "info" | "success" | "warning" | "muted";
}

function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function buildIndustrialKpis(
  report: ProductionReport,
  plan: FabricationPlan | null,
  cost: IndustrialCostSummary,
  offcuts: readonly OffcutInventoryItem[],
): readonly IndustrialKPI[] {
  const usagePct = Math.round(report.cuttingPlan.totals.avgUsageRatio * 100);
  const wasteM2 = plan ? plan.totals.wasteAreaM2 : report.cuttingPlan.totals.wasteAreaM2;
  const offcutM2 = offcuts.reduce((a, o) => a + o.areaM2, 0);
  return [
    { id: "pecas", label: "Peças", value: `${report.totals.parts}`, hint: `${report.totals.modules} módulos`, tone: "info" },
    { id: "chapas", label: "Chapas", value: `${report.cuttingPlan.totals.boardsCount}`, hint: `${report.totals.boardsM2.toFixed(2)} m²`, tone: "info" },
    { id: "sobras", label: "Sobras úteis", value: `${offcuts.length}`, hint: `${offcutM2.toFixed(2)} m² estocados`, tone: offcuts.length > 0 ? "success" : "muted" },
    { id: "aproveit", label: "Aproveitamento", value: `${usagePct}%`, hint: `desperdício ${wasteM2.toFixed(2)} m²`, tone: usagePct >= 75 ? "success" : "warning" },
    { id: "prod", label: "Fila de produção", value: `${report.totals.modules}`, hint: "módulos prontos p/ fábrica", tone: "info" },
    { id: "tempo", label: "Tempo total", value: `${report.time.totalH}h`, hint: `corte ${report.time.cuttingH}h · mont. ${report.time.assemblyH}h`, tone: "info" },
    { id: "ferragens", label: "Ferragens", value: `${report.hardware.length}`, hint: "itens BOM", tone: "info" },
    { id: "peso", label: "Peso", value: `${report.totals.weightKg.toFixed(0)} kg`, hint: "logística", tone: "muted" },
    { id: "area", label: "Área total", value: `${report.parts.reduce((a, p) => a + p.areaM2 * p.qty, 0).toFixed(2)} m²`, hint: "chapa consumida", tone: "muted" },
    { id: "custo", label: "Custo estimado", value: fmtBRL(cost.cost), hint: `${fmtBRL(cost.costPerM2)}/m²`, tone: "warning" },
    { id: "lucro", label: "Lucro esperado", value: fmtBRL(cost.margin), hint: `margem ${cost.marginPct}%`, tone: "success" },
    { id: "final", label: "Preço final", value: fmtBRL(cost.final), hint: `${fmtBRL(cost.pricePerM2)}/m²`, tone: "success" },
  ];
}
