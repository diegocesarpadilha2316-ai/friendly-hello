/**
 * Fase 3.23 — RealTime Interactive Engine.
 *
 * Tipos puros. Zero providers/stores/managers/banco/migrations.
 * Toda mutação do projeto continua obrigatoriamente via `updateProject()`
 * do `PlannerEditorProvider` (Fase 3.1).
 */

export type RealtimeNavigationMode =
  | "walk"
  | "fps"
  | "orbit"
  | "drone"
  | "cliente"
  | "apresentacao"
  | "livre";

export type RealtimeQualityTier =
  | "eco"
  | "baixa"
  | "media"
  | "alta"
  | "ultra"
  | "cinema";

export type RealtimeWeatherId =
  | "sol"
  | "nublado"
  | "chuva"
  | "blue-hour"
  | "noite"
  | "nascer-sol"
  | "por-sol";

export type RealtimeTimeOfDay =
  | "06h"
  | "08h"
  | "10h"
  | "12h"
  | "15h"
  | "17h"
  | "18h"
  | "20h"
  | "22h";

export type RealtimeInputSource = "keyboard" | "mouse" | "touch" | "joystick" | "gamepad";

export interface RealtimeVec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface RealtimeCameraState {
  readonly mode: RealtimeNavigationMode;
  readonly positionMm: RealtimeVec3;
  readonly yawDeg: number;
  readonly pitchDeg: number;
  readonly fovDeg: number;
  readonly eyeHeightMm: number;
}

export interface RealtimeMovementProfile {
  readonly walkSpeedMs: number;
  readonly runSpeedMs: number;
  readonly crouchSpeedMs: number;
  readonly gravityMs2: number;
  readonly jumpMs: number;
  readonly rotationSpeedDegS: number;
  readonly touchSensitivity: number;
  readonly gamepadSensitivity: number;
}

export interface RealtimeCollisionProfile {
  readonly enabled: boolean;
  readonly radiusMm: number;
  readonly stepHeightMm: number;
  readonly slopeLimitDeg: number;
  readonly stairsAssist: boolean;
  readonly clampToBoundsMm: number;
}

export interface RealtimeGravityProfile {
  readonly enabled: boolean;
  readonly gravityMs2: number;
  readonly floorFriction: number;
  readonly airDamping: number;
}

export type RealtimeInteractionKind =
  | "open-door"
  | "close-door"
  | "open-drawer"
  | "close-drawer"
  | "led-on"
  | "led-off"
  | "swap-material"
  | "swap-color"
  | "swap-handle"
  | "swap-hardware"
  | "toggle-structure"
  | "toggle-slats"
  | "toggle-glass"
  | "toggle-mirror";

export interface RealtimeInteractionRequest {
  readonly kind: RealtimeInteractionKind;
  readonly nodeId: string;
  readonly payload?: Record<string, string | number | boolean>;
}

export interface RealtimeDoorState {
  readonly nodeId: string;
  readonly openRatio: number; // 0..1
  readonly maxAngleDeg: number;
  readonly hinge: "left" | "right" | "top" | "bottom";
}

export interface RealtimeDrawerState {
  readonly nodeId: string;
  readonly openRatio: number; // 0..1
  readonly travelMm: number;
}

export interface RealtimeLedState {
  readonly nodeId: string;
  readonly on: boolean;
  readonly intensity: number; // 0..1
  readonly temperatureK: number;
}

export interface RealtimeLightingState {
  readonly time: RealtimeTimeOfDay;
  readonly weather: RealtimeWeatherId;
  readonly sunIntensity: number;
  readonly sunTemperatureK: number;
  readonly hdriId: string | null;
  readonly hdriIntensity: number;
  readonly iesEnabled: boolean;
}

export interface RealtimeMaterialOverride {
  readonly nodeId: string;
  readonly materialId: string;
}

export interface RealtimeReflectionProfile {
  readonly ssrEnabled: boolean;
  readonly probesEnabled: boolean;
  readonly planarEnabled: boolean;
  readonly maxRoughness: number;
}

export interface RealtimeEnvironmentState {
  readonly hdriId: string | null;
  readonly fogDensity: number;
  readonly ambientHex: string;
  readonly horizonHex: string;
  readonly zenithHex: string;
}

export interface RealtimeWeatherState {
  readonly id: RealtimeWeatherId;
  readonly label: string;
  readonly cloudCover: number;
  readonly rainIntensity: number;
  readonly windMs: number;
  readonly fogDensity: number;
}

export interface RealtimeHotspot {
  readonly id: string;
  readonly nodeId: string;
  readonly label: string;
  readonly kind: "info" | "material" | "hardware" | "price" | "code" | "notes";
  readonly value: string;
}

export type RealtimeMeasureMode =
  | "distance"
  | "area"
  | "height"
  | "width"
  | "depth";

export interface RealtimeMeasurePoint {
  readonly id: string;
  readonly mode: RealtimeMeasureMode;
  readonly aMm: RealtimeVec3;
  readonly bMm: RealtimeVec3;
  readonly valueMm: number;
}

export interface RealtimePerformanceProfile {
  readonly tier: RealtimeQualityTier;
  readonly label: string;
  readonly targetFps: number;
  readonly resolutionScale: number;
  readonly lodEnabled: boolean;
  readonly streamingEnabled: boolean;
  readonly occlusionEnabled: boolean;
  readonly instancingEnabled: boolean;
  readonly mipmapsEnabled: boolean;
  readonly textureCompression: boolean;
  readonly autoQuality: boolean;
  readonly aa: "off" | "fxaa" | "taa" | "msaa2x" | "msaa4x";
}

export interface RealtimeViewportState {
  readonly navigation: RealtimeNavigationMode;
  readonly quality: RealtimeQualityTier;
  readonly fullscreen: boolean;
  readonly showGrid: boolean;
  readonly showMinimap: boolean;
  readonly showSafeArea: boolean;
  readonly showCompare: boolean;
  readonly showHotspots: boolean;
}

export interface RealtimeSelectionState {
  readonly selectedNodeIds: readonly string[];
  readonly hoverNodeId: string | null;
}

export interface RealtimeScreenshotRequest {
  readonly widthPx: number;
  readonly heightPx: number;
  readonly filename: string;
}

export interface RealtimeHardwareHint {
  readonly gpuTier: 0 | 1 | 2 | 3;
  readonly deviceMemoryGb: number;
  readonly logicalCores: number;
  readonly mobile: boolean;
  readonly webgpu: boolean;
  readonly openxr: boolean;
}