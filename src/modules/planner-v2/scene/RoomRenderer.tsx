import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RoomResult, WallGeometry } from '../room/types';
import { Text } from '@react-three/drei';

interface RoomRendererProps {
  result: RoomResult;
  showCeiling?: boolean;
  showBaseboard?: boolean;
  debug?: boolean;
}

const WallMesh: React.FC<{ wall: WallGeometry; debug: boolean }> = ({ wall, debug }) => {
  const mesh = useMemo(() => {
    const shape = new THREE.Shape();
    // Inicia o contorno da parede (sentido anti-horário)
    shape.moveTo(-wall.width / 2, -wall.height / 2);
    shape.lineTo(wall.width / 2, -wall.height / 2);
    shape.lineTo(wall.width / 2, wall.height / 2);
    shape.lineTo(-wall.width / 2, wall.height / 2);
    shape.lineTo(-wall.width / 2, -wall.height / 2);

    // Adiciona os furos (recortes)
    wall.openings.forEach((op) => {
      const hole = new THREE.Path();
      // O offset é em relação ao canto inferior esquerdo da parede útil
      const x = op.x - wall.width / 2;
      const y = op.y - wall.height / 2;
      hole.moveTo(x, y);
      hole.lineTo(x + op.width, y);
      hole.lineTo(x + op.width, y + op.height);
      hole.lineTo(x, y + op.height);
      hole.lineTo(x, y);
      shape.holes.push(hole);
    });

    const extrudeSettings = {
      steps: 1,
      depth: wall.thickness,
      bevelEnabled: false,
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [wall]);

  return (
    <group position={wall.position} rotation={wall.rotation}>
      <mesh geometry={mesh}>
        <meshStandardMaterial color="#888888" side={THREE.DoubleSide} />
      </mesh>
      {debug && (
        <Text
          position={[0, wall.height / 2 + 0.2, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {wall.id.toUpperCase()}
        </Text>
      )}
    </group>
  );
};

export const RoomRenderer: React.FC<RoomRendererProps> = ({ 
  result, 
  showCeiling = true,
  showBaseboard = true,
  debug = false 
}) => {
  const { floor, ceiling, walls } = result;

  return (
    <group>
      {/* Floor - Upper surface at Y=0 */}
      <mesh position={[floor.width / 2, -floor.thickness / 2, floor.depth / 2]}>
        <boxGeometry args={[floor.width, floor.thickness, floor.depth]} />
        <meshStandardMaterial color="#444444" />
      </mesh>

      {/* Ceiling */}
      {showCeiling && (
        <mesh position={[ceiling.width / 2, result.bounds.max[1] + ceiling.thickness / 2, ceiling.depth / 2]}>
          <boxGeometry args={[ceiling.width, ceiling.thickness, ceiling.depth]} />
          <meshStandardMaterial color="#eeeeee" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Walls */}
      {walls.map((wall) => (
        <WallMesh key={wall.id} wall={wall} debug={debug} />
      ))}

      {/* Debug Helpers */}
      {debug && (
        <>
          <axesHelper args={[2]} />
          <gridHelper args={[10, 10, 0xffffff, 0x444444]} position={[floor.width/2, 0, floor.depth/2]} />
        </>
      )}
    </group>
  );
};
