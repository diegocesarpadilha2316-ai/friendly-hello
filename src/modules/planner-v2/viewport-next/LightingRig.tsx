import React from 'react';
import { Environment, ContactShadows } from '@react-three/drei';

export const LightingRig: React.FC = () => {
  return (
    <>
      {/* Iluminação Global Realista */}
      <Environment preset="city" />
      
      <ambientLight intensity={0.4} />
      
      {/* Simulação de Luz de Janela */}
      <directionalLight
        position={[10, 8, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />

      {/* Sombras de Contato Suaves */}
      <ContactShadows
        opacity={0.4}
        scale={20}
        blur={2.4}
        far={1.5}
        resolution={1024}
        color="#000000"
      />
    </>
  );
};
