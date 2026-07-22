import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  EmptyState,
} from "@/core/components/ui-kit";
import { useNotificationAudit } from "@/core/notifications/use-notifications";
import type { NotificationAuditEntry } from "@/core/notifications/types";

export const Route = createFileRoute("/_authenticated/workspace/historico")({
  head: () => ({
    meta: [
      { title: "Histórico — Workspace | Dioris Hub" },
      { name: "description", content: "Histórico de eventos auditáveis da empresa." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceHist,
});

function WorkspaceHist() {
  const q = useNotificationAudit();
  const rows: ReadonlyArray<NotificationAuditEntry> = q.data ?? [];
  return (
    <PageContainer>
      <PageHeader eyebrow="Workspace" title="Histórico" description="Auditoria consolidada" />
      <div className="mt-6">
        {rows.length === 0 ? (
          <EmptyState icon={<History className="h-6 w-6" />} title="Sem histórico" />
        ) : (
          <ul className="divide-y divide-border/60 rounded-md border border-border/60 bg-card/30">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{r.action}{r.entity ? ` — ${r.entity}` : ""}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}