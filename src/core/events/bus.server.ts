/**
 * EventBus — implementação única de publish/subscribe da plataforma.
 * - Persiste todos os eventos (fonte de verdade em `events`).
 * - Fanout in-process para handlers registrados.
 * - Suporta deduplicação por (companyId, type, dedupeKey).
 * - Cria registros em `event_deliveries` para rules/subscribers persistentes.
 *
 * NENHUM módulo cria seu próprio bus — sempre importar `EventBus`.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Event, EventPayload, PublishInput } from "./types";

export type EventHandler = (event: Event) => void | Promise<void>;

interface HandlerEntry {
  readonly id: string;
  readonly type: string; // "*" wildcard supported
  readonly handler: EventHandler;
}

class EventBusImpl {
  private readonly handlers = new Map<string, HandlerEntry>();

  subscribe(id: string, type: string, handler: EventHandler): () => void {
    this.handlers.set(id, { id, type, handler });
    return () => this.handlers.delete(id);
  }

  listSubscribers(): readonly { id: string; type: string }[] {
    return Array.from(this.handlers.values()).map(({ id, type }) => ({ id, type }));
  }

  async publish(
    ctx: { supabase: SupabaseClient; tenantId: string; userId: string },
    input: PublishInput,
  ): Promise<Event> {
    const dedupeKey = input.dedupeKey ?? null;

    if (dedupeKey) {
      const { data: existing } = await ctx.supabase
        .from("events")
        .select("*")
        .eq("company_id", ctx.tenantId)
        .eq("type", input.type)
        .eq("dedupe_key", dedupeKey)
        .maybeSingle();
      if (existing) return mapEvent(existing);
    }

    const insertRow = {
      company_id: ctx.tenantId,
      type: input.type,
      source: input.source ?? "core",
      priority: input.priority ?? "normal",
      status: "pending" as const,
      payload: (input.payload ?? {}) as unknown,
      metadata: (input.metadata ?? {}) as unknown,
      dedupe_key: dedupeKey,
      scheduled_at: input.scheduledAt ?? new Date().toISOString(),
      max_attempts: input.maxAttempts ?? 5,
      actor_id: ctx.userId,
    };

    const { data, error } = await ctx.supabase
      .from("events")
      .insert(insertRow)
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "event insert failed");

    const event = mapEvent(data);

    // Materializa notificações via NotificationManager (regras + audiência + templates)
    try {
      const { NotificationManager } = await import("@/core/notifications/manager.server");
      await NotificationManager.processEvent(ctx, event);
    } catch (err) {
      console.error(`[EventBus] processEvent falhou para ${event.type}:`, err);
    }

    // Fanout in-process (best-effort, não bloqueante em caso de erro)
    void this.fanout(event);

    return event;
  }

  private async fanout(event: Event): Promise<void> {
    for (const { type, handler } of this.handlers.values()) {
      if (type !== "*" && type !== event.type) continue;
      try {
        await handler(event);
      } catch (err) {
        console.error(`[EventBus] handler error for ${event.type}:`, err);
      }
    }
  }
}

export const EventBus = new EventBusImpl();

function mapEvent(row: Record<string, unknown>): Event {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    type: row.type as string,
    source: row.source as string,
    priority: row.priority as Event["priority"],
    status: row.status as Event["status"],
    payload: (row.payload as EventPayload) ?? {},
    metadata: (row.metadata as EventPayload) ?? {},
    dedupeKey: (row.dedupe_key as string | null) ?? null,
    scheduledAt: row.scheduled_at as string,
    processedAt: (row.processed_at as string | null) ?? null,
    attempts: (row.attempts as number) ?? 0,
    maxAttempts: (row.max_attempts as number) ?? 5,
    lastError: (row.last_error as string | null) ?? null,
    actorId: (row.actor_id as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export { mapEvent };
