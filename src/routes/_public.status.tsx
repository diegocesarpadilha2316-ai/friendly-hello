import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Activity, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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

type StatusPayload = {
  ok: boolean;
  ts: string;
  checks: Array<{ name: string; ok: boolean; latencyMs: number; detail?: string }>;
};

function Page() {
  const q = useQuery<StatusPayload>({
    queryKey: ["public", "status"],
    queryFn: async () => {
      const res = await fetch("/api/public/v1/status", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as StatusPayload;
    },
    refetchInterval: 30_000,
  });

  const allOk = q.data?.ok ?? true;
  const checks = q.data?.checks ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <SectionEyebrow>Status</SectionEyebrow>
        <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
          {allOk ? (
            <>
              Tudo <GradientText>operacional</GradientText>.
            </>
          ) : (
            <>
              Incidente <GradientText>em andamento</GradientText>.
            </>
          )}
        </h1>
        <div
          className={`mt-8 flex items-center gap-3 rounded-2xl border p-5 ${allOk ? "border-accent/30 bg-accent/10" : "border-destructive/40 bg-destructive/10"}`}
        >
          {allOk ? (
            <CheckCircle2 className="h-6 w-6 text-accent" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-destructive" />
          )}
          <div>
            <div className="font-semibold">
              {allOk ? "Todos os sistemas operacionais" : "Alguns serviços estão degradados"}
            </div>
            <div className="text-sm text-foreground/70">
              {q.isLoading
                ? "Verificando…"
                : q.data
                  ? `Última verificação: ${new Date(q.data.ts).toLocaleTimeString("pt-BR")}`
                  : "Aguardando resposta…"}
            </div>
          </div>
        </div>
      </Reveal>
      <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.02] p-2">
        {checks.map((s, i) => (
          <div
            key={s.name}
            className={`flex items-center justify-between p-5 ${i < checks.length - 1 ? "border-b border-white/5" : ""}`}
          >
            <div className="flex items-center gap-3">
              <Activity className={`h-4 w-4 ${s.ok ? "text-accent" : "text-destructive"}`} />
              <span className="font-medium">{s.name}</span>
              {!s.ok && s.detail ? (
                <span className="text-xs text-destructive/80">{s.detail}</span>
              ) : null}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-foreground/60">
                {s.latencyMs > 0 ? `${s.latencyMs}ms` : "—"}
              </span>
              <span
                className={`text-sm font-semibold ${s.ok ? "text-accent" : "text-destructive"}`}
              >
                {s.ok ? "Operacional" : "Degradado"}
              </span>
            </div>
          </div>
        ))}
        {checks.length === 0 && !q.isLoading ? (
          <div className="p-5 text-sm text-foreground/60">Sem dados de status no momento.</div>
        ) : null}
      </div>
    </div>
  );
}
