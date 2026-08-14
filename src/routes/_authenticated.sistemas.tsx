import { createFileRoute } from "@tanstack/react-router";
import { Boxes } from "lucide-react";
import { PageContainer, PageHeader, EmptyState, StatusBadge } from "@/core/components/ui-kit";

export const Route = createFileRoute("/_authenticated/sistemas")({
  head: () => ({
    meta: [
      { title: "Sistemas — Dioris Hub" },
      {
        name: "description",
        content: "Sistemas internos e ferramentas customizadas da Dioris Hub.",
      },
      { property: "og:title", content: "Sistemas — Dioris Hub" },
      { property: "og:description", content: "Sistemas internos e ferramentas customizadas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SistemasPage,
});

function SistemasPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Módulo"
        title="Sistemas"
        description="Sistemas internos e ferramentas customizadas."
        actions={<StatusBadge tone="neutral">planejado</StatusBadge>}
      />
      <div className="mt-8">
        <EmptyState
          icon={<Boxes className="h-6 w-6" />}
          title="Módulo Sistemas em preparação"
          description="A funcionalidade será implementada na próxima fase."
        />
      </div>
    </PageContainer>
  );
}
