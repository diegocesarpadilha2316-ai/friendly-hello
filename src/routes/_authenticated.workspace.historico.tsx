import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  EmptyState,
} from "@/core/components/ui-kit";
import { useNotificationAudit } from "@/core/notifications/use-notifications";

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
  const rows = (q.data ?? []) as Array<Record<string, unknown> & { id: string }>;
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
                <span>{String(r.action ?? r.event ?? "evento")}</span>
                <span className="text-xs text-muted-foreground">
                  {r.at ? new Date(String(r.at)).toLocaleString("pt-BR") : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}