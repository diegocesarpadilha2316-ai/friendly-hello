import { createFileRoute, Outlet } from "@tanstack/react-router";
import { WorkspaceLayout } from "@/core/components/WorkspaceLayout";

export const Route = createFileRoute("/_authenticated/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace — Dioris Hub" },
      {
        name: "description",
        content:
          "Workspace da empresa: dashboard, equipe, créditos, IA, assets, integrações e configurações — escopado ao tenant ativo.",
      },
      { property: "og:title", content: "Workspace — Dioris Hub" },
      {
        property: "og:description",
        content: "Área do cliente Dioris Hub para gerir toda a operação da empresa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceShell,
});

function WorkspaceShell() {
  return (
    <WorkspaceLayout>
      <Outlet />
    </WorkspaceLayout>
  );
}