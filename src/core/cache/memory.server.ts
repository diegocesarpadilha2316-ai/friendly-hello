import type { JsonValue } from "./types";

interface MemEntry {
  value: JsonValue;
  expiresAt: number | null;
  version: number;
  tags: readonly string[];
  sizeBytes: number;
}

const MAX_ENTRIES = 5_000;
const store = new Map<string, MemEntry>();

function scopedKey(tenantId: string, namespace: string, key: string): string {
  return `${tenantId}::${namespace}::${key}`;
}

export function memGet(tenantId: string, namespace: string, key: string): MemEntry | null {
  const k = scopedKey(tenantId, namespace, key);
  const entry = store.get(k);
  if (!entry) return null;
  if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
    store.delete(k);
    return null;
  }
  return entry;
}

export function memSet(tenantId: string, namespace: string, key: string, entry: MemEntry): void {
  if (store.size >= MAX_ENTRIES) {
    const first = store.keys().next().value;
    if (first) store.delete(first);
  }
  store.set(scopedKey(tenantId, namespace, key), entry);
}

export function memDelete(tenantId: string, namespace: string, key: string): void {
  store.delete(scopedKey(tenantId, namespace, key));
}

export function memInvalidateNamespace(tenantId: string, namespace: string): number {
  let count = 0;
  const prefix = `${tenantId}::${namespace}::`;
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) {
      store.delete(k);
      count++;
    }
  }
  return count;
}

export function memInvalidateTag(tenantId: string, tag: string): number {
  let count = 0;
  const prefix = `${tenantId}::`;
  for (const [k, v] of store.entries()) {
    if (k.startsWith(prefix) && v.tags.includes(tag)) {
      store.delete(k);
      count++;
    }
  }
  return count;
}

export function memInvalidateTenant(tenantId: string): number {
  let count = 0;
  const prefix = `${tenantId}::`;
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) {
      store.delete(k);
      count++;
    }
  }
  return count;
}

export function memStats(): { size: number } {
  return { size: store.size };
}