/**
 * Fase 3.10 — Video Engine: tipos.
 *
 * Infraestrutura pura. Nenhum motor externo, nenhum store novo, nenhum
 * banco. O Video Engine consome exclusivamente o Render Engine (Fase 3.9)
 * para produzir os frames — não duplica render.
 *
 * Toda a arquitetura descreve como qualquer backend (Motor Gratuito
 * baseado em algoritmo próprio, ou Motor Premium: Runway / Pika / Luma /
 * Kling / OpenAI / Gemini / etc.) receberá o mesmo `VideoJob`.
 */
import type { PlannerProject } from "@/modules/planner/shared/types/project";
import type { RenderPresetId, RenderProviderId } from "../../render/types";

// ————— Movimentos de câmera —————
export type VideoCameraMoveKind =
  | "orbit"
  | "fly-through"
  | "walk-through"
  | "pan"
  | "tilt"
  | "zoom"
  | "travelling"
  | "close"
  | "detail"
  | "auto";

export type VideoEasing =
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "cinematic"
  | "snap";

export interface VideoCameraMove {
  readonly id: string;
  readonly kind: VideoCameraMoveKind;
  readonly label: string;
  readonly description: string;
  readonly durationSec: number;
  readonly easing: VideoEasing;
  /** parâmetros específicos do movimento — livres, sempre serializáveis */
  readonly params: Readonly<Record<string, number | string | boolean>>;
}

// ————— Animações de cena —————
export type VideoAnimationKind =
  | "door-open"
  | "door-close"
  | "drawer-open"
  | "drawer-close"
  | "led-on"
  | "led-off"
  | "lighting-swap"
  | "camera-move"
  | "scene-transition"
  | "explode"
  | "show-structure"
  | "show-hardware"
  | "show-cut";

export interface VideoAnimation {
  readonly id: string;
  readonly kind: VideoAnimationKind;
  readonly label: string;
  /** id do nó paramétrico alvo (opcional para animações de câmera/luz) */
  readonly targetNodeId?: string;
  readonly startSec: number;
  readonly durationSec: number;
  readonly easing: VideoEasing;
  readonly params: Readonly<Record<string, number | string | boolean>>;
}

// ————— Timeline / keyframes —————
export type VideoTrackKind = "camera" | "animation" | "lighting" | "narration" | "music" | "subtitle" | "branding";

export interface VideoKeyframe {
  readonly id: string;
  readonly atSec: number;
  readonly value: number | string | boolean;
  readonly easing: VideoEasing;
  readonly label?: string;
}

export interface VideoTrack {
  readonly id: string;
  readonly kind: VideoTrackKind;
  readonly label: string;
  readonly startSec: number;
  readonly durationSec: number;
  readonly loop: boolean;
  readonly muted: boolean;
  readonly locked: boolean;
  readonly keyframes: readonly VideoKeyframe[];
  /** referência opaca ao item que a track anima (moveId, animationId, sceneId, ...) */
  readonly refId?: string;
}

export interface VideoSequence {
  readonly id: string;
  readonly label: string;
  readonly startSec: number;
  readonly durationSec: number;
  /** velocidade relativa (1 = tempo real; 0.5 = câmera lenta; 2 = time-lapse) */
  readonly speed: number;
  readonly loops: number;
  readonly pauseAfterSec: number;
  readonly transitionIn: VideoTransition;
  readonly transitionOut: VideoTransition;
  readonly roomId?: string;
  readonly cameraMoveId?: string;
  readonly animationIds: readonly string[];
}

export type VideoTransitionKind =
  | "cut"
  | "fade"
  | "dissolve"
  | "wipe"
  | "slide"
  | "zoom"
  | "iris"
  | "morph";

export interface VideoTransition {
  readonly kind: VideoTransitionKind;
  readonly durationSec: number;
  readonly easing: VideoEasing;
}

export interface VideoTimeline {
  readonly fps: 24 | 25 | 30 | 48 | 50 | 60;
  readonly durationSec: number;
  readonly tracks: readonly VideoTrack[];
  readonly sequences: readonly VideoSequence[];
}

// ————— Cenas pré-prontas —————
export type VideoSceneKind =
  | "apresentacao"
  | "cliente"
  | "marketing"
  | "instagram"
  | "reels"
  | "youtube"
  | "catalogo";

export interface VideoScenePreset {
  readonly id: string;
  readonly kind: VideoSceneKind;
  readonly label: string;
  readonly description: string;
  readonly durationSec: number;
  readonly aspectRatio: VideoAspectRatio;
  readonly recommendedFormatIds: readonly string[];
  readonly usage: readonly string[];
}

// ————— Exportação —————
export type VideoContainer = "mp4" | "mov" | "gif" | "png-sequence";
export type VideoResolutionTier = "hd" | "fhd" | "qhd" | "4k" | "8k";
export type VideoAspectRatio = "16:9" | "9:16" | "1:1" | "4:5" | "21:9";

export interface VideoResolution {
  readonly width: number;
  readonly height: number;
  readonly tier: VideoResolutionTier;
  readonly label: string;
}

export interface VideoExportFormat {
  readonly id: string;
  readonly label: string;
  readonly container: VideoContainer;
  readonly aspect: VideoAspectRatio;
  readonly resolution: VideoResolution;
  readonly fps: 24 | 25 | 30 | 48 | 50 | 60;
  readonly bitrateKbps: number;
  readonly codec: "h264" | "h265" | "prores" | "gif" | "png";
  readonly notes?: string;
}

