import { BaseStorageProvider } from "./base";
import type { StorageProviderId } from "../types";

class StubStorageProvider extends BaseStorageProvider {
  constructor(readonly id: StorageProviderId, readonly label: string) {
    super();
  }
  readonly enabled = false;
}

export const R2Provider     = new StubStorageProvider("r2",     "Cloudflare R2");
export const S3Provider     = new StubStorageProvider("s3",     "AWS S3");
export const GCSProvider    = new StubStorageProvider("gcs",    "Google Cloud Storage");
export const AzureProvider  = new StubStorageProvider("azure",  "Azure Blob Storage");
export const B2Provider     = new StubStorageProvider("b2",     "Backblaze B2");
export const LocalProvider  = new StubStorageProvider("local",  "Storage Local");
