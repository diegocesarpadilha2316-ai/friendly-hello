import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, Bell, Bot, CreditCard, ListTodo, RefreshCcw } from "lucide-react";
import {
  getObservabilitySnapshot,
  type ObservabilitySnapshot,
} from "@/lib/admin-observability.functions";
import { PageContainer, PageHeader, MetricCard } from "@/core/components/ui-kit";

export const Route = createFileRoute("/_authenticated/admin/observabilidade")({
  head: () => ({
    meta: [
      { title: "Observabilidade — Dioris Admin" },
      {
        name: "description",
        content: "Métricas em tempo real de logs, jobs, notificações, pagamentos e IA.",
      },
      { property: "og:title", content: "Observabilidade — Dioris Admin" },
      { property: "og:description", content: "Painel de observabilidade da plataforma." },
    ],
  }),
  component: Page,
});

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  });
}

function Page() {
  const fetchSnap = useServerFn(getObservabilitySnapshot);
  const q = useQuery<ObservabilitySnapshot>({
    queryKey: ["admin", "observability"],
    queryFn: () => fetchSnap(),
    refetchInterval: 15_000,
  });

  const s = q.data;

  return (
    <PageContainer>
      <PageHeader
        title="Observabilidade"
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" /> Admin
          </span>
        }
        description="Snapshot das últimas 24h — atualiza a cada 15s. Fonte: logs, jobs, notifications, payment_orders."
        actions={
          <button
            onClick={() => q.refetch()}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Atualizar
          </button>
        }
      />

      {q.isLoading && !s ? (
        <div className="text-sm text-foreground/60">Carregando snapshot...</div>
      ) : q.error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          {(q.error as Error).message}
        </div>
      ) : s ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Logs (24h)"
              value={s.logs.total.toLocaleString("pt-BR")}
              hint={`${s.logs.errors} erros · ${s.logs.warnings} avisos`}
              icon={<Activity className="h-4 w-4" />}
            />
            <MetricCard
              label="Jobs"
              value={`${s.jobs.pending + s.jobs.running}`}
              hint={`${s.jobs.pending} fila · ${s.jobs.running} rodando · ${s.jobs.failed24h} falhas 24h`}
              icon={<ListTodo className="h-4 w-4" />}
            />
            <MetricCard
              label="Notificações (24h)"
              value={s.notifications.sent24h.toLocaleString("pt-BR")}
              hint={`${s.notifications.pending} pendentes · ${s.notifications.failed24h} falhas`}
              icon={<Bell className="h-4 w-4" />}
            />
            <MetricCard
              label="Pagamentos (24h)"
              value={formatBRL(s.payments.grossCents24h)}
              hint={`${s.payments.approved24h} aprovados · ${s.payments.pending} pendentes`}
              icon={<CreditCard className="h-4 w-4" />}
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Bot className="h-4 w-4 text-accent" /> IA Gateway (24h)
              </div>
              <div className="mt-4 flex items-end gap-6">
                <div>
                  <div className="text-3xl font-black">
                    {s.ai.requests24h.toLocaleString("pt-BR")}
                  </div>
                  <div className="text-xs text-foreground/60">Requisições</div>
                </div>
                <div>
                  <div
                    className={`text-3xl font-black ${s.ai.errors24h > 0 ? "text-destructive" : ""}`}
                  >
                    {s.ai.errors24h}
                  </div>
                  <div className="text-xs text-foreground/60">Erros</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Últimos erros
              </div>
              {s.recentErrors.length === 0 ? (
                <div className="mt-4 text-xs text-foreground/60">
                  Nenhum erro nas últimas 24h. 🎉
                </div>
              ) : (
                <ul className="mt-4 space-y-2 text-xs">
                  {s.recentErrors.map((e) => (
                    <li key={e.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                      <div className="flex items-center justify-between text-foreground/60">
                        <span className="font-mono">{e.module}</span>
                        <span>{new Date(e.createdAt).toLocaleString("pt-BR")}</span>
                      </div>
                      <div className="mt-1 text-foreground/90">{e.message ?? "(sem mensagem)"}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
    </PageContainer>
  );
}
