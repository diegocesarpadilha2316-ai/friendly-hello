import type { ImportResult, ImporterBBox, ImporterEntity, ImporterLayer } from "../types";

const COLORS: Readonly<Record<string, string>> = {
  wall: "#e5e7eb",
  door: "#22d3ee",
  window: "#38bdf8",
  floor: "#3f3f46",
  ceiling: "#525252",
  room: "#a3a3a3",
  furniture: "#a78bfa",
  dimension: "#fbbf24",
  text: "#f472b6",
  block: "#4ade80",
  unknown: "#64748b",
};

export function buildPreviewSvg(
  entities: readonly ImporterEntity[],
  layers: readonly ImporterLayer[],
  bbox: ImporterBBox | null,
  size = 480,
): string {
  if (!bbox)
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="#0b1220"/></svg>`;
  const w = Math.max(1, bbox.maxX - bbox.minX);
  const h = Math.max(1, bbox.maxY - bbox.minY);
  const s = Math.min(size / w, size / h) * 0.92;
  const ox = (size - w * s) / 2 - bbox.minX * s;
  const oy = (size - h * s) / 2 - bbox.minY * s;
  const layerVis = new Map(layers.map((l) => [l.id, l.visible] as const));
  const paths: string[] = [];
  for (const e of entities) {
    if (layerVis.get(e.layerId) === false) continue;
    if (e.points.length === 0) continue;
    const d = e.points
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"}${(p[0] * s + ox).toFixed(1)},${(p[1] * s + oy).toFixed(1)}`,
      )
      .join(" ");
    const color = COLORS[e.role] ?? "#64748b";
    const strokeWidth = e.role === "wall" ? 2 : 1;
    paths.push(
      `<path d="${d}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`,
    );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="#0b1220"/>${paths.join("")}</svg>`;
}

export function withPreview(result: ImportResult, size = 480): ImportResult {
  return {
    ...result,
    previewSvg: buildPreviewSvg(result.entities, result.layers, result.bbox, size),
  };
}
