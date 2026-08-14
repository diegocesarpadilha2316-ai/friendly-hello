import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy, Book, MessageCircle, Mail } from "lucide-react";
import { PageContainer, PageHeader, ModuleCard } from "@/core/components/ui-kit";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

const FAQ: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: "Como convido novos membros para minha empresa?",
    a: "Acesse Workspace › Equipe e utilize o botão Convidar. O convite é enviado por e-mail e o membro entra automaticamente com o papel definido.",
  },
  {
    q: "Como funcionam os créditos?",
    a: "Créditos são consumidos por operações de IA, renderização e integrações. O saldo reseta conforme o ciclo do seu plano — consulte Workspace › Créditos.",
  },
  {
    q: "Como troco meu plano?",
    a: "Em Workspace › Assinatura selecione um plano do catálogo. Upgrades entram em vigor imediatamente; downgrades no próximo ciclo.",
  },
  {
    q: "Como emito uma API Key?",
    a: "Vá em Workspace › API Keys › Nova chave. O token completo aparece uma única vez — guarde em um cofre seguro.",
  },
  {
    q: "Onde acompanho auditoria e histórico?",
    a: "Workspace › Histórico exibe eventos auditáveis. Atividades operacionais recentes ficam em Workspace › Atividades.",
  },
];

function WorkspaceAjuda() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Workspace"
        title="Central de Ajuda"
        description="Documentação e suporte"
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ModuleCard
          icon={<Book className="h-4 w-4" />}
          name="Documentação"
          description="Guias e referência de módulos"
        />
        <ModuleCard
          icon={<MessageCircle className="h-4 w-4" />}
          name="Suporte"
          description="Fale com o time Dioris"
        />
        <ModuleCard
          icon={<Mail className="h-4 w-4" />}
          name="Contato"
          description="contato@dioris.com"
        />
        <ModuleCard
          icon={<LifeBuoy className="h-4 w-4" />}
          name="Status da plataforma"
          description="Uptime, incidentes e manutenção"
          href="/observabilidade"
        />
      </div>

      <div className="mt-8">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Perguntas frequentes
        </p>
        <h3 className="mt-1 text-lg font-semibold">FAQ</h3>
        <Accordion type="single" collapsible className="mt-4">
          {FAQ.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </PageContainer>
  );
}
