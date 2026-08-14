import type { AIVisionAttachment, AIVisionMediaKind } from "../types";

/**
 * Camada arquitetural de Visão. Não executa parsing — normaliza anexos
 * para o formato que o provider suporta e delega ao domínio
 * correspondente (importer, ia visão) quando for a hora.
 */

const SUPPORTED: readonly AIVisionMediaKind[] = [
  "image",
  "photo",
  "pdf",
  "dwg",
  "dxf",
  "ifc",
  "obj",
  "fbx",
  "glb",
  "gltf",
];

export function isSupportedVisionKind(kind: string): kind is AIVisionMediaKind {
  return (SUPPORTED as readonly string[]).includes(kind);
}

export function normalizeAttachment(a: AIVisionAttachment): AIVisionAttachment {
  return {
    kind: a.kind,
    mimeType: a.mimeType || inferMime(a.kind),
    url: a.url,
    dataBase64: a.dataBase64,
    name: a.name,
  };
}

function inferMime(kind: AIVisionMediaKind): string {
  switch (kind) {
    case "image":
    case "photo":
      return "image/jpeg";
    case "pdf":
      return "application/pdf";
    case "glb":
      return "model/gltf-binary";
    case "gltf":
      return "model/gltf+json";
    default:
      return "application/octet-stream";
  }
}

export const VISION_SUPPORTED_KINDS = SUPPORTED;
