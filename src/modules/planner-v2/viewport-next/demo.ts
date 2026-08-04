import { RoomResult } from '../room/types';
import { FurnitureItem } from '../furniture/types';
import { createFurnitureItem } from '../furniture/defaults';

export const createDemoScene = (room: RoomResult): FurnitureItem[] => {
  const items: FurnitureItem[] = [];
  
  // 1. Gabinete Inferior (Base)
  const base1 = createFurnitureItem('demo-base-1', 'kitchen-base-cabinet', 'one-door');
  base1.position = { x: 1.2, y: 0, z: -room.floor.depth / 2 + 0.3 };
  items.push(base1);

  const base2 = createFurnitureItem('demo-base-2', 'kitchen-base-cabinet', 'two-doors');
  base2.position = { x: 1.8, y: 0, z: -room.floor.depth / 2 + 0.3 };
  base2.widthMm = 800;
  items.push(base2);

  // 3. Gabinete Aéreo (Simulado via V1 ou V2 base se ajustarmos altura)
  const wallCabinet = createFurnitureItem('demo-wall-1', 'kitchen-base-cabinet' as any, 'one-door');
  wallCabinet.name = "Armário Aéreo";
  wallCabinet.position = { x: 1.2, y: 1.6, z: -room.floor.depth / 2 + 0.15 };
  wallCabinet.heightMm = 600;
  wallCabinet.depthMm = 350;
  items.push(wallCabinet);

  return items;
};
