import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";
import {
  cacheDelete,
  cacheInvalidateNamespace,
  cacheInvalidateTag,
  cacheInvalidateTenant,
  cachePurgeExpired,
  cacheSet,
} from "./manager.server";
import type {
  CacheEntry,
  CacheHealth,
  CacheInvalidation,
  CacheMetricPoint,
  CacheNamespace,
  CacheSnapshot,
  CacheStrategy,
  CacheWarmupJob,
} from "./types";

function mapEntry(r: Record<string, unknown>): CacheEntry {
  return {
    id: String(r.id),
    namespace: String(r.namespace),
    key: String(r.key),
    value: r.value,
    tags: (r.tags as string[] | null) ?? [],
    version: Number(r.version ?? 1),
    ttlSeconds: (r.ttl_seconds as number | null) ?? null,
    expiresAt: (r.expires_at as string | null) ?? null,
    sizeBytes: Number(r.size_bytes ?? 0),
    hitCount: Number(r.hit_count ?? 0),
    lastHitAt: (r.last_hit_at as string | null) ?? null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

function mapNs(r: Record<string, unknown>): CacheNamespace {
  return {
    id: String(r.id),
    name: String(r.name),
    strategy: r.strategy as CacheStrategy,
    defaultTtlSeconds: Number(r.default_ttl_seconds ?? 300),
    maxEntries: Number(r.max_entries ?? 10000),
    description: (r.description as string | null) ?? null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

function mapMetric(r: Record<string, unknown>): CacheMetricPoint {
  return {
    id: String(r.id),
    namespace: String(r.namespace),
    bucketAt: String(r.bucket_at),
    hits: Number(r.hits ?? 0),
    misses: Number(r.misses ?? 0),
    writes: Number(r.writes ?? 0),
    invalidations: Number(r.invalidations ?? 0),
    bytesWritten: Number(r.bytes_written ?? 0),
  };
}

function mapInv(r: Record<string, unknown>): CacheInvalidation {
  return {
    id: String(r.id),
    scope: r.scope as CacheInvalidation["scope"],
    target: String(r.target),
    reason: (r.reason as string | null) ?? null,
    affected: Number(r.affected ?? 0),
    createdAt: String(r.created_at),
  };
}

function mapWarm(r: Record<string, unknown>): CacheWarmupJob {
  return {
    id: String(r.id),
    namespace: String(r.namespace),
    status: r.status as CacheWarmupJob["status"],
    entries: Number(r.entries ?? 0),
    durationMs: (r.duration_ms as number | null) ?? null,
    error: (r.error as string | null) ?? null,
    createdAt: String(r.created_at),
    completedAt: (r.completed_at as string | null) ?? null,
  };
}

export const cacheSnapshot = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<CacheSnapshot> => {
    const s = context.supabase;
    const t = context.tenantId;
    const started = Date.now();
    const [entries, namespaces, metrics, invs, warmups] = await Promise.all([
      s
        .from("cache_entries")
        .select("*")
        .eq("company_id", t)
        .order("updated_at", { ascending: false })
        .limit(200),
      s.from("cache_namespaces").select("*").eq("company_id", t).order("name"),
      s
        .from("cache_metrics")
        .select("*")
        .eq("company_id", t)
        .order("bucket_at", { ascending: false })
        .limit(200),
      s
        .from("cache_invalidations")
        .select("*")
        .eq("company_id", t)
        .order("created_at", { ascending: false })
        .limit(100),
      s
        .from("cache_warmup_jobs")
        .select("*")
        .eq("company_id", t)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    const entryList = (entries.data ?? []).map(mapEntry);
    const metricList = (metrics.data ?? []).map(mapMetric);
    const totalHits = metricList.reduce((a, m) => a + m.hits, 0);
    const totalMisses = metricList.reduce((a, m) => a + m.misses, 0);
    const hitRate =
      totalHits + totalMisses === 0
        ? 100
        : Math.round((totalHits / (totalHits + totalMisses)) * 100);
    const totalBytes = entryList.reduce((a, e) => a + e.sizeBytes, 0);
    const now = Date.now();
    const expired = entryList.filter(
      (e) => e.expiresAt && new Date(e.expiresAt).getTime() <= now,
    ).length;
    const nsList = (namespaces.data ?? []).map(mapNs);
    const health: CacheHealth = {
      totalEntries: entryList.length,
      totalBytes,
      expired,
      namespaces: nsList.length,
      hitRate,
      latencyMs: Date.now() - started,
    };
    return {
      entries: entryList,
      namespaces: nsList,
      metrics: metricList,
      invalidations: (invs.data ?? []).map(mapInv),
      warmups: (warmups.data ?? []).map(mapWarm),
      health,
    };
  });

const namespaceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9_.:-]+$/i, "namespace inválido"),
  strategy: z
    .enum(["cache_aside", "read_through", "write_through", "write_behind", "swr"])
    .default("cache_aside"),
  defaultTtlSeconds: z
    .number()
    .int()
    .min(1)
    .max(30 * 86_400)
    .default(300),
  maxEntries: z.number().int().min(1).max(1_000_000).default(10_000),
  description: z.string().max(500).optional(),
});

export const cacheNamespaceUpsert = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => namespaceSchema.parse(raw))
  .handler(async ({ context, data }): Promise<CacheNamespace> => {
    const payload = {
      company_id: context.tenantId,
      name: data.name,
      strategy: data.strategy,
      default_ttl_seconds: data.defaultTtlSeconds,
      max_entries: data.maxEntries,
      description: data.description ?? null,
      updated_at: new Date().toISOString(),
    };
    const q = data.id
      ? context.supabase
          .from("cache_namespaces")
          .update(payload)
          .eq("id", data.id)
          .eq("company_id", context.tenantId)
          .select("*")
          .single()
      : context.supabase
          .from("cache_namespaces")
          .upsert(payload, { onConflict: "company_id,name" })
          .select("*")
          .single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    return mapNs(row);
  });

