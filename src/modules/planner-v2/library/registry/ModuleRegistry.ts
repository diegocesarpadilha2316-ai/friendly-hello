import type { FamilyId } from "../contracts/FamilyDefinition";
import type { ModuleDefinition } from "../contracts/ModuleDefinition";

const modules = new Map<string, ModuleDefinition>();

export const ModuleRegistry = {
  register(definition: ModuleDefinition): ModuleDefinition {
    modules.set(definition.id, definition);
    return definition;
  },
  registerMany(definitions: ModuleDefinition[]): void {
    definitions.forEach((definition) => modules.set(definition.id, definition));
  },
  get(id: string): ModuleDefinition | undefined {
    return modules.get(id);
  },
  has(id: string): boolean {
    return modules.has(id);
  },
  list(): ModuleDefinition[] {
    return [...modules.values()];
  },
  listByFamily(familyId: FamilyId): ModuleDefinition[] {
    return [...modules.values()].filter((module) => module.familyId === familyId);
  },
  search(query: string): ModuleDefinition[] {
    const term = query.trim().toLowerCase();
    if (!term) return [...modules.values()];
    return [...modules.values()].filter((module) =>
      `${module.name} ${module.category} ${module.description ?? ""}`
        .toLowerCase()
        .includes(term)
    );
  },
};