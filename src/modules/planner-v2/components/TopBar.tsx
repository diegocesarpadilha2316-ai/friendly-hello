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
        <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/5">
           <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-white/5 text-[#94A3B8] hover:text-[#F8FAFC] transition-all" title="Novo">
             <Box className="w-4 h-4" />
           </button>
           <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-white/5 text-[#94A3B8] hover:text-[#F8FAFC] transition-all" title="Desfazer">
             <RotateCcw className="w-4 h-4" />
           </button>
           <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-white/5 text-[#94A3B8] hover:text-[#F8FAFC] transition-all" title="Refazer">
             <RotateCw className="w-4 h-4" />
           </button>
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
            <button 
              key={item.label} 
              className={cn(
                "h-[38px] px-3 flex items-center gap-2 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all border border-transparent",
                item.active 
                  ? "bg-[#171A24] border-[#2A2D3A] text-[#F8FAFC]" 
                  : "text-[#94A3B8] hover:bg-white/5 hover:text-[#F8FAFC]"
              )}
            >
              <item.icon className={cn("w-4 h-4", item.active ? "text-[#6366F1]" : "text-[#94A3B8]")} />
              <span className="hidden lg:inline">{item.label}</span>
            </button>
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
