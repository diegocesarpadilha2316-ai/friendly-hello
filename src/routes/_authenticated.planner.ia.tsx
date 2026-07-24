import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader, StatusBadge } from "@/core/components/ui-kit";
import { PlannerAIPanel } from "@/modules/planner/domains/ia";

export const Route = createFileRoute("/_authenticated/planner/ia")({
  head: () => ({
    meta: [
      { title: "IA de Projeto — Dioris Planner" },
      {
        name: "description",
        content:
          "Estúdio conversacional do Planner — crie ambientes inteiros, edite móveis e gere orçamento apenas conversando.",
      },
      { property: "og:title", content: "IA de Projeto — Dioris Planner" },
      {
        property: "og:description",
        content: "A IA que interpreta briefings e projeta em tempo real, sobre o mesmo motor paramétrico.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PageContainer>
      <PageHeader
        eyebrow="Planner"
        title="IA de Projeto"
        description="Converse com a Dioris IA — ela edita o mesmo projeto paramétrico com Undo/Redo, Autosave e Histórico."
        actions={<StatusBadge tone="success">ativa</StatusBadge>}
      />
      <div className="mt-6 h-[calc(100vh-240px)] min-h-[600px]">
        <PlannerAIPanel variant="fullscreen" className="mx-auto w-full max-w-3xl" />
      </div>
    </PageContainer>
  ),
});