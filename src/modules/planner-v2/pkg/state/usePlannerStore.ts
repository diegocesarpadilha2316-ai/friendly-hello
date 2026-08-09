import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

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
  toggleInstanceAnimation: (id: string, partId?: string) => void;
  closeAllAnimations: () => void;
  setInstanceIsolated: (id: string | null) => void;
  toggleInstanceXRay: (id: string) => void;
  showAllInstances: () => void;
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

export const usePlannerStore = create<PlannerState>()(
  subscribeWithSelector((set, get) => ({
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
  instances: [],
  lastLibraryError: null,

  toggleLeft: () => set((s) => ({ ...s, leftCollapsed: !s.leftCollapsed })),
  toggleRight: () => set((s) => ({ ...s, rightCollapsed: !s.rightCollapsed })),
  setMobileDrawer: (open) => set((s) => ({ ...s, mobileDrawerOpen: open })),
  setMobileSheet: (open) => set((s) => ({ ...s, mobileSheetOpen: open })),
  setMobileSheetHeight: (height) => set((s) => ({ ...s, mobileSheetHeight: height })),
  setRightTab: (tab) => set((s) => ({ ...s, rightTab: tab })),
  setToolMode: (mode) => set((s) => ({ ...s, toolMode: mode })),
  setGridVisible: (value) => set((s) => ({ ...s, gridVisible: value })),
  setLightsEnabled: (value) => set((s) => ({ ...s, lightsEnabled: value })),

  selectFurniture: (id) =>
    set((s) => ({
      ...s,
      selectedId: id,
      furniture: s.furniture.map((item) => ({
        ...item,
        selected: item.id === id
      }))
    })),

  updateSelected: (patch) =>
    set((s) => ({
      ...s,
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
    set((state) => ({
      ...state,
      selectedId: clone.id,
      furniture: [
        ...state.furniture.map((item) => ({ ...item, selected: false })),
        clone
      ]
    }));
  },

  deleteSelected: () =>
    set((s) => ({
      ...s,
      furniture: s.furniture.filter((item) => item.id !== s.selectedId),
      selectedId: null
    })),

  toggleVisibility: (id) =>
    set((s) => ({
      ...s,
      furniture: s.furniture.map((item) => (item.id === id ? { ...item, visible: !item.visible } : item))
    })),

  sendMessage: (content) => {
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    set((s) => ({
      ...s,
      messages: [...s.messages, { id: Date.now().toString(), role: "user", content, time: now }]
    }));
  },

  addFurnitureInstance: (moduleId) => {
    const definition = ModuleRegistry.get(moduleId);
    if (!definition) return null;

    const id = `furniture-${Date.now()}`;
    
    const room = useRoomBuilderStore.getState();
    const x = room.width / 2;
    const z = -room.depth / 2 + definition.defaultDimensionsMm.depth / 2;
    
    const y = definition.placementRules.wallMounted 
      ? definition.placementRules.minHeightFromFloorMm 
      : 0;

    const outcome = buildModule({
      instanceId: id,
      moduleId,
      dimensionsMm: definition.defaultDimensionsMm,
      positionMm: { x, y, z }
    });

    if (!outcome.ok) {
       set(s => ({ ...s, lastLibraryError: outcome.error || 'Erro no build' }));
       return null;
    }

    const instance: FurnitureInstance = {
      id,
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
      ...s,
      instances: [...s.instances.map(i => ({ ...i, selected: false })), instance],
      selectedId: id
    }));

    return id;
  },

  updateFurnitureInstance: (id, patch) =>
    set((s) => {
      const room = useRoomBuilderStore.getState();
      const instances = s.instances.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...patch };
        
        const outcome = buildModule({
          instanceId: id,
          moduleId: updated.moduleDefinitionId,
          dimensionsMm: updated.dimensionsMm,
          positionMm: updated.positionMm,
          rotationDeg: updated.rotationDeg,
          materialOverrides: updated.materialOverrides,
          hardwareOverrides: updated.hardwareOverrides,
          room: { widthMm: room.width, depthMm: room.depth, heightMm: 2600 }
        });

        if (!outcome.ok) {
           console.warn("Validação falhou ao atualizar instância:", outcome.error);
           // O validateModule já clampa ou retorna erro se atravessar.
           // Se for um erro crítico de colisão, podemos reverter, mas para UX 
           // é melhor deixar o usuário ver o erro visual ou corrigir a posição.
        }

        return { 
          ...updated, 
          parts: outcome.parts, 
          dimensionsMm: outcome.dimensionsMm 
        };
      });
      return { ...s, instances };
    }),



  removeFurnitureInstance: (id) =>
    set((s) => ({
      ...s,
      instances: s.instances.filter((item) => item.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId
    })),

  duplicateFurnitureInstance: (id) => {
    const original = get().instances.find((i) => i.id === id);
    if (!original) return;

    const newId = `furniture-${Date.now()}`;
    const newPosition = { 
      ...original.positionMm, 
      x: original.positionMm.x + original.dimensionsMm.width 
    };

    const outcome = buildModule({
      instanceId: newId,
      moduleId: original.moduleDefinitionId,
      dimensionsMm: original.dimensionsMm,
      positionMm: newPosition,
      rotationDeg: original.rotationDeg,
      materialOverrides: original.materialOverrides,
      hardwareOverrides: original.hardwareOverrides
    });

    if (!outcome.ok) return;

    const clone: FurnitureInstance = {
      ...original,
      id: newId,
      parts: outcome.parts,
      positionMm: newPosition,
      selected: true,
      isOpen: false,
      openAmount: 0,
      openStates: {}
    };

    set((s) => ({
      ...s,
      instances: [...s.instances.map((i) => ({ ...i, selected: false })), clone],
      selectedId: newId
    }));
  },

  selectFurnitureInstance: (id) =>
    set((s) => ({
      ...s,
      selectedId: id,
      instances: s.instances.map((item) => ({ ...item, selected: item.id === id }))
    })),

  rebuildFurnitureInstance: (id) => {
    const instance = get().instances.find((i) => i.id === id);
    if (!instance) return;

    const outcome = buildModule({
      instanceId: instance.id,
      moduleId: instance.moduleDefinitionId,
      dimensionsMm: instance.dimensionsMm,
      positionMm: instance.positionMm,
      rotationDeg: instance.rotationDeg,
      materialOverrides: instance.materialOverrides,
      hardwareOverrides: instance.hardwareOverrides
    });

    if (!outcome.ok) return;

    set((s) => ({
      ...s,
      instances: s.instances.map((i) => (i.id === id ? { ...i, parts: outcome.parts, dimensionsMm: outcome.dimensionsMm } : i))
    }));
  },

  hideFurnitureInstance: (id) =>
    set((s) => ({
      ...s,
      instances: s.instances.map((item) => (item.id === id ? { ...item, visible: false } : item))
    })),

  showFurnitureInstance: (id) =>
    set((s) => ({
      ...s,
      instances: s.instances.map((item) => (item.id === id ? { ...item, visible: true } : item))
    })),

  toggleInstanceAnimation: (id: string, partId?: string) =>
    set((s) => ({
      ...s,
      instances: s.instances.map((item) => {
        if (item.id !== id) return item;
        
        if (partId) {
          const currentOpenStates = item.openStates || {};
          const current = currentOpenStates[partId] || 0;
          return {
            ...item,
            isOpen: false, // Reset global state if interacting individually
            openStates: {
              ...currentOpenStates,
              [partId]: current > 0 ? 0 : 1
            }
          };
        }


        const nextOpen = !item.isOpen;
        return { 
          ...item, 
          isOpen: nextOpen, 
          openAmount: nextOpen ? 1 : 0,
          openStates: {} 
        };
      })
    })),

  closeAllAnimations: () =>
    set((s) => ({
      ...s,
      instances: s.instances.map(i => ({ 
        ...i, 
        isOpen: false, 
        openAmount: 0, 
        openStates: {} 
      }))
    })),

  setInstanceIsolated: (id: string | null) =>
    set((s) => ({
      ...s,
      instances: s.instances.map(i => ({
        ...i,
        isIsolated: id === null ? false : i.id === id,
        visible: id === null ? true : i.id === id
      }))
    })),

  toggleInstanceXRay: (id: string) =>
    set((s) => ({
      ...s,
      instances: s.instances.map(i => (i.id === id ? { ...i, isXRay: !i.isXRay } : i))
    })),

  showAllInstances: () =>
    set((s) => ({
      ...s,
      instances: s.instances.map(i => ({ ...i, visible: true, isIsolated: false, isXRay: false }))
    })),

  lockFurnitureInstance: (id) =>
    set((s) => ({
      ...s,
      instances: s.instances.map((item) => (item.id === id ? { ...item, locked: true } : item))
    })),

  unlockFurnitureInstance: (id) =>
    set((s) => ({
      ...s,
      instances: s.instances.map((item) => (item.id === id ? { ...item, locked: false } : item))
    })),
    
  clearLibraryError: () => set((s) => ({ ...s, lastLibraryError: null }))
  }))
);

if (typeof window !== "undefined") {
  (window as any).plannerV2Store = usePlannerStore;
}
