import type { ImportResult, ImporterExportFormat } from "../types";
import { buildPreviewSvg } from "./preview";

export interface ExportBlob { readonly content: string | Uint8Array; readonly mime: string; readonly filename: string }

export function exportImport(result: ImportResult, format: ImporterExportFormat): ExportBlob {
  const base = result.filename.replace(/\.[^.]+$/, "");
  if (format === "svg") {
    const svg = result.previewSvg ?? buildPreviewSvg(result.entities, result.layers, result.bbox);
    return { content: svg, mime: "image/svg+xml", filename: `${base}.svg` };
  }
  if (format === "dxf") return { content: toDXF(result), mime: "application/dxf", filename: `${base}.dxf` };
  if (format === "dwg") return { content: toDXF(result), mime: "application/acad", filename: `${base}.dxf` };
  if (format === "obj") return { content: toOBJ(result), mime: "text/plain", filename: `${base}.obj` };
  if (format === "glb") return { content: JSON.stringify({ scenes: [], nodes: [], meshes: [] }, null, 2), mime: "model/gltf+json", filename: `${base}.gltf` };
  // pdf: stub textual (a fase 3.11/3.13 já possui exportação PDF real por outro caminho).
  return { content: `Import ${result.filename} — ${result.entities.length} entidades`, mime: "text/plain", filename: `${base}.txt` };
}

function toDXF(result: ImportResult): string {
  const lines: string[] = ["0","SECTION","2","ENTITIES"];
  for (const e of result.entities) {
    for (let i = 1; i < e.points.length; i++) {
      const a = e.points[i - 1]!, b = e.points[i]!;
      lines.push("0","LINE","8",e.layerId,"10",String(a[0]),"20",String(a[1]),"11",String(b[0]),"21",String(b[1]));
    }
  }
  lines.push("0","ENDSEC","0","EOF");
  return lines.join("\n");
}

function toOBJ(result: ImportResult): string {
  const out: string[] = ["# Dioris Planner — export OBJ"];
  let idx = 1;
  for (const e of result.entities) {
    out.push(`g ${e.layerId}`);
    const start = idx;
    for (const p of e.points) { out.push(`v ${p[0]} 0 ${p[1]}`); idx++; }
    if (e.points.length >= 2) {
      const indices = e.points.map((_, i) => start + i).join(" ");
      out.push(`l ${indices}`);
    }
  }
  return out.join("\n");
}