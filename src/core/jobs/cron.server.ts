function parseField(expr: string, min: number, max: number): number[] {
  if (expr === "*") return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const out = new Set<number>();
  for (const part of expr.split(",")) {
    const step = part.includes("/") ? Number(part.split("/")[1]) : 1;
    const range = part.split("/")[0];
    let a = min;
    let b = max;
    if (range !== "*") {
      if (range.includes("-")) [a, b] = range.split("-").map(Number);
      else a = b = Number(range);
    }
    for (let i = a; i <= b; i += step) out.add(i);
  }
  return Array.from(out).sort((x, y) => x - y);
}

export function nextCronRun(expr: string, from: Date = new Date()): Date {
  const [min, hr, dom, mon, dow] = expr.trim().split(/\s+/);
  const mins = parseField(min, 0, 59);
  const hrs = parseField(hr, 0, 23);
  const doms = parseField(dom, 1, 31);
  const mons = parseField(mon, 1, 12);
  const dows = parseField(dow, 0, 6);
  const d = new Date(from.getTime() + 60_000);
  d.setSeconds(0, 0);
  for (let i = 0; i < 366 * 24 * 60; i++) {
    if (
      mins.includes(d.getMinutes()) &&
      hrs.includes(d.getHours()) &&
      doms.includes(d.getDate()) &&
      mons.includes(d.getMonth() + 1) &&
      dows.includes(d.getDay())
    )
      return d;
    d.setMinutes(d.getMinutes() + 1);
  }
  return new Date(from.getTime() + 3_600_000);
}