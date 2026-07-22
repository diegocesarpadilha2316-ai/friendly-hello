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

function toneFor(status: string): StatusTone {
  switch (status) {
    case "active":
    case "online":
    case "success":
    case "done":
      return "success";
    case "degraded":
    case "warning":
    case "queued":
    case "running":
      return "warning";
    case "error":
    case "offline":
    case "failed":
      return "danger";
    case "connecting":
      return "info";
    default:
      return "neutral";
  }
}

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
              const content = typeof res === "string" ? res : JSON.stringify(res, null, 2);
              const blob = new Blob([content], { type: "application/json" });
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
          <MetricCard label="Eventos recentes" value={String(events.data?.length ?? 0)} />
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
    { id: "name", header: "Provider", cell: (r) => r.name },
    { id: "category", header: "Categoria", cell: (r) => r.category },
    { id: "auth", header: "Auth", cell: (r) => r.authType },
    { id: "version", header: "Versão", cell: (r) => r.version },
    {
      id: "actions",
      header: "Ações",
      cell: (r) => (
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
  return <DataTable data={[...data]} columns={columns} getRowKey={(r) => r.id} />;
}

function IntegrationsTab({ data }: { data: readonly Integration[] }) {
  const test = useTestIntegrationConnection();
  const del = useDeleteIntegration();
  const columns: DataTableColumn<Integration>[] = [
    { id: "name", header: "Nome", cell: (r) => r.name },
    { id: "provider", header: "Provider", cell: (r) => r.provider },
    { id: "category", header: "Categoria", cell: (r) => r.category },
    {
      id: "status",
      header: "Status",
      cell: (r) => <StatusBadge tone={toneFor(r.status)}>{r.status}</StatusBadge>,
    },
    {
      id: "actions",
      header: "Ações",
      cell: (r) => (
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
  return <DataTable data={[...data]} columns={columns} getRowKey={(r) => r.id} />;
}

function WebhooksTab({ data }: { data: readonly IntegrationWebhook[] }) {
  const columns: DataTableColumn<IntegrationWebhook>[] = [
    { id: "provider", header: "Provider", cell: (r) => r.provider },
    { id: "event", header: "Evento", cell: (r) => r.event },
    { id: "url", header: "URL", cell: (r) => r.url },
    {
      id: "status",
      header: "Status",
      cell: (r) => (
        <StatusBadge tone={r.active ? "success" : "neutral"}>
          {r.active ? "Ativo" : "Inativo"}
        </StatusBadge>
      ),
    },
  ];
  if (!data.length) return <EmptyState title="Nenhum webhook registrado" />;
  return <DataTable data={[...data]} columns={columns} getRowKey={(r) => r.id} />;
}

function LogsTab({ data }: { data: readonly IntegrationLog[] }) {
  const columns: DataTableColumn<IntegrationLog>[] = [
    { id: "provider", header: "Provider", cell: (r) => r.provider },
    { id: "action", header: "Ação", cell: (r) => r.action },
    {
      id: "status",
      header: "Status",
      cell: (r) => <StatusBadge tone={toneFor(r.status)}>{r.status}</StatusBadge>,
    },
    { id: "duration", header: "Duração (ms)", cell: (r) => r.durationMs ?? "—" },
    { id: "date", header: "Data", cell: (r) => new Date(r.createdAt).toLocaleString() },
  ];
  if (!data.length) return <EmptyState title="Nenhum log registrado" />;
  return <DataTable data={[...data]} columns={columns} getRowKey={(r) => r.id} />;
}

function HealthTab({ data }: { data: readonly IntegrationHealth[] }) {
  const columns: DataTableColumn<IntegrationHealth>[] = [
    { id: "int", header: "Integração", cell: (r) => r.integrationId },
    {
      id: "status",
      header: "Status",
      cell: (r) => <StatusBadge tone={toneFor(r.status)}>{r.status}</StatusBadge>,
    },
    { id: "lat", header: "Latência (ms)", cell: (r) => r.latencyMs ?? "—" },
    { id: "last", header: "Último check", cell: (r) => new Date(r.lastCheckAt).toLocaleString() },
  ];
  if (!data.length) return <EmptyState title="Sem dados de health" />;
  return (
    <DataTable
      data={[...data]}
      columns={columns}
      getRowKey={(r) => `${r.integrationId}-${r.lastCheckAt}`}
    />
  );
}

function SyncsTab({ data }: { data: readonly IntegrationSyncJob[] }) {
  const columns: DataTableColumn<IntegrationSyncJob>[] = [
    { id: "kind", header: "Tipo", cell: (r) => r.kind },
    {
      id: "status",
      header: "Status",
      cell: (r) => <StatusBadge tone={toneFor(r.status)}>{r.status}</StatusBadge>,
    },
    { id: "progress", header: "Progresso", cell: (r) => `${r.progress}%` },
    { id: "sched", header: "Agendado", cell: (r) => new Date(r.scheduledAt).toLocaleString() },
  ];
  if (!data.length) return <EmptyState title="Nenhuma sincronização" />;
  return <DataTable data={[...data]} columns={columns} getRowKey={(r) => r.id} />;
}

function EventsTab({ data }: { data: readonly IntegrationEvent[] }) {
  const columns: DataTableColumn<IntegrationEvent>[] = [
    { id: "provider", header: "Provider", cell: (r) => r.provider },
    { id: "event", header: "Evento", cell: (r) => r.event },
    {
      id: "verified",
      header: "Verificado",
      cell: (r) => (
        <StatusBadge tone={r.verified ? "success" : "warning"}>
          {r.verified ? "Sim" : "Não"}
        </StatusBadge>
      ),
    },
    { id: "date", header: "Data", cell: (r) => new Date(r.createdAt).toLocaleString() },
  ];
  if (!data.length) return <EmptyState title="Nenhum evento recente" />;
  return <DataTable data={[...data]} columns={columns} getRowKey={(r) => r.id} />;
}