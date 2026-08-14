import type { CalendarDay } from "./types";

const BR_HOLIDAYS_2026: readonly { date: string; label: string }[] = [
  { date: "2026-01-01", label: "Confraternização Universal" },
  { date: "2026-02-16", label: "Carnaval" },
  { date: "2026-02-17", label: "Carnaval" },
  { date: "2026-04-03", label: "Sexta-feira Santa" },
  { date: "2026-04-21", label: "Tiradentes" },
  { date: "2026-05-01", label: "Dia do Trabalho" },
  { date: "2026-06-04", label: "Corpus Christi" },
  { date: "2026-09-07", label: "Independência" },
  { date: "2026-10-12", label: "N. Sra. Aparecida" },
  { date: "2026-11-02", label: "Finados" },
  { date: "2026-11-15", label: "Proclamação da República" },
  { date: "2026-12-25", label: "Natal" },
];

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildIndustrialCalendar(
  startISO: string,
  days: number,
  opts: { shiftHours?: number; overtimeHours?: number; maintenanceDays?: readonly string[] } = {},
): CalendarDay[] {
  const holidays = new Map(BR_HOLIDAYS_2026.map((h) => [h.date, h.label]));
  const maint = new Set(opts.maintenanceDays ?? []);
  const shiftHours = opts.shiftHours ?? 8;
  const overtimeHours = opts.overtimeHours ?? 0;

  const out: CalendarDay[] = [];
  const start = new Date(startISO);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso10 = iso(d);
    const dow = d.getDay();
    const isHoliday = holidays.has(iso10);
    const isMaintenance = maint.has(iso10);
    const isWorkday = dow !== 0 && dow !== 6 && !isHoliday && !isMaintenance;
    out.push({
      date: iso10,
      isWorkday,
      isHoliday,
      isMaintenance,
      shiftHours: isWorkday ? shiftHours : 0,
      overtimeHours: isWorkday ? overtimeHours : 0,
      label: holidays.get(iso10),
    });
  }
  return out;
}

export function workdaysBetween(cal: readonly CalendarDay[]): number {
  return cal.filter((d) => d.isWorkday).length;
}

export function totalCalendarHours(cal: readonly CalendarDay[]): number {
  return cal.reduce((acc, d) => acc + d.shiftHours + d.overtimeHours, 0);
}

export function nextWorkday(cal: readonly CalendarDay[], fromIndex = 0): number {
  for (let i = fromIndex; i < cal.length; i++) if (cal[i].isWorkday) return i;
  return -1;
}
