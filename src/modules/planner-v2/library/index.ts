import { FamilyRegistry } from "./registry/FamilyRegistry";
import { ModuleRegistry } from "./registry/ModuleRegistry";
import { genericFamily, genericModules } from "./families/generic";
import { kitchenFamily, kitchenModules } from "./families/kitchen";
import { bedroomFamily } from "./families/bedroom";
import { wardrobeFamily } from "./families/wardrobe";
import { bathroomFamily } from "./families/bathroom";
import { laundryFamily } from "./families/laundry";
import { livingFamily } from "./families/living";
import { officeFamily } from "./families/office";

let bootstrapped = false;

/** Registra todas as famílias e módulos. Idempotente. */
export function bootstrapLibrary(): void {
  if (bootstrapped) return;
  bootstrapped = true;

  [
    kitchenFamily,
    bedroomFamily,
    wardrobeFamily,
    bathroomFamily,
    laundryFamily,
    livingFamily,
    officeFamily,
    genericFamily,
  ].forEach((family) => FamilyRegistry.register(family));

  ModuleRegistry.registerMany([...genericModules, ...kitchenModules]);
}


bootstrapLibrary();

export * from "./contracts/FamilyDefinition";
export * from "./contracts/ModuleDefinition";
export * from "./contracts/PartDefinition";
export * from "./contracts/MaterialDefinition";
export * from "./contracts/HardwareDefinition";
export * from "./contracts/PlacementRules";
export * from "./contracts/ValidationResult";
export * from "./contracts/FurnitureInstance";
export { FamilyRegistry } from "./registry/FamilyRegistry";
export { ModuleRegistry } from "./registry/ModuleRegistry";
export { MaterialRegistry, DEFAULT_MATERIAL_ID } from "./registry/MaterialRegistry";
export { HardwareRegistry } from "./registry/HardwareRegistry";
export { buildModule } from "./services/buildModule";
export type { BuildOutcome, BuildRequest } from "./services/buildModule";
export { validateModule } from "./services/validateModule";
export { resolveMaterial } from "./services/resolveMaterial";
export { resolveHardware } from "./services/resolveHardware";
export { serializeModule } from "./services/serializeModule";