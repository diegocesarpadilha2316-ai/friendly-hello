import { Edges } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import { RoundedBox, TransformControls } from "@react-three/drei";
import * as THREE from "three";
import type { FurnitureInstance } from "../../library/contracts/FurnitureInstance";
import type { PartDefinition } from "../../library/contracts/PartDefinition";
import { resolveMaterial } from "../../library/services/resolveMaterial";
import { ModuleRegistry } from "../../library/registry/ModuleRegistry";
import { mToMm, mmToScene } from "../../core/units";
import { usePlannerStore } from "../state/usePlannerStore";
import { useImmersiveStore } from "../state/useImmersiveStore";
import { useRoomBuilderStore } from "../state/useRoomBuilderStore";
import { createMaterialTextureUrl } from "./materials";
import { usePresentationCapture } from "./presentationCapture";

const DEG = Math.PI / 180;
const EDGE_BAND_THICKNESS_M = 0.001;
const FALLBACK_COLOR_MAP = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3Crect width='2' height='2' fill='%23ffffff'/%3E%3C/svg%3E";
const FALLBACK_NORMAL_MAP = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3Crect width='2' height='2' fill='%238080ff'/%3E%3C/svg%3E";
const FALLBACK_BUMP_MAP = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3Crect width='2' height='2' fill='%23000000'/%3E%3C/svg%3E";
const FALLBACK_ROUGHNESS_MAP = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3Crect width='2' height='2' fill='%23b8b8b8'/%3E%3C/svg%3E";
const FALLBACK_METALNESS_MAP = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3Crect width='2' height='2' fill='%23000000'/%3E%3C/svg%3E";
const FALLBACK_AO_MAP = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3Crect width='2' height='2' fill='%23ffffff'/%3E%3C/svg%3E";

type SafeTextureBundle = Partial<Record<"map" | "normalMap" | "bumpMap" | "roughnessMap" | "metalnessMap" | "aoMap" | "displacementMap", THREE.Texture>>;
const safeTextureCache = new Map<string, THREE.Texture>();
const safeTextureLoader = new THREE.TextureLoader();

function useSafeMaterialTextures(urls: Record<string, string>) {
  const [textures, setTextures] = useState<SafeTextureBundle>({});
  const signature = Object.entries(urls).map(([key, url]) => `${key}:${url}`).join("|");

  useEffect(() => {
    let active = true;
    const entries = Object.entries(urls);
    Promise.all(entries.map(([key, url]) => new Promise<[string, THREE.Texture | undefined]>((resolve) => {
      const cached = safeTextureCache.get(url);
      if (cached) { resolve([key, cached]); return; }
      safeTextureLoader.load(url, (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        safeTextureCache.set(url, texture);
        resolve([key, texture]);
      }, undefined, () => resolve([key, undefined]));
    }))).then((loaded) => {
      if (!active) return;
      setTextures(Object.fromEntries(loaded.filter(([, texture]) => texture)) as SafeTextureBundle);
    });
    return () => { active = false; };
  }, [signature]);

  return textures;
}

function EdgeBandMesh({ edge, materialId, size, instanceId }: { edge: string; materialId: string; size: [number, number, number]; instanceId: string }) {
  const material = resolveMaterial(materialId);
  const [width, height, depth] = size;
  const edgeThickness = material.category === "stone" ? Math.min(0.004, height) : EDGE_BAND_THICKNESS_M;
  const bandSize: [number, number, number] = edge === "top" || edge === "bottom"
    ? [width, edgeThickness, depth]
    : edge === "front" || edge === "back"
      ? [width, height, edgeThickness]
      : [edgeThickness, height, depth];
  const position: [number, number, number] = edge === "top"
    ? [0, height / 2, 0]
    : edge === "bottom"
      ? [0, -height / 2, 0]
      : edge === "front"
        ? [0, 0, depth / 2]
        : edge === "back"
          ? [0, 0, -depth / 2]
          : edge === "left"
            ? [-width / 2, 0, 0]
            : [width / 2, 0, 0];

  return (
      <mesh position={position} raycast={() => null} userData={{ instanceId, edgeBand: edge }}>
      <boxGeometry args={bandSize} />
      <meshStandardMaterial color={material.baseColor} roughness={material.roughness} metalness={material.metalness} />
    </mesh>
  );
}

