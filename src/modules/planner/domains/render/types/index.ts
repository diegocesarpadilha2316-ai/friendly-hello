/**
 * Fase 3.9 — Render Engine: tipos.
 *
 * Infraestrutura pura: nenhum motor externo, nenhum banco, nenhum store novo.
 * Toda a arquitetura descreve como qualquer backend futuro (Local, IA,
 * Nuvem, Vídeo, Marketing) receberá o mesmo `RenderJob`.
 */
import type { PlannerProject } from "@/modules/planner/shared/types/project";

// ————— Qualidade / presets —————
export type RenderPresetId =
  | "rascunho"
  | "baixa"
  | "media"
  | "alta"
  | "ultra"
  | "fotografica"
  | "marketing";

export type RenderQualityLevel = "off" | "baixa" | "media" | "alta" | "ultra";
export type RenderAAMode = "off" | "fxaa" | "taa" | "msaa2x" | "msaa4x" | "msaa8x";
export type RenderDenoiseMode = "off" | "temporal" | "oidn" | "optix" | "ai";

export interface RenderResolution {
  readonly width: number;
  readonly height: number;
  readonly label: string;
}

export interface RenderQuality {
  readonly shadows: RenderQualityLevel;
  readonly reflections: RenderQualityLevel;
  readonly globalIllumination: RenderQualityLevel;
  readonly ambientOcclusion: RenderQualityLevel;
  readonly quality: RenderQualityLevel;
  readonly antialiasing: RenderAAMode;
  readonly resolution: RenderResolution;
  readonly samples: number;
  readonly denoise: RenderDenoiseMode;
}

export interface RenderPreset {
  readonly id: RenderPresetId;
  readonly label: string;
  readonly description: string;
  readonly usage: readonly string[];
  readonly quality: RenderQuality;
  readonly recommendedFor: readonly RenderTargetKind[];
}

// ————— Iluminação —————
export type RenderLightKind =
  | "hdri"
  | "sun"
  | "ambient"
  | "area"
  | "spot"
  | "ies"
  | "led"
  | "profile"
  | "pendant"
  | "decorative";

export interface RenderHdri {
  readonly id: string;
  readonly label: string;
  readonly url?: string;
  readonly rotation: number;
  readonly intensity: number;
  readonly temperatureK: number;
  readonly category: "estudio" | "interior" | "exterior" | "noturno" | "nublado" | "ensolarado";
}

export interface RenderLightPreset {
  readonly id: string;
  readonly kind: RenderLightKind;
  readonly label: string;
  readonly intensity: number;
  readonly temperatureK: number;
  readonly castsShadows: boolean;
  readonly iesProfile?: string;
  readonly notes?: string;
}

// ————— Materiais PBR —————
export type PbrMaterialFamily =
  | "madeira"
  | "vidro"
  | "metal"
  | "inox"
  | "pedra"
  | "granito"
  | "marmore"
  | "quartzo"
  | "porcelanato"
  | "tecido"
  | "couro"
  | "mdf"
  | "mdp"
  | "laca"
  | "espelho";

export type PbrMapSlot =
  | "albedo"
  | "normal"
  | "roughness"
  | "metallic"
  | "displacement"
  | "ao"
  | "opacity"
  | "emission";

export interface PbrTextureMap {
  readonly slot: PbrMapSlot;
  readonly url?: string;
  readonly intensity: number;
  readonly tiling: readonly [number, number];
}

export interface PbrMaterial {
  readonly id: string;
  readonly family: PbrMaterialFamily;
  readonly label: string;
  readonly baseColorHex: string;
  readonly roughness: number;
  readonly metallic: number;
  readonly ior: number;
  readonly transmission: number;
  readonly emissive: number;
  readonly maps: readonly PbrTextureMap[];
  readonly tags: readonly string[];
}

// ————— Câmeras —————
export type RenderCameraKind =
  | "interior"
  | "exterior"
  | "top"
  | "isometrica"
  | "close"
  | "detalhe"
  | "automatica";

