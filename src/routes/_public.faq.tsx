import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Reveal, GradientText, SectionEyebrow } from "@/core/components/public/PublicLayout";

const faq = [
  { q: "O que é a Dioris?", a: "Um ecossistema modular que unifica Planner, Criador Universal, CRM, Financeiro, Marketplace, Automação e IA em uma única plataforma." },
  { q: "Como funcionam os créditos?", a: "Um único ledger para toda a plataforma. IA, storage e recursos consomem créditos por evento, com relatório em tempo real." },
  { q: "Posso ter várias empresas?", a: "Sim. A Dioris é multi-tenant nativa. Cada empresa é isolada com RLS." },
  { q: "Vocês têm plano gratuito?", a: "Sim. O plano Free permite explorar o Core com limites de créditos e usuários." },
  { q: "Quais integrações estão disponíveis?", a: "Supabase, Vercel, Cloudflare, OpenAI, Anthropic, Google, OpenRouter, WhatsApp, N8N, Webhooks e API pública." },
  { q: "Como funciona o suporte?", a: "Email para todos os planos. SLA a partir do Business. Onboarding dedicado no Enterprise." },
  { q: "Onde meus dados ficam?", a: "Em infraestrutura enterprise com backup contínuo, DR e conformidade LGPD." },
  { q: "Posso cancelar quando quiser?", a: "Sim. Sem multa, sem burocracia. Você mantém acesso até o fim do ciclo." },
];

export const Route = createFileRoute("/_public/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Dioris" },
      { name: "description", content: "Perguntas frequentes sobre planos, créditos, IA, segurança e migração." },
      { property: "og:title", content: "FAQ Dioris" },
      { property: "og:description", content: "Tire suas dúvidas." },
      { property: "og:url", content: "/faq" },
    ],
    links: [{ rel: "canonical", href: "/faq" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
      }),
    }],
  }),
  component: Page,
});

function Page() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <SectionEyebrow>FAQ</SectionEyebrow>
        <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
          Perguntas <GradientText>frequentes</GradientText>.
        </h1>
      </Reveal>
      <div className="mt-12 space-y-3">
        {faq.map((f, i) => (
          <Reveal key={f.q} delay={i * 0.02}>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
              <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 p-5 text-left">
                <span className="font-semibold">{f.q}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && <div className="px-5 pb-5 text-sm text-foreground/70">{f.a}</div>}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}