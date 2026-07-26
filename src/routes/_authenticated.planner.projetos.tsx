import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/planner/projetos")({
  component: PlannerProjectsLayout,
  head: () => ({
    meta: [
      { title: "Projetos — Dioris Planner" },
      {
        name: "description",
        content:
          "Lista de projetos paramétricos do Dioris Planner, escopados por empresa.",
      },
    ],
  }),
});

function PlannerProjectsLayout() {
  return <Outlet />;
}