/**
 * Fase 3.31 — Orçamento de captura real (frames × bytes × paralelismo).
 */
import { estimateBytes } from "../local-engine/encoder";
import { totalFrames } from "../local-engine/timeline";
import { videoPerformanceForTier, recommendVideoTier } from "../local-engine/performance";
import type { LocalTimeline, LocalVideoOutputSpec, LocalVideoScene } from "../local-engine/types";
import type { RealCaptureBudget } from "./types";

export function buildCaptureBudget(
  scene: LocalVideoScene,
  timeline: LocalTimeline,
  output: LocalVideoOutputSpec,
): RealCaptureBudget {
  const tier = recommendVideoTier(scene);
  const perf = videoPerformanceForTier(tier);
  return {
    frameCount: totalFrames(timeline),
    bytesEstimate: estimateBytes(output, timeline.durationSec),
    durationSec: timeline.durationSec,
    parallelFrames: perf.parallelFrames,
    frameSkip: perf.frameSkip,
    streaming: perf.streaming,
    compression: perf.compression,
  };
}