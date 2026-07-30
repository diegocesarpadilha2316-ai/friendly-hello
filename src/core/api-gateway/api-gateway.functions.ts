import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";
import { generateApiKey } from "./key-hash.server";
import { buildOpenApi, toYaml } from "./openapi.server";
import type {
  ApiEndpoint,
  ApiGatewaySnapshot,
  ApiKey,
  ApiQuota,
  ApiRateLimit,
  ApiRequestLog,
  ApiWebhookDelivery,
  ApiWebhookEndpoint,
} from "./types";

function mapKey(r: Record<string, unknown>): ApiKey {
  return {
    id: String(r.id),
    name: String(r.name),
    description: (r.description as string) ?? null,
    prefix: String(r.prefix),
    scopes: (r.scopes as string[] | null) ?? [],
    allowedIps: (r.allowed_ips as string[] | null) ?? [],
    status: r.status as ApiKey["status"],
    expiresAt: (r.expires_at as string) ?? null,
    lastUsedAt: (r.last_used_at as string) ?? null,
    createdAt: String(r.created_at),
  };
}

function mapEndpoint(r: Record<string, unknown>): ApiEndpoint {
  return {
    id: String(r.id),
    version: String(r.version ?? "v1"),
    method: String(r.method),
    path: String(r.path),
    module: String(r.module),
    summary: (r.summary as string) ?? null,
    scopes: (r.scopes as string[] | null) ?? [],
    deprecated: Boolean(r.deprecated),
    public: Boolean(r.public),
  };
}

function mapReq(r: Record<string, unknown>): ApiRequestLog {
  return {
    id: String(r.id),
    method: String(r.method),
    path: String(r.path),
    version: String(r.version ?? "v1"),
    status: Number(r.status ?? 0),
    durationMs: Number(r.duration_ms ?? 0),
    ip: (r.ip as string) ?? null,
    userAgent: (r.user_agent as string) ?? null,
    requestId: (r.request_id as string) ?? null,
    correlationId: (r.correlation_id as string) ?? null,
    error: (r.error as string) ?? null,
    apiKeyId: (r.api_key_id as string) ?? null,
    createdAt: String(r.created_at),
  };
}

function mapRl(r: Record<string, unknown>): ApiRateLimit {
  return {
    id: String(r.id),
    scope: r.scope as ApiRateLimit["scope"],
    scopeKey: String(r.scope_key),
    windowSeconds: Number(r.window_seconds ?? 60),
    maxRequests: Number(r.max_requests ?? 60),
  };
}

function mapQ(r: Record<string, unknown>): ApiQuota {
  return {
    id: String(r.id),
    period: r.period as ApiQuota["period"],
    maxRequests: Number(r.max_requests ?? 0),
    used: Number(r.used ?? 0),
    resetsAt: String(r.resets_at),
  };
}

function mapWh(r: Record<string, unknown>): ApiWebhookEndpoint {
  return {
    id: String(r.id),
    name: String(r.name),
    url: String(r.url),
    events: (r.events as string[] | null) ?? [],
    active: Boolean(r.active),
    createdAt: String(r.created_at),
  };
}

function mapDel(r: Record<string, unknown>): ApiWebhookDelivery {
  return {
    id: String(r.id),
    endpointId: String(r.endpoint_id),
    event: String(r.event),
    status: r.status as ApiWebhookDelivery["status"],
    attempts: Number(r.attempts ?? 0),
    statusCode: (r.status_code as number) ?? null,
    error: (r.error as string) ?? null,
    createdAt: String(r.created_at),
    deliveredAt: (r.delivered_at as string) ?? null,
  };
}

export const apiGatewaySnapshot = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<ApiGatewaySnapshot> => {
    const s = context.supabase;
    const t = context.tenantId;
    const [keys, endpoints, requests, rateLimits, quotas, webhooks, deliveries] = await Promise.all([
      s.from("api_keys").select("*").eq("company_id", t).order("created_at", { ascending: false }),
      s.from("api_endpoints").select("*").or(`company_id.is.null,company_id.eq.${t}`).order("version"),
      s
        .from("api_requests")
        .select("*")
        .eq("company_id", t)
        .order("created_at", { ascending: false })
        .limit(200),
      s.from("api_rate_limits").select("*").eq("company_id", t),
      s.from("api_quotas").select("*").eq("company_id", t),
      s.from("api_webhook_endpoints").select("*").eq("company_id", t).order("created_at", { ascending: false }),
      s
        .from("api_webhook_deliveries")
        .select("*")
        .eq("company_id", t)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    return {
      keys: (keys.data ?? []).map(mapKey),
      endpoints: (endpoints.data ?? []).map(mapEndpoint),
      requests: (requests.data ?? []).map(mapReq),
      rateLimits: (rateLimits.data ?? []).map(mapRl),
      quotas: (quotas.data ?? []).map(mapQ),
      webhooks: (webhooks.data ?? []).map(mapWh),
      deliveries: (deliveries.data ?? []).map(mapDel),
    };
  });

const createKeySchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  scopes: z.array(z.string()).default([]),
  allowedIps: z.array(z.string()).default([]),
  expiresAt: z.string().optional(),
});

