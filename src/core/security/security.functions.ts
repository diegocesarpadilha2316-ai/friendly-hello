import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";
import {
  auditEvent,
  computeHealth,
  getOrCreatePolicy,
  mapAttempt,
  mapAudit,
  mapDevice,
  mapIncident,
  mapMfa,
  mapSession,
  openIncident,
  revokeAllUserSessions,
  revokeSession,
} from "./manager.server";
import type { SecuritySnapshot } from "./types";

export const securitySnapshot = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<SecuritySnapshot> => {
    const s = context.supabase;
    const t = context.tenantId;
    const policy = await getOrCreatePolicy(s, t);
    const [sessions, devices, attempts, mfa, incidents, audit] = await Promise.all([
      s
        .from("security_sessions")
        .select("*")
        .eq("company_id", t)
        .order("last_seen_at", { ascending: false })
        .limit(200),
      s
        .from("security_devices")
        .select("*")
        .eq("company_id", t)
        .order("last_seen_at", { ascending: false })
        .limit(200),
      s
        .from("security_login_attempts")
        .select("*")
        .eq("company_id", t)
        .order("created_at", { ascending: false })
        .limit(200),
      s
        .from("security_mfa_factors")
        .select("*")
        .eq("company_id", t)
        .order("created_at", { ascending: false })
        .limit(200),
      s
        .from("security_incidents")
        .select("*")
        .eq("company_id", t)
        .order("created_at", { ascending: false })
        .limit(200),
      s
        .from("security_audit_log")
        .select("*")
        .eq("company_id", t)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    const sessionsList = (sessions.data ?? []).map(mapSession);
    const devicesList = (devices.data ?? []).map(mapDevice);
    const attemptsList = (attempts.data ?? []).map(mapAttempt);
    const mfaList = (mfa.data ?? []).map(mapMfa);
    const incidentsList = (incidents.data ?? []).map(mapIncident);
    const auditList = (audit.data ?? []).map(mapAudit);
    return {
      policy,
      sessions: sessionsList,
      devices: devicesList,
      loginAttempts: attemptsList,
      mfaFactors: mfaList,
      incidents: incidentsList,
      audit: auditList,
      health: computeHealth({
        sessions: sessionsList,
        devices: devicesList,
        incidents: incidentsList,
        attempts: attemptsList,
        mfa: mfaList,
        audit: auditList,
      }),
    };
  });

const policySchema = z.object({
  csp: z.string().min(1).max(4000),
  hstsMaxAge: z.number().int().min(0).max(63_072_000),
  frameOptions: z.enum(["DENY", "SAMEORIGIN"]),
  referrerPolicy: z.string().min(1).max(80),
  permissionsPolicy: z.string().max(600),
  corsAllowedOrigins: z.array(z.string().url()).max(50),
  csrfEnabled: z.boolean(),
  replayWindowSeconds: z.number().int().min(30).max(3600),
  bruteForceMaxAttempts: z.number().int().min(1).max(50),
  bruteForceLockoutMinutes: z.number().int().min(1).max(1440),
  sessionTtlMinutes: z
    .number()
    .int()
    .min(5)
    .max(43_200 * 2),
  requireMfa: z.boolean(),
  allowTotp: z.boolean(),
  allowPasskey: z.boolean(),
  allowBackupCodes: z.boolean(),
});

export const securityUpdatePolicy = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => policySchema.parse(raw))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("security_policies").upsert(
      {
        company_id: context.tenantId,
        csp: data.csp,
        hsts_max_age: data.hstsMaxAge,
        frame_options: data.frameOptions,
        referrer_policy: data.referrerPolicy,
        permissions_policy: data.permissionsPolicy,
        cors_allowed_origins: data.corsAllowedOrigins,
        csrf_enabled: data.csrfEnabled,
        replay_window_seconds: data.replayWindowSeconds,
        brute_force_max_attempts: data.bruteForceMaxAttempts,
        brute_force_lockout_minutes: data.bruteForceLockoutMinutes,
        session_ttl_minutes: data.sessionTtlMinutes,
        require_mfa: data.requireMfa,
        allow_totp: data.allowTotp,
        allow_passkey: data.allowPasskey,
        allow_backup_codes: data.allowBackupCodes,
        updated_by: context.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "company_id" },
    );
    if (error) throw new Error(error.message);
    await auditEvent(context.supabase, context.tenantId, {
      action: "security.policy.updated",
      actorId: context.userId,
      actorEmail: context.email,
      targetType: "policy",
    });
    return { ok: true as const };
  });

const sessionIdSchema = z.object({
  sessionId: z.string().uuid(),
  reason: z.string().max(200).optional(),
});

export const securityRevokeSession = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => sessionIdSchema.parse(raw))
  .handler(async ({ context, data }) => {
    await revokeSession(
      context.supabase,
      context.tenantId,
      data.sessionId,
      data.reason ?? "manual",
    );
    await auditEvent(context.supabase, context.tenantId, {
      action: "security.session.revoked",
      actorId: context.userId,
      actorEmail: context.email,
      targetType: "session",
      targetId: data.sessionId,
    });
    return { ok: true as const };
  });

