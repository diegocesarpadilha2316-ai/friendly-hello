import { Edges } from "@react-three/drei";
import { useMemo } from "react";
import type { FurnitureInstance } from "../../library/contracts/FurnitureInstance";
import type { PartDefinition } from "../../library/contracts/PartDefinition";
import { resolveMaterial } from "../../library/services/resolveMaterial";
import { mmToScene } from "../../core/units";
import { usePlannerStore } from "../state/usePlannerStore";
import { useImmersiveStore } from "../state/useImmersiveStore";

const DEG = Math.PI / 180;

function PartMesh({
  part,
  open,
  selected,
  xray
}: {
  part: PartDefinition;
  open: boolean;
  selected: boolean;
  xray: boolean;
}) {
  const material = useMemo(() => resolveMaterial(part.materialId), [part.materialId]);
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

  const interactive = part.interactive;
  let group = { position, rotationY: 0 };

  if (interactive?.type === "drawer" && open) {
    group = {
      position: [position[0], position[1], position[2] + mmToScene(interactive.maxTravelMm ?? 0)],
      rotationY: 0
    };
  }

  if (interactive?.type === "door" && open) {
    const angle = (interactive.maxOpenAngleDeg ?? 90) * DEG;
    const sign = interactive.hingeSide === "left" ? 1 : -1;
    const halfWidth = size[0] / 2;
    const hingeX = position[0] - sign * halfWidth;
    const dx = sign * halfWidth * Math.cos(angle);
    const dz = halfWidth * Math.sin(angle);
    group = {
      position: [hingeX + dx, position[1], position[2] + dz],
      rotationY: -sign * angle
    };
  }

  const transparent = xray || material.transparent;
  const opacity = xray ? 0.22 : material.opacity ?? 1;

  return (
    <mesh
      position={group.position}
      rotation={[part.rotationDeg.x * DEG, group.rotationY + part.rotationDeg.y * DEG, part.rotationDeg.z * DEG]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={material.baseColor}
        roughness={material.roughness}
        metalness={material.metalness}
        transparent={transparent}
        opacity={opacity}
        depthWrite={!transparent}
      />
      {selected && <Edges color="#7c6cff" scale={1.02} />}
    </mesh>
  );
}

function InstanceGroup({ instance }: { instance: FurnitureInstance }) {
  const selectFurnitureInstance = usePlannerStore((s) => s.selectFurnitureInstance);
  const openStates = useImmersiveStore((s) => s.openStates);
  const occlusionMode = useImmersiveStore((s) => s.occlusionMode);
  const selectPart = useImmersiveStore((s) => s.selectPart);
  const toggleOpen = useImmersiveStore((s) => s.toggleOpen);

  if (!instance.visible) return null;

  const isolate = occlusionMode === "isolate";
  if (isolate && !instance.selected) return null;

  return (
    <group
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
        const part = instance.parts.find((candidate) => candidate.groupId);
        if (event.detail === 2 && part?.groupId) toggleOpen(part.groupId);
      }}
    >
      {instance.parts.map((part) => (
        <PartMesh
          key={part.id}
          part={part}
          open={Boolean(part.groupId && openStates[part.groupId])}
          selected={instance.selected}
          xray={occlusionMode === "xray" && !instance.selected}
        />
      ))}
    </group>
  );
}

export function LibraryPartsRenderer() {
  const instances = usePlannerStore((s) => s.instances);
  return (
    <group>
      {instances.map((instance) => (
        <InstanceGroup key={instance.id} instance={instance} />
      ))}
    </group>
  );
}