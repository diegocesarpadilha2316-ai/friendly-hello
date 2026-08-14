/**
 * Fase 3.31 — Exportação real (blobs → download).
 * Client-only.
 */
import type { LocalVideoContainer } from "../local-engine/types";

const MIME: Record<LocalVideoContainer, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  gif: "image/gif",
  "png-sequence": "application/zip",
};

export interface RealVideoExportResult {
  readonly filename: string;
  readonly mime: string;
  readonly bytes: number;
  readonly url: string;
}

export function exportBlob(
  blob: Blob,
  container: LocalVideoContainer,
  filename?: string,
): RealVideoExportResult {
  const mime = MIME[container];
  const ext =
    container === "png-sequence"
      ? "zip"
      : container === "mov"
        ? "mov"
        : container === "webm"
          ? "webm"
          : container === "gif"
            ? "gif"
            : "mp4";
  const url = URL.createObjectURL(blob);
  return {
    filename: filename ?? `dioris-video-${Date.now()}.${ext}`,
    mime,
    bytes: blob.size,
    url,
  };
}

export function downloadResult(r: RealVideoExportResult): void {
  if (typeof document === "undefined") return;
  const a = document.createElement("a");
  a.href = r.url;
  a.download = r.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
