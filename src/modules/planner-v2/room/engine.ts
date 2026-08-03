import { RoomSpec, RoomResult, WallGeometry } from './types';

export function generateRoomGeometry(spec: RoomSpec): RoomResult {
  const w = spec.widthMm / 1000;
  const d = spec.depthMm / 1000;
  const h = spec.heightMm / 1000;
  const wt = spec.wallThicknessMm / 1000;

  const walls: WallGeometry[] = [
    {
      id: 'front',
      position: [w / 2, h / 2, 0],
      rotation: [0, 0, 0],
      width: w,
      height: h,
      thickness: wt,
      openings: [],
      usefulFace: { origin: [0, 0, 0], width: w, height: h },
    },
    {
      id: 'back',
      position: [w / 2, h / 2, d],
      rotation: [0, Math.PI, 0],
      width: w,
      height: h,
      thickness: wt,
      openings: [],
      usefulFace: { origin: [0, 0, 0], width: w, height: h },
    },
    {
      id: 'left',
      position: [0, h / 2, d / 2],
      rotation: [0, Math.PI / 2, 0],
      width: d,
      height: h,
      thickness: wt,
      openings: [],
      usefulFace: { origin: [0, 0, 0], width: d, height: h },
    },
    {
      id: 'right',
      position: [w, h / 2, d / 2],
      rotation: [0, -Math.PI / 2, 0],
      width: d,
      height: h,
      thickness: wt,
      openings: [],
      usefulFace: { origin: [0, 0, 0], width: d, height: h },
    },
  ];

  return {
    floor: { width: w, depth: d, thickness: spec.floorThicknessMm / 1000 },
    ceiling: { width: w, depth: d, thickness: spec.ceilingThicknessMm / 1000 },
    walls,
    bounds: {
      min: [0, 0, 0],
      max: [w, h, d],
    },
  };
}
