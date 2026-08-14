import { createFileRoute } from "@tanstack/react-router";
import { Plug } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  DataTable,
  EmptyState,
  StatusBadge,
} from "@/core/components/ui-kit";
import { useIntegrations, type Integration } from "@/core/configuration";

export const Route = createFileRoute("/_authenticated/workspace/integracoes")({
  head: () => ({
    meta: [
      { title: "Integrações — Workspace | Dioris Hub" },
      { name: "description", content: "Integrações contratadas pela empresa ativa." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceInteg,
});

function WorkspaceInteg() {
  const q = useIntegrations();
  const rows = (q.data ?? []) as Integration[];
  return (
    <PageContainer>
      <PageHeader eyebrow="Workspace" title="Integrações" description="Serviços conectados" />
      <div className="mt-6">
        {rows.length === 0 ? (
          <EmptyState
            icon={<Plug className="h-6 w-6" />}
            title="Nenhuma integração"
            description="Conecte serviços no Centro de Configurações."
          />
        ) : (
          <DataTable
            data={rows}
            columns={[
              { id: "provider", header: "Provider", cell: (r) => r.provider },
              { id: "category", header: "Categoria", cell: (r) => r.category },
              {
                id: "status",
                header: "Status",
                cell: (r) => (
                  <StatusBadge
                    tone={
                      r.status === "healthy"
                        ? "success"
                        : r.status === "degraded"
                          ? "warning"
                          : r.status === "down"
                            ? "danger"
                            : "neutral"
                    }
                  >
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
