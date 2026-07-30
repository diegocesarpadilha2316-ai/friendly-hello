/**
 * Etapa 12 — Orçamento Profissional do projeto ativo.
 *
 * Camada 100% aditiva: reutiliza o `PlannerEditorProvider` e o motor de
 * produção existentes; nada é persistido em banco (localStorage por
 * tenant/projeto).
 */
import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader, StatusBadge } from "@/core/components/ui-kit";
import { PlannerEditorProvider } from "@/modules/planner/shared";
import { BudgetStudio } from "@/modules/planner/domains/budget";

export const Route = createFileRoute("/_authenticated/planner/orcamento-projeto")({
  head: () => ({
    meta: [
      { title: "Orçamento do projeto — Dioris Planner" },
      {
        name: "description",
        content:
          "Orçamento profissional e auditável do projeto ativo: quantidades, perdas, custos, mão de obra, margem e impostos.",
      },
      { property: "og:title", content: "Orçamento do projeto — Dioris Planner" },
      {
        property: "og:description",
        content:
          "Quantidades, custos conhecidos e estimados, mão de obra, margem e proposta comercial em uma única tela.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrcamentoProjetoPage,
});

function OrcamentoProjetoPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Planner"
        title="Orçamento do projeto"
        description="Custos reais derivados da produção — separando quantidade, perda, custo, mão de obra, margem e impostos."
        actions={<StatusBadge tone="info">auditável</StatusBadge>}
      />
      <div className="mt-6 min-h-[70vh] rounded-2xl border bg-card/40">
        <PlannerEditorProvider>
          <BudgetStudio />
        </PlannerEditorProvider>
      </div>
    </PageContainer>
  );
}