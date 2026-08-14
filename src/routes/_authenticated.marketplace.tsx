import { createFileRoute } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { PageContainer, PageHeader, EmptyState, StatusBadge } from "@/core/components/ui-kit";

export const Route = createFileRoute("/_authenticated/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — Dioris Hub" },
      { name: "description", content: "Catálogo e vendas em canais externos na Dioris Hub." },
      { property: "og:title", content: "Marketplace — Dioris Hub" },
      { property: "og:description", content: "Catálogo e vendas em canais externos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarketplacePage,
});

function MarketplacePage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Módulo"
        title="Marketplace"
        description="Catálogo e vendas em canais externos."
        actions={<StatusBadge tone="neutral">planejado</StatusBadge>}
      />
      <div className="mt-8">
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Módulo Marketplace em preparação"
          description="A funcionalidade será implementada na próxima fase."
        />
      </div>
    </PageContainer>
  );
}
