/**
 * Fase 3.24 — Perfis (alumínio, acabamento, cantoneiras, rodapés).
 */
import type { CatalogProfile } from "./types";

export const CATALOG_PROFILES: readonly CatalogProfile[] = [
  { id: "profile-alu-h", name: "Perfil Alumínio H", kind: "aluminio",   lengthMm: 3000, pricePerM: 38 },
  { id: "profile-alu-j", name: "Perfil Alumínio J", kind: "aluminio",   lengthMm: 3000, pricePerM: 32 },
  { id: "profile-gola", name: "Perfil Gola",        kind: "acabamento", lengthMm: 3000, pricePerM: 46 },
  { id: "profile-canto", name: "Cantoneira 20mm",    kind: "cantoneira", lengthMm: 3000, pricePerM: 18 },
  { id: "profile-rodape-100", name: "Rodapé 100mm",  kind: "rodape",     lengthMm: 2400, pricePerM: 22 },
];

export function listProfiles(): readonly CatalogProfile[] {
  return CATALOG_PROFILES;
}

export function getProfile(id: string): CatalogProfile | undefined {
  return CATALOG_PROFILES.find((p) => p.id === id);
}