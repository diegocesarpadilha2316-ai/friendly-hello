import { createFileRoute } from "@tanstack/react-router";
import { Reveal, GradientText, SectionEyebrow } from "@/core/components/public/PublicLayout";
import { Sparkles, Wrench, ShieldCheck, Zap, Palette, Package } from "lucide-react";

export const Route = createFileRoute("/_public/changelog")({
  head: () => ({
    meta: [
      { title: "Changelog — Dioris" },
      {
        name: "description",
        content:
          "Histórico público de releases da Dioris Hub: novos módulos, melhorias de IA, correções e evolução da plataforma.",
      },
      { property: "og:title", content: "Changelog Dioris" },
      { property: "og:description", content: "Histórico público de releases da Dioris." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/changelog" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/changelog" }],
  }),
  component: Page,
});

type Kind = "feature" | "improvement" | "security" | "fix" | "design" | "release";

const KIND_META: Record<Kind, { label: string; icon: typeof Sparkles; className: string }> = {
  feature: {
    label: "Novo",
    icon: Sparkles,
    className: "bg-primary/15 text-primary ring-primary/30",
  },
  improvement: {
    label: "Melhoria",
    icon: Zap,
    className: "bg-accent/15 text-accent ring-accent/30",
  },
  security: {
    label: "Segurança",
    icon: ShieldCheck,
    className: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  },
  fix: {
    label: "Correção",
    icon: Wrench,
    className: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  },
  design: {
    label: "Design",
    icon: Palette,
    className: "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-500/30",
  },
  release: {
    label: "Release",
    icon: Package,
    className: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  },
};

interface Entry {
  version: string;
  date: string;
  title: string;
  items: { kind: Kind; text: string }[];
}

const releases: Entry[] = [
  {
    version: "v3.34",
    date: "25 de julho de 2026",
    title: "Release Candidate Enterprise",
    items: [
      {
        kind: "release",
        text: "20 domínios do Planner auditados e classificados aptos para Beta Fechado e Produção.",
      },
      {
        kind: "security",
        text: "Trust Center público lançado em /seguranca com pilares de criptografia, RLS e LGPD.",
      },
      {
        kind: "improvement",
        text: "Página de status /status agora consulta health real de DB, Auth e Storage a cada 30s.",
      },
      {
        kind: "design",
        text: "Landing pública ganhou depoimentos, FAQ e refinos de glassmorfismo.",
      },
    ],
  },
  {
    version: "v3.33",
    date: "22 de julho de 2026",
    title: "Cobrança transparente + Onboarding",
    items: [
      {
        kind: "feature",
        text: "Checkout transparente via Mercado Pago (Pix) integrado ao Workspace.",
      },
      {
        kind: "feature",
        text: "Onboarding automático — nova conta entra direto no plano Free com 100 créditos.",
      },
      {
        kind: "improvement",
        text: "Aba Pagamentos em /workspace/creditos com histórico real de pedidos.",
      },
      {
        kind: "security",
        text: "Migration 042/043 com RLS multi-tenant para provedores e pedidos de pagamento.",
      },
    ],
  },
  {
    version: "v3.28",
    date: "12 de julho de 2026",
    title: "IA Enterprise multi-modelo",
    items: [
      {
        kind: "feature",
        text: "AI Studio com 12 abas, streaming, tool calling (37+ ferramentas) e memória de sessão.",
      },
      {
        kind: "feature",
        text: "Provedores DeepSeek, OpenAI, Gemini, Claude, Mistral e OSS via gateway central.",
      },
      {
        kind: "improvement",
        text: "Prompt builder componível e Ctrl+Space para invocar IA em qualquer contexto do Editor.",
      },
    ],
  },
  {
    version: "v3.11",
    date: "28 de junho de 2026",
    title: "Produção Inteligente + CNC",
    items: [
      {
        kind: "feature",
        text: "Production Studio Dark First: lista de peças, corte, plano de corte, ferragens e etiquetas.",
      },
      { kind: "feature", text: "Motor de fabricação CNC com suporte a 9 marcas de máquinas." },
      {
        kind: "improvement",
        text: "PDF executivo com capa dark, sumário numerado e cabeçalho refinado.",
      },
    ],
  },
  {
    version: "v3.4",
    date: "10 de junho de 2026",
    title: "Biblioteca Inteligente 5.000+",
    items: [
      {
        kind: "feature",
        text: "Catálogo paramétrico com 18 fabricantes premium (Duratex, Arauco, Blum, etc.).",
      },
      {
        kind: "feature",
        text: "Drag & drop 2D/3D sincronizado, decomposição automática em peças e ferragens.",
      },
      { kind: "improvement", text: "Marketplace de componentes e importador CAD/BIM." },
    ],
  },
  {
    version: "v2.0",
    date: "05 de maio de 2026",
    title: "Workspace do Cliente",
    items: [
      {
        kind: "release",
        text: "Camada 2 concluída: Workspace com empresa, equipe, créditos, IA e módulos.",
      },
      {
        kind: "design",
        text: "Estética Cinematic com glassmorfismo aplicada em toda área pública.",
      },
    ],
  },
  {
    version: "v1.0",
    date: "10 de abril de 2026",
    title: "Fundação Enterprise",
    items: [
      {
        kind: "release",
        text: "Admin Center com 16+ domínios administrativos, Command Palette e KPIs globais.",
      },
      {
        kind: "feature",
        text: "Core único: Auth, Tenant, RBAC, IA Gateway, Billing, Storage, Observabilidade.",
      },
    ],
  },
];

function Page() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <SectionEyebrow>Evolução pública</SectionEyebrow>
        <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
          Changelog <GradientText>Dioris</GradientText>.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          O que enviamos, quando enviamos e por quê. Transparência total sobre a evolução da
          plataforma.
        </p>
      </Reveal>

      <div className="relative mt-16">
        <div className="pointer-events-none absolute inset-y-0 left-4 w-px bg-gradient-to-b from-primary/40 via-white/10 to-transparent sm:left-6" />
        <div className="space-y-12">
          {releases.map((r) => (
            <Reveal key={r.version}>
              <article className="relative pl-12 sm:pl-16">
                <div className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border border-primary/40 bg-background text-[10px] font-bold text-primary shadow-lg shadow-primary/20 sm:left-2 sm:h-9 sm:w-9 sm:text-xs">
                  {r.version.replace("v", "")}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-xl font-bold sm:text-2xl">{r.title}</h2>
                    <span className="text-xs text-muted-foreground">{r.date}</span>
                  </div>
                  <ul className="mt-5 space-y-3">
                    {r.items.map((it, i) => {
                      const meta = KIND_META[it.kind];
                      const Icon = meta.icon;
                      return (
                        <li key={i} className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${meta.className}`}
                          >
                            <Icon className="h-3 w-3" />
                            {meta.label}
                          </span>
                          <p className="flex-1 text-sm text-foreground/85">{it.text}</p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>

      <Reveal>
        <div className="mt-20 rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center backdrop-blur-xl">
          <p className="text-sm text-muted-foreground">
            Quer acompanhar releases em tempo real?{" "}
            <a href="/contato" className="font-semibold text-primary hover:underline">
              Assine nossas atualizações
            </a>{" "}
            ou siga o{" "}
            <a href="/blog" className="font-semibold text-primary hover:underline">
              blog Dioris
            </a>
            .
          </p>
        </div>
      </Reveal>
    </div>
  );
}
