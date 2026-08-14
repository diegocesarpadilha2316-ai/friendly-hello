import { useMemo, useState } from "react";
import { useProduction } from "./use-production";
import {
  buildPlanningOrders,
  buildMrpFromCutList,
  buildPcpQueue,
  computeCapacityWindow,
  buildIndustrialCalendar,
  scheduleOrders,
  scheduleTotals,
  estimateDelivery,
  delayedOrders,
  buildPlanningKpis,
  buildReport,
  DEFAULT_RESOURCES,
  computeMachineLoad,
  computeOperatorLoad,
  computeBottlenecks,
  planningAi,
} from "../services/planning";
import type {
  SequencingStrategy,
  PlanningOrder,
  MrpSummary,
  CapacityWindow,
} from "../services/planning";

export interface UsePlanningResult {
  hasProject: boolean;
  isEmpty: boolean;
  orders: readonly PlanningOrder[];
  mrp: MrpSummary;
  capacity: CapacityWindow;
  pcp: ReturnType<typeof buildPcpQueue>;
  schedule: ReturnType<typeof scheduleOrders>;
  scheduleTotals: ReturnType<typeof scheduleTotals>;
  deliveries: ReturnType<typeof estimateDelivery>;
  delayed: ReturnType<typeof delayedOrders>;
  calendar: ReturnType<typeof buildIndustrialCalendar>;
  kpis: ReturnType<typeof buildPlanningKpis>;
  reportRows: ReturnType<typeof buildReport>;
  resources: typeof DEFAULT_RESOURCES;
  machineLoad: ReturnType<typeof computeMachineLoad>;
  operatorLoad: ReturnType<typeof computeOperatorLoad>;
  bottlenecks: ReturnType<typeof computeBottlenecks>;
  strategy: SequencingStrategy;
  setStrategy: (s: SequencingStrategy) => void;
  reportScope: "diario" | "semanal" | "mensal";
  setReportScope: (s: "diario" | "semanal" | "mensal") => void;
  ai: typeof planningAi;
}

export function usePlanning(): UsePlanningResult {
  const {
    report,
    orders: productionOrders,
    hasProject,
    isEmpty,
    projectName,
    clientName,
  } = useProduction();
  const [strategy, setStrategy] = useState<SequencingStrategy>("ia");
  const [reportScope, setReportScope] = useState<"diario" | "semanal" | "mensal">("semanal");

  return useMemo(() => {
    if (!report) {
      const empty = {
        hasProject,
        isEmpty: true,
        orders: [] as readonly PlanningOrder[],
        mrp: { items: [], totalItems: 0, totalCost: 0, byCategory: {} } as MrpSummary,
        capacity: computeCapacityWindow("semanal", 0),
        pcp: buildPcpQueue([], 0, 7, strategy),
        schedule: [] as ReturnType<typeof scheduleOrders>,
        scheduleTotals: scheduleTotals([]),
        deliveries: [] as ReturnType<typeof estimateDelivery>,
        delayed: [] as ReturnType<typeof delayedOrders>,
        calendar: buildIndustrialCalendar(new Date().toISOString().slice(0, 10), 30),
        kpis: buildPlanningKpis({
          orders: [],
          mrp: { items: [], totalItems: 0, totalCost: 0, byCategory: {} },
          capacity: computeCapacityWindow("semanal", 0),
          deliveries: [],
          totalRevenue: 0,
        }),
        reportRows: [] as ReturnType<typeof buildReport>,
        resources: DEFAULT_RESOURCES,
        machineLoad: computeMachineLoad(0, 7),
        operatorLoad: computeOperatorLoad(0, 7),
        bottlenecks: computeBottlenecks(0, 7),
        strategy,
        setStrategy,
        reportScope,
        setReportScope,
        ai: planningAi,
      } satisfies UsePlanningResult;
      return empty;
    }
    const totalHours = report.time.totalH;
    const totalValue = report.budget.summary.final;
    const orders = buildPlanningOrders(productionOrders, {
      totalHours,
      totalValue,
      parts: report.totals.parts,
      company: clientName,
      projectName,
    });
    const mrp = buildMrpFromCutList(report.cutList, report.hardware);
    const capacity = computeCapacityWindow("semanal", totalHours);
    const pcp = buildPcpQueue(orders, totalHours, 7, strategy);
    const sched = scheduleOrders(orders, strategy);
    const totals = scheduleTotals(sched);
    const deliveries = estimateDelivery(orders);
    const delayed = delayedOrders(deliveries);
    const calendar = buildIndustrialCalendar(new Date().toISOString().slice(0, 10), 30);
    const kpis = buildPlanningKpis({
      orders,
      mrp,
      capacity,
      deliveries,
      totalRevenue: totalValue,
    });
    const reportRows = buildReport(orders, reportScope);
    const machineLoad = computeMachineLoad(totalHours, 7);
    const operatorLoad = computeOperatorLoad(totalHours, 7);
    const bottlenecks = computeBottlenecks(totalHours, 7);

    return {
      hasProject,
      isEmpty,
      orders,
      mrp,
      capacity,
      pcp,
      schedule: sched,
      scheduleTotals: totals,
      deliveries,
      delayed,
      calendar,
      kpis,
      reportRows,
      resources: DEFAULT_RESOURCES,
      machineLoad,
      operatorLoad,
      bottlenecks,
      strategy,
      setStrategy,
      reportScope,
      setReportScope,
      ai: planningAi,
    } satisfies UsePlanningResult;
  }, [
    report,
    productionOrders,
    hasProject,
    isEmpty,
    projectName,
    clientName,
    strategy,
    reportScope,
  ]);
}
