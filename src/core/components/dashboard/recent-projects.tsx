import { DashboardWidget, type WidgetStatus } from "./dashboard-widget";
import { ListSkeleton } from "./dashboard-skeleton";
import type { RecentProject } from "@/core/dashboard/types";
import { FolderOpen } from "lucide-react";

export interface RecentProjectsProps {
  projects: ReadonlyArray<RecentProject>;
  status?: WidgetStatus;
}

export function RecentProjects({ projects, status }: RecentProjectsProps) {
  const resolved: WidgetStatus = status ?? (projects.length === 0 ? "empty" : "ready");
  return (
    <DashboardWidget
      title="Projetos recentes"
      description="Últimos projetos atualizados"
      status={resolved}
      skeleton={<ListSkeleton rows={5} />}
      emptyTitle="Nenhum projeto ainda"
      emptyDescription="Crie um projeto em qualquer módulo para vê-lo aqui."
    >
      <ul className="divide-y divide-border">
        {projects.map((p) => (
          <li key={p.id} className="flex items-center justify-between py-2">
            <div className="flex min-w-0 items-center gap-2">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.module} · {new Date(p.updatedAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </DashboardWidget>
  );
}
