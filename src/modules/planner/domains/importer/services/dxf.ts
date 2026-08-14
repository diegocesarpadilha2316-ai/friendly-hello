/**
 * Fase 3.27 — Parser DXF (ASCII) determinístico e minimalista.
 * Reconhece grupos LINE/LWPOLYLINE/POLYLINE e nomes de camada.
 * Sem dependências externas — leitura por tags AutoCAD (grupo/valor).
 */
import type { ImporterEntity, ImportResult, ImporterFormat } from "../types";
import { bboxOf, autoScale } from "./scale";
import { summarizeLayers } from "./layers";
import { extractMaterials } from "./materials";
import { optimizeEntities } from "./optimizer";
import { withPreview } from "./preview";

export function parseDXF(text: string, filename: string): ImportResult {
  const lines = text.split(/\r?\n/);
  const entities: ImporterEntity[] = [];
  const layers = new Set<string>();
  const texts: string[] = [];
  let i = 0;
  const next = (): { code: number; value: string } | null => {
    if (i >= lines.length - 1) return null;
    const code = Number((lines[i++] ?? "").trim());
    const value = (lines[i++] ?? "").trim();
    return Number.isFinite(code) ? { code, value } : null;
  };
  let idSeq = 0;
  while (i < lines.length) {
    const t = next();
    if (!t) break;
    if (t.code !== 0) continue;
    const type = t.value;
    if (type === "LINE") {
      let layer = "0",
        x1 = 0,
        y1 = 0,
        x2 = 0,
        y2 = 0;
      while (i < lines.length) {
        const p = next();
        if (!p) break;
        if (p.code === 0) {
          i -= 2;
          break;
        }
        if (p.code === 8) layer = p.value;
        else if (p.code === 10) x1 = Number(p.value);
        else if (p.code === 20) y1 = Number(p.value);
        else if (p.code === 11) x2 = Number(p.value);
        else if (p.code === 21) y2 = Number(p.value);
      }
      layers.add(layer);
      entities.push({
        id: `dxf-${++idSeq}`,
        role: "wall",
        layerId: layer,
        points: [
          [x1, y1],
          [x2, y2],
        ],
      });
    } else if (type === "LWPOLYLINE" || type === "POLYLINE") {
      let layer = "0";
      const pts: [number, number][] = [];
      let curX: number | null = null;
      while (i < lines.length) {
        const p = next();
        if (!p) break;
        if (p.code === 0 && p.value !== "VERTEX") {
          i -= 2;
          break;
        }
        if (p.code === 8) layer = p.value;
        else if (p.code === 10) curX = Number(p.value);
        else if (p.code === 20 && curX != null) {
          pts.push([curX, Number(p.value)]);
          curX = null;
        }
      }
      layers.add(layer);
      if (pts.length)
        entities.push({ id: `dxf-${++idSeq}`, role: "wall", layerId: layer, points: pts });
    } else if (type === "TEXT" || type === "MTEXT") {
      while (i < lines.length) {
        const p = next();
        if (!p) break;
        if (p.code === 0) {
          i -= 2;
          break;
        }
        if (p.code === 1) texts.push(p.value);
      }
    }
  }
  const bbox = bboxOf(entities.flatMap((e) => e.points));
  const scale = autoScale(bbox);
  const optimized = optimizeEntities(entities);
  const layerSummary = summarizeLayers(optimized, Array.from(layers));
  return withPreview({
    id: `imp-${Date.now()}`,
    filename,
    format: "dxf" as ImporterFormat,
    binary: false,
    bytes: text.length,
    scale,
    bbox,
    layers: layerSummary,
    entities: optimized,
    materials: extractMaterials(optimized),
    texts,
    previewSvg: null,
    warnings: [],
    createdAt: new Date().toISOString(),
  });
}
