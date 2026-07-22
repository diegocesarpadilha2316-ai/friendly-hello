import { createFileRoute } from "@tanstack/react-router";
import { Workflow } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  EmptyState,
  StatusBadge,
} from "@/core/components/ui-kit";

export const Route = createFileRoute("/automacao")({
  head: () => ({
    meta: [
      { title: "Automação — Dioris Hub" },
      { name: "description", content: "Fluxos, gatilhos e orquestração de processos na Dioris Hub." },
      { property: "og:title", content: "Automação — Dioris Hub" },
      { property: "og:description", content: "Fluxos, gatilhos e orquestração de processos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AutomacaoPage,
});

function AutomacaoPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Módulo"
        title="Automação"
        description="Fluxos, gatilhos e orquestração de processos."
        actions={<StatusBadge tone="neutral">planejado</StatusBadge>}
      />
      <div className="mt-8">
        <EmptyState
          icon={<Workflow className="h-6 w-6" />}
          title="Módulo Automação em preparação"
          description="A funcionalidade será implementada na próxima fase."
        />
      </div>
    </PageContainer>
  );
}