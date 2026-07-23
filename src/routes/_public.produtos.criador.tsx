import { createFileRoute, Link } from "@tanstack/react-router";
import { Wand2, Globe, Smartphone, LayoutDashboard, Building2, ShoppingBag, FileCode, Sparkles, Check, ArrowRight } from "lucide-react";
import { Reveal, GradientText, SectionEyebrow } from "@/core/components/public/PublicLayout";

export const Route = createFileRoute("/_public/produtos/criador")({
  head: () => ({
    meta: [
      { title: "Criador Universal — Dioris" },
      { name: "description", content: "Sites, apps, sistemas, dashboards, CRMs e portais criados por IA." },
      { property: "og:title", content: "Criador Universal Dioris" },
      { property: "og:description", content: "Descreva. A IA constrói." },
      { property: "og:url", content: "/produtos/criador" },
      { property: "og:type", content: "product" },
    ],
    links: [{ rel: "canonical", href: "/produtos/criador" }],
  }),
  component: Page,
});

const kinds = [
  { icon: Globe, t: "Sites" }, { icon: FileCode, t: "Sistemas" }, { icon: Smartphone, t: "Apps" },
  { icon: Sparkles, t: "Landing Pages" }, { icon: LayoutDashboard, t: "Dashboards" },
  { icon: Building2, t: "CRM / ERP" }, { icon: ShoppingBag, t: "Portais" }, { icon: Wand2, t: "Ferramentas" },
];

function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <SectionEyebrow>Criador Universal</SectionEyebrow>
          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
            Descreva. A IA <GradientText>constrói</GradientText>.
          </h1>
          <p className="mt-6 text-lg text-foreground/70">
            Um único produto capaz de gerar sites, sistemas, apps, landing pages,
            dashboards, CRMs, ERPs e portais — integrados ao Core Dioris.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth" search={{ redirect: "/workspace" }} className="rounded-full bg-gradient-to-r from-primary via-secondary to-accent px-6 py-3 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/40">
              Entrar na lista
            </Link>
            <Link to="/planos" className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold hover:bg-white/10">
              Ver planos
            </Link>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {kinds.map((k) => (
              <div key={k.t} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <k.icon className="h-5 w-5 text-accent" />
                <div className="mt-3 font-bold">{k.t}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
      <Reveal>
        <div className="mt-24 rounded-3xl border border-white/10 bg-gradient-to-br from-accent/15 via-secondary/10 to-primary/15 p-10 lg:p-14">
          <h2 className="text-3xl font-black">Como funciona</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              { n: "01", t: "Descreva", d: "Explique o que precisa em linguagem natural." },
              { n: "02", t: "A IA gera", d: "Estrutura, telas, banco, integrações e permissões." },
              { n: "03", t: "Publique", d: "Deploy imediato no ecossistema Dioris." },
            ].map((s) => (
              <div key={s.n} className="rounded-xl border border-white/10 bg-background/40 p-6">
                <div className="text-4xl font-black opacity-30"><GradientText>{s.n}</GradientText></div>
                <div className="mt-3 text-lg font-bold">{s.t}</div>
                <div className="mt-1 text-sm text-foreground/70">{s.d}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {["Integrado ao Core (Auth, RBAC, IA, Storage)", "Créditos unificados com o restante da plataforma", "Templates prontos para verticais", "Extensível via SDK e plugins"].map((b) => (
              <div key={b} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 text-accent" /> {b}</div>
            ))}
          </div>
          <Link to="/auth" search={{ redirect: "/workspace" }} className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary via-secondary to-accent px-6 py-3 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/40">
            Começar agora <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Reveal>
    </div>
  );
}