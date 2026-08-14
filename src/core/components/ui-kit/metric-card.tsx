import * as React from "react";
import { cn } from "@/lib/utils";

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: { value: string; direction: "up" | "down" | "neutral" };
}

const TREND_TONE: Record<NonNullable<MetricCardProps["trend"]>["direction"], string> = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-destructive",
  neutral: "text-muted-foreground",
};

export function MetricCard({
  label,
  value,
  hint,
  icon,
  trend,
  className,
  ...props
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
      {(hint || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {trend ? (
            <span className={cn("font-medium", TREND_TONE[trend.direction])}>{trend.value}</span>
          ) : null}
          {hint ? <span className="text-muted-foreground">{hint}</span> : null}
        </div>
      )}
    </div>
  );
}
