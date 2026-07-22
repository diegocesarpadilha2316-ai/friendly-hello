/**
 * IntegrationManager — orquestração central.
 * Todos os módulos falam APENAS com o Manager (via server functions).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { apiCall, type ApiClientOptions, type ApiCallResult } from "./api-client.server";
import { IntegrationRegistry } from "./registry.server";

type Ctx = { supabase: SupabaseClient; tenantId: string; userId: string };

export const IntegrationManager = {
  listProviders() {
    return IntegrationRegistry.list();
  },

  async logCall(
    ctx: Ctx,
    provider: string,
    action: string,
    result: ApiCallResult,
    integrationId?: string | null,
  ): Promise<void> {
    await ctx.supabase.from("integration_logs").insert({
      company_id: ctx.tenantId,
      integration_id: integrationId ?? null,
      provider,
      action,
      status: result.ok ? "success" : "error",
      duration_ms: result.durationMs,
      request: {},
      response: {},
      error: result.error,
    });
  },

  async call<T = unknown>(
    ctx: Ctx,
    provider: string,
    action: string,
    url: string,
    init: RequestInit = {},
    opts: ApiClientOptions = {},
  ): Promise<ApiCallResult<T>> {
    const result = await apiCall<T>(url, init, opts);
    await this.logCall(ctx, provider, action, result);
    return result;
  },

  async recordHealth(
    ctx: Ctx,
    integrationId: string,
    status: "online" | "offline" | "degraded" | "unknown",
    latencyMs: number | null,
    lastError: string | null,
  ): Promise<void> {
    await ctx.supabase.from("integration_health").insert({
      company_id: ctx.tenantId,
      integration_id: integrationId,
      status,
      latency_ms: latencyMs,
      last_error: lastError,
      last_check_at: new Date().toISOString(),
    });
  },
};