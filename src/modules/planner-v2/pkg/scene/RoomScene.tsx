import {
  ContactShadows,
  OrbitControls,
  RoundedBox
} from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";
import { usePlannerStore } from "../state/usePlannerStore";
import { useImmersiveStore } from "../state/useImmersiveStore";
import { OpeningSpec, useRoomBuilderStore } from "../state/useRoomBuilderStore";
import { InteractiveCabinet } from "./InteractiveCabinet";
import { WalkControls } from "./WalkControls";
import {
  createFloorTexture,
  createMarbleTexture,
  createWoodTexture
} from "./materials";

function CameraSetup() {
  const { camera } = useThree();
  const navigationMode = useImmersiveStore((s) => s.navigationMode);

  useEffect(() => {
    if (navigationMode === "walk") {
      camera.position.set(1.65, 1.62, 1.45);
      camera.lookAt(0, 1.25, -1.15);
    } else {
      camera.position.set(5.4, 1.68, 5.25);
      camera.lookAt(0, 1.12, -0.55);
    }
    camera.near = 0.035;
    camera.far = 100;
    camera.updateProjectionMatrix();
  }, [camera, navigationMode]);

  return null;
}

function CameraEventBridge() {
  const { camera } = useThree();
  useEffect(() => {
    const zoomIn = () => { const d = new THREE.Vector3(); camera.getWorldDirection(d); camera.position.addScaledVector(d, 0.55); };
    const zoomOut = () => { const d = new THREE.Vector3(); camera.getWorldDirection(d); camera.position.addScaledVector(d, -0.55); };
    const focus = () => { camera.position.set(5.4, 1.68, 5.25); camera.lookAt(0, 1.12, -0.55); camera.updateProjectionMatrix(); };
    window.addEventListener("dioris:zoom-in", zoomIn); window.addEventListener("dioris:zoom-out", zoomOut); window.addEventListener("dioris:focus-scene", focus);
    return () => { window.removeEventListener("dioris:zoom-in", zoomIn); window.removeEventListener("dioris:zoom-out", zoomOut); window.removeEventListener("dioris:focus-scene", focus); };
  }, [camera]);
  return null;
}

function againstBackWall(depthMm: number, roomDepthMm: number, gapMm = 12) {
  const depth = depthMm / 1000;
  const roomDepth = roomDepthMm / 1000;
  const gap = gapMm / 1000;
  const backInnerZ = -roomDepth / 2;
  return backInnerZ + depth / 2 + gap;
}

function clampX(xMm: number, widthMm: number, roomWidthMm: number, gapMm = 12) {
  const x = xMm / 1000;
  const width = widthMm / 1000;
  const roomWidth = roomWidthMm / 1000;
  const gap = gapMm / 1000;
  return THREE.MathUtils.clamp(
    x,
    -roomWidth / 2 + width / 2 + gap,
    roomWidth / 2 - width / 2 - gap
  );
}

