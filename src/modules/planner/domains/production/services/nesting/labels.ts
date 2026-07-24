/**
 * Geração determinística de etiquetas (QR incluso, sem lib externa).
 */
import type { NestingBoard, NestingPlacement } from "./types";

export interface NestingLabel {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly projectId: string;
  readonly clientName: string;
  readonly material: string;
  readonly widthMm: number;
  readonly heightMm: number;
  readonly qty: number;
  readonly qrPayload: string;
  readonly internalCode: string;
}

export function generateLabels(
  boards: readonly NestingBoard[],
  projectId: string,
  clientName: string,
): readonly NestingLabel[] {
  const labels: NestingLabel[] = [];
  boards.forEach((board) => {
    board.placements.forEach((p) => {
      labels.push({
        id: `${board.index}-${p.partId}`,
        code: p.code,
        name: p.code,
        projectId,
        clientName,
        material: board.spec.material,
        widthMm: p.w,
        heightMm: p.h,
        qty: 1,
        internalCode: internalCode(board.index, p),
        qrPayload: qrPayload(board.index, p, projectId),
      });
    });
  });
  return labels;
}

function internalCode(boardIndex: number, p: NestingPlacement): string {
  return `B${String(boardIndex).padStart(3, "0")}-${p.code}`;
}

function qrPayload(boardIndex: number, p: NestingPlacement, projectId: string): string {
  return `dioris://cut/${projectId}/${boardIndex}/${p.partId}?w=${p.w}&h=${p.h}&r=${p.rotated ? 1 : 0}`;
}