function StaticHardwareBatch({ parts, instanceId }: { parts: PartDefinition[]; instanceId: string }) {
  const qualityMode = useImmersiveStore((s) => s.qualityMode);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const first = parts[0];
  const materialDefinition = useMemo(() => resolveMaterial(first.materialId), [first.materialId]);
  const size: [number, number, number] = [
    mmToScene(first.dimensionsMm.width),
    mmToScene(first.dimensionsMm.height),
    mmToScene(first.dimensionsMm.depth),
  ];
  const geometry = useMemo(() => new THREE.BoxGeometry(size[0], size[1], size[2]), [size[0], size[1], size[2]]);
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: materialDefinition.baseColor,
    roughness: materialDefinition.roughness,
    metalness: materialDefinition.metalness,
  }), [materialDefinition.baseColor, materialDefinition.roughness, materialDefinition.metalness]);
  const helper = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    parts.forEach((part, index) => {
      helper.position.set(mmToScene(part.positionMm.x), mmToScene(part.positionMm.y), mmToScene(part.positionMm.z));
      helper.rotation.set(part.rotationDeg.x * DEG, part.rotationDeg.y * DEG, part.rotationDeg.z * DEG);
      helper.updateMatrix();
      mesh.setMatrixAt(index, helper.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [helper, meshRef, parts]);

  if (qualityMode === "work") return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, parts.length]}
      userData={{ instanceId, role: "hardware", instancedHardware: true }}
      castShadow={false}
      receiveShadow={false}
      raycast={() => null}
    />
  );
}

function HardwareVisual({ part, material, size }: { part: PartDefinition; material: ReturnType<typeof resolveMaterial>; size: [number, number, number] }) {
  const geometry = part.hardwareGeometry;
  if (!geometry || geometry.kind === "box") {
    return <boxGeometry args={size} />;
  }

  if (geometry.kind === "cylinder") {
    return (
      <cylinderGeometry
        args={[mmToScene(geometry.radiusMm), mmToScene(geometry.radiusMm), size[0], geometry.radialSegments ?? 24]}
        rotate-z={Math.PI / 2}
      />
    );
  }

  const radius = geometry.kind === "profile" ? mmToScene(geometry.radiusMm) : 0.003;
  const grooveColor = new THREE.Color(material.baseColor).offsetHSL(0, 0, -0.14);
  const grooveWidth = Math.max(0.003, size[0] * 0.82);
  const grooveLipMm = geometry.kind === "gola" || geometry.kind === "cava" ? geometry.lipMm : geometry.radiusMm;
  const grooveHeight = Math.min(size[1] * 0.28, mmToScene(grooveLipMm));

  return (
    <group>
      <RoundedBox args={size} radius={radius} smoothness={3}>
        <meshPhysicalMaterial color={material.baseColor} roughness={material.roughness} metalness={material.metalness} clearcoat={material.clearcoat ?? 0.35} clearcoatRoughness={material.clearcoatRoughness ?? 0.18} />
      </RoundedBox>
      {(geometry.kind === "gola" || geometry.kind === "cava") && (
        <mesh position={[0, geometry.kind === "gola" ? -size[1] * 0.18 : 0, size[2] / 2 + 0.001]} raycast={() => null}>
          <boxGeometry args={[grooveWidth, grooveHeight, mmToScene(geometry.recessMm)]} />
          <meshStandardMaterial color={grooveColor} roughness={0.24} metalness={0.78} />
        </mesh>
      )}
    </group>
  );
}

