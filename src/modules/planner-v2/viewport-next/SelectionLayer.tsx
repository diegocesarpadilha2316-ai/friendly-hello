import React from 'react';
import { usePlannerV2Store } from '../core/store';
import { Html, TransformControls } from '@react-three/drei';

export const SelectionLayer: React.FC = () => {
  const selectedId = usePlannerV2Store((state: any) => state.selectedId);
  const items = usePlannerV2Store((state: any) => state.items);
  const selectedItem = items.find((i: any) => i.id === selectedId);

  if (!selectedItem) return null;

  const viewMode = usePlannerV2Store((state: any) => state.viewMode);
  const showGizmo = viewMode === 'technical';

  return (
    <group>
      {showGizmo && (
        <TransformControls 
          position={[selectedItem.position.x, selectedItem.position.y, selectedItem.position.z]}
          mode="translate"
          size={0.5}
          showY={false} // Mantém móvel no chão por padrão
          onMouseUp={() => {
            // Aqui poderíamos emitir updateItem no store
          }}
        />
      )}
      <group position={[selectedItem.position.x, selectedItem.position.y + selectedItem.heightMm / 1000 + 0.1, selectedItem.position.z]}>
        <Html center>
          <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-[10px] whitespace-nowrap font-bold shadow-lg uppercase tracking-tighter pointer-events-none">
            {selectedItem.name}
          </div>
        </Html>
      </group>
    </group>
  );
};
