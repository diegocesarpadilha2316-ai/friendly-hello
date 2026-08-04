import React, { useEffect, useState } from 'react';
import { usePlannerV2Store } from '../core/store';
import { RoomLayer } from './RoomLayer';
import { FurnitureLayer } from './FurnitureLayer';
import { LightingRig } from './LightingRig';
import { CameraRig } from './CameraRig';
import { createDemoScene } from './demo';
import { SelectionLayer } from './SelectionLayer';

export const SceneRoot: React.FC = () => {
  const { roomResult, roomSpec, itemsCount } = usePlannerV2Store((state: any) => ({
    roomResult: state.roomResult,
    roomSpec: state.roomSpec,
    itemsCount: state.items.length
  }));

  const [localItems, setLocalItems] = useState<any[]>([]);

  useEffect(() => {
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
      
      <FurnitureLayer />

      {itemsCount === 0 && (
        <group name="demo-layer">
          {localItems.map((item) => (
            <FurnitureLayer key={item.id} demoItem={item} />
          ))}
        </group>
      )}

      <SelectionLayer />
    </>
  );
};
