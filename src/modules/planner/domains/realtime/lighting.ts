/**
 * Fase 3.23 — Iluminação em tempo real.
 */
import type { RealtimeLightingState, RealtimeTimeOfDay, RealtimeWeatherId } from "./types";

export const DEFAULT_LIGHTING: RealtimeLightingState = {
  time: "12h",
  weather: "sol",
  sunIntensity: 1,
  sunTemperatureK: 5600,
  hdriId: null,
  hdriIntensity: 1,
  iesEnabled: false,
};

const TIME_TEMPERATURE: Record<RealtimeTimeOfDay, number> = {
  "06h": 3500, "08h": 4800, "10h": 5400, "12h": 6500, "15h": 6000,
  "17h": 5200, "18h": 4200, "20h": 3600, "22h": 3000,
};

const TIME_INTENSITY: Record<RealtimeTimeOfDay, number> = {
  "06h": 0.4, "08h": 0.75, "10h": 0.95, "12h": 1.0, "15h": 0.9,
  "17h": 0.75, "18h": 0.55, "20h": 0.2, "22h": 0.08,
};

function weatherMultiplier(w: RealtimeWeatherId): number {
  switch (w) {
    case "sol": return 1;
    case "nublado": return 0.55;
    case "chuva": return 0.35;
    case "blue-hour": return 0.25;
    case "noite": return 0.05;
    case "nascer-sol": return 0.45;
    case "por-sol": return 0.5;
  }
}

export function setTime(s: RealtimeLightingState, time: RealtimeTimeOfDay): RealtimeLightingState {
  return {
    ...s,
    time,
    sunTemperatureK: TIME_TEMPERATURE[time],
    sunIntensity: TIME_INTENSITY[time] * weatherMultiplier(s.weather),
  };
}

export function setWeather(s: RealtimeLightingState, weather: RealtimeWeatherId): RealtimeLightingState {
  return { ...s, weather, sunIntensity: TIME_INTENSITY[s.time] * weatherMultiplier(weather) };
}

export function setHdri(s: RealtimeLightingState, hdriId: string | null, intensity = s.hdriIntensity): RealtimeLightingState {
  return { ...s, hdriId, hdriIntensity: intensity };
}

export function setSunIntensity(s: RealtimeLightingState, intensity: number): RealtimeLightingState {
  return { ...s, sunIntensity: Math.max(0, Math.min(4, intensity)) };
}

export function setSunTemperature(s: RealtimeLightingState, k: number): RealtimeLightingState {
  return { ...s, sunTemperatureK: Math.max(1500, Math.min(15000, k)) };
}

export function toggleIes(s: RealtimeLightingState): RealtimeLightingState {
  return { ...s, iesEnabled: !s.iesEnabled };
}

export const REALTIME_TIME_OPTIONS: readonly RealtimeTimeOfDay[] = [
  "06h", "08h", "10h", "12h", "15h", "17h", "18h", "20h", "22h",
];