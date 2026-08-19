import type { FurnitureInstance } from "../contracts/FurnitureInstance";

export interface SerializedInstance {
  schema: "dioris.planner-v2.instance";
  version: 1;
  id: string;
  moduleDefinitionId: string;
  familyId: string;
  name: string;
  dimensionsMm: FurnitureInstance["dimensionsMm"];
  positionMm: FurnitureInstance["positionMm"];
  rotationDeg: FurnitureInstance["rotationDeg"];
  materialOverrides: Record<string, string>;
  hardwareOverrides: Record<string, string>;
  hardwareVariantIds?: Record<string, string>;
  parts: Array<{
    id: string;
    role: string;
    name: string;
    dimensionsMm: { width: number; height: number; depth: number };
    materialId: string;
  }>;
}

/** Serialização estável (sem peças 3D) para persistência futura. */
export function serializeModule(instance: FurnitureInstance): SerializedInstance {
  return {
    schema: "dioris.planner-v2.instance",
    version: 1,
    id: instance.id,
    moduleDefinitionId: instance.moduleDefinitionId,
    familyId: instance.familyId,
    name: instance.name,
    dimensionsMm: instance.dimensionsMm,
    positionMm: instance.positionMm,
    rotationDeg: instance.rotationDeg,
    materialOverrides: instance.materialOverrides,
    hardwareOverrides: instance.hardwareOverrides,
    hardwareVariantIds: instance.hardwareVariantIds,
    parts: instance.parts.map((part) => ({
      id: part.id,
      role: part.role,
      name: part.name,
      dimensionsMm: part.dimensionsMm,
      materialId: part.materialId,
    })),
  };
}
