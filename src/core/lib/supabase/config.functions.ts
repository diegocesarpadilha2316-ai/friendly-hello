import { createServerFn } from "@tanstack/react-start";

/**
 * Public server fn — exposes ONLY publishable (safe-to-ship) Supabase config
 * to the browser. Read at bootstrap by the root route loader.
 * Never exposes service_role.
 */
export const getPublicSupabaseConfig = createServerFn({ method: "GET" }).handler(async () => {
  const buildEnv = import.meta.env as Record<string, string | undefined> | undefined;
  const runtimeEnv =
    typeof process !== "undefined"
      ? (process.env as Record<string, string | undefined> | undefined)
      : undefined;
  const url =
    buildEnv?.VITE_SUPABASE_URL ||
    runtimeEnv?.VITE_SUPABASE_URL ||
    runtimeEnv?.EXTERNAL_SUPABASE_URL;
  const publishableKey =
    buildEnv?.VITE_SUPABASE_ANON_KEY ||
    runtimeEnv?.VITE_SUPABASE_ANON_KEY ||
    runtimeEnv?.EXTERNAL_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    const missing = [];
    if (!url) missing.push("VITE_SUPABASE_URL");
    if (!publishableKey) missing.push("VITE_SUPABASE_ANON_KEY");

    console.error(`[Supabase Config Error] Missing variables: ${missing.join(", ")}`);
    throw new Error(
      `Configuração do Supabase incompleta. Variáveis ausentes: ${missing.join(", ")}. Por favor, configure as variáveis de ambiente no painel de controle.`,
    );
  }

  return { url, publishableKey };
});
