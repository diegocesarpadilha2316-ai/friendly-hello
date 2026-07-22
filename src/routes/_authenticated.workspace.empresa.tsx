import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  EmptyState,
  StatusBadge,
  MetricCard,
  FormSection,
} from "@/core/components/ui-kit";
import { useTenant } from "@/core/hooks";

export const Route = createFileRoute("/_authenticated/workspace/empresa")({
  head: () => ({
    meta: [
      { title: "Minha Empresa — Workspace | Dioris Hub" },
      { name: "description", content: "Informações da empresa ativa: identidade, plano, status e domínio." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceEmpresa,
});

function WorkspaceEmpresa() {
  const { activeCompany } = useTenant();
  if (!activeCompany) {
    return (
      <PageContainer>
        <EmptyState icon={<Building2 className="h-6 w-6" />} title="Selecione uma empresa" />
      </PageContainer>
    );
  }
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Workspace"
        title={activeCompany.name}
        description="Dados da empresa ativa"
        actions={
          <StatusBadge tone={activeCompany.status === "active" ? "success" : "warning"}>
            {activeCompany.status}
          </StatusBadge>
        }
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Plano" value={activeCompany.plan ?? "—"} />
        <MetricCard label="CNPJ" value={activeCompany.cnpj ?? "—"} />
        <MetricCard label="Status" value={activeCompany.status} />
        <MetricCard label="Domínio" value={activeCompany.custom_domain ?? "—"} />
      </div>
      <div className="mt-8">
        <FormSection
          title="Configuração da empresa"
          description="Ajustes avançados estão em Configurações → Empresa."
        >
          <p className="text-sm text-muted-foreground">
            Utilize o Centro de Configurações para editar dados sensíveis.
          </p>
        </FormSection>
      </div>
    </PageContainer>
  );
}