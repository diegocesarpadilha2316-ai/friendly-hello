import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  Building2,
  Database,
  Gauge,
  Globe2,
  HardDrive,
  LifeBuoy,
  ListTodo,
  Plug,
  Puzzle,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
  BellPlus,
  UserPlus,
  KeyRound,
  ShieldAlert,
  RefreshCcw,
  Trash2,
  PlayCircle,
} from "lucide-react";
import { app } from "@/core/config";
import {
  PageContainer,
  PageHeader,
  ModuleCard,
  MetricCard,
  StatusBadge,
} from "@/core/components/ui-kit";
import { useDashboardSnapshot } from "@/core/dashboard/use-dashboard";
import diorisBrand from "@/assets/dioris-brand.png.asset.json";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: `${app.name} — Admin Center` },
      {
        name: "description",
        content:
          "Painel Administrativo Enterprise da Dioris — governança unificada de empresas, usuários, IA, segurança, qualidade, CI/CD e recuperação.",
      },
      { property: "og:title", content: `${app.name} — Admin Center` },
      {
        property: "og:description",
        content: "Centro de administração da plataforma Dioris.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminCenterPage,
});

type AdminSection = {
  id: string;
  title: string;
  description: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
};

const SECTIONS: ReadonlyArray<AdminSection> = [
  { id: "tenants", title: "Empresas", description: "Tenants, planos, status e configurações.", to: "/configuracoes/empresa", icon: Building2, tag: "Governança" },
  { id: "users", title: "Usuários & Equipes", description: "Membros, convites, papéis e sessões.", to: "/configuracoes", icon: Users, tag: "Identidade" },
  { id: "ai", title: "IA Gateway", description: "Providers, modelos, custos e circuit breaker.", to: "/ia", icon: Sparkles, tag: "IA" },
  { id: "storage", title: "Storage & Assets", description: "Buckets, uploads, versionamento e auditoria.", to: "/storage", icon: HardDrive, tag: "Dados" },
  { id: "notifications", title: "Notificações", description: "Templates, canais e histórico.", to: "/notificacoes", icon: Bell, tag: "Engagement" },
  { id: "integrations", title: "Integrações", description: "APIs, webhooks, providers e health.", to: "/integracoes", icon: Plug, tag: "Conectividade" },
  { id: "sdk", title: "SDK & Plugins", description: "Marketplace, hooks e extensões.", to: "/sdk", icon: Puzzle, tag: "Extensão" },
  { id: "jobs", title: "Jobs & Workers", description: "Filas, retries, scheduler e dead letter.", to: "/jobs", icon: ListTodo, tag: "Runtime" },
  { id: "gateway", title: "API Gateway", description: "Keys, rate limit, quotas e OpenAPI.", to: "/api-gateway", icon: Globe2, tag: "Runtime" },
  { id: "cache", title: "Cache Distribuído", description: "Namespaces, tags, SWR e hit rate.", to: "/cache", icon: Database, tag: "Runtime" },
  { id: "security", title: "Segurança", description: "MFA, sessões, incidentes e políticas.", to: "/security", icon: ShieldCheck, tag: "Segurança" },
  { id: "quality", title: "Qualidade", description: "Cobertura, suites, gates e regressão.", to: "/quality", icon: Gauge, tag: "Qualidade" },
  { id: "cicd", title: "CI/CD", description: "Pipelines, builds, deploys e releases.", to: "/cicd", icon: Rocket, tag: "Entrega" },
  { id: "recovery", title: "Recovery", description: "Backups, snapshots, PITR e DR plans.", to: "/recovery", icon: LifeBuoy, tag: "Continuidade" },
  { id: "observability", title: "Observabilidade", description: "Logs, traces, métricas e health.", to: "/observabilidade", icon: Activity, tag: "Operação" },
  { id: "settings", title: "Configurações", description: "Configuração global e por tenant.", to: "/configuracoes", icon: Settings, tag: "Plataforma" },
];

