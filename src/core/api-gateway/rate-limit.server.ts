import type { SupabaseClient } from "@supabase/supabase-js";

export async function checkRateLimit(
  supabase: SupabaseClient,
  companyId: string,
  bucketKey: string,
  windowSeconds: number,
  maxRequests: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: string }> {
  const now = new Date();
  const bucket = new Date(
    Math.floor(now.getTime() / (windowSeconds * 1000)) * windowSeconds * 1000,
  );
  const resetAt = new Date(bucket.getTime() + windowSeconds * 1000).toISOString();
  const { data } = await supabase
    .from("api_rate_counters")
    .select("id, count")
    .eq("company_id", companyId)
    .eq("bucket_key", bucketKey)
    .eq("window_start", bucket.toISOString())
    .maybeSingle();
  const current = (data?.count as number | undefined) ?? 0;
  if (current >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt };
  }
  if (data?.id) {
    await supabase
      .from("api_rate_counters")
      .update({ count: current + 1 })
      .eq("id", data.id);
  } else {
    await supabase.from("api_rate_counters").insert({
      company_id: companyId,
      bucket_key: bucketKey,
      window_start: bucket.toISOString(),
      count: 1,
    });
  }
  return { allowed: true, remaining: maxRequests - current - 1, resetAt };
}

export async function incrementQuota(supabase: SupabaseClient, companyId: string): Promise<void> {
  const now = new Date();
  const periods: { key: "minute" | "hour" | "day" | "month"; ms: number }[] = [
    { key: "minute", ms: 60_000 },
    { key: "hour", ms: 3_600_000 },
    { key: "day", ms: 86_400_000 },
    { key: "month", ms: 30 * 86_400_000 },
  ];
  for (const p of periods) {
    const { data } = await supabase
      .from("api_quotas")
      .select("id, used, resets_at")
      .eq("company_id", companyId)
      .eq("period", p.key)
      .maybeSingle();
    if (!data) continue;
    if (new Date(data.resets_at as string).getTime() < now.getTime()) {
      await supabase
        .from("api_quotas")
        .update({ used: 1, resets_at: new Date(now.getTime() + p.ms).toISOString() })
        .eq("id", data.id);
    } else {
      await supabase
        .from("api_quotas")
        .update({ used: (data.used as number) + 1 })
        .eq("id", data.id);
    }
  }
}
