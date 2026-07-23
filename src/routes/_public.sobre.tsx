import { createFileRoute } from "@tanstack/react-router";
import { Target, Eye, Heart, Cpu, Boxes } from "lucide-react";
import { Reveal, GradientText, SectionEyebrow } from "@/core/components/public/PublicLayout";

export const Route = createFileRoute("/_public/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre a Dioris — Inteligência que conecta tudo" },
      { name: "description", content: "Missão, visão, valores e tecnologia por trás do ecossistema Dioris." },
      { property: "og:title", content: "Sobre a Dioris" },
      { property: "og:description", content: "Ecossistema modular com IA no núcleo." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/sobre" },
    ],
    links: [{ rel: "canonical", href: "/sobre" }],
  }),
  component: SobrePage,
});

function SobrePage() {
  const values = [
    { icon: Target, t: "Missão", d: "Unificar operações empresariais em um único ecossistema inteligente e modular." },
    { icon: Eye, t: "Visão", d: "Ser a plataforma padrão para empresas que operam com IA no núcleo." },
    { icon: Heart, t: "Valores", d: "Excelência técnica, obsessão pelo cliente, transparência e velocidade." },
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <SectionEyebrow>Sobre a Dioris</SectionEyebrow>
        <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
          Somos um <GradientText>ecossistema de inteligência</GradientText>.
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-foreground/70">
          A Dioris não é um SaaS. É uma plataforma modular onde cada produto compartilha
          um Core enterprise: autenticação, tenants, RBAC, IA, billing, storage,
          eventos e observabilidade. Nasce moderna, escala como Big Tech.
        </p>
      </Reveal>
      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {values.map((v, i) => (
          <Reveal key={v.t} delay={i * 0.05}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <v.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-lg font-bold">{v.t}</h3>
              <p className="mt-2 text-sm text-foreground/70">{v.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal>
        <div className="mt-16 grid gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 p-10 lg:grid-cols-2 lg:p-14">
          <div>
            <SectionEyebrow>Tecnologia</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-black">
              Stack moderna, <GradientText>enterprise por padrão</GradientText>.
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["React 19", "TanStack Start", "Tailwind v4", "Vite 7", "Supabase", "PostgreSQL", "Edge Workers", "RLS por tenant"].map((s) => (
              <div key={s} className="flex items-center gap-2 rounded-lg border border-white/10 bg-background/40 px-3 py-2 text-sm">
                <Cpu className="h-4 w-4 text-accent" /> {s}
              </div>
            ))}
          </div>
        </div>
      </Reveal>
      <Reveal>
        <div className="mt-16">
          <SectionEyebrow>Ecossistema</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-black">
            Um único Core. <GradientText>Infinitos módulos.</GradientText>
          </h2>
          <p className="mt-4 max-w-3xl text-foreground/70">
            77+ tabelas, 16+ domínios, IA nativa, jobs, cache, API gateway, storage,
            observabilidade, backup e continuidade. Tudo compartilhado entre produtos.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {["Auth", "Tenant", "RBAC", "Billing", "IA Gateway", "Storage", "Events", "Notifications", "Jobs", "Cache", "Security", "Observability", "Recovery", "SDK", "Marketplace"].map((m) => (
              <span key={m} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
                <Boxes className="h-3 w-3" /> {m}
              </span>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}