import type { FamilyId } from "./FamilyDefinition";
import type { Dimensions3 } from "./ModuleDefinition";
import type { PartDefinition } from "./PartDefinition";

export interface FurnitureInstance {
  id: string;
  moduleDefinitionId: string;
  familyId: FamilyId;
  name: string;
  dimensionsMm: Dimensions3;
  positionMm: { x: number; y: number; z: number };
  rotationDeg: { x: number; y: number; z: number };
  materialOverrides: Record<string, string>;
  hardwareOverrides: Record<string, string>;
  parts: PartDefinition[];
  visible: boolean;
  locked: boolean;
  selected: boolean;
}