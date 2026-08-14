import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";
import {
  computeHealth,
  mapBackup,
  mapHistory,
  mapIntegrity,
  mapPlan,
  mapRestore,
  mapSchedule,
  mapSnapshot,
  mapTarget,
  recordRestore,
} from "./manager.server";
import type { RecoverySnapshot } from "./types";

const slug = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9_.:-]+$/i, "slug inválido");
const idOnly = z.object({ id: z.string().uuid() });

export const recoverySnapshot = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<RecoverySnapshot> => {
    const s = context.supabase;
    const t = context.tenantId;
    const [targets, schedules, backups, snapshots, restores, integrity, plans, history] =
      await Promise.all([
        s.from("recovery_targets").select("*").eq("company_id", t).order("kind").limit(100),
        s
          .from("recovery_schedules")
          .select("*")
          .eq("company_id", t)
          .order("next_run_at")
          .limit(100),
        s
          .from("recovery_backups")
          .select("*")
          .eq("company_id", t)
          .order("created_at", { ascending: false })
          .limit(100),
        s
          .from("recovery_snapshots")
          .select("*")
          .eq("company_id", t)
          .order("created_at", { ascending: false })
          .limit(100),
        s
          .from("recovery_restores")
          .select("*")
          .eq("company_id", t)
          .order("created_at", { ascending: false })
          .limit(100),
        s
          .from("recovery_integrity")
          .select("*")
          .eq("company_id", t)
          .order("checked_at", { ascending: false })
          .limit(100),
        s
          .from("recovery_dr_plans")
          .select("*")
          .eq("company_id", t)
          .order("updated_at", { ascending: false })
          .limit(50),
        s
          .from("recovery_history")
          .select("*")
          .eq("company_id", t)
          .order("bucket_at", { ascending: false })
          .limit(120),
      ]);
    const ts = (targets.data ?? []).map(mapTarget);
    const sc = (schedules.data ?? []).map(mapSchedule);
    const bs = (backups.data ?? []).map(mapBackup);
    const rs = (restores.data ?? []).map(mapRestore);
    const pl = (plans.data ?? []).map(mapPlan);
    return {
      targets: ts,
      schedules: sc,
      backups: bs,
      snapshots: (snapshots.data ?? []).map(mapSnapshot),
      restores: rs,
      integrity: (integrity.data ?? []).map(mapIntegrity),
      plans: pl,
      history: (history.data ?? []).map(mapHistory),
      health: computeHealth({ targets: ts, schedules: sc, backups: bs, restores: rs, plans: pl }),
    };
  });

const targetSchema = z.object({
  id: z.string().uuid().optional(),
  slug,
  name: z.string().min(1).max(160),
  kind: z.enum([
    "database",
    "storage",
    "assets",
    "configuration",
    "sdk",
    "plugins",
    "cache",
    "logs",
    "events",
    "notifications",
  ]),
  destination: z
    .enum(["internal", "s3", "r2", "gcs", "azure_blob", "b2", "supabase_pitr"])
    .default("internal"),
  retentionDays: z.number().int().min(1).max(3650).default(30),
  encryption: z.string().min(1).max(40).default("aes256"),
  enabled: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const recoveryTargetUpsert = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => targetSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const payload = {
      company_id: context.tenantId,
      slug: data.slug,
      name: data.name,
      kind: data.kind,
      destination: data.destination,
      retention_days: data.retentionDays,
      encryption: data.encryption,
      enabled: data.enabled,
      metadata: data.metadata,
      updated_at: new Date().toISOString(),
    };
    const q = data.id
      ? context.supabase
          .from("recovery_targets")
          .update(payload)
          .eq("id", data.id)
          .eq("company_id", context.tenantId)
          .select("*")
          .single()
      : context.supabase
          .from("recovery_targets")
          .upsert(payload, { onConflict: "company_id,slug" })
          .select("*")
          .single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    return mapTarget(row as Record<string, unknown>);
  });

export const recoveryTargetDelete = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => idOnly.parse(raw))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("recovery_targets")
      .delete()
      .eq("company_id", context.tenantId)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

const scheduleSchema = z.object({
  id: z.string().uuid().optional(),
  targetId: z.string().uuid(),
  cron: z.string().min(1).max(120),
  strategy: z.enum(["full", "incremental", "differential"]).default("incremental"),
  enabled: z.boolean().default(true),
  nextRunAt: z.string().datetime().nullish(),
});

export const recoveryScheduleUpsert = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => scheduleSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const payload = {
      company_id: context.tenantId,
      target_id: data.targetId,
      cron: data.cron,
      strategy: data.strategy,
      enabled: data.enabled,
      next_run_at: data.nextRunAt ?? null,
      updated_at: new Date().toISOString(),
    };
    const q = data.id
      ? context.supabase
          .from("recovery_schedules")
          .update(payload)
          .eq("id", data.id)
          .eq("company_id", context.tenantId)
          .select("*")
          .single()
      : context.supabase.from("recovery_schedules").insert(payload).select("*").single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    return mapSchedule(row as Record<string, unknown>);
  });

export const recoveryScheduleDelete = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => idOnly.parse(raw))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("recovery_schedules")
      .delete()
      .eq("company_id", context.tenantId)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

