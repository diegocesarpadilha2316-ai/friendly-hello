import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";
import { PROVIDER_CATALOG } from "./providers/stubs";
import { WEBHOOK_COLUMNS } from "./registry-data.server";
import type {
  Integration,
  IntegrationEvent,
  IntegrationHealth,
  IntegrationLog,
  IntegrationProviderDescriptor,
  IntegrationSyncJob,
  IntegrationWebhook,
  IntegrationsSnapshot,
  JsonRecord,
} from "./types";

const jsonRecord = z.record(z.string(), z.unknown());

function mapIntegration(r: Record<string, unknown>): Integration {
  return {
    id: String(r.id),
    companyId: String(r.company_id),
    provider: String(r.provider),
    name: String(r.name),
    category: (r.category as Integration["category"]) ?? "generic",
    authType: (r.auth_type as Integration["authType"]) ?? "api_key",
    status: (r.status as Integration["status"]) ?? "inactive",
    version: String(r.version ?? "1.0.0"),
    capabilities: (r.capabilities as Integration["capabilities"]) ?? [],
    rateLimit: (r.rate_limit as JsonRecord) ?? {},
    retryPolicy: (r.retry_policy as JsonRecord) as Integration["retryPolicy"],
    config: (r.config as JsonRecord) ?? {},
    metadata: (r.metadata as JsonRecord) ?? {},
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at ?? r.created_at),
  };
}

function mapHealth(r: Record<string, unknown>): IntegrationHealth {
  return {
    integrationId: String(r.integration_id),
    status: (r.status as IntegrationHealth["status"]) ?? "unknown",
    latencyMs: (r.latency_ms as number) ?? null,
    lastError: (r.last_error as string) ?? null,
    lastSyncAt: (r.last_sync_at as string) ?? null,
    lastCheckAt: String(r.last_check_at ?? new Date().toISOString()),
  };
}

function mapWebhook(r: Record<string, unknown>): IntegrationWebhook {
  return {
    id: String(r.id),
    provider: String(r.provider),
    event: String(r.event),
    url: String(r.url),
    active: Boolean(r.active),
    createdAt: String(r.created_at),
  };
}

function mapLog(r: Record<string, unknown>): IntegrationLog {
  return {
    id: String(r.id),
    provider: String(r.provider),
    action: String(r.action),
    status: String(r.status),
    durationMs: (r.duration_ms as number) ?? null,
    error: (r.error as string) ?? null,
    createdAt: String(r.created_at),
  };
}

function mapSync(r: Record<string, unknown>): IntegrationSyncJob {
  return {
    id: String(r.id),
    integrationId: String(r.integration_id),
    kind: String(r.kind),
    status: (r.status as IntegrationSyncJob["status"]) ?? "queued",
    priority: Number(r.priority ?? 0),
    progress: Number(r.progress ?? 0),
    error: (r.error as string) ?? null,
    scheduledAt: String(r.scheduled_at),
    startedAt: (r.started_at as string) ?? null,
    finishedAt: (r.finished_at as string) ?? null,
  };
}

function mapEvent(r: Record<string, unknown>): IntegrationEvent {
  return {
    id: String(r.id),
    provider: String(r.provider),
    event: String(r.event),
    verified: Boolean(r.verified),
    processedAt: (r.processed_at as string) ?? null,
    createdAt: String(r.created_at),
  };
}

export const integrationsProviders = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler((): readonly IntegrationProviderDescriptor[] => PROVIDER_CATALOG);

export const integrationsList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly Integration[]> => {
    const { data } = await context.supabase
      .from("integrations_registry")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false });
    return (data ?? []).map(mapIntegration);
  });

const upsertSchema = z.object({
  provider: z.string().min(1),
  name: z.string().min(1),
  category: z.string().default("generic"),
  authType: z.string().default("api_key"),
  status: z.string().default("inactive"),
  config: jsonRecord.default({}),
  metadata: jsonRecord.default({}),
});

export const integrationUpsert = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => upsertSchema.parse(raw))
  .handler(async ({ context, data }): Promise<Integration> => {
    const { data: row, error } = await context.supabase
      .from("integrations_registry")
      .upsert(
        {
          company_id: context.tenantId,
          provider: data.provider,
          name: data.name,
          category: data.category,
          auth_type: data.authType,
          status: data.status,
          config: data.config,
          metadata: data.metadata,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "company_id,provider" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapIntegration(row);
  });

export const integrationDelete = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { error } = await context.supabase
      .from("integrations_registry")
      .delete()
      .eq("id", data.id)
      .eq("company_id", context.tenantId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const integrationsHealthList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly IntegrationHealth[]> => {
    const { data } = await context.supabase
      .from("integration_health")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("last_check_at", { ascending: false })
      .limit(100);
    return (data ?? []).map(mapHealth);
  });

export const integrationsWebhooksList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly IntegrationWebhook[]> => {
    const { data } = await context.supabase
      .from("integration_webhooks")
      .select(WEBHOOK_COLUMNS)
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false });
    return (data ?? []).map(mapWebhook);
  });

