/**
 * Fase 3.17 — Materiais PBR do Viewport Realtime.
 *
 * Reaproveita 100% o catálogo Ultra (Fase 3.12). Não duplica dados.
 */
import type { PbrMaterial, PbrMaterialFamily } from "../types";
import {
  ULTRA_WOODS,
  ULTRA_STONES,
  ULTRA_METALS,
  ULTRA_GLASSES,
  ULTRA_PAINTS,
  ULTRA_FABRICS,
} from "../services/ultra/materials";

export const REALTIME_MATERIALS: readonly PbrMaterial[] = [
  ...Object.values(ULTRA_WOODS),
  ...Object.values(ULTRA_STONES),
  ...Object.values(ULTRA_METALS),
  ...Object.values(ULTRA_GLASSES),
  ...Object.values(ULTRA_PAINTS),
  ...Object.values(ULTRA_FABRICS),
];

export function findRealtimeMaterial(id: string): PbrMaterial | undefined {
  return REALTIME_MATERIALS.find((m) => m.id === id);
}

export function realtimeMaterialsByFamily(
  family: PbrMaterialFamily,
): readonly PbrMaterial[] {
  return REALTIME_MATERIALS.filter((m) => m.family === family);
}