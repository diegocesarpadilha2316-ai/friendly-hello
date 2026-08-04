import React, { useEffect, useState } from 'react';
import { usePlannerV2Store } from '../core/store';
import { RoomLayer } from './RoomLayer';
import { FurnitureLayer } from './FurnitureLayer';
import { LightingRig } from './LightingRig';
import { CameraRig } from './CameraRig';
import { createDemoScene } from './demo';
import { SelectionLayer } from './SelectionLayer';
import { Select } from '@react-three/postprocessing';

export const SceneRoot: React.FC = () => {
  const { roomResult, roomSpec, itemsCount } = usePlannerV2Store((state: any) => ({
    roomResult: state.roomResult,
    roomSpec: state.roomSpec,
    itemsCount: state.items.length
  }));

  // We use local state for the demo items to avoid polluting the global store 
  // until the user actually starts editing.
  const [localItems, setLocalItems] = useState<any[]>([]);
  const items = usePlannerV2Store((state: any) => state.items);

  useEffect(() => {
    // If global store is empty, show the demo items
    if (itemsCount === 0) {
      setLocalItems(createDemoScene(roomResult));
    } else {
      setLocalItems([]);
    }
  }, [itemsCount, roomResult]);

  return (
    <>
      <CameraRig />
      <LightingRig />
      
      <RoomLayer room={roomResult} showCeiling={!!roomSpec.showCeiling} />
      
      {/* Furniture Layer will render global items from store */}
      <FurnitureLayer />

      {/* Local Demo Items (not in store) */}
      {itemsCount === 0 && (
        <group name="demo-layer" opacity={0.8}>
          {localItems.map((item) => (
            <FurnitureLayer key={item.id} demoItem={item} />
          ))}
        </group>
      )}

      <SelectionLayer />
    </>
  );
};
