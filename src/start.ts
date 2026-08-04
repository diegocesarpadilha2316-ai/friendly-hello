import { createStart, createMiddleware } from "@tanstack/react-start";
import { renderErrorPage } from "./lib/error-page";

/**
 * Middleware de erro global para capturar e logar falhas de bootstrap.
 */
const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    console.error("BOOTSTRAP_CRASH:", error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

/**
 * Middleware para anexar contexto (auth/tenant) em chamadas de Server Functions.
 */
const attachDiorisContext = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const headers: Record<string, string> = {};
  
  if (typeof window !== "undefined") {
    // 1. Tenta anexar Token de Autenticação
    try {
      const { getSupabaseBrowser } = await import("@/core/lib/supabase/client");
      const supabase = getSupabaseBrowser();
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        headers["Authorization"] = `Bearer ${data.session.access_token}`;
      }
    } catch {
      // Ignora falhas se o client não estiver pronto
    }

    // 2. Tenta anexar ID do Tenant ativo
    try {
      const { getActiveTenantIdFromStorage } = await import(
        "@/core/providers/TenantProvider"
      );
      const tenantId = getActiveTenantIdFromStorage();
      if (tenantId) headers["x-dioris-tenant"] = tenantId;
    } catch {
      // Ignora falhas se o tenant não estiver disponível
    }
  }
  
  return next({ headers });
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
  functionMiddleware: [attachDiorisContext],
}));
