import {
  StorageError,
  type StorageProvider,
  type StorageProviderId,
  type SignedUrl,
} from "../types";

export abstract class BaseStorageProvider implements StorageProvider {
  abstract readonly id: StorageProviderId;
  abstract readonly label: string;
  readonly enabled: boolean = false;

  protected unsupported(op: string): never {
    throw new StorageError(
      `Operação ${op} não suportada no provider ${this.id}`,
      "provider_error",
      this.id,
    );
  }

  createSignedUploadUrl(_input: {
    bucket: string;
    objectKey: string;
    mime: string;
    sizeBytes: number;
    expiresInSec?: number;
  }): Promise<SignedUrl> {
    return Promise.reject(this.unsupported("createSignedUploadUrl"));
  }
  createSignedDownloadUrl(_input: {
    bucket: string;
    objectKey: string;
    expiresInSec?: number;
    downloadName?: string;
  }): Promise<SignedUrl> {
    return Promise.reject(this.unsupported("createSignedDownloadUrl"));
  }
  deleteObject(_input: { bucket: string; objectKey: string }): Promise<void> {
    return Promise.reject(this.unsupported("deleteObject"));
  }
  headObject(_input: {
    bucket: string;
    objectKey: string;
  }): Promise<{ sizeBytes: number; mime: string | null } | null> {
    return Promise.resolve(null);
  }
  health(): Promise<{ status: "healthy" | "degraded" | "down" | "unknown"; message?: string }> {
    return Promise.resolve({
      status: this.enabled ? "unknown" : "down",
      message: this.enabled ? undefined : "não configurado",
    });
  }
}
