import { ContactShadows, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { usePlannerStore } from "../state/usePlannerStore";
import { useImmersiveStore } from "../state/useImmersiveStore";
import { OpeningSpec, useRoomBuilderStore } from "../state/useRoomBuilderStore";
import { InteractiveCabinet } from "./InteractiveCabinet";
import { LibraryPartsRenderer } from "./LibraryPartsRenderer";
import { RenderController } from "./RenderController";
import { DecorativeKitchenLayer } from "./DecorativeKitchenLayer";
import { KitchenApplianceLayer } from "./KitchenApplianceLayer";
import { getKitchenLighting } from "./lighting";
import { WalkControls } from "./WalkControls";
import { usePresentationCapture } from "./presentationCapture";
import { applyKitchenCamera } from "./cameraPresets";
import { createFloorTexture, createMarbleTexture, createWoodTexture } from "./materials";

function CameraSetup() {
  const { camera, scene, size } = useThree();
  const navigationMode = useImmersiveStore((s) => s.navigationMode);

  useEffect(() => {
    if (navigationMode === "walk") {
      camera.position.set(1.65, 1.62, 1.45);
      camera.lookAt(0, 1.25, -1.15);
    } else {
      camera.position.set(5.4, 1.68, 5.25);
      camera.lookAt(0, 1.12, -0.55);
      const timer = window.setTimeout(() => {
        applyKitchenCamera(
          camera,
          scene,
          "three-quarter-right",
          Math.max(0.65, size.width / Math.max(size.height, 1)),
        );
      }, 80);
      camera.near = 0.035;
      camera.far = 100;
      camera.updateProjectionMatrix();
      return () => window.clearTimeout(timer);
    }
    camera.near = 0.035;
    camera.far = 100;
    camera.updateProjectionMatrix();
  }, [camera, navigationMode, scene, size.height, size.width]);

  return null;
}

function CanvasSizeFixer() {
  const { gl } = useThree();

  useEffect(() => {
    const host = gl.domElement.parentElement;
    if (!host) return;
    const resize = () => {
      const rect = host.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      gl.domElement.style.width = "100%";
      gl.domElement.style.height = "100%";
      gl.setSize(rect.width, rect.height, false);
    };
    resize();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(host);
    return () => observer?.disconnect();
  }, [gl]);

  return null;
}

function ScenePerformanceReporter() {
  const frames = useRef(0);
  const elapsed = useRef(0);
  const minFps = useRef(Number.POSITIVE_INFINITY);
  const maxFrameTime = useRef(0);
  const { gl, scene } = useThree();

  const collectInstanceMetrics = () => {
    const metrics = new Map<
      string,
      {
        parts: Set<string>;
        meshes: number;
        geometries: Set<string>;
        materials: Set<string>;
        triangles: number;
        shadowCasters: number;
        listeners: number;
        categories: Map<string, { meshes: number; triangles: number; shadowCasters: number }>;
      }
    >();
    const categoryTotals = new Map<
      string,
      { meshes: number; triangles: number; shadowCasters: number }
    >();
    let lights = 0;
    let meshes = 0;
    let instancedMeshes = 0;
    let raycastableObjects = 0;
    let listeners = 0;
    let shadowCasters = 0;
    scene.traverse((object) => {
      if (object instanceof THREE.Light) lights += 1;
      if (object instanceof THREE.Mesh) {
        meshes += 1;
        if (object instanceof THREE.InstancedMesh) instancedMeshes += 1;
        if (object.userData?.hasPartListener || object.userData?.instanceId)
          raycastableObjects += 1;
        if (object.castShadow) shadowCasters += 1;
      }
      if (object.userData?.hasPartListener) listeners += 1;
      const instanceId = object.userData?.instanceId as string | undefined;
      if (!instanceId) return;
      const current = metrics.get(instanceId) ?? {
        parts: new Set<string>(),
        meshes: 0,
        geometries: new Set<string>(),
        materials: new Set<string>(),
        triangles: 0,
        shadowCasters: 0,
        listeners: 0,
        categories: new Map<string, { meshes: number; triangles: number; shadowCasters: number }>(),
      };
      if (object.userData?.partId) current.parts.add(object.userData.partId as string);
      if (object instanceof THREE.Mesh) {
        current.meshes += 1;
        const category = object.userData?.edgeBand
          ? "edge-band"
          : String(object.userData?.role ?? "helper");
        const indexCount =
          object.geometry?.index?.count ?? object.geometry?.attributes.position?.count ?? 0;
        const triangles = Math.floor(indexCount / 3);
        const shadowCasters = object.castShadow ? 1 : 0;
        const categoryMetric = current.categories.get(category) ?? {
          meshes: 0,
          triangles: 0,
          shadowCasters: 0,
        };
        categoryMetric.meshes += 1;
        categoryMetric.triangles += triangles;
        categoryMetric.shadowCasters += shadowCasters;
        current.categories.set(category, categoryMetric);
        const totalMetric = categoryTotals.get(category) ?? {
          meshes: 0,
          triangles: 0,
          shadowCasters: 0,
        };
        totalMetric.meshes += 1;
        totalMetric.triangles += triangles;
        totalMetric.shadowCasters += shadowCasters;
        categoryTotals.set(category, totalMetric);
        if (object.geometry) {
          current.geometries.add(object.geometry.uuid);
          current.triangles += triangles;
        }
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material && current.materials.add(material.uuid));
        if (object.castShadow) current.shadowCasters += 1;
      }
      if (object.userData?.hasPartListener) current.listeners += 1;
      metrics.set(instanceId, current);
    });
    return {
      instances: Object.fromEntries(
        [...metrics.entries()].map(([id, value]) => [
          id,
          {
            parts: value.parts.size,
            meshes: value.meshes,
            geometries: value.geometries.size,
            materials: value.materials.size,
            triangles: value.triangles,
            lights,
            shadowCasters: value.shadowCasters,
            listeners: value.listeners,
            reactPartComponents: value.parts.size,
            categories: Object.fromEntries(value.categories.entries()),
          },
        ]),
      ),
      categories: Object.fromEntries(categoryTotals.entries()),
      scene: { meshes, instancedMeshes, lights, raycastableObjects, listeners, shadowCasters },
    };
  };
  useFrame((_, delta) => {
    frames.current += 1;
    elapsed.current += delta;
    maxFrameTime.current = Math.max(maxFrameTime.current, delta * 1000);
    if (elapsed.current >= 1) {
      const info = gl.info.render;
      const fps = Math.round(frames.current / elapsed.current);
      minFps.current = Math.min(minFps.current, fps);
      const structural = collectInstanceMetrics();
      window.dispatchEvent(new CustomEvent("dioris:fps", { detail: fps }));
      window.dispatchEvent(
        new CustomEvent("dioris:perf", {
          detail: {
            fps,
            fpsMin: Number.isFinite(minFps.current) ? minFps.current : fps,
            frameTimeMsMax: Number(maxFrameTime.current.toFixed(2)),
            calls: info.calls,
            triangles: info.triangles,
            geometries: gl.info.memory.geometries,
            textures: gl.info.memory.textures,
            programs: gl.info.programs?.length ?? 0,
            instances: structural.instances,
            categories: structural.categories,
            scene: structural.scene,
          },
        }),
      );
      frames.current = 0;
      elapsed.current = 0;
      gl.info.reset();
    }
  });
  return null;
}

