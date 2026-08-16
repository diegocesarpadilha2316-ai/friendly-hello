import type { PartDefinition } from "../contracts/PartDefinition";
import {
  DEFAULT_OPTIONS,
  runNesting,
} from "@/modules/planner/domains/production/services/nesting/optimizer";
import type {
  NestingOptions,
  NestingPart,
  NestingPlan,
} from "@/modules/planner/domains/production/services/nesting/types";

export function isNestingPart(part: PartDefinition): boolean {
  return part.role !== "hardware" && part.role !== "decorative" && part.volumeType !== "technical";
}

export type NestingIntegrityResult = {
  cuttableIds: string[];
  nestingPartIds: string[];
  missingInNesting: string[];
  duplicateInNesting: string[];
  unknownInNesting: string[];
};

function grainFor(part: PartDefinition): NestingPart["grain"] {
  if (!part.grainDirection || part.grainDirection === "none") return "none";
  // O adapter normaliza a maior dimensão como comprimento longitudinal;
  // o catálogo de chapas padrão usa veio vertical nesse eixo.
  return "vertical";
}

export function toNestingPartsFromPartDefinitions(
  parts: readonly PartDefinition[],
): readonly NestingPart[] {
  return parts.filter(isNestingPart).map((part) => {
    const dimensions = [part.dimensionsMm.width, part.dimensionsMm.height, part.dimensionsMm.depth]
      .map((value) => Math.max(1, value))
      .sort((a, b) => b - a);
    const [longSide, shortSide, inferredThickness] = dimensions;
    const thickness = Math.max(1, part.thicknessMm ?? inferredThickness);
    return {
      id: part.id,
      code: part.id,
      name: part.name,
      widthMm: longSide,
      heightMm: shortSide,
      thicknessMm: thickness,
      material: part.materialId,
      color: part.materialId,
      qty: 1,
      grain: grainFor(part),
      edgeTape: Object.values(part.edgeBanding ?? {})
        .filter(Boolean)
        .join("|"),
      label: `${part.moduleId}:${part.name}`,
      locked: false,
      pinned: false,
    };
  });
}

export function buildNestingPlanFromPartDefinitions(
  parts: readonly PartDefinition[],
  options: Partial<NestingOptions> = {},
): NestingPlan {
  const nestingParts = toNestingPartsFromPartDefinitions(parts);
  return runNesting(nestingParts, { ...DEFAULT_OPTIONS, ...options });
}

export function validateNestingIntegrity(
  parts: readonly PartDefinition[],
  plan: NestingPlan,
): NestingIntegrityResult {
  const cuttableIds = parts.filter(isNestingPart).map((part) => part.id);
  const nestingPartIds = [
    ...plan.boards.flatMap((board) => board.placements.map((placement) => placement.code)),
    ...plan.unplaced.map((part) => part.id),
  ];
  const cuttableSet = new Set(cuttableIds);
  const counts = new Map<string, number>();
  for (const id of nestingPartIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  return {
    cuttableIds,
    nestingPartIds,
    missingInNesting: cuttableIds.filter((id) => !counts.has(id)),
    duplicateInNesting: [...counts.entries()].filter(([, count]) => count > 1).map(([id]) => id),
    unknownInNesting: [...counts.keys()].filter((id) => !cuttableSet.has(id)),
  };
}
