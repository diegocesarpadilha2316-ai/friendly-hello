import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Orbit, 
  Move, 
  ZoomIn, 
  MousePointer2, 
  Ruler, 
  Scissors, 
  Camera, 
  LayoutGrid, 
  Box, 
  ClipboardList, 
  Receipt, 
  RotateCcw,
  RotateCw,
  Save,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlannerV2Store } from '../core/store';

export const TopBar: React.FC = () => {
  const { viewMode, setViewMode } = usePlannerV2Store();

  return (
    <header className="h-10 bg-[#0D0D12] border-b border-white/5 flex items-center px-4 justify-between shrink-0 select-none z-50">
      <div className="flex items-center gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col leading-none">
            <span className="font-black text-white tracking-tighter text-xs uppercase">DIORIS</span>
            <span className="text-[8px] text-primary/80 font-bold uppercase tracking-widest">PLANNER V2</span>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-md border border-white/5">
           <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/10" title="Novo">
             <Box className="w-3.5 h-3.5" />
           </Button>
           <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/10" title="Desfazer">
             <RotateCcw className="w-3.5 h-3.5" />
           </Button>
           <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/10" title="Refazer">
             <RotateCw className="w-3.5 h-3.5" />
           </Button>
        </div>

        {/* Viewport Tools */}
        <div className="flex items-center gap-1">
          {[
            { icon: Orbit, label: 'Orbit', active: true },
            { icon: Move, label: 'Pan' },
            { icon: ZoomIn, label: 'Zoom' },
            { icon: Ruler, label: 'Medir' },
            { icon: MousePointer2, label: 'Selecionar' },
          ].map((item) => (
            <Button 
              key={item.label} 
              variant={item.active ? "secondary" : "ghost"} 
              size="sm" 
              className={cn(
                "h-7 px-3 gap-2 text-[9px] uppercase font-bold tracking-widest",
                item.active && "bg-primary/20 text-primary border border-primary/30"
              )}
            >
              <item.icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Render Modes */}
        <div className="flex items-center gap-1 mr-4">
           <Button 
             variant="ghost" 
             size="sm" 
             onClick={() => setViewMode('technical')}
              className={cn("h-7 text-[9px] uppercase font-bold px-3 tracking-widest", viewMode === 'technical' && "text-primary bg-primary/5")}
            >
              Técnico
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setViewMode('presentation')}
              className={cn("h-7 text-[9px] uppercase font-bold px-3 tracking-widest", viewMode === 'presentation' && "text-primary bg-primary/5")}
            >
              Apresentação
            </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 gap-2 text-[9px] uppercase font-bold border-white/5 bg-white/[0.03] tracking-widest">
            <Camera className="w-3 h-3" />
            Render
          </Button>
          <Button variant="outline" size="sm" className="h-7 gap-2 text-[9px] uppercase font-bold border-white/5 bg-white/[0.03] tracking-widest">
            <Receipt className="w-3 h-3" />
            Orçamento
          </Button>
          <Button variant="default" size="sm" className="h-7 gap-2 text-[9px] uppercase font-bold bg-primary hover:bg-primary/90 tracking-widest">
            <Save className="w-3 h-3" />
            Salvar
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full border border-white/5 ml-1">
            <Share2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
