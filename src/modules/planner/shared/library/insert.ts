/**
 * Inserção de itens da Biblioteca no documento paramétrico.
 *
 * Não introduz estado global novo — a inserção passa pelo `updateProject`
 * do `PlannerEditorProvider` (Fase 3.1). O mesmo canal por onde fluem as
 * demais mutações, portanto herda Undo/Redo, Autosave, Histórico e a
 * sincronização com 2D/3D (e, futuramente, Produção/Render/IA).
 */
import type { PlannerProject, PlannerRoom } from "../types/project";
import type { Editor2DPrimitive } from "../editor-2d/types";
import { makePrimitiveId, upsertPrimitive } from "../editor-2d/room-ops";
import type { CatalogItem } from "./types";

export interface InsertionTarget {
  environmentId: string;
  roomId: string;
}

export interface InsertionOptions {
  at?: { x: number; y: number };
  rotation?: number;
  overrides?: Partial<{ width: number; depth: number; height: number }>;
  params?: Readonly<Record<string, string | number | boolean | null>>;
}

export function buildFurniturePrimitive(item: CatalogItem, opts: InsertionOptions = {}): Editor2DPrimitive {
  const { defaults } = item.parametric;
  const width = opts.overrides?.width ?? defaults.width;
  const depth = opts.overrides?.depth ?? defaults.depth;
  const height = opts.overrides?.height ?? defaults.height;
  const cx = opts.at?.x ?? 0;
  const cy = opts.at?.y ?? 0;
  return {
    id: makePrimitiveId("furniture"),
    kind: "furniture",
    layer: "furniture",
    locked: false,
    subtype: item.subtype,
    catalogItemId: item.id,
    x: cx - width / 2,
    y: cy - depth / 2,
    width,
    depth,
    height,
    rotation: opts.rotation ?? 0,
    params: {
      material: item.material ?? "",
      color: item.color ?? "",
      brand: item.brand ?? "",
      line: item.line ?? "",
      code: item.code ?? "",
      version: item.version,
      "ai:subtype": item.subtype,
      "ai:category": item.category,
      ...(opts.params ?? {}),
    },
  };
}

export function insertItemIntoProject(
  project: PlannerProject,
  target: InsertionTarget,
  item: CatalogItem,
  opts: InsertionOptions = {},
): PlannerProject {
  return {
    ...project,
    environments: project.environments.map((env) => {
      if (env.id !== target.environmentId) return env;
      return {
        ...env,
        rooms: env.rooms.map((r) => (r.id === target.roomId ? applyInsertion(r, item, opts) : r)),
        updatedAt: new Date().toISOString(),
      };
    }),
  };
}

function applyInsertion(room: PlannerRoom, item: CatalogItem, opts: InsertionOptions): PlannerRoom {
  const roomW = room.dimensions.width;
  const roomD = room.dimensions.depth;
  const width = opts.overrides?.width ?? item.parametric.defaults.width;
  const depth = opts.overrides?.depth ?? item.parametric.defaults.depth;
  // Espessura da parede (~100mm centralizada) — 50mm interno + 2mm folga.
  const WALL = 52;
  const raw = opts.at ?? { x: roomW / 2, y: roomD / 2 };
  // Clampa o CENTRO do móvel para manter os 4 cantos dentro do cômodo.
  const halfW = width / 2;
  const halfD = depth / 2;
  const minX = WALL + halfW;
  const maxX = Math.max(minX, roomW - WALL - halfW);
  const minY = WALL + halfD;
  const maxY = Math.max(minY, roomD - WALL - halfD);
  const at = {
    x: Math.min(Math.max(raw.x, minX), maxX),
    y: Math.min(Math.max(raw.y, minY), maxY),
  };
  return upsertPrimitive(room, buildFurniturePrimitive(item, { ...opts, at }));
}