/**
 * Etapa G — Render & Vídeo.
 *
 * Fila de jobs de render (image / panorama / turntable / video),
 * KPIs, presets e enqueue rápido a partir de um projeto do tenant.
 */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  X,
  Trash2,
  Image as ImageIcon,
  Film,
  Aperture,
  RotateCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  StatusBadge,
  Button,
} from "@/core/components/ui-kit";
import {
  listRenderJobs,
  renderStats,
  enqueueRenderJob,
  cancelRenderJob,
  deleteRenderJob,
  listRenderPresets,
  type RenderJobRow,
  type RenderKind,
  type RenderStatus,
} from "@/lib/planner-render.functions";
import { listProjects } from "@/lib/planner-projects.functions";

export const Route = createFileRoute("/_authenticated/planner/render")({
  head: () => ({
    meta: [
      { title: "Render & Vídeo — Dioris Planner" },
      {
        name: "description",
        content: "Fila de renderização foto-realista e vídeo cinematográfico do Dioris Planner.",
      },
      { property: "og:title", content: "Render & Vídeo — Dioris Planner" },
      {
        property: "og:description",
        content: "Enfileire renders, panoramas 360º e vídeos com controle em tempo real.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RenderPage,
});

const STATUS_TONE: Record<RenderStatus, "neutral" | "warning" | "success" | "danger"> = {
  queued: "neutral",
  running: "warning",
  succeeded: "success",
  failed: "danger",
  cancelled: "neutral",
};

const STATUS_LABEL: Record<RenderStatus, string> = {
  queued: "Na fila",
  running: "Renderizando",
  succeeded: "Concluído",
  failed: "Falhou",
  cancelled: "Cancelado",
};

const KIND_ICON: Record<RenderKind, typeof ImageIcon> = {
  image: ImageIcon,
  video: Film,
  panorama: Aperture,
  turntable: RotateCw,
};

const KIND_LABEL: Record<RenderKind, string> = {
  image: "Imagem",
  video: "Vídeo",
  panorama: "Panorama 360º",
  turntable: "Turntable",
};

function RenderPage() {
  const qc = useQueryClient();
  const list = useServerFn(listRenderJobs);
  const stats = useServerFn(renderStats);
  const enqueue = useServerFn(enqueueRenderJob);
  const cancel = useServerFn(cancelRenderJob);
  const remove = useServerFn(deleteRenderJob);

  const [kindFilter, setKindFilter] = useState<RenderKind | "all">("all");
  const [enqueueOpen, setEnqueueOpen] = useState(false);

  const statsQuery = useQuery({
    queryKey: ["planner", "render", "stats"],
    queryFn: () => stats(),
    staleTime: 15_000,
    // Polling suave enquanto houver jobs ativos.
    refetchInterval: 20_000,
  });

  const jobsQuery = useQuery({
    queryKey: ["planner", "render", "list", kindFilter],
    queryFn: () =>
      list({ data: { kind: kindFilter === "all" ? undefined : kindFilter, limit: 100 } }),
    staleTime: 5_000,
    // Auto-refresh a cada 10s para acompanhar progresso da fila.
    refetchInterval: 10_000,
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["planner", "render"] });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancel({ data: { id } }),
    onSuccess: () => {
      toast.success("Job cancelado");
      invalidate();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Job removido");
      invalidate();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const enqueueMutation = useMutation({
    mutationFn: (data: Parameters<typeof enqueue>[0]["data"]) => enqueue({ data }),
    onSuccess: () => {
      toast.success("Job enfileirado");
      setEnqueueOpen(false);
      invalidate();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Falha ao enfileirar"),
  });

  const rows = jobsQuery.data ?? [];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Planner"
        title="Render & Vídeo"
        description="Fila de renderização em tempo real — imagens foto-realistas, panoramas 360º, turntables e vídeo cinematográfico."
        actions={
          <Button size="sm" onClick={() => setEnqueueOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Novo render
          </Button>
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total"
          value={statsQuery.data?.total ?? 0}
          icon={<Zap className="h-4 w-4" />}
        />
        <MetricCard
          label="Em execução"
          value={statsQuery.data?.running ?? 0}
          hint={`${statsQuery.data?.queued ?? 0} na fila`}
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricCard
          label="Concluídos"
          value={statsQuery.data?.succeeded ?? 0}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <MetricCard
          label="Falhas"
          value={statsQuery.data?.failed ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-1">
        {(
          [
            { id: "all", label: "Todos" },
            { id: "image", label: "Imagens" },
            { id: "video", label: "Vídeos" },
            { id: "panorama", label: "Panoramas" },
            { id: "turntable", label: "Turntables" },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setKindFilter(f.id as RenderKind | "all")}
            className={
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors " +
              (kindFilter === f.id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground")
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-background/40">
        {jobsQuery.isLoading ? (
          <div className="grid place-items-center p-10 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando jobs de render…
            </span>
          </div>
        ) : rows.length === 0 ? (
          <div className="grid place-items-center p-10 text-sm text-muted-foreground">
            Nenhum job de render ainda. Clique em <strong className="mx-1">Novo render</strong> para começar.
          </div>
        ) : (
          <div className="max-h-[calc(100vh-460px)] min-h-[400px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Tipo</th>
                  <th className="px-3 py-2 text-left">Engine · Qualidade</th>
                  <th className="px-3 py-2 text-left">Resolução</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left w-48">Progresso</th>
                  <th className="px-3 py-2 text-right">Créditos</th>
                  <th className="px-3 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <JobRowView
                    key={r.id}
                    row={r}
                    onCancel={() => cancelMutation.mutate(r.id)}
                    onRemove={() => {
                      if (confirm("Remover este job?")) removeMutation.mutate(r.id);
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {enqueueOpen ? (
        <EnqueueDialog
          onClose={() => setEnqueueOpen(false)}
          onEnqueue={(data) => enqueueMutation.mutate(data)}
          saving={enqueueMutation.isPending}
        />
      ) : null}
    </PageContainer>
  );
}

function JobRowView({
  row,
  onCancel,
  onRemove,
}: {
  row: RenderJobRow;
  onCancel: () => void;
  onRemove: () => void;
}) {
  const Icon = KIND_ICON[row.kind];
  const canCancel = row.status === "queued" || row.status === "running";
  return (
    <tr className="border-t border-border/40 hover:bg-muted/30">
      <td className="px-3 py-2">
        <div className="inline-flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <div>
            <div className="text-sm font-medium">{KIND_LABEL[row.kind]}</div>
            <div className="text-[11px] text-muted-foreground">
              {new Date(row.createdAt).toLocaleString("pt-BR")}
            </div>
          </div>
        </div>
      </td>
      <td className="px-3 py-2 text-xs">
        <div className="font-medium">{row.engine ?? "—"}</div>
        <div className="text-muted-foreground">{row.quality ?? "—"}</div>
      </td>
      <td className="px-3 py-2 text-xs tabular-nums text-muted-foreground">
        {row.width && row.height ? `${row.width}×${row.height}` : "—"}
        {row.durationSec ? ` · ${row.durationSec}s` : ""}
        {row.fps ? ` · ${row.fps}fps` : ""}
      </td>
      <td className="px-3 py-2">
        <StatusBadge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</StatusBadge>
        {row.error ? (
          <div className="mt-1 max-w-[220px] truncate text-[11px] text-destructive" title={row.error}>
            {row.error}
          </div>
        ) : null}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.max(0, Math.min(100, row.progress))}%` }}
            />
          </div>
          <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
            {Math.round(row.progress)}%
          </span>
        </div>
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-xs">
        {row.creditsCost ?? 0}
      </td>
      <td className="px-3 py-2 text-right">
        <div className="inline-flex items-center gap-1">
          {canCancel ? (
            <Button size="sm" variant="ghost" onClick={onCancel} title="Cancelar">
              <X className="h-4 w-4" />
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

interface PresetRow {
  id: string;
  name: string;
  kind: RenderKind;
  engine: string | null;
  quality: string | null;
  is_official: boolean | null;
}

function EnqueueDialog({
  onClose,
  onEnqueue,
  saving,
}: {
  onClose: () => void;
  onEnqueue: (data: {
    projectId: string;
    kind: RenderKind;
    engine: string;
    quality: string;
    presetId?: string | null;
    durationSec?: number;
    fps?: number;
  }) => void;
  saving: boolean;
}) {
  const projects = useServerFn(listProjects);
  const presetsFn = useServerFn(listRenderPresets);

  const [kind, setKind] = useState<RenderKind>("image");
  const [projectId, setProjectId] = useState<string>("");
  const [engine, setEngine] = useState("cycles");
  const [quality, setQuality] = useState("standard");
  const [presetId, setPresetId] = useState<string>("");
  const [duration, setDuration] = useState(8);
  const [fps, setFps] = useState(30);

  const projectsQuery = useQuery({
    queryKey: ["planner", "projects", "list"],
    queryFn: () => projects(),
    staleTime: 30_000,
  });

  const presetsQuery = useQuery({
    queryKey: ["planner", "render", "presets", kind],
    queryFn: () => presetsFn({ data: { kind } }),
    staleTime: 60_000,
  });

  const availablePresets = useMemo(
    () => (presetsQuery.data ?? []) as PresetRow[],
    [presetsQuery.data],
  );

  const isVideoish = kind === "video" || kind === "turntable";
  const submitDisabled = saving || !projectId;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-border/60 bg-card p-5 shadow-2xl">
        <h2 className="text-lg font-semibold">Novo render</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          O job entra na fila e reporta progresso em tempo real. Os créditos são
          consumidos ao concluir.
        </p>

        <div className="mt-4 grid gap-3">
          <div className="grid gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Tipo
            </span>
            <div className="grid grid-cols-4 gap-1">
              {(["image", "panorama", "turntable", "video"] as const).map((k) => {
                const Icon = KIND_ICON[k];
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={
                      "flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-xs transition-colors " +
                      (kind === k
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:bg-muted")
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {KIND_LABEL[k]}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="grid gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Projeto
            </span>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">
                {projectsQuery.isLoading ? "Carregando…" : "Selecione um projeto"}
              </option>
              {(projectsQuery.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.client ? ` · ${p.client}` : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Engine
              </span>
              <select
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="cycles">Cycles (Ray Tracing)</option>
                <option value="eevee">Eevee (Rasterizado)</option>
                <option value="pbr-realtime">PBR Realtime</option>
                <option value="path-tracer">Path Tracer</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Qualidade
              </span>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="standard">Standard</option>
                <option value="high">High</option>
                <option value="ultra">Ultra (8K)</option>
                <option value="cinema">Cinema (16K)</option>
              </select>
            </label>
          </div>

          {availablePresets.length > 0 ? (
            <label className="grid gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Preset (opcional)
              </span>
              <select
                value={presetId}
                onChange={(e) => setPresetId(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="">Sem preset</option>
                {availablePresets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.is_official ? " ★" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {isVideoish ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Duração (s)
                </span>
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm tabular-nums"
                />
              </label>
              {kind === "video" ? (
                <label className="grid gap-1">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    FPS
                  </span>
                  <input
                    type="number"
                    min={12}
                    max={120}
                    value={fps}
                    onChange={(e) => setFps(Number(e.target.value))}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm tabular-nums"
                  />
                </label>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() =>
              onEnqueue({
                projectId,
                kind,
                engine,
                quality,
                presetId: presetId || null,
                ...(isVideoish ? { durationSec: duration } : {}),
                ...(kind === "video" ? { fps } : {}),
              })
            }
            disabled={submitDisabled}
          >
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Enfileirar
          </Button>
        </div>
      </div>
    </div>
  );
}