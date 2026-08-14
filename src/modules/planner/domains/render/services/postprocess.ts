/**
 * Fase 3.9 — Pós-processamento.
 */
import type { RenderPostProcessing, RenderPresetId } from "../types";

export const DEFAULT_POST_PROCESSING: RenderPostProcessing = {
  bloom: { enabled: true, threshold: 0.85, intensity: 0.5 },
  tonemap: { enabled: true, operator: "aces" },
  colorGrading: { enabled: true, temperature: 0, tint: 0, contrast: 1.05, saturation: 1.05 },
  exposure: 0,
  whiteBalanceK: 5600,
  depthOfField: { enabled: false, focusDistanceMm: 2500, apertureF: 4 },
  motionBlur: { enabled: false, shutter: 180 },
  vignette: { enabled: true, intensity: 0.15 },
  chromaticAberration: { enabled: false, intensity: 0.05 },
};

export function postForPreset(preset: RenderPresetId): RenderPostProcessing {
  switch (preset) {
    case "fotografica":
      return {
        ...DEFAULT_POST_PROCESSING,
        depthOfField: { enabled: true, focusDistanceMm: 2200, apertureF: 2.0 },
        chromaticAberration: { enabled: true, intensity: 0.08 },
        vignette: { enabled: true, intensity: 0.22 },
      };
    case "marketing":
      return {
        ...DEFAULT_POST_PROCESSING,
        bloom: { enabled: true, threshold: 0.75, intensity: 0.7 },
        colorGrading: { enabled: true, temperature: 100, tint: 0, contrast: 1.1, saturation: 1.15 },
      };
    case "cinema":
      return {
        ...DEFAULT_POST_PROCESSING,
        bloom: { enabled: true, threshold: 0.7, intensity: 0.9 },
        tonemap: { enabled: true, operator: "aces" },
        colorGrading: {
          enabled: true,
          temperature: -80,
          tint: 20,
          contrast: 1.2,
          saturation: 0.95,
        },
        depthOfField: { enabled: true, focusDistanceMm: 2500, apertureF: 1.8 },
        motionBlur: { enabled: true, shutter: 180 },
        vignette: { enabled: true, intensity: 0.28 },
        chromaticAberration: { enabled: true, intensity: 0.1 },
      };
    case "rascunho":
      return {
        ...DEFAULT_POST_PROCESSING,
        bloom: { enabled: false, threshold: 1, intensity: 0 },
        vignette: { enabled: false, intensity: 0 },
      };
    default:
      return DEFAULT_POST_PROCESSING;
  }
}
