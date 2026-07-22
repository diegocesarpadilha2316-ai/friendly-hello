import { queryOptions } from "@tanstack/react-query";
import { recoverySnapshot } from "./recovery.functions";

export const recoveryKeys = {
  all: ["recovery"] as const,
  snapshot: () => [...recoveryKeys.all, "snapshot"] as const,
};

export const recoverySnapshotQuery = () =>
  queryOptions({
    queryKey: recoveryKeys.snapshot(),
    queryFn: () => recoverySnapshot(),
  });
