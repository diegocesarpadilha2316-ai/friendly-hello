import type { PartDefinition } from "../contracts/PartDefinition";
import { DEFAULT_OPTIONS, runNesting } from "@/modules/planner/domains/production/services/nesting/optimizer";
import type { NestingOptions, NestingPart, NestingPlan } from "@/modules/planner/domains/production/services/nesting/types";

function isNestingPart(part: PartDefinition): boolean {
  return part.role !== "hardware" && part.role !== "decorative" && part.volumeType !== "technical" && part.volumeType !== "opening";
}

function grainFor(part: PartDefinition): NestingPart["grain"] {
  if (!part.grainDirection || part.grainDirection === "none") return "none";
  // O adapter normaliza a maior dimensão como comprimento longitudinal;
  // o catálogo de chapas padrão usa veio vertical nesse eixo.
  return "vertical";
}

export function toNestingPartsFromPartDefinitions(parts: readonly PartDefinition[]): readonly NestingPart[] {
  return parts.filter(isNestingPart).map((part) => {
    const dimensions = [part.dimensionsMm.width, part.dimensionsMm.height, part.dimensionsMm.depth].map((value) => Math.max(1, value)).sort((a, b) => b - a);
    const [longSide, shortSide, thickness] = dimensions;
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
    edgeTape: Object.values(part.edgeBanding ?? {}).filter(Boolean).join("|"),
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
