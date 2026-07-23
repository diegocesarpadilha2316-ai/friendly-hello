import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bell, Inbox, Send, Sliders, Activity, Zap, CheckCheck, Archive,
  AlertTriangle, CalendarDays, MailOpen, Mail, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  PageContainer, PageHeader, EmptyState, StatusBadge, MetricCard, SearchInput, FormSection,
} from "@/core/components/ui-kit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useNotifications, useNotificationMetrics, useNotificationPreferences,
  useNotificationDeliveries, useMarkAllNotificationsRead, useMarkNotificationRead,
  useArchiveNotification,
} from "@/core/notifications/use-notifications";
import { useEvents, useEventMetrics } from "@/core/events/use-events";
import type { NotificationStatus } from "@/core/notifications/types";
import type { EventPriority } from "@/core/events/types";

export const Route = createFileRoute("/_authenticated/workspace/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações — Workspace | Dioris Hub" },
      { name: "description", content: "Central de notificações do workspace: inbox, filtros, preferências, entregas, eventos e observabilidade." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceNotifs,
});

const STATUS_TONE: Record<NotificationStatus, "success" | "warning" | "danger" | "info" | "neutral"> = {
  pending: "warning", sent: "success", failed: "danger", read: "neutral",
  archived: "neutral", muted: "neutral", skipped: "neutral",
};
const PRIORITY_TONE: Record<EventPriority, "success" | "warning" | "danger" | "info" | "neutral"> = {
  low: "neutral", normal: "info", high: "warning", critical: "danger",
};

type PeriodKey = "all" | "today" | "week" | "month";
const inPeriod = (iso: string, key: PeriodKey) => {
  if (key === "all") return true;
  const d = new Date(iso), now = new Date();
  if (key === "today") return d.toDateString() === now.toDateString();
  const ms = now.getTime() - d.getTime();
  if (key === "week") return ms <= 7 * 864e5;
  return ms <= 30 * 864e5;
};

