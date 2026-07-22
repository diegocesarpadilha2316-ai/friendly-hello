import { queryOptions } from "@tanstack/react-query";
import { cicdSnapshot } from "./cicd.functions";

export const cicdKeys = {
  all: ["cicd"] as const,
  snapshot: () => [...cicdKeys.all, "snapshot"] as const,
};

export const cicdSnapshotQuery = () =>
  queryOptions({
    queryKey: cicdKeys.snapshot(),
    queryFn: () => cicdSnapshot(),
  });
