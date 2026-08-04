import React, { useRef, useEffect } from 'react';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export const CameraRig: React.FC = () => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    // Configuração inicial inspirada em fotografia de interiores
    camera.position.set(5, 1.6, 6); // Altura dos olhos
    camera.lookAt(2, 1, 0);
  }, [camera]);

  return (
    <>
      <PerspectiveCamera 
        makeDefault 
        fov={40} 
        near={0.1} 
        far={100} 
      />
      <OrbitControls 
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={1}
        maxDistance={25}
        maxPolarAngle={Math.PI / 1.8} // Evita ver muito de cima
        minPolarAngle={Math.PI / 4}   // Evita ver muito de baixo
        target={[2, 1, 0]}
      />
    </>
  );
};
