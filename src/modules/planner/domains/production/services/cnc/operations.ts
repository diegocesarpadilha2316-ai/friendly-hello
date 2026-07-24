/**
 * Consolidação de operações CNC para cada peça — furos + rasgos + cortes.
 */
import type { CutListRow } from "../../types";
import { deriveDrills } from "./drilling";
import { deriveGrooves } from "./grooves";
import type { CncOperation } from "./types";

export interface PartOperations {
  readonly partCode: string;
  readonly operations: readonly CncOperation[];
  readonly totalSec: number;
  readonly toolChanges: number;
}

export function buildOperationsForPart(row: CutListRow): PartOperations {
  const raw = [...deriveDrills(row), ...deriveGrooves(row)];
  const ops = optimizeOrder(raw);
  const totalSec = ops.reduce((a, o) => a + o.estimatedSec, 0);
  return {
    partCode: row.code,
    operations: ops,
    totalSec,
    toolChanges: countToolChanges(ops),
  };
}

export function buildOperations(rows: readonly CutListRow[]): readonly PartOperations[] {
  return rows.map(buildOperationsForPart);
}

/** Agrupa por ferramenta para minimizar trocas — reuso da lógica industrial. */
function optimizeOrder(ops: readonly CncOperation[]): readonly CncOperation[] {
  const byTool = new Map<string, CncOperation[]>();
  for (const o of ops) {
    const arr = byTool.get(o.toolId) ?? [];
    arr.push(o);
    byTool.set(o.toolId, arr);
  }
  const sortedTools = [...byTool.keys()].sort();
  return sortedTools.flatMap((t) =>
    (byTool.get(t) ?? []).sort((a, b) => a.y - b.y || a.x - b.x),
  );
}

function countToolChanges(ops: readonly CncOperation[]): number {
  let changes = 0;
  let last = "";
  for (const o of ops) {
    if (o.toolId !== last) { changes++; last = o.toolId; }
  }
  return Math.max(0, changes - 1);
}
