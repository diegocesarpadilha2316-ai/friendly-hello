import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Coins,
  Sparkles,
  HardDrive,
  Bell,
  Activity,
  Users,
  ListTodo,
  ArrowRight,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Gauge,
  Plug,
  FolderOpen,
  Rocket,
  UserPlus,
  Upload,
  Settings,
  CreditCard,
  Lock,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  EmptyState,
  StatusBadge,
} from "@/core/components/ui-kit";
import { useOptionalTenant } from "@/core/providers/TenantProvider";
import { useOptionalAuth } from "@/core/hooks";
import { modules as MODULES, getPlanModules, PLAN_LABEL, firstPlanWithModule } from "@/core/config";
import { useDashboardSnapshot } from "@/core/dashboard/use-dashboard";
import { useBillingSummary } from "@/core/billing/use-billing";
import { useAssetsStats } from "@/core/assets/use-assets";
import { useNotifications } from "@/core/notifications/use-notifications";
import { useEvents, useEventMetrics } from "@/core/events/use-events";
import { useJobsSnapshotQuery } from "@/core/jobs/use-jobs";
import { useAIMetrics } from "@/core/ai/use-ai";
import { useHealth, useObservabilityMetrics } from "@/core/observability/use-observability";
import { useIntegrationsHealth } from "@/core/integrations/use-integrations";
import {
  CreditsCard,
  SubscriptionCard,
  UsageCard,
  ChartCard,
  ActivityFeed,
  RecentProjects,
  QuickActions,
  FavoriteModules,
  DashboardCard,
  DashboardGrid,
  DashboardGridItem,
} from "@/core/components/dashboard";
import type { ChartSeries, QuickAction } from "@/core/dashboard/types";

