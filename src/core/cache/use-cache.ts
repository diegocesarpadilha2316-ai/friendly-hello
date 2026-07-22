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
    mutationFn: (data: InvalidateInput) =>
      fn({ data: { target: "", ...data } } as never),
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
*** Add File: src/core/cache/index.ts
export * from "./types";
export { cacheSnapshotQuery, cacheKeys } from "./queries";
export {
  useCacheSnapshot,
  useUpsertNamespace,
  useDeleteNamespace,
  useSetEntry,
  useDeleteEntry,
  useInvalidateCache,
  useWarmupCache,
} from "./use-cache";
export {
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheSwr,
  cacheReadThrough,
  cacheInvalidateNamespace,
  cacheInvalidateTag,
  cacheInvalidateTenant,
  cachePurgeExpired,
} from "./manager.server";
*** Add File: src/routes/_authenticated.cache.tsx
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  DataTable,
  EmptyState,
  MetricCard,
  PageContainer,
  PageHeader,
  StatusBadge,
  type DataTableColumn,
  type StatusTone,
} from "@/core/components/ui-kit";
import { Button } from "@/components/ui/button";
import {
  cacheSnapshotQuery,
  useCacheSnapshot,
  useDeleteEntry,
  useDeleteNamespace,
  useInvalidateCache,
  type CacheEntry,
  type CacheInvalidation,
  type CacheMetricPoint,
  type CacheNamespace,
  type CacheWarmupJob,
} from "@/core/cache";

type TabKey =
  | "dashboard"
  | "entries"
  | "namespaces"
  | "tags"
  | "metrics"
  | "invalidations"
  | "warmup"
  | "health";

const TABS: readonly { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "entries", label: "Entradas" },
  { key: "namespaces", label: "Namespaces" },
  { key: "tags", label: "Tags" },
  { key: "metrics", label: "Métricas" },
  { key: "invalidations", label: "Invalidação" },
  { key: "warmup", label: "Warmup" },
  { key: "health", label: "Health" },
];

