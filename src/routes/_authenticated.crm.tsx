import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { PageContainer, PageHeader, EmptyState, StatusBadge } from "@/core/components/ui-kit";

export const Route = createFileRoute("/_authenticated/crm")({
  head: () => ({
    meta: [
      { title: "CRM — Dioris Hub" },
      {
        name: "description",
        content: "Relacionamento com clientes, leads e pipeline na Dioris Hub.",
      },
      { property: "og:title", content: "CRM — Dioris Hub" },
      { property: "og:description", content: "Relacionamento com clientes, leads e pipeline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CrmPage,
});

function CrmPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Módulo"
        title="CRM"
        description="Relacionamento com clientes, leads e pipeline."
        actions={<StatusBadge tone="neutral">planejado</StatusBadge>}
      />
      <div className="mt-8">
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Módulo CRM em preparação"
          description="A funcionalidade será implementada na próxima fase."
        />
      </div>
    </PageContainer>
  );
}
