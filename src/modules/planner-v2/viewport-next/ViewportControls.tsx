import React from 'react';
import { usePlannerV2Store } from '../core/store';
import { Monitor, Camera, Layers, Box, Zap, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ViewportControls: React.FC = () => {
  const { useViewportNext, setUseViewportNext, viewMode, setViewMode } = usePlannerV2Store();

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background/80 backdrop-blur-md p-1 rounded-full border border-border/50 shadow-2xl z-50">
      <button
        onClick={() => setUseViewportNext(false)}
        className={cn(
          "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-2",
          !useViewportNext ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground"
        )}
      >
        <Zap className="w-3 h-3" />
        LEGACY
      </button>
      
      <div className="w-px h-4 bg-border mx-1" />

      <button
        onClick={() => setUseViewportNext(true)}
        className={cn(
          "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-2",
          useViewportNext ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground"
        )}
      >
        <Monitor className="w-3 h-3" />
        NEXT
      </button>

      <div className="w-px h-4 bg-border mx-1" />

      <button
        onClick={() => setViewMode(viewMode === 'technical' ? 'presentation' : 'technical')}
        className={cn(
          "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-2",
          viewMode === 'presentation' ? "text-accent" : "text-muted-foreground hover:bg-accent"
        )}
      >
        {viewMode === 'presentation' ? <Camera className="w-3 h-3" /> : <Settings2 className="w-3 h-3" />}
        {viewMode.toUpperCase()}
      </button>
    </div>
  );
};
