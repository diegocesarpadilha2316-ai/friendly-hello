/**
 * Renderização de templates.
 * Suporta substituição simples de {{variavel}} com escape default de HTML.
 * Sem `dangerouslySetInnerHTML`, sem eval, sem lookup em prototypes.
 */
import type { EventPayload } from "@/core/events/types";

const RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

function resolve(path: string, data: EventPayload): string {
  const parts = path.split(".");
  let cur: unknown = data;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[p];
  }
  if (cur == null) return "";
  if (typeof cur === "string") return cur;
  if (typeof cur === "number" || typeof cur === "boolean") return String(cur);
  return "";
}

export function renderTemplate(tpl: string, data: EventPayload): string {
  return tpl.replace(RE, (_, key: string) => resolve(key, data));
}

export function extractVariables(tpl: string): string[] {
  const out = new Set<string>();
  for (const m of tpl.matchAll(RE)) out.add(m[1]);
  return [...out];
}
