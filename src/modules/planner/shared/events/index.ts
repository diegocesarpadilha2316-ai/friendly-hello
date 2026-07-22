/**
 * Barramento de eventos interno do Planner.
 *
 * Domínios publicam eventos tipados; outros domínios reagem sem se
 * acoplarem diretamente. Ex.: `catalog:item-updated` invalida cache de
 * `budget` e `production`.
 *
 * Nesta fase, apenas o contrato — implementação leve baseada em Map.
 */
export interface PlannerEventMap {
  "catalog:item-updated": { itemId: string };
  "project:updated": { projectId: string };
  "render:job-finished": { jobId: string; url: string };
  "budget:approved": { projectId: string };
  "production:bom-ready": { projectId: string };
}

export type PlannerEventName = keyof PlannerEventMap;
export type PlannerEventHandler<K extends PlannerEventName> = (payload: PlannerEventMap[K]) => void;

export class PlannerEventBus {
  private readonly handlers = new Map<PlannerEventName, Set<(p: unknown) => void>>();

  on<K extends PlannerEventName>(event: K, handler: PlannerEventHandler<K>): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    const set = this.handlers.get(event)!;
    const fn = handler as (p: unknown) => void;
    set.add(fn);
    return () => set.delete(fn);
  }

  emit<K extends PlannerEventName>(event: K, payload: PlannerEventMap[K]): void {
    this.handlers.get(event)?.forEach((h) => h(payload));
  }
}

let _bus: PlannerEventBus | null = null;
export function getPlannerEventBus(): PlannerEventBus {
  if (!_bus) _bus = new PlannerEventBus();
  return _bus;
}
