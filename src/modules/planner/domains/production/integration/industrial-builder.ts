/**
 * Fase 3.32 — Industrial Builder.
 * Orquestra Production + Fabrication + Nesting + Industrial + CNC +
 * Intelligence (Fábrica 4.0) + Planning (PCP/MRP) num único bundle.
 */
import type { CompanyManufacturingRules } from "@/modules/planner/shared/engineering/types";
import type { PlannerProject } from "@/modules/planner/shared/types/project";
import { buildProductionReport, seedProductionOrders } from "../services";
import {
  DEFAULT_OPTIMIZER_CONSTRAINTS,
  optimizeCutting,
  type OptimizerConstraints,
} from "../services/fabrication";
import {
  buildAssemblyPlan,
  buildIndustrialCost,
  loadOffcuts,
  type OffcutInventoryItem,
} from "../services/industrial";
import {
  assignOperators,
  balanceMachines,
  buildCapacitySnapshot,
  buildFactoryAlerts,
  buildFactoryKpis,
  buildQualityChecklist,
  buildQueues,
  buildRoutingPlans,
  estimateDelivery as estimateFactoryDelivery,
  prioritizeOrders,
} from "../services/intelligence";
import {
  buildPlanningOrders,
  buildMrpFromCutList,
  computeCapacityWindow,
  scheduleOrders,
  estimateDelivery as estimatePlanningDelivery,
} from "../services/planning";
import { buildCncManifest, PRIMARY_MACHINE_ID } from "./cnc-integration";
import { buildFinalKpis } from "./kpis";
import { selectBestNesting } from "./nesting-integration";
import type { IndustrialBundle } from "./types";

export interface BuildBundleOptions {
  readonly tenantId?: string;
  readonly cncMachineId?: string;
  readonly optimizer?: Partial<OptimizerConstraints>;
}

export function buildIndustrialBundle(
  project: PlannerProject,
  rules: CompanyManufacturingRules,
  options: BuildBundleOptions = {},
): IndustrialBundle {
  const production = buildProductionReport(project, rules);
  const orders = seedProductionOrders(project.id, project.client ?? project.name);
  const constraints: OptimizerConstraints = {
    ...DEFAULT_OPTIMIZER_CONSTRAINTS,
    ...(options.optimizer ?? {}),
  };
  const fabrication = production.cutList.length > 0
    ? optimizeCutting(production.cutList, constraints)
    : null;
  const nesting = selectBestNesting(production.cutList);
  const cnc = buildCncManifest(production.cutList, options.cncMachineId ?? PRIMARY_MACHINE_ID);
  const assembly = buildAssemblyPlan(production.parts);
  const cost = buildIndustrialCost(production, fabrication);
  const offcuts: readonly OffcutInventoryItem[] = options.tenantId ? loadOffcuts(options.tenantId) : [];

  const capacity = buildCapacitySnapshot(production, assembly);
  const routings = buildRoutingPlans(production);
  const balance = balanceMachines(routings);
  const assignments = assignOperators(capacity.operators);
  const factoryDelivery = estimateFactoryDelivery(routings, capacity, balance);
  const quality = buildQualityChecklist(production);
  const prioritized = prioritizeOrders(orders, production);
  const queues = buildQueues(production, assembly, routings, prioritized, project.client ?? project.name);
  const factoryKpis = buildFactoryKpis(production, capacity, balance, factoryDelivery, quality, queues);
  const factoryAlerts = buildFactoryAlerts(balance, capacity, factoryDelivery, quality, queues);

  const planningOrders = buildPlanningOrders(orders, {
    totalHours: production.time.totalH,
    totalValue: production.budget.summary.final,
    parts: production.totals.parts,
    company: project.client ?? project.name,
    projectName: project.name,
  });
  const mrp = buildMrpFromCutList(production.cutList, production.hardware);
  const capacityWindow = computeCapacityWindow("semanal", production.time.totalH);
  const schedule = scheduleOrders(planningOrders, "ia");
  const planningDelivery = estimatePlanningDelivery(planningOrders);

  const kpis = buildFinalKpis({
    report: production, nesting, cnc, cost, capacity, balance, quality,
    delivery: factoryDelivery, mrp, capacityWindow,
  });

  return {
    generatedAt: new Date().toISOString(),
    projectId: project.id,
    projectName: project.name,
    clientName: project.client ?? project.name,
    production, orders, fabrication, nesting, offcuts, cnc, assembly, cost,
    capacity, balance, assignments, routings, quality, queues, prioritized,
    factoryDelivery, factoryAlerts, factoryKpis,
    planningOrders, mrp, capacityWindow, schedule, planningDelivery,
    kpis,
  };
}