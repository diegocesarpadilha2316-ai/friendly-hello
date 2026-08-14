import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader, StatusBadge } from "@/core/components/ui-kit";
import { PlannerEditorProvider } from "@/modules/planner/shared";
import { VisionStudio } from "@/modules/planner/domains/rooms";

export const Route = createFileRoute("/_authenticated/planner/visao")({
  head: () => ({
    meta: [
      { title: "IA Visão — Dioris Planner" },
      {
        name: "description",
        content:
          "Envie fotos do ambiente e a IA de Visão reconstrói paredes, portas, janelas e mobiliário em um projeto paramétrico Dioris.",
      },
      { property: "og:title", content: "IA Visão — Dioris Planner" },
      {
        property: "og:description",
        content: "Foto → ambiente 3D editável, sobre o mesmo motor paramétrico do Planner.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VisaoPage,
});

function VisaoPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Planner"
        title="IA Visão — foto → ambiente 3D"
        description="Faça upload de fotos, valide a estrutura detectada e reconstrua o ambiente paramétrico com um clique."
        actions={<StatusBadge tone="info">arquitetura pronta</StatusBadge>}
      />
      <div className="mt-6">
        <PlannerEditorProvider>
          <VisionStudio />
        </PlannerEditorProvider>
      </div>
    </PageContainer>
  );
}
