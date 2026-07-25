/**
 * Fase 3.31 — Video Enterprise Real (integração funcional).
 *
 * Camada 100% ADITIVA. Reutiliza os tipos existentes (Fase 3.10 e 3.22)
 * sem introduzir Providers/Stores/Managers. Toda mutação continua
 * passando por `updateProject()`.
 */
import type {
  LocalCameraMoveKind,
  LocalFps,
  LocalObjectAnimationKind,
  LocalTimeline,
  LocalVideoContainer,
  LocalVideoJob,
  LocalVideoOutputSpec,
  LocalVideoResolution,
  LocalVideoScope,
  LocalVideoTier,
} from "../local-engine/types";

export type RealVideoEncoderId =
  | "auto"
  | "webcodecs"
  | "mediarecorder"
  | "ffmpeg-wasm"
  | "png-sequence"
  | "gif-encoder";

export interface RealEncoderCapabilities {
  readonly id: RealVideoEncoderId;
  readonly label: string;
  readonly available: boolean;
  readonly containers: readonly LocalVideoContainer[];
  readonly maxTier: LocalVideoTier;
  readonly requiresIntegration: boolean;
  readonly notes: string;
}

/** Amostra real capturada do viewport (canvas offscreen ou HTMLCanvas). */
export interface RealFrameSample {
  readonly frame: number;
  readonly timeSec: number;
  readonly bytes: number;
  readonly width: number;
  readonly height: number;
}

export interface RealCaptureBudget {
  readonly frameCount: number;
  readonly bytesEstimate: number;
  readonly durationSec: number;
  readonly parallelFrames: number;
  readonly frameSkip: number;
  readonly streaming: boolean;
  readonly compression: boolean;
}

export interface RealCaptureRequest {
  readonly scope: LocalVideoScope;
  readonly roomIds: readonly string[];
  readonly cameraMoves: readonly LocalCameraMoveKind[];
  readonly animations: readonly LocalObjectAnimationKind[];
  readonly timeline: LocalTimeline;
  readonly output: LocalVideoOutputSpec;
  readonly encoderId: RealVideoEncoderId;
  readonly audioEnabled: boolean;
  readonly narrationText?: string;
  readonly subtitleEnabled: boolean;
  readonly logoUrl?: string;
  readonly watermarkUrl?: string;
  readonly qrPayload?: string;
  readonly endCardSec: number;
}

export interface RealAudioPlan {
  readonly enabled: boolean;
  readonly narrationText?: string;
  readonly narrationVoice?: string;
  readonly musicEnabled: boolean;
  readonly musicMood: string;
  readonly musicVolume: number;
  readonly narrationVolume: number;
  readonly subtitleEnabled: boolean;
  readonly language: "pt-BR" | "en-US" | "es-ES";
}

export interface RealBrandingPlan {
  readonly logoUrl?: string;
  readonly watermarkUrl?: string;
  readonly qrPayload?: string;
  readonly endCardSec: number;
  readonly position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  readonly opacity: number;
}

export interface RealVideoIntegrationReport {
  readonly render: boolean;
  readonly realtime: boolean;
  readonly ai: boolean;
  readonly production: boolean;
  readonly library: boolean;
  readonly configurator: boolean;
  readonly planner: boolean;
  readonly encoder: RealVideoEncoderId;
  readonly notes: readonly string[];
}

export interface RealVideoJobSnapshot {
  readonly job: LocalVideoJob;
  readonly stage: string;
  readonly progress: number;
  readonly frameCursor: number;
  readonly frameTotal: number;
}

export interface RealCaptureSurface {
  /** obtém o canvas do viewport ativo (Three.js/R3F/2D) */
  getCanvas(): HTMLCanvasElement | null;
  /** número atual de frames renderizados até agora */
  getFrameCount(): number;
  /** hint opcional de fps */
  getFps(): LocalFps;
}

export interface RealResolvedOutput {
  readonly output: LocalVideoOutputSpec;
  readonly resolution: LocalVideoResolution;
  readonly encoderId: RealVideoEncoderId;
  readonly bitrateKbps: number;
  readonly durationSec: number;
}