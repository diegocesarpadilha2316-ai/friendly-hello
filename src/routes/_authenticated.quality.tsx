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
  qualitySnapshotQuery,
  useDeleteGate,
  useDeleteSuite,
  useQualitySnapshot,
  useRecordRun,
  type GateStatus,
  type QualityCase,
  type QualityCoverage,
  type QualityGate,
  type QualityHistoryPoint,
  type QualityRun,
  type QualitySuite,
  type RunStatus,
} from "@/core/quality";

type TabKey =
  | "dashboard"
  | "coverage"
  | "tests"
  | "build"
  | "performance"
  | "security"
  | "regression"
  | "history";

const TABS: readonly { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "coverage", label: "Cobertura" },
  { key: "tests", label: "Testes" },
  { key: "build", label: "Build" },
  { key: "performance", label: "Performance" },
  { key: "security", label: "Segurança" },
  { key: "regression", label: "Regressão" },
  { key: "history", label: "Histórico" },
];

export const Route = createFileRoute("/_authenticated/quality")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qualitySnapshotQuery()),
  head: () => ({
    meta: [
      { title: "Qualidade Enterprise — Dioris Hub" },
      {
        name: "description",
        content:
          "TestManager central da Dioris — suites, execuções, cobertura, quality gates, performance e segurança para todos os módulos.",
      },
      { property: "og:title", content: "Qualidade Enterprise — Dioris Hub" },
      {
        property: "og:description",
        content:
          "Camada única de qualidade reutilizada por Planner, Creator, CRM, Financeiro, Marketplace, Automação e IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QualityPage,
});

function runTone(s: RunStatus): StatusTone {
  switch (s) {
    case "passed":
      return "success";
    case "failed":
    case "error":
      return "danger";
    case "cancelled":
      return "warning";
    case "running":
    case "queued":
      return "info";
    default:
      return "neutral";
  }
}

function gateTone(s: GateStatus): StatusTone {
  switch (s) {
    case "pass":
      return "success";
    case "fail":
      return "danger";
    case "warn":
      return "warning";
    default:
      return "neutral";
  }
}

function QualityPage() {
  const { data } = useQualitySnapshot();
  const [tab, setTab] = useState<TabKey>("dashboard");

  const gatesByCategory = useMemo(() => {
    const map = new Map<QualityGate["category"], QualityGate[]>();
    for (const g of data.gates) {
      const list = map.get(g.category) ?? [];
      list.push(g);
      map.set(g.category, list);
    }
    return map;
  }, [data.gates]);

  const smokeRun = useRecordRun();

  return (
    <PageContainer>
      <PageHeader
        title="Qualidade Enterprise"
        description="TestManager único da Dioris — suites, execuções, cobertura, quality gates e integrações com Observability, Jobs, Notifications, SDK, API Gateway, Security e Event Center."
        actions={
          <Button
            size="sm"
            onClick={() =>
              smokeRun.mutate({
                suiteSlug: "platform.smoke",
                trigger: "manual",
                status: "passed",
                durationMs: 120,
                coveragePct: 100,
                cases: [{ name: "hub responde", status: "passed", durationMs: 120 }],
              })
            }
            disabled={smokeRun.isPending}
          >
            Registrar smoke test
          </Button>
        }
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
      {tab === "coverage" && <CoverageTab data={data.coverage} />}
      {tab === "tests" && (
        <TestsTab suites={data.suites} runs={data.runs} cases={data.cases} />
      )}
      {tab === "build" && (
        <GatesTab
          gates={[
            ...(gatesByCategory.get("typescript") ?? []),
            ...(gatesByCategory.get("eslint") ?? []),
            ...(gatesByCategory.get("build") ?? []),
            ...(gatesByCategory.get("imports") ?? []),
            ...(gatesByCategory.get("circular") ?? []),
            ...(gatesByCategory.get("duplication") ?? []),
            ...(gatesByCategory.get("dead_code") ?? []),
            ...(gatesByCategory.get("complexity") ?? []),
          ]}
          empty="Sem quality gates de build configurados"
        />
      )}
      {tab === "performance" && (
        <GatesTab
          gates={gatesByCategory.get("performance") ?? []}
          empty="Sem quality gates de performance"
        />
      )}
      {tab === "security" && (
        <GatesTab
          gates={gatesByCategory.get("security") ?? []}
          empty="Sem quality gates de segurança"
        />
      )}
      {tab === "regression" && (
        <RegressionTab
          runs={data.runs.filter(
            (r) => r.trigger === "regression" || r.suiteSlug.includes("regression"),
          )}
        />
      )}
      {tab === "history" && <HistoryTab points={data.history} />}
    </PageContainer>
  );
}

function DashboardTab({ data }: { data: ReturnType<typeof useQualitySnapshot>["data"] }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <MetricCard label="Suites" value={String(data.health.totalSuites)} />
      <MetricCard label="Ativas" value={String(data.health.enabledSuites)} />
      <MetricCard label="Execuções" value={String(data.health.totalRuns)} />
      <MetricCard label="Pass rate" value={`${data.health.passRate}%`} />
      <MetricCard label="Cobertura" value={`${data.health.coveragePct}%`} />
      <MetricCard label="Duração média" value={`${data.health.avgDurationMs} ms`} />
      <MetricCard label="Gates OK" value={String(data.health.gatesPass)} />
      <MetricCard label="Gates falhando" value={String(data.health.gatesFail)} />
    </div>
  );
}

function TestsTab({
  suites,
  runs,
  cases,
}: {
  suites: readonly QualitySuite[];
  runs: readonly QualityRun[];
  cases: readonly QualityCase[];
}) {
  const del = useDeleteSuite();
  const suiteCols: DataTableColumn<QualitySuite>[] = [
    { id: "slug", header: "Slug", cell: (r) => <code className="text-xs">{r.slug}</code> },
    { id: "name", header: "Nome", cell: (r) => r.name },
    { id: "kind", header: "Tipo", cell: (r) => <StatusBadge tone="info">{r.kind}</StatusBadge> },
    { id: "runner", header: "Runner", cell: (r) => r.runner },
    { id: "target", header: "Módulo", cell: (r) => r.targetModule ?? "—" },
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

  const runCols: DataTableColumn<QualityRun>[] = [
    { id: "slug", header: "Suite", cell: (r) => <code className="text-xs">{r.suiteSlug}</code> },
    { id: "trigger", header: "Origem", cell: (r) => r.trigger },
    {
      id: "status",
      header: "Status",
      cell: (r) => <StatusBadge tone={runTone(r.status)}>{r.status}</StatusBadge>,
    },
    { id: "totals", header: "P/F/S", cell: (r) => `${r.passed}/${r.failed}/${r.skipped}` },
    { id: "cov", header: "Cobertura", cell: (r) => (r.coveragePct == null ? "—" : `${r.coveragePct}%`) },
    { id: "dur", header: "Duração", cell: (r) => (r.durationMs == null ? "—" : `${r.durationMs} ms`) },
    { id: "at", header: "Quando", cell: (r) => new Date(r.createdAt).toLocaleString() },
  ];

  const caseCols: DataTableColumn<QualityCase>[] = [
    { id: "name", header: "Caso", cell: (r) => r.name },
    { id: "file", header: "Arquivo", cell: (r) => r.file ?? "—" },
    {
      id: "status",
      header: "Status",
      cell: (r) => (
        <StatusBadge
          tone={
            r.status === "passed"
              ? "success"
              : r.status === "failed"
                ? "danger"
                : r.status === "skipped"
                  ? "warning"
                  : "neutral"
          }
        >
          {r.status}
        </StatusBadge>
      ),
    },
    { id: "dur", header: "ms", cell: (r) => r.durationMs ?? "—" },
    { id: "error", header: "Erro", cell: (r) => r.error ?? "—" },
  ];

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 text-sm font-semibold">Suites</h3>
        {suites.length === 0 ? (
          <EmptyState title="Nenhuma suite cadastrada" />
        ) : (
          <DataTable data={[...suites]} columns={suiteCols} getRowKey={(r) => r.id} />
        )}
      </section>
      <section>
        <h3 className="mb-2 text-sm font-semibold">Execuções recentes</h3>
        {runs.length === 0 ? (
          <EmptyState title="Sem execuções registradas" />
        ) : (
          <DataTable data={[...runs]} columns={runCols} getRowKey={(r) => r.id} />
        )}
      </section>
      <section>
        <h3 className="mb-2 text-sm font-semibold">Casos</h3>
        {cases.length === 0 ? (
          <EmptyState title="Sem casos registrados" />
        ) : (
          <DataTable data={[...cases]} columns={caseCols} getRowKey={(r) => r.id} />
        )}
      </section>
    </div>
  );
}

function CoverageTab({ data }: { data: readonly QualityCoverage[] }) {
  const cols: DataTableColumn<QualityCoverage>[] = [
    { id: "scope", header: "Escopo", cell: (r) => <StatusBadge tone="info">{r.scope}</StatusBadge> },
    { id: "target", header: "Alvo", cell: (r) => <code className="text-xs">{r.target}</code> },
    { id: "lines", header: "Linhas", cell: (r) => `${r.linesPct}%` },
    { id: "branches", header: "Branches", cell: (r) => `${r.branchesPct}%` },
    { id: "functions", header: "Funções", cell: (r) => `${r.functionsPct}%` },
    { id: "statements", header: "Statements", cell: (r) => `${r.statementsPct}%` },
    { id: "at", header: "Quando", cell: (r) => new Date(r.createdAt).toLocaleString() },
  ];
  if (!data.length) return <EmptyState title="Sem cobertura registrada" />;
  return <DataTable data={[...data]} columns={cols} getRowKey={(r) => r.id} />;
}

function GatesTab({
  gates,
  empty,
}: {
  gates: readonly QualityGate[];
  empty: string;
}) {
  const del = useDeleteGate();
  const cols: DataTableColumn<QualityGate>[] = [
    { id: "slug", header: "Slug", cell: (r) => <code className="text-xs">{r.slug}</code> },
    { id: "name", header: "Nome", cell: (r) => r.name },
    { id: "cat", header: "Categoria", cell: (r) => r.category },
    {
      id: "status",
      header: "Status",
      cell: (r) => <StatusBadge tone={gateTone(r.status)}>{r.status}</StatusBadge>,
    },
    { id: "val", header: "Valor", cell: (r) => (r.value == null ? "—" : r.value) },
    { id: "thr", header: "Limite", cell: (r) => (r.threshold == null ? "—" : r.threshold) },
    { id: "msg", header: "Mensagem", cell: (r) => r.message ?? "—" },
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
  if (!gates.length) return <EmptyState title={empty} />;
  return <DataTable data={[...gates]} columns={cols} getRowKey={(r) => r.id} />;
}

function RegressionTab({ runs }: { runs: readonly QualityRun[] }) {
  const cols: DataTableColumn<QualityRun>[] = [
    { id: "slug", header: "Suite", cell: (r) => <code className="text-xs">{r.suiteSlug}</code> },
    {
      id: "status",
      header: "Status",
      cell: (r) => <StatusBadge tone={runTone(r.status)}>{r.status}</StatusBadge>,
    },
    { id: "totals", header: "P/F/S", cell: (r) => `${r.passed}/${r.failed}/${r.skipped}` },
    { id: "dur", header: "Duração", cell: (r) => (r.durationMs == null ? "—" : `${r.durationMs} ms`) },
    { id: "at", header: "Quando", cell: (r) => new Date(r.createdAt).toLocaleString() },
  ];
  if (!runs.length) return <EmptyState title="Sem execuções de regressão" />;
  return <DataTable data={[...runs]} columns={cols} getRowKey={(r) => r.id} />;
}

function HistoryTab({ points }: { points: readonly QualityHistoryPoint[] }) {
  const cols: DataTableColumn<QualityHistoryPoint>[] = [
    { id: "at", header: "Bucket", cell: (r) => new Date(r.bucketAt).toLocaleString() },
    { id: "runs", header: "Execuções", cell: (r) => r.runs },
    { id: "passed", header: "Passou", cell: (r) => r.passed },
    { id: "failed", header: "Falhou", cell: (r) => r.failed },
    { id: "cov", header: "Cobertura", cell: (r) => (r.coveragePct == null ? "—" : `${r.coveragePct}%`) },
    { id: "gp", header: "Gates OK", cell: (r) => r.gatesPass },
    { id: "gf", header: "Gates fail", cell: (r) => r.gatesFail },
  ];
  if (!points.length) return <EmptyState title="Sem histórico agregado" />;
  return <DataTable data={[...points]} columns={cols} getRowKey={(r) => r.id} />;
}