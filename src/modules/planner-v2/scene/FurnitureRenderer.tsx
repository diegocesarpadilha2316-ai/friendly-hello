import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { FurnitureItem } from '../types';
import { buildCabinet } from './build';
import { MATERIALS } from '../defaults';

interface BaseCabinetMeshProps {
  item: FurnitureItem;
  onSelect: (id: string) => void;
}

export const BaseCabinetMesh: React.FC<BaseCabinetMeshProps> = ({ item, onSelect }) => {
  const assembly = useMemo(() => buildCabinet(item), [item]);
  const groupRef = useRef<THREE.Group>(null);
  const frontsRef = useRef<THREE.Group>(null);

  // Reusable materials
  const bodyMaterial = useMemo(() => {
    const config = MATERIALS.find(m => m.id === item.parameters.bodyMaterialId) || MATERIALS[0];
    return new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.7 });
  }, [item.parameters.bodyMaterialId]);

  const frontMaterial = useMemo(() => {
    const config = MATERIALS.find(m => m.id === item.parameters.frontMaterialId) || MATERIALS[0];
    return new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.5 });
  }, [item.parameters.frontMaterialId]);

  const selectedMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({ color: '#8B5CF6', transparent: true, opacity: 0.3 }), []);

  // Smooth animation for doors/drawers
  useFrame((state, delta) => {
    if (!frontsRef.current) return;
    
    const target = item.isOpen ? 1 : 0;
    const current = item.openAmount;
    
    // We update visual state based on item.openAmount if we want it to be part of the store
    // For now let's just use a simple Lerp for the parts that are animated
    assembly.parts.forEach((part, index) => {
      if (!part.isAnimated) return;
      
      const mesh = frontsRef.current?.children[index] as THREE.Mesh;
      if (!mesh) return;

      if (part.animationType === 'hinge') {
        const targetAngle = item.isOpen ? -Math.PI / 2 : 0;
        mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, targetAngle, 0.1);
      } else if (part.animationType === 'slide') {
        const targetZ = item.isOpen ? part.depth * 0.8 : 0;
        mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, part.position.z + targetZ, 0.1);
      }
    });
  });

  return (
    <group 
      ref={groupRef}
      position={[item.position.x / 1000, item.position.y / 1000, item.position.z / 1000]}
      rotation={[0, item.rotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item.id);
      }}
    >
      {/* Body Parts */}
      {assembly.parts.map((part) => (
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

      {/* Fronts Group for Animation */}
      <group ref={frontsRef}>
        {assembly.parts.map((part) => (
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
        <mesh position={[0, item.heightMm / 2000 + item.parameters.kickplateHeightMm / 2000, 0]}>
          <boxGeometry args={[item.widthMm / 1000 + 0.01, (item.heightMm + item.parameters.kickplateHeightMm) / 1000 + 0.01, item.depthMm / 1000 + 0.01]} />
          <primitive object={selectedMaterial} attach="material" />
        </mesh>
      )}
    </group>
  );
};
