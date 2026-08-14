export const LIBRARY_MATERIAL_CATEGORIES = [
  "chapa",
  "macico",
  "vidro",
  "espelho",
  "pedra",
  "metal",
  "pintura",
  "tecido",
] as const;

export const LIBRARY_HARDWARE_CATEGORIES = [
  "Dobradica",
  "Corredica",
  "Pistao",
  "Minifix",
  "Cavilha",
  "Parafuso",
  "Puxador",
  "Perfil",
  "Cabideiro",
  "Amortecedor",
  "LED",
  "Fonte",
  "Sensor",
  "Rodizio",
  "Pe",
] as const;

export type LibraryMaterialCategory = (typeof LIBRARY_MATERIAL_CATEGORIES)[number];
export type LibraryHardwareCategory = (typeof LIBRARY_HARDWARE_CATEGORIES)[number];

export function listMaterialCategories(): readonly LibraryMaterialCategory[] {
  return LIBRARY_MATERIAL_CATEGORIES;
}
export function listHardwareCategories(): readonly LibraryHardwareCategory[] {
  return LIBRARY_HARDWARE_CATEGORIES;
}
