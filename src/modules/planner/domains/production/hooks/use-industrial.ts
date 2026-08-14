import { useCallback, useMemo, useState, useEffect } from "react";
import { useTenant } from "@/core/providers/TenantProvider";
import { usePlannerEditor } from "@/modules/planner/shared/state/editor-context";
import { useProduction } from "./use-production";
import { useFabrication } from "./use-fabrication";
import {
  buildAssemblyPlan,
  buildIndustrialCost,
  buildIndustrialIntents,
  buildIndustrialKpis,
  comparePlans,
  loadOffcuts,
  matchIndustrialIntent,
  registerOffcutsFromPlan,
  removeOffcut,
  saveOffcuts,
  updateOffcutStatus,
  type AssemblyPlan,
  type IndustrialCostSummary,
  type IndustrialIntent,
  type IndustrialKPI,
  type OffcutInventoryItem,
  type OptimizerCompare,
} from "../services/industrial";
import {
  optimizeCutting,
  DEFAULT_OPTIMIZER_CONSTRAINTS,
  type OptimizerConstraints,
} from "../services/fabrication";

export interface UseIndustrialResult {
  hasProject: boolean;
  offcuts: readonly OffcutInventoryItem[];
  assembly: AssemblyPlan;
  cost: IndustrialCostSummary | null;
  kpis: readonly IndustrialKPI[];
  intents: readonly IndustrialIntent[];
  compare: OptimizerCompare | null;
  registerOffcuts: () => void;
  clearAllOffcuts: () => void;
  setOffcutStatus: (id: string, status: OffcutInventoryItem["status"]) => void;
  deleteOffcut: (id: string) => void;
  reoptimize: (overrides?: Partial<OptimizerConstraints>) => void;
  ask: (prompt: string) => IndustrialIntent | null;
}

export function useIndustrial(): UseIndustrialResult {
  const { state } = usePlannerEditor();
  const { activeCompany } = useTenant();
  const tenantId = activeCompany?.id ?? "anonymous";
  const projectId = state.project?.id ?? "sem-projeto";
  const projectName = state.project?.name ?? "sem-projeto";

  const { report, hasProject } = useProduction();
  const { plan } = useFabrication();

  const [offcuts, setOffcuts] = useState<OffcutInventoryItem[]>(() => loadOffcuts(tenantId));
  const [compare, setCompare] = useState<OptimizerCompare | null>(null);

  useEffect(() => {
    setOffcuts(loadOffcuts(tenantId));
  }, [tenantId]);

  const cost = useMemo(() => (report ? buildIndustrialCost(report, plan) : null), [report, plan]);
  const kpis = useMemo(
    () => (report && cost ? buildIndustrialKpis(report, plan, cost, offcuts) : []),
    [report, plan, cost, offcuts],
  );
  const intents = useMemo(
    () => (report && cost ? buildIndustrialIntents(report, plan, cost, offcuts) : []),
    [report, plan, cost, offcuts],
  );
  const assembly = useMemo(
    () =>
      report ? buildAssemblyPlan(report.parts) : { steps: [], totalMinutes: 0, totalSteps: 0 },
    [report],
  );

  const registerOffcuts = useCallback(() => {
    if (!plan) return;
    const next = registerOffcutsFromPlan(tenantId, projectId, projectName, plan);
    setOffcuts(next);
  }, [plan, tenantId, projectId, projectName]);

  const clearAllOffcuts = useCallback(() => {
    saveOffcuts(tenantId, []);
    setOffcuts([]);
  }, [tenantId]);

  const setOffcutStatus = useCallback(
    (id: string, status: OffcutInventoryItem["status"]) => {
      setOffcuts(updateOffcutStatus(tenantId, id, status));
    },
    [tenantId],
  );

  const deleteOffcut = useCallback(
    (id: string) => {
      setOffcuts(removeOffcut(tenantId, id));
    },
    [tenantId],
  );

  const reoptimize = useCallback(
    (overrides?: Partial<OptimizerConstraints>) => {
      if (!report || !plan) return;
      const nextConstraints: OptimizerConstraints = {
        ...DEFAULT_OPTIMIZER_CONSTRAINTS,
        ...plan.constraints,
        ...(overrides ?? {}),
      };
      const after = optimizeCutting(report.cutList, nextConstraints);
      setCompare(comparePlans(plan, after));
    },
    [report, plan],
  );

  const ask = useCallback((prompt: string) => matchIndustrialIntent(prompt, intents), [intents]);

  return {
    hasProject,
    offcuts,
    assembly,
    cost,
    kpis,
    intents,
    compare,
    registerOffcuts,
    clearAllOffcuts,
    setOffcutStatus,
    deleteOffcut,
    reoptimize,
    ask,
  };
}
