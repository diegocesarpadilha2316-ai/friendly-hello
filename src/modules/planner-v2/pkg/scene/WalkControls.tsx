import { PointerLockControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const keys = new Set<string>();

export function WalkControls() {
  const { camera } = useThree();
  const velocity = useRef(new THREE.Vector3());

  useEffect(() => {
    const down = (event: KeyboardEvent) => keys.add(event.code);
    const up = (event: KeyboardEvent) => keys.delete(event.code);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      keys.clear();
    };
  }, []);

  useFrame((_, delta) => {
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
    const desired = new THREE.Vector3();

    if (keys.has("KeyW") || keys.has("ArrowUp")) desired.add(forward);
    if (keys.has("KeyS") || keys.has("ArrowDown")) desired.sub(forward);
    if (keys.has("KeyD") || keys.has("ArrowRight")) desired.sub(right);
    if (keys.has("KeyA") || keys.has("ArrowLeft")) desired.add(right);

    desired.normalize().multiplyScalar(2.1);
    velocity.current.lerp(desired, 1 - Math.exp(-8 * delta));
    camera.position.addScaledVector(velocity.current, delta);

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -2.15, 2.15);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -1.65, 1.65);
    camera.position.y = 1.62;
  });

  return <PointerLockControls />;
}
