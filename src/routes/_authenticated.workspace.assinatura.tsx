import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  CreditCard,
  Sparkles,
  Calendar,
  Coins,
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
  Receipt,
  Shield,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  EmptyState,
  StatusBadge,
  Button,
} from "@/core/components/ui-kit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useBillingSummary,
  useCreditLedger,
  usePlansCatalog,
} from "@/core/billing/use-billing";
import { useAudit } from "@/core/observability/use-observability";
import { cn } from "@/lib/utils";
import type { PlanDefinition } from "@/core/billing/types";

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

function formatCurrency(cents: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(cents / 100);
}

function daysBetween(a: Date, b: Date) {
  return Math.max(0, Math.round((a.getTime() - b.getTime()) / 86_400_000));
}

function WorkspaceAssinatura() {
  const { summary, isLoading, refetch } = useBillingSummary();
  const { plans, isLoading: loadingPlans } = usePlansCatalog();
  const { entries } = useCreditLedger();
  const auditQ = useAudit({ entity: "subscription" });

  const now = new Date();
  const resets = summary.resetsAt ? new Date(summary.resetsAt) : null;
  const daysLeft = resets ? daysBetween(resets, now) : null;
  const periodStart = summary.subscription?.currentPeriodStart
    ? new Date(summary.subscription.currentPeriodStart)
    : null;
  const periodTotal = resets && periodStart ? daysBetween(resets, periodStart) : null;
  const periodProgress =
    periodTotal && daysLeft !== null && periodTotal > 0
      ? Math.min(100, Math.max(0, Math.round(((periodTotal - daysLeft) / periodTotal) * 100)))
      : 0;

  const trialEnds = summary.subscription?.trialEndsAt
    ? new Date(summary.subscription.trialEndsAt)
    : null;
  const isTrial = summary.subscription?.status === "trial";
  const isPastDue = summary.subscription?.status === "past_due";
  const willCancel = summary.subscription?.cancelAtPeriodEnd;

  const grantsInPeriod = React.useMemo(() => {
    if (!periodStart) return 0;
    return entries
      .filter((e) => e.kind === "grant" && new Date(e.createdAt) >= periodStart)
      .reduce((a, e) => a + e.amount, 0);
  }, [entries, periodStart]);

  const status = summary.subscription?.status ?? "—";
  const statusTone: React.ComponentProps<typeof StatusBadge>["tone"] =
    status === "active" ? "success"
    : status === "trial" ? "info"
    : status === "past_due" ? "danger"
    : status === "canceled" ? "warning"
    : "neutral";

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Workspace"
        title="Assinatura"
        description="Gerencie plano, ciclo de faturamento e pagamento da empresa."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
            <Button>
              <ArrowUpRight className="mr-2 h-4 w-4" /> Fazer upgrade
            </Button>
          </div>
        }
      />

      {/* Alertas contextuais */}
      {(isPastDue || willCancel || (isTrial && trialEnds)) && (
        <div className="mt-6 space-y-2">
          {isPastDue ? (
            <Card className="border-destructive/40 bg-destructive/10">
              <CardContent className="flex items-center gap-3 py-4 text-sm">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span>
                  Pagamento pendente. Regularize para manter o acesso completo à plataforma.
                </span>
              </CardContent>
            </Card>
          ) : null}
          {willCancel ? (
            <Card className="border-amber-500/40 bg-amber-500/10">
              <CardContent className="flex items-center gap-3 py-4 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>
                  Assinatura será cancelada no fim do período atual
                  {resets ? ` (${resets.toLocaleDateString("pt-BR")})` : ""}.
                </span>
              </CardContent>
            </Card>
          ) : null}
          {isTrial && trialEnds ? (
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="flex items-center gap-3 py-4 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>
                  Trial termina em {trialEnds.toLocaleDateString("pt-BR")} —{" "}
                  faça upgrade para continuar sem interrupção.
                </span>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {/* KPIs */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<CreditCard className="h-4 w-4" />}
          label="Plano ativo"
          value={isLoading ? "…" : summary.plan?.label ?? "Free"}
          hint={summary.plan ? formatCurrency(summary.plan.priceCents, summary.plan.currency) + "/mês" : "sem cobrança"}
        />
        <MetricCard
          icon={<Shield className="h-4 w-4" />}
          label="Status"
          value={status}
          hint={willCancel ? "cancelamento agendado" : "assinatura"}
        />
        <MetricCard
          icon={<Calendar className="h-4 w-4" />}
          label="Renova em"
          value={resets ? resets.toLocaleDateString("pt-BR") : "—"}
          hint={daysLeft !== null ? `${daysLeft} dias restantes` : ""}
        />
        <MetricCard
          icon={<Coins className="h-4 w-4" />}
          label="Créditos/ciclo"
          value={(summary.plan?.monthlyCredits ?? 0).toLocaleString("pt-BR")}
          hint={`${grantsInPeriod.toLocaleString("pt-BR")} concedidos`}
        />
      </div>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList>
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="billing">Faturamento</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">Ciclo atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-semibold">
                    {daysLeft !== null ? `${daysLeft}` : "—"}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      dias restantes
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {periodStart ? periodStart.toLocaleDateString("pt-BR") : "—"} →{" "}
                    {resets ? resets.toLocaleDateString("pt-BR") : "—"}
                  </p>
                </div>
                <StatusBadge tone={statusTone}>{status}</StatusBadge>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[image:var(--gradient-brand)] transition-all"
                  style={{ width: `${periodProgress}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Início</p>
                  <p className="text-sm font-medium">
                    {periodStart ? periodStart.toLocaleDateString("pt-BR") : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Progresso</p>
                  <p className="text-sm font-medium">{periodProgress}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Renovação</p>
                  <p className="text-sm font-medium">
                    {resets ? resets.toLocaleDateString("pt-BR") : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">Resumo do plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Plano" value={summary.plan?.label ?? "Free"} />
              <Row
                label="Preço"
                value={
                  summary.plan ? formatCurrency(summary.plan.priceCents, summary.plan.currency) : "—"
                }
              />
              <Row
                label="Créditos mensais"
                value={(summary.plan?.monthlyCredits ?? 0).toLocaleString("pt-BR")}
              />
              <Row
                label="Provedor"
                value={summary.subscription?.externalProvider ?? "interno"}
              />
              <Row
                label="Trial até"
                value={trialEnds ? trialEnds.toLocaleDateString("pt-BR") : "—"}
              />
              {summary.plan?.features?.length ? (
                <ul className="mt-3 space-y-1.5">
                  {summary.plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <Check className="mt-0.5 h-3.5 w-3.5 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans */}
        <TabsContent value="plans" className="mt-6">
          {loadingPlans ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : plans.length === 0 ? (
            <EmptyState icon={<CreditCard className="h-6 w-6" />} title="Nenhum plano cadastrado" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {plans.map((p) => (
                <PlanCard
                  key={p.key}
                  plan={p}
                  currentPriceCents={summary.plan?.priceCents ?? 0}
                  isCurrent={p.key === (summary.plan?.key ?? null)}
                />
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Alterações de plano acionam o processador de billing configurado no Admin.
          </p>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing" className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">Método de pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.subscription?.externalProvider ? (
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 p-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">
                        Provedor: {summary.subscription.externalProvider}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Faturamento gerenciado externamente
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Gerenciar</Button>
                </div>
              ) : (
                <EmptyState
                  icon={<CreditCard className="h-6 w-6" />}
                  title="Sem método cadastrado"
                  description="Configure um método de pagamento para habilitar cobranças automáticas."
                />
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">Próxima cobrança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row
                label="Valor"
                value={
                  summary.plan
                    ? formatCurrency(summary.plan.priceCents, summary.plan.currency)
                    : "—"
                }
              />
              <Row
                label="Data"
                value={resets ? resets.toLocaleDateString("pt-BR") : "—"}
              />
              <Row label="Ciclo" value="Mensal" />
              <div className="pt-2 text-xs text-muted-foreground">
                <Receipt className="mr-1 inline h-3 w-3" />
                Faturas emitidas pelo provedor externo aparecerão aqui.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="mt-6">
          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">Eventos da assinatura</CardTitle>
            </CardHeader>
            <CardContent>
              {auditQ.isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando…</p>
              ) : !auditQ.data || auditQ.data.length === 0 ? (
                <EmptyState
                  icon={<Receipt className="h-6 w-6" />}
                  title="Sem histórico"
                  description="Nenhum evento de assinatura registrado ainda."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase text-muted-foreground">
                      <tr className="border-b border-border/60">
                        <th className="py-2 text-left">Data</th>
                        <th className="py-2 text-left">Ação</th>
                        <th className="py-2 text-left">Ator</th>
                        <th className="py-2 text-left">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditQ.data.slice(0, 50).map((e) => (
                        <tr key={e.id} className="border-b border-border/40 last:border-0">
                          <td className="py-2 text-muted-foreground">
                            {new Date(e.createdAt).toLocaleString("pt-BR")}
                          </td>
                          <td className="py-2">
                            <StatusBadge tone="info">{e.action}</StatusBadge>
                          </td>
                          <td className="py-2 text-muted-foreground">
                            {e.actorId?.slice(0, 8) ?? "sistema"}
                          </td>
                          <td className="py-2 text-xs text-muted-foreground">
                            {e.entityId ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function PlanCard({
  plan,
  currentPriceCents,
  isCurrent,
}: {
  plan: PlanDefinition;
  currentPriceCents: number;
  isCurrent: boolean;
}) {
  const isUpgrade = plan.priceCents > currentPriceCents;
  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border p-5 transition-all",
        isCurrent
          ? "border-primary/60 bg-primary/5 shadow-[var(--shadow-brand)]"
          : "border-border/60 bg-card/30 hover:bg-card/60",
      )}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold">{plan.label}</h4>
        {isCurrent ? (
          <StatusBadge tone="success">atual</StatusBadge>
        ) : (
          <Sparkles className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {formatCurrency(plan.priceCents, plan.currency)}
        <span className="ml-1 text-xs font-normal text-muted-foreground">/mês</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {plan.monthlyCredits.toLocaleString("pt-BR")} créditos/mês
      </p>
      <ul className="mt-4 flex-1 space-y-1.5 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 text-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button
        className="mt-5"
        variant={isCurrent ? "outline" : "default"}
        size="sm"
        disabled={isCurrent}
      >
        {isCurrent ? "Plano atual" : isUpgrade ? "Upgrade" : "Trocar plano"}
      </Button>
    </div>
  );
}