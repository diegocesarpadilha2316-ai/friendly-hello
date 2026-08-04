import { create } from 'zustand';
import { RoomSpec, DEFAULT_ROOM, PRESETS, generateRoomGeometry, RoomResult, validateRoomSpec } from '../room';
import { FurnitureItem, FurnitureFamily } from '../furniture/types';
import { createFurnitureItem } from '../furniture/defaults';


interface PlannerV2State {
  roomSpec: RoomSpec;
  roomResult: RoomResult;
  errors: string[];
  viewMode: 'technical' | 'presentation';
  useViewportNext: boolean;
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  leftPanelWidth: number;
  rightPanelWidth: number;
  
  // Furniture State
  items: FurnitureItem[];
  selectedId: string | null;
  
  // Actions
  setRoomSpec: (spec: Partial<RoomSpec>) => void;
  applyPreset: (name: string) => void;
  setViewMode: (mode: 'technical' | 'presentation') => void;
  setUseViewportNext: (use: boolean) => void;
  setLeftPanelCollapsed: (collapsed: boolean) => void;
  setRightPanelCollapsed: (collapsed: boolean) => void;
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  
  // Furniture Actions
  addItem: (family?: FurnitureFamily, variant?: string) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<FurnitureItem>) => void;
  selectItem: (id: string | null) => void;
  duplicateItem: (id: string) => void;
  toggleAnimation: () => void;
}

export const usePlannerV2Store = create<PlannerV2State>((set, get) => ({
  roomSpec: DEFAULT_ROOM,
  roomResult: generateRoomGeometry(DEFAULT_ROOM),
  errors: [],
  viewMode: 'technical',
  useViewportNext: false,
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
  leftPanelWidth: 20,
  rightPanelWidth: 25,
  
  items: [],
  selectedId: null,

  setRoomSpec: (updates) => {
    const newSpec = { ...get().roomSpec, ...updates };
    const errors = validateRoomSpec(newSpec);
    
    set({ 
      roomSpec: newSpec,
      roomResult: generateRoomGeometry(newSpec),
      errors
    });
  },

  applyPreset: (name) => {
    const preset = PRESETS[name];
    if (preset) {
      get().setRoomSpec({ ...preset, name });
    }
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setUseViewportNext: (use) => set({ useViewportNext: use }),
  setLeftPanelCollapsed: (collapsed) => set({ leftPanelCollapsed: collapsed }),
  setRightPanelCollapsed: (collapsed) => set({ rightPanelCollapsed: collapsed }),
  setLeftPanelWidth: (width) => set({ leftPanelWidth: width }),
  setRightPanelWidth: (width) => set({ rightPanelWidth: width }),

  addItem: (family = 'kitchen-base-cabinet', variant = 'one-door') => {
    const id = `item-${Math.random().toString(36).substr(2, 9)}`;
    const newItem = createFurnitureItem(id, family as FurnitureFamily, variant);

    const { roomSpec } = get();
    
    // Position it against the back wall (z = -depth/2)
    // and centered (x = width/2)
    newItem.position = { 
      x: roomSpec.widthMm / 2, 
      y: 0, 
      z: -roomSpec.depthMm / 2 + newItem.depthMm / 2 
    };

    set((state) => ({
      items: [...state.items, newItem],
      selectedId: id
    }));
    
    get().selectItem(id);
  },


  removeItem: (id) => set((state) => ({
    items: state.items.filter(i => i.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId
  })),

  updateItem: (id, updates) => set((state) => ({
    items: state.items.map(i => i.id === id ? { ...i, ...updates } : i)
  })),

  selectItem: (id) => set((state) => ({ 
    selectedId: id,
    items: state.items.map(i => ({ ...i, selected: i.id === id }))
  })),

  duplicateItem: (id) => {
    const original = get().items.find(i => i.id === id);
    if (!original) return;
    
    const newId = `item-${Math.random().toString(36).substr(2, 9)}`;
    const newItem = { 
      ...JSON.parse(JSON.stringify(original)), 
      id: newId,
      position: { ...original.position, x: original.position.x + original.widthMm + 10 },
      selected: true 
    };
    
    set((state) => ({
      items: [...state.items.map(i => ({ ...i, selected: false })), newItem],
      selectedId: newId
    }));
  },

  toggleAnimation: () => {
    const { selectedId, items } = get();
    if (!selectedId) return;
    
    set({
      items: items.map(item => 
        item.id === selectedId 
          ? { ...item, isOpen: !item.isOpen, openAmount: item.isOpen ? 0 : 1 } 
          : item
      )
    });
  }
}));
