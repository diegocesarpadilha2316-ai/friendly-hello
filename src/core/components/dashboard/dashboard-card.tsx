import * as React from "react";
import { cn } from "@/lib/utils";

export interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  /** Padding interno customizável (default: p-5). */
  padded?: boolean;
}

/**
 * Contêiner base de todo widget do Dashboard.
 * Não conhece dados — apenas header + slot. Compose com skeletons/empty/error
 * fornecidos pelos wrappers específicos (KpiCard, ChartCard, etc.).
 */
export function DashboardCard({
  title,
  description,
  actions,
  icon,
  padded = true,
  className,
  children,
  ...rest
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground shadow-sm",
        padded && "p-5",
        className,
      )}
      {...rest}
    >
      {(title || actions) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {icon ? <span className="text-muted-foreground">{icon}</span> : null}
              {title ? (
                <h3 className="truncate text-sm font-semibold tracking-tight">{title}</h3>
              ) : null}
            </div>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      )}
      {children}
    </div>
  );
}
