import { create } from "zustand";

export type WallSide = "back" | "left" | "right";
export type OpeningType = "door" | "window";

export interface OpeningSpec {
  id: string;
  type: OpeningType;
  wall: WallSide;
  offset: number; // mm
  width: number; // mm
  height: number; // mm
  sill: number; // mm
}

interface RoomBuilderState {
  width: number; // mm
  depth: number; // mm
  height: number; // mm
  wallThickness: number; // mm
  openings: OpeningSpec[];
  referenceImage: string | null;
  referenceName: string | null;
  referenceStyle: "natural" | "green-kitchen";
  setDimension: (key: "width" | "depth" | "height", value: number) => void;
  addOpening: (type: OpeningType, wall: WallSide) => void;
  updateOpening: (id: string, patch: Partial<OpeningSpec>) => void;
  removeOpening: (id: string) => void;
  setReferenceImage: (dataUrl: string | null, name?: string | null) => void;
  applyReferencePreset: () => void;
  resetRoom: () => void;
  restoreRoom: (room: Omit<RoomBuilderState, "setDimension" | "addOpening" | "updateOpening" | "removeOpening" | "setReferenceImage" | "applyReferencePreset" | "resetRoom" | "restoreRoom">) => void;
}

const defaultOpenings: OpeningSpec[] = [
  {
    id: "window-back",
    type: "window",
    wall: "back",
    offset: -1050,
    width: 1250,
    height: 950,
    sill: 1050
  },
  {
    id: "door-left",
    type: "door",
    wall: "left",
    offset: 750,
    width: 900,
    height: 2100,
    sill: 0
  }
];

export const useRoomBuilderStore = create<RoomBuilderState>((set) => ({
  width: 4800,
  depth: 3800,
  height: 2700,
  wallThickness: 80,
  openings: defaultOpenings,
  referenceImage: null,
  referenceName: null,
  referenceStyle: "natural",

  setDimension: (key, value) =>
    set({ [key]: Math.max(1800, Math.min(12000, value)) } as Partial<RoomBuilderState>),

  addOpening: (type, wall) =>
    set((state) => {
      const id = `${type}-${wall}-${Date.now()}`;
      const opening: OpeningSpec =
        type === "door"
          ? { id, type, wall, offset: 0, width: 900, height: 2100, sill: 0 }
          : { id, type, wall, offset: 0, width: 1200, height: 950, sill: 1050 };

      return {
        openings: [...state.openings.filter((item) => item.wall !== wall), opening]
      };
    }),

  updateOpening: (id, patch) =>
    set((state) => ({
      openings: state.openings.map((opening) =>
        opening.id === id ? { ...opening, ...patch } : opening
      )
    })),

  removeOpening: (id) =>
    set((state) => ({
      openings: state.openings.filter((opening) => opening.id !== id)
    })),

  setReferenceImage: (referenceImage, referenceName = null) =>
    set({ referenceImage, referenceName }),

  applyReferencePreset: () =>
    set({
      width: 4600,
      depth: 3600,
      height: 2750,
      referenceStyle: "green-kitchen",
      openings: [
        {
          id: "reference-window-right",
          type: "window",
          wall: "right",
          offset: -250,
          width: 1150,
          height: 1150,
          sill: 920
        },
        {
          id: "reference-door-left",
          type: "door",
          wall: "left",
          offset: 700,
          width: 900,
          height: 2100,
          sill: 0
        }
      ]
    }),

  resetRoom: () =>
    set({
      width: 4800,
      depth: 3800,
      height: 2700,
      openings: defaultOpenings,
      referenceStyle: "natural"
    }),

  restoreRoom: (room) =>
    set({
      width: room.width,
      depth: room.depth,
      height: room.height,
      wallThickness: room.wallThickness,
      openings: room.openings,
      referenceImage: room.referenceImage,
      referenceName: room.referenceName,
      referenceStyle: room.referenceStyle
    })
}));
