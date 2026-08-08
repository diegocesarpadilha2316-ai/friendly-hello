import { create } from "zustand";
import type { ChatMessage, FurnitureItem, RightTab, SheetHeight, ToolMode } from "../types";
import type { FurnitureInstance } from "../../library/contracts/FurnitureInstance";
import { buildModule } from "../../library/services/buildModule";
import { ModuleRegistry } from "../../library/registry/ModuleRegistry";
import { useRoomBuilderStore } from "./useRoomBuilderStore";
import "../../library";

interface PlannerState {
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  mobileDrawerOpen: boolean;
  mobileSheetOpen: boolean;
  mobileSheetHeight: SheetHeight;
  rightTab: RightTab;
  toolMode: ToolMode;
  gridVisible: boolean;
  lightsEnabled: boolean;
  selectedId: string | null;
  furniture: FurnitureItem[];
  messages: ChatMessage[];
  instances: FurnitureInstance[];
  lastLibraryError: string | null;

  toggleLeft: () => void;
  toggleRight: () => void;
  setMobileDrawer: (open: boolean) => void;
  setMobileSheet: (open: boolean) => void;
  setMobileSheetHeight: (height: SheetHeight) => void;
  setRightTab: (tab: RightTab) => void;
  setToolMode: (mode: ToolMode) => void;
  setGridVisible: (value: boolean) => void;
  setLightsEnabled: (value: boolean) => void;
  selectFurniture: (id: string | null) => void;
  updateSelected: (patch: Partial<FurnitureItem>) => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  toggleVisibility: (id: string) => void;
  sendMessage: (content: string) => void;

  addFurnitureInstance: (moduleId: string) => string | null;
  updateFurnitureInstance: (id: string, patch: Partial<FurnitureInstance>) => void;
  removeFurnitureInstance: (id: string) => void;
  duplicateFurnitureInstance: (id: string) => void;
  selectFurnitureInstance: (id: string | null) => void;
  hideFurnitureInstance: (id: string) => void;
  showFurnitureInstance: (id: string) => void;
  toggleInstanceAnimation: (id: string) => void;
  lockFurnitureInstance: (id: string) => void;
  unlockFurnitureInstance: (id: string) => void;
  rebuildFurnitureInstance: (id: string) => void;
  clearLibraryError: () => void;
}


const initialFurniture: FurnitureItem[] = [
  {
    id: "base-1",
    name: "Armário Base",
    kind: "base",
    visible: true,
    selected: true,
    position: [-2.2, 0.36, -1.7],
    rotationY: 0,
    size: [1.5, 0.72, 0.56],
    material: "taupe"
  },
  {
    id: "base-2",
    name: "Balcão",
    kind: "base",
    visible: true,
    selected: false,
    position: [-0.65, 0.36, -1.7],
    rotationY: 0,
    size: [1.35, 0.72, 0.56],
    material: "taupe"
  },
  {
    id: "tower-1",
    name: "Torre Quente",
    kind: "tower",
    visible: true,
    selected: false,
    position: [2.3, 1.15, -1.7],
    rotationY: 0,
    size: [0.72, 2.3, 0.62],
    material: "wood"
  },
  {
    id: "upper-1",
    name: "Armário Aéreo",
    kind: "upper",
    visible: true,
    selected: false,
    position: [-0.6, 2.0, -1.75],
    rotationY: 0,
    size: [2.6, 0.78, 0.38],
    material: "taupe"
  },
  {
    id: "island-1",
    name: "Ilha Central",
    kind: "island",
    visible: true,
    selected: false,
    position: [0.4, 0.46, 0.25],
    rotationY: 0,
    size: [2.25, 0.92, 0.95],
    material: "stone"
  }
];

const initialMessages: ChatMessage[] = [
  {
    id: "m1",
    role: "assistant",
    content: "Analisei sua cozinha. Posso ajustar materiais, iluminação e medidas.",
    time: "10:24"
  },
  {
    id: "m2",
    role: "user",
    content: "Aplique LED quente nos aéreos.",
    time: "10:25"
  },
  {
    id: "m3",
    role: "assistant",
    content: "Pronto! A iluminação quente foi aplicada.",
    time: "10:26"
  }
];