function PartMesh({
  part,
  motionPart,
  open,
  selected,
  xray,
  onSelect,
  onToggleOpen,
  instanceId
}: {
  part: PartDefinition;
  motionPart?: PartDefinition;
  open: boolean;
  selected: boolean;
  xray: boolean;
  onSelect: () => void;
  onToggleOpen: () => void;
  instanceId: string;
}) {
  const material = useMemo(() => resolveMaterial(part.materialId), [part.materialId]);
  const qualityMode = useImmersiveStore((s) => s.qualityMode);
  const exposed = ["door", "drawer-front", "countertop", "top", "side-left", "side-right"].includes(part.role);
  const castShadow = qualityMode !== "work" && ["door", "drawer-front", "countertop", "top"].includes(part.role);
  const materialTextureUrl = useMemo(() => material.textureUrl || material.maps?.baseColorUrl || createMaterialTextureUrl(material), [material]);
  const textureUrls = useMemo(() => ({
    map: materialTextureUrl || FALLBACK_COLOR_MAP,
    normalMap: material.normalUrl || material.maps?.normalUrl || FALLBACK_NORMAL_MAP,
    bumpMap: material.bumpUrl || FALLBACK_BUMP_MAP,
    roughnessMap: material.maps?.roughnessUrl || FALLBACK_ROUGHNESS_MAP,
    metalnessMap: material.maps?.metalnessUrl || FALLBACK_METALNESS_MAP,
    aoMap: material.maps?.aoUrl || FALLBACK_AO_MAP,
    displacementMap: material.maps?.heightUrl || FALLBACK_BUMP_MAP,
  }), [materialTextureUrl, material.normalUrl, material.maps]);
  const textures = useSafeMaterialTextures(textureUrls);
  useEffect(() => {
    const repeat = material.uvRepeat ?? { x: material.uvTransform?.scaleX ?? material.textureScale, y: material.uvTransform?.scaleY ?? material.textureScale };
    const grainRotationDeg = part.grainDirection === "vertical" ? 90 : part.grainDirection === "horizontal" ? 0 : 0;
    const rotation = ((material.textureRotationDeg ?? 0) + (material.uvTransform?.rotationDeg ?? 0) + grainRotationDeg) * DEG;
    Object.values(textures).forEach((texture) => {
      if (!texture) return;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeat.x, repeat.y);
      texture.offset.set(material.uvTransform?.offsetX ?? 0, material.uvTransform?.offsetY ?? 0);
      texture.rotation = rotation;
      texture.needsUpdate = true;
    });
    if (textures.map) textures.map.colorSpace = THREE.SRGBColorSpace;
  }, [material.textureRotationDeg, material.uvRepeat, material.uvTransform, material.textureScale, part.grainDirection, textures]);
  const transparent = Boolean(xray || material.transparent);
  const opacity = xray ? 0.22 : material.opacity ?? 1;
  const size: [number, number, number] = [
    mmToScene(part.dimensionsMm.width),
    mmToScene(part.dimensionsMm.height),
    mmToScene(part.dimensionsMm.depth)
  ];
  const position: [number, number, number] = [
    mmToScene(part.positionMm.x),
    mmToScene(part.positionMm.y),
    mmToScene(part.positionMm.z)
  ];

  const interactive = motionPart?.interactive ?? part.interactive;
  const pivotMm = motionPart?.pivotMm ?? part.pivotMm;
  const partSelectable = !["hardware", "hinge", "screw", "support"].includes(part.role);
  let group = { position, rotationX: 0, rotationY: 0 };

  if (interactive?.type === "drawer" && open) {
    group = {
      position: [position[0], position[1], position[2] + mmToScene(interactive.maxTravelMm ?? 0)],
      rotationX: 0,
      rotationY: 0
    };
  }

  if (interactive?.type === "door" && open) {
    const angle = (interactive.maxOpenAngleDeg ?? 90) * DEG;
    const sign = interactive.hingeSide === "left" ? 1 : -1;
    const rotationY = -sign * angle;
    const fallbackPivot = { x: position[0] - sign * size[0] / 2, y: position[1], z: position[2] };
    const pivot = pivotMm ? [mmToScene(pivotMm.x), mmToScene(pivotMm.y), mmToScene(pivotMm.z)] as [number, number, number] : [fallbackPivot.x, fallbackPivot.y, fallbackPivot.z] as [number, number, number];
    const localX = position[0] - pivot[0];
    const localZ = position[2] - pivot[2];
    const cos = Math.cos(rotationY);
    const sin = Math.sin(rotationY);
    group = {
      position: [pivot[0] + localX * cos + localZ * sin, pivot[1], pivot[2] - localX * sin + localZ * cos],
      rotationX: 0,
      rotationY
    };
  }

  if (interactive?.type === "flap" && open) {
    const angle = (interactive.maxOpenAngleDeg ?? 75) * DEG;
    group = {
      position: [position[0], position[1], position[2]],
      rotationX: -angle,
      rotationY: 0
    };
  }

  const edgeEntries = qualityMode === "work"
    ? []
    : Object.entries(part.edgeBanding ?? {}).filter(([edge]) => qualityMode === "realistic" ? edge === "front" : true);

  return (
    <mesh
      position={group.position}
      raycast={partSelectable ? undefined : () => null}
      userData={{ instanceId: part.moduleId, partId: part.id, role: part.role, hasPartListener: partSelectable, grainDirection: part.grainDirection ?? material.grain, hardwareId: part.hardwareId ?? null }}
      rotation={[group.rotationX + part.rotationDeg.x * DEG, group.rotationY + part.rotationDeg.y * DEG, part.rotationDeg.z * DEG]}
      castShadow={castShadow}
      receiveShadow={castShadow}
      onClick={partSelectable ? (event) => {
        event.stopPropagation();
        onSelect();
        if (event.detail === 2 && part.groupId) onToggleOpen();
      } : undefined}
    >
      {part.role === "hardware" && part.hardwareGeometry && part.hardwareGeometry.kind !== "box" ? (
        <HardwareVisual part={part} material={material} size={size} />
      ) : qualityMode !== "work" && exposed ? (
        <RoundedBox args={size} radius={Math.min(0.004, Math.min(...size) / 8)} smoothness={2}>
          <meshPhysicalMaterial
            color={material.baseColor}
            map={textures.map}
            normalMap={textures.normalMap}
            normalScale={[material.normalScale, material.normalScale]}
            bumpMap={textures.bumpMap}
            bumpScale={material.bumpScale ?? (material.finish === "textured" ? 0.08 : 0)}
            roughnessMap={textures.roughnessMap}
            metalnessMap={textures.metalnessMap}
            aoMap={textures.aoMap}
            displacementMap={textures.displacementMap}
            displacementScale={material.maps?.heightUrl ? 0.004 : 0}
            roughness={material.roughness}
            metalness={material.metalness}
            clearcoat={material.clearcoat ?? 0}
            clearcoatRoughness={material.clearcoatRoughness ?? 0.25}
            transparent={transparent}
            opacity={opacity}
            depthWrite={!transparent}
          />
        </RoundedBox>
      ) : (
        <>
          <boxGeometry args={size} />
          {qualityMode === "work" ? (
            <meshStandardMaterial color={material.baseColor} roughness={Math.max(material.roughness, 0.55)} metalness={Math.min(material.metalness, 0.35)} transparent={transparent} opacity={opacity} depthWrite={!transparent} />
          ) : (
            <meshPhysicalMaterial
              color={material.baseColor}
              map={textures.map}
              normalMap={textures.normalMap}
              normalScale={[material.normalScale, material.normalScale]}
              bumpMap={textures.bumpMap}
              bumpScale={material.bumpScale ?? (material.finish === "textured" ? 0.08 : 0)}
              roughness={material.roughness}
              metalness={material.metalness}
              clearcoat={material.clearcoat ?? 0}
              clearcoatRoughness={material.clearcoatRoughness ?? 0.25}
              transparent={transparent}
              opacity={opacity}
              depthWrite={!transparent}
            />
          )}
        </>
      )}
      {edgeEntries.map(([edge, materialId]) => (
        <EdgeBandMesh key={`${part.id}:${edge}`} edge={edge} materialId={materialId} size={size} instanceId={instanceId} />
      ))}
      {selected && <Edges color="#7c6cff" scale={1.02} />}
    </mesh>
  );
}

