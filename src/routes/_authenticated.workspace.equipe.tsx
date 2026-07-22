import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  DataTable,
  EmptyState,
  StatusBadge,
} from "@/core/components/ui-kit";
import { useTenant } from "@/core/hooks";
import { listCompanyMembers } from "@/core/services/tenant.functions";
import type { CompanyMember } from "@/core/types/tenant";

export const Route = createFileRoute("/_authenticated/workspace/equipe")({
  head: () => ({
    meta: [
      { title: "Equipe — Workspace | Dioris Hub" },
      { name: "description", content: "Membros, papéis e convites da empresa ativa." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceEquipe,
});

function WorkspaceEquipe() {
  const { activeCompany } = useTenant();
  const q = useQuery({
    queryKey: ["tenant:members", activeCompany?.id],
    queryFn: () => listCompanyMembers(),
    enabled: !!activeCompany,
  });
  if (!activeCompany) {
    return (
      <PageContainer>
        <EmptyState icon={<Users className="h-6 w-6" />} title="Selecione uma empresa" />
      </PageContainer>
    );
  }
  const rows = (q.data ?? []) as CompanyMember[];
  return (
    <PageContainer>
      <PageHeader eyebrow="Workspace" title="Equipe" description="Membros do tenant ativo" />
      <div className="mt-6">
        <DataTable
          data={rows}
          empty={<EmptyState icon={<Users className="h-6 w-6" />} title="Nenhum membro" />}
          columns={[
            { id: "email", header: "E-mail", cell: (r) => r.email ?? r.user_id },
            { id: "role", header: "Papel", cell: (r) => r.role },
            {
              id: "status",
              header: "Status",
              cell: (r) => (
                <StatusBadge tone={r.active ? "success" : "neutral"}>
                  {r.active ? "ativo" : "inativo"}
                </StatusBadge>
              ),
            },
          ]}
        />
      </div>
    </PageContainer>
  );
}