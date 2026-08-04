import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { usePlannerV2Store } from '../core/store';
import { SceneRoot } from './SceneRoot';
import { PostProcessingLayer } from './PostProcessingLayer';
import { ViewportControls } from './ViewportControls';
import { Stats } from '@react-three/drei';

export const V2ViewportNext: React.FC = () => {
  const { roomResult, roomSpec } = usePlannerV2Store();
  
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="w-full h-full bg-[#121214] relative">
      <ViewportControls />
      <Suspense fallback={
        <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse">
          INICIALIZANDO AMBIENTE RESIDENCIAL...
        </div>
      }>
        <Canvas shadows gl={{ antialias: false, preserveDrawingBuffer: true }}>
          <PostProcessingLayer>
            <SceneRoot />
          </PostProcessingLayer>
          {isDev && <Stats className="!left-4 !top-4" />}
        </Canvas>
      </Suspense>
    </div>
  );
};