function AdminCenterPage() {
  const { snapshot, isLoading } = useDashboardSnapshot();

  const kpis = [
    { label: "Empresas ativas", value: snapshot.meta.warming ? "—" : "0", hint: "tenants em atividade" },
    { label: "Créditos consumidos (mês)", value: snapshot.credits.used.toLocaleString("pt-BR"), hint: `${snapshot.credits.available} disponíveis` },
    { label: "Requisições de IA hoje", value: snapshot.aiToday.requests.toLocaleString("pt-BR"), hint: `${snapshot.aiToday.creditsSpent} créditos` },
    { label: "Jobs em execução", value: "0", hint: "fila estável" },
  ] as const;

  const health = [
    { id: "gw", label: "API Gateway", tone: "success" as const, hint: "operational" },
    { id: "workers", label: "Workers", tone: "success" as const, hint: "operational" },
    { id: "queue", label: "Queue", tone: "success" as const, hint: "operational" },
    { id: "cache", label: "Cache", tone: "success" as const, hint: "operational" },
    { id: "storage", label: "Storage", tone: "success" as const, hint: "operational" },
    { id: "ai", label: "IA Gateway", tone: "success" as const, hint: "operational" },
    { id: "billing", label: "Billing", tone: "success" as const, hint: "operational" },
    { id: "notify", label: "Notifications", tone: "success" as const, hint: "operational" },
    { id: "sec", label: "Security", tone: "success" as const, hint: "monitored" },
    { id: "obs", label: "Observability", tone: "success" as const, hint: "streaming" },
  ];

  const quickActions = [
    { id: "new-user", label: "Convidar usuário", to: "/configuracoes", icon: UserPlus },
    { id: "grant-credits", label: "Conceder créditos", to: "/configuracoes/empresa", icon: Sparkles },
    { id: "reset-pass", label: "Resetar senha", to: "/security", icon: KeyRound },
    { id: "block-tenant", label: "Suspender empresa", to: "/configuracoes/empresa", icon: ShieldAlert },
    { id: "run-backup", label: "Executar backup", to: "/recovery", icon: RefreshCcw },
    { id: "run-job", label: "Executar job", to: "/jobs", icon: PlayCircle },
    { id: "clear-cache", label: "Limpar cache", to: "/cache", icon: Trash2 },
    { id: "publish-event", label: "Publicar evento", to: "/observabilidade", icon: Zap },
    { id: "send-notification", label: "Enviar notificação", to: "/notificacoes", icon: BellPlus },
  ];

  return (
    <PageContainer>
      <section
        className="relative overflow-hidden rounded-3xl border border-border/60 p-6 sm:p-10"
        style={{
          backgroundImage: "var(--gradient-surface)",
          boxShadow: "var(--shadow-brand)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ backgroundImage: "var(--gradient-brand)", mixBlendMode: "overlay" }}
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white/80 backdrop-blur">
              Admin Center · Enterprise
            </span>
            <h1
              className="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
              style={{
                backgroundImage: "var(--gradient-brand)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Dioris Hub
            </h1>
            <p className="text-sm text-white/70 sm:text-base">
              Centro único de administração da plataforma. Governança, IA, segurança,
              qualidade e continuidade — inteligência que conecta tudo.
            </p>
          </div>
          <img
            src={diorisBrand.url}
            alt="Identidade visual Dioris"
            width={220}
            height={220}
            loading="lazy"
            className="hidden h-40 w-40 shrink-0 rounded-2xl object-cover shadow-2xl sm:block"
          />
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <MetricCard
            key={k.label}
            label={k.label}
            value={isLoading ? "…" : k.value}
            hint={k.hint}
          />
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Central de Monitoramento
            </h2>
            <p className="text-xs text-muted-foreground/80">
              Status em tempo real dos subsistemas do Core.
            </p>
          </div>
          <StatusBadge tone="success">All systems operational</StatusBadge>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {health.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between rounded-lg border border-border/50 bg-background/60 px-3 py-2"
            >
              <span className="text-xs font-medium">{h.label}</span>
              <StatusBadge tone={h.tone}>{h.hint}</StatusBadge>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Ações rápidas
          </h2>
          <p className="text-xs text-muted-foreground/80">
            Atalhos para as operações administrativas mais frequentes.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.id}
                to={a.to}
                className="group flex items-center gap-2 rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-xs font-medium transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary"
              >
                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                <span className="truncate">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <PageHeader
        eyebrow="Módulos administrativos"
        title="Todas as operações da plataforma"
        description="Cada card reutiliza a infraestrutura já existente no Core — sem motores paralelos, sem duplicação."
      />

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.id}
              to={section.to}
              className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
            >
              <ModuleCard
                name={section.title}
                description={section.description}
                icon={<Icon className="h-5 w-5 text-primary" />}
                status={{ label: section.tag, tone: "info" }}
                className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/50"
              />
            </Link>
          );
        })}
      </div>
    </PageContainer>
  );
}