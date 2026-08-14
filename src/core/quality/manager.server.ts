import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  QualityCase,
  QualityCoverage,
  QualityGate,
  QualityHealth,
  QualityHistoryPoint,
  QualityRun,
  QualitySuite,
} from "./types";

/**
 * QualityManager (server-side)
 * Único ponto de acesso para suites, execuções, cobertura, quality gates
 * e histórico. Reutilizado por Auth, API Gateway, Planner, Creator, CRM,
 * Financeiro, Marketplace, Automação, IA e todos os módulos futuros.
 */

export function mapSuite(r: Record<string, unknown>): QualitySuite {
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    kind: r.kind as QualitySuite["kind"],
    runner: r.runner as QualitySuite["runner"],
    targetModule: (r.target_module as string | null) ?? null,
    enabled: Boolean(r.enabled),
    tags: (r.tags as string[] | null) ?? [],
    description: (r.description as string | null) ?? null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export function mapRun(r: Record<string, unknown>): QualityRun {
  return {
    id: String(r.id),
    suiteId: (r.suite_id as string | null) ?? null,
    suiteSlug: String(r.suite_slug),
    trigger: r.trigger as QualityRun["trigger"],
    status: r.status as QualityRun["status"],
    total: Number(r.total ?? 0),
    passed: Number(r.passed ?? 0),
    failed: Number(r.failed ?? 0),
    skipped: Number(r.skipped ?? 0),
    durationMs: (r.duration_ms as number | null) ?? null,
    coveragePct: r.coverage_pct == null ? null : Number(r.coverage_pct),
    correlationId: (r.correlation_id as string | null) ?? null,
    createdAt: String(r.created_at),
    completedAt: (r.completed_at as string | null) ?? null,
  };
}

export function mapCase(r: Record<string, unknown>): QualityCase {
  return {
    id: String(r.id),
    runId: String(r.run_id),
    name: String(r.name),
    file: (r.file as string | null) ?? null,
    status: r.status as QualityCase["status"],
    durationMs: (r.duration_ms as number | null) ?? null,
    error: (r.error as string | null) ?? null,
    createdAt: String(r.created_at),
  };
}

export function mapCoverage(r: Record<string, unknown>): QualityCoverage {
  return {
    id: String(r.id),
    runId: (r.run_id as string | null) ?? null,
    scope: r.scope as QualityCoverage["scope"],
    target: String(r.target),
    linesPct: Number(r.lines_pct ?? 0),
    branchesPct: Number(r.branches_pct ?? 0),
    functionsPct: Number(r.functions_pct ?? 0),
    statementsPct: Number(r.statements_pct ?? 0),
    createdAt: String(r.created_at),
  };
}

export function mapGate(r: Record<string, unknown>): QualityGate {
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    category: r.category as QualityGate["category"],
    threshold: r.threshold == null ? null : Number(r.threshold),
    status: r.status as QualityGate["status"],
    value: r.value == null ? null : Number(r.value),
    message: (r.message as string | null) ?? null,
    lastCheckedAt: (r.last_checked_at as string | null) ?? null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export function mapHistory(r: Record<string, unknown>): QualityHistoryPoint {
  return {
    id: String(r.id),
    bucketAt: String(r.bucket_at),
    runs: Number(r.runs ?? 0),
    passed: Number(r.passed ?? 0),
    failed: Number(r.failed ?? 0),
    coveragePct: r.coverage_pct == null ? null : Number(r.coverage_pct),
    gatesPass: Number(r.gates_pass ?? 0),
    gatesFail: Number(r.gates_fail ?? 0),
  };
}

/** Registra um run agregado + casos individuais em uma única transação lógica. */
export async function recordRun(
  supabase: SupabaseClient,
  tenantId: string,
  input: {
    suiteSlug: string;
    suiteId?: string | null;
    trigger: QualityRun["trigger"];
    status: QualityRun["status"];
    cases: {
      name: string;
      file?: string | null;
      status: QualityCase["status"];
      durationMs?: number | null;
      error?: string | null;
    }[];
    coveragePct?: number | null;
    durationMs?: number | null;
    correlationId?: string | null;
    metadata?: Record<string, string>;
  },
): Promise<QualityRun> {
  const total = input.cases.length;
  const passed = input.cases.filter((c) => c.status === "passed").length;
  const failed = input.cases.filter((c) => c.status === "failed").length;
  const skipped = input.cases.filter((c) => c.status === "skipped").length;
  const { data: run, error } = await supabase
    .from("quality_runs")
    .insert({
      company_id: tenantId,
      suite_id: input.suiteId ?? null,
      suite_slug: input.suiteSlug,
      trigger: input.trigger,
      status: input.status,
      total,
      passed,
      failed,
      skipped,
      duration_ms: input.durationMs ?? null,
      coverage_pct: input.coveragePct ?? null,
      correlation_id: input.correlationId ?? null,
      metadata: input.metadata ?? {},
      completed_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const runId = (run as { id: string }).id;
  if (total > 0) {
    await supabase.from("quality_cases").insert(
      input.cases.map((c) => ({
        company_id: tenantId,
        run_id: runId,
        name: c.name,
        file: c.file ?? null,
        status: c.status,
        duration_ms: c.durationMs ?? null,
        error: c.error ?? null,
      })),
    );
  }
  return mapRun(run as Record<string, unknown>);
}

export function computeHealth(input: {
  suites: QualitySuite[];
  runs: QualityRun[];
  gates: QualityGate[];
  coverage: QualityCoverage[];
}): QualityHealth {
  const totalRuns = input.runs.length;
  const passedRuns = input.runs.filter((r) => r.status === "passed").length;
  const passRate = totalRuns === 0 ? 100 : Math.round((passedRuns / totalRuns) * 100);
  const durations = input.runs
    .map((r) => r.durationMs)
    .filter((n): n is number => typeof n === "number");
  const avgDurationMs =
    durations.length === 0
      ? 0
      : Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  const total = input.coverage.find((c) => c.scope === "total");
  const coveragePct = total
    ? Number(total.linesPct)
    : input.coverage.length === 0
      ? 0
      : Math.round(input.coverage.reduce((a, c) => a + c.linesPct, 0) / input.coverage.length);
  return {
    totalSuites: input.suites.length,
    enabledSuites: input.suites.filter((s) => s.enabled).length,
    totalRuns,
    passRate,
    avgDurationMs,
    coveragePct,
    gatesPass: input.gates.filter((g) => g.status === "pass").length,
    gatesFail: input.gates.filter((g) => g.status === "fail").length,
    lastRunAt: input.runs[0]?.createdAt ?? null,
  };
}
