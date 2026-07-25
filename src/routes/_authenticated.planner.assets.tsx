/**
 * Etapa I — Assets Manager.
 *
 * Upload direto ao Supabase Storage (bucket `assets` por padrão) usando
 * o pipeline `startAssetUpload → storage.upload → completeAssetUpload`.
 * Sem novos providers/stores — apenas server functions tenant-scoped.
 */
import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  Trash2,
  RotateCcw,
  Download,
  Image as ImageIcon,
  Film,
  FileText,
  Box,
  Palette,
  Music,
  Sun,
  Sparkles,
  HardDrive,
  Archive,
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
  listAssets,
  assetsStats,
  startAssetUpload,
  completeAssetUpload,
  failAssetUpload,
  signAssetDownload,
  softDeleteAsset,
  restoreAsset,
  type AssetKind,
} from "@/lib/planner-assets.functions";
import { getSupabaseBrowser } from "@/core/lib/supabase/client";

export const Route = createFileRoute("/_authenticated/planner/assets")({
  head: () => ({
    meta: [
      { title: "Assets Manager — Dioris Planner" },
      {
        name: "description",
        content:
          "Biblioteca de mídia do Planner — imagens, renders, vídeos, texturas, HDRIs, modelos 3D e documentos.",
      },
      { property: "og:title", content: "Assets Manager — Dioris Planner" },
      {
        property: "og:description",
        content:
          "Upload, versionamento, permissões e signed URLs para todos os assets da empresa.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AssetsPage,
});

type AssetRow = {
  id: string;
  folder_id: string | null;
  provider: string;
  bucket: string;
  object_key: string;
  filename: string;
  mime: string | null;
  kind: AssetKind;
  visibility: "private" | "tenant" | "public";
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

const KIND_ICON: Record<AssetKind, typeof ImageIcon> = {
  image: ImageIcon,
  video: Film,
  audio: Music,
  document: FileText,
  model3d: Box,
  texture: Palette,
  hdri: Sun,
  render: Sparkles,
  other: FileText,
};

const KIND_LABEL: Record<AssetKind | "all", string> = {
  all: "Todos",
  image: "Imagens",
  video: "Vídeos",
  audio: "Áudios",
  document: "Documentos",
  model3d: "3D",
  texture: "Texturas",
  hdri: "HDRIs",
  render: "Renders",
  other: "Outros",
};

function kindFromMime(mime: string): AssetKind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf" || mime.startsWith("text/")) return "document";
  if (mime.includes("gltf") || mime.includes("obj") || mime.includes("fbx"))
    return "model3d";
  return "other";
}

function formatBytes(b: number): string {
  if (!b) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(u.length - 1, Math.floor(Math.log10(b) / 3));
  return `${(b / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}

function AssetsPage() {
  const qc = useQueryClient();
  const list = useServerFn(listAssets);
  const stats = useServerFn(assetsStats);
  const start = useServerFn(startAssetUpload);
  const complete = useServerFn(completeAssetUpload);
  const fail = useServerFn(failAssetUpload);
  const sign = useServerFn(signAssetDownload);
  const softDelete = useServerFn(softDeleteAsset);
  const restore = useServerFn(restoreAsset);

  const [kindFilter, setKindFilter] = useState<AssetKind | "all">("all");
  const [query, setQuery] = useState("");
  const [showTrash, setShowTrash] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statsQuery = useQuery({
    queryKey: ["planner", "assets", "stats"],
    queryFn: () => stats(),
    staleTime: 30_000,
  });

  const listQuery = useQuery({
    queryKey: ["planner", "assets", "list", kindFilter, query, showTrash],
    queryFn: () =>
      list({
        data: {
          kind: kindFilter === "all" ? undefined : kindFilter,
          query: query.trim() || undefined,
          includeDeleted: showTrash,
          limit: 200,
        },
      }),
    staleTime: 10_000,
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["planner", "assets"] });

  const removeMutation = useMutation({
    mutationFn: (id: string) => softDelete({ data: { id } }),
    onSuccess: () => {
      toast.success("Asset movido para a lixeira");
      invalidate();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restore({ data: { id } }),
    onSuccess: () => {
      toast.success("Restaurado");
      invalidate();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Erro"),
  });

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = getSupabaseBrowser();

    let ok = 0;
    let ko = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`(${i + 1}/${files.length}) ${file.name}`);
      try {
        const kind = kindFromMime(file.type || "application/octet-stream");
        const started = await start({
          data: {
            filename: file.name,
            mime: file.type || "application/octet-stream",
            sizeBytes: file.size,
            kind,
            visibility: "tenant",
            bucket: "assets",
          },
        });
        const up = await supabase.storage
          .from(started.bucket)
          .upload(started.objectKey, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined,
          });
        if (up.error) {
          await fail({
            data: { jobId: started.job.id, error: up.error.message },
          });
          throw new Error(up.error.message);
        }

        // If it's an image, decode dimensions client-side.
        let width: number | undefined;
        let height: number | undefined;
        if (kind === "image") {
          try {
            const dims = await readImageDimensions(file);
            width = dims.width;
            height = dims.height;
          } catch {
            /* ignore */
          }
        }

        await complete({
          data: {
            jobId: started.job.id,
            width,
            height,
          },
        });
        ok++;
      } catch (err) {
        ko++;
        toast.error(
          `Falha ao enviar ${file.name}: ${err instanceof Error ? err.message : "erro"}`,
        );
      }
    }

    setUploading(false);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (ok) toast.success(`${ok} arquivo(s) enviado(s)`);
    if (ko === 0) invalidate();
    else invalidate();
  }

  async function handleDownload(id: string) {
    try {
      const res = await sign({ data: { id, ttlSeconds: 300 } });
      window.open(res.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao assinar URL");
    }
  }

  const rows = (listQuery.data ?? []) as AssetRow[];
  const kinds = useMemo(
    () => [
      "all",
      "image",
      "video",
      "render",
      "texture",
      "hdri",
      "model3d",
      "document",
      "audio",
      "other",
    ] as const,
    [],
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Planner"
        title="Assets Manager"
        description="Biblioteca de mídia da empresa — uploads, versionamento e signed URLs. Renders, texturas, HDRIs, modelos 3D e documentos ficam aqui."
        actions={
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={uploading}
            />
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-1.5 h-4 w-4" />
              )}
              {uploading ? uploadProgress ?? "Enviando…" : "Enviar arquivos"}
            </Button>
          </div>
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total de assets"
          value={statsQuery.data?.total ?? 0}
          icon={<HardDrive className="h-4 w-4" />}
        />
        <MetricCard
          label="Espaço utilizado"
          value={formatBytes(statsQuery.data?.totalBytes ?? 0)}
          icon={<HardDrive className="h-4 w-4" />}
        />
        <MetricCard
          label="Renders · Imagens"
          value={`${statsQuery.data?.renders ?? 0} · ${statsQuery.data?.images ?? 0}`}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <MetricCard
          label="Na lixeira"
          value={statsQuery.data?.trashed ?? 0}
          icon={<Archive className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome…"
          className="min-w-[220px] flex-1 sm:flex-none sm:w-72"
        />
        <div className="flex flex-wrap items-center gap-1">
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKindFilter(k)}
              className={
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors " +
                (kindFilter === k
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground")
              }
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowTrash((v) => !v)}
          className={
            "ml-auto rounded-md px-2.5 py-1 text-xs font-medium transition-colors " +
            (showTrash
              ? "bg-destructive/15 text-destructive"
              : "text-muted-foreground hover:bg-muted hover:text-foreground")
          }
        >
          {showTrash ? "Mostrando lixeira" : "Lixeira"}
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-border/60 bg-background/40 p-3">
        {listQuery.isLoading ? (
          <div className="grid place-items-center p-10 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando assets…
            </span>
          </div>
        ) : rows.length === 0 ? (
          <div className="grid place-items-center p-10 text-sm text-muted-foreground">
            Nenhum asset {showTrash ? "na lixeira" : "encontrado"}. Clique em{" "}
            <strong className="mx-1">Enviar arquivos</strong> para começar.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((r) => (
              <AssetCard
                key={r.id}
                row={r}
                trashed={showTrash}
                onDownload={() => handleDownload(r.id)}
                onRemove={() => {
                  if (confirm("Mover este asset para a lixeira?"))
                    removeMutation.mutate(r.id);
                }}
                onRestore={() => restoreMutation.mutate(r.id)}
              />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

function AssetCard({
  row,
  trashed,
  onDownload,
  onRemove,
  onRestore,
}: {
  row: AssetRow;
  trashed: boolean;
  onDownload: () => void;
  onRemove: () => void;
  onRestore: () => void;
}) {
  const Icon = KIND_ICON[row.kind];
  return (
    <div className="group flex flex-col rounded-lg border border-border/40 bg-card/50 p-3 transition-colors hover:border-primary/40">
      <div className="mb-2 flex items-start gap-2">
        <div className="rounded-md bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium" title={row.filename}>
            {row.filename}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <StatusBadge tone="neutral">{KIND_LABEL[row.kind]}</StatusBadge>
            <span>{formatBytes(row.size_bytes ?? 0)}</span>
            {row.width && row.height ? (
              <span>· {row.width}×{row.height}</span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-border/30 pt-2 text-[11px] text-muted-foreground">
        <span>{new Date(row.created_at).toLocaleDateString("pt-BR")}</span>
        <div className="flex items-center gap-1">
          {!trashed ? (
            <>
              <Button size="sm" variant="ghost" onClick={onDownload} title="Download">
                <Download className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={onRemove} title="Mover para lixeira">
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" onClick={onRestore} title="Restaurar">
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(dims);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}