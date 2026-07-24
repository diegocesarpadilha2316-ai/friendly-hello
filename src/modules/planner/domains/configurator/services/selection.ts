import type { PlannerParametricNode, PlannerProject, PlannerRoom } from "@/modules/planner/shared";

export function listModules(project: PlannerProject | null): readonly PlannerParametricNode[] {
  if (!project) return [];
  const acc: PlannerParametricNode[] = [];
  for (const env of project.environments) {
    for (const room of env.rooms) {
      for (const id of room.nodeOrder) {
        const node = room.nodes[id];
        if (node && node.kind === "module") acc.push(node);
      }
    }
  }
  return acc;
}

export function findNode(project: PlannerProject | null, nodeId: string):
  | { node: PlannerParametricNode; room: PlannerRoom; envId: string }
  | null {
  if (!project) return null;
  for (const env of project.environments) {
    for (const room of env.rooms) {
      const node = room.nodes[nodeId];
      if (node) return { node, room, envId: env.id };
    }
  }
  return null;
}

/** Aplica um patch de params ao(s) nó(s) alvo — retorna novo projeto (imutável). */
export function patchNodes(
  project: PlannerProject,
  nodeIds: readonly string[],
  patch: Readonly<Record<string, string | number | boolean | null>>,
): PlannerProject {
  const set = new Set(nodeIds);
  return {
    ...project,
    environments: project.environments.map((env) => ({
      ...env,
      rooms: env.rooms.map((room) => {
        let touched = false;
        const nodes: Record<string, PlannerParametricNode> = { ...room.nodes };
        for (const id of Object.keys(room.nodes)) {
          if (!set.has(id)) continue;
          const n = room.nodes[id];
          if (!n) continue;
          nodes[id] = { ...n, params: { ...n.params, ...patch } };
          touched = true;
        }
        return touched ? { ...room, nodes, updatedAt: new Date().toISOString() } : room;
      }),
    })),
  };
}

/** Aplica um patch de params a TODOS os módulos do projeto. */
export function patchAllModules(
  project: PlannerProject,
  patch: Readonly<Record<string, string | number | boolean | null>>,
): PlannerProject {
  const ids = listModules(project).map((m) => m.id);
  return patchNodes(project, ids, patch);
}