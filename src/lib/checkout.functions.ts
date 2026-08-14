/**
 * Server functions do checkout transparente (Pix / Mercado Pago).
 * Thin wrappers — helpers reais em `src/core/billing/mercadopago.server.ts`.
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";

export type CreditPackDTO = {
  key: string;
  label: string;
  credits: number;
  priceCents: number;
  currency: string;
  bonusPct: number;
  sortOrder: number;
};

export type CheckoutOrderDTO = {
  id: string;
  provider: string;
  method: "pix" | "boleto" | "card";
  status: "pending" | "approved" | "rejected" | "cancelled" | "expired" | "refunded";
  amountCents: number;
  currency: string;
  credits: number;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
  expiresAt: string | null;
  createdAt: string;
};

function mapOrder(r: {
  id: string;
  provider: string;
  method: string;
  status: string;
  amount_cents: number;
  currency: string;
  credits: number;
  qr_code: string | null;
  qr_code_base64: string | null;
  ticket_url: string | null;
  expires_at: string | null;
  created_at: string;
}): CheckoutOrderDTO {
  return {
    id: r.id,
    provider: r.provider,
    method: r.method as CheckoutOrderDTO["method"],
    status: r.status as CheckoutOrderDTO["status"],
    amountCents: r.amount_cents,
    currency: r.currency,
    credits: r.credits,
    qrCode: r.qr_code,
    qrCodeBase64: r.qr_code_base64,
    ticketUrl: r.ticket_url,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
  };
}

export const listCreditPacks = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("credit_packs")
      .select("key, label, credits, price_cents, currency, bonus_pct, sort_order")
      .eq("is_public", true)
      .order("sort_order", { ascending: true });
    if (error) throw new Response(error.message, { status: 500 });
    const packs: CreditPackDTO[] = (data ?? []).map((r) => ({
      key: r.key,
      label: r.label,
      credits: r.credits,
      priceCents: r.price_cents,
      currency: r.currency,
      bonusPct: r.bonus_pct ?? 0,
      sortOrder: r.sort_order ?? 100,
    }));
    return { packs };
  });

export const createPixCheckout = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw) => z.object({ packKey: z.string().min(1) }).parse(raw))
  .handler(async ({ data, context }) => {
    // 1) valida pack
    const { data: pack, error: packErr } = await context.supabase
      .from("credit_packs")
      .select("*")
      .eq("key", data.packKey)
      .eq("is_public", true)
      .maybeSingle();
    if (packErr) throw new Response(packErr.message, { status: 500 });
    if (!pack) throw new Response("Pacote não encontrado", { status: 404 });

    // 2) chama Mercado Pago (dinâmico — server-only)
    const { mpCreatePixPayment } = await import("@/core/billing/mercadopago.server");
    const { getSupabaseAdmin } = await import("@/core/lib/supabase/admin.server");

    const totalCredits = pack.credits + Math.floor((pack.credits * (pack.bonus_pct ?? 0)) / 100);

    // URL pública para o webhook
    let notificationUrl = process.env.PUBLIC_APP_URL ?? "";
    if (!notificationUrl) {
      try {
        const req = getRequestUrl();
        notificationUrl = `${req.protocol}//${req.host}`;
      } catch {
        notificationUrl = "";
      }
    }
    notificationUrl = `${notificationUrl.replace(/\/$/, "")}/api/public/v1/webhooks/mercadopago`;

    const admin = getSupabaseAdmin();
    const externalRef = crypto.randomUUID();

    const pix = await mpCreatePixPayment({
      amountCents: pack.price_cents,
      description: `Dioris — ${pack.label}`,
      payerEmail: context.email ?? "cliente@dioris.local",
      externalReference: externalRef,
      notificationUrl,
    });

    const qr = pix.point_of_interaction?.transaction_data;

    const { data: row, error } = await admin
      .from("payment_orders")
      .insert({
        id: externalRef,
        company_id: context.tenantId,
        actor_id: context.userId,
        provider: "mercadopago",
        method: "pix",
        kind: "credits",
        status: "pending",
        amount_cents: pack.price_cents,
        currency: pack.currency,
        credits: totalCredits,
        pack_key: pack.key,
        external_id: String(pix.id),
        qr_code: qr?.qr_code ?? null,
        qr_code_base64: qr?.qr_code_base64 ?? null,
        ticket_url: qr?.ticket_url ?? null,
        payer_email: context.email ?? null,
        expires_at: pix.date_of_expiration ?? null,
        payload: pix as unknown as Record<string, unknown>,
      })
      .select("*")
      .single();
    if (error) throw new Response(error.message, { status: 500 });
    return { order: mapOrder(row) };
  });

export const getCheckoutOrder = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((raw) => z.object({ orderId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("payment_orders")
      .select("*")
      .eq("id", data.orderId)
      .eq("company_id", context.tenantId)
      .maybeSingle();
    if (error) throw new Response(error.message, { status: 500 });
    if (!row) throw new Response("Pedido não encontrado", { status: 404 });

    // Se ainda estiver pending, faz um refresh contra MP (fallback ao webhook)
    if (row.status === "pending" && row.external_id && row.provider === "mercadopago") {
      try {
        const { mpGetPayment, mpStatusToOrder } = await import("@/core/billing/mercadopago.server");
        const { getSupabaseAdmin } = await import("@/core/lib/supabase/admin.server");
        const p = await mpGetPayment(row.external_id);
        const newStatus = mpStatusToOrder(p.status);
        if (newStatus !== row.status) {
          const admin = getSupabaseAdmin();
          await admin
            .from("payment_orders")
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq("id", row.id);
          if (newStatus === "approved" && !row.credited_at) {
            await creditOrder(admin, row);
          }
          row.status = newStatus;
        }
      } catch {
        // silencioso — webhook é a fonte primária
      }
    }

    return { order: mapOrder(row) };
  });

export const listCheckoutOrders = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("payment_orders")
      .select(
        "id, provider, method, status, amount_cents, currency, credits, qr_code, qr_code_base64, ticket_url, expires_at, created_at",
      )
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Response(error.message, { status: 500 });
    const orders: CheckoutOrderDTO[] = (data ?? []).map(mapOrder);
    return { orders };
  });

// Concede créditos no ledger e marca pedido como creditado (idempotente).
async function creditOrder(admin: any, row: any): Promise<void> {
  const { data: existing } = await admin
    .from("payment_orders")
    .select("credited_at")
    .eq("id", row.id)
    .maybeSingle();
  if (existing?.credited_at) return;
  await admin.from("credit_ledger").insert({
    company_id: row.company_id,
    kind: "grant",
    amount: row.credits,
    reason: `Compra de créditos (${row.pack_key ?? "avulso"})`,
    actor_id: row.actor_id,
    reference: `order:${row.id}`,
    metadata: { provider: row.provider, external_id: row.external_id },
  });
  await admin
    .from("payment_orders")
    .update({ credited_at: new Date().toISOString(), status: "approved" })
    .eq("id", row.id);
}