export const Route = createFileRoute("/_authenticated/cache")({
  loader: ({ context }) => context.queryClient.ensureQueryData(cacheSnapshotQuery()),
  head: () => ({
    meta: [
      { title: "Cache Distribuído — Dioris Hub" },
      {
        name: "description",
        content:
          "Cache distribuído único da Dioris Hub — namespaces, tags, TTL, invalidação, warmup e métricas.",
      },
      { property: "og:title", content: "Cache Distribuído — Dioris Hub" },
      {
        property: "og:description",
        content: "Infra de cache central reutilizada por todos os módulos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CachePage,
});

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function strategyTone(s: CacheNamespace["strategy"]): StatusTone {
  switch (s) {
    case "swr":
      return "info";
    case "write_through":
      return "success";
    case "write_behind":
      return "warning";
    default:
      return "neutral";
  }
}

function invScopeTone(s: CacheInvalidation["scope"]): StatusTone {
  switch (s) {
    case "tenant":
      return "danger";
    case "namespace":
      return "warning";
    case "tag":
      return "info";
    default:
      return "neutral";
  }
}

function CachePage() {
  const [tab, setTab] = useState<TabKey>("dashboard");
  const snapshot = useCacheSnapshot();
  const invalidate = useInvalidateCache();
  const data = snapshot.data;

  const tagCounts = useMemo(() => {
    const map = new Map<string, { count: number; bytes: number }>();
    for (const e of data.entries) {
      for (const t of e.tags) {
        const cur = map.get(t) ?? { count: 0, bytes: 0 };
        cur.count++;
        cur.bytes += e.sizeBytes;
        map.set(t, cur);
      }
    }
    return [...map.entries()]
      .map(([tag, v]) => ({ tag, ...v }))
      .sort((a, b) => b.count - a.count);
  }, [data.entries]);

  return (
    <PageContainer>
      <PageHeader
        title="Cache Distribuído Enterprise"
        description="Gerenciador único de cache — namespaces, tags, TTL, invalidação, warmup e métricas."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => invalidate.mutate({ scope: "expired" })}
            >
              Purge expirados
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (confirm("Invalidar TODO o cache desta empresa?")) {
                  invalidate.mutate({ scope: "tenant", reason: "manual" });
                }
              }}
            >
              Invalidar tudo
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {TABS.map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={tab === t.key ? "default" : "ghost"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Entradas" value={String(data.health.totalEntries)} />
          <MetricCard label="Bytes" value={formatBytes(data.health.totalBytes)} />
          <MetricCard label="Namespaces" value={String(data.health.namespaces)} />
          <MetricCard label="Hit rate" value={`${data.health.hitRate}%`} />
          <MetricCard label="Expirados" value={String(data.health.expired)} />
          <MetricCard label="Invalidações" value={String(data.invalidations.length)} />
          <MetricCard label="Warmups" value={String(data.warmups.length)} />
          <MetricCard label="Latência" value={`${data.health.latencyMs} ms`} />
        </div>
      )}

      {tab === "entries" && <EntriesTab data={data.entries} />}
      {tab === "namespaces" && <NamespacesTab data={data.namespaces} onInvalidate={(ns) => invalidate.mutate({ scope: "namespace", target: ns })} />}
      {tab === "tags" && <TagsTab data={tagCounts} onInvalidate={(tag) => invalidate.mutate({ scope: "tag", target: tag })} />}
      {tab === "metrics" && <MetricsTab data={data.metrics} />}
      {tab === "invalidations" && <InvalidationsTab data={data.invalidations} />}
      {tab === "warmup" && <WarmupTab data={data.warmups} />}
      {tab === "health" && (
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Total de entradas" value={String(data.health.totalEntries)} />
          <MetricCard label="Tamanho total" value={formatBytes(data.health.totalBytes)} />
          <MetricCard label="Entradas expiradas" value={String(data.health.expired)} />
          <MetricCard label="Namespaces ativos" value={String(data.health.namespaces)} />
          <MetricCard label="Taxa de acerto" value={`${data.health.hitRate}%`} />
          <MetricCard label="Latência snapshot" value={`${data.health.latencyMs} ms`} />
        </div>
      )}
    </PageContainer>
  );
}

function EntriesTab({ data }: { data: readonly CacheEntry[] }) {
  const del = useDeleteEntry();
  const cols: DataTableColumn<CacheEntry>[] = [
    { id: "ns", header: "Namespace", cell: (r) => <code className="text-xs">{r.namespace}</code> },
    { id: "key", header: "Chave", cell: (r) => <code className="text-xs break-all">{r.key}</code> },
    { id: "size", header: "Tamanho", cell: (r) => `${(r.sizeBytes / 1024).toFixed(1)} KB` },
    { id: "ttl", header: "TTL", cell: (r) => (r.ttlSeconds ? `${r.ttlSeconds}s` : "∞") },
    {
      id: "exp",
      header: "Expira",
      cell: (r) => (r.expiresAt ? new Date(r.expiresAt).toLocaleString() : "—"),
    },
    { id: "hits", header: "Hits", cell: (r) => r.hitCount },
    { id: "tags", header: "Tags", cell: (r) => r.tags.join(", ") || "—" },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => del.mutate({ namespace: r.namespace, key: r.key })}
        >
          Remover
        </Button>
      ),
    },
  ];
  if (!data.length) return <EmptyState title="Sem entradas em cache" />;
  return <DataTable data={[...data]} columns={cols} getRowKey={(r) => r.id} />;
}

function NamespacesTab({
  data,
  onInvalidate,
}: {
  data: readonly CacheNamespace[];
  onInvalidate: (ns: string) => void;
}) {
  const del = useDeleteNamespace();
  const cols: DataTableColumn<CacheNamespace>[] = [
    { id: "name", header: "Nome", cell: (r) => <code className="text-xs">{r.name}</code> },
    {
      id: "strategy",
      header: "Estratégia",
      cell: (r) => <StatusBadge tone={strategyTone(r.strategy)}>{r.strategy}</StatusBadge>,
    },
    { id: "ttl", header: "TTL padrão", cell: (r) => `${r.defaultTtlSeconds}s` },
    { id: "max", header: "Máx.", cell: (r) => r.maxEntries.toLocaleString() },
    { id: "desc", header: "Descrição", cell: (r) => r.description ?? "—" },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onInvalidate(r.name)}>
            Invalidar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => del.mutate(r.id)}>
            Remover
          </Button>
        </div>
      ),
    },
  ];
  if (!data.length)
    return (
      <EmptyState
        title="Nenhum namespace registrado"
        description="Os módulos podem operar sem namespaces declarados. Registre-os para configurar TTL padrão e estratégia."
      />
    );
  return <DataTable data={[...data]} columns={cols} getRowKey={(r) => r.id} />;
}

