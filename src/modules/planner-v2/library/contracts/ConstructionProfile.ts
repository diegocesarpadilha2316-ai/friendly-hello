import type { CarcassConstructionRule } from "./CarcassConstructionRule";
import type { FrontLayoutRule } from "./FrontLayoutRule";
import type { FurnitureAssemblyRule } from "./HardwareApplicationRule";
import type { DrawerBoxRule, DrawerIndustrialSlideRule, DrawerSlideApplicationRule, DrawerStackRule } from "./DrawerRules";
import type { StructuralJoineryRule } from "./StructuralJoinery";

export interface ConstructionProfile {
  id: string;
  moduleDefinitionId: string;
  carcassRule: CarcassConstructionRule;
  frontLayoutRule?: FrontLayoutRule;
  hardwareApplicationRule?: FurnitureAssemblyRule;
  drawerStackRule?: DrawerStackRule;
  drawerBoxRule?: DrawerBoxRule;
  drawerSlideApplicationRule?: DrawerSlideApplicationRule;
  drawerIndustrialSlideRule?: DrawerIndustrialSlideRule;
  structuralJoineryRule?: StructuralJoineryRule;
}
