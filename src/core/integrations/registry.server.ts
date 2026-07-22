import { PROVIDER_STUBS } from "./providers/stubs";
import type { IntegrationProvider } from "./providers/base";
import type { IntegrationProviderDescriptor } from "./types";

const registry = new Map<string, IntegrationProvider>(
  PROVIDER_STUBS.map((p) => [p.descriptor.id, p]),
);

export const IntegrationRegistry = {
  register(provider: IntegrationProvider): void {
    registry.set(provider.descriptor.id, provider);
  },
  get(id: string): IntegrationProvider | undefined {
    return registry.get(id);
  },
  list(): readonly IntegrationProviderDescriptor[] {
    return Array.from(registry.values()).map((p) => p.descriptor);
  },
};