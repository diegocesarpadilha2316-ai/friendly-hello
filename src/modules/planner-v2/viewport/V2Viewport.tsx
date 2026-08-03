import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, ContactShadows } from '@react-three/drei';
import { RoomRenderer } from '../scene/RoomRenderer';
import { usePlannerV2Store } from '../core/store';

const SceneContent: React.FC = () => {
  const { roomResult, roomSpec, debug } = usePlannerV2Store();
  
  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <directionalLight position={[-5, 5, 5]} intensity={0.8} castShadow />
      
      <RoomRenderer 
        result={roomResult} 
        showCeiling={roomSpec.showCeiling}
        showBaseboard={roomSpec.showBaseboard}
        debug={debug}
      />

      <ContactShadows 
        opacity={0.4} 
        scale={20} 
        blur={2.4} 
        far={0.8} 
        resolution={256} 
        color="#000000" 
      />

      <Grid 
        infiniteGrid 
        fadeDistance={50} 
        fadeStrength={5} 
        cellSize={1} 
        sectionSize={5} 
        sectionColor="#444444" 
        cellColor="#222222" 
        position={[0, -0.01, 0]}
      />
      
      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
    </>
  );
};

export const V2Viewport: React.FC = () => {
  return (
    <div className="w-full h-full bg-[#0a0a0a]">
      <Suspense fallback={<div className="flex items-center justify-center h-full text-white font-mono">INICIALIZANDO ENGINE V2...</div>}>
        <Canvas 
          shadows 
          camera={{ position: [6, 6, 6], fov: 45 }}
          gl={{ antialias: true, stencil: true }}
        >
          <SceneContent />
        </Canvas>
      </Suspense>
    </div>
  );
};
