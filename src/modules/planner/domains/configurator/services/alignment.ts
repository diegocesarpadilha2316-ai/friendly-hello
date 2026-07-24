import type { AlignAction } from "../types";
import type { PlannerProject, PlannerParametricNode } from "@/modules/planner/shared";
import { findNode } from "./selection";

export const ALIGN_ACTIONS: readonly AlignAction[] = [
  { id: "left", label: "Alinhar à esquerda", description: "Alinha borda esquerda dos selecionados." },
  { id: "right", label: "Alinhar à direita", description: "Alinha borda direita dos selecionados." },
  { id: "center-h", label: "Centralizar horizontal", description: "Centro no eixo X." },
  { id: "top", label: "Alinhar topo", description: "Alinha borda superior." },
  { id: "bottom", label: "Alinhar base", description: "Alinha borda inferior." },
  { id: "center-v", label: "Centralizar vertical", description: "Centro no eixo Y." },
  { id: "distribute-h", label: "Distribuir horizontal", description: "Espaçamento horizontal igual." },
  { id: "distribute-v", label: "Distribuir vertical", description: "Espaçamento vertical igual." },
];

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Duplica um nó dentro do mesmo cômodo — retorna novo projeto. */
export function duplicateNode(project: PlannerProject, nodeId: string): PlannerProject {
  const found = findNode(project, nodeId);
  if (!found) return project;
  const clone: PlannerParametricNode = {
    ...found.node,
    id: newId("node"),
    label: `${found.node.label} · cópia`,
    params: { ...found.node.params, x: (Number(found.node.params.x) || 0) + 200 },
  };
  return {
    ...project,
    environments: project.environments.map((env) => ({
      ...env,
      rooms: env.rooms.map((room) => {
        if (room.id !== found.room.id) return room;
        return {
          ...room,
          nodes: { ...room.nodes, [clone.id]: clone },
          nodeOrder: [...room.nodeOrder, clone.id],
          updatedAt: new Date().toISOString(),
        };
      }),
    })),
  };
}

/** Espelha um nó no eixo X (mirror = !mirror + inverte sinal de x). */
export function mirrorNode(project: PlannerProject, nodeId: string): PlannerProject {
  const found = findNode(project, nodeId);
  if (!found) return project;
  const mirrored: PlannerParametricNode = {
    ...found.node,
    params: {
      ...found.node.params,
      mirrored: !(found.node.params.mirrored === true),
      x: -(Number(found.node.params.x) || 0),
    },
  };
  return {
    ...project,
    environments: project.environments.map((env) => ({
      ...env,
      rooms: env.rooms.map((room) =>
        room.id !== found.room.id ? room : { ...room, nodes: { ...room.nodes, [mirrored.id]: mirrored } },
      ),
    })),
  };
}

/** Rotaciona (soma degrees ao param `rotation`). */
export function rotateNode(project: PlannerProject, nodeId: string, deg: number): PlannerProject {
  const found = findNode(project, nodeId);
  if (!found) return project;
  const rotated: PlannerParametricNode = {
    ...found.node,
    params: {
      ...found.node.params,
      rotation: ((Number(found.node.params.rotation) || 0) + deg) % 360,
    },
  };
  return {
    ...project,
    environments: project.environments.map((env) => ({
      ...env,
      rooms: env.rooms.map((room) =>
        room.id !== found.room.id ? room : { ...room, nodes: { ...room.nodes, [rotated.id]: rotated } },
      ),
    })),
  };
}