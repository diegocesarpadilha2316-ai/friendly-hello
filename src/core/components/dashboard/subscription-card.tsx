import { DashboardWidget, type WidgetStatus } from "./dashboard-widget";
import { StatusBadge } from "@/core/components/ui-kit/status-badge";
import type { PlanSummary } from "@/core/dashboard/types";

export interface SubscriptionCardProps {
  plan: PlanSummary | null;
  status?: WidgetStatus;
}

const TONE = {
  active: "positive",
  trial: "neutral",
  past_due: "warning",
  canceled: "danger",
} as const;

export function SubscriptionCard({ plan, status }: SubscriptionCardProps) {
  const resolved: WidgetStatus = status ?? (plan ? "ready" : "empty");
  return (
    <DashboardWidget title="Assinatura" description="Plano atual do tenant" status={resolved}>
      {plan ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">{plan.label}</div>
            <StatusBadge tone={TONE[plan.status]}>{plan.status}</StatusBadge>
          </div>
          <p className="text-xs text-muted-foreground">
            {plan.renewsAt
              ? `Renova em ${new Date(plan.renewsAt).toLocaleDateString("pt-BR")}`
              : "Sem renovação programada"}
          </p>
        </div>
      ) : null}
    </DashboardWidget>
  );
}
