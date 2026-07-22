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
  useDisablePlugin,
  useEnablePlugin,
  useMarketplace,
  useMarketplaceInstall,
  usePluginLogs,
  usePluginPermissions,
  usePluginUpdates,
  usePlugins,
  useSdkExport,
  useUninstallPlugin,
  type Plugin,
  type PluginLogEntry,
  type PluginMarketplaceItem,
  type PluginPermissionRow,
  type PluginUpdateRow,
} from "@/core/sdk";

type TabKey =
  | "dashboard"
  | "plugins"
  | "marketplace"
  | "updates"
  | "permissions"
  | "logs"
  | "hooks"
  | "settings";

const TABS: readonly { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "plugins", label: "Plugins" },
  { key: "marketplace", label: "Marketplace" },
  { key: "updates", label: "Atualizações" },
  { key: "permissions", label: "Permissões" },
  { key: "logs", label: "Logs" },
  { key: "hooks", label: "Hooks & Eventos" },
  { key: "settings", label: "Configurações" },
];

export const Route = createFileRoute("/_authenticated/sdk")({
  head: () => ({
    meta: [
      { title: "SDK & Plugins Enterprise — Dioris Hub" },
      {
        name: "description",
        content:
          "SDK oficial, sistema de plugins e marketplace de extensões da Dioris Hub — hooks, permissões e ciclo de vida unificados.",
      },
      { property: "og:title", content: "SDK & Plugins — Dioris Hub" },
      {
        property: "og:description",
        content: "Sistema único de plugins, hooks e marketplace de extensões.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SdkPage,
});

function toneFor(status: string): StatusTone {
  switch (status) {
    case "enabled":
    case "applied":
      return "success";
    case "disabled":
    case "installed":
      return "neutral";
    case "updating":
    case "pending":
      return "warning";
    case "error":
    case "failed":
      return "danger";
    default:
      return "info";
  }
}

function SdkPage() {
  const [tab, setTab] = useState<TabKey>("dashboard");
  const plugins = usePlugins();
  const market = useMarketplace();
  const updates = usePluginUpdates();
  const perms = usePluginPermissions();
  const logs = usePluginLogs();
  const exportMut = useSdkExport();

  return (
    <PageContainer>
      <PageHeader
        title="SDK & Plugins Enterprise"
        description="SDK oficial, ciclo de vida, hooks, permissões e marketplace de extensões."
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
              a.download = "plugins.json";
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
          <MetricCard label="Plugins" value={String(plugins.data?.length ?? 0)} />
          <MetricCard
            label="Ativos"
            value={String((plugins.data ?? []).filter((p) => p.enabled).length)}
          />
          <MetricCard label="Marketplace" value={String(market.data?.length ?? 0)} />
          <MetricCard label="Atualizações" value={String(updates.data?.length ?? 0)} />
        </div>
      )}

      {tab === "plugins" && <PluginsTab data={plugins.data ?? []} />}
      {tab === "marketplace" && <MarketplaceTab data={market.data ?? []} />}
      {tab === "updates" && <UpdatesTab data={updates.data ?? []} />}
      {tab === "permissions" && <PermissionsTab data={perms.data ?? []} />}
      {tab === "logs" && <LogsTab data={logs.data ?? []} />}
      {tab === "hooks" && <HooksTab />}
      {tab === "settings" && (
        <EmptyState
          title="Configurações do SDK"
          description="Rate limits, quotas e sandbox são configurados por plugin no manifesto."
        />
      )}
    </PageContainer>
  );
}

function PluginsTab({ data }: { data: readonly Plugin[] }) {
  const enable = useEnablePlugin();
  const disable = useDisablePlugin();
  const uninstall = useUninstallPlugin();
  const columns: DataTableColumn<Plugin>[] = [
    { id: "name", header: "Nome", cell: (r) => r.name },
    { id: "slug", header: "Slug", cell: (r) => r.slug },
    { id: "category", header: "Categoria", cell: (r) => r.category },
    { id: "version", header: "Versão", cell: (r) => r.version },
    {
      id: "status",
      header: "Status",
      cell: (r) => (
        <StatusBadge tone={toneFor(r.enabled ? "enabled" : r.status)}>
          {r.enabled ? "Ativo" : r.status}
        </StatusBadge>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: (r) => (
        <div className="flex gap-2">
          {r.enabled ? (
            <Button size="sm" variant="outline" onClick={() => disable.mutate(r.id)}>
              Desativar
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => enable.mutate(r.id)}>
              Ativar
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => uninstall.mutate(r.id)}>
            Remover
          </Button>
        </div>
      ),
    },
  ];
  if (!data.length)
    return (
      <EmptyState
        title="Nenhum plugin instalado"
        description="Instale a partir do Marketplace."
      />
    );
  return <DataTable data={[...data]} columns={columns} getRowKey={(r) => r.id} />;
}

function MarketplaceTab({ data }: { data: readonly PluginMarketplaceItem[] }) {
  const install = useMarketplaceInstall();
  const columns: DataTableColumn<PluginMarketplaceItem>[] = [
    { id: "name", header: "Nome", cell: (r) => r.name },
    { id: "category", header: "Categoria", cell: (r) => r.category },
    { id: "author", header: "Autor", cell: (r) => r.author ?? "—" },
    { id: "version", header: "Versão", cell: (r) => r.version },
    {
      id: "featured",
      header: "Destaque",
      cell: (r) => (
        <StatusBadge tone={r.featured ? "success" : "neutral"}>
          {r.featured ? "Sim" : "—"}
        </StatusBadge>
      ),
    },
    { id: "downloads", header: "Downloads", cell: (r) => r.downloads },
    {
      id: "actions",
      header: "Ações",
      cell: (r) => (
        <Button size="sm" variant="outline" onClick={() => install.mutate(r.id)}>
          Instalar
        </Button>
      ),
    },
  ];
  if (!data.length) return <EmptyState title="Marketplace vazio" />;
  return <DataTable data={[...data]} columns={columns} getRowKey={(r) => r.id} />;
}

function UpdatesTab({ data }: { data: readonly PluginUpdateRow[] }) {
  const columns: DataTableColumn<PluginUpdateRow>[] = [
    { id: "plugin", header: "Plugin", cell: (r) => r.pluginId },
    { id: "from", header: "De", cell: (r) => r.fromVersion },
    { id: "to", header: "Para", cell: (r) => r.toVersion },
    {
      id: "status",
      header: "Status",
      cell: (r) => <StatusBadge tone={toneFor(r.status)}>{r.status}</StatusBadge>,
    },
    { id: "sched", header: "Agendado", cell: (r) => new Date(r.scheduledAt).toLocaleString() },
  ];
  if (!data.length) return <EmptyState title="Sem atualizações pendentes" />;
  return <DataTable data={[...data]} columns={columns} getRowKey={(r) => r.id} />;
}

function PermissionsTab({ data }: { data: readonly PluginPermissionRow[] }) {
  const columns: DataTableColumn<PluginPermissionRow>[] = [
    { id: "plugin", header: "Plugin", cell: (r) => r.pluginId },
    { id: "scope", header: "Escopo", cell: (r) => r.scope },
    {
      id: "granted",
      header: "Concedido",
      cell: (r) => (
        <StatusBadge tone={r.granted ? "success" : "warning"}>
          {r.granted ? "Sim" : "Não"}
        </StatusBadge>
      ),
    },
    {
      id: "when",
      header: "Concedido em",
      cell: (r) => (r.grantedAt ? new Date(r.grantedAt).toLocaleString() : "—"),
    },
  ];
  if (!data.length) return <EmptyState title="Nenhuma permissão configurada" />;
  return <DataTable data={[...data]} columns={columns} getRowKey={(r) => r.id} />;
}

function LogsTab({ data }: { data: readonly PluginLogEntry[] }) {
  const columns: DataTableColumn<PluginLogEntry>[] = [
    { id: "action", header: "Ação", cell: (r) => r.action },
    {
      id: "level",
      header: "Nível",
      cell: (r) => <StatusBadge tone={toneFor(r.level)}>{r.level}</StatusBadge>,
    },
    { id: "message", header: "Mensagem", cell: (r) => r.message ?? "—" },
    { id: "date", header: "Data", cell: (r) => new Date(r.createdAt).toLocaleString() },
  ];
  if (!data.length) return <EmptyState title="Nenhum log registrado" />;
  return <DataTable data={[...data]} columns={columns} getRowKey={(r) => r.id} />;
}

function HooksTab() {
  const HOOKS = [
    "beforeCreate",
    "afterCreate",
    "beforeUpdate",
    "afterUpdate",
    "beforeDelete",
    "afterDelete",
    "beforeRender",
    "afterRender",
    "beforeExport",
    "afterExport",
    "beforeAI",
    "afterAI",
  ] as const;
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {HOOKS.map((h) => (
        <div key={h} className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm font-medium">{h}</div>
          <div className="text-xs text-muted-foreground">
            Ponto de extensão disponível para todos os plugins.
          </div>
        </div>
      ))}
    </div>
  );
}