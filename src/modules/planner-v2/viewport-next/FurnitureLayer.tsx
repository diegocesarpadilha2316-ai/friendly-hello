import React from 'react';
import { usePlannerV2Store } from '../core/store';
import { FurnitureRenderer } from '../scene/FurnitureRenderer';
import { Select } from '@react-three/postprocessing';

export const FurnitureLayer: React.FC = () => {
  const items = usePlannerV2Store((state: any) => state.items);
  const selectedId = usePlannerV2Store((state: any) => state.selectedId);

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
