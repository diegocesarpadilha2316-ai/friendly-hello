export type DesignIntentModuleKind = "base" | "drawer" | "sink" | "tower" | "upper" | "cooktop" | "hood" | "island";

export interface DesignIntentModule {
  id: string;
  moduleId: string;
  kind: DesignIntentModuleKind;
  dimensionsMm: { width: number; height: number; depth: number };
  sequenceIndex: number;
  anchor: "floor" | "wall" | "appliance-zone";
}

export interface DesignIntent {
  sourceText: string;
  domain: "kitchen" | "wardrobe" | "bathroom" | "generic";
  room?: { widthMm?: number; depthMm?: number; heightMm?: number };
  wallId: string;
  thicknessMm: { panelMm: number; doorMm: number; shelfMm: number; backMm: number };
  materials: { body: string; front: string; countertop: string };
  hardware: { handle: string; hinge: string; slide: string };
  modules: DesignIntentModule[];
  constraints: {
    noManualPositioning: boolean;
    requireLayoutEngine: boolean;
    requireFabricationReport: boolean;
  };
  requestedOutputs: Array<"scene" | "render" | "cut-list" | "bom" | "budget" | "assembly-report">;
}
