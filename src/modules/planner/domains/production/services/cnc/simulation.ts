/**
 * Simulador CNC interno — reconstrói trajetória, tempo, troca de
 * ferramenta e colisões básicas. 100% determinístico.
 */
import type { CutListRow } from "../../types";
import { buildOperationsForPart } from "./operations";
import { findTool } from "./tooling";
import { verifyOperations } from "./verification";
import type { CncSimulation, CncSimulationFrame, CncOperation } from "./types";

export function simulateProgram(row: CutListRow, machineId: string): CncSimulation {
  const partOps = buildOperationsForPart(row);
  const frames: CncSimulationFrame[] = [];
  let t = 0;
  let lastTool = "";
  let toolChanges = 0;

  for (const op of partOps.operations) {
    if (op.toolId !== lastTool) {
      toolChanges++;
      lastTool = op.toolId;
      t += 6; // 6s de troca
    }
    const tool = findTool(op.toolId);
    // aproximação em Z5
    frames.push({ t, x: op.x, y: op.y, z: 5, toolId: op.toolId, operationId: op.id, rpm: tool?.rpm ?? 0, feed: 0 });
    // descida
    t += 1;
    frames.push({ t, x: op.x, y: op.y, z: -op.depthMm, toolId: op.toolId, operationId: op.id, rpm: tool?.rpm ?? 0, feed: tool?.feedMmMin ?? 0 });
    // percurso lateral (rasgos)
    if (op.widthMm && op.heightMm) {
      t += Math.max(1, Math.round(op.widthMm / 100));
      frames.push({ t, x: op.x + op.widthMm, y: op.y + op.heightMm, z: -op.depthMm, toolId: op.toolId, operationId: op.id, rpm: tool?.rpm ?? 0, feed: tool?.feedMmMin ?? 0 });
    }
    t += op.estimatedSec;
    frames.push({ t, x: op.x, y: op.y, z: 5, toolId: op.toolId, operationId: op.id, rpm: tool?.rpm ?? 0, feed: 0 });
  }

  const issues = [
    ...verifyOperations(row, partOps.operations, machineId),
    ...detectCollisions(partOps.operations),
  ];

  return {
    partCode: row.code,
    machineId,
    frames,
    totalMin: Math.max(1, Math.round(t / 60)),
    toolChanges: Math.max(0, toolChanges - 1),
    issues,
  };
}

function detectCollisions(ops: readonly CncOperation[]): readonly import("./types").CncIssue[] {
  const out: import("./types").CncIssue[] = [];
  for (let i = 0; i < ops.length; i++) {
    for (let j = i + 1; j < ops.length; j++) {
      const a = ops[i], b = ops[j];
      if (a.widthMm && a.heightMm && b.widthMm && b.heightMm) {
        const overlap = !(b.x >= a.x + a.widthMm || b.x + b.widthMm <= a.x || b.y >= a.y + a.heightMm || b.y + b.heightMm <= a.y);
        if (overlap) out.push({
          severity: "warn",
          kind: "collision",
          operationId: b.id,
          partCode: b.partCode,
          message: `rasgos sobrepostos: ${a.id} × ${b.id}`,
        });
      }
    }
  }
  return out;
}
