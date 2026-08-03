import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RoomResult, WallGeometry } from '../room/types';

interface WallMeshProps {
  wall: WallGeometry;
  mode: 'technical' | 'presentation';
  showBaseboard: boolean;
}

const WallMesh: React.FC<WallMeshProps> = ({ wall, mode, showBaseboard }) => {
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

  return (
    <group position={wall.position} rotation={wall.rotation}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial 
          color={mode === 'technical' ? '#f0f0f0' : '#ffffff'} 
          roughness={0.9}
        />
      </mesh>
    </group>
  );
};

interface RoomRendererProps {
  result: RoomResult;
  mode: 'technical' | 'presentation';
  showCeiling?: boolean;
  showBaseboard?: boolean;
}

export const RoomRenderer: React.FC<RoomRendererProps> = ({ 
  result, 
  mode,
  showCeiling = true,
  showBaseboard = true 
}) => {
  const { floor, ceiling, walls } = result;

  return (
    <group>
      {/* Floor */}
      <mesh 
        position={[floor.width / 2, -floor.thickness / 2, floor.depth / 2]}
        receiveShadow
      >
        <boxGeometry args={[floor.width, floor.thickness, floor.depth]} />
        <meshStandardMaterial color="#d1c7bc" roughness={0.7} />
      </mesh>

      {/* Ceiling */}
      {showCeiling && (
        <mesh position={[ceiling.width / 2, result.bounds.max[1] + ceiling.thickness / 2, ceiling.depth / 2]}>
          <boxGeometry args={[ceiling.width, ceiling.thickness, ceiling.depth]} />
          <meshStandardMaterial color="#ffffff" roughness={1} />
        </mesh>
      )}

      {/* Walls */}
      {walls.map((wall) => (
        <WallMesh key={wall.id} wall={wall} mode={mode} showBaseboard={showBaseboard} />
      ))}
    </group>
  );
};
