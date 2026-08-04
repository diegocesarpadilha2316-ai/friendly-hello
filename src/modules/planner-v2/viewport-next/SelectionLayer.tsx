import React from 'react';
import { usePlannerV2Store } from '../../core/store';
import { Html } from '@react-three/drei';

export const SelectionLayer: React.FC = () => {
  const selectedId = usePlannerV2Store((state) => state.selectedId);
  const items = usePlannerV2Store((state) => state.items);
  const selectedItem = items.find(i => i.id === selectedId);

  if (!selectedItem) return null;

  return (
    <group position={[selectedItem.position.x, selectedItem.position.y + selectedItem.heightMm / 1000 + 0.1, selectedItem.position.z]}>
      <Html center>
        <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-[10px] whitespace-nowrap font-bold shadow-lg uppercase tracking-tighter">
          {selectedItem.name}
        </div>
      </Html>
    </group>
  );
};
