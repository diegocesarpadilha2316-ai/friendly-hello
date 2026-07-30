import type { SupabaseClient } from "@supabase/supabase-js";
import { parseAuthHeader, verifyApiKey } from "./key-hash.server";
import { checkRateLimit, incrementQuota } from "./rate-limit.server";

export interface AuthenticatedApiCall {
  companyId: string;
  apiKeyId: string;
  scopes: readonly string[];
}

export async function authenticateApiRequest(
  supabase: SupabaseClient,
  request: Request,
): Promise<AuthenticatedApiCall | { error: string; status: number }> {
  const parsed = parseAuthHeader(
    request.headers.get("authorization"),
    request.headers.get("x-api-key"),
  );
  if (!parsed) return { error: "Missing bearer token", status: 401 };
  const { data: key } = await supabase
    .from("api_keys")
    .select("id, company_id, key_hash, scopes, allowed_ips, status, expires_at")
    .eq("prefix", parsed.prefix)
    .maybeSingle();
  if (!key || key.status !== "active") return { error: "Invalid API key", status: 401 };
  if (key.expires_at && new Date(key.expires_at as string) < new Date())
    return { error: "API key expired", status: 401 };
  if (!verifyApiKey(parsed.secret, key.key_hash as string))
    return { error: "Invalid API key", status: 401 };
  const ips = (key.allowed_ips as string[] | null) ?? [];
  if (ips.length) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    if (!ips.includes(ip)) return { error: "IP not allowed", status: 403 };
  }
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", key.id);
  return {
    companyId: key.company_id as string,
    apiKeyId: key.id as string,
    scopes: (key.scopes as string[] | null) ?? [],
  };
}

export async function enforceLimits(
  supabase: SupabaseClient,
  companyId: string,
  apiKeyId: string,
  endpointKey: string,
): Promise<{ allowed: boolean; retryAfter?: string }> {
  const { data: cfg } = await supabase
    .from("api_rate_limits")
    .select("window_seconds, max_requests")
    .eq("company_id", companyId)
    .in("scope_key", [apiKeyId, endpointKey, companyId])
    .limit(4);
  const rules = cfg?.length
    ? cfg.map((r) => ({ w: r.window_seconds as number, m: r.max_requests as number }))
    : [{ w: 60, m: 120 }];
  for (const r of rules) {
    const res = await checkRateLimit(supabase, companyId, `${apiKeyId}:${endpointKey}`, r.w, r.m);
    if (!res.allowed) return { allowed: false, retryAfter: res.resetAt };
  }
  await incrementQuota(supabase, companyId);
  return { allowed: true };
}

export async function logApiRequest(
  supabase: SupabaseClient,
  companyId: string,
  params: {
    apiKeyId: string | null;
    userId: string | null;
    method: string;
    path: string;
    version: string;
    status: number;
    durationMs: number;
    ip: string | null;
    userAgent: string | null;
    requestId: string;
    correlationId: string | null;
    error: string | null;
  },
): Promise<void> {
  await supabase.from("api_requests").insert({
    company_id: companyId,
    api_key_id: params.apiKeyId,
    user_id: params.userId,
    method: params.method,
    path: params.path,
    version: params.version,
    status: params.status,
    duration_ms: params.durationMs,
    ip: params.ip,
    user_agent: params.userAgent,
    request_id: params.requestId,
    correlation_id: params.correlationId,
    error: params.error,
  });
}