/**
 * Fase 1.17 — Segurança Avançada Enterprise
 * Contratos compartilhados por todo o ecossistema Dioris.
 */

export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "open" | "investigating" | "resolved" | "ignored";
export type LoginOutcome =
  | "success"
  | "invalid_credentials"
  | "locked"
  | "mfa_required"
  | "mfa_failed"
  | "suspicious";
export type MfaMethod = "totp" | "webauthn" | "passkey" | "backup_codes";

export interface SecurityPolicy {
  id: string;
  csp: string;
  hstsMaxAge: number;
  frameOptions: "DENY" | "SAMEORIGIN";
  contentTypeOptions: string;
  referrerPolicy: string;
  permissionsPolicy: string;
  corsAllowedOrigins: string[];
  csrfEnabled: boolean;
  replayWindowSeconds: number;
  bruteForceMaxAttempts: number;
  bruteForceLockoutMinutes: number;
  sessionTtlMinutes: number;
  requireMfa: boolean;
  allowTotp: boolean;
  allowPasskey: boolean;
  allowBackupCodes: boolean;
  updatedAt: string;
}

export interface SecuritySession {
  id: string;
  userId: string;
  deviceId: string | null;
  ip: string | null;
  userAgent: string | null;
  location: string | null;
  correlationId: string | null;
  active: boolean;
  revokedAt: string | null;
  revokedReason: string | null;
  lastSeenAt: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface SecurityDevice {
  id: string;
  userId: string;
  fingerprint: string;
  name: string | null;
  platform: string | null;
  trusted: boolean;
  lastIp: string | null;
  lastSeenAt: string;
  createdAt: string;
}

export interface SecurityLoginAttempt {
  id: string;
  email: string | null;
  userId: string | null;
  ip: string | null;
  userAgent: string | null;
  outcome: LoginOutcome;
  reason: string | null;
  createdAt: string;
}

export interface SecurityMfaFactor {
  id: string;
  userId: string;
  method: MfaMethod;
  label: string | null;
  enabled: boolean;
  verifiedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface SecurityIncident {
  id: string;
  severity: IncidentSeverity;
  category: string;
  title: string;
  description: string | null;
  userId: string | null;
  ip: string | null;
  status: IncidentStatus;
  createdAt: string;
  resolvedAt: string | null;
}

export interface SecurityAuditEntry {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  ip: string | null;
  userAgent: string | null;
  correlationId: string | null;
  createdAt: string;
}

export interface SecurityHealth {
  activeSessions: number;
  trustedDevices: number;
  openIncidents: number;
  failedLogins24h: number;
  mfaEnrollments: number;
  lastAuditAt: string | null;
}

export interface SecuritySnapshot {
  policy: SecurityPolicy;
  sessions: SecuritySession[];
  devices: SecurityDevice[];
  loginAttempts: SecurityLoginAttempt[];
  mfaFactors: SecurityMfaFactor[];
  incidents: SecurityIncident[];
  audit: SecurityAuditEntry[];
  health: SecurityHealth;
}