/**
 * Exportações — programa, ficha de usinagem, lista de ferramentas,
 * relatório em CSV, PDF texto, Excel XML, ZIP (manifesto textual).
 */
import type { CncProgram, CncTool } from "./types";

export function programToCsv(programs: readonly CncProgram[]): string {
  const header = ["part", "machine", "format", "operations", "tools", "estimatedMin"].join(",");
  const rows = programs.map(
    (p) =>
      [p.partCode, p.machineId, p.format, p.operations.length, p.tools.length, p.estimatedMin].join(","),
  );
  return [header, ...rows].join("\n");
}

export function toolListCsv(tools: readonly CncTool[]): string {
  const header = ["id", "kind", "diameter", "rpm", "feed", "maxDepth", "material"].join(",");
  const rows = tools.map((t) => [t.id, t.kind, t.diameterMm, t.rpm, t.feedMmMin, t.maxDepthMm, t.material].join(","));
  return [header, ...rows].join("\n");
}

export function programToPdfText(program: CncProgram): string {
  const header = `Programa CNC ${program.partCode} · ${program.format.toUpperCase()} · ${program.estimatedMin} min`;
  const ops = program.operations
    .map((o) => `  ${o.kind.padEnd(16)} @ (${o.x}, ${o.y}) · ${o.toolId} · ${o.depthMm}mm`)
    .join("\n");
  return [header, "Operações:", ops].join("\n");
}

export function programToExcelXml(programs: readonly CncProgram[]): string {
  const rows = programs
    .flatMap((p) =>
      p.operations.map(
        (o) =>
          `<Row><Cell><Data ss:Type="String">${p.partCode}</Data></Cell><Cell><Data ss:Type="String">${o.kind}</Data></Cell><Cell><Data ss:Type="Number">${o.x}</Data></Cell><Cell><Data ss:Type="Number">${o.y}</Data></Cell><Cell><Data ss:Type="Number">${o.depthMm}</Data></Cell></Row>`,
      ),
    )
    .join("");
  return `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="CNC"><Table>${rows}</Table></Worksheet></Workbook>`;
}

export function zipManifest(programs: readonly CncProgram[]): string {
  const lines = ["# Dioris CNC — manifesto"];
  for (const p of programs) {
    lines.push(`${p.partCode}.${p.format} (${p.operations.length} operações · ${p.estimatedMin}min)`);
  }
  return lines.join("\n");
}
