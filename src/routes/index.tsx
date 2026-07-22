import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { app, modules } from "@/core/config";
import {
  PageContainer,
  PageHeader,
  ModuleCard,
  MetricCard,
} from "@/core/components/ui-kit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dioris Hub — Plataforma modular" },
      {
        name: "description",
        content:
          "Fundação enterprise da Dioris Hub: Core compartilhado e módulos para Planner, Sites, CRM, Financeiro, Marketplace, Automação e IA.",
      },
      { property: "og:title", content: "Dioris Hub — Plataforma modular" },
      {
        property: "og:description",
        content:
          "Arquitetura modular pronta para escalar. Core único, módulos independentes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Fase 1.2 · Scaffold de módulos"
        title={app.name}
        description={app.description}
      />
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Módulos" value={modules.length} hint="registrados no Core" />
        <MetricCard label="Disponíveis" value={0} hint="produção" />
        <MetricCard label="Em desenvolvimento" value={0} hint="beta interno" />
        <MetricCard label="Planejados" value={modules.length} hint="scaffold pronto" />
      </section>
      <section className="mt-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Módulos
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map((m) => (
            <ModuleCard
              key={m.id}
              name={m.label}
              description={m.description}
              icon={<m.icon className="h-5 w-5" />}
              status={{ label: m.status, tone: "neutral" }}
              onOpen={() => navigate({ to: m.path })}
            />
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
