import type { ImportResult } from "../types";

export function parsePDF(buffer: ArrayBuffer, filename: string): ImportResult {
  const bytes = new Uint8Array(buffer);
  const head = new TextDecoder().decode(bytes.slice(0, 8));
  const valid = head.startsWith("%PDF-");
  return {
    id: `imp-${Date.now()}`,
    filename,
    format: "pdf",
    binary: true,
    bytes: buffer.byteLength,
    scale: { factorToMm: 1, detectedUnit: "mm" },
    bbox: null,
    layers: [],
    entities: [],
    materials: [],
    texts: [],
    previewSvg: null,
    warnings: [
      valid
        ? {
            code: "pdf-vectorize",
            severity: "info",
            message: "PDF será vetorizado sob demanda (use a aba Correções).",
          }
        : { code: "pdf-invalid", severity: "error", message: "Assinatura PDF inválida." },
    ],
    createdAt: new Date().toISOString(),
  };
}
