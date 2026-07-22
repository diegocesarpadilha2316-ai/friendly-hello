import { createFileRoute } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  EmptyState,
  StatusBadge,
} from "@/core/components/ui-kit";
import { useBillingSummary } from "@/core/billing/use-billing";

export const Route = createFileRoute("/_authenticated/workspace/assinatura")({
  head: () => ({
    meta: [
      { title: "Assinatura — Workspace | Dioris Hub" },
      { name: "description", content: "Plano ativo, ciclo de faturamento e status da assinatura." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceAssinatura,
});

function WorkspaceAssinatura() {
  const { summary } = useBillingSummary();
  if (!summary.plan) {
    return (
      <PageContainer>
        <PageHeader eyebrow="Workspace" title="Assinatura" />
        <div className="mt-6">
          <EmptyState icon={<CreditCard className="h-6 w-6" />} title="Nenhum plano ativo" description="Contrate um plano para desbloquear módulos." />
        </div>
      </PageContainer>
    );
  }
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Workspace"
        title="Assinatura"
        description={summary.plan.label}
        actions={
          summary.subscription ? (
            <StatusBadge tone={summary.subscription.status === "active" ? "success" : "warning"}>
              {summary.subscription.status}
            </StatusBadge>
          ) : null
        }
      />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="Plano" value={summary.plan.label} />
        <MetricCard label="Status" value={summary.subscription?.status ?? "—"} />
        <MetricCard label="Próximo ciclo" value={summary.resetsAt ? new Date(summary.resetsAt).toLocaleDateString("pt-BR") : "—"} />
      </div>
    </PageContainer>
  );
}