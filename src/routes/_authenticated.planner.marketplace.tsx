import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader, StatusBadge } from "@/core/components/ui-kit";
import { PlannerEditorProvider } from "@/modules/planner/shared";
import { MarketplaceStudio, MARKETPLACE_ITEMS } from "@/modules/planner/domains/marketplace";

export const Route = createFileRoute("/_authenticated/planner/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace de Componentes — Dioris Planner" },
      {
        name: "description",
        content:
          "Marketplace oficial da Dioris — bibliotecas paramétricas de fabricantes, coleções, atualizações e curadoria.",
      },
      { property: "og:title", content: "Marketplace Dioris — Planner" },
      {
        property: "og:description",
        content:
          "Instale, atualize e insira componentes paramétricos reais dentro do Planner, direto do Marketplace Dioris.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MarketplaceRoute,
});

function MarketplaceRoute() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Planner"
        title="Marketplace de Componentes"
        description="Bibliotecas oficiais dos fabricantes, coleções e ambientes prontos — instaláveis com um clique."
        actions={<StatusBadge tone="info">{MARKETPLACE_ITEMS.length} itens publicados</StatusBadge>}
      />
      <div className="mt-6">
        <PlannerEditorProvider>
          <MarketplaceStudio />
        </PlannerEditorProvider>
      </div>
    </PageContainer>
  );
}
