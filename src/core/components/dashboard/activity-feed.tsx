import { DashboardWidget, type WidgetStatus } from "./dashboard-widget";
import { ListSkeleton } from "./dashboard-skeleton";
import type { ActivityEntry } from "@/core/dashboard/types";
import { Clock, User, Sparkles, CheckCircle2, AlertCircle, type LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  user: User,
  ai: Sparkles,
  success: CheckCircle2,
  warning: AlertCircle,
};

export interface ActivityFeedProps {
  entries: ReadonlyArray<ActivityEntry>;
  status?: WidgetStatus;
  limit?: number;
}

export function ActivityFeed({ entries, status, limit = 6 }: ActivityFeedProps) {
  const resolved: WidgetStatus = status ?? (entries.length === 0 ? "empty" : "ready");
  const list = entries.slice(0, limit);
  return (
    <DashboardWidget
      title="Últimas atividades"
      description="Eventos recentes do tenant"
      status={resolved}
      skeleton={<ListSkeleton rows={limit} />}
    >
      <ul className="space-y-3">
        {list.map((e) => {
          const Icon: LucideIcon = e.iconKey ? (ICON_MAP[e.iconKey] ?? Clock) : Clock;
          return (
            <li key={e.id} className="flex items-start gap-3">
              <span className="mt-0.5 rounded-md bg-muted p-1.5 text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  <span className="font-medium">{e.actor}</span> {e.action}
                  {e.target ? <span className="text-muted-foreground"> · {e.target}</span> : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(e.at).toLocaleString("pt-BR")}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </DashboardWidget>
  );
}
