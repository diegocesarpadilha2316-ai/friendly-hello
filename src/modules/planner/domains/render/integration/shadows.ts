/**
 * Fase 3.30 — Sombras reais (soft/contact/ao/ray) — reuso do local-engine.
 */
import { shadowsForQuality } from "../local-engine/shadows";
import { getLocalQuality } from "../local-engine/quality";
import type { LocalQualityId, LocalShadowConfig } from "../local-engine/types";

export function shadowsForPreset(qualityId: LocalQualityId): LocalShadowConfig {
  return shadowsForQuality(getLocalQuality(qualityId));
}
