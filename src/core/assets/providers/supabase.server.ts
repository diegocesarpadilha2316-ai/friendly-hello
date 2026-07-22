import { getSupabaseAdmin } from "@/core/lib/supabase/admin.server";
import { BaseStorageProvider } from "./base";
import { StorageError, type SignedUrl, type StorageProviderId } from "../types";
import { ASSETS_CONFIG } from "../config";

export class SupabaseStorageProvider extends BaseStorageProvider {
  readonly id: StorageProviderId = "supabase";
  readonly label = "Supabase Storage";
  readonly enabled = true;

  async createSignedUploadUrl({
    bucket,
    objectKey,
    expiresInSec,
  }: {
    bucket: string;
    objectKey: string;
    mime: string;
    sizeBytes: number;
    expiresInSec?: number;
  }): Promise<SignedUrl> {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.storage
      .from(bucket)
      .createSignedUploadUrl(objectKey);
    if (error || !data) {
      throw new StorageError(error?.message ?? "sign upload failed", "provider_error", this.id);
    }
    const ttl = expiresInSec ?? ASSETS_CONFIG.uploadTtlSec;
    return {
      url: data.signedUrl,
      method: "PUT",
      expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
      headers: { "x-upsert": "true" },
    };
  }

  async createSignedDownloadUrl({
    bucket,
    objectKey,
    expiresInSec,
    downloadName,
  }: {
    bucket: string;
    objectKey: string;
    expiresInSec?: number;
    downloadName?: string;
  }): Promise<SignedUrl> {
    const admin = getSupabaseAdmin();
    const ttl = expiresInSec ?? ASSETS_CONFIG.signedUrlTtlSec;
    const { data, error } = await admin.storage
      .from(bucket)
      .createSignedUrl(objectKey, ttl, downloadName ? { download: downloadName } : undefined);
    if (error || !data) {
      throw new StorageError(error?.message ?? "sign download failed", "provider_error", this.id);
    }
    return {
      url: data.signedUrl,
      method: "GET",
      expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
    };
  }

  async deleteObject({ bucket, objectKey }: { bucket: string; objectKey: string }): Promise<void> {
    const admin = getSupabaseAdmin();
    const { error } = await admin.storage.from(bucket).remove([objectKey]);
    if (error) throw new StorageError(error.message, "provider_error", this.id);
  }

  async headObject({ bucket, objectKey }: { bucket: string; objectKey: string }) {
    const admin = getSupabaseAdmin();
    const slash = objectKey.lastIndexOf("/");
    const prefix = slash === -1 ? "" : objectKey.slice(0, slash);
    const name = slash === -1 ? objectKey : objectKey.slice(slash + 1);
    const { data, error } = await admin.storage.from(bucket).list(prefix, { search: name, limit: 1 });
    if (error || !data?.length) return null;
    const f = data[0];
    return {
      sizeBytes: (f.metadata?.size as number | undefined) ?? 0,
      mime: (f.metadata?.mimetype as string | undefined) ?? null,
    };
  }

  async health() {
    try {
      const admin = getSupabaseAdmin();
      const { error } = await admin.storage.from(ASSETS_CONFIG.defaultBucket).list("", { limit: 1 });
      if (error) return { status: "degraded" as const, message: error.message };
      return { status: "healthy" as const };
    } catch (e) {
      return { status: "down" as const, message: e instanceof Error ? e.message : "erro" };
    }
  }
}
