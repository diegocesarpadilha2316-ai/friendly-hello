/**
 * Etapa F — Produção & CNC.
 *
 * Ordens de produção (listagem, criação rápida, transições de status,
 * progresso), jobs CNC e máquinas cadastradas. Tenant-scoped via
 * requireTenant + RLS. Sem novos providers/stores.
 */
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Search,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Trash2,
  Factory,
  Cpu,
  Activity,
  ClipboardList,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  StatusBadge,
  Button,
} from "@/core/components/ui-kit";
import {
  listProductionOrders,
  productionStats,
  createProductionOrder,
  setProductionOrderStatus,
  setProductionOrderProgress,
  deleteProductionOrder,
  listCncJobs,
  listCncMachines,
  type ProductionOrderRow,
  type ProductionOrderStatus,
} from "@/lib/planner-production.functions";

export const Route = createFileRoute("/_authenticated/planner/producao")({
  head: () => ({
    meta: [
      { title: "Produção — Dioris Planner" },
      {
        name: "description",
        content: "Ordens de produção, etapas, progresso e jobs CNC do Dioris Planner.",
      },
      { property: "og:title", content: "Produção — Dioris Planner" },
      {
        property: "og:description",
        content: "Gerencie ordens de produção, etapas e jobs CNC em tempo real.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProducaoPage,
});

const STATUS_TONE: Record<
  ProductionOrderStatus,
  "neutral" | "info" | "warning" | "success" | "danger"
> = {
  draft: "neutral",
  planned: "info",
  in_progress: "warning",
  paused: "warning",
  completed: "success",
  cancelled: "danger",
};

const STATUS_LABEL: Record<ProductionOrderStatus, string> = {
  draft: "Rascunho",
  planned: "Planejado",
  in_progress: "Em produção",
  paused: "Pausado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

type Tab = "orders" | "cnc" | "machines";

function ProducaoPage() {
  const qc = useQueryClient();
  const list = useServerFn(listProductionOrders);
  const stats = useServerFn(productionStats);
  const create = useServerFn(createProductionOrder);
  const setStatus = useServerFn(setProductionOrderStatus);
  const setProgress = useServerFn(setProductionOrderProgress);
  const remove = useServerFn(deleteProductionOrder);
  const cncJobs = useServerFn(listCncJobs);
  const cncMachines = useServerFn(listCncMachines);

  const [tab, setTab] = useState<Tab>("orders");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductionOrderStatus | "all">("all");
  const [creating, setCreating] = useState(false);

  const statsQuery = useQuery({
    queryKey: ["planner", "production", "stats"],
    queryFn: () => stats(),
    staleTime: 30_000,
  });

  const ordersQuery = useQuery({
    queryKey: ["planner", "production", "list", query, statusFilter],
    queryFn: () =>
      list({
        data: {
          query: query || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          limit: 200,
        },
      }),
    staleTime: 15_000,
    enabled: tab === "orders",
  });

  const jobsQuery = useQuery({
    queryKey: ["planner", "production", "cnc-jobs"],
    queryFn: () => cncJobs({ data: { limit: 100 } }),
    staleTime: 15_000,
    enabled: tab === "cnc",
  });

  const machinesQuery = useQuery({
    queryKey: ["planner", "production", "cnc-machines"],
    queryFn: () => cncMachines(),
    staleTime: 60_000,
    enabled: tab === "machines",
  });

  const invalidateOrders = () => {
    qc.invalidateQueries({ queryKey: ["planner", "production"] });
  };

  const createMutation = useMutation({
    mutationFn: (data: { title: string; priority: number }) => create({ data }),
    onSuccess: () => {
      toast.success("Ordem criada");
      setCreating(false);
      invalidateOrders();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const statusMutation = useMutation({
    mutationFn: (v: { id: string; status: ProductionOrderStatus }) =>
      setStatus({ data: v }),
    onSuccess: () => {
      toast.success("Status atualizado");
      invalidateOrders();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const progressMutation = useMutation({
    mutationFn: (v: { id: string; progressPercent: number }) =>
      setProgress({ data: v }),
    onSuccess: () => invalidateOrders(),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Ordem removida");
      invalidateOrders();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const rows = ordersQuery.data ?? [];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Planner"
        title="Produção Inteligente"
        description="Gerencie ordens de produção, etapas, progresso e jobs CNC — tudo com dados reais do seu tenant."
        actions={
          tab === "orders" ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Nova ordem
            </Button>
          ) : null
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Ordens"
          value={statsQuery.data?.total ?? 0}
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <MetricCard
          label="Em produção"
          value={statsQuery.data?.inProgress ?? 0}
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard
          label="Concluídas"
          value={statsQuery.data?.completed ?? 0}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <MetricCard
          label="Progresso médio"
          value={`${statsQuery.data?.avgProgress ?? 0}%`}
          icon={<Factory className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 flex items-center gap-1 border-b border-border/60">
        {(
          [
            { id: "orders", label: "Ordens", icon: ClipboardList },
            { id: "cnc", label: "Jobs CNC", icon: Cpu },
            { id: "machines", label: "Máquinas", icon: Factory },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              "inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors " +
              (tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground")
            }
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "orders" ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por título ou número…"
                className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {(
                [
                  { id: "all", label: "Todas" },
                  { id: "draft", label: "Rascunho" },
                  { id: "planned", label: "Planejadas" },
                  { id: "in_progress", label: "Em produção" },
                  { id: "paused", label: "Pausadas" },
                  { id: "completed", label: "Concluídas" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id as ProductionOrderStatus | "all")}
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
            {ordersQuery.isLoading ? (
              <div className="grid place-items-center p-10 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando ordens…
                </span>
              </div>
            ) : rows.length === 0 ? (
              <div className="grid place-items-center p-10 text-sm text-muted-foreground">
                Nenhuma ordem encontrada.
              </div>
            ) : (
              <div className="max-h-[calc(100vh-500px)] min-h-[400px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Nº / Título</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left w-56">Progresso</th>
                      <th className="px-3 py-2 text-left">Prioridade</th>
                      <th className="px-3 py-2 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <OrderRowView
                        key={r.id}
                        row={r}
                        onStatus={(s) => statusMutation.mutate({ id: r.id, status: s })}
                        onProgress={(pct) =>
                          progressMutation.mutate({ id: r.id, progressPercent: pct })
                        }
                        onRemove={() => {
                          if (confirm(`Remover a ordem "${r.title ?? r.number ?? r.id}"?`)) {
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
        </>
      ) : tab === "cnc" ? (
        <CncJobsPanel loading={jobsQuery.isLoading} jobs={jobsQuery.data ?? []} />
      ) : (
        <MachinesPanel loading={machinesQuery.isLoading} machines={machinesQuery.data ?? []} />
      )}

      {creating ? (
        <QuickCreateOrderDialog
          onClose={() => setCreating(false)}
          onCreate={(v) => createMutation.mutate(v)}
          saving={createMutation.isPending}
        />
      ) : null}
    </PageContainer>
  );
}

function OrderRowView({
  row,
  onStatus,
  onProgress,
  onRemove,
}: {
  row: ProductionOrderRow;
  onStatus: (s: ProductionOrderStatus) => void;
  onProgress: (pct: number) => void;
  onRemove: () => void;
}) {
  return (
    <tr className="border-t border-border/40 hover:bg-muted/30">
      <td className="px-3 py-2">
        <div className="truncate font-medium" title={row.title ?? undefined}>
          {row.number ? <span className="text-muted-foreground">#{row.number} · </span> : null}
          {row.title ?? "(sem título)"}
        </div>
        <div className="text-[11px] text-muted-foreground">
          atualizado {new Date(row.updatedAt || row.createdAt).toLocaleDateString("pt-BR")}
        </div>
      </td>
      <td className="px-3 py-2">
        <StatusBadge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</StatusBadge>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={row.progressPercent}
            onChange={(e) => onProgress(Number(e.target.value))}
            className="h-2 w-32 cursor-pointer accent-primary"
          />
          <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
            {row.progressPercent}%
          </span>
        </div>
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">P{row.priority}</td>
      <td className="px-3 py-2 text-right">
        <div className="inline-flex items-center gap-1">
          {row.status === "draft" || row.status === "planned" ? (
            <Button size="sm" variant="ghost" onClick={() => onStatus("in_progress")} title="Iniciar">
              <Play className="h-4 w-4" />
            </Button>
          ) : null}
          {row.status === "in_progress" ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => onStatus("paused")} title="Pausar">
                <Pause className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onStatus("completed")} title="Concluir">
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            </>
          ) : null}
          {row.status === "paused" ? (
            <Button size="sm" variant="ghost" onClick={() => onStatus("in_progress")} title="Retomar">
              <Play className="h-4 w-4" />
            </Button>
          ) : null}
          {row.status !== "cancelled" && row.status !== "completed" ? (
            <Button size="sm" variant="ghost" onClick={() => onStatus("cancelled")} title="Cancelar">
              <XCircle className="h-4 w-4" />
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={onRemove} title="Remover">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

interface CncJobRow {
  id: string;
  name: string | null;
  status: string | null;
  format: string | null;
  pieces_count: number | null;
  sheets_count: number | null;
  estimated_time_seconds: number | null;
  actual_time_seconds: number | null;
  created_at: string | null;
  error_message: string | null;
}

function CncJobsPanel({ loading, jobs }: { loading: boolean; jobs: readonly CncJobRow[] }) {
  if (loading) {
    return (
      <div className="mt-4 grid place-items-center rounded-xl border border-border/60 bg-background/40 p-10 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando jobs CNC…
        </span>
      </div>
    );
  }
  if (jobs.length === 0) {
    return (
      <div className="mt-4 grid place-items-center rounded-xl border border-border/60 bg-background/40 p-10 text-sm text-muted-foreground">
        Nenhum job CNC ainda. Gere um plano de corte a partir de uma ordem para vê-lo aqui.
      </div>
    );
  }
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-background/40">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Job</th>
            <th className="px-3 py-2 text-left">Formato</th>
            <th className="px-3 py-2 text-right">Peças</th>
            <th className="px-3 py-2 text-right">Chapas</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Criado em</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id} className="border-t border-border/40">
              <td className="px-3 py-2 font-medium truncate max-w-xs">{j.name ?? "—"}</td>
              <td className="px-3 py-2 uppercase text-xs text-muted-foreground">
                {j.format ?? "—"}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{j.pieces_count ?? 0}</td>
              <td className="px-3 py-2 text-right tabular-nums">{j.sheets_count ?? 0}</td>
              <td className="px-3 py-2">
                <StatusBadge
                  tone={
                    j.status === "completed"
                      ? "success"
                      : j.status === "failed"
                        ? "danger"
                        : j.status === "running"
                          ? "warning"
                          : "neutral"
                  }
                >
                  {j.status ?? "—"}
                </StatusBadge>
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground">
                {j.created_at ? new Date(j.created_at).toLocaleString("pt-BR") : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface MachineRow {
  id: string;
  name: string | null;
  brand: string | null;
  model: string | null;
  controller: string | null;
  post_processor: string | null;
  max_width_mm: number | null;
  max_height_mm: number | null;
  max_thickness_mm: number | null;
}

function MachinesPanel({
  loading,
  machines,
}: {
  loading: boolean;
  machines: readonly MachineRow[];
}) {
  if (loading) {
    return (
      <div className="mt-4 grid place-items-center rounded-xl border border-border/60 bg-background/40 p-10 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando máquinas…
        </span>
      </div>
    );
  }
  if (machines.length === 0) {
    return (
      <div className="mt-4 grid place-items-center rounded-xl border border-border/60 bg-background/40 p-10 text-sm text-muted-foreground">
        Nenhuma máquina cadastrada. Configure máquinas CNC no admin do tenant.
      </div>
    );
  }
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {machines.map((m) => (
        <div
          key={m.id}
          className="rounded-xl border border-border/60 bg-background/40 p-4 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold">{m.name ?? "Máquina"}</div>
              <div className="text-xs text-muted-foreground">
                {[m.brand, m.model].filter(Boolean).join(" · ") || "—"}
              </div>
            </div>
            <Factory className="h-5 w-5 text-primary/70" />
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-muted-foreground">Controle</dt>
              <dd className="font-medium">{m.controller ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Pós-processador</dt>
              <dd className="font-medium">{m.post_processor ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Área útil</dt>
              <dd className="font-medium tabular-nums">
                {m.max_width_mm ?? "?"}×{m.max_height_mm ?? "?"} mm
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Espessura máx.</dt>
              <dd className="font-medium tabular-nums">{m.max_thickness_mm ?? "—"} mm</dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  );
}

function QuickCreateOrderDialog({
  onClose,
  onCreate,
  saving,
}: {
  onClose: () => void;
  onCreate: (v: { title: string; priority: number }) => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(5);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-border/60 bg-card p-5 shadow-2xl">
        <h2 className="text-lg font-semibold">Nova ordem de produção</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          A ordem inicia como rascunho. As etapas padrão (Corte → Furação → Fitagem → Montagem → Embalagem) são criadas automaticamente.
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
              Prioridade (0-10)
            </span>
            <input
              type="number"
              min={0}
              max={10}
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm tabular-nums"
            />
          </label>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => onCreate({ title: title.trim(), priority })}
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