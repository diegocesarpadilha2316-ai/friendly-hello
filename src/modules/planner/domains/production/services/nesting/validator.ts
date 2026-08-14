/**
 * Validador de sanidade do plano — sobreposição, borda, veio.
 */
import type { NestingBoard, NestingPlan } from "./types";

export interface NestingIssue {
  readonly boardIndex: number;
  readonly partId?: string;
  readonly severity: "info" | "warn" | "error";
  readonly message: string;
}

export function validatePlan(plan: NestingPlan): readonly NestingIssue[] {
  const issues: NestingIssue[] = [];
  for (const board of plan.boards) {
    issues.push(...checkBounds(board));
    issues.push(...checkOverlap(board));
    issues.push(...checkGrain(board));
  }
  if (plan.unplaced.length > 0) {
    issues.push({
      boardIndex: 0,
      severity: "error",
      message: `${plan.unplaced.length} peça(s) não couberam nas chapas disponíveis.`,
    });
  }
  return issues;
}

function checkBounds(b: NestingBoard): NestingIssue[] {
  const out: NestingIssue[] = [];
  for (const p of b.placements) {
    if (p.x < 0 || p.y < 0 || p.x + p.w > b.spec.lengthMm || p.y + p.h > b.spec.widthMm) {
      out.push({
        boardIndex: b.index,
        partId: p.partId,
        severity: "error",
        message: `peça ${p.code} fora dos limites`,
      });
    }
  }
  return out;
}

function checkOverlap(b: NestingBoard): NestingIssue[] {
  const out: NestingIssue[] = [];
  const list = b.placements;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i],
        c = list[j];
      const overlap = !(
        c.x >= a.x + a.w ||
        c.x + c.w <= a.x ||
        c.y >= a.y + a.h ||
        c.y + c.h <= a.y
      );
      if (overlap)
        out.push({
          boardIndex: b.index,
          partId: c.partId,
          severity: "error",
          message: `sobreposição entre ${a.code} e ${c.code}`,
        });
    }
  }
  return out;
}

function checkGrain(b: NestingBoard): NestingIssue[] {
  return b.placements
    .filter((p) => !p.grainRespected)
    .map((p) => ({
      boardIndex: b.index,
      partId: p.partId,
      severity: "warn" as const,
      message: `veio invertido em ${p.code}`,
    }));
}
