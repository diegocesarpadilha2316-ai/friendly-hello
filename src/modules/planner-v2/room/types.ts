export type WallId = 'front' | 'back' | 'left' | 'right';

export interface RoomOpening {
  id: string;
  wall: WallId;
  offsetMm: number;
  widthMm: number;
  heightMm: number;
}

export interface DoorSpec extends RoomOpening {
  openingDirection: 'inward' | 'outward';
  hingeSide: 'left' | 'right';
}

export interface WindowSpec extends RoomOpening {
  sillHeightMm: number;
}

export interface RoomSpec {
  id: string;
  name: string;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  wallThicknessMm: number;
  floorThicknessMm: number;
  ceilingThicknessMm: number;
  baseboardHeightMm: number;
  baseboardThicknessMm: number;
  doors: DoorSpec[];
  windows: WindowSpec[];
  showCeiling?: boolean;
  showBaseboard?: boolean;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WallGeometry {
  id: WallId;
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
  height: number;
  thickness: number;
  openings: Rect[];
  usefulFace: {
    origin: [number, number, number];
    width: number;
    height: number;
  };
}

export interface RoomResult {
  floor: {
    width: number;
    depth: number;
    thickness: number;
  };
  ceiling: {
    width: number;
    depth: number;
    thickness: number;
  };
  walls: WallGeometry[];
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
  };
}
