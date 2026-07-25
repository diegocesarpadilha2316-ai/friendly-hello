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
}

export interface EmailTickResult {
  scanned: number;
  sent: number;
  failed: number;
  skipped: number;
}

const FROM = process.env.EMAIL_FROM ?? "Dioris <no-reply@dioris.app>";
const APP_URL = process.env.APP_URL ?? "https://dioris.app";

function renderHtml(n: NotifRow): string {
  const title = escapeHtml(n.title ?? "Notificação Dioris");
  const body = escapeHtml(n.body ?? "");
  const link = n.link ? `${APP_URL}${n.link.startsWith("/") ? n.link : `/${n.link}`}` : APP_URL;
  return `<!doctype html><html><body style="margin:0;padding:0;background:#0b0b10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6e6f0">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <div style="background:linear-gradient(135deg,#8B5CF6,#2563EB,#06B6D4);height:4px;border-radius:2px;margin-bottom:24px"></div>
    <h1 style="font-size:22px;margin:0 0 12px;color:#fff">${title}</h1>
    <p style="font-size:15px;line-height:1.55;color:#c8c8d8;margin:0 0 24px">${body}</p>
    <a href="${link}" style="display:inline-block;padding:12px 20px;background:linear-gradient(135deg,#8B5CF6,#2563EB);color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Acessar Dioris</a>
    <p style="margin-top:32px;font-size:12px;color:#6a6a7a">Dioris Hub · Inteligência que conecta tudo.</p>
  </div></body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
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

    let notif: NotifRow = { title: null, body: null, link: null, data: null };
    if (row.notification_id) {
      const { data: n } = await admin
        .from("notifications")
        .select("title, body, link, data")
        .eq("id", row.notification_id)
        .maybeSingle();
      if (n) notif = n as NotifRow;
    }
    const subject =
      (notif.data && typeof notif.data === "object" && "subject" in notif.data
        ? String((notif.data as Record<string, unknown>).subject ?? "")
        : "") || notif.title || "Notificação Dioris";

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