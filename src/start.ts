import { createStart, createMiddleware } from "@tanstack/react-start";

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
    } catch {}

    try {
      const { getActiveTenantIdFromStorage } = await import("@/core/providers/TenantProvider");
      const tenantId = getActiveTenantIdFromStorage();
      if (tenantId) headers["x-dioris-tenant"] = tenantId;
    } catch {}
  }
  
  return next({ headers });
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachDiorisContext],
}));
