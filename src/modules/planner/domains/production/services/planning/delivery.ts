import type { DeliveryEstimate, PlanningOrder } from "./types";

export function estimateDelivery(orders: readonly PlanningOrder[]): readonly DeliveryEstimate[] {
  const now = new Date();
  return orders.map((o) => {
    const due = new Date(o.dueDate);
    const daysRemaining = Math.round((due.getTime() - now.getTime()) / 86_400_000);
    const workLeftPct = Math.max(0, 100 - o.progress) / 100;
    const estDays = Math.ceil((o.totalHours * workLeftPct) / 8);
    const est = new Date(now);
    est.setDate(now.getDate() + estDays);
    const delayDays = Math.max(0, Math.round((est.getTime() - due.getTime()) / 86_400_000));
    const atRisk = delayDays > 0 || daysRemaining <= 2;
    return {
      orderId: o.id,
      orderCode: o.code,
      clientName: o.clientName,
      dueDate: o.dueDate,
      estimatedDelivery: est.toISOString().slice(0, 10),
      daysRemaining,
      delayDays,
      atRisk,
      onTime: delayDays === 0,
      progressPct: o.progress,
    };
  });
}

export function delayedOrders(estimates: readonly DeliveryEstimate[]): readonly DeliveryEstimate[] {
  return estimates.filter((e) => e.delayDays > 0).sort((a, b) => b.delayDays - a.delayDays);
}