import type { SupabaseClient } from "@supabase/supabase-js";

export const DistributedLocks = {
  async acquire(
    supabase: SupabaseClient,
    companyId: string,
    key: string,
    owner: string,
    ttlMs = 30_000,
  ): Promise<boolean> {
    const expiresAt = new Date(Date.now() + ttlMs).toISOString();
    await supabase
      .from("distributed_locks")
      .delete()
      .eq("company_id", companyId)
      .lt("expires_at", new Date().toISOString());
    const { error } = await supabase
      .from("distributed_locks")
      .insert({ company_id: companyId, key, owner, expires_at: expiresAt });
    return !error;
  },
  async release(
    supabase: SupabaseClient,
    companyId: string,
    key: string,
    owner: string,
  ): Promise<void> {
    await supabase
      .from("distributed_locks")
      .delete()
      .eq("company_id", companyId)
      .eq("key", key)
      .eq("owner", owner);
  },
};
