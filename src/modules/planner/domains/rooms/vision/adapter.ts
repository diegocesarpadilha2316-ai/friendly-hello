/**
 * Fase 3.7 — IA Visão: adaptador para o modelo paramétrico oficial.
 *
 * Converte um `VisionRoomModel` (formato intermediário) em um
 * `PlannerRoom` completo usando exclusivamente as APIs existentes:
 *   - `createRoom` (factory oficial)
 *   - `upsertPrimitives` (Editor 2D → grafo paramétrico)
 *
 * Zero novos campos, zero duplicação de motor. A saída é um `PlannerRoom`
 * válido para ser inserido no `PlannerProject` via `updateProject`.
 */
import { createRoom } from "@/modules/planner/shared/factories/project";
import { makePrimitiveId, upsertPrimitives } from "@/modules/planner/shared/editor-2d/room-ops";
import type { Editor2DPrimitive } from "@/modules/planner/shared/editor-2d/types";
import type { PlannerRoom } from "@/modules/planner/shared/types/project";
import type { VisionCorrectionPatch, VisionOpening, VisionRoomModel, VisionWall } from "./types";

function applyWallPatch(
  wall: VisionWall,
  patch: Partial<Omit<VisionWall, "id">> | undefined,
): VisionWall {
  if (!patch) return wall;
  return {
    ...wall,
    a: patch.a ?? wall.a,
    b: patch.b ?? wall.b,
    thickness: patch.thickness ?? wall.thickness,
    height: patch.height ?? wall.height,
    confidence: patch.confidence ?? wall.confidence,
  };
}

function applyOpeningPatch(
  op: VisionOpening,
  patch: Partial<Omit<VisionOpening, "id">> | undefined,
): VisionOpening {
  if (!patch) return op;
  return {
    ...op,
    wallId: patch.wallId ?? op.wallId,
    role: patch.role ?? op.role,
    offset: patch.offset ?? op.offset,
    width: patch.width ?? op.width,
    height: patch.height ?? op.height,
    sillHeight: patch.sillHeight ?? op.sillHeight,
    confidence: patch.confidence ?? op.confidence,
  };
}

export function mergeCorrections(
  model: VisionRoomModel,
  corrections: VisionCorrectionPatch,
): VisionRoomModel {
  const walls = model.walls.map((w) => applyWallPatch(w, corrections.walls?.[w.id]));
  const openings = model.openings.map((o) => applyOpeningPatch(o, corrections.openings?.[o.id]));
  return {
    ...model,
    suggestedName: corrections.suggestedName ?? model.suggestedName,
    suggestedType: corrections.suggestedType ?? model.suggestedType,
    bounds: {
      width: corrections.bounds?.width ?? model.bounds.width,
      depth: corrections.bounds?.depth ?? model.bounds.depth,
      height: corrections.bounds?.height ?? model.bounds.height,
    },
    walls,
    openings,
    floor: { ...model.floor, ...(corrections.floor ?? {}) },
    ceiling: { ...model.ceiling, ...(corrections.ceiling ?? {}) },
  };
}

/**
 * Constrói primitivas 2D a partir do modelo detectado.
 * Estas primitivas alimentam `upsertPrimitives` sem alterar o motor.
 */
export function buildPrimitivesFromVision(model: VisionRoomModel): Editor2DPrimitive[] {
  const primitives: Editor2DPrimitive[] = [];

  primitives.push({
    id: makePrimitiveId("floor"),
    kind: "floor",
    layer: "floors",
    locked: false,
    x: 0,
    y: 0,
    width: model.bounds.width,
    depth: model.bounds.depth,
  });
  primitives.push({
    id: makePrimitiveId("ceiling"),
    kind: "ceiling",
    layer: "ceilings",
    locked: false,
    x: 0,
    y: 0,
    width: model.bounds.width,
    depth: model.bounds.depth,
  });

  for (const w of model.walls) {
    primitives.push({
      id: makePrimitiveId("wall"),
      kind: "wall",
      layer: "walls",
      locked: false,
      x1: w.a.x,
      y1: w.a.y,
      x2: w.b.x,
      y2: w.b.y,
      thickness: w.thickness,
    });
  }

  for (const op of model.openings) {
    const wall = model.walls.find((w) => w.id === op.wallId);
    if (!wall) continue;
    const dx = wall.b.x - wall.a.x;
    const dy = wall.b.y - wall.a.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    const t = Math.min(Math.max(op.offset / len, 0), 1);
    const px = wall.a.x + dx * t;
    const py = wall.a.y + dy * t;
    const rotation = Math.atan2(dy, dx) * (180 / Math.PI);
    primitives.push({
      id: makePrimitiveId("opening"),
      kind: "opening",
      role: op.role,
      layer: "openings",
      locked: false,
      x: px,
      y: py,
      width: op.width,
      height: op.height,
      rotation,
    });
  }

  return primitives;
}

export function toPlannerRoom(model: VisionRoomModel): PlannerRoom {
  const room = createRoom({
    name: model.suggestedName,
    type: model.suggestedType,
    width: model.bounds.width,
    height: model.bounds.height,
    depth: model.bounds.depth,
  });
  const primitives = buildPrimitivesFromVision(model);
  return upsertPrimitives(room, primitives);
}
