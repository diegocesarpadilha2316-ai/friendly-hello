import React, { useMemo } from 'react';
import { FurnitureItem } from '../furniture/types';
import { AssemblyMesh } from '../../planner/shared/editor-3d/AssemblyMesh';
import { 
  wardrobeFamily, 
  kitchenFamily, 
  bathroomFamily, 
  laundryFamily,
  dresserFamily 
} from '../../planner/shared/families';

interface LegacyAssemblyRendererProps {
  item: FurnitureItem;
  onSelect: (id: string) => void;
}

/**
 * BRIDGE COMPONENT
 * Conecta o FurnitureItem do V2 aos motores paramétricos aprovados do V1.
 */
export const LegacyAssemblyRenderer: React.FC<LegacyAssemblyRendererProps> = ({ item, onSelect }) => {
  const { family, widthMm, heightMm, depthMm, parameters, isOpen, position, rotation, id, selected } = item;

  const assemblyResult = useMemo(() => {
    const commonSpec = {
      widthMm,
      heightMm,
      depthMm,
      thicknessMm: parameters.thicknessMm,
      backThicknessMm: parameters.backThicknessMm,
      plinthHeightMm: parameters.kickplateHeightMm,
    };

    try {
      switch (family) {
        case 'wardrobe':
          return wardrobeFamily.build({
            ...commonSpec,
            opening: 'abrir',
            doors: Math.max(1, Math.round(widthMm / 500)),
            finishId: 'branco-tx',
          });
        case 'kitchen':
          return kitchenFamily.build({
            ...commonSpec,
            kind: parameters.kind || 'balcao',
            finishId: 'branco-tx',
          } as any);
        case 'kitchen-tower':
          return wardrobeFamily.build({
            ...commonSpec,
            opening: 'abrir',
            doors: 1,
            finishId: 'grafite-tx',
          });
        case 'kitchen-wall-cabinet':
          return kitchenFamily.build({
            ...commonSpec,
            kind: 'aereo',
            finishId: 'branco-tx',
          } as any);
        case 'kitchen-counter':
          return {
            assembly: {
              id: 'counter-' + id,
              pieces: [{
                id: 'counter-stone',
                box: { x: 0, y: 0, z: 0, width: widthMm, height: heightMm, depth: depthMm },
                partKind: 'tampo',
                substrate: 'pedra'
              }],
              motions: [],
            }
          };
        case 'kitchen-stool':
          return {
            assembly: {
              id: 'stool-' + id,
              pieces: [
                { id: 'seat', box: { x: 0, y: heightMm - 40, z: 0, width: widthMm, height: 40, depth: depthMm }, partKind: 'tampo', substrate: 'madeira' },
                { id: 'leg-1', box: { x: 0, y: 0, z: 0, width: 40, height: heightMm - 40, depth: 40 }, partKind: 'travessa', substrate: 'metal' },
                { id: 'leg-2', box: { x: widthMm - 40, y: 0, z: 0, width: 40, height: heightMm - 40, depth: 40 }, partKind: 'travessa', substrate: 'metal' },
                { id: 'leg-3', box: { x: 0, y: 0, z: depthMm - 40, width: 40, height: heightMm - 40, depth: 40 }, partKind: 'travessa', substrate: 'metal' },
                { id: 'leg-4', box: { x: widthMm - 40, y: 0, z: depthMm - 40, width: 40, height: heightMm - 40, depth: 40 }, partKind: 'travessa', substrate: 'metal' },
              ],
              motions: [],
            }
          };
        case 'bathroom':
          return bathroomFamily.build({
            ...commonSpec,
            finishId: 'branco-tx',
          });
        case 'laundry':
          return laundryFamily.build({
            ...commonSpec,
            finishId: 'branco-tx',
          });
        case 'dresser':
          return dresserFamily.build({
            ...commonSpec,
            finishId: 'branco-tx',
          });
        default:
          return null;
      }
    } catch (err) {
      console.error(`Error building legacy family ${family}:`, err);
      return null;
    }
  }, [family, widthMm, heightMm, depthMm, parameters, id]);

  if (!assemblyResult || !assemblyResult.assembly) return null;

  return (
    <group 
      position={[position.x / 1000, position.y / 1000, position.z / 1000]}
      rotation={[0, rotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
    >
      <AssemblyMesh 
        assembly={assemblyResult.assembly}
        sizeMm={{ widthMm, heightMm, depthMm }}
        selected={selected}
        openDoors={isOpen}
        openDrawers={isOpen}
      />
    </group>
  );
};