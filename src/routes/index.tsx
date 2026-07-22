import { createFileRoute } from "@tanstack/react-router";
import { app } from "@/core/config/app";

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

const moduleLabels: Record<(typeof app.modules)[number], string> = {
  planner: "Planner",
  sites: "Criador de Sites",
  systems: "Systems",
  crm: "CRM",
  finance: "Financeiro",
  marketplace: "Marketplace",
  automation: "Automação",
  ai: "IA",
};

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Fase 1.1 · Fundação
        </span>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          {app.name}
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          {app.description}
        </p>

        <section className="mt-10 rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-card-foreground">
            Módulos reservados
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Estrutura criada, sem funcionalidade nesta fase.
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {app.modules.map((m) => (
              <li
                key={m}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {moduleLabels[m]}
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-8 text-xs text-muted-foreground">
          Documentação da arquitetura em <code>docs/ARCHITECTURE.md</code>.
        </p>
      </div>
    </main>
  );
}
