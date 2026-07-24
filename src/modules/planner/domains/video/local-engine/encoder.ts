/**
 * Fase 3.22 — Encoder puro (contrato). Sem side-effects. Prepara o
 * `LocalVideoOutputSpec` e estima bytes/duração para a fila.
 */
import type {
  LocalFps,
  LocalVideoAspect,
  LocalVideoCodec,
  LocalVideoContainer,
  LocalVideoOutputSpec,
  LocalVideoResolution,
  LocalVideoTier,
} from "./types";

export const LOCAL_VIDEO_RESOLUTIONS: readonly LocalVideoResolution[] = [
  { width: 1280, height: 720, tier: "hd", label: "HD 720p" },
  { width: 1920, height: 1080, tier: "fhd", label: "Full HD 1080p" },
  { width: 2560, height: 1440, tier: "qhd", label: "2K 1440p" },
  { width: 3840, height: 2160, tier: "4k", label: "4K UHD" },
  { width: 7680, height: 4320, tier: "8k", label: "8K UHD" },
  { width: 15360, height: 8640, tier: "16k", label: "16K experimental" },
];

export const LOCAL_VIDEO_ASPECTS: readonly LocalVideoAspect[] = ["16:9", "9:16", "1:1", "21:9", "4:5"];
export const LOCAL_VIDEO_CONTAINERS: readonly LocalVideoContainer[] = ["mp4", "mov", "webm", "gif", "png-sequence"];
export const LOCAL_VIDEO_CODECS: readonly LocalVideoCodec[] = ["h264", "h265", "vp9", "av1", "prores", "gif", "png"];

export const DEFAULT_VIDEO_OUTPUT: LocalVideoOutputSpec = {
  container: "mp4",
  codec: "h264",
  aspect: "16:9",
  resolution: LOCAL_VIDEO_RESOLUTIONS[1],
  fps: 30,
  bitrateKbps: 14_000,
  quality: 0.9,
  transparentBackground: false,
};

export function makeOutput(input: Partial<LocalVideoOutputSpec>): LocalVideoOutputSpec {
  return { ...DEFAULT_VIDEO_OUTPUT, ...input };
}

export function findResolution(tier: LocalVideoTier): LocalVideoResolution {
  return LOCAL_VIDEO_RESOLUTIONS.find((r) => r.tier === tier) ?? LOCAL_VIDEO_RESOLUTIONS[1];
}

export function estimateBytes(spec: LocalVideoOutputSpec, durationSec: number): number {
  const bps = spec.bitrateKbps * 1000;
  return Math.round((bps * durationSec) / 8);
}

export function estimateEncodeMs(spec: LocalVideoOutputSpec, durationSec: number): number {
  const px = spec.resolution.width * spec.resolution.height;
  const codecFactor: Readonly<Record<LocalVideoCodec, number>> = {
    h264: 1, h265: 1.6, vp9: 1.4, av1: 2.4, prores: 0.8, gif: 0.4, png: 0.5,
  };
  return Math.round(500 + durationSec * 60 * (px / 1_000_000) * codecFactor[spec.codec]);
}

export function fpsFrom(spec: LocalVideoOutputSpec): LocalFps { return spec.fps; }