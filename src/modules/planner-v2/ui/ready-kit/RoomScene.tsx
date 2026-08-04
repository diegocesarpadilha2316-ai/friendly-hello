import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { usePlannerStore } from "../state/usePlannerStore";
import { FurnitureMesh } from "./FurnitureMesh";

function Room() {
  return (
    <group>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[7.2, 0.1, 5.2]} />
        <meshStandardMaterial color="#b7a58d" roughness={0.72} />
      </mesh>

      <mesh position={[0, 1.45, -2.55]} receiveShadow>
        <boxGeometry args={[7.2, 2.9, 0.12]} />
        <meshStandardMaterial color="#d8d0c3" roughness={0.92} />
      </mesh>

      <mesh position={[-3.55, 1.45, 0]} receiveShadow>
        <boxGeometry args={[0.12, 2.9, 5.2]} />
        <meshStandardMaterial color="#e3ddd2" roughness={0.92} />
      </mesh>

      <mesh position={[0, 2.92, 0]} receiveShadow>
        <boxGeometry args={[7.2, 0.1, 5.2]} />
        <meshStandardMaterial color="#f0eee9" roughness={0.95} />
      </mesh>

      <mesh position={[-1.15, 1.55, -2.47]}>
        <boxGeometry args={[1.55, 1.05, 0.08]} />
        <meshPhysicalMaterial
          color="#a7d7e7"
          transparent
          opacity={0.38}
          roughness={0.1}
          transmission={0.25}
        />
      </mesh>

      <mesh position={[0.15, 0.9, -2.15]}>
        <cylinderGeometry args={[0.025, 0.025, 0.45, 18]} />
        <meshStandardMaterial color="#202020" metalness={0.65} roughness={0.3} />
      </mesh>

      <mesh position={[0.15, 1.1, -2.02]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.02, 12, 32, Math.PI]} />
        <meshStandardMaterial color="#202020" metalness={0.65} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Stools() {
  return (
    <>
      {[-0.45, 0.55].map((x) => (
        <group key={x} position={[x, 0, 1.15]}>
          <mesh position={[0, 0.72, 0]} castShadow>
            <boxGeometry args={[0.42, 0.11, 0.42]} />
            <meshStandardMaterial color="#7a4f2c" roughness={0.55} />
          </mesh>
          {[
            [-0.15, 0.35, -0.15],
            [0.15, 0.35, -0.15],
            [-0.15, 0.35, 0.15],
            [0.15, 0.35, 0.15]
          ].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]} castShadow>
              <boxGeometry args={[0.035, 0.7, 0.035]} />
              <meshStandardMaterial color="#2a241f" roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

export function RoomScene() {
  const furniture = usePlannerStore((s) => s.furniture);
  const gridVisible = usePlannerStore((s) => s.gridVisible);
  const lightsEnabled = usePlannerStore((s) => s.lightsEnabled);
  const selectFurniture = usePlannerStore((s) => s.selectFurniture);

  return (
    <Canvas
      shadows
      camera={{ position: [5.7, 3.3, 5.9], fov: 40, near: 0.1, far: 100 }}
      onPointerMissed={() => selectFurniture(null)}
      dpr={[1, 1.6]}
    >
      <color attach="background" args={["#101217"]} />
      <Suspense fallback={null}>
        <Environment preset="apartment" />
        <ambientLight intensity={lightsEnabled ? 0.65 : 0.2} />
        <directionalLight
          position={[3, 7, 4]}
          intensity={lightsEnabled ? 2.2 : 0.35}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-1, 2.45, -1.4]} intensity={lightsEnabled ? 8 : 0} color="#ffd7a1" />
        <pointLight position={[1.2, 2.45, -1.2]} intensity={lightsEnabled ? 8 : 0} color="#ffd7a1" />

        <Room />
        {furniture.map((item) => (
          <FurnitureMesh key={item.id} item={item} />
        ))}
        <Stools />

        {gridVisible && (
          <gridHelper args={[10, 20, "#6366f1", "#30354a"]} position={[0, 0.005, 0]} />
        )}

        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.42}
          scale={12}
          blur={2.5}
          far={4.5}
        />

        <OrbitControls
          makeDefault
          target={[0, 1.05, -0.4]}
          minDistance={2.5}
          maxDistance={14}
          minPolarAngle={0.35}
          maxPolarAngle={Math.PI / 2.05}
          enableDamping
        />
      </Suspense>
    </Canvas>
  );
}
