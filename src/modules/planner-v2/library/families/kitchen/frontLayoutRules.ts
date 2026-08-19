import type { FrontLayoutRule } from "../../contracts/FrontLayoutRule";

/**
 * Golden Upper: duas frentes em paired overlay assimétrico, com reveals
 * horizontais de 2 mm à esquerda e 4 mm à direita, gap central de 2 mm e
 * reveals verticais de 2 mm. Esses valores preservam o baseline físico.
 */
export const GOLDEN_UPPER_2_DOOR_FRONT_LAYOUT_RULE: FrontLayoutRule = {
  id: "kitchen-golden-upper-800:baseline-front-layout-v2",
  moduleDefinitionId: "kitchen-golden-upper-800",
  applicationType: "paired-overlay",
  frontCount: 2,
  symmetric: false,
  leftRevealMm: 2,
  rightRevealMm: 4,
  interFrontGapMm: 2,
  topRevealMm: 2,
  bottomRevealMm: 2,
  frontThicknessMm: 18,
  toleranceMm: 0.001,
};

/**
 * Golden Base: duas frentes simétricas, com reveals externos de 2 mm,
 * gap central de 2 mm e reveals verticais de 3 mm.
 */
export const GOLDEN_2_DOOR_FRONT_LAYOUT_RULE: FrontLayoutRule = {
  id: "kitchen-base-2-doors:symmetric-front-layout-v1",
  moduleDefinitionId: "kitchen-base-2-doors",
  applicationType: "symmetric-paired-overlay",
  frontCount: 2,
  symmetric: true,
  leftRevealMm: 2,
  rightRevealMm: 2,
  interFrontGapMm: 2,
  topRevealMm: 3,
  bottomRevealMm: 3,
  frontThicknessMm: 18,
  toleranceMm: 0.001,
};
