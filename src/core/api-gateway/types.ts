export interface ApiKey {
  id: string;
  name: string;
  description: string | null;
  prefix: string;
  scopes: readonly string[];
  allowedIps: readonly string[];
  status: "active" | "revoked" | "expired";
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface ApiEndpoint {
  id: string;
  version: string;
  method: string;
  path: string;
  module: string;
  summary: string | null;
  scopes: readonly string[];
  deprecated: boolean;
  public: boolean;
}

export interface ApiRequestLog {
  id: string;
  method: string;
  path: string;
  version: string;
  status: number;
  durationMs: number;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  correlationId: string | null;
  error: string | null;
  apiKeyId: string | null;
  createdAt: string;
}

export interface ApiRateLimit {
  id: string;
  scope: "company" | "user" | "api_key" | "endpoint";
  scopeKey: string;
  windowSeconds: number;
  maxRequests: number;
}

export interface ApiQuota {
  id: string;
  period: "minute" | "hour" | "day" | "month";
  maxRequests: number;
  used: number;
  resetsAt: string;
}

export interface ApiWebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: readonly string[];
  active: boolean;
  createdAt: string;
}

export interface ApiWebhookDelivery {
  id: string;
  endpointId: string;
  event: string;
  status: "pending" | "delivered" | "failed" | "dead";
  attempts: number;
  statusCode: number | null;
  error: string | null;
  createdAt: string;
  deliveredAt: string | null;
}

export interface ApiGatewaySnapshot {
  keys: readonly ApiKey[];
  endpoints: readonly ApiEndpoint[];
  requests: readonly ApiRequestLog[];
  rateLimits: readonly ApiRateLimit[];
  quotas: readonly ApiQuota[];
  webhooks: readonly ApiWebhookEndpoint[];
  deliveries: readonly ApiWebhookDelivery[];
}
