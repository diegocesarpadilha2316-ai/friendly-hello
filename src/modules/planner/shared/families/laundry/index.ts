/** FAMÍLIA LAVANDERIA — ponto único de entrada. */
import type { FurnitureFamily } from "../types";
import { buildLaundryModule } from "./build";
import { normalizeLaundryModule, type LaundryModuleSpec } from "./spec";
import { LAUNDRY_ALIASES } from "./legacy";

export * from "./appliances";
export * from "./tub";
export * from "./spec";
export * from "./modules";
export * from "./build";
export * from "./presets";
export * from "./layout-engine";
export * from "./validator";
export * from "./legacy";
export * from "./diagnostics";

export const laundryFamily: FurnitureFamily<LaundryModuleSpec> = {
  id: "laundry",
  label: "Lavanderia",
  subtypes: [...LAUNDRY_ALIASES],
  normalize: (input) => normalizeLaundryModule(input),
  build: (input) => buildLaundryModule(input),
};
