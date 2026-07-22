import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  EmptyState,
  StatusBadge,
} from "@/core/components/ui-kit";
import {
  useNotifications,
  useMarkAllNotificationsRead,
} from "@/core/notifications/use-notifications";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/workspace/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações — Workspace | Dioris Hub" },
      { name: "description", content: "Notificações da empresa ativa em tempo real." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceNotifs,
});

function WorkspaceNotifs() {
  const { data, isLoading } = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const list = data ?? [];
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Workspace"
        title="Notificações"
        description={`${list.length} no total`}
        actions={
          list.length > 0 ? (
            <Button size="sm" variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
              Marcar todas como lidas
            </Button>
          ) : null
        }
      />
      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : list.length === 0 ? (
          <EmptyState icon={<Bell className="h-6 w-6" />} title="Sem notificações" />
        ) : (
          <ul className="divide-y divide-border/60 rounded-md border border-border/60 bg-card/30">
            {list.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{n.body}</p> : null}
                </div>
                <StatusBadge tone={n.readAt ? "neutral" : "info"}>
                  {n.readAt ? "lida" : "nova"}
                </StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}