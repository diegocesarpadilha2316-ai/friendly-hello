export interface PartBox {
  id: string;
  name: string;
  width: number;
  height: number;
  depth: number;
  position: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  materialType: 'body' | 'front';
  type: 'panel' | 'door' | 'drawer-front' | 'drawer-box' | 'handle';
  parentId?: string;
  // Metadata for animation
  isAnimated?: boolean;
  animationType?: 'hinge' | 'slide';
  animationAxis?: 'y' | 'z';
  animationOrigin?: { x: number; y: number; z: number };
}

export interface CabinetAssembly {
  parts: PartBox[];
}
