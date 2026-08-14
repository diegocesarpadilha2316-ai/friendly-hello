/** Fase 3.25 — Exportação em CSV/JSON/XML/Excel/PDF. */
import type { MarketplaceItem } from "../types";

export type MarketplaceExportFormat = "csv" | "json" | "xml" | "excel" | "pdf";

export function toCSV(items: readonly MarketplaceItem[]): string {
  const header = [
    "id",
    "name",
    "brand",
    "category",
    "version",
    "license",
    "price",
    "downloads",
    "rating",
  ];
  const rows = items.map((i) =>
    [
      i.id,
      JSON.stringify(i.name),
      i.brand,
      i.category,
      i.version,
      i.license,
      String(i.pricing.amount),
      String(i.downloads),
      i.rating.average.toFixed(1),
    ].join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function toJSON(items: readonly MarketplaceItem[]): string {
  return JSON.stringify(items, null, 2);
}

export function toXML(items: readonly MarketplaceItem[]): string {
  const body = items
    .map(
      (i) =>
        `  <item>\n    <id>${i.id}</id>\n    <name>${i.name}</name>\n    <brand>${i.brand}</brand>\n    <version>${i.version}</version>\n  </item>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<marketplace>\n${body}\n</marketplace>`;
}

export function toExcel(items: readonly MarketplaceItem[]): string {
  // Excel via CSV compatível (BOM UTF-8).
  return `\uFEFF${toCSV(items)}`;
}

export function toPDFText(items: readonly MarketplaceItem[]): string {
  const lines = items.map(
    (i) =>
      `${i.brand.toUpperCase()} • ${i.name} v${i.version} — ${i.pricing.kind === "free" ? "Gratuito" : `R$ ${i.pricing.amount.toFixed(2)}`}`,
  );
  return `Dioris Marketplace\n\n${lines.join("\n")}`;
}

export function exportItems(
  items: readonly MarketplaceItem[],
  format: MarketplaceExportFormat,
): string {
  switch (format) {
    case "csv":
      return toCSV(items);
    case "json":
      return toJSON(items);
    case "xml":
      return toXML(items);
    case "excel":
      return toExcel(items);
    case "pdf":
      return toPDFText(items);
  }
}
