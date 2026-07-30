import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createUserScopedClient } from "@/core/lib/supabase/server-user.server";
import { debitCreditsBestEffort } from "@/core/billing/debit.server";
import { priceAiAssistantMessage } from "@/core/billing/pricing";

/**
 * Proxy autenticado do Copiloto IA para o Lovable AI Gateway.
 *
 * Segurança (Etapa 0):
 *  - exige Bearer token válido do Supabase (401 sem sessão);
 *  - exige tenant ativo em `company_members` (403 caso contrário);
 *  - valida formato e tamanho do payload (400 / 413);
 *  - checa saldo de créditos ANTES de chamar o provedor (402);
 *  - debita créditos SOMENTE após resposta bem-sucedida do provedor;
 *  - nunca expõe `LOVABLE_API_KEY` nem detalhes internos nos erros.
 */

const MAX_BODY_BYTES = 256 * 1024; // 256 KB
const MAX_MESSAGE_CHARS = 24_000;
const MAX_MESSAGES = 80;
const MAX_TOTAL_CHARS = 200_000;

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.union([z.string(), z.array(z.unknown()), z.null()]).optional(),
  name: z.string().max(120).optional(),
  tool_call_id: z.string().max(200).optional(),
  tool_calls: z.array(z.unknown()).max(40).optional(),
});

const payloadSchema = z
  .object({
    model: z.string().min(1).max(200).optional(),
    stream: z.boolean().optional(),
    temperature: z.number().min(0).max(2).optional(),
    max_tokens: z.number().int().positive().max(32_000).nullable().optional(),
    messages: z.array(messageSchema).min(1).max(MAX_MESSAGES),
    tools: z.array(z.unknown()).max(80).optional(),
  })
  .passthrough();

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function contentLength(content: unknown): number {
  if (typeof content === "string") return content.length;
  if (content == null) return 0;
  try {
    return JSON.stringify(content).length;
  } catch {
    return 0;
  }
}

export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        /* ------------------------- 1. Autenticação ------------------------- */
        const auth = request.headers.get("authorization") ?? request.headers.get("Authorization");
        if (!auth?.startsWith("Bearer ")) {
          return json({ error: "unauthorized" }, 401);
        }

        let supabase;
        try {
          supabase = createUserScopedClient(auth.slice("Bearer ".length));
        } catch {
          return json({ error: "service_unavailable" }, 503);
        }

        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);
        const userId = userData.user.id;

        /* ---------------------------- 2. Tenant ---------------------------- */
        const rawTenant =
          request.headers.get("x-dioris-tenant") ?? request.headers.get("X-Dioris-Tenant") ?? "";
        const tenantParsed = z.string().uuid().safeParse(rawTenant);

        let tenantId: string | null = tenantParsed.success ? tenantParsed.data : null;

        // Fallback de compatibilidade: resolve o único tenant ativo do usuário.
        const memberQuery = supabase
          .from("company_members")
          .select("company_id")
          .eq("user_id", userId)
          .eq("active", true);

        const { data: memberships, error: memberErr } = tenantId
          ? await memberQuery.eq("company_id", tenantId).limit(1)
          : await memberQuery.limit(2);

        if (memberErr) return json({ error: "tenant_check_failed" }, 500);
        if (!memberships || memberships.length === 0) {
          return json({ error: "forbidden_no_tenant" }, 403);
        }
        if (!tenantId) {
          if (memberships.length > 1) return json({ error: "tenant_required" }, 403);
          tenantId = memberships[0].company_id as string;
        }

        /* ---------------------------- 3. Payload --------------------------- */
        const raw = await request.text();
        if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
          return json({ error: "payload_too_large" }, 413);
        }

        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(raw);
        } catch {
          return json({ error: "invalid_json" }, 400);
        }

        const parsed = payloadSchema.safeParse(parsedJson);
        if (!parsed.success) return json({ error: "invalid_payload" }, 400);

        const messages = parsed.data.messages;
        let totalChars = 0;
        for (const m of messages) {
          const len = contentLength(m.content);
          if (len > MAX_MESSAGE_CHARS) return json({ error: "message_too_long" }, 413);
          totalChars += len;
        }
        if (totalChars > MAX_TOTAL_CHARS) return json({ error: "payload_too_large" }, 413);

        /* -------------------- 4. Pré-checagem de créditos ------------------ */
        const estimatedTokensIn = Math.ceil(totalChars / 4);
        const cost = priceAiAssistantMessage({ tokensIn: estimatedTokensIn });

        const { data: balanceData, error: balanceErr } = await supabase.rpc("credit_balance", {
          _company_id: tenantId,
        });
        if (balanceErr) return json({ error: "billing_unavailable" }, 500);
        const balance = typeof balanceData === "number" ? balanceData : 0;
        if (balance < cost) {
          return json({ code: "insufficient_credits", balance, need: cost }, 402);
        }

        /* --------------------------- 5. Provedor --------------------------- */
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return json({ error: "service_unavailable" }, 503);

        let upstream: Response;
        try {
          upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": key,
              "X-Lovable-AIG-SDK": "dioris-planner",
            },
            body: JSON.stringify(parsed.data),
          });
        } catch {
          return json({ error: "upstream_unavailable" }, 502);
        }

        if (!upstream.ok) {
          // Sem débito: a chamada ao provedor não produziu resposta útil.
          const status = upstream.status === 429 ? 429 : 502;
          return json({ error: "upstream_error", status: upstream.status }, status);
        }

        /* ------------------- 6. Débito (somente em sucesso) ---------------- */
        void debitCreditsBestEffort(supabase, tenantId, userId, {
          amount: cost,
          reason: "ai.message.assistant",
          reference: parsed.data.model ?? null,
          // Metadados seguros: sem conteúdo de mensagens e sem tokens/segredos.
          metadata: {
            surface: "planner.copilot",
            model: parsed.data.model ?? null,
            messages: messages.length,
            stream: parsed.data.stream === true,
            estimated_tokens_in: estimatedTokensIn,
          },
        });

        const headers = new Headers();
        const ct = upstream.headers.get("content-type");
        if (ct) headers.set("Content-Type", ct);
        headers.set("Cache-Control", "no-store");
        return new Response(upstream.body, { status: upstream.status, headers });
      },
    },
  },
});
