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
    <header className="h-[60px] bg-[#0D0F15] border-b border-[#2A2D3A] flex items-center px-[14px] justify-between shrink-0 select-none z-50">
      <div className="flex items-center gap-6">
        {/* Brand */}
        <div className="flex items-center gap-[10px] min-w-[200px]">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-[#7C3AED] to-[#22d3ee] flex items-center justify-center font-extrabold text-white text-lg shadow-[0_4px_12px_rgba(124,58,237,0.3)] border border-white/10">
            D
          </div>
          <div className="flex flex-col">
            <strong className="text-[15px] font-bold text-[#F8FAFC] tracking-[0.04em] leading-tight">DIORIS</strong>
            <span className="text-[8px] font-bold text-[#6366F1] tracking-[0.3em] uppercase -mt-0.5 opacity-80">PLANNER V2</span>
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
          <button className="flex items-center gap-2 h-[38px] px-3 border border-[#2A2D3A] rounded-lg text-[12px] font-bold uppercase tracking-wider text-[#F8FAFC] hover:bg-white/5 transition-all">
            <Camera className="w-4 h-4" />
            Render
          </button>
          <button className="flex items-center gap-2 h-[38px] px-3 border border-[#2A2D3A] rounded-lg text-[12px] font-bold uppercase tracking-wider text-[#F8FAFC] hover:bg-white/5 transition-all">
            <Receipt className="w-4 h-4" />
            Orçamento
          </button>
          <button className="flex items-center gap-2 h-[38px] px-[14px] bg-gradient-to-br from-[#7C3AED] to-[#6366F1] rounded-lg text-[12px] font-bold uppercase tracking-wider text-white shadow-lg shadow-[#6366F1]/20 hover:scale-[1.02] transition-all">
            <Save className="w-4 h-4" />
            Salvar
          </button>
          <button className="w-9 h-9 border border-[#2A2D3A] rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5 transition-all ml-1">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
