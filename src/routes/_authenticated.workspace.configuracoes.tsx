import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  ModuleCard,
} from "@/core/components/ui-kit";

export const Route = createFileRoute("/_authenticated/workspace/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Workspace | Dioris Hub" },
      { name: "description", content: "Preferências, tema, idioma e região da empresa." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceConfig,
});

function WorkspaceConfig() {
  return (
    <PageContainer>
      <PageHeader eyebrow="Workspace" title="Configurações" description="Preferências do usuário e da empresa" />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ModuleCard icon={<Settings className="h-4 w-4" />} name="Empresa" description="Identidade, plano e domínio" href="/configuracoes/empresa" />
        <ModuleCard name="Plataforma" description="Configurações globais avançadas" href="/configuracoes" />
        <ModuleCard name="Perfil" description="Sua conta pessoal" href="/workspace/perfil" />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Configurações avançadas seguem no{" "}
        <Link to="/configuracoes" className="text-primary hover:underline">Centro de Configurações</Link>.
      </p>
    </PageContainer>
  );
}