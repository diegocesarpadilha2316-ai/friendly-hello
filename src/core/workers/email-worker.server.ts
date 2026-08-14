/**
 * Email worker — processa `notification_deliveries` do canal `email`.
 * Provedor: Resend (HTTP). Sem RESEND_API_KEY, marca `skipped` e
 * mantém pending com backoff — não bloqueia o pipeline.
 */
import { getSupabaseAdmin } from "@/core/lib/supabase/admin.server";

interface EmailRow {
  id: string;
  company_id: string;
  notification_id: string | null;
  target: string;
  attempts: number;
  max_attempts: number;
}

interface NotifRow {
  title: string | null;
  body: string | null;
  link: string | null;
  data: Record<string, unknown> | null;
  category: string | null;
}

export interface EmailTickResult {
  scanned: number;
  sent: number;
  failed: number;
  skipped: number;
}

const FROM = process.env.EMAIL_FROM ?? "Dioris <no-reply@dioris.app>";
const APP_URL = process.env.APP_URL ?? "https://dioris.app";

function fullLink(link: string | null | undefined): string {
  if (!link) return APP_URL;
  return `${APP_URL}${link.startsWith("/") ? link : `/${link}`}`;
}

function shell(inner: string, preheader?: string): string {
  const pre = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader)}</div>`
    : "";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#0b0b10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6e6f0">${pre}
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <div style="background:linear-gradient(135deg,#8B5CF6,#2563EB,#06B6D4);height:4px;border-radius:2px;margin-bottom:28px"></div>
    ${inner}
    <p style="margin-top:32px;font-size:12px;color:#6a6a7a;border-top:1px solid #1f1f2a;padding-top:16px">Dioris Hub · Inteligência que conecta tudo.<br/>Você recebeu este e-mail porque possui uma conta na Dioris.</p>
  </div></body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;padding:12px 20px;background:linear-gradient(135deg,#8B5CF6,#2563EB);color:#fff;text-decoration:none;border-radius:8px;font-weight:600">${escapeHtml(label)}</a>`;
}

function renderWelcome(n: NotifRow): string {
  const inner = `
    <h1 style="font-size:24px;margin:0 0 12px;color:#fff">Bem-vindo à Dioris 🎉</h1>
    <p style="font-size:15px;line-height:1.6;color:#c8c8d8;margin:0 0 20px">${escapeHtml(n.body ?? "Sua conta está pronta.")}</p>
    <ul style="font-size:14px;line-height:1.7;color:#c8c8d8;margin:0 0 24px;padding-left:18px">
      <li>100 créditos iniciais liberados</li>
      <li>Planner com IA, Render e Produção inclusos</li>
      <li>Suporte via /workspace/ajuda</li>
    </ul>
    ${button(fullLink(n.link ?? "/workspace"), "Acessar meu Workspace")}
  `;
  return shell(inner, "Sua conta Dioris está pronta com 100 créditos iniciais.");
}

function renderReceipt(n: NotifRow): string {
  const d = (n.data ?? {}) as Record<string, unknown>;
  const credits = Number(d.credits ?? 0);
  const amount = Number(d.amount ?? 0);
  const currency = String(d.currency ?? "BRL");
  const provider = String(d.provider ?? "—");
  const orderId = String(d.orderId ?? "");
  const amountFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(amount);
  const inner = `
    <h1 style="font-size:22px;margin:0 0 12px;color:#fff">Pagamento aprovado ✅</h1>
    <p style="font-size:15px;line-height:1.6;color:#c8c8d8;margin:0 0 20px">Obrigado! Recebemos seu pagamento e os créditos já estão disponíveis.</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;background:#12121b;border-radius:10px;overflow:hidden">
      <tr><td style="padding:12px 16px;color:#8a8a9a;font-size:13px;border-bottom:1px solid #1f1f2a">Valor</td><td style="padding:12px 16px;color:#fff;font-size:14px;text-align:right;border-bottom:1px solid #1f1f2a">${escapeHtml(amountFmt)}</td></tr>
      <tr><td style="padding:12px 16px;color:#8a8a9a;font-size:13px;border-bottom:1px solid #1f1f2a">Créditos</td><td style="padding:12px 16px;color:#fff;font-size:14px;text-align:right;border-bottom:1px solid #1f1f2a">${credits.toLocaleString("pt-BR")}</td></tr>
      <tr><td style="padding:12px 16px;color:#8a8a9a;font-size:13px;border-bottom:1px solid #1f1f2a">Método</td><td style="padding:12px 16px;color:#fff;font-size:14px;text-align:right;border-bottom:1px solid #1f1f2a">${escapeHtml(provider)}</td></tr>
      <tr><td style="padding:12px 16px;color:#8a8a9a;font-size:13px">Pedido</td><td style="padding:12px 16px;color:#fff;font-size:12px;text-align:right;font-family:ui-monospace,monospace">${escapeHtml(orderId.slice(0, 18))}</td></tr>
    </table>
    ${button(fullLink(n.link ?? "/workspace/creditos"), "Ver histórico de créditos")}
  `;
  return shell(inner, `Recibo Dioris — ${amountFmt} · ${credits} créditos`);
}

