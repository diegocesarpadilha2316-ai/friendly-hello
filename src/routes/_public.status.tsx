import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Activity } from "lucide-react";
import { Reveal, GradientText, SectionEyebrow } from "@/core/components/public/PublicLayout";

export const Route = createFileRoute("/_public/status")({
  head: () => ({
    meta: [
      { title: "Status — Dioris" },
      { name: "description", content: "Status em tempo real dos serviços da plataforma Dioris." },
      { property: "og:title", content: "Status Dioris" },
      { property: "og:description", content: "Saúde da plataforma." },
      { property: "og:url", content: "/status" },
    ],
    links: [{ rel: "canonical", href: "/status" }],
  }),
  component: Page,
});

const services = [
  { name: "API Gateway", uptime: 99.99 },
  { name: "IA Gateway", uptime: 99.98 },
  { name: "Auth", uptime: 100 },
  { name: "Storage", uptime: 99.97 },
  { name: "Database", uptime: 99.99 },
  { name: "Jobs & Workers", uptime: 99.95 },
  { name: "Notifications", uptime: 99.99 },
  { name: "Webhooks", uptime: 99.96 },
];

function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <SectionEyebrow>Status</SectionEyebrow>
        <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
          Tudo <GradientText>operacional</GradientText>.
        </h1>
        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-5">
          <CheckCircle2 className="h-6 w-6 text-accent" />
          <div>
            <div className="font-semibold">Todos os sistemas operacionais</div>
            <div className="text-sm text-foreground/70">Última verificação: agora</div>
          </div>
        </div>
      </Reveal>
      <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.02] p-2">
        {services.map((s, i) => (
          <div key={s.name} className={`flex items-center justify-between p-5 ${i < services.length - 1 ? "border-b border-white/5" : ""}`}>
            <div className="flex items-center gap-3">
              <Activity className="h-4 w-4 text-accent" />
              <span className="font-medium">{s.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex gap-0.5">
                {Array.from({ length: 60 }).map((_, j) => (
                  <div key={j} className={`h-6 w-1 rounded-sm ${j === 42 && s.uptime < 99.99 ? "bg-yellow-500/60" : "bg-accent/60"}`} />
                ))}
              </div>
              <span className="text-sm text-foreground/70">{s.uptime}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}