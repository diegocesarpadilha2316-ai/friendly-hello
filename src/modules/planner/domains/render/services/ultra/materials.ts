/**
 * Fase 3.12 — Biblioteca PBR Premium.
 *
 * Extensão do catálogo iniciado em `../materials.ts`: cada material
 * segue o mesmo contrato `PbrMaterial` (mesmos slots — albedo, normal,
 * roughness, metallic, AO, height/displacement, opacity, emissive).
 * Nenhum store novo — apenas dados.
 */
import type { PbrMapSlot, PbrMaterial, PbrMaterialFamily, PbrTextureMap } from "../../types";
import type {
  UltraFabricId,
  UltraGlassId,
  UltraMetalFinishId,
  UltraPaintId,
  UltraStoneId,
  UltraWoodId,
} from "../../types/ultra";

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

function maps(): readonly PbrTextureMap[] {
  return SLOTS.map((slot) => ({ slot, intensity: 1, tiling: [1, 1] as const }));
}

interface Input {
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
}

function mk(i: Input): PbrMaterial {
  return {
    id: i.id,
    family: i.family,
    label: i.label,
    baseColorHex: i.baseColorHex,
    roughness: i.roughness,
    metallic: i.metallic ?? 0,
    ior: i.ior ?? 1.45,
    transmission: i.transmission ?? 0,
    emissive: i.emissive ?? 0,
    maps: maps(),
    tags: i.tags ?? [],
  };
}

// ————— Madeiras —————
export const ULTRA_WOODS: Readonly<Record<UltraWoodId, PbrMaterial>> = {
  mdf: mk({
    id: "ultra.wood.mdf",
    family: "mdf",
    label: "MDF Padrão",
    baseColorHex: "#dcd4c6",
    roughness: 0.55,
    tags: ["madeira", "engenharia"],
  }),
  mdp: mk({
    id: "ultra.wood.mdp",
    family: "mdp",
    label: "MDP Padrão",
    baseColorHex: "#c9bfa8",
    roughness: 0.6,
    tags: ["madeira", "engenharia"],
  }),
  carvalho: mk({
    id: "ultra.wood.carvalho",
    family: "madeira",
    label: "Carvalho",
    baseColorHex: "#a67c52",
    roughness: 0.55,
    tags: ["quente", "premium"],
  }),
  freijo: mk({
    id: "ultra.wood.freijo",
    family: "madeira",
    label: "Freijó",
    baseColorHex: "#7a4b2a",
    roughness: 0.6,
    tags: ["quente"],
  }),
  imbuia: mk({
    id: "ultra.wood.imbuia",
    family: "madeira",
    label: "Imbuia",
    baseColorHex: "#4a2c1a",
    roughness: 0.55,
    tags: ["escuro", "nobre"],
  }),
  nogueira: mk({
    id: "ultra.wood.nogueira",
    family: "madeira",
    label: "Nogueira",
    baseColorHex: "#5a3a24",
    roughness: 0.5,
    tags: ["escuro", "premium"],
  }),
  "louro-freijo": mk({
    id: "ultra.wood.louro",
    family: "madeira",
    label: "Louro Freijó",
    baseColorHex: "#8b6b45",
    roughness: 0.58,
  }),
  cumaru: mk({
    id: "ultra.wood.cumaru",
    family: "madeira",
    label: "Cumaru",
    baseColorHex: "#6b4a30",
    roughness: 0.5,
    tags: ["denso"],
  }),
  tauari: mk({
    id: "ultra.wood.tauari",
    family: "madeira",
    label: "Tauari",
    baseColorHex: "#c0a078",
    roughness: 0.6,
  }),
  jequitiba: mk({
    id: "ultra.wood.jequitiba",
    family: "madeira",
    label: "Jequitibá",
    baseColorHex: "#a68868",
    roughness: 0.58,
  }),
  pinus: mk({
    id: "ultra.wood.pinus",
    family: "madeira",
    label: "Pinus",
    baseColorHex: "#e0c9a0",
    roughness: 0.7,
    tags: ["claro"],
  }),
  cedro: mk({
    id: "ultra.wood.cedro",
    family: "madeira",
    label: "Cedro",
    baseColorHex: "#b48a5f",
    roughness: 0.6,
    tags: ["aromatico"],
  }),
};

