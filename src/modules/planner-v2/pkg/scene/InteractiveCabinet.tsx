import { Edges, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useImmersiveStore } from "../state/useImmersiveStore";

interface CabinetProps {
  id: string;
  name: string;
  position: [number, number, number];
  width: number;
  height: number;
  depth: number;
  type: "base" | "upper" | "tower";
  woodMap: THREE.Texture;
}

function Panel({
  size,
  position,
  material,
  selected = false
}: {
  size: [number, number, number];
  position: [number, number, number];
  material: THREE.Material;
  selected?: boolean;
}) {
  return (
    <mesh position={position} castShadow receiveShadow material={material}>
      <boxGeometry args={size} />
      {selected && <Edges color="#8b78ff" scale={1.01} />}
    </mesh>
  );
}

function HingedDoor({
  id,
  width,
  height,
  depth,
  x,
  hinge,
  material
}: {
  id: string;
  width: number;
  height: number;
  depth: number;
  x: number;
  hinge: "left" | "right";
  material: THREE.Material;
}) {
  const open = useImmersiveStore((s) => Boolean(s.openStates[id]));
  const toggleOpen = useImmersiveStore((s) => s.toggleOpen);
  const selectPart = useImmersiveStore((s) => s.selectPart);
  const selected = useImmersiveStore((s) => s.selectedPart === id);
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!group.current) return;
    const target = open ? (hinge === "left" ? -Math.PI * 0.57 : Math.PI * 0.57) : 0;
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      target,
      7.5,
      delta
    );
  });

  const pivotX = x + (hinge === "left" ? -width / 2 : width / 2);
  const doorCenterX = hinge === "left" ? width / 2 : -width / 2;

  return (
    <group
      ref={group}
      position={[pivotX, 0, depth / 2 + 0.015]}
      onClick={(event) => {
        event.stopPropagation();
        selectPart(id);
        toggleOpen(id);
      }}
    >
      <mesh position={[doorCenterX, 0, 0]} castShadow receiveShadow material={material}>
        <boxGeometry args={[width - 0.012, height - 0.012, 0.022]} />
        {selected && <Edges color="#8b78ff" scale={1.02} />}
      </mesh>

      <mesh position={[hinge === "left" ? width - 0.04 : -width + 0.04, 0, 0.028]}>
        <boxGeometry args={[0.018, height * 0.52, 0.018]} />
        <meshStandardMaterial color="#151515" metalness={0.75} roughness={0.22} />
      </mesh>

      <mesh position={[hinge === "left" ? 0.04 : -0.04, height * 0.22, -0.012]}>
        <cylinderGeometry args={[0.018, 0.018, 0.045, 18]} />
        <meshStandardMaterial color="#b9b9b9" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[hinge === "left" ? 0.04 : -0.04, -height * 0.22, -0.012]}>
        <cylinderGeometry args={[0.018, 0.018, 0.045, 18]} />
        <meshStandardMaterial color="#b9b9b9" metalness={0.85} roughness={0.2} />
      </mesh>
    </group>
  );
}

function Drawer({
  id,
  width,
  height,
  depth,
  y,
  material
}: {
  id: string;
  width: number;
  height: number;
  depth: number;
  y: number;
  material: THREE.Material;
}) {
  const open = useImmersiveStore((s) => Boolean(s.openStates[id]));
  const toggleOpen = useImmersiveStore((s) => s.toggleOpen);
  const selectPart = useImmersiveStore((s) => s.selectPart);
  const selected = useImmersiveStore((s) => s.selectedPart === id);
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!group.current) return;
    const target = open ? depth * 0.82 : 0;
    group.current.position.z = THREE.MathUtils.damp(
      group.current.position.z,
      target,
      7,
      delta
    );
  });

  return (
    <group
      ref={group}
      position={[0, y, depth / 2]}
      onClick={(event) => {
        event.stopPropagation();
        selectPart(id);
        toggleOpen(id);
      }}
    >
      <mesh position={[0, 0, 0.015]} castShadow receiveShadow material={material}>
        <boxGeometry args={[width - 0.016, height - 0.014, 0.026]} />
        {selected && <Edges color="#8b78ff" scale={1.02} />}
      </mesh>

      <mesh position={[0, -height * 0.34, -depth * 0.42]} castShadow receiveShadow>
        <boxGeometry args={[width - 0.08, 0.018, depth - 0.12]} />
        <meshStandardMaterial color="#c9bca9" roughness={0.58} />
      </mesh>

      <mesh position={[-width / 2 + 0.05, 0, -depth * 0.42]} castShadow>
        <boxGeometry args={[0.018, height * 0.64, depth - 0.12]} />
        <meshStandardMaterial color="#c9bca9" roughness={0.58} />
      </mesh>
      <mesh position={[width / 2 - 0.05, 0, -depth * 0.42]} castShadow>
        <boxGeometry args={[0.018, height * 0.64, depth - 0.12]} />
        <meshStandardMaterial color="#c9bca9" roughness={0.58} />
      </mesh>

      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[width * 0.28, 0.018, 0.018]} />
        <meshStandardMaterial color="#171717" metalness={0.76} roughness={0.2} />
      </mesh>
    </group>
  );
}

