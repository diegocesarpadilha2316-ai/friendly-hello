import React, { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  PerspectiveCamera,
  OrbitControls,
  BakeShadows,
  SoftShadows,
} from "@react-three/drei";
import * as THREE from "three";
import { usePlannerV2Store } from "../core/store";
import { mmToScene } from "../core/units";

export const DiorisEnvironment: React.FC = () => {
  const { camera } = useThree();
  const roomSpec = usePlannerV2Store((state) => state.roomSpec);
  const cameraAction = usePlannerV2Store((state) => state.cameraAction);
  const setCameraAction = usePlannerV2Store((state) => state.setCameraAction);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (!cameraAction || !controlsRef.current) return;

    const w = mmToScene(roomSpec.widthMm);
    const d = mmToScene(roomSpec.depthMm);
    const h = mmToScene(roomSpec.heightMm);
    const center = new THREE.Vector3(w / 2, 0.8, d / 2);

    switch (cameraAction) {
      case "room":
        camera.position.set(w * 1.5, 1.8, d * 1.5);
        controlsRef.current.target.copy(center);
        break;
      case "perspective":
        camera.position.set(w * 1.1, 1.6, d * 1.1);
        controlsRef.current.target.copy(center);
        break;
      case "front":
        camera.position.set(w / 2, 1.6, d * 1.4);
        controlsRef.current.target.copy(center);
        break;
      case "top":
        camera.position.set(w / 2, h * 2.5, d / 2);
        controlsRef.current.target.set(w / 2, 0, d / 2);
        break;
      case "side":
        camera.position.set(w * 1.4, 1.6, d / 2);
        controlsRef.current.target.copy(center);
        break;
    }

    controlsRef.current.update();
    setCameraAction(null);
  }, [cameraAction, roomSpec, camera, setCameraAction]);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[mmToScene(roomSpec.widthMm) * 1.1, 1.6, mmToScene(roomSpec.depthMm) * 1.1]}
        fov={40}
        near={0.05}
        far={100}
      />

      {/* Lighting Rig */}
      <Environment preset="apartment" />
      <ambientLight intensity={0.5} />

      {/* Main Directional Light */}
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

      {/* Warm accent lights */}
      <pointLight position={[2, 2.5, 2]} intensity={0.5} color="#fff4e0" distance={5} />
      <pointLight
        position={[mmToScene(roomSpec.widthMm) - 1, 2.5, 2]}
        intensity={0.5}
        color="#fff4e0"
        distance={5}
      />

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
        minDistance={0.5}
        maxDistance={20}
        enableDamping
        dampingFactor={0.05}
        target={[mmToScene(roomSpec.widthMm) / 2, 0.8, mmToScene(roomSpec.depthMm) / 2]}
      />

      <SoftShadows size={2.5} samples={16} focus={0} />
      <BakeShadows />
    </>
  );
};
