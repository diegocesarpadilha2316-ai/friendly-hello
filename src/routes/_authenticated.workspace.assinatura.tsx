import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, CreditCard, Sparkles } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  EmptyState,
  StatusBadge,
} from "@/core/components/ui-kit";
import { Button } from "@/components/ui/button";
import { useBillingSummary } from "@/core/billing/use-billing";
import { plansCatalogQuery } from "@/core/billing/queries";
import { cn } from "@/lib/utils";

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
  const plansQ = useQuery(plansCatalogQuery());
  const plans = plansQ.data ?? [];
  const currentKey = summary.plan?.key ?? null;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Workspace"
        title="Assinatura"
        description={summary.plan?.label ?? "Nenhum plano ativo"}
        actions={
          summary.subscription ? (
            <StatusBadge tone={summary.subscription.status === "active" ? "success" : "warning"}>
              {summary.subscription.status}
            </StatusBadge>
          ) : null
        }
      />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="Plano" value={summary.plan?.label ?? "—"} />
        <MetricCard label="Status" value={summary.subscription?.status ?? "—"} />
        <MetricCard label="Próximo ciclo" value={summary.resetsAt ? new Date(summary.resetsAt).toLocaleDateString("pt-BR") : "—"} />
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Catálogo</p>
            <h3 className="text-lg font-semibold">Planos disponíveis</h3>
          </div>
          {plansQ.isLoading ? (
            <span className="text-xs text-muted-foreground">Carregando…</span>
          ) : null}
        </div>
        {plans.length === 0 ? (
          <EmptyState icon={<CreditCard className="h-6 w-6" />} title="Nenhum plano cadastrado" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((p) => {
              const active = p.key === currentKey;
              return (
                <div
                  key={p.key}
                  className={cn(
                    "flex flex-col rounded-lg border p-5 transition-all",
                    active
                      ? "border-primary/60 bg-primary/5 shadow-[var(--shadow-brand)]"
                      : "border-border/60 bg-card/30 hover:bg-card/60",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold">{p.label}</h4>
                    {active ? (
                      <StatusBadge tone="success">atual</StatusBadge>
                    ) : (
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: p.currency,
                    }).format(p.priceCents / 100)}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">/mês</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.monthlyCredits.toLocaleString("pt-BR")} créditos/mês
                  </p>
                  <ul className="mt-4 flex-1 space-y-1.5 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-5"
                    variant={active ? "outline" : "default"}
                    size="sm"
                    disabled={active}
                  >
                    {active
                      ? "Plano atual"
                      : currentKey && (currentKey === "free" || p.priceCents > (summary.plan?.priceCents ?? 0))
                        ? "Upgrade"
                        : "Trocar plano"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Alterações de plano acionam o processador de billing configurado no Admin.
        </p>
      </div>
    </PageContainer>
  );
}