/**
 * NotificationManager — orquestrador único de notificações.
 * Fluxo:
 *   1. Recebe um Event (ou input manual).
 *   2. Casa com regras ativas do tenant (`notification_rules`).
 *   3. Resolve audiência (users/roles) e canais.
 *   4. Aplica preferências e silenciamento (`notification_preferences`).
 *   5. Cria `notifications` (in-app) e `notification_deliveries` (out-of-app).
 *   6. Registra auditoria (`notification_audit`).
 *
 * Nenhum módulo cria linhas em `notifications` diretamente.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Event, EventPayload, EventPriority } from "@/core/events/types";
import { renderTemplate } from "./templates";
import type { Notification, NotificationChannel, NotificationRule } from "./types";

interface Ctx {
  supabase: SupabaseClient;
  tenantId: string;
  userId: string;
}

interface DirectInput {
  readonly userId?: string | null;
  readonly category?: string;
  readonly priority?: EventPriority;
  readonly title: string;
  readonly body?: string;
  readonly icon?: string;
  readonly link?: string;
  readonly data?: EventPayload;
  readonly channels?: readonly NotificationChannel[];
}

async function audit(
  ctx: Ctx,
  entity: string,
  entityId: string | null,
  action: string,
  detail: Record<string, unknown>,
) {
  await ctx.supabase.from("notification_audit").insert({
    company_id: ctx.tenantId,
    actor_id: ctx.userId,
    entity,
    entity_id: entityId,
    action,
    detail,
  });
}

async function isMuted(
  ctx: Ctx,
  userId: string | null,
  channel: NotificationChannel,
  category: string,
): Promise<boolean> {
  const { data } = await ctx.supabase
    .from("notification_preferences")
    .select("enabled, muted_until")
    .eq("company_id", ctx.tenantId)
    .eq("channel", channel)
    .eq("category", category)
    .eq("user_id", userId ?? "")
    .maybeSingle();
  if (!data) return false;
  if (!data.enabled) return true;
  if (data.muted_until && new Date(data.muted_until).getTime() > Date.now()) return true;
  return false;
}

async function resolveAudience(
  ctx: Ctx,
  rule: Pick<NotificationRule, "audience">,
): Promise<string[]> {
  const aud = rule.audience ?? {};
  const explicit = Array.isArray(aud.users) ? (aud.users as string[]) : [];
  const roles = Array.isArray(aud.roles) ? (aud.roles as string[]) : [];
  if (explicit.length > 0) return explicit;
  if (roles.length > 0) {
    const { data } = await ctx.supabase
      .from("company_members")
      .select("user_id, role")
      .eq("company_id", ctx.tenantId);
    return (data ?? [])
      .filter((m) => roles.includes(m.role as string))
      .map((m) => m.user_id as string);
  }
  // Default: todos os membros ativos do tenant
  const { data } = await ctx.supabase
    .from("company_members")
    .select("user_id")
    .eq("company_id", ctx.tenantId);
  return (data ?? []).map((m) => m.user_id as string);
}

async function loadTemplate(
  ctx: Ctx,
  key: string | null,
  channel: NotificationChannel,
): Promise<{ subject: string | null; body: string } | null> {
  if (!key) return null;
  const { data } = await ctx.supabase
    .from("notification_templates")
    .select("subject, body, enabled")
    .eq("key", key)
    .eq("channel", channel)
    .or(`company_id.eq.${ctx.tenantId},company_id.is.null`)
    .order("company_id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data || !data.enabled) return null;
  return { subject: (data.subject as string | null) ?? null, body: data.body as string };
}

export const NotificationManager = {
  /** Aplica regras ao evento e materializa notificações/entregas. */
  async processEvent(ctx: Ctx, event: Event): Promise<readonly Notification[]> {
    const { data: rulesRaw } = await ctx.supabase
      .from("notification_rules")
      .select("*")
      .eq("company_id", ctx.tenantId)
      .eq("enabled", true)
      .eq("event_type", event.type);
    const created: Notification[] = [];
    for (const r of rulesRaw ?? []) {
      const rule = mapRule(r);
      const audience = await resolveAudience(ctx, rule);
      for (const userId of audience) {
        for (const channel of rule.channels) {
          if (await isMuted(ctx, userId, channel, rule.category)) continue;
          const tpl = await loadTemplate(ctx, rule.templateKey, channel);
          const title = tpl?.subject ? renderTemplate(tpl.subject, event.payload) : event.type;
          const body = tpl?.body ? renderTemplate(tpl.body, event.payload) : null;

          if (channel === "in_app") {
            const { data: notif } = await ctx.supabase
              .from("notifications")
              .insert({
                company_id: ctx.tenantId,
                user_id: userId,
                event_id: event.id,
                category: rule.category,
                priority: rule.priority,
                title,
                body,
                data: event.payload as unknown,
                status: "sent",
              })
              .select("*")
              .single();
            if (notif) created.push(mapNotification(notif));
          } else {
            // Out-of-app: cria delivery pendente (worker externo entrega)
            await ctx.supabase.from("notification_deliveries").insert({
              company_id: ctx.tenantId,
              event_id: event.id,
              channel,
              target: userId,
              status: "pending",
            });
          }
        }
      }
    }
    await audit(ctx, "event", event.id, "processed", { rules: rulesRaw?.length ?? 0 });
    return created;
  },

  /** API direta para módulos que precisam empurrar notificação sem regra. */
  async sendDirect(ctx: Ctx, input: DirectInput): Promise<Notification> {
    const category = input.category ?? "geral";
    const priority: EventPriority = input.priority ?? "normal";
    const channels = input.channels ?? ["in_app"];
    let created: Notification | null = null;
    for (const channel of channels) {
      if (await isMuted(ctx, input.userId ?? null, channel, category)) continue;
      if (channel === "in_app") {
        const { data, error } = await ctx.supabase
          .from("notifications")
          .insert({
            company_id: ctx.tenantId,
            user_id: input.userId ?? null,
            category,
            priority,
            title: input.title,
            body: input.body ?? null,
            icon: input.icon ?? null,
            link: input.link ?? null,
            data: (input.data ?? {}) as unknown,
            status: "sent",
          })
          .select("*")
          .single();
        if (error) throw new Error(error.message);
        if (data) created = mapNotification(data);
      } else {
        await ctx.supabase.from("notification_deliveries").insert({
          company_id: ctx.tenantId,
          channel,
          target: input.userId ?? "unknown",
          status: "pending",
        });
      }
    }
    if (!created) throw new Error("Nenhum canal habilitado para a notificação");
    await audit(ctx, "notification", created.id, "sent_direct", { channels: [...channels] });
    return created;
  },

  async markRead(ctx: Ctx, id: string): Promise<void> {
    const { error } = await ctx.supabase
      .from("notifications")
      .update({ status: "read", read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("company_id", ctx.tenantId);
    if (error) throw new Error(error.message);
    await audit(ctx, "notification", id, "read", {});
  },

  async markAllRead(ctx: Ctx): Promise<void> {
    await ctx.supabase
      .from("notifications")
      .update({ status: "read", read_at: new Date().toISOString() })
      .eq("company_id", ctx.tenantId)
      .eq("user_id", ctx.userId)
      .neq("status", "read");
    await audit(ctx, "notification", null, "mark_all_read", {});
  },

  async archive(ctx: Ctx, id: string): Promise<void> {
    const { error } = await ctx.supabase
      .from("notifications")
      .update({ status: "archived", archived_at: new Date().toISOString() })
      .eq("id", id)
      .eq("company_id", ctx.tenantId);
    if (error) throw new Error(error.message);
    await audit(ctx, "notification", id, "archived", {});
  },
};

function mapNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    userId: (row.user_id as string | null) ?? null,
    eventId: (row.event_id as string | null) ?? null,
    category: row.category as string,
    priority: row.priority as EventPriority,
    title: row.title as string,
    body: (row.body as string | null) ?? null,
    icon: (row.icon as string | null) ?? null,
    link: (row.link as string | null) ?? null,
    data: (row.data as EventPayload) ?? {},
    status: row.status as Notification["status"],
    readAt: (row.read_at as string | null) ?? null,
    archivedAt: (row.archived_at as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

function mapRule(row: Record<string, unknown>): NotificationRule {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    name: row.name as string,
    eventType: row.event_type as string,
    channels: (row.channels as NotificationChannel[]) ?? [],
    category: row.category as string,
    audience: (row.audience as NotificationRule["audience"]) ?? {},
    templateKey: (row.template_key as string | null) ?? null,
    enabled: row.enabled as boolean,
    priority: row.priority as EventPriority,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export { mapNotification, mapRule };
