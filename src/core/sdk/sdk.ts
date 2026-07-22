import type { PluginContext, PluginPermissionScope } from "./types";

/**
 * DiorisSDK — API oficial exposta aos plugins.
 * Plugins NUNCA acessam Supabase/Storage/Billing/AI diretamente.
 */
export interface DiorisSDK {
  ctx: PluginContext;
  hasPermission(scope: PluginPermissionScope): boolean;
  storage: {
    get(key: string): Promise<unknown>;
    set(key: string, value: unknown): Promise<void>;
  };
  ai: {
    invoke(prompt: string, opts?: Record<string, unknown>): Promise<{ text: string }>;
  };
  notify(title: string, body?: string): Promise<void>;
  emit(event: string, payload: unknown): void;
}

export function createClientSdkStub(ctx: PluginContext): DiorisSDK {
  return {
    ctx,
    hasPermission: (scope) => ctx.permissions.includes(scope),
    storage: { get: async () => null, set: async () => undefined },
    ai: { invoke: async () => ({ text: "" }) },
    notify: async () => undefined,
    emit: () => undefined,
  };
}