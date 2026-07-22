import type { AuditAction, AuditEntry, JsonRecord } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TenantContext = { supabase: any; tenantId: string; userId: string };

export interface AuditInput {
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  before?: JsonRecord | null;
  after?: JsonRecord | null;
  metadata?: JsonRecord;
  ip?: string | null;
  userAgent?: string | null;
  traceId?: string | null;
}

function diffOf(before?: JsonRecord | null, after?: JsonRecord | null): JsonRecord | null {
  if (!before && !after) return null;
  const b = before ?? {};
  const a = after ?? {};
  const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
  const out: JsonRecord = {};
  for (const k of keys) {
    if (JSON.stringify(b[k]) !== JSON.stringify(a[k])) {
      out[k] = { before: b[k] ?? null, after: a[k] ?? null };
    }
  }
  return Object.keys(out).length ? out : null;
}

export const Audit = {
  async record(ctx: TenantContext, input: AuditInput): Promise<void> {
    const { error } = await ctx.supabase.from("audit_logs").insert({
      company_id: ctx.tenantId,
      user_id: ctx.userId,
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId ?? null,
      before: input.before ?? null,
      after: input.after ?? null,
      diff: diffOf(input.before, input.after),
      metadata: input.metadata ?? {},
      ip: input.ip ?? null,
      user_agent: input.userAgent ?? null,
      trace_id: input.traceId ?? null,
    });
    if (error) throw new Error(error.message);
  },
};

export function mapAudit(row: Record<string, unknown>): AuditEntry {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    userId: (row.user_id as string) ?? null,
    action: row.action as AuditAction,
    entity: String(row.entity),
    entityId: (row.entity_id as string) ?? null,
    before: (row.before as JsonRecord) ?? null,
    after: (row.after as JsonRecord) ?? null,
    diff: (row.diff as JsonRecord) ?? null,
    metadata: (row.metadata as JsonRecord) ?? {},
    ip: (row.ip as string) ?? null,
    userAgent: (row.user_agent as string) ?? null,
    traceId: (row.trace_id as string) ?? null,
    createdAt: String(row.created_at),
  };
}