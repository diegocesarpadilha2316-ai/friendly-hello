import type { ConstructionProfile } from "../../contracts/ConstructionProfile";
import { GOLDEN_71B3550_173H7100_RULE } from "./applicationRules";
import { GOLDEN_CARCASS_CONSTRUCTION_RULE, GOLDEN_DRAWER_CARCASS_CONSTRUCTION_RULE } from "./carcassConstructionRules";
import { GOLDEN_DRAWER_3_BOX_RULE, GOLDEN_DRAWER_3_ID, GOLDEN_DRAWER_3_INDUSTRIAL_SLIDE_RULE, GOLDEN_DRAWER_3_SLIDE_RULE, GOLDEN_DRAWER_3_STACK_RULE } from "./drawerRules";
import { GOLDEN_2_DOOR_FRONT_LAYOUT_RULE, GOLDEN_UPPER_2_DOOR_FRONT_LAYOUT_RULE } from "./frontLayoutRules";
import { GOLDEN_UPPER_CARCASS_CONSTRUCTION_RULE } from "./upperCarcassConstructionRules";

export const GOLDEN_CONSTRUCTION_PROFILES: ConstructionProfile[] = [
  {
    id: "kitchen-base-2-doors:construction-profile-v1",
    moduleDefinitionId: "kitchen-base-2-doors",
    carcassRule: GOLDEN_CARCASS_CONSTRUCTION_RULE,
    frontLayoutRule: GOLDEN_2_DOOR_FRONT_LAYOUT_RULE,
    hardwareApplicationRule: GOLDEN_71B3550_173H7100_RULE,
  },
  {
    id: "kitchen-golden-upper-800:construction-profile-v1",
    moduleDefinitionId: "kitchen-golden-upper-800",
    carcassRule: GOLDEN_UPPER_CARCASS_CONSTRUCTION_RULE,
    frontLayoutRule: GOLDEN_UPPER_2_DOOR_FRONT_LAYOUT_RULE,
  },
  {
    id: `${GOLDEN_DRAWER_3_ID}:construction-profile-v1`,
    moduleDefinitionId: GOLDEN_DRAWER_3_ID,
    carcassRule: GOLDEN_DRAWER_CARCASS_CONSTRUCTION_RULE,
    drawerStackRule: GOLDEN_DRAWER_3_STACK_RULE,
    drawerBoxRule: GOLDEN_DRAWER_3_BOX_RULE,
    drawerSlideApplicationRule: GOLDEN_DRAWER_3_SLIDE_RULE,
    drawerIndustrialSlideRule: GOLDEN_DRAWER_3_INDUSTRIAL_SLIDE_RULE,
  },
];
