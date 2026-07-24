/**
 * Fase 3.21 — Renderizador Local Gratuito Enterprise.
 *
 * Tipos puros do motor local. Todo o pipeline é determinístico e
 * roda 100% em CPU/WebGL/WebGPU futuros. Nenhum provider externo,
 * nenhuma dependência de IA, nenhum estado global — apenas contratos.
 */
import type {
  PbrMaterialFamily,
  RenderAAMode,
  RenderCameraKind,
  RenderDenoiseMode,
  RenderLightKind,
  RenderPostProcessing,
  RenderQuality,
  RenderQualityLevel,
  RenderResolution,
} from "../types";

// ————— Formatos de saída —————
export type LocalImageFormat = "png" | "jpeg" | "webp" | "tiff";
export type LocalBitDepth = 8 | 16 | 32;

export interface LocalOutputSpec {
  readonly format: LocalImageFormat;
  readonly bitDepth: LocalBitDepth;
  readonly quality: number; // 0..1 (usado por JPEG/WebP)
  readonly resolution: RenderResolution;
}

// ————— Presets de qualidade locais —————
export type LocalQualityId =
  | "rascunho"
  | "baixa"
  | "media"
  | "alta"
  | "ultra"
  | "cinema";

export interface LocalQualityPreset {
  readonly id: LocalQualityId;
  readonly label: string;
  readonly description: string;
  readonly quality: RenderQuality;
  readonly aa: RenderAAMode;
  readonly denoise: RenderDenoiseMode;
  readonly reflectionBounces: number;
  readonly giBounces: number;
  readonly shadowSamples: number;
  readonly aoSamples: number;
}

// ————— Iluminação —————
export type LocalLightPresetId =
  | "hdri"
  | "sun"
  | "ambient"
  | "area"
  | "spot"
  | "ies"
  | "led"
  | "profile"
  | "pendant"
  | "abajur"
  | "arandela"
  | "plafon";

export interface LocalLightPreset {
  readonly id: LocalLightPresetId;
  readonly kind: RenderLightKind;
  readonly label: string;
  readonly intensity: number;
  readonly temperatureK: number;
  readonly castsShadows: boolean;
  readonly indoor: boolean;
}

// ————— Materiais (reuso da lib Ultra) —————
export interface LocalMaterialSelection {
  readonly slot: PbrMaterialFamily;
  readonly materialId: string;
}

// ————— Câmeras —————
export type LocalCameraKind =
  | RenderCameraKind
  | "cliente"
  | "apresentacao"
  | "livre";

export interface LocalCameraPreset {
  readonly id: string;
  readonly kind: LocalCameraKind;
  readonly label: string;
  readonly focalLengthMm: number;
  readonly apertureF: number;
  readonly shutter: number;
  readonly iso: number;
  readonly heightMm: number;
  readonly notes?: string;
}

// ————— Reflexos / Sombras / GI —————
export interface LocalReflectionConfig {
  readonly fresnel: boolean;
  readonly physical: boolean;
  readonly refraction: boolean;
  readonly bounces: number;
  readonly rougnessCutoff: number;
}

export type LocalShadowKind = "soft" | "contact" | "ao" | "ray";

export interface LocalShadowConfig {
  readonly kinds: readonly LocalShadowKind[];
  readonly softness: number;
  readonly samples: number;
}

export interface LocalGIConfig {
  readonly enabled: boolean;
  readonly screenSpace: boolean;
  readonly bounces: number;
  readonly indirectIntensity: number;
  readonly lightBounce: boolean;
}

// ————— Texturas —————
export type LocalTextureCompression = "none" | "basisu" | "ktx2" | "dxt5";

export interface LocalTextureConfig {
  readonly mipmaps: boolean;
  readonly anisotropy: 1 | 2 | 4 | 8 | 16;
  readonly maxSize: 512 | 1024 | 2048 | 4096 | 8192;
  readonly compression: LocalTextureCompression;
  readonly streaming: boolean;
}

// ————— Animação / captura —————
export type LocalCaptureScope =
  | "single"
  | "batch"
  | "all-environments"
  | "current-environment"
  | "selection";

export interface LocalCaptureRequest {
  readonly scope: LocalCaptureScope;
  readonly qualityId: LocalQualityId;
  readonly output: LocalOutputSpec;
  readonly cameraIds: readonly string[];
  readonly roomIds: readonly string[];
  readonly notes?: string;
}

// ————— Fila de jobs locais —————
export type LocalJobStatus =
  | "queued"
  | "preparing"
  | "rendering"
  | "postprocessing"
  | "encoding"
  | "done"
  | "cancelled"
  | "failed";

export interface LocalJobResult {
  readonly widthPx: number;
  readonly heightPx: number;
  readonly bytes: number;
  readonly durationMs: number;
  readonly previewUrl?: string;
}

export interface LocalRenderJob {
  readonly id: string;
  readonly projectId: string;
  readonly projectVersion: number;
  readonly title: string;
  readonly status: LocalJobStatus;
  readonly progress: number;
  readonly stage: string;
  readonly qualityId: LocalQualityId;
  readonly output: LocalOutputSpec;
  readonly cameraId: string;
  readonly roomId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly startedAt?: string;
  readonly finishedAt?: string;
  readonly result?: LocalJobResult;
  readonly error?: string;
}

// ————— Performance —————
export type LocalPerformanceTier = "eco" | "balanced" | "alto" | "extremo";

export interface LocalPerformanceConfig {
  readonly tier: LocalPerformanceTier;
  readonly lod: boolean;
  readonly streaming: boolean;
  readonly mipmaps: boolean;
  readonly instancing: boolean;
  readonly occlusionCulling: boolean;
  readonly frustumCulling: boolean;
  readonly cache: boolean;
  readonly compression: boolean;
}

// ————— Viewport —————
export type LocalViewportMode =
  | "realtime"
  | "preview"
  | "fullscreen"
  | "before-after"
  | "quality-compare";

export interface LocalViewportState {
  readonly mode: LocalViewportMode;
  readonly aspect: "16:9" | "4:3" | "1:1" | "3:2" | "livre";
  readonly showGrid: boolean;
  readonly showSafeArea: boolean;
  readonly exposure: number;
  readonly qualityCompare: readonly [LocalQualityId, LocalQualityId];
}

// ————— Cena local (contrato para o motor) —————
export interface LocalRenderScene {
  readonly projectId: string;
  readonly projectVersion: number;
  readonly roomCount: number;
  readonly moduleCount: number;
  readonly lightCount: number;
  readonly wallCount: number;
  readonly triangleEstimate: number;
  readonly bboxMm: { readonly w: number; readonly d: number; readonly h: number };
}

// ————— Pós-processamento local (alias reutilizado) —————
export type LocalPostProcessing = RenderPostProcessing;

// ————— Utilidades exportadas —————
export type LocalQualityLevel = RenderQualityLevel;
export type LocalDenoise = RenderDenoiseMode;
export type LocalAA = RenderAAMode;