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
 * Extrai apenas o motor reutilizável (Family.build) e o renderizador canônico (AssemblyMesh).
 */
export const LegacyAssemblyRenderer: React.FC<LegacyAssemblyRendererProps> = ({ item, onSelect }) => {
  const { family, widthMm, heightMm, depthMm, parameters, isOpen, position, rotation, id, selected } = item;

  const assemblyResult = useMemo(() => {
    // Map V2 family to V1 engine
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
            type: 'balcao',
            finishId: 'branco-tx',
          });
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
  }, [family, widthMm, heightMm, depthMm, parameters]);

  if (!assemblyResult) return null;

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
