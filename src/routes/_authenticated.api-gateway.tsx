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
  apiGatewaySnapshotQuery,
  useApiGatewaySnapshot,
  useCreateApiKey,
  useDeleteWebhook,
  useExportOpenApi,
  useRevokeApiKey,
  useRotateApiKey,
  type ApiEndpoint,
  type ApiKey,
  type ApiQuota,
  type ApiRateLimit,
  type ApiRequestLog,
  type ApiWebhookDelivery,
  type ApiWebhookEndpoint,
} from "@/core/api-gateway";

type TabKey =
  | "dashboard"
  | "keys"
  | "endpoints"
  | "requests"
  | "rate"
  | "quotas"
  | "webhooks"
  | "deliveries"
  | "openapi";

const TABS: readonly { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "keys", label: "API Keys" },
  { key: "endpoints", label: "Endpoints" },
  { key: "requests", label: "Requisições" },
  { key: "rate", label: "Rate Limits" },
  { key: "quotas", label: "Quotas" },
  { key: "webhooks", label: "Webhooks" },
  { key: "deliveries", label: "Entregas" },
  { key: "openapi", label: "OpenAPI" },
];

export const Route = createFileRoute("/_authenticated/api-gateway")({
  loader: ({ context }) => context.queryClient.ensureQueryData(apiGatewaySnapshotQuery()),
  head: () => ({
    meta: [
      { title: "API Gateway Enterprise — Dioris Hub" },
      {
        name: "description",
        content:
          "Gateway único de APIs da Dioris Hub — API Keys, rate limits, quotas, OpenAPI, webhooks e auditoria.",
      },
      { property: "og:title", content: "API Gateway — Dioris Hub" },
      {
        property: "og:description",
        content: "Porta oficial de entrada e saída de todas as APIs da plataforma.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ApiGatewayPage,
});

function statusTone(code: number): StatusTone {
  if (code >= 500) return "danger";
  if (code >= 400) return "warning";
  if (code >= 300) return "info";
  return "success";
}

function ApiGatewayPage() {
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [revealed, setRevealed] = useState<string | null>(null);
  const snapshot = useApiGatewaySnapshot();
  const create = useCreateApiKey();
  const exportSpec = useExportOpenApi();
  const data = snapshot.data;

  const successRate =
    data.requests.length === 0
      ? 100
      : Math.round(
          (data.requests.filter((r) => r.status < 400).length / data.requests.length) * 100,
        );

  return (
    <PageContainer>
      <PageHeader
        title="API Gateway Enterprise"
        description="Porta oficial de entrada/saída de APIs — Keys, rate limits, quotas, OpenAPI, webhooks e auditoria."
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={async () => {
                const res = await create.mutateAsync({
                  name: `Key ${new Date().toISOString().slice(0, 16)}`,
                  scopes: [],
                  allowedIps: [],
                });
                setRevealed(res.secret);
              }}
            >
              Nova API Key
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const res = await exportSpec.mutateAsync("json");
                const blob = new Blob([res.content], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "openapi.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Exportar OpenAPI
            </Button>
          </div>
        }
      />

      {revealed && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
          <div className="mb-1 font-medium">Copie e guarde este segredo. Ele não será mostrado novamente.</div>
          <code className="break-all rounded bg-background px-2 py-1 text-xs">{revealed}</code>
          <Button size="sm" variant="ghost" className="ml-2" onClick={() => setRevealed(null)}>
            Ok
          </Button>
        </div>
      )}

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
          <MetricCard label="API Keys" value={String(data.keys.length)} />
          <MetricCard
            label="Ativas"
            value={String(data.keys.filter((k) => k.status === "active").length)}
          />
          <MetricCard label="Endpoints" value={String(data.endpoints.length)} />
          <MetricCard label="Requisições" value={String(data.requests.length)} />
          <MetricCard label="Sucesso" value={`${successRate}%`} />
          <MetricCard label="Rate limits" value={String(data.rateLimits.length)} />
          <MetricCard label="Quotas" value={String(data.quotas.length)} />
          <MetricCard label="Webhooks" value={String(data.webhooks.length)} />
        </div>
      )}

      {tab === "keys" && <KeysTab data={data.keys} />}
      {tab === "endpoints" && <EndpointsTab data={data.endpoints} />}
      {tab === "requests" && <RequestsTab data={data.requests} />}
      {tab === "rate" && <RateLimitTab data={data.rateLimits} />}
      {tab === "quotas" && <QuotasTab data={data.quotas} />}
      {tab === "webhooks" && <WebhooksTab data={data.webhooks} />}
      {tab === "deliveries" && <DeliveriesTab data={data.deliveries} />}
      {tab === "openapi" && (
        <EmptyState
          title="OpenAPI 3.1"
          description="Use o botão 'Exportar OpenAPI' para baixar a especificação. Um endpoint público está disponível em /api/public/v1/openapi."
        />
      )}
    </PageContainer>
  );

  function statusToneKey(k: ApiKey["status"]): StatusTone {
    return k === "active" ? "success" : k === "expired" ? "warning" : "danger";
  }

  function KeysTab({ data }: { data: readonly ApiKey[] }) {
    const revoke = useRevokeApiKey();
    const rotate = useRotateApiKey();
    const cols: DataTableColumn<ApiKey>[] = [
      { id: "name", header: "Nome", cell: (r) => r.name },
      { id: "prefix", header: "Prefixo", cell: (r) => <code className="text-xs">{r.prefix}</code> },
      {
        id: "status",
        header: "Status",
        cell: (r) => <StatusBadge tone={statusToneKey(r.status)}>{r.status}</StatusBadge>,
      },
      { id: "scopes", header: "Escopos", cell: (r) => r.scopes.join(", ") || "—" },
      {
        id: "last",
        header: "Último uso",
        cell: (r) => (r.lastUsedAt ? new Date(r.lastUsedAt).toLocaleString() : "—"),
      },
      {
        id: "actions",
        header: "Ações",
        cell: (r) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const res = await rotate.mutateAsync(r.id);
                setRevealed(res.secret);
              }}
            >
              Rotacionar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => revoke.mutate(r.id)}>
              Revogar
            </Button>
          </div>
        ),
      },
    ];
    if (!data.length) return <EmptyState title="Nenhuma API Key" description="Crie sua primeira chave." />;
    return <DataTable data={[...data]} columns={cols} getRowKey={(r) => r.id} />;
  }
}

