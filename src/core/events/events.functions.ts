import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";
import type {
  Event,
  EventDelivery,
  EventMetrics,
  EventPayload,
  EventPriority,
  EventStatus,
} from "./types";

const publishSchema = z.object({
  type: z.string().min(1).max(160),
  payload: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  priority: z.enum(["low", "normal", "high", "critical"]).optional(),
  source: z.string().max(80).optional(),
  dedupeKey: z.string().max(180).optional(),
  scheduledAt: z.string().datetime().optional(),
  maxAttempts: z.number().int().min(1).max(20).optional(),
});

export const eventsPublish = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => publishSchema.parse(raw))
  .handler(async ({ context, data }): Promise<Event> => {
    const { EventBus } = await import("./bus.server");
    return EventBus.publish(context, {
      type: data.type,
      payload: data.payload as EventPayload | undefined,
      metadata: data.metadata as EventPayload | undefined,
      priority: data.priority as EventPriority | undefined,
      source: data.source,
      dedupeKey: data.dedupeKey,
      scheduledAt: data.scheduledAt,
      maxAttempts: data.maxAttempts,
    });
  });

const listSchema = z.object({
  type: z.string().optional(),
  status: z
    .enum(["pending", "processing", "delivered", "failed", "dead", "scheduled", "deduped"])
    .optional(),
  limit: z.number().int().positive().max(200).default(100),
});

export const eventsList = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => listSchema.parse(raw ?? {}))
  .handler(async ({ context, data }): Promise<readonly Event[]> => {
    let q = context.supabase
      .from("events")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.type) q = q.eq("type", data.type);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const { mapEvent } = await import("./bus.server");
    return (rows ?? []).map(mapEvent);
  });

export const eventsMetrics = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<EventMetrics> => {
    const { data, error } = await context.supabase
      .from("events")
      .select("status")
      .eq("company_id", context.tenantId)
      .limit(1000);
    if (error) throw new Error(error.message);
    const total = data?.length ?? 0;
    const by = (s: string) => (data ?? []).filter((r) => r.status === s).length;
    return {
      total,
      pending: by("pending") + by("processing") + by("scheduled"),
      delivered: by("delivered"),
      failed: by("failed"),
      dead: by("dead"),
    };
  });

export const eventDeliveriesList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly EventDelivery[]> => {
    const { data, error } = await context.supabase
      .from("event_deliveries")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      companyId: r.company_id as string,
      eventId: r.event_id as string,
      subscriber: r.subscriber as string,
      status: r.status as EventStatus,
      attempts: (r.attempts as number) ?? 0,
      maxAttempts: (r.max_attempts as number) ?? 5,
      lastError: (r.last_error as string | null) ?? null,
      nextAttemptAt: r.next_attempt_at as string,
      deliveredAt: (r.delivered_at as string | null) ?? null,
      createdAt: r.created_at as string,
    }));
  });

export const eventDeliveryRequeue = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) =>
    z.object({ deliveryId: z.string().uuid() }).parse(raw),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { error } = await context.supabase
      .from("event_deliveries")
      .update({
        status: "pending",
        next_attempt_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", data.deliveryId)
      .eq("company_id", context.tenantId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
