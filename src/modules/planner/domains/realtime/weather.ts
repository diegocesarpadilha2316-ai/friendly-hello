/**
 * Fase 3.23 — Clima interativo.
 */
import type { RealtimeWeatherId, RealtimeWeatherState } from "./types";

const WEATHER: Record<RealtimeWeatherId, RealtimeWeatherState> = {
  sol: {
    id: "sol",
    label: "Ensolarado",
    cloudCover: 0.05,
    rainIntensity: 0,
    windMs: 1.5,
    fogDensity: 0,
  },
  nublado: {
    id: "nublado",
    label: "Nublado",
    cloudCover: 0.85,
    rainIntensity: 0,
    windMs: 3,
    fogDensity: 0.05,
  },
  chuva: {
    id: "chuva",
    label: "Chuva",
    cloudCover: 0.95,
    rainIntensity: 0.7,
    windMs: 5,
    fogDensity: 0.12,
  },
  "blue-hour": {
    id: "blue-hour",
    label: "Blue Hour",
    cloudCover: 0.3,
    rainIntensity: 0,
    windMs: 1,
    fogDensity: 0.03,
  },
  noite: {
    id: "noite",
    label: "Noite",
    cloudCover: 0.2,
    rainIntensity: 0,
    windMs: 1,
    fogDensity: 0.02,
  },
  "nascer-sol": {
    id: "nascer-sol",
    label: "Nascer do Sol",
    cloudCover: 0.25,
    rainIntensity: 0,
    windMs: 1.5,
    fogDensity: 0.04,
  },
  "por-sol": {
    id: "por-sol",
    label: "Pôr do Sol",
    cloudCover: 0.3,
    rainIntensity: 0,
    windMs: 2,
    fogDensity: 0.03,
  },
};

export const REALTIME_WEATHER_OPTIONS: readonly RealtimeWeatherId[] = [
  "sol",
  "nublado",
  "chuva",
  "blue-hour",
  "noite",
  "nascer-sol",
  "por-sol",
];

export function weatherState(id: RealtimeWeatherId): RealtimeWeatherState {
  return WEATHER[id];
}
export function weatherLabel(id: RealtimeWeatherId): string {
  return WEATHER[id].label;
}
