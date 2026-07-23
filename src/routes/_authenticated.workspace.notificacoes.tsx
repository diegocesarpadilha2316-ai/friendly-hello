import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bell, Inbox, Send, FileText, Zap, Sliders, ScrollText, Archive, CheckCheck } from "lucide-react";
import {
  PageContainer, PageHeader, EmptyState, StatusBadge, MetricCard, SearchInput, FormSection,
} from "@/core/components/ui-kit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  useNotifications, useNotificationMetrics, useNotificationTemplates,
  useNotificationRules, useNotificationPreferences, useNotificationDeliveries,
  useNotificationAudit, useMarkAllNotificationsRead, useMarkNotificationRead,
  useArchiveNotification,
} from "@/core/notifications/use-notifications";
import type { NotificationStatus } from "@/core/notifications/types";

export const Route = createFileRoute("/_authenticated/workspace/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações — Workspace | Dioris Hub" },
      { name: "description", content: "Central de notificações da empresa: inbox, entregas, templates, regras, preferências e auditoria." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceNotifs,
});

const STATUS_TONE: Record<NotificationStatus, "success" | "warning" | "danger" | "info" | "neutral"> = {
  pending: "warning",
  queued: "info",
  sent: "info",
  delivered: "success",
  failed: "danger",
  read: "neutral",
  archived: "neutral",
};

