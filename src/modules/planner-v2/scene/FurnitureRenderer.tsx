import React from 'react';
import { usePlannerV2Store } from '../core/store';
import { BaseCabinetMesh } from '../furniture/cabinet/BaseCabinetMesh';

export const FurnitureRenderer: React.FC = () => {
  const items = usePlannerV2Store((state) => state.items);
  const selectItem = usePlannerV2Store((state) => state.selectItem);

  return (
    <group name="furniture-layer">
      {items.map((item) => {
        if (item.family === 'kitchen-base-cabinet') {
          return (
            <BaseCabinetMesh 
              key={item.id} 
              item={item} 
              onSelect={selectItem} 
            />
          );
        }
        return null;
      })}
    </group>
  );
};
