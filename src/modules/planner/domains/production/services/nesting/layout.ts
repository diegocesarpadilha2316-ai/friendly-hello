/**
 * Manipulação de layouts (mover / fixar / bloquear peças).
 * Puro — retorna novos boards; toda persistência final via updateProject().
 */
import type { NestingBoard, NestingPlacement } from "./types";

export function movePlacement(
  board: NestingBoard,
  partId: string,
  dx: number,
  dy: number,
): NestingBoard {
  return {
    ...board,
    placements: board.placements.map((p) =>
      p.partId === partId && !p.locked
        ? {
            ...p,
            x: clamp(p.x + dx, 0, board.spec.lengthMm - p.w),
            y: clamp(p.y + dy, 0, board.spec.widthMm - p.h),
          }
        : p,
    ),
  };
}

export function pinPlacement(board: NestingBoard, partId: string, pinned: boolean): NestingBoard {
  return {
    ...board,
    placements: board.placements.map((p) => (p.partId === partId ? { ...p, pinned } : p)),
  };
}

export function lockPlacement(board: NestingBoard, partId: string, locked: boolean): NestingBoard {
  return {
    ...board,
    placements: board.placements.map((p) => (p.partId === partId ? { ...p, locked } : p)),
  };
}

export function rotatePlacement(board: NestingBoard, partId: string): NestingBoard {
  return {
    ...board,
    placements: board.placements.map((p) =>
      p.partId === partId && !p.locked ? { ...p, w: p.h, h: p.w, rotated: !p.rotated } : p,
    ),
  };
}

export function findPlacement(board: NestingBoard, partId: string): NestingPlacement | undefined {
  return board.placements.find((p) => p.partId === partId);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
