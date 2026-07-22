import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SecurityAuditEntry,
  SecurityDevice,
  SecurityHealth,
  SecurityIncident,
  SecurityLoginAttempt,
  SecurityMfaFactor,
  SecurityPolicy,
  SecuritySession,
} from "./types";

/**
 * SecurityManager (server-side)
 * Único ponto de acesso para políticas, sessões, brute-force,
 * auditoria e incidentes. Reutilizado por Auth, API Gateway,
 * Planner, Creator, CRM, Financeiro, Marketplace, Automação e IA.
 */

function mapPolicy(r: Record<string, unknown>): SecurityPolicy {
  return {
    id: String(r.id),
    csp: String(r.csp ?? ""),
    hstsMaxAge: Number(r.hsts_max_age ?? 31_536_000),
    frameOptions: (r.frame_options as "DENY" | "SAMEORIGIN") ?? "DENY",
    contentTypeOptions: String(r.content_type_options ?? "nosniff"),
    referrerPolicy: String(r.referrer_policy ?? "strict-origin-when-cross-origin"),
    permissionsPolicy: String(r.permissions_policy ?? ""),
    corsAllowedOrigins: (r.cors_allowed_origins as string[] | null) ?? [],
    csrfEnabled: Boolean(r.csrf_enabled ?? true),
    replayWindowSeconds: Number(r.replay_window_seconds ?? 300),
    bruteForceMaxAttempts: Number(r.brute_force_max_attempts ?? 5),
    bruteForceLockoutMinutes: Number(r.brute_force_lockout_minutes ?? 15),
    sessionTtlMinutes: Number(r.session_ttl_minutes ?? 43_200),
    requireMfa: Boolean(r.require_mfa ?? false),
    allowTotp: Boolean(r.allow_totp ?? true),
    allowPasskey: Boolean(r.allow_passkey ?? false),
    allowBackupCodes: Boolean(r.allow_backup_codes ?? true),
    updatedAt: String(r.updated_at ?? new Date().toISOString()),
  };
}

