import React from 'react';
import { Selection, EffectComposer, Outline } from '@react-three/postprocessing';

export const PostProcessingLayer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Selection>
      <EffectComposer autoClear={false}>
        <Outline 
          blur 
          visibleEdgeColor={0x8B5CF6} 
          edgeStrength={5} 
          width={1000}
        />
      </EffectComposer>
      {children}
    </Selection>
  );
};
