/**
 * Fase 3.24 — Utilitários de variantes.
 */
import type { CatalogItem, CatalogVariant } from "./types";
import { createVariant } from "./parametric";

export function defaultVariant(item: CatalogItem): CatalogVariant {
  return createVariant(item, {});
}

export function withMaterial(item: CatalogItem, variant: CatalogVariant, materialId: string): CatalogVariant {
  return { ...variant, materialId };
}

export function withHandle(item: CatalogItem, variant: CatalogVariant, handleId: string): CatalogVariant {
  return { ...variant, handleId };
}

export function withDimensions(
  item: CatalogItem,
  variant: CatalogVariant,
  dims: { widthMm?: number; heightMm?: number; depthMm?: number },
): CatalogVariant {
  return createVariant(item, {
    materialId: variant.materialId,
    handleId: variant.handleId,
    extras: variant.extras,
    widthMm: dims.widthMm ?? variant.widthMm,
    heightMm: dims.heightMm ?? variant.heightMm,
    depthMm: dims.depthMm ?? variant.depthMm,
  });
}