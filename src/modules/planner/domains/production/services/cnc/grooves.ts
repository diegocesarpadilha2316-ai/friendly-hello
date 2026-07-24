/**
 * Rasgos, canais, rebaixos, pockets e usinagens especiais.
 */
import type { CutListRow } from "../../types";
import type { CncOperation } from "./types";

export function deriveGrooves(row: CutListRow): readonly CncOperation[] {
  const ops: CncOperation[] = [];
  const L = row.lengthMm, W = row.widthMm;

  // Canal para fundo — 6mm de profundidade em laterais/base/tampo
  if (/lateral|base|tampo/i.test(row.name)) {
    ops.push({
      id: `${row.code}-groove-back`,
      partId: row.code,
      partCode: row.code,
      kind: "groove-back",
      x: 10, y: 10, z: 0,
      widthMm: L - 20,
      heightMm: 6,
      depthMm: 8,
      toolId: "endmill-6",
      estimatedSec: Math.max(6, Math.round(L / 200)),
    });
  }

  // Canal LED em bancada / tampo
  if (/bancada|tampo/i.test(row.name) && L > 800) {
    ops.push({
      id: `${row.code}-groove-led`,
      partId: row.code,
      partCode: row.code,
      kind: "groove-led",
      x: 40, y: W / 2, z: 0,
      widthMm: L - 80,
      heightMm: 12,
      depthMm: 10,
      toolId: "endmill-12",
      estimatedSec: Math.max(8, Math.round(L / 180)),
    });
  }

  // Pocket para pistão em portas grandes basculantes
  if (/porta/i.test(row.name) && W > 800) {
    ops.push({
      id: `${row.code}-pocket-piston`,
      partId: row.code,
      partCode: row.code,
      kind: "pocket",
      x: 60, y: 60, z: 0,
      widthMm: 40, heightMm: 20, depthMm: 10,
      toolId: "endmill-8",
      estimatedSec: 14,
    });
  }

  return ops;
}

export function deriveGroovesForAll(rows: readonly CutListRow[]): readonly CncOperation[] {
  return rows.flatMap((r) => deriveGrooves(r));
}
