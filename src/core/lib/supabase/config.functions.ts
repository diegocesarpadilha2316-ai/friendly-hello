import { createServerFn } from "@tanstack/react-start";

/**
 * Public server fn — exposes ONLY publishable (safe-to-ship) Supabase config
 * to the browser. Read at bootstrap by the root route loader.
 * Never exposes service_role.
 */
export const getPublicSupabaseConfig = createServerFn({ method: "GET" }).handler(
  async () => {
    const url = process.env.EXTERNAL_SUPABASE_URL;
    const publishableKey = process.env.EXTERNAL_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !publishableKey) {
      console.error("Supabase config missing:", { url: !!url, key: !!publishableKey });
      // Fallback para desenvolvimento local ou falha de injecção
      return { 
        url: url || "http://localhost:54321", 
        publishableKey: publishableKey || "placeholder-key" 
      };
    }
    return { url, publishableKey };
  },
);