function BackWall({
  widthMm,
  heightMm,
  thicknessMm,
  opening
}: {
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  opening?: OpeningSpec;
}) {
  const width = widthMm / 1000;
  const height = heightMm / 1000;
  const thickness = thicknessMm / 1000;
  const material = <meshStandardMaterial color="#ddd5c9" roughness={0.94} side={THREE.DoubleSide} />;

  if (!opening) {
    return (
      <mesh position={[0, height / 2, 0]} receiveShadow>
        <boxGeometry args={[width, height, thickness]} />
        {material}
      </mesh>
    );
  }

  const offset = opening.offset / 1000;
  const opWidth = opening.width / 1000;
  const opHeight = opening.height / 1000;
  const opSill = opening.sill / 1000;

  const leftEdge = THREE.MathUtils.clamp(
    offset - opWidth / 2,
    -width / 2 + 0.1,
    width / 2 - 0.2
  );
  const rightEdge = THREE.MathUtils.clamp(
    offset + opWidth / 2,
    -width / 2 + 0.2,
    width / 2 - 0.1
  );
  const bottom = opening.type === "door" ? 0 : opSill;
  const top = Math.min(height, bottom + opHeight);

  const segments = [
    { x: (-width / 2 + leftEdge) / 2, y: height / 2, w: leftEdge + width / 2, h: height },
    { x: (rightEdge + width / 2) / 2, y: height / 2, w: width / 2 - rightEdge, h: height },
    { x: offset, y: bottom / 2, w: rightEdge - leftEdge, h: bottom },
    { x: offset, y: (top + height) / 2, w: rightEdge - leftEdge, h: height - top }
  ].filter((segment) => segment.w > 0.01 && segment.h > 0.01);

  return (
    <group>
      {segments.map((segment, index) => (
        <mesh
          key={index}
          position={[segment.x, segment.y, 0]}
          receiveShadow
        >
          <boxGeometry args={[segment.w, segment.h, thickness]} />
          <meshStandardMaterial color="#ddd5c9" roughness={0.94} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <OpeningVisual opening={opening} orientation="back" />
    </group>
  );
}

function SideWall({
  side,
  depthMm,
  heightMm,
  thicknessMm,
  roomWidthMm,
  opening
}: {
  side: "left" | "right";
  depthMm: number;
  heightMm: number;
  thicknessMm: number;
  roomWidthMm: number;
  opening?: OpeningSpec;
}) {
  const depth = depthMm / 1000;
  const height = heightMm / 1000;
  const thickness = thicknessMm / 1000;
  const roomWidth = roomWidthMm / 1000;

  const x = side === "left" ? -roomWidth / 2 - thickness / 2 : roomWidth / 2 + thickness / 2;

  if (!opening) {
    return (
      <mesh position={[x, height / 2, 0]} receiveShadow>
        <boxGeometry args={[thickness, height, depth]} />
        <meshStandardMaterial color="#e4ddd3" roughness={0.94} side={THREE.DoubleSide} />
      </mesh>
    );
  }

  const offset = opening.offset / 1000;
  const opWidth = opening.width / 1000;
  const opHeight = opening.height / 1000;
  const opSill = opening.sill / 1000;

  const leftEdge = THREE.MathUtils.clamp(
    offset - opWidth / 2,
    -depth / 2 + 0.1,
    depth / 2 - 0.2
  );
  const rightEdge = THREE.MathUtils.clamp(
    offset + opWidth / 2,
    -depth / 2 + 0.2,
    depth / 2 - 0.1
  );
  const bottom = opening.type === "door" ? 0 : opSill;
  const top = Math.min(height, bottom + opHeight);

  const segments = [
    { z: (-depth / 2 + leftEdge) / 2, y: height / 2, d: leftEdge + depth / 2, h: height },
    { z: (rightEdge + depth / 2) / 2, y: height / 2, d: depth / 2 - rightEdge, h: height },
    { z: offset, y: bottom / 2, d: rightEdge - leftEdge, h: bottom },
    { z: offset, y: (top + height) / 2, d: rightEdge - leftEdge, h: height - top }
  ].filter((segment) => segment.d > 0.01 && segment.h > 0.01);

  return (
    <group>
      {segments.map((segment, index) => (
        <mesh
          key={index}
          position={[x, segment.y, segment.z]}
          receiveShadow
        >
          <boxGeometry args={[thickness, segment.h, segment.d]} />
          <meshStandardMaterial color="#e4ddd3" roughness={0.94} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <group position={[x, 0, 0]}>
        <OpeningVisual opening={opening} orientation={side} />
      </group>
    </group>
  );
}

function OpeningVisual({
  opening,
  orientation
}: {
  opening: OpeningSpec;
  orientation: "back" | "left" | "right";
}) {
  const isBack = orientation === "back";
  const position: [number, number, number] = isBack
    ? [opening.offset / 1000, (opening.sill + opening.height / 2) / 1000, 0.055]
    : [0, (opening.sill + opening.height / 2) / 1000, opening.offset / 1000];

  const rotation: [number, number, number] = isBack
    ? [0, 0, 0]
    : [0, Math.PI / 2, 0];

  if (opening.type === "door") {
    return (
      <group position={position} rotation={rotation}>
        <mesh castShadow>
          <boxGeometry args={[opening.width / 1000 - 0.06, opening.height / 1000 - 0.04, 0.045]} />
          <meshStandardMaterial color="#916946" roughness={0.58} />
        </mesh>
        <mesh position={[(opening.width / 1000) * 0.32, 0, 0.04]}>
          <sphereGeometry args={[0.035, 18, 18]} />
          <meshStandardMaterial color="#c7aa72" metalness={0.78} roughness={0.2} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[opening.width / 1000 - 0.06, opening.height / 1000 - 0.06, 0.025]} />
        <meshPhysicalMaterial
          color="#add9e7"
          transparent
          opacity={0.42}
          transmission={0.35}
          roughness={0.08}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[(side * opening.width / 2) / 1000, 0, 0.02]}>
          <boxGeometry args={[0.055, opening.height / 1000, 0.07]} />
          <meshStandardMaterial color="#282828" metalness={0.58} roughness={0.28} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`h-${side}`} position={[0, (side * opening.height / 2) / 1000, 0.02]}>
          <boxGeometry args={[opening.width / 1000, 0.055, 0.07]} />
          <meshStandardMaterial color="#282828" metalness={0.58} roughness={0.28} />
        </mesh>
      ))}
    </group>
  );
}


function Architecture() {
  const widthMm = useRoomBuilderStore((s) => s.width);
  const depthMm = useRoomBuilderStore((s) => s.depth);
  const heightMm = useRoomBuilderStore((s) => s.height);
  const thicknessMm = useRoomBuilderStore((s) => s.wallThickness);
  const openings = useRoomBuilderStore((s) => s.openings);
  const floorMap = useMemo(() => createFloorTexture(), []);

  const backOpening = openings.find((opening) => opening.wall === "back");
  const leftOpening = openings.find((opening) => opening.wall === "left");
  const rightOpening = openings.find((opening) => opening.wall === "right");

  const width = widthMm / 1000;
  const depth = depthMm / 1000;
  const height = heightMm / 1000;

  return (
    <group>
      <mesh position={[0, -0.045, 0]} receiveShadow>
        <boxGeometry args={[width, 0.09, depth]} />
        <meshStandardMaterial map={floorMap} color="#c2a486" roughness={0.63} />
      </mesh>

      <group position={[0, 0, -depth / 2]}>
        <BackWall
          widthMm={widthMm}
          heightMm={heightMm}
          thicknessMm={thicknessMm}
          opening={backOpening}
        />
      </group>

      <SideWall
        side="left"
        depthMm={depthMm}
        heightMm={heightMm}
        thicknessMm={thicknessMm}
        roomWidthMm={widthMm}
        opening={leftOpening}
      />

      <SideWall
        side="right"
        depthMm={depthMm}
        heightMm={heightMm}
        thicknessMm={thicknessMm}
        roomWidthMm={widthMm}
        opening={rightOpening}
      />

      <mesh position={[-width * 0.08, height + 0.04, -depth * 0.12]} receiveShadow>
        <boxGeometry args={[width * 0.78, 0.08, depth * 0.72]} />
        <meshStandardMaterial color="#f1eee8" roughness={0.97} />
      </mesh>
    </group>
  );
}

function KitchenScene() {
  const roomWidthMm = useRoomBuilderStore((s) => s.width);
  const roomDepthMm = useRoomBuilderStore((s) => s.depth);
  const roomWidth = roomWidthMm / 1000;
  const roomDepth = roomDepthMm / 1000;
  const woodMap = useMemo(() => createWoodTexture(), []);
  const marbleMap = useMemo(() => createMarbleTexture(), []);

  return (
    <group>
      <InteractiveCabinet
        id="base-cabinet-left"
        name="Gaveteiro inferior"
        position={[clampX(-1350, 1000, roomWidthMm), 0.39, againstBackWall(620, roomDepthMm)]}
        width={1.0}
        height={0.78}
        depth={0.62}
        type="base"
        woodMap={woodMap}
      />
      <InteractiveCabinet
        id="base-cabinet-center"
        name="Gaveteiro central"
        position={[clampX(-240, 1080, roomWidthMm), 0.39, againstBackWall(620, roomDepthMm)]}
        width={1.08}
        height={0.78}
        depth={0.62}
        type="base"
        woodMap={woodMap}
      />
      <InteractiveCabinet
        id="base-cabinet-right"
        name="Gabinete inferior"
        position={[clampX(880, 1040, roomWidthMm), 0.39, againstBackWall(620, roomDepthMm)]}
        width={1.04}
        height={0.78}
        depth={0.62}
        type="base"
        woodMap={woodMap}
      />

      <mesh position={[-0.22, 0.82, -1.55]} castShadow receiveShadow>
        <boxGeometry args={[3.25, 0.075, 0.68]} />
        <meshStandardMaterial map={marbleMap} color="#e3d9cb" roughness={0.28} />
      </mesh>

      <InteractiveCabinet
        id="upper-cabinet-left"
        name="Aéreo esquerdo"
        position={[clampX(-1180, 1250, roomWidthMm), 1.85, againstBackWall(400, roomDepthMm)]}
        width={1.25}
        height={0.82}
        depth={0.4}
        type="upper"
        woodMap={woodMap}
      />
      <InteractiveCabinet
        id="upper-cabinet-right"
        name="Aéreo direito"
        position={[clampX(180, 1350, roomWidthMm), 1.85, againstBackWall(400, roomDepthMm)]}
        width={1.35}
        height={0.82}
        depth={0.4}
        type="upper"
        woodMap={woodMap}
      />
      <InteractiveCabinet
        id="tower-cabinet"
        name="Torre quente"
        position={[clampX(1750, 720, roomWidthMm), 1.15, againstBackWall(640, roomDepthMm)]}
        width={0.72}
        height={2.3}
        depth={0.64}
        type="tower"
        woodMap={woodMap}
      />

      <mesh position={[-0.25, 1.42, -1.46]}>
        <boxGeometry args={[2.75, 0.018, 0.045]} />
        <meshStandardMaterial
          color="#ffe0ad"
          emissive="#ffbd62"
          emissiveIntensity={3.4}
        />
      </mesh>

      <group position={[0.35, 0, 0.2]}>
        <InteractiveCabinet
          id="island-cabinet"
          name="Ilha central"
          position={[0, 0.45, 0]}
          width={2.08}
          height={0.9}
          depth={0.88}
          type="base"
          woodMap={woodMap}
        />
        <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.08, 1.0]} />
          <meshStandardMaterial map={marbleMap} color="#e2d7ca" roughness={0.26} />
        </mesh>
      </group>

      <mesh position={[0.35, 0.997, 0.12]}>
        <boxGeometry args={[0.7, 0.018, 0.46]} />
        <meshStandardMaterial color="#111111" metalness={0.45} roughness={0.18} />
      </mesh>

      {[-0.2, 0.62].map((x) => (
        <group key={x} position={[x, 0, 1.0]}>
          <RoundedBox args={[0.42, 0.1, 0.42]} radius={0.04} position={[0, 0.7, 0]} castShadow>
            <meshStandardMaterial map={woodMap} color="#7f5332" roughness={0.5} />
          </RoundedBox>
          {[
            [-0.15, 0.34, -0.15],
            [0.15, 0.34, -0.15],
            [-0.15, 0.34, 0.15],
            [0.15, 0.34, 0.15]
          ].map((position, index) => (
            <mesh key={index} position={position as [number, number, number]} castShadow>
              <boxGeometry args={[0.035, 0.68, 0.035]} />
              <meshStandardMaterial color="#22201e" roughness={0.58} />
            </mesh>
          ))}
        </group>
      ))}

      <mesh position={[-0.08, 0.96, -1.32]} castShadow>
        <cylinderGeometry args={[0.075, 0.1, 0.24, 24]} />
        <meshStandardMaterial color="#344f39" roughness={0.82} />
      </mesh>
    </group>
  );
}

