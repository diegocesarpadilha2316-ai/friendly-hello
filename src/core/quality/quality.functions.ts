import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";
import {
  computeHealth,
  mapCase,
  mapCoverage,
  mapGate,
  mapHistory,
  mapRun,
  mapSuite,
  recordRun,
} from "./manager.server";
import type { QualityRun, QualitySnapshot } from "./types";

export const qualitySnapshot = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<QualitySnapshot> => {
    const s = context.supabase;
    const t = context.tenantId;
    const [suites, runs, cases, coverage, gates, history] = await Promise.all([
      s.from("quality_suites").select("*").eq("company_id", t).order("updated_at", { ascending: false }).limit(200),
      s.from("quality_runs").select("*").eq("company_id", t).order("created_at", { ascending: false }).limit(100),
      s.from("quality_cases").select("*").eq("company_id", t).order("created_at", { ascending: false }).limit(500),
      s.from("quality_coverage").select("*").eq("company_id", t).order("created_at", { ascending: false }).limit(200),
      s.from("quality_gates").select("*").eq("company_id", t).order("category").limit(200),
      s.from("quality_history").select("*").eq("company_id", t).order("bucket_at", { ascending: false }).limit(120),
    ]);
    const suiteList = (suites.data ?? []).map(mapSuite);
    const runList = (runs.data ?? []).map(mapRun);
    const coverageList = (coverage.data ?? []).map(mapCoverage);
    const gateList = (gates.data ?? []).map(mapGate);
    return {
      suites: suiteList,
      runs: runList,
      cases: (cases.data ?? []).map(mapCase),
      coverage: coverageList,
      gates: gateList,
      history: (history.data ?? []).map(mapHistory),
      health: computeHealth({ suites: suiteList, runs: runList, gates: gateList, coverage: coverageList }),
    };
  });

const suiteSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9_.:-]+$/i, "slug inválido"),
  name: z.string().min(1).max(160),
  kind: z.enum(["unit","integration","e2e","component","server_fn","api","performance","load","security","regression","smoke"]),
  runner: z.enum(["vitest","playwright","cypress","lighthouse","k6","zap","custom"]).default("vitest"),
  targetModule: z.string().max(120).optional(),
  enabled: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  description: z.string().max(500).optional(),
});

export const qualitySuiteUpsert = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => suiteSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const payload = {
      company_id: context.tenantId,
      slug: data.slug,
      name: data.name,
      kind: data.kind,
      runner: data.runner,
      target_module: data.targetModule ?? null,
      enabled: data.enabled,
      tags: data.tags,
      description: data.description ?? null,
      updated_at: new Date().toISOString(),
    };
    const q = data.id
      ? context.supabase.from("quality_suites").update(payload).eq("id", data.id).eq("company_id", context.tenantId).select("*").single()
      : context.supabase.from("quality_suites").upsert(payload, { onConflict: "company_id,slug" }).select("*").single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    return mapSuite(row as Record<string, unknown>);
  });

const idSchema = z.object({ id: z.string().uuid() });

export const qualitySuiteDelete = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => idSchema.parse(raw))
  .handler(async ({ context, data }) => {
    await context.supabase.from("quality_suites").delete().eq("id", data.id).eq("company_id", context.tenantId);
    return { ok: true as const };
  });

const runSchema = z.object({
  suiteSlug: z.string().min(1),
  suiteId: z.string().uuid().nullish(),
  trigger: z.enum(["manual","ci","cron","event","webhook","regression"]).default("manual"),
  status: z.enum(["passed","failed","skipped","error","cancelled"]).default("passed"),
  durationMs: z.number().int().min(0).nullish(),
  coveragePct: z.number().min(0).max(100).nullish(),
  correlationId: z.string().max(120).nullish(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  cases: z.array(z.object({
    name: z.string().min(1).max(240),
    file: z.string().max(300).nullish(),
    status: z.enum(["passed","failed","skipped","todo"]),
    durationMs: z.number().int().min(0).nullish(),
    error: z.string().max(2000).nullish(),
  })).default([]),
});

export const qualityRunRecord = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => runSchema.parse(raw))
  .handler(async ({ context, data }): Promise<QualityRun> => {
    return recordRun(context.supabase, context.tenantId, {
      suiteSlug: data.suiteSlug,
      suiteId: data.suiteId ?? null,
      trigger: data.trigger,
      status: data.status,
      cases: data.cases,
      coveragePct: data.coveragePct ?? null,
      durationMs: data.durationMs ?? null,
      correlationId: data.correlationId ?? null,
      metadata: data.metadata,
    });
  });

const coverageSchema = z.object({
  runId: z.string().uuid().nullish(),
  scope: z.enum(["file","module","feature","tenant","total"]),
  target: z.string().min(1).max(200),
  linesPct: z.number().min(0).max(100),
  branchesPct: z.number().min(0).max(100).default(0),
  functionsPct: z.number().min(0).max(100).default(0),
  statementsPct: z.number().min(0).max(100).default(0),
});

export const qualityCoverageRecord = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => coverageSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("quality_coverage")
      .insert({
        company_id: context.tenantId,
        run_id: data.runId ?? null,
        scope: data.scope,
        target: data.target,
        lines_pct: data.linesPct,
        branches_pct: data.branchesPct,
        functions_pct: data.functionsPct,
        statements_pct: data.statementsPct,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapCoverage(row as Record<string, unknown>);
  });

const gateSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9_.:-]+$/i, "slug inválido"),
  name: z.string().min(1).max(160),
  category: z.enum(["typescript","eslint","build","imports","circular","duplication","dead_code","complexity","performance","security","coverage"]),
  threshold: z.number().nullish(),
  status: z.enum(["pass","warn","fail","unknown"]).default("unknown"),
  value: z.number().nullish(),
  message: z.string().max(500).nullish(),
});

export const qualityGateUpsert = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => gateSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const payload = {
      company_id: context.tenantId,
      slug: data.slug,
      name: data.name,
      category: data.category,
      threshold: data.threshold ?? null,
      status: data.status,
      value: data.value ?? null,
      message: data.message ?? null,
      last_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const q = data.id
      ? context.supabase.from("quality_gates").update(payload).eq("id", data.id).eq("company_id", context.tenantId).select("*").single()
      : context.supabase.from("quality_gates").upsert(payload, { onConflict: "company_id,slug" }).select("*").single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    return mapGate(row as Record<string, unknown>);
  });

export const qualityGateDelete = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => idSchema.parse(raw))
  .handler(async ({ context, data }) => {
    await context.supabase.from("quality_gates").delete().eq("id", data.id).eq("company_id", context.tenantId);
    return { ok: true as const };
  });