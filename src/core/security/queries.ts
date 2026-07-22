import { queryOptions } from "@tanstack/react-query";
import { securitySnapshot } from "./security.functions";

export const securityKeys = {
  all: ["security"] as const,
  snapshot: () => [...securityKeys.all, "snapshot"] as const,
};

export const securitySnapshotQuery = () =>
  queryOptions({
    queryKey: securityKeys.snapshot(),
    queryFn: () => securitySnapshot(),
  });