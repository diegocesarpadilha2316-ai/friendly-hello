import type { CapacitySnapshot, DeliveryEstimate, MachineBalance, RoutingPlan } from "./types";

function addBusinessDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const w = d.getDay();
    if (w !== 0 && w !== 6) added++;
  }
  return d;
}

export function estimateDelivery(
  routings: readonly RoutingPlan[],
  capacity: CapacitySnapshot,
  balance: MachineBalance,
  desiredEta?: string,
): DeliveryEstimate {
  const totalMinutes = routings.reduce((a, r) => a + r.totalMinutes, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const effectiveDays =
    capacity.dailyCapacityH > 0 ? Math.max(1, Math.ceil(totalHours / capacity.dailyCapacityH)) : 0;
  const bufferDays =
    balance.bottleneckId && balance.loads.some((l) => l.utilizationPct >= 90) ? 1 : 0;
  const finishDate = addBusinessDays(new Date(), effectiveDays + bufferDays).toISOString();
  const confidence: DeliveryEstimate["confidence"] =
    capacity.utilizationPct >= 90 ? "baixa" : capacity.utilizationPct >= 70 ? "media" : "alta";
  let onTime = true;
  if (desiredEta) {
    const target = new Date(desiredEta).getTime();
    if (!Number.isNaN(target)) onTime = new Date(finishDate).getTime() <= target;
  }
  return { totalMinutes, totalHours, effectiveDays, finishDate, confidence, bufferDays, onTime };
}
