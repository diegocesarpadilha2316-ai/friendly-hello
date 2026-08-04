import { createServerFn } from "@tanstack/react-start";

/**
 * Public server fn — exposes ONLY publishable (safe-to-ship) Supabase config
 * to the browser. Read at bootstrap by the root route loader.
 * Never exposes service_role.
 */
export const getPublicSupabaseConfig = createServerFn({ method: "GET" }).handler(
  async () => {
    return { 
      url: process.env.VITE_SUPABASE_URL || "https://placeholder-project.supabase.co", 
      publishableKey: process.env.VITE_SUPABASE_ANON_KEY || "placeholder-key" 
    };
  },
);