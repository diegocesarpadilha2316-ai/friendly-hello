import { useMemo } from "react";
import { useTenant } from "@/core/providers/TenantProvider";
import { usePlannerEditor } from "@/modules/planner/shared/state/editor-context";
import { loadRules } from "@/modules/planner/shared/engineering/company-rules";
import { buildProductionReport } from "../services/report";
import { seedProductionOrders } from "../services/production-flow";
import type { ProductionOrder, ProductionReport } from "../types";

export interface UseProductionResult {
  report: ProductionReport | null;
  orders: readonly ProductionOrder[];
  hasProject: boolean;
  isEmpty: boolean;
  projectName: string;
  clientName: string;
}

export function useProduction(): UseProductionResult {
  const { state } = usePlannerEditor();
  const { activeCompany } = useTenant();
  const tenantId = activeCompany?.id ?? "anonymous";

  return useMemo(() => {
    const project = state.project;
    if (!project) {
      return {
        report: null,
        orders: [],
        hasProject: false,
        isEmpty: true,
        projectName: "—",
        clientName: "—",
      };
    }
    const rules = loadRules(tenantId);
    const report = buildProductionReport(project, rules);
    const orders = seedProductionOrders(project.id, project.client ?? project.name);
    return {
      report,
      orders,
      hasProject: true,
      isEmpty: report.parts.length === 0,
      projectName: project.name,
      clientName: project.client ?? project.name,
    };
  }, [state.project, tenantId]);
}
