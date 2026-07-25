/**
 * Etapa H — AI Studio (histórico persistente).
 *
 * Consome `planner-ai.functions.ts` (sessions, messages, tool calls, usage)
 * — tenant-scoped via `requireTenant` + RLS. Sem novos providers/stores.
 */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  Archive,
  ArchiveRestore,
  MessageSquare,
  Sparkles,
  Wrench,
  Coins,
  Activity,
  AlertTriangle,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  StatusBadge,
  Button,
  SearchInput,
} from "@/core/components/ui-kit";
import {
  listAiSessions,
  createAiSession,
  getAiSession,
  updateAiSession,
  deleteAiSession,
  aiUsageStats,
  listAiModels,
} from "@/lib/planner-ai.functions";

export const Route = createFileRoute("/_authenticated/planner/ia-studio")({
  head: () => ({
    meta: [
      { title: "AI Studio — Dioris Planner" },
      {
        name: "description",
        content:
          "Histórico de sessões da IA do Planner — mensagens, tool calls e consumo de créditos por provedor.",
      },
      { property: "og:title", content: "AI Studio — Dioris Planner" },
      {
        property: "og:description",
        content:
          "Auditoria completa das conversas da IA — provedores, tokens, créditos e ferramentas executadas.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AiStudioPage,
});

type SessionRow = {
  id: string;
  project_id: string | null;
  model_id: string | null;
  title: string | null;
  summary: string | null;
  message_count: number | null;
  tokens_in: number | null;
  tokens_out: number | null;
  archived: boolean | null;
  created_at: string;
  updated_at: string;
};

function AiStudioPage() {
  const qc = useQueryClient();
  const list = useServerFn(listAiSessions);
  const stats = useServerFn(aiUsageStats);
  const create = useServerFn(createAiSession);
  const update = useServerFn(updateAiSession);
  const remove = useServerFn(deleteAiSession);

  const [showArchived, setShowArchived] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const statsQuery = useQuery({
    queryKey: ["planner", "ai", "usage", 30],
    queryFn: () => stats({ data: { days: 30 } }),
    staleTime: 30_000,
  });

  const sessionsQuery = useQuery({
    queryKey: ["planner", "ai", "sessions", showArchived],
    queryFn: () => list({ data: { archived: showArchived, limit: 100 } }),
    staleTime: 10_000,
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["planner", "ai"] });

  const createMutation = useMutation({
    mutationFn: () => create({ data: { title: "Nova conversa" } }),
    onSuccess: (row: SessionRow) => {
      toast.success("Sessão criada");
      setSelectedId(row.id);
      invalidate();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Erro ao criar sessão"),
  });

  const archiveMutation = useMutation({
    mutationFn: (v: { id: string; archived: boolean }) =>
      update({ data: { id: v.id, archived: v.archived } }),
    onSuccess: (_r, v) => {
      toast.success(v.archived ? "Arquivada" : "Restaurada");
      invalidate();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Sessão removida");
      if (selectedId) setSelectedId(null);
      invalidate();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const rows = useMemo(() => {
    const all = (sessionsQuery.data ?? []) as SessionRow[];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((r) =>
      (r.title ?? "").toLowerCase().includes(q) ||
      (r.summary ?? "").toLowerCase().includes(q),
    );
  }, [sessionsQuery.data, query]);

  const providerBreakdown = useMemo(() => {
    const series = statsQuery.data?.series ?? [];
    const acc = new Map<
      string,
      { credits: number; tokensIn: number; tokensOut: number; calls: number }
    >();
    for (const r of series) {
      const key = r.provider ?? "desconhecido";
      const cur =
        acc.get(key) ?? { credits: 0, tokensIn: 0, tokensOut: 0, calls: 0 };
      cur.credits += Number(r.credits_spent) || 0;
      cur.tokensIn += r.tokens_in ?? 0;
      cur.tokensOut += r.tokens_out ?? 0;
      cur.calls += (r.calls_ok ?? 0) + (r.calls_error ?? 0);
      acc.set(key, cur);
    }
    return [...acc.entries()].sort((a, b) => b[1].credits - a[1].credits);
  }, [statsQuery.data]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Planner"
        title="AI Studio"
        description="Histórico completo das conversas com a IA — mensagens, ferramentas executadas e consumo de créditos por provedor."
        actions={
          <Button size="sm" onClick={() => createMutation.mutate()}>
            <Plus className="mr-1.5 h-4 w-4" /> Nova sessão
          </Button>
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Tokens entrada (30d)"
          value={(statsQuery.data?.totalTokensIn ?? 0).toLocaleString("pt-BR")}
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard
          label="Tokens saída (30d)"
          value={(statsQuery.data?.totalTokensOut ?? 0).toLocaleString("pt-BR")}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <MetricCard
          label="Créditos gastos"
          value={(statsQuery.data?.totalCredits ?? 0).toLocaleString("pt-BR", {
            maximumFractionDigits: 2,
          })}
          icon={<Coins className="h-4 w-4" />}
        />
        <MetricCard
          label="Chamadas OK · erro"
          value={`${statsQuery.data?.totalCallsOk ?? 0} · ${statsQuery.data?.totalCallsError ?? 0}`}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      {providerBreakdown.length > 0 ? (
        <div className="mt-4 rounded-xl border border-border/60 bg-background/40 p-3">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Consumo por provedor (30 dias)
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {providerBreakdown.map(([provider, s]) => (
              <div
                key={provider}
                className="flex items-center justify-between rounded-md border border-border/40 bg-card/50 px-3 py-2 text-xs"
              >
                <div>
                  <div className="font-medium capitalize">{provider}</div>
                  <div className="text-muted-foreground">
                    {s.calls} chamadas · {s.tokensIn.toLocaleString("pt-BR")} in ·{" "}
                    {s.tokensOut.toLocaleString("pt-BR")} out
                  </div>
                </div>
                <div className="text-right tabular-nums">
                  <div className="font-semibold text-primary">
                    {s.credits.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-muted-foreground">créditos</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="rounded-xl border border-border/60 bg-background/40">
          <div className="flex flex-wrap items-center gap-2 border-b border-border/40 p-2">
            <SearchInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar sessão…"
              className="flex-1 min-w-[180px]"
            />
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className={
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors " +
                (showArchived
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground")
              }
            >
              {showArchived ? "Arquivadas" : "Ativas"}
            </button>
          </div>
          <div className="max-h-[calc(100vh-460px)] min-h-[380px] overflow-auto">
            {sessionsQuery.isLoading ? (
              <div className="grid place-items-center p-10 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando sessões…
                </span>
              </div>
            ) : rows.length === 0 ? (
              <div className="grid place-items-center p-10 text-sm text-muted-foreground">
                Nenhuma sessão {showArchived ? "arquivada" : "ativa"} ainda.
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {rows.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(r.id)}
                      className={
                        "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40 " +
                        (selectedId === r.id ? "bg-muted/60" : "")
                      }
                    >
                      <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {r.title || "Sem título"}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span>{r.message_count ?? 0} msgs</span>
                          <span>·</span>
                          <span>{(r.tokens_in ?? 0) + (r.tokens_out ?? 0)} tokens</span>
                          {r.model_id ? (
                            <>
                              <span>·</span>
                              <span className="truncate">{r.model_id}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <div className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(r.updated_at).toLocaleDateString("pt-BR")}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <SessionDetail
          sessionId={selectedId}
          onArchive={(id, archived) =>
            archiveMutation.mutate({ id, archived })
          }
          onRemove={(id) => {
            if (confirm("Remover esta sessão e todo o histórico?"))
              removeMutation.mutate(id);
          }}
        />
      </div>
    </PageContainer>
  );
}

function SessionDetail({
  sessionId,
  onArchive,
  onRemove,
}: {
  sessionId: string | null;
  onArchive: (id: string, archived: boolean) => void;
  onRemove: (id: string) => void;
}) {
  const get = useServerFn(getAiSession);
  const models = useServerFn(listAiModels);

  const detailQuery = useQuery({
    queryKey: ["planner", "ai", "session", sessionId],
    queryFn: () => get({ data: { id: sessionId! } }),
    enabled: !!sessionId,
    staleTime: 5_000,
  });

  const modelsQuery = useQuery({
    queryKey: ["planner", "ai", "models"],
    queryFn: () => models(),
    staleTime: 5 * 60_000,
  });

  if (!sessionId) {
    return (
      <div className="grid min-h-[380px] place-items-center rounded-xl border border-dashed border-border/60 bg-background/40 p-8 text-center text-sm text-muted-foreground">
        <div>
          <Sparkles className="mx-auto mb-2 h-6 w-6 text-primary/60" />
          Selecione uma sessão à esquerda para inspecionar mensagens, tool calls
          e consumo.
        </div>
      </div>
    );
  }

  if (detailQuery.isLoading || !detailQuery.data) {
    return (
      <div className="grid min-h-[380px] place-items-center rounded-xl border border-border/60 bg-background/40 p-8 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando sessão…
        </span>
      </div>
    );
  }

  const { session, messages, toolCalls } = detailQuery.data;
  const modelInfo = (modelsQuery.data ?? []).find(
    (m) => m.model_key === session.model_id || m.id === session.model_id,
  );

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-background/40">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/40 p-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold">
            {session.title || "Sem título"}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <StatusBadge tone={session.archived ? "neutral" : "success"}>
              {session.archived ? "arquivada" : "ativa"}
            </StatusBadge>
            <span>{messages.length} mensagens</span>
            <span>· {toolCalls.length} tool calls</span>
            <span>
              · {(session.tokens_in ?? 0).toLocaleString("pt-BR")} in /{" "}
              {(session.tokens_out ?? 0).toLocaleString("pt-BR")} out
            </span>
            {modelInfo ? (
              <span className="capitalize">
                · {modelInfo.provider} · {modelInfo.display_name}
              </span>
            ) : session.model_id ? (
              <span>· {session.model_id}</span>
            ) : null}
          </div>
          {session.summary ? (
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
              {session.summary}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onArchive(session.id, !session.archived)}
            title={session.archived ? "Restaurar" : "Arquivar"}
          >
            {session.archived ? (
              <ArchiveRestore className="h-4 w-4" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(session.id)}
            title="Remover"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-h-[calc(100vh-520px)] min-h-[320px] overflow-auto p-3">
        {messages.length === 0 ? (
          <div className="grid place-items-center p-10 text-sm text-muted-foreground">
            Sessão vazia.
          </div>
        ) : (
          <ol className="space-y-3">
            {messages.map((m) => (
              <li key={m.id} className="rounded-lg border border-border/40 bg-card/40 p-3">
                <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide">
                  <span
                    className={
                      "rounded px-1.5 py-0.5 font-medium " +
                      (m.role === "user"
                        ? "bg-primary/15 text-primary"
                        : m.role === "assistant"
                          ? "bg-accent/20 text-accent-foreground"
                          : m.role === "tool"
                            ? "bg-amber-500/15 text-amber-500"
                            : "bg-muted text-muted-foreground")
                    }
                  >
                    {m.role}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(m.created_at).toLocaleString("pt-BR")}
                  </span>
                  {m.latency_ms ? (
                    <span className="text-muted-foreground">
                      · {m.latency_ms}ms
                    </span>
                  ) : null}
                  {(m.tokens_in ?? 0) + (m.tokens_out ?? 0) > 0 ? (
                    <span className="text-muted-foreground">
                      · {m.tokens_in ?? 0}/{m.tokens_out ?? 0} tok
                    </span>
                  ) : null}
                </div>
                <pre className="whitespace-pre-wrap break-words font-sans text-sm text-foreground/90">
                  {m.content}
                </pre>
              </li>
            ))}
          </ol>
        )}

        {toolCalls.length > 0 ? (
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <Wrench className="h-3.5 w-3.5" /> Ferramentas executadas
            </div>
            <ul className="space-y-2">
              {toolCalls.map((t) => (
                <li
                  key={t.id}
                  className="rounded-md border border-border/40 bg-muted/30 p-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-primary">
                      {t.tool_name}
                    </span>
                    <StatusBadge
                      tone={
                        t.status === "ok"
                          ? "success"
                          : t.status === "error"
                            ? "danger"
                            : t.status === "denied"
                              ? "warning"
                              : "neutral"
                      }
                    >
                      {t.status}
                    </StatusBadge>
                    {t.duration_ms ? (
                      <span className="text-muted-foreground">
                        {t.duration_ms}ms
                      </span>
                    ) : null}
                    <span className="ml-auto text-muted-foreground">
                      {new Date(t.executed_at).toLocaleTimeString("pt-BR")}
                    </span>
                  </div>
                  {t.summary ? (
                    <div className="mt-1 text-muted-foreground">{t.summary}</div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}