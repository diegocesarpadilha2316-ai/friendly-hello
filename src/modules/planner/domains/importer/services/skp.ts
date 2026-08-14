import type { ImportResult } from "../types";

export function parseSKP(buffer: ArrayBuffer, filename: string): ImportResult {
  return {
    id: `imp-${Date.now()}`,
    filename,
    format: "skp",
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
      {
        code: "skp-binary",
        severity: "warning",
        message: "SketchUp SKP é binário — exporte para OBJ/GLB/DAE para importação completa.",
      },
    ],
    createdAt: new Date().toISOString(),
  };
}
