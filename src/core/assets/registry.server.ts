import type { StorageProvider, StorageProviderId } from "./types";
import { SupabaseStorageProvider } from "./providers/supabase.server";
import {
  AzureProvider,
  B2Provider,
  GCSProvider,
  LocalProvider,
  R2Provider,
  S3Provider,
} from "./providers/stubs";

class StorageRegistryImpl {
  private readonly map = new Map<StorageProviderId, StorageProvider>();
  register(p: StorageProvider): void {
    this.map.set(p.id, p);
  }
  get(id: StorageProviderId): StorageProvider | undefined {
    return this.map.get(id);
  }
  all(): readonly StorageProvider[] {
    return Array.from(this.map.values());
  }
  enabled(): readonly StorageProvider[] {
    return this.all().filter((p) => p.enabled);
  }
}

export const StorageRegistry = new StorageRegistryImpl();

StorageRegistry.register(new SupabaseStorageProvider());
StorageRegistry.register(R2Provider);
StorageRegistry.register(S3Provider);
StorageRegistry.register(GCSProvider);
StorageRegistry.register(AzureProvider);
StorageRegistry.register(B2Provider);
StorageRegistry.register(LocalProvider);
