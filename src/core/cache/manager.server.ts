import type { SupabaseClient } from "@supabase/supabase-js";
import type { JsonValue } from "./types";
import {
  memDelete,
  memGet,
  memInvalidateNamespace,
  memInvalidateTag,
  memInvalidateTenant,
  memSet,
} from "./memory.server";

function byteLength(value: JsonValue): number {
  try {
    return new TextEncoder().encode(JSON.stringify(value ?? null)).length;
  } catch {
    return 0;
  }
}

async function bumpMetrics(
  supabase: SupabaseClient,
  tenantId: string,
  namespace: string,
  patch: {
    hits?: number;
    misses?: number;
    writes?: number;
    invalidations?: number;
    bytesWritten?: number;
  },
): Promise<void> {
  const bucket = new Date();
  bucket.setSeconds(0, 0);
  const bucketAt = bucket.toISOString();
  const { data: existing } = await supabase
    .from("cache_metrics")
    .select("id, hits, misses, writes, invalidations, bytes_written")
    .eq("company_id", tenantId)
    .eq("namespace", namespace)
    .eq("bucket_at", bucketAt)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("cache_metrics")
      .update({
        hits: (existing.hits as number) + (patch.hits ?? 0),
        misses: (existing.misses as number) + (patch.misses ?? 0),
        writes: (existing.writes as number) + (patch.writes ?? 0),
        invalidations: (existing.invalidations as number) + (patch.invalidations ?? 0),
        bytes_written: (existing.bytes_written as number) + (patch.bytesWritten ?? 0),
      })
      .eq("id", existing.id as string);
  } else {
    await supabase.from("cache_metrics").insert({
      company_id: tenantId,
      namespace,
      bucket_at: bucketAt,
      hits: patch.hits ?? 0,
      misses: patch.misses ?? 0,
      writes: patch.writes ?? 0,
      invalidations: patch.invalidations ?? 0,
      bytes_written: patch.bytesWritten ?? 0,
    });
  }
}

export interface CacheGetOptions {
  supabase: SupabaseClient;
  tenantId: string;
  namespace: string;
  key: string;
}

export interface CacheSetOptions extends CacheGetOptions {
  value: JsonValue;
  ttlSeconds?: number | null;
  tags?: readonly string[];
  version?: number;
}

const inflight = new Map<string, Promise<JsonValue | null>>();

export async function cacheGet<T = JsonValue>(opts: CacheGetOptions): Promise<T | null> {
  const { supabase, tenantId, namespace, key } = opts;
  const mem = memGet(tenantId, namespace, key);
  if (mem) {
    void bumpMetrics(supabase, tenantId, namespace, { hits: 1 });
    return mem.value as T;
  }
  const dedupeKey = `${tenantId}::${namespace}::${key}`;
  const existing = inflight.get(dedupeKey);
  if (existing) return (await existing) as T | null;
  const p = (async () => {
    const { data } = await supabase
      .from("cache_entries")
      .select("value, expires_at, version, tags")
      .eq("company_id", tenantId)
      .eq("namespace", namespace)
      .eq("key", key)
      .maybeSingle();
    if (!data) {
      await bumpMetrics(supabase, tenantId, namespace, { misses: 1 });
      return null;
    }
    const expiresAt = (data.expires_at as string | null) ?? null;
    if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
      await bumpMetrics(supabase, tenantId, namespace, { misses: 1 });
      return null;
    }
    const value = data.value as JsonValue;
    memSet(tenantId, namespace, key, {
      value,
      expiresAt: expiresAt ? new Date(expiresAt).getTime() : null,
      version: (data.version as number) ?? 1,
      tags: (data.tags as string[]) ?? [],
      sizeBytes: byteLength(value),
    });
    await bumpMetrics(supabase, tenantId, namespace, { hits: 1 });
    return value;
  })();
  inflight.set(dedupeKey, p);
  try {
    return (await p) as T | null;
  } finally {
    inflight.delete(dedupeKey);
  }
}