function WorkspaceNotifs() {
  const notifications = useNotifications();
  const metrics = useNotificationMetrics();
  const markAll = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();
  const archive = useArchiveNotification();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [priority, setPriority] = useState<"all" | EventPriority>("all");
  const [status, setStatus] = useState<"all" | "unread" | "read" | "archived">("all");
  const [period, setPeriod] = useState<PeriodKey>("all");

  const list = notifications.data ?? [];
  const categories = useMemo(() => Array.from(new Set(list.map((n) => n.category))).sort(), [list]);

  const kpis = useMemo(() => {
    const now = new Date();
    return {
      unread: list.filter((n) => !n.readAt && !n.archivedAt).length,
      read: list.filter((n) => n.readAt).length,
      archived: list.filter((n) => n.archivedAt).length,
      critical: list.filter((n) => n.priority === "critical").length,
      today: list.filter((n) => new Date(n.createdAt).toDateString() === now.toDateString()).length,
      week: list.filter((n) => now.getTime() - new Date(n.createdAt).getTime() <= 7 * 864e5).length,
    };
  }, [list]);

  const filtered = useMemo(() => list.filter((n) => {
    if (query && !`${n.title} ${n.body ?? ""} ${n.category}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (category !== "all" && n.category !== category) return false;
    if (priority !== "all" && n.priority !== priority) return false;
    if (status === "unread" && (n.readAt || n.archivedAt)) return false;
    if (status === "read" && !n.readAt) return false;
    if (status === "archived" && !n.archivedAt) return false;
    if (!inPeriod(n.createdAt, period)) return false;
    return true;
  }), [list, query, category, priority, status, period]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Workspace"
        title="Notificações"
        description="Central completa reutilizando o NotificationManager, EventBus e Observability do Core."
        actions={
          kpis.unread > 0 ? (
            <Button size="sm" variant="outline" onClick={() => markAll.mutate(undefined, {
              onSuccess: () => toast.success(`${kpis.unread} marcadas como lidas`),
              onError: (e) => toast.error((e as Error).message),
            })} disabled={markAll.isPending}>
              <CheckCheck className="mr-1.5 h-4 w-4" />Marcar todas como lidas
            </Button>
          ) : null
        }
      />

      <div className="mt-6 grid gap-3 md:grid-cols-4 lg:grid-cols-7">
        <MetricCard icon={<Bell className="h-4 w-4" />} label="Total" value={metrics.data?.total ?? list.length} />
        <MetricCard icon={<Mail className="h-4 w-4" />} label="Não lidas" value={kpis.unread} />
        <MetricCard icon={<MailOpen className="h-4 w-4" />} label="Lidas" value={kpis.read} />
        <MetricCard icon={<Archive className="h-4 w-4" />} label="Arquivadas" value={kpis.archived} />
        <MetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Críticas" value={kpis.critical} />
        <MetricCard icon={<CalendarDays className="h-4 w-4" />} label="Hoje" value={kpis.today} />
        <MetricCard icon={<Activity className="h-4 w-4" />} label="7 dias" value={kpis.week} />
      </div>

      <Tabs defaultValue="inbox" className="mt-6">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="inbox"><Inbox className="mr-1 h-3.5 w-3.5" />Inbox</TabsTrigger>
          <TabsTrigger value="prefs"><Sliders className="mr-1 h-3.5 w-3.5" />Preferências</TabsTrigger>
          <TabsTrigger value="history"><Send className="mr-1 h-3.5 w-3.5" />Histórico</TabsTrigger>
          <TabsTrigger value="events"><Zap className="mr-1 h-3.5 w-3.5" />Eventos</TabsTrigger>
          <TabsTrigger value="obs"><Activity className="mr-1 h-3.5 w-3.5" />Observabilidade</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-6 space-y-4">
          <div className="grid gap-2 md:grid-cols-6">
            <div className="md:col-span-2"><SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisa global…" /></div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
              <SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas prioridades</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="unread">Não lidas</SelectItem>
                <SelectItem value="read">Lidas</SelectItem>
                <SelectItem value="archived">Arquivadas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
              <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {notifications.isLoading ? (
            <Skeleton className="h-60 w-full" />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Bell className="h-6 w-6" />} title="Sem notificações" description="Nenhum resultado para os filtros aplicados." />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card/30">
              <ul className="divide-y divide-border">
                {filtered.map((n) => (
                  <li key={n.id} className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/30">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`truncate text-sm ${n.readAt ? "font-normal text-muted-foreground" : "font-semibold"}`}>{n.title}</p>
                        <StatusBadge tone={PRIORITY_TONE[n.priority]}>{n.priority}</StatusBadge>
                        <StatusBadge tone="neutral">{n.category}</StatusBadge>
                      </div>
                      {n.body ? <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p> : null}
                      <p className="mt-1 text-[11px] text-muted-foreground">{new Date(n.createdAt).toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge tone={n.archivedAt ? "neutral" : n.readAt ? "neutral" : "info"}>
                        {n.archivedAt ? "arquivada" : n.readAt ? "lida" : "nova"}
                      </StatusBadge>
                      <div className="flex gap-1">
                        {!n.readAt && !n.archivedAt && (
                          <Button size="sm" variant="ghost" onClick={() => markRead.mutate(n.id, { onError: (e) => toast.error((e as Error).message) })}>
                            <CheckCheck className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {!n.archivedAt && (
                          <Button size="sm" variant="ghost" onClick={() => archive.mutate(n.id, {
                            onSuccess: () => toast.success("Arquivada"),
                            onError: (e) => toast.error((e as Error).message),
                          })}>
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="prefs" className="mt-6"><PreferencesTab /></TabsContent>
        <TabsContent value="history" className="mt-6"><DeliveriesTab /></TabsContent>
        <TabsContent value="events" className="mt-6"><EventsTab /></TabsContent>
        <TabsContent value="obs" className="mt-6"><ObservabilityTab /></TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function PreferencesTab() {
  const q = useNotificationPreferences();
  const rows = q.data ?? [];
  if (q.isLoading) return <Skeleton className="h-40 w-full" />;
  if (rows.length === 0) return <EmptyState icon={<Sliders className="h-6 w-6" />} title="Sem preferências" description="Preferências são criadas automaticamente por categoria e canal (In-App, Email, Push, WhatsApp, SMS)." />;
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
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
            <div className="text-sm font-medium capitalize">{channel}</div>
            <StatusBadge tone="neutral">{items.length} regras</StatusBadge>
          </div>
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

function DeliveriesTab() {
  const q = useNotificationDeliveries();
  const rows = q.data ?? [];
  if (q.isLoading) return <Skeleton className="h-40 w-full" />;
  if (rows.length === 0) return <EmptyState icon={<Send className="h-6 w-6" />} title="Sem entregas registradas" />;
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Canal</th>
            <th className="px-3 py-2 text-left">Destino</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Tentativas</th>
            <th className="px-3 py-2 text-left">Último erro</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.slice(0, 100).map((d) => (
            <tr key={d.id} className="hover:bg-muted/20">
              <td className="px-3 py-2 capitalize">{d.channel}</td>
              <td className="max-w-[220px] truncate px-3 py-2 text-xs text-muted-foreground">{d.target}</td>
              <td className="px-3 py-2"><StatusBadge tone={STATUS_TONE[d.status]}>{d.status}</StatusBadge></td>
              <td className="px-3 py-2 tabular-nums">{d.attempts}/{d.maxAttempts}</td>
              <td className="max-w-[280px] truncate px-3 py-2 text-xs text-destructive">{d.lastError ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventsTab() {
  const events = useEvents();
  const metrics = useEventMetrics();
  const rows = events.data ?? [];
  const m = metrics.data;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-5">
        <MetricCard label="Total" value={m?.total ?? 0} />
        <MetricCard label="Pendentes" value={m?.pending ?? 0} />
        <MetricCard label="Entregues" value={m?.delivered ?? 0} />
        <MetricCard label="Falhas" value={m?.failed ?? 0} />
        <MetricCard label="Dead-letter" value={m?.dead ?? 0} />
      </div>
      {events.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : rows.length === 0 ? (
        <EmptyState icon={<Zap className="h-6 w-6" />} title="Sem eventos" description="Eventos do EventBus aparecerão aqui." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Quando</th>
                <th className="px-3 py-2 text-left">Tipo</th>
                <th className="px-3 py-2 text-left">Origem</th>
                <th className="px-3 py-2 text-left">Prioridade</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.slice(0, 100).map((e) => (
                <tr key={e.id}>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(e.scheduledAt).toLocaleString("pt-BR")}</td>
                  <td className="px-3 py-2"><code className="font-mono text-xs">{e.type}</code></td>
                  <td className="px-3 py-2 text-xs">{e.source}</td>
                  <td className="px-3 py-2"><StatusBadge tone={PRIORITY_TONE[e.priority]}>{e.priority}</StatusBadge></td>
                  <td className="px-3 py-2"><StatusBadge tone={e.status === "delivered" ? "success" : e.status === "failed" || e.status === "dead" ? "danger" : "info"}>{e.status}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ObservabilityTab() {
  const deliveries = useNotificationDeliveries();
  const metrics = useNotificationMetrics();
  const rows = deliveries.data ?? [];
  const total = rows.length;
  const delivered = rows.filter((r) => r.status === "sent").length;
  const failed = rows.filter((r) => r.status === "failed").length;
  const rate = total > 0 ? Math.round((delivered / total) * 100) : 0;
  const avgAttempts = total > 0 ? (rows.reduce((s, r) => s + r.attempts, 0) / total).toFixed(2) : "0";
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={<Sparkles className="h-4 w-4" />} label="Taxa de entrega" value={`${rate}%`} hint={`${delivered}/${total}`} />
        <MetricCard label="Falhas" value={failed} />
        <MetricCard label="Tentativas médias" value={avgAttempts} />
        <MetricCard label="Total notificações" value={metrics.data?.total ?? 0} />
      </div>
      <FormSection title="Distribuição por status" description="Baseado nas entregas registradas no NotificationManager.">
        <div className="space-y-2">
          {(["sent", "pending", "failed"] as const).map((s) => {
            const n = rows.filter((r) => r.status === s).length;
            const pct = total > 0 ? (n / total) * 100 : 0;
            return (
              <div key={s}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="capitalize">{s}</span>
                  <span className="tabular-nums text-muted-foreground">{n} · {pct.toFixed(0)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </FormSection>
    </div>
  );
}
