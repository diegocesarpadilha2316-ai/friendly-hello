/**
 * Família GAVETEIRO — segunda família convertida para a
 * Biblioteca Construtiva Paramétrica.
 */
import type { FurnitureFamily } from "../types";
import { buildDresser } from "./build";
import { normalizeDresserSpec, type DresserSpec } from "./spec";
import { DRESSER_SUBTYPES } from "./legacy";

export * from "./spec";
export * from "./build";
export * from "./legacy";

export const dresserFamily: FurnitureFamily<DresserSpec> = {
  id: "gaveteiro",
  label: "Gaveteiro",
  subtypes: DRESSER_SUBTYPES,
  normalize: normalizeDresserSpec,
  build: buildDresser,
};
