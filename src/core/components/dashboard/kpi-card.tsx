import { DashboardWidget, type WidgetStatus } from "./dashboard-widget";
import type { KpiPoint } from "@/core/dashboard/types";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  title: string;
  description?: string;
  kpi: KpiPoint | null;
  status?: WidgetStatus;
}

const TONE: Record<NonNullable<KpiPoint["tone"]>, string> = {
  neutral: "text-foreground",
  brand: "text-primary",
  positive: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-destructive",
};

export function KpiCard({ title, description, kpi, status }: KpiCardProps) {
  const resolved: WidgetStatus = status ?? (kpi ? "ready" : "empty");
  return (
    <DashboardWidget title={title} description={description} status={resolved}>
      {kpi ? (
        <>
          <div className={cn("text-3xl font-semibold tracking-tight", TONE[kpi.tone ?? "neutral"])}>
            {kpi.value.toLocaleString("pt-BR")}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs">
            {typeof kpi.delta === "number" ? (
              <span
                className={cn(
                  "font-medium",
                  kpi.delta > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : kpi.delta < 0
                      ? "text-destructive"
                      : "text-muted-foreground",
                )}
              >
                {kpi.delta > 0 ? "+" : ""}
                {kpi.delta}%
              </span>
            ) : null}
            {kpi.hint ? <span className="text-muted-foreground">{kpi.hint}</span> : null}
          </div>
        </>
      ) : null}
    </DashboardWidget>
  );
}
