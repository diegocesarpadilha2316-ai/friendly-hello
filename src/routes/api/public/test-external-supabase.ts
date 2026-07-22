import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/test-external-supabase")({
  server: {
    handlers: {
      GET: async () => {
        const url = process.env.EXTERNAL_SUPABASE_URL;
        const pub = process.env.EXTERNAL_SUPABASE_PUBLISHABLE_KEY;
        const svc = process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY;

        const result: Record<string, unknown> = {
          hasUrl: !!url,
          hasPublishableKey: !!pub,
          hasServiceRoleKey: !!svc,
          urlHost: url ? new URL(url).host : null,
        };

        if (!url || !pub || !svc) {
          return new Response(
            JSON.stringify({ ok: false, ...result, error: "Missing envs" }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }

        async function ping(key: string, label: string) {
          try {
            const headers: Record<string, string> = { apikey: key };
            if (!key.startsWith("sb_")) headers.Authorization = `Bearer ${key}`;
            const r = await fetch(`${url}/auth/v1/health`, { headers });
            return { label, status: r.status, ok: r.ok };
          } catch (e) {
            return { label, error: String(e) };
          }
        }

        result.publishableCheck = await ping(pub, "publishable");
        result.serviceRoleCheck = await ping(svc, "serviceRole");

        return new Response(JSON.stringify({ ok: true, ...result }, null, 2), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});