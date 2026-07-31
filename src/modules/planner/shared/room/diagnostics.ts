/**
 * Diagnóstico DEV do Room Architecture Engine.
 * Expõe `window.__DIORIS_ROOM__` apenas em desenvolvimento.
 */
import type { RoomArchitecture, RoomFurnitureBox, RoomIssue } from "./types";
import { validateRoomFurniture } from "./collisions";

export interface RoomDiagnostics {
  id: string;
  dimensions: { widthMm: number; depthMm: number; heightMm: number };
  wallThicknessMm: number;
  floor: { levelMm: number; thicknessMm: number };
  ceiling: { levelMm: number; thicknessMm: number; kind: string };
  walls: readonly {
    id: string;
    side: string;
    lengthMm: number;
    thicknessMm: number;
    innerFaceMm: number;
    cutouts: number;
  }[];
  baseboards: readonly { id: string; side: string; lengthMm: number }[];
  doors: readonly { id: string; side: string; widthMm: number; heightMm: number; offsetMm: number }[];
  windows: readonly {
    id: string;
    side: string;
    widthMm: number;
    heightMm: number;
    sillHeightMm: number;
  }[];
  sills: readonly { id: string; levelMm: number; depthMm: number }[];
  furniture: readonly RoomFurnitureBox[];
  issues: readonly RoomIssue[];
}

export function buildRoomDiagnostics(
  arch: RoomArchitecture,
  furniture: readonly RoomFurnitureBox[] = [],
): RoomDiagnostics {
  return {
    id: arch.id,
    dimensions: {
      widthMm: arch.inner.maxX - arch.inner.minX,
      depthMm: arch.inner.maxZ - arch.inner.minZ,
      heightMm: arch.inner.heightMm,
    },
    wallThicknessMm: arch.walls[0]?.thicknessMm ?? 0,
    floor: { levelMm: arch.floor.levelMm, thicknessMm: arch.floor.thicknessMm },
    ceiling: {
      levelMm: arch.ceiling.levelMm,
      thicknessMm: arch.ceiling.thicknessMm,
      kind: arch.ceiling.kind,
    },
    walls: arch.walls.map((w) => ({
      id: w.id,
      side: w.side,
      lengthMm: w.lengthMm,
      thicknessMm: w.thicknessMm,
      innerFaceMm: w.innerFaceMm,
      cutouts: w.cutouts.length,
    })),
    baseboards: arch.baseboards.map((b) => ({ id: b.id, side: b.side, lengthMm: b.lengthMm })),
    doors: arch.doors.map((d) => ({
      id: d.id,
      side: d.side,
      widthMm: d.widthMm,
      heightMm: d.heightMm,
      offsetMm: d.offsetMm,
    })),
    windows: arch.windows.map((w) => ({
      id: w.id,
      side: w.side,
      widthMm: w.widthMm,
      heightMm: w.heightMm,
      sillHeightMm: w.sillHeightMm,
    })),
    sills: arch.sills.map((s) => ({ id: s.id, levelMm: s.levelMm, depthMm: s.depthMm })),
    furniture,
    issues: [...arch.issues, ...validateRoomFurniture(arch, furniture)],
  };
}

export function publishRoomDiagnostics(
  arch: RoomArchitecture,
  furniture: readonly RoomFurnitureBox[] = [],
): void {
  if (typeof window === "undefined") return;
  if (!import.meta.env.DEV) return;
  (window as unknown as { __DIORIS_ROOM__?: RoomDiagnostics }).__DIORIS_ROOM__ =
    buildRoomDiagnostics(arch, furniture);
}