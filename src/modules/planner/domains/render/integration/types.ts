/**
 * Fase 3.30 — Render Enterprise Real (integração funcional).
 *
 * Camada 100% ADITIVA. Reutiliza os tipos existentes (Fase 3.9 / 3.21 /
 * Ultra / Realtime) sem introduzir Providers/Stores/Managers. Toda
 * mutação continua passando por `updateProject()`.
 */
import type {
  PbrMaterial,
  RenderCameraPreset,
  RenderHdri,
  RenderJob,
  RenderLightPreset,
  RenderPostProcessing,
  RenderPresetId,
  RenderScene,
  RenderSceneSummary,
  RenderTargetKind,
} from "../types";
import type {
  LocalCameraPreset,
  LocalPerformanceConfig,
  LocalTextureConfig,
} from "../local-engine/types";
import type { LocalRenderPlaybook } from "../local-engine/renderer";

/** Objeto renderizável real (paredes / piso / móveis / decoração / LED). */
export type RealObjectKind =
  | "wall"
  | "floor"
  | "ceiling"
  | "opening"
  | "module"
  | "drawer"
  | "door"
  | "shelf"
  | "glass"
  | "mirror"
  | "hardware"
  | "led"
  | "decor";

export interface RealObject {
  readonly id: string;
  readonly kind: RealObjectKind;
  readonly roomId: string;
  readonly materialId: string | null;
  readonly emissive: number;
  readonly castsShadow: boolean;
  readonly receivesShadow: boolean;
}

export interface RealLight {
  readonly id: string;
  readonly roomId: string;
  readonly presetId: string;
  readonly intensity: number;
  readonly temperatureK: number;
  readonly castsShadows: boolean;
}

export interface RealScene {
  readonly base: RenderScene;
  readonly summary: RenderSceneSummary;
  readonly objects: readonly RealObject[];
  readonly lights: readonly RealLight[];
  readonly hdri: RenderHdri | null;
  readonly cameras: readonly RenderCameraPreset[];
  readonly materials: readonly PbrMaterial[];
  readonly extraLights: readonly RenderLightPreset[];
}

/** Modos do viewport de comparação. */
export type ViewportCompareMode = "before" | "after" | "split" | "fullscreen";

export interface ViewportCompareState {
  readonly mode: ViewportCompareMode;
  readonly splitPercent: number; // 0..100
  readonly beforeJobId: string | null;
  readonly afterJobId: string | null;
}

/** Formato de exportação de imagem. */
export type RealExportFormat = "png" | "jpeg" | "webp" | "tiff";

export interface RealExportSpec {
  readonly format: RealExportFormat;
  readonly quality: number; // 0..1
  readonly bitDepth: 8 | 16 | 32;
  readonly width: number;
  readonly height: number;
  readonly filename?: string;
}

export interface RealExportResult {
  readonly filename: string;
  readonly mime: string;
  readonly bytes: number;
  readonly url: string; // blob URL (client-only) ou data URL
}

/** Configuração de reflexos / sombras / performance derivada do preset. */
export interface RealRenderConfig {
  readonly presetId: RenderPresetId;
  readonly target: RenderTargetKind;
  readonly playbook: LocalRenderPlaybook;
  readonly performance: LocalPerformanceConfig;
  readonly textures: LocalTextureConfig;
  readonly postProcessing: RenderPostProcessing;
  readonly cameras: readonly (RenderCameraPreset | LocalCameraPreset)[];
  readonly hdriId: string | null;
}

/** Snapshot de integração cross-domain. */
export interface RealIntegrationReport {
  readonly studio: boolean;
  readonly realtime: boolean;
  readonly video: boolean;
  readonly ai: boolean;
  readonly library: boolean;
  readonly production: boolean;
  readonly planner: boolean;
  readonly notes: readonly string[];
}

export interface RealJobSnapshot {
  readonly job: RenderJob;
  readonly durationMs: number;
  readonly stage: string;
  readonly progress: number;
}