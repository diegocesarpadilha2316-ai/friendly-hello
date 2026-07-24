/**
 * Fase 3.12 — Lentes premium (24/35/50/85mm).
 * Complementa o catálogo `../cameras.ts` sem duplicar câmeras.
 */
import type { LensPreset, LensPresetId } from "../../types/ultra";

export const LENS_PRESETS: readonly LensPreset[] = [
  { id: "24mm", focalLengthMm: 24, label: "Wide 24mm", usage: ["interiores amplos", "arquitetura"], recommendedApertureF: 5.6, minFocusMm: 250 },
  { id: "35mm", focalLengthMm: 35, label: "Reportagem 35mm", usage: ["ambientes médios", "documental"], recommendedApertureF: 4, minFocusMm: 300 },
  { id: "50mm", focalLengthMm: 50, label: "Normal 50mm", usage: ["cenas naturais", "retratos ambientais"], recommendedApertureF: 2.8, minFocusMm: 400 },
  { id: "85mm", focalLengthMm: 85, label: "Tele 85mm", usage: ["detalhes", "close premium"], recommendedApertureF: 2.0, minFocusMm: 850 },
];

export function getLens(id: LensPresetId): LensPreset {
  const l = LENS_PRESETS.find((x) => x.id === id);
  if (!l) throw new Error(`Lens desconhecida: ${id}`);
  return l;
}

export type { LensPreset, LensPresetId };