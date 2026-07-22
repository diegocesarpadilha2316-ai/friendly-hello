import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";
import type {
  Notification,
  NotificationAuditEntry,
  NotificationChannel,
  NotificationDelivery,
  NotificationMetrics,
  NotificationPreference,
  NotificationRule,
  NotificationTemplate,
} from "./types";

const CHANNELS: readonly NotificationChannel[] = [
  "in_app","email","whatsapp","sms","push","webhook","discord","slack","teams","telegram",
];
const channelSchema = z.enum(CHANNELS as unknown as [NotificationChannel, ...NotificationChannel[]]);
const prioritySchema = z.enum(["low","normal","high","critical"]);

export const notificationsList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly Notification[]> => {
    const { data, error } = await context.supabase
      .from("notifications")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    const { mapNotification } = await import("./manager.server");
    return (data ?? []).map(mapNotification);
  });

export const notificationsMetrics = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<NotificationMetrics> => {
    const [{ data: notifs }, { data: deliveries }] = await Promise.all([
      context.supabase
        .from("notifications")
        .select("status")
        .eq("company_id", context.tenantId)
        .limit(1000),
      context.supabase
        .from("notification_deliveries")
        .select("status")
        .eq("company_id", context.tenantId)
        .limit(1000),
    ]);
    const total = notifs?.length ?? 0;
    const unread = (notifs ?? []).filter((n) => n.status !== "read" && n.status !== "archived").length;
    const deliveriesPending = (deliveries ?? []).filter((d) => d.status === "pending").length;
    const deliveriesFailed = (deliveries ?? []).filter((d) => d.status === "failed").length;
    return { total, unread, deliveriesPending, deliveriesFailed };
  });

export const notificationsMarkRead = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const { NotificationManager } = await import("./manager.server");
    await NotificationManager.markRead(context, data.id);
    return { ok: true as const };
  });

export const notificationsMarkAllRead = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .handler(async ({ context }) => {
    const { NotificationManager } = await import("./manager.server");
    await NotificationManager.markAllRead(context);
    return { ok: true as const };
  });

export const notificationsArchive = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const { NotificationManager } = await import("./manager.server");
    await NotificationManager.archive(context, data.id);
    return { ok: true as const };
  });

export const notificationsSendDirect = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) =>
    z.object({
      userId: z.string().uuid().nullable().optional(),
      category: z.string().max(80).optional(),
      priority: prioritySchema.optional(),
      title: z.string().min(1).max(200),
      body: z.string().max(4000).optional(),
      icon: z.string().max(80).optional(),
      link: z.string().max(500).optional(),
      channels: z.array(channelSchema).optional(),
    }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    const { NotificationManager } = await import("./manager.server");
    return NotificationManager.sendDirect(context, data);
  });

export const notificationTemplatesList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly NotificationTemplate[]> => {
    const { data, error } = await context.supabase
      .from("notification_templates")
      .select("*")
      .or(`company_id.eq.${context.tenantId},company_id.is.null`)
      .order("key");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r): NotificationTemplate => ({
      id: r.id as string,
      companyId: (r.company_id as string | null) ?? null,
      key: r.key as string,
      channel: r.channel as NotificationChannel,
      locale: r.locale as string,
      subject: (r.subject as string | null) ?? null,
      body: r.body as string,
      variables: (r.variables as string[]) ?? [],
      enabled: r.enabled as boolean,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    }));
  });

export const notificationRulesList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly NotificationRule[]> => {
    const { data, error } = await context.supabase
      .from("notification_rules")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const { mapRule } = await import("./manager.server");
    return (data ?? []).map(mapRule);
  });

export const notificationPreferencesList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly NotificationPreference[]> => {
    const { data, error } = await context.supabase
      .from("notification_preferences")
      .select("*")
      .eq("company_id", context.tenantId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r): NotificationPreference => ({
      id: r.id as string,
      companyId: r.company_id as string,
      userId: (r.user_id as string | null) ?? null,
      channel: r.channel as NotificationChannel,
      category: r.category as string,
      enabled: r.enabled as boolean,
      mutedUntil: (r.muted_until as string | null) ?? null,
      updatedAt: r.updated_at as string,
    }));
  });

export const notificationDeliveriesList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly NotificationDelivery[]> => {
    const { data, error } = await context.supabase
      .from("notification_deliveries")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r): NotificationDelivery => ({
      id: r.id as string,
      companyId: r.company_id as string,
      notificationId: (r.notification_id as string | null) ?? null,
      eventId: (r.event_id as string | null) ?? null,
      channel: r.channel as NotificationChannel,
      target: r.target as string,
      status: r.status as NotificationDelivery["status"],
      attempts: (r.attempts as number) ?? 0,
      maxAttempts: (r.max_attempts as number) ?? 5,
      lastError: (r.last_error as string | null) ?? null,
      provider: (r.provider as string | null) ?? null,
      providerMessageId: (r.provider_message_id as string | null) ?? null,
      nextAttemptAt: r.next_attempt_at as string,
      deliveredAt: (r.delivered_at as string | null) ?? null,
      createdAt: r.created_at as string,
    }));
  });

export const notificationAuditList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly NotificationAuditEntry[]> => {
    const { data, error } = await context.supabase
      .from("notification_audit")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r): NotificationAuditEntry => ({
      id: r.id as string,
      companyId: r.company_id as string,
      actorId: (r.actor_id as string | null) ?? null,
      entity: r.entity as string,
      entityId: (r.entity_id as string | null) ?? null,
      action: r.action as string,
      detail: (r.detail as NotificationAuditEntry["detail"]) ?? {},
      createdAt: r.created_at as string,
    }));
  });