export function InteractiveCabinet(props: CabinetProps) {
  const selectedPart = useImmersiveStore((s) => s.selectedPart);
  const selectPart = useImmersiveStore((s) => s.selectPart);
  const hidden = useImmersiveStore((s) => Boolean(s.hiddenObjects[props.id]));
  const occlusionMode = useImmersiveStore((s) => s.occlusionMode);
  const selectedBelongs = selectedPart === props.id || Boolean(selectedPart?.startsWith(`${props.id}-`));
  const xrayOpacity = occlusionMode === "xray" && selectedPart && !selectedBelongs ? 0.16 : 1;

  if (hidden) return null;
  if (occlusionMode === "isolate" && selectedPart && !selectedBelongs) return null;

  const carcassMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({ map: props.woodMap, color: "#b3835c", roughness: 0.34, metalness: 0.01, clearcoat: 0.12, clearcoatRoughness: 0.3, transparent: xrayOpacity < 1, opacity: xrayOpacity, depthWrite: xrayOpacity >= 1 }),
    [props.woodMap, xrayOpacity]
  );

  const frontMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({ map: props.woodMap, color: props.type === "tower" ? "#956340" : "#b88b65", roughness: 0.29, metalness: 0.01, clearcoat: 0.18, clearcoatRoughness: 0.35, transparent: xrayOpacity < 1, opacity: xrayOpacity, depthWrite: xrayOpacity >= 1 }),
    [props.type, props.woodMap, xrayOpacity]
  );

  const thickness = 0.018;
  const insideWidth = props.width - thickness * 2;
  const selected = selectedPart === props.id;

  return (
    <group
      position={props.position}
      onClick={(event) => {
        event.stopPropagation();
        selectPart(props.id);
      }}
    >
      <Panel
        size={[thickness, props.height, props.depth]}
        position={[-props.width / 2 + thickness / 2, 0, 0]}
        material={carcassMaterial}
        selected={selected}
      />
      <Panel
        size={[thickness, props.height, props.depth]}
        position={[props.width / 2 - thickness / 2, 0, 0]}
        material={carcassMaterial}
        selected={selected}
      />
      <Panel
        size={[insideWidth, thickness, props.depth]}
        position={[0, -props.height / 2 + thickness / 2, 0]}
        material={carcassMaterial}
      />
      <Panel
        size={[insideWidth, thickness, props.depth]}
        position={[0, props.height / 2 - thickness / 2, 0]}
        material={carcassMaterial}
      />
      <Panel
        size={[insideWidth, props.height - thickness * 2, 0.006]}
        position={[0, 0, -props.depth / 2 + 0.006]}
        material={carcassMaterial}
      />

      {/* Shelves */}
      {(props.type === "upper" ? [-0.16, 0.16] : props.type === "tower" ? [-0.62, 0.05, 0.72] : [0.05]).map(
        (ratio, index) => (
          <Panel
            key={index}
            size={[insideWidth - 0.02, thickness, props.depth - 0.04]}
            position={[0, ratio * props.height, -0.01]}
            material={carcassMaterial}
          />
        )
      )}

      {/* Hinges */}
      {[-0.28, 0.28].map((ratio) => (
        <mesh
          key={ratio}
          position={[-props.width / 2 + 0.035, ratio * props.height, props.depth / 2 - 0.02]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.022, 0.022, 0.04, 18]} />
          <meshStandardMaterial color="#b9b9b9" metalness={0.88} roughness={0.2} />
        </mesh>
      ))}

      {props.type === "base" ? (
        <>
          <Drawer
            id={`${props.id}-drawer-1`}
            width={insideWidth}
            height={props.height * 0.28}
            depth={props.depth}
            y={props.height * 0.31}
            material={frontMaterial}
          />
          <Drawer
            id={`${props.id}-drawer-2`}
            width={insideWidth}
            height={props.height * 0.28}
            depth={props.depth}
            y={0}
            material={frontMaterial}
          />
          <Drawer
            id={`${props.id}-drawer-3`}
            width={insideWidth}
            height={props.height * 0.28}
            depth={props.depth}
            y={-props.height * 0.31}
            material={frontMaterial}
          />
        </>
      ) : (
        <>
          <HingedDoor
            id={`${props.id}-left-door`}
            width={props.width / 2}
            height={props.height}
            depth={props.depth}
            x={-props.width / 4}
            hinge="left"
            material={frontMaterial}
          />
          <HingedDoor
            id={`${props.id}-right-door`}
            width={props.width / 2}
            height={props.height}
            depth={props.depth}
            x={props.width / 4}
            hinge="right"
            material={frontMaterial}
          />
        </>
      )}
    </group>
  );
}
