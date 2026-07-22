export interface RetryPolicy {
  attempts: number;
  baseMs: number;
  maxMs: number;
  jitter?: boolean;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  attempts: 5,
  baseMs: 1_000,
  maxMs: 60_000,
  jitter: true,
};

export function nextRetryDelayMs(attempt: number, policy: RetryPolicy = DEFAULT_RETRY_POLICY): number {
  const exp = Math.min(policy.maxMs, policy.baseMs * 2 ** Math.max(0, attempt - 1));
  if (!policy.jitter) return exp;
  const rand = 0.5 + Math.random() * 0.5;
  return Math.floor(exp * rand);
}

export function nextRetryAt(attempt: number, policy?: RetryPolicy): string {
  return new Date(Date.now() + nextRetryDelayMs(attempt, policy)).toISOString();
}