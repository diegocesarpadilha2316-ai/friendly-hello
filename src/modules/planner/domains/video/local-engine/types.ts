/**
 * Fase 3.22 — Motor de Vídeo Gratuito Enterprise.
 *
 * Tipos puros do motor local de vídeo. Determinístico, sem IA,
 * sem provider externo, sem store. Reutiliza integralmente o
 * catálogo de câmeras/qualidades do Render Local (Fase 3.21) e o
 * `PlannerEditorProvider`. Todo `LocalVideoJob` descreve como
 * qualquer backend futuro (WebCodecs, FFmpeg WASM, WebGPU) irá
 * gerar o vídeo — sem depender de nenhum destes hoje.
 */
import type {
  LocalCameraPreset,
  LocalOutputSpec,
  LocalQualityId,
} from "../../render/local-engine/types";

// ————— Movimentos de câmera —————
export type LocalCameraMoveKind =
  | "orbit"
  | "fly-through"
  | "walk-through"
  | "first-person"
  | "travelling"
  | "pan"
  | "tilt"
  | "zoom"
  | "close"
  | "detalhe"
  | "drone"
  | "cliente"
  | "apresentacao"
  | "livre";

export type LocalEasing =
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "cinematic"
  | "snap";

export interface LocalCameraMove {
  readonly id: LocalCameraMoveKind;
  readonly label: string;
  readonly description: string;
  readonly defaultDurationSec: number;
  readonly easing: LocalEasing;
  readonly params: Readonly<Record<string, number | string | boolean>>;
}

// ————— Trajetória interpolada —————
export interface LocalCameraSample {
  readonly frame: number;
  readonly timeSec: number;
  readonly px: number;
  readonly py: number;
  readonly pz: number;
  readonly yaw: number;
  readonly pitch: number;
  readonly focalLengthMm: number;
}

export interface LocalCameraPath {
  readonly moveId: LocalCameraMoveKind;
  readonly cameraId: string;
  readonly durationSec: number;
  readonly fps: LocalFps;
  readonly samples: readonly LocalCameraSample[];
}

// ————— Animações de objeto/luz —————
export type LocalObjectAnimationKind =
  | "door-open"
  | "door-close"
  | "drawer-open"
  | "drawer-close"
  | "led-on"
  | "led-off"
  | "lighting-swap"
  | "explode"
  | "show-structure"
  | "show-hardware"
  | "show-assembly"
  | "show-dividers"
  | "show-slats"
  | "show-glass"
  | "show-mirror";

export interface LocalObjectAnimation {
  readonly id: string;
  readonly kind: LocalObjectAnimationKind;
  readonly label: string;
  readonly targetNodeId?: string;
  readonly startSec: number;
  readonly durationSec: number;
  readonly easing: LocalEasing;
  readonly params: Readonly<Record<string, number | string | boolean>>;
}

// ————— Keyframes e Timeline —————
export type LocalFps = 24 | 25 | 30 | 48 | 50 | 60;

export type LocalTrackKind =
  | "camera"
  | "object"
  | "lighting"
  | "led"
  | "narration"
  | "music"
  | "subtitle"
  | "branding";

export interface LocalKeyframe {
  readonly id: string;
  readonly atSec: number;
  readonly value: number | string | boolean;
  readonly easing: LocalEasing;
  readonly label?: string;
}

export interface LocalTrack {
  readonly id: string;
  readonly kind: LocalTrackKind;
  readonly label: string;
  readonly startSec: number;
  readonly durationSec: number;
  readonly speed: number;
  readonly loops: number;
  readonly pauseAfterSec: number;
  readonly muted: boolean;
  readonly locked: boolean;
  readonly keyframes: readonly LocalKeyframe[];
  readonly refId?: string;
}

// ————— Transições —————
export type LocalTransitionKind =
  | "cut"
  | "fade"
  | "zoom"
  | "slide"
  | "blur"
  | "cinema";

export interface LocalTransition {
  readonly id: string;
  readonly kind: LocalTransitionKind;
  readonly durationSec: number;
  readonly easing: LocalEasing;
}

export interface LocalClip {
  readonly id: string;
  readonly label: string;
  readonly cameraId: string;
  readonly moveId: LocalCameraMoveKind;
  readonly roomId: string | null;
  readonly startSec: number;
  readonly durationSec: number;
  readonly speed: number;
  readonly loops: number;
  readonly pauseAfterSec: number;
  readonly animationIds: readonly string[];
  readonly transitionIn: LocalTransition;
  readonly transitionOut: LocalTransition;
}

export interface LocalTimeline {
  readonly fps: LocalFps;
  readonly durationSec: number;
  readonly clips: readonly LocalClip[];
  readonly tracks: readonly LocalTrack[];
}