function EndpointsTab({ data }: { data: readonly ApiEndpoint[] }) {
  const cols: DataTableColumn<ApiEndpoint>[] = [
    { id: "v", header: "Versão", cell: (r) => r.version },
    { id: "method", header: "Método", cell: (r) => r.method },
    { id: "path", header: "Path", cell: (r) => <code className="text-xs">{r.path}</code> },
    { id: "module", header: "Módulo", cell: (r) => r.module },
    {
      id: "public",
      header: "Público",
      cell: (r) => (
        <StatusBadge tone={r.public ? "success" : "neutral"}>{r.public ? "Sim" : "Não"}</StatusBadge>
      ),
    },
    {
      id: "dep",
      header: "Deprecado",
      cell: (r) => (
        <StatusBadge tone={r.deprecated ? "warning" : "neutral"}>{r.deprecated ? "Sim" : "Não"}</StatusBadge>
      ),
    },
  ];
  if (!data.length) return <EmptyState title="Nenhum endpoint registrado" />;
  return <DataTable data={[...data]} columns={cols} getRowKey={(r) => r.id} />;
}

function RequestsTab({ data }: { data: readonly ApiRequestLog[] }) {
  const cols: DataTableColumn<ApiRequestLog>[] = [
    { id: "when", header: "Quando", cell: (r) => new Date(r.createdAt).toLocaleString() },
    { id: "method", header: "Método", cell: (r) => r.method },
    { id: "path", header: "Path", cell: (r) => <code className="text-xs">{r.path}</code> },
    {
      id: "status",
      header: "Status",
      cell: (r) => <StatusBadge tone={statusTone(r.status)}>{r.status}</StatusBadge>,
    },
    { id: "dur", header: "Duração", cell: (r) => `${r.durationMs} ms` },
    { id: "ip", header: "IP", cell: (r) => r.ip ?? "—" },
  ];
  if (!data.length) return <EmptyState title="Sem requisições" />;
  return <DataTable data={[...data]} columns={cols} getRowKey={(r) => r.id} />;
}

