import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader, StatusBadge } from "@/core/components/ui-kit";
import { PlannerEditorProvider } from "@/modules/planner/shared";
import { ProductionStudio } from "@/modules/planner/domains/production";

export const Route = createFileRoute("/_authenticated/planner/producao")({
  head: () => ({
    meta: [
      { title: "Produção Inteligente — Dioris Planner" },
      {
        name: "description",
        content:
          "Transforme projetos em produção: peças, lista e plano de corte, ferragens, orçamento, tempo, etiquetas e CNC.",
      },
      { property: "og:title", content: "Dioris Produção Inteligente" },
      {
        property: "og:description",
        content: "Studio de fábrica: corte, ferragens, orçamento, CNC e ERP a partir do projeto paramétrico.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProductionPage,
});

function ProductionPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Planner"
        title="Dioris Produção Inteligente"
        description="Do projeto paramétrico à fábrica — peças, corte, ferragens, orçamento, tempo, etiquetas, CNC e ERP."
        actions={<StatusBadge tone="info">Studio · Enterprise</StatusBadge>}
      />
      <div className="mt-6">
        <PlannerEditorProvider>
          <ProductionStudio />
        </PlannerEditorProvider>
      </div>
    </PageContainer>
  );
}