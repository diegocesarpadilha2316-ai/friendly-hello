import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { FurnitureItem, FurnitureMaterial } from '../types';
import { buildCabinet } from './build';
import { MATERIALS } from '../defaults';
import { PartBox } from './types';

interface BaseCabinetMeshProps {
  item: FurnitureItem;
  onSelect: (id: string) => void;
}

export const BaseCabinetMesh: React.FC<BaseCabinetMeshProps> = ({ item, onSelect }) => {
  const assembly = useMemo(() => buildCabinet(item), [item]);
  const frontsRef = useRef<THREE.Group>(null);

  // Reusable materials
  const bodyMaterial = useMemo(() => {
    const config = (MATERIALS.find(m => m.id === item.parameters.bodyMaterialId) || MATERIALS[0]) as FurnitureMaterial;
    return new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.7 });
  }, [item.parameters.bodyMaterialId]);

  const frontMaterial = useMemo(() => {
    const config = (MATERIALS.find(m => m.id === item.parameters.frontMaterialId) || MATERIALS[0]) as FurnitureMaterial;
    return new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.5 });
  }, [item.parameters.frontMaterialId]);

  const selectedMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({ color: '#8B5CF6', transparent: true, opacity: 0.3 }), []);

  // Smooth animation for doors/drawers
  const useFrameSafe = typeof window !== "undefined" ? useFrame : () => {};
  useFrameSafe(() => {
    if (!frontsRef.current) return;
    
    assembly.parts.forEach((part: PartBox, index: number) => {
      if (!part.isAnimated) return;
      
      const mesh = frontsRef.current?.children[index] as THREE.Mesh;
      if (!mesh) return;

      if (part.animationType === 'hinge') {
        const targetAngle = item.isOpen ? -Math.PI * 0.6 : 0;
        mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, targetAngle, 0.1);
      } else if (part.animationType === 'slide') {
        const targetZ = item.isOpen ? (item.depthMm * 0.7) : 0;
        const currentZ = mesh.position.z * 1000; // back to mm for easier comparison
        const newZ = THREE.MathUtils.lerp(currentZ, part.position.z + targetZ, 0.1);
        mesh.position.z = newZ / 1000;
      }
    });
  });

  return (
    <group 
      position={[item.position.x / 1000, item.position.y / 1000, item.position.z / 1000]}
      rotation={[0, item.rotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item.id);
      }}
    >
      {/* Body Group */}
      <group>
        {assembly.parts.map((part: PartBox) => (
          part.materialType === 'body' && (
            <mesh 
              key={part.id}
              position={[part.position.x / 1000 - item.widthMm / 2000, part.position.y / 1000, part.position.z / 1000]}
            >
              <boxGeometry args={[part.width / 1000, part.height / 1000, part.depth / 1000]} />
              <primitive object={bodyMaterial} attach="material" />
            </mesh>
          )
        ))}
      </group>

      {/* Fronts Group for Animation */}
      <group ref={frontsRef}>
        {assembly.parts.map((part: PartBox) => (
          part.materialType === 'front' && (
            <mesh 
              key={part.id}
              position={[part.position.x / 1000 - item.widthMm / 2000, part.position.y / 1000, part.position.z / 1000]}
            >
              <boxGeometry args={[part.width / 1000, part.height / 1000, part.depth / 1000]} />
              <primitive object={frontMaterial} attach="material" />
              
              {/* Simple Handle Placeholder */}
              {item.parameters.handleType === 'simple' && (
                <mesh position={[0, part.height / 4000, part.depth / 2000 + 0.01]}>
                  <boxGeometry args={[0.1, 0.02, 0.02]} />
                  <meshStandardMaterial color="silver" />
                </mesh>
              )}
            </mesh>
          )
        ))}
      </group>

      {/* Selection Highlight */}
      {item.selected && (
        <mesh position={[0, (item.heightMm + item.parameters.kickplateHeightMm) / 2000, 0]}>
          <boxGeometry args={[item.widthMm / 1000 + 0.02, (item.heightMm + item.parameters.kickplateHeightMm) / 1000 + 0.02, item.depthMm / 1000 + 0.02]} />
          <primitive object={selectedMaterial} attach="material" />
        </mesh>
      )}
    </group>
  );
};
