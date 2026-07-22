import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  EmptyState,
  StatusBadge,
} from "@/core/components/ui-kit";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — Dioris Hub" },
      { name: "description", content: "Faturamento, contas e conciliação na Dioris Hub." },
      { property: "og:title", content: "Financeiro — Dioris Hub" },
      { property: "og:description", content: "Faturamento, contas e conciliação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Módulo"
        title="Financeiro"
        description="Faturamento, contas e conciliação."
        actions={<StatusBadge tone="neutral">planejado</StatusBadge>}
      />
      <div className="mt-8">
        <EmptyState
          icon={<Wallet className="h-6 w-6" />}
          title="Módulo Financeiro em preparação"
          description="A funcionalidade será implementada na próxima fase."
        />
      </div>
    </PageContainer>
  );
}