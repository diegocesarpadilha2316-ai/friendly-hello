/**
 * Fase 3.30 — Reflexos reais para vidros, espelhos, metais, inox, lacas.
 * Reutiliza a configuração do local-engine, não recria nada.
 */
import { reflectionForQuality } from "../local-engine/reflection";
import { getLocalQuality } from "../local-engine/quality";
import type { LocalQualityId, LocalReflectionConfig } from "../local-engine/types";

const REFLECTIVE = new Set(["glass", "mirror", "hardware", "metal", "inox", "laca"]);

export function reflectionForPreset(qualityId: LocalQualityId): LocalReflectionConfig {
  return reflectionForQuality(getLocalQuality(qualityId));
}

export function isReflectiveKind(kind: string): boolean {
  return REFLECTIVE.has(kind);
}