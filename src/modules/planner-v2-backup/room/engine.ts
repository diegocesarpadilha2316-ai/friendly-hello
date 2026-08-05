import { RoomSpec, RoomResult, WallGeometry, WallId } from './types';

export function generateRoomGeometry(spec: RoomSpec): RoomResult {
  const w = spec.widthMm / 1000;
  const d = spec.depthMm / 1000;
  const h = spec.heightMm / 1000;
  const wt = spec.wallThicknessMm / 1000;

  const bh = spec.baseboardHeightMm / 1000;

  const createWall = (id: WallId, width: number, pos: [number, number, number], rot: [number, number, number]): WallGeometry => {
    const wallOpenings = [
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
    ];

    return {
      id,
      position: pos,
      rotation: rot,
      width,
      height: h,
      thickness: wt,
      openings: wallOpenings,
      usefulFace: { origin: [0, 0, 0], width, height: h }
    };
  };

  const floorW = w + wt * 2;
  const floorD = d + wt * 2;

  return {
    floor: { width: floorW, depth: floorD, thickness: spec.floorThicknessMm / 1000 },
    ceiling: { width: floorW, depth: floorD, thickness: spec.ceilingThicknessMm / 1000 },
    walls: [
      createWall('front', w, [w / 2, h / 2, -wt], [0, 0, 0]),
      createWall('back', w, [w / 2, h / 2, d + wt], [0, Math.PI, 0]),
      createWall('left', d, [-wt, h / 2, d / 2], [0, Math.PI / 2, 0]),
      createWall('right', d, [w + wt, h / 2, d / 2], [0, -Math.PI / 2, 0])
    ],
    baseboards: calculateBaseboards(spec),
    bounds: {
      min: [-wt, 0, -wt],
      max: [w + wt, h, d + wt],
    },
  };
}

function calculateBaseboards(spec: RoomSpec): RoomResult['baseboards'] {
  const w = spec.widthMm / 1000;
  const d = spec.depthMm / 1000;
  
  const baseboards: RoomResult['baseboards'] = [];

  const addWallBaseboard = (id: WallId, width: number) => {
    const wallDoors = spec.doors
      .filter(door => door.wall === id)
      .map(door => ({
        start: door.offsetMm / 1000,
        end: (door.offsetMm + door.widthMm) / 1000
      }))
      .sort((a, b) => a.start - b.start);

    let currentX = 0;
    wallDoors.forEach(door => {
      if (door.start > currentX) {
        baseboards.push({
          wallId: id,
          points: [
            [currentX - width / 2, 0, 0],
            [door.start - width / 2, 0, 0]
          ]
        });
      }
      currentX = door.end;
    });

    if (currentX < width) {
      baseboards.push({
        wallId: id,
        points: [
          [currentX - width / 2, 0, 0],
          [width / 2, 0, 0]
        ]
      });
    }
  };

  addWallBaseboard('front', w);
  addWallBaseboard('back', w);
  addWallBaseboard('left', d);
  addWallBaseboard('right', d);

  return baseboards;
}
