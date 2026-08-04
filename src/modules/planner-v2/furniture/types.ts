export type FurnitureFamily = 
  | 'kitchen-base-cabinet'
  | 'wardrobe'
  | 'bathroom'
  | 'laundry'
  | 'dresser'
  | 'kitchen';


export type KitchenBaseVariant = 
  | 'one-door' 
  | 'two-doors' 
  | 'three-drawers' 
  | 'two-big-drawers' 
  | 'door-drawer';

export interface FurnitureMaterial {
  id: string;
  name: string;
  color: string;
  roughness?: number;
  metalness?: number;
}

export interface CabinetParameters {
  thicknessMm: number;
  backThicknessMm: number;
  kickplateHeightMm: number;
  doorCount: number;
  drawerCount: number;
  bodyMaterialId: string;
  frontMaterialId: string;
  handleType: 'simple' | 'none';
  shelfCount: number;
}

export interface FurnitureItem {
  id: string;
  family: FurnitureFamily;
  variant: string;
  name: string;
  position: { x: number; y: number; z: number }; // in mm
  rotation: number; // in radians
  widthMm: number;
  heightMm: number;
  depthMm: number;
  parameters: CabinetParameters;
  visible: boolean;
  selected: boolean;
  // Animation state (local to renderer usually, but can be here for persistence)
  isOpen: boolean;
  openAmount: number; // 0 to 1
}

export interface FurnitureStore {
  items: FurnitureItem[];
  selectedId: string | null;
  addItem: (item: FurnitureItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<FurnitureItem>) => void;
  selectItem: (id: string | null) => void;
  duplicateItem: (id: string) => void;
}
