import type { FrontLayoutRule } from "../../contracts/FrontLayoutRule";
import type { FurnitureAssemblyRule } from "../../contracts/HardwareApplicationRule";
import { GOLDEN_2_DOOR_FRONT_LAYOUT_RULE } from "./frontLayoutRules";
import { GOLDEN_71B3550_173H7100_RULE } from "./applicationRules";

export type LegacyKitchenRules = {
  frontLayoutRule?: FrontLayoutRule;
  hardwareApplicationRule?: FurnitureAssemblyRule;
};

/** Compatibilidade somente para chamadas antigas que não carregam moduleDefinitionId. */
export function getLegacyKitchenRules(moduleId: string, leaves: number): LegacyKitchenRules {
  if (leaves !== 2 || moduleId !== "kitchen-base-2-doors") return {};
  return {
    frontLayoutRule: GOLDEN_2_DOOR_FRONT_LAYOUT_RULE,
    hardwareApplicationRule: GOLDEN_71B3550_173H7100_RULE,
  };
}
