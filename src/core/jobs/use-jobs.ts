import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  cronDelete,
  cronUpsert,
  deadLetterRequeue,
  jobCancel,
  jobEnqueue,
  jobPause,
  jobResume,
  jobsExport,
  queueUpsert,
  schedulerTick,
} from "./job.functions";
import { jobsKeys, jobsSnapshotQuery } from "./queries";

export function useJobsSnapshot() {
  return useSuspenseQuery(jobsSnapshotQuery());
}

export function useJobsSnapshotQuery() {
  return useQuery(jobsSnapshotQuery());
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: jobsKeys.all });
}

export function useEnqueueJob() {
  const fn = useServerFn(jobEnqueue);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: Parameters<typeof fn>[0] extends { data: infer D } ? D : never) =>
      fn({ data }),
    onSuccess: () => invalidate(),
  });
}

export function useCancelJob() {
  const fn = useServerFn(jobCancel);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => invalidate(),
  });
}

export function usePauseJob() {
  const fn = useServerFn(jobPause);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => invalidate(),
  });
}

export function useResumeJob() {
  const fn = useServerFn(jobResume);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => invalidate(),
  });
}

export function useQueueUpsert() {
  const fn = useServerFn(queueUpsert);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: Parameters<typeof fn>[0] extends { data: infer D } ? D : never) =>
      fn({ data }),
    onSuccess: () => invalidate(),
  });
}

export function useCronUpsert() {
  const fn = useServerFn(cronUpsert);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: Parameters<typeof fn>[0] extends { data: infer D } ? D : never) =>
      fn({ data }),
    onSuccess: () => invalidate(),
  });
}

export function useCronDelete() {
  const fn = useServerFn(cronDelete);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => invalidate(),
  });
}

export function useSchedulerTick() {
  const fn = useServerFn(schedulerTick);
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: () => fn(), onSuccess: () => invalidate() });
}

export function useRequeueDeadLetter() {
  const fn = useServerFn(deadLetterRequeue);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => invalidate(),
  });
}

export function useExportJobs() {
  const fn = useServerFn(jobsExport);
  return useMutation({
    mutationFn: (format: "json" | "csv") => fn({ data: { format } }),
  });
}