function renderLowCredits(n: NotifRow): string {
  const d = (n.data ?? {}) as Record<string, unknown>;
  const balance = Number(d.balance ?? 0);
  const inner = `
    <h1 style="font-size:22px;margin:0 0 12px;color:#fff">Seus créditos estão acabando ⚠️</h1>
    <p style="font-size:15px;line-height:1.6;color:#c8c8d8;margin:0 0 12px">${escapeHtml(n.body ?? "")}</p>
    <p style="font-size:14px;color:#c8c8d8;margin:0 0 24px">Saldo atual: <strong style="color:#fff">${balance.toLocaleString("pt-BR")} créditos</strong></p>
    ${button(fullLink(n.link ?? "/workspace/creditos"), "Recarregar agora")}
  `;
  return shell(inner, "Saldo de créditos baixo — recarregue para continuar.");
}

function renderGeneric(n: NotifRow): string {
  const title = escapeHtml(n.title ?? "Notificação Dioris");
  const body = escapeHtml(n.body ?? "");
  const inner = `
    <h1 style="font-size:22px;margin:0 0 12px;color:#fff">${title}</h1>
    <p style="font-size:15px;line-height:1.55;color:#c8c8d8;margin:0 0 24px">${body}</p>
    ${button(fullLink(n.link), "Acessar Dioris")}
  `;
  return shell(inner, n.title ?? undefined);
}

function renderHtml(n: NotifRow): string {
  const category = (n.category ?? "").toLowerCase();
  const d = (n.data ?? {}) as Record<string, unknown>;
  if (category === "onboarding") return renderWelcome(n);
  if (category === "billing" && d.orderId) return renderReceipt(n);
  if (category === "billing" && typeof d.balance === "number") return renderLowCredits(n);
  return renderGeneric(n);
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

async function sendViaResend(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ id: string }> {
  const key = process.env.RESEND_API_KEY!;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`resend_${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json().catch(() => ({}))) as { id?: string };
  return { id: json.id ?? "unknown" };
}

export async function tickEmailWorker(opts: { maxJobs?: number } = {}): Promise<EmailTickResult> {
  const admin = getSupabaseAdmin();
  const max = Math.max(1, Math.min(opts.maxJobs ?? 25, 100));
  const result: EmailTickResult = { scanned: 0, sent: 0, failed: 0, skipped: 0 };
  const hasKey = Boolean(process.env.RESEND_API_KEY);

  const nowIso = new Date().toISOString();
  const { data: rows, error } = await admin
    .from("notification_deliveries")
    .select("id, company_id, notification_id, target, attempts, max_attempts")
    .eq("channel", "email")
    .eq("status", "pending")
    .lte("next_attempt_at", nowIso)
    .order("next_attempt_at", { ascending: true })
    .limit(max);
  if (error) throw new Error(error.message);

  const pending = (rows ?? []) as EmailRow[];
  result.scanned = pending.length;

  for (const row of pending) {
    if (!hasKey) {
      // Sem provedor: adia 15min e conta como skipped. Não incrementa attempts.
      await admin
        .from("notification_deliveries")
        .update({
          next_attempt_at: new Date(Date.now() + 15 * 60_000).toISOString(),
          last_error: "email_provider_not_configured",
        })
        .eq("id", row.id);
      result.skipped++;
      continue;
    }

    let notif: NotifRow = { title: null, body: null, link: null, data: null, category: null };
    if (row.notification_id) {
      const { data: n } = await admin
        .from("notifications")
        .select("title, body, link, data, category")
        .eq("id", row.notification_id)
        .maybeSingle();
      if (n) notif = n as NotifRow;
    }
    const subject =
      (notif.data && typeof notif.data === "object" && "subject" in notif.data
        ? String((notif.data as Record<string, unknown>).subject ?? "")
        : "") ||
      notif.title ||
      "Notificação Dioris";

    try {
      const { id } = await sendViaResend({
        to: row.target,
        subject,
        html: renderHtml(notif),
      });
      await admin
        .from("notification_deliveries")
        .update({
          status: "sent",
          delivered_at: new Date().toISOString(),
          provider: "resend",
          provider_message_id: id,
          attempts: row.attempts + 1,
          last_error: null,
        })
        .eq("id", row.id);
      result.sent++;
    } catch (err) {
      const attempts = row.attempts + 1;
      const failed = attempts >= row.max_attempts;
      const backoffMin = Math.min(60, 2 ** attempts);
      await admin
        .from("notification_deliveries")
        .update({
          status: failed ? "failed" : "pending",
          attempts,
          last_error: err instanceof Error ? err.message : String(err),
          next_attempt_at: new Date(Date.now() + backoffMin * 60_000).toISOString(),
        })
        .eq("id", row.id);
      result.failed++;
    }
  }

  return result;
}
