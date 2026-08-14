/**
 * Fase 3.31 — Detecção e catálogo de encoders.
 *
 * Nenhuma dependência obrigatória: `webcodecs`, `ffmpeg-wasm` e
 * `mediarecorder` são detectados em runtime; sem eles, o motor cai em
 * `png-sequence` (algoritmo próprio) — sempre disponível.
 */
import type { LocalVideoContainer, LocalVideoTier } from "../local-engine/types";
import type { RealEncoderCapabilities, RealVideoEncoderId } from "./types";

function hasWebCodecs(): boolean {
  if (typeof window === "undefined") return false;
  return typeof (window as unknown as { VideoEncoder?: unknown }).VideoEncoder === "function";
}

function hasMediaRecorder(): boolean {
  if (typeof window === "undefined") return false;
  return typeof (window as unknown as { MediaRecorder?: unknown }).MediaRecorder === "function";
}

function hasFFmpegWasm(): boolean {
  // apenas contrato — usuário instala @ffmpeg/ffmpeg se quiser
  if (typeof window === "undefined") return false;
  return Boolean((window as unknown as { __ffmpegWasm?: unknown }).__ffmpegWasm);
}

const containersAll: readonly LocalVideoContainer[] = ["mp4", "mov", "webm", "gif", "png-sequence"];

export function detectEncoders(): readonly RealEncoderCapabilities[] {
  const webCodecs = hasWebCodecs();
  const mediaRecorder = hasMediaRecorder();
  const ffmpeg = hasFFmpegWasm();
  const list: RealEncoderCapabilities[] = [
    {
      id: "webcodecs",
      label: "WebCodecs",
      available: webCodecs,
      containers: ["mp4", "webm"],
      maxTier: "8k",
      requiresIntegration: false,
      notes: "H.264/H.265/VP9/AV1 nativos do navegador. Máxima performance.",
    },
    {
      id: "mediarecorder",
      label: "MediaRecorder",
      available: mediaRecorder,
      containers: ["webm", "mp4"],
      maxTier: "4k",
      requiresIntegration: false,
      notes: "Fallback nativo cross-browser (WebM/VP8/VP9).",
    },
    {
      id: "ffmpeg-wasm",
      label: "FFmpeg WASM",
      available: ffmpeg,
      containers: containersAll,
      maxTier: "16k",
      requiresIntegration: true,
      notes: "Opcional. Ativado quando `window.__ffmpegWasm` estiver presente.",
    },
    {
      id: "gif-encoder",
      label: "GIF Encoder",
      available: true,
      containers: ["gif"],
      maxTier: "fhd",
      requiresIntegration: false,
      notes: "Algoritmo próprio Dioris (paleta 256 + Floyd-Steinberg).",
    },
    {
      id: "png-sequence",
      label: "PNG Sequence",
      available: true,
      containers: ["png-sequence"],
      maxTier: "16k",
      requiresIntegration: false,
      notes: "Sempre disponível. Captura frame-a-frame — determinístico.",
    },
  ];
  return list;
}

export function pickEncoder(
  preferred: RealVideoEncoderId,
  container: LocalVideoContainer,
): RealVideoEncoderId {
  const caps = detectEncoders();
  if (preferred !== "auto") {
    const chosen = caps.find(
      (e) => e.id === preferred && e.available && e.containers.includes(container),
    );
    if (chosen) return chosen.id;
  }
  const priority: readonly RealVideoEncoderId[] = [
    "webcodecs",
    "ffmpeg-wasm",
    "mediarecorder",
    "gif-encoder",
    "png-sequence",
  ];
  for (const id of priority) {
    const c = caps.find((e) => e.id === id);
    if (c && c.available && c.containers.includes(container)) return c.id;
  }
  return "png-sequence";
}

export function encoderMaxTier(id: RealVideoEncoderId): LocalVideoTier {
  return detectEncoders().find((e) => e.id === id)?.maxTier ?? "fhd";
}
