import type { CarcassConstructionRule } from "../../contracts/CarcassConstructionRule";

/** Regra estrutural do piloto Upper: laterais full-height e ausência semântica de toe-kick. */
export const GOLDEN_UPPER_CARCASS_CONSTRUCTION_RULE: CarcassConstructionRule = {
  id: "kitchen-golden-upper-800:carcass-v1",
  moduleDefinitionId: "kitchen-golden-upper-800",
  sideRelation: "full-height",
  baseRelation: "between-sides",
  topRelation: "between-sides-flush-with-top",
  backRelation: "between-sides-flush-with-rear",
  shelfRelation: "between-sides-supported",
  toeKickRelation: "none",
  shelfSideClearanceMm: 2,
  shelfDepthInsetMm: 20,
  toeKickInsetMm: 0,
  edgeBandingEdgesByRole: {
    "side-left": ["front"],
    "side-right": ["front"],
    base: ["front"],
    top: ["front"],
    shelf: ["front"],
  },
};
