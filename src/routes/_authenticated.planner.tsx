import { createFileRoute } from "@tanstack/react-router";
import { CalendarRange } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  EmptyState,
  StatusBadge,
} from "@/core/components/ui-kit";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "Planner — Dioris Hub" },
      { name: "description", content: "Planejamento, tarefas e cronogramas colaborativos da Dioris Hub." },
      { property: "og:title", content: "Planner — Dioris Hub" },
      { property: "og:description", content: "Planejamento, tarefas e cronogramas colaborativos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlannerPage,
});

function PlannerPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Módulo"
        title="Planner"
        description="Planejamento, tarefas e cronogramas colaborativos."
        actions={<StatusBadge tone="neutral">planejado</StatusBadge>}
      />
      <div className="mt-8">
        <EmptyState
          icon={<CalendarRange className="h-6 w-6" />}
          title="Módulo Planner em preparação"
          description="A funcionalidade será implementada na próxima fase. Esta é apenas a estrutura de rota."
        />
      </div>
    </PageContainer>
  );
}