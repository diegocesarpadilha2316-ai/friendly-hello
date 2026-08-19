import type { CarcassConstructionRule } from "./CarcassConstructionRule";
import type { FrontLayoutRule } from "./FrontLayoutRule";
import type { FurnitureAssemblyRule } from "./HardwareApplicationRule";

export interface ConstructionProfile {
  id: string;
  moduleDefinitionId: string;
  carcassRule: CarcassConstructionRule;
  frontLayoutRule?: FrontLayoutRule;
  hardwareApplicationRule?: FurnitureAssemblyRule;
}
