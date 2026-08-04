import React, { useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { ContactShadows, Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export const DiorisEnvironment: React.FC = () => {
  const { scene } = useThree();

  return (
    <>
      <PerspectiveCamera makeDefault position={[5, 4, 8]} fov={35} />
      
      {/* Luz Natural/Ambiente */}
      <Environment preset="neutral" />
      
      {/* Luz Direcional para Sombras Suaves (Sol/Janela) */}
      <directionalLight
        position={[8, 12, 8]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
      />
      
      {/* Luz de Preenchimento */}
      <ambientLight intensity={0.4} />
      
      {/* Sombras de Contato Realistas */}
      <ContactShadows 
        opacity={0.4} 
        scale={20} 
        blur={2.5} 
        far={1.6} 
        resolution={1024}
        color="#000000" 
      />

      <OrbitControls 
        makeDefault 
        minPolarAngle={Math.PI / 6} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={2}
        maxDistance={20}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
};