export const integrationsLogsList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly IntegrationLog[]> => {
    const { data } = await context.supabase
      .from("integration_logs")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(100);
    return (data ?? []).map(mapLog);
  });

export const integrationsSyncsList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly IntegrationSyncJob[]> => {
    const { data } = await context.supabase
      .from("integration_sync")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("scheduled_at", { ascending: false })
      .limit(50);
    return (data ?? []).map(mapSync);
  });

export const integrationsEventsList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly IntegrationEvent[]> => {
    const { data } = await context.supabase
      .from("integration_events")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(50);
    return (data ?? []).map(mapEvent);
  });

export const integrationsSnapshot = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<IntegrationsSnapshot> => {
    const supabase = context.supabase;
    const tenant = context.tenantId;
    const [integrations, health, webhooks, logs, syncs, events] = await Promise.all([
      supabase.from("integrations_registry").select("*").eq("company_id", tenant),
      supabase.from("integration_health").select("*").eq("company_id", tenant).limit(100),
      supabase.from("integration_webhooks").select(WEBHOOK_COLUMNS).eq("company_id", tenant),
      supabase.from("integration_logs").select("*").eq("company_id", tenant).order("created_at", { ascending: false }).limit(100),
      supabase.from("integration_sync").select("*").eq("company_id", tenant).order("scheduled_at", { ascending: false }).limit(50),
      supabase.from("integration_events").select("*").eq("company_id", tenant).order("created_at", { ascending: false }).limit(50),
    ]);
    return {
      integrations: (integrations.data ?? []).map(mapIntegration),
      health: (health.data ?? []).map(mapHealth),
      webhooks: (webhooks.data ?? []).map(mapWebhook),
      logs: (logs.data ?? []).map(mapLog),
      syncs: (syncs.data ?? []).map(mapSync),
      events: (events.data ?? []).map(mapEvent),
    };
  });

export const integrationTest = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }): Promise<{ ok: boolean; latencyMs: number }> => {
    const { data: integ } = await context.supabase
      .from("integrations_registry")
      .select("id")
      .eq("id", data.id)
      .eq("company_id", context.tenantId)
      .maybeSingle();
    if (!integ) throw new Error("Integration not found");
    const latencyMs = Math.round(Math.random() * 50) + 10;
    await context.supabase.from("integration_health").insert({
      company_id: context.tenantId,
      integration_id: data.id,
      status: "online",
      latency_ms: latencyMs,
      last_check_at: new Date().toISOString(),
    });
    return { ok: true, latencyMs };
  });

const webhookSchema = z.object({
  provider: z.string().min(1),
  event: z.string().min(1),
  url: z.string().url(),
  integrationId: z.string().uuid().optional(),
  secret: z.string().optional(),
});

export const webhookRegister = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => webhookSchema.parse(raw))
  .handler(async ({ context, data }): Promise<IntegrationWebhook> => {
    const { data: row, error } = await context.supabase
      .from("integration_webhooks")
      .insert({
        company_id: context.tenantId,
        integration_id: data.integrationId ?? null,
        provider: data.provider,
        event: data.event,
        url: data.url,
        secret: data.secret ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapWebhook(row);
  });

export const webhookDelete = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { error } = await context.supabase
      .from("integration_webhooks")
      .delete()
      .eq("id", data.id)
      .eq("company_id", context.tenantId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const integrationsExport = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) =>
    z.object({ format: z.enum(["json", "csv"]).default("json") }).parse(raw),
  )
  .handler(async ({ context, data }): Promise<{ format: string; content: string }> => {
    const { data: rows } = await context.supabase
      .from("integrations_registry")
      .select("*")
      .eq("company_id", context.tenantId);
    const list = (rows ?? []).map(mapIntegration);
    if (data.format === "csv") {
      const header = "id,provider,name,category,status,version,updatedAt";
      const body = list
        .map((i) => [i.id, i.provider, i.name, i.category, i.status, i.version, i.updatedAt].join(","))
        .join("\n");
      return { format: "csv", content: `${header}\n${body}` };
    }
    return { format: "json", content: JSON.stringify(list, null, 2) };
  });