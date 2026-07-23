import { createFileRoute } from "@tanstack/react-router";
import { Shield, Brain, Boxes, Zap, Globe, Workflow, Database, KeyRound, Bell, Activity, HardDrive, Code2, Rocket, Lock } from "lucide-react";
import { Reveal, GradientText, SectionEyebrow } from "@/core/components/public/PublicLayout";

export const Route = createFileRoute("/_public/recursos")({
  head: () => ({
    meta: [
      { title: "Recursos — Dioris" },
      { name: "description", content: "Tudo que a plataforma Dioris oferece: IA, RBAC, storage, eventos, jobs, cache, API pública, segurança e mais." },
      { property: "og:title", content: "Recursos Dioris" },
      { property: "og:description", content: "Plataforma enterprise por padrão." },
      { property: "og:url", content: "/recursos" },
    ],
    links: [{ rel: "canonical", href: "/recursos" }],
  }),
  component: Page,
});

const groups = [
  { title: "Núcleo", items: [
    { icon: Lock, t: "Autenticação Enterprise", d: "Email/senha, MFA, sessões e recuperação." },
    { icon: Globe, t: "Multiempresa", d: "Tenants isolados com convites e papéis." },
    { icon: KeyRound, t: "RBAC", d: "Permissões granulares por módulo." },
    { icon: Shield, t: "Segurança", d: "RLS por tenant, auditoria, bloqueio de IP, LGPD." },
  ]},
  { title: "Inteligência", items: [
    { icon: Brain, t: "IA Gateway", d: "Multi-modelo, multi-provedor, créditos unificados." },
    { icon: Zap, t: "Automação", d: "Workflows, cron, webhooks e eventos." },
    { icon: Workflow, t: "Event Center", d: "Barramento de eventos entre módulos." },
    { icon: Activity, t: "Observabilidade", d: "Logs, métricas, health checks, SLOs." },
  ]},
  { title: "Infraestrutura", items: [
    { icon: HardDrive, t: "Storage", d: "Buckets multi-tenant com versionamento." },
    { icon: Database, t: "Cache", d: "Cache persistente e rate limiting." },
    { icon: Rocket, t: "Jobs & Workers", d: "Fila assíncrona com retries e cron." },
    { icon: Bell, t: "Notificações", d: "Multi-canal com preferências por usuário." },
  ]},
  { title: "Extensibilidade", items: [
    { icon: Code2, t: "SDK & Plugins", d: "Estenda o Core com plugins oficiais." },
    { icon: Boxes, t: "Marketplace", d: "Distribua extensões para todo o ecossistema." },
    { icon: Globe, t: "API Gateway", d: "APIs públicas versionadas com API keys." },
    { icon: Rocket, t: "CI/CD", d: "Pipelines, releases, deploys e feature flags." },
  ]},
];

function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <SectionEyebrow>Recursos</SectionEyebrow>
        <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
          Tudo em um <GradientText>único ecossistema</GradientText>.
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-foreground/70">
          Cada recurso é parte do Core Dioris. Nenhum módulo duplica lógica.
        </p>
      </Reveal>
      <div className="mt-16 space-y-14">
        {groups.map((g) => (
          <Reveal key={g.title}>
            <h2 className="text-2xl font-black"><GradientText>{g.title}</GradientText></h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {g.items.map((it) => (
                <div key={it.t} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                  <it.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 font-bold">{it.t}</h3>
                  <p className="mt-1.5 text-sm text-foreground/70">{it.d}</p>
                </div>
              ))}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}