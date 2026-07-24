import { buildIndustrialCalendar, nextWorkday } from "./calendar";
import { sortByStrategy } from "./priority";
import { listMachines } from "./machines";
import type { PlanningOrder, ScheduleEntry, SequencingStrategy } from "./types";

const STAGES = ["Corte", "Usinagem", "Colagem", "Montagem", "Acabamento"] as const;

function iso(d: Date): string {
  return d.toISOString();
}

export function scheduleOrders(
  orders: readonly PlanningOrder[],
  strategy: SequencingStrategy,
  startISO: string = new Date().toISOString().slice(0, 10),
  horizonDays: number = 30,
): readonly ScheduleEntry[] {
  const cal = buildIndustrialCalendar(startISO, horizonDays);
  const machines = listMachines();
  if (machines.length === 0) return [];

  const cursor = new Map<string, number>(); // resourceId → dayIndex
  const hoursLeft = new Map<string, number>(); // per day per resource
  for (const m of machines) cursor.set(m.id, nextWorkday(cal, 0));

  const sorted = sortByStrategy(orders, strategy);
  const entries: ScheduleEntry[] = [];
  let sequence = 0;

  for (const order of sorted) {
    const perStage = order.totalHours / STAGES.length;
    for (const stage of STAGES) {
      const machine =
        machines.find((m) => m.sector === stage) ?? machines[sequence % machines.length];
      let dayIdx = cursor.get(machine.id) ?? nextWorkday(cal, 0);
      if (dayIdx < 0 || dayIdx >= cal.length) break;
      const key = `${machine.id}-${dayIdx}`;
      const remaining = hoursLeft.get(key) ?? machine.hoursPerDay;
      if (remaining < perStage) {
        dayIdx = nextWorkday(cal, dayIdx + 1);
        if (dayIdx < 0 || dayIdx >= cal.length) break;
        cursor.set(machine.id, dayIdx);
      }
      const currentKey = `${machine.id}-${dayIdx}`;
      const remain2 = hoursLeft.get(currentKey) ?? machine.hoursPerDay;
      const startDay = new Date(cal[dayIdx].date);
      const hoursUsedToday = machine.hoursPerDay - remain2;
      const start = new Date(startDay);
      start.setHours(8 + Math.floor(hoursUsedToday), 0, 0, 0);
      const end = new Date(start);
      end.setHours(start.getHours() + Math.max(1, Math.ceil(perStage)));
      hoursLeft.set(currentKey, Math.max(0, remain2 - perStage));
      entries.push({
        orderId: order.id,
        orderCode: order.code,
        resourceId: machine.id,
        startAt: iso(start),
        endAt: iso(end),
        durationH: +perStage.toFixed(2),
        stage,
        sequence: sequence++,
      });
    }
  }
  return entries;
}

export function scheduleTotals(entries: readonly ScheduleEntry[]): {
  totalH: number;
  byStage: Readonly<Record<string, number>>;
  byResource: Readonly<Record<string, number>>;
} {
  const byStage: Record<string, number> = {};
  const byResource: Record<string, number> = {};
  let totalH = 0;
  for (const e of entries) {
    totalH += e.durationH;
    byStage[e.stage] = (byStage[e.stage] ?? 0) + e.durationH;
    byResource[e.resourceId] = (byResource[e.resourceId] ?? 0) + e.durationH;
  }
  return { totalH: +totalH.toFixed(1), byStage, byResource };
}