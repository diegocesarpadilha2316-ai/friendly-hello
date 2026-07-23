import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader, StatusBadge } from "@/core/components/ui-kit";
import {
  CompanyRulesEditor,
  CutListPreview,
  Inspector,
  MATERIAL_BRANDS,
  HARDWARE_ITEMS,
  PlannerEditorProvider,
} from "@/modules/planner/shared";

export const Route = createFileRoute("/_authenticated/planner/engenharia")({
  head: () => ({
    meta: [
      { title: "Engenharia de Marcenaria — Dioris Planner" },
      {
        name: "description",
        content:
          "Padrões de fabricação, materiais, ferragens e lista de corte paramétrica da Dioris.",
      },
      { property: "og:title", content: "Engenharia de Marcenaria — Dioris Planner" },
      {
        property: "og:description",
        content: "Do móvel paramétrico ao plano de corte — o mesmo objeto do 2D, 3D e IA.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EngenhariaPage,
});

function EngenhariaPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Planner"
        title="Engenharia de Marcenaria"
        description="Padrões da empresa, chapa, ferragens e decomposição paramétrica compartilhada por 2D, 3D, IA, Render, Orçamento e Produção."
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge tone="info">{MATERIAL_BRANDS.length} marcas</StatusBadge>
            <StatusBadge tone="success">{HARDWARE_ITEMS.length} ferragens</StatusBadge>
          </div>
        }
      />
      <PlannerEditorProvider>
        <div className="mt-6 space-y-8">
          <section className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Padrão de fabricação da empresa
            </h2>
            <CompanyRulesEditor />
          </section>
          <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <div className="min-h-[560px]">
              <Inspector />
            </div>
            <div>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Lista de corte — cômodo ativo
              </h2>
              <CutListPreview />
            </div>
          </section>
        </div>
      </PlannerEditorProvider>
    </PageContainer>
  );
}