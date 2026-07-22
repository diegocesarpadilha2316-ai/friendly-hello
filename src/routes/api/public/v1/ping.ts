import { createFileRoute } from "@tanstack/react-router";
import { randomUUID } from "crypto";
import {
  authenticateApiRequest,
  enforceLimits,
  logApiRequest,
} from "@/core/api-gateway/gateway.server";

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Correlation-Id",
  };
}

export const Route = createFileRoute("/api/public/v1/ping")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders() }),
      GET: async ({ request }) => {
        const started = Date.now();
        const requestId = randomUUID();
        const correlationId = request.headers.get("x-correlation-id") ?? requestId;
        const { getSupabaseAdmin } = await import("@/core/lib/supabase/admin.server");
        const supabaseAdmin = getSupabaseAdmin();
        const authResult = await authenticateApiRequest(supabaseAdmin, request);
        if ("error" in authResult) {
          return new Response(JSON.stringify({ error: authResult.error, requestId }), {
            status: authResult.status,
            headers: {
              "Content-Type": "application/json",
              "X-Request-Id": requestId,
              "X-Correlation-Id": correlationId,
              ...corsHeaders(),
            },
          });
        }
        const limits = await enforceLimits(supabaseAdmin, authResult.companyId, authResult.apiKeyId, "GET:/v1/ping");
        if (!limits.allowed) {
          await logApiRequest(supabaseAdmin, authResult.companyId, {
            apiKeyId: authResult.apiKeyId,
            userId: null,
            method: "GET",
            path: "/v1/ping",
            version: "v1",
            status: 429,
            durationMs: Date.now() - started,
            ip: request.headers.get("x-forwarded-for"),
            userAgent: request.headers.get("user-agent"),
            requestId,
            correlationId,
            error: "rate_limited",
          });
          return new Response(JSON.stringify({ error: "rate_limited", retryAfter: limits.retryAfter }), {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-Request-Id": requestId,
              "X-Correlation-Id": correlationId,
              ...corsHeaders(),
            },
          });
        }
        const body = { ok: true, requestId, ts: new Date().toISOString() };
        await logApiRequest(supabaseAdmin, authResult.companyId, {
          apiKeyId: authResult.apiKeyId,
          userId: null,
          method: "GET",
          path: "/v1/ping",
          version: "v1",
          status: 200,
          durationMs: Date.now() - started,
          ip: request.headers.get("x-forwarded-for"),
          userAgent: request.headers.get("user-agent"),
          requestId,
          correlationId,
          error: null,
        });
        return new Response(JSON.stringify(body), {
          headers: {
            "Content-Type": "application/json",
            "X-Request-Id": requestId,
            "X-Correlation-Id": correlationId,
            ...corsHeaders(),
          },
        });
      },
    },
  },
});