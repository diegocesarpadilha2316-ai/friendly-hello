import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { buildOpenApi, toYaml } from "@/core/api-gateway/openapi.server";

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export const Route = createFileRoute("/api/public/v1/openapi")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders() }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const format = url.searchParams.get("format") ?? "json";
        const key = process.env.SUPABASE_PUBLISHABLE_KEY;
        const base = process.env.SUPABASE_URL;
        if (!key || !base) {
          return new Response(JSON.stringify({ error: "not_configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders() },
          });
        }
        const supabase = createClient(base, key, {
          auth: { persistSession: false },
          global: {
            fetch: (input, init) => {
              const h = new Headers(init?.headers);
              if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
              h.set("apikey", key);
              return fetch(input, { ...init, headers: h });
            },
          },
        });
        const { data } = await supabase
          .from("api_endpoints")
          .select("*")
          .is("company_id", null)
          .eq("public", true);
        const endpoints = (data ?? []).map((r) => ({
          id: String(r.id),
          version: String(r.version ?? "v1"),
          method: String(r.method),
          path: String(r.path),
          module: String(r.module),
          summary: (r.summary as string) ?? null,
          scopes: (r.scopes as string[] | null) ?? [],
          deprecated: Boolean(r.deprecated),
          public: Boolean(r.public),
        }));
        const spec = buildOpenApi(endpoints);
        if (format === "yaml") {
          return new Response(toYaml(spec).trimStart(), {
            headers: { "Content-Type": "application/yaml", ...corsHeaders() },
          });
        }
        return new Response(JSON.stringify(spec, null, 2), {
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      },
    },
  },
});