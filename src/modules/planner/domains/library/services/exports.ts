import type { LibraryExportFormat, LibraryHardware, LibraryMaterial } from "../types";

function csv(rows: readonly Record<string, unknown>[], headers: readonly string[]): string {
  const esc = (v: unknown) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(","));
  return lines.join("\n");
}

export function exportMaterials(items: readonly LibraryMaterial[], format: LibraryExportFormat = "json"): { content: string; mime: string; filename: string } {
  const H = ["id","name","manufacturer","line","category","pattern","colorName","colorHex","thicknessMm","widthMm","lengthMm","grain","pricePerM2"];
  const rows = items as unknown as Record<string, unknown>[];
  if (format === "json") return { content: JSON.stringify(items, null, 2), mime: "application/json", filename: "biblioteca-materiais.json" };
  if (format === "xml") return { content: `<materials>\n${items.map((i) => `  <m id="${i.id}"/>`).join("\n")}\n</materials>`, mime: "application/xml", filename: "biblioteca-materiais.xml" };
  if (format === "excel") return { content: "\uFEFF" + csv(rows, H), mime: "text/csv;charset=utf-8", filename: "biblioteca-materiais.csv" };
  if (format === "bom") return { content: csv(rows, ["id","name","manufacturer","thicknessMm","pricePerM2"]), mime: "text/csv", filename: "biblioteca-materiais-bom.csv" };
  return { content: csv(rows, H), mime: "text/csv", filename: "biblioteca-materiais.csv" };
}

export function exportHardware(items: readonly LibraryHardware[], format: LibraryExportFormat = "json"): { content: string; mime: string; filename: string } {
  const H = ["id","manufacturer","brand","category","model","unitPrice","drillDiameterMm","drillDepthMm","clearanceMm"];
  const rows = items as unknown as Record<string, unknown>[];
  if (format === "json") return { content: JSON.stringify(items, null, 2), mime: "application/json", filename: "biblioteca-ferragens.json" };
  if (format === "xml") return { content: `<hardware>\n${items.map((i) => `  <h id="${i.id}"/>`).join("\n")}\n</hardware>`, mime: "application/xml", filename: "biblioteca-ferragens.xml" };
  if (format === "excel") return { content: "\uFEFF" + csv(rows, H), mime: "text/csv;charset=utf-8", filename: "biblioteca-ferragens.csv" };
  if (format === "bom") return { content: csv(rows, ["id","model","manufacturer","unitPrice"]), mime: "text/csv", filename: "biblioteca-ferragens-bom.csv" };
  return { content: csv(rows, H), mime: "text/csv", filename: "biblioteca-ferragens.csv" };
}