function WorkspaceNotifs() {
  const notifications = useNotifications();
  const metrics = useNotificationMetrics();
  const markAll = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();
  const archive = useArchiveNotification();

  const [query, setQuery] = useState("");
  const list = notifications.data ?? [];
  const unread = useMemo(() => list.filter((n) => !n.readAt).length, [list]);
  const filtered = useMemo(
    () => list.filter((n) => !query || `${n.title} ${n.body ?? ""} ${n.category}`.toLowerCase().includes(query.toLowerCase())),
    [list, query],
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Workspace"
        title="Notificações"
        description="Central completa de notificações reutilizando o NotificationManager do Core."
        actions={
          unread > 0 ? (
            <Button size="sm" variant="outline" onClick={() => markAll.mutate(undefined, { onSuccess: () => toast.success(`${unread} marcadas como lidas`), onError: (e) => toast.error((e as Error).message) })} disabled={markAll.isPending}>
              <CheckCheck className="mr-1.5 h-4 w-4" />Marcar todas como lidas
            </Button>
          ) : null
        }
      />

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <MetricCard label="Total" value={metrics.data?.total ?? list.length} icon={<Bell className="h-4 w-4" />} />
        <MetricCard label="Não lidas" value={metrics.data?.unread ?? unread} tone={unread > 0 ? "warning" : "default"} />
        <MetricCard label="Entregas pendentes" value={metrics.data?.deliveriesPending ?? 0} />
        <MetricCard label="Entregas falhas" value={metrics.data?.deliveriesFailed ?? 0} tone={(metrics.data?.deliveriesFailed ?? 0) > 0 ? "danger" : "default"} />
      </div>

      <Tabs defaultValue="inbox" className="mt-6">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="inbox"><Inbox className="mr-1 h-3.5 w-3.5" />Inbox</TabsTrigger>
          <TabsTrigger value="deliveries"><Send className="mr-1 h-3.5 w-3.5" />Entregas</TabsTrigger>
          <TabsTrigger value="templates"><FileText className="mr-1 h-3.5 w-3.5" />Templates</TabsTrigger>
          <TabsTrigger value="rules"><Zap className="mr-1 h-3.5 w-3.5" />Regras</TabsTrigger>
          <TabsTrigger value="prefs"><Sliders className="mr-1 h-3.5 w-3.5" />Preferências</TabsTrigger>
          <TabsTrigger value="audit"><ScrollText className="mr-1 h-3.5 w-3.5" />Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-6">
          <div className="mb-3 max-w-md"><SearchInput value={query} onChange={setQuery} placeholder="Buscar por título, corpo ou categoria…" /></div>
          {notifications.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Bell className="h-6 w-6" />} title="Sem notificações" description={query ? "Nenhum resultado para a busca atual." : "Você está em dia. Novas notificações aparecerão aqui."} />
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-card/30">
              {filtered.map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      <StatusBadge tone={n.priority === "critical" ? "danger" : n.priority === "high" ? "warning" : "neutral"}>{n.category}</StatusBadge>
                    </div>
                    {n.body ? <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p> : null}
                    <p className="mt-1 text-[11px] text-muted-foreground">{new Date(n.createdAt).toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge tone={n.readAt ? "neutral" : "info"}>{n.readAt ? "lida" : "nova"}</StatusBadge>
                    <div className="flex gap-1">
                      {!n.readAt && (
                        <Button size="sm" variant="ghost" onClick={() => markRead.mutate(n.id, { onError: (e) => toast.error((e as Error).message) })}>Marcar lida</Button>
                      )}
                      {!n.archivedAt && (
                        <Button size="sm" variant="ghost" onClick={() => archive.mutate(n.id, { onSuccess: () => toast.success("Arquivada"), onError: (e) => toast.error((e as Error).message) })}>
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="deliveries" className="mt-6">
          <DeliveriesTab />
        </TabsContent>
        <TabsContent value="templates" className="mt-6">
          <TemplatesTab />
        </TabsContent>
        <TabsContent value="rules" className="mt-6">
          <RulesTab />
        </TabsContent>
        <TabsContent value="prefs" className="mt-6">
          <PreferencesTab />
        </TabsContent>
        <TabsContent value="audit" className="mt-6">
          <AuditTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function DeliveriesTab() {
  const q = useNotificationDeliveries();
  const rows = q.data ?? [];
  if (q.isLoading) return <Skeleton className="h-40 w-full" />;
  if (rows.length === 0) return <EmptyState icon={<Send className="h-6 w-6" />} title="Sem entregas registradas" />;
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
          <tr><th className="px-3 py-2 text-left">Canal</th><th className="px-3 py-2 text-left">Destino</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-left">Tentativas</th><th className="px-3 py-2 text-left">Quando</th></tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.slice(0, 100).map((d) => (
            <tr key={d.id}>
              <td className="px-3 py-2 capitalize">{d.channel}</td>
              <td className="px-3 py-2 truncate max-w-[220px] text-xs text-muted-foreground">{d.target}</td>
              <td className="px-3 py-2"><StatusBadge tone={STATUS_TONE[d.status]}>{d.status}</StatusBadge></td>
              <td className="px-3 py-2">{d.attempts}</td>
              <td className="px-3 py-2 text-xs text-muted-foreground">{new Date((d as unknown as { createdAt?: string }).createdAt ?? Date.now()).toLocaleString("pt-BR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TemplatesTab() {
  const q = useNotificationTemplates();
  const rows = q.data ?? [];
  if (q.isLoading) return <Skeleton className="h-40 w-full" />;
  if (rows.length === 0) return <EmptyState icon={<FileText className="h-6 w-6" />} title="Sem templates" description="Os templates são registrados pelo Core conforme os módulos publicam eventos." />;
  return (
    <FormSection title="Templates" description="Templates de notificação por canal e idioma.">
      <div className="divide-y divide-border rounded-lg border border-border">
        {rows.map((t) => (
          <div key={t.id} className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{t.key}</div>
                <div className="text-xs text-muted-foreground">{t.channel} · {t.locale} · {t.variables.length} variáveis</div>
              </div>
              <StatusBadge tone="neutral">{t.channel}</StatusBadge>
            </div>
            {t.subject && <div className="mt-2 text-xs"><span className="text-muted-foreground">Assunto:</span> {t.subject}</div>}
          </div>
        ))}
      </div>
    </FormSection>
  );
}

function RulesTab() {
  const q = useNotificationRules();
  const rows = q.data ?? [];
  if (q.isLoading) return <Skeleton className="h-40 w-full" />;
  if (rows.length === 0) return <EmptyState icon={<Zap className="h-6 w-6" />} title="Sem regras configuradas" description="Regras conectam eventos do EventBus a canais de notificação." />;
  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {rows.map((r) => (
        <div key={r.id} className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="font-medium">{r.name}</div>
            <div className="text-xs text-muted-foreground">Evento: <code className="font-mono">{r.eventType}</code> · Canais: {r.channels.join(", ")} · Categoria: {r.category}</div>
          </div>
          <StatusBadge tone="info">{r.templateKey ?? "template padrão"}</StatusBadge>
        </div>
      ))}
    </div>
  );
}

function PreferencesTab() {
  const q = useNotificationPreferences();
  const rows = q.data ?? [];
  if (q.isLoading) return <Skeleton className="h-40 w-full" />;
  if (rows.length === 0) return <EmptyState icon={<Sliders className="h-6 w-6" />} title="Sem preferências definidas" description="Preferências são criadas automaticamente por categoria e canal." />;
  const byChannel: Record<string, typeof rows> = {};
  for (const p of rows) {
    const arr = byChannel[p.channel] ?? [];
    (arr as typeof rows[number][]).push(p);
    byChannel[p.channel] = arr;
  }
  return (
    <div className="space-y-4">
      {Object.entries(byChannel).map(([channel, items]) => (
        <div key={channel} className="rounded-lg border border-border">
          <div className="border-b border-border bg-muted/30 px-4 py-2 text-sm font-medium capitalize">{channel}</div>
          <div className="divide-y divide-border">
            {items.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div className="text-sm">{p.category}</div>
                <StatusBadge tone={p.enabled ? "success" : "neutral"}>{p.enabled ? "Ativo" : "Silenciado"}</StatusBadge>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditTab() {
  const q = useNotificationAudit();
  const rows = q.data ?? [];
  if (q.isLoading) return <Skeleton className="h-40 w-full" />;
  if (rows.length === 0) return <EmptyState icon={<ScrollText className="h-6 w-6" />} title="Sem eventos de auditoria" />;
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
          <tr><th className="px-3 py-2 text-left">Quando</th><th className="px-3 py-2 text-left">Ação</th><th className="px-3 py-2 text-left">Entidade</th><th className="px-3 py-2 text-left">Ator</th></tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.slice(0, 100).map((a) => (
            <tr key={a.id}>
              <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString("pt-BR")}</td>
              <td className="px-3 py-2"><code className="font-mono text-xs">{a.action}</code></td>
              <td className="px-3 py-2 text-xs">{a.entity}{a.entityId ? ` · ${a.entityId.slice(0, 8)}` : ""}</td>
              <td className="px-3 py-2 text-xs text-muted-foreground">{a.actorId?.slice(0, 8) ?? "system"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
