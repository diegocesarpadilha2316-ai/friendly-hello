import { create } from 'zustand';
import { RoomSpec, DEFAULT_ROOM, PRESETS, generateRoomGeometry, RoomResult, validateRoomSpec } from '../room';

interface PlannerV2State {
  roomSpec: RoomSpec;
  roomResult: RoomResult;
  errors: string[];
  viewMode: 'technical' | 'presentation';
  
  // Actions
  setRoomSpec: (spec: Partial<RoomSpec>) => void;
  applyPreset: (name: string) => void;
  setViewMode: (mode: 'technical' | 'presentation') => void;
}

export const usePlannerV2Store = create<PlannerV2State>((set, get) => ({
  roomSpec: DEFAULT_ROOM,
  roomResult: generateRoomGeometry(DEFAULT_ROOM),
  errors: [],
  viewMode: 'presentation',

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
}));
