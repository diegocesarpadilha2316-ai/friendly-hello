import { create } from "zustand";

export type NavigationMode = "orbit" | "walk" | "inspect";
export type QualityMode = "work" | "realistic" | "presentation";
export type OcclusionMode = "normal" | "xray" | "isolate";

function rootId(id: string | null) {
  if (!id) return null;
  if (id.includes(":")) return id.split(":", 1)[0];
  return id.replace(/-(left-door|right-door|drawer-[123])$/, "");
}

interface ImmersiveState {
  navigationMode: NavigationMode;
  qualityMode: QualityMode;
  occlusionMode: OcclusionMode;
  autoOcclusion: boolean;
  selectedPart: string | null;
  openStates: Record<string, boolean>;
  hiddenObjects: Record<string, boolean>;
  setNavigationMode: (mode: NavigationMode) => void;
  setQualityMode: (mode: QualityMode) => void;
  setOcclusionMode: (mode: OcclusionMode) => void;
  setAutoOcclusion: (enabled: boolean) => void;
  selectPart: (id: string | null) => void;
  toggleOpen: (id: string) => void;
  hideSelected: () => void;
  showAll: () => void;
  closeAll: () => void;
}

export const useImmersiveStore = create<ImmersiveState>((set, get) => ({
  navigationMode: "orbit",
  qualityMode: "realistic",
  occlusionMode: "normal",
  autoOcclusion: false,
  selectedPart: null,
  openStates: {},
  hiddenObjects: {},

  setNavigationMode: (navigationMode) => set({ navigationMode }),
  setQualityMode: (qualityMode) => set({ qualityMode }),
  setAutoOcclusion: (autoOcclusion) => set({ autoOcclusion }),

  setOcclusionMode: (occlusionMode) => {
    const selectedRoot = rootId(get().selectedPart);
    if (occlusionMode !== "normal" && !selectedRoot) {
      set({ occlusionMode: "normal" });
      return;
    }
    set({ occlusionMode });
  },

  selectPart: (selectedPart) =>
    set((state) => ({
      selectedPart,
      occlusionMode:
        selectedPart === null && state.occlusionMode === "isolate" ? "normal" : state.occlusionMode,
    })),

  toggleOpen: (id) =>
    set((state) => ({
      openStates: { ...state.openStates, [id]: !state.openStates[id] },
    })),

  hideSelected: () => {
    const selectedRoot = rootId(get().selectedPart);
    if (!selectedRoot) return;

    set((state) => ({
      hiddenObjects: {
        ...state.hiddenObjects,
        [selectedRoot]: true,
      },
      selectedPart: null,
      occlusionMode: "normal",
    }));
  },

  showAll: () =>
    set({
      hiddenObjects: {},
      occlusionMode: "normal",
      selectedPart: null,
    }),

  closeAll: () => set({ openStates: {} }),
}));
