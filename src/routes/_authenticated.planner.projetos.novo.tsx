import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * O wizard manual foi substituído pela **Dioris Planner** (IA projetista).
 * Qualquer link legado para `/planner/projetos/novo` cai direto no chat —
 * o projeto nasce durante a conversa, sem formulário.
 */
export const Route = createFileRoute("/_authenticated/planner/projetos/novo")({
  beforeLoad: () => {
    throw redirect({ to: "/planner/ia" });
  },
  component: () => null,
});
