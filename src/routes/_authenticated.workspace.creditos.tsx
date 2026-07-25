import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Coins,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Calendar,
  Package,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  Receipt,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  EmptyState,
  StatusBadge,
  Button,
} from "@/core/components/ui-kit";
import {
  useBillingSummary,
  useCreditLedger,
  usePlansCatalog,
} from "@/core/billing/use-billing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAIMetrics } from "@/core/ai/use-ai";
import type { CreditKind, PlanDefinition } from "@/core/billing/types";
import { CheckoutDialog } from "@/core/billing/CheckoutDialog";
import { listCheckoutOrders, type CheckoutOrderDTO } from "@/lib/checkout.functions";

export const Route = createFileRoute("/_authenticated/workspace/creditos")({
  head: () => ({
    meta: [
      { title: "Créditos — Workspace | Dioris Hub" },
      { name: "description", content: "Saldo, consumo e planos de créditos da empresa." },
      { property: "og:title", content: "Créditos — Workspace | Dioris Hub" },
      { property: "og:description", content: "Gerencie o saldo e consumo de créditos." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceCreditos,
});

const KIND_LABEL: Record<CreditKind, string> = {
  grant: "Concessão",
  consume: "Consumo",
  refund: "Reembolso",
  adjustment: "Ajuste",
  expire: "Expiração",
};

const KIND_TONE: Record<CreditKind, "success" | "warning" | "info" | "neutral" | "danger"> = {
  grant: "success",
  consume: "warning",
  refund: "info",
  adjustment: "neutral",
  expire: "danger",
};

const ORDER_TONE: Record<
  CheckoutOrderDTO["status"],
  "success" | "warning" | "info" | "neutral" | "danger"
> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
  expired: "neutral",
  refunded: "info",
};

const ORDER_LABEL: Record<CheckoutOrderDTO["status"], string> = {
  pending: "Aguardando",
  approved: "Aprovado",
  rejected: "Recusado",
  cancelled: "Cancelado",
  expired: "Expirado",
  refunded: "Reembolsado",
};

function formatCurrency(cents: number, currency = "BRL") {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency });
}

function WorkspaceCreditos() {
  const { summary, isLoading, refetch } = useBillingSummary();
  const { entries, isLoading: loadingLedger } = useCreditLedger();
  const { plans, isLoading: loadingPlans } = usePlansCatalog();
  const aiMetrics = useAIMetrics();
  const listOrders = useServerFn(listCheckoutOrders);
  const ordersQ = useQuery({
    queryKey: ["checkout", "orders"],
    queryFn: () => listOrders(),
    staleTime: 30_000,
  });
  const orders = ordersQ.data?.orders ?? [];

  const totalGranted = React.useMemo(
    () => entries.filter((e) => e.kind === "grant").reduce((a, e) => a + e.amount, 0),
    [entries],
  );
  const totalConsumed = React.useMemo(
    () => entries.filter((e) => e.kind === "consume").reduce((a, e) => a + Math.abs(e.amount), 0),
    [entries],
  );
  const usagePct =
    totalGranted > 0 ? Math.min(100, Math.round((totalConsumed / totalGranted) * 100)) : 0;

  const aiRequests = aiMetrics.data?.requests ?? 0;
  const aiCreditsSpent = aiMetrics.data?.creditsSpent ?? 0;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Workspace"
        title="Créditos & Consumo"
        description="Acompanhe o saldo, o histórico e o plano ativo da sua empresa."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <CheckoutDialog
              trigger={
                <Button>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Comprar créditos
                </Button>
              }
            />
          </div>
        }
      />

      {/* KPIs */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Coins className="h-4 w-4" />}
          label="Saldo disponível"
          value={isLoading ? "…" : summary.balance.toLocaleString("pt-BR")}
          hint="créditos ativos"
        />
        <MetricCard
          icon={<TrendingDown className="h-4 w-4" />}
          label="Consumo no período"
          value={summary.usedThisPeriod.toLocaleString("pt-BR")}
          hint={`${usagePct}% do concedido`}
        />
        <MetricCard
          icon={<Package className="h-4 w-4" />}
          label="Plano ativo"
          value={summary.plan?.label ?? "Free"}
          hint={
            summary.subscription?.status
              ? `status: ${summary.subscription.status}`
              : "sem assinatura"
          }
        />
        <MetricCard
          icon={<Calendar className="h-4 w-4" />}
          label="Renova em"
          value={
            summary.resetsAt
              ? new Date(summary.resetsAt).toLocaleDateString("pt-BR")
              : "—"
          }
          hint="próximo ciclo"
        />
      </div>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList>
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="ledger">Histórico</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="usage">Uso por serviço</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">Uso do período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-semibold text-foreground">
                    {summary.usedThisPeriod.toLocaleString("pt-BR")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    créditos consumidos de{" "}
                    {(summary.plan?.monthlyCredits ?? totalGranted).toLocaleString("pt-BR")}
                  </p>
                </div>
                <StatusBadge tone={usagePct >= 90 ? "danger" : usagePct >= 60 ? "warning" : "success"}>
                  {usagePct}% utilizado
                </StatusBadge>
              </div>
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[image:var(--gradient-brand)] transition-all"
                  style={{ width: `${usagePct}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Concedido</p>
                  <p className="text-sm font-medium text-foreground">
                    {totalGranted.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Consumido</p>
                  <p className="text-sm font-medium text-foreground">
                    {totalConsumed.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Saldo</p>
                  <p className="text-sm font-medium text-foreground">
                    {summary.balance.toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">Assinatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Plano</span>
                <span className="font-medium">{summary.plan?.label ?? "Free"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge tone={summary.subscription?.status === "active" ? "success" : "neutral"}>
                  {summary.subscription?.status ?? "—"}
                </StatusBadge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Créditos/mês</span>
                <span className="font-medium">
                  {(summary.plan?.monthlyCredits ?? 0).toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Preço</span>
                <span className="font-medium">
                  {summary.plan
                    ? formatCurrency(summary.plan.priceCents, summary.plan.currency)
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Renova em</span>
                <span className="font-medium">
                  {summary.resetsAt
                    ? new Date(summary.resetsAt).toLocaleDateString("pt-BR")
                    : "—"}
                </span>
              </div>
              <Button className="mt-2 w-full" variant="secondary">
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Ver planos disponíveis
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ledger */}
        <TabsContent value="ledger" className="mt-6">
          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">Histórico de movimentos</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLedger ? (
                <p className="text-sm text-muted-foreground">Carregando…</p>
              ) : entries.length === 0 ? (
                <EmptyState
                  icon={<Coins className="h-6 w-6" />}
                  title="Sem movimentos"
                  description="Ainda não houve concessão ou consumo de créditos."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase text-muted-foreground">
                      <tr className="border-b border-border/60">
                        <th className="py-2 text-left">Data</th>
                        <th className="py-2 text-left">Tipo</th>
                        <th className="py-2 text-left">Motivo</th>
                        <th className="py-2 text-left">Referência</th>
                        <th className="py-2 text-right">Quantidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.slice(0, 100).map((e) => (
                        <tr key={e.id} className="border-b border-border/40 last:border-0">
                          <td className="py-2 text-muted-foreground">
                            {new Date(e.createdAt).toLocaleString("pt-BR")}
                          </td>
                          <td className="py-2">
                            <StatusBadge tone={KIND_TONE[e.kind]}>{KIND_LABEL[e.kind]}</StatusBadge>
                          </td>
                          <td className="py-2">{e.reason ?? "—"}</td>
                          <td className="py-2 text-muted-foreground">{e.reference ?? "—"}</td>
                          <td
                            className={`py-2 text-right font-medium ${
                              e.amount >= 0 ? "text-emerald-400" : "text-amber-400"
                            }`}
                          >
                            {e.amount > 0 ? "+" : ""}
                            {e.amount.toLocaleString("pt-BR")}
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

        {/* Plans */}
        <TabsContent value="plans" className="mt-6">
          {loadingPlans ? (
            <p className="text-sm text-muted-foreground">Carregando planos…</p>
          ) : plans.length === 0 ? (
            <EmptyState
              icon={<Package className="h-6 w-6" />}
              title="Catálogo indisponível"
              description="Nenhum plano configurado no momento."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.key}
                  plan={plan}
                  current={summary.plan?.key === plan.key}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Usage by service */}
        <TabsContent value="usage" className="mt-6">
          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">Uso por serviço</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-border/60 bg-card/60 p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" /> IA Gateway
                  </div>
                  <p className="mt-1 text-2xl font-semibold">
                    {aiRequests.toLocaleString("pt-BR")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    requisições · {aiCreditsSpent.toLocaleString("pt-BR")} créditos
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-card/60 p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5" /> Consumo médio
                  </div>
                  <p className="mt-1 text-2xl font-semibold">
                    {entries.length
                      ? Math.round(totalConsumed / Math.max(1, entries.length)).toLocaleString("pt-BR")
                      : "0"}
                  </p>
                  <p className="text-xs text-muted-foreground">créditos por movimento</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-card/60 p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Coins className="h-3.5 w-3.5" /> Movimentos
                  </div>
                  <p className="mt-1 text-2xl font-semibold">{entries.length}</p>
                  <p className="text-xs text-muted-foreground">registros no ledger</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function PlanCard({ plan, current }: { plan: PlanDefinition; current: boolean }) {
  return (
    <Card
      className={`relative border-border/60 bg-card/80 ${
        current ? "ring-1 ring-primary/60 shadow-[var(--shadow-brand)]" : ""
      }`}
    >
      {current ? (
        <div className="absolute right-3 top-3">
          <StatusBadge tone="success">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Atual
          </StatusBadge>
        </div>
      ) : null}
      <CardHeader>
        <CardTitle className="text-base">{plan.label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-3xl font-semibold">
            {formatCurrency(plan.priceCents, plan.currency)}
          </p>
          <p className="text-xs text-muted-foreground">/mês</p>
        </div>
        <div className="text-sm">
          <span className="font-medium">
            {plan.monthlyCredits.toLocaleString("pt-BR")}
          </span>{" "}
          <span className="text-muted-foreground">créditos/mês</span>
        </div>
        {plan.features.length > 0 ? (
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-primary" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <Button
          className="w-full"
          variant={current ? "ghost" : "default"}
          disabled={current}
        >
          {current ? "Plano atual" : "Selecionar plano"}
        </Button>
      </CardContent>
    </Card>
  );
}