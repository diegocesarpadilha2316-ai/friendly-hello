export type DecorAssetCategory = "plant" | "vessel" | "book" | "tableware" | "food" | "appliance" | "fixture" | "accessory";

export interface AssetDimensionsMm {
  width: number;
  height: number;
  depth: number;
}

export interface DecorAssetDefinition {
  id: string;
  name: string;
  category: DecorAssetCategory;
  modelUrl: string | null;
  thumbnail: string | null;
  dimensionsMm: AssetDimensionsMm;
  defaultScale: number;
  lod: { preview: number; high: number };
  materialOverrides?: Record<string, string>;
  tags: string[];
  licenseMetadata?: string;
  implementation: "procedural" | "gltf";
}

const ASSETS: DecorAssetDefinition[] = [
  { id: "decor-plant-olive", name: "Oliveira decorativa", category: "plant", modelUrl: null, thumbnail: null, dimensionsMm: { width: 220, height: 460, depth: 220 }, defaultScale: 1, lod: { preview: 0.7, high: 1 }, tags: ["plant", "green", "countertop"], implementation: "procedural" },
  { id: "decor-fruit-bowl", name: "Fruteira de bancada", category: "vessel", modelUrl: null, thumbnail: null, dimensionsMm: { width: 280, height: 120, depth: 280 }, defaultScale: 1, lod: { preview: 0.65, high: 1 }, tags: ["bowl", "fruit", "island"], implementation: "procedural" },
  { id: "decor-coffee-maker", name: "Cafeteira compacta", category: "appliance", modelUrl: null, thumbnail: null, dimensionsMm: { width: 300, height: 420, depth: 240 }, defaultScale: 1, lod: { preview: 0.7, high: 1 }, tags: ["coffee", "appliance", "countertop"], implementation: "procedural" },
  { id: "decor-cutting-board", name: "Tábua de madeira", category: "accessory", modelUrl: null, thumbnail: null, dimensionsMm: { width: 360, height: 35, depth: 580 }, defaultScale: 1, lod: { preview: 0.7, high: 1 }, tags: ["wood", "board", "countertop"], implementation: "procedural" },
  { id: "decor-faucet", name: "Torneira monocomando", category: "fixture", modelUrl: null, thumbnail: null, dimensionsMm: { width: 80, height: 320, depth: 120 }, defaultScale: 1, lod: { preview: 0.65, high: 1 }, tags: ["faucet", "inox", "sink"], implementation: "procedural" },
  { id: "appliance-oven", name: "Forno embutido", category: "appliance", modelUrl: null, thumbnail: null, dimensionsMm: { width: 600, height: 600, depth: 560 }, defaultScale: 1, lod: { preview: 0.5, high: 1 }, tags: ["oven", "tower", "procedural"], implementation: "procedural" },
  { id: "appliance-cooktop", name: "Cooktop vitrocerâmico", category: "appliance", modelUrl: null, thumbnail: null, dimensionsMm: { width: 760, height: 55, depth: 520 }, defaultScale: 1, lod: { preview: 0.5, high: 1 }, tags: ["cooktop", "black-glass", "procedural"], implementation: "procedural" },
  { id: "appliance-fridge", name: "Geladeira", category: "appliance", modelUrl: null, thumbnail: null, dimensionsMm: { width: 900, height: 1900, depth: 700 }, defaultScale: 1, lod: { preview: 0.35, high: 1 }, tags: ["fridge", "stainless", "procedural"], implementation: "procedural" },
];

const BY_ID = new Map(ASSETS.map((asset) => [asset.id, asset]));

export const DecorAssetRegistry = {
  list: (): DecorAssetDefinition[] => [...ASSETS],
  get: (id: string): DecorAssetDefinition | undefined => BY_ID.get(id),
  listByCategory: (category: DecorAssetCategory): DecorAssetDefinition[] => ASSETS.filter((asset) => asset.category === category),
  lazyLoad: async (id: string): Promise<DecorAssetDefinition | undefined> => BY_ID.get(id),
};
