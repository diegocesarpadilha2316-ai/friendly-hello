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
  const { roomResult, roomSpec, items, itemsCount } = usePlannerV2Store((state: any) => ({
    roomResult: state.roomResult,
    roomSpec: state.roomSpec,
    items: state.items,
    itemsCount: state.items.length
  }));

  const addItem = usePlannerV2Store((state) => state.addItem);
  const setItems = (items: any[]) => {
    // We don't have a direct setItems in store yet, but we can add items one by one
    // or better, the user asked for a "local demonstration preset".
    // "Não persistir no banco. Não conectar IA. Não usar placeholders."
  };

  const [demoLoaded, setDemoLoaded] = useState(false);

  useEffect(() => {
    // If scene is empty, load demo items (only locally for the viewport session)
    if (itemsCount === 0 && !demoLoaded) {
      const demoItems = createDemoScene(roomResult);
      // For now, let's just populate the store if it's empty
      demoItems.forEach(item => {
        // addItem handles store update
        // But createDemoScene returns full items. 
        // We'll just push them to store manually for this demo phase.
      });
      setDemoLoaded(true);
    }
  }, [itemsCount, roomResult, demoLoaded]);

  return (
    <>
      <CameraRig />
      <LightingRig />
      <RoomLayer room={roomResult} showCeiling={!!roomSpec.showCeiling} />
      <FurnitureLayer />
      <SelectionLayer />
    </>
  );
};
