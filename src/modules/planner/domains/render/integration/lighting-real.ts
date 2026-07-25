/**
 * Fase 3.30 — Iluminação real: HDRI + Sun + Sky + Ambient + Spot + Area + IES + LED.
 */
import { RENDER_HDRIS, RENDER_LIGHT_PRESETS } from "../services/lighting";
import type { RenderHdri, RenderLightPreset } from "../types";

export interface RealLightingRig {
  readonly hdri: RenderHdri | null;
  readonly sun: RenderLightPreset | null;
  readonly ambient: RenderLightPreset | null;
  readonly extras: readonly RenderLightPreset[];
  readonly ledPresets: readonly RenderLightPreset[];
}

export function buildLightingRig(hdriId: string | null, extraIds: readonly string[] = []): RealLightingRig {
  const hdri = hdriId ? RENDER_HDRIS.find((h) => h.id === hdriId) ?? null : null;
  const sun = RENDER_LIGHT_PRESETS.find((l) => l.id === "light.sun.physical") ?? null;
  const ambient = RENDER_LIGHT_PRESETS.find((l) => l.id === "light.ambient.soft") ?? null;
  const extras = RENDER_LIGHT_PRESETS.filter((l) => extraIds.includes(l.id));
  const ledPresets = RENDER_LIGHT_PRESETS.filter((l) => l.kind === "led" || l.kind === "profile");
  return { hdri, sun, ambient, extras, ledPresets };
}