/**
 * EDITOR DE MÓDULOS — operações puras sobre o projeto interno.
 * Nada aqui toca estado global: recebe plano, devolve plano novo.
 * Uma operação que produza colisão/medida inválida é REJEITADA.
 */
import { box, clamp, round } from "../construction";
import type {
  InteriorPlacement,
  InteriorPlan,
  InteriorPosition,
  InteriorValidation,
} from "./types";
import { getInteriorModule } from "./registry";
import { resolveInteriorBox } from "./positioning";
import { validateInteriorPlan } from "./validator";

export interface EditResult {
  readonly plan: InteriorPlan;
  readonly validation: InteriorValidation;
  /** `false` = operação rejeitada; `plan` volta intacto. */
  readonly applied: boolean;
}

function commit(previous: InteriorPlan, next: InteriorPlan): EditResult {
  const validation = validateInteriorPlan(next);
  return validation.ok
    ? { plan: next, validation, applied: true }
    : { plan: previous, validation, applied: false };
}

function withPlacements(plan: InteriorPlan, placements: InteriorPlacement[]): InteriorPlan {
  return { ...plan, placements };
}

function nextId(plan: InteriorPlan, moduleId: string): string {
  let n = plan.placements.length + 1;
  let id = `${plan.id}:${moduleId}-${n}`;
  while (plan.placements.some((p) => p.id === id)) id = `${plan.id}:${moduleId}-${++n}`;
  return id;
}

/** Insere um módulo por coluna, linha, nicho, vão ou coordenada. */
export function insertModule(
  plan: InteriorPlan,
  moduleId: string,
  position: InteriorPosition,
  options: { readonly role?: string; readonly params?: Record<string, unknown> } = {},
): EditResult {
  const def = getInteriorModule(moduleId);
  if (!def) return { plan, validation: validateInteriorPlan(plan), applied: false };
  const { box: b } = resolveInteriorBox(plan.cavity, def, position);
  const placement: InteriorPlacement = {
    id: nextId(plan, moduleId),
    moduleId,
    box: b,
    role: options.role ?? def.name,
    params: options.params,
    origin: "manual",
  };
  return commit(plan, withPlacements(plan, [...plan.placements, placement]));
}

export function removeModule(plan: InteriorPlan, placementId: string): EditResult {
  const placements = plan.placements.filter((p) => p.id !== placementId);
  if (placements.length === plan.placements.length) {
    return { plan, validation: validateInteriorPlan(plan), applied: false };
  }
  return commit(plan, withPlacements(plan, placements));
}

/** Move o módulo por delta (mm) dentro do vão. */
export function moveModule(
  plan: InteriorPlan,
  placementId: string,
  delta: readonly [number, number, number],
): EditResult {
  const placements = plan.placements.map((p) =>
    p.id === placementId
      ? {
          ...p,
          box: box(
            p.box.x + delta[0],
            p.box.y + delta[1],
            p.box.z + delta[2],
            p.box.width,
            p.box.height,
            p.box.depth,
          ),
        }
      : p,
  );
  return commit(plan, withPlacements(plan, placements));
}

export function duplicateModule(
  plan: InteriorPlan,
  placementId: string,
  offset: readonly [number, number, number],
): EditResult {
  const source = plan.placements.find((p) => p.id === placementId);
  if (!source) return { plan, validation: validateInteriorPlan(plan), applied: false };
  const clone: InteriorPlacement = {
    ...source,
    id: nextId(plan, source.moduleId),
    origin: "manual",
    box: box(
      source.box.x + offset[0],
      source.box.y + offset[1],
      source.box.z + offset[2],
      source.box.width,
      source.box.height,
      source.box.depth,
    ),
  };
  return commit(plan, withPlacements(plan, [...plan.placements, clone]));
}

/** Redimensiona respeitando min/max do módulo. */
export function resizeModule(
  plan: InteriorPlan,
  placementId: string,
  size: { readonly widthMm?: number; readonly heightMm?: number; readonly depthMm?: number },
): EditResult {
  const source = plan.placements.find((p) => p.id === placementId);
  const def = source ? getInteriorModule(source.moduleId) : undefined;
  if (!source || !def) return { plan, validation: validateInteriorPlan(plan), applied: false };
  const w = clamp(size.widthMm ?? source.box.width, def.min.widthMm, def.max.widthMm);
  const h = clamp(size.heightMm ?? source.box.height, def.min.heightMm, def.max.heightMm);
  const d = clamp(size.depthMm ?? source.box.depth, def.min.depthMm, def.max.depthMm);
  const placements = plan.placements.map((p) =>
    p.id === placementId
      ? { ...p, box: box(p.box.x, p.box.y, p.box.z, round(w), round(h), round(d)) }
      : p,
  );
  return commit(plan, withPlacements(plan, placements));
}

/** Troca a posição de dois módulos (mantendo o tamanho de cada um). */
export function swapModules(plan: InteriorPlan, aId: string, bId: string): EditResult {
  const a = plan.placements.find((p) => p.id === aId);
  const b = plan.placements.find((p) => p.id === bId);
  if (!a || !b || aId === bId)
    return { plan, validation: validateInteriorPlan(plan), applied: false };
  const placements = plan.placements.map((p) => {
    if (p.id === aId) {
      return { ...p, box: box(b.box.x, b.box.y, b.box.z, a.box.width, a.box.height, a.box.depth) };
    }
    if (p.id === bId) {
      return { ...p, box: box(a.box.x, a.box.y, a.box.z, b.box.width, b.box.height, b.box.depth) };
    }
    return p;
  });
  return commit(plan, withPlacements(plan, placements));
}
