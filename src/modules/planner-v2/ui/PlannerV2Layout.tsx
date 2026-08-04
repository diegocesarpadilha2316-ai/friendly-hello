import React from 'react';
import { cn } from '@/lib/utils';
import { V2Viewport } from '../viewport/V2Viewport';
import { V2ViewportNext } from '../viewport-next';
import { usePlannerV2Store } from '../core/store';
import { TopBar } from '../components/TopBar';
import { BottomBar } from '../components/BottomBar';
import { SideNav } from './panels/SideNav';
import { InspectorPanel } from './panels/InspectorPanel';

export const PlannerV2Layout: React.FC = () => {
  const useViewportNext = usePlannerV2Store((state) => state.useViewportNext);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0a0c] overflow-hidden text-foreground selection:bg-primary/30 antialiased font-sans">
      {/* Top Navigation */}
      {!isMobile && <TopBar />}

      <main className="flex-1 overflow-hidden flex relative">
        {/* Left Side: Project Management & Library */}
        {!isMobile && <SideNav />}

        {/* Center Viewport: The "Big" Working Area */}
        <div className={cn(
          "flex-1 relative bg-[#0d0d0f] shadow-inner transition-all duration-700",
          isMobile ? "z-10" : ""
        )}>
          {useViewportNext ? <V2ViewportNext /> : <V2Viewport />}
        </div>

        {/* Right Side: Professional Inspector & AI Assistant (Fixed) */}
        {!isMobile && <InspectorPanel />}
      </main>

      {/* Status Bar */}
      {!isMobile && <BottomBar />}
    </div>
  );
};
