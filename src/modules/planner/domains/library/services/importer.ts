import { parseCSV, parseJSON } from "./parser";
import { validateHardwareRow, validateMaterialRow } from "./validator";
import type { LibraryHardware, LibraryImportReport, LibraryMaterial } from "../types";

function isHardwareRow(row: Record<string, unknown>): boolean {
  const cat = String(row.categoria ?? "").toLowerCase();
  return (
    row.modelo != null ||
    row.parametros_cnc != null ||
    row.furacao != null ||
    /(dobradi|corredi|puxador|minifix|cavilha|parafuso|perfil|amortecedor|pist|cabideiro|rod[íi]zio|led|fonte|sensor|p[ée])/i.test(
      cat,
    )
  );
}

function importRows(rows: readonly Record<string, unknown>[]): LibraryImportReport {
  const materials: LibraryMaterial[] = [];
  const hardware: LibraryHardware[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  rows.forEach((row, i) => {
    const id = String(row.id ?? row.codigo ?? "").trim();
    if (id && seen.has(id)) return;
    if (id) seen.add(id);
    if (isHardwareRow(row)) {
      const r = validateHardwareRow(row, i + 2);
      if (r.valid) hardware.push(r.valid);
      else errors.push(...r.errors);
    } else {
      const r = validateMaterialRow(row, i + 2);
      if (r.valid) materials.push(r.valid);
      else errors.push(...r.errors);
    }
  });
  return {
    total: rows.length,
    valid: materials.length + hardware.length,
    invalid: rows.length - (materials.length + hardware.length),
    errors,
    materials,
    hardware,
  };
}

export function importFromCSV(text: string): LibraryImportReport {
  return importRows(parseCSV(text));
}
export function importFromJSON(text: string): LibraryImportReport {
  const parsed = parseJSON<unknown>(text);
  if (!parsed)
    return {
      total: 0,
      valid: 0,
      invalid: 0,
      errors: ["JSON invalido"],
      materials: [],
      hardware: [],
    };
  const rows: Record<string, unknown>[] = [];
  const push = (arr: unknown) => {
    if (Array.isArray(arr))
      for (const r of arr) if (r && typeof r === "object") rows.push(r as Record<string, unknown>);
  };
  if (Array.isArray(parsed)) push(parsed);
  else if (typeof parsed === "object") {
    const o = parsed as Record<string, unknown>;
    push(o.chapas);
    push(o.materiais);
    push(o.materials);
    push(o.ferragens);
    push(o.hardware);
    push(o.items);
  }
  return importRows(rows);
}
export function importAuto(text: string, filenameHint?: string): LibraryImportReport {
  const t = text.trimStart();
  if (t.startsWith("{") || t.startsWith("[") || filenameHint?.endsWith(".json"))
    return importFromJSON(text);
  return importFromCSV(text);
}
