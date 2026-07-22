/**
 * AssetProcessor / ThumbnailPipeline — pipeline de processamento de assets.
 * Preparado para imagens, PDF, vídeos, áudio, CAD, GLTF/OBJ/FBX/STEP/STL/DWG/DXF, ZIP.
 * Nesta fase: contratos e enfileiramento. Implementação plugável em fases futuras.
 */
import type { Asset, AssetKind } from "../types";

export type ProcessingStep =
  | "thumbnail"
  | "preview"
  | "metadata"
  | "dimensions"
  | "convert"
  | "ocr"
  | "hash";

export interface ProcessingJob {
  readonly assetId: string;
  readonly kind: AssetKind;
  readonly steps: readonly ProcessingStep[];
}

const STEPS_BY_KIND: Record<AssetKind, readonly ProcessingStep[]> = {
  image:    ["hash", "metadata", "dimensions", "thumbnail", "preview"],
  video:    ["hash", "metadata", "dimensions", "thumbnail", "preview"],
  audio:    ["hash", "metadata"],
  document: ["hash", "metadata", "preview", "ocr"],
  pdf:      ["hash", "metadata", "thumbnail", "preview", "ocr"],
  cad:      ["hash", "metadata", "preview"],
  model3d:  ["hash", "metadata", "dimensions", "thumbnail", "preview"],
  archive:  ["hash", "metadata"],
  other:    ["hash", "metadata"],
};

export function planProcessing(asset: Pick<Asset, "id" | "kind">): ProcessingJob {
  return { assetId: asset.id, kind: asset.kind, steps: STEPS_BY_KIND[asset.kind] };
}

export async function enqueueProcessing(asset: Pick<Asset, "id" | "kind">): Promise<ProcessingJob> {
  return planProcessing(asset);
}
