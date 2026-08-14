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
  cicdSnapshotQuery,
  useCicdSnapshot,
  useDecideApproval,
  useDeleteEnvironment,
  useDeletePipeline,
  useDeleteRelease,
  useRollbackDeploy,
  type Approval,
  type Artifact,
  type Build,
  type BuildStatus,
  type CicdHistoryPoint,
  type Deploy,
  type DeployStatus,
  type Environment,
  type Pipeline,
  type Release,
} from "@/core/cicd";

type TabKey =
  | "dashboard"
  | "pipelines"
  | "builds"
  | "deploys"
  | "releases"
  | "artifacts"
  | "environments"
  | "history";

const TABS: readonly { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "pipelines", label: "Pipelines" },
  { key: "builds", label: "Builds" },
  { key: "deploys", label: "Deploys" },
  { key: "releases", label: "Releases" },
  { key: "artifacts", label: "Artefatos" },
  { key: "environments", label: "Ambientes" },
  { key: "history", label: "Histórico" },
];

export const Route = createFileRoute("/_authenticated/cicd")({
  loader: ({ context }) => context.queryClient.ensureQueryData(cicdSnapshotQuery()),
  head: () => ({
    meta: [
      { title: "CI/CD Enterprise — Dioris Hub" },
      {
        name: "description",
        content:
          "CIManager central da Dioris — pipelines, builds, deploys, releases, artefatos, ambientes e aprovações para todos os módulos.",
      },
      { property: "og:title", content: "CI/CD Enterprise — Dioris Hub" },
      {
        property: "og:description",
        content:
          "Infraestrutura única de entrega contínua reutilizada por Planner, Creator, CRM, Financeiro, Marketplace, Automação e IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CicdPage,
});

function buildTone(s: BuildStatus): StatusTone {
  switch (s) {
    case "passed":
      return "success";
    case "failed":
      return "danger";
    case "cancelled":
    case "skipped":
      return "warning";
    case "running":
    case "queued":
      return "info";
    default:
      return "neutral";
  }
}

function deployTone(s: DeployStatus): StatusTone {
  switch (s) {
    case "succeeded":
      return "success";
    case "failed":
      return "danger";
    case "cancelled":
    case "rolled_back":
      return "warning";
    case "running":
    case "queued":
      return "info";
    default:
      return "neutral";
  }
}

function CicdPage() {
  const { data } = useCicdSnapshot();
  const [tab, setTab] = useState<TabKey>("dashboard");
  const pendingApprovals = useMemo(
    () => data.approvals.filter((a) => a.status === "pending"),
    [data.approvals],
  );

  return (
    <PageContainer>
      <PageHeader
        title="CI/CD Enterprise"
        description="CIManager único da Dioris — pipelines, builds, deploys, releases, artefatos e ambientes com integração ao Quality, Security, Observability, Jobs, Notifications, SDK, API Gateway e Event Center."
      />

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm ${
              tab === t.key ? "border-b-2 border-primary font-semibold" : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <DashboardTab data={data} approvals={pendingApprovals} />}
      {tab === "pipelines" && <PipelinesTab pipelines={data.pipelines} />}
      {tab === "builds" && <BuildsTab builds={data.builds} />}
      {tab === "deploys" && <DeploysTab deploys={data.deploys} />}
      {tab === "releases" && <ReleasesTab releases={data.releases} />}
      {tab === "artifacts" && <ArtifactsTab artifacts={data.artifacts} />}
      {tab === "environments" && <EnvironmentsTab environments={data.environments} />}
      {tab === "history" && <HistoryTab points={data.history} />}
    </PageContainer>
  );
}

function DashboardTab({
  data,
  approvals,
}: {
  data: ReturnType<typeof useCicdSnapshot>["data"];
  approvals: Approval[];
}) {
  const decide = useDecideApproval();
  const approvalCols: DataTableColumn<Approval>[] = [
    {
      id: "deploy",
      header: "Deploy",
      cell: (r) => <code className="text-xs">{r.deployId.slice(0, 8)}</code>,
    },
    {
      id: "status",
      header: "Status",
      cell: (r) => <StatusBadge tone="warning">{r.status}</StatusBadge>,
    },
    { id: "at", header: "Solicitado", cell: (r) => new Date(r.createdAt).toLocaleString() },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <div className="flex gap-1">
          <Button size="sm" onClick={() => decide.mutate({ id: r.id, status: "approved" })}>
            Aprovar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => decide.mutate({ id: r.id, status: "rejected" })}
          >
            Rejeitar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Pipelines" value={String(data.health.totalPipelines)} />
        <MetricCard label="Ativos" value={String(data.health.enabledPipelines)} />
        <MetricCard label="Builds" value={String(data.health.totalBuilds)} />
        <MetricCard label="Build success" value={`${data.health.buildSuccessRate}%`} />
        <MetricCard label="Deploys" value={String(data.health.totalDeploys)} />
        <MetricCard label="Deploy success" value={`${data.health.deploySuccessRate}%`} />
        <MetricCard label="Ambientes" value={String(data.health.activeEnvironments)} />
        <MetricCard label="Aprovações pendentes" value={String(data.health.pendingApprovals)} />
      </div>
      <section>
        <h3 className="mb-2 text-sm font-semibold">Aprovações pendentes</h3>
        {approvals.length === 0 ? (
          <EmptyState title="Sem aprovações pendentes" />
        ) : (
          <DataTable data={[...approvals]} columns={approvalCols} getRowKey={(r) => r.id} />
        )}
      </section>
    </div>
  );
}

function PipelinesTab({ pipelines }: { pipelines: readonly Pipeline[] }) {
  const del = useDeletePipeline();
  const cols: DataTableColumn<Pipeline>[] = [
    { id: "slug", header: "Slug", cell: (r) => <code className="text-xs">{r.slug}</code> },
    { id: "name", header: "Nome", cell: (r) => r.name },
    {
      id: "provider",
      header: "Provider",
      cell: (r) => <StatusBadge tone="info">{r.provider}</StatusBadge>,
    },
    { id: "module", header: "Módulo", cell: (r) => r.module ?? "—" },
    { id: "stages", header: "Estágios", cell: (r) => r.stages.length },
    {
      id: "enabled",
      header: "Status",
      cell: (r) => (
        <StatusBadge tone={r.enabled ? "success" : "neutral"}>
          {r.enabled ? "ativa" : "desativada"}
        </StatusBadge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <Button size="sm" variant="ghost" onClick={() => del.mutate(r.id)}>
          Remover
        </Button>
      ),
    },
  ];
  if (!pipelines.length) return <EmptyState title="Nenhum pipeline configurado" />;
  return <DataTable data={[...pipelines]} columns={cols} getRowKey={(r) => r.id} />;
}

function BuildsTab({ builds }: { builds: readonly Build[] }) {
  const cols: DataTableColumn<Build>[] = [
    {
      id: "slug",
      header: "Pipeline",
      cell: (r) => <code className="text-xs">{r.pipelineSlug}</code>,
    },
    { id: "version", header: "Versão", cell: (r) => r.version ?? "—" },
    { id: "branch", header: "Branch", cell: (r) => r.branch ?? "—" },
    { id: "trigger", header: "Origem", cell: (r) => r.trigger },
    {
      id: "status",
      header: "Status",
      cell: (r) => <StatusBadge tone={buildTone(r.status)}>{r.status}</StatusBadge>,
    },
    {
      id: "dur",
      header: "Duração",
      cell: (r) => (r.durationMs == null ? "—" : `${r.durationMs} ms`),
    },
    { id: "at", header: "Quando", cell: (r) => new Date(r.createdAt).toLocaleString() },
  ];
  if (!builds.length) return <EmptyState title="Sem builds registrados" />;
  return <DataTable data={[...builds]} columns={cols} getRowKey={(r) => r.id} />;
}

function DeploysTab({ deploys }: { deploys: readonly Deploy[] }) {
  const rollback = useRollbackDeploy();
  const cols: DataTableColumn<Deploy>[] = [
    {
      id: "env",
      header: "Ambiente",
      cell: (r) => <code className="text-xs">{r.environmentSlug}</code>,
    },
    { id: "version", header: "Versão", cell: (r) => r.version ?? "—" },
    { id: "strategy", header: "Estratégia", cell: (r) => r.strategy },
    {
      id: "status",
      header: "Status",
      cell: (r) => <StatusBadge tone={deployTone(r.status)}>{r.status}</StatusBadge>,
    },
    {
      id: "dur",
      header: "Duração",
      cell: (r) => (r.durationMs == null ? "—" : `${r.durationMs} ms`),
    },
    { id: "at", header: "Quando", cell: (r) => new Date(r.createdAt).toLocaleString() },
    {
      id: "actions",
      header: "",
      cell: (r) =>
        r.status === "succeeded" ? (
          <Button size="sm" variant="ghost" onClick={() => rollback.mutate(r.id)}>
            Rollback
          </Button>
        ) : null,
    },
  ];
  if (!deploys.length) return <EmptyState title="Sem deploys registrados" />;
  return <DataTable data={[...deploys]} columns={cols} getRowKey={(r) => r.id} />;
}

function ReleasesTab({ releases }: { releases: readonly Release[] }) {
  const del = useDeleteRelease();
  const cols: DataTableColumn<Release>[] = [
    { id: "version", header: "Versão", cell: (r) => <code className="text-xs">{r.version}</code> },
    {
      id: "channel",
      header: "Canal",
      cell: (r) => <StatusBadge tone="info">{r.channel}</StatusBadge>,
    },
    { id: "tag", header: "Tag", cell: (r) => r.tag ?? "—" },
    {
      id: "published",
      header: "Publicado",
      cell: (r) => (r.publishedAt ? new Date(r.publishedAt).toLocaleString() : "—"),
    },
    { id: "at", header: "Criado", cell: (r) => new Date(r.createdAt).toLocaleString() },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <Button size="sm" variant="ghost" onClick={() => del.mutate(r.id)}>
          Remover
        </Button>
      ),
    },
  ];
  if (!releases.length) return <EmptyState title="Sem releases publicados" />;
  return <DataTable data={[...releases]} columns={cols} getRowKey={(r) => r.id} />;
}

function ArtifactsTab({ artifacts }: { artifacts: readonly Artifact[] }) {
  const cols: DataTableColumn<Artifact>[] = [
    { id: "kind", header: "Tipo", cell: (r) => <StatusBadge tone="info">{r.kind}</StatusBadge> },
    { id: "name", header: "Nome", cell: (r) => r.name },
    {
      id: "size",
      header: "Tamanho",
      cell: (r) => (r.sizeBytes == null ? "—" : `${r.sizeBytes} B`),
    },
    { id: "checksum", header: "Checksum", cell: (r) => r.checksum ?? "—" },
    { id: "at", header: "Quando", cell: (r) => new Date(r.createdAt).toLocaleString() },
  ];
  if (!artifacts.length) return <EmptyState title="Sem artefatos registrados" />;
  return <DataTable data={[...artifacts]} columns={cols} getRowKey={(r) => r.id} />;
}

function EnvironmentsTab({ environments }: { environments: readonly Environment[] }) {
  const del = useDeleteEnvironment();
  const cols: DataTableColumn<Environment>[] = [
    { id: "slug", header: "Slug", cell: (r) => <code className="text-xs">{r.slug}</code> },
    { id: "name", header: "Nome", cell: (r) => r.name },
    { id: "kind", header: "Tipo", cell: (r) => <StatusBadge tone="info">{r.kind}</StatusBadge> },
    { id: "url", header: "URL", cell: (r) => r.url ?? "—" },
    {
      id: "protected",
      header: "Protegido",
      cell: (r) => (
        <StatusBadge tone={r.protected ? "warning" : "neutral"}>
          {r.protected ? "sim" : "não"}
        </StatusBadge>
      ),
    },
    {
      id: "approval",
      header: "Aprovação",
      cell: (r) => (
        <StatusBadge tone={r.requiresApproval ? "warning" : "neutral"}>
          {r.requiresApproval ? "requer" : "livre"}
        </StatusBadge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <Button size="sm" variant="ghost" onClick={() => del.mutate(r.id)}>
          Remover
        </Button>
      ),
    },
  ];
  if (!environments.length) return <EmptyState title="Nenhum ambiente cadastrado" />;
  return <DataTable data={[...environments]} columns={cols} getRowKey={(r) => r.id} />;
}

function HistoryTab({ points }: { points: readonly CicdHistoryPoint[] }) {
  const cols: DataTableColumn<CicdHistoryPoint>[] = [
    { id: "at", header: "Bucket", cell: (r) => new Date(r.bucketAt).toLocaleString() },
    { id: "builds", header: "Builds", cell: (r) => r.builds },
    { id: "deploys", header: "Deploys", cell: (r) => r.deploys },
    { id: "rollbacks", header: "Rollbacks", cell: (r) => r.rollbacks },
    { id: "failed", header: "Falhas", cell: (r) => r.failed },
    {
      id: "dur",
      header: "Duração média",
      cell: (r) => (r.avgDurationMs == null ? "—" : `${r.avgDurationMs} ms`),
    },
  ];
  if (!points.length) return <EmptyState title="Sem histórico agregado" />;
  return <DataTable data={[...points]} columns={cols} getRowKey={(r) => r.id} />;
}
