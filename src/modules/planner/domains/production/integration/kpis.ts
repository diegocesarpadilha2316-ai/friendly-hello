/**
 * Fase 3.32 — KPIs consolidados (Produção, Fábrica, Financeiro, Corte, CNC, Logística).
 */
import type { IndustrialCostSummary } from "../services/industrial";
import type {
  CapacitySnapshot,
  DeliveryEstimate as FactoryDelivery,
  MachineBalance,
  QualityChecklist,
} from "../services/intelligence";
import type { CapacityWindow, MrpSummary } from "../services/planning";
import type { ProductionReport } from "../types";
import type { CncManifest, FinalKPI, NestingSelection } from "./types";

export interface KpiSources {
  readonly report: ProductionReport;
  readonly nesting: NestingSelection | null;
  readonly cnc: CncManifest;
  readonly cost: IndustrialCostSummary | null;
  readonly capacity: CapacitySnapshot | null;
  readonly balance: MachineBalance | null;
  readonly quality: QualityChecklist | null;
  readonly delivery: FactoryDelivery | null;
  readonly mrp: MrpSummary;
  readonly capacityWindow: CapacityWindow;
}

function tone(v: number, good: number, warn: number): FinalKPI["tone"] {
  if (v >= good) return "success";
  if (v >= warn) return "info";
  return "warning";
}
function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function buildFinalKpis(src: KpiSources): readonly FinalKPI[] {
  const { report, nesting, cnc, cost, capacity, balance, quality, delivery, mrp, capacityWindow } =
    src;
  const usagePct = nesting
    ? Math.round(nesting.best.statistics.avgUsageRatio * 100)
    : Math.round(report.cuttingPlan.totals.avgUsageRatio * 100);
  const wasteM2 = nesting
    ? nesting.best.statistics.wasteAreaM2
    : report.cuttingPlan.totals.wasteAreaM2;
  const boards = nesting
    ? nesting.best.statistics.boardsCount
    : report.cuttingPlan.totals.boardsCount;
  const revenue = cost?.final ?? report.budget.summary.final;
  const margin = cost?.marginPct ?? report.budget.parameters.marginPct;

  const kpis: FinalKPI[] = [
    {
      id: "prod-modules",
      group: "producao",
      label: "Módulos",
      value: String(report.totals.modules),
      hint: `${report.totals.parts} peças`,
      tone: "info",
    },
    {
      id: "prod-parts",
      group: "producao",
      label: "Peças",
      value: String(report.totals.parts),
      hint: `${report.totals.boardsM2.toFixed(2)} m²`,
      tone: "info",
    },
    {
      id: "prod-time",
      group: "producao",
      label: "Tempo total",
      value: `${report.time.totalH}h`,
      hint: `Corte ${report.time.cuttingH}h · Mont. ${report.time.assemblyH}h`,
      tone: "info",
    },
    {
      id: "corte-boards",
      group: "corte",
      label: "Chapas",
      value: String(boards),
      hint: nesting ? `Algoritmo ${nesting.winnerAlgorithm}` : "otimizado",
      tone: "info",
    },
    {
      id: "corte-usage",
      group: "corte",
      label: "Aproveitamento",
      value: `${usagePct}%`,
      hint: `Desperdício ${wasteM2.toFixed(2)} m²`,
      tone: tone(usagePct, 80, 65),
    },
    {
      id: "corte-waste",
      group: "corte",
      label: "Desperdício",
      value: `${wasteM2.toFixed(2)} m²`,
      hint: "sobra + refugo",
      tone: wasteM2 <= 2 ? "success" : "warning",
    },
    {
      id: "cnc-progs",
      group: "cnc",
      label: "Programas CNC",
      value: String(cnc.totalPrograms),
      hint: `${cnc.entries.length} formatos`,
      tone: "info",
    },
    {
      id: "cnc-time",
      group: "cnc",
      label: "Tempo CNC",
      value: `${cnc.totalMinutes} min`,
      hint: cnc.entries[0]?.machineLabel ?? "—",
      tone: "info",
    },
    {
      id: "fin-revenue",
      group: "financeiro",
      label: "Receita",
      value: fmtBRL(revenue),
      hint: `R$/m² ${fmtBRL(report.budget.summary.perM2)}`,
      tone: "success",
    },
    {
      id: "fin-margin",
      group: "financeiro",
      label: "Margem",
      value: `${margin.toFixed(1)}%`,
      hint: cost ? `Lucro ${fmtBRL(cost.margin)}` : "conforme orçamento",
      tone: tone(margin, 25, 15),
    },
    {
      id: "fin-material",
      group: "financeiro",
      label: "Materiais (MRP)",
      value: fmtBRL(mrp.totalCost),
      hint: `${mrp.totalItems} itens`,
      tone: "info",
    },
  ];
  if (capacity) {
    kpis.push(
      {
        id: "fab-util",
        group: "fabrica",
        label: "Utilização",
        value: `${capacity.utilizationPct}%`,
        hint: `${capacity.demandH}h de ${capacity.dailyCapacityH}h/dia`,
        tone: capacity.utilizationPct >= 90 ? "warning" : "info",
      },
      {
        id: "fab-window",
        group: "fabrica",
        label: "Capacidade Semanal",
        value: `${capacityWindow.availableHours}h`,
        hint: `Ociosa ${capacityWindow.idleHours}h`,
        tone: "info",
      },
    );
  }
  if (balance) {
    kpis.push({
      id: "fab-gargalo",
      group: "fabrica",
      label: "Gargalo",
      value: balance.bottleneckLabel,
      hint: `Estágio ${balance.bottleneckStage}`,
      tone: "warning",
    });
  }
  if (quality) {
    kpis.push({
      id: "fab-quality",
      group: "fabrica",
      label: "Defeitos",
      value: `${quality.defectRatePct}%`,
      hint: `Retrabalho ${quality.reworkRatePct}%`,
      tone: quality.defectRatePct <= 3 ? "success" : "warning",
    });
  }
  if (delivery) {
    kpis.push({
      id: "log-entrega",
      group: "logistica",
      label: "Entrega prevista",
      value: new Date(delivery.finishDate).toLocaleDateString("pt-BR"),
      hint: `${delivery.effectiveDays}d · confiança ${delivery.confidence}`,
      tone: delivery.onTime ? "success" : "warning",
    });
  }
  return kpis;
}
