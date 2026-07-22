import { INTEGRATIONS_CONFIG, DEFAULT_RETRY_POLICY } from "./config";
import type { IntegrationRetryPolicy } from "./types";

export interface ApiClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  retryPolicy?: IntegrationRetryPolicy;
  headers?: Record<string, string>;
}

export interface ApiCallResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
  durationMs: number;
}

type BreakerState = { failures: number; openedAt: number | null };
const breakers = new Map<string, BreakerState>();

function breakerKey(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function breakerOpen(key: string): boolean {
  const s = breakers.get(key);
  if (!s?.openedAt) return false;
  if (Date.now() - s.openedAt > INTEGRATIONS_CONFIG.circuitBreaker.resetMs) {
    breakers.set(key, { failures: 0, openedAt: null });
    return false;
  }
  return true;
}

function recordFailure(key: string): void {
  const s = breakers.get(key) ?? { failures: 0, openedAt: null };
  s.failures += 1;
  if (s.failures >= INTEGRATIONS_CONFIG.circuitBreaker.failureThreshold) s.openedAt = Date.now();
  breakers.set(key, s);
}

function recordSuccess(key: string): void {
  breakers.set(key, { failures: 0, openedAt: null });
}

/** HTTP client enterprise: timeout, retry, backoff, circuit breaker. */
export async function apiCall<T = unknown>(
  url: string,
  init: RequestInit = {},
  opts: ApiClientOptions = {},
): Promise<ApiCallResult<T>> {
  const key = breakerKey(url);
  if (breakerOpen(key)) {
    return { ok: false, status: 503, data: null, error: "circuit_open", durationMs: 0 };
  }
  const retry = opts.retryPolicy ?? DEFAULT_RETRY_POLICY;
  const timeoutMs = opts.timeoutMs ?? INTEGRATIONS_CONFIG.defaultTimeoutMs;
  const started = Date.now();
  let lastError = "unknown";
  let backoff = retry.backoffMs;

  for (let attempt = 1; attempt <= retry.attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: { ...(opts.headers ?? {}), ...(init.headers ?? {}) },
      });
      clearTimeout(timer);
      const body = await res.text();
      const data = body ? (safeJson<T>(body) as T | null) : null;
      if (!res.ok) {
        lastError = `HTTP ${res.status}: ${body.slice(0, 200)}`;
        if (res.status < 500) {
          recordFailure(key);
          return { ok: false, status: res.status, data, error: lastError, durationMs: Date.now() - started };
        }
      } else {
        recordSuccess(key);
        return { ok: true, status: res.status, data, error: null, durationMs: Date.now() - started };
      }
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err.message : String(err);
    }
    if (attempt < retry.attempts) {
      await new Promise((r) => setTimeout(r, backoff));
      backoff = Math.min(backoff * 2, retry.maxBackoffMs);
    }
  }
  recordFailure(key);
  return { ok: false, status: 0, data: null, error: lastError, durationMs: Date.now() - started };
}

function safeJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}