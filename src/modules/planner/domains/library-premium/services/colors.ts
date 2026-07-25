import type { PremiumColor, FinishType } from "../types";

export function normalizeColor(input: {
  id: string;
  name: string;
  code?: string | null;
  collection?: string | null;
  finish?: FinishType | null;
  hex?: string | null;
  previewUrl?: string | null;
}): PremiumColor {
  return {
    id: input.id,
    name: input.name,
    code: input.code ?? null,
    collection: input.collection ?? null,
    finish: input.finish ?? null,
    hex: input.hex ?? null,
    previewUrl: input.previewUrl ?? null,
    pbr: null,
  };
}

export function contrastText(hex: string | null | undefined): "#0b0f19" | "#f5f7fb" {
  if (!hex) return "#f5f7fb";
  const h = hex.replace("#", "");
  if (h.length !== 6) return "#f5f7fb";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return l > 0.6 ? "#0b0f19" : "#f5f7fb";
}