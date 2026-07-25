import type { ImportResult } from "../types";

export function parseFBX(input: ArrayBuffer | string, filename: string): ImportResult {
  const binary = typeof input !== "string";
  return {
    id: `imp-${Date.now()}`,
    filename,
    format: "fbx",
    binary,
    bytes: binary ? (input as ArrayBuffer).byteLength : (input as string).length,
    scale: { factorToMm: 1, detectedUnit: "mm" },
    bbox: null,
    layers: [],
    entities: [],
    materials: [],
    texts: [],
    previewSvg: null,
    warnings: [{ code: "fbx-mesh", severity: "info", message: "FBX importado como malha — anexado ao Editor 3D." }],
    createdAt: new Date().toISOString(),
  };
}