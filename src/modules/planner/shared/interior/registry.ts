/**
 * REGISTRO DOS MÓDULOS INTERNOS.
 *
 * Expansão futura: `registerInteriorModule(def)` — nenhum arquivo do núcleo
 * (layout engine, validador, compositor) precisa ser tocado para suportar
 * um módulo novo.
 */
import type { InteriorCategory, InteriorFamilyId, InteriorModuleDef, InteriorType } from "./types";
import { INTERIOR_MODULES } from "./catalog";

const REGISTRY = new Map<string, InteriorModuleDef>(INTERIOR_MODULES.map((m) => [m.id, m]));

export interface InteriorModuleFilter {
  readonly category?: InteriorCategory;
  readonly type?: InteriorType;
  readonly family?: InteriorFamilyId;
  readonly query?: string;
}

export function registerInteriorModule(
  def: InteriorModuleDef,
  override = false,
): InteriorModuleDef {
  if (!override && REGISTRY.has(def.id)) {
    throw new Error(`Módulo interno "${def.id}" já registrado.`);
  }
  REGISTRY.set(def.id, def);
  return def;
}

export function unregisterInteriorModule(id: string): boolean {
  return REGISTRY.delete(id);
}

export function getInteriorModule(id: string): InteriorModuleDef | undefined {
  return REGISTRY.get(id);
}

export function listInteriorModules(
  filter: InteriorModuleFilter = {},
): readonly InteriorModuleDef[] {
  const q = filter.query?.trim().toLowerCase();
  return [...REGISTRY.values()].filter(
    (m) =>
      (!filter.category || m.category === filter.category) &&
      (!filter.type || m.type === filter.type) &&
      (!filter.family || m.families.includes(filter.family)) &&
      (!q || m.name.toLowerCase().includes(q) || m.id.includes(q)),
  );
}

export function interiorModuleCount(): number {
  return REGISTRY.size;
}
