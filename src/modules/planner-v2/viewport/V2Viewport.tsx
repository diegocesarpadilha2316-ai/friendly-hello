import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import { RoomRenderer } from '../scene/RoomRenderer';
import { FurnitureRenderer } from '../scene/FurnitureRenderer';
import { usePlannerV2Store } from '../core/store';

const SceneContent: React.FC = () => {
  const { roomResult, roomSpec, viewMode } = usePlannerV2Store();
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[6, 6, 6]} fov={45} />
      
      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={1} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      
      <RoomRenderer 
        result={roomResult} 
        mode={viewMode}
        showCeiling={roomSpec.showCeiling}
        showBaseboard={roomSpec.showBaseboard}
        baseboardHeight={roomSpec.baseboardHeightMm}
        baseboardThickness={roomSpec.baseboardThicknessMm}
      />

      

      <ContactShadows 
        opacity={0.3} 
        scale={20} 
        blur={2} 
        far={1} 
        color="#000000" 
      />
      
      <OrbitControls 
        makeDefault 
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 1.75} 
      />
    </>
  );
};

export const V2Viewport: React.FC = () => {
  return (
    <div className="w-full h-full bg-[#f4f4f4]">
      <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">CARREGANDO...</div>}>
        <Canvas shadows gl={{ antialias: true }}>
          <SceneContent />
        </Canvas>
      </Suspense>
    </div>
  );
};
