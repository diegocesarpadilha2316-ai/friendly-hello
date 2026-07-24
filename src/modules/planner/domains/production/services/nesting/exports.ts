/**
 * Exportações do Plano de Corte (formatos texto; binários preparados via hooks).
 * Pura serialização — sem I/O.
 */
import type { NestingBoard, NestingPlan } from "./types";

export function toCsv(plan: NestingPlan): string {
  const header = ["board", "code", "x", "y", "w", "h", "rotated", "material", "thickness"].join(",");
  const rows = plan.boards.flatMap((b) =>
    b.placements.map((p) =>
      [b.index, p.code, p.x, p.y, p.w, p.h, p.rotated ? 1 : 0, b.spec.material, b.spec.thicknessMm].join(","),
    ),
  );
  return [header, ...rows].join("\n");
}

export function toSvg(board: NestingBoard): string {
  const w = board.spec.lengthMm;
  const h = board.spec.widthMm;
  const rects = board.placements
    .map(
      (p) =>
        `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="none" stroke="#7c3aed" stroke-width="4"/>` +
        `<text x="${p.x + 20}" y="${p.y + 40}" font-size="24" fill="#7c3aed">${p.code}</text>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>${rects}</svg>`;
}

export function toDxf(board: NestingBoard): string {
  const lines: string[] = ["0", "SECTION", "2", "ENTITIES"];
  for (const p of board.placements) {
    const x1 = p.x, y1 = p.y, x2 = p.x + p.w, y2 = p.y + p.h;
    for (const [a, b, c, d] of [[x1, y1, x2, y1], [x2, y1, x2, y2], [x2, y2, x1, y2], [x1, y2, x1, y1]] as const) {
      lines.push("0", "LINE", "8", "CUT", "10", String(a), "20", String(b), "11", String(c), "21", String(d));
    }
  }
  lines.push("0", "ENDSEC", "0", "EOF");
  return lines.join("\n");
}

export function toExcelXml(plan: NestingPlan): string {
  const rows = plan.boards
    .flatMap((b) =>
      b.placements.map(
        (p) =>
          `<Row><Cell><Data ss:Type="Number">${b.index}</Data></Cell><Cell><Data ss:Type="String">${p.code}</Data></Cell><Cell><Data ss:Type="Number">${p.w}</Data></Cell><Cell><Data ss:Type="Number">${p.h}</Data></Cell></Row>`,
      ),
    )
    .join("");
  return `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Nesting"><Table>${rows}</Table></Worksheet></Workbook>`;
}

export function toPdfText(plan: NestingPlan): string {
  const header = `Plano de Corte · ${plan.algorithm} · ${plan.generatedAt}`;
  const stats = `Chapas ${plan.statistics.boardsCount} · Aproveitamento ${(plan.statistics.avgUsageRatio * 100).toFixed(1)}%`;
  const boards = plan.boards
    .map((b) => `Chapa ${b.index} — ${b.spec.material} ${b.spec.thicknessMm}mm — ${b.placements.length} peças`)
    .join("\n");
  return [header, stats, boards].join("\n");
}
