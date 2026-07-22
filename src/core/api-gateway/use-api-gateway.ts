import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  apiEndpointRegister,
  apiKeyCreate,
  apiKeyRevoke,
  apiKeyRotate,
  apiOpenApiExport,
  apiQuotaUpsert,
  apiRateLimitUpsert,
  apiWebhookDelete,
  apiWebhookUpsert,
} from "./api-gateway.functions";
import { apiGatewayKeys, apiGatewaySnapshotQuery } from "./queries";

export function useApiGatewaySnapshot() {
  return useSuspenseQuery(apiGatewaySnapshotQuery());
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: apiGatewayKeys.all });
}

export function useCreateApiKey() {
  const fn = useServerFn(apiKeyCreate);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: Parameters<typeof fn>[0] extends { data: infer D } ? D : never) =>
      fn({ data }),
    onSuccess: () => invalidate(),
  });
}

export function useRevokeApiKey() {
  const fn = useServerFn(apiKeyRevoke);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => invalidate(),
  });
}

export function useRotateApiKey() {
  const fn = useServerFn(apiKeyRotate);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => invalidate(),
  });
}

export function useUpsertRateLimit() {
  const fn = useServerFn(apiRateLimitUpsert);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: Parameters<typeof fn>[0] extends { data: infer D } ? D : never) =>
      fn({ data }),
    onSuccess: () => invalidate(),
  });
}

export function useUpsertQuota() {
  const fn = useServerFn(apiQuotaUpsert);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: Parameters<typeof fn>[0] extends { data: infer D } ? D : never) =>
      fn({ data }),
    onSuccess: () => invalidate(),
  });
}

export function useRegisterEndpoint() {
  const fn = useServerFn(apiEndpointRegister);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: Parameters<typeof fn>[0] extends { data: infer D } ? D : never) =>
      fn({ data }),
    onSuccess: () => invalidate(),
  });
}

export function useUpsertWebhook() {
  const fn = useServerFn(apiWebhookUpsert);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: Parameters<typeof fn>[0] extends { data: infer D } ? D : never) =>
      fn({ data }),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteWebhook() {
  const fn = useServerFn(apiWebhookDelete);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => invalidate(),
  });
}

export function useExportOpenApi() {
  const fn = useServerFn(apiOpenApiExport);
  return useMutation({
    mutationFn: (format: "json" | "yaml") => fn({ data: { format } }),
  });
}