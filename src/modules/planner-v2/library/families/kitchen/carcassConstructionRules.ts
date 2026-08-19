import type { CarcassConstructionRule } from "../../contracts/CarcassConstructionRule";

export const GOLDEN_CARCASS_CONSTRUCTION_RULE: CarcassConstructionRule = {
  id: "kitchen-base-2-doors:golden-carcass-between-sides",
  moduleDefinitionId: "kitchen-base-2-doors",
  sideRelation: "full-height-above-toe-kick",
  baseRelation: "between-sides",
  topRelation: "between-sides-flush-with-top",
  backRelation: "between-sides-flush-with-rear",
  shelfRelation: "between-sides-supported",
  toeKickRelation: "separate-profile-supported-by-feet",
  shelfSideClearanceMm: 2,
  shelfDepthInsetMm: 20,
  toeKickInsetMm: 20,
  edgeBandingEdgesByRole: {
    "side-left": ["front"],
    "side-right": ["front"],
    base: ["front"],
    top: ["front"],
    back: [],
    shelf: ["front"],
  },
};
