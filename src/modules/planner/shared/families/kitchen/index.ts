/**
 * Família COZINHA — terceira família convertida para a
 * Biblioteca Construtiva Paramétrica.
 *
 * Reuso integral: componentes → AssemblyComposer → AssemblyMesh
 * (mesmo intertravamento e mesma animação do roupeiro e do gaveteiro).
 */
import type { FurnitureFamily } from "../types";
import { buildKitchenModule } from "./build";
import { normalizeKitchenModule, type KitchenModuleSpec } from "./spec";
import { KITCHEN_SUBTYPES } from "./legacy";

export * from "./countertop";
export * from "./plinth";
export * from "./spec";
export * from "./modules";
export * from "./build";
export * from "./layout-engine";
export * from "./validator";
export * from "./legacy";
export * from "./diagnostics";

export const kitchenFamily: FurnitureFamily<KitchenModuleSpec> = {
  id: "cozinha",
  label: "Cozinha",
  subtypes: KITCHEN_SUBTYPES,
  normalize: normalizeKitchenModule,
  build: buildKitchenModule,
};
