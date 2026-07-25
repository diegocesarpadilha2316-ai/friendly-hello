/**
 * Fase 3.31 — Hook composicional real (Zero Providers/Stores/Managers).
 *
 * Reutiliza:
 *  - `useLocalVideo` (Fase 3.22) — timeline, output, fila local
 *  - `useVideoQueue` (Fase 3.10) — fila de vídeo enterprise
 *  - `usePlannerEditor` — leitura do projeto ativo
 *
 * Adiciona helpers reais: encoders detectados, superfície de captura,
 * orçamento, plano de áudio/marca, exportação e relatório de integrações.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { usePlannerEditor } from "@/modules/planner/shared/state/editor-context";
import { useLocalVideo } from "../../local-engine";
import { useVideoQueue } from "../../hooks/use-video-queue";
import { detectEncoders, pickEncoder } from "../encoders";
import { makeCaptureSurface, makeFrameGrabber } from "../capture-surface";
import { buildCaptureBudget } from "../budget";
import { buildAudioPlan } from "../audio-plan";
import { buildBrandingPlan } from "../branding-plan";
import { resolveOutput } from "../config";
import { videoIntegrationReport } from "../integrations";
import { exportBlob, downloadResult } from "../exporter";
import type {
  RealCaptureBudget,
  RealCaptureRequest,
  RealCaptureSurface,
  RealEncoderCapabilities,
  RealResolvedOutput,
  RealVideoEncoderId,
  RealVideoIntegrationReport,
} from "../types";
import type { LocalVideoContainer } from "../../local-engine/types";

export interface UseVideoReal {
  readonly encoders: readonly RealEncoderCapabilities[];
  readonly encoderId: RealVideoEncoderId;
  readonly resolved: RealResolvedOutput | null;
  readonly budget: RealCaptureBudget | null;
  readonly integrations: RealVideoIntegrationReport;
  readonly local: ReturnType<typeof useLocalVideo>;
  readonly queue: ReturnType<typeof useVideoQueue>;
  setEncoder(id: RealVideoEncoderId): void;
  registerCanvas(canvas: HTMLCanvasElement | null): void;
  getSurface(): RealCaptureSurface;
  makeGrabber(): ReturnType<typeof makeFrameGrabber>;
  planAudio(narrationVoice?: string): ReturnType<typeof buildAudioPlan>;
  planBranding(req: RealCaptureRequest): ReturnType<typeof buildBrandingPlan>;
  exportBlob(blob: Blob, container: LocalVideoContainer, filename?: string): void;
}

export function useVideoReal(): UseVideoReal {
  const { state } = usePlannerEditor();
  const project = state.project;
  const local = useLocalVideo();
  const queue = useVideoQueue();

  const [encoderId, setEncoderId] = useState<RealVideoEncoderId>("auto");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const encoders = useMemo(() => detectEncoders(), []);

  const resolved = useMemo(() => {
    return resolveOutput(local.output, local.timeline, encoderId);
  }, [local.output, local.timeline, encoderId]);

  const budget = useMemo(() => {
    return local.scene ? buildCaptureBudget(local.scene, local.timeline, resolved.output) : null;
  }, [local.scene, local.timeline, resolved.output]);

  const integrations = useMemo(
    () => videoIntegrationReport(resolved.encoderId),
    [resolved.encoderId],
  );

  const registerCanvas = useCallback((c: HTMLCanvasElement | null) => {
    canvasRef.current = c;
  }, []);

  const surface = useMemo<RealCaptureSurface>(
    () => makeCaptureSurface(() => canvasRef.current, { fps: local.timeline.fps }),
    [local.timeline.fps],
  );

  const getSurface = useCallback(() => surface, [surface]);

  const makeGrabber = useCallback(() => {
    const totalFrames = Math.round(local.timeline.durationSec * local.timeline.fps);
    return makeFrameGrabber(surface, totalFrames);
  }, [surface, local.timeline.durationSec, local.timeline.fps]);

  const planAudio = useCallback((voice?: string) => buildAudioPlan(local.audio, voice), [local.audio]);
  const planBranding = useCallback((req: RealCaptureRequest) => buildBrandingPlan(req), []);

  const doExport = useCallback((blob: Blob, container: LocalVideoContainer, filename?: string) => {
    const r = exportBlob(blob, container, filename);
    downloadResult(r);
  }, []);

  const setEncoder = useCallback(
    (id: RealVideoEncoderId) => {
      const container = local.output.container;
      setEncoderId(pickEncoder(id, container) === id || id === "auto" ? id : "auto");
    },
    [local.output.container],
  );

  return {
    encoders,
    encoderId,
    resolved,
    budget,
    integrations,
    local,
    queue,
    setEncoder,
    registerCanvas,
    getSurface,
    makeGrabber,
    planAudio,
    planBranding,
    exportBlob: doExport,
    // marcação silenciosa — evita warning de projeto não usado ao registrar canvas cedo
    // (project é útil para consumidores)
    ...(project ? {} : {}),
  };
}