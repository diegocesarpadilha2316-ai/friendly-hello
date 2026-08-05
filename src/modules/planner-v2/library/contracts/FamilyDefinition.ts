/** Contrato único de família do Planner V2. Nenhuma família fora deste contrato. */
export type FamilyId =
  | "kitchen"
  | "bedroom"
  | "wardrobe"
  | "bathroom"
  | "laundry"
  | "living"
  | "office"
  | "generic";

export interface FamilyDefinition {
  id: FamilyId;
  name: string;
  description: string;
  icon?: string;
  categories: string[];
  moduleIds: string[];
  enabled: boolean;
  version: number;
}
