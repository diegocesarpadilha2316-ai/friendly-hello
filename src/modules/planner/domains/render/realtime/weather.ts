/**
 * Fase 3.17 — Presets de clima.
 */
import type { RealtimeWeatherId, RealtimeWeatherState } from "./types";

export const REALTIME_WEATHER: Record<RealtimeWeatherId, RealtimeWeatherState> = {
  ensolarado: { id: "ensolarado", label: "Ensolarado", cloudCover: 0.1, rainIntensity: 0, fogDensity: 0.0, ambientHex: "#e6f0ff" },
  nublado: { id: "nublado", label: "Nublado", cloudCover: 0.85, rainIntensity: 0, fogDensity: 0.02, ambientHex: "#bcc6d4" },
  chuva: { id: "chuva", label: "Chuva", cloudCover: 0.95, rainIntensity: 0.7, fogDensity: 0.06, ambientHex: "#8894a6" },
  "fim-tarde": { id: "fim-tarde", label: "Fim de tarde", cloudCover: 0.25, rainIntensity: 0, fogDensity: 0.01, ambientHex: "#f2c199" },
  "nascer-sol": { id: "nascer-sol", label: "Nascer do sol", cloudCover: 0.2, rainIntensity: 0, fogDensity: 0.02, ambientHex: "#f6b17a" },
  noite: { id: "noite", label: "Noite", cloudCover: 0.3, rainIntensity: 0, fogDensity: 0.03, ambientHex: "#0b1220" },
  "blue-hour": { id: "blue-hour", label: "Blue Hour", cloudCover: 0.3, rainIntensity: 0, fogDensity: 0.02, ambientHex: "#3d5a80" },
};

export const REALTIME_WEATHER_LIST: readonly RealtimeWeatherState[] = Object.values(REALTIME_WEATHER);