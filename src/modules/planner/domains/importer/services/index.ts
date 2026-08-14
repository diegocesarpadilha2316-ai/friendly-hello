/**
 * Fase 3.27 — Barrel do domínio Importer.
 * 100% aditivo — nenhuma mutação de estado global.
 */
export * from "./types";
export * from "./units";
export * from "./scale";
export * from "./layers";
export * from "./materials";
export * from "./validator";
export * from "./optimizer";
export * from "./preview";
export * from "./converter";
export * from "./ai-hooks";
export * from "./exports";
export { parseDXF } from "./dxf";
export { parseDWG } from "./dwg";
export { parseIFC } from "./ifc";
export { parseOBJ } from "./obj";
export { parseSTL } from "./stl";
export { parseFBX } from "./fbx";
export { parseGLTF } from "./gltf";
export { parseGLB } from "./glb";
export { parseSTEP } from "./step";
export { parseIGES } from "./iges";
export { parseSKP } from "./skp";
export { parsePDF } from "./pdf";
export { parseImage } from "./image";
export { parseSVG } from "./vectorizer";

import type { ImportResult, ImporterFormat, ImporterWarning } from "../types";
import { parseDXF } from "./dxf";
import { parseDWG } from "./dwg";
import { parseIFC } from "./ifc";
import { parseOBJ } from "./obj";
import { parseSTL } from "./stl";
import { parseFBX } from "./fbx";
import { parseGLTF } from "./gltf";
import { parseGLB } from "./glb";
import { parseSTEP } from "./step";
import { parseIGES } from "./iges";
import { parseSKP } from "./skp";
import { parsePDF } from "./pdf";
import { parseImage } from "./image";
import { parseSVG } from "./vectorizer";

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i + 1).toLowerCase();
}

const BINARY_EXT = new Set([
  "dwg",
  "fbx",
  "glb",
  "skp",
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "stl",
]);

function readAs(file: File, binary: boolean): Promise<ArrayBuffer | string> {
  return binary ? file.arrayBuffer() : file.text();
}

export function detectFormat(filename: string): ImporterFormat | null {
  const e = extOf(filename);
  if (
    [
      "dxf",
      "dwg",
      "ifc",
      "obj",
      "fbx",
      "glb",
      "gltf",
      "stl",
      "step",
      "stp",
      "iges",
      "igs",
      "skp",
      "pdf",
      "png",
      "jpg",
      "jpeg",
      "webp",
      "svg",
    ].includes(e)
  ) {
    if (e === "stp") return "step";
    if (e === "igs") return "iges";
    if (e === "jpeg") return "jpg";
    return e as ImporterFormat;
  }
  return null;
}

export async function importFile(file: File): Promise<ImportResult> {
  const format = detectFormat(file.name);
  if (!format) {
    const w: ImporterWarning = {
      code: "unsupported",
      severity: "error",
      message: `Extensão não suportada: ${file.name}`,
    };
    return {
      id: `imp-${Date.now()}`,
      filename: file.name,
      format: "dxf",
      binary: false,
      bytes: file.size,
      scale: { factorToMm: 1, detectedUnit: "mm" },
      bbox: null,
      layers: [],
      entities: [],
      materials: [],
      texts: [],
      previewSvg: null,
      warnings: [w],
      createdAt: new Date().toISOString(),
    };
  }
  const binary = BINARY_EXT.has(extOf(file.name));
  const data = await readAs(file, binary);
  switch (format) {
    case "dxf":
      return parseDXF(data as string, file.name);
    case "dwg":
      return parseDWG(data as ArrayBuffer, file.name);
    case "ifc":
      return parseIFC(data as string, file.name);
    case "obj":
      return parseOBJ(data as string, file.name);
    case "stl":
      return parseSTL(typeof data === "string" ? data : data, file.name);
    case "fbx":
      return parseFBX(data, file.name);
    case "gltf":
      return parseGLTF(data as string, file.name);
    case "glb":
      return parseGLB(data as ArrayBuffer, file.name);
    case "step":
      return parseSTEP(data as string, file.name);
    case "iges":
      return parseIGES(data as string, file.name);
    case "skp":
      return parseSKP(data as ArrayBuffer, file.name);
    case "pdf":
      return parsePDF(data as ArrayBuffer, file.name);
    case "png":
    case "jpg":
    case "webp":
      return parseImage(data as ArrayBuffer, file.name, format);
    case "svg":
      return parseSVG(data as string, file.name);
  }
}
