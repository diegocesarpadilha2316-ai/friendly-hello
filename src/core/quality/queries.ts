import { queryOptions } from "@tanstack/react-query";
import { qualitySnapshot } from "./quality.functions";

export const qualityKeys = {
  all: ["quality"] as const,
  snapshot: () => [...qualityKeys.all, "snapshot"] as const,
};

export const qualitySnapshotQuery = () =>
  queryOptions({
    queryKey: qualityKeys.snapshot(),
    queryFn: () => qualitySnapshot(),
  });
