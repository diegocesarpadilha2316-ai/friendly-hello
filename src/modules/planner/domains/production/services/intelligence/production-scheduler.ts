import type { ProductionReport } from "../../types";
import type { AssemblyPlan } from "../industrial";
import type { PrioritizedOrder, ProductionQueue, QueueTicket, RoutingPlan } from "./types";

const CAPACITY_MIN_BY_QUEUE: Record<string, number> = {
  producao: 8 * 60 * 2,
  cnc: 8 * 60,
  montagem: 8 * 60 * 2,
  embalagem: 8 * 60,
  entrega: 8 * 60,
};

function ticketBase(
  code: string,
  label: string,
  clientName: string,
  minutes: number,
  priority: PrioritizedOrder["priority"] = "normal",
): QueueTicket {
  return {
    id: `${code}-${label}`.toLowerCase().replace(/\s+/g, "-").slice(0, 80),
    code,
    label,
    clientName,
    priority,
    minutes: Math.max(1, Math.round(minutes)),
    progress: 0,
    status: "pendente",
  };
}

export function buildQueues(
  report: ProductionReport,
  assembly: AssemblyPlan,
  routings: readonly RoutingPlan[],
  prioritized: readonly PrioritizedOrder[],
  clientName: string,
): readonly ProductionQueue[] {
  const topPriority = prioritized[0]?.priority ?? "normal";

  const producao: QueueTicket[] = routings.map((r) =>
    ticketBase(r.moduleId.slice(0, 6).toUpperCase(), r.moduleLabel, clientName, r.totalMinutes, topPriority),
  );

  const cnc: QueueTicket[] = routings.flatMap((r) =>
    r.steps
      .filter((s) => s.stage === "corte" || s.stage === "usinagem")
      .map((s) =>
        ticketBase(`${r.moduleId.slice(0, 4).toUpperCase()}·${s.stage}`, `${r.moduleLabel} · ${s.label}`, clientName, s.minutes, topPriority),
      ),
  );

  const montagem: QueueTicket[] = assembly.steps
    .filter((s) => ["estrutura", "porta", "gaveta", "prateleira", "fundo"].includes(s.kind))
    .map((s) =>
      ticketBase(s.furnitureId.slice(0, 6).toUpperCase(), `${s.furnitureLabel} · ${s.title}`, clientName, s.estimatedMinutes, topPriority),
    );

  const embalagem: QueueTicket[] = routings.map((r) => {
    const s = r.steps.find((x) => x.stage === "embalagem");
    return ticketBase(`EMB·${r.moduleId.slice(0, 4).toUpperCase()}`, `Embalar ${r.moduleLabel}`, clientName, s?.minutes ?? 5, topPriority);
  });

  const entrega: QueueTicket[] = [
    ticketBase("DELIVERY", `Entrega ${clientName}`, clientName, Math.max(30, Math.round(report.totals.weightKg * 0.4)), topPriority),
  ];

  const totalFor = (t: readonly QueueTicket[]) => t.reduce((a, x) => a + x.minutes, 0);
  const asQueue = (kind: ProductionQueue["kind"], label: string, tickets: readonly QueueTicket[]): ProductionQueue => {
    const total = totalFor(tickets);
    const cap = CAPACITY_MIN_BY_QUEUE[kind] ?? 480;
    return { kind, label, tickets, totalMinutes: total, capacityMinutes: cap, loadPct: cap === 0 ? 0 : Math.min(100, Math.round((total / cap) * 100)) };
  };

  return [
    asQueue("producao", "Fila de Produção", producao),
    asQueue("cnc", "Fila CNC", cnc),
    asQueue("montagem", "Fila de Montagem", montagem),
    asQueue("embalagem", "Fila de Embalagem", embalagem),
    asQueue("entrega", "Fila de Entrega", entrega),
  ];
}