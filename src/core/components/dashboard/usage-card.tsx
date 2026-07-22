import { DashboardWidget, type WidgetStatus } from "./dashboard-widget";
import type { UsageMetric } from "@/core/dashboard/types";
import { cn } from "@/lib/utils";

export interface UsageCardProps {
  title: string;
  description?: string;
  metrics: ReadonlyArray<UsageMetric>;
  status?: WidgetStatus;
}

export function UsageCard({ title, description, metrics, status }: UsageCardProps) {
  const resolved: WidgetStatus = status ?? (metrics.length === 0 ? "empty" : "ready");
  return (
    <DashboardWidget title={title} description={description} status={resolved}>
      <ul className="space-y-3">
        {metrics.map((m) => {
          const pct = m.total > 0 ? Math.min(100, Math.round((m.used / m.total) * 100)) : 0;
          return (
            <li key={m.label}>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{m.label}</span>
                <span>
                  {m.used.toLocaleString("pt-BR")} / {m.total.toLocaleString("pt-BR")} {m.unit}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-amber-500" : "bg-primary",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </DashboardWidget>
  );
}
