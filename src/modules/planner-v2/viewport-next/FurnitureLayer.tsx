import React from 'react';
import { FurnitureRenderer } from '../../scene/FurnitureRenderer';

export const FurnitureLayer: React.FC = () => {
  return (
    <group name="furniture-layer">
      {/* Reutiliza o renderizador de móveis real do V2 */}
      <FurnitureRenderer />
    </group>
  );
};
