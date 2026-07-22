import * as React from "react";
import { DashboardCard, type DashboardCardProps } from "./dashboard-card";
import { EmptyState } from "@/core/components/ui-kit/empty-state";
import { WidgetSkeleton } from "./dashboard-skeleton";
import { AlertCircle } from "lucide-react";

export type WidgetStatus = "loading" | "empty" | "error" | "ready";

export interface DashboardWidgetProps extends DashboardCardProps {
  status: WidgetStatus;
  emptyTitle?: string;
  emptyDescription?: string;
  errorMessage?: string;
  skeleton?: React.ReactNode;
}

/**
 * Wrapper de widget que aplica os estados universais (loading/empty/error/ready)
 * sem duplicar lógica nos widgets concretos. Usa <EmptyState> do UI Kit.
 */
export function DashboardWidget({
  status,
  emptyTitle = "Sem dados",
  emptyDescription = "Ainda não há informações para exibir.",
  errorMessage,
  skeleton,
  children,
  ...cardProps
}: DashboardWidgetProps) {
  return (
    <DashboardCard {...cardProps}>
      {status === "loading" && (skeleton ?? <WidgetSkeleton />)}
      {status === "empty" && (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
      {status === "error" && (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6 text-destructive" />}
          title="Não foi possível carregar"
          description={errorMessage ?? "Tente novamente em instantes."}
        />
      )}
      {status === "ready" && children}
    </DashboardCard>
  );
}
