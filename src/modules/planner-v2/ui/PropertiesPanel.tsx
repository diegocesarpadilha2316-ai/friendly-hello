import React from 'react';
import { usePlannerV2Store } from '../core/store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, Copy, Play, Square } from 'lucide-react';
import { MATERIALS } from '../furniture/defaults';

export const PropertiesPanel: React.FC = () => {
  const { 
    roomSpec, 
    setRoomSpec, 
    items, 
    selectedId, 
    updateItem, 
    removeItem, 
    duplicateItem, 
    toggleAnimation 
  } = usePlannerV2Store();
  
  const selectedItem = items.find(i => i.id === selectedId);

  if (!selectedItem) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-4 text-white/90">Dimensões do Ambiente</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-white/50">Largura (mm)</Label>
                <Input 
                  type="number" 
                  value={roomSpec.widthMm} 
                  onChange={(e) => setRoomSpec({ widthMm: Number(e.target.value) })}
                  className="bg-white/5 bg-opacity-50 border-white/10 h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-white/50">Profundidade (mm)</Label>
                <Input 
                  type="number" 
                  value={roomSpec.depthMm} 
                  onChange={(e) => setRoomSpec({ depthMm: Number(e.target.value) })}
                  className="bg-white/5 bg-opacity-50 border-white/10 h-8 text-xs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-white/50">Altura (mm)</Label>
              <Input 
                type="number" 
                value={roomSpec.heightMm} 
                onChange={(e) => setRoomSpec({ heightMm: Number(e.target.value) })}
                className="bg-white/5 bg-opacity-50 border-white/10 h-8 text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleUpdateParam = (key: string, value: any) => {
    updateItem(selectedItem.id, {
      parameters: { ...selectedItem.parameters, [key]: value }
    });
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/90">Propriedades do Móvel</h3>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-white/50 hover:text-white"
            onClick={() => duplicateItem(selectedItem.id)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-red-400/50 hover:text-red-400"
            onClick={() => removeItem(selectedItem.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs text-white/50">Variante</Label>
          <Select 
            value={selectedItem.variant} 
            onValueChange={(v) => {
              // Quick variant swap logic
              const updates: any = { variant: v };
              if (v === 'one-door') { updates.parameters = { ...selectedItem.parameters, doorCount: 1, drawerCount: 0 }; }
              else if (v === 'two-doors') { updates.parameters = { ...selectedItem.parameters, doorCount: 2, drawerCount: 0 }; }
              else if (v === 'three-drawers') { updates.parameters = { ...selectedItem.parameters, doorCount: 0, drawerCount: 3 }; }
              updateItem(selectedItem.id, updates);
            }}
          >
            <SelectTrigger className="bg-white/5 border-white/10 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 text-xs">
              <SelectItem value="one-door">Uma Porta</SelectItem>
              <SelectItem value="two-doors">Duas Portas</SelectItem>
              <SelectItem value="three-drawers">Três Gavetas</SelectItem>
              <SelectItem value="two-big-drawers">Duas Gavetões</SelectItem>
              <SelectItem value="door-drawer">Porta + Gaveta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-white/50">Largura (mm)</Label>
            <Input 
              type="number" 
              value={selectedItem.widthMm} 
              onChange={(e) => updateItem(selectedItem.id, { widthMm: Number(e.target.value) })}
              className="bg-white/5 border-white/10 h-8 text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-white/50">Profundidade (mm)</Label>
            <Input 
              type="number" 
              value={selectedItem.depthMm} 
              onChange={(e) => updateItem(selectedItem.id, { depthMm: Number(e.target.value) })}
              className="bg-white/5 border-white/10 h-8 text-xs"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-white/50">Posição X (mm)</Label>
          <Input 
            type="number" 
            value={selectedItem.position.x} 
            onChange={(e) => updateItem(selectedItem.id, { position: { ...selectedItem.position, x: Number(e.target.value) } })}
            className="bg-white/5 border-white/10 h-8 text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-white/50">Material do Corpo</Label>
          <Select 
            value={selectedItem.parameters.bodyMaterialId} 
            onValueChange={(v) => handleUpdateParam('bodyMaterialId', v)}
          >
            <SelectTrigger className="bg-white/5 border-white/10 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 text-xs">
              {MATERIALS.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="pt-4 border-t border-white/5">
          <Label className="text-xs text-white/50 block mb-4">Interação</Label>
          <Button 
            variant="secondary" 
            className="w-full h-9 text-xs gap-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-600/30"
            onClick={toggleAnimation}
          >
            {selectedItem.isOpen ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
            {selectedItem.isOpen ? 'Fechar Aberturas' : 'Abrir Aberturas'}
          </Button>
        </div>
      </div>
    </div>
  );
};
