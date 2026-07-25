import type { ImportResult } from "../types";

export function parseIFC(text: string, filename: string): ImportResult {
  // IFC (STEP) é texto ASCII com header/footer conhecidos. Extrai contagem
  // rápida de entidades sem construir grafo completo.
  const entities = (text.match(/^#\d+=/gm) ?? []).length;
  const texts = Array.from(text.matchAll(/'([^']{2,80})'/g)).slice(0, 30).map((m) => m[1]!);
  return {
    id: `imp-${Date.now()}`,
    filename,
    format: "ifc",
    binary: false,
    bytes: text.length,
    scale: { factorToMm: 1000, detectedUnit: "m" },
    bbox: null,
    layers: [{ id: "IFC", name: "IFC Entities", visible: true, locked: false, count: entities, role: "block" }],
    entities: [],
    materials: [],
    texts,
    previewSvg: null,
    warnings: [
      { code: "ifc-preview", severity: "info", message: `Modelo IFC com ${entities} entidades — geometria será reconstruída no import final.` },
    ],
    createdAt: new Date().toISOString(),
  };
}