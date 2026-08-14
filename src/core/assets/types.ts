/**
 * Assets Enterprise — contratos canônicos.
 * Todos os módulos consomem storage exclusivamente por este barrel.
 */
export type StorageProviderId = "supabase" | "r2" | "s3" | "gcs" | "azure" | "b2" | "local";

export type AssetKind =
  "image" | "video" | "audio" | "document" | "pdf" | "cad" | "model3d" | "archive" | "other";

export type AssetVisibility = "private" | "tenant" | "public";
export type UploadStatus = "pending" | "uploading" | "processing" | "ready" | "failed" | "canceled";

export interface AssetFolder {
  readonly id: string;
  readonly companyId: string;
  readonly parentId: string | null;
  readonly name: string;
  readonly path: string;
  readonly createdAt: string;
}

export type JsonScalar = string | number | boolean | null;
export type JsonValue = JsonScalar | JsonValue[] | { readonly [key: string]: JsonValue };
export interface AssetMetadata {
  readonly [key: string]: JsonValue;
}

export interface Asset {
  readonly id: string;
  readonly companyId: string;
  readonly folderId: string | null;
  readonly provider: StorageProviderId;
  readonly bucket: string;
  readonly objectKey: string;
  readonly filename: string;
  readonly mime: string;
  readonly kind: AssetKind;
  readonly visibility: AssetVisibility;
  readonly sizeBytes: number;
  readonly sha256: string | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly durationMs: number | null;
  readonly metadata: AssetMetadata;
  readonly deletedAt: string | null;
  readonly createdBy: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AssetVersion {
  readonly id: string;
  readonly assetId: string;
  readonly version: number;
  readonly objectKey: string;
  readonly sizeBytes: number;
  readonly sha256: string | null;
  readonly createdAt: string;
}

export interface AssetThumbnail {
  readonly id: string;
  readonly assetId: string;
  readonly variant: string;
  readonly objectKey: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly sizeBytes: number | null;
}

export interface AssetPreview {
  readonly url: string;
  readonly expiresAt: string;
  readonly variant: string;
}

export interface AssetPermission {
  readonly id: string;
  readonly assetId: string;
  readonly subjectType: "user" | "role" | "company";
  readonly subjectId: string;
  readonly canRead: boolean;
  readonly canWrite: boolean;
  readonly canDelete: boolean;
}

export interface AssetUsage {
  readonly id: string;
  readonly assetId: string;
  readonly module: string;
  readonly entityType: string;
  readonly entityId: string;
}

export interface AssetAuditEntry {
  readonly id: string;
  readonly companyId: string;
  readonly assetId: string | null;
  readonly actorId: string | null;
  readonly action: string;
  readonly detail: { readonly [key: string]: JsonValue };
  readonly createdAt: string;
}

export interface UploadJob {
  readonly id: string;
  readonly companyId: string;
  readonly assetId: string | null;
  readonly status: UploadStatus;
  readonly provider: StorageProviderId;
  readonly bucket: string;
  readonly objectKey: string;
  readonly filename: string;
  readonly mime: string;
  readonly sizeBytes: number;
  readonly bytesUploaded: number;
  readonly partsTotal: number | null;
  readonly partsDone: number;
  readonly error: string | null;
  readonly createdAt: string;
}

export interface SignedUrl {
  readonly url: string;
  readonly method: "GET" | "PUT" | "POST";
  readonly expiresAt: string;
  readonly headers?: Readonly<Record<string, string>>;
}

export interface StorageStats {
  readonly usedBytes: number;
  readonly assetCount: number;
  readonly quotaBytes: number | null;
}

export type StorageErrorCode =
  | "quota_exceeded"
  | "unsupported_mime"
  | "size_exceeded"
  | "not_found"
  | "forbidden"
  | "provider_error"
  | "invalid_request";

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: StorageErrorCode,
    public readonly provider?: StorageProviderId,
  ) {
    super(message);
    this.name = "StorageError";
  }
}

/** Contrato único para providers de storage. */
export interface StorageProvider {
  readonly id: StorageProviderId;
  readonly label: string;
  readonly enabled: boolean;

  createSignedUploadUrl(input: {
    bucket: string;
    objectKey: string;
    mime: string;
    sizeBytes: number;
    expiresInSec?: number;
  }): Promise<SignedUrl>;

  createSignedDownloadUrl(input: {
    bucket: string;
    objectKey: string;
    expiresInSec?: number;
    downloadName?: string;
  }): Promise<SignedUrl>;

  deleteObject(input: { bucket: string; objectKey: string }): Promise<void>;

  headObject(input: {
    bucket: string;
    objectKey: string;
  }): Promise<{ sizeBytes: number; mime: string | null } | null>;

  health(): Promise<{ status: "healthy" | "degraded" | "down" | "unknown"; message?: string }>;
}
