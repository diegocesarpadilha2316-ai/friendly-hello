/**
 * Notify — enfileira notificações in-app e (opcionalmente) e-mail.
 * A entrega efetiva de e-mail acontece via provedor externo quando
 * configurado; enquanto isso, `notification_deliveries` permanece
 * `pending` para ser processado pelo worker futuro.
 */
import { getSupabaseAdmin } from "@/core/lib/supabase/admin.server";

export type NotifyPriority = "low" | "normal" | "high" | "critical";

export interface NotifyInput {
  companyId: string;
  userId?: string | null;
  category?: string;
  priority?: NotifyPriority;
  title: string;
  body?: string;
  link?: string;
  icon?: string;
  data?: Record<string, unknown>;
  email?: {
    to: string;
    subject?: string;
  } | null;
}

export async function notify(input: NotifyInput): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    const { data: notif, error } = await admin
      .from("notifications")
      .insert({
        company_id: input.companyId,
        user_id: input.userId ?? null,
        category: input.category ?? "geral",
        priority: input.priority ?? "normal",
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
        icon: input.icon ?? null,
        data: input.data ?? {},
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw error;

    if (input.email?.to) {
      await admin.from("notification_deliveries").insert({
        company_id: input.companyId,
        notification_id: notif.id,
        channel: "email",
        target: input.email.to,
        status: "pending",
      });
    }
  } catch (err) {
    console.error("[notify] failed", err);
  }
}

/** Boas-vindas — chamado após provisionamento inicial da empresa. */
export async function notifyWelcome(params: {
  companyId: string;
  userId: string;
  email?: string | null;
  companyName?: string | null;
}): Promise<void> {
  await notify({
    companyId: params.companyId,
    userId: params.userId,
    category: "onboarding",
    priority: "normal",
    title: `Bem-vindo à Dioris${params.companyName ? `, ${params.companyName}` : ""}`,
    body: "Sua conta foi provisionada com o plano Free e 100 créditos iniciais. Explore o Planner para começar seu primeiro projeto.",
    link: "/workspace",
    icon: "sparkles",
    email: params.email ? { to: params.email, subject: "Bem-vindo à Dioris" } : null,
  });
}

/** Alerta de crédito baixo — chamado após débito quando saldo ficar < threshold. */
export async function notifyLowCredits(params: {
  companyId: string;
  userId?: string | null;
  balance: number;
  threshold: number;
}): Promise<void> {
  await notify({
    companyId: params.companyId,
    userId: params.userId ?? null,
    category: "billing",
    priority: "high",
    title: "Saldo de créditos baixo",
    body: `Você tem ${params.balance} créditos restantes (limite ${params.threshold}). Recarregue para continuar usando IA, render e vídeo.`,
    link: "/workspace/creditos",
    icon: "alert-triangle",
  });
}

/** Recibo de pagamento — chamado quando um pedido é aprovado. */
export async function notifyPaymentApproved(params: {
  companyId: string;
  userId?: string | null;
  email?: string | null;
  credits: number;
  amount: number;
  currency?: string;
  provider: string;
  orderId: string;
  packKey?: string | null;
}): Promise<void> {
  const currency = params.currency ?? "BRL";
  const amountFmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(params.amount);
  await notify({
    companyId: params.companyId,
    userId: params.userId ?? null,
    category: "billing",
    priority: "normal",
    title: `Pagamento aprovado — ${amountFmt}`,
    body: `Recebemos seu pagamento via ${params.provider}. ${params.credits} créditos foram adicionados à sua conta.`,
    link: "/workspace/creditos",
    icon: "check-circle",
    data: {
      subject: `Recibo Dioris — ${amountFmt}`,
      orderId: params.orderId,
      credits: params.credits,
      amount: params.amount,
      currency,
      provider: params.provider,
      packKey: params.packKey ?? null,
    },
    email: params.email ? { to: params.email, subject: `Recibo Dioris — ${amountFmt}` } : null,
  });
}
