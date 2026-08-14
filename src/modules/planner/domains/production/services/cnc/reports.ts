/**
 * Relatórios agregados de usinagem.
 */
import type { CncIssue, CncProgram, CncTool } from "./types";

export interface CncReport {
  readonly programsCount: number;
  readonly totalMin: number;
  readonly toolChanges: number;
  readonly uniqueTools: number;
  readonly issues: readonly CncIssue[];
}

export function buildReport(
  programs: readonly CncProgram[],
  issues: readonly CncIssue[],
): CncReport {
  const tools = new Set<string>();
  let totalMin = 0;
  let toolChanges = 0;
  let last = "";
  for (const p of programs) {
    totalMin += p.estimatedMin;
    p.tools.forEach((t) => tools.add(t.id));
    for (const o of p.operations) {
      if (o.toolId !== last) {
        toolChanges++;
        last = o.toolId;
      }
    }
  }
  return {
    programsCount: programs.length,
    totalMin,
    toolChanges: Math.max(0, toolChanges - 1),
    uniqueTools: tools.size,
    issues,
  };
}

export function toolUsageSummary(
  programs: readonly CncProgram[],
): readonly { readonly tool: CncTool; readonly count: number }[] {
  const map = new Map<string, { tool: CncTool; count: number }>();
  for (const p of programs) {
    for (const o of p.operations) {
      const tool = p.tools.find((t) => t.id === o.toolId);
      if (!tool) continue;
      const entry = map.get(tool.id) ?? { tool, count: 0 };
      entry.count += 1;
      map.set(tool.id, entry);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}
