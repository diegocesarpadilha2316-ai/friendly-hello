import { FurnitureItem, FurnitureFamily } from '../furniture/types';
import { createFurnitureItem } from '../furniture/defaults';
import { RoomSpec, WallId } from '../room/types';

export const MODERN_KITCHEN_ROOM: RoomSpec = {
  id: 'modern-kitchen',
  name: 'Cozinha Moderna',
  widthMm: 4500,
  depthMm: 3500,
  heightMm: 2600,
  wallThicknessMm: 150,
  floorThicknessMm: 50,
  ceilingThicknessMm: 50,
  baseboardHeightMm: 80,
  baseboardThicknessMm: 15,
  showCeiling: true,
  showBaseboard: true,
  doors: [
    {
      id: 'd1',
      wall: 'left',
      offsetMm: 500,
      widthMm: 900,
      heightMm: 2100,
      openingDirection: 'inward',
      hingeSide: 'right'
    }
  ],
  windows: [
    {
      id: 'w1',
      wall: 'back',
      offsetMm: 1500,
      widthMm: 1500,
      heightMm: 1000,
      sillHeightMm: 1100
    }
  ]
};

export const generateKitchenFurniture = (): FurnitureItem[] => {
  const items: FurnitureItem[] = [];
  
  // 1. Lower Cabinets (Balcão) on the back wall
  // Starting from left corner (x=0, z=depth)
  const backWallZ = MODERN_KITCHEN_ROOM.depthMm;
  const backWallXStart = 0;
  
  // Corner Tower (Fridge/Oven)
  const tower = createFurnitureItem('f-tower-1', 'kitchen-tower' as any, 'tower');
  tower.name = 'Torre Quente';
  tower.widthMm = 600;
  tower.heightMm = 2200;
  tower.depthMm = 600;
  tower.position = { x: 300, y: 0, z: backWallZ - 300 };
  tower.parameters.bodyMaterialId = 'graphite';
  tower.parameters.frontMaterialId = 'graphite';
  items.push(tower);
  
  // Row of lower cabinets
  const lowerConfigs = [
    { id: 'f-lower-1', variant: 'two-doors', width: 800, mat: 'taupe' },
    { id: 'f-lower-2', variant: 'three-drawers', width: 600, mat: 'taupe' },
    { id: 'f-lower-3', variant: 'two-doors', width: 900, mat: 'taupe' }, // Sink cabinet
    { id: 'f-lower-4', variant: 'two-big-drawers', width: 800, mat: 'taupe' },
  ];
  
  let currentX = 600;
  lowerConfigs.forEach(config => {
    const item = createFurnitureItem(config.id, 'kitchen-base-cabinet', config.variant);
    item.widthMm = config.width;
    item.parameters.bodyMaterialId = 'white-matte';
    item.parameters.frontMaterialId = config.mat;
    item.position = { x: currentX + config.width / 2, y: 0, z: backWallZ - 300 };
    items.push(item);
    currentX += config.width;
  });
  
  // Countertop (Stone)
  const counter = createFurnitureItem('f-counter-1', 'kitchen-counter' as any, 'counter');
  counter.name = 'Bancada Pedra';
  counter.widthMm = currentX - 600;
  counter.heightMm = 40;
  counter.depthMm = 620;
  counter.position = { x: 600 + counter.widthMm / 2, y: 820, z: backWallZ - 310 };
  counter.parameters.bodyMaterialId = 'stone';
  counter.parameters.frontMaterialId = 'stone';
  items.push(counter);
  
  // Upper Cabinets (Aéreos)
  const upperConfigs = [
    { id: 'f-upper-1', width: 800 },
    { id: 'f-upper-2', width: 600 },
    { id: 'f-upper-3', width: 900 },
    { id: 'f-upper-4', width: 800 },
  ];
  
  currentX = 600;
  upperConfigs.forEach(config => {
    const item = createFurnitureItem(config.id, 'kitchen-wall-cabinet' as any, 'wall-cabinet');
    item.name = 'Armário Aéreo';
    item.widthMm = config.width;
    item.heightMm = 600;
    item.depthMm = 350;
    item.position = { x: currentX + config.width / 2, y: 1500, z: backWallZ - 175 };
    item.parameters.bodyMaterialId = 'white-matte';
    item.parameters.frontMaterialId = 'white-matte';
    items.push(item);
    currentX += config.width;
  });
  
  // Island (Ilha)
  const island = createFurnitureItem('f-island-1', 'kitchen-base-cabinet', 'two-doors');
  island.name = 'Ilha Central';
  island.widthMm = 1800;
  island.heightMm = 820;
  island.depthMm = 900;
  island.position = { x: 2250, y: 0, z: 1200 };
  island.parameters.bodyMaterialId = 'white-matte';
  island.parameters.frontMaterialId = 'graphite';
  items.push(island);
  
  const islandTop = createFurnitureItem('f-island-top', 'kitchen' as any, 'counter');
  islandTop.name = 'Tampo da Ilha';
  islandTop.widthMm = 2000;
  islandTop.heightMm = 40;
  islandTop.depthMm = 1000;
  islandTop.position = { x: 2250, y: 820, z: 1200 };
  islandTop.parameters.bodyMaterialId = 'stone';
  islandTop.parameters.frontMaterialId = 'stone';
  items.push(islandTop);
  
  // Stools (Bancos)
  const stool1 = createFurnitureItem('f-stool-1', 'kitchen-stool' as any, 'stool');
  stool1.name = 'Banqueta 1';
  stool1.widthMm = 400;
  stool1.heightMm = 650;
  stool1.depthMm = 400;
  stool1.position = { x: 1800, y: 0, z: 600 };
  items.push(stool1);
  
  const stool2 = createFurnitureItem('f-stool-2', 'kitchen-stool' as any, 'stool');
  stool2.name = 'Banqueta 2';
  stool2.widthMm = 400;
  stool2.heightMm = 650;
  stool2.depthMm = 400;
  stool2.position = { x: 2700, y: 0, z: 600 };
  items.push(stool2);
  
  return items;
};
