/**
 * Fase 3.17 — Viewport Ultra Realista.
 *
 * Tipos puros. Zero providers/stores/managers/migrations. Toda mutação
 * de projeto continua obrigatoriamente via `updateProject()` do
 * `PlannerEditorProvider` (Fase 3.1).
 */
import type { PbrMaterial } from "../types";

export type RealtimeQualityTier = "baixo" | "medio" | "alto" | "ultra" | "cinema";

export type RealtimeWeatherId =
  | "ensolarado"
  | "nublado"
  | "chuva"
  | "fim-tarde"
  | "nascer-sol"
  | "noite"
  | "blue-hour";

export type RealtimeTimeOfDay = "06h" | "08h" | "12h" | "15h" | "18h" | "21h";

export type RealtimeCameraMode =
  | "walk"
  | "fps"
  | "orbita"
  | "drone"
  | "interior"
  | "exterior"
  | "cliente"
  | "apresentacao";

export type RealtimeViewportMode = "trabalho" | "cliente" | "apresentacao";

export interface RealtimeSunState {
  readonly azimuthDeg: number;
  readonly elevationDeg: number;
  readonly intensity: number;
  readonly temperatureK: number;
}

export interface RealtimeSkyState {
  readonly turbidity: number;
  readonly rayleigh: number;
  readonly mieCoefficient: number;
  readonly mieDirectionalG: number;
  readonly horizonHex: string;
  readonly zenithHex: string;
}

export interface RealtimeWeatherState {
  readonly id: RealtimeWeatherId;
  readonly label: string;
  readonly cloudCover: number;
  readonly rainIntensity: number;
  readonly fogDensity: number;
  readonly ambientHex: string;
}

export interface RealtimeLightingState {
  readonly sun: RealtimeSunState;
  readonly sky: RealtimeSkyState;
  readonly hdriId: string | null;
  readonly hdriIntensity: number;
  readonly indirectMultiplier: number;
  readonly aoIntensity: number;
  readonly rayTracing: boolean;
  readonly pathTracing: boolean;
}

export interface RealtimeAssetItem {
  readonly id: string;
  readonly label: string;
  readonly category: string;
  readonly widthMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
  readonly tags: readonly string[];
}

export interface RealtimeMaterialSlotState {
  readonly nodeId: string;
  readonly materialId: PbrMaterial["id"];
}

export interface RealtimePerformanceProfile {
  readonly tier: RealtimeQualityTier;
  readonly label: string;
  readonly targetFps: number;
  readonly maxLights: number;
  readonly maxShadowMaps: number;
  readonly resolutionScale: number;
  readonly aa: "off" | "fxaa" | "taa" | "msaa2x" | "msaa4x";
  readonly ssrEnabled: boolean;
  readonly ssaoEnabled: boolean;
  readonly bloomEnabled: boolean;
  readonly rayTracingEnabled: boolean;
  readonly pathTracingEnabled: boolean;
}

export interface RealtimeHardwareHint {
  readonly gpuTier: 0 | 1 | 2 | 3;
  readonly deviceMemoryGb: number;
  readonly logicalCores: number;
  readonly mobile: boolean;
  readonly webgpu: boolean;
}

export interface RealtimeViewportState {
  readonly mode: RealtimeViewportMode;
  readonly camera: RealtimeCameraMode;
  readonly showGuides: boolean;
  readonly showGrid: boolean;
  readonly showAxes: boolean;
  readonly showTools: boolean;
  readonly fullscreen: boolean;
  readonly quality: RealtimeQualityTier;
  readonly time: RealtimeTimeOfDay;
  readonly weather: RealtimeWeatherId;
}

export type RealtimeAiProviderId =
  | "openai"
  | "gemini"
  | "claude"
  | "runway"
  | "kling"
  | "luma";

export interface RealtimeAiHook {
  readonly id: RealtimeAiProviderId;
  readonly label: string;
  readonly capability: "chat" | "image" | "video";
  readonly ready: false;
  readonly notes: string;
}

export interface RealtimePresentationStep {
  readonly id: string;
  readonly label: string;
  readonly camera: RealtimeCameraMode;
  readonly time: RealtimeTimeOfDay;
  readonly weather: RealtimeWeatherId;
  readonly durationSec: number;
  readonly openDoors: boolean;
  readonly openDrawers: boolean;
  readonly ledOn: boolean;
}