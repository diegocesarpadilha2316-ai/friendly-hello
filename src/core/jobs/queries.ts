import { queryOptions } from "@tanstack/react-query";
import { jobsSnapshot } from "./job.functions";

export const jobsKeys = {
  all: ["jobs"] as const,
  snapshot: () => [...jobsKeys.all, "snapshot"] as const,
};

export const jobsSnapshotQuery = () =>
  queryOptions({
    queryKey: jobsKeys.snapshot(),
    queryFn: () => jobsSnapshot(),
  });
