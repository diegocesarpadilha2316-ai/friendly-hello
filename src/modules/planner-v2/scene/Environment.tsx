import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { 
  ContactShadows, 
  Environment, 
  PerspectiveCamera, 
  OrbitControls,
  BakeShadows,
  SoftShadows
} from '@react-three/drei';
import * as THREE from 'three';
import { usePlannerV2Store } from '../core/store';

export const DiorisEnvironment: React.FC = () => {
  const { scene, camera } = useThree();
  const viewMode = usePlannerV2Store(state => state.viewMode);
  const controlsRef = useRef<any>(null);

  // Focus camera on furniture when needed
  // This can be expanded with specific actions from the store
  
  return (
    <>
      <PerspectiveCamera 
        makeDefault 
        position={[4, 2, 6]} 
        fov={40} 
        near={0.1}
        far={50}
      />
      
      {/* Lighting Rig */}
      <Environment preset="apartment" intensity={0.5} />
      
      <ambientLight intensity={0.4} />
      
      {/* Main Directional Light (Sunlight from a window) */}
      <directionalLight
        position={[10, 8, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
      />

      {/* Warm accent lights (Spots) */}
      <pointLight position={[2, 2.8, 2]} intensity={0.5} color="#fff4e0" distance={5} />
      <pointLight position={[-2, 2.8, 2]} intensity={0.5} color="#fff4e0" distance={5} />
      
      {/* LED strips under cabinets (Demo positions) */}
      <rectAreaLight 
        position={[0, 1.4, -2.4]} 
        rotation={[Math.PI / 2, 0, 0]}
        width={4} 
        height={0.1} 
        intensity={2} 
        color="#ffccaa" 
      />

      {/* Realistic Contact Shadows */}
      <ContactShadows 
        opacity={0.5} 
        scale={20} 
        blur={2.4} 
        far={2} 
        resolution={1024}
        color="#000000" 
      />

      <OrbitControls 
        ref={controlsRef}
        makeDefault 
        minPolarAngle={Math.PI / 6} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={1}
        maxDistance={15}
        enableDamping
        dampingFactor={0.05}
        target={[0, 0.8, 0]} // Focus on the living area/kitchen counter height
      />

      {/* Global shadows optimization */}
      <SoftShadows size={2.5} samples={16} focus={0} />
      <BakeShadows />
    </>
  );
};
