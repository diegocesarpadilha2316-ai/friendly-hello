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
  {
    icon: Layers,
    name: "Planner",
    badge: "Em breve",
    desc: "Projeto 3D, catálogo, orçamentos, produção e CNC com IA.",
  },
  {
    icon: Wand2,
    name: "Criador Universal",
    badge: "Em breve",
    desc: "Crie sites, sistemas, apps, ERPs e portais com IA.",
  },
  {
    icon: Users,
    name: "CRM",
    badge: "Em desenvolvimento",
    desc: "Clientes, pipeline, oportunidades e automações.",
  },
  {
    icon: Wallet,
    name: "Financeiro",
    badge: "Em desenvolvimento",
    desc: "Faturamento, contas, fluxo de caixa e DRE.",
  },
  {
    icon: Store,
    name: "Marketplace",
    badge: "Em desenvolvimento",
    desc: "Plugins, integrações e extensões oficiais.",
  },
  {
    icon: Workflow,
    name: "Automação",
    badge: "Em desenvolvimento",
    desc: "Workflows visuais, cron, webhooks e eventos.",
  },
  {
    icon: Brain,
    name: "IA Gateway",
    badge: "Ativo",
    desc: "Multi-modelo, multi-provedor, créditos unificados.",
  },
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
      <Testimonials />
      <FAQ />
      <BigCTA />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-28 pt-24 sm:px-6 lg:px-8 lg:pt-36">
      {/* Aurora background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_oklch(0.16_0.06_285_/_0.9),_oklch(0.10_0.04_275)_75%)]" />
        <div className="dioris-aurora" />
        <div className="dioris-aurora-2" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
          }}
        />
      </div>

      {/* Floating glass cubes */}
      <FloatingCubes />

      <div className="relative mx-auto max-w-6xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <SectionEyebrow>
            <Sparkles className="h-3 w-3" /> Ecossistema Dioris 2026
          </SectionEyebrow>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 text-balance text-[2.75rem] font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-[6.5rem]"
          style={{ letterSpacing: "-0.02em" }}
        >
          Uma plataforma.
          <br />
          Um ecossistema.
          <br />
          <GradientText>Infinitas possibilidades.</GradientText>
        </motion.h1>

        {/* Scanline separator */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1.1, delay: 0.4 }}
          className="relative mx-auto mt-10 h-px w-full max-w-2xl overflow-hidden bg-gradient-to-r from-transparent via-primary/60 to-transparent"
        >
          <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_20px_6px_color-mix(in_oklab,var(--accent)_65%,transparent)] dioris-pulse-dot" />
          <span className="dioris-scanline absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="mx-auto mt-8 max-w-2xl text-sm font-medium uppercase tracking-[0.3em] text-foreground/60 sm:text-base"
        >
          Ecossistema modular · IA nativa · Enterprise ready
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/auth"
            search={{ redirect: "/workspace" }}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-primary via-secondary to-accent px-8 py-4 text-sm font-semibold text-primary-foreground shadow-[0_20px_60px_-20px_color-mix(in_oklab,var(--primary)_70%,transparent)] transition-transform hover:scale-[1.03]"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            Explorar o ecossistema
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/produtos"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-foreground/90 backdrop-blur-md transition-colors hover:bg-white/10"
          >
            Ver produtos
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[11px] uppercase tracking-[0.28em] text-muted-foreground/70"
        >
          <span>77+ tabelas core</span>
          <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:inline-block" />
          <span>16+ domínios enterprise</span>
          <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:inline-block" />
          <span>RLS por tenant</span>
          <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:inline-block" />
          <span>MFA nativo</span>
          <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:inline-block" />
          <span>API pública</span>
        </motion.div>
      </div>
    </section>
  );
}

