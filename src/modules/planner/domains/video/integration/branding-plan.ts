/**
 * Fase 3.31 — Plano de marca real (logo/watermark/QR/tela final).
 */
import type { RealBrandingPlan, RealCaptureRequest } from "./types";

export function buildBrandingPlan(req: RealCaptureRequest): RealBrandingPlan {
  return {
    logoUrl: req.logoUrl,
    watermarkUrl: req.watermarkUrl,
    qrPayload: req.qrPayload,
    endCardSec: Math.max(0, req.endCardSec),
    position: "bottom-right",
    opacity: 0.85,
  };
}