function RateLimitTab({ data }: { data: readonly ApiRateLimit[] }) {
  const cols: DataTableColumn<ApiRateLimit>[] = [
    { id: "scope", header: "Escopo", cell: (r) => r.scope },
    { id: "key", header: "Chave", cell: (r) => <code className="text-xs">{r.scopeKey}</code> },
    { id: "w", header: "Janela (s)", cell: (r) => r.windowSeconds },
    { id: "m", header: "Máx.", cell: (r) => r.maxRequests },
  ];
  if (!data.length)
    return <EmptyState title="Nenhum rate limit configurado" description="Usando limite padrão: 120 req/min." />;
  return <DataTable data={[...data]} columns={cols} getRowKey={(r) => r.id} />;
}

function QuotasTab({ data }: { data: readonly ApiQuota[] }) {
  const cols: DataTableColumn<ApiQuota>[] = [
    { id: "p", header: "Período", cell: (r) => r.period },
    { id: "used", header: "Consumido", cell: (r) => `${r.used}/${r.maxRequests}` },
    { id: "reset", header: "Reseta em", cell: (r) => new Date(r.resetsAt).toLocaleString() },
  ];
  if (!data.length) return <EmptyState title="Nenhuma quota configurada" />;
  return <DataTable data={[...data]} columns={cols} getRowKey={(r) => r.id} />;
}

function WebhooksTab({ data }: { data: readonly ApiWebhookEndpoint[] }) {
  const del = useDeleteWebhook();
  const cols: DataTableColumn<ApiWebhookEndpoint>[] = [
    { id: "name", header: "Nome", cell: (r) => r.name },
    { id: "url", header: "URL", cell: (r) => <code className="text-xs break-all">{r.url}</code> },
    { id: "events", header: "Eventos", cell: (r) => r.events.join(", ") || "*" },
    {
      id: "active",
      header: "Ativo",
      cell: (r) => (
        <StatusBadge tone={r.active ? "success" : "neutral"}>{r.active ? "Sim" : "Não"}</StatusBadge>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: (r) => (
        <Button size="sm" variant="ghost" onClick={() => del.mutate(r.id)}>
          Remover
        </Button>
      ),
    },
  ];
  if (!data.length) return <EmptyState title="Nenhum webhook configurado" />;
  return <DataTable data={[...data]} columns={cols} getRowKey={(r) => r.id} />;
}

function DeliveriesTab({ data }: { data: readonly ApiWebhookDelivery[] }) {
  const cols: DataTableColumn<ApiWebhookDelivery>[] = [
    { id: "event", header: "Evento", cell: (r) => r.event },
    {
      id: "status",
      header: "Status",
      cell: (r) => (
        <StatusBadge
          tone={
            r.status === "delivered" ? "success" : r.status === "pending" ? "info" : r.status === "failed" ? "warning" : "danger"
          }
        >
          {r.status}
        </StatusBadge>
      ),
    },
    { id: "attempts", header: "Tentativas", cell: (r) => r.attempts },
    { id: "code", header: "HTTP", cell: (r) => r.statusCode ?? "—" },
    { id: "when", header: "Data", cell: (r) => new Date(r.createdAt).toLocaleString() },
  ];
  if (!data.length) return <EmptyState title="Sem entregas" />;
  return <DataTable data={[...data]} columns={cols} getRowKey={(r) => r.id} />;
}