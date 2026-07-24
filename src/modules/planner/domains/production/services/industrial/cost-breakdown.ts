import type { ProductionReport } from "../../types";
import type { FabricationPlan } from "../fabrication";
import type { IndustrialCostRow, IndustrialCostSummary } from "./types";

export function buildIndustrialCost(
  report: ProductionReport,
  plan: FabricationPlan | null,
): IndustrialCostSummary {
  const b = report.budget;
  const groupSum = (g: string) =>
    b.lines.filter((l) => l.group === g).reduce((a, l) => a + l.total, 0);
  const material = groupSum("materiais");
  const ferragens = groupSum("ferragens");
  const mao = groupSum("mao-obra") + groupSum("pintura") + groupSum("montagem") + groupSum("entrega");
  const wasteM2 = plan ? plan.totals.wasteAreaM2 : report.cuttingPlan.totals.wasteAreaM2;
  const wasteCost = Math.round(wasteM2 * 80 * 100) / 100;
  const cost = material + ferragens + mao + wasteCost;
  const overhead = b.summary.overhead;
  const margin = b.summary.margin;
  const taxes = b.summary.taxes;
  const final = b.summary.final;
  const marginPct = final > 0 ? Math.round((margin / final) * 1000) / 10 : 0;
  const totalArea = report.parts.reduce((a, p) => a + p.areaM2 * p.qty, 0);
  const costPerM2 = totalArea > 0 ? Math.round((cost / totalArea) * 100) / 100 : 0;
  const pricePerM2 = b.summary.perM2;
  const rows: IndustrialCostRow[] = [
    { id: "material", group: "material", label: "Chapas e revestimentos", value: material, hint: "MDF, MDP, fita de borda" },
    { id: "ferragens", group: "ferragens", label: "Ferragens e acessórios", value: ferragens, hint: "dobradiças, corrediças, minifix" },
    { id: "mao", group: "mao-obra", label: "Mão de obra + pintura + montagem", value: mao, hint: `${report.time.totalH}h totais` },
    { id: "desp", group: "desperdicio", label: "Desperdício de chapa", value: wasteCost, hint: `${wasteM2.toFixed(2)} m² à R$80/m²` },
    { id: "overhead", group: "overhead", label: `Overhead ${b.parameters.overheadPct}%`, value: overhead, hint: "custos fixos rateados" },
    { id: "lucro", group: "lucro", label: `Margem ${b.parameters.marginPct}%`, value: margin, hint: "lucro esperado" },
    { id: "imposto", group: "imposto", label: `Impostos ${b.parameters.taxPct}%`, value: taxes, hint: "carga tributária" },
  ];
  return { rows, cost, overhead, margin, taxes, final, marginPct, costPerM2, pricePerM2 };
}
