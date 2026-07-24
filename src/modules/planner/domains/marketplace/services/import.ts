/** Fase 3.25 — Importação (CSV/JSON/XML/Excel-CSV) de itens externos. */
import type { MarketplaceItem } from "../types";

export type MarketplaceImportFormat = "csv" | "json" | "xml" | "excel";

export interface MarketplaceImportResult {
  readonly format: MarketplaceImportFormat;
  readonly items: readonly Partial<MarketplaceItem>[];
  readonly errors: readonly string[];
}

function fromJSON(text: string): MarketplaceImportResult {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) return { format: "json", items: [], errors: ["esperado array"] };
    return { format: "json", items: parsed as Partial<MarketplaceItem>[], errors: [] };
  } catch (err) {
    return { format: "json", items: [], errors: [(err as Error).message] };
  }
}

function fromCSV(text: string, format: MarketplaceImportFormat): MarketplaceImportResult {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { format, items: [], errors: ["arquivo vazio"] };
  const header = lines[0]!.split(",").map((h) => h.trim());
  const errors: string[] = [];
  const items: Partial<MarketplaceItem>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]!.split(",");
    const row: Record<string, string> = {};
    header.forEach((h, idx) => (row[h] = (cols[idx] ?? "").trim()));
    if (!row.id || !row.name) {
      errors.push(`linha ${i + 1}: id/name ausentes`);
      continue;
    }
    items.push({ id: row.id, name: row.name, description: row.description ?? row.name });
  }
  return { format, items, errors };
}

function fromXML(text: string): MarketplaceImportResult {
  const items: Partial<MarketplaceItem>[] = [];
  const errors: string[] = [];
  const regex = /<item\b[^>]*>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const body = match[1] ?? "";
    const id = /<id>([^<]+)<\/id>/.exec(body)?.[1];
    const name = /<name>([^<]+)<\/name>/.exec(body)?.[1];
    if (!id || !name) {
      errors.push("<item> sem id/name");
      continue;
    }
    items.push({ id, name });
  }
  return { format: "xml", items, errors };
}

export function importMarketplace(text: string, format: MarketplaceImportFormat): MarketplaceImportResult {
  if (format === "json") return fromJSON(text);
  if (format === "xml") return fromXML(text);
  return fromCSV(text, format);
}
