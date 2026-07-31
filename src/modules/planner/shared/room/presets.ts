/**
 * Presets arquitetônicos por tipo de cômodo. Só arquitetura — nenhum
 * móvel, nenhum material realista.
 */
import type { PlannerRoomType } from "../types/project";
import type { RoomArchitectureSpec } from "./types";

export interface RoomPreset {
  id: string;
  label: string;
  roomType: PlannerRoomType;
  spec: RoomArchitectureSpec;
}

function preset(
  id: string,
  label: string,
  roomType: PlannerRoomType,
  spec: Omit<RoomArchitectureSpec, "id">,
): RoomPreset {
  return { id, label, roomType, spec: { id, ...spec } };
}

export const ROOM_PRESETS: readonly RoomPreset[] = [
  preset("quarto", "Quarto (dormitório)", "dormitorio", {
    widthMm: 3200,
    depthMm: 3600,
    heightMm: 2700,
    wallThicknessMm: 150,
    doors: [{ wall: "front", offsetMm: 300, widthMm: 800, heightMm: 2100 }],
    windows: [{ wall: "back", offsetMm: 1000, widthMm: 1200, heightMm: 1100, sillHeightMm: 1000 }],
  }),
  preset("cozinha", "Cozinha", "cozinha", {
    widthMm: 4200,
    depthMm: 3200,
    heightMm: 2700,
    wallThicknessMm: 150,
    doors: [{ wall: "front", offsetMm: 200, widthMm: 900, heightMm: 2100 }],
    windows: [{ wall: "back", offsetMm: 1600, widthMm: 1400, heightMm: 1000, sillHeightMm: 1100 }],
  }),
  preset("banheiro", "Banheiro", "banheiro", {
    widthMm: 1800,
    depthMm: 2400,
    heightMm: 2500,
    wallThicknessMm: 120,
    doors: [{ wall: "front", offsetMm: 150, widthMm: 700, heightMm: 2100 }],
    windows: [{ wall: "back", offsetMm: 500, widthMm: 600, heightMm: 600, sillHeightMm: 1600 }],
  }),
  preset("lavanderia", "Lavanderia", "lavanderia", {
    widthMm: 2200,
    depthMm: 1800,
    heightMm: 2600,
    wallThicknessMm: 100,
    doors: [{ wall: "front", offsetMm: 150, widthMm: 800, heightMm: 2100 }],
    windows: [{ wall: "right", offsetMm: 500, widthMm: 800, heightMm: 800, sillHeightMm: 1400 }],
  }),
  preset("closet", "Closet", "closet", {
    widthMm: 2600,
    depthMm: 2200,
    heightMm: 2600,
    wallThicknessMm: 90,
    doors: [{ wall: "front", offsetMm: 200, widthMm: 800, heightMm: 2100 }],
  }),
  preset("sala", "Sala de estar", "sala", {
    widthMm: 5000,
    depthMm: 4000,
    heightMm: 2800,
    wallThicknessMm: 150,
    doors: [{ wall: "left", offsetMm: 400, widthMm: 900, heightMm: 2100 }],
    windows: [{ wall: "back", offsetMm: 1500, widthMm: 2000, heightMm: 1400, sillHeightMm: 800 }],
  }),
];

export function roomPresetFor(type: PlannerRoomType | undefined): RoomPreset {
  return ROOM_PRESETS.find((p) => p.roomType === type) ?? ROOM_PRESETS[0]!;
}