function CameraEventBridge() {
  const { camera, scene, size } = useThree();
  useEffect(() => {
    const zoomIn = () => {
      const d = new THREE.Vector3();
      camera.getWorldDirection(d);
      camera.position.addScaledVector(d, 0.55);
    };
    const zoomOut = () => {
      const d = new THREE.Vector3();
      camera.getWorldDirection(d);
      camera.position.addScaledVector(d, -0.55);
    };
    const focus = () =>
      applyKitchenCamera(
        camera,
        scene,
        "three-quarter-right",
        Math.max(0.65, size.width / Math.max(size.height, 1)),
      );
    window.addEventListener("dioris:zoom-in", zoomIn);
    window.addEventListener("dioris:zoom-out", zoomOut);
    window.addEventListener("dioris:focus-scene", focus);
    return () => {
      window.removeEventListener("dioris:zoom-in", zoomIn);
      window.removeEventListener("dioris:zoom-out", zoomOut);
      window.removeEventListener("dioris:focus-scene", focus);
    };
  }, [camera, scene, size.height, size.width]);
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
    roomWidth / 2 - width / 2 - gap,
  );
}

function BackWall({
  widthMm,
  heightMm,
  thicknessMm,
  opening,
  autoOcclusion = false,
}: {
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  opening?: OpeningSpec;
  autoOcclusion?: boolean;
}) {
  const width = widthMm / 1000;
  const height = heightMm / 1000;
  const thickness = thicknessMm / 1000;
  const material = (
    <meshStandardMaterial
      color="#ddd5c9"
      roughness={0.94}
      side={THREE.DoubleSide}
      transparent={autoOcclusion}
      opacity={autoOcclusion ? 0.32 : 1}
      depthWrite={!autoOcclusion}
    />
  );

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

  const leftEdge = THREE.MathUtils.clamp(offset - opWidth / 2, -width / 2 + 0.1, width / 2 - 0.2);
  const rightEdge = THREE.MathUtils.clamp(offset + opWidth / 2, -width / 2 + 0.2, width / 2 - 0.1);
  const bottom = opening.type === "door" ? 0 : opSill;
  const top = Math.min(height, bottom + opHeight);

  const segments = [
    { x: (-width / 2 + leftEdge) / 2, y: height / 2, w: leftEdge + width / 2, h: height },
    { x: (rightEdge + width / 2) / 2, y: height / 2, w: width / 2 - rightEdge, h: height },
    { x: offset, y: bottom / 2, w: rightEdge - leftEdge, h: bottom },
    { x: offset, y: (top + height) / 2, w: rightEdge - leftEdge, h: height - top },
  ].filter((segment) => segment.w > 0.01 && segment.h > 0.01);

  return (
    <group>
      {segments.map((segment, index) => (
        <mesh key={index} position={[segment.x, segment.y, 0]} receiveShadow>
          <boxGeometry args={[segment.w, segment.h, thickness]} />
          <meshStandardMaterial
            color="#ddd5c9"
            roughness={0.94}
            side={THREE.DoubleSide}
            transparent={autoOcclusion}
            opacity={autoOcclusion ? 0.32 : 1}
            depthWrite={!autoOcclusion}
          />
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
  opening,
  autoOcclusion = false,
}: {
  side: "left" | "right";
  depthMm: number;
  heightMm: number;
  thicknessMm: number;
  roomWidthMm: number;
  opening?: OpeningSpec;
  autoOcclusion?: boolean;
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

  const leftEdge = THREE.MathUtils.clamp(offset - opWidth / 2, -depth / 2 + 0.1, depth / 2 - 0.2);
  const rightEdge = THREE.MathUtils.clamp(offset + opWidth / 2, -depth / 2 + 0.2, depth / 2 - 0.1);
  const bottom = opening.type === "door" ? 0 : opSill;
  const top = Math.min(height, bottom + opHeight);

  const segments = [
    { z: (-depth / 2 + leftEdge) / 2, y: height / 2, d: leftEdge + depth / 2, h: height },
    { z: (rightEdge + depth / 2) / 2, y: height / 2, d: depth / 2 - rightEdge, h: height },
    { z: offset, y: bottom / 2, d: rightEdge - leftEdge, h: bottom },
    { z: offset, y: (top + height) / 2, d: rightEdge - leftEdge, h: height - top },
  ].filter((segment) => segment.d > 0.01 && segment.h > 0.01);

  return (
    <group>
      {segments.map((segment, index) => (
        <mesh key={index} position={[x, segment.y, segment.z]} receiveShadow>
          <boxGeometry args={[thickness, segment.h, segment.d]} />
          <meshStandardMaterial
            color="#e4ddd3"
            roughness={0.94}
            side={THREE.DoubleSide}
            transparent={autoOcclusion}
            opacity={autoOcclusion ? 0.32 : 1}
            depthWrite={!autoOcclusion}
          />
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
  orientation,
}: {
  opening: OpeningSpec;
  orientation: "back" | "left" | "right";
}) {
  const isBack = orientation === "back";
  const position: [number, number, number] = isBack
    ? [opening.offset / 1000, (opening.sill + opening.height / 2) / 1000, 0.055]
    : [0, (opening.sill + opening.height / 2) / 1000, opening.offset / 1000];

  const rotation: [number, number, number] = isBack ? [0, 0, 0] : [0, Math.PI / 2, 0];

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
        <mesh key={side} position={[(side * opening.width) / 2 / 1000, 0, 0.02]}>
          <boxGeometry args={[0.055, opening.height / 1000, 0.07]} />
          <meshStandardMaterial color="#282828" metalness={0.58} roughness={0.28} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`h-${side}`} position={[0, (side * opening.height) / 2 / 1000, 0.02]}>
          <boxGeometry args={[opening.width / 1000, 0.055, 0.07]} />
          <meshStandardMaterial color="#282828" metalness={0.58} roughness={0.28} />
        </mesh>
      ))}
    </group>
  );
}

function findBlockingWall(
  camera: THREE.Vector3,
  target: THREE.Vector3,
  width: number,
  depth: number,
  height: number,
): "back" | "left" | "right" | null {
  const direction = target.clone().sub(camera);
  const candidates: Array<{
    wall: "back" | "left" | "right";
    point: THREE.Vector3;
    distance: number;
  }> = [];
  const planes = [
    { wall: "back" as const, plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), depth / 2) },
    { wall: "left" as const, plane: new THREE.Plane(new THREE.Vector3(1, 0, 0), width / 2) },
    { wall: "right" as const, plane: new THREE.Plane(new THREE.Vector3(-1, 0, 0), width / 2) },
  ];
  for (const { wall, plane } of planes) {
    const denominator = plane.normal.dot(direction);
    if (Math.abs(denominator) < 0.00001) continue;
    const distanceAlongRay = -(camera.dot(plane.normal) + plane.constant) / denominator;
    if (distanceAlongRay <= 0 || distanceAlongRay >= 1) continue;
    const point = camera.clone().addScaledVector(direction, distanceAlongRay);
    if (point.y < 0 || point.y > height) continue;
    if (wall === "back" && Math.abs(point.x) > width / 2) continue;
    if ((wall === "left" || wall === "right") && Math.abs(point.z) > depth / 2) continue;
    candidates.push({ wall, point, distance: camera.distanceTo(point) });
  }
  candidates.sort((a, b) => a.distance - b.distance);
  return candidates[0]?.wall ?? null;
}

