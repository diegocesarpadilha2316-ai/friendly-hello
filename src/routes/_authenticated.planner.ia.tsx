import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { PageContainer, PageHeader, EmptyState, StatusBadge } from "@/core/components/ui-kit";

export const Route = createFileRoute("/_authenticated/planner/ia")({
  component: () => (
    <PageContainer>
      <PageHeader
        eyebrow="Planner"
        title="IA de Projeto"
        description="Copiloto paramétrico ligado ao Gateway Central de IA do Core."
        actions={<StatusBadge tone="neutral">preparado</StatusBadge>}
      />
      <div className="mt-8">
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title="Aguardando integração com o AI Gateway"
          description="A interface do copiloto consumirá exclusivamente src/core/ai — sem novos providers/managers."
        />
      </div>
    </PageContainer>
  ),
});