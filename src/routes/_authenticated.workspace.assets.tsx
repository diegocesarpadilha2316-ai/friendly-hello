import { createFileRoute } from "@tanstack/react-router";
import { HardDrive } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  EmptyState,
  DataTable,
} from "@/core/components/ui-kit";
import { useAssetsList, useAssetsStats } from "@/core/assets/use-assets";
import type { Asset } from "@/core/assets/types";

export const Route = createFileRoute("/_authenticated/workspace/assets")({
  head: () => ({
    meta: [
      { title: "Assets — Workspace | Dioris Hub" },
      { name: "description", content: "Arquivos, uploads e espaço utilizado pela empresa." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceAssets,
});

function WorkspaceAssets() {
  const stats = useAssetsStats();
  const list = useAssetsList(null);
  const files = (list.data ?? []) as Asset[];
  return (
    <PageContainer>
      <PageHeader eyebrow="Workspace" title="Assets" description="Storage da empresa" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={<HardDrive className="h-4 w-4" />}
          label="Espaço usado"
          value={
            stats.data ? `${((stats.data.usedBytes ?? 0) / (1024 * 1024)).toFixed(1)} MB` : "—"
          }
          hint={
            stats.data?.quotaBytes
              ? `Cota: ${(stats.data.quotaBytes / (1024 * 1024)).toFixed(0)} MB`
              : undefined
          }
        />
        <MetricCard label="Arquivos" value={String(stats.data?.assetCount ?? 0)} />
        <MetricCard label="Listados" value={String(files.length)} />
      </div>
      <div className="mt-6">
        {files.length === 0 ? (
          <EmptyState icon={<HardDrive className="h-6 w-6" />} title="Nenhum arquivo" />
        ) : (
          <DataTable
            data={files}
            columns={[
              { id: "filename", header: "Nome", cell: (r) => r.filename },
              { id: "kind", header: "Tipo", cell: (r) => r.kind },
              {
                id: "size",
                header: "Tamanho",
                cell: (r) => `${(r.sizeBytes / 1024).toFixed(1)} KB`,
              },
            ]}
          />
        )}
      </div>
    </PageContainer>
  );
}