function FloatingCubes() {
  const cubes = [
    { className: "left-[4%] top-[14%] h-24 w-24 sm:h-40 sm:w-40", rot: "-14deg", delay: "0s" },
    { className: "right-[5%] top-[10%] h-28 w-28 sm:h-44 sm:w-44", rot: "18deg", delay: "1.4s" },
    { className: "left-[7%] bottom-[10%] h-20 w-20 sm:h-36 sm:w-36", rot: "10deg", delay: "2.2s" },
    {
      className: "right-[6%] bottom-[14%] h-24 w-24 sm:h-40 sm:w-40",
      rot: "-20deg",
      delay: "0.7s",
    },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-[5] hidden sm:block">
      {cubes.map((c, i) => (
        <div
          key={i}
          className={`dioris-cube ${c.className}`}
          style={{
            // @ts-expect-error CSS custom property
            "--rot": c.rot,
            animationDelay: c.delay,
            transform: `rotate(${c.rot})`,
          }}
        />
      ))}
    </div>
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
              Cada módulo se conecta ao Core Dioris — autenticação, tenants, RBAC, IA, billing,
              storage, eventos e observabilidade — sem duplicar código.
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
    {
      icon: Brain,
      t: "IA nativa",
      d: "Gateway central multi-provedor com créditos unificados por tenant.",
    },
    {
      icon: Boxes,
      t: "Modular",
      d: "Ative apenas os módulos que sua empresa precisa. Escale sem atrito.",
    },
    {
      icon: Shield,
      t: "Enterprise",
      d: "RLS por tenant, MFA, auditoria, backups e continuidade de negócio.",
    },
    {
      icon: Zap,
      t: "Real-time",
      d: "Eventos, notificações, jobs e webhooks — tudo integrado ao Core.",
    },
    {
      icon: Globe,
      t: "Multiempresa",
      d: "Isolamento total por tenant com convites, papéis e permissões.",
    },
    {
      icon: Workflow,
      t: "Extensível",
      d: "SDK, plugins e API pública para estender o ecossistema.",
    },
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
                Render 3D, catálogo, orçamentos, produção, CNC e ambientes — orquestrados por IA. Um
                copiloto que acompanha do briefing à fábrica.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {[
                  "Renderização em tempo real",
                  "Catálogo modular",
                  "IA de projeto",
                  "Orçamento automático",
                  "Integração CNC",
                ].map((f) => (
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
                <div
                  key={tag}
                  className="rounded-xl border border-white/10 bg-background/40 p-4 backdrop-blur"
                >
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Módulo {i + 1}
                  </div>
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
                <div
                  key={tag}
                  className="rounded-xl border border-white/10 bg-background/40 p-4 backdrop-blur"
                >
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Gerado por IA
                  </div>
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
                Sites, sistemas, apps, ERPs, CRMs e portais — criados por IA, integrados ao Core
                Dioris e prontos para produção.
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

function Testimonials() {
  const items = [
    {
      quote:
        "Substituímos 4 ferramentas por uma. O Planner + IA da Dioris reduziu nosso tempo de orçamento em 70%.",
      name: "Marcos Almeida",
      role: "Diretor · Móveis Almeida",
    },
    {
      quote:
        "A integração CNC e a lista de corte automática pagaram o plano no primeiro mês de uso.",
      name: "Julia Nakamura",
      role: "Gerente de Produção · JN Marcenaria",
    },
    {
      quote:
        "Ecossistema modular de verdade. Ativamos CRM e Financeiro sem migração — foi só ligar.",
      name: "Renata Costa",
      role: "COO · Grupo Aria",
    },
  ];
  return (
    <section className="border-t border-white/10 bg-white/[0.02] px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="max-w-2xl">
            <SectionEyebrow>Quem já usa</SectionEyebrow>
            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Times reais. <GradientText>Resultados reais.</GradientText>
            </h2>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={it.name} delay={i * 0.05}>
              <figure className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-7">
                <blockquote className="text-base leading-relaxed text-foreground/85">
                  "{it.quote}"
                </blockquote>
                <figcaption className="mt-6 border-t border-white/10 pt-4">
                  <div className="font-semibold">{it.name}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {it.role}
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: "Preciso de cartão para começar?",
      a: "Não. O plano Free inclui 100 créditos de IA e todos os módulos essenciais — você só paga quando decidir escalar.",
    },
    {
      q: "Como funciona a cobrança?",
      a: "Checkout transparente dentro da Dioris (Pix, boleto e cartão via Mercado Pago). Sem redirecionamento e sem taxa escondida.",
    },
    {
      q: "Meus dados ficam isolados por empresa?",
      a: "Sim. Isolamento total por tenant com Row Level Security, MFA, auditoria completa e backups automatizados.",
    },
    {
      q: "Posso ativar só um módulo?",
      a: "Sim. Ative apenas Planner, apenas CRM, apenas IA — ou combine à vontade. O Core é compartilhado, sem duplicação.",
    },
    {
      q: "Que provedores de IA vocês suportam?",
      a: "DeepSeek, OpenAI, Gemini, Claude, Mistral e modelos open-source — via um Gateway central com créditos unificados.",
    },
    {
      q: "Existe API pública?",
      a: "Sim. API REST versionada, chaves por tenant e webhooks para integrar seus sistemas existentes.",
    },
  ];
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="text-center">
            <SectionEyebrow>Perguntas frequentes</SectionEyebrow>
            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Tudo o que você precisa <GradientText>saber</GradientText>.
            </h2>
          </div>
        </Reveal>
        <div className="mt-14 space-y-3">
          {items.map((it, i) => (
            <Reveal key={it.q} delay={i * 0.03}>
              <details className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 open:bg-white/[0.04]">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-base font-semibold text-foreground/90 marker:hidden [&::-webkit-details-marker]:hidden">
                  {it.q}
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-foreground/70">{it.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
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
