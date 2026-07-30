/**
 * Registro único dos componentes construtivos.
 * Toda família de móvel futura resolve componentes SÓ por aqui.
 */
import type {
  ConstructionComponent,
  ConstructionComponentId,
  ConstructionContext,
  ConstructionFamily,
  ConstructionResult,
} from "./types";
import { FRONT_COMPONENTS } from "./components/fronts";
import { INTERIOR_COMPONENTS } from "./components/interior";
import { STRUCTURE_COMPONENTS } from "./components/structure";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ConstructionComponent<any>;

const ALL: readonly AnyComponent[] = [
  ...FRONT_COMPONENTS,
  ...INTERIOR_COMPONENTS,
  ...STRUCTURE_COMPONENTS,
];

const BY_ID = new Map<ConstructionComponentId, AnyComponent>(ALL.map((c) => [c.id, c]));

export function listComponents(family?: ConstructionFamily): readonly AnyComponent[] {
  return family ? ALL.filter((c) => c.family === family) : ALL;
}

export function getComponent(id: ConstructionComponentId): AnyComponent | undefined {
  return BY_ID.get(id);
}

export const DEFAULT_CONSTRUCTION_CONTEXT: Omit<ConstructionContext, "instanceId"> = {
  thicknessMm: 18,
  backThicknessMm: 6,
  clearanceMm: 3,
  revealMm: 2,
  finishId: "branco-tx",
  grain: "vertical",
};

export function makeContext(
  instanceId: string,
  overrides: Partial<Omit<ConstructionContext, "instanceId">> = {},
): ConstructionContext {
  return { ...DEFAULT_CONSTRUCTION_CONTEXT, ...overrides, instanceId };
}

/**
 * Constrói UM componente com parâmetros parciais.
 * Nunca lança: parâmetros inválidos são normalizados e viram avisos.
 */
export function buildComponent(
  id: ConstructionComponentId,
  params: Record<string, unknown> = {},
  ctx?: Partial<Omit<ConstructionContext, "instanceId">> & { instanceId?: string },
): ConstructionResult {
  const component = BY_ID.get(id);
  const instanceId = ctx?.instanceId ?? id;
  const context = makeContext(instanceId, ctx);
  if (!component) {
    return {
      componentId: id,
      instanceId,
      envelope: { x: 0, y: 0, z: 0, width: 1, height: 1, depth: 1 },
      pieces: [],
      hardware: [],
      motions: [],
      warnings: [
        { code: "componente-inexistente", message: `Componente "${id}" não existe na biblioteca.` },
      ],
    };
  }
  const normalized = component.normalize(params, context);
  return component.build(normalized, context);
}
