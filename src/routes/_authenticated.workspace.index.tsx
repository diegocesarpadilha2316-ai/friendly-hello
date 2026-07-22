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
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  ModuleCard,
  EmptyState,
  StatusBadge,
} from "@/core/components/ui-kit";
import { useOptionalTenant } from "@/core/providers/TenantProvider";
import { useOptionalAuth } from "@/core/hooks";
import { useDashboardSnapshot } from "@/core/dashboard/use-dashboard";
import { useBillingSummary } from "@/core/billing/use-billing";
import { useAssetsStats } from "@/core/assets/use-assets";
import { useNotifications } from "@/core/notifications/use-notifications";

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

  const company = tenant?.activeCompany;
  const unread = (notifs.data ?? []).filter((n) => !n.readAt).length;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Workspace"
        title={`Bem-vindo${auth?.user?.email ? `, ${auth.user.email.split("@")[0]}` : ""}`}
        description={
          company
            ? `Você está operando ${company.name} · plano ${company.plan}`
            : "Selecione uma empresa para começar."
        }
        actions={
          company ? (
            <StatusBadge tone={company.status === "active" ? "success" : "warning"}>
              {company.status}
            </StatusBadge>
          ) : null
        }
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
          value={
            assets.data
              ? `${((assets.data.usedBytes ?? 0) / (1024 * 1024)).toFixed(1)} MB`
              : "—"
          }
          hint={`${assets.data?.assetCount ?? 0} arquivos`}
          icon={<HardDrive className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <ModuleCard
          icon={<Bell className="h-4 w-4" />}
          name="Notificações"
          description={`${unread} não lidas`}
          href="/workspace/notificacoes"
        />
        <ModuleCard
          icon={<Users className="h-4 w-4" />}
          name="Equipe"
          description="Convites, papéis e permissões"
          href="/workspace/equipe"
        />
        <ModuleCard
          icon={<Activity className="h-4 w-4" />}
          name="Atividades recentes"
          description={`${snapshot.activity.length} eventos`}
          href="/workspace/atividades"
        />
      </div>

      <div className="mt-6 rounded-lg border border-border/60 bg-card/40 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Atividades recentes
            </p>
            <h3 className="text-lg font-semibold">Últimos eventos</h3>
          </div>
          <Link
            to="/workspace/atividades"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Ver tudo <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : snapshot.activity.length === 0 ? (
          <EmptyState
            icon={<ListTodo className="h-6 w-6" />}
            title="Nenhuma atividade ainda"
            description="Ações da equipe aparecerão aqui."
          />
        ) : (
          <ul className="divide-y divide-border/60">
            {snapshot.activity.slice(0, 6).map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate">{a.action}{a.target ? ` — ${a.target}` : ""}</span>
                <span className="text-xs text-muted-foreground">
                  {a.at ? new Date(a.at).toLocaleString("pt-BR") : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}