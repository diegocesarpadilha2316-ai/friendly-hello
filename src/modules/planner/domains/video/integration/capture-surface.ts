/**
 * Fase 3.31 — Superfície de captura real do viewport.
 *
 * Não cria store nem provider. Registra por closure um `HTMLCanvasElement`
 * exposto pelo viewport (Three.js/R3F ou 2D) através de uma função de
 * resolver — o próprio Editor/Realtime injeta o canvas no momento do uso.
 */
import type { LocalFps } from "../local-engine/types";
import type { RealCaptureSurface } from "./types";

export function makeCaptureSurface(
  resolver: () => HTMLCanvasElement | null,
  opts: { fps?: LocalFps } = {},
): RealCaptureSurface {
  let frames = 0;
  return {
    getCanvas() {
      const c = resolver();
      if (c) frames += 1;
      return c;
    },
    getFrameCount() {
      return frames;
    },
    getFps() {
      return opts.fps ?? 30;
    },
  };
}

/** Captura um frame do canvas para Blob PNG/JPEG/WEBP determinístico. */
export async function captureFrame(
  canvas: HTMLCanvasElement,
  spec: { format?: "png" | "jpeg" | "webp"; quality?: number } = {},
): Promise<Blob | null> {
  if (typeof document === "undefined") return null;
  const mime =
    spec.format === "jpeg" ? "image/jpeg" : spec.format === "webp" ? "image/webp" : "image/png";
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), mime, spec.quality ?? 0.92);
  });
}

export interface FrameGrabber {
  grab(frame: number, timeSec: number): Promise<Blob | null>;
  frames: number;
}

export function makeFrameGrabber(surface: RealCaptureSurface, totalFrames: number): FrameGrabber {
  return {
    frames: totalFrames,
    async grab(_frame: number, _timeSec: number) {
      const c = surface.getCanvas();
      if (!c) return null;
      return captureFrame(c);
    },
  };
}
