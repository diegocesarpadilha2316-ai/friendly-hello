import type { FabricationPlan } from "../fabrication";
import type { OptimizerCompare } from "./types";

export function comparePlans(
  before: FabricationPlan,
  after: FabricationPlan,
  pricePerM2 = 80,
): OptimizerCompare {
  const b = {
    boards: before.totals.boardsCount,
    usagePct: Math.round(before.totals.avgUsageRatio * 100),
    wasteM2: before.totals.wasteAreaM2,
  };
  const a = {
    boards: after.totals.boardsCount,
    usagePct: Math.round(after.totals.avgUsageRatio * 100),
    wasteM2: after.totals.wasteAreaM2,
  };
  const diff = {
    boards: b.boards - a.boards,
    usagePct: a.usagePct - b.usagePct,
    wasteM2: Math.round((b.wasteM2 - a.wasteM2) * 100) / 100,
  };
  const economyBRL = Math.round(diff.wasteM2 * pricePerM2 * 100) / 100;
  return { before: b, after: a, diff, economyBRL };
}
