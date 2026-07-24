/**
 * Fase 3.24 — Precificação determinística por variante.
 */
import type { CatalogItem, CatalogPricingBreakdown, CatalogVariant } from "./types";
import { surfaceM2 } from "./parametric";
import { getMaterial } from "./materials";
import { getHandle } from "./handles";
import { getHinge } from "./hinges";
import { getSlide } from "./drawers";

export function priceVariant(item: CatalogItem, variant: CatalogVariant): CatalogPricingBreakdown {
  const base = item.basePrice;
  const mat = variant.materialId ? getMaterial(variant.materialId) : undefined;
  const material = mat ? Math.round(mat.pricePerM2 * surfaceM2(variant) * 100) / 100 : 0;
  const handle = variant.handleId ? getHandle(variant.handleId)?.price ?? 0 : 0;
  const hinge = item.defaults.hingeId ? getHinge(item.defaults.hingeId)?.price ?? 0 : 0;
  const slide = item.defaults.slideId ? getSlide(item.defaults.slideId)?.price ?? 0 : 0;
  const hardware = handle + hinge + slide;
  const extras = Object.values(variant.extras).reduce<number>((sum, v) => sum + (typeof v === "number" ? v : 0), 0);
  const total = Math.round((base + material + hardware + extras) * 100) / 100;
  return { base, material, hardware, extras, total };
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}