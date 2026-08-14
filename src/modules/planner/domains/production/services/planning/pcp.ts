import { computeMachineLoad, findOverloadedMachines, type MachineLoad } from "./machines";
import { computeOperatorLoad, findFreeOperators, type OperatorLoad } from "./operators";
import { sortByStrategy } from "./priority";
import type { PlanningOrder, SequencingStrategy } from "./types";

export interface PcpQueue {
  strategy: SequencingStrategy;
  orders: readonly PlanningOrder[];
  machineLoad: readonly MachineLoad[];
  operatorLoad: readonly OperatorLoad[];
  bottlenecks: readonly MachineLoad[];
  freeOperators: readonly OperatorLoad[];
}

export function buildPcpQueue(
  orders: readonly PlanningOrder[],
  totalHours: number,
  windowDays: number,
  strategy: SequencingStrategy = "ia",
): PcpQueue {
  const sorted = sortByStrategy(orders, strategy);
  const machineLoad = computeMachineLoad(totalHours, windowDays);
  const operatorLoad = computeOperatorLoad(totalHours, windowDays);
  return {
    strategy,
    orders: sorted,
    machineLoad,
    operatorLoad,
    bottlenecks: findOverloadedMachines(machineLoad),
    freeOperators: findFreeOperators(operatorLoad),
  };
}

export function balanceQueue(queue: PcpQueue): PcpQueue {
  // Determinístico: se há gargalos, alterna com ordens de menor tempo primeiro.
  if (queue.bottlenecks.length === 0) return queue;
  const rebalanced = sortByStrategy(queue.orders, "menor-tempo");
  return { ...queue, orders: rebalanced };
}
