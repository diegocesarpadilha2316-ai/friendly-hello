import { createFileRoute } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  DataTable,
  EmptyState,
  StatusBadge,
} from "@/core/components/ui-kit";
import { useApiKeys, type ApiKey } from "@/core/configuration";

export const Route = createFileRoute("/_authenticated/workspace/api-keys")({
  head: () => ({
    meta: [
      { title: "API Keys — Workspace | Dioris Hub" },
      { name: "description", content: "Chaves de API emitidas para a empresa ativa." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceKeys,
});

function WorkspaceKeys() {
  const q = useApiKeys();
  const rows = (q.data ?? []) as ApiKey[];
  return (
    <PageContainer>
      <PageHeader eyebrow="Workspace" title="API Keys" description="Chaves emitidas para a empresa" />
      <div className="mt-6">
        {rows.length === 0 ? (
          <EmptyState icon={<KeyRound className="h-6 w-6" />} title="Nenhuma chave" description="Emita chaves no Centro de Configurações." />
        ) : (
          <DataTable
            data={rows}
            columns={[
              { id: "name", header: "Nome", cell: (r) => r.name },
              { id: "prefix", header: "Prefixo", cell: (r) => r.prefix },
              {
                id: "status",
                header: "Status",
                cell: (r) => (
                  <StatusBadge tone={r.status === "healthy" ? "success" : r.status === "degraded" ? "warning" : "neutral"}>
                    {r.status}
                  </StatusBadge>
                ),
              },
            ]}
          />
        )}
      </div>
    </PageContainer>
  );
}