export const usePlannerStore = create<PlannerState>((set, get) => ({
  leftCollapsed: false,
  rightCollapsed: false,
  mobileDrawerOpen: false,
  mobileSheetOpen: false,
  mobileSheetHeight: 50,
  rightTab: "chat",
  toolMode: "orbit",
  gridVisible: false,
  lightsEnabled: true,
  selectedId: "base-1",
  furniture: initialFurniture,
  messages: initialMessages,

  toggleLeft: () => set((s) => ({ leftCollapsed: !s.leftCollapsed })),
  toggleRight: () => set((s) => ({ rightCollapsed: !s.rightCollapsed })),
  setMobileDrawer: (open) => set({ mobileDrawerOpen: open }),
  setMobileSheet: (open) => set({ mobileSheetOpen: open }),
  setMobileSheetHeight: (height) => set({ mobileSheetHeight: height }),
  setRightTab: (tab) => set({ rightTab: tab }),
  setToolMode: (mode) => set({ toolMode: mode }),
  setGridVisible: (value) => set({ gridVisible: value }),
  setLightsEnabled: (value) => set({ lightsEnabled: value }),

  selectFurniture: (id) =>
    set((s) => ({
      selectedId: id,
      furniture: s.furniture.map((item) => ({
        ...item,
        selected: item.id === id
      }))
    })),

  updateSelected: (patch) =>
    set((s) => ({
      furniture: s.furniture.map((item) =>
        item.id === s.selectedId ? { ...item, ...patch } : item
      )
    })),

  duplicateSelected: () => {
    const s = get();
    const selected = s.furniture.find((item) => item.id === s.selectedId);
    if (!selected) return;
    const clone = {
      ...selected,
      id: `${selected.id}-copy-${Date.now()}`,
      name: `${selected.name} (cópia)`,
      position: [
        selected.position[0] + 0.35,
        selected.position[1],
        selected.position[2] + 0.35
      ] as [number, number, number],
      selected: true
    };
    set({
      selectedId: clone.id,
      furniture: [
        ...s.furniture.map((item) => ({ ...item, selected: false })),
        clone
      ]
    });
  },

  deleteSelected: () =>
    set((s) => ({
      selectedId: null,
      furniture: s.furniture.filter((item) => item.id !== s.selectedId)
    })),

  toggleVisibility: (id) =>
    set((s) => ({
      furniture: s.furniture.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item
      )
    })),

  sendMessage: (content) => {
    const clean = content.trim();
    if (!clean) return;
    const now = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });
    const user: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: clean,
      time: now
    };
    const assistant: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "Comando recebido. Esta área deve ser conectada ao agente real do Dioris.",
      time: now
    };
    set((s) => ({ messages: [...s.messages, user, assistant] }));
  },

  instances: [],
  lastLibraryError: null,
  clearLibraryError: () => set({ lastLibraryError: null }),

  addFurnitureInstance: (moduleId) => {
    const definition = ModuleRegistry.get(moduleId);
    if (!definition) {
      set({ lastLibraryError: `Módulo não registrado: ${moduleId}` });
      return null;
    }

    const room = useRoomBuilderStore.getState();
    const instanceId = `${moduleId}-${Date.now().toString(36)}`;
    const dims = definition.defaultDimensionsMm;
    const rules = definition.placementRules;

    const existing = get().instances.filter((item) => item.moduleDefinitionId === moduleId).length;
    const stepX = (existing % 4) * (dims.width + 20) - 1200;
    const x = Math.max(
      -room.width / 2 + dims.width / 2 + 12,
      Math.min(room.width / 2 - dims.width / 2 - 12, stepX)
    );
    const z = -room.depth / 2 + dims.depth / 2 + rules.rearGapMm;
    const y = rules.wallMounted ? rules.minHeightFromFloorMm : 0;

    const outcome = buildModule({
      moduleId,
      instanceId,
      dimensionsMm: dims,
      materialId: definition.defaultMaterialId,
      positionMm: { x, y, z },
      room: { widthMm: room.width, depthMm: room.depth, heightMm: room.height }
    });

    if (!outcome.ok) {
      set({ lastLibraryError: outcome.error ?? "Falha desconhecida no build do módulo." });
      return null;
    }

    const instance: FurnitureInstance = {
      id: instanceId,
      moduleDefinitionId: moduleId,
      familyId: definition.familyId,
      name: definition.name,
      dimensionsMm: outcome.dimensionsMm,
      positionMm: { x, y, z },
      rotationDeg: { x: 0, y: 0, z: 0 },
      materialOverrides: {},
      hardwareOverrides: {},
      parts: outcome.parts,
      visible: true,
      locked: false,
      selected: true
    };

    set((s) => ({
      lastLibraryError: null,
      selectedId: instanceId,
      furniture: s.furniture.map((item) => ({ ...item, selected: false })),
      instances: [
        ...s.instances.map((item) => ({ ...item, selected: false })),
        instance
      ]
    }));

    return instanceId;
  },

  updateFurnitureInstance: (id, patch) => {
    set((s) => ({
      instances: s.instances.map((item) => (item.id === id ? { ...item, ...patch } : item))
    }));
    if (patch.dimensionsMm || patch.materialOverrides) {
      get().rebuildFurnitureInstance(id);
    }
  },

  rebuildFurnitureInstance: (id) => {
    const instance = get().instances.find((item) => item.id === id);
    if (!instance) return;
    const room = useRoomBuilderStore.getState();
    const outcome = buildModule({
      moduleId: instance.moduleDefinitionId,
      instanceId: instance.id,
      dimensionsMm: instance.dimensionsMm,
      materialId: instance.materialOverrides["*"],
      materialOverrides: instance.materialOverrides,
      hardwareOverrides: instance.hardwareOverrides,
      positionMm: instance.positionMm,
      room: { widthMm: room.width, depthMm: room.depth, heightMm: room.height }
    });
    if (!outcome.ok) {
      set({ lastLibraryError: outcome.error ?? "Falha ao reconstruir o módulo." });
      return;
    }
    set((s) => ({
      lastLibraryError: null,
      instances: s.instances.map((item) =>
        item.id === id
          ? { ...item, parts: outcome.parts, dimensionsMm: outcome.dimensionsMm }
          : item
      )
    }));
  },

  removeFurnitureInstance: (id) =>
    set((s) => ({
      instances: s.instances.filter((item) => item.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId
    })),

  duplicateFurnitureInstance: (id) => {
    const instance = get().instances.find((item) => item.id === id);
    if (!instance) return;
    const cloneId = `${instance.moduleDefinitionId}-${Date.now().toString(36)}`;
    const clone: FurnitureInstance = {
      ...instance,
      id: cloneId,
      selected: true,
      positionMm: {
        ...instance.positionMm,
        x: instance.positionMm.x + instance.dimensionsMm.width + 20
      },
      parts: instance.parts.map((part) => ({
        ...part,
        id: part.id.replace(instance.id, cloneId),
        moduleId: cloneId,
        groupId: part.groupId?.replace(instance.id, cloneId)
      }))
    };
    set((s) => ({
      selectedId: cloneId,
      instances: [...s.instances.map((item) => ({ ...item, selected: false })), clone]
    }));
  },

  selectFurnitureInstance: (id) =>
    set((s) => ({
      selectedId: id,
      instances: s.instances.map((item) => ({ ...item, selected: item.id === id })),
      furniture: s.furniture.map((item) => ({ ...item, selected: false }))
    })),

  hideFurnitureInstance: (id) =>
    set((s) => ({
      instances: s.instances.map((item) => (item.id === id ? { ...item, visible: false } : item))
    })),

  showFurnitureInstance: (id) =>
    set((s) => ({
      instances: s.instances.map((item) => (item.id === id ? { ...item, visible: true } : item))
    })),

  toggleInstanceAnimation: (id) =>
    set((s) => ({
      instances: s.instances.map((item) =>
        item.id === id ? { ...item, isOpen: !item.isOpen, openAmount: item.isOpen ? 0 : 1 } : item
      )
    })),

  lockFurnitureInstance: (id) =>

    set((s) => ({
      instances: s.instances.map((item) => (item.id === id ? { ...item, locked: true } : item))
    })),

  unlockFurnitureInstance: (id) =>
    set((s) => ({
      instances: s.instances.map((item) => (item.id === id ? { ...item, locked: false } : item))
    }))
}));
