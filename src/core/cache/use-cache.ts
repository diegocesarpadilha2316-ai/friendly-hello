import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  cacheEntryDelete,
  cacheEntrySet,
  cacheInvalidate,
  cacheNamespaceDelete,
  cacheNamespaceUpsert,
  cacheWarmup,
} from "./cache.functions";
import { cacheKeys, cacheSnapshotQuery } from "./queries";
import type { CacheStrategy } from "./types";

export type NamespaceInput = {
  id?: string;
  name: string;
  strategy?: CacheStrategy;
  defaultTtlSeconds?: number;
  maxEntries?: number;
  description?: string;
};

export type EntrySetInput = {
  namespace: string;
  key: string;
  value: unknown;
  ttlSeconds?: number | null;
  tags?: string[];
};

export type InvalidateInput = {
  scope: "namespace" | "tag" | "tenant" | "expired";
  target?: string;
  reason?: string;
};

export type WarmupInput = {
  namespace: string;
  entries: {
    key: string;
    value: unknown;
    ttlSeconds?: number | null;
    tags?: string[];
  }[];
};

export function useCacheSnapshot() {
  return useSuspenseQuery(cacheSnapshotQuery());
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: cacheKeys.all });
}

export function useUpsertNamespace() {
  const fn = useServerFn(cacheNamespaceUpsert);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: NamespaceInput) => fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteNamespace() {
  const fn = useServerFn(cacheNamespaceDelete);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => invalidate(),
  });
}

export function useSetEntry() {
  const fn = useServerFn(cacheEntrySet);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: EntrySetInput) => fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteEntry() {
  const fn = useServerFn(cacheEntryDelete);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: { namespace: string; key: string }) => fn({ data }),
    onSuccess: () => invalidate(),
  });
}

export function useInvalidateCache() {
  const fn = useServerFn(cacheInvalidate);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: InvalidateInput) => fn({ data: { target: "", ...data } } as never),
    onSuccess: () => invalidate(),
  });
}

export function useWarmupCache() {
  const fn = useServerFn(cacheWarmup);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: WarmupInput) => fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}
