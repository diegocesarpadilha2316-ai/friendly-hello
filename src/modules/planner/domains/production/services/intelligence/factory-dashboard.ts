import type { ProductionReport } from "../../types";
import type {
  CapacitySnapshot,
  DeliveryEstimate,
  FactoryAlert,
  FactoryKPI,
  MachineBalance,
  ProductionQueue,
  QualityChecklist,
} from "./types";

export function buildFactoryKpis(
  report: ProductionReport,
  capacity: CapacitySnapshot,
  balance: MachineBalance,
  delivery: DeliveryEstimate,
  quality: QualityChecklist,
  queues: readonly ProductionQueue[],
): readonly FactoryKPI[] {
  const avgAvailability =
    capacity.machines.reduce((a, m) => a + m.availability, 0) /
    Math.max(1, capacity.machines.length);
  const performance = Math.max(
    0.5,
    1 - balance.loads.filter((l) => l.status === "sobrecarregada").length * 0.08,
  );
  const qualityFactor = 1 - quality.defectRatePct / 100;
  const oeePct = Math.round(avgAvailability * performance * qualityFactor * 100);
  const avgOpEff =
    capacity.operators.reduce((a, o) => a + o.efficiency, 0) /
    Math.max(1, capacity.operators.length);
  const productivity = Math.round(avgOpEff * 100);
  const idleH = Math.max(
    0,
    capacity.dailyCapacityH * capacity.machines.length - Math.round(delivery.totalHours),
  );
  const perDay = Math.max(1, Math.round(report.totals.parts / Math.max(1, delivery.effectiveDays)));

  return [
    {
      id: "oee",
      label: "OEE",
      value: `${oeePct}%`,
      hint: "Disp × Perf × Qual",
      tone: oeePct >= 75 ? "success" : oeePct >= 55 ? "info" : "warning",
    },
    {
      id: "prod-dia",
      label: "Produção diária",
      value: `${perDay} pçs/dia`,
      hint: `${delivery.effectiveDays}d planejados`,
      tone: "info",
    },
    {
      id: "prod-sem",
      label: "Produção semanal",
      value: `${perDay * 5} pçs/sem`,
      hint: `${capacity.weeklyCapacityH}h/sem`,
      tone: "info",
    },
    {
      id: "prod-mes",
      label: "Produção mensal",
      value: `${perDay * 22} pçs/mês`,
      hint: `${capacity.monthlyCapacityH}h/mês`,
      tone: "info",
    },
    {
      id: "efic",
      label: "Eficiência",
      value: `${productivity}%`,
      hint: `${capacity.operators.length} operadores`,
      tone: productivity >= 90 ? "success" : "info",
    },
    {
      id: "util",
      label: "Utilização",
      value: `${capacity.utilizationPct}%`,
      hint: `${capacity.demandH}h / ${capacity.dailyCapacityH}h·dia`,
      tone: capacity.utilizationPct >= 90 ? "warning" : "info",
    },
    {
      id: "retrab",
      label: "Retrabalho",
      value: `${quality.reworkRatePct}%`,
      hint: "média histórica",
      tone: quality.reworkRatePct <= 5 ? "success" : "warning",
    },
    {
      id: "defeito",
      label: "Defeitos",
      value: `${quality.defectRatePct}%`,
      hint: `${quality.criticalChecks} checks críticos`,
      tone: quality.defectRatePct <= 3 ? "success" : "warning",
    },
    {
      id: "tempo-med",
      label: "Tempo médio/peça",
      value: `${Math.max(1, Math.round((delivery.totalMinutes / Math.max(1, report.totals.parts)) * 10) / 10)}min`,
      hint: `${delivery.totalHours}h totais`,
      tone: "info",
    },
    {
      id: "parado",
      label: "Tempo ocioso",
      value: `${idleH}h`,
      hint: "capacidade não usada",
      tone: idleH > 20 ? "warning" : "muted",
    },
    {
      id: "gargalo",
      label: "Gargalo",
      value: balance.bottleneckLabel,
      hint: `${balance.loads.find((l) => l.machineId === balance.bottleneckId)?.utilizationPct ?? 0}% de uso`,
      tone: "warning",
    },
    {
      id: "filas",
      label: "Filas ativas",
      value: `${queues.length}`,
      hint: `${queues.reduce((a, q) => a + q.tickets.length, 0)} tickets`,
      tone: "info",
    },
  ];
}

export function buildFactoryAlerts(
  balance: MachineBalance,
  capacity: CapacitySnapshot,
  delivery: DeliveryEstimate,
  quality: QualityChecklist,
  queues: readonly ProductionQueue[],
): readonly FactoryAlert[] {
  const alerts: FactoryAlert[] = [];
  if (balance.bottleneckId) {
    const load = balance.loads.find((l) => l.machineId === balance.bottleneckId);
    if (load && load.utilizationPct >= 90) {
      alerts.push({
        id: `alert-gargalo-${balance.bottleneckId}`,
        level: "critical",
        title: `Gargalo em ${balance.bottleneckLabel}`,
        message: `Utilização ${load.utilizationPct}% — considere turno extra ou reprogramar filas.`,
      });
    }
  }
  if (capacity.utilizationPct >= 95) {
    alerts.push({
      id: "alert-capacidade",
      level: "warning",
      title: "Capacidade próxima do limite",
      message: `Demanda ${capacity.demandH}h vs. ${capacity.dailyCapacityH}h/dia — planejar sobreaviso.`,
    });
  }
  if (!delivery.onTime) {
    alerts.push({
      id: "alert-entrega",
      level: "critical",
      title: "Risco de atraso na entrega",
      message: `Previsão para ${new Date(delivery.finishDate).toLocaleDateString("pt-BR")} — confiança ${delivery.confidence}.`,
    });
  }
  if (quality.reworkRatePct >= 8) {
    alerts.push({
      id: "alert-retrabalho",
      level: "warning",
      title: "Retrabalho elevado",
      message: `Taxa em ${quality.reworkRatePct}% — reforçar conferência.`,
    });
  }
  for (const q of queues) {
    if (q.loadPct >= 100) {
      alerts.push({
        id: `alert-fila-${q.kind}`,
        level: "warning",
        title: `${q.label} sobrecarregada`,
        message: `Carga ${q.loadPct}% (${q.totalMinutes}min) — redistribuir tickets.`,
      });
    }
  }
  if (alerts.length === 0) {
    alerts.push({
      id: "alert-ok",
      level: "info",
      title: "Fábrica operando dentro do esperado",
      message: "Sem gargalos críticos detectados.",
    });
  }
  return alerts;
}
