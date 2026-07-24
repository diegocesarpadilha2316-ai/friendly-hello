import type { ProductionOrder } from "../../types";
import type { PlanningOrder, OrderStatus, OrderUrgency } from "./types";

const STATUS_MAP: Record<string, OrderStatus> = {
  "corte": "em-producao",
  "usinagem": "em-producao",
  "colagem": "em-producao",
  "montagem": "em-producao",
  "acabamento": "em-producao",
  "embalagem": "concluido",
  "expedicao": "entregue",
};

function urgencyFromDays(days: number): OrderUrgency {
  if (days < 0) return "critica";
  if (days <= 3) return "alta";
  if (days <= 10) return "normal";
  return "baixa";
}

function priorityScore(urgency: OrderUrgency, progress: number, days: number): number {
  const base =
    urgency === "critica" ? 90 : urgency === "alta" ? 70 : urgency === "normal" ? 50 : 30;
  const dueAdj = Math.max(0, 20 - Math.max(0, days) * 1.5);
  const progAdj = Math.min(10, progress / 10);
  return Math.round(Math.min(100, base + dueAdj + progAdj));
}

export function buildPlanningOrders(
  orders: readonly ProductionOrder[],
  opts: { totalHours: number; totalValue: number; parts: number; company: string; projectName: string },
): PlanningOrder[] {
  const now = new Date();
  return orders.map((o) => {
    const due = new Date(o.eta);
    const daysRemaining = Math.round((due.getTime() - now.getTime()) / 86_400_000);
    const urgency = urgencyFromDays(daysRemaining);
    const status: OrderStatus =
      o.progress >= 100 ? "concluido" : (STATUS_MAP[o.stage] ?? "planejado");
    return {
      id: o.id,
      code: o.code,
      clientName: o.clientName,
      company: opts.company,
      projectName: opts.projectName,
      status: daysRemaining < 0 && status !== "concluido" && status !== "entregue" ? "atrasado" : status,
      urgency,
      priority: priorityScore(urgency, o.progress, daysRemaining),
      totalValue: opts.totalValue / Math.max(1, orders.length),
      totalHours: opts.totalHours / Math.max(1, orders.length),
      parts: Math.round(opts.parts / Math.max(1, orders.length)),
      createdAt: now.toISOString(),
      dueDate: o.eta,
      progress: o.progress,
    };
  });
}

export function summarizeOrders(orders: readonly PlanningOrder[]): {
  total: number;
  inProgress: number;
  completed: number;
  delayed: number;
  atRisk: number;
  revenue: number;
} {
  let inProgress = 0;
  let completed = 0;
  let delayed = 0;
  let atRisk = 0;
  let revenue = 0;
  for (const o of orders) {
    revenue += o.totalValue;
    if (o.status === "em-producao") inProgress++;
    else if (o.status === "concluido" || o.status === "entregue") completed++;
    else if (o.status === "atrasado") delayed++;
    if (o.urgency === "critica" || o.urgency === "alta") atRisk++;
  }
  return { total: orders.length, inProgress, completed, delayed, atRisk, revenue };
}