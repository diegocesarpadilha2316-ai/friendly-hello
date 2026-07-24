import { useMemo } from "react";
import { useProduction } from "./use-production";
import { useIndustrial } from "./use-industrial";
import {
  assignOperators,
  balanceMachines,
  buildCapacitySnapshot,
  buildFactoryAlerts,
  buildFactoryIntents,
  buildFactoryKpis,
  buildQualityChecklist,
  buildQueues,
  buildRoutingPlans,
  estimateDelivery,
  matchFactoryIntent,
  prioritizeOrders,
  type CapacitySnapshot,
  type DeliveryEstimate,
  type FactoryAlert,
  type FactoryIntent,
  type FactoryKPI,
  type MachineBalance,
  type OperatorAssignment,
  type PrioritizedOrder,
  type ProductionQueue,
  type QualityChecklist,
  type RoutingPlan,
} from "../services/intelligence";

export interface UseIntelligenceResult {
  hasProject: boolean;
  capacity: CapacitySnapshot | null;
  routings: readonly RoutingPlan[];
  balance: MachineBalance | null;
  assignments: readonly OperatorAssignment[];
  delivery: DeliveryEstimate | null;
  quality: QualityChecklist | null;
  prioritized: readonly PrioritizedOrder[];
  queues: readonly ProductionQueue[];
  kpis: readonly FactoryKPI[];
  alerts: readonly FactoryAlert[];
  intents: readonly FactoryIntent[];
  ask: (prompt: string) => FactoryIntent | null;
}

export function useIntelligence(): UseIntelligenceResult {
  const { report, orders, hasProject, clientName } = useProduction();
  const { assembly } = useIndustrial();

  return useMemo(() => {
    if (!report) {
      return {
        hasProject,
        capacity: null,
        routings: [],
        balance: null,
        assignments: [],
        delivery: null,
        quality: null,
        prioritized: [],
        queues: [],
        kpis: [],
        alerts: [],
        intents: [],
        ask: () => null,
      };
    }
    const capacity = buildCapacitySnapshot(report, assembly);
    const routings = buildRoutingPlans(report);
    const balance = balanceMachines(routings);
    const assignments = assignOperators(capacity.operators);
    const delivery = estimateDelivery(routings, capacity, balance);
    const quality = buildQualityChecklist(report);
    const prioritized = prioritizeOrders(orders, report);
    const queues = buildQueues(report, assembly, routings, prioritized, clientName);
    const kpis = buildFactoryKpis(report, capacity, balance, delivery, quality, queues);
    const alerts = buildFactoryAlerts(balance, capacity, delivery, quality, queues);
    const intents = buildFactoryIntents(report, capacity, balance, delivery, quality, assignments, routings, prioritized);
    return {
      hasProject,
      capacity,
      routings,
      balance,
      assignments,
      delivery,
      quality,
      prioritized,
      queues,
      kpis,
      alerts,
      intents,
      ask: (prompt: string) => matchFactoryIntent(prompt, intents),
    };
  }, [report, assembly, orders, hasProject, clientName]);
}