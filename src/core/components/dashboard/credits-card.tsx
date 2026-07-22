import { DashboardWidget, type WidgetStatus } from "./dashboard-widget";
import type { CreditsSummary } from "@/core/dashboard/types";

export interface CreditsCardProps {
  credits: CreditsSummary | null;
  status?: WidgetStatus;
}

export function CreditsCard({ credits, status }: CreditsCardProps) {
  const resolved: WidgetStatus = status ?? (credits ? "ready" : "empty");
  return (
    <DashboardWidget
      title="Créditos disponíveis"
      description="Balanço do período atual"
      status={resolved}
    >
      {credits ? (
        <>
          <div className="text-3xl font-semibold tracking-tight">
            {credits.available.toLocaleString("pt-BR")}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Consumido: {credits.used.toLocaleString("pt-BR")}
            {credits.resetsAt
              ? ` · reset em ${new Date(credits.resetsAt).toLocaleDateString("pt-BR")}`
              : ""}
          </p>
        </>
      ) : null}
    </DashboardWidget>
  );
}
