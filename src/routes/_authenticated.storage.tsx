import { createFileRoute } from "@tanstack/react-router";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  DataTable,
  StatusBadge,
  EmptyState,
  type DataTableColumn,
} from "@/core/components/ui-kit";
import {
  useAssetsList,
  useAssetsStats,
  useAssetsJobs,
  useAssetsAudit,
  type Asset,
  type UploadJob,
  type AssetAuditEntry,
  type UploadStatus,
} from "@/core/assets";

export const Route = createFileRoute("/_authenticated/storage")({
  head: () => ({
    meta: [
      { title: "Storage & Assets — Dioris Hub" },
      {
        name: "description",
        content:
          "Centro Enterprise de Storage e Assets da Dioris Hub — uploads, quotas, versionamento e auditoria por tenant.",
      },
      { property: "og:title", content: "Storage & Assets — Dioris Hub" },
      {
        property: "og:description",
        content: "Gestão centralizada de assets, uploads e quotas por tenant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StoragePage,
});

const JOB_TONE: Record<UploadStatus, "success" | "warning" | "danger" | "neutral" | "info"> = {
  ready: "success",
  processing: "info",
  uploading: "info",
  pending: "warning",
  failed: "danger",
  canceled: "neutral",
};

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function StoragePage() {
  const stats = useAssetsStats();
  const assets = useAssetsList();
  const jobs = useAssetsJobs();
  const audit = useAssetsAudit();

  const assetCols: DataTableColumn<Asset>[] = [
    { id: "filename", header: "Arquivo", cell: (r) => r.filename },
    { id: "kind", header: "Tipo", cell: (r) => r.kind },
    { id: "mime", header: "MIME", cell: (r) => r.mime },
    { id: "size", header: "Tamanho", cell: (r) => formatBytes(r.sizeBytes) },
    { id: "provider", header: "Provider", cell: (r) => r.provider },
    {
      id: "visibility",
      header: "Visibilidade",
      cell: (r) => <StatusBadge tone="neutral">{r.visibility}</StatusBadge>,
    },
    {
      id: "createdAt",
      header: "Criado",
      cell: (r) => new Date(r.createdAt).toLocaleString("pt-BR"),
    },
  ];

  const jobCols: DataTableColumn<UploadJob>[] = [
    { id: "filename", header: "Arquivo", cell: (r) => r.filename },
    {
      id: "status",
      header: "Status",
      cell: (r) => <StatusBadge tone={JOB_TONE[r.status]}>{r.status}</StatusBadge>,
    },
    { id: "size", header: "Tamanho", cell: (r) => formatBytes(r.sizeBytes) },
    { id: "provider", header: "Provider", cell: (r) => r.provider },
    {
      id: "createdAt",
      header: "Criado",
      cell: (r) => new Date(r.createdAt).toLocaleString("pt-BR"),
    },
  ];

  const auditCols: DataTableColumn<AssetAuditEntry>[] = [
    {
      id: "createdAt",
      header: "Quando",
      cell: (r) => new Date(r.createdAt).toLocaleString("pt-BR"),
    },
    { id: "action", header: "Ação", cell: (r) => r.action },
    { id: "assetId", header: "Asset", cell: (r) => r.assetId ?? "—" },
    { id: "actorId", header: "Ator", cell: (r) => r.actorId ?? "sistema" },
  ];

  const s = stats.data;
  const quotaLabel = s?.quotaBytes == null ? "ilimitada" : formatBytes(s.quotaBytes);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Core"
        title="Storage & Assets"
        description="Fundação enterprise de arquivos: multi-provider, quotas por plano, versionamento, thumbnails e auditoria."
        actions={<StatusBadge tone="success">operacional</StatusBadge>}
      />

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard label="Assets ativos" value={s?.assetCount ?? 0} />
        <MetricCard label="Espaço usado" value={formatBytes(s?.usedBytes ?? 0)} />
        <MetricCard label="Quota do plano" value={quotaLabel} />
        <MetricCard label="Uploads em andamento" value={jobs.data?.filter((j) => j.status !== "ready" && j.status !== "failed").length ?? 0} />
      </div>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">Assets recentes</h2>
        {assets.data && assets.data.length > 0 ? (
          <DataTable data={assets.data as Asset[]} columns={assetCols} getRowKey={(r) => r.id} />
        ) : (
          <EmptyState
            title="Nenhum asset ainda"
            description="Os uploads deste tenant aparecerão aqui assim que o primeiro arquivo for enviado."
          />
        )}
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">Uploads</h2>
        <DataTable
          data={(jobs.data ?? []) as UploadJob[]}
          columns={jobCols}
          getRowKey={(r) => r.id}
          empty="Nenhum upload registrado."
        />
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">Auditoria</h2>
        <DataTable
          data={(audit.data ?? []) as AssetAuditEntry[]}
          columns={auditCols}
          getRowKey={(r) => r.id}
          empty="Sem eventos de auditoria."
        />
      </section>
    </PageContainer>
  );
}
