import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy, Book, MessageCircle, Mail } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  ModuleCard,
} from "@/core/components/ui-kit";

export const Route = createFileRoute("/_authenticated/workspace/ajuda")({
  head: () => ({
    meta: [
      { title: "Central de Ajuda — Workspace | Dioris Hub" },
      { name: "description", content: "Documentação, suporte e canais de contato Dioris." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceAjuda,
});

function WorkspaceAjuda() {
  return (
    <PageContainer>
      <PageHeader eyebrow="Workspace" title="Central de Ajuda" description="Documentação e suporte" />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ModuleCard icon={<Book className="h-4 w-4" />} name="Documentação" description="Guias e referência de módulos" />
        <ModuleCard icon={<MessageCircle className="h-4 w-4" />} name="Suporte" description="Fale com o time Dioris" />
        <ModuleCard icon={<Mail className="h-4 w-4" />} name="Contato" description="contato@dioris.com" />
        <ModuleCard icon={<LifeBuoy className="h-4 w-4" />} name="Status da plataforma" description="Uptime, incidentes e manutenção" href="/observabilidade" />
      </div>
    </PageContainer>
  );
}