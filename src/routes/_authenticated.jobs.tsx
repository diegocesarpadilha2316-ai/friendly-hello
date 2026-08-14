import { useState } from "react";
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
  jobsSnapshotQuery,
  useCancelJob,
  useExportJobs,
  useJobsSnapshot,
  usePauseJob,
  useRequeueDeadLetter,
  useResumeJob,
  useSchedulerTick,
  type CronJob,
  type DeadLetterEntry,
  type Job,
  type JobHistoryEntry,
  type JobQueue,
  type RetryEntry,
  type WorkerNode,
} from "@/core/jobs";

type TabKey = "dashboard" | "queue" | "workers" | "cron" | "history" | "dead" | "retry" | "metrics";

const TABS: readonly { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "queue", label: "Fila" },
  { key: "workers", label: "Workers" },
  { key: "cron", label: "Cron" },
  { key: "history", label: "Histórico" },
  { key: "dead", label: "Dead Letter" },
  { key: "retry", label: "Retry" },
  { key: "metrics", label: "Métricas" },
];

export const Route = createFileRoute("/_authenticated/jobs")({
  loader: ({ context }) => context.queryClient.ensureQueryData(jobsSnapshotQuery()),
  head: () => ({
    meta: [
      { title: "Jobs & Workers Enterprise — Dioris Hub" },
      {
        name: "description",
        content:
          "Motor único de execução assíncrona da Dioris Hub — filas, agendamentos, cron, workers distribuídos e observabilidade.",
      },
      { property: "og:title", content: "Jobs & Workers — Dioris Hub" },
      {
        property: "og:description",
        content: "Filas, cron, workers e dead-letter unificados para todos os módulos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JobsPage,
});

function toneForJob(status: Job["status"]): StatusTone {
  switch (status) {
    case "completed":
      return "success";
    case "running":
      return "info";
    case "queued":
    case "scheduled":
      return "neutral";
    case "paused":
      return "warning";
    case "failed":
    case "dead":
      return "danger";
    case "canceled":
      return "neutral";
    default:
      return "info";
  }
}

function JobsPage() {
  const [tab, setTab] = useState<TabKey>("dashboard");
  const snapshot = useJobsSnapshot();
  const tick = useSchedulerTick();
  const exportMut = useExportJobs();
  const data = snapshot.data;

  const running = data.jobs.filter((j) => j.status === "running").length;
  const queued = data.jobs.filter((j) => j.status === "queued" || j.status === "scheduled").length;
  const failed = data.jobs.filter((j) => j.status === "failed" || j.status === "dead").length;
  const completed = data.jobs.filter((j) => j.status === "completed").length;

  return (
    <PageContainer>
      <PageHeader
        title="Jobs & Workers Enterprise"
        description="Motor único de execução assíncrona — filas, cron, workers distribuídos, retry e dead-letter."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => tick.mutate()}>
              Executar Scheduler
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const res = await exportMut.mutateAsync("json");
                const blob = new Blob([res.content], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "jobs.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Exportar JSON
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
          <MetricCard label="Em execução" value={String(running)} />
          <MetricCard label="Na fila" value={String(queued)} />
          <MetricCard label="Concluídos" value={String(completed)} />
          <MetricCard label="Falhas / Dead" value={String(failed)} />
          <MetricCard label="Workers" value={String(data.workers.length)} />
          <MetricCard
            label="Crons ativos"
            value={String(data.crons.filter((c) => c.active).length)}
          />
          <MetricCard label="Dead Letter" value={String(data.deadLetter.length)} />
          <MetricCard label="Retries" value={String(data.retries.length)} />
        </div>
      )}

      {tab === "queue" && <QueueTab jobs={data.jobs} queues={data.queues} />}
      {tab === "workers" && <WorkersTab data={data.workers} />}
      {tab === "cron" && <CronTab data={data.crons} />}
      {tab === "history" && <HistoryTab data={data.history} />}
      {tab === "dead" && <DeadLetterTab data={data.deadLetter} />}
      {tab === "retry" && <RetryTab data={data.retries} />}
      {tab === "metrics" && <MetricsTab data={data.metrics} />}
    </PageContainer>
  );
}

function QueueTab({ jobs, queues }: { jobs: readonly Job[]; queues: readonly JobQueue[] }) {
  const cancel = useCancelJob();
  const pause = usePauseJob();
  const resume = useResumeJob();
  const jobCols: DataTableColumn<Job>[] = [
    { id: "kind", header: "Kind", cell: (r) => r.kind },
    { id: "queue", header: "Fila", cell: (r) => r.queue },
    {
      id: "status",
      header: "Status",
      cell: (r) => <StatusBadge tone={toneForJob(r.status)}>{r.status}</StatusBadge>,
    },
    { id: "progress", header: "Progresso", cell: (r) => `${r.progress}%` },
    { id: "attempts", header: "Tentativas", cell: (r) => `${r.attempts}/${r.maxAttempts}` },
    { id: "priority", header: "Prio.", cell: (r) => r.priority },
    {
      id: "actions",
      header: "Ações",
      cell: (r) => (
        <div className="flex gap-2">
          {r.status === "paused" ? (
            <Button size="sm" variant="outline" onClick={() => resume.mutate(r.id)}>
              Retomar
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => pause.mutate(r.id)}>
              Pausar
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => cancel.mutate(r.id)}>
            Cancelar
          </Button>
        </div>
      ),
    },
  ];
  const queueCols: DataTableColumn<JobQueue>[] = [
    { id: "name", header: "Nome", cell: (r) => r.name },
    { id: "concurrency", header: "Concorrência", cell: (r) => r.concurrency },
    {
      id: "paused",
      header: "Pausada",
      cell: (r) => (
        <StatusBadge tone={r.paused ? "warning" : "success"}>
          {r.paused ? "Sim" : "Não"}
        </StatusBadge>
      ),
    },
    { id: "rate", header: "Rate/min", cell: (r) => r.rateLimitPerMin ?? "—" },
  ];
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="text-sm font-medium">Filas configuradas</h3>
        {queues.length ? (
          <DataTable data={[...queues]} columns={queueCols} getRowKey={(r) => r.id} />
        ) : (
          <EmptyState title="Nenhuma fila configurada" description="Usando fila padrão." />
        )}
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-medium">Jobs recentes</h3>
        {jobs.length ? (
          <DataTable data={[...jobs]} columns={jobCols} getRowKey={(r) => r.id} />
        ) : (
          <EmptyState title="Sem jobs" description="Enfileire jobs a partir dos módulos." />
        )}
      </section>
    </div>
  );
}

function WorkersTab({ data }: { data: readonly WorkerNode[] }) {
  const cols: DataTableColumn<WorkerNode>[] = [
    { id: "name", header: "Worker", cell: (r) => r.name },
    { id: "host", header: "Host", cell: (r) => r.hostname ?? "—" },
    { id: "region", header: "Região", cell: (r) => r.region ?? "—" },
    {
      id: "status",
      header: "Status",
      cell: (r) => (
        <StatusBadge
          tone={
            r.status === "idle"
              ? "success"
              : r.status === "busy"
                ? "info"
                : r.status === "draining"
                  ? "warning"
                  : "danger"
          }
        >
          {r.status}
        </StatusBadge>
      ),
    },
    { id: "load", header: "Carga", cell: (r) => `${r.runningJobs}/${r.capacity}` },
    {
      id: "hb",
      header: "Último heartbeat",
      cell: (r) => new Date(r.lastHeartbeatAt).toLocaleString(),
    },
  ];
  if (!data.length)
    return (
      <EmptyState
        title="Nenhum worker registrado"
        description="Workers se registram automaticamente ao iniciar."
      />
    );
  return <DataTable data={[...data]} columns={cols} getRowKey={(r) => r.id} />;
}

function CronTab({ data }: { data: readonly CronJob[] }) {
  const cols: DataTableColumn<CronJob>[] = [
    { id: "name", header: "Nome", cell: (r) => r.name },
    { id: "expr", header: "Expressão", cell: (r) => <code className="text-xs">{r.cronExpr}</code> },
    { id: "kind", header: "Kind", cell: (r) => r.kind },
    { id: "queue", header: "Fila", cell: (r) => r.queue },
    {
      id: "active",
      header: "Ativo",
      cell: (r) => (
        <StatusBadge tone={r.active ? "success" : "neutral"}>
          {r.active ? "Sim" : "Não"}
        </StatusBadge>
      ),
    },
    {
      id: "next",
      header: "Próxima execução",
      cell: (r) => (r.nextRunAt ? new Date(r.nextRunAt).toLocaleString() : "—"),
    },
  ];
  if (!data.length) return <EmptyState title="Nenhum cron configurado" />;
  return <DataTable data={[...data]} columns={cols} getRowKey={(r) => r.id} />;
}

function HistoryTab({ data }: { data: readonly JobHistoryEntry[] }) {
  const cols: DataTableColumn<JobHistoryEntry>[] = [
    { id: "kind", header: "Kind", cell: (r) => r.kind },
    {
      id: "status",
      header: "Status",
      cell: (r) => <StatusBadge tone={toneForJob(r.status)}>{r.status}</StatusBadge>,
    },
    { id: "attempts", header: "Tentativas", cell: (r) => r.attempts },
    {
      id: "duration",
      header: "Duração",
      cell: (r) => (r.durationMs != null ? `${r.durationMs} ms` : "—"),
    },
    { id: "when", header: "Finalizado", cell: (r) => new Date(r.finishedAt).toLocaleString() },
  ];
  if (!data.length) return <EmptyState title="Sem histórico" />;
  return <DataTable data={[...data]} columns={cols} getRowKey={(r) => r.id} />;
}

function DeadLetterTab({ data }: { data: readonly DeadLetterEntry[] }) {
  const requeue = useRequeueDeadLetter();
  const cols: DataTableColumn<DeadLetterEntry>[] = [
    { id: "kind", header: "Kind", cell: (r) => r.kind },
    { id: "attempts", header: "Tentativas", cell: (r) => r.attempts },
    { id: "error", header: "Erro", cell: (r) => r.error ?? "—" },
    { id: "when", header: "Movido em", cell: (r) => new Date(r.movedAt).toLocaleString() },
    {
      id: "actions",
      header: "Ações",
      cell: (r) => (
        <Button size="sm" variant="outline" onClick={() => requeue.mutate(r.id)}>
          Reenfileirar
        </Button>
      ),
    },
  ];
  if (!data.length) return <EmptyState title="Dead letter queue vazia" />;
  return <DataTable data={[...data]} columns={cols} getRowKey={(r) => r.id} />;
}

function RetryTab({ data }: { data: readonly RetryEntry[] }) {
  const cols: DataTableColumn<RetryEntry>[] = [
    { id: "attempt", header: "Tentativa", cell: (r) => r.attempt },
    { id: "next", header: "Próxima em", cell: (r) => new Date(r.nextRunAt).toLocaleString() },
    { id: "reason", header: "Motivo", cell: (r) => r.reason ?? "—" },
  ];
  if (!data.length) return <EmptyState title="Sem retries agendados" />;
  return <DataTable data={[...data]} columns={cols} getRowKey={(r) => r.id} />;
}

function MetricsTab({ data }: { data: readonly import("@/core/jobs").JobMetricBucket[] }) {
  const cols: DataTableColumn<import("@/core/jobs").JobMetricBucket>[] = [
    { id: "bucket", header: "Período", cell: (r) => new Date(r.bucket).toLocaleString() },
    { id: "queue", header: "Fila", cell: (r) => r.queue },
    { id: "ok", header: "OK", cell: (r) => r.jobsCompleted },
    { id: "fail", header: "Falhas", cell: (r) => r.jobsFailed },
    { id: "retry", header: "Retries", cell: (r) => r.jobsRetried },
    { id: "avg", header: "Duração média", cell: (r) => `${r.avgDurationMs} ms` },
    { id: "p95", header: "p95", cell: (r) => `${r.p95DurationMs} ms` },
  ];
  if (!data.length) return <EmptyState title="Sem métricas coletadas" />;
  return <DataTable data={[...data]} columns={cols} getRowKey={(r) => r.id} />;
}