// ————— Pedras —————
export const ULTRA_STONES: Readonly<Record<UltraStoneId, PbrMaterial>> = {
  marmore: mk({
    id: "ultra.stone.marmore",
    family: "marmore",
    label: "Mármore",
    baseColorHex: "#eeeae2",
    roughness: 0.2,
    tags: ["premium"],
  }),
  quartzo: mk({
    id: "ultra.stone.quartzo",
    family: "quartzo",
    label: "Quartzo",
    baseColorHex: "#f4f4f2",
    roughness: 0.18,
  }),
  granito: mk({
    id: "ultra.stone.granito",
    family: "granito",
    label: "Granito",
    baseColorHex: "#2a2a2a",
    roughness: 0.4,
  }),
  limestone: mk({
    id: "ultra.stone.limestone",
    family: "pedra",
    label: "Limestone",
    baseColorHex: "#d6cdb8",
    roughness: 0.65,
  }),
  onix: mk({
    id: "ultra.stone.onix",
    family: "pedra",
    label: "Ônix",
    baseColorHex: "#c8a880",
    roughness: 0.25,
    transmission: 0.35,
    tags: ["translucido"],
  }),
  ardosia: mk({
    id: "ultra.stone.ardosia",
    family: "pedra",
    label: "Ardósia",
    baseColorHex: "#2f333a",
    roughness: 0.75,
  }),
};

// ————— Metais —————
export const ULTRA_METALS: Readonly<Record<UltraMetalFinishId, PbrMaterial>> = {
  inox: mk({
    id: "ultra.metal.inox",
    family: "inox",
    label: "Aço Inox",
    baseColorHex: "#c8ccd0",
    roughness: 0.28,
    metallic: 1,
  }),
  escovado: mk({
    id: "ultra.metal.escovado",
    family: "metal",
    label: "Metal Escovado",
    baseColorHex: "#b8b8bc",
    roughness: 0.45,
    metallic: 1,
  }),
  cromado: mk({
    id: "ultra.metal.cromado",
    family: "metal",
    label: "Cromado",
    baseColorHex: "#e6e8ea",
    roughness: 0.05,
    metallic: 1,
  }),
  "preto-fosco": mk({
    id: "ultra.metal.preto",
    family: "metal",
    label: "Metal Preto Fosco",
    baseColorHex: "#1a1a1a",
    roughness: 0.55,
    metallic: 1,
  }),
  ouro: mk({
    id: "ultra.metal.ouro",
    family: "metal",
    label: "Ouro Escovado",
    baseColorHex: "#c9a24a",
    roughness: 0.3,
    metallic: 1,
  }),
  bronze: mk({
    id: "ultra.metal.bronze",
    family: "metal",
    label: "Bronze",
    baseColorHex: "#8c6a3a",
    roughness: 0.35,
    metallic: 1,
  }),
  cobre: mk({
    id: "ultra.metal.cobre",
    family: "metal",
    label: "Cobre",
    baseColorHex: "#b87333",
    roughness: 0.32,
    metallic: 1,
  }),
};

