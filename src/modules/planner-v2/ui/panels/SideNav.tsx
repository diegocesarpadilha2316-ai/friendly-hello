import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus, Layers, Map, Library, ChevronLeft, ChevronRight, Search, 
  Package, LayoutPanelLeft, MousePointer2 
} from 'lucide-react';
import { usePlannerV2Store } from '../../core/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

export const SideNav: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'library' | 'structure' | 'rooms' | 'layers'>('library');
  const { addItem } = usePlannerV2Store();

  return (
    <div className="w-80 h-full border-r bg-card flex flex-col shrink-0 select-none">
      <div className="flex border-b">
        {[
          { id: 'library', icon: Library, label: 'Biblioteca' },
          { id: 'structure', icon: Layers, label: 'Estrutura' },
          { id: 'rooms', icon: Map, label: 'Ambientes' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 text-[10px] font-semibold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === tab.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:bg-muted/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 flex-1 overflow-hidden flex flex-col gap-4">
        {activeTab === 'library' && (
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar módulos..." className="pl-8 h-9 text-xs bg-muted/30 border-none" />
            </div>

            <ScrollArea className="flex-1 -mx-1 px-1">
              <div className="space-y-6 pb-6">
                <div>
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Cozinha V2 (Beta)</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      variant="outline" 
                      className="justify-start h-12 gap-3 bg-muted/20 border-border/50 hover:bg-muted/40"
                      onClick={() => addItem('kitchen-base-cabinet', 'one-door' as any)}
                    >
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                        <Package className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-xs font-medium">Gabinete Inferior</span>
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Móveis Paramétricos V1</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'wardrobe', label: 'Closet' },
                      { id: 'kitchen', label: 'Cozinha' },
                      { id: 'bathroom', label: 'Banheiro' },
                      { id: 'laundry', label: 'Lavanderia' },
                      { id: 'dresser', label: 'Gaveteiro' },
                    ].map((item) => (
                      <Button 
                        key={item.id}
                        variant="outline" 
                        size="sm"
                        className="flex-col h-16 text-[9px] gap-1 bg-muted/20 border-border/50 hover:bg-muted/40"
                        onClick={() => addItem(item.id as any)}
                      >
                        <Plus className="w-3 h-3 text-primary" />
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </>
        )}

        {activeTab === 'structure' && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <Layers className="w-8 h-8 opacity-20" />
            <span className="text-[10px] uppercase tracking-widest">Árvore Vazia</span>
          </div>
        )}
      </div>
    </div>
  );
};
