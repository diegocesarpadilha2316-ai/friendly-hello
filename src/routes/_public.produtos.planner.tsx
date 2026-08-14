import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Layers,
  Box,
  Palette,
  Brain,
  Receipt,
  Home,
  Factory,
  Cog,
  Check,
  ArrowRight,
} from "lucide-react";
import { Reveal, GradientText, SectionEyebrow } from "@/core/components/public/PublicLayout";

export const Route = createFileRoute("/_public/produtos/planner")({
  head: () => ({
    meta: [
      { title: "Dioris Planner — Projeto 3D + IA + Produção" },
      {
        name: "description",
        content:
          "Renderização, catálogo, IA, orçamentos, ambientes, produção e CNC em uma única plataforma.",
      },
      { property: "og:title", content: "Dioris Planner" },
      { property: "og:description", content: "Projeto 3D + IA + Produção em um único fluxo." },
      { property: "og:url", content: "/produtos/planner" },
      { property: "og:type", content: "product" },
    ],
    links: [{ rel: "canonical", href: "/produtos/planner" }],
  }),
  component: Page,
});

const capabilities = [
  {
    icon: Box,
    t: "Renderização",
    d: "Motor 3D moderno com iluminação global e materiais físicos.",
  },
  {
    icon: Palette,
    t: "Catálogo",
    d: "Módulos, materiais, ferragens e acabamentos parametrizados.",
  },
  { icon: Brain, t: "IA de Projeto", d: "Copiloto que interpreta briefings e propõe soluções." },
  {
    icon: Receipt,
    t: "Orçamentos",
    d: "Preço automático a partir do projeto — margem, imposto, frete.",
  },
  {
    icon: Home,
    t: "Ambientes",
    d: "Cozinhas, dormitórios, escritórios, comerciais — templates completos.",
  },
  { icon: Factory, t: "Produção", d: "Lista de corte, plano de usinagem, etiquetas e ordens." },
  { icon: Cog, t: "CNC", d: "Exportação para máquinas CNC com nesting automático." },
  { icon: Layers, t: "Integrações", d: "ERPs, marketplaces, fornecedores e catálogos externos." },
];

function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <SectionEyebrow>Dioris Planner</SectionEyebrow>
          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
            Do briefing à <GradientText>fábrica</GradientText>.
          </h1>
          <p className="mt-6 text-lg text-foreground/70">
            Uma plataforma única para arquitetos, marceneiros e indústria. Projete em 3D, orce em
            segundos, produza com precisão — com IA acompanhando cada etapa.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/auth"
              search={{ redirect: "/workspace" }}
              className="rounded-full bg-gradient-to-r from-primary via-secondary to-accent px-6 py-3 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/40"
            >
              Entrar na lista
            </Link>
            <Link
              to="/planos"
              className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold hover:bg-white/10"
            >
              Ver planos
            </Link>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 p-6">
            <div className="grid grid-cols-2 gap-3">
              {capabilities.slice(0, 4).map((c) => (
                <div
                  key={c.t}
                  className="rounded-xl border border-white/10 bg-background/40 p-4 backdrop-blur"
                >
                  <c.icon className="h-5 w-5 text-accent" />
                  <div className="mt-3 font-bold">{c.t}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      <div className="mt-24">
        <Reveal>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Tudo o que <GradientText>o Planner faz</GradientText>.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((c, i) => (
            <Reveal key={c.t} delay={i * 0.03}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <c.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-bold">{c.t}</h3>
                <p className="mt-1.5 text-sm text-foreground/70">{c.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <Reveal>
        <div className="mt-24 rounded-3xl border border-white/10 bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/15 p-10 lg:p-14">
          <h3 className="text-3xl font-black">Por que o Planner Dioris</h3>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              "IA nativa em cada etapa do projeto",
              "Modelo de créditos unificado com toda a plataforma",
              "Integração direta com CRM, Financeiro e Marketplace",
              "Multi-tenant com RLS enterprise",
              "Storage isolado com versionamento",
              "SDK e API pública para automações",
            ].map((b) => (
              <div
                key={b}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-background/30 p-4"
              >
                <Check className="mt-0.5 h-4 w-4 text-accent" />
                <span className="text-sm">{b}</span>
              </div>
            ))}
          </div>
          <Link
            to="/auth"
            search={{ redirect: "/workspace" }}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary via-secondary to-accent px-6 py-3 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/40"
          >
            Começar agora <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
