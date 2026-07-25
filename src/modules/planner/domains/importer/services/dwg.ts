/**
 * Fase 3.27 — DWG é formato binário proprietário. Sem parser nativo,
 * retornamos um placeholder com aviso claro e sugerimos converter
 * para DXF (fluxo suportado end-to-end).
 */
import type { ImportResult } from "../types";

export function parseDWG(bytes: ArrayBuffer, filename: string): ImportResult {
  return {
    id: `imp-${Date.now()}`,
    filename,
    format: "dwg",
    binary: true,
    bytes: bytes.byteLength,
    scale: { factorToMm: 1, detectedUnit: "mm" },
    bbox: null,
    layers: [],
    entities: [],
    materials: [],
    texts: [],
    previewSvg: null,
    warnings: [
      { code: "dwg-binary", severity: "warning", message: "DWG é binário proprietário — exporte como DXF R12 para importação completa." },
    ],
    createdAt: new Date().toISOString(),
  };
}