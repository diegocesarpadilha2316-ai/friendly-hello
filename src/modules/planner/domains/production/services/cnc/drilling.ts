/**
 * Derivação determinística de furações a partir das peças produzidas.
 * Consome `CutListRow` da Produção — reuso integral.
 */
import type { CutListRow } from "../../types";
import type { CncOperation, CncOperationKind } from "./types";

interface DrillSpec {
  readonly kind: CncOperationKind;
  readonly toolId: string;
  readonly diameterMm: number;
  readonly depthMm: number;
  readonly estimatedSec: number;
}

const MINIFIX: DrillSpec = {
  kind: "minifix",
  toolId: "drill-15",
  diameterMm: 15,
  depthMm: 12,
  estimatedSec: 8,
};
const CAVILHA: DrillSpec = {
  kind: "cavilha",
  toolId: "drill-8",
  diameterMm: 8,
  depthMm: 12,
  estimatedSec: 5,
};
const HINGE: DrillSpec = {
  kind: "hinge",
  toolId: "drill-35",
  diameterMm: 35,
  depthMm: 12,
  estimatedSec: 12,
};

export function deriveDrills(row: CutListRow): readonly CncOperation[] {
  const ops: CncOperation[] = [];
  const L = row.lengthMm,
    W = row.widthMm;
  const push = (spec: DrillSpec, x: number, y: number, i: number) =>
    ops.push({
      id: `${row.code}-${spec.kind}-${i}`,
      partId: row.code,
      partCode: row.code,
      kind: spec.kind,
      x,
      y,
      z: 0,
      diameterMm: spec.diameterMm,
      depthMm: spec.depthMm,
      toolId: spec.toolId,
      estimatedSec: spec.estimatedSec,
    });

  // Sistema 32: cavilhas nas laterais a cada 32mm
  if (row.name.toLowerCase().includes("lateral")) {
    let idx = 0;
    for (let y = 96; y < W - 96; y += 32) {
      push(CAVILHA, 37, y, idx++);
      push(CAVILHA, L - 37, y, idx++);
    }
  }

  // Minifix nos cantos superiores/inferiores para bases e tampos
  const isHorizontal = /base|tampo|prateleira|fundo/i.test(row.name);
  if (isHorizontal) {
    [
      [50, 9],
      [L - 50, 9],
      [50, W - 9],
      [L - 50, W - 9],
    ].forEach(([x, y], i) => push(MINIFIX, x, y, i));
  }

  // Dobradiças para portas
  if (/porta|frente/i.test(row.name)) {
    push(HINGE, 22, 100, 0);
    push(HINGE, 22, W - 100, 1);
    if (W > 1400) push(HINGE, 22, W / 2, 2);
  }

  return ops;
}

export function deriveDrillsForAll(rows: readonly CutListRow[]): readonly CncOperation[] {
  return rows.flatMap((r) => deriveDrills(r));
}
