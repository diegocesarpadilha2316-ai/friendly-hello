import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * A porta de entrada oficial do Planner é a **Dioris Planner** — a IA
 * projetista. O usuário conversa e o projeto nasce sozinho no viewport;
 * não existe mais botão "Novo projeto" nem wizard manual como ponto de
 * partida. Toda navegação para /planner cai direto no chat.
 */
export const Route = createFileRoute("/_authenticated/planner/")({
  beforeLoad: () => {
    throw redirect({ to: "/planner/ia" });
  },
  component: () => null,
});
