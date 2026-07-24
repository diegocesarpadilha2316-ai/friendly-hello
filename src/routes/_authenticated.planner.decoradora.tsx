import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader, StatusBadge } from "@/core/components/ui-kit";
import { PlannerEditorProvider } from "@/modules/planner/shared";
import { DECOR_STYLES, DecoratorStudio } from "@/modules/planner/domains/rooms";

export const Route = createFileRoute("/_authenticated/planner/decoradora")({
  head: () => ({
    meta: [
      { title: "IA Decoradora — Dioris Planner" },
      {
        name: "description",
        content:
          "Selecione um estilo e a IA Decoradora sugere móveis, iluminação, materiais e paleta — aceite ou rejeite cada item.",
      },
      { property: "og:title", content: "IA Decoradora — Dioris Planner" },
      {
        property: "og:description",
        content: "Transforme qualquer ambiente em uma apresentação elegante e realista.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DecoradoraPage,
});

function DecoradoraPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Planner"
        title="IA Decoradora"
        description="Estilos, sugestões inteligentes e antes × depois — o toque final do seu projeto."
        actions={<StatusBadge tone="info">{DECOR_STYLES.length} estilos</StatusBadge>}
      />
      <div className="mt-6">
        <PlannerEditorProvider>
          <DecoratorStudio />
        </PlannerEditorProvider>
      </div>
    </PageContainer>
  );
}