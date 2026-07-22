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
} from "@/core/components/ui-kit";
import { Button } from "@/components/ui/button";
import {
  useIntegrationEvents,
  useIntegrationLogs,
  useIntegrationProviders,
  useIntegrationSyncs,
  useIntegrationWebhooks,
  useIntegrations,
  useIntegrationsExport,
  useIntegrationsHealth,
  useTestIntegrationConnection,
  useUpsertIntegration,
  useDeleteIntegration,
  type Integration,
  type IntegrationEvent,
  type IntegrationHealth,
  type IntegrationLog,
  type IntegrationProviderDescriptor,
  type IntegrationSyncJob,
  type IntegrationWebhook,
} from "@/core/integrations";

type TabKey =
  | "dashboard"
  | "providers"
  | "integrations"
  | "webhooks"
  | "logs"
  | "health"
  | "syncs"
  | "events";

const TABS: readonly { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "providers", label: "Providers" },
  { key: "integrations", label: "Integrações" },
  { key: "webhooks", label: "Webhooks" },
  { key: "logs", label: "Logs" },
  { key: "health", label: "Health" },
  { key: "syncs", label: "Sincronizações" },
  { key: "events", label: "Eventos" },
];

export const Route = createFileRoute("/_authenticated/integracoes")({
  head: () => ({
    meta: [
      { title: "Integrações Enterprise — Dioris Hub" },
      {
        name: "description",
        content:
          "Gateway central de integrações da Dioris Hub — OAuth, APIs, Webhooks, SDKs e conectores para todos os módulos.",
      },
      { property: "og:title", content: "Integrações Enterprise — Dioris Hub" },
      {
        property: "og:description",
        content: "OAuth, Webhooks, APIs e conectores unificados por tenant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const [tab, setTab] = useState<TabKey>("dashboard");
  const providers = useIntegrationProviders();
  const integrations = useIntegrations();
  const health = useIntegrationsHealth();
  const webhooks = useIntegrationWebhooks();
  const logs = useIntegrationLogs();
  const syncs = useIntegrationSyncs();
  const events = useIntegrationEvents();
  const exportMut = useIntegrationsExport();

  return (
    <PageContainer>
      <PageHeader
        title="Integrações Enterprise"
        description="Gateway central para OAuth, APIs, Webhooks, SDKs e conectores."
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const res = await exportMut.mutateAsync({ format: "json" });
              const blob = new Blob([res.content], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "integrations.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Exportar JSON
          </Button>
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
          <MetricCard label="Integrações" value={String(integrations.data?.length ?? 0)} />
          <MetricCard label="Webhooks" value={String(webhooks.data?.length ?? 0)} />
          <MetricCard label="Providers" value={String(providers.data?.length ?? 0)} />
          <MetricCard
            label="Eventos recentes"
            value={String(events.data?.length ?? 0)}
          />
        </div>
      )}

      {tab === "providers" && <ProvidersTab data={providers.data ?? []} />}
      {tab === "integrations" && <IntegrationsTab data={integrations.data ?? []} />}
      {tab === "webhooks" && <WebhooksTab data={webhooks.data ?? []} />}
      {tab === "logs" && <LogsTab data={logs.data ?? []} />}
      {tab === "health" && <HealthTab data={health.data ?? []} />}
      {tab === "syncs" && <SyncsTab data={syncs.data ?? []} />}
      {tab === "events" && <EventsTab data={events.data ?? []} />}
    </PageContainer>
  );
}

function ProvidersTab({ data }: { data: readonly IntegrationProviderDescriptor[] }) {
  const upsert = useUpsertIntegration();
  const columns: DataTableColumn<IntegrationProviderDescriptor>[] = [
    { key: "name", header: "Provider", accessor: (r) => r.name },
    { key: "category", header: "Categoria", accessor: (r) => r.category },
    { key: "auth", header: "Auth", accessor: (r) => r.authType },
    { key: "version", header: "Versão", accessor: (r) => r.version },
    {
      key: "actions",
      header: "Ações",
      accessor: (r) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            upsert.mutate({
              provider: r.id,
              name: r.name,
              category: r.category,
              authType: r.authType,
              status: "inactive",
            })
          }
        >
          Ativar
        </Button>
      ),
    },
  ];
  if (!data.length) return <EmptyState title="Nenhum provider disponível" />;
  return <DataTable data={data} columns={columns} getRowKey={(r) => r.id} />;
}

function IntegrationsTab({ data }: { data: readonly Integration[] }) {
  const test = useTestIntegrationConnection();
  const del = useDeleteIntegration();
  const columns: DataTableColumn<Integration>[] = [
    { key: "name", header: "Nome", accessor: (r) => r.name },
    { key: "provider", header: "Provider", accessor: (r) => r.provider },
    { key: "category", header: "Categoria", accessor: (r) => r.category },
    {
      key: "status",
      header: "Status",
      accessor: (r) => <StatusBadge label={r.status} status={r.status === "active" ? "success" : "muted"} />,
    },
    {
      key: "actions",
      header: "Ações",
      accessor: (r) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => test.mutate(r.id)}>
            Testar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => del.mutate(r.id)}>
            Remover
          </Button>
        </div>
      ),
    },
  ];
  if (!data.length)
    return <EmptyState title="Nenhuma integração ativa" description="Ative a partir da aba Providers." />;
  return <DataTable data={data} columns={columns} getRowKey={(r) => r.id} />;
}

