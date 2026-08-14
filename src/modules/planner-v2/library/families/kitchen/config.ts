import type { GrainDirection } from "../../contracts/MaterialDefinition";

export const KITCHEN_CONFIG = {
  panelMm: 18,
  backMm: 6,
  edgeBandMm: 1,
  doorGapMm: 2,
  drawerGapMm: 2,
  doorSideGapMm: 2,
  toeKickMm: 150,
  rearGapMm: 10,
  sideGapMm: 0,
  countertopThicknessMm: 20,
  countertopOverhangMm: 20,
  snapToleranceMm: 15,
  defaultDepthMm: 580,
  defaultUpperDepthMm: 350,
  defaultBaseHeightMm: 870,
  defaultUpperHeightMm: 700,
  grain: {
    vertical: "vertical" as GrainDirection,
    horizontal: "horizontal" as GrainDirection,
    none: "none" as GrainDirection,
  },
} as const;

export const KITCHEN_MATERIAL_IDS = [
  "mdf-white",
  "mdf-wood-natural",
  "mdf-graphite",
  "mdf-green",
  "mdf-taupe",
] as const;

export const KITCHEN_COUNTERTOP_MATERIAL_IDS = ["stone-light", "stone-dark"] as const;

export const KITCHEN_HARDWARE_IDS = {
  hinges: ["hinge-standard", "hinge-soft-close", "hinge-curved", "hinge-super-curved"],
  slides: ["slide-telescopic", "slide-hidden", "slide-hidden-soft-close"],
  handles: ["handle-bar", "handle-profile", "handle-inset", "handle-none"],
} as const;

export const kitchenBodyMaterial = (materialOverrides?: Record<string, string>, fallback = "mdf-white") =>
  materialOverrides?.body ?? fallback;

export const kitchenFrontMaterial = (materialOverrides?: Record<string, string>, fallback = "mdf-white") =>
  materialOverrides?.front ?? materialOverrides?.body ?? fallback;

export const kitchenBackMaterial = (materialOverrides?: Record<string, string>, fallback = "mdf-white") =>
  materialOverrides?.back ?? materialOverrides?.body ?? fallback;

export const kitchenCountertopMaterial = (
  materialOverrides?: Record<string, string>,
  fallback = "stone-light"
) => materialOverrides?.countertop ?? fallback;
