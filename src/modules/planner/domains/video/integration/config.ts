/**
 * Fase 3.31 — Configuração real derivada do encoder + output + timeline.
 */
import { encoderMaxTier, pickEncoder } from "./encoders";
import type { LocalTimeline, LocalVideoOutputSpec, LocalVideoResolution } from "../local-engine/types";
import { LOCAL_VIDEO_RESOLUTIONS } from "../local-engine/encoder";
import type { RealResolvedOutput, RealVideoEncoderId } from "./types";

function capResolution(
  target: LocalVideoResolution,
  encoderId: RealVideoEncoderId,
): LocalVideoResolution {
  const maxTier = encoderMaxTier(encoderId);
  const order: readonly LocalVideoResolution["tier"][] = ["hd", "fhd", "qhd", "4k", "8k", "16k"];
  const maxIdx = order.indexOf(maxTier);
  const curIdx = order.indexOf(target.tier);
  if (curIdx <= maxIdx) return target;
  return LOCAL_VIDEO_RESOLUTIONS.find((r) => r.tier === maxTier) ?? target;
}

export function resolveOutput(
  output: LocalVideoOutputSpec,
  timeline: LocalTimeline,
  preferred: RealVideoEncoderId,
): RealResolvedOutput {
  const encoderId = pickEncoder(preferred, output.container);
  const resolution = capResolution(output.resolution, encoderId);
  return {
    output: { ...output, resolution },
    resolution,
    encoderId,
    bitrateKbps: output.bitrateKbps,
    durationSec: timeline.durationSec,
  };
}