export interface RenderCameraPreset {
  readonly id: string;
  readonly kind: RenderCameraKind;
  readonly label: string;
  readonly focalLengthMm: number;
  readonly apertureF: number;
  readonly shutter: number;
  readonly iso: number;
  readonly heightMm: number;
  readonly targetHint: "olho" | "chao" | "teto" | "auto";
  readonly notes?: string;
}

// ————— Pós-processamento —————
export interface RenderPostProcessing {
  readonly bloom: { enabled: boolean; threshold: number; intensity: number };
  readonly tonemap: {
    enabled: boolean;
    operator: "aces" | "reinhard" | "filmic" | "neutral";
  };
  readonly colorGrading: {
    enabled: boolean;
    temperature: number;
    tint: number;
    contrast: number;
    saturation: number;
  };
  readonly exposure: number;
  readonly whiteBalanceK: number;
  readonly depthOfField: { enabled: boolean; focusDistanceMm: number; apertureF: number };
  readonly motionBlur: { enabled: boolean; shutter: number };
  readonly vignette: { enabled: boolean; intensity: number };
  readonly chromaticAberration: { enabled: boolean; intensity: number };
}

// ————— Fila / jobs —————
export type RenderTargetKind = "still" | "video" | "panorama" | "ai" | "marketing";
export type RenderProviderId =
  | "dioris.local"
  | "dioris.cloud"
  | "dioris.ai"
  | "dioris.video"
  | "dioris.marketing";

export type RenderJobStatus =
  | "queued"
  | "preparing"
  | "rendering"
  | "postprocessing"
  | "denoising"
  | "uploading"
  | "done"
  | "cancelled"
  | "failed";

export interface RenderJobConfig {
  readonly presetId: RenderPresetId;
  readonly quality: RenderQuality;
  readonly cameraId: string;
  readonly hdriId: string | null;
  readonly extraLightIds: readonly string[];
  readonly postProcessing: RenderPostProcessing;
  readonly target: RenderTargetKind;
  readonly providerId: RenderProviderId;
  readonly roomId: string | null;
  readonly environmentId: string | null;
  readonly durationSec?: number;
  readonly notes?: string;
}

export interface RenderJob {
  readonly id: string;
  readonly projectId: string;
  readonly projectVersion: number;
  readonly title: string;
  readonly status: RenderJobStatus;
  readonly progress: number;
  readonly stage: string;
  readonly config: RenderJobConfig;
  readonly result?: {
    readonly url?: string;
    readonly previewUrl?: string;
    readonly widthPx: number;
    readonly heightPx: number;
    readonly durationMs: number;
  };
  readonly error?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly startedAt?: string;
  readonly finishedAt?: string;
}

// ————— Cena de render (adapter) —————
export interface RenderSceneSummary {
  readonly projectId: string;
  readonly projectVersion: number;
  readonly environmentCount: number;
  readonly roomCount: number;
  readonly nodeCount: number;
  readonly lightNodeCount: number;
  readonly moduleNodeCount: number;
  readonly decorNodeCount: number;
  readonly wallCount: number;
  readonly floorAreaMm2: number;
}

export interface RenderScene {
  readonly source: PlannerProject;
  readonly summary: RenderSceneSummary;
}

// ————— Pipeline —————
export type RenderPipelineStageId =
  | "collect"
  | "prepare"
  | "lighting"
  | "materials"
  | "camera"
  | "raytrace"
  | "denoise"
  | "postprocess"
  | "encode"
  | "publish";

export interface RenderPipelineStage {
  readonly id: RenderPipelineStageId;
  readonly label: string;
  readonly description: string;
  readonly weight: number; // parcela relativa do progresso (0..1)
}

// ————— Provider (arquitetura futura) —————
export interface RenderProvider {
  readonly id: RenderProviderId;
  readonly label: string;
  readonly description: string;
  readonly supports: readonly RenderTargetKind[];
  readonly available: boolean;
}
