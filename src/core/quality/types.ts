/**
 * Fase 1.18 — Testes Automatizados & Qualidade Enterprise
 * Contratos compartilhados por todo o ecossistema Dioris.
 */

export type SuiteKind =
  | "unit"
  | "integration"
  | "e2e"
  | "component"
  | "server_fn"
  | "api"
  | "performance"
  | "load"
  | "security"
  | "regression"
  | "smoke";

export type SuiteRunner =
  | "vitest"
  | "playwright"
  | "cypress"
  | "lighthouse"
  | "k6"
  | "zap"
  | "custom";

export type RunStatus =
  | "queued"
  | "running"
  | "passed"
  | "failed"
  | "skipped"
  | "error"
  | "cancelled";

export type RunTrigger = "manual" | "ci" | "cron" | "event" | "webhook" | "regression";

export type CaseStatus = "passed" | "failed" | "skipped" | "todo";

export type CoverageScope = "file" | "module" | "feature" | "tenant" | "total";

export type GateCategory =
  | "typescript"
  | "eslint"
  | "build"
  | "imports"
  | "circular"
  | "duplication"
  | "dead_code"
  | "complexity"
  | "performance"
  | "security"
  | "coverage";

export type GateStatus = "pass" | "warn" | "fail" | "unknown";

export interface QualitySuite {
  id: string;
  slug: string;
  name: string;
  kind: SuiteKind;
  runner: SuiteRunner;
  targetModule: string | null;
  enabled: boolean;
  tags: string[];
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QualityRun {
  id: string;
  suiteId: string | null;
  suiteSlug: string;
  trigger: RunTrigger;
  status: RunStatus;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number | null;
  coveragePct: number | null;
  correlationId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  completedAt: string | null;
}

export interface QualityCase {
  id: string;
  runId: string;
  name: string;
  file: string | null;
  status: CaseStatus;
  durationMs: number | null;
  error: string | null;
  createdAt: string;
}

export interface QualityCoverage {
  id: string;
  runId: string | null;
  scope: CoverageScope;
  target: string;
  linesPct: number;
  branchesPct: number;
  functionsPct: number;
  statementsPct: number;
  createdAt: string;
}

export interface QualityGate {
  id: string;
  slug: string;
  name: string;
  category: GateCategory;
  threshold: number | null;
  status: GateStatus;
  value: number | null;
  message: string | null;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QualityHistoryPoint {
  id: string;
  bucketAt: string;
  runs: number;
  passed: number;
  failed: number;
  coveragePct: number | null;
  gatesPass: number;
  gatesFail: number;
}

export interface QualityHealth {
  totalSuites: number;
  enabledSuites: number;
  totalRuns: number;
  passRate: number;
  avgDurationMs: number;
  coveragePct: number;
  gatesPass: number;
  gatesFail: number;
  lastRunAt: string | null;
}

export interface QualitySnapshot {
  suites: QualitySuite[];
  runs: QualityRun[];
  cases: QualityCase[];
  coverage: QualityCoverage[];
  gates: QualityGate[];
  history: QualityHistoryPoint[];
  health: QualityHealth;
}