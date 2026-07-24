/**
 * Verificações automáticas — furos duplicados, colisão, fora da peça,
 * ferramenta incompatível, veio, etc.
 */
import type { CutListRow } from "../../types";
import { findMachine } from "./machines";
import { findTool } from "./tooling";
import type { CncIssue, CncOperation } from "./types";

export function verifyOperations(
  row: CutListRow,
  operations: readonly CncOperation[],
  machineId?: string,
): readonly CncIssue[] {
  const issues: CncIssue[] = [];
  const machine = machineId ? findMachine(machineId) : undefined;

  // duplicados
  const seen = new Map<string, CncOperation>();
  for (const op of operations) {
    const key = `${op.kind}|${op.x}|${op.y}|${op.diameterMm ?? 0}`;
    if (seen.has(key)) {
      issues.push({
        severity: "warn",
        kind: "duplicate-drill",
        operationId: op.id,
        partCode: row.code,
        message: `furo duplicado (${op.x}, ${op.y}) em ${row.code}`,
      });
    } else seen.set(key, op);
  }

  // fora da peça
  for (const op of operations) {
    if (op.x < 0 || op.y < 0 || op.x > row.lengthMm || op.y > row.widthMm) {
      issues.push({
        severity: "error",
        kind: "out-of-bounds",
        operationId: op.id,
        partCode: row.code,
        message: `operação fora da peça em ${row.code}`,
      });
    }
  }

  // profundidade > espessura
  for (const op of operations) {
    if (op.kind === "drill-through") continue;
    if (op.depthMm > row.thicknessMm) {
      issues.push({
        severity: "error",
        kind: "impossible-operation",
        operationId: op.id,
        partCode: row.code,
        message: `profundidade ${op.depthMm}mm excede espessura ${row.thicknessMm}mm`,
      });
    }
  }

  // ferramenta incompatível
  for (const op of operations) {
    const tool = findTool(op.toolId);
    if (!tool) {
      issues.push({
        severity: "error",
        kind: "incompatible-tool",
        operationId: op.id,
        partCode: row.code,
        message: `ferramenta ${op.toolId} desconhecida`,
      });
      continue;
    }
    if (op.depthMm > tool.maxDepthMm) {
      issues.push({
        severity: "warn",
        kind: "incompatible-tool",
        operationId: op.id,
        partCode: row.code,
        message: `${tool.label} não suporta ${op.depthMm}mm (máx ${tool.maxDepthMm}mm)`,
      });
    }
  }

  // limites da máquina
  if (machine) {
    if (row.lengthMm > machine.bedX || row.widthMm > machine.bedY) {
      issues.push({
        severity: "error",
        kind: "out-of-bounds",
        partCode: row.code,
        message: `peça excede a mesa ${machine.model}`,
      });
    }
  }

  // veio invertido para portas
  if (/porta|frente/i.test(row.name) && row.grain !== "vertical") {
    issues.push({
      severity: "warn",
      kind: "wrong-grain",
      partCode: row.code,
      message: `veio ideal para ${row.code} é vertical`,
    });
  }

  return issues;
}
