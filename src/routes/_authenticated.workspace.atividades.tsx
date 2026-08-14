import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { PageContainer, PageHeader, EmptyState } from "@/core/components/ui-kit";
import { useDashboardSnapshot } from "@/core/dashboard/use-dashboard";

export const Route = createFileRoute("/_authenticated/workspace/atividades")({
  head: () => ({
    meta: [
      { title: "Atividades — Workspace | Dioris Hub" },
      { name: "description", content: "Eventos e ações recentes da empresa ativa." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceAtividades,
});

function WorkspaceAtividades() {
  const { snapshot } = useDashboardSnapshot();
  return (
    <PageContainer>
      <PageHeader eyebrow="Workspace" title="Atividades" description="Eventos recentes" />
      <div className="mt-6">
        {snapshot.activity.length === 0 ? (
          <EmptyState icon={<Activity className="h-6 w-6" />} title="Sem atividades" />
        ) : (
          <ul className="divide-y divide-border/60 rounded-md border border-border/60 bg-card/30">
            {snapshot.activity.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>
                  {a.action}
                  {a.target ? ` — ${a.target}` : ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  {a.at ? new Date(a.at).toLocaleString("pt-BR") : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}
