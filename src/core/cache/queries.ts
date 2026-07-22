import { queryOptions } from "@tanstack/react-query";
import { cacheSnapshot } from "./cache.functions";

export const cacheKeys = {
  all: ["cache"] as const,
  snapshot: () => [...cacheKeys.all, "snapshot"] as const,
};

export const cacheSnapshotQuery = () =>
  queryOptions({
    queryKey: cacheKeys.snapshot(),
    queryFn: () => cacheSnapshot(),
  });