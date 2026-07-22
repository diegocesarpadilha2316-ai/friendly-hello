import { createFileRoute } from "@tanstack/react-router";
import { LayoutTemplate } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  EmptyState,
  StatusBadge,
} from "@/core/components/ui-kit";

export const Route = createFileRoute("/_authenticated/sites")({
  head: () => ({
    meta: [
      { title: "Sites — Dioris Hub" },
      { name: "description", content: "Criação e gestão de sites da operação na Dioris Hub." },
      { property: "og:title", content: "Sites — Dioris Hub" },
      { property: "og:description", content: "Criação e gestão de sites da operação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SitesPage,
});

function SitesPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Módulo"
        title="Sites"
        description="Criação e gestão de sites da operação."
        actions={<StatusBadge tone="neutral">planejado</StatusBadge>}
      />
      <div className="mt-8">
        <EmptyState
          icon={<LayoutTemplate className="h-6 w-6" />}
          title="Módulo Sites em preparação"
          description="A funcionalidade será implementada na próxima fase."
        />
      </div>
    </PageContainer>
  );
}