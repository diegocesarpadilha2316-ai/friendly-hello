import { RoomResult } from '../room/types';
import { FurnitureItem } from '../furniture/types';
import { createFurnitureItem } from '../furniture/defaults';

export const createDemoScene = (room: RoomResult): FurnitureItem[] => {
  const items: FurnitureItem[] = [];
  
  // 1. Gabinete Inferior (Base)
  const base1 = createFurnitureItem('demo-base-1', 'kitchen-base-cabinet', 'one-door');
  base1.position = { x: 1.2, y: 0, z: -room.depthMm / 2000 + 0.3 };
  items.push(base1);

  const base2 = createFurnitureItem('demo-base-2', 'kitchen-base-cabinet', 'two-doors');
  base2.position = { x: 1.8, y: 0, z: -room.depthMm / 2000 + 0.3 };
  base2.widthMm = 800;
  items.push(base2);

  // 2. Torre Quente (Simulada via bridge ou item paramétrico se disponível)
  // Por enquanto usamos o que temos no V2 que é o base cabinet, 
  // mas o LegacyAssemblyRenderer pode puxar outros se adicionarmos.
  
  return items;
};
