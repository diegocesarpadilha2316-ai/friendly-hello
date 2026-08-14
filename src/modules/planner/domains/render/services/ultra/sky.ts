/**
 * Fase 3.12 — Presets de céu / atmosfera.
 */
import type { SkyMoodId, SkyPreset } from "../../types/ultra";

export const SKY_PRESETS: readonly SkyPreset[] = [
  {
    id: "dia",
    label: "Dia",
    turbidity: 2.5,
    rayleigh: 1.0,
    sunElevationDeg: 60,
    sunAzimuthDeg: 180,
    luminance: 1.0,
    temperatureK: 5600,
    hdriHint: "ultra.hdri.exterior.sunny",
  },
  {
    id: "noite",
    label: "Noite",
    turbidity: 1.5,
    rayleigh: 0.2,
    sunElevationDeg: -20,
    sunAzimuthDeg: 0,
    luminance: 0.05,
    temperatureK: 3200,
    hdriHint: "ultra.hdri.interior.night",
  },
  {
    id: "nublado",
    label: "Nublado",
    turbidity: 8.0,
    rayleigh: 2.0,
    sunElevationDeg: 45,
    sunAzimuthDeg: 200,
    luminance: 0.5,
    temperatureK: 6800,
    hdriHint: "ultra.hdri.exterior.cloudy",
  },
  {
    id: "tempestade",
    label: "Tempestade",
    turbidity: 10.0,
    rayleigh: 3.0,
    sunElevationDeg: 30,
    sunAzimuthDeg: 210,
    luminance: 0.25,
    temperatureK: 7200,
    hdriHint: "ultra.hdri.exterior.cloudy",
  },
  {
    id: "blue-hour",
    label: "Blue Hour",
    turbidity: 3.5,
    rayleigh: 2.5,
    sunElevationDeg: -5,
    sunAzimuthDeg: 260,
    luminance: 0.3,
    temperatureK: 8000,
    hdriHint: "ultra.hdri.bluehour",
  },
  {
    id: "por-do-sol",
    label: "Pôr do Sol",
    turbidity: 4.5,
    rayleigh: 3.5,
    sunElevationDeg: 5,
    sunAzimuthDeg: 270,
    luminance: 0.65,
    temperatureK: 3100,
    hdriHint: "ultra.hdri.sunset",
  },
  {
    id: "amanhecer",
    label: "Amanhecer",
    turbidity: 3.0,
    rayleigh: 2.5,
    sunElevationDeg: 7,
    sunAzimuthDeg: 90,
    luminance: 0.6,
    temperatureK: 3400,
    hdriHint: "ultra.hdri.sunset",
  },
  {
    id: "studio",
    label: "Studio",
    turbidity: 2.0,
    rayleigh: 0.5,
    sunElevationDeg: 90,
    sunAzimuthDeg: 0,
    luminance: 1.0,
    temperatureK: 5600,
    hdriHint: "ultra.hdri.studio.soft",
  },
];

export function getSkyPreset(id: SkyMoodId): SkyPreset {
  const s = SKY_PRESETS.find((x) => x.id === id);
  if (!s) throw new Error(`SkyPreset desconhecido: ${id}`);
  return s;
}
