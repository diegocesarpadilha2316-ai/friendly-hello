import React, { useMemo } from 'react';
import { usePlannerV2Store } from '../core/store';
import { BaseCabinetMesh } from '../furniture/cabinet/BaseCabinetMesh';
import { LegacyAssemblyRenderer } from './LegacyAssemblyRenderer';

export const FurnitureRenderer: React.FC<{ singleItemId?: string }> = ({ singleItemId }) => {
  const allItems = usePlannerV2Store((state) => state.items);
  const items = singleItemId ? allItems.filter(i => i.id === singleItemId) : allItems;
  const selectedId = usePlannerV2Store((state) => state.selectedId);
  const selectItem = usePlannerV2Store((state) => state.selectItem);

  return (
    <group name="furniture-layer">
      {items.map((item) => {
        // Direct V2 implementation for kitchen base cabinet
        if (item.family === 'kitchen-base-cabinet') {
          return (
            <BaseCabinetMesh 
              key={item.id} 
              item={item} 
              onSelect={selectItem} 
            />
          );
        }

        // Bridge to existing parametric families for other furniture types
        return (
          <LegacyAssemblyRenderer 
            key={item.id}
            item={item}
            onSelect={selectItem}
          />
        );
      })}
    </group>
  );
};
