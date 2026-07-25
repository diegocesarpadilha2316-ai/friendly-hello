import type { ImportResult } from "../types";
import { parseGLTF } from "./gltf";

/**
 * GLB embute JSON glTF em um container binário — o header traz o offset
 * e tamanho do chunk JSON. Isolamos o JSON e reaproveitamos `parseGLTF`.
 */
export function parseGLB(buffer: ArrayBuffer, filename: string): ImportResult {
  const dv = new DataView(buffer);
  if (dv.byteLength < 20 || dv.getUint32(0, true) !== 0x46546c67) {
    return {
      id: `imp-${Date.now()}`,
      filename,
      format: "glb",
      binary: true,
      bytes: buffer.byteLength,
      scale: { factorToMm: 1, detectedUnit: "mm" },
      bbox: null, layers: [], entities: [], materials: [], texts: [], previewSvg: null,
      warnings: [{ code: "glb-invalid", severity: "error", message: "Assinatura GLB inválida." }],
      createdAt: new Date().toISOString(),
    };
  }
  const jsonLen = dv.getUint32(12, true);
  const jsonBytes = new Uint8Array(buffer, 20, jsonLen);
  const jsonText = new TextDecoder().decode(jsonBytes);
  const res = parseGLTF(jsonText, filename);
  return { ...res, format: "glb", binary: true, bytes: buffer.byteLength };
}