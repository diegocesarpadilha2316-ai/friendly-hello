import type { ImportResult } from "../types";

export function parseSTEP(text: string, filename: string): ImportResult {
  const entities = (text.match(/^#\d+=/gm) ?? []).length;
  return {
    id: `imp-${Date.now()}`,
    filename,
    format: "step",
    binary: false,
    bytes: text.length,
    scale: { factorToMm: 1, detectedUnit: "mm" },
    bbox: null,
    layers: [{ id: "STEP", name: "STEP", visible: true, locked: false, count: entities, role: "block" }],
    entities: [], materials: [], texts: [],
    previewSvg: null,
    warnings: [{ code: "step-cad", severity: "info", message: `STEP com ${entities} entidades CAD.` }],
    createdAt: new Date().toISOString(),
  };
}