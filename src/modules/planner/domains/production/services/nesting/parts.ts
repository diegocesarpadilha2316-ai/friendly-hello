/**
 * Normalização de peças para o motor de nesting.
 * Consome `CutListRow` da produção existente — reuso integral.
 */
import type { CutListRow } from "../../types";
import type { NestingPart } from "./types";

export function toNestingParts(rows: readonly CutListRow[]): readonly NestingPart[] {
  return rows.map((row, idx) => ({
    id: `${row.code}:${idx}`,
    code: row.code,
    name: row.name,
    widthMm: Math.max(row.lengthMm, row.widthMm),
    heightMm: Math.min(row.lengthMm, row.widthMm),
    thicknessMm: row.thicknessMm,
    material: row.material,
    color: row.edgeTape,
    qty: row.qty,
    grain: row.grain as NestingPart["grain"],
    edgeTape: row.edgeTape,
    label: row.name,
  }));
}

export function expandQuantities(parts: readonly NestingPart[]): readonly NestingPart[] {
  const out: NestingPart[] = [];
  for (const p of parts) {
    for (let i = 0; i < p.qty; i++) {
      out.push({ ...p, id: `${p.id}:${i}`, qty: 1 });
    }
  }
  return out;
}

export function groupByMaterial(
  parts: readonly NestingPart[],
): ReadonlyMap<string, readonly NestingPart[]> {
  const map = new Map<string, NestingPart[]>();
  for (const p of parts) {
    const key = `${p.material}|${p.thicknessMm}`;
    const arr = map.get(key) ?? [];
    arr.push(p);
    map.set(key, arr);
  }
  return map;
}

export function sortForPacking(parts: readonly NestingPart[]): readonly NestingPart[] {
  return [...parts].sort(
    (a, b) => b.heightMm - a.heightMm || b.widthMm - a.widthMm,
  );
}