export async function cacheSet(opts: CacheSetOptions): Promise<void> {
  const { supabase, tenantId, namespace, key, value, ttlSeconds, tags, version } = opts;
  const size = byteLength(value);
  const expiresAt =
    ttlSeconds && ttlSeconds > 0 ? new Date(Date.now() + ttlSeconds * 1000).toISOString() : null;
  const tagsArr = tags ? [...tags] : [];
  await supabase.from("cache_entries").upsert(
    {
      company_id: tenantId,
      namespace,
      key,
      value: value ?? null,
      tags: tagsArr,
      version: version ?? 1,
      ttl_seconds: ttlSeconds ?? null,
      expires_at: expiresAt,
      size_bytes: size,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id,namespace,key" },
  );
  memSet(tenantId, namespace, key, {
    value,
    expiresAt: expiresAt ? new Date(expiresAt).getTime() : null,
    version: version ?? 1,
    tags: tagsArr,
    sizeBytes: size,
  });
  await bumpMetrics(supabase, tenantId, namespace, { writes: 1, bytesWritten: size });
}

export async function cacheDelete(opts: CacheGetOptions): Promise<void> {
  const { supabase, tenantId, namespace, key } = opts;
  await supabase
    .from("cache_entries")
    .delete()
    .eq("company_id", tenantId)
    .eq("namespace", namespace)
    .eq("key", key);
  memDelete(tenantId, namespace, key);
  await supabase.from("cache_invalidations").insert({
    company_id: tenantId,
    scope: "key",
    target: `${namespace}:${key}`,
    affected: 1,
  });
  await bumpMetrics(supabase, tenantId, namespace, { invalidations: 1 });
}

export async function cacheInvalidateNamespace(
  supabase: SupabaseClient,
  tenantId: string,
  namespace: string,
  reason?: string,
): Promise<number> {
  const { count } = await supabase
    .from("cache_entries")
    .delete({ count: "exact" })
    .eq("company_id", tenantId)
    .eq("namespace", namespace);
  const affected = count ?? 0;
  memInvalidateNamespace(tenantId, namespace);
  await supabase.from("cache_invalidations").insert({
    company_id: tenantId,
    scope: "namespace",
    target: namespace,
    reason: reason ?? null,
    affected,
  });
  await bumpMetrics(supabase, tenantId, namespace, { invalidations: affected });
  return affected;
}

export async function cacheInvalidateTag(
  supabase: SupabaseClient,
  tenantId: string,
  tag: string,
  reason?: string,
): Promise<number> {
  const { count } = await supabase
    .from("cache_entries")
    .delete({ count: "exact" })
    .eq("company_id", tenantId)
    .contains("tags", [tag]);
  const affected = count ?? 0;
  memInvalidateTag(tenantId, tag);
  await supabase.from("cache_invalidations").insert({
    company_id: tenantId,
    scope: "tag",
    target: tag,
    reason: reason ?? null,
    affected,
  });
  return affected;
}

export async function cacheInvalidateTenant(
  supabase: SupabaseClient,
  tenantId: string,
  reason?: string,
): Promise<number> {
  const { count } = await supabase
    .from("cache_entries")
    .delete({ count: "exact" })
    .eq("company_id", tenantId);
  const affected = count ?? 0;
  memInvalidateTenant(tenantId);
  await supabase.from("cache_invalidations").insert({
    company_id: tenantId,
    scope: "tenant",
    target: tenantId,
    reason: reason ?? null,
    affected,
  });
  return affected;
}

export async function cacheSwr<T extends JsonValue>(
  opts: CacheGetOptions & {
    loader: () => Promise<T>;
    ttlSeconds: number;
    tags?: readonly string[];
  },
): Promise<T> {
  const cached = await cacheGet<T>(opts);
  if (cached !== null) {
    void (async () => {
      try {
        const fresh = await opts.loader();
        await cacheSet({
          ...opts,
          value: fresh,
          ttlSeconds: opts.ttlSeconds,
          tags: opts.tags,
        });
      } catch {
        // preserve cached value on refresh failure
      }
    })();
    return cached;
  }
  const fresh = await opts.loader();
  await cacheSet({ ...opts, value: fresh, ttlSeconds: opts.ttlSeconds, tags: opts.tags });
  return fresh;
}

export async function cacheReadThrough<T extends JsonValue>(
  opts: CacheGetOptions & {
    loader: () => Promise<T>;
    ttlSeconds: number;
    tags?: readonly string[];
  },
): Promise<T> {
  const cached = await cacheGet<T>(opts);
  if (cached !== null) return cached;
  const fresh = await opts.loader();
  await cacheSet({ ...opts, value: fresh, ttlSeconds: opts.ttlSeconds, tags: opts.tags });
  return fresh;
}

export async function cachePurgeExpired(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<number> {
  const { count } = await supabase
    .from("cache_entries")
    .delete({ count: "exact" })
    .eq("company_id", tenantId)
    .lt("expires_at", new Date().toISOString());
  return count ?? 0;
}
