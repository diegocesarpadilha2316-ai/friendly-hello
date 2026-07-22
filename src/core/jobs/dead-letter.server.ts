import type { SupabaseClient } from "@supabase/supabase-js";

export const DeadLetter = {
  async move(
    supabase: SupabaseClient,
    companyId: string,
    jobId: string,
    kind: string,
    attempts: number,
    error: string | null,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await supabase.from("dead_letter_queue").insert({
      company_id: companyId,
      job_id: jobId,
      kind,
      attempts,
      error,
      payload,
    });
  },
  async requeue(supabase: SupabaseClient, companyId: string, id: string): Promise<void> {
    const { data } = await supabase
      .from("dead_letter_queue")
      .select("*")
      .eq("company_id", companyId)
      .eq("id", id)
      .maybeSingle();
    if (!data) return;
    await supabase
      .from("jobs")
      .update({ status: "queued", attempts: 0, error: null, updated_at: new Date().toISOString() })
      .eq("id", data.job_id)
      .eq("company_id", companyId);
    await supabase.from("dead_letter_queue").delete().eq("id", id).eq("company_id", companyId);
  },
};