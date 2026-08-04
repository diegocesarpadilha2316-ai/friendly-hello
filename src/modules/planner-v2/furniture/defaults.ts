import { FurnitureItem, CabinetParameters, FurnitureFamily } from './types';

export const DEFAULT_CABINET_PARAMS: CabinetParameters = {
  thicknessMm: 18,
  backThicknessMm: 6,
  kickplateHeightMm: 100,
  doorCount: 1,
  drawerCount: 0,
  bodyMaterialId: 'white-matte',
  frontMaterialId: 'white-matte',
  handleType: 'simple',
  shelfCount: 1,
};

export const createDefaultCabinet = (id: string, variant: string = 'one-door'): FurnitureItem => {
  const params = { ...DEFAULT_CABINET_PARAMS };
  
  if (variant === 'two-doors') {
    params.doorCount = 2;
  } else if (variant === 'three-drawers') {
    params.doorCount = 0;
    params.drawerCount = 3;
    params.shelfCount = 0;
  } else if (variant === 'two-big-drawers') {
    params.doorCount = 0;
    params.drawerCount = 2;
    params.shelfCount = 0;
  } else if (variant === 'door-drawer') {
    params.doorCount = 1;
    params.drawerCount = 1;
    params.shelfCount = 0;
  }

  return {
    id,
    family: 'kitchen-base-cabinet',
    variant,
    name: `Gabinete ${variant}`,
    position: { x: 0, y: 0, z: 0 },
    rotation: 0,
    widthMm: 800,
    heightMm: 720, // height without kickplate
    depthMm: 560,
    parameters: params,
    visible: true,
    selected: false,
    isOpen: false,
    openAmount: 0,
  };
};

export const createFurnitureItem = (id: string, family: FurnitureFamily, variant: string = 'default'): FurnitureItem => {
  if (family === 'kitchen-base-cabinet') {
    return createDefaultCabinet(id, variant);
  }

  // Fallback for other families (we will map these to legacy parametric families)
  const params = { ...DEFAULT_CABINET_PARAMS };
  
  return {
    id,
    family,
    variant,
    name: `${family} ${variant}`,
    position: { x: 0, y: 0, z: 0 },
    rotation: 0,
    widthMm: 1200,
    heightMm: 2100,
    depthMm: 600,
    parameters: params,
    visible: true,
    selected: false,
    isOpen: false,
    openAmount: 0,
  };
};

export const MATERIALS = [
  { id: 'white-matte', name: 'Branco Fosco', color: '#f8f9fa' },
  { id: 'graphite', name: 'Grafite', color: '#495057' },
  { id: 'oak', name: 'Carvalho', color: '#c4a484' },
];