export async function getOrCreatePolicy(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<SecurityPolicy> {
  const { data } = await supabase
    .from("security_policies")
    .select("*")
    .eq("company_id", tenantId)
    .maybeSingle();
  if (data) return mapPolicy(data as Record<string, unknown>);
  const { data: created, error } = await supabase
    .from("security_policies")
    .insert({ company_id: tenantId })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapPolicy(created as Record<string, unknown>);
}

export async function auditEvent(
  supabase: SupabaseClient,
  tenantId: string,
  input: {
    action: string;
    actorId?: string | null;
    actorEmail?: string | null;
    targetType?: string | null;
    targetId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    correlationId?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await supabase.from("security_audit_log").insert({
    company_id: tenantId,
    action: input.action,
    actor_id: input.actorId ?? null,
    actor_email: input.actorEmail ?? null,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    ip: input.ip ?? null,
    user_agent: input.userAgent ?? null,
    correlation_id: input.correlationId ?? null,
    metadata: input.metadata ?? {},
  });
}

export async function recordLoginAttempt(
  supabase: SupabaseClient,
  input: {
    tenantId?: string | null;
    email?: string | null;
    userId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    outcome: SecurityLoginAttempt["outcome"];
    reason?: string;
  },
): Promise<void> {
  await supabase.from("security_login_attempts").insert({
    company_id: input.tenantId ?? null,
    email: input.email ?? null,
    user_id: input.userId ?? null,
    ip: input.ip ?? null,
    user_agent: input.userAgent ?? null,
    outcome: input.outcome,
    reason: input.reason ?? null,
  });
}

/** Verifica brute-force considerando a política do tenant. */
export async function isBruteForced(
  supabase: SupabaseClient,
  tenantId: string,
  email: string,
): Promise<{ locked: boolean; failed: number; retryAfterMs: number }> {
  const policy = await getOrCreatePolicy(supabase, tenantId);
  const windowStart = new Date(
    Date.now() - policy.bruteForceLockoutMinutes * 60_000,
  ).toISOString();
  const { data } = await supabase
    .from("security_login_attempts")
    .select("outcome, created_at")
    .eq("email", email)
    .gte("created_at", windowStart)
    .order("created_at", { ascending: false })
    .limit(50);
  const rows = (data as { outcome: string; created_at: string }[] | null) ?? [];
  const failed = rows.filter(
    (r) =>
      r.outcome === "invalid_credentials" ||
      r.outcome === "mfa_failed" ||
      r.outcome === "suspicious",
  ).length;
  const locked = failed >= policy.bruteForceMaxAttempts;
  const retryAfterMs = locked
    ? Math.max(
        0,
        new Date(rows[0]!.created_at).getTime() +
          policy.bruteForceLockoutMinutes * 60_000 -
          Date.now(),
      )
    : 0;
  return { locked, failed, retryAfterMs };
}

export async function revokeSession(
  supabase: SupabaseClient,
  tenantId: string,
  sessionId: string,
  reason: string,
): Promise<void> {
  await supabase
    .from("security_sessions")
    .update({
      active: false,
      revoked_at: new Date().toISOString(),
      revoked_reason: reason,
    })
    .eq("id", sessionId)
    .eq("company_id", tenantId);
}

export async function revokeAllUserSessions(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  reason: string,
): Promise<number> {
  const { data } = await supabase
    .from("security_sessions")
    .update({
      active: false,
      revoked_at: new Date().toISOString(),
      revoked_reason: reason,
    })
    .eq("company_id", tenantId)
    .eq("user_id", userId)
    .eq("active", true)
    .select("id");
  return (data as unknown[] | null)?.length ?? 0;
}

export async function openIncident(
  supabase: SupabaseClient,
  tenantId: string,
  input: {
    severity: SecurityIncident["severity"];
    category: string;
    title: string;
    description?: string;
    userId?: string | null;
    ip?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<SecurityIncident> {
  const { data, error } = await supabase
    .from("security_incidents")
    .insert({
      company_id: tenantId,
      severity: input.severity,
      category: input.category,
      title: input.title,
      description: input.description ?? null,
      user_id: input.userId ?? null,
      ip: input.ip ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapIncident(data as Record<string, unknown>);
}

export function mapSession(r: Record<string, unknown>): SecuritySession {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    deviceId: (r.device_id as string | null) ?? null,
    ip: (r.ip as string | null) ?? null,
    userAgent: (r.user_agent as string | null) ?? null,
    location: (r.location as string | null) ?? null,
    correlationId: (r.correlation_id as string | null) ?? null,
    active: Boolean(r.active),
    revokedAt: (r.revoked_at as string | null) ?? null,
    revokedReason: (r.revoked_reason as string | null) ?? null,
    lastSeenAt: String(r.last_seen_at),
    createdAt: String(r.created_at),
    expiresAt: (r.expires_at as string | null) ?? null,
  };
}

export function mapDevice(r: Record<string, unknown>): SecurityDevice {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    fingerprint: String(r.fingerprint),
    name: (r.name as string | null) ?? null,
    platform: (r.platform as string | null) ?? null,
    trusted: Boolean(r.trusted),
    lastIp: (r.last_ip as string | null) ?? null,
    lastSeenAt: String(r.last_seen_at),
    createdAt: String(r.created_at),
  };
}

export function mapAttempt(r: Record<string, unknown>): SecurityLoginAttempt {
  return {
    id: String(r.id),
    email: (r.email as string | null) ?? null,
    userId: (r.user_id as string | null) ?? null,
    ip: (r.ip as string | null) ?? null,
    userAgent: (r.user_agent as string | null) ?? null,
    outcome: r.outcome as SecurityLoginAttempt["outcome"],
    reason: (r.reason as string | null) ?? null,
    createdAt: String(r.created_at),
  };
}

export function mapMfa(r: Record<string, unknown>): SecurityMfaFactor {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    method: r.method as SecurityMfaFactor["method"],
    label: (r.label as string | null) ?? null,
    enabled: Boolean(r.enabled),
    verifiedAt: (r.verified_at as string | null) ?? null,
    lastUsedAt: (r.last_used_at as string | null) ?? null,
    createdAt: String(r.created_at),
  };
}

export function mapIncident(r: Record<string, unknown>): SecurityIncident {
  return {
    id: String(r.id),
    severity: r.severity as SecurityIncident["severity"],
    category: String(r.category),
    title: String(r.title),
    description: (r.description as string | null) ?? null,
    userId: (r.user_id as string | null) ?? null,
    ip: (r.ip as string | null) ?? null,
    status: r.status as SecurityIncident["status"],
    createdAt: String(r.created_at),
    resolvedAt: (r.resolved_at as string | null) ?? null,
  };
}

export function mapAudit(r: Record<string, unknown>): SecurityAuditEntry {
  return {
    id: String(r.id),
    actorId: (r.actor_id as string | null) ?? null,
    actorEmail: (r.actor_email as string | null) ?? null,
    action: String(r.action),
    targetType: (r.target_type as string | null) ?? null,
    targetId: (r.target_id as string | null) ?? null,
    ip: (r.ip as string | null) ?? null,
    userAgent: (r.user_agent as string | null) ?? null,
    correlationId: (r.correlation_id as string | null) ?? null,
    createdAt: String(r.created_at),
  };
}

export function computeHealth(input: {
  sessions: SecuritySession[];
  devices: SecurityDevice[];
  incidents: SecurityIncident[];
  attempts: SecurityLoginAttempt[];
  mfa: SecurityMfaFactor[];
  audit: SecurityAuditEntry[];
}): SecurityHealth {
  const dayAgo = Date.now() - 86_400_000;
  return {
    activeSessions: input.sessions.filter((s) => s.active).length,
    trustedDevices: input.devices.filter((d) => d.trusted).length,
    openIncidents: input.incidents.filter(
      (i) => i.status === "open" || i.status === "investigating",
    ).length,
    failedLogins24h: input.attempts.filter(
      (a) => a.outcome !== "success" && new Date(a.createdAt).getTime() >= dayAgo,
    ).length,
    mfaEnrollments: input.mfa.filter((m) => m.enabled).length,
    lastAuditAt: input.audit[0]?.createdAt ?? null,
  };
}