import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Layers,
  Wand2,
  Users,
  Wallet,
  Store,
  Workflow,
  Brain,
  Shield,
  Zap,
  Globe,
  Cpu,
  Boxes,
  Check,
} from "lucide-react";
import { Reveal, GradientText, SectionEyebrow } from "@/core/components/public/PublicLayout";
import { app } from "@/core/config";

export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: [
      { title: `${app.name} — Inteligência que conecta tudo` },
      {
        name: "description",
        content:
          "Dioris é um ecossistema de inteligência: Planner, Criador Universal, CRM, Financeiro, Marketplace, Automação e IA em uma plataforma única e modular.",
      },
      { property: "og:title", content: `${app.name} — Inteligência que conecta tudo` },
      { property: "og:description", content: "Ecossistema modular com IA no núcleo." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

const ecosystem = [
  { icon: Layers, name: "Planner", badge: "Em breve", desc: "Projeto 3D, catálogo, orçamentos, produção e CNC com IA." },
  { icon: Wand2, name: "Criador Universal", badge: "Em breve", desc: "Crie sites, sistemas, apps, ERPs e portais com IA." },
  { icon: Users, name: "CRM", badge: "Em desenvolvimento", desc: "Clientes, pipeline, oportunidades e automações." },
  { icon: Wallet, name: "Financeiro", badge: "Em desenvolvimento", desc: "Faturamento, contas, fluxo de caixa e DRE." },
  { icon: Store, name: "Marketplace", badge: "Em desenvolvimento", desc: "Plugins, integrações e extensões oficiais." },
  { icon: Workflow, name: "Automação", badge: "Em desenvolvimento", desc: "Workflows visuais, cron, webhooks e eventos." },
  { icon: Brain, name: "IA Gateway", badge: "Ativo", desc: "Multi-modelo, multi-provedor, créditos unificados." },
];

const stats = [
  { v: "77+", l: "tabelas do Core" },
  { v: "16+", l: "domínios enterprise" },
  { v: "100%", l: "IA nativa" },
  { v: "∞", l: "possibilidades" },
];

function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <Ecosystem />
      <Pillars />
      <ProductShowcase />
      <BigCTA />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pt-32">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <SectionEyebrow>
              <Sparkles className="h-3 w-3" /> Novo · Ecossistema Dioris
            </SectionEyebrow>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-6 text-balance text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Inteligência que <GradientText>conecta tudo</GradientText>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mx-auto mt-6 max-w-2xl text-balance text-lg text-foreground/70 sm:text-xl"
          >
            A Dioris é um ecossistema modular que unifica Projeto 3D, Sites, CRM,
            Financeiro, Marketplace e Automação — com IA nativa no núcleo.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              to="/auth"
              search={{ redirect: "/workspace" }}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary via-secondary to-accent px-6 py-3 text-sm font-semibold text-primary-foreground shadow-2xl shadow-primary/40 transition-transform hover:scale-[1.03]"
            >
              Começar grátis
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/produtos"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:bg-white/10"
            >
              Ver o ecossistema
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35 }}
          className="relative mx-auto mt-20 max-w-6xl"
        >
          <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-2 shadow-2xl backdrop-blur-xl">
            <div className="absolute -inset-px -z-10 rounded-3xl bg-gradient-to-r from-primary via-secondary to-accent opacity-40 blur-2xl" />
            <div className="rounded-2xl border border-white/10 bg-background/60 p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Brain, t: "IA Gateway", v: "Multi-modelo unificado" },
                  { icon: Cpu, t: "Núcleo modular", v: "16 domínios enterprise" },
                  { icon: Shield, t: "RLS por tenant", v: "Segurança nativa" },
                ].map((k, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <k.icon className="h-5 w-5 text-primary" />
                    <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{k.t}</div>
                    <div className="mt-1 font-semibold text-foreground">{k.v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-7">
                {ecosystem.map((e) => (
                  <div
                    key={e.name}
                    className="group flex flex-col items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-primary/40 hover:bg-white/5"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-primary/30 to-accent/30">
                      <e.icon className="h-4 w-4" />
                    </div>
                    <div className="text-[11px] font-medium text-foreground/80">{e.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <section className="border-y border-white/10 bg-white/[0.02] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 text-center sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l}>
            <div className="text-3xl font-black tracking-tight sm:text-4xl">
              <GradientText>{s.v}</GradientText>
            </div>
            <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Ecosystem() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="max-w-2xl">
            <SectionEyebrow>Ecossistema</SectionEyebrow>
            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Um núcleo. <GradientText>Infinitas capacidades.</GradientText>
            </h2>
            <p className="mt-4 text-lg text-foreground/70">
              Cada módulo se conecta ao Core Dioris — autenticação, tenants, RBAC, IA,
              billing, storage, eventos e observabilidade — sem duplicar código.
            </p>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ecosystem.map((e, i) => (
            <Reveal key={e.name} delay={i * 0.05}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:bg-white/5">
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
                <div className="flex items-start justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/40 via-secondary/30 to-accent/40">
                    <e.icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {e.badge}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold">{e.name}</h3>
                <p className="mt-1.5 text-sm text-foreground/70">{e.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pillars() {
  const items = [
    { icon: Brain, t: "IA nativa", d: "Gateway central multi-provedor com créditos unificados por tenant." },
    { icon: Boxes, t: "Modular", d: "Ative apenas os módulos que sua empresa precisa. Escale sem atrito." },
    { icon: Shield, t: "Enterprise", d: "RLS por tenant, MFA, auditoria, backups e continuidade de negócio." },
    { icon: Zap, t: "Real-time", d: "Eventos, notificações, jobs e webhooks — tudo integrado ao Core." },
    { icon: Globe, t: "Multiempresa", d: "Isolamento total por tenant com convites, papéis e permissões." },
    { icon: Workflow, t: "Extensível", d: "SDK, plugins e API pública para estender o ecossistema." },
  ];
  return (
    <section className="border-t border-white/10 bg-white/[0.02] px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="max-w-2xl">
            <SectionEyebrow>Por que Dioris</SectionEyebrow>
            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Construído como <GradientText>Big Tech</GradientText>.
            </h2>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={it.t} delay={i * 0.04}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <it.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-bold">{it.t}</h3>
                <p className="mt-1 text-sm text-foreground/70">{it.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductShowcase() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-16">
        <Reveal>
          <div className="grid gap-10 rounded-3xl border border-white/10 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 p-8 lg:grid-cols-2 lg:p-14">
            <div>
              <SectionEyebrow>Planner</SectionEyebrow>
              <h3 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Projete, orce e produza em <GradientText>um só lugar</GradientText>.
              </h3>
              <p className="mt-4 text-foreground/70">
                Render 3D, catálogo, orçamentos, produção, CNC e ambientes — orquestrados
                por IA. Um copiloto que acompanha do briefing à fábrica.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {["Renderização em tempo real", "Catálogo modular", "IA de projeto", "Orçamento automático", "Integração CNC"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/produtos/planner"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
              >
                Conhecer o Planner <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["Render", "Catálogo", "IA", "Orçamento", "Produção", "CNC"].map((tag, i) => (
                <div key={tag} className="rounded-xl border border-white/10 bg-background/40 p-4 backdrop-blur">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Módulo {i + 1}</div>
                  <div className="mt-2 text-lg font-bold">{tag}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div className="grid gap-10 rounded-3xl border border-white/10 bg-gradient-to-br from-accent/10 via-secondary/5 to-primary/10 p-8 lg:grid-cols-2 lg:p-14">
            <div className="order-2 grid grid-cols-2 gap-3 lg:order-1">
              {["Sites", "Apps", "Sistemas", "Landing", "Dashboards", "Portais"].map((tag) => (
                <div key={tag} className="rounded-xl border border-white/10 bg-background/40 p-4 backdrop-blur">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Gerado por IA</div>
                  <div className="mt-2 text-lg font-bold">{tag}</div>
                </div>
              ))}
            </div>
            <div className="order-1 lg:order-2">
              <SectionEyebrow>Criador Universal</SectionEyebrow>
              <h3 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Descreva. A IA <GradientText>constrói</GradientText>.
              </h3>
              <p className="mt-4 text-foreground/70">
                Sites, sistemas, apps, ERPs, CRMs e portais — criados por IA, integrados
                ao Core Dioris e prontos para produção.
              </p>
              <Link
                to="/produtos/criador"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
              >
                Conhecer o Criador <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function BigCTA() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 p-10 text-center sm:p-16">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_oklch(0.6_0.25_285_/_0.25),_transparent_60%)]" />
            <h2 className="relative text-4xl font-black tracking-tight sm:text-5xl">
              Pronto para <GradientText>conectar tudo</GradientText>?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-lg text-foreground/70">
              Comece grátis. Escale sem atrito. Uma única plataforma para todo seu negócio.
            </p>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/auth"
                search={{ redirect: "/workspace" }}
                className="rounded-full bg-gradient-to-r from-primary via-secondary to-accent px-6 py-3 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/40 hover:scale-[1.02]"
              >
                Criar minha conta
              </Link>
              <Link
                to="/contato"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold hover:bg-white/10"
              >
                Falar com vendas
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}