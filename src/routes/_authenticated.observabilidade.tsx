import { createFileRoute } from "@tanstack/react-router";
import {
  DataTable,
  EmptyState,
  MetricCard,
  PageContainer,
  PageHeader,
  StatusBadge,
  type DataTableColumn,
} from "@/core/components/ui-kit";
import {
  useAudit,
  useErrorReports,
  useHealth,
  useLogs,
  useObservabilityExport,
  useObservabilityMetrics,
  useResolveError,
  useTraces,
  type AuditEntry,
  type ErrorReport,
  type HealthCheckEntry,
  type LogEntry,
  type TraceSession,
} from "@/core/observability";

export const Route = createFileRoute("/_authenticated/observabilidade")({
  head: () => ({
    meta: [
      { title: "Observabilidade — Dioris Hub" },
      {
        name: "description",
        content:
          "Centro Enterprise de Logs, Auditoria, Métricas, Health e Tracing da Dioris Hub — infraestrutura única de observabilidade multi-tenant.",
      },
      { property: "og:title", content: "Observabilidade — Dioris Hub" },
      {
        property: "og:description",
        content:
          "Logs, auditoria e métricas unificados com rastreabilidade ponta a ponta por trace/correlation ID.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ObservabilityPage,
});

function ObservabilityPage() {
  const metrics = useObservabilityMetrics();
  const logs = useLogs();
  const audit = useAudit();
  const errors = useErrorReports();
  const traces = useTraces();
  const health = useHealth();
  const resolveError = useResolveError();
  const exportRun = useObservabilityExport();

  const s = metrics.data?.summary;
  const byLevel = metrics.data?.logsByLevel;

  const download = async (
    dataset: "logs" | "audit" | "errors" | "traces" | "metrics",
    format: "json" | "csv",
  ) => {
    const out = await exportRun.mutateAsync({ dataset, format });
    const blob = new Blob([out.content], {
      type: format === "csv" ? "text/csv" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dioris-${dataset}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const logCols: DataTableColumn<LogEntry>[] = [
    {
      id: "createdAt",
      header: "Quando",
      cell: (r) => new Date(r.createdAt).toLocaleString("pt-BR"),
    },
    {
      id: "level",
      header: "Nível",
      cell: (r) => <StatusBadge tone={levelTone(r.level)}>{r.level}</StatusBadge>,
    },
    { id: "module", header: "Módulo", cell: (r) => r.module },
    { id: "action", header: "Ação", cell: (r) => r.action },
    { id: "message", header: "Mensagem", cell: (r) => r.message ?? "—" },
    { id: "trace", header: "Trace", cell: (r) => (r.traceId ? r.traceId.slice(0, 8) : "—") },
    {
      id: "duration",
      header: "Duração",
      cell: (r) => (r.durationMs != null ? `${r.durationMs}ms` : "—"),
    },
  ];

  const auditCols: DataTableColumn<AuditEntry>[] = [
    {
      id: "createdAt",
      header: "Quando",
      cell: (r) => new Date(r.createdAt).toLocaleString("pt-BR"),
    },
    {
      id: "action",
      header: "Ação",
      cell: (r) => <StatusBadge tone="info">{r.action}</StatusBadge>,
    },
    { id: "entity", header: "Entidade", cell: (r) => r.entity },
    { id: "entityId", header: "ID", cell: (r) => r.entityId ?? "—" },
    { id: "user", header: "Usuário", cell: (r) => r.userId ?? "sistema" },
    { id: "diff", header: "Alterações", cell: (r) => (r.diff ? Object.keys(r.diff).length : 0) },
  ];

  const errCols: DataTableColumn<ErrorReport>[] = [
    {
      id: "lastSeen",
      header: "Última",
      cell: (r) => new Date(r.lastSeenAt).toLocaleString("pt-BR"),
    },
    { id: "module", header: "Módulo", cell: (r) => r.module },
    { id: "message", header: "Mensagem", cell: (r) => r.message },
    { id: "occurrences", header: "Ocorrências", cell: (r) => r.occurrences },
    {
      id: "resolved",
      header: "Status",
      cell: (r) => (
        <StatusBadge tone={r.resolved ? "success" : "danger"}>
          {r.resolved ? "resolvido" : "aberto"}
        </StatusBadge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (r) =>
        r.resolved ? null : (
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => resolveError.mutate(r.id)}
          >
            marcar resolvido
          </button>
        ),
    },
  ];

  const traceCols: DataTableColumn<TraceSession>[] = [
    {
      id: "startedAt",
      header: "Início",
      cell: (r) => new Date(r.startedAt).toLocaleString("pt-BR"),
    },
    { id: "trace", header: "Trace", cell: (r) => r.traceId.slice(0, 8) },
    { id: "module", header: "Módulo", cell: (r) => r.rootModule ?? "—" },
    { id: "action", header: "Ação", cell: (r) => r.rootAction ?? "—" },
    {
      id: "duration",
      header: "Duração",
      cell: (r) => (r.durationMs != null ? `${r.durationMs}ms` : "—"),
    },
    { id: "status", header: "Status", cell: (r) => r.status ?? "—" },
  ];

  const healthCols: DataTableColumn<HealthCheckEntry>[] = [
    {
      id: "createdAt",
      header: "Quando",
      cell: (r) => new Date(r.createdAt).toLocaleString("pt-BR"),
    },
    { id: "component", header: "Componente", cell: (r) => r.component },
    {
      id: "status",
      header: "Status",
      cell: (r) => <StatusBadge tone={healthTone(r.status)}>{r.status}</StatusBadge>,
    },
    {
      id: "latency",
      header: "Latência",
      cell: (r) => (r.latencyMs != null ? `${r.latencyMs}ms` : "—"),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Core"
        title="Observabilidade"
        description="Logs, auditoria, métricas e tracing unificados. Todos os módulos escrevem via Core e leem por este painel, com RLS por tenant."
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
              onClick={() => download("logs", "csv")}
            >
              exportar logs CSV
            </button>
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
              onClick={() => download("audit", "json")}
            >
              exportar auditoria JSON
            </button>
          </div>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-5">
        <MetricCard label="Logs" value={s?.logsTotal ?? 0} />
        <MetricCard label="Erros (logs)" value={s?.logsErrors ?? 0} />
        <MetricCard label="Auditoria" value={s?.auditTotal ?? 0} />
        <MetricCard label="Erros abertos" value={s?.errorsOpen ?? 0} />
        <MetricCard label="Traces" value={s?.tracesTotal ?? 0} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Taxa de erro" value={`${metrics.data?.errorRatePct ?? 0}%`} />
        <MetricCard label="Duração média" value={`${metrics.data?.avgLogDurationMs ?? 0}ms`} />
        <MetricCard label="Warns" value={byLevel?.warn ?? 0} />
        <MetricCard label="Info" value={byLevel?.info ?? 0} />
      </div>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">Health</h2>
        {health.data && health.data.length > 0 ? (
          <DataTable
            data={health.data as HealthCheckEntry[]}
            columns={healthCols}
            getRowKey={(r) => r.id}
          />
        ) : (
          <EmptyState
            title="Sem health checks"
            description="Componentes começarão a reportar assim que emitirem status."
          />
        )}
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">Logs recentes</h2>
        <DataTable
          data={(logs.data ?? []) as LogEntry[]}
          columns={logCols}
          getRowKey={(r) => r.id}
          empty="Sem logs registrados."
        />
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">Auditoria</h2>
        <DataTable
          data={(audit.data ?? []) as AuditEntry[]}
          columns={auditCols}
          getRowKey={(r) => r.id}
          empty="Sem eventos de auditoria."
        />
      </section>

      <section className="mt-10 grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Erros</h2>
          <DataTable
            data={(errors.data ?? []) as ErrorReport[]}
            columns={errCols}
            getRowKey={(r) => r.id}
            empty="Nenhum erro reportado."
          />
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Traces</h2>
          <DataTable
            data={(traces.data ?? []) as TraceSession[]}
            columns={traceCols}
            getRowKey={(r) => r.id}
            empty="Sem sessões de trace."
          />
        </div>
      </section>
    </PageContainer>
  );
}

function levelTone(l: string): "success" | "warning" | "danger" | "neutral" | "info" {
  if (l === "fatal" || l === "error") return "danger";
  if (l === "warn") return "warning";
  if (l === "info") return "info";
  return "neutral";
}

function healthTone(s: string): "success" | "warning" | "danger" | "neutral" | "info" {
  if (s === "healthy") return "success";
  if (s === "degraded") return "warning";
  if (s === "down") return "danger";
  return "neutral";
}
