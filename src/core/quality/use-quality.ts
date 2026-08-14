import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  qualityCoverageRecord,
  qualityGateDelete,
  qualityGateUpsert,
  qualityRunRecord,
  qualitySuiteDelete,
  qualitySuiteUpsert,
} from "./quality.functions";
import { qualityKeys, qualitySnapshotQuery } from "./queries";
import type {
  CaseStatus,
  CoverageScope,
  GateCategory,
  GateStatus,
  RunStatus,
  RunTrigger,
  SuiteKind,
  SuiteRunner,
} from "./types";

export function useQualitySnapshot() {
  return useSuspenseQuery(qualitySnapshotQuery());
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: qualityKeys.all });
}

export type SuiteInput = {
  id?: string;
  slug: string;
  name: string;
  kind: SuiteKind;
  runner?: SuiteRunner;
  targetModule?: string;
  enabled?: boolean;
  tags?: string[];
  description?: string;
};

export function useUpsertSuite() {
  const fn = useServerFn(qualitySuiteUpsert);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: SuiteInput) => fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteSuite() {
  const fn = useServerFn(qualitySuiteDelete);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => invalidate(),
  });
}

export type RunInput = {
  suiteSlug: string;
  suiteId?: string | null;
  trigger?: RunTrigger;
  status?: Exclude<RunStatus, "queued" | "running">;
  durationMs?: number | null;
  coveragePct?: number | null;
  correlationId?: string | null;
  metadata?: Record<string, string>;
  cases: {
    name: string;
    file?: string | null;
    status: CaseStatus;
    durationMs?: number | null;
    error?: string | null;
  }[];
};

export function useRecordRun() {
  const fn = useServerFn(qualityRunRecord);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: RunInput) => fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}

export type CoverageInput = {
  runId?: string | null;
  scope: CoverageScope;
  target: string;
  linesPct: number;
  branchesPct?: number;
  functionsPct?: number;
  statementsPct?: number;
};

export function useRecordCoverage() {
  const fn = useServerFn(qualityCoverageRecord);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: CoverageInput) => fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}

export type GateInput = {
  id?: string;
  slug: string;
  name: string;
  category: GateCategory;
  threshold?: number | null;
  status?: GateStatus;
  value?: number | null;
  message?: string | null;
};

export function useUpsertGate() {
  const fn = useServerFn(qualityGateUpsert);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: GateInput) => fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteGate() {
  const fn = useServerFn(qualityGateDelete);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => invalidate(),
  });
}
