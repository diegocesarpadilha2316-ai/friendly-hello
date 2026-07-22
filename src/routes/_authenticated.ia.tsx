import { createFileRoute } from "@tanstack/react-router";
import {
  PageContainer,
  PageHeader,
  StatusBadge,
  MetricCard,
  DataTable,
  type DataTableColumn,
} from "@/core/components/ui-kit";
import { useAIHealth, useAIMetrics, useAIModels } from "@/core/ai";
import type { AIModel, AIProviderHealth } from "@/core/ai";

export const Route = createFileRoute("/_authenticated/ia")({
  head: () => ({
    meta: [
      { title: "IA Gateway — Dioris Hub" },
      { name: "description", content: "Painel do Gateway Central de IA da Dioris Hub — providers, saúde, uso e catálogo de modelos." },
      { property: "og:title", content: "IA Gateway — Dioris Hub" },
      { property: "og:description", content: "Painel do Gateway Central de IA — providers, saúde e uso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IaPage,
});

const STATUS_TONE = {
  healthy: "success",
  degraded: "warning",
  down: "danger",
  unknown: "neutral",
} as const;

function IaPage() {
  const health = useAIHealth();
  const metrics = useAIMetrics();
  const models = useAIModels();

  const healthCols: DataTableColumn<AIProviderHealth>[] = [
    { id: "provider", header: "Provider", cell: (r) => r.provider },
    {
      id: "status",
      header: "Status",
      cell: (r) => <StatusBadge tone={STATUS_TONE[r.status]}>{r.status}</StatusBadge>,
    },
    { id: "latencyMs", header: "Latência (ms)", cell: (r) => r.latencyMs ?? "—" },
    { id: "message", header: "Mensagem", cell: (r) => r.message ?? "—" },
  ];

  const modelCols: DataTableColumn<AIModel>[] = [
    { id: "id", header: "Model ID", cell: (r) => r.id },
    { id: "provider", header: "Provider", cell: (r) => r.provider },
    { id: "quality", header: "Qualidade", cell: (r) => r.quality },
    { id: "speed", header: "Velocidade", cell: (r) => r.speed },
    { id: "cost", header: "Custo", cell: (r) => r.cost },
    { id: "capabilities", header: "Capabilities", cell: (r) => r.capabilities.join(", ") },
    {
      id: "enabled",
      header: "Ativo",
      cell: (r) => (
        <StatusBadge tone={r.enabled ? "success" : "neutral"}>
          {r.enabled ? "sim" : "não"}
        </StatusBadge>
      ),
    },
  ];

  const m = metrics.data;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Core"
        title="Gateway Central de IA"
        description="Ponto único de integração da plataforma com qualquer modelo de IA. Nenhum módulo acessa provedores diretamente."
        actions={<StatusBadge tone="success">operacional</StatusBadge>}
      />

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard label="Requests" value={m?.requests ?? 0} />
        <MetricCard label="Erros" value={m?.errors ?? 0} />
        <MetricCard label="Latência média (ms)" value={m?.avgLatencyMs ?? 0} />
        <MetricCard label="Créditos consumidos" value={m?.creditsSpent ?? 0} />
      </div>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">Saúde dos providers</h2>
        <DataTable
          data={(health.data ?? []) as AIProviderHealth[]}
          columns={healthCols}
          getRowKey={(r) => r.provider}
          empty="Sem dados de saúde ainda."
        />
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">Catálogo de modelos</h2>
        <DataTable
          data={(models.data?.models ?? []) as AIModel[]}
          columns={modelCols}
          getRowKey={(r) => r.id}
          empty="Nenhum modelo registrado."
        />
      </section>
    </PageContainer>
  );
}