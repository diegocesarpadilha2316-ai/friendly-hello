// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonValue = any;

export type CacheStrategy =
  | "cache_aside"
  | "read_through"
  | "write_through"
  | "write_behind"
  | "swr";

export interface CacheEntry {
  id: string;
  namespace: string;
  key: string;
  value: JsonValue;
  tags: string[];
  version: number;
  ttlSeconds: number | null;
  expiresAt: string | null;
  sizeBytes: number;
  hitCount: number;
  lastHitAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CacheNamespace {
  id: string;
  name: string;
  strategy: CacheStrategy;
  defaultTtlSeconds: number;
  maxEntries: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CacheMetricPoint {
  id: string;
  namespace: string;
  bucketAt: string;
  hits: number;
  misses: number;
  writes: number;
  invalidations: number;
  bytesWritten: number;
}

export interface CacheInvalidation {
  id: string;
  scope: "key" | "namespace" | "tag" | "tenant" | "all";
  target: string;
  reason: string | null;
  affected: number;
  createdAt: string;
}

export interface CacheWarmupJob {
  id: string;
  namespace: string;
  status: "pending" | "running" | "completed" | "failed";
  entries: number;
  durationMs: number | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface CacheHealth {
  totalEntries: number;
  totalBytes: number;
  expired: number;
  namespaces: number;
  hitRate: number;
  latencyMs: number;
}

export interface CacheSnapshot {
  entries: readonly CacheEntry[];
  namespaces: readonly CacheNamespace[];
  metrics: readonly CacheMetricPoint[];
  invalidations: readonly CacheInvalidation[];
  warmups: readonly CacheWarmupJob[];
  health: CacheHealth;
}