import { createServerFn } from "@tanstack/react-start";

/**
 * Public server fn — exposes ONLY publishable (safe-to-ship) Supabase config
 * to the browser. Read at bootstrap by the root route loader.
 * Never exposes service_role.
 */
export const getPublicSupabaseConfig = createServerFn({ method: "GET" }).handler(
  async () => {
    const url = process.env.VITE_SUPABASE_URL || process.env.EXTERNAL_SUPABASE_URL;
    const publishableKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.EXTERNAL_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !publishableKey) {
      const missing = [];
      if (!url) missing.push("VITE_SUPABASE_URL");
      if (!publishableKey) missing.push("VITE_SUPABASE_ANON_KEY");
      
      console.error(`[Supabase Config Error] Missing variables: ${missing.join(", ")}`);
      throw new Error(`Configuração do Supabase incompleta. Variáveis ausentes: ${missing.join(", ")}. Por favor, configure as variáveis de ambiente no painel de controle.`);
    }

    console.log(`[Supabase Config] Returning URL: ${url}`);
    return { url, publishableKey };
  },
);

