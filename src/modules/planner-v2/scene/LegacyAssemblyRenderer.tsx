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
      let result: any = null;
      switch (family) {
        case 'wardrobe':
          result = wardrobeFamily.build({
            ...commonSpec,
            opening: 'abrir',
            doors: Math.max(1, Math.round(widthMm / 500)),
            finishId: 'branco-tx',
          });
          break;
        case 'kitchen':
          result = kitchenFamily.build({
            ...commonSpec,
            kind: (parameters as any).kind || 'balcao',
            finishId: 'branco-tx',
          } as any);
          break;
        case 'kitchen-tower':
          result = wardrobeFamily.build({
            ...commonSpec,
            opening: 'abrir',
            doors: 1,
            finishId: 'grafite-tx',
          });
          break;
        case 'kitchen-wall-cabinet':
          result = kitchenFamily.build({
            ...commonSpec,
            kind: 'aereo',
            finishId: 'branco-tx',
          } as any);
          break;
        case 'kitchen-counter':
          result = {
            assembly: {
              id: 'counter-' + id,
              label: 'Bancada',
              envelope: { x: 0, y: 0, z: 0, width: widthMm, height: heightMm, depth: depthMm },
              pieces: [{
                id: 'counter-stone',
                label: 'Pedra',
                box: { x: 0, y: 0, z: 0, width: widthMm, height: heightMm, depth: depthMm },
                partKind: 'tampo',
                substrate: 'pedra',
                thicknessMm: heightMm,
                grain: 'none'
              }],
              motions: [],
              hardware: [],
              warnings: [],
              totals: { slotCount: 1, pieceCount: 1, boardAreaM2: 0, hardwareCount: 0 }
            }
          };
          break;
        case 'kitchen-stool':
          result = {
            assembly: {
              id: 'stool-' + id,
              label: 'Banqueta',
              envelope: { x: 0, y: 0, z: 0, width: widthMm, height: heightMm, depth: depthMm },
              pieces: [
                { id: 'seat', label: 'Assento', box: { x: 0, y: heightMm - 40, z: 0, width: widthMm, height: 40, depth: depthMm }, partKind: 'tampo', substrate: 'madeira', thicknessMm: 40, grain: 'horizontal' },
                { id: 'leg-1', label: 'Pé 1', box: { x: 0, y: 0, z: 0, width: 40, height: heightMm - 40, depth: 40 }, partKind: 'travessa', substrate: 'metal', thicknessMm: 40, grain: 'vertical' },
                { id: 'leg-2', label: 'Pé 2', box: { x: widthMm - 40, y: 0, z: 0, width: 40, height: heightMm - 40, depth: 40 }, partKind: 'travessa', substrate: 'metal', thicknessMm: 40, grain: 'vertical' },
                { id: 'leg-3', label: 'Pé 3', box: { x: 0, y: 0, z: depthMm - 40, width: 40, height: heightMm - 40, depth: 40 }, partKind: 'travessa', substrate: 'metal', thicknessMm: 40, grain: 'vertical' },
                { id: 'leg-4', label: 'Pé 4', box: { x: widthMm - 40, y: 0, z: depthMm - 40, width: 40, height: heightMm - 40, depth: 40 }, partKind: 'travessa', substrate: 'metal', thicknessMm: 40, grain: 'vertical' },
              ],
              motions: [],
              hardware: [],
              warnings: [],
              totals: { slotCount: 1, pieceCount: 5, boardAreaM2: 0, hardwareCount: 0 }
            }
          };
          break;
        case 'bathroom':
          result = bathroomFamily.build({
            ...commonSpec,
            finishId: 'branco-tx',
          });
          break;
        case 'laundry':
          result = laundryFamily.build({
            ...commonSpec,
            finishId: 'branco-tx',
          });
          break;
        case 'dresser':
          result = dresserFamily.build({
            ...commonSpec,
            finishId: 'branco-tx',
          });
          break;
      }
      return result;
    } catch (err) {
      console.error(`Error building legacy family ${family}:`, err);
      return null;
    }
  }, [family, widthMm, heightMm, depthMm, parameters, id]);

  if (!assemblyResult || !assemblyResult.assembly) return null;

  return (
    <group 
      position={[item.position.x / 1000, item.position.y / 1000, item.position.z / 1000]}
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