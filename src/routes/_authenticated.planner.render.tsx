import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader, StatusBadge } from "@/core/components/ui-kit";
import { PlannerEditorProvider } from "@/modules/planner/shared";
import { RENDER_PRESETS, RenderStudio } from "@/modules/planner/domains/render";

export const Route = createFileRoute("/_authenticated/planner/render")({
  head: () => ({
    meta: [
      { title: "Render Engine — Dioris Planner" },
      {
        name: "description",
        content:
          "Motor de renderização Dioris — presets, iluminação, câmeras, materiais PBR, pós-processamento e fila de jobs.",
      },
      { property: "og:title", content: "Render Engine — Dioris Planner" },
      {
        property: "og:description",
        content: "Painel foto-realista pronto para Render Local, IA, Nuvem, Vídeo e Marketing.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RenderPage,
});

function RenderPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Planner"
        title="Dioris Render Engine"
        description="Prepare qualquer render — do rascunho ao fotográfico — com um único motor de jobs."
        actions={<StatusBadge tone="info">{RENDER_PRESETS.length} presets</StatusBadge>}
      />
      <div className="mt-6">
        <PlannerEditorProvider>
          <RenderStudio />
        </PlannerEditorProvider>
      </div>
    </PageContainer>
  );
}