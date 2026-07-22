import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createUserScopedClient } from "@/core/lib/supabase/server-user.server";

/**
 * Server-fn middleware que valida a sessão do usuário via bearer token.
 * Injeta em `context`: supabase (RLS como o usuário), userId, email.
 * Lança Response 401 se não autenticado.
 */
export const requireAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const authHeader = getRequestHeader("authorization") ?? getRequestHeader("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Response("Unauthorized", { status: 401 });
    }
    const token = authHeader.slice("Bearer ".length);
    const supabase = createUserScopedClient(token);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw new Response("Unauthorized", { status: 401 });
    }
    return next({
      context: {
        supabase,
        userId: data.user.id,
        email: data.user.email ?? null,
      },
    });
  },
);