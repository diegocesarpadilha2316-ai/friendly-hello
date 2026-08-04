import React from 'react';
import { usePlannerV2Store } from '../core/store';

export const BottomBar: React.FC = () => {
  const { roomSpec, viewMode } = usePlannerV2Store();
  
  return (
    <footer className="h-8 bg-card border-t flex items-center justify-between px-4 text-[10px] text-muted-foreground shrink-0 select-none uppercase tracking-widest">
      <div className="flex items-center gap-6">
        <span className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Engine: Stable
        </span>
        <span>FPS: 60</span>
        <span>Snap: 10mm</span>
        <span>Grid: 100mm</span>
      </div>
      <div className="flex items-center gap-6">
        <span>Modo: {viewMode === 'technical' ? 'Técnico' : 'Apresentação'}</span>
        <span>Escala: 1:1</span>
        <span>{roomSpec.widthMm} x {roomSpec.depthMm} x {roomSpec.heightMm} MM</span>
      </div>
    </footer>
  );
};
