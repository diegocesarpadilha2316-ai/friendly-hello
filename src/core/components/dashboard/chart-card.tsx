import { DashboardWidget, type WidgetStatus } from "./dashboard-widget";
import { ChartSkeleton } from "./dashboard-skeleton";
import type { ChartSeries } from "@/core/dashboard/types";

export interface ChartCardProps {
  title: string;
  description?: string;
  series: ReadonlyArray<ChartSeries>;
  status?: WidgetStatus;
  /** Slot para renderer futuro (Recharts, Visx, etc.). */
  renderer?: (series: ReadonlyArray<ChartSeries>) => React.ReactNode;
}

export function ChartCard({ title, description, series, status, renderer }: ChartCardProps) {
  const empty = series.length === 0 || series.every((s) => s.points.length === 0);
  const resolved: WidgetStatus = status ?? (empty ? "empty" : "ready");
  return (
    <DashboardWidget
      title={title}
      description={description}
      status={resolved}
      skeleton={<ChartSkeleton />}
    >
      {renderer ? renderer(series) : <div className="h-40 rounded bg-muted/40" aria-hidden />}
    </DashboardWidget>
  );
}
