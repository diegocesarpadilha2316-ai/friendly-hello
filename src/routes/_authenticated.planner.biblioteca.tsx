import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader, StatusBadge } from "@/core/components/ui-kit";
import {
  CATALOG_ITEMS,
  LibraryPanel,
  PlannerEditorProvider,
} from "@/modules/planner/shared";

export const Route = createFileRoute("/_authenticated/planner/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca Inteligente — Dioris Planner" },
      {
        name: "description",
        content:
          "Catálogo paramétrico de módulos, tampos, portas, ferragens, acabamentos e iluminação da Dioris.",
      },
      { property: "og:title", content: "Biblioteca Inteligente — Dioris Planner" },
      {
        property: "og:description",
        content: "Peças paramétricas prontas para 2D, 3D, IA e Produção.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BibliotecaPage,
});

function BibliotecaPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Planner"
        title="Biblioteca Inteligente"
        description="Catálogo paramétrico compartilhado por 2D, 3D, IA, Produção, Render e Lista de Corte."
        actions={
          <StatusBadge tone="success">{CATALOG_ITEMS.length} peças ativas</StatusBadge>
        }
      />
      <div className="mt-6 h-[calc(100vh-260px)] min-h-[560px]">
        {/*
         * Envolvemos com o mesmo provider do editor para permitir que a
         * biblioteca insira diretamente no cômodo ativo — sem duplicar estado.
         */}
        <PlannerEditorProvider>
          <LibraryPanel variant="full" />
        </PlannerEditorProvider>
      </div>
    </PageContainer>
  );
}
