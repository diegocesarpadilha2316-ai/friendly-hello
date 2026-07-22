import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  EmptyState,
  StatusBadge,
} from "@/core/components/ui-kit";

export const Route = createFileRoute("/ia")({
  head: () => ({
    meta: [
      { title: "IA — Dioris Hub" },
      { name: "description", content: "Recursos de inteligência artificial da Dioris Hub." },
      { property: "og:title", content: "IA — Dioris Hub" },
      { property: "og:description", content: "Recursos de inteligência artificial da plataforma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IaPage,
});

function IaPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Módulo"
        title="IA"
        description="Recursos de inteligência artificial da plataforma."
        actions={<StatusBadge tone="neutral">planejado</StatusBadge>}
      />
      <div className="mt-8">
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title="Módulo IA em preparação"
          description="A funcionalidade será implementada na próxima fase."
        />
      </div>
    </PageContainer>
  );
}