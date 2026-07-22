import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  DataTable, EmptyState, MetricCard, PageContainer, PageHeader,
  StatusBadge, type DataTableColumn, type StatusTone,
} from "@/core/components/ui-kit";
import { Button } from "@/components/ui/button";
import {
  recoverySnapshotQuery,
  useDeletePlan,
  useDeleteSchedule,
  useDeleteTarget,
  useRecoverySnapshot,
  useRunDrill,
  type Backup,
  type BackupStatus,
  type DrPlan,
  type IntegrityCheck,
  type IntegrityStatus,
  type RecoveryHistoryPoint,
  type Restore,
  type Schedule,
  type Snapshot,
  type Target,
} from "@/core/recovery";

type TabKey =
  | "dashboard" | "backups" | "snapshots" | "restore" | "dr"
  | "integrity" | "schedules" | "history";

const TABS: readonly { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "backups", label: "Backups" },
  { key: "snapshots", label: "Snapshots" },
  { key: "restore", label: "Restore" },
  { key: "dr", label: "Disaster Recovery" },
  { key: "integrity", label: "Integridade" },
  { key: "schedules", label: "Agendamentos" },
  { key: "history", label: "Histórico" },
];

export const Route = createFileRoute("/_authenticated/recovery")({
  loader: ({ context }) => context.queryClient.ensureQueryData(recoverySnapshotQuery()),
  head: () => ({
    meta: [
      { title: "Backup & Disaster Recovery — Dioris Hub" },
      {
        name: "description",
        content:
          "RecoveryManager central da Dioris — backups, snapshots, restore, PITR, integridade e planos de DR para toda a plataforma.",
      },
      { property: "og:title", content: "Backup & Disaster Recovery — Dioris Hub" },
      {
        property: "og:description",
        content:
          "Continuidade de negócio única para Planner, Creator, CRM, Financeiro, Marketplace, Automação e IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecoveryPage,
});

function backupTone(s: BackupStatus): StatusTone {
  switch (s) {
    case "completed": case "verified": return "success";
    case "failed": return "danger";
    case "expired": case "cancelled": return "warning";
    case "running": case "queued": return "info";
    default: return "neutral";
  }
}

function restoreTone(s: Restore["status"]): StatusTone {
  switch (s) {
    case "completed": return "success";
    case "failed": return "danger";
    case "cancelled": return "warning";
    case "running": case "queued": return "info";
    default: return "neutral";
  }
}

function integrityTone(s: IntegrityStatus): StatusTone {
  return s === "pass" ? "success" : s === "fail" ? "danger" : s === "warn" ? "warning" : "neutral";
}

function fmtBytes(n: number | null): string {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

function RecoveryPage() {
  const { data } = useRecoverySnapshot();
  const [tab, setTab] = useState<TabKey>("dashboard");
  const targetsBySlug = useMemo(() => {
    const m = new Map<string, Target>();
    for (const t of data.targets) m.set(t.slug, t);
    return m;
  }, [data.targets]);

  return (
    <PageContainer>
      <PageHeader
        title="Backup & Disaster Recovery"
        description="RecoveryManager único da Dioris — backups, snapshots, restore, PITR, integridade, planos de DR e histórico com integração ao Storage, Jobs, Observability, Security, CI/CD, Notifications, Event Center e API Gateway."
      />

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm ${
              tab === t.key
                ? "border-b-2 border-primary font-semibold"
                : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <DashboardTab data={data} />}
      {tab === "backups" && <BackupsTab backups={data.backups} />}
      {tab === "snapshots" && <SnapshotsTab snapshots={data.snapshots} />}
      {tab === "restore" && <RestoreTab restores={data.restores} />}
      {tab === "dr" && <DrTab plans={data.plans} />}
      {tab === "integrity" && <IntegrityTab checks={data.integrity} />}
      {tab === "schedules" && (
        <SchedulesTab schedules={data.schedules} targets={targetsBySlug} allTargets={data.targets} />
      )}
      {tab === "history" && <HistoryTab points={data.history} />}
    </PageContainer>
  );
}

function DashboardTab({ data }: { data: ReturnType<typeof useRecoverySnapshot>["data"] }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Alvos" value={String(data.health.totalTargets)} />
        <MetricCard label="Ativos" value={String(data.health.enabledTargets)} />
        <MetricCard label="Backups" value={String(data.health.totalBackups)} />
        <MetricCard label="Verificados" value={String(data.health.verifiedBackups)} />
        <MetricCard label="Restores" value={String(data.health.totalRestores)} />
        <MetricCard label="Restore success" value={`${data.health.restoreSuccessRate}%`} />
        <MetricCard label="Agendamentos ativos" value={String(data.health.activeSchedules)} />
        <MetricCard label="Planos DR falhando" value={String(data.health.failingPlans)} />
      </div>
      <MetricCard label="Volume total armazenado" value={fmtBytes(data.health.totalBytes)} />
    </div>
  );
}

function BackupsTab({ backups }: { backups: readonly Backup[] }) {
  const cols: DataTableColumn<Backup>[] = [
    { id: "slug", header: "Alvo", cell: (r) => <code className="text-xs">{r.targetSlug}</code> },
    { id: "kind", header: "Tipo", cell: (r) => <StatusBadge tone="info">{r.kind}</StatusBadge> },
    { id: "strategy", header: "Estratégia", cell: (r) => r.strategy },
    { id: "trigger", header: "Origem", cell: (r) => r.trigger },
    { id: "status", header: "Status", cell: (r) => <StatusBadge tone={backupTone(r.status)}>{r.status}</StatusBadge> },
    { id: "size", header: "Tamanho", cell: (r) => fmtBytes(r.sizeBytes) },
    { id: "at", header: "Quando", cell: (r) => new Date(r.createdAt).toLocaleString() },
  ];
  if (!backups.length) return <EmptyState title="Sem backups registrados" />;
  return <DataTable data={[...backups]} columns={cols} getRowKey={(r) => r.id} />;
}

function SnapshotsTab({ snapshots }: { snapshots: readonly Snapshot[] }) {
  const cols: DataTableColumn<Snapshot>[] = [
    { id: "scope", header: "Escopo", cell: (r) => <StatusBadge tone="info">{r.scope}</StatusBadge> },
    { id: "target", header: "Alvo", cell: (r) => r.target },
    { id: "version", header: "Versão", cell: (r) => r.version ?? "—" },
    { id: "size", header: "Tamanho", cell: (r) => fmtBytes(r.sizeBytes) },
    { id: "at", header: "Quando", cell: (r) => new Date(r.createdAt).toLocaleString() },
  ];
  if (!snapshots.length) return <EmptyState title="Sem snapshots registrados" />;
  return <DataTable data={[...snapshots]} columns={cols} getRowKey={(r) => r.id} />;
}

function RestoreTab({ restores }: { restores: readonly Restore[] }) {
  const cols: DataTableColumn<Restore>[] = [
    { id: "mode", header: "Modo", cell: (r) => <StatusBadge tone="info">{r.mode}</StatusBadge> },
    { id: "status", header: "Status", cell: (r) => <StatusBadge tone={restoreTone(r.status)}>{r.status}</StatusBadge> },
    { id: "pit", header: "Point-in-time", cell: (r) => (r.pointInTime ? new Date(r.pointInTime).toLocaleString() : "—") },
    { id: "scope", header: "Escopo", cell: (r) => r.targetScope ?? "—" },
    { id: "at", header: "Quando", cell: (r) => new Date(r.createdAt).toLocaleString() },
  ];
  if (!restores.length) return <EmptyState title="Nenhum restore executado" />;
  return <DataTable data={[...restores]} columns={cols} getRowKey={(r) => r.id} />;
}

function DrTab({ plans }: { plans: readonly DrPlan[] }) {
  const del = useDeletePlan();
  const drill = useRunDrill();
  const cols: DataTableColumn<DrPlan>[] = [
    { id: "slug", header: "Slug", cell: (r) => <code className="text-xs">{r.slug}</code> },
    { id: "name", header: "Nome", cell: (r) => r.name },
    { id: "rto", header: "RTO", cell: (r) => `${r.rtoMinutes} min` },
    { id: "rpo", header: "RPO", cell: (r) => `${r.rpoMinutes} min` },
    { id: "replication", header: "Replicação", cell: (r) => <StatusBadge tone="info">{r.replication}</StatusBadge> },
    { id: "failover", header: "Failover", cell: (r) => r.failover },
    {
      id: "status", header: "Status",
      cell: (r) => (
        <StatusBadge tone={r.status === "active" ? "success" : r.status === "failing" ? "danger" : "neutral"}>
          {r.status}
        </StatusBadge>
      ),
    },
    { id: "drill", header: "Último drill", cell: (r) => (r.lastDrillAt ? new Date(r.lastDrillAt).toLocaleString() : "—") },
    {
      id: "actions", header: "",
      cell: (r) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => drill.mutate({ id: r.id, status: "success" })}>
            Drill
          </Button>
          <Button size="sm" variant="ghost" onClick={() => del.mutate(r.id)}>
            Remover
          </Button>
        </div>
      ),
    },
  ];
  if (!plans.length) return <EmptyState title="Nenhum plano de DR" />;
  return <DataTable data={[...plans]} columns={cols} getRowKey={(r) => r.id} />;
}

function IntegrityTab({ checks }: { checks: readonly IntegrityCheck[] }) {
  const cols: DataTableColumn<IntegrityCheck>[] = [
    { id: "kind", header: "Verificação", cell: (r) => <StatusBadge tone="info">{r.checkKind}</StatusBadge> },
    { id: "status", header: "Status", cell: (r) => <StatusBadge tone={integrityTone(r.status)}>{r.status}</StatusBadge> },
    { id: "detail", header: "Detalhe", cell: (r) => r.detail ?? "—" },
    { id: "dur", header: "Duração", cell: (r) => (r.durationMs == null ? "—" : `${r.durationMs} ms`) },
    { id: "at", header: "Quando", cell: (r) => new Date(r.checkedAt).toLocaleString() },
  ];
  if (!checks.length) return <EmptyState title="Sem verificações registradas" />;
  return <DataTable data={[...checks]} columns={cols} getRowKey={(r) => r.id} />;
}

function SchedulesTab({
  schedules, targets, allTargets,
}: {
  schedules: readonly Schedule[];
  targets: Map<string, Target>;
  allTargets: readonly Target[];
}) {
  const del = useDeleteSchedule();
  const delTarget = useDeleteTarget();
  const byId = useMemo(() => {
    const m = new Map<string, Target>();
    for (const t of allTargets) m.set(t.id, t);
    return m;
  }, [allTargets]);
  const scheduleCols: DataTableColumn<Schedule>[] = [
    {
      id: "target", header: "Alvo",
      cell: (r) => {
        const t = byId.get(r.targetId);
        return <code className="text-xs">{t?.slug ?? r.targetId.slice(0, 8)}</code>;
      },
    },
    { id: "cron", header: "Cron", cell: (r) => <code className="text-xs">{r.cron}</code> },
    { id: "strategy", header: "Estratégia", cell: (r) => r.strategy },
    {
      id: "enabled", header: "Status",
      cell: (r) => (
        <StatusBadge tone={r.enabled ? "success" : "neutral"}>
          {r.enabled ? "ativo" : "pausado"}
        </StatusBadge>
      ),
    },
    { id: "next", header: "Próxima", cell: (r) => (r.nextRunAt ? new Date(r.nextRunAt).toLocaleString() : "—") },
    {
      id: "actions", header: "",
      cell: (r) => (
        <Button size="sm" variant="ghost" onClick={() => del.mutate(r.id)}>
          Remover
        </Button>
      ),
    },
  ];
  const targetCols: DataTableColumn<Target>[] = [
    { id: "slug", header: "Slug", cell: (r) => <code className="text-xs">{r.slug}</code> },
    { id: "name", header: "Nome", cell: (r) => r.name },
    { id: "kind", header: "Tipo", cell: (r) => <StatusBadge tone="info">{r.kind}</StatusBadge> },
    { id: "dest", header: "Destino", cell: (r) => r.destination },
    { id: "ret", header: "Retenção", cell: (r) => `${r.retentionDays} d` },
    {
      id: "enabled", header: "Status",
      cell: (r) => (
        <StatusBadge tone={r.enabled ? "success" : "neutral"}>
          {r.enabled ? "ativo" : "desativado"}
        </StatusBadge>
      ),
    },
    {
      id: "actions", header: "",
      cell: (r) => (
        <Button size="sm" variant="ghost" onClick={() => delTarget.mutate(r.id)}>
          Remover
        </Button>
      ),
    },
  ];
  void targets;
  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 text-sm font-semibold">Agendamentos</h3>
        {schedules.length === 0 ? (
          <EmptyState title="Sem agendamentos configurados" />
        ) : (
          <DataTable data={[...schedules]} columns={scheduleCols} getRowKey={(r) => r.id} />
        )}
      </section>
      <section>
        <h3 className="mb-2 text-sm font-semibold">Alvos de backup</h3>
        {allTargets.length === 0 ? (
          <EmptyState title="Nenhum alvo cadastrado" />
        ) : (
          <DataTable data={[...allTargets]} columns={targetCols} getRowKey={(r) => r.id} />
        )}
      </section>
    </div>
  );
}

function HistoryTab({ points }: { points: readonly RecoveryHistoryPoint[] }) {
  const cols: DataTableColumn<RecoveryHistoryPoint>[] = [
    { id: "at", header: "Bucket", cell: (r) => new Date(r.bucketAt).toLocaleString() },
    { id: "backups", header: "Backups", cell: (r) => r.backups },
    { id: "restores", header: "Restores", cell: (r) => r.restores },
    { id: "verified", header: "Verificados", cell: (r) => r.verified },
    { id: "failed", header: "Falhas", cell: (r) => r.failed },
    { id: "bytes", header: "Volume", cell: (r) => fmtBytes(r.bytes) },
  ];
  if (!points.length) return <EmptyState title="Sem histórico agregado" />;
  return <DataTable data={[...points]} columns={cols} getRowKey={(r) => r.id} />;
}