function WebhooksTab({ data }: { data: readonly IntegrationWebhook[] }) {
  const columns: DataTableColumn<IntegrationWebhook>[] = [
    { key: "provider", header: "Provider", accessor: (r) => r.provider },
    { key: "event", header: "Evento", accessor: (r) => r.event },
    { key: "url", header: "URL", accessor: (r) => r.url },
    {
      key: "status",
      header: "Status",
      accessor: (r) => (
        <StatusBadge label={r.active ? "Ativo" : "Inativo"} status={r.active ? "success" : "muted"} />
      ),
    },
  ];
  if (!data.length) return <EmptyState title="Nenhum webhook registrado" />;
  return <DataTable data={data} columns={columns} getRowKey={(r) => r.id} />;
}

function LogsTab({ data }: { data: readonly IntegrationLog[] }) {
  const columns: DataTableColumn<IntegrationLog>[] = [
    { key: "provider", header: "Provider", accessor: (r) => r.provider },
    { key: "action", header: "Ação", accessor: (r) => r.action },
    {
      key: "status",
      header: "Status",
      accessor: (r) => (
        <StatusBadge label={r.status} status={r.status === "success" ? "success" : "danger"} />
      ),
    },
    { key: "duration", header: "Duração (ms)", accessor: (r) => r.durationMs ?? "—" },
    { key: "date", header: "Data", accessor: (r) => new Date(r.createdAt).toLocaleString() },
  ];
  if (!data.length) return <EmptyState title="Nenhum log registrado" />;
  return <DataTable data={data} columns={columns} getRowKey={(r) => r.id} />;
}

function HealthTab({ data }: { data: readonly IntegrationHealth[] }) {
  const columns: DataTableColumn<IntegrationHealth>[] = [
    { key: "int", header: "Integração", accessor: (r) => r.integrationId },
    {
      key: "status",
      header: "Status",
      accessor: (r) => (
        <StatusBadge
          label={r.status}
          status={r.status === "online" ? "success" : r.status === "degraded" ? "warning" : "muted"}
        />
      ),
    },
    { key: "lat", header: "Latência (ms)", accessor: (r) => r.latencyMs ?? "—" },
    { key: "last", header: "Último check", accessor: (r) => new Date(r.lastCheckAt).toLocaleString() },
  ];
  if (!data.length) return <EmptyState title="Sem dados de health" />;
  return <DataTable data={data} columns={columns} getRowKey={(r) => `${r.integrationId}-${r.lastCheckAt}`} />;
}

function SyncsTab({ data }: { data: readonly IntegrationSyncJob[] }) {
  const columns: DataTableColumn<IntegrationSyncJob>[] = [
    { key: "kind", header: "Tipo", accessor: (r) => r.kind },
    { key: "status", header: "Status", accessor: (r) => <StatusBadge label={r.status} /> },
    { key: "progress", header: "Progresso", accessor: (r) => `${r.progress}%` },
    { key: "sched", header: "Agendado", accessor: (r) => new Date(r.scheduledAt).toLocaleString() },
  ];
  if (!data.length) return <EmptyState title="Nenhuma sincronização" />;
  return <DataTable data={data} columns={columns} getRowKey={(r) => r.id} />;
}

function EventsTab({ data }: { data: readonly IntegrationEvent[] }) {
  const columns: DataTableColumn<IntegrationEvent>[] = [
    { key: "provider", header: "Provider", accessor: (r) => r.provider },
    { key: "event", header: "Evento", accessor: (r) => r.event },
    {
      key: "verified",
      header: "Verificado",
      accessor: (r) => (
        <StatusBadge label={r.verified ? "Sim" : "Não"} status={r.verified ? "success" : "warning"} />
      ),
    },
    { key: "date", header: "Data", accessor: (r) => new Date(r.createdAt).toLocaleString() },
  ];
  if (!data.length) return <EmptyState title="Nenhum evento recente" />;
  return <DataTable data={data} columns={columns} getRowKey={(r) => r.id} />;
}