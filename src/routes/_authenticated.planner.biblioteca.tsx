import { createFileRoute } from "@tanstack/react-router";
import { Boxes } from "lucide-react";
import { PageContainer, PageHeader, EmptyState, StatusBadge } from "@/core/components/ui-kit";

export const Route = createFileRoute("/_authenticated/planner/biblioteca")({
  component: () => (
    <PageContainer>
      <PageHeader
        eyebrow="Planner"
        title="Biblioteca"
        description="Catálogo compartilhado de módulos, materiais e ferragens."
        actions={<StatusBadge tone="neutral">preparado</StatusBadge>}
      />
      <div className="mt-8">
        <EmptyState
          icon={<Boxes className="h-6 w-6" />}
          title="Estrutura preparada"
          description="A biblioteca é gerenciada pelos domínios do Planner (catalog, materials, hardware, library). A UI será plugada nas próximas fases sem tocar no Core."
        />
      </div>
    </PageContainer>
  ),
});