function SceneControls() {
  const navigationMode = useImmersiveStore((s) => s.navigationMode);
  const toolMode = usePlannerStore((s) => s.toolMode);

  if (navigationMode === "walk") {
    return <WalkControls />;
  }

  return (
    <OrbitControls
      makeDefault
      target={[0, 1.12, -0.5]}
      minDistance={1.2}
      maxDistance={11}
      minPolarAngle={0.55}
      maxPolarAngle={Math.PI / 2.04}
      enableDamping
      dampingFactor={0.08}
      enableRotate={toolMode === "orbit"}
      enablePan={toolMode === "pan"}
      enableZoom={toolMode === "orbit" || toolMode === "pan"}
      screenSpacePanning
      minAzimuthAngle={-Math.PI * 0.45}
      maxAzimuthAngle={Math.PI * 0.45}
    />
  );
}

export function RoomScene() {
  const gridVisible = usePlannerStore((s) => s.gridVisible);
  const lightsEnabled = usePlannerStore((s) => s.lightsEnabled);
  const selectFurniture = usePlannerStore((s) => s.selectFurniture);
  const selectPart = useImmersiveStore((s) => s.selectPart);
  const qualityMode = useImmersiveStore((s) => s.qualityMode);

  return (
    <Canvas
      shadows
      dpr={qualityMode === "presentation" ? [1, 1.7] : [1, 1.25]}
      camera={{ position: [5.4, 1.68, 5.25], fov: 39, near: 0.035, far: 100 }}
      onPointerMissed={() => {
        selectFurniture(null);
        selectPart(null);
      }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.08
      }}
    >
      <color attach="background" args={["#aeb7bc"]} />

      <Suspense fallback={null}>
        <CameraSetup />
        <CameraEventBridge />

        <ambientLight intensity={lightsEnabled ? 0.52 : 0.16} />
        <hemisphereLight
          color="#fff4e4"
          groundColor="#625448"
          intensity={lightsEnabled ? 1.15 : 0.22}
        />

        <directionalLight
          position={[3.8, 6.8, 4.2]}
          intensity={lightsEnabled ? 2.5 : 0.35}
          color="#fff3df"
          castShadow
          shadow-mapSize-width={qualityMode === "presentation" ? 2048 : 1024}
          shadow-mapSize-height={qualityMode === "presentation" ? 2048 : 1024}
        />

        <pointLight
          position={[-0.7, 2.45, -0.6]}
          intensity={lightsEnabled ? 8.5 : 0}
          color="#ffd29a"
          distance={5}
          decay={2}
        />
        <pointLight
          position={[1.25, 2.45, -0.5]}
          intensity={lightsEnabled ? 7 : 0}
          color="#ffd29a"
          distance={4}
          decay={2}
        />

        <Architecture />
        <KitchenScene />

        {gridVisible && (
          <gridHelper args={[8, 16, "#6366f1", "#5b6174"]} position={[0, 0.006, 0]} />
        )}

        <ContactShadows
          position={[0, 0.012, 0]}
          opacity={0.46}
          scale={9}
          blur={qualityMode === "presentation" ? 2.8 : 2.2}
          far={4}
        />

        <SceneControls />
      </Suspense>
    </Canvas>
  );
}