function TagsTab({
  data,
  onInvalidate,
}: {
  data: readonly { tag: string; count: number; bytes: number }[];
  onInvalidate: (tag: string) => void;
}) {
  const cols: DataTableColumn<{ tag: string; count: number; bytes: number }>[] = [
    { id: "tag", header: "Tag", cell: (r) => <code className="text-xs">{r.tag}</code> },
    { id: "count", header: "Entradas", cell: (r) => r.count },
    { id: "bytes", header: "Bytes", cell: (r) => `${(r.bytes / 1024).toFixed(1)} KB` },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <Button size="sm" variant="outline" onClick={() => onInvalidate(r.tag)}>
          Invalidar
        </Button>
      ),
    },
  ];
  if (!data.length) return <EmptyState title="Nenhuma tag em uso" />;
  return <DataTable data={[...data]} columns={cols} getRowKey={(r) => r.tag} />;
}

function MetricsTab({ data }: { data: readonly CacheMetricPoint[] }) {
  const cols: DataTableColumn<CacheMetricPoint>[] = [
    { id: "when", header: "Minuto", cell: (r) => new Date(r.bucketAt).toLocaleString() },
    { id: "ns", header: "Namespace", cell: (r) => <code className="text-xs">{r.namespace}</code> },
    { id: "hits", header: "Hits", cell: (r) => r.hits },
    { id: "misses", header: "Misses", cell: (r) => r.misses },
    { id: "writes", header: "Writes", cell: (r) => r.writes },
    { id: "inv", header: "Invalid.", cell: (r) => r.invalidations },
    { id: "bytes", header: "Bytes", cell: (r) => `${(r.bytesWritten / 1024).toFixed(1)} KB` },
  ];
  if (!data.length) return <EmptyState title="Sem métricas ainda" />;
  return <DataTable data={[...data]} columns={cols} getRowKey={(r) => r.id} />;
}

function InvalidationsTab({ data }: { data: readonly CacheInvalidation[] }) {
  const cols: DataTableColumn<CacheInvalidation>[] = [
    { id: "when", header: "Quando", cell: (r) => new Date(r.createdAt).toLocaleString() },
    {
      id: "scope",
      header: "Escopo",
      cell: (r) => <StatusBadge tone={invScopeTone(r.scope)}>{r.scope}</StatusBadge>,
    },
    { id: "target", header: "Alvo", cell: (r) => <code className="text-xs break-all">{r.target}</code> },
    { id: "affected", header: "Afetados", cell: (r) => r.affected },
    { id: "reason", header: "Motivo", cell: (r) => r.reason ?? "—" },
  ];
  if (!data.length) return <EmptyState title="Sem invalidações recentes" />;
  return <DataTable data={[...data]} columns={cols} getRowKey={(r) => r.id} />;
}

function WarmupTab({ data }: { data: readonly CacheWarmupJob[] }) {
  const cols: DataTableColumn<CacheWarmupJob>[] = [
    { id: "when", header: "Quando", cell: (r) => new Date(r.createdAt).toLocaleString() },
    { id: "ns", header: "Namespace", cell: (r) => <code className="text-xs">{r.namespace}</code> },
    {
      id: "status",
      header: "Status",
      cell: (r) => (
        <StatusBadge
          tone={
            r.status === "completed"
              ? "success"
              : r.status === "failed"
                ? "danger"
                : r.status === "running"
                  ? "info"
                  : "neutral"
          }
        >
          {r.status}
        </StatusBadge>
      ),
    },
    { id: "entries", header: "Entradas", cell: (r) => r.entries },
    { id: "dur", header: "Duração", cell: (r) => (r.durationMs ? `${r.durationMs} ms` : "—") },
    { id: "err", header: "Erro", cell: (r) => r.error ?? "—" },
  ];
  if (!data.length) return <EmptyState title="Nenhum warmup executado" />;
  return <DataTable data={[...data]} columns={cols} getRowKey={(r) => r.id} />;
}