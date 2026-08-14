/**
 * Fase 3.23 — Materiais interativos.
 * Reaproveita 100% o catálogo Ultra/Realtime (Fases 3.12/3.17).
 */
import { REALTIME_MATERIALS } from "../render/realtime/materials";
import type { PbrMaterial, PbrMaterialFamily } from "../render/types";
import type { RealtimeMaterialOverride } from "./types";

export const REALTIME_INTERACTIVE_MATERIALS: readonly PbrMaterial[] = REALTIME_MATERIALS;

export function findMaterial(id: string): PbrMaterial | undefined {
  return REALTIME_INTERACTIVE_MATERIALS.find((m) => m.id === id);
}

export function materialsByFamily(family: PbrMaterialFamily): readonly PbrMaterial[] {
  return REALTIME_INTERACTIVE_MATERIALS.filter((m) => m.family === family);
}

export function upsertOverride(
  list: readonly RealtimeMaterialOverride[],
  override: RealtimeMaterialOverride,
): readonly RealtimeMaterialOverride[] {
  const idx = list.findIndex((o) => o.nodeId === override.nodeId);
  if (idx < 0) return [...list, override];
  const clone = [...list];
  clone[idx] = override;
  return clone;
}

export function removeOverride(
  list: readonly RealtimeMaterialOverride[],
  nodeId: string,
): readonly RealtimeMaterialOverride[] {
  return list.filter((o) => o.nodeId !== nodeId);
}
