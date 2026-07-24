/**
 * Geração real de programas CNC — encadeia operações → post processor.
 */
import type { CutListRow } from "../../types";
import { findMachine } from "./machines";
import { buildOperationsForPart } from "./operations";
import { postProcessor } from "./postprocessors";
import { findTool } from "./tooling";
import type { CncFormat, CncProgram, CncTool } from "./types";

export function generateProgram(
  row: CutListRow,
  machineId: string,
  format?: CncFormat,
): CncProgram | null {
  const machine = findMachine(machineId);
  if (!machine) return null;
  const chosenFormat: CncFormat = format ?? machine.formats[0];
  if (!machine.formats.includes(chosenFormat)) return null;

  const partOps = buildOperationsForPart(row);
  const tools: CncTool[] = [];
  for (const o of partOps.operations) {
    if (!tools.find((t) => t.id === o.toolId)) {
      const tool = findTool(o.toolId);
      if (tool) tools.push(tool);
    }
  }

  const code = postProcessor(chosenFormat)({
    machine,
    partCode: row.code,
    operations: partOps.operations,
    tools,
  });

  return {
    id: `${row.code}-${machineId}-${chosenFormat}`,
    machineId,
    format: chosenFormat,
    partCode: row.code,
    operations: partOps.operations,
    tools,
    code,
    estimatedMin: Math.max(1, Math.round(partOps.totalSec / 60)),
    generatedAt: new Date().toISOString(),
  };
}

export function generatePrograms(
  rows: readonly CutListRow[],
  machineId: string,
  format?: CncFormat,
): readonly CncProgram[] {
  return rows
    .map((r) => generateProgram(r, machineId, format))
    .filter((p): p is CncProgram => p !== null);
}
