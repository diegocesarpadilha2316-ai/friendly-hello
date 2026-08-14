// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonRecord = Record<string, any>;

export type IntegrationAuthType = "oauth2" | "oidc" | "api_key" | "bearer" | "basic" | "jwt";

export type IntegrationCategory =
  | "storage"
  | "payments"
  | "ai"
  | "messaging"
  | "ecommerce"
  | "erp"
  | "cms"
  | "devops"
  | "social"
  | "generic";

export type IntegrationStatus = "active" | "inactive" | "error" | "degraded" | "connecting";

export type IntegrationHealthStatus = "online" | "offline" | "degraded" | "unknown";

export interface IntegrationCapability {
  key: string;
  label: string;
}

export interface IntegrationRateLimit {
  requestsPerMinute?: number;
  burst?: number;
}

export interface IntegrationRetryPolicy {
  attempts: number;
  backoffMs: number;
  maxBackoffMs: number;
}

export interface IntegrationProviderDescriptor {
  id: string;
  name: string;
  category: IntegrationCategory;
  authType: IntegrationAuthType;
  version: string;
  capabilities: readonly IntegrationCapability[];
  rateLimit: IntegrationRateLimit;
  retryPolicy: IntegrationRetryPolicy;
  docsUrl?: string;
}

export interface Integration {
  id: string;
  companyId: string;
  provider: string;
  name: string;
  category: IntegrationCategory;
  authType: IntegrationAuthType;
  status: IntegrationStatus;
  version: string;
  capabilities: readonly IntegrationCapability[];
  rateLimit: IntegrationRateLimit;
  retryPolicy: IntegrationRetryPolicy;
  config: JsonRecord;
  metadata: JsonRecord;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationHealth {
  integrationId: string;
  status: IntegrationHealthStatus;
  latencyMs: number | null;
  lastError: string | null;
  lastSyncAt: string | null;
  lastCheckAt: string;
}

export interface IntegrationLog {
  id: string;
  provider: string;
  action: string;
  status: string;
  durationMs: number | null;
  error: string | null;
  createdAt: string;
}

export interface IntegrationWebhook {
  id: string;
  provider: string;
  event: string;
  url: string;
  active: boolean;
  createdAt: string;
}

export interface IntegrationSyncJob {
  id: string;
  integrationId: string;
  kind: string;
  status: "queued" | "running" | "done" | "error" | "canceled";
  priority: number;
  progress: number;
  error: string | null;
  scheduledAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface IntegrationEvent {
  id: string;
  provider: string;
  event: string;
  verified: boolean;
  processedAt: string | null;
  createdAt: string;
}

export interface IntegrationsSnapshot {
  integrations: readonly Integration[];
  health: readonly IntegrationHealth[];
  webhooks: readonly IntegrationWebhook[];
  logs: readonly IntegrationLog[];
  syncs: readonly IntegrationSyncJob[];
  events: readonly IntegrationEvent[];
}
