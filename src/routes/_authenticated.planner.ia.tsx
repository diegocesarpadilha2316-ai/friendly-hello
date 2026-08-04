import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader, StatusBadge } from "@/core/components/ui-kit";
import { PlannerAIPanel } from "@/modules/planner/domains/ia";
import { PlannerEditorProvider } from "@/modules/planner/shared";
import { Viewport3D } from "@/modules/planner/shared/editor-3d";

export const Route = createFileRoute("/_authenticated/planner/ia")({
  ssr: false,
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
        {/* Mobile: chat em largura total e altura em dvh (o chat rola sozinho),
            viewport 3D empilhado abaixo — sem sobreposição nem captura de toque.
            Desktop: split lado a lado com altura fixa. */}
        <div className="mt-6 flex flex-col gap-4 pb-8 lg:grid lg:h-[calc(100dvh-220px)] lg:min-h-[640px] lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:pb-0">
          <div className="relative z-10 h-[70dvh] min-h-[420px] w-full min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card/40 backdrop-blur lg:h-auto lg:min-h-0">
            <PlannerAIPanel variant="fullscreen" className="h-full w-full" />
          </div>
          <div className="relative z-0 h-[45dvh] min-h-[280px] w-full min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-black/40 lg:h-auto lg:min-h-0">
            <Viewport3D />
          </div>
        </div>
      </PageContainer>
    </PlannerEditorProvider>
  );
}