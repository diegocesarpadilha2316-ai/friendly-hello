import type { IntegrationRetryPolicy, IntegrationRateLimit } from "./types";

export const DEFAULT_RETRY_POLICY: IntegrationRetryPolicy = {
  attempts: 3,
  backoffMs: 500,
  maxBackoffMs: 8_000,
};

export const DEFAULT_RATE_LIMIT: IntegrationRateLimit = {
  requestsPerMinute: 60,
  burst: 10,
};

export const INTEGRATIONS_CONFIG = {
  defaultTimeoutMs: 15_000,
  circuitBreaker: {
    failureThreshold: 5,
    resetMs: 30_000,
  },
  cache: {
    defaultTtlMs: 60_000,
  },
} as const;
