import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RoomResult, WallGeometry } from '../room/types';
import { MATERIALS } from './Materials';

interface WallMeshProps {
  wall: WallGeometry;
  mode: 'technical' | 'presentation';
}

const WallMesh: React.FC<WallMeshProps & { visible?: boolean }> = ({ wall, mode, visible = true }) => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-wall.width / 2, -wall.height / 2);
    shape.lineTo(wall.width / 2, -wall.height / 2);
    shape.lineTo(wall.width / 2, wall.height / 2);
    shape.lineTo(-wall.width / 2, wall.height / 2);
    shape.lineTo(-wall.width / 2, -wall.height / 2);

    wall.openings.forEach((op) => {
      const hole = new THREE.Path();
      const x = op.x - wall.width / 2;
      const y = op.y - wall.height / 2;
      hole.moveTo(x, y);
      hole.lineTo(x + op.width, y);
      hole.lineTo(x + op.width, y + op.height);
      hole.lineTo(x, y + op.height);
      hole.lineTo(x, y);
      shape.holes.push(hole);
    });

    return new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: wall.thickness,
      bevelEnabled: false,
    });
  }, [wall]);

  if (!visible) return null;

  return (
    <group position={wall.position} rotation={wall.rotation}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <primitive 
          object={mode === 'technical' ? new THREE.MeshStandardMaterial({ color: '#f0f0f0', roughness: 0.9 }) : MATERIALS.wall} 
          attach="material" 
        />
      </mesh>
    </group>
  );
};

// Realistic Door with frame and leaf
const DoorMesh: React.FC<{ wall: WallGeometry; opening: { x: number; width: number; height: number } }> = ({ wall, opening }) => {
  const x = opening.x - wall.width / 2 + opening.width / 2;
  const y = opening.height / 2 - wall.height / 2;
  
  return (
    <group position={wall.position} rotation={wall.rotation}>
      <group position={[x, y, wall.thickness / 2]}>
        {/* Frame */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[opening.width + 0.1, opening.height + 0.05, 0.08]} />
          <primitive object={MATERIALS.mdf_white} attach="material" />
        </mesh>
        {/* Door Leaf */}
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[opening.width - 0.02, opening.height - 0.02, 0.04]} />
          <primitive object={MATERIALS.mdf_white} attach="material" />
        </mesh>
        {/* Handle Placeholder */}
        <mesh position={[opening.width / 2 - 0.1, 0, 0.05]}>
          <boxGeometry args={[0.02, 0.15, 0.02]} />
          <primitive object={MATERIALS.metal_black} attach="material" />
        </mesh>
      </group>
    </group>
  );
};

// Realistic Window with frame and glass
const WindowMesh: React.FC<{ wall: WallGeometry; opening: { x: number; y: number; width: number; height: number } }> = ({ wall, opening }) => {
  const x = opening.x - wall.width / 2 + opening.width / 2;
  const y = opening.y - wall.height / 2 + opening.height / 2;
  
  return (
    <group position={wall.position} rotation={wall.rotation}>
      <group position={[x, y, wall.thickness / 2]}>
        {/* Frame */}
        <mesh>
          <boxGeometry args={[opening.width + 0.05, opening.height + 0.05, 0.06]} />
          <primitive object={MATERIALS.metal_black} attach="material" />
        </mesh>
        {/* Glass */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[opening.width - 0.05, opening.height - 0.05, 0.01]} />
          <primitive object={MATERIALS.glass} attach="material" />
        </mesh>
      </group>
    </group>
  );
};

interface RoomRendererProps {
  result: RoomResult;
  mode: 'technical' | 'presentation';
  showCeiling?: boolean;
  showBaseboard?: boolean;
  baseboardHeight: number;
  baseboardThickness: number;
}

export const RoomRenderer: React.FC<RoomRendererProps> = ({ 
  result, 
  mode,
  showCeiling = true,
  showBaseboard = true,
  baseboardHeight,
  baseboardThickness
}) => {
  const { floor, ceiling, walls, baseboards } = result;

  const floorMaterial = useMemo(() => {
    if (mode === 'technical') return new THREE.MeshStandardMaterial({ color: '#d1c7bc', roughness: 0.7 });
    return MATERIALS.floor_porcelain;
  }, [mode]);

  return (
    <group>
      {/* Floor */}
      <mesh 
        position={[floor.width / 2, -floor.thickness / 2, floor.depth / 2]}
        receiveShadow
      >
        <boxGeometry args={[floor.width, floor.thickness, floor.depth]} />
        <primitive object={floorMaterial} attach="material" />
      </mesh>

      {/* Ceiling */}
      {showCeiling && (
        <mesh position={[ceiling.width / 2, result.bounds.max[1] + ceiling.thickness / 2, ceiling.depth / 2]}>
          <boxGeometry args={[ceiling.width, ceiling.thickness, ceiling.depth]} />
          <primitive object={MATERIALS.ceiling} attach="material" />
          
          {/* Simple Spots on ceiling */}
          <group position={[0, -ceiling.thickness / 2 - 0.01, 0]}>
            <mesh position={[-floor.width / 4, 0, -floor.depth / 4]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.08, 32]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
            </mesh>
            <mesh position={[floor.width / 4, 0, -floor.depth / 4]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.08, 32]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
            </mesh>
            <mesh position={[-floor.width / 4, 0, floor.depth / 4]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.08, 32]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
            </mesh>
            <mesh position={[floor.width / 4, 0, floor.depth / 4]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.08, 32]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
            </mesh>
          </group>
        </mesh>
      )}

      {/* Walls */}
      {walls.map((wall) => (
        <React.Fragment key={wall.id}>
          <WallMesh wall={wall} mode={mode} />
          {/* Architectural elements */}
          {wall.openings.map((op, idx) => {
            const isDoor = op.y === 0;
            return isDoor ? (
              <DoorMesh key={`door-${idx}`} wall={wall} opening={op} />
            ) : (
              <WindowMesh key={`win-${idx}`} wall={wall} opening={op} />
            );
          })}
        </React.Fragment>
      ))}

      {/* Baseboards */}
      {showBaseboard && baseboards.map((bb, idx) => {
        const wall = walls.find(w => w.id === bb.wallId);
        if (!wall) return null;

        const p1 = new THREE.Vector3(...bb.points[0]);
        const p2 = new THREE.Vector3(...bb.points[1]);
        const length = p1.distanceTo(p2);
        const center = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        
        center.z += wall.thickness / 2 + baseboardThickness / 2000;
        center.y += baseboardHeight / 2000;

        return (
          <group key={idx} position={wall.position} rotation={wall.rotation}>
            <mesh position={center} receiveShadow castShadow>
              <boxGeometry args={[length, baseboardHeight / 1000, baseboardThickness / 1000]} />
              <primitive object={MATERIALS.mdf_white} attach="material" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};