function DragPreviewGroup({ preview }: { preview: { moduleId: string; positionMm: { x: number; y: number; z: number }; valid: boolean } }) {
  const definition = ModuleRegistry.get(preview.moduleId);
  if (!definition) return null;
  const roomWidthMm = useRoomBuilderStore((s) => s.width);
  const roomDepthMm = useRoomBuilderStore((s) => s.depth);
  const roomHeightMm = useRoomBuilderStore((s) => s.height);
  const size: [number, number, number] = [
    mmToScene(definition.defaultDimensionsMm.width),
    mmToScene(definition.defaultDimensionsMm.height),
    mmToScene(definition.defaultDimensionsMm.depth),
  ];
  const guideColor = preview.valid ? "#35d07f" : "#ef4444";
  const guideY = Math.max(0.01, mmToScene(preview.positionMm.y));
  return (
    <group>
      <mesh
        position={[mmToScene(preview.positionMm.x), mmToScene(preview.positionMm.y + definition.defaultDimensionsMm.height / 2), mmToScene(preview.positionMm.z)]}
        userData={{ dragPreview: true, moduleId: preview.moduleId }}
      >
        <boxGeometry args={size} />
        <meshBasicMaterial color={guideColor} transparent opacity={0.24} wireframe />
      </mesh>
      <mesh position={[0, guideY, mmToScene(preview.positionMm.z)]} userData={{ snapGuide: "floor-line" }}>
        <boxGeometry args={[mmToScene(roomWidthMm), 0.006, 0.012]} />
        <meshBasicMaterial color={guideColor} transparent opacity={0.72} />
      </mesh>
      <mesh position={[mmToScene(preview.positionMm.x), mmToScene(roomHeightMm / 2), -mmToScene(roomDepthMm / 2) + 0.006]} userData={{ snapGuide: "back-wall-line" }}>
        <boxGeometry args={[0.012, mmToScene(roomHeightMm), 0.012]} />
        <meshBasicMaterial color={guideColor} transparent opacity={0.72} />
      </mesh>
    </group>
  );
}

