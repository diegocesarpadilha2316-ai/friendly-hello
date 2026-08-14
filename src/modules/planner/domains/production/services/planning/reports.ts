import type { PlanningOrder, PlanningReportRow } from "./types";

function bucketKey(iso: string, scope: "diario" | "semanal" | "mensal"): string {
  const d = new Date(iso);
  if (scope === "diario") return d.toISOString().slice(0, 10);
  if (scope === "mensal") return d.toISOString().slice(0, 7);
  const first = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - first.getTime()) / 86_400_000 + first.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function buildReport(
  orders: readonly PlanningOrder[],
  scope: "diario" | "semanal" | "mensal" = "semanal",
): readonly PlanningReportRow[] {
  const map = new Map<string, PlanningReportRow>();
  for (const o of orders) {
    const key = bucketKey(o.createdAt, scope);
    const row = map.get(key) ?? {
      period: key,
      orders: 0,
      produced: 0,
      delivered: 0,
      delayed: 0,
      hours: 0,
      revenue: 0,
    };
    row.orders += 1;
    row.hours += o.totalHours;
    row.revenue += o.totalValue;
    if (o.status === "concluido") row.produced += 1;
    if (o.status === "entregue") row.delivered += 1;
    if (o.status === "atrasado") row.delayed += 1;
    map.set(key, row);
  }
  return Array.from(map.values()).sort((a, b) => a.period.localeCompare(b.period));
}

export function reportToCsv(rows: readonly PlanningReportRow[]): string {
  const header = ["Período", "Pedidos", "Produzidos", "Entregues", "Atrasados", "Horas", "Receita"];
  const lines = rows.map((r) =>
    [
      r.period,
      r.orders,
      r.produced,
      r.delivered,
      r.delayed,
      r.hours.toFixed(1),
      r.revenue.toFixed(2),
    ].join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

export function reportToExcelXml(rows: readonly PlanningReportRow[]): string {
  const cells = (r: PlanningReportRow) =>
    `<Row>${[
      r.period,
      r.orders,
      r.produced,
      r.delivered,
      r.delayed,
      r.hours.toFixed(1),
      r.revenue.toFixed(2),
    ]
      .map((v) => `<Cell><Data ss:Type="String">${v}</Data></Cell>`)
      .join("")}</Row>`;
  return `<?xml version="1.0"?>\n<Workbook xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n<Worksheet ss:Name="PCP"><Table>${rows.map(cells).join("")}</Table></Worksheet>\n</Workbook>`;
}

export function reportToPdfText(rows: readonly PlanningReportRow[]): string {
  const header = "Dioris — PCP · Relatório\n" + "=".repeat(56) + "\n";
  const body = rows
    .map(
      (r) =>
        `${r.period.padEnd(12)} · pedidos ${String(r.orders).padStart(3)} · produzidos ${String(
          r.produced,
        ).padStart(3)} · atrasados ${String(r.delayed).padStart(3)} · horas ${r.hours
          .toFixed(1)
          .padStart(6)} · receita R$ ${r.revenue.toFixed(2)}`,
    )
    .join("\n");
  return header + body + "\n";
}
