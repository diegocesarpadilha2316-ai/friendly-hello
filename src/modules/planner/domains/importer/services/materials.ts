import type { ImporterEntity, ImporterMaterialRef } from "../types";

/**
 * Deriva referências de material a partir da meta dos entities.
 * Formato-agnóstico: qualquer parser pode setar `meta.material` / `meta.color`.
 */
export function extractMaterials(entities: readonly ImporterEntity[]): readonly ImporterMaterialRef[] {
  const map = new Map<string, ImporterMaterialRef>();
  for (const e of entities) {
    const m = e.meta as Record<string, unknown> | undefined;
    const name = typeof m?.material === "string" ? (m.material as string) : null;
    if (!name) continue;
    if (!map.has(name)) {
      map.set(name, {
        id: name,
        name,
        color: typeof m?.color === "string" ? (m.color as string) : null,
        textureUrl: typeof m?.texture === "string" ? (m.texture as string) : null,
      });
    }
  }
  return Array.from(map.values());
}

export function bindMaterialsToLibrary(
  refs: readonly ImporterMaterialRef[],
  bindings: Readonly<Record<string, string>>,
): readonly ImporterMaterialRef[] {
  return refs.map((r) => (bindings[r.id] ? { ...r, id: bindings[r.id]! } : r));
}