function InstanceGroup({ instance }: { instance: FurnitureInstance }) {
  const toolMode = usePlannerStore((s) => s.toolMode);
  const [renderCapture, setRenderCapture] = useState(false);
  const selectFurnitureInstance = usePlannerStore((s) => s.selectFurnitureInstance);
  const toggleInstanceAnimation = usePlannerStore((s) => s.toggleInstanceAnimation);
  const updateFurnitureInstance = usePlannerStore((s) => s.updateFurnitureInstance);
  const transformRef = useRef<THREE.Group>(null);
  const lastValidTransform = useRef({ position: new THREE.Vector3(), rotation: new THREE.Euler() });
  const openStates = useImmersiveStore((s) => s.openStates);
  const hiddenObjects = useImmersiveStore((s) => s.hiddenObjects);
  const occlusionMode = useImmersiveStore((s) => s.occlusionMode);
  const selectPart = useImmersiveStore((s) => s.selectPart);
  const selectedPart = useImmersiveStore((s) => s.selectedPart);
  const presentationCapture = usePresentationCapture();
  useEffect(() => {
    const hide = () => setRenderCapture(true);
    const show = () => setRenderCapture(false);
    window.addEventListener("dioris:render-hide-editor", hide);
    window.addEventListener("dioris:render-show-editor", show);
    return () => {
      window.removeEventListener("dioris:render-hide-editor", hide);
      window.removeEventListener("dioris:render-show-editor", show);
    };
  }, []);
  const openingAnchors = useMemo(() => {
    const anchors = new Map<string, PartDefinition>();
    for (const part of instance.parts) {
      if (part.groupId && part.interactive && !anchors.has(part.groupId)) anchors.set(part.groupId, part);
    }
    return anchors;
  }, [instance.parts]);
  const staticHardwareBatches = useMemo(() => {
    const batches = new Map<string, PartDefinition[]>();
    for (const part of instance.parts) {
      if (part.role !== "hardware" || part.groupId) continue;
      const key = [part.materialId, part.dimensionsMm.width, part.dimensionsMm.height, part.dimensionsMm.depth].join("|");
      const batch = batches.get(key) ?? [];
      batch.push(part);
      batches.set(key, batch);
    }
    return [...batches.values()];
  }, [instance.parts]);

  if (!instance.visible || hiddenObjects[instance.id]) return null;

  const isolate = instance.isIsolated || occlusionMode === "isolate";
  if (isolate && !instance.selected) return null;

  const selectPartForInstance = (part: PartDefinition) => {
    selectFurnitureInstance(instance.id);
    selectPart(part.id);
  };

  const rememberValidTransform = () => {
    const object = transformRef.current;
    if (!object) return;
    lastValidTransform.current.position.copy(object.position);
    lastValidTransform.current.rotation.copy(object.rotation);
  };

  const commitDirectTransform = () => {
    const object = transformRef.current;
    if (!object) return;
    const accepted = updateFurnitureInstance(instance.id, {
      positionMm: {
        x: Math.round(mToMm(object.position.x)),
        y: Math.max(0, Math.round(mToMm(object.position.y))),
        z: Math.round(mToMm(object.position.z)),
      },
      rotationDeg: {
        x: Math.round(object.rotation.x / DEG),
        y: Math.round(object.rotation.y / DEG),
        z: Math.round(object.rotation.z / DEG),
      },
    });
    if (accepted) {
      rememberValidTransform();
    } else {
      object.position.copy(lastValidTransform.current.position);
      object.rotation.copy(lastValidTransform.current.rotation);
    }
  };

  const group = (
    <group
      ref={transformRef}
      userData={{ instanceId: instance.id, partCount: instance.parts.length }}
      position={[
        mmToScene(instance.positionMm.x),
        mmToScene(instance.positionMm.y),
        mmToScene(instance.positionMm.z)
      ]}
      rotation={[
        instance.rotationDeg.x * DEG,
        instance.rotationDeg.y * DEG,
        instance.rotationDeg.z * DEG
      ]}
      onClick={(event) => {
        event.stopPropagation();
        selectFurnitureInstance(instance.id);
        selectPart(instance.id);
      }}
    >
      {staticHardwareBatches.map((parts) => (
        <StaticHardwareBatch key={`${parts[0].materialId}:${parts[0].dimensionsMm.width}:${parts[0].dimensionsMm.height}:${parts[0].dimensionsMm.depth}`} parts={parts} instanceId={instance.id} />
      ))}
      {instance.parts.filter((part) => !(part.role === "hardware" && !part.groupId)).map((part) => (
          <PartMesh
          key={part.id}
          part={part}
          motionPart={part.groupId ? openingAnchors.get(part.groupId) : undefined}
          open={Boolean(instance.isOpen || (part.groupId && (openStates[part.groupId] || instance.openStates?.[part.groupId])))}
          selected={instance.selected && selectedPart === part.id && !presentationCapture}
          xray={instance.isXRay || (occlusionMode === "xray" && !instance.selected)}
          onSelect={() => selectPartForInstance(part)}
          onToggleOpen={() => part.groupId && toggleInstanceAnimation(instance.id, part.groupId)}
          instanceId={instance.id}
        />
      ))}
    </group>
  );

  return instance.selected && !renderCapture && !presentationCapture ? (
    <TransformControls
      mode={toolMode === "rotate" ? "rotate" : "translate"}
      onMouseDown={rememberValidTransform}
      onMouseUp={commitDirectTransform}
    >
      {group}
    </TransformControls>
  ) : group;
}

export function LibraryPartsRenderer() {
  const instances = usePlannerStore((s) => s.instances);
  const dragPreview = usePlannerStore((s) => s.dragPreview);
  const presentationCapture = usePresentationCapture();
  return (
    <group userData={{ renderLayer: "SCENE_CONTENT", contentType: "kitchen-furniture" }}>

      {instances.map((instance) => (
        <InstanceGroup key={instance.id} instance={instance} />
      ))}
      {dragPreview && !presentationCapture && <DragPreviewGroup preview={dragPreview} />}
    </group>
  );
}
