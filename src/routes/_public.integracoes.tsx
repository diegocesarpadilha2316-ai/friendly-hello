import { createFileRoute } from "@tanstack/react-router";
import { Reveal, GradientText, SectionEyebrow } from "@/core/components/public/PublicLayout";
import { Cloud, Zap, Bot, MessageSquare, Webhook, Code2, Sparkles, Globe } from "lucide-react";

export const Route = createFileRoute("/_public/integracoes")({
  head: () => ({
    meta: [
      { title: "Integrações — Dioris" },
      {
        name: "description",
        content:
          "Supabase, Vercel, Cloudflare, OpenAI, Google, Anthropic, OpenRouter, WhatsApp, N8N, Webhooks e API.",
      },
      { property: "og:title", content: "Integrações Dioris" },
      { property: "og:description", content: "Conecte tudo ao ecossistema." },
      { property: "og:url", content: "/integracoes" },
    ],
    links: [{ rel: "canonical", href: "/integracoes" }],
  }),
  component: Page,
});

const groups = [
  {
    title: "Infraestrutura",
    items: [
      { icon: Cloud, t: "Supabase", d: "Banco de dados, auth e storage." },
      { icon: Zap, t: "Vercel", d: "Deploy edge global." },
      { icon: Cloud, t: "Cloudflare", d: "Workers e CDN." },
    ],
  },
  {
    title: "IA",
    items: [
      { icon: Bot, t: "OpenAI", d: "GPT-4, GPT-5 e Realtime." },
      { icon: Sparkles, t: "Anthropic", d: "Claude Sonnet e Opus." },
      { icon: Bot, t: "Google", d: "Gemini Pro e Flash." },
      { icon: Sparkles, t: "OpenRouter", d: "Roteamento multi-modelo." },
    ],
  },
  {
    title: "Comunicação",
    items: [{ icon: MessageSquare, t: "WhatsApp", d: "Envio e recebimento oficial." }],
  },
  {
    title: "Automação",
    items: [
      { icon: Zap, t: "N8N", d: "Workflows self-hosted." },
      { icon: Webhook, t: "Webhooks", d: "Entrada e saída com retry." },
      { icon: Code2, t: "API pública", d: "REST versionada." },
      { icon: Globe, t: "SDK", d: "Cliente TypeScript oficial." },
    ],
  },
];

function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <SectionEyebrow>Integrações</SectionEyebrow>
        <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
          Conecte com o <GradientText>que quiser</GradientText>.
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-foreground/70">
          Nativas ou via webhooks e API. Tudo passa pelo Core.
        </p>
      </Reveal>
      <div className="mt-16 space-y-14">
        {groups.map((g) => (
          <Reveal key={g.title}>
            <h2 className="text-2xl font-black">
              <GradientText>{g.title}</GradientText>
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {g.items.map((it) => (
                <div key={it.t} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                  <it.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 font-bold">{it.t}</h3>
                  <p className="mt-1.5 text-sm text-foreground/70">{it.d}</p>
                </div>
              ))}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
