import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader, StatusBadge } from "@/core/components/ui-kit";
import { PlannerEditorProvider } from "@/modules/planner/shared";
import { VIDEO_ENGINES, VideoStudio } from "@/modules/planner/domains/video";

export const Route = createFileRoute("/_authenticated/planner/video")({
  head: () => ({
    meta: [
      { title: "Video Engine — Dioris Planner" },
      {
        name: "description",
        content:
          "Motor de vídeo Dioris — Gratuito (algoritmo próprio) e Premium (Runway/Pika/Luma/Kling/OpenAI/Gemini).",
      },
      { property: "og:title", content: "Video Engine — Dioris Planner" },
      {
        property: "og:description",
        content:
          "Timeline profissional, cenas prontas, marca, narração e exportação 4K/8K vertical/horizontal.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VideoPage,
});

function VideoPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Planner"
        title="Dioris Video Engine"
        description="Motor Gratuito (algoritmo próprio) + Motor Premium (Runway, Pika, Luma, Kling, OpenAI, Gemini)."
        actions={<StatusBadge tone="info">{VIDEO_ENGINES.length} motores</StatusBadge>}
      />
      <div className="mt-6">
        <PlannerEditorProvider>
          <VideoStudio />
        </PlannerEditorProvider>
      </div>
    </PageContainer>
  );
}
