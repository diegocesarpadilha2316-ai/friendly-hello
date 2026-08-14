/**
 * Fase 3.17 — Iluminação Realtime.
 */
import type {
  RealtimeLightingState,
  RealtimeQualityTier,
  RealtimeSunState,
  RealtimeTimeOfDay,
  RealtimeWeatherId,
} from "./types";

const SUN_BY_TIME: Record<RealtimeTimeOfDay, RealtimeSunState> = {
  "06h": { azimuthDeg: 85, elevationDeg: 6, intensity: 0.55, temperatureK: 2400 },
  "08h": { azimuthDeg: 100, elevationDeg: 28, intensity: 0.85, temperatureK: 4200 },
  "12h": { azimuthDeg: 180, elevationDeg: 78, intensity: 1.15, temperatureK: 5800 },
  "15h": { azimuthDeg: 235, elevationDeg: 52, intensity: 1.05, temperatureK: 5400 },
  "18h": { azimuthDeg: 275, elevationDeg: 8, intensity: 0.6, temperatureK: 2800 },
  "21h": { azimuthDeg: 300, elevationDeg: -12, intensity: 0.1, temperatureK: 6800 },
};

const WEATHER_MULT: Record<RealtimeWeatherId, number> = {
  ensolarado: 1.0,
  nublado: 0.55,
  chuva: 0.4,
  "fim-tarde": 0.75,
  "nascer-sol": 0.65,
  noite: 0.08,
  "blue-hour": 0.35,
};

export function computeSun(time: RealtimeTimeOfDay, weather: RealtimeWeatherId): RealtimeSunState {
  const base = SUN_BY_TIME[time];
  return { ...base, intensity: Math.max(0, base.intensity * WEATHER_MULT[weather]) };
}

export function computeSky(time: RealtimeTimeOfDay, weather: RealtimeWeatherId) {
  const day = time === "12h" || time === "15h";
  const dawn = time === "06h" || time === "08h";
  const dusk = time === "18h";
  const night = time === "21h";
  const cloudy = weather === "nublado" || weather === "chuva";
  return {
    turbidity: cloudy ? 8 : dawn || dusk ? 4 : 2,
    rayleigh: night ? 0.5 : 2,
    mieCoefficient: cloudy ? 0.02 : 0.005,
    mieDirectionalG: 0.8,
    horizonHex: night ? "#0b1220" : dawn ? "#f6b17a" : dusk ? "#e0715c" : "#d7e6f5",
    zenithHex: night ? "#02040a" : day ? "#4a86c8" : dusk ? "#6a4a7a" : "#88a8cc",
  };
}

export function buildLighting(
  time: RealtimeTimeOfDay,
  weather: RealtimeWeatherId,
  quality: RealtimeQualityTier,
): RealtimeLightingState {
  return {
    sun: computeSun(time, weather),
    sky: computeSky(time, weather),
    hdriId: null,
    hdriIntensity: 1,
    indirectMultiplier: quality === "cinema" ? 1.4 : quality === "ultra" ? 1.2 : 1,
    aoIntensity: quality === "baixo" ? 0.3 : quality === "medio" ? 0.6 : 0.9,
    rayTracing: quality === "ultra" || quality === "cinema",
    pathTracing: quality === "cinema",
  };
}
