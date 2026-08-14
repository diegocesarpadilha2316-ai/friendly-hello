/**
 * Fase 3.24 — Exportação em CSV, JSON, XML e Excel-friendly CSV (BOM).
 */
import type { CatalogItem } from "./types";

export type ExportFormat = "csv" | "json" | "xml" | "excel";

export function toCSV(items: readonly CatalogItem[]): string {
  const header = ["id", "sku", "name", "category", "manufacturer", "basePrice"];
  const rows = items.map((i) =>
    [i.id, i.sku, i.name, i.category, i.manufacturer, String(i.basePrice)].join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function toJSON(items: readonly CatalogItem[]): string {
  return JSON.stringify(items, null, 2);
}

export function toXML(items: readonly CatalogItem[]): string {
  const body = items
    .map(
      (i) =>
        `  <item>\n    <id>${i.id}</id>\n    <sku>${i.sku}</sku>\n    <name>${i.name}</name>\n    <category>${i.category}</category>\n    <manufacturer>${i.manufacturer}</manufacturer>\n    <basePrice>${i.basePrice}</basePrice>\n  </item>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<catalog>\n${body}\n</catalog>`;
}

export function toExcelCSV(items: readonly CatalogItem[]): string {
  const bom = "\uFEFF";
  return bom + toCSV(items);
}

export function exportCatalog(
  items: readonly CatalogItem[],
  format: ExportFormat,
): { readonly content: string; readonly mime: string; readonly filename: string } {
  if (format === "json")
    return { content: toJSON(items), mime: "application/json", filename: "catalog.json" };
  if (format === "xml")
    return { content: toXML(items), mime: "application/xml", filename: "catalog.xml" };
  if (format === "excel")
    return { content: toExcelCSV(items), mime: "text/csv;charset=utf-8", filename: "catalog.csv" };
  return { content: toCSV(items), mime: "text/csv", filename: "catalog.csv" };
}
