import React, { useMemo } from 'react';
import * as THREE from 'three';
import { usePlannerStore } from '../pkg/state/usePlannerStore';
import { resolveMaterial } from '../library/services/resolveMaterial';

const mmToM = (mm: number) => mm / 1000;

interface PartProps {
  part: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
  isOpen: boolean;
  openAmount: number;
  isXRay: boolean;
}


const PartMesh: React.FC<PartProps> = ({ part, isSelected, onSelect, isOpen, openAmount, isXRay }) => {
  const material = useMemo(() => resolveMaterial(part.materialId), [part.materialId]);
  
  // Calcula animação
  let finalPosition = new THREE.Vector3(
    mmToM(part.positionMm.x),
    mmToM(part.positionMm.y),
    mmToM(part.positionMm.z)
  );
  
  let finalRotation = new THREE.Euler(
    THREE.MathUtils.degToRad(part.rotationDeg.x),
    THREE.MathUtils.degToRad(part.rotationDeg.y),
    THREE.MathUtils.degToRad(part.rotationDeg.z)
  );

  if (part.interactive && isOpen) {
    if (part.interactive.type === 'drawer') {
      const travel = mmToM(part.interactive.maxTravelMm || 450) * openAmount;
      finalPosition.z += travel;
    } else if (part.interactive.type === 'door') {
      // Simplificado: rotação no eixo Y na borda
      const angle = THREE.MathUtils.degToRad(part.interactive.maxOpenAngleDeg || 90) * openAmount;
      const hingeSide = part.interactive.hingeSide === 'right' ? 1 : -1;
      
      // Pivot offset calculation (approximate)
      const offset = mmToM(part.dimensionsMm.width / 2) * hingeSide;
      finalPosition.x -= offset;
      finalRotation.y += angle * -hingeSide;
      
      // Re-apply offset after rotation
      const rotatedOffset = new THREE.Vector3(offset, 0, 0).applyEuler(new THREE.Euler(0, angle * -hingeSide, 0));
      finalPosition.x += rotatedOffset.x;
      finalPosition.z += rotatedOffset.z;
    }
  }

  return (
    <mesh
      position={finalPosition}
      rotation={finalRotation}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(part.moduleId);
        // Se clicar especificamente numa porta ou gaveta já selecionada, alterna a animação dela
        // Note: usePlannerStore should be accessible or passed down for toggling part anim
      }}
      castShadow
      receiveShadow
    >

      <boxGeometry args={[mmToM(part.dimensionsMm.width), mmToM(part.dimensionsMm.height), mmToM(part.dimensionsMm.depth)]} />
      <meshStandardMaterial 
        color={material.baseColor} 
        roughness={material.roughness} 
        metalness={material.metalness}
        transparent={material.transparent || isXRay}
        opacity={isXRay ? 0.4 : (material.opacity ?? 1)}
        emissive={isSelected ? '#2563EB' : '#000000'}
        emissiveIntensity={isSelected ? 0.2 : 0}
        depthTest={!isXRay}
      />

    </mesh>
  );
};

export const LibraryPartsRenderer: React.FC = () => {
  const instances = usePlannerStore((s) => s.instances);
  const selectedId = usePlannerStore((s) => s.selectedId);
  const selectInstance = usePlannerStore((s) => s.selectFurnitureInstance);

  return (
    <group name="library-instances">
      {instances.map((instance) => (
        <group 
          key={instance.id} 
          position={[mmToM(instance.positionMm.x), mmToM(instance.positionMm.y), mmToM(instance.positionMm.z)]}
          rotation={[
            THREE.MathUtils.degToRad(instance.rotationDeg.x),
            THREE.MathUtils.degToRad(instance.rotationDeg.y),
            THREE.MathUtils.degToRad(instance.rotationDeg.z)
          ]}
          visible={instance.visible !== false}
        >
          {instance.parts.map((part) => (
            <PartMesh 
              key={part.id} 
              part={part} 
              isSelected={!!instance.selected}
              onSelect={onSelect}
              isOpen={instance.openStates?.[part.id] !== undefined ? instance.openStates[part.id] > 0 : !!instance.isOpen}
              openAmount={instance.openStates?.[part.id] !== undefined ? instance.openStates[part.id] : (instance.openAmount || 0)}
              isXRay={!!instance.isXRay}
            />

          ))}

        </group>
      ))}
    </group>

  );
};
