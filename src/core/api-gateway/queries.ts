import { queryOptions } from "@tanstack/react-query";
import { apiGatewaySnapshot } from "./api-gateway.functions";

export const apiGatewayKeys = {
  all: ["api-gateway"] as const,
  snapshot: () => [...apiGatewayKeys.all, "snapshot"] as const,
};

export const apiGatewaySnapshotQuery = () =>
  queryOptions({
    queryKey: apiGatewayKeys.snapshot(),
    queryFn: () => apiGatewaySnapshot(),
  });
