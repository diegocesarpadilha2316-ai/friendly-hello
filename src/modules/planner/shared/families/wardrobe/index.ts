/**
 * Família ROUPEIRO — primeira família convertida para a
 * Biblioteca Construtiva Paramétrica.
 */
import type { FurnitureFamily } from "../types";
import { buildWardrobe } from "./build";
import { normalizeWardrobeSpec, type WardrobeSpec } from "./spec";
import { WARDROBE_SUBTYPES } from "./legacy";

export * from "./spec";
export * from "./build";
export * from "./legacy";

export const wardrobeFamily: FurnitureFamily<WardrobeSpec> = {
  id: "roupeiro",
  label: "Roupeiro",
  subtypes: WARDROBE_SUBTYPES,
  normalize: normalizeWardrobeSpec,
  build: buildWardrobe,
};