function Architecture() {
  const widthMm = useRoomBuilderStore((s) => s.width);
  const depthMm = useRoomBuilderStore((s) => s.depth);
  const heightMm = useRoomBuilderStore((s) => s.height);
  const thicknessMm = useRoomBuilderStore((s) => s.wallThickness);
  const openings = useRoomBuilderStore((s) => s.openings);
  const autoOcclusion = useImmersiveStore((s) => s.autoOcclusion);
  const presentationCapture =
    usePresentationCapture() ||
    (typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("v10autocapture") === "1");
  const effectiveAutoOcclusion = autoOcclusion && !presentationCapture;
  const selectedId = usePlannerStore((s) => s.selectedId);
  const selectedInstance = usePlannerStore((s) =>
    s.instances.find((instance) => instance.id === selectedId),
  );
  const { camera } = useThree();
  const [occludingWall, setOccludingWall] = useState<"back" | "left" | "right" | null>(null);
  const lastOcclusionCheck = useRef(0);
  const lastOcclusionCamera = useRef(new THREE.Vector3(Number.NaN, Number.NaN, Number.NaN));
  const lastOcclusionQuaternion = useRef(
    new THREE.Quaternion(Number.NaN, Number.NaN, Number.NaN, Number.NaN),
  );
  const lastOcclusionTarget = useRef(new THREE.Vector3(Number.NaN, Number.NaN, Number.NaN));
  useFrame((state) => {
    if (!effectiveAutoOcclusion) {
      if (occludingWall !== null) setOccludingWall(null);
      return;
    }
    if (state.clock.elapsedTime - lastOcclusionCheck.current < 0.12) return;
    lastOcclusionCheck.current = state.clock.elapsedTime;
    const target = selectedInstance
      ? new THREE.Vector3(
          selectedInstance.positionMm.x / 1000,
          (selectedInstance.positionMm.y + selectedInstance.dimensionsMm.height / 2) / 1000,
          selectedInstance.positionMm.z / 1000,
        )
      : new THREE.Vector3(0, 1.1, -0.6);
    const cameraMoved =
      !Number.isFinite(lastOcclusionCamera.current.x) ||
      camera.position.distanceToSquared(lastOcclusionCamera.current) > 0.000001;
    const cameraRotated =
      !Number.isFinite(lastOcclusionQuaternion.current.x) ||
      1 - Math.abs(camera.quaternion.dot(lastOcclusionQuaternion.current)) > 0.000001;
    const targetMoved =
      !Number.isFinite(lastOcclusionTarget.current.x) ||
      target.distanceToSquared(lastOcclusionTarget.current) > 0.000001;
    if (!cameraMoved && !cameraRotated && !targetMoved) return;
    lastOcclusionCamera.current.copy(camera.position);
    lastOcclusionQuaternion.current.copy(camera.quaternion);
    lastOcclusionTarget.current.copy(target);
    const nextWall = findBlockingWall(
      camera.position,
      target,
      widthMm / 1000,
      depthMm / 1000,
      heightMm / 1000,
    );
    if (nextWall !== occludingWall) setOccludingWall(nextWall);
  });
  const floorMap = useMemo(() => createFloorTexture(), []);
  const backsplashMap = useMemo(() => createMarbleTexture(), []);

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

      <>
        <group position={[0, 0, -depth / 2]}>
          <BackWall
            widthMm={widthMm}
            heightMm={heightMm}
            thicknessMm={thicknessMm}
            opening={presentationCapture ? undefined : backOpening}
            autoOcclusion={effectiveAutoOcclusion && occludingWall === "back"}
          />
        </group>

        <mesh
          position={[0, 1.18, -depth / 2 + 0.025]}
          receiveShadow
          userData={{ renderLayer: "SCENE_CONTENT", contentType: "architecture" }}
        >
          <boxGeometry args={[width * 0.82, 0.72, 0.025]} />
          <meshStandardMaterial map={backsplashMap} color="#fbf6ea" roughness={0.18} />
        </mesh>
        {!presentationCapture &&
          [
            { x: -0.82, y: 1.28, length: 1.35, angle: -0.28 },
            { x: 0.15, y: 1.12, length: 0.92, angle: 0.22 },
            { x: 0.78, y: 1.34, length: 1.15, angle: -0.34 },
            { x: 1.2, y: 0.98, length: 0.62, angle: 0.3 },
          ].map((vein) => (
            <mesh
              key={`calacatta-vein-${vein.x}-${vein.y}`}
              position={[vein.x, vein.y, -depth / 2 + 0.041]}
              rotation={[0, 0, vein.angle]}
              userData={{ renderLayer: "SCENE_CONTENT", contentType: "architecture" }}
            >
              <boxGeometry args={[vein.length, 0.012, 0.006]} />
              <meshStandardMaterial color="#b89c79" roughness={0.34} transparent opacity={0.52} />
            </mesh>
          ))}

        {!presentationCapture && (
          <SideWall
            side="left"
            depthMm={depthMm}
            heightMm={heightMm}
            thicknessMm={thicknessMm}
            roomWidthMm={widthMm}
            opening={leftOpening}
            autoOcclusion={effectiveAutoOcclusion && occludingWall === "left"}
          />
        )}
        {(rightOpening || !presentationCapture) && (
          <SideWall
            side="right"
            depthMm={depthMm}
            heightMm={heightMm}
            thicknessMm={thicknessMm}
            roomWidthMm={widthMm}
            opening={rightOpening}
            autoOcclusion={effectiveAutoOcclusion && occludingWall === "right"}
          />
        )}

        <mesh position={[-width * 0.08, height + 0.04, -depth * 0.12]} receiveShadow>
          <boxGeometry args={[width * 0.78, 0.08, depth * 0.72]} />
          <meshStandardMaterial color="#f1eee8" roughness={0.97} />
        </mesh>
      </>
    </group>
  );
}

