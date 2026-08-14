/**
 * Mercado Pago API client — SERVER ONLY.
 * Nunca importar em módulos client-reachable no topo — carregar dinamicamente
 * dentro de `.handler()` das server functions e webhooks.
 *
 * Docs: https://www.mercadopago.com.br/developers/pt/reference/payments/_payments/post
 */
import { randomUUID, createHmac, timingSafeEqual } from "node:crypto";

const MP_API = "https://api.mercadopago.com";

function getToken(): string {
  const t = process.env.MP_ACCESS_TOKEN;
  if (!t) throw new Error("MP_ACCESS_TOKEN não configurado no Admin → Cobrança.");
  return t;
}

export type MpPixPayment = {
  id: number;
  status: string;
  status_detail: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
  date_of_expiration?: string;
};

export async function mpCreatePixPayment(input: {
  amountCents: number;
  description: string;
  payerEmail: string;
  externalReference: string;
  notificationUrl: string;
  expiresInMinutes?: number;
}): Promise<MpPixPayment> {
  const token = getToken();
  const expiresInMin = input.expiresInMinutes ?? 30;
  const dateOfExpiration = new Date(Date.now() + expiresInMin * 60_000).toISOString();
  const body = {
    transaction_amount: Math.round(input.amountCents) / 100,
    description: input.description,
    payment_method_id: "pix",
    payer: { email: input.payerEmail },
    external_reference: input.externalReference,
    notification_url: input.notificationUrl,
    date_of_expiration: dateOfExpiration,
  };
  const res = await fetch(`${MP_API}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": randomUUID(),
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as MpPixPayment & { message?: string };
  if (!res.ok) {
    throw new Error(`Mercado Pago (${res.status}): ${json.message ?? "erro ao criar Pix"}`);
  }
  return json;
}

export async function mpGetPayment(id: string | number): Promise<MpPixPayment> {
  const token = getToken();
  const res = await fetch(`${MP_API}/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = (await res.json()) as MpPixPayment & { message?: string };
  if (!res.ok) throw new Error(`Mercado Pago (${res.status}): ${json.message ?? "erro"}`);
  return json;
}

/**
 * Verificação do webhook (v1) — Mercado Pago envia cabeçalhos
 * `x-signature` (ts,v1) e `x-request-id`. Manifesto:
 *   id:{data.id};request-id:{x-request-id};ts:{ts};
 * HMAC-SHA256 com MP_WEBHOOK_SECRET.
 */
export function mpVerifyWebhook(input: {
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | null;
}): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // Sem secret cadastrado → aceita (modo sandbox inicial).
  if (!input.signatureHeader || !input.dataId) return false;
  const parts = Object.fromEntries(
    input.signatureHeader.split(",").map((p) => {
      const [k, ...v] = p.trim().split("=");
      return [k.trim(), v.join("=").trim()];
    }),
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;
  const manifest = `id:${input.dataId};request-id:${input.requestId ?? ""};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(v1, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export function mpStatusToOrder(
  status: string,
): "pending" | "approved" | "rejected" | "cancelled" | "expired" | "refunded" {
  switch (status) {
    case "approved":
      return "approved";
    case "in_process":
    case "pending":
    case "authorized":
      return "pending";
    case "rejected":
      return "rejected";
    case "cancelled":
      return "cancelled";
    case "refunded":
    case "charged_back":
      return "refunded";
    default:
      return "pending";
  }
}
