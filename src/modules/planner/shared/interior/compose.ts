/**
 * COMPOSITOR — converte um projeto interno em slots da Biblioteca Construtiva.
 * Zero geometria própria: só posiciona componentes que já existem.
 */
import type { AssemblySlot, AssemblyResult, ConstructionContext } from "../construction";
import { buildAssembly, round } from "../construction";
import type { InteriorPlan } from "./types";
import { getInteriorModule } from "./registry";

export function interiorPlanToSlots(plan: InteriorPlan): AssemblySlot[] {
  const slots: AssemblySlot[] = [];
  for (const placement of plan.placements) {
    const def = getInteriorModule(placement.moduleId);
    if (!def) continue;
    for (const part of def.parts) {
      const rel = part.at?.(placement.box) ?? [0, 0, 0];
      slots.push({
        id: `${placement.id}:${part.key}`.replace(/[^\w:-]/g, "-"),
        component: part.component,
        at: [
          round(placement.box.x + rel[0]),
          round(placement.box.y + rel[1]),
          round(placement.box.z + rel[2]),
        ],
        params: { ...part.params(placement.box, def), ...(placement.params ?? {}) },
        role: placement.role ?? def.name,
      });
    }
  }
  return slots;
}

/** Monta o interior como uma montagem completa (peças, ferragens, rigs). */
export function buildInteriorAssembly(
  plan: InteriorPlan,
  meta: { readonly id?: string; readonly label?: string } = {},
  context?: Partial<Omit<ConstructionContext, "instanceId">>,
): AssemblyResult {
  return buildAssembly({
    id: meta.id ?? plan.id,
    label: meta.label ?? "Interior",
    slots: interiorPlanToSlots(plan),
    context: context ?? plan.context,
  });
}
