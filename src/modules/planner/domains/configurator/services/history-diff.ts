import type { PlannerProject, PlannerParametricNode } from "@/modules/planner/shared";
import type { HistoryEntry } from "../types";

function collectModules(project: PlannerProject): Record<string, PlannerParametricNode> {
  const acc: Record<string, PlannerParametricNode> = {};
  for (const env of project.environments)
    for (const room of env.rooms)
      for (const id of Object.keys(room.nodes)) {
        const n = room.nodes[id];
        if (n) acc[id] = n;
      }
  return acc;
}

function diffParams(
  before: PlannerParametricNode,
  after: PlannerParametricNode,
): readonly { field: string; before: string; after: string }[] {
  const changes: { field: string; before: string; after: string }[] = [];
  const keys = new Set([...Object.keys(before.params), ...Object.keys(after.params)]);
  for (const k of keys) {
    const a = before.params[k];
    const b = after.params[k];
    if (a !== b)
      changes.push({
        field: `${after.label}.${k}`,
        before: String(a ?? "—"),
        after: String(b ?? "—"),
      });
  }
  return changes;
}

/**
 * Deriva um histórico legível comparando past[] + current.
 * Nada é persistido — o próprio provider mantém as pilhas de undo/redo.
 */
export function buildHistory(
  past: readonly PlannerProject[],
  current: PlannerProject | null,
  author: string,
): readonly HistoryEntry[] {
  if (!current) return [];
  const timeline = [...past, current];
  const entries: HistoryEntry[] = [];
  for (let i = 1; i < timeline.length; i++) {
    const prev = timeline[i - 1];
    const next = timeline[i];
    const prevModules = collectModules(prev);
    const nextModules = collectModules(next);
    const changes: { field: string; before: string; after: string }[] = [];
    for (const id of Object.keys(nextModules)) {
      const a = prevModules[id];
      const b = nextModules[id];
      if (!a) {
        changes.push({ field: `+ ${b.label}`, before: "—", after: "adicionado" });
        continue;
      }
      changes.push(...diffParams(a, b));
    }
    for (const id of Object.keys(prevModules)) {
      if (!nextModules[id]) {
        changes.push({ field: `- ${prevModules[id].label}`, before: "removido", after: "—" });
      }
    }
    if (changes.length === 0) continue;
    const summary =
      changes.length === 1
        ? changes[0].field
        : `${changes.length} alterações em ${new Set(changes.map((c) => c.field.split(".")[0])).size} módulo(s)`;
    entries.push({
      id: `hist_${next.version}_${i}`,
      version: next.version,
      author,
      when: next.updatedAt,
      summary,
      changes: changes.slice(0, 20),
    });
  }
  return entries.reverse();
}
