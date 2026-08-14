import { PointerLockControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { usePlannerStore } from "../state/usePlannerStore";
import { useRoomBuilderStore } from "../state/useRoomBuilderStore";

const keys = new Set<string>();

export function WalkControls() {
  const { camera } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const instances = usePlannerStore((state) => state.instances);
  const roomWidth = useRoomBuilderStore((state) => state.width);
  const roomDepth = useRoomBuilderStore((state) => state.depth);

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
    const step = velocity.current.clone().multiplyScalar(delta);
    const roomHalfWidth = roomWidth / 2000 - 0.35;
    const roomHalfDepth = roomDepth / 2000 - 0.35;
    const next = camera.position.clone();
    const radius = 0.28;
    const collides = (x: number, z: number) =>
      instances.some((instance) => {
        if (!instance.visible) return false;
        const halfWidth = instance.dimensionsMm.width / 2000 + radius;
        const halfDepth = instance.dimensionsMm.depth / 2000 + radius;
        const centerX = instance.positionMm.x / 1000;
        const centerZ = instance.positionMm.z / 1000;
        return Math.abs(x - centerX) < halfWidth && Math.abs(z - centerZ) < halfDepth;
      });

    const candidateX = THREE.MathUtils.clamp(next.x + step.x, -roomHalfWidth, roomHalfWidth);
    if (!collides(candidateX, next.z)) next.x = candidateX;
    const candidateZ = THREE.MathUtils.clamp(next.z + step.z, -roomHalfDepth, roomHalfDepth);
    if (!collides(next.x, candidateZ)) next.z = candidateZ;
    camera.position.copy(next);
    camera.position.y = 1.62;
  });

  return <PointerLockControls />;
}
