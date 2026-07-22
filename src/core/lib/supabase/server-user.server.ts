import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client scoped to a user's bearer token.
 * RLS applies as that user. Used by requireAuth middleware.
 */
export function createUserScopedClient(bearer: string): SupabaseClient {
  const url = process.env.EXTERNAL_SUPABASE_URL;
  const key = process.env.EXTERNAL_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase externo não configurado.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${bearer}` } },
  });
}