const globalLogoutSchema = z.object({ userId: z.string().uuid().optional() });

export const securityGlobalLogout = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => globalLogoutSchema.parse(raw))
  .handler(async ({ context, data }): Promise<{ revoked: number }> => {
    const target = data.userId ?? context.userId;
    const n = await revokeAllUserSessions(
      context.supabase,
      context.tenantId,
      target,
      "global_logout",
    );
    await auditEvent(context.supabase, context.tenantId, {
      action: "security.session.global_logout",
      actorId: context.userId,
      actorEmail: context.email,
      targetType: "user",
      targetId: target,
      metadata: { revoked: n },
    });
    return { revoked: n };
  });

const deviceTrustSchema = z.object({ deviceId: z.string().uuid(), trusted: z.boolean() });

export const securitySetDeviceTrust = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => deviceTrustSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("security_devices")
      .update({ trusted: data.trusted })
      .eq("id", data.deviceId)
      .eq("company_id", context.tenantId);
    if (error) throw new Error(error.message);
    await auditEvent(context.supabase, context.tenantId, {
      action: data.trusted ? "security.device.trusted" : "security.device.untrusted",
      actorId: context.userId,
      actorEmail: context.email,
      targetType: "device",
      targetId: data.deviceId,
    });
    return { ok: true as const };
  });

const mfaEnrollSchema = z.object({
  method: z.enum(["totp", "webauthn", "passkey", "backup_codes"]),
  label: z.string().max(80).optional(),
});

export const securityEnrollMfa = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => mfaEnrollSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const policy = await getOrCreatePolicy(context.supabase, context.tenantId);
    if (data.method === "totp" && !policy.allowTotp)
      throw new Error("TOTP não habilitado pela política");
    if ((data.method === "passkey" || data.method === "webauthn") && !policy.allowPasskey)
      throw new Error("Passkey/WebAuthn não habilitado pela política");
    if (data.method === "backup_codes" && !policy.allowBackupCodes)
      throw new Error("Backup codes não habilitados pela política");
    const { data: row, error } = await context.supabase
      .from("security_mfa_factors")
      .insert({
        company_id: context.tenantId,
        user_id: context.userId,
        method: data.method,
        label: data.label ?? null,
        enabled: false,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await auditEvent(context.supabase, context.tenantId, {
      action: "security.mfa.enrolled",
      actorId: context.userId,
      actorEmail: context.email,
      targetType: "mfa",
      targetId: (row as { id: string }).id,
      metadata: { method: data.method },
    });
    return mapMfa(row as Record<string, unknown>);
  });

const mfaToggleSchema = z.object({ id: z.string().uuid(), enabled: z.boolean() });

export const securityToggleMfa = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => mfaToggleSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("security_mfa_factors")
      .update({
        enabled: data.enabled,
        verified_at: data.enabled ? new Date().toISOString() : null,
      })
      .eq("id", data.id)
      .eq("company_id", context.tenantId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    await auditEvent(context.supabase, context.tenantId, {
      action: data.enabled ? "security.mfa.enabled" : "security.mfa.disabled",
      actorId: context.userId,
      actorEmail: context.email,
      targetType: "mfa",
      targetId: data.id,
    });
    return { ok: true as const };
  });

const mfaDeleteSchema = z.object({ id: z.string().uuid() });

export const securityDeleteMfa = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => mfaDeleteSchema.parse(raw))
  .handler(async ({ context, data }) => {
    await context.supabase
      .from("security_mfa_factors")
      .delete()
      .eq("id", data.id)
      .eq("company_id", context.tenantId)
      .eq("user_id", context.userId);
    await auditEvent(context.supabase, context.tenantId, {
      action: "security.mfa.removed",
      actorId: context.userId,
      actorEmail: context.email,
      targetType: "mfa",
      targetId: data.id,
    });
    return { ok: true as const };
  });

const incidentCreateSchema = z.object({
  severity: z.enum(["low", "medium", "high", "critical"]),
  category: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const securityCreateIncident = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => incidentCreateSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const incident = await openIncident(context.supabase, context.tenantId, {
      severity: data.severity,
      category: data.category,
      title: data.title,
      description: data.description,
      userId: context.userId,
      metadata: data.metadata,
    });
    await auditEvent(context.supabase, context.tenantId, {
      action: "security.incident.opened",
      actorId: context.userId,
      actorEmail: context.email,
      targetType: "incident",
      targetId: incident.id,
    });
    return incident;
  });

const incidentStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "investigating", "resolved", "ignored"]),
});

export const securityUpdateIncident = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => incidentStatusSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("security_incidents")
      .update({
        status: data.status,
        resolved_at:
          data.status === "resolved" || data.status === "ignored" ? new Date().toISOString() : null,
      })
      .eq("id", data.id)
      .eq("company_id", context.tenantId);
    if (error) throw new Error(error.message);
    await auditEvent(context.supabase, context.tenantId, {
      action: "security.incident.updated",
      actorId: context.userId,
      actorEmail: context.email,
      targetType: "incident",
      targetId: data.id,
      metadata: { status: data.status },
    });
    return { ok: true as const };
  });
