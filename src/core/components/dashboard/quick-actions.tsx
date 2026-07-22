import { DashboardCard } from "./dashboard-card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import type { QuickAction } from "@/core/dashboard/types";
import { usePermissions } from "@/core/hooks/use-permissions";

export interface QuickActionsProps {
  actions: ReadonlyArray<QuickAction>;
  title?: string;
}

export function QuickActions({ actions, title = "Ações rápidas" }: QuickActionsProps) {
  const perms = usePermissions();
  const visible = actions.filter((a) => (a.permission ? perms.can(a.permission) : true));
  if (visible.length === 0) return null;
  return (
    <DashboardCard title={title}>
      <div className="flex flex-wrap gap-2">
        {visible.map((a) => {
          const Icon = a.icon;
          return (
            <Button key={a.id} size="sm" variant="outline" asChild>
              <Link to={a.to as never}>
                {Icon ? <Icon className="mr-1 h-4 w-4" /> : null}
                {a.label}
              </Link>
            </Button>
          );
        })}
      </div>
    </DashboardCard>
  );
}
