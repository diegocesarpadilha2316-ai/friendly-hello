import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

/**
 * Attach the Supabase access token to every server-fn call so
 * requireAuth middleware can validate the caller.
 */
/**
 * Anexa credenciais do usuário + tenant ativo em cada chamada de server fn.
 *  - Authorization: Bearer <access_token>   (requireAuth / requireTenant)
 *  - x-dioris-tenant: <company_id>          (requireTenant)
 */
const attachDiorisContext = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined") {
    try {
      const { getSupabaseBrowser } = await import("@/core/lib/supabase/client");
      const supabase = getSupabaseBrowser();
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        headers["Authorization"] = `Bearer ${data.session.access_token}`;
      }
    } catch {
      /* client not ready yet — skip */
    }
    try {
      const { getActiveTenantIdFromStorage } = await import(
        "@/core/providers/TenantProvider"
      );
      const tenantId = getActiveTenantIdFromStorage();
      if (tenantId) headers["x-dioris-tenant"] = tenantId;
    } catch {
      /* no tenant selected */
    }
  }
  return next({ headers });
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
  functionMiddleware: [attachDiorisContext],
}));
