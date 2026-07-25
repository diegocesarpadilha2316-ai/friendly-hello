import type { ImportResult, ImporterMaterialRef } from "../types";

interface GLTFDoc { readonly scenes?: unknown[]; readonly nodes?: unknown[]; readonly meshes?: unknown[]; readonly materials?: { name?: string }[] }

export function parseGLTF(text: string, filename: string): ImportResult {
  let doc: GLTFDoc | null = null;
  try { doc = JSON.parse(text) as GLTFDoc; } catch { doc = null; }
  const mats: ImporterMaterialRef[] = Array.isArray(doc?.materials)
    ? (doc!.materials as { name?: string }[]).map((m, i) => ({ id: m.name ?? `mat-${i}`, name: m.name ?? `Material ${i + 1}`, color: null, textureUrl: null }))
    : [];
  const nodes = Array.isArray(doc?.nodes) ? doc!.nodes!.length : 0;
  const meshes = Array.isArray(doc?.meshes) ? doc!.meshes!.length : 0;
  return {
    id: `imp-${Date.now()}`,
    filename,
    format: "gltf",
    binary: false,
    bytes: text.length,
    scale: { factorToMm: 1000, detectedUnit: "m" },
    bbox: null,
    layers: [{ id: "GLTF", name: "Scene", visible: true, locked: false, count: nodes, role: "furniture" }],
    entities: [],
    materials: mats,
    texts: [],
    previewSvg: null,
    warnings: [{ code: "gltf-scene", severity: "info", message: `glTF com ${nodes} nós / ${meshes} meshes.` }],
    createdAt: new Date().toISOString(),
  };
}