// ————— Vidros —————
export const ULTRA_GLASSES: Readonly<Record<UltraGlassId, PbrMaterial>> = {
  transparente: mk({
    id: "ultra.glass.transparente",
    family: "vidro",
    label: "Vidro Transparente",
    baseColorHex: "#e8f2ff",
    roughness: 0.02,
    ior: 1.52,
    transmission: 0.95,
  }),
  "extra-clear": mk({
    id: "ultra.glass.extra",
    family: "vidro",
    label: "Extra Clear",
    baseColorHex: "#f0f8ff",
    roughness: 0.01,
    ior: 1.52,
    transmission: 0.98,
  }),
  bronze: mk({
    id: "ultra.glass.bronze",
    family: "vidro",
    label: "Vidro Bronze",
    baseColorHex: "#b89468",
    roughness: 0.03,
    ior: 1.52,
    transmission: 0.7,
  }),
  fume: mk({
    id: "ultra.glass.fume",
    family: "vidro",
    label: "Vidro Fumê",
    baseColorHex: "#3a3a3a",
    roughness: 0.04,
    ior: 1.52,
    transmission: 0.55,
  }),
  canelado: mk({
    id: "ultra.glass.canelado",
    family: "vidro",
    label: "Vidro Canelado",
    baseColorHex: "#dceaf0",
    roughness: 0.35,
    ior: 1.52,
    transmission: 0.75,
    tags: ["texturizado"],
  }),
  reflecta: mk({
    id: "ultra.glass.reflecta",
    family: "vidro",
    label: "Reflecta",
    baseColorHex: "#a8b8c8",
    roughness: 0.02,
    ior: 1.55,
    transmission: 0.3,
    metallic: 0.3,
    tags: ["espelhado"],
  }),
};

// ————— Pinturas —————
export const ULTRA_PAINTS: Readonly<Record<UltraPaintId, PbrMaterial>> = {
  fosco: mk({
    id: "ultra.paint.fosco",
    family: "laca",
    label: "Pintura Fosca",
    baseColorHex: "#f2f2ef",
    roughness: 0.85,
  }),
  "semi-brilho": mk({
    id: "ultra.paint.semi",
    family: "laca",
    label: "Semi Brilho",
    baseColorHex: "#f2f2ef",
    roughness: 0.4,
  }),
  "alto-brilho": mk({
    id: "ultra.paint.alto",
    family: "laca",
    label: "Alto Brilho",
    baseColorHex: "#f8f8f6",
    roughness: 0.08,
  }),
  laca: mk({
    id: "ultra.paint.laca",
    family: "laca",
    label: "Laca",
    baseColorHex: "#0f0f10",
    roughness: 0.15,
  }),
  pu: mk({
    id: "ultra.paint.pu",
    family: "laca",
    label: "Poliuretano (PU)",
    baseColorHex: "#ffffff",
    roughness: 0.05,
    tags: ["automotivo"],
  }),
};

// ————— Tecidos —————
export const ULTRA_FABRICS: Readonly<Record<UltraFabricId, PbrMaterial>> = {
  linho: mk({
    id: "ultra.fabric.linho",
    family: "tecido",
    label: "Linho",
    baseColorHex: "#d6c3a2",
    roughness: 0.9,
  }),
  veludo: mk({
    id: "ultra.fabric.veludo",
    family: "tecido",
    label: "Veludo",
    baseColorHex: "#3f5d43",
    roughness: 0.85,
    tags: ["premium"],
  }),
  suede: mk({
    id: "ultra.fabric.suede",
    family: "tecido",
    label: "Suede",
    baseColorHex: "#7a5a3a",
    roughness: 0.95,
  }),
  couro: mk({
    id: "ultra.fabric.couro",
    family: "couro",
    label: "Couro",
    baseColorHex: "#8a5a2b",
    roughness: 0.7,
  }),
  algodao: mk({
    id: "ultra.fabric.algodao",
    family: "tecido",
    label: "Algodão",
    baseColorHex: "#efeae0",
    roughness: 0.92,
  }),
  boucle: mk({
    id: "ultra.fabric.boucle",
    family: "tecido",
    label: "Bouclé",
    baseColorHex: "#d8d0c0",
    roughness: 0.98,
    tags: ["texturizado"],
  }),
};

export const ULTRA_MATERIALS: readonly PbrMaterial[] = [
  ...Object.values(ULTRA_WOODS),
  ...Object.values(ULTRA_STONES),
  ...Object.values(ULTRA_METALS),
  ...Object.values(ULTRA_GLASSES),
  ...Object.values(ULTRA_PAINTS),
  ...Object.values(ULTRA_FABRICS),
];

export function getUltraMaterial(id: string): PbrMaterial | null {
  return ULTRA_MATERIALS.find((m) => m.id === id) ?? null;
}
