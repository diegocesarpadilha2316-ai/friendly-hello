/**
 * Modelo de viewport para o Plano de Corte.
 * Camada de dados para desenho SVG: sem DOM aqui.
 */
import type { NestingBoard, NestingOffcut, NestingPlacement } from "./types";

export interface PreviewViewport {
  readonly boardIndex: number;
  readonly widthMm: number;
  readonly heightMm: number;
  readonly zoom: number;
  readonly panX: number;
  readonly panY: number;
  readonly placements: readonly PreviewPlacement[];
  readonly offcuts: readonly NestingOffcut[];
}

export interface PreviewPlacement extends NestingPlacement {
  readonly color: string;
  readonly label: string;
}

const PALETTE = [
  "#7c3aed", "#2563eb", "#06b6d4", "#0891b2", "#0d9488", "#059669",
  "#65a30d", "#ca8a04", "#ea580c", "#dc2626", "#db2777", "#9333ea",
];

function hashColor(code: string): string {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function buildPreview(board: NestingBoard, zoom = 1, panX = 0, panY = 0): PreviewViewport {
  return {
    boardIndex: board.index,
    widthMm: board.spec.lengthMm,
    heightMm: board.spec.widthMm,
    zoom,
    panX,
    panY,
    placements: board.placements.map((p) => ({
      ...p,
      color: hashColor(p.code),
      label: `${p.code} · ${p.w}×${p.h}`,
    })),
    offcuts: board.offcuts,
  };
}

export function fitZoom(viewportWidth: number, board: NestingBoard, padding = 40): number {
  const target = viewportWidth - padding * 2;
  return target / board.spec.lengthMm;
}
