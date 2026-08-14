import type { FamilyDefinition, FamilyId } from "../contracts/FamilyDefinition";

const families = new Map<FamilyId, FamilyDefinition>();

export const FamilyRegistry = {
  register(definition: FamilyDefinition): FamilyDefinition {
    families.set(definition.id, definition);
    return definition;
  },
  get(id: FamilyId): FamilyDefinition | undefined {
    return families.get(id);
  },
  list(): FamilyDefinition[] {
    return [...families.values()];
  },
  listEnabled(): FamilyDefinition[] {
    return [...families.values()].filter((family) => family.enabled);
  },
};
