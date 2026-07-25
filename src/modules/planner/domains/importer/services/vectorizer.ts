import type { ImporterEntity, ImportResult } from "../types";
import { bboxOf, autoScale } from "./scale";
import { summarizeLayers } from "./layers";
import { optimizeEntities } from "./optimizer";
import { withPreview } from "./preview";

/**
 * Vetorização determinística de SVG: extrai polilinhas via regex nos
 * elementos `path` e `polyline` — cobre a maioria das plantas exportadas.
 */
export function parseSVG(text: string, filename: string): ImportResult {
  const entities: ImporterEntity[] = [];
  let idSeq = 0;

  for (const m of text.matchAll(/<polyline[^>]*points="([^"]+)"[^>]*>/gi)) {
    const pts = pointsFrom(m[1]!);
    if (pts.length) entities.push({ id: `svg-${++idSeq}`, role: "wall", layerId: "polyline", points: pts });
  }
  for (const m of text.matchAll(/<line[^>]*x1="([-\d.]+)"[^>]*y1="([-\d.]+)"[^>]*x2="([-\d.]+)"[^>]*y2="([-\d.]+)"/gi)) {
    entities.push({
      id: `svg-${++idSeq}`, role: "wall", layerId: "line",
      points: [[Number(m[1]), Number(m[2])], [Number(m[3]), Number(m[4])]],
    });
  }
  for (const m of text.matchAll(/<path[^>]*d="([^"]+)"/gi)) {
    const pts = pathToPoints(m[1]!);
    if (pts.length) entities.push({ id: `svg-${++idSeq}`, role: "wall", layerId: "path", points: pts });
  }

  const bbox = bboxOf(entities.flatMap((e) => e.points));
  return withPreview({
    id: `imp-${Date.now()}`,
    filename,
    format: "svg",
    binary: false,
    bytes: text.length,
    scale: autoScale(bbox),
    bbox,
    layers: summarizeLayers(entities),
    entities: optimizeEntities(entities),
    materials: [], texts: [], previewSvg: null,
    warnings: [],
    createdAt: new Date().toISOString(),
  });
}

function pointsFrom(raw: string): [number, number][] {
  const nums = raw.trim().split(/[\s,]+/).map(Number).filter(Number.isFinite);
  const out: [number, number][] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) out.push([nums[i]!, nums[i + 1]!]);
  return out;
}

function pathToPoints(d: string): [number, number][] {
  // Aceita apenas M/L absolutos — heurística leve.
  const tokens = d.match(/[MLml][^MLmlZzHhVvCcSsQqTtAa]*/g) ?? [];
  const pts: [number, number][] = [];
  let cx = 0, cy = 0;
  for (const tk of tokens) {
    const cmd = tk[0]!;
    const nums = tk.slice(1).trim().split(/[\s,]+/).map(Number).filter(Number.isFinite);
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = nums[i]!, y = nums[i + 1]!;
      if (cmd === "M" || cmd === "L") { cx = x; cy = y; }
      else if (cmd === "m" || cmd === "l") { cx += x; cy += y; }
      pts.push([cx, cy]);
    }
  }
  return pts;
}