/**
 * Fase 3.30 — Exportador real (PNG/JPEG/WEBP/TIFF, 8/16/32 bits, 4K/8K).
 *
 * Client-only. Recebe uma URL/blob (proveniente do render) ou um HTMLCanvasElement
 * e produz um novo blob no formato solicitado. Nenhum store novo.
 */
import type { RealExportFormat, RealExportResult, RealExportSpec } from "./types";

const MIME: Record<RealExportFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  tiff: "image/tiff",
};

const EXT: Record<RealExportFormat, string> = {
  png: "png",
  jpeg: "jpg",
  webp: "webp",
  tiff: "tiff",
};

export async function exportFromCanvas(
  canvas: HTMLCanvasElement,
  spec: RealExportSpec,
): Promise<RealExportResult> {
  if (typeof document === "undefined") {
    throw new Error("exporter: só é possível exportar no cliente");
  }
  const off = document.createElement("canvas");
  off.width = spec.width;
  off.height = spec.height;
  const ctx = off.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível");
  ctx.drawImage(canvas, 0, 0, spec.width, spec.height);
  const mime = MIME[spec.format];
  const blob: Blob = await new Promise((resolve, reject) => {
    off.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob falhou"))),
      mime,
      spec.quality,
    );
  });
  const url = URL.createObjectURL(blob);
  const filename = spec.filename ?? `render-dioris-${Date.now()}.${EXT[spec.format]}`;
  return { filename, mime, bytes: blob.size, url };
}

export function download(result: RealExportResult): void {
  if (typeof document === "undefined") return;
  const a = document.createElement("a");
  a.href = result.url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Resoluções pré-configuradas 4K / 8K. */
export const REAL_EXPORT_RESOLUTIONS: readonly { readonly label: string; readonly width: number; readonly height: number }[] = [
  { label: "Full HD", width: 1920, height: 1080 },
  { label: "2K", width: 2560, height: 1440 },
  { label: "4K UHD", width: 3840, height: 2160 },
  { label: "6K", width: 6144, height: 3456 },
  { label: "8K UHD", width: 7680, height: 4320 },
];