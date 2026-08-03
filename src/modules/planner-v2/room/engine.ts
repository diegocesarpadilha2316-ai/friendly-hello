import { RoomSpec, RoomResult, WallGeometry, WallId } from './types';

export function generateRoomGeometry(spec: RoomSpec): RoomResult {
  const w = spec.widthMm / 1000;
  const d = spec.depthMm / 1000;
  const h = spec.heightMm / 1000;
  const wt = spec.wallThicknessMm / 1000;

  const createWall = (id: WallId, width: number, pos: [number, number, number], rot: [number, number, number]): WallGeometry => {
    return {
      id,
      position: pos,
      rotation: rot,
      width,
      height: h,
      thickness: wt,
      openings: [
        ...spec.doors.filter(d => d.wall === id).map(d => ({
          x: d.offsetMm / 1000,
          y: 0,
          width: d.widthMm / 1000,
          height: d.heightMm / 1000
        })),
        ...spec.windows.filter(w => w.wall === id).map(w => ({
          x: w.offsetMm / 1000,
          y: w.sillHeightMm / 1000,
          width: w.widthMm / 1000,
          height: w.heightMm / 1000
        }))
      ],
      usefulFace: { origin: [0, 0, 0], width, height: h }
    };
  };

  return {
    floor: { width: w, depth: d, thickness: spec.floorThicknessMm / 1000 },
    ceiling: { width: w, depth: d, thickness: spec.ceilingThicknessMm / 1000 },
    walls: [
      createWall('front', w, [w / 2, h / 2, 0], [0, 0, 0]),
      createWall('back', w, [w / 2, h / 2, d], [0, Math.PI, 0]),
      createWall('left', d, [0, h / 2, d / 2], [0, Math.PI / 2, 0]),
      createWall('right', d, [w, h / 2, d / 2], [0, -Math.PI / 2, 0])
    ],
    bounds: {
      min: [0, 0, 0],
      max: [w, h, d],
    },
  };
}
