/**
 * Débito automático de créditos — helper server-only reutilizado por
 * IA, Render e Vídeo. Fonte única para consumo do ledger.
 *
 * Fluxo:
 *   1. Consulta saldo via RPC `credit_balance`.
 *   2. Se saldo < amount → lança Response 402 (Payment Required).
 *   3. Insere linha `consume` no `credit_ledger` (append-only).
 *
 * Erros:
 *   - 402 InsufficientCredits: `{ code: "insufficient_credits", balance, need }`.
 *   - Falha do insert é propagada como Response 500.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/core/lib/supabase/admin.server";

export interface DebitInput {
  amount: number;
  reason: string;
  reference?: string | null;
  metadata?: Record<string, unknown>;
}

export interface DebitResult {
  ok: true;
  balance: number;
  charged: number;
}

export async function debitCreditsOrThrow(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string | null,
  input: DebitInput,
): Promise<DebitResult> {
  const amount = Math.max(1, Math.ceil(input.amount));

  const { data: balanceData, error: balanceErr } = await supabase.rpc("credit_balance", {
    _company_id: tenantId,
  });
  if (balanceErr) throw new Response(balanceErr.message, { status: 500 });
  const balance = typeof balanceData === "number" ? balanceData : 0;

  if (balance < amount) {
    throw new Response(
      JSON.stringify({ code: "insufficient_credits", balance, need: amount }),
      { status: 402, headers: { "content-type": "application/json" } },
    );
  }

  // Ledger is append-only via service_role — user client has no INSERT policy.
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("credit_ledger").insert({
    company_id: tenantId,
    kind: "consume",
    amount: -amount,
    reason: input.reason,
    reference: input.reference ?? null,
    actor_id: userId,
    metadata: input.metadata ?? {},
  });
  if (error) throw new Response(error.message, { status: 500 });

  const newBalance = balance - amount;

  // Alerta de saldo baixo — best-effort, fora do path crítico.
  const LOW_THRESHOLD = 20;
  if (balance >= LOW_THRESHOLD && newBalance < LOW_THRESHOLD) {
    void (async () => {
      try {
        const { notifyLowCredits } = await import(
          "@/core/notifications/notify.server"
        );
        await notifyLowCredits({
          companyId: tenantId,
          userId,
          balance: newBalance,
          threshold: LOW_THRESHOLD,
        });
      } catch {
        /* silencioso */
      }
    })();
  }

  return { ok: true, balance: newBalance, charged: amount };
}

/** Best-effort: não interrompe o fluxo em caso de falha do ledger. */
export async function debitCreditsBestEffort(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string | null,
  input: DebitInput,
): Promise<DebitResult | null> {
  try {
    return await debitCreditsOrThrow(supabase, tenantId, userId, input);
  } catch {
    return null;
  }
}