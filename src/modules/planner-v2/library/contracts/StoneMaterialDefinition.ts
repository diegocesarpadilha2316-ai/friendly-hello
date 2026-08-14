import type { MaterialDefinition, StoneFinish, StoneType } from "./MaterialDefinition";

export interface StoneMaterialDefinition extends MaterialDefinition {
  category: "stone";
  stone: {
    type: StoneType;
    finish: StoneFinish;
    physicalScaleMm: { x: number; y: number };
    veinDirection: "length" | "width" | "diagonal" | "none";
    veinScale: number;
    thicknessMm: number;
    edgeProfile: "square" | "eased" | "waterfall";
  };
}

export function isStoneMaterialDefinition(material: MaterialDefinition): material is StoneMaterialDefinition {
  return material.category === "stone" && "stone" in material;
}
