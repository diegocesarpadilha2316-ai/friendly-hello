/**
 * Webhook do Mercado Pago — recebe notificações de `payment.updated`.
 * Verifica assinatura HMAC (v1) e credita o ledger quando `approved`.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/v1/webhooks/mercadopago")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("x-signature");
        const requestId = request.headers.get("x-request-id");
        const url = new URL(request.url);
        const dataId =
          url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? null;

        let bodyJson: any = null;
        try {
          bodyJson = await request.json();
        } catch {
          bodyJson = null;
        }
        const paymentId = dataId ?? bodyJson?.data?.id ?? bodyJson?.id ?? null;
        if (!paymentId) return new Response("missing id", { status: 400 });

        const { mpVerifyWebhook, mpGetPayment, mpStatusToOrder } = await import(
          "@/core/billing/mercadopago.server"
        );
        const { getSupabaseAdmin } = await import("@/core/lib/supabase/admin.server");

        const ok = mpVerifyWebhook({
          signatureHeader: signature,
          requestId,
          dataId: String(paymentId),
        });
        if (!ok) return new Response("invalid signature", { status: 401 });

        const payment = await mpGetPayment(paymentId);
        const admin = getSupabaseAdmin();

        const { data: order } = await admin
          .from("payment_orders")
          .select("*")
          .eq("provider", "mercadopago")
          .eq("external_id", String(paymentId))
          .maybeSingle();
        if (!order) return new Response("order not found", { status: 404 });

        const newStatus = mpStatusToOrder(payment.status);
        await admin
          .from("payment_orders")
          .update({
            status: newStatus,
            payload: payment as unknown as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        if (newStatus === "approved" && !order.credited_at) {
          await admin.from("credit_ledger").insert({
            company_id: order.company_id,
            kind: "grant",
            amount: order.credits,
            reason: `Compra de créditos (${order.pack_key ?? "avulso"})`,
            actor_id: order.actor_id,
            reference: `order:${order.id}`,
            metadata: { provider: "mercadopago", external_id: order.external_id },
          });
          await admin
            .from("payment_orders")
            .update({ credited_at: new Date().toISOString(), status: "approved" })
            .eq("id", order.id);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});