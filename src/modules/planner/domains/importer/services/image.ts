import type { ImportResult, ImporterFormat } from "../types";

export function parseImage(buffer: ArrayBuffer, filename: string, format: Extract<ImporterFormat, "png" | "jpg" | "webp">): ImportResult {
  return {
    id: `imp-${Date.now()}`,
    filename,
    format,
    binary: true,
    bytes: buffer.byteLength,
    scale: { factorToMm: 1, detectedUnit: "mm" },
    bbox: null, layers: [], entities: [], materials: [], texts: [], previewSvg: null,
    warnings: [{ code: "image-vectorize", severity: "info", message: "Imagem detectada — envie para IA Visão ou vetorize para planta." }],
    createdAt: new Date().toISOString(),
  };
}