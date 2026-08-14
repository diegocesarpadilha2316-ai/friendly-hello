import type { AssetKind, StorageProviderId } from "./types";

export const ASSETS_CONFIG = {
  defaultProvider: "supabase" as StorageProviderId,
  defaultBucket: "dioris-assets",
  providerPriority: [
    "supabase",
    "r2",
    "s3",
    "gcs",
    "azure",
    "b2",
    "local",
  ] as readonly StorageProviderId[],
  signedUrlTtlSec: 60 * 10,
  uploadTtlSec: 60 * 60,
  maxFileSizeBytes: 500 * 1024 * 1024,
  maxResumableParts: 10_000,
  quotaBytesPerPlan: {
    free: 1 * 1024 * 1024 * 1024,
    starter: 20 * 1024 * 1024 * 1024,
    pro: 200 * 1024 * 1024 * 1024,
    business: 1024 * 1024 * 1024 * 1024,
    enterprise: null as number | null,
  } satisfies Record<string, number | null>,
  featureFlags: {
    resumableUploads: true,
    multipartUploads: true,
    thumbnails: true,
    conversion: false,
    ocr: false,
    deduplication: true,
    versioning: true,
    trash: true,
    audit: true,
    signedDownloads: true,
    cdn: true,
  },
  retention: {
    trashDays: 30,
    auditDays: 365,
  },
  mime: {
    allowlist: [
      // images
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "image/avif",
      // video
      "video/mp4",
      "video/webm",
      "video/quicktime",
      // audio
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/aac",
      "audio/flac",
      "audio/mp4",
      // documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/csv",
      "text/plain",
      // 3d / cad
      "model/gltf-binary",
      "model/gltf+json",
      "model/obj",
      "model/stl",
      "application/octet-stream", // fallback CAD/DWG/DXF/STEP/FBX
      "application/zip",
      "application/x-zip-compressed",
    ] as readonly string[],
  },
} as const;

export const KIND_BY_MIME: Readonly<Record<string, AssetKind>> = {
  "application/pdf": "pdf",
  "application/zip": "archive",
  "application/x-zip-compressed": "archive",
  "model/gltf-binary": "model3d",
  "model/gltf+json": "model3d",
  "model/obj": "model3d",
  "model/stl": "model3d",
};

export function classifyMime(mime: string): AssetKind {
  const explicit = KIND_BY_MIME[mime];
  if (explicit) return explicit;
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("text/")) return "document";
  if (mime.startsWith("application/vnd.") || mime === "application/msword") return "document";
  return "other";
}
