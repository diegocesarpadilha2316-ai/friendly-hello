import type { ImportResult } from "../types";

export function parseIGES(text: string, filename: string): ImportResult {
  const dLines = (text.match(/^.{72}D\d+$/gm) ?? []).length;
  return {
    id: `imp-${Date.now()}`,
    filename,
    format: "iges",
    binary: false,
    bytes: text.length,
    scale: { factorToMm: 1, detectedUnit: "mm" },
    bbox: null,
    layers: [
      { id: "IGES", name: "IGES", visible: true, locked: false, count: dLines, role: "block" },
    ],
    entities: [],
    materials: [],
    texts: [],
    previewSvg: null,
    warnings: [{ code: "iges-cad", severity: "info", message: `IGES com ${dLines} diretórios.` }],
    createdAt: new Date().toISOString(),
  };
}
