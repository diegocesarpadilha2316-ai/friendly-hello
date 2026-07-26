import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader, StatusBadge } from "@/core/components/ui-kit";
import { PlannerAIPanel } from "@/modules/planner/domains/ia";
import { PlannerEditorProvider } from "@/modules/planner/shared";
import { Viewport3D } from "@/modules/planner/shared/editor-3d";

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
  component: PlannerAIRoute,
});

function PlannerAIRoute() {
  return (
    <PlannerEditorProvider>
      <PageContainer>
        <PageHeader
          eyebrow="Planner"
          title="IA de Projeto"
          description="Converse com a Dioris IA — o viewport ao lado é o mesmo modelo paramétrico, com Undo/Redo, Autosave e Histórico."
          actions={<StatusBadge tone="success">ativa</StatusBadge>}
        />
        {/* Split cinematográfico: chat à esquerda, viewport 3D fotorrealista à direita.
            Em mobile empilha (chat em cima, viewport embaixo) para o usuário sempre
            enxergar o resultado da conversa sem trocar de tela. */}
        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] h-[calc(100vh-220px)] min-h-[640px]">
          <div className="min-h-[420px] lg:min-h-0 overflow-hidden rounded-2xl border border-border/60 bg-card/40 backdrop-blur">
            <PlannerAIPanel variant="fullscreen" className="h-full w-full" />
          </div>
          <div className="min-h-[420px] lg:min-h-0 overflow-hidden rounded-2xl border border-border/60 bg-black/40">
            <Viewport3D />
          </div>
        </div>
      </PageContainer>
    </PlannerEditorProvider>
  );
}