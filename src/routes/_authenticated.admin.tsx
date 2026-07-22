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
} from "lucide-react";
import { app } from "@/core/config";
import {
  PageContainer,
  PageHeader,
  ModuleCard,
} from "@/core/components/ui-kit";
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
                title={section.title}
                description={section.description}
                icon={<Icon className="h-5 w-5 text-primary" />}
                tag={section.tag}
                className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/50"
              />
            </Link>
          );
        })}
      </div>
    </PageContainer>
  );
}