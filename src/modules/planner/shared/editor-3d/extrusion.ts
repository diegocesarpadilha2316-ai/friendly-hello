/**
 * Extrusão paramétrica: converte `Editor2DPrimitive[]` (derivados dos
 * mesmos `PlannerParametricNode` já persistidos) em descritores 3D
 * puros. Funções sem I/O e sem three.js — o renderer consome estes
 * descritores diretamente. Unidade de entrada: milímetros; saída em
 * metros (÷ 1000) para a cena 3D.
 */
import type { Editor2DPrimitive } from "../editor-2d/types";
import { listPrimitives } from "../editor-2d/serialization";
import type { PlannerRoom } from "../types/project";

const MM = 1 / 1000;

export interface WallDescriptor {
  id: string;
  cx: number; // centro X (m)
  cz: number; // centro Z (m)
  length: number; // m
  thickness: number; // m
  height: number; // m
  rotationY: number; // rad
}

export interface SlabDescriptor {
  id: string;
  cx: number;
  cz: number;
  width: number;
  depth: number;
  y: number;
  thickness: number;
}

export interface OpeningDescriptor {
  id: string;
  role: "door" | "window";
  cx: number;
  cz: number;
  width: number;
  height: number;
  y: number;
  rotationY: number;
}

export interface FurnitureDescriptor {
  id: string;
  subtype: string;
  catalogItemId: string;
  cx: number;
  cz: number;
  width: number;   // m (X)
  depth: number;   // m (Z)
  height: number;  // m (Y)
  y: number;       // altura do centro (m)
  rotationY: number; // rad
}

export interface Scene3DModel {
  walls: readonly WallDescriptor[];
  floors: readonly SlabDescriptor[];
  ceilings: readonly SlabDescriptor[];
  openings: readonly OpeningDescriptor[];
  furniture: readonly FurnitureDescriptor[];
  /** bounding box em metros */
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number; maxY: number };
}

function extrudeWall(p: Extract<Editor2DPrimitive, { kind: "wall" }>, wallHeight: number): WallDescriptor {
  const x1 = p.x1 * MM;
  const y1 = p.y1 * MM;
  const x2 = p.x2 * MM;
  const y2 = p.y2 * MM;
  const dx = x2 - x1;
  const dz = y2 - y1;
  const length = Math.hypot(dx, dz);
  return {
    id: p.id,
    cx: (x1 + x2) / 2,
    cz: (y1 + y2) / 2,
    length,
    thickness: p.thickness * MM,
    height: wallHeight * MM,
    rotationY: -Math.atan2(dz, dx),
  };
}

function extrudeSlab(
  p: Extract<Editor2DPrimitive, { kind: "floor" | "ceiling" }>,
  y: number,
): SlabDescriptor {
  return {
    id: p.id,
    cx: (p.x + p.width / 2) * MM,
    cz: (p.y + p.depth / 2) * MM,
    width: p.width * MM,
    depth: p.depth * MM,
    y,
    thickness: 0.02,
  };
}

function extrudeOpening(p: Extract<Editor2DPrimitive, { kind: "opening" }>): OpeningDescriptor {
  const width = p.width * MM;
  const height = p.height * MM;
  return {
    id: p.id,
    role: p.role,
    cx: p.x * MM,
    cz: p.y * MM,
    width,
    height,
    y: p.role === "door" ? height / 2 : 1.0 + height / 2,
    rotationY: -(p.rotation * Math.PI) / 180,
  };
}

export function buildScene3D(room: PlannerRoom, wallHeight: number): Scene3DModel {
  const primitives = listPrimitives(room);
  const walls: WallDescriptor[] = [];
  const floors: SlabDescriptor[] = [];
  const ceilings: SlabDescriptor[] = [];
  const openings: OpeningDescriptor[] = [];
  const furniture: FurnitureDescriptor[] = [];
  const wallH = wallHeight * MM;

  for (const p of primitives) {
    if (p.kind === "wall") walls.push(extrudeWall(p, wallHeight));
    else if (p.kind === "floor") floors.push(extrudeSlab(p, 0));
    else if (p.kind === "ceiling") ceilings.push(extrudeSlab(p, wallH));
    else if (p.kind === "opening") openings.push(extrudeOpening(p));
    else if (p.kind === "furniture") {
      const w = p.width * MM;
      const d = p.depth * MM;
      const h = p.height * MM;
      furniture.push({
        id: p.id,
        subtype: p.subtype,
        catalogItemId: p.catalogItemId,
        cx: (p.x + p.width / 2) * MM,
        cz: (p.y + p.depth / 2) * MM,
        width: w,
        depth: d,
        height: h,
        y: h / 2,
        rotationY: -(p.rotation * Math.PI) / 180,
      });
    }
  }

  // Fallback: se não há floor/ceiling explícitos, gera a partir das dimensões da sala
  if (floors.length === 0 && room.dimensions.width > 0 && room.dimensions.depth > 0) {
    floors.push({
      id: `${room.id}-floor`,
      cx: (room.dimensions.width / 2) * MM,
      cz: (room.dimensions.depth / 2) * MM,
      width: room.dimensions.width * MM,
      depth: room.dimensions.depth * MM,
      y: 0,
      thickness: 0.02,
    });
  }

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  const consider = (cx: number, cz: number, w: number, d: number) => {
    minX = Math.min(minX, cx - w / 2); maxX = Math.max(maxX, cx + w / 2);
    minZ = Math.min(minZ, cz - d / 2); maxZ = Math.max(maxZ, cz + d / 2);
  };
  for (const w of walls) consider(w.cx, w.cz, w.length, w.thickness);
  for (const s of floors) consider(s.cx, s.cz, s.width, s.depth);
  for (const f of furniture) consider(f.cx, f.cz, f.width, f.depth);
  if (!Number.isFinite(minX)) {
    minX = 0; maxX = (room.dimensions.width || 5000) * MM;
    minZ = 0; maxZ = (room.dimensions.depth || 5000) * MM;
  }

  return { walls, floors, ceilings, openings, furniture, bounds: { minX, maxX, minZ, maxZ, maxY: wallH } };
}