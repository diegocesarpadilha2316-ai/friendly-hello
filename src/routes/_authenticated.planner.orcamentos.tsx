/**
 * Etapa E — Orçamentos (lista + criação rápida + status).
 *
 * Consome `listQuotes`, `quotesStats`, `createQuote`, `setQuoteStatus` e
 * `deleteQuote` (tenant-scoped via requireTenant / RLS).
 */
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Search,
  Trash2,
  FileText,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  StatusBadge,
  Button,
} from "@/core/components/ui-kit";
import {
  listQuotes,
  quotesStats,
  createQuote,
  setQuoteStatus,
  deleteQuote,
  type QuoteRow,
  type QuoteStatus,
} from "@/lib/planner-quotes.functions";

export const Route = createFileRoute("/_authenticated/planner/orcamentos")({
  head: () => ({
    meta: [
      { title: "Orçamentos — Dioris Planner" },
      {
        name: "description",
        content: "Gestão de orçamentos, status e conversão em faturas do Dioris Planner.",
      },
      { property: "og:title", content: "Orçamentos — Dioris Planner" },
      {
        property: "og:description",
        content: "Criar, editar e converter orçamentos em faturas.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrcamentosPage,
});

const STATUS_TONE: Record<QuoteStatus, "success" | "warning" | "neutral" | "danger"> = {
  draft: "neutral",
  sent: "warning",
  viewed: "warning",
  approved: "success",
  rejected: "danger",
  expired: "danger",
  converted: "success",
};

const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  viewed: "Visualizado",
  approved: "Aprovado",
  rejected: "Rejeitado",
  expired: "Expirado",
  converted: "Convertido",
};

function fmtBRL(v: number, currency = "BRL") {
  return v.toLocaleString("pt-BR", { style: "currency", currency });
}

function OrcamentosPage() {
  const qc = useQueryClient();
  const list = useServerFn(listQuotes);
  const stats = useServerFn(quotesStats);
  const create = useServerFn(createQuote);
  const setStatus = useServerFn(setQuoteStatus);
  const remove = useServerFn(deleteQuote);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [creating, setCreating] = useState(false);

  const statsQuery = useQuery({
    queryKey: ["planner", "quotes", "stats"],
    queryFn: () => stats(),
    staleTime: 30_000,
  });

  const listQuery = useQuery({
    queryKey: ["planner", "quotes", "list", query, statusFilter],
    queryFn: () =>
      list({
        data: {
          query: query || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          limit: 200,
        },
      }),
    staleTime: 15_000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["planner", "quotes"] });
  };

  const createMutation = useMutation({
    mutationFn: (data: { title: string; clientName: string }) => create({ data }),
    onSuccess: (row) => {
      toast.success("Orçamento criado");
      setCreating(false);
      invalidate();
      // opcional: navegar para detalhe — mantemos lista pura por simplicidade
      void row;
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Falha ao criar"),
  });

  const statusMutation = useMutation({
    mutationFn: (v: { id: string; status: Exclude<QuoteStatus, "converted"> }) =>
      setStatus({ data: v }),
    onSuccess: () => {
      toast.success("Status atualizado");
      invalidate();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Falha ao atualizar"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Orçamento removido");
      invalidate();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Falha ao remover"),
  });

  const rows = listQuery.data ?? [];

  const filters = useMemo(
    () =>
      [
        { id: "all" as const, label: "Todos" },
        { id: "draft" as const, label: "Rascunho" },
        { id: "sent" as const, label: "Enviados" },
        { id: "approved" as const, label: "Aprovados" },
        { id: "rejected" as const, label: "Rejeitados" },
        { id: "converted" as const, label: "Convertidos" },
      ] satisfies { id: QuoteStatus | "all"; label: string }[],
    [],
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Planner"
        title="Orçamentos"
        description="Gerencie orçamentos, mude o status e converta em faturas quando aprovados."
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Novo orçamento
          </Button>
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total"
          value={statsQuery.data?.total ?? 0}
          icon={<FileText className="h-4 w-4" />}
        />
        <MetricCard
          label="Pipeline"
          value={fmtBRL(statsQuery.data?.pipelineValue ?? 0)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          label="Aprovados"
          value={fmtBRL(statsQuery.data?.approvedValue ?? 0)}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <MetricCard
          label="Rejeitados"
          value={statsQuery.data?.rejected ?? 0}
          icon={<XCircle className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, número ou cliente…"
            className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors " +
                (statusFilter === f.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground")
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-background/40">
        {listQuery.isLoading ? (
          <div className="grid place-items-center p-10 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando orçamentos…
            </span>
          </div>
        ) : rows.length === 0 ? (
          <div className="grid place-items-center p-10 text-sm text-muted-foreground">
            Nenhum orçamento encontrado.
          </div>
        ) : (
          <div className="max-h-[calc(100vh-460px)] min-h-[400px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Nº / Título</th>
                  <th className="px-3 py-2 text-left">Cliente</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-left">Validade</th>
                  <th className="px-3 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <QuoteRowView
                    key={r.id}
                    row={r}
                    onStatus={(status) =>
                      statusMutation.mutate({ id: r.id, status })
                    }
                    onRemove={() => {
                      if (confirm(`Remover orçamento "${r.title ?? r.number ?? r.id}"?`)) {
                        removeMutation.mutate(r.id);
                      }
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating ? (
        <QuickCreateDialog
          onClose={() => setCreating(false)}
          onCreate={(data) => createMutation.mutate(data)}
          saving={createMutation.isPending}
        />
      ) : null}
    </PageContainer>
  );
}

function QuoteRowView({
  row,
  onStatus,
  onRemove,
}: {
  row: QuoteRow;
  onStatus: (s: Exclude<QuoteStatus, "converted">) => void;
  onRemove: () => void;
}) {
  return (
    <tr className="border-t border-border/40 hover:bg-muted/30">
      <td className="px-3 py-2">
        <Link
          to="/planner/orcamentos"
          className="block truncate font-medium hover:underline"
          title={row.title ?? undefined}
        >
          {row.number ? <span className="text-muted-foreground">#{row.number} · </span> : null}
          {row.title ?? "(sem título)"}
        </Link>
        <div className="text-[11px] text-muted-foreground">
          atualizado {new Date(row.updatedAt || row.createdAt).toLocaleDateString("pt-BR")}
        </div>
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {row.clientName ?? "—"}
      </td>
      <td className="px-3 py-2">
        <StatusBadge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</StatusBadge>
      </td>
      <td className="px-3 py-2 text-right tabular-nums font-medium">
        {fmtBRL(row.total, row.currency)}
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {row.validUntil ? new Date(row.validUntil).toLocaleDateString("pt-BR") : "—"}
      </td>
      <td className="px-3 py-2 text-right">
        <div className="inline-flex items-center gap-1">
          {row.status === "draft" ? (
            <Button size="sm" variant="ghost" onClick={() => onStatus("sent")}>
              Enviar
            </Button>
          ) : null}
          {row.status === "sent" || row.status === "viewed" ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => onStatus("approved")}>
                Aprovar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onStatus("rejected")}>
                Rejeitar
              </Button>
            </>
          ) : null}
          <Button size="sm" variant="ghost" onClick={onRemove} title="Remover">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function QuickCreateDialog({
  onClose,
  onCreate,
  saving,
}: {
  onClose: () => void;
  onCreate: (data: { title: string; clientName: string }) => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-border/60 bg-card p-5 shadow-2xl">
        <h2 className="text-lg font-semibold">Novo orçamento</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Comece com um rascunho — itens e preços podem ser adicionados depois.
        </p>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Título
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Cozinha planejada — Apto 42"
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Cliente
            </span>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nome do cliente"
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            />
          </label>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() =>
              onCreate({ title: title.trim(), clientName: clientName.trim() })
            }
            disabled={saving || !title.trim()}
          >
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Criar
          </Button>
        </div>
      </div>
    </div>
  );
}