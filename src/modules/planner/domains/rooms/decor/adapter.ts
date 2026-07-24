/**
 * Fase 3.8 — IA Decoradora: adaptador para o grafo paramétrico.
 *
 * Converte uma `DecorSuggestion` aceita em `PlannerParametricNode` e a
 * escreve no cômodo alvo via `upsertNode` (API existente do Editor 2D).
 * Não introduz novo motor — decoração vive como `module` com
 * `params.role = "decor"`, mantendo compatibilidade total com 3D,
 * render, produção e marketplace.
 */
import { upsertNode } from "@/modules/planner/shared/editor-2d/room-ops";
import type {
  PlannerParametricNode,
  PlannerProject,
  PlannerRoom,
} from "@/modules/planner/shared/types/project";
import { getDecorItem } from "./catalog";
import { getLightingScene } from "./lighting";
import type { DecorSuggestion } from "./types";

function nodeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface AppliedNode {
  suggestionId: string;
  nodeId: string;
}

/**
 * Constrói o(s) `PlannerParametricNode` correspondentes a uma sugestão.
 * Retorna vazio para sugestões apenas informativas (paleta / material).
 */
export function buildNodesForSuggestion(
  suggestion: DecorSuggestion,
): PlannerParametricNode[] {
  if (suggestion.target === "item" && suggestion.itemId) {
    const item = getDecorItem(suggestion.itemId);
    if (!item) return [];
    const width = suggestion.overrides?.width ?? item.defaults.width;
    const depth = suggestion.overrides?.depth ?? item.defaults.depth;
    const height = suggestion.overrides?.height ?? item.defaults.height;
    return [{
      id: nodeId("decor"),
      kind: "module",
      label: item.name,
      params: {
        role: "decor",
        "ai:kind": `decor.${item.kind}`,
        "ai:category": "decor",
        catalogItemId: item.id,
        width,
        depth,
        height,
        x: suggestion.at?.x ?? 0,
        y: suggestion.at?.y ?? 0,
        rotation: suggestion.rotation ?? 0,
        material: item.material ?? null,
        color: item.color ?? null,
      },
    }];
  }
  if (suggestion.target === "lighting" && suggestion.lightingSceneId) {
    const scene = getLightingScene(suggestion.lightingSceneId);
    if (!scene) return [];
    return scene.emitters.map((e, idx) => ({
      id: nodeId(`light${idx}`),
      kind: "module",
      label: `${scene.name} — ${e.kind}`,
      params: {
        role: "decor",
        "ai:kind": `decor.${e.kind}`,
        "ai:category": "iluminacao",
        "light:role": e.role,
        "light:temperature": e.temperature,
        "light:wattage": e.wattage ?? null,
        color: e.color ?? null,
        scene: scene.id,
      },
    }));
  }
  return [];
}

export function applySuggestionToRoom(
  room: PlannerRoom,
  suggestion: DecorSuggestion,
): { room: PlannerRoom; applied: AppliedNode[] } {
  const nodes = buildNodesForSuggestion(suggestion);
  if (nodes.length === 0) return { room, applied: [] };
  let next = room;
  const applied: AppliedNode[] = [];
  for (const node of nodes) {
    next = upsertNode(next, node);
    applied.push({ suggestionId: suggestion.id, nodeId: node.id });
  }
  return { room: next, applied };
}

export interface ApplyPlanTarget {
  environmentId: string;
  roomId: string;
}

/**
 * Aplica um conjunto de sugestões aceitas em um projeto — imutável.
 * O chamador entrega o resultado ao `updateProject` do editor.
 */
export function applySuggestionsToProject(
  project: PlannerProject,
  target: ApplyPlanTarget,
  accepted: readonly DecorSuggestion[],
): { project: PlannerProject; applied: AppliedNode[] } {
  const appliedAll: AppliedNode[] = [];
  const nextProject: PlannerProject = {
    ...project,
    environments: project.environments.map((env) => {
      if (env.id !== target.environmentId) return env;
      return {
        ...env,
        rooms: env.rooms.map((r) => {
          if (r.id !== target.roomId) return r;
          let current = r;
          for (const suggestion of accepted) {
            const step = applySuggestionToRoom(current, suggestion);
            current = step.room;
            appliedAll.push(...step.applied);
          }
          return current;
        }),
        updatedAt: new Date().toISOString(),
      };
    }),
    updatedAt: new Date().toISOString(),
  };
  return { project: nextProject, applied: appliedAll };
}

/** Reverte nós inseridos por sugestões aceitas (para "rejeitar após aplicar"). */
export function removeAppliedNodes(
  project: PlannerProject,
  target: ApplyPlanTarget,
  nodeIds: readonly string[],
): PlannerProject {
  const ids = new Set(nodeIds);
  if (ids.size === 0) return project;
  return {
    ...project,
    environments: project.environments.map((env) => {
      if (env.id !== target.environmentId) return env;
      return {
        ...env,
        rooms: env.rooms.map((r) => {
          if (r.id !== target.roomId) return r;
          const nextNodes = { ...r.nodes };
          for (const id of ids) delete nextNodes[id];
          return {
            ...r,
            nodes: nextNodes,
            nodeOrder: r.nodeOrder.filter((id) => !ids.has(id)),
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    }),
    updatedAt: new Date().toISOString(),
  };
}