import { createFileRoute } from "@tanstack/react-router";
import { PlannerEditorProvider, PlannerLayout } from "@/modules/planner/shared";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "Dioris Planner — Projeto 3D + IA + Produção" },
      {
        name: "description",
        content:
          "Editor paramétrico, ambientes, cômodos, IA e produção — o núcleo do Dioris Planner.",
      },
      { property: "og:title", content: "Dioris Planner" },
      {
        property: "og:description",
        content: "Editor paramétrico com IA, ambientes e produção conectados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PlannerShell,
});

function PlannerShell() {
  return (
    <PlannerEditorProvider>
      <PlannerLayout />
    </PlannerEditorProvider>
  );
}
