import type { PlanningOrder, PriorityScore, SequencingStrategy } from "./types";

function urgencyValue(u: PlanningOrder["urgency"]): number {
  return u === "critica" ? 40 : u === "alta" ? 28 : u === "normal" ? 16 : 8;
}

export function scoreOrder(o: PlanningOrder, now = new Date()): PriorityScore {
  const due = new Date(o.dueDate);
  const days = Math.max(0, Math.round((due.getTime() - now.getTime()) / 86_400_000));
  const base = 40;
  const urgencyBoost = urgencyValue(o.urgency);
  const dueBoost = Math.max(0, 20 - days * 1.2);
  const clientBoost = o.totalValue > 20_000 ? 6 : o.totalValue > 5000 ? 3 : 0;
  const final = Math.round(Math.min(100, base + urgencyBoost + dueBoost + clientBoost));
  return { orderId: o.id, base, urgencyBoost, dueBoost, clientBoost, final };
}

export function scoreAll(orders: readonly PlanningOrder[]): readonly PriorityScore[] {
  const now = new Date();
  return orders.map((o) => scoreOrder(o, now));
}

export function sortByStrategy(
  orders: readonly PlanningOrder[],
  strategy: SequencingStrategy,
): readonly PlanningOrder[] {
  const list = [...orders];
  switch (strategy) {
    case "fifo":
      return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case "lifo":
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "urgencia":
      return list.sort((a, b) => urgencyValue(b.urgency) - urgencyValue(a.urgency));
    case "prazo":
      return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    case "menor-tempo":
      return list.sort((a, b) => a.totalHours - b.totalHours);
    case "maior-tempo":
      return list.sort((a, b) => b.totalHours - a.totalHours);
    case "menor-desperdicio":
      return list.sort(
        (a, b) => b.parts / Math.max(1, b.totalHours) - a.parts / Math.max(1, a.totalHours),
      );
    case "ia":
    default: {
      const scores = new Map(scoreAll(list).map((s) => [s.orderId, s.final]));
      return list.sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0));
    }
  }
}