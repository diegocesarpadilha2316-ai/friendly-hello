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

export type CreateApiKeyInput = {
  name: string;
  description?: string;
  scopes?: string[];
  allowedIps?: string[];
  expiresAt?: string;
};
export type RateLimitInput = {
  scope: "company" | "user" | "api_key" | "endpoint";
  scopeKey: string;
  windowSeconds?: number;
  maxRequests?: number;
};
export type QuotaInput = { period: "minute" | "hour" | "day" | "month"; maxRequests: number };
export type EndpointInput = {
  version?: string;
  method: string;
  path: string;
  module: string;
  summary?: string;
  scopes?: string[];
  public?: boolean;
  deprecated?: boolean;
};
export type WebhookInput = {
  id?: string;
  name: string;
  url: string;
  events?: string[];
  active?: boolean;
};

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
    mutationFn: (data: CreateApiKeyInput) => fn({ data } as never),
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
    mutationFn: (data: RateLimitInput) => fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}

export function useUpsertQuota() {
  const fn = useServerFn(apiQuotaUpsert);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: QuotaInput) => fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}

export function useRegisterEndpoint() {
  const fn = useServerFn(apiEndpointRegister);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: EndpointInput) => fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}

export function useUpsertWebhook() {
  const fn = useServerFn(apiWebhookUpsert);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: WebhookInput) => fn({ data } as never),
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