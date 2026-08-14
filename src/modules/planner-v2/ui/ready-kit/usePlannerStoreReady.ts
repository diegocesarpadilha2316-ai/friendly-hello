import { create } from "zustand";
import type { ChatMessage, FurnitureItem, RightTab, SheetHeight, ToolMode } from "./types";
import { usePlannerV2Store } from "../../core/store";

// O Store real do V2 e o Store da interface do pacote são unificados aqui.
// Seguindo a ETAPA B, o objetivo é que a interface use os dados reais.

export const usePlannerStore = create<any>((set, get) => ({
  // UI State
  leftCollapsed: false,
  rightCollapsed: false,
  mobileDrawerOpen: false,
  mobileSheetOpen: false,
  mobileSheetHeight: 50,
  rightTab: "chat",
  toolMode: "orbit",
  gridVisible: false,
  lightsEnabled: true,

  // Reais do V2 - transformados em estado plano para evitar getters circulares/loops
  furniture: [],
  selectedId: null,
  instances: [],
  lastLibraryError: null,

  messages: [],

  // Actions
  toggleLeft: () => set((s: any) => ({ leftCollapsed: !s.leftCollapsed })),
  toggleRight: () => set((s: any) => ({ rightCollapsed: !s.rightCollapsed })),
  setMobileDrawer: (open: boolean) => set({ mobileDrawerOpen: open }),
  setMobileSheet: (open: boolean) => set({ mobileSheetOpen: open, mobileDrawerOpen: false }), // Fechar um ao abrir outro
  setMobileSheetHeight: (height: SheetHeight) => set({ mobileSheetHeight: height }),

  setRightTab: (tab: RightTab) => set({ rightTab: tab }),
  setToolMode: (mode: ToolMode) => set({ toolMode: mode }),
  setGridVisible: (value: boolean) => set({ gridVisible: value }),
  setLightsEnabled: (value: boolean) => set({ lightsEnabled: value }),
  setViewMode: (mode: "technical" | "presentation") => {
    usePlannerV2Store.getState().setViewMode(mode);
  },
  setCameraAction: (action: string) => {
    usePlannerV2Store.getState().setCameraAction(action);
  },

  selectFurniture: (id: string | null) => {
    usePlannerV2Store.getState().selectItem(id);
    set({ selectedId: id }); // Force update UI store
  },

  updateSelected: (patch: any) => {
    const selectedId = usePlannerV2Store.getState().selectedId;
    if (selectedId) {
      // Converte de volta para mm se necessário (ex: size)
      const updates: any = { ...patch };
      if (patch.size) {
        updates.widthMm = patch.size[0] * 1000;
        updates.heightMm = patch.size[1] * 1000;
        updates.depthMm = patch.size[2] * 1000;
      }
      if (patch.rotationY !== undefined) updates.rotation = patch.rotationY;

      usePlannerV2Store.getState().updateItem(selectedId, updates);
    }
  },

  duplicateSelected: () => {
    const selectedId = usePlannerV2Store.getState().selectedId;
    if (selectedId) usePlannerV2Store.getState().duplicateItem(selectedId);
  },

  deleteSelected: () => {
    const selectedId = usePlannerV2Store.getState().selectedId;
    if (selectedId) usePlannerV2Store.getState().removeItem(selectedId);
  },

  toggleVisibility: (id: string) => {
    const item = usePlannerV2Store.getState().items.find((i) => i.id === id);
    if (item) usePlannerV2Store.getState().updateItem(id, { visible: !item.visible });
    // Also check V2 state
    const v2Store = (window as any).plannerV2Store;
    if (v2Store) {
      const instance = v2Store.getState().instances.find((i: any) => i.id === id);
      if (instance) v2Store.getState().updateFurnitureInstance(id, { visible: !instance.visible });
    }
  },

  addFurnitureInstance: async (moduleId: string) => {
    const v2Store = (window as any).plannerV2Store;
    if (v2Store) {
      await v2Store.getState().addFurnitureInstance(moduleId);
    }
  },

  removeFurnitureInstance: (id: string) => {
    const v2Store = (window as any).plannerV2Store;
    if (v2Store) {
      v2Store.getState().removeFurnitureInstance(id);
    }
  },

  updateFurnitureInstance: (id: string, updates: any) => {
    const v2Store = (window as any).plannerV2Store;
    if (v2Store) {
      v2Store.getState().updateFurnitureInstance(id, updates);
    }
  },

  toggleInstanceAnimation: (id: string) => {
    const v2Store = (window as any).plannerV2Store;
    if (v2Store) {
      v2Store.getState().toggleInstanceAnimation(id);
    }
  },

  clearLibraryError: () => set({ lastLibraryError: null }),

  sendMessage: (content: string) => {
    // Integração futura com o agente real
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    set((s: any) => ({
      messages: [...s.messages, { id: Date.now().toString(), role: "user", content, time: now }],
    }));
  },
}));

// Sincronização reativa otimizada
const syncFromV2 = () => {
  const v2State = usePlannerV2Store.getState();

  // Mapeia apenas o necessário para a UI
  const mappedFurniture = v2State.items.map((item) => ({
    id: item.id,
    name: item.name,
    kind: item.family === "kitchen-base-cabinet" ? "base" : "tower",
    visible: item.visible,
    selected: item.selected,
    position: [item.position.x / 1000, item.position.y / 1000, item.position.z / 1000],
    rotationY: item.rotation,
    size: [item.widthMm / 1000, item.heightMm / 1000, item.depthMm / 1000],
    material: item.parameters.bodyMaterialId || "taupe",
  }));

  // Compara para evitar atualizações idênticas (evita loops se houver algum subscribe circular)
  const currentStore = usePlannerStore.getState();
  if (
    JSON.stringify(currentStore.furniture) !== JSON.stringify(mappedFurniture) ||
    currentStore.selectedId !== v2State.selectedId ||
    currentStore.viewMode !== v2State.viewMode ||
    currentStore.instances?.length !== (window as any).plannerV2Store?.getState().instances.length
  ) {
    const v2Store = (window as any).plannerV2Store;
    const instances = v2Store ? v2Store.getState().instances : [];

    usePlannerStore.setState({
      furniture: mappedFurniture,
      selectedId: v2State.selectedId,
      viewMode: v2State.viewMode,
      instances: instances,
    });
  }
};

// Inicialização e Inscrição
syncFromV2();
usePlannerV2Store.subscribe(syncFromV2);
