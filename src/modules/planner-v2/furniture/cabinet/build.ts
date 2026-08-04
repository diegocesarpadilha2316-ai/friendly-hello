import { FurnitureItem } from '../types';
import { CabinetAssembly, PartBox } from './types';

export const buildCabinet = (item: FurnitureItem): CabinetAssembly => {
  const { widthMm, heightMm, depthMm, parameters } = item;
  const { 
    thicknessMm: t, 
    backThicknessMm: bt, 
    kickplateHeightMm: kh, 
    doorCount, 
    drawerCount,
    shelfCount 
  } = parameters;

  const parts: PartBox[] = [];

  // 1. Sides (Laterais) - Inside the top/bottom usually, but here we'll do sides full height and base/tops between them
  // Correction: Sides are heightMm - kh, base is between them.
  const sideHeight = heightMm - kh;
  
  // Left Side
  parts.push({
    id: `${item.id}-side-l`,
    name: 'Lateral Esquerda',
    width: t,
    height: sideHeight,
    depth: depthMm,
    position: { x: t/2, y: kh + sideHeight/2, z: 0 },
    materialType: 'body',
    type: 'panel'
  });

  // Right Side
  parts.push({
    id: `${item.id}-side-r`,
    name: 'Lateral Direita',
    width: t,
    height: sideHeight,
    depth: depthMm,
    position: { x: widthMm - t/2, y: kh + sideHeight/2, z: 0 },
    materialType: 'body',
    type: 'panel'
  });

  // 2. Base
  const baseWidth = widthMm - 2 * t;
  parts.push({
    id: `${item.id}-base`,
    name: 'Base',
    width: baseWidth,
    height: t,
    depth: depthMm,
    position: { x: widthMm/2, y: kh + t/2, z: 0 },
    materialType: 'body',
    type: 'panel'
  });

  // 3. Kickplate (Rodapé) - recessed 20mm
  parts.push({
    id: `${item.id}-kickplate`,
    name: 'Rodapé',
    width: widthMm,
    height: kh,
    depth: t,
    position: { x: widthMm/2, y: kh/2, z: depthMm/2 - 20 - t/2 },
    materialType: 'body',
    type: 'panel'
  });

  // 4. Top Rails (Travessas)
  const railDepth = 80;
  // Front Rail
  parts.push({
    id: `${item.id}-rail-f`,
    name: 'Travessa Frontal',
    width: baseWidth,
    height: t,
    depth: railDepth,
    position: { x: widthMm/2, y: heightMm - t/2, z: depthMm/2 - railDepth/2 },
    materialType: 'body',
    type: 'panel'
  });
  // Back Rail
  parts.push({
    id: `${item.id}-rail-b`,
    name: 'Travessa Traseira',
    width: baseWidth,
    height: t,
    depth: railDepth,
    position: { x: widthMm/2, y: heightMm - t/2, z: -depthMm/2 + railDepth/2 + bt },
    materialType: 'body',
    type: 'panel'
  });

  // 5. Back (Fundo) - recessed into sides/base or just applied? Let's apply inside.
  parts.push({
    id: `${item.id}-back`,
    name: 'Fundo',
    width: baseWidth,
    height: sideHeight - t,
    depth: bt,
    position: { x: widthMm/2, y: kh + sideHeight/2 + t/2, z: -depthMm/2 + bt/2 },
    materialType: 'body',
    type: 'panel'
  });

  // 6. Shelf (Prateleira)
  if (shelfCount > 0) {
    const shelfDepth = depthMm - 20; // set back a bit
    parts.push({
      id: `${item.id}-shelf`,
      name: 'Prateleira',
      width: baseWidth - 2, // 1mm clearance each side
      height: t,
      depth: shelfDepth,
      position: { x: widthMm/2, y: kh + sideHeight/2, z: -10 },
      materialType: 'body',
      type: 'panel'
    });
  }

  // 7. Doors and Drawers
  const frontDepth = depthMm/2 + t/2;
  const gap = 2; // gap between fronts

  if (doorCount > 0 && drawerCount === 0) {
    const doorWidth = (widthMm - (doorCount + 1) * gap) / doorCount;
    const doorHeight = sideHeight - gap;
    
    for (let i = 0; i < doorCount; i++) {
      const isLeft = i === 0 && doorCount > 1;
      const xPos = gap + doorWidth/2 + i * (doorWidth + gap);
      
      parts.push({
        id: `${item.id}-door-${i}`,
        name: `Porta ${i+1}`,
        width: doorWidth,
        height: doorHeight,
        depth: t,
        position: { x: xPos, y: kh + sideHeight/2, z: frontDepth },
        materialType: 'front',
        type: 'door',
        isAnimated: true,
        animationType: 'hinge',
        animationAxis: 'y',
        animationOrigin: { 
          x: xPos - (i === 0 ? doorWidth/2 : -doorWidth/2), 
          y: kh + sideHeight/2, 
          z: frontDepth 
        }
      });
    }
  }

  if (drawerCount > 0) {
    // Basic logic for drawers
    const availableHeight = sideHeight - gap * (drawerCount + 1);
    const drHeight = availableHeight / drawerCount;
    
    for (let i = 0; i < drawerCount; i++) {
      const yPos = kh + gap + drHeight/2 + i * (drHeight + gap);
      
      parts.push({
        id: `${item.id}-drawer-${i}`,
        name: `Gaveta ${i+1}`,
        width: widthMm - 2*gap,
        height: drHeight,
        depth: t,
        position: { x: widthMm/2, y: yPos, z: frontDepth },
        materialType: 'front',
        type: 'drawer-front',
        isAnimated: true,
        animationType: 'slide',
        animationAxis: 'z'
      });
    }
  }

  return { parts };
};
