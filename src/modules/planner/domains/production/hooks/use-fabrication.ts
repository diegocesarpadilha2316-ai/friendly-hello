import { useMemo } from "react";
import { useProduction } from "./use-production";
import {
  buildDrillingSheets,
  buildFabricationIntents,
  buildFabricationKpis,
  DEFAULT_OPTIMIZER_CONSTRAINTS,
  optimizeCutting,
  type FabricationIntent,
  type FabricationKPI,
  type FabricationPlan,
  type OptimizerConstraints,
  type DrillingSheet,
} from "../services/fabrication";

export interface UseFabricationResult {
  hasProject: boolean;
  plan: FabricationPlan | null;
  drilling: readonly DrillingSheet[];
  kpis: readonly FabricationKPI[];
  intents: readonly FabricationIntent[];
  constraints: OptimizerConstraints;
}

export function useFabrication(overrides?: Partial<OptimizerConstraints>): UseFabricationResult {
  const { report, hasProject } = useProduction();
  const constraints = useMemo(
    () => ({ ...DEFAULT_OPTIMIZER_CONSTRAINTS, ...overrides }),
    [overrides],
  );
  return useMemo(() => {
    if (!report) {
      return { hasProject, plan: null, drilling: [], kpis: [], intents: [], constraints };
    }
    const plan = optimizeCutting(report.cutList, constraints);
    const drilling = buildDrillingSheets(report.parts);
    const kpis = buildFabricationKpis(report, plan);
    const intents = buildFabricationIntents(report, plan);
    return { hasProject, plan, drilling, kpis, intents, constraints };
  }, [report, hasProject, constraints]);
}
