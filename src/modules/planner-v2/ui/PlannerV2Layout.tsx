import React, { useMemo } from 'react';
import { usePlannerV2Store } from '../core/store';
import { V2Viewport } from '../viewport/V2Viewport';
import { PlannerV2Shell } from './PlannerV2Shell';
import type { ProjectTreeItem, FurnitureSelection, ChatMessage } from './planner-ui';

export const PlannerV2Layout: React.FC = () => {
  const store = usePlannerV2Store();
  
  const treeData = useMemo((): ProjectTreeItem[] => {
    return [
      {
        id: 'room-root',
        name: store.roomSpec.name || 'Projeto Atual',
        kind: 'room',
        visible: true,
        children: [
          { id: 'walls', name: 'Paredes', kind: 'wall', visible: true },
          { id: 'floor', name: 'Piso', kind: 'floor', visible: true },
          { id: 'ceiling', name: 'Teto', kind: 'ceiling', visible: true },
          {
            id: 'furniture-group',
            name: 'Mobiliário',
            kind: 'group',
            visible: true,
            children: store.items.map(item => ({
              id: item.id,
              name: `${item.family}`,
              kind: 'furniture',
              visible: true,
              selected: store.selectedId === item.id
            }))
          },
          { id: 'materials-group', name: 'Materiais', kind: 'material', visible: true },
          { id: 'lighting-group', name: 'Iluminação', kind: 'lighting', visible: true },
          { id: 'eng-group', name: 'Engenharia', kind: 'hardware', visible: true }
        ]
      }
    ];
  }, [store.items, store.selectedId, store.roomSpec.name]);

  const selectedFurniture = useMemo((): FurnitureSelection | null => {
    const item = store.items.find(i => i.id === store.selectedId);
    if (!item) return null;
    return {
      id: item.id,
      name: item.family,
      widthMm: item.widthMm,
      heightMm: item.heightMm,
      depthMm: item.depthMm,
      positionX: item.position.x,
      positionZ: item.position.z,
      rotationDeg: item.rotation || 0
    };
  }, [store.items, store.selectedId]);

  // Messages placeholder until V2 AI is connected
  const messages: ChatMessage[] = [
    { id: '1', role: 'assistant', content: 'Olá! Sou o assistente Dioris. Posso te ajudar com o design do seu móvel.', timestamp: new Date().toLocaleTimeString() }
  ];

  return (
    <PlannerV2Shell
      projectName={store.roomSpec.name}
      clientName="Dioris User"
      tree={treeData}
      selectedFurniture={selectedFurniture}
      messages={messages}
      fps={60}
      autosaveStatus="saved"
      
      onSelectTreeItem={(id: string) => store.selectItem(id)}
      onToggleTreeVisibility={(id: string) => {
        // Implementation for visibility toggle in store if needed
        console.log('Toggle visibility', id);
      }}
      onDeleteSelected={() => store.selectedId && store.removeItem(store.selectedId)}
      onDuplicateSelected={() => store.selectedId && store.duplicateItem(store.selectedId)}
      onUpdateSelected={(patch: Partial<FurnitureSelection>) => {
        if (!store.selectedId) return;
        const itemPatch: any = {};
        if (patch.widthMm !== undefined) itemPatch.widthMm = patch.widthMm;
        if (patch.heightMm !== undefined) itemPatch.heightMm = patch.heightMm;
        if (patch.depthMm !== undefined) itemPatch.depthMm = patch.depthMm;
        if (patch.positionX !== undefined || patch.positionZ !== undefined) {
           const current = store.items.find(i => i.id === store.selectedId)?.position || { x: 0, y: 0, z: 0 };
           itemPatch.position = { 
             ...current, 
             x: patch.positionX ?? current.x, 
             z: patch.positionZ ?? current.z 
           };
        }
        if (patch.rotationDeg !== undefined) itemPatch.rotation = patch.rotationDeg;
        
        store.updateItem(store.selectedId, itemPatch);
      }}
      onUndo={() => console.log('Undo')}
      onRedo={() => console.log('Redo')}
      onSave={() => console.log('Save')}
      onRender={() => store.setViewMode('presentation')}
      onOpenFloorPlan={() => store.setViewMode('technical')}
      onOpenCutList={() => console.log('Cut list')}
      onOpenBudget={() => console.log('Budget')}
    >
      <V2Viewport />
    </PlannerV2Shell>
  );
};
