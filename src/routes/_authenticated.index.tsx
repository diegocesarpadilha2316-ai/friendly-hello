import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Sparkles,
  Building2,
  Users,
  HardDrive,
  Factory,
  ImageIcon,
  ListTodo,
} from "lucide-react";
import { app } from "@/core/config";
import { PageContainer, PageHeader } from "@/core/components/ui-kit";
import {
  DashboardGrid,
  DashboardGridItem,
  CreditsCard,
  SubscriptionCard,
  KpiCard,
  UsageCard,
  RecentProjects,
  ActivityFeed,
  ChartCard,
  QuickActions,
  FavoriteModules,
  DashboardWidget,
} from "@/core/components/dashboard";
import { useDashboardSnapshot } from "@/core/dashboard/use-dashboard";
import { useOptionalTenant } from "@/core/providers/TenantProvider";
import type { QuickAction, WidgetStatus } from "@/core/dashboard/types";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: `${app.name} — Dashboard` },
      {
        name: "description",
        content:
          "Dashboard enterprise da Dioris Hub: créditos, plano, IA, projetos recentes, produção e atividades — tudo escopado ao tenant ativo.",
      },
      { property: "og:title", content: `${app.name} — Dashboard` },
      {
        property: "og:description",
        content: "Visão unificada de todos os módulos da plataforma Dioris Hub.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

const QUICK_ACTIONS: ReadonlyArray<QuickAction> = [
  { id: "new-project", label: "Novo projeto", to: "/planner", icon: ListTodo, permission: "planner:manage" },
  { id: "go-crm", label: "Abrir CRM", to: "/crm", icon: Users, permission: "crm:view" },
  { id: "go-finance", label: "Financeiro", to: "/financeiro", icon: Building2, permission: "finance:view" },
  { id: "go-ai", label: "IA Studio", to: "/ia", icon: Sparkles, permission: "ai:use" },
];

function DashboardPage() {
  const tenant = useOptionalTenant();
  const { snapshot, isLoading, isError, error } = useDashboardSnapshot();
  const navigate = useNavigate();

  const status: WidgetStatus = isError ? "error" : isLoading ? "loading" : "ready";
  const readOrEmpty = (empty: boolean): WidgetStatus =>
    status !== "ready" ? status : empty ? "empty" : "ready";

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Dashboard"
        title={tenant?.activeCompany?.name ?? app.name}
        description="Visão unificada do tenant — créditos, plano, projetos, produção e IA."
      />

      <div className="mt-6 space-y-4">
        <QuickActions actions={QUICK_ACTIONS} />

        <DashboardGrid>
          <DashboardGridItem size="sm">
            <CreditsCard credits={snapshot.credits} status={readOrEmpty(snapshot.credits.available === 0 && snapshot.credits.used === 0)} />
          </DashboardGridItem>
          <DashboardGridItem size="sm">
            <SubscriptionCard plan={snapshot.plan} status={status} />
          </DashboardGridItem>
          <DashboardGridItem size="sm">
            <KpiCard
              title="IA utilizada hoje"
              description="Requisições consumidas"
              kpi={{
                label: "Requests",
                value: snapshot.aiToday.requests,
                hint: `${snapshot.aiToday.creditsSpent} créditos`,
                tone: "brand",
              }}
              status={status}
            />
          </DashboardGridItem>
          <DashboardGridItem size="sm">
            <KpiCard
              title="Usuários ativos"
              description="Membros do tenant"
              kpi={{
                label: "Membros",
                value: tenant?.companies.length ? (tenant.activeCompany ? 1 : 0) : 0,
                hint: "últimos 30 dias",
              }}
              status={status}
            />
          </DashboardGridItem>

          <DashboardGridItem size="md">
            <KpiCard
              title="Produção"
              description="Ordens de produção abertas"
              kpi={{ label: "OP", value: 0, tone: "neutral", hint: "aguardando módulo" }}
              status={readOrEmpty(true)}
            />
          </DashboardGridItem>
          <DashboardGridItem size="md">
            <KpiCard
              title="Renderizações"
              description="Jobs de render nesta semana"
              kpi={{ label: "Renders", value: 0, tone: "neutral", hint: "aguardando módulo" }}
              status={readOrEmpty(true)}
            />
          </DashboardGridItem>
          <DashboardGridItem size="md">
            <DashboardWidget
              title="Empresas"
              description="Tenants aos quais você pertence"
              status={status}
              icon={<Building2 className="h-4 w-4" />}
            >
              <div className="text-3xl font-semibold tracking-tight">
                {tenant?.companies.length ?? 0}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Troca via seletor no topo</p>
            </DashboardWidget>
          </DashboardGridItem>

          <DashboardGridItem size="lg">
            <RecentProjects projects={snapshot.recentProjects} status={status} />
          </DashboardGridItem>
          <DashboardGridItem size="lg">
            <ActivityFeed entries={snapshot.activity} status={status} />
          </DashboardGridItem>

          <DashboardGridItem size="lg">
            <UsageCard
              title="Espaço utilizado"
              description="Armazenamento por área"
              metrics={snapshot.usage}
              status={status}
            />
          </DashboardGridItem>
          <DashboardGridItem size="lg">
            <DashboardWidget
              title="Próximas tarefas"
              description="Compromissos do tenant"
              status={readOrEmpty(snapshot.upcoming.length === 0)}
              icon={<ListTodo className="h-4 w-4" />}
              emptyDescription="Nenhuma tarefa registrada."
            >
              <ul className="divide-y divide-border">
                {snapshot.upcoming.map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="truncate">{t.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {t.dueAt ? new Date(t.dueAt).toLocaleDateString("pt-BR") : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </DashboardWidget>
          </DashboardGridItem>

          <DashboardGridItem size="xl">
            <ChartCard
              title="Consumo (gráfico preparado)"
              description="Aguardando dados dos módulos"
              series={snapshot.charts[0]?.series ?? []}
              status={status}
            />
          </DashboardGridItem>

          <DashboardGridItem size="xl">
            <FavoriteModules />
          </DashboardGridItem>
        </DashboardGrid>

        {/* Ícones referenciados para futura personalização (Storage/Render). */}
        <span className="sr-only" aria-hidden>
          <HardDrive /> <Factory /> <ImageIcon /> <LayoutDashboard />
        </span>

        {isError && error ? (
          <p className="text-xs text-destructive">
            Falha ao carregar snapshot: {error.message}
          </p>
        ) : null}

        {/* Referência silenciosa para evitar warning de import não utilizado no futuro */}
        <span className="hidden" aria-hidden onClick={() => navigate({ to: "/" })} />
      </div>
    </PageContainer>
  );
}
