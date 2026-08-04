import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Orbit, Move, ZoomIn, MousePointer2, Ruler, Scissors, Camera, LayoutGrid, Box, ClipboardList, Receipt, ChevronDown
} from 'lucide-react';

export const TopBar: React.FC = () => (
  <header className="h-14 bg-card/90 backdrop-blur-md border-b flex items-center px-6 justify-between shrink-0 select-none z-10 shadow-sm">
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="font-black text-primary tracking-tighter text-lg uppercase">DIORIS</span>
        <div className="flex flex-col -gap-1">
          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Enterprise</span>
          <span className="text-[9px] text-primary/70 font-bold uppercase tracking-widest">Planner V2</span>
        </div>
      </div>
      <div className="h-4 w-[1px] bg-border mx-2" />
      <div className="flex items-center gap-1">
        {[
          { icon: Orbit, label: 'Orbit' },
          { icon: Move, label: 'Pan' },
          { icon: ZoomIn, label: 'Zoom' },
          { icon: MousePointer2, label: 'Select' },
          { icon: Ruler, label: 'Measure' },
          { icon: Scissors, label: 'Cut' },
        ].map((item) => (
          <Button key={item.label} variant="ghost" size="sm" className="h-8 w-16 flex-col gap-0.5 text-[9px]">
            <item.icon className="w-3 h-3" />
            {item.label}
          </Button>
        ))}
      </div>
    </div>
    <div className="flex items-center gap-2">
      {[
        { icon: Camera, label: 'Render' },
        { icon: LayoutGrid, label: 'Planta' },
        { icon: Box, label: '3D' },
        { icon: ClipboardList, label: 'Corte' },
        { icon: Receipt, label: 'Orçamento' },
      ].map((item) => (
        <Button key={item.label} variant="outline" size="sm" className="h-8 px-3 gap-2 text-[10px]">
          <item.icon className="w-3 h-3" />
          {item.label}
        </Button>
      ))}
    </div>
  </header>
);
