import { createServerFn } from "@tanstack/react-start";

/**
 * Public server fn — exposes ONLY publishable (safe-to-ship) Supabase config
 * to the browser. Read at bootstrap by the root route loader.
 * Never exposes service_role.
 */
export const getPublicSupabaseConfig = createServerFn({ method: "GET" }).handler(
  async () => {
    const url = process.env.EXTERNAL_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const publishableKey = process.env.EXTERNAL_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !publishableKey) {
      console.warn("Supabase config partially missing, checking fallback logic...");
    }

    // Retornar objeto explícito para evitar erros de desestruturação
    return { 
      url: url || "https://placeholder-project.supabase.co", 
      publishableKey: publishableKey || "placeholder-key" 
    };
  },
);