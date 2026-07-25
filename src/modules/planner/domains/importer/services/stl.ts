import type { ImportResult } from "../types";

export function parseSTL(input: ArrayBuffer | string, filename: string): ImportResult {
  let triangles = 0;
  let binary = false;
  let bytes = 0;
  if (typeof input === "string") {
    bytes = input.length;
    triangles = (input.match(/facet normal/gi) ?? []).length;
  } else {
    binary = true;
    bytes = input.byteLength;
    if (input.byteLength >= 84) {
      const dv = new DataView(input);
      triangles = dv.getUint32(80, true);
    }
  }
  return {
    id: `imp-${Date.now()}`,
    filename,
    format: "stl",
    binary,
    bytes,
    scale: { factorToMm: 1, detectedUnit: "mm" },
    bbox: null,
    layers: [{ id: "STL", name: "Mesh", visible: true, locked: false, count: triangles, role: "furniture" }],
    entities: [],
    materials: [],
    texts: [],
    previewSvg: null,
    warnings: [{ code: "stl-mesh", severity: "info", message: `Malha STL com ${triangles} triângulos.` }],
    createdAt: new Date().toISOString(),
  };
}