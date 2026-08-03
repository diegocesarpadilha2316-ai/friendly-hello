import React from 'react';
import { RoomResult } from '../room/types';

interface RoomRendererProps {
  result: RoomResult;
  showCeiling?: boolean;
  showBaseboard?: boolean;
  debug?: boolean;
}

export const RoomRenderer: React.FC<RoomRendererProps> = ({ 
  result, 
  showCeiling = true,
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
        <group key={wall.id} position={wall.position} rotation={wall.rotation}>
          <mesh position={[0, 0, wall.thickness / 2]}>
            <boxGeometry args={[wall.width, wall.height, wall.thickness]} />
            <meshStandardMaterial color="#888888" />
          </mesh>
          
          {debug && (
            <group position={[0, wall.height / 2 + 0.2, 0]}>
              <mesh>
                <sphereGeometry args={[0.05]} />
                <meshBasicMaterial color="red" />
              </mesh>
            </group>
          )}
        </group>
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
