import type { MaterialDefinition } from "../contracts/MaterialDefinition";
import { DEFAULT_MATERIAL_ID, MaterialRegistry } from "../registry/MaterialRegistry";

/** Resolve o material de uma peça respeitando overrides por peça/papel. */
export function resolveMaterial(
  materialId: string | undefined,
  overrides?: Record<string, string>,
  key?: string,
): MaterialDefinition {
  const overridden = key ? overrides?.[key] : undefined;
  const candidate = overridden ?? materialId ?? DEFAULT_MATERIAL_ID;
  return MaterialRegistry.get(candidate) ?? MaterialRegistry.get(DEFAULT_MATERIAL_ID)!;
}