// ————— Presets de qualidade de vídeo —————
export type VideoPresetId =
  | "rascunho"
  | "social"
  | "cliente"
  | "marketing"
  | "cinematografico";

export interface VideoPreset {
  readonly id: VideoPresetId;
  readonly label: string;
  readonly description: string;
  readonly formatId: string;
  readonly renderPresetId: RenderPresetId;
  readonly durationSec: number;
  readonly recommendedFor: readonly VideoSceneKind[];
}

// ————— Motores (Gratuito / Premium) —————
export type VideoEngineTier = "free" | "premium";
export type VideoEngineId =
  | "dioris.free"
  | "dioris.premium.runway"
  | "dioris.premium.pika"
  | "dioris.premium.luma"
  | "dioris.premium.kling"
  | "dioris.premium.openai"
  | "dioris.premium.gemini";

export interface VideoEngine {
  readonly id: VideoEngineId;
  readonly tier: VideoEngineTier;
  readonly label: string;
  readonly description: string;
  readonly features: readonly string[];
  readonly available: boolean;
  /** exige integração externa? (true em todos os premium desta fase) */
  readonly requiresIntegration: boolean;
  readonly integrationVendor?: "runway" | "pika" | "luma" | "kling" | "openai" | "gemini" | "custom";
  /** capacidades declarativas — usadas pela UI para exibir/ocultar controles */
  readonly capabilities: {
    readonly cameraMoves: boolean;
    readonly objectAnimations: boolean;
    readonly aiUpscale: boolean;
    readonly aiInterpolation: boolean;
    readonly aiStyleTransfer: boolean;
    readonly maxDurationSec: number;
    readonly maxResolutionTier: VideoResolutionTier;
  };
}

// ————— Marca / finalização —————
export interface VideoBranding {
  readonly enabled: boolean;
  readonly logoUrl?: string;
  readonly watermarkUrl?: string;
  readonly companyName?: string;
  readonly phone?: string;
  readonly instagram?: string;
  readonly website?: string;
  readonly qrCodePayload?: string;
  readonly endCardDurationSec: number;
  readonly position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  readonly opacity: number;
}

// ————— Narração / trilha —————
export type VideoVoiceProvider = "elevenlabs" | "openai" | "google" | "azure" | "custom";
export type VideoMusicMood = "corporativo" | "cinema" | "lounge" | "minimal" | "energetico" | "elegante";

export interface VideoNarration {
  readonly enabled: boolean;
  readonly text?: string;
  readonly voiceProvider?: VideoVoiceProvider;
  readonly voiceId?: string;
  readonly language: "pt-BR" | "en-US" | "es-ES";
  readonly subtitle: { enabled: boolean; style: "clean" | "bold" | "cinema" };
  readonly music: { enabled: boolean; mood: VideoMusicMood; volume: number };
  readonly voiceVolume: number;
  readonly musicVolume: number;
}

// ————— Fila / jobs —————
export type VideoJobStatus =
  | "queued"
  | "planning"
  | "rendering-frames"
  | "compositing"
  | "encoding"
  | "branding"
  | "publishing"
  | "done"
  | "cancelled"
  | "failed";

export type VideoPipelineStageId =
  | "collect"
  | "plan-camera"
  | "plan-animations"
  | "plan-timeline"
  | "render-frames"
  | "compose-transitions"
  | "narration-mix"
  | "encode"
  | "branding-overlay"
  | "publish";

export interface VideoPipelineStage {
  readonly id: VideoPipelineStageId;
  readonly label: string;
  readonly description: string;
  readonly weight: number;
}

export interface VideoJobConfig {
  readonly presetId: VideoPresetId;
  readonly engineId: VideoEngineId;
  /** provider de RENDER a ser usado para gerar frames (consumido do Render Engine) */
  readonly renderProviderId: RenderProviderId;
  readonly renderPresetId: RenderPresetId;
  readonly formatId: string;
  readonly timeline: VideoTimeline;
  readonly branding: VideoBranding;
  readonly narration: VideoNarration;
  readonly roomId: string | null;
  readonly environmentId: string | null;
  readonly sceneKind: VideoSceneKind;
  readonly notes?: string;
}

export interface VideoJob {
  readonly id: string;
  readonly projectId: string;
  readonly projectVersion: number;
  readonly title: string;
  readonly status: VideoJobStatus;
  readonly progress: number;
  readonly stage: string;
  readonly config: VideoJobConfig;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly startedAt?: string;
  readonly finishedAt?: string;
  readonly result?: {
    readonly widthPx: number;
    readonly heightPx: number;
    readonly durationMs: number;
    readonly frameCount: number;
  };
  readonly error?: string;
}

// ————— Cena de vídeo (adapter) —————
export interface VideoSceneSummary {
  readonly projectId: string;
  readonly projectVersion: number;
  readonly environmentCount: number;
  readonly roomCount: number;
  readonly moduleNodeCount: number;
  readonly openableNodeCount: number;
  readonly lightNodeCount: number;
  readonly decorNodeCount: number;
  readonly estimatedFrameCount: number;
}

export interface VideoScene {
  readonly source: PlannerProject;
  readonly summary: VideoSceneSummary;
}