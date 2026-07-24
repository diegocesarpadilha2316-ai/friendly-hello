/**
 * Fase 3.24 — Importação de itens (CSV, JSON, XML, Excel via CSV).
 *
 * A importação é in-memory; o app decide se persiste via updateProject().
 * Nada aqui cria providers/stores/banco.
 */
import type { CatalogItem } from "./types";

export type ImportFormat = "csv" | "json" | "xml" | "excel";

export interface ImportResult {
  readonly format: ImportFormat;
  readonly items: readonly Partial<CatalogItem>[];
  readonly errors: readonly string[];
}

function fromCSV(text: string): ImportResult {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { format: "csv", items: [], errors: ["arquivo vazio"] };
  const header = lines[0]!.split(",").map((h) => h.trim());
  const errors: string[] = [];
  const items: Partial<CatalogItem>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]!.split(",");
    const row: Record<string, string> = {};
    header.forEach((h, idx) => (row[h] = (cols[idx] ?? "").trim()));
    if (!row.id || !row.name) {
      errors.push(`linha ${i + 1}: id/name ausentes`);
      continue;
    }
    items.push({ id: row.id, name: row.name, sku: row.sku ?? `DR-${row.id}`, description: row.description ?? row.name });
  }
  return { format: "csv", items, errors };
}

function fromJSON(text: string): ImportResult {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) return { format: "json", items: [], errors: ["esperado array no topo"] };
    return { format: "json", items: parsed as Partial<CatalogItem>[], errors: [] };
  } catch (err) {
    return { format: "json", items: [], errors: [(err as Error).message] };
  }
}

function fromXML(text: string): ImportResult {
  const items: Partial<CatalogItem>[] = [];
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

export function importCatalog(text: string, format: ImportFormat): ImportResult {
  if (format === "json") return fromJSON(text);
  if (format === "xml") return fromXML(text);
  return fromCSV(text);
}