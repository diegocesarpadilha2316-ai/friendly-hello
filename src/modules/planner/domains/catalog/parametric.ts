/**
 * Fase 3.24 — Motor paramétrico. Valida e normaliza dimensões.
 */
import type { CatalogItem, CatalogParametric, CatalogVariant } from "./types";

function snap(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeDimensions(
  parametric: CatalogParametric,
  raw: { widthMm?: number; heightMm?: number; depthMm?: number },
  defaults: CatalogItem["defaults"],
): { widthMm: number; heightMm: number; depthMm: number } {
  const w = clamp(
    snap(raw.widthMm ?? defaults.widthMm, parametric.widthMm.step),
    parametric.widthMm.min,
    parametric.widthMm.max,
  );
  const h = clamp(
    snap(raw.heightMm ?? defaults.heightMm, parametric.heightMm.step),
    parametric.heightMm.min,
    parametric.heightMm.max,
  );
  const d = clamp(
    snap(raw.depthMm ?? defaults.depthMm, parametric.depthMm.step),
    parametric.depthMm.min,
    parametric.depthMm.max,
  );
  return { widthMm: w, heightMm: h, depthMm: d };
}

export function createVariant(
  item: CatalogItem,
  patch: Partial<Omit<CatalogVariant, "id" | "itemId">>,
): CatalogVariant {
  const dims = normalizeDimensions(item.parametric, patch, item.defaults);
  return {
    id: `${item.id}-${dims.widthMm}x${dims.heightMm}x${dims.depthMm}-${Date.now().toString(36)}`,
    itemId: item.id,
    widthMm: dims.widthMm,
    heightMm: dims.heightMm,
    depthMm: dims.depthMm,
    materialId: patch.materialId ?? item.defaults.materialId,
    handleId: patch.handleId ?? item.defaults.handleId,
    extras: patch.extras ?? {},
  };
}

export function volumeM3(variant: CatalogVariant): number {
  return (variant.widthMm * variant.heightMm * variant.depthMm) / 1_000_000_000;
}

export function surfaceM2(variant: CatalogVariant): number {
  const w = variant.widthMm / 1000;
  const h = variant.heightMm / 1000;
  const d = variant.depthMm / 1000;
  return 2 * (w * h + w * d + h * d);
}