const backupSchema = z.object({
  targetId: z.string().uuid().nullish(),
  targetSlug: slug,
  kind: z.enum([
    "database",
    "storage",
    "assets",
    "configuration",
    "sdk",
    "plugins",
    "cache",
    "logs",
    "events",
    "notifications",
  ]),
  strategy: z.enum(["full", "incremental", "differential"]).default("full"),
  trigger: z.enum(["manual", "scheduled", "event", "disaster"]).default("manual"),
  status: z
    .enum(["queued", "running", "completed", "failed", "verified", "expired", "cancelled"])
    .default("queued"),
  sizeBytes: z.number().int().nonnegative().nullish(),
  checksum: z.string().max(128).nullish(),
  storageUri: z.string().max(500).nullish(),
  parentBackupId: z.string().uuid().nullish(),
  correlationId: z.string().max(120).nullish(),
  expiresAt: z.string().datetime().nullish(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const recoveryBackupRecord = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => backupSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const now = new Date().toISOString();
    const finished =
      data.status === "completed" ||
      data.status === "verified" ||
      data.status === "failed" ||
      data.status === "cancelled";
    const { data: row, error } = await context.supabase
      .from("recovery_backups")
      .insert({
        company_id: context.tenantId,
        target_id: data.targetId ?? null,
        target_slug: data.targetSlug,
        kind: data.kind,
        strategy: data.strategy,
        trigger: data.trigger,
        status: data.status,
        size_bytes: data.sizeBytes ?? null,
        checksum: data.checksum ?? null,
        storage_uri: data.storageUri ?? null,
        parent_backup_id: data.parentBackupId ?? null,
        correlation_id: data.correlationId ?? null,
        expires_at: data.expiresAt ?? null,
        metadata: data.metadata,
        started_at: now,
        finished_at: finished ? now : null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapBackup(row as Record<string, unknown>);
  });

const snapshotSchema = z.object({
  backupId: z.string().uuid().nullish(),
  scope: z.enum(["tenant", "module", "table", "file"]).default("tenant"),
  target: z.string().min(1).max(200),
  version: z.string().max(60).nullish(),
  sizeBytes: z.number().int().nonnegative().nullish(),
  checksum: z.string().max(128).nullish(),
  storageUri: z.string().max(500).nullish(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const recoverySnapshotRecord = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => snapshotSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("recovery_snapshots")
      .insert({
        company_id: context.tenantId,
        backup_id: data.backupId ?? null,
        scope: data.scope,
        target: data.target,
        version: data.version ?? null,
        size_bytes: data.sizeBytes ?? null,
        checksum: data.checksum ?? null,
        storage_uri: data.storageUri ?? null,
        metadata: data.metadata,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapSnapshot(row as Record<string, unknown>);
  });

const restoreSchema = z.object({
  backupId: z.string().uuid().nullish(),
  snapshotId: z.string().uuid().nullish(),
  mode: z.enum(["full", "partial", "tenant", "pit", "snapshot"]),
  pointInTime: z.string().datetime().nullish(),
  targetScope: z.string().max(200).nullish(),
  correlationId: z.string().max(120).nullish(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const recoveryRestoreRun = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => restoreSchema.parse(raw))
  .handler(async ({ context, data }) => {
    return recordRestore(context.supabase, context.tenantId, {
      ...data,
      requestedBy: context.userId,
    });
  });

const integritySchema = z.object({
  backupId: z.string().uuid(),
  checkKind: z.enum(["checksum", "restore_test", "structural", "deep"]).default("checksum"),
  status: z.enum(["pass", "fail", "warn", "unknown"]),
  detail: z.string().max(2000).nullish(),
  durationMs: z.number().int().nonnegative().nullish(),
});

export const recoveryIntegrityRecord = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => integritySchema.parse(raw))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("recovery_integrity")
      .insert({
        company_id: context.tenantId,
        backup_id: data.backupId,
        check_kind: data.checkKind,
        status: data.status,
        detail: data.detail ?? null,
        duration_ms: data.durationMs ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    if (data.status === "pass") {
      await context.supabase
        .from("recovery_backups")
        .update({ status: "verified" })
        .eq("company_id", context.tenantId)
        .eq("id", data.backupId);
    }
    return mapIntegrity(row as Record<string, unknown>);
  });

const planSchema = z.object({
  id: z.string().uuid().optional(),
  slug,
  name: z.string().min(1).max(160),
  rtoMinutes: z
    .number()
    .int()
    .min(1)
    .max(1440 * 30)
    .default(60),
  rpoMinutes: z
    .number()
    .int()
    .min(1)
    .max(1440 * 30)
    .default(15),
  replication: z.enum(["none", "async", "sync", "multi_region"]).default("async"),
  failover: z.enum(["manual", "automatic", "warm_standby", "pilot_light"]).default("manual"),
  status: z.enum(["draft", "active", "testing", "failing", "archived"]).default("draft"),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const recoveryPlanUpsert = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => planSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const payload = {
      company_id: context.tenantId,
      slug: data.slug,
      name: data.name,
      rto_minutes: data.rtoMinutes,
      rpo_minutes: data.rpoMinutes,
      replication: data.replication,
      failover: data.failover,
      status: data.status,
      metadata: data.metadata,
      updated_at: new Date().toISOString(),
    };
    const q = data.id
      ? context.supabase
          .from("recovery_dr_plans")
          .update(payload)
          .eq("id", data.id)
          .eq("company_id", context.tenantId)
          .select("*")
          .single()
      : context.supabase
          .from("recovery_dr_plans")
          .upsert(payload, { onConflict: "company_id,slug" })
          .select("*")
          .single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    return mapPlan(row as Record<string, unknown>);
  });

export const recoveryPlanDelete = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => idOnly.parse(raw))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("recovery_dr_plans")
      .delete()
      .eq("company_id", context.tenantId)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const recoveryPlanDrill = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["success", "partial", "failed"]).default("success"),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("recovery_dr_plans")
      .update({
        last_drill_at: new Date().toISOString(),
        last_drill_status: data.status,
        status: data.status === "failed" ? "failing" : "active",
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", context.tenantId)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapPlan(row as Record<string, unknown>);
  });
