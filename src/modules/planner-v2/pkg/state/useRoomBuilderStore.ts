import { create } from "zustand";

export type WallSide = "back" | "left" | "right";
export type OpeningType = "door" | "window";

export interface OpeningSpec {
  id: string;
  type: OpeningType;
  wall: WallSide;
  offset: number;
  width: number;
  height: number;
  sill: number;
}

interface RoomBuilderState {
  width: number;
  depth: number;
  height: number;
  wallThickness: number;
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
}

const defaultOpenings: OpeningSpec[] = [
  {
    id: "window-back",
    type: "window",
    wall: "back",
    offset: -1.05,
    width: 1.25,
    height: 0.95,
    sill: 1.05
  },
  {
    id: "door-left",
    type: "door",
    wall: "left",
    offset: 0.75,
    width: 0.9,
    height: 2.1,
    sill: 0
  }
];

export const useRoomBuilderStore = create<RoomBuilderState>((set) => ({
  width: 4.8,
  depth: 3.8,
  height: 2.7,
  wallThickness: 0.08,
  openings: defaultOpenings,
  referenceImage: null,
  referenceName: null,
  referenceStyle: "natural",

  setDimension: (key, value) =>
    set({ [key]: Math.max(1.8, Math.min(12, value)) } as Partial<RoomBuilderState>),

  addOpening: (type, wall) =>
    set((state) => {
      // One opening per wall in this local prototype. A new item replaces the old one.
      const id = `${type}-${wall}-${Date.now()}`;
      const opening: OpeningSpec =
        type === "door"
          ? { id, type, wall, offset: 0, width: 0.9, height: 2.1, sill: 0 }
          : { id, type, wall, offset: 0, width: 1.2, height: 0.95, sill: 1.05 };

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
      width: 4.6,
      depth: 3.6,
      height: 2.75,
      referenceStyle: "green-kitchen",
      openings: [
        {
          id: "reference-window-right",
          type: "window",
          wall: "right",
          offset: -0.25,
          width: 1.15,
          height: 1.15,
          sill: 0.92
        },
        {
          id: "reference-door-left",
          type: "door",
          wall: "left",
          offset: 0.7,
          width: 0.9,
          height: 2.1,
          sill: 0
        }
      ]
    }),

  resetRoom: () =>
    set({
      width: 4.8,
      depth: 3.8,
      height: 2.7,
      openings: defaultOpenings,
      referenceStyle: "natural"
    })
}));
