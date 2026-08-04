import React from 'react';
import { usePlannerV2Store } from '../core/store';
import { cn } from '@/lib/utils';
import { 
  Activity, 
  Cpu, 
  Layers, 
  Maximize2, 
  MousePointer2, 
  Zap,
  Gauge
} from 'lucide-react';

export const BottomBar: React.FC = () => {
  const { roomSpec, viewMode, items } = usePlannerV2Store();
  
  return (
    <footer className="h-[42px] bg-[#0A0B10] border-t border-[#2A2D3A] flex items-center justify-between px-4 text-[11px] text-[#94A3B8] shrink-0 select-none uppercase font-bold tracking-[0.15em] z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-primary/80">
          <div className="relative">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-primary blur-[2px]" />
          </div>
          <span>Engine: Dioris V2.4</span>
        </div>
        
        <div className="h-3 w-[1px] bg-white/10" />
        
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 opacity-50" />
            FPS: 60.2
          </span>
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3 opacity-50" />
            GPU: 14%
          </span>
          <span className="flex items-center gap-1.5">
            <Layers className="w-3 h-3 opacity-50" />
            Triângulos: 14.2k
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 border-x border-white/10 px-6 h-7">
          <span className={cn(
            "transition-colors",
            viewMode === 'technical' ? "text-primary" : ""
          )}>
            Técnico
          </span>
          <div className="w-8 h-3 rounded-full bg-white/5 border border-white/10 relative">
             <div className={cn(
               "absolute top-0.5 w-2 h-2 rounded-full bg-primary transition-all duration-300",
               viewMode === 'technical' ? "left-1" : "left-5"
             )} />
          </div>
          <span className={cn(
            "transition-colors",
            viewMode === 'presentation' ? "text-primary" : ""
          )}>
            Apresentação
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-white/40">
            <Gauge className="w-3 h-3" />
            Escala: 1:1
          </span>
          <span className="text-primary/70 bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
            {roomSpec.widthMm} × {roomSpec.depthMm} × {roomSpec.heightMm} MM
          </span>
        </div>
        
        <button className="p-1 hover:text-white transition-colors">
          <Maximize2 className="w-3 h-3" />
        </button>
      </div>
    </footer>
  );
};
