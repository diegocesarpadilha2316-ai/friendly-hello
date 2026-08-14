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
import {
  useEventDeliveries,
  useEventMetrics,
  useEvents,
  type Event,
  type EventDelivery,
} from "@/core/events";
import {
  useArchiveNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationAudit,
  useNotificationDeliveries,
  useNotificationMetrics,
  useNotificationRules,
  useNotificationTemplates,
  useNotifications,
  type Notification,
  type NotificationAuditEntry,
  type NotificationDelivery,
  type NotificationRule,
  type NotificationTemplate,
} from "@/core/notifications";

export const Route = createFileRoute("/_authenticated/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações & Eventos — Dioris Hub" },
      {
        name: "description",
        content:
          "Centro Enterprise de Notificações e Eventos da Dioris Hub — regras, canais, entregas e auditoria em tempo real.",
      },
      { property: "og:title", content: "Notificações & Eventos — Dioris Hub" },
      {
        property: "og:description",
        content: "Motor único de eventos e notificações multi-canal com RLS por tenant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const notifMetrics = useNotificationMetrics();
  const evtMetrics = useEventMetrics();
  const notifs = useNotifications();
  const events = useEvents();
  const rules = useNotificationRules();
  const templates = useNotificationTemplates();
  const notifDeliveries = useNotificationDeliveries();
  const eventDeliveries = useEventDeliveries();
  const audit = useNotificationAudit();

  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const archive = useArchiveNotification();

  const notifCols: DataTableColumn<Notification>[] = [
    {
      id: "createdAt",
      header: "Quando",
      cell: (r) => new Date(r.createdAt).toLocaleString("pt-BR"),
    },
    { id: "title", header: "Título", cell: (r) => r.title },
    { id: "category", header: "Categoria", cell: (r) => r.category },
    {
      id: "priority",
      header: "Prioridade",
      cell: (r) => <StatusBadge tone={tone(r.priority)}>{r.priority}</StatusBadge>,
    },
    {
      id: "status",
      header: "Status",
      cell: (r) => <StatusBadge tone={statusTone(r.status)}>{r.status}</StatusBadge>,
    },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <div className="flex gap-2">
          {r.status !== "read" && (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => markRead.mutate(r.id)}
            >
              marcar lida
            </button>
          )}
          {r.status !== "archived" && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline"
              onClick={() => archive.mutate(r.id)}
            >
              arquivar
            </button>
          )}
        </div>
      ),
    },
  ];

  const eventCols: DataTableColumn<Event>[] = [
    {
      id: "createdAt",
      header: "Quando",
      cell: (r) => new Date(r.createdAt).toLocaleString("pt-BR"),
    },
    { id: "type", header: "Tipo", cell: (r) => r.type },
    { id: "source", header: "Origem", cell: (r) => r.source },
    {
      id: "priority",
      header: "Prioridade",
      cell: (r) => <StatusBadge tone={tone(r.priority)}>{r.priority}</StatusBadge>,
    },
    {
      id: "status",
      header: "Status",
      cell: (r) => <StatusBadge tone={statusTone(r.status)}>{r.status}</StatusBadge>,
    },
    { id: "attempts", header: "Tentativas", cell: (r) => `${r.attempts}/${r.maxAttempts}` },
  ];

  const ruleCols: DataTableColumn<NotificationRule>[] = [
    { id: "name", header: "Regra", cell: (r) => r.name },
    { id: "eventType", header: "Evento", cell: (r) => r.eventType },
    { id: "channels", header: "Canais", cell: (r) => r.channels.join(", ") },
    { id: "category", header: "Categoria", cell: (r) => r.category },
    {
      id: "enabled",
      header: "Ativa",
      cell: (r) => (
        <StatusBadge tone={r.enabled ? "success" : "neutral"}>
          {r.enabled ? "sim" : "não"}
        </StatusBadge>
      ),
    },
  ];

  const tplCols: DataTableColumn<NotificationTemplate>[] = [
    { id: "key", header: "Chave", cell: (r) => r.key },
    { id: "channel", header: "Canal", cell: (r) => r.channel },
    { id: "locale", header: "Locale", cell: (r) => r.locale },
    { id: "scope", header: "Escopo", cell: (r) => (r.companyId ? "tenant" : "global") },
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

  const delCols: DataTableColumn<NotificationDelivery>[] = [
    {
      id: "createdAt",
      header: "Quando",
      cell: (r) => new Date(r.createdAt).toLocaleString("pt-BR"),
    },
    { id: "channel", header: "Canal", cell: (r) => r.channel },
    { id: "target", header: "Destino", cell: (r) => r.target },
    {
      id: "status",
      header: "Status",
      cell: (r) => <StatusBadge tone={statusTone(r.status)}>{r.status}</StatusBadge>,
    },
    { id: "attempts", header: "Tentativas", cell: (r) => `${r.attempts}/${r.maxAttempts}` },
  ];

  const evtDelCols: DataTableColumn<EventDelivery>[] = [
    {
      id: "createdAt",
      header: "Quando",
      cell: (r) => new Date(r.createdAt).toLocaleString("pt-BR"),
    },
    { id: "subscriber", header: "Subscriber", cell: (r) => r.subscriber },
    {
      id: "status",
      header: "Status",
      cell: (r) => <StatusBadge tone={statusTone(r.status)}>{r.status}</StatusBadge>,
    },
    { id: "attempts", header: "Tentativas", cell: (r) => `${r.attempts}/${r.maxAttempts}` },
  ];

  const auditCols: DataTableColumn<NotificationAuditEntry>[] = [
    {
      id: "createdAt",
      header: "Quando",
      cell: (r) => new Date(r.createdAt).toLocaleString("pt-BR"),
    },
    { id: "entity", header: "Entidade", cell: (r) => r.entity },
    { id: "action", header: "Ação", cell: (r) => r.action },
    { id: "actorId", header: "Ator", cell: (r) => r.actorId ?? "sistema" },
  ];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Core"
        title="Notificações & Eventos"
        description="Motor único de eventos e notificações multi-canal. Todos os módulos publicam eventos e consomem notificações através deste Core."
        actions={
          <button
            type="button"
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            onClick={() => markAll.mutate()}
          >
            marcar todas como lidas
          </button>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard label="Notificações totais" value={notifMetrics.data?.total ?? 0} />
        <MetricCard label="Não lidas" value={notifMetrics.data?.unread ?? 0} />
        <MetricCard label="Eventos totais" value={evtMetrics.data?.total ?? 0} />
        <MetricCard label="Eventos pendentes" value={evtMetrics.data?.pending ?? 0} />
      </div>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">Inbox</h2>
        {notifs.data && notifs.data.length > 0 ? (
          <DataTable
            data={notifs.data as Notification[]}
            columns={notifCols}
            getRowKey={(r) => r.id}
          />
        ) : (
          <EmptyState
            title="Sem notificações"
            description="Assim que um módulo publicar um evento com regra ativa, as notificações aparecerão aqui."
          />
        )}
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">Regras & Templates</h2>
        <DataTable
          data={(rules.data ?? []) as NotificationRule[]}
          columns={ruleCols}
          getRowKey={(r) => r.id}
          empty="Nenhuma regra configurada."
        />
        <DataTable
          data={(templates.data ?? []) as NotificationTemplate[]}
          columns={tplCols}
          getRowKey={(r) => r.id}
          empty="Nenhum template disponível."
        />
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">Eventos recentes</h2>
        <DataTable
          data={(events.data ?? []) as Event[]}
          columns={eventCols}
          getRowKey={(r) => r.id}
          empty="Sem eventos publicados."
        />
      </section>

      <section className="mt-10 grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Entregas de notificação</h2>
          <DataTable
            data={(notifDeliveries.data ?? []) as NotificationDelivery[]}
            columns={delCols}
            getRowKey={(r) => r.id}
            empty="Sem entregas."
          />
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Entregas de evento</h2>
          <DataTable
            data={(eventDeliveries.data ?? []) as EventDelivery[]}
            columns={evtDelCols}
            getRowKey={(r) => r.id}
            empty="Sem entregas."
          />
        </div>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">Auditoria</h2>
        <DataTable
          data={(audit.data ?? []) as NotificationAuditEntry[]}
          columns={auditCols}
          getRowKey={(r) => r.id}
          empty="Sem eventos de auditoria."
        />
      </section>
    </PageContainer>
  );
}

function tone(p: string): "success" | "warning" | "danger" | "neutral" | "info" {
  if (p === "critical") return "danger";
  if (p === "high") return "warning";
  if (p === "low") return "neutral";
  return "info";
}

function statusTone(s: string): "success" | "warning" | "danger" | "neutral" | "info" {
  if (s === "delivered" || s === "sent" || s === "read") return "success";
  if (s === "failed" || s === "dead") return "danger";
  if (s === "pending" || s === "processing" || s === "scheduled") return "info";
  if (s === "archived" || s === "muted" || s === "skipped" || s === "deduped") return "neutral";
  return "info";
}
