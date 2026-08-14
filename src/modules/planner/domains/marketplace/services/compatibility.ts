/** Fase 3.25 — Compatibilidade de versão. */
import type { MarketplaceItem } from "../types";
import { PLANNER_VERSION } from "../types";

function parse(version: string): readonly number[] {
  return version.split(".").map((n) => Number.parseInt(n, 10) || 0);
}

function compare(a: string, b: string): number {
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function isCompatible(
  item: MarketplaceItem,
  plannerVersion: string = PLANNER_VERSION,
): boolean {
  return compare(plannerVersion, item.compatibility.plannerMin) >= 0;
}

export function isRecommended(
  item: MarketplaceItem,
  plannerVersion: string = PLANNER_VERSION,
): boolean {
  return compare(plannerVersion, item.compatibility.plannerRecommended) >= 0;
}