// ————— Áudio (sem integração de API) —————
export interface LocalAudioTrack {
  readonly enabled: boolean;
  readonly narrationText?: string;
  readonly language: "pt-BR" | "en-US" | "es-ES";
  readonly subtitleEnabled: boolean;
  readonly musicMood: "corporativo" | "cinema" | "lounge" | "minimal" | "energetico" | "elegante";
  readonly musicVolume: number;
  readonly narrationVolume: number;
  readonly syncToClips: boolean;
}

// ————— Exportação —————
export type LocalVideoContainer = "mp4" | "mov" | "webm" | "gif" | "png-sequence";
export type LocalVideoCodec = "h264" | "h265" | "vp9" | "av1" | "prores" | "gif" | "png";
export type LocalVideoAspect = "16:9" | "9:16" | "1:1" | "21:9" | "4:5";
export type LocalVideoTier = "hd" | "fhd" | "qhd" | "4k" | "8k" | "16k";

export interface LocalVideoResolution {
  readonly width: number;
  readonly height: number;
  readonly tier: LocalVideoTier;
  readonly label: string;
}

export interface LocalVideoOutputSpec {
  readonly container: LocalVideoContainer;
  readonly codec: LocalVideoCodec;
  readonly aspect: LocalVideoAspect;
  readonly resolution: LocalVideoResolution;
  readonly fps: LocalFps;
  readonly bitrateKbps: number;
  readonly quality: number; // 0..1
  readonly transparentBackground: boolean;
  readonly notes?: string;
}

// ————— Captura —————
export type LocalVideoScope =
  | "project"
  | "current-environment"
  | "selection"
  | "all-environments"
  | "batch";

export interface LocalVideoCaptureRequest {
  readonly scope: LocalVideoScope;
  readonly qualityId: LocalQualityId;
  readonly output: LocalVideoOutputSpec;
  readonly timeline: LocalTimeline;
  readonly audio: LocalAudioTrack;
  readonly cameraIds: readonly string[];
  readonly roomIds: readonly string[];
  readonly notes?: string;
}

// ————— Fila de jobs —————
export type LocalVideoJobStatus =
  | "queued"
  | "planning"
  | "rendering"
  | "compositing"
  | "encoding"
  | "publishing"
  | "done"
  | "cancelled"
  | "failed";

export interface LocalVideoJobResult {
  readonly widthPx: number;
  readonly heightPx: number;
  readonly frameCount: number;
  readonly durationMs: number;
  readonly bytes: number;
  readonly previewUrl?: string;
}

export interface LocalVideoJob {
  readonly id: string;
  readonly projectId: string;
  readonly projectVersion: number;
  readonly title: string;
  readonly status: LocalVideoJobStatus;
  readonly progress: number;
  readonly stage: string;
  readonly frameCursor: number;
  readonly frameTotal: number;
  readonly qualityId: LocalQualityId;
  readonly output: LocalVideoOutputSpec;
  readonly timeline: LocalTimeline;
  readonly roomId: string | null;
  readonly cameraIds: readonly string[];
  readonly audio: LocalAudioTrack;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly startedAt?: string;
  readonly finishedAt?: string;
  readonly result?: LocalVideoJobResult;
  readonly error?: string;
}

// ————— Performance —————
export type LocalVideoPerformanceTier = "eco" | "balanced" | "alto" | "extremo";

export interface LocalVideoPerformanceConfig {
  readonly tier: LocalVideoPerformanceTier;
  readonly cache: boolean;
  readonly streaming: boolean;
  readonly incremental: boolean;
  readonly frameSkip: number; // 0 = sem skip; 1 = alterna
  readonly compression: boolean;
  readonly parallelFrames: number;
}

// ————— Viewport local —————
export type LocalVideoViewportMode =
  | "realtime"
  | "preview"
  | "before-after"
  | "fullscreen"
  | "compare";

export interface LocalVideoViewportState {
  readonly mode: LocalVideoViewportMode;
  readonly showGrid: boolean;
  readonly showSafeArea: boolean;
  readonly showTimecode: boolean;
  readonly cursorSec: number;
}

// ————— Cena de vídeo (descritor) —————
export interface LocalVideoScene {
  readonly projectId: string;
  readonly projectVersion: number;
  readonly roomCount: number;
  readonly moduleCount: number;
  readonly lightCount: number;
  readonly openableCount: number;
  readonly triangleEstimate: number;
  readonly durationSec: number;
  readonly frameCount: number;
  readonly bboxMm: { readonly w: number; readonly d: number; readonly h: number };
}

// ————— Playbook (contrato do motor) —————
export interface LocalVideoPlaybook {
  readonly scene: LocalVideoScene;
  readonly cameras: readonly LocalCameraPreset[];
  readonly paths: readonly LocalCameraPath[];
  readonly animations: readonly LocalObjectAnimation[];
  readonly timeline: LocalTimeline;
  readonly output: LocalVideoOutputSpec;
  readonly qualityId: LocalQualityId;
  readonly performance: LocalVideoPerformanceConfig;
  readonly frameOutputSpec: LocalOutputSpec;
}
