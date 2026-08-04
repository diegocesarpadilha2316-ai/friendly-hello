import React from 'react';
import { usePlannerV2Store } from '../core/store';
import { FurnitureRenderer } from '../scene/FurnitureRenderer';
import { Select } from '@react-three/postprocessing';

interface FurnitureLayerProps {
  demoItem?: any;
}

export const FurnitureLayer: React.FC<FurnitureLayerProps> = ({ demoItem }) => {
  const items = usePlannerV2Store((state: any) => state.items);
  const selectedId = usePlannerV2Store((state: any) => state.selectedId);

  // Se houver um demoItem, renderiza apenas ele
  if (demoItem) {
    return (
      <group name={`demo-item-${demoItem.id}`}>
        <FurnitureRenderer demoItem={demoItem} />
      </group>
    );
  }

  // Caso contrário, renderiza os itens da store global
  return (
    <group name="furniture-layer">
      {items.map((item: any) => (
        <Select key={item.id} enabled={item.id === selectedId}>
          <FurnitureRenderer singleItemId={item.id} />
        </Select>
      ))}
    </group>
  );
};
