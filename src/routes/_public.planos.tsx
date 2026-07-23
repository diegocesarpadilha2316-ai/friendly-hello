import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Reveal, GradientText, SectionEyebrow } from "@/core/components/public/PublicLayout";

export const Route = createFileRoute("/_public/planos")({
  head: () => ({
    meta: [
      { title: "Planos e Preços — Dioris" },
      { name: "description", content: "Free, Starter, Professional, Business e Enterprise. Créditos, IA, storage e usuários inclusos." },
      { property: "og:title", content: "Planos e Preços Dioris" },
      { property: "og:description", content: "Escolha o plano ideal para sua empresa." },
      { property: "og:url", content: "/planos" },
    ],
    links: [{ rel: "canonical", href: "/planos" }],
  }),
  component: Page,
});

type Plan = {
  name: string;
  desc: string;
  monthly: number;
  yearly: number;
  featured?: boolean;
  credits: string;
  users: string;
  storage: string;
  ai: string;
  features: string[];
};

const plans: Plan[] = [
  { name: "Free", desc: "Para explorar a plataforma", monthly: 0, yearly: 0, credits: "1.000 créditos/mês", users: "1 usuário", storage: "1 GB", ai: "Modelos básicos", features: ["Acesso ao Core", "1 empresa", "Módulos limitados"] },
  { name: "Starter", desc: "Para times pequenos", monthly: 79, yearly: 790, credits: "10.000 créditos/mês", users: "3 usuários", storage: "20 GB", ai: "Modelos padrão", features: ["Todos os módulos beta", "1 empresa", "Suporte por email"] },
  { name: "Professional", desc: "Para negócios em crescimento", monthly: 199, yearly: 1990, featured: true, credits: "50.000 créditos/mês", users: "10 usuários", storage: "100 GB", ai: "Modelos avançados", features: ["Todos os módulos", "Até 3 empresas", "Suporte prioritário", "API pública"] },
  { name: "Business", desc: "Para equipes escalando", monthly: 499, yearly: 4990, credits: "200.000 créditos/mês", users: "30 usuários", storage: "500 GB", ai: "Modelos premium", features: ["Todos os módulos", "Até 10 empresas", "SLA de suporte", "SSO", "Auditoria avançada"] },
  { name: "Enterprise", desc: "Personalizado", monthly: -1, yearly: -1, credits: "Sob demanda", users: "Ilimitado", storage: "Sob demanda", ai: "Modelos dedicados", features: ["Empresas ilimitadas", "Onboarding dedicado", "SLA customizado", "Deploy dedicado", "Contrato personalizado"] },
];

function Page() {
  const [yearly, setYearly] = useState(false);
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <div className="text-center">
          <SectionEyebrow>Planos</SectionEyebrow>
          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
            Preços <GradientText>transparentes</GradientText>.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground/70">
            Comece grátis. Escale quando precisar. Sem surpresas na fatura.
          </p>
          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            <button onClick={() => setYearly(false)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${!yearly ? "bg-white/10 text-foreground" : "text-foreground/60"}`}>Mensal</button>
            <button onClick={() => setYearly(true)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${yearly ? "bg-white/10 text-foreground" : "text-foreground/60"}`}>
              Anual <span className="ml-1 text-xs text-accent">−17%</span>
            </button>
          </div>
        </div>
      </Reveal>

      <div className="mt-16 grid gap-6 lg:grid-cols-5">
        {plans.map((p, i) => (
          <Reveal key={p.name} delay={i * 0.03}>
            <div className={`relative flex h-full flex-col rounded-2xl border p-6 ${p.featured ? "border-primary/60 bg-gradient-to-b from-primary/10 to-transparent" : "border-white/10 bg-white/[0.02]"}`}>
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary via-secondary to-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                  <Sparkles className="mr-1 inline h-3 w-3" /> Popular
                </div>
              )}
              <div className="text-lg font-bold">{p.name}</div>
              <div className="mt-1 text-xs text-foreground/60">{p.desc}</div>
              <div className="mt-6">
                {p.monthly === -1 ? (
                  <div className="text-3xl font-black">Custom</div>
                ) : (
                  <>
                    <span className="text-4xl font-black">R$ {yearly ? Math.round(p.yearly / 12) : p.monthly}</span>
                    <span className="text-sm text-foreground/60">/mês</span>
                    {yearly && p.yearly > 0 && (
                      <div className="text-xs text-foreground/60">Faturado R$ {p.yearly}/ano</div>
                    )}
                  </>
                )}
              </div>
              <Link
                to="/auth"
                search={{ redirect: "/workspace" }}
                className={`mt-6 block rounded-full px-4 py-2.5 text-center text-sm font-semibold transition-colors ${p.featured ? "bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground shadow-lg shadow-primary/30" : "border border-white/15 bg-white/5 hover:bg-white/10"}`}
              >
                {p.monthly === 0 ? "Começar grátis" : p.monthly === -1 ? "Falar com vendas" : "Assinar"}
              </Link>
              <ul className="mt-6 space-y-2.5 border-t border-white/10 pt-6 text-sm">
                <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-accent" /> {p.credits}</li>
                <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-accent" /> {p.users}</li>
                <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-accent" /> {p.storage}</li>
                <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-accent" /> {p.ai}</li>
                {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-accent" /> {f}</li>)}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="mt-20 rounded-3xl border border-white/10 bg-white/[0.02] p-8">
          <h2 className="text-2xl font-black">Comparativo completo</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-foreground/60">
                  <th className="py-3">Recurso</th>
                  {plans.map((p) => <th key={p.name} className="py-3 text-center">{p.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Créditos/mês", plans.map((p) => p.credits)],
                  ["Usuários", plans.map((p) => p.users)],
                  ["Storage", plans.map((p) => p.storage)],
                  ["IA", plans.map((p) => p.ai)],
                  ["API pública", ["—", "—", "✓", "✓", "✓"]],
                  ["SSO", ["—", "—", "—", "✓", "✓"]],
                  ["SLA", ["—", "—", "—", "99.9%", "Custom"]],
                ].map(([label, vals]) => (
                  <tr key={label as string} className="border-b border-white/5">
                    <td className="py-3 font-medium">{label}</td>
                    {(vals as string[]).map((v, i) => <td key={i} className="py-3 text-center text-foreground/70">{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>
    </div>
  );
}