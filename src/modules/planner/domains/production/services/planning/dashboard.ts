import type {
  PlanningKpis,
  PlanningOrder,
  MrpSummary,
  CapacityWindow,
  DeliveryEstimate,
} from "./types";

export function buildPlanningKpis(input: {
  orders: readonly PlanningOrder[];
  mrp: MrpSummary;
  capacity: CapacityWindow;
  deliveries: readonly DeliveryEstimate[];
  totalRevenue: number;
}): PlanningKpis {
  const { orders, mrp, capacity, deliveries, totalRevenue } = input;
  const inProgress = orders.filter((o) => o.status === "em-producao").length;
  const completed = orders.filter(
    (o) => o.status === "concluido" || o.status === "entregue",
  ).length;
  const delayed = orders.filter((o) => o.status === "atrasado").length;
  const atRiskOrders = deliveries.filter((d) => d.atRisk).length;
  return {
    totalOrders: orders.length,
    inProgress,
    completed,
    delayed,
    capacityHours: capacity.availableHours,
    usedHours: capacity.usedHours,
    utilizationPct: capacity.utilizationPct,
    totalRevenue,
    materialCost: mrp.totalCost,
    atRiskOrders,
  };
}