export const Route = createFileRoute("/_authenticated/workspace/")({
  head: () => ({
    meta: [
      { title: "Workspace — Dashboard | Dioris Hub" },
      {
        name: "description",
        content:
          "Visão consolidada da empresa: créditos, plano, consumo de IA, storage, notificações e atividades recentes.",
      },
      { property: "og:title", content: "Workspace — Dashboard | Dioris Hub" },
      {
        property: "og:description",
        content: "Dashboard executivo do Workspace Dioris.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceDashboard,
});

function WorkspaceDashboard() {
  const tenant = useOptionalTenant();
  const auth = useOptionalAuth();
  const { snapshot, isLoading } = useDashboardSnapshot();
  const billing = useBillingSummary();
  const assets = useAssetsStats();
  const notifs = useNotifications();
  const events = useEvents();
  const eventMetrics = useEventMetrics();
  const jobs = useJobsSnapshotQuery();
  const aiMetrics = useAIMetrics();
  const health = useHealth();
  const observability = useObservabilityMetrics();
  const integrationsHealth = useIntegrationsHealth();

  const company = tenant?.activeCompany;
  const notifList = Array.isArray(notifs.data) ? notifs.data : [];
  const unread = notifList.filter((n) => !n.readAt).length;
  const jobsData = jobs.data;
  const jobsList = Array.isArray(jobsData?.jobs) ? jobsData!.jobs : [];
  const activeJobs = jobsList.filter((j) =>
    ["pending", "queued", "running", "retrying"].includes(String(j.status)),
  ).length;
  const eventsList = Array.isArray(events.data) ? events.data : [];
  const eventsTotal = eventMetrics.data?.total ?? eventsList.length;
  const eventsFailed = eventMetrics.data?.failed ?? 0;
  const openErrors = observability.data?.summary.errorsOpen ?? 0;
  const errorRate = observability.data?.errorRatePct ?? 0;
  const healthList = Array.isArray(health.data) ? health.data : [];
  const healthy = healthList.filter((h) => h.status === "healthy").length;
  const degraded = healthList.filter(
    (h) => h.status === "degraded" || h.status === "down",
  ).length;
  const teamCount = tenant?.companies.length ?? 0;
  const integrationsCount = Array.isArray(integrationsHealth.data)
    ? integrationsHealth.data.length
    : 0;

  const aiChart: ChartSeries[] = [
    {
      name: "IA por capacidade",
      points: snapshot.aiToday.byCapability.map((c) => ({
        x: c.capability,
        y: c.count,
      })),
    },
  ];
  const eventsChart: ChartSeries[] = eventMetrics.data
    ? [
        {
          name: "Eventos",
          points: [
            { x: "pendentes", y: eventMetrics.data.pending },
            { x: "entregues", y: eventMetrics.data.delivered },
            { x: "falhas", y: eventMetrics.data.failed },
            { x: "dead", y: eventMetrics.data.dead },
          ],
        },
      ]
    : [];
  const jobsChart: ChartSeries[] = jobsData
    ? [
        {
          name: "Jobs",
          points: [
            { x: "ativos", y: activeJobs },
            {
              x: "concluídos",
              y:
                jobsList.filter((j) => String(j.status) === "completed").length,
            },
            {
              x: "falhas",
              y:
                jobsList.filter((j) => String(j.status) === "failed").length,
            },
          ],
        },
      ]
    : [];

  const quickActions: QuickAction[] = [
    { id: "planner", label: "Abrir Planner", to: "/planner", icon: Rocket },
    { id: "team", label: "Convidar usuário", to: "/workspace/equipe", icon: UserPlus },
    { id: "credits", label: "Comprar créditos", to: "/workspace/creditos", icon: Coins },
    { id: "plan", label: "Upgrade do plano", to: "/workspace/assinatura", icon: CreditCard },
    { id: "upload", label: "Upload de arquivos", to: "/workspace/assets", icon: Upload },
    { id: "ai", label: "Abrir IA", to: "/workspace/ia", icon: Sparkles },
    { id: "settings", label: "Configurações", to: "/workspace/configuracoes", icon: Settings },
  ];

  const storageMb = ((assets.data?.usedBytes ?? 0) / (1024 * 1024)).toFixed(1);

  const planKey = (billing.summary.plan?.key ?? "free") as
    | "free" | "starter" | "pro" | "business" | "enterprise";
  const subscribed = new Set(getPlanModules(planKey));
  const firstName = auth?.user?.email?.split("@")[0] ?? "";

  return (
    <PageContainer>
      {/* Hero ecossistema — visual convidativo, foco imediato nos módulos. */}
      <section
        className="relative overflow-hidden rounded-3xl border border-border/60 p-6 sm:p-10"
        style={{
          background:
            "radial-gradient(1200px 400px at 100% 0%, color-mix(in oklab, var(--accent) 24%, transparent), transparent 60%), radial-gradient(900px 400px at 0% 100%, color-mix(in oklab, var(--primary) 22%, transparent), transparent 60%), var(--gradient-brand, linear-gradient(135deg, oklch(0.22 0.12 290), oklch(0.18 0.10 240)))",
        }}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary-foreground/70">
              Ecossistema Dioris
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">
              Olá{firstName ? `, ${firstName}` : ""} — bem-vindo(a) ao seu espaço.
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-primary-foreground/80 sm:text-base">
              {company
                ? `${company.name} · Plano ${PLAN_LABEL[planKey]} · Uma única plataforma para operar Planner, CRM, Financeiro, IA e muito mais.`
                : "Uma única plataforma para operar todos os módulos do seu negócio."}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge tone="info">Plano {PLAN_LABEL[planKey]}</StatusBadge>
              {company?.status ? (
                <StatusBadge tone={company.status === "active" ? "success" : "warning"}>
                  {company.status}
                </StatusBadge>
              ) : null}
              <StatusBadge tone="info" dot={false}>
                {subscribed.size} módulo{subscribed.size === 1 ? "" : "s"} assinado{subscribed.size === 1 ? "" : "s"}
              </StatusBadge>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/workspace/assinatura"
              className="inline-flex items-center gap-2 rounded-full bg-background/90 px-4 py-2 text-sm font-medium text-foreground shadow-lg backdrop-blur transition-colors hover:bg-background"
            >
              <CreditCard className="h-4 w-4" /> Ver plano
            </Link>
            <Link
              to="/workspace/modulos"
              className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              Explorar módulos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Grade de módulos — ecossistema. Assinados destacados; demais em CTA. */}
      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Seus módulos</h2>
            <p className="text-sm text-muted-foreground">
              {subscribed.size > 0
                ? "Acesse rapidamente os módulos incluídos no seu plano."
                : "Assine um plano para ativar módulos e começar a operar."}
            </p>
          </div>
          <Link
            to="/workspace/modulos"
            className="hidden text-xs text-primary hover:underline sm:inline-flex"
          >
            Ver todos
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m) => {
            const active = subscribed.has(m.id);
            const Icon = m.icon;
            const unlockPlan = active ? null : PLAN_LABEL[firstPlanWithModule(m.id)];
            const target = active ? m.path : "/workspace/assinatura";
            return (
              <Link
                key={m.id}
                to={target as never}
                className={
                  "group relative overflow-hidden rounded-2xl border p-4 transition-all " +
                  (active
                    ? "border-primary/40 bg-card hover:-translate-y-0.5 hover:border-primary hover:shadow-xl hover:shadow-primary/10"
                    : "border-border/60 bg-card/40 hover:bg-card")
                }
              >
                <div className="flex items-start justify-between">
                  <div
                    className={
                      "flex h-11 w-11 items-center justify-center rounded-xl " +
                      (active
                        ? "bg-gradient-to-br from-primary/30 to-accent/30 text-primary-foreground ring-1 ring-primary/40"
                        : "bg-muted text-muted-foreground")
                    }
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  {active ? (
                    <StatusBadge tone="success" dot={false}>Ativo</StatusBadge>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      <Lock className="h-3 w-3" /> {unlockPlan}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold">{m.label}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {m.description}
                </p>
                <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  {active ? "Abrir" : "Fazer upgrade"} <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* KPIs — linha superior (10 métricas essenciais) */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Créditos disponíveis"
          value={billing.summary.balance.toLocaleString("pt-BR")}
          hint={`Consumido no período: ${billing.summary.usedThisPeriod}`}
          icon={<Coins className="h-4 w-4" />}
        />
        <MetricCard
          label="Plano ativo"
          value={billing.summary.plan?.label ?? "—"}
          hint={billing.summary.subscription?.status ?? "sem assinatura"}
          icon={<Building2 className="h-4 w-4" />}
        />
        <MetricCard
          label="IA hoje"
          value={snapshot.aiToday.requests.toLocaleString("pt-BR")}
          hint={`${snapshot.aiToday.creditsSpent} créditos`}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <MetricCard
          label="Storage"
          value={assets.data ? `${storageMb} MB` : "—"}
          hint={`${assets.data?.assetCount ?? 0} arquivos`}
          icon={<HardDrive className="h-4 w-4" />}
        />
        <MetricCard
          label="Equipe"
          value={teamCount.toLocaleString("pt-BR")}
          hint="empresas ativas"
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          label="Jobs ativos"
          value={activeJobs.toLocaleString("pt-BR")}
          hint={`${jobsData?.queues?.length ?? 0} filas`}
          icon={<Zap className="h-4 w-4" />}
        />
        <MetricCard
          label="Eventos"
          value={eventsTotal.toLocaleString("pt-BR")}
          hint={`${eventsFailed} falhas`}
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard
          label="Alertas"
          value={(unread + openErrors).toLocaleString("pt-BR")}
          hint={`${unread} não lidas · ${openErrors} erros`}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <MetricCard
          label="Performance"
          value={`${(100 - errorRate).toFixed(1)}%`}
          hint={`${healthy} ok · ${degraded} alerta`}
          icon={<Gauge className="h-4 w-4" />}
        />
        <MetricCard
          label="Integrações"
          value={integrationsCount.toLocaleString("pt-BR")}
          hint="conectadas"
          icon={<Plug className="h-4 w-4" />}
        />
      </div>

      {/* Cards inteligentes — Créditos, Plano, Storage */}
      <div className="mt-6">
        <DashboardGrid>
          <DashboardGridItem size="md">
            <CreditsCard credits={{
              available: billing.summary.balance,
              used: billing.summary.usedThisPeriod,
              resetsAt: billing.summary.resetsAt,
            }} status={billing.isLoading ? "loading" : "ready"} />
          </DashboardGridItem>
          <DashboardGridItem size="md">
            <SubscriptionCard
              plan={
                billing.summary.plan
                  ? {
                      key: billing.summary.plan.key,
                      label: billing.summary.plan.label,
                      status: billing.summary.subscription?.status ?? "active",
                      renewsAt: billing.summary.subscription?.currentPeriodEnd ?? null,
                    }
                  : null
              }
              status={billing.isLoading ? "loading" : "ready"}
            />
          </DashboardGridItem>
          <DashboardGridItem size="md">
            <UsageCard
              title="Consumo do período"
              description="Créditos, IA e armazenamento"
              status={billing.isLoading ? "loading" : "ready"}
              metrics={[
                {
                  label: "Créditos",
                  used: billing.summary.usedThisPeriod,
                  total:
                    billing.summary.usedThisPeriod + billing.summary.balance || 1,
                  unit: "cr",
                },
                {
                  label: "IA (req)",
                  used: aiMetrics.data?.requests ?? snapshot.aiToday.requests,
                  total: Math.max(
                    aiMetrics.data?.requests ?? snapshot.aiToday.requests,
                    1000,
                  ),
                  unit: "req",
                },
                {
                  label: "Storage",
                  used: Number(storageMb),
                  total: 1024,
                  unit: "MB",
                },
              ]}
            />
          </DashboardGridItem>

          {/* Gráficos */}
          <DashboardGridItem size="lg">
            <ChartCard
              title="Consumo de IA"
              description="Requisições por capacidade (hoje)"
              series={aiChart}
              status={
                snapshot.aiToday.byCapability.length === 0 ? "empty" : "ready"
              }
              renderer={(s) => <BarSeries series={s} />}
            />
          </DashboardGridItem>
          <DashboardGridItem size="lg">
            <ChartCard
              title="Eventos e entregas"
              description="Distribuição no período"
              series={eventsChart}
              status={eventMetrics.isLoading ? "loading" : undefined}
              renderer={(s) => <BarSeries series={s} tone="brand" />}
            />
          </DashboardGridItem>
          <DashboardGridItem size="lg">
            <ChartCard
              title="Jobs & processamento"
              description="Estado atual das filas"
              series={jobsChart}
              status={jobs.isLoading ? "loading" : undefined}
              renderer={(s) => <BarSeries series={s} tone="accent" />}
            />
          </DashboardGridItem>
          <DashboardGridItem size="lg">
            <DashboardCard
              title="Saúde da plataforma"
              description="Componentes monitorados"
              icon={<ShieldCheck className="h-4 w-4" />}
            >
              {healthList.length === 0 ? (
                <EmptyState
                  title="Sem checagens"
                  description="Os monitores aparecerão aqui em instantes."
                />
              ) : (
                <ul className="space-y-2">
                  {healthList.slice(0, 6).map((h) => (
                    <li
                      key={h.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate">{h.component}</span>
                      <StatusBadge
                        tone={
                          h.status === "healthy"
                            ? "success"
                            : h.status === "degraded"
                              ? "warning"
                              : h.status === "down"
                                ? "danger"
                                : "info"
                        }
                      >
                        {h.status}
                      </StatusBadge>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardCard>
          </DashboardGridItem>

          {/* Coluna: atividades + notificações + projetos */}
          <DashboardGridItem size="lg">
            <ActivityFeed entries={snapshot.activity} status={isLoading ? "loading" : undefined} />
          </DashboardGridItem>
          <DashboardGridItem size="lg">
            <DashboardCard
              title="Últimas notificações"
              description={`${unread} não lidas`}
              icon={<Bell className="h-4 w-4" />}
              actions={
                <Link
                  to="/workspace/notificacoes"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Ver todas <ArrowRight className="h-3 w-3" />
                </Link>
              }
            >
              {notifs.isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando…</p>
              ) : notifList.length === 0 ? (
                <EmptyState
                  icon={<Bell className="h-6 w-6" />}
                  title="Sem notificações"
                  description="Você está em dia."
                />
              ) : (
                <ul className="divide-y divide-border/60">
                  {notifList.slice(0, 5).map((n) => (
                    <li
                      key={n.id}
                      className="flex items-start justify-between gap-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p
                          className={`truncate ${
                            n.readAt ? "text-muted-foreground" : "font-medium"
                          }`}
                        >
                          {n.title ?? n.body ?? "Notificação"}
                        </p>
                        {n.body && n.title ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {n.body}
                          </p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {n.createdAt
                          ? new Date(n.createdAt).toLocaleDateString("pt-BR")
                          : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardCard>
          </DashboardGridItem>
          <DashboardGridItem size="lg">
            <RecentProjects
              projects={snapshot.recentProjects}
              status={isLoading ? "loading" : undefined}
            />
          </DashboardGridItem>
          <DashboardGridItem size="lg">
            <DashboardCard
              title="Últimos uploads"
              description="Assets recentes do workspace"
              icon={<FolderOpen className="h-4 w-4" />}
              actions={
                <Link
                  to="/workspace/assets"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Ir para Assets <ArrowRight className="h-3 w-3" />
                </Link>
              }
            >
              {(assets.data?.assetCount ?? 0) === 0 ? (
                <EmptyState
                  icon={<Upload className="h-6 w-6" />}
                  title="Nenhum upload"
                  description="Envie arquivos em Assets para vê-los aqui."
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  {assets.data?.assetCount} arquivo(s) · {storageMb} MB usados
                </div>
              )}
            </DashboardCard>
          </DashboardGridItem>

          {/* Quick actions + módulos favoritos */}
          <DashboardGridItem size="xl">
            <QuickActions actions={quickActions} />
          </DashboardGridItem>
          <DashboardGridItem size="xl">
            <FavoriteModules />
          </DashboardGridItem>

          {/* Painel lateral: auditoria e eventos */}
          <DashboardGridItem size="lg">
            <DashboardCard
              title="Eventos recentes"
              description={`${eventsTotal} totais · ${eventsFailed} falhas`}
              icon={<Activity className="h-4 w-4" />}
            >
              {events.isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando…</p>
              ) : (events.data ?? []).length === 0 ? (
                <EmptyState
                  icon={<ListTodo className="h-6 w-6" />}
                  title="Sem eventos"
                  description="Ações da plataforma aparecerão aqui."
                />
              ) : (
                <ul className="divide-y divide-border/60">
                  {(events.data ?? []).slice(0, 6).map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <span className="truncate">{e.type}</span>
                      <StatusBadge
                        tone={
                          e.status === "delivered"
                            ? "success"
                            : e.status === "failed" || e.status === "dead"
                              ? "danger"
                              : "info"
                        }
                      >
                        {e.status}
                      </StatusBadge>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardCard>
          </DashboardGridItem>
          <DashboardGridItem size="lg">
            <DashboardCard
              title="Observabilidade"
              description="Erros abertos e taxa de erro"
              icon={<AlertTriangle className="h-4 w-4" />}
            >
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-semibold">{openErrors}</p>
                  <p className="text-xs text-muted-foreground">Erros abertos</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {errorRate.toFixed(2)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Taxa de erro</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {observability.data?.summary.tracesTotal ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Traces</p>
                </div>
              </div>
            </DashboardCard>
          </DashboardGridItem>
        </DashboardGrid>
      </div>
    </PageContainer>
  );
}

/**
 * Renderer local puro para os ChartCards.
 * Sem lógica de dados — apenas apresentação sobre séries já normalizadas
 * pelo snapshot/metrics do Core.
 */
function BarSeries({
  series,
  tone = "primary",
}: {
  series: ReadonlyArray<ChartSeries>;
  tone?: "primary" | "brand" | "accent";
}) {
  const points = series[0]?.points ?? [];
  const max = points.reduce((m, p) => Math.max(m, p.y), 0) || 1;
  const barClass =
    tone === "brand"
      ? "bg-gradient-to-r from-primary to-accent"
      : tone === "accent"
        ? "bg-accent"
        : "bg-primary";
  return (
    <ul className="space-y-2">
      {points.map((p) => (
        <li key={String(p.x)}>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="capitalize">{String(p.x)}</span>
            <span className="tabular-nums">{p.y.toLocaleString("pt-BR")}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${barClass}`}
              style={{ width: `${Math.max(4, Math.round((p.y / max) * 100))}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}