import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';

const SceneContent: React.FC = () => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      {/* Basic Room: Floor + 2 Walls */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      
      <mesh position={[0, 2.5, -5]}>
        <boxGeometry args={[10, 5, 0.1]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      <mesh position={[-5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[10, 5, 0.1]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      <Grid 
        infiniteGrid 
        fadeDistance={50} 
        fadeStrength={5} 
        cellSize={0.5} 
        sectionSize={2.5} 
        sectionColor="#444444" 
        cellColor="#222222" 
      />
      
      <OrbitControls makeDefault />
    </>
  );
};

export const V2Viewport: React.FC = () => {
  return (
    <div className="w-full h-full bg-[#121212]">
      <Suspense fallback={<div className="flex items-center justify-center h-full text-white">Carregando Viewport V2...</div>}>
        <Canvas camera={{ position: [8, 8, 8], fov: 45 }}>
          <SceneContent />
        </Canvas>
      </Suspense>
    </div>
  );
};