export const apiKeyCreate = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => createKeySchema.parse(raw))
  .handler(
    async ({ context, data }): Promise<{ key: ApiKey; secret: string }> => {
      const { prefix, keyHash, full } = generateApiKey();
      const { data: row, error } = await context.supabase
        .from("api_keys")
        .insert({
          company_id: context.tenantId,
          name: data.name,
          description: data.description ?? null,
          prefix,
          key_hash: keyHash,
          scopes: data.scopes,
          allowed_ips: data.allowedIps,
          expires_at: data.expiresAt ?? null,
          created_by: context.userId,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return { key: mapKey(row), secret: full };
    },
  );

const idSchema = z.object({ id: z.string().uuid() });

export const apiKeyRevoke = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => idSchema.parse(raw))
  .handler(async ({ context, data }) => {
    await context.supabase
      .from("api_keys")
      .update({ status: "revoked", updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("company_id", context.tenantId);
    return { ok: true as const };
  });

export const apiKeyRotate = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => idSchema.parse(raw))
  .handler(async ({ context, data }): Promise<{ secret: string; prefix: string }> => {
    const { prefix, keyHash, full } = generateApiKey();
    const { error } = await context.supabase
      .from("api_keys")
      .update({
        prefix,
        key_hash: keyHash,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("company_id", context.tenantId);
    if (error) throw new Error(error.message);
    return { secret: full, prefix };
  });

const rateLimitSchema = z.object({
  scope: z.enum(["company", "user", "api_key", "endpoint"]),
  scopeKey: z.string().min(1),
  windowSeconds: z.number().int().min(1).max(86_400).default(60),
  maxRequests: z.number().int().min(1).max(1_000_000).default(60),
});

export const apiRateLimitUpsert = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => rateLimitSchema.parse(raw))
  .handler(async ({ context, data }): Promise<ApiRateLimit> => {
    const { data: row, error } = await context.supabase
      .from("api_rate_limits")
      .upsert(
        {
          company_id: context.tenantId,
          scope: data.scope,
          scope_key: data.scopeKey,
          window_seconds: data.windowSeconds,
          max_requests: data.maxRequests,
        },
        { onConflict: "company_id,scope,scope_key" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapRl(row);
  });

const quotaSchema = z.object({
  period: z.enum(["minute", "hour", "day", "month"]),
  maxRequests: z.number().int().min(1),
});

export const apiQuotaUpsert = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => quotaSchema.parse(raw))
  .handler(async ({ context, data }): Promise<ApiQuota> => {
    const ms =
      data.period === "minute"
        ? 60_000
        : data.period === "hour"
          ? 3_600_000
          : data.period === "day"
            ? 86_400_000
            : 30 * 86_400_000;
    const { data: row, error } = await context.supabase
      .from("api_quotas")
      .upsert(
        {
          company_id: context.tenantId,
          period: data.period,
          max_requests: data.maxRequests,
          resets_at: new Date(Date.now() + ms).toISOString(),
        },
        { onConflict: "company_id,period" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapQ(row);
  });

const endpointSchema = z.object({
  version: z.string().default("v1"),
  method: z.string().min(1),
  path: z.string().min(1),
  module: z.string().min(1),
  summary: z.string().optional(),
  scopes: z.array(z.string()).default([]),
  public: z.boolean().default(false),
  deprecated: z.boolean().default(false),
});

export const apiEndpointRegister = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => endpointSchema.parse(raw))
  .handler(async ({ context, data }): Promise<ApiEndpoint> => {
    const { data: row, error } = await context.supabase
      .from("api_endpoints")
      .upsert(
        {
          company_id: context.tenantId,
          version: data.version,
          method: data.method.toUpperCase(),
          path: data.path,
          module: data.module,
          summary: data.summary ?? null,
          scopes: data.scopes,
          public: data.public,
          deprecated: data.deprecated,
        },
        { onConflict: "version,method,path" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapEndpoint(row);
  });

const webhookSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});

export const apiWebhookUpsert = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) =>
    webhookSchema.extend({ id: z.string().uuid().optional() }).parse(raw),
  )
  .handler(async ({ context, data }): Promise<ApiWebhookEndpoint> => {
    const { generateApiKey: g } = await import("./key-hash.server");
    const secret = data.id ? undefined : g().secret;
    const payload = {
      company_id: context.tenantId,
      name: data.name,
      url: data.url,
      events: data.events,
      active: data.active,
      updated_at: new Date().toISOString(),
      ...(secret ? { secret } : {}),
    };
    const q = data.id
      ? context.supabase
          .from("api_webhook_endpoints")
          .update(payload)
          .eq("id", data.id)
          .eq("company_id", context.tenantId)
          .select("*")
          .single()
      : context.supabase.from("api_webhook_endpoints").insert(payload).select("*").single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    return mapWh(row);
  });

export const apiWebhookDelete = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => idSchema.parse(raw))
  .handler(async ({ context, data }) => {
    await context.supabase
      .from("api_webhook_endpoints")
      .delete()
      .eq("id", data.id)
      .eq("company_id", context.tenantId);
    return { ok: true as const };
  });

export const apiOpenApiExport = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) =>
    z.object({ format: z.enum(["json", "yaml"]).default("json") }).parse(raw),
  )
  .handler(async ({ context, data }): Promise<{ format: string; content: string }> => {
    const { data: rows } = await context.supabase
      .from("api_endpoints")
      .select("*")
      .or(`company_id.is.null,company_id.eq.${context.tenantId}`);
    const endpoints = (rows ?? []).map(mapEndpoint);
    const spec = buildOpenApi(endpoints);
    if (data.format === "yaml") return { format: "yaml", content: toYaml(spec).trimStart() };
    return { format: "json", content: JSON.stringify(spec, null, 2) };
  });