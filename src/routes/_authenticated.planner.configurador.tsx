import { createFileRoute } from "@tanstack/react-router";
import { PlannerEditorProvider } from "@/modules/planner/shared";
import { ConfiguratorPanel } from "@/modules/planner/domains/configurator";
import { PageContainer, PageHeader } from "@/core/components/ui-kit";

export const Route = createFileRoute("/_authenticated/planner/configurador")({
  head: () => ({
    meta: [
      { title: "Configurador Paramétrico — Dioris Planner" },
      { name: "description", content: "Configure módulos parametricamente: medidas, portas, gavetas, ferragens, iluminação e materiais, com IA e Walk/FPS integrados." },
      { property: "og:title", content: "Configurador Paramétrico Dioris" },
      { property: "og:description", content: "IA de Projeto + Edição Total do Planner Dioris." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfiguratorRoute,
});

function ConfiguratorRoute() {
  return (
    <PlannerEditorProvider>
      <PageContainer>
        <PageHeader
          eyebrow="Fase 3.16"
          title="Configurador Paramétrico"
          description="Edite qualquer módulo por seleção, chat IA, painel ou walk mode — tudo sincronizado em tempo real com Editor 2D/3D, Render, Vídeo, Produção e Fábrica."
        />
        <ConfiguratorPanel />
      </PageContainer>
    </PlannerEditorProvider>
  );
}