const idSchema = z.object({ id: z.string().uuid() });

export const cacheNamespaceDelete = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => idSchema.parse(raw))
  .handler(async ({ context, data }) => {
    await context.supabase
      .from("cache_namespaces")
      .delete()
      .eq("id", data.id)
      .eq("company_id", context.tenantId);
    return { ok: true as const };
  });

const setSchema = z.object({
  namespace: z.string().min(1),
  key: z.string().min(1).max(300),
  value: z.unknown(),
  ttlSeconds: z
    .number()
    .int()
    .min(0)
    .max(30 * 86_400)
    .nullish(),
  tags: z.array(z.string()).default([]),
});

export const cacheEntrySet = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => setSchema.parse(raw))
  .handler(async ({ context, data }) => {
    await cacheSet({
      supabase: context.supabase,
      tenantId: context.tenantId,
      namespace: data.namespace,
      key: data.key,
      value: data.value ?? null,
      ttlSeconds: data.ttlSeconds ?? null,
      tags: data.tags,
    });
    return { ok: true as const };
  });

const nsKeySchema = z.object({
  namespace: z.string().min(1),
  key: z.string().min(1),
});

export const cacheEntryDelete = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => nsKeySchema.parse(raw))
  .handler(async ({ context, data }) => {
    await cacheDelete({
      supabase: context.supabase,
      tenantId: context.tenantId,
      namespace: data.namespace,
      key: data.key,
    });
    return { ok: true as const };
  });

const invalidateSchema = z.object({
  scope: z.enum(["namespace", "tag", "tenant", "expired"]),
  target: z.string().default(""),
  reason: z.string().max(300).optional(),
});

export const cacheInvalidate = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => invalidateSchema.parse(raw))
  .handler(async ({ context, data }): Promise<{ affected: number }> => {
    if (data.scope === "namespace") {
      const n = await cacheInvalidateNamespace(
        context.supabase,
        context.tenantId,
        data.target,
        data.reason,
      );
      return { affected: n };
    }
    if (data.scope === "tag") {
      const n = await cacheInvalidateTag(
        context.supabase,
        context.tenantId,
        data.target,
        data.reason,
      );
      return { affected: n };
    }
    if (data.scope === "tenant") {
      const n = await cacheInvalidateTenant(context.supabase, context.tenantId, data.reason);
      return { affected: n };
    }
    const n = await cachePurgeExpired(context.supabase, context.tenantId);
    return { affected: n };
  });

const warmupSchema = z.object({
  namespace: z.string().min(1),
  entries: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.unknown(),
        ttlSeconds: z.number().int().min(0).nullish(),
        tags: z.array(z.string()).default([]),
      }),
    )
    .min(1)
    .max(500),
});

export const cacheWarmup = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => warmupSchema.parse(raw))
  .handler(async ({ context, data }): Promise<CacheWarmupJob> => {
    const started = Date.now();
    const { data: job, error: jobErr } = await context.supabase
      .from("cache_warmup_jobs")
      .insert({
        company_id: context.tenantId,
        namespace: data.namespace,
        status: "running",
        entries: data.entries.length,
      })
      .select("*")
      .single();
    if (jobErr) throw new Error(jobErr.message);
    const jobId = (job as { id: string }).id;
    try {
      for (const e of data.entries) {
        await cacheSet({
          supabase: context.supabase,
          tenantId: context.tenantId,
          namespace: data.namespace,
          key: e.key,
          value: e.value ?? null,
          ttlSeconds: e.ttlSeconds ?? null,
          tags: e.tags,
        });
      }
      const { data: done } = await context.supabase
        .from("cache_warmup_jobs")
        .update({
          status: "completed",
          duration_ms: Date.now() - started,
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId)
        .select("*")
        .single();
      return mapWarm(done!);
    } catch (err) {
      const { data: fail } = await context.supabase
        .from("cache_warmup_jobs")
        .update({
          status: "failed",
          duration_ms: Date.now() - started,
          error: err instanceof Error ? err.message : String(err),
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId)
        .select("*")
        .single();
      return mapWarm(fail!);
    }
  });
