import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { FurnitureItem, FurnitureMaterial } from "../types";
import { buildCabinet } from "./build";
import { MATERIALS } from "../defaults";
import { PartBox } from "./types";
import { getMaterial } from "../../scene/Materials";
import { mmToScene } from "../../core/units";

interface BaseCabinetMeshProps {
  item: FurnitureItem;
  onSelect: (id: string) => void;
}

export const BaseCabinetMesh: React.FC<BaseCabinetMeshProps> = ({ item, onSelect }) => {
  const assembly = useMemo(() => buildCabinet(item), [item]);
  const frontsRef = useRef<THREE.Group>(null);

  // Reusable materials
  const bodyMaterial = useMemo(() => {
    return getMaterial(
      item.parameters.bodyMaterialId === "white-matte"
        ? "mdf_white"
        : item.parameters.bodyMaterialId === "graphite"
          ? "mdf_graphite"
          : "mdf_taupe",
    );
  }, [item.parameters.bodyMaterialId]);

  const frontMaterial = useMemo(() => {
    return getMaterial(
      item.parameters.frontMaterialId === "white-matte"
        ? "mdf_white"
        : item.parameters.frontMaterialId === "graphite"
          ? "mdf_graphite"
          : "mdf_taupe",
    );
  }, [item.parameters.frontMaterialId]);

  const selectedMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#8B5CF6", transparent: true, opacity: 0.3 }),
    [],
  );

  // Smooth animation for doors/drawers
  const useFrameSafe = typeof window !== "undefined" ? useFrame : () => {};
  useFrameSafe(() => {
    if (!frontsRef.current) return;

    assembly.parts.forEach((part: PartBox, index: number) => {
      if (!part.isAnimated) return;

      const mesh = frontsRef.current?.children[index] as THREE.Mesh;
      if (!mesh) return;

      if (part.animationType === "hinge") {
        const targetAngle = item.isOpen ? -Math.PI * 0.6 : 0;
        mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, targetAngle, 0.1);
      } else if (part.animationType === "slide") {
        const targetZ = item.isOpen ? item.depthMm * 0.7 : 0;
        const currentZ = mesh.position.z * 1000;
        const newZ = THREE.MathUtils.lerp(currentZ, part.position.z + targetZ, 0.1);
        mesh.position.z = mmToScene(newZ);
      }
    });
  });

  return (
    <group
      position={[
        mmToScene(item.position.x),
        mmToScene(item.position.y),
        mmToScene(item.position.z),
      ]}
      rotation={[0, item.rotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item.id);
      }}
    >
      {/* Body Group */}
      <group>
        {assembly.parts.map(
          (part: PartBox) =>
            part.materialType === "body" && (
              <mesh
                key={part.id}
                position={[
                  mmToScene(part.position.x) - mmToScene(item.widthMm) / 2,
                  mmToScene(part.position.y),
                  mmToScene(part.position.z),
                ]}
              >
                <boxGeometry
                  args={[mmToScene(part.width), mmToScene(part.height), mmToScene(part.depth)]}
                />
                <primitive object={bodyMaterial} attach="material" />
              </mesh>
            ),
        )}
      </group>

      {/* Fronts Group for Animation */}
      <group ref={frontsRef}>
        {assembly.parts.map(
          (part: PartBox) =>
            part.materialType === "front" && (
              <mesh
                key={part.id}
                position={[
                  mmToScene(part.position.x) - mmToScene(item.widthMm) / 2,
                  mmToScene(part.position.y),
                  mmToScene(part.position.z),
                ]}
              >
                <boxGeometry
                  args={[mmToScene(part.width), mmToScene(part.height), mmToScene(part.depth)]}
                />
                <primitive object={frontMaterial} attach="material" />

                {/* Simple Handle Placeholder */}
                {item.parameters.handleType === "simple" && (
                  <mesh
                    position={[0, mmToScene(part.height) / 4, mmToScene(part.depth) / 2 + 0.01]}
                  >
                    <boxGeometry args={[0.1, 0.02, 0.02]} />
                    <meshStandardMaterial color="silver" />
                  </mesh>
                )}
              </mesh>
            ),
        )}
      </group>

      {/* Selection Highlight */}
      {item.selected && (
        <mesh position={[0, mmToScene(item.heightMm + item.parameters.kickplateHeightMm) / 2, 0]}>
          <boxGeometry
            args={[
              mmToScene(item.widthMm) + 0.02,
              mmToScene(item.heightMm + item.parameters.kickplateHeightMm) + 0.02,
              mmToScene(item.depthMm) + 0.02,
            ]}
          />
          <primitive object={selectedMaterial} attach="material" />
        </mesh>
      )}
    </group>
  );
};
