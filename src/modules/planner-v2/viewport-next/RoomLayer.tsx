import React from 'react';
import { RoomResult } from '../../room/types';
import { DiorisMaterials } from './materials';

interface RoomLayerProps {
  room: RoomResult;
  showCeiling: boolean;
}

export const RoomLayer: React.FC<RoomLayerProps> = ({ room, showCeiling }) => {
  const { floor, ceiling, walls } = room;

  return (
    <group name="room-layer">
      {/* Floor */}
      <mesh 
        position={[floor.width / 2, -floor.thickness / 2, floor.depth / 2]} 
        receiveShadow
        material={DiorisMaterials.room.floor}
      >
        <boxGeometry args={[floor.width, floor.thickness, floor.depth]} />
      </mesh>

      {/* Walls */}
      {walls.map((wall) => (
        <group key={wall.id} position={wall.position} rotation={wall.rotation}>
          <mesh castShadow receiveShadow material={DiorisMaterials.room.wall}>
            <boxGeometry args={[wall.width, wall.height, wall.thickness]} />
          </mesh>
        </group>
      ))}

      {/* Ceiling */}
      {showCeiling && (
        <mesh 
          position={[ceiling.width / 2, room.bounds.max[1] + ceiling.thickness / 2, ceiling.depth / 2]}
          material={DiorisMaterials.room.ceiling}
        >
          <boxGeometry args={[ceiling.width, ceiling.thickness, ceiling.depth]} />
        </mesh>
      )}
    </group>
  );
};