/**
 * Legacy demo-only scene kept isolated for backwards compatibility.
 * It is intentionally not mounted by RoomScene; live Kitchen rendering is
 * exclusively owned by LibraryPartsRenderer/FurnitureInstance.
 */
function LegacyKitchenScene() {
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
        <meshStandardMaterial color="#ffe0ad" emissive="#ffbd62" emissiveIntensity={3.4} />
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
            [0.15, 0.34, 0.15],
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
  const presentationCapture = usePresentationCapture();
  const navigationMode = useImmersiveStore((s) => s.navigationMode);
  const toolMode = usePlannerStore((s) => s.toolMode);

  if (presentationCapture) return null;
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
  const lighting = getKitchenLighting(qualityMode);
  const presentationCapture = usePresentationCapture();

  return (
    <Canvas
      style={{ width: "100%", height: "100%", display: "block" }}
      shadows={qualityMode !== "work"}
      dpr={lighting.dpr}
      camera={{ position: [5.4, 1.68, 5.25], fov: 39, near: 0.035, far: 100 }}
      onPointerMissed={() => {
        selectFurniture(null);
        selectPart(null);
      }}
      gl={{
        antialias: qualityMode !== "work",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: lighting.exposure,
        preserveDrawingBuffer: true,
      }}
    >
      <color attach="background" args={["#aeb7bc"]} />

      <CanvasSizeFixer />
      <ScenePerformanceReporter />
      <CameraSetup />
      <CameraEventBridge />
      <RenderController />

      <ambientLight intensity={lightsEnabled ? lighting.ambient : lighting.ambient * 0.32} />
      <hemisphereLight
        color={lighting.keyColor}
        groundColor="#4f433a"
        intensity={lightsEnabled ? lighting.hemisphere : lighting.hemisphere * 0.24}
      />

      <directionalLight
        position={[3.8, 6.8, 4.2]}
        intensity={lightsEnabled ? lighting.directional : lighting.directional * 0.22}
        color={lighting.keyColor}
        castShadow={qualityMode !== "work"}
        shadow-mapSize-width={lighting.shadowMap}
        shadow-mapSize-height={lighting.shadowMap}
      />

      <pointLight
        position={[-0.7, 2.45, -0.6]}
        intensity={lightsEnabled && lighting.led ? lighting.pointA * lighting.ledIntensity : 0}
        color={lighting.ledColor}
        distance={5}
        decay={2}
      />
      <pointLight
        position={[1.25, 2.45, -0.5]}
        intensity={lightsEnabled && lighting.led ? lighting.pointB * lighting.ledIntensity : 0}
        color={lighting.ledColor}
        distance={4}
        decay={2}
      />
      <spotLight
        position={[-1.55, 2.72, 0.2]}
        target-position={[-1.55, 0.92, -1.25]}
        intensity={lightsEnabled ? lighting.directional * 0.42 : 0}
        color={lighting.keyColor}
        angle={0.34}
        penumbra={0.72}
        decay={1.5}
        distance={5.5}
        castShadow={qualityMode === "presentation"}
      />
      <spotLight
        position={[0.1, 2.82, 0.35]}
        target-position={[0.1, 0.92, -1.15]}
        intensity={lightsEnabled ? lighting.directional * 0.34 : 0}
        color={lighting.keyColor}
        angle={0.38}
        penumbra={0.78}
        decay={1.5}
        distance={5.5}
      />
      <spotLight
        position={[1.68, 2.6, 0.15]}
        target-position={[1.1, 0.98, -1.2]}
        intensity={lightsEnabled ? lighting.directional * 0.28 : 0}
        color={lighting.fillColor}
        angle={0.42}
        penumbra={0.8}
        decay={1.5}
        distance={5}
      />

      <group userData={{ renderLayer: "SCENE_CONTENT", contentType: "architecture" }}>
        <Architecture />
      </group>
      <LibraryPartsRenderer />
      <group userData={{ renderLayer: "SCENE_CONTENT", contentType: "decoration" }}>
        <DecorativeKitchenLayer />
      </group>
      <group userData={{ renderLayer: "SCENE_CONTENT", contentType: "appliances" }}>
        <KitchenApplianceLayer />
      </group>

      {gridVisible && !presentationCapture && (
        <gridHelper
          userData={{ renderLayer: "EDITOR_ONLY", editorObject: "grid" }}
          args={[8, 16, "#6366f1", "#5b6174"]}
          position={[0, 0.006, 0]}
        />
      )}

      {lighting.contactShadows && (
        <ContactShadows
          position={[0, 0.012, 0]}
          opacity={lighting.contactOpacity}
          scale={9}
          blur={lighting.contactBlur}
          far={4}
        />
      )}

      <SceneControls />
    </Canvas>
  );
}
