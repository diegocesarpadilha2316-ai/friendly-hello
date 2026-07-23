import { createFileRoute, Link } from "@tanstack/react-router";
import { Layers, Wand2, Users, Wallet, Store, Workflow, Brain, ArrowRight } from "lucide-react";
import { Reveal, GradientText, SectionEyebrow } from "@/core/components/public/PublicLayout";

export const Route = createFileRoute("/_public/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos — Dioris" },
      { name: "description", content: "Planner, Criador Universal, CRM, Financeiro, Marketplace, Automação e IA." },
      { property: "og:title", content: "Produtos Dioris" },
      { property: "og:description", content: "Um ecossistema completo de módulos enterprise." },
      { property: "og:url", content: "/produtos" },
    ],
    links: [{ rel: "canonical", href: "/produtos" }],
  }),
  component: Page,
});

const items = [
  { id: "planner", to: "/produtos/planner", icon: Layers, name: "Planner", badge: "Em breve", desc: "Projeto 3D, catálogo, orçamento, produção e CNC com IA.", accent: "from-primary/40 to-accent/30" },
  { id: "criador", to: "/produtos/criador", icon: Wand2, name: "Criador Universal", badge: "Em breve", desc: "Sites, apps, sistemas e portais gerados por IA.", accent: "from-secondary/40 to-primary/30" },
  { id: "crm", to: "/produtos", icon: Users, name: "CRM", badge: "Em desenvolvimento", desc: "Clientes, pipeline, oportunidades e automações.", accent: "from-accent/40 to-primary/30" },
  { id: "financeiro", to: "/produtos", icon: Wallet, name: "Financeiro", badge: "Em desenvolvimento", desc: "Faturamento, contas, fluxo de caixa, DRE.", accent: "from-primary/40 to-secondary/30" },
  { id: "marketplace", to: "/produtos", icon: Store, name: "Marketplace", badge: "Em desenvolvimento", desc: "Plugins, integrações e extensões oficiais.", accent: "from-secondary/40 to-accent/30" },
  { id: "automacao", to: "/produtos", icon: Workflow, name: "Automação", badge: "Em desenvolvimento", desc: "Workflows visuais, cron, webhooks e eventos.", accent: "from-accent/40 to-secondary/30" },
  { id: "ia", to: "/produtos", icon: Brain, name: "IA Gateway", badge: "Ativo", desc: "Multi-modelo, multi-provedor, créditos unificados.", accent: "from-primary/50 to-accent/40" },
];

function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <SectionEyebrow>Ecossistema Dioris</SectionEyebrow>
        <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
          Sete produtos. <GradientText>Um único Core.</GradientText>
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-foreground/70">
          Cada produto Dioris compartilha a mesma fundação: autenticação, tenants, RBAC,
          IA, billing e storage. Ative o que precisar. Escale quando quiser.
        </p>
      </Reveal>
      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p, i) => (
          <Reveal key={p.id} delay={i * 0.04}>
            <Link
              to={p.to}
              id={p.id}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:-translate-y-1 hover:border-primary/40"
            >
              <div className={`pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-gradient-to-br ${p.accent} opacity-40 blur-3xl transition-opacity group-hover:opacity-70`} />
              <div className="relative flex items-start justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary/40 via-secondary/30 to-accent/40">
                  <p.icon className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {p.badge}
                </span>
              </div>
              <h3 className="relative mt-6 text-xl font-bold">{p.name}</h3>
              <p className="relative mt-2 flex-1 text-sm text-foreground/70">{p.desc}</p>
              <div className="relative mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Saiba mais <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}