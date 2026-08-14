import { buildIndustrialCalendar, totalCalendarHours, workdaysBetween } from "./calendar";
import { computeMachineLoad, findOverloadedMachines } from "./machines";
import { computeOperatorLoad } from "./operators";
import type { CapacityBottleneck, CapacityWindow } from "./types";

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function computeCapacityWindow(
  scope: CapacityWindow["scope"],
  totalHoursDemand: number,
  startISO: string = iso(new Date()),
): CapacityWindow {
  const days = scope === "diaria" ? 1 : scope === "semanal" ? 7 : 30;
  const cal = buildIndustrialCalendar(startISO, days);
  void workdaysBetween(cal);
  const availableHours = totalCalendarHours(cal);
  const usedHours = Math.min(availableHours, totalHoursDemand);
  const idleHours = Math.max(0, availableHours - usedHours);
  const utilizationPct = availableHours > 0 ? +((usedHours / availableHours) * 100).toFixed(1) : 0;
  const end = new Date(startISO);
  end.setDate(end.getDate() + days - 1);
  return {
    scope,
    from: startISO,
    to: iso(end),
    availableHours: +availableHours.toFixed(1),
    usedHours: +usedHours.toFixed(1),
    idleHours: +idleHours.toFixed(1),
    utilizationPct: Math.min(100, Math.max(0, utilizationPct)),
  } satisfies CapacityWindow;
}

export function computeBottlenecks(
  totalHoursDemand: number,
  windowDays: number,
): readonly CapacityBottleneck[] {
  const machines = computeMachineLoad(totalHoursDemand, windowDays);
  const overloaded = findOverloadedMachines(machines);
  const ops = computeOperatorLoad(totalHoursDemand, windowDays);
  const opBottle = ops.filter((o) => o.loadPct > 100);
  return [
    ...overloaded.map<CapacityBottleneck>((m) => ({
      resourceId: m.resourceId,
      label: m.label,
      loadPct: m.loadPct,
      overloadedHours: +Math.max(0, m.loadH - m.capacityH).toFixed(1),
    })),
    ...opBottle.map<CapacityBottleneck>((o) => ({
      resourceId: o.resourceId,
      label: o.label,
      loadPct: o.loadPct,
      overloadedHours: +Math.max(0, o.loadH - o.capacityH).toFixed(1),
    })),
  ];
}
