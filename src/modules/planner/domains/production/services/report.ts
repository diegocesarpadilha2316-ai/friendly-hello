import type { CompanyManufacturingRules } from "@/modules/planner/shared/engineering/types";
import type { PlannerProject } from "@/modules/planner/shared/types/project";
import { aggregateProductionParts } from "./aggregate";
import { buildCutList } from "./cut-list";
import { buildCuttingPlan } from "./cutting-plan";
import { buildHardwareBom } from "./hardware-bom";
import { estimateTime } from "./time";
import { buildBudget } from "./budget";
import { buildLabels } from "./labels";
import type { ProductionReport } from "../types";

export function buildProductionReport(
  project: PlannerProject,
  rules: CompanyManufacturingRules,
): ProductionReport {
  const { parts } = aggregateProductionParts(project, rules);
  const cutList = buildCutList(parts);
  const cuttingPlan = buildCuttingPlan(cutList);
  const hardware = buildHardwareBom(parts, rules);
  const time = estimateTime(parts, cuttingPlan);
  const budget = buildBudget({ parts, hardware, cuttingPlan, time, rules });
  const labels = buildLabels(parts, {
    projectId: project.id,
    projectName: project.name,
    clientName: project.client ?? project.name,
  });

  const boardsM2 = parts
    .filter((p) => p.kind !== "fita-borda")
    .reduce((acc, p) => acc + p.areaM2 * p.qty, 0);
  const edgeMeters = parts
    .filter((p) => p.kind === "fita-borda")
    .reduce((acc, p) => acc + (p.edgeMeters ?? 0), 0);
  const weightKg = parts.reduce((acc, p) => acc + p.weightKg * p.qty, 0);
  const modules = new Set(parts.map((p) => p.furnitureId)).size;

  return {
    generatedAt: new Date().toISOString(),
    parts,
    cutList,
    cuttingPlan,
    hardware,
    budget,
    time,
    labels,
    totals: {
      modules,
      parts: parts.reduce((acc, p) => acc + p.qty, 0),
      boardsM2: Math.round(boardsM2 * 100) / 100,
      edgeMeters: Math.round(edgeMeters * 100) / 100,
      weightKg: Math.round(weightKg * 100) / 100,
    },
  };
}