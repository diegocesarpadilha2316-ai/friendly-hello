import { RoomSpec, RoomResult, WallGeometry, WallId, Rect } from './types';

export function generateRoomGeometry(spec: RoomSpec): RoomResult {
  const w = spec.widthMm / 1000;
  const d = spec.depthMm / 1000;
  const h = spec.heightMm / 1000;
  const wt = spec.wallThicknessMm / 1000;

  // Paredes com espessura real e posicionamento correto
  // Frontal (Z=0, interna)
  const wallFront: WallGeometry = {
    id: 'front',
    position: [w / 2, h / 2, 0],
    rotation: [0, 0, 0],
    width: w,
    height: h,
    thickness: wt,
    openings: spec.doors.filter(d => d.wall === 'front').map(d => ({
        x: d.offsetMm / 1000,
        y: 0,
        width: d.widthMm / 1000,
        height: d.heightMm / 1000
    })).concat(spec.windows.filter(w => w.wall === 'front').map(w => ({
        x: w.offsetMm / 1000,
        y: w.sillHeightMm / 1000,
        width: w.widthMm / 1000,
        height: w.heightMm / 1000
    }))),
    usefulFace: { origin: [0, 0, 0], width: w, height: h }
  };

  // Traseira (Z=d, interna)
  const wallBack: WallGeometry = {
    id: 'back',
    position: [w / 2, h / 2, d],
    rotation: [0, Math.PI, 0],
    width: w,
    height: h,
    thickness: wt,
    openings: spec.doors.filter(d => d.wall === 'back').map(d => ({
        x: d.offsetMm / 1000,
        y: 0,
        width: d.widthMm / 1000,
        height: d.heightMm / 1000
    })).concat(spec.windows.filter(w => w.wall === 'back').map(w => ({
        x: w.offsetMm / 1000,
        y: w.sillHeightMm / 1000,
        width: w.widthMm / 1000,
        height: w.heightMm / 1000
    }))),
    usefulFace: { origin: [0, 0, 0], width: w, height: h }
  };

  // Esquerda (X=0, interna)
  const wallLeft: WallGeometry = {
    id: 'left',
    position: [0, h / 2, d / 2],
    rotation: [0, Math.PI / 2, 0],
    width: d,
    height: h,
    thickness: wt,
    openings: spec.doors.filter(d => d.wall === 'left').map(d => ({
        x: d.offsetMm / 1000,
        y: 0,
        width: d.widthMm / 1000,
        height: d.heightMm / 1000
    })).concat(spec.windows.filter(w => w.wall === 'left').map(w => ({
        x: w.offsetMm / 1000,
        y: w.sillHeightMm / 1000,
        width: w.widthMm / 1000,
        height: w.heightMm / 1000
    }))),
    usefulFace: { origin: [0, 0, 0], width: d, height: h }
  };

  // Direita (X=w, interna)
  const wallRight: WallGeometry = {
    id: 'right',
    position: [w, h / 2, d / 2],
    rotation: [0, -Math.PI / 2, 0],
    width: d,
    height: h,
    thickness: wt,
    openings: spec.doors.filter(d => d.wall === 'right').map(d => ({
        x: d.offsetMm / 1000,
        y: 0,
        width: d.widthMm / 1000,
        height: d.heightMm / 1000
    })).concat(spec.windows.filter(w => w.wall === 'right').map(w => ({
        x: w.offsetMm / 1000,
        y: w.sillHeightMm / 1000,
        width: w.widthMm / 1000,
        height: w.heightMm / 1000
    }))),
    usefulFace: { origin: [0, 0, 0], width: d, height: h }
  };

  return {
    floor: { width: w, depth: d, thickness: spec.floorThicknessMm / 1000 },
    ceiling: { width: w, depth: d, thickness: spec.ceilingThicknessMm / 1000 },
    walls: [wallFront, wallBack, wallLeft, wallRight],
    bounds: {
      min: [0, 0, 0],
      max: [w, h, d],
    },
  };
}
