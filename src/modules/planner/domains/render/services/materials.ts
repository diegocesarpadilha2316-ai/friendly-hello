/**
 * Fase 3.9 — Biblioteca PBR (arquitetura).
 * Todos os materiais expõem slots completos (albedo/normal/roughness/
 * metallic/displacement/ao/opacity/emission), mesmo quando as texturas
 * ainda não foram vinculadas — o motor de render preencherá depois.
 */
import type { PbrMapSlot, PbrMaterial, PbrMaterialFamily, PbrTextureMap } from "../types";

const SLOTS: readonly PbrMapSlot[] = [
  "albedo",
  "normal",
  "roughness",
  "metallic",
  "displacement",
  "ao",
  "opacity",
  "emission",
];

function emptyMaps(): readonly PbrTextureMap[] {
  return SLOTS.map((slot) => ({ slot, intensity: 1, tiling: [1, 1] as const }));
}

function makeMaterial(input: {
  id: string;
  family: PbrMaterialFamily;
  label: string;
  baseColorHex: string;
  roughness: number;
  metallic?: number;
  ior?: number;
  transmission?: number;
  emissive?: number;
  tags?: readonly string[];
}): PbrMaterial {
  return {
    id: input.id,
    family: input.family,
    label: input.label,
    baseColorHex: input.baseColorHex,
    roughness: input.roughness,
    metallic: input.metallic ?? 0,
    ior: input.ior ?? 1.45,
    transmission: input.transmission ?? 0,
    emissive: input.emissive ?? 0,
    maps: emptyMaps(),
    tags: input.tags ?? [],
  };
}

export const PBR_MATERIALS: readonly PbrMaterial[] = [
  makeMaterial({ id: "pbr.madeira.carvalho", family: "madeira", label: "Carvalho Natural", baseColorHex: "#a67c52", roughness: 0.55, tags: ["quente", "premium"] }),
  makeMaterial({ id: "pbr.madeira.freijo", family: "madeira", label: "Freijó Escovado", baseColorHex: "#7a4b2a", roughness: 0.6, tags: ["quente"] }),
  makeMaterial({ id: "pbr.mdf.branco", family: "mdf", label: "MDF Branco TX", baseColorHex: "#f2f2ef", roughness: 0.5 }),
  makeMaterial({ id: "pbr.mdp.cinza", family: "mdp", label: "MDP Cinza Cristal", baseColorHex: "#b8b8b8", roughness: 0.55 }),
  makeMaterial({ id: "pbr.laca.fosca.preta", family: "laca", label: "Laca Fosca Preta", baseColorHex: "#0f0f10", roughness: 0.35 }),
  makeMaterial({ id: "pbr.laca.brilho.branca", family: "laca", label: "Laca Brilho Branca", baseColorHex: "#ffffff", roughness: 0.05 }),
  makeMaterial({ id: "pbr.vidro.temperado", family: "vidro", label: "Vidro Temperado", baseColorHex: "#e8f2ff", roughness: 0.02, ior: 1.52, transmission: 0.95 }),
  makeMaterial({ id: "pbr.espelho", family: "espelho", label: "Espelho Prata", baseColorHex: "#ffffff", roughness: 0.0, metallic: 1 }),
  makeMaterial({ id: "pbr.metal.dourado", family: "metal", label: "Metal Dourado Escovado", baseColorHex: "#c9a24a", roughness: 0.3, metallic: 1 }),
  makeMaterial({ id: "pbr.metal.preto", family: "metal", label: "Metal Preto Fosco", baseColorHex: "#1a1a1a", roughness: 0.45, metallic: 1 }),
  makeMaterial({ id: "pbr.inox", family: "inox", label: "Aço Inox Escovado", baseColorHex: "#c8ccd0", roughness: 0.28, metallic: 1 }),
  makeMaterial({ id: "pbr.pedra.travertino", family: "pedra", label: "Travertino Bege", baseColorHex: "#c9b394", roughness: 0.7 }),
  makeMaterial({ id: "pbr.granito.preto", family: "granito", label: "Granito São Gabriel", baseColorHex: "#2a2a2a", roughness: 0.4 }),
  makeMaterial({ id: "pbr.marmore.carrara", family: "marmore", label: "Mármore Carrara", baseColorHex: "#eeeae2", roughness: 0.2 }),
  makeMaterial({ id: "pbr.marmore.calacatta", family: "marmore", label: "Mármore Calacatta", baseColorHex: "#f2eee5", roughness: 0.18 }),
  makeMaterial({ id: "pbr.quartzo.branco", family: "quartzo", label: "Quartzo Branco Absoluto", baseColorHex: "#f4f4f2", roughness: 0.15 }),
  makeMaterial({ id: "pbr.porcelanato.cinza", family: "porcelanato", label: "Porcelanato Cinza 120×120", baseColorHex: "#9a9a9a", roughness: 0.25 }),
  makeMaterial({ id: "pbr.tecido.linho", family: "tecido", label: "Linho Areia", baseColorHex: "#d6c3a2", roughness: 0.9 }),
  makeMaterial({ id: "pbr.tecido.veludo", family: "tecido", label: "Veludo Verde Musgo", baseColorHex: "#3f5d43", roughness: 0.85 }),
  makeMaterial({ id: "pbr.couro.caramelo", family: "couro", label: "Couro Caramelo", baseColorHex: "#8a5a2b", roughness: 0.7 }),
];

export function getMaterial(id: string): PbrMaterial | null {
  return PBR_MATERIALS.find((m) => m.id === id) ?? null;
}

export function materialsByFamily(family: PbrMaterialFamily): readonly PbrMaterial[] {
  return PBR_MATERIALS.filter((m) => m.family === family);
}