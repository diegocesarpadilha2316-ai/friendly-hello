/**
 * Fase 3.21 — Seleção de materiais (reuso integral do catálogo Ultra).
 */
import type { PbrMaterial, PbrMaterialFamily } from "../types";
import { PBR_MATERIALS, materialsByFamily } from "../services/materials";

export const LOCAL_MATERIAL_FAMILIES: readonly PbrMaterialFamily[] = [
  "madeira", "mdf", "mdp", "vidro", "espelho", "metal", "inox", "pedra",
  "granito", "quartzo", "marmore", "porcelanato", "tecido", "couro", "laca",
];

export function listLocalMaterials(): readonly PbrMaterial[] {
  return PBR_MATERIALS;
}

export function localMaterialsByFamily(family: PbrMaterialFamily): readonly PbrMaterial[] {
  return materialsByFamily(family);
}

export function defaultMaterialFor(family: PbrMaterialFamily): PbrMaterial | null {
  return materialsByFamily(family)[0] ?? null;
}