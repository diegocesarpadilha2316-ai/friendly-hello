import { createFileRoute } from "@tanstack/react-router";
import { Coins } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  EmptyState,
} from "@/core/components/ui-kit";
import { useBillingSummary } from "@/core/billing/use-billing";

export const Route = createFileRoute("/_authenticated/workspace/creditos")({
  head: () => ({
    meta: [
      { title: "Créditos — Workspace | Dioris Hub" },
      { name: "description", content: "Saldo e consumo de créditos da empresa." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceCreditos,
});

function WorkspaceCreditos() {
  const { summary, isLoading } = useBillingSummary();
  return (
    <PageContainer>
      <PageHeader eyebrow="Workspace" title="Créditos" description="Saldo e consumo" />
      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <MetricCard
              icon={<Coins className="h-4 w-4" />}
              label="Saldo"
              value={summary.balance.toLocaleString("pt-BR")}
            />
            <MetricCard label="Consumo no período" value={summary.usedThisPeriod.toLocaleString("pt-BR")} />
            <MetricCard
              label="Reset em"
              value={summary.resetsAt ? new Date(summary.resetsAt).toLocaleDateString("pt-BR") : "—"}
            />
          </div>
          {summary.balance === 0 && summary.usedThisPeriod === 0 ? (
            <div className="mt-6">
              <EmptyState icon={<Coins className="h-6 w-6" />} title="Sem movimentos" description="Ainda não houve consumo neste período." />
            </div>
          ) : null}
        </>
      )}
    </PageContainer>
  );
}