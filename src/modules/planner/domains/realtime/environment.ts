/**
 * Fase 3.23 — Ambiente global.
 */
import type { RealtimeEnvironmentState, RealtimeWeatherId } from "./types";

export const DEFAULT_ENVIRONMENT: RealtimeEnvironmentState = {
  hdriId: null,
  fogDensity: 0,
  ambientHex: "#87a3c4",
  horizonHex: "#c9d6e2",
  zenithHex: "#5b7cb8",
};

export function environmentForWeather(w: RealtimeWeatherId): RealtimeEnvironmentState {
  switch (w) {
    case "sol": return { hdriId: null, fogDensity: 0, ambientHex: "#a9c4e8", horizonHex: "#dee9f5", zenithHex: "#4a7bc4" };
    case "nublado": return { hdriId: null, fogDensity: 0.05, ambientHex: "#8b95a3", horizonHex: "#b2bcc7", zenithHex: "#6b7787" };
    case "chuva": return { hdriId: null, fogDensity: 0.12, ambientHex: "#5b6472", horizonHex: "#7c8593", zenithHex: "#3f4855" };
    case "blue-hour": return { hdriId: null, fogDensity: 0.03, ambientHex: "#3a4a72", horizonHex: "#6c82b3", zenithHex: "#1e2b52" };
    case "noite": return { hdriId: null, fogDensity: 0.02, ambientHex: "#0f1626", horizonHex: "#243149", zenithHex: "#050916" };
    case "nascer-sol": return { hdriId: null, fogDensity: 0.04, ambientHex: "#f2a67a", horizonHex: "#ffd0a1", zenithHex: "#7f5aa8" };
    case "por-sol": return { hdriId: null, fogDensity: 0.03, ambientHex: "#e58a52", horizonHex: "#ffb271", zenithHex: "#5a3d7a" };
  }
}

export function setEnvironmentHdri(s: RealtimeEnvironmentState, hdriId: string | null): RealtimeEnvironmentState {
  return { ...s, hdriId };
}