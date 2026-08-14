import { RoomSpec } from "./types";

export const DEFAULT_ROOM: RoomSpec = {
  id: "default-room",
  name: "Cozinha",
  widthMm: 3000,
  depthMm: 4000,
  heightMm: 2700,
  wallThicknessMm: 150,
  floorThicknessMm: 100,
  ceilingThicknessMm: 100,
  baseboardHeightMm: 100,
  baseboardThicknessMm: 15,
  doors: [],
  windows: [],
  showCeiling: true,
  showBaseboard: true,
};

export const PRESETS: Record<string, Partial<RoomSpec>> = {
  Cozinha: {
    widthMm: 3000,
    depthMm: 4000,
    heightMm: 2700,
  },
  Quarto: {
    widthMm: 3200,
    depthMm: 3600,
    heightMm: 2700,
  },
  Sala: {
    widthMm: 4000,
    depthMm: 5000,
    heightMm: 2800,
  },
  Banheiro: {
    widthMm: 1800,
    depthMm: 2400,
    heightMm: 2600,
  },
  Lavanderia: {
    widthMm: 1600,
    depthMm: 2600,
    heightMm: 2600,
  },
  Closet: {
    widthMm: 3000,
    depthMm: 3000,
    heightMm: 2700,
  },
};
