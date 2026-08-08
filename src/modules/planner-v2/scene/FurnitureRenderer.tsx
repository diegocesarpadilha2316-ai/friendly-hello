import React, { useMemo } from 'react';
import { usePlannerV2Store } from '../core/store';
import { usePlannerStore } from '../pkg/state/usePlannerStore';
import { BaseCabinetMesh } from '../furniture/cabinet/BaseCabinetMesh';
import { LegacyAssemblyRenderer } from './LegacyAssemblyRenderer';
import { LibraryPartsRenderer } from './LibraryPartsRenderer';

export const FurnitureRenderer: React.FC<{ singleItemId?: string; demoItem?: any }> = ({ singleItemId, demoItem }) => {
  const allItems = usePlannerV2Store((state) => state.items);
  const items = demoItem ? [demoItem] : (singleItemId ? allItems.filter(i => i.id === singleItemId) : allItems);
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
