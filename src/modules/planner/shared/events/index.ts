/**
 * Barramento de eventos interno do Planner.
 *
 * Fonte única de sincronização cross-domain. Domínios publicam eventos
 * tipados; outros reagem sem acoplamento. Antes desta fase muitas
 * mensagens viajavam via `window.dispatchEvent(new CustomEvent(...))`
 * — não-tipado, sujeito a typo silencioso, invisível para o DevTools.
 * Agora tudo passa pelo bus. Os wrappers em `window` continuam por
 * compatibilidade, mas apenas reemitem o bus.
 *
 * Regras:
 * - Eventos com prefixo `project:*` refletem mutação do estado autoritativo
 *   (`PlannerEditorProvider`). São emitidos DEPOIS do commit no reducer.
 * - Eventos com prefixo `ui:*` são intents da interface (foco, seleção
 *   visual, atalhos) — nunca alteram estado, só notificam.
 * - Eventos com prefixo `domain:*` (catalog/budget/production/render)
 *   sinalizam trabalho concluído fora do reducer.
 *
 * Não introduza estado dentro do bus — ele é canal, não store.
 */
export interface PlannerEventMap {
  // Estado autoritativo (reducer)
  "project:loaded": { projectId: string; version: number };
  "project:updated": { projectId: string; version: number; reason?: string };
  "project:saved": { projectId: string; version: number; at: string };
  "project:node-selected": { projectId: string; nodeId: string | null };
  "project:undone": { projectId: string; version: number };
  "project:redone": { projectId: string; version: number };

  // Intents de UI (não mutam estado)
  "ui:focus-selection": { primitiveId: string };
  "ui:focus-ai": Record<string, never>;
  "ui:item-inserted": { primitiveId: string; roomId: string };

  // Domínios reativos
  "catalog:item-updated": { itemId: string };
  "render:job-finished": { jobId: string; url: string };
  "budget:approved": { projectId: string };
  "production:bom-ready": { projectId: string };
}

export type PlannerEventName = keyof PlannerEventMap;
export type PlannerEventHandler<K extends PlannerEventName> = (payload: PlannerEventMap[K]) => void;

export class PlannerEventBus {
  private readonly handlers = new Map<PlannerEventName, Set<(p: unknown) => void>>();
  // Log em anel para diagnóstico (DevTools/overlay). Não usado em produção
  // para lógica — apenas leitura para debug.
  private readonly ring: Array<{ event: PlannerEventName; payload: unknown; at: number }> = [];
  private static readonly RING_LIMIT = 100;

  on<K extends PlannerEventName>(event: K, handler: PlannerEventHandler<K>): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    const set = this.handlers.get(event)!;
    const fn = handler as (p: unknown) => void;
    set.add(fn);
    return () => set.delete(fn);
  }

  emit<K extends PlannerEventName>(event: K, payload: PlannerEventMap[K]): void {
    this.ring.push({ event, payload, at: Date.now() });
    if (this.ring.length > PlannerEventBus.RING_LIMIT) this.ring.shift();
    // Cópia defensiva: um handler pode assinar/dessassinar durante o dispatch.
    const handlers = this.handlers.get(event);
    if (!handlers) return;
    for (const h of Array.from(handlers)) {
      try {
        h(payload);
      } catch (err) {
        // Um handler quebrado nunca deve derrubar os outros.
        console.error(`[planner-bus] handler falhou em ${event}`, err);
      }
    }
  }

  /** Snapshot do ring de eventos — para overlay de debug apenas. */
  history(): ReadonlyArray<{ event: PlannerEventName; payload: unknown; at: number }> {
    return this.ring.slice();
  }
}

let _bus: PlannerEventBus | null = null;
export function getPlannerEventBus(): PlannerEventBus {
  if (!_bus) _bus = new PlannerEventBus();
  return _bus;
}

/**
 * Reemissão para `window` — mantém compatibilidade com listeners legados
 * que ainda consomem `CustomEvent`. Chamado internamente pelo Provider.
 * Não deve ser usado para NOVO código: assine o bus diretamente.
 */
export function bridgeToWindow<K extends PlannerEventName>(
  event: K,
  payload: PlannerEventMap[K],
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(event, { detail: payload }));
}
