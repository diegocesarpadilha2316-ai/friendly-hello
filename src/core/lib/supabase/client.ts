import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client — publishable key, persists session in localStorage.
 * Instantiated once at bootstrap by AuthProvider with config fetched from
 * the server (see config.functions.ts). Never instantiate directly.
 */
let _client: SupabaseClient | null = null;

export function initSupabaseBrowser(url: string, publishableKey: string): SupabaseClient {
  if (_client) return _client;
  const isBrowser = typeof window !== "undefined";
  
  if (!url || !publishableKey) {
    console.warn("Supabase configuration missing in initSupabaseBrowser. Falling back to dummy client.");
  }

  _client = createClient(
    url || "https://placeholder-project.supabase.co",
    publishableKey || "placeholder-key",
    {
      auth: {
        persistSession: isBrowser,
        autoRefreshToken: isBrowser,
        detectSessionInUrl: isBrowser,
        storage: isBrowser ? window.localStorage : undefined,
        storageKey: "dioris.hub.auth",
      },
    }
  );
  return _client;
}

export function getSupabaseBrowser(): SupabaseClient {
  if (!_client) {
    throw new Error(
      "Supabase browser client não inicializado. Garanta que <AuthProvider> envolva a árvore.",
    );
  }
  return _client;
}