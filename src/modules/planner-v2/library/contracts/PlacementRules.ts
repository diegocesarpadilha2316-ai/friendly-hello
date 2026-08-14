/** Regras de posicionamento de um módulo dentro do cômodo (sempre em mm). */
export type AllowedWall = "back" | "left" | "right" | "free";

export interface PlacementRules {
  floorMounted: boolean;
  wallMounted: boolean;
  allowedWalls: AllowedWall[];
  rearGapMm: number;
  sideGapMm: number;
  minHeightFromFloorMm: number;
  /** Altura padrão da base do módulo ao inserir pela Biblioteca. */
  defaultHeightFromFloorMm?: number;
  maxHeightFromFloorMm?: number;
  collisionRequired: boolean;
  allowedBelowWindow: boolean;
  allowedNearDoor: boolean;
  allowedNearOtherModule?: boolean;
  requiresCountertop?: boolean;
  acceptsUpperModule?: boolean;
  acceptsAppliance?: boolean;
}

export const DEFAULT_PLACEMENT: PlacementRules = {
  floorMounted: true,
  wallMounted: false,
  allowedWalls: ["back", "left", "right", "free"],
  rearGapMm: 12,
  sideGapMm: 0,
  minHeightFromFloorMm: 0,
  collisionRequired: true,
  allowedBelowWindow: true,
  allowedNearDoor: true,
  allowedNearOtherModule: true,
  requiresCountertop: false,
  acceptsUpperModule: true,
  acceptsAppliance: false,
};
