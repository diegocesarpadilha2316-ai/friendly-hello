import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  DataTable,
  StatusBadge,
  EmptyState,
  Can,
} from "@/core/components/ui-kit";
import { useTenant } from "@/core/hooks";
import { listCompanyMembers } from "@/core/services/tenant.functions";
import type { CompanyMember } from "@/core/types/tenant";

export const Route = createFileRoute("/_authenticated/configuracoes/empresa")({
  head: () => ({
    meta: [
      { title: "Empresa — Dioris Hub" },
      { name: "description", content: "Gestão da empresa ativa: membros, plano, domínio." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EmpresaSettings,
});

function EmpresaSettings() {
  const { activeCompany, role } = useTenant();
  const query = useQuery({
    queryKey: ["tenant:members", activeCompany?.id],
    queryFn: () => listCompanyMembers(),
    enabled: !!activeCompany,
  });

  if (!activeCompany) {
    return (
      <PageContainer>
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title="Selecione uma empresa"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Configurações"
        title={activeCompany.name}
        description={`Plano ${activeCompany.plan} · seu papel: ${role}`}
        actions={<StatusBadge tone={activeCompany.status === "active" ? "success" : "warning"}>{activeCompany.status}</StatusBadge>}
      />
      <div className="mt-8 space-y-6">
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Membros</h2>
          <DataTable
            data={(query.data ?? []) as CompanyMember[]}
            empty="Nenhum membro."
            columns={[
              { id: "user_id", header: "Usuário", cell: (m) => <span className="font-mono text-xs">{m.user_id.slice(0, 8)}…</span> },
              { id: "role", header: "Papel", cell: (m) => <StatusBadge tone="info">{m.role}</StatusBadge> },
              {
                id: "active",
                header: "Status",
                cell: (m) => (
                  <StatusBadge tone={m.active ? "success" : "neutral"}>
                    {m.active ? "ativo" : "inativo"}
                  </StatusBadge>
                ),
              },
              { id: "joined_at", header: "Entrou em", cell: (m) => new Date(m.joined_at).toLocaleDateString("pt-BR") },
            ]}
          />
        </div>
        <Can permission="members:invite">
          <p className="text-xs text-muted-foreground">
            Convites por e-mail serão habilitados na Fase 1.5 (Usuários e Equipes).
          </p>
        </Can>
      </div>
    </PageContainer>
  );
}