import type { IntegrationProviderDescriptor } from "../types";

export interface IntegrationProvider {
  descriptor: IntegrationProviderDescriptor;
  /** Health probe (stub-friendly). */
  ping?: () => Promise<{ ok: boolean; latencyMs: number; error?: string }>;
}

export function defineProvider(descriptor: IntegrationProviderDescriptor): IntegrationProvider {
  return { descriptor };
}