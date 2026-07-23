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
  const at = opts.at ?? { x: room.dimensions.width / 2, y: room.dimensions.depth / 2 };
  return upsertPrimitive(room, buildFurniturePrimitive(item, { ...opts, at }));
}