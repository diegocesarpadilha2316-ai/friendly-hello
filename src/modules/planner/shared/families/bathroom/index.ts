/** FAMÍLIA BANHEIRO — ponto único de entrada. */
import type { FurnitureFamily } from "../types";
import { buildBathroomModule } from "./build";
import { normalizeBathroomModule, type BathroomModuleSpec } from "./spec";
import { BATHROOM_ALIASES } from "./legacy";

export * from "./spec";
export * from "./sink";
export * from "./modules";
export * from "./build";
export * from "./presets";
export * from "./layout-engine";
export * from "./validator";
export * from "./legacy";
export * from "./diagnostics";

export const bathroomFamily: FurnitureFamily<BathroomModuleSpec> = {
  id: "bathroom",
  label: "Banheiro",
  subtypes: [...BATHROOM_ALIASES],
  normalize: (input) => normalizeBathroomModule(input),
  build: (input) => buildBathroomModule(input),
};
