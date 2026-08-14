import type { ImporterEntity, ImportResult } from "../types";
import { bboxOf, autoScale } from "./scale";
import { summarizeLayers } from "./layers";
import { extractMaterials } from "./materials";
import { optimizeEntities } from "./optimizer";
import { withPreview } from "./preview";

export function parseOBJ(text: string, filename: string): ImportResult {
  const verts: [number, number][] = [];
  const entities: ImporterEntity[] = [];
  let layer = "default";
  let idSeq = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(/\s+/);
    const tag = parts[0];
    if (tag === "v" && parts.length >= 3) {
      verts.push([Number(parts[1]), Number(parts[3])]); // XZ para planta 2D
    } else if (tag === "g" || tag === "o") {
      layer = parts.slice(1).join(" ") || layer;
    } else if (tag === "f" && parts.length >= 4) {
      const pts: [number, number][] = [];
      for (let k = 1; k < parts.length; k++) {
        const idx = Number(parts[k]!.split("/")[0]) - 1;
        const v = verts[idx];
        if (v) pts.push(v);
      }
      if (pts.length >= 2) {
        pts.push(pts[0]!);
        entities.push({ id: `obj-${++idSeq}`, role: "furniture", layerId: layer, points: pts });
      }
    }
  }
  const bbox = bboxOf(entities.flatMap((e) => e.points));
  return withPreview({
    id: `imp-${Date.now()}`,
    filename,
    format: "obj",
    binary: false,
    bytes: text.length,
    scale: autoScale(bbox),
    bbox,
    layers: summarizeLayers(entities),
    entities: optimizeEntities(entities),
    materials: extractMaterials(entities),
    texts: [],
    previewSvg: null,
    warnings: [],
    createdAt: new Date().toISOString(),
  });
}
