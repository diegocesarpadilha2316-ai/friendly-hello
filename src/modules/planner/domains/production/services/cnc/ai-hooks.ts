/**
 * Respostas determinísticas para a IA CNC — sem chamar APIs.
 */
import type { CncMachine, CncProgram, CncIssue } from "./types";
import { CNC_MACHINE_CATALOG } from "./machines";

export function longestProgram(programs: readonly CncProgram[]): CncProgram | null {
  if (programs.length === 0) return null;
  return [...programs].sort((a, b) => b.estimatedMin - a.estimatedMin)[0];
}

export function mostDrilledPart(
  programs: readonly CncProgram[],
): { partCode: string; ops: number } | null {
  if (programs.length === 0) return null;
  const map = new Map<string, number>();
  for (const p of programs) {
    map.set(p.partCode, (map.get(p.partCode) ?? 0) + p.operations.length);
  }
  const [partCode, ops] = [...map.entries()].sort((a, b) => b[1] - a[1])[0];
  return { partCode, ops };
}

export function recommendMachine(programs: readonly CncProgram[]): CncMachine {
  const totalOps = programs.reduce((a, p) => a + p.operations.length, 0);
  if (totalOps > 400) return CNC_MACHINE_CATALOG.find((m) => m.id === "homag-centateq-p-210")!;
  if (totalOps > 150) return CNC_MACHINE_CATALOG.find((m) => m.id === "biesse-rover-a")!;
  return CNC_MACHINE_CATALOG.find((m) => m.id === "generic-3axis")!;
}

export function hasCollisions(issues: readonly CncIssue[]): boolean {
  return issues.some((i) => i.kind === "collision");
}

export function totalUsinageMin(programs: readonly CncProgram[]): number {
  return programs.reduce((a, p) => a + p.estimatedMin, 0);
}

export function toolChangeAdvice(programs: readonly CncProgram[]): string {
  const changes = programs.reduce((acc, p) => {
    let last = "";
    let n = 0;
    for (const o of p.operations) {
      if (o.toolId !== last) {
        n++;
        last = o.toolId;
      }
    }
    return acc + Math.max(0, n - 1);
  }, 0);
  if (changes < 10) return "Trocas de ferramenta já otimizadas.";
  return `Agrupe operações por ferramenta para reduzir ${changes} trocas.`;
}

export function timeReductionAdvice(programs: readonly CncProgram[]): string {
  const total = totalUsinageMin(programs);
  if (total < 30) return "Programa já eficiente.";
  return `Considere dividir em ${Math.ceil(total / 45)} rodadas ou aumentar avanço em 15% para reduzir tempo.`;
}
