/**
 * Operações imutáveis sobre `PlannerRoom` para o Editor 2D.
 * Retornam novos objetos; nunca mutam o estado. As chamadas fluem por
 * `updateProject` do `PlannerEditorProvider`, integrando naturalmente
 * com undo/redo/autosave.
 */
import type { PlannerParametricNode, PlannerRoom } from "../types/project";
import { fromPrimitive } from "./serialization";
import type { Editor2DPrimitive } from "./types";

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function makePrimitiveId(kind: Editor2DPrimitive["kind"]): string {
  const p =
    kind === "wall"
      ? "w"
      : kind === "opening"
        ? "op"
        : kind === "floor"
          ? "fl"
          : kind === "ceiling"
            ? "cl"
            : kind === "furniture"
              ? "fn"
              : "gd";
  return newId(p);
}

export function upsertNode(room: PlannerRoom, node: PlannerParametricNode): PlannerRoom {
  const exists = !!room.nodes[node.id];
  const nodes = { ...room.nodes, [node.id]: node };
  const nodeOrder = exists ? room.nodeOrder : [...room.nodeOrder, node.id];
  return { ...room, nodes, nodeOrder, updatedAt: new Date().toISOString() };
}

export function upsertPrimitive(room: PlannerRoom, primitive: Editor2DPrimitive): PlannerRoom {
  return upsertNode(room, fromPrimitive(primitive));
}

export function upsertPrimitives(
  room: PlannerRoom,
  list: readonly Editor2DPrimitive[],
): PlannerRoom {
  let r = room;
  for (const p of list) r = upsertPrimitive(r, p);
  return r;
}

export function removeNodes(room: PlannerRoom, ids: ReadonlySet<string>): PlannerRoom {
  if (ids.size === 0) return room;
  const nodes = { ...room.nodes };
  for (const id of ids) delete nodes[id];
  const nodeOrder = room.nodeOrder.filter((id) => !ids.has(id));
  return { ...room, nodes, nodeOrder, updatedAt: new Date().toISOString() };
}
