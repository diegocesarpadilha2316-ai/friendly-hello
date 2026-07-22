import { createFileRoute } from "@tanstack/react-router";
import { UserCircle } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  EmptyState,
  FormSection,
} from "@/core/components/ui-kit";
import { useOptionalAuth } from "@/core/hooks";

export const Route = createFileRoute("/_authenticated/workspace/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — Workspace | Dioris Hub" },
      { name: "description", content: "Dados do usuário autenticado no Workspace Dioris." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspacePerfil,
});

function WorkspacePerfil() {
  const auth = useOptionalAuth();
  if (!auth?.user) {
    return (
      <PageContainer>
        <EmptyState icon={<UserCircle className="h-6 w-6" />} title="Sessão não encontrada" />
      </PageContainer>
    );
  }
  return (
    <PageContainer>
      <PageHeader eyebrow="Workspace" title="Perfil" description={auth.user.email ?? ""} />
      <div className="mt-8">
        <FormSection title="Identidade" description="Dados básicos do provedor de autenticação.">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">E-mail</dt>
              <dd>{auth.user.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">User ID</dt>
              <dd className="font-mono text-xs">{auth.user.id}</dd>
            </div>
          </dl>
        </FormSection>
      </div>
    </PageContainer>
  );
}