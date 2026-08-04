import * as THREE from 'three';
import { FurnitureItem } from '../furniture/types';
import { RoomResult } from '../room/types';

export type ViewportMode = 'technical' | 'presentation';

export interface ViewportNextState {
  mode: ViewportMode;
  room: RoomResult;
  items: FurnitureItem[];
  selectedId: string | null;
}

export interface MaterialLibrary {
  [key: string]: THREE.Material;
}

export interface PerformanceMetrics {
  fps: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  